/*
    Black Hole shader (iterative ray tracing)
    - 鼠标控制 yaw/pitch
    - 迭代积分引力弯曲（近似）：rd 随半径变化而向中心偏折
    - 穿越吸积盘平面时累积发光；进入视界则吸收
*/
#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

#ifdef GL_ES
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse; // 像素坐标
uniform float u_zoom; // 缩放因子，1 为默认
#define FRAG_COLOR gl_FragColor
#else
layout(location = 0) out vec4 fragColor;
layout(std140, binding = 0) uniform UBO {
    vec2 u_resolution;
    float u_time;
    vec2 u_mouse;
    float u_zoom;
};
#define FRAG_COLOR fragColor
#endif

// Iñigo Quiles - HSB to RGB
vec3 hsb2rgb(in vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// Hash/Noise helpers for starfield
float hash21(vec2 p){
    p = fract(p*vec2(123.34, 345.45));
    p += dot(p, p+34.345);
    return fract(p.x*p.y);
}

float stars2D(vec2 uv){
    // 块状采样生成零散星点
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);
    float n = hash21(id);
    float d = length(gv + (n-0.5)*0.6);
    float m = smoothstep(0.08, 0.0, d);
    // 星等分布（稀疏 + 少量高亮）
    float sparkle = smoothstep(0.95, 1.0, n);
    return m * mix(0.3, 1.0, sparkle);
}

// 方向上生成星空（把方向映射到一个 2D hash 空间）
float starsDir(vec3 rd){
    // 将方向投影到球坐标，并放大到网格
    float phi = atan(rd.z, rd.x); // [-pi,pi]
    float the = acos(clamp(rd.y, -1.0, 1.0)); // [0,pi]
    vec2 uv = vec2(phi/TWO_PI, the/3.14159265);
    uv *= 180.0; // 密度
    return stars2D(uv);
}

// 旋转工具
mat3 rotY(float a){
    float c = cos(a), s = sin(a);
    return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
    );
}
mat3 rotX(float a){
    float c = cos(a), s = sin(a);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
    );
}

// 相交测试
bool intersectSphere(vec3 ro, vec3 rd, vec3 ce, float ra, out float t){
    vec3 oc = ro - ce;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - ra*ra;
    float h = b*b - c;
    if(h < 0.0){ t = 1e9; return false; }
    h = sqrt(h);
    float t1 = -b - h;
    float t2 = -b + h;
    t = (t1 > 0.0) ? t1 : ((t2 > 0.0) ? t2 : 1e9);
    return t < 1e8;
}

bool intersectPlaneY(vec3 ro, vec3 rd, float y, out float t){
    if(abs(rd.y) < 1e-5){ t = 1e9; return false; }
    t = (y - ro.y) / rd.y;
    return t > 0.0;
}

void main(){
    // 归一化屏幕坐标 -> 初始相机射线
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec2 p = (st * 2.0 - 1.0);
    p.x *= u_resolution.x / u_resolution.y;

    // 鼠标 -> yaw/pitch
    vec2 m = u_mouse / u_resolution; // [0,1]
    m = (m - 0.5) * 2.0;
    float yaw = m.x * 1.2;
    float pitch = clamp(m.y * 0.8, -1.2, 1.2);

    float fov = 1.1;
    // 相机始终看向原点：先在相机局部生成射线，再整体旋转到世界
    vec3 ro = vec3(0.0, 0.0, 2.8 * u_zoom);
    vec3 rd = normalize(vec3(p.x, p.y, -1.0/fov));
    mat3 camR = rotY(yaw) * rotX(pitch);
    rd = camR * rd;
    ro = camR * ro;

    // 常量
    float rh = 0.3;          // 事件视界半径
    float rin = 0.42;        // 吸积盘内半径
    float rout = 1.2;        // 吸积盘外半径
    float spin = 0.65;       // 盘角速度
    float G = 0.18;          // 引力强度（增强弯曲）
    float maxDist = 28.0;    // 最大追踪距离

    // 初始颜色为暗背景，占位
    vec3 color = vec3(0.02, 0.04, 0.07);

    // 迭代积分
    vec3 pos = ro;
    float t = 0.0;
    float prevY = pos.y;
    vec3 accum = vec3(0.0);
    float transmittance = 1.0; // 透过率（被盘发光“覆盖”）
    float minR = 1e9;         // 记录路径最小近距，用于环

    const int STEPS = 240;
    for(int i=0; i<STEPS; i++){
        float r = length(pos);
        minR = min(minR, r);
        // 命中事件视界则被吸收
        if(r < rh){
            transmittance = 0.0;
            accum = vec3(0.0);
            break;
        }

        // 引力偏折：方向向中心微调（近似 1/r^2），近视界增强
        vec3 gdir = (r > 1e-3) ? (-pos / r) : vec3(0.0);
        float gmag = G / (r*r + 1e-3);
        float edgeBoost = 1.0 + 2.2 * exp(-24.0 * max(0.0, r - rh));
        rd = normalize(rd + gdir * (gmag * edgeBoost));

        // 前进（靠近视界时更小步长）
        float stepLen = mix(0.06, 0.012, smoothstep(0.0, 1.0, rh / (r + 1e-6)));
        vec3 prevPos = pos;
        pos += rd * stepLen;
        t += stepLen;
        if(t > maxDist) break;

        // 穿越吸积盘平面 y=0?
        float currY = pos.y;
        if(prevY * currY <= 0.0){
            // 线性求交
            float k = prevY / (prevY - currY + 1e-6);
            vec3 hit = mix(prevPos, pos, k);
            float rr = length(hit.xz);
            if(rr > rin && rr < rout){
                // 发光（条纹 + 多普勒 + 径向分布）
                float ang = atan(hit.z, hit.x);
                float stripes = 0.5 + 0.5*sin(ang*42.0 + u_time*spin*18.0 + 5.0/rr);
                float radial = pow(1.0 - smoothstep(rin, rout, rr), 0.7);

                // 以切向方向近似速度方向 v，和视线角度形成多普勒
                vec3 tangential = normalize(vec3(-sin(ang), 0.0, cos(ang)));
                float approach = clamp(dot(tangential, -rd), -1.0, 1.0);
                float doppler = 0.6 + 0.7*approach;

                vec3 warm = hsb2rgb(vec3(0.08, 0.7, 1.0));
                vec3 hot  = hsb2rgb(vec3(0.0, 0.0, 1.0));
                vec3 base = mix(warm, hot, stripes);
                vec3 emitCol = base * doppler * radial * 1.5;

                // 近视界增强（透镜近似）
                float lensBoost = 0.24/(abs(rr - rh) + 0.05);
                emitCol *= (1.0 + lensBoost);

                // 累积（简单 over）
                accum = mix(accum, emitCol, 0.55);
                transmittance *= 0.95;
            }
        }
        prevY = currY;
    }

    // 背景星空：用最终射线方向采样（体现弯曲），并随时间绕 Y 轴缓慢旋转
    float bgSpeed = 0.2; // 背景转动速度（可调）
    vec3 bgDir = rotY(u_time * bgSpeed) * rd;
    vec3 bgCol = vec3(0.02, 0.04, 0.07) + starsDir(bgDir) * vec3(0.9, 0.95, 1.0);

    // 爱因斯坦环：用最小近距估计
    float ring = exp(-80.0 * abs(minR - rh));
    bgCol += vec3(1.0, 0.9, 0.55) * ring * 0.15;

    // 合成：先背景后盘发光
    color = mix(bgCol, accum, 1.0 - transmittance);

    // 暗角
    float vignette = smoothstep(0.95, 0.2, length(st-0.5));
    color *= mix(0.7, 1.0, vignette);

    FRAG_COLOR = vec4(color, 1.0);
}

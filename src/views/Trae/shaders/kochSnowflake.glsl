#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_zoom;
uniform int u_maxIterations;
uniform vec2 u_center;
uniform int u_colorScheme;
uniform float u_colorIntensity;

// 旋转函数
vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, -s, s, c);
    return m * v;
}

// 线段距离函数
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Koch曲线递归函数
float kochCurve(vec2 p, vec2 a, vec2 b, int iterations) {
    if (iterations <= 0) {
        return sdSegment(p, a, b);
    }
    
    vec2 dir = b - a;
    float len = length(dir);
    vec2 unit = dir / len;
    
    // 将线段分成三等份
    vec2 p1 = a + unit * len / 3.0;
    vec2 p2 = a + unit * len * 2.0 / 3.0;
    
    // 计算等边三角形的顶点
    vec2 mid = (p1 + p2) * 0.5;
    vec2 normal = vec2(-unit.y, unit.x);
    vec2 peak = mid + normal * len / 3.0 * sqrt(3.0) / 2.0;
    
    // 递归计算四个线段
    float d1 = kochCurve(p, a, p1, iterations - 1);
    float d2 = kochCurve(p, p1, peak, iterations - 1);
    float d3 = kochCurve(p, peak, p2, iterations - 1);
    float d4 = kochCurve(p, p2, b, iterations - 1);
    
    return min(min(d1, d2), min(d3, d4));
}

// Koch雪花（三条Koch曲线组成等边三角形）
float kochSnowflake(vec2 p, float size, int iterations) {
    // 等边三角形的三个顶点
    vec2 a = vec2(0.0, size * sqrt(3.0) / 3.0);
    vec2 b = vec2(-size * 0.5, -size * sqrt(3.0) / 6.0);
    vec2 c = vec2(size * 0.5, -size * sqrt(3.0) / 6.0);
    
    // 添加旋转动画
    float angle = u_time * 0.2;
    a = rotate(a, angle);
    b = rotate(b, angle);
    c = rotate(c, angle);
    
    // 三条边的Koch曲线
    float d1 = kochCurve(p, a, b, iterations);
    float d2 = kochCurve(p, b, c, iterations);
    float d3 = kochCurve(p, c, a, iterations);
    
    return min(min(d1, d2), d3);
}

vec3 getSnowflakeColor(float dist, vec2 p) {
    float intensity = 1.0 - smoothstep(0.0, 0.01, abs(dist));
    
    if (u_colorScheme == 0) {
        // 冰雪色
        return vec3(0.8, 0.9, 1.0) * intensity * u_colorIntensity;
    } else if (u_colorScheme == 1) {
        // 火焰色
        float gradient = length(p);
        vec3 inner = vec3(1.0, 1.0, 0.8);
        vec3 outer = vec3(1.0, 0.3, 0.1);
        return mix(inner, outer, gradient) * intensity * u_colorIntensity;
    } else if (u_colorScheme == 2) {
        // 海洋色
        float gradient = length(p);
        vec3 inner = vec3(0.6, 0.9, 1.0);
        vec3 outer = vec3(0.1, 0.3, 0.8);
        return mix(inner, outer, gradient) * intensity * u_colorIntensity;
    } else {
        // 彩虹色
        float hue = length(p) * 2.0;
        return vec3(
            0.5 + 0.5 * cos(6.28 * hue),
            0.5 + 0.5 * cos(6.28 * hue + 2.0),
            0.5 + 0.5 * cos(6.28 * hue + 4.0)
        ) * intensity * u_colorIntensity;
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // 应用缩放和中心偏移
    uv = uv / u_zoom + u_center;
    
    // 计算Koch雪花
    int iterations = clamp(u_maxIterations / 20, 2, 6);
    float size = 0.8;
    float dist = kochSnowflake(uv, size, iterations);
    
    vec3 color = vec3(0.0);
    if (dist < 0.02) {
        color = getSnowflakeColor(dist, uv);
    }
    
    // 添加背景渐变
    vec3 bgColor = vec3(0.05, 0.05, 0.2) * (1.0 - length(uv) * 0.3);
    color = mix(bgColor, color, step(dist, 0.02));
    
    gl_FragColor = vec4(color, 1.0);
}
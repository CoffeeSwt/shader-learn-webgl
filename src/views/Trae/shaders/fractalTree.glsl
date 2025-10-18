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

// 高度优化的非递归分形树绘制
float drawTree(vec2 p, vec2 start, vec2 end, int maxDepth, float thickness) {
    float minDist = 1000.0;
    
    // 增大栈数组以支持更多分支
    vec2 starts[64];
    vec2 ends[64];
    int depths[64];
    float thicknesses[64];
    
    int stackSize = 1;
    starts[0] = start;
    ends[0] = end;
    depths[0] = maxDepth;
    thicknesses[0] = thickness;
    
    // 增加循环次数以支持更复杂的树
    for (int i = 0; i < 500; i++) {
        if (stackSize <= 0) break;
        
        // 弹出栈顶元素
        stackSize--;
        vec2 currentStart = starts[stackSize];
        vec2 currentEnd = ends[stackSize];
        int currentDepth = depths[stackSize];
        float currentThickness = thicknesses[stackSize];
        
        if (currentDepth <= 0) continue;
        
        // 计算当前线段距离
        float d = sdSegment(p, currentStart, currentEnd) - currentThickness;
        minDist = min(minDist, d);
        
        // 早期退出优化：如果已经很接近，不需要继续细分
        if (minDist < 0.001) {
            return minDist;
        }
        
        // 优化分支条件：增加栈容量限制，减少厚度阈值，添加距离剔除
        if (currentDepth > 1 && stackSize < 62 && currentThickness > 0.0005) {
            vec2 dir = currentEnd - currentStart;
            float len = length(dir);
            
            // 距离剔除：如果分支太远，跳过
            float branchDist = length(p - currentEnd);
            if (branchDist > len * 3.0) continue;
            
            len *= 0.7;
            vec2 newStart = currentEnd;
            vec2 unitDir = normalize(dir);
            
            // 预计算旋转角度和新厚度
            float newThickness = currentThickness * 0.8;
            int newDepth = currentDepth - 1;
            
            // 左分支
            vec2 leftDir = rotate(unitDir, 0.5) * len;
            vec2 leftEnd = newStart + leftDir;
            starts[stackSize] = newStart;
            ends[stackSize] = leftEnd;
            depths[stackSize] = newDepth;
            thicknesses[stackSize] = newThickness;
            stackSize++;
            
            // 右分支
            vec2 rightDir = rotate(unitDir, -0.5) * len;
            vec2 rightEnd = newStart + rightDir;
            starts[stackSize] = newStart;
            ends[stackSize] = rightEnd;
            depths[stackSize] = newDepth;
            thicknesses[stackSize] = newThickness;
            stackSize++;
        }
    }
    
    return minDist;
}

vec3 getTreeColor(float dist, vec2 p) {
    float intensity = 1.0 - smoothstep(0.0, 0.02, abs(dist));
    
    if (u_colorScheme == 0) {
        // 自然树色
        vec3 brown = vec3(0.6, 0.3, 0.1);
        vec3 green = vec3(0.2, 0.8, 0.3);
        float gradient = (p.y + 1.0) * 0.5;
        return mix(brown, green, gradient) * intensity * u_colorIntensity;
    } else if (u_colorScheme == 1) {
        // 火焰树
        vec3 red = vec3(1.0, 0.2, 0.1);
        vec3 yellow = vec3(1.0, 0.8, 0.2);
        float gradient = (p.y + 1.0) * 0.5;
        return mix(red, yellow, gradient) * intensity * u_colorIntensity;
    } else if (u_colorScheme == 2) {
        // 冰霜树
        vec3 blue = vec3(0.2, 0.4, 1.0);
        vec3 white = vec3(0.8, 0.9, 1.0);
        float gradient = (p.y + 1.0) * 0.5;
        return mix(blue, white, gradient) * intensity * u_colorIntensity;
    } else {
        // 彩虹树
        float hue = (p.y + 1.0) * 0.5;
        return vec3(
            0.5 + 0.5 * cos(6.28 * hue),
            0.5 + 0.5 * cos(6.28 * hue + 2.0),
            0.5 + 0.5 * cos(6.28 * hue + 4.0)
        ) * intensity * u_colorIntensity;
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    uv = uv / u_zoom + u_center;
    
    // 树的根部和顶部
    vec2 treeStart = vec2(0.0, -0.8);
    vec2 treeEnd = vec2(0.0, -0.2);
    
    // 添加时间动画
    float timeOffset = u_time * 0.1;
    treeEnd = vec2(treeEnd.x + sin(timeOffset) * 0.1, treeEnd.y);
    
    // 动态深度计算，支持更高的迭代次数
    int depth = clamp(u_maxIterations / 25, 3, 18);
    // 根据缩放调整厚度，缩放越大厚度越小
    float thickness = max(0.005, 0.02 / u_zoom);
    
    float treeDist = drawTree(uv, treeStart, treeEnd, depth, thickness);
    
    vec3 color = vec3(0.0);
    if (treeDist < 0.02) {
        color = getTreeColor(treeDist, uv);
    }
    
    // 添加背景渐变
    vec3 bgColor = vec3(0.05, 0.05, 0.15) * (1.0 - length(uv) * 0.3);
    color = mix(bgColor, color, step(treeDist, 0.02));
    
    gl_FragColor = vec4(color, 1.0);
}
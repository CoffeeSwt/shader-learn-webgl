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
uniform vec2 u_juliaC; // Julia集的常数参数

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 getColor(int iterations, int maxIter) {
    if (iterations == maxIter) {
        return vec3(0.0);
    }
    
    float t = float(iterations) / float(maxIter);
    
    if (u_colorScheme == 0) {
        // 经典方案
        return vec3(
            0.5 + 0.5 * cos(3.0 + t * 6.28 + 0.0),
            0.5 + 0.5 * cos(3.0 + t * 6.28 + 2.0),
            0.5 + 0.5 * cos(3.0 + t * 6.28 + 4.0)
        ) * u_colorIntensity;
    } else if (u_colorScheme == 1) {
        // 火焰色
        return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), t) * u_colorIntensity;
    } else if (u_colorScheme == 2) {
        // 海洋色
        return mix(vec3(0.0, 0.2, 0.8), vec3(0.0, 0.8, 1.0), t) * u_colorIntensity;
    } else {
        // HSV彩虹
        return hsv2rgb(vec3(t * 0.8, 0.8, 1.0)) * u_colorIntensity;
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Julia集：z = uv作为初始值，c为常数
    vec2 z = uv / u_zoom + u_center;
    vec2 c = u_juliaC;
    
    int iterations = 0;
    
    for (int i = 0; i < 1000; i++) {
        if (i >= u_maxIterations) break;
        
        if (dot(z, z) > 4.0) break;
        
        // z = z^2 + c
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations++;
    }
    
    vec3 color = getColor(iterations, u_maxIterations);
    gl_FragColor = vec4(color, 1.0);
}
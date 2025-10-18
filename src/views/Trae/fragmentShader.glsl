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


void main() {
    
    gl_FragColor = vec4(1.0,0.0,0.0, 1.0);
}
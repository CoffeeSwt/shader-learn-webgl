uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.1415926535897932384626433832795

// Plot a line on Y using a value between 0.0-1.0
float plot(vec2 st) {
    return smoothstep(0.02, 0.0, abs(st.y - st.x));
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec2 mouse = u_mouse / u_resolution;

    // float r = mouse.y;
    // float g = mouse.y;
    // float b = mouse.y;

    float mappedX = st.x * (PI * 0.5);
    float r = sin(mappedX + mouse.x + u_time * 2.0) * 0.8;
    float g = sin(mappedX + mouse.y) * 0.8;
    float b = sin(mappedX + u_time * 1.0) * 0.8;

    // float y = pow(st.x, 5.0);
    // vec3 color = vec3(y);

    //Plot a line
    // float pct = plot(st);
    // color = (1.0 - pct) * color + pct * vec3(0.0, 1.0, 0.0);

    // gl_FragColor = vec4(color, 1.0);

    gl_FragColor = vec4(r, g, b, 0.8);
}
// Vertex Shader
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform sampler2D tDiffuse;
uniform float u_time;
uniform float u_intensity;
varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float grain = random(vUv + u_time * 0.01) * u_intensity;
    color.rgb += grain;
    gl_FragColor = color;
}
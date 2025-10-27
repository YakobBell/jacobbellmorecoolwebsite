// Vertex Shader
uniform float u_time;
uniform float u_wobble;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec3 pos = position;
    pos.x += sin(pos.y * 10.0 + u_time * 2.0) * u_wobble;
    pos.y += cos(pos.x * 10.0 + u_time * 2.0) * u_wobble;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

// Fragment Shader
uniform sampler2D tDiffuse;
uniform float u_colorBanding;
varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    color.rgb = floor(color.rgb * u_colorBanding) / u_colorBanding;
    gl_FragColor = color;
}
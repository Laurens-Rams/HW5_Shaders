uniform sampler2D uMap;

varying vec2 vUv;

void main() {
    // Sample the video texture
    vec4 videoColor = texture2D(uMap, vUv);
    
    // Output the video color
    gl_FragColor = videoColor;
}
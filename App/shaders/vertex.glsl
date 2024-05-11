#include './noise.glsl'

uniform sampler2D uMap;
uniform float uTime;
uniform float uMainDisplacement; 
uniform float uNoiseDisplacement; 

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 newPosition = position;
    
    vec4 videoColor = texture2D(uMap, vUv);
    float brightness = dot(videoColor.rgb, vec3(0.299, 0.587, 0.114)); 

    float mainDisplacement = brightness * uMainDisplacement;
    newPosition += normal * mainDisplacement;
    
    // noise-based displacement
    float noise = snoise(vec3(
        0.07 * newPosition.x + uTime, 
        0.1 * newPosition.y, 
        0.1 * newPosition.z
    ));
    
    float noiseDisplacement = smoothstep(-1.0, 1.0, noise);
    newPosition += normal * noiseDisplacement * uNoiseDisplacement;
    
    float dampeningFactor = 0.7; 
    newPosition = mix(position, newPosition, dampeningFactor);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
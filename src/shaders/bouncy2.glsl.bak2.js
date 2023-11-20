export const vertexShader = /* glsl */`
varying vec2 vUv;  

void main()	{
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
`;

export const fragmentShader = /* glsl */`
precision lowp float;
#define MAX_DIST .25
#define PI 3.1415926535

uniform float uTime;
uniform vec4 uMouse;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uWindow;
uniform vec4 uEffect;
varying vec2 vUv;

float getAngle(vec2 p1, vec2 p2) {
    return atan(p2.y - p1.y, p2.x - p1.x);
}

mat2 rot2d(float a){
    return mat2(cos(a), -sin(a), 
                sin(a), cos(a));
}

float roundedRectangle (vec2 uv, vec2 pos, vec2 size, float radius, float thickness) {
    vec2 absvec = abs(uv - pos);
    vec2 maxvec = max(absvec, size) - size;
    float d = length(maxvec) - radius;
    return smoothstep(.66, 0.33, d / thickness * 5.);
}

float roundedBoxSDF(vec2 CenterPosition, vec2 Size, float Radius) {
    return length(max(abs(CenterPosition)-Size+Radius,0.0))-Radius;
}

void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 center = vec2(0.5 * aspect, .5);

    // Texture coordinates
    vec2 texCoord = (vUv - .25) * 2.;
    vec2 uv = vec2(texCoord.x * aspect, texCoord.y);
    
    // Mouse coordinates
    vec2 mouseCoord = uEffect.xy / uResolution.xy; // where the mouse crossed the edge of the element
    mouseCoord = vec2(mouseCoord.x * aspect, mouseCoord.y + 1.);

    // Bounce effect
    float angle = getAngle(center, mouseCoord);
    vec2 base = normalize(rot2d(-angle) * vec2(0., 1.)); // rotate before deformation, in a circle
    vec2 bn = vec2(-base.y, base.x); // base normal?
    vec2 range = vec2(uv.x / aspect, uv.y) - vec2(mouseCoord.x / aspect, mouseCoord.y);
    float d1 = length(range);
    float fd1 = smoothstep(MAX_DIST, 0., d1); //amount of warp for this fragment based on distance from mouse
    float dd = dot(uv - center, base); //same as cos of angle between them?
    float sd = sin(dd * PI * 10.) / (dd * PI * 10.); // adds the sin wave to it
    sd *= sin(uTime / 5.); // add time element
    float warpFactor = sd * fd1 * 20.;
    warpFactor *= (uEffect.z / 80.) * uEffect.w; //scale based on the effect time and direction

    // normalized deformation amount no matter what size the image is
    uv = vec2(uv.x / aspect, uv.y);
    uv += vec2(bn.x * warpFactor / uResolution.x, bn.y * warpFactor / uResolution.y);

    // rounded corners
    float rounded = roundedRectangle(vUv, vec2(uv.x, uv.y), vec2(.2,.2), .05, 0.0);

    vec4 col = texture2D(uTexture, vec2(uv.x, uv.y)) * rounded;

    // only show the image if it's within the bounds of the element
    if (uv.x > .0 && uv.x < 1. && uv.y > .0 && uv.y < 1.) {
        gl_FragColor = col;
    }
}
`;
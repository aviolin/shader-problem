export const vertexShader = /* glsl */`
varying vec2 vUv;  

void main()	{
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
`;

export const fragmentShader = /* glsl */`
// #include <colorspace_pars_fragment>
precision lowp float;
#define PI 3.1415926535

// #define WARP_FACTOR 20.
// #define WARP_RADIUS 15.
// #define DECELERATION 7.
// #define DENSITY 1.
#define AA_BORDER_RADIUS .0

uniform float uTime;
uniform vec4 uMouse;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uWindow;
uniform vec4 uEffect;
uniform float uBorderRadius;
uniform vec4 uOptions;
varying vec2 vUv;

float getAngle(vec2 p1, vec2 p2) {
    return atan(p2.y - p1.y, p2.x - p1.x);
}

mat2 rot2d(float a){
    return mat2(cos(a), -sin(a), 
                sin(a), cos(a));
}

float roundedRectangle (float aspect, vec2 uv, vec2 pos, vec2 size, float radius, float thickness)
{
    gl_FragColor = vec4(1.,1.,1.,0.);

    vec2 halfSize = size * 0.5;
    vec2 posToUV = uv - pos;
    
    // size of the image cropped by the radius
    vec2 croppedSize = vec2(halfSize) - vec2(radius / aspect, radius);

    vec2 fromCorner = halfSize - abs(posToUV);
    fromCorner.x *= aspect;
    float d1 = length(fromCorner);
    
    vec2 fromCropped = croppedSize - abs(posToUV);
    fromCropped.x *= aspect;
    float d2 = length(fromCropped);
    
    float aaFromRadius = radius * (1.0 - thickness);
    float aaToRadius = radius * (1.0 + thickness);
    return step(abs(posToUV.y), halfSize.y) *
           step(abs(posToUV.x), halfSize.x) *
           (1.0 - ((1.0 - smoothstep(aaFromRadius, aaToRadius, d1)) *
           smoothstep(aaFromRadius, aaToRadius, d2)));
}

void main() {    

    /*
    DEFINE AS CONSTANTS FOR PRODUCTION
    */
    float WARP_FACTOR = uOptions.x;
    float WARP_RADIUS = uOptions.y;
    float DECELERATION = uOptions.z;
    float DENSITY = uOptions.w;

    float aspect = uResolution.x / uResolution.y;
    vec2 center = vec2(.5);

    float imageScale = 0.5;

    // texture coordinates
    vec2 texCoord = (vUv - center) / imageScale + center;
    vec2 uv = vec2(texCoord.x * aspect, texCoord.y);
    
    // mouse coordinates
    vec2 mouseCoord = uEffect.xy / uResolution.xy; // where the mouse crossed the edge of the element
    mouseCoord = vec2(mouseCoord.x * aspect, mouseCoord.y + 1.);

    // bounce effect
    float angle = getAngle(center, mouseCoord);
    vec2 base = normalize(rot2d(-angle) * vec2(0., 1.)); // rotate before deformation, in a circle
    vec2 bn = vec2(-base.y, base.x); // base normal?
    vec2 range = vec2(uv.x / aspect, uv.y) - vec2(mouseCoord.x / aspect, mouseCoord.y);
    float d1 = length(range);
    float warpRadius = WARP_RADIUS / (uResolution.y / 100.);
    float fd1 = smoothstep(warpRadius, 0., d1); //amount of warp for this fragment based on distance from mouse
    float dd = dot(uv - center, base); //same as cos of angle between them?
    float sd = sin(dd * PI * DENSITY) / (dd * PI * DENSITY); // adds the sin wave to it
    sd *= sin(uTime / DECELERATION ); // add time element
    float warpFactor = sd * fd1 * WARP_FACTOR;
    warpFactor *= (uEffect.z / 60.) * uEffect.w; //scale based on the effect time and direction

    // normalized deformation amount no matter what size the image is
    uv = vec2(uv.x / aspect, uv.y);
    uv += vec2(bn.x * warpFactor / uResolution.x, bn.y * warpFactor / uResolution.y);

    // rounded corners
    float radius = uBorderRadius / (uResolution.y / 100.); // normalized radius for all image sizes relative to window size
    float rounded = roundedRectangle(aspect, uv, center, vec2(1.0), radius, AA_BORDER_RADIUS);
    
    vec4 col = texture2D(uTexture, uv) * rounded;

    if (uv.x > center.x - imageScale && uv.x < center.x + imageScale && uv.y > center.y - imageScale && uv.y < center.y + imageScale) {
        gl_FragColor = col;
        // gl_FragColor = linearToOutputTexel( gl_FragColor );
    }

    // #include <colorspace_pars_fragment>
}
`;
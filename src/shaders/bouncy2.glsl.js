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
// #defune SOEED 1.
// #define AA 0.001
// #define MOVEMENT_FACTOR 1.
#define AA_BORDER_RADIUS .02

uniform float uTime;
uniform vec4 uMouse;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uWindow;
uniform vec4 uEffect;
uniform float uBorderRadius;
uniform float uScale;
uniform vec4 uOptions;
uniform vec4 uOptions2;
varying vec2 vUv;

float getAngle(vec2 p1, vec2 p2) {
    return atan(p2.y - p1.y, p2.x - p1.x);
}

mat2 rot2d(float a){
    return mat2(cos(a), -sin(a), 
                sin(a), cos(a));
}

mat2 scale(vec2 scale){
    return mat2(scale.x,0.0,
                0.0,scale.y);
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
    float SPEED = uOptions2.x;
    float AA = uOptions2.y;
    float MOVEMENT_FACTOR = uOptions2.z;

    vec2 center = vec2(.5);
    float aspect = uResolution.x / uResolution.y;
    float time = uTime * SPEED;
    float imageScale = 0.5;

    // texture coordinates
    vec2 texCoord = (vUv - center) / imageScale + center;
    vec2 uv = vec2(texCoord.x * aspect, texCoord.y);

    // mouse coordinates
    vec2 mouseCoord = uMouse.xy / uResolution.xy;
    mouseCoord = vec2(mouseCoord.x * aspect, mouseCoord.y + 1.);

    // bounce effect coordinates
    vec2 bounceCoord = uEffect.xy / uResolution.xy; // where the mouse crossed the edge of the element
    bounceCoord = vec2(bounceCoord.x * aspect, bounceCoord.y + 1.);

    // bounce effect
    float angle = getAngle(center, bounceCoord);
    vec2 base = normalize(rot2d(-angle) * vec2(0., 1.)); // rotate before deformation, in a circle
    vec2 bn = vec2(-base.y, base.x); // base normal?
    vec2 range = vec2(uv.x / aspect, uv.y) - vec2(bounceCoord.x / aspect, bounceCoord.y);
    float d1 = length(range);
    float warpRadius = WARP_RADIUS / (uResolution.y / 100.);
    float fd1 = smoothstep(warpRadius, 0., d1); //amount of warp for this fragment based on distance from mouse
    float dd = dot(uv - center, base); //same as cos of angle between them?
    float sd = sin(dd * PI * DENSITY / (uResolution.y / 100.)) / (dd * PI * DENSITY / (uResolution.y / 100.)); // adds the sin wave to it
    sd *= sin(time / DECELERATION ); // add time element
    float warpFactor = sd * fd1 * WARP_FACTOR;
    warpFactor *= (uEffect.z / 60.) * uEffect.w; //scale based on the effect time and direction

    // normalized deformation amount no matter what size the image is
    uv = vec2(uv.x / aspect, uv.y);
    uv += vec2(bn.x * warpFactor / uResolution.x, bn.y * warpFactor / uResolution.y);

    // simple anti-aliasing
    float aa = 1.;
    if (uv.x < AA || uv.x > 1. - AA || uv.y < AA || uv.y > 1. - AA) {
        aa = smoothstep(0., AA * 2., min(min(uv.x, 1. - uv.x), min(uv.y, 1. - uv.y) ));
    }

    // rounded corners
    float radius = uBorderRadius / (uResolution.y / 100.); // normalized radius for all image sizes relative to window size
    float rounded = roundedRectangle(aspect, uv, center, vec2(1.0), radius, AA_BORDER_RADIUS);
    
    // scale on hover
    uv -= center;
    uv = scale( vec2(1.) / uScale ) * uv;
    uv += center;
    
    if (uv.x > center.x - imageScale && uv.x < center.x + imageScale && uv.y > center.y - imageScale && uv.y < center.y + imageScale) {
        // image movement with mouse
        // if (uScale > 1.) {
            uv = vec2(uv.x - (uMouse.x - .5 * aspect) / 10000. * MOVEMENT_FACTOR, uv.y - (uMouse.y - .5) / 10000. * MOVEMENT_FACTOR);
        // }

        // final color
        gl_FragColor = texture2D(uTexture, uv) * rounded * aa;
    }
}
`;
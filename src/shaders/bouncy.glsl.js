export const vertexShader = /* GLSL vert shader */`
varying vec2 vUv;  

void main()	{
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
`;

export const fragmentShader = /* GLSL frag shader */`
precision lowp float;
#define MAX_DIST 0.5
#define PI 3.1415926535

uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTexture;
uniform vec2 uResolution;
varying vec2 vUv;

mat2 rot2d(float a){return mat2(cos(a), -sin(a), sin(a), cos(a));}

float getAngle(vec2 p1, vec2 p2) {
    return atan(p2.y - p1.y, p2.x - p1.x);
    // return mod( atan(p1.x,p1.y) -atan(p2.x,p2.y), PI * 2.) - (PI * 2.)/2. ;
}

void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 center = vec2(0.5 * aspect, .5);

    // Texture coordinates
    vec2 texCoord = (vUv - .25) * 2.;
    vec2 uv = vec2(texCoord.x * aspect, texCoord.y);

    vec2 mouseCoord = uMouse / uResolution.xy;
    mouseCoord = vec2(mouseCoord.x * aspect, mouseCoord.y + 1.);

    
    
    
    
    //////

    float angle = getAngle(vec2(0.,0.), vec2(-mouseCoord.y, mouseCoord.x));

    vec2 base = normalize(rot2d(angle) * vec2(0., 1.)); // rotate before deformation, in a circle
    vec2 bn = vec2(-base.y, base.x); // base normal?

    vec2 range = uv - mouseCoord; // distance..
    float d1 = length(range); // distance from mouse
    float fd1 = smoothstep(MAX_DIST, 0., d1); //amount of warp for this fragment based on distance from mouse

    float dd = dot(uv, base); //same as cos of angle between them?

    // sinc function
    float sd = sin(dd * PI * 10.) / (dd * PI * 10.); // adds the sin wave to it
    sd *= sin(uTime / 5.); // add time element

    uv = vec2(uv.x / aspect, uv.y);

    uv += bn * sd * 0.1 * fd1;


    if (uv.x > .0 && uv.x < 1. && uv.y > .0 && uv.y < 1.) {
        gl_FragColor = texture2D(uTexture, uv);
    }

    vec2 uv2 = vec2(uv.x * aspect, uv.y);

    if (distance(uv2.xy, center) < .03) {
        gl_FragColor = vec4(1.,0.,0.,.4);
    }
    if (distance(mouseCoord.xy, uv2.xy) < .1) {
        gl_FragColor = vec4(0.,1.,0.,.4);
    }


    // gl_FragColor = vec4(vec3(dd), 1.);
}
`;
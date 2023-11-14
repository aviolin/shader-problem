export const vertexShader = /* GLSL vert shader */`
varying vec2 vUv;  

void main()	{
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
`;

export const fragmentShader = /* GLSL frag shader */`
#define MAX_DIST 0.5
#define PI 3.1415926535

precision lowp float;
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTexture;
varying vec2 vUv;
uniform vec2 uResolution;

mat2 rot2d(float a){return mat2(cos(a), -sin(a), sin(a), cos(a));}

void main() {
  // vec2 texCoord = (gl_FragCoord.xy / uResolution.xy);
  // float aspect = uResolution.x / uResolution.y;

  vec2 newCoord = (vUv - .25) * 2.;

  if (vUv.x > .25 && vUv.x < .75 && vUv.y > .25 && vUv.y < .75) {
    gl_FragColor = texture2D(uTexture, newCoord);
  }

  vec2 mouseCoord = uMouse / uResolution.xy;
  mouseCoord = vec2(mouseCoord.x, mouseCoord.y + 1.);

  if (distance(vUv.xy, vec2(0.5)) < .1) {
    gl_FragColor = vec4(1.,0.,0.,.4);
  }

  if (distance(mouseCoord.xy, newCoord.xy) < .1) {
    gl_FragColor = vec4(0.,1.,0.,.4);
  }





  float aspect = iResolution.x / iResolution.y;
  vec2 uv = (f / iResolution.xy) * 2. - 1.;
  uv.x *= aspect; // fixes aspect ratio
  vec2 m = (iMouse.xy / iResolution.xy) * 2. - 1.;
  m.x *= aspect;
  
  float angle = atan(-m.y, m.x);//angle from center to mouse
      
  vec2 base = normalize(rot2d(angle) * vec2(0, 1.)); // rotate before deformation, in a circle
  vec2 bn = vec2(-base.y, base.x); // base normal?
  
  vec2 range = uv - m; // distance..
  float d1 = length(range); // distance from mouse
  float fd1 = smoothstep(MAX_DIST, 0., d1); //amount of warp for this fragment based on distance from mouse
  
  float dd = dot(uv, base); //same as cos of angle between them?
  
  // sinc function
  float sd = sin(dd * PI * 10.) / (dd * PI * 10.); // adds the sin wave to it
  sd *= sin(iTime * 5.); // add time element
  
  uv += bn * sd * 0.1 * fd1;

  vec4 col = texture(iChannel0, uv);
  o = col;
}
`;









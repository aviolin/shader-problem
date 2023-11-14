export const vertexShader = /* GLSL vert shader */`
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;  

void main()	{
  vUv = uv;

  // vPos = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // if ( 1. - (distance(vUv.xy, uMouse.xy)) < .1 ) {

  //   vec3 pos = vec3(position.x + 1., position.y, position.z);

  //   gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  // }

}
`;

export const fragmentShader = /* GLSL frag shader */`
precision lowp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTexture;
uniform vec3 uPoint;
uniform vec2 uOffset;
varying vec2 vUv;

void main() {
  vec2 f = gl_FragCoord.xy - uOffset.xy;
  vec2 texCoord = (f.xy / uResolution.xy);

  texCoord = vec2(texCoord.x, texCoord.y);

  vec2 newCoord = texCoord - 0.;

  gl_FragColor = vec4(0.,0.,0.,0.);

  if (newCoord.x > 0. && newCoord.x < 1. && newCoord.y > 0. && newCoord.y < 1.) {
    gl_FragColor = texture2D(uTexture, newCoord);
  }

  // gl_FragColor = texture2D(uTexture, texCoord);

  // gl_FragColor = vec4(1.,0., 0., texCoord.x);
}
`;
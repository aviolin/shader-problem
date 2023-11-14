export const vertexShader = /* GLSL vert shader */`
uniform float time;
uniform vec2 mouse;
varying vec2 vUv;  

void main()	{
  vUv = uv;

  // vPos = (modelMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // if ( 1. - (distance(vUv.xy, mouse.xy)) < .1 ) {

  //   vec3 pos = vec3(position.x + 1., position.y, position.z);

  //   gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  // }

}
`;

export const fragmentShader = /* GLSL frag shader */`
precision lowp float;
uniform float time;
uniform vec2 mouse;
uniform sampler2D image;
uniform sampler2D bufferTexture;
varying vec2 vUv;
uniform vec2 resolution;

void main() {

  /////////// WAVY EFFECT

  float mouseDist = distance(mouse, gl_FragCoord.xy);
  
	float frequency = 8.0;
	float amplitude = 0.05;
	float speed = .1;
  vec2 pulse = sin((time * speed) - frequency * vUv) * mouseDist / 100.;
  float dist = 2.0 * length(vUv.y - 0.5);
  
  vec2 newCoord = vUv + amplitude * vec2(0.0, pulse.x); // y-axis only; 
  
  vec2 interpCoord = mix(newCoord, vUv, dist);
	
  
  if (mouseDist < 100.) {
    // gl_FragColor = vec4(1.,0.,0.,1.);
    
    gl_FragColor = texture2D(image, interpCoord);

  } else {
    gl_FragColor = texture2D(image, vUv);
  }


  //////// END WAVY EFFECT
}
`;
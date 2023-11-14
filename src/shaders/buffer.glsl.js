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
varying vec2 vUv;
uniform vec2 resolution;

void main() {

  // WAVY EFFECT
  
	// float frequency = 8.0;
	// float amplitude = 0.05;
	// float speed = .15;
  // vec2 pulse = sin((time * speed) - frequency * vUv);
  // float dist = 2.0 * length(vUv.y - 0.5);
  
  // vec2 newCoord = vUv + amplitude * vec2(0.0, pulse.x); // y-axis only; 
  
  // vec2 interpCoord = mix(newCoord, vUv, dist);
	
	// gl_FragColor = texture2D(image, interpCoord);
  
  
  vec2 uv = gl_FragCoord.xy / resolution.xy;
	gl_FragColor = texture2D(image, vUv);


  // gl_FragColor = vec4(1.,1.,0.,1.);
}
`;
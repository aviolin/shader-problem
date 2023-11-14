export const vertexShader = /* GLSL vert shader */`
void main()	{
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
`;

export const fragmentShader = /* GLSL frag shader */`
void main() {
  
  gl_FragColor = vec4(1.,1.,1.,1.);

}
`;
import * as THREE from 'three';

/**
 * Full-screen textured quad shader
 */

const CustomShader = {

	name: 'CustomShader',

	uniforms: {

		'tDiffuse': { value: null },
		'opacity': { value: 1.0 },
        'time': { value: 0 },
        'mouse': { value: new THREE.Vector2() },
        'resolution': { value: new THREE.Vector2() },
        'bufferTexture': { value: null },
        'uPoint': { value: new THREE.Vector3(0.,0.,0.) },

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		uniform sampler2D bufferTexture;

        uniform float time;

        uniform vec2 mouse;

        uniform vec2 resolution;

        uniform vec3 uPoint;

		varying vec2 vUv;

        float sinc(float x, float amp, float freq, float phase0) {
            x = freq*x+phase0;
            return amp*sin(x)/(x);
        }
        vec2 centeredCoord(vec2 c1, vec2 c2) {
            return vec2(c1 / c2);// * 2. - 1.; // between -1 and 1
        }

		void main() {
            float PI = 3.14159;
            float amplitude;
            float ampFactor = .05;
            float speedFactor = 3.;
            float AOIFactor = 5.;
            float frequency = 50.;
            float oscillations = 4.;
        
            vec2 texCoord = centeredCoord(gl_FragCoord.xy, resolution.xy);
            vec2 mouseCoord = centeredCoord(uPoint.xy, resolution.xy);
            
            float dist = distance(mouseCoord, texCoord);


                
            amplitude = sin(PI * time/50. * speedFactor) * (PI - fract(time/50. / oscillations * speedFactor) * PI) * ampFactor * ( uPoint.z / 60. );
            
            vec2 newCoord = texCoord;
            
            newCoord = vec2(texCoord.x, texCoord.y + sinc(texCoord.x - mouseCoord.x, amplitude, frequency, 0.)); //vertical
            
            //newCoord = vec2(texCoord.x + sinc(texCoord.y - mouseCoord.y, amplitude, frequency, 0.), texCoord.y); //horizontal
            
            gl_FragColor = texture2D(tDiffuse, mix(newCoord, texCoord, clamp(0., dist * AOIFactor, 1.)));
		}`

};

export { CustomShader };







// #define GLSLIFY
// // Fractal noise from https://github.com/yiwenl/glsl-fbm
// // Modified signature to accept num octaves as an optional 2nd parameter
// #define NUM_OCTAVES 5
// float rand(vec2 n) {
//     return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
// }
// float noise(vec2 p){
//     vec2 ip = floor(p);
//     vec2 u = fract(p);
//     u = u*u*(3.0-2.0*u);
//     float res = mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),

       // mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);\n return
       // res*res;\n}\n\nfloat fbm(vec2 x, int numOctaves) {\n    float v =
       // 0.0;\n    float a = 0.5;\n    vec2 shift = vec2(100);\n    // Rotate
       // to reduce axial bias\n    mat2 rot = mat2(cos(0.5), sin(0.5),
       // -sin(0.5), cos(0.50));\n    for (int i = 0; i < numOctaves; ++i) {\n
       // v += a * noise(x);\n    x = rot * x * 2.0 + shift;\n    a *= 0.5;\n
       // }\n    return v;\n}\n\nfloat fbm(vec2 x) {\n    return fbm(x,
       // NUM_OCTAVES);\n}\n\nuniform float uTime;\nuniform float
       // uNoiseAmplitude;\nuniform float uNoiseFrequency;\nuniform int
       // uNoiseOctaves;\nuniform float uNoiseSpeed;\nuniform float
       // uProgress;\nuniform vec2 uMouseEnter;\nuniform float
       // uEnterTime;\nuniform vec2 uPlaneSize;\nuniform vec2
       // uWindowSize;\n\nuniform float uEnterDirection;\n\nvarying float
       // vNoise;\nvarying vec2 vUv;\n\n#define PI 3.1415926538\n\n// Distort
       // edge in world pos to get uniform strength no matter image scale\nvec4
       // edgeWave(vec3 position, vec4 worlPos, float effect, float time, vec2
       // uv) {\n\n  // Wave Amplitude\n  float amp = pow(1.33 * max(0.,
       // uEnterTime + 1. - uTime  ), 11.0); // pow makes wave softer at the end
       // - feels faster\n  float waveAmp = amp * 0.5;\n  float waveSpeed = 14.
       // * -1. * uEnterDirection * (1. - effect);\n\n  // Frequency - keep
       // consistent across sizes and aspect\n  float numWaves = 14.; // magic
       // number - must match the MAX_DISTANCE to look good\n  vec2 freq =
       // vec2(uPlaneSize.x / uWindowSize.x, uPlaneSize.y / uWindowSize.x)
       // * 18.;\n  vec2 waveFreq = freq * 1.5;\n  \n  // CREATE NOISE\n  //
       // large bend\n  float n = (cos((uv.x-uMouseEnter.x)*PI*2.*freq.x) +
       // cos(((uv.y-uMouseEnter.y)*PI*2.)*freq.y)) * amp * effect;\n
       // // small waves\n		n +=
       // (cos((uv.x-uMouseEnter.x)*PI*2.*waveFreq.x + time * waveSpeed) +
       // cos(((uv.y-uMouseEnter.y)*PI*2.)*waveFreq.y + time * waveSpeed)) *
       // waveAmp * effect;\n\n  // Only affect vertices within MAX_DISTANCE\n
       // float MAX_DISTANCE = 0.06;\n  vec3 aspect =
       // vec3(uPlaneSize.y/uPlaneSize.x, 1.0, 1.0);\n  vec2 vecDistance =
       // vec2(uWindowSize.x / uPlaneSize.x * MAX_DISTANCE) / aspect.xy;\n  vec2
       // invDistance = clamp((vecDistance - pow(distance(uMouseEnter, uv), .9
       // )) / vecDistance, vec2(0.), vec2(1.));\n  vec3 dist =
       // vec3(invDistance, 1.0);\n\n  worlPos.xyz -= position * 2. * n * dist *
       // uEnterDirection;\n  return worlPos;\n}\n\nvoid main() {\n	vUv =
       // uv;\n	vec3 pos = position;\n	float progress = 1. -
       // uProgress;\n	\n	// scale up image in Y-axis\n	pos = mix(pos *
       // vec3(1., .8, 1.), pos, uProgress);\n	\n	// distort in world
       // pos\n	vec4 wPos = modelMatrix * vec4(pos, 1.);\n\n	// Distort mesh
       // using Fractal noise\n	vNoise = fbm(wPos.xy * uNoiseFrequency + uTime *
       // uNoiseSpeed, uNoiseOctaves);\n	wPos *= mix(1., 1. - vNoise *
       // uNoiseAmplitude, progress);\n\n	// distort edge in world space\n
       // float effect = pow(clamp(uTime - uEnterTime, 0., 1.0), 2.0);\n
       // wPos = edgeWave(pos, wPos, effect, uTime - uEnterTime, uv);\n\n
       // gl_Position = projectionMatrix * viewMatrix * wPos;\n}", "#define
       // GLSLIFY 1\nuniform sampler2D uTexture;\nuniform sampler2D
       // uDisplacement;\nuniform vec2 uPlaneSize;\nuniform vec2
       // uWinResolution;\nuniform float uBorderRadius;\nuniform float
       // uTime;\nuniform float uEdgeBlurAmount;\nuniform float uZoom;\nuniform
       // float uWaveFrequency;\nuniform float uWaveAmplitude;\nuniform float
       // uWaveSpeed;\nuniform float uOpacity;\nuniform float
       // uProgress;\nuniform float uParallax;\nuniform float
       // uParallaxSpeed;\nuniform float uWaveStrength;\n\nvarying vec2
       // vUv;\nvarying float vNoise;\n\n#define PI 3.14159265\n\nfloat
       // roundRect(vec2 uv, vec2 size, float radius) {\n	return
       // length(max(abs(uv) - size + radius, 0.0)) - radius;\n}\n\nfloat
       // weight(float t, float log2radius, float gamma) {\n	return
       // exp(-gamma * pow(log2radius-t,2.));\n}\n\nvec4 sampleBlured(sampler2D
       // map, vec2 uv, float radius, float gamma) {\n	vec4 pix = vec4(0.);\n
       // float norm = 0.;\n\n	float log2radius = log2(radius);\n\n	//
       // weighted integration over mipmap levels\n	for(float i = 0.; i
       // < 10.; i += 0.5) {\n			float k = weight(i, log2radius,
       // gamma);\n			pix += k * texture(map, uv, i);\n
       // norm += k;\n	}\n\n	// nomalize, and a bit of brigtness hacking\n
       // return pix * pow(norm, -0.95);\n}\n\nfloat smoothEdges(vec2 uv, float
       // amount) {\n	uv = (2.0 * uv - 1.0);\n\n	float eps = 1e-6;\n\n
       // // mask each side\n	float topMask = 1.0 - uv.y;\n	float bottomMask
       // = uv.y + 1.0;\n	float leftMask = uv.x + 1.0 + eps;\n	float
       // rightMask = 1.0 - uv.x;\n\n	// combine masks\n	float squareMask
       // = topMask * bottomMask * leftMask * rightMask;\n\n	// AA edge\n
       // float delta = fwidth(squareMask) * 2.;\n	return smoothstep(0.0,
       // amount + delta, squareMask);\n}\n\nvoid main() {\n	// STEP 0 -
       // Create a mask for the rounded corners\n	// TODO: see if alpha
       // mask needed instead\n	vec2 halfSize = uPlaneSize * 0.5;\n
       // vec2 coord = vUv * uPlaneSize;\n	vec2 p = coord - halfSize;\n
       // float mask = 1. - roundRect(p, halfSize, uBorderRadius);\n\n float
       // progress = 1. - uProgress;\n\n	// STEP 1 - zoom and displace UV
       // for more ripples on top of image\n
       // //////////////////////////////////////////////\n\n	// convert UV to
       // [-1,1] instead of [0,1]\n	vec2 vUv2 = vUv;\n	vUv2 = (vUv2
       // * 2.) - 1.;\n	\n	// wave displace\n	float waveDisplace = (sin(vUv2.x * uWaveFrequency + uTime * uWaveSpeed) + 1.) * 0.5;\n	vUv2.y *= 1. - waveDisplace * uWaveAmplitude * progress;\n\n		// apply zoom /w parallax\n	vUv2 *= 1. - uZoom * progress - .25 * uParallaxSpeed;\n\n	// apply parallax\n	float parallax = (uParallax - .5) * 2. * uParallaxSpeed;\n	vUv2.y += parallax;\n\n	// convert back to [0,1] UVs\n	vUv2 = (vUv2 + 1.) * .5;\n\n	// Add ripples displacement\n	//////////////////////////////////////////////\n	// Use Screen Coords instead of UV Coords to avoid ripple scene shrink\n	vec2 scUv = gl_FragCoord.xy / uWinResolution.xy;\n    vec4 displacement= texture2D(uDisplacement, scUv);\n    float theta = displacement.r * 2. * PI;\n    vec2 direction = vec2(sin(theta), cos(theta));\n    vec2 vUv3 = vUv2 + direction * displacement.r * uWaveStrength;\n\n	// STEP 2 - blur image using weighted mipmap lookups\n	//////////////////////////////////////////////\n\n	float blur = mix(1.0, 10.0, progress);\n	float gamma = mix(1.0, .1, progress);\n	vec4 color = sampleBlured(uTexture, vUv3, blur, gamma);\n	\n	// STEP 3 - smooth edges of plane \n	// Apply noise to the blur amount for some irregular borders\n	// (re-using vertex noise for perf reasons)\n	//////////////////////////////////////////////\n	float alpha = smoothEdges(vUv, vNoise * progress * uEdgeBlurAmount); \n	vec4 sampledDiffuseColor = vec4(color.rgb, mix(alpha, alpha * uOpacity, progress) * mask * uProgress); \n\n	#ifdef DECODE_VIDEO_TEXTURE\n		// inline sRGB decode (TODO: Remove this code when https://crbug.com/1256340 is solved)\n		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );\n	#endif\n\n	gl_FragColor = sampledDiffuseColor;\n\n	#include <colorspace_fragment>\n\n	// TEMP Simple image\n	// vec4 image = texture2D(uTexture, vUv);\n	// gl_FragColor = vec4(image.rgb, mask * uProgress);\n}");

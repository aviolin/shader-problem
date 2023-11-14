import * as THREE from 'three';
import { vertexShader, fragmentShader } from '../shaders/test3.glsl.js';

let counter = 0;

export default function main() {

	const canvas = document.createElement('canvas');
    canvas.classList.add('scroll-rig');
    document.body.appendChild(canvas);
	const renderer = new THREE.WebGLRenderer( { canvas, alpha: true } );

	const sceneElements = [];

	const mainScene = new THREE.Scene();

	// const fov = 45;
	// const aspect = 2; // the canvas default
	// const near = 0.1;
	// const far = 50;
	// const mainCamera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	const mainCamera = new THREE.OrthographicCamera( 
		// canvas.offsetWidth / -2, 
		window.innerWidth / -2,
		window.innerWidth / 2,
		window.innerHeight / 2,
		window.innerHeight / -2, 
		1, 
		1000 
	)
	mainCamera.position.set( 0, 0, 1 );
	// mainCamera.lookAt( 0, 0, 0 );
	mainScene.add( mainCamera );

	const testMaterial = new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: .5, side: THREE.DoubleSide });

	// Create a plane geometry matching the image dimensions
	const geometry = new THREE.PlaneGeometry(100, 100, 1, 1)

	// Create a plane mesh with the image texture and add to the scene
	const plane = new THREE.Mesh(geometry, testMaterial)
	// plane.position.set(plane.position.x, plane.position.y, 0);

	mainScene.add(plane)
	plane.position.set(mainCamera.left, mainCamera.top, 0)


	function addScene( elem, fn ) {

		sceneElements.push( { elem, fn } );

	}

	function makeScene( elem ) {

		// const scene = new THREE.Scene();

		// const fov = 45;
		// const aspect = 2; // the canvas default
		// const near = 0.1;
		// const far = 50;
		// const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
		// camera.position.set( 0, 0, 1 );
		// camera.lookAt( 0, 0, 0 );
		// scene.add( camera );

		// return { scene, camera };

	}

	const sceneInitFunctionsByName = {
		// 'box': ( elem ) => {

		// 	// const { scene, camera } = makeScene( elem );
		// 	const scene = mainScene;
		// 	const camera = mainCamera;
		// 	const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		// 	const material = new THREE.MeshPhongMaterial( { color: 'red' } );
		// 	const mesh = new THREE.Mesh( geometry, material );
		// 	scene.add( mesh );
		// 	return ( time, rect ) => {

		// 		mesh.rotation.y = time * .1;
		// 		camera.aspect = rect.width / rect.height;
		// 		camera.updateProjectionMatrix();
		// 		renderer.render( scene, camera );

		// 	};

		// },
		// 'pyramid': ( elem ) => {

		// 	// const { scene, camera } = makeScene( elem );
		// 	const scene = mainScene;
		// 	const camera = mainCamera;
		// 	const radius = .8;
		// 	const widthSegments = 4;
		// 	const heightSegments = 2;
		// 	const geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
		// 	const material = new THREE.MeshPhongMaterial( {
		// 		color: 'blue',
		// 		flatShading: true,
		// 	} );
		// 	const mesh = new THREE.Mesh( geometry, material );
		// 	scene.add( mesh );
		// 	return ( time, rect ) => {

		// 		mesh.rotation.y = time * .1;
		// 		camera.aspect = rect.width / rect.height;
		// 		camera.updateProjectionMatrix();
		// 		renderer.render( scene, camera );

		// 	};

		// },
        'edgeBounce': ( elem ) => {

			// const { scene, camera } = makeScene( elem );
			const scene = mainScene;
			// const camera = mainCamera;

            //images must have width and height attributes, or wait until loaded
            const img = elem.querySelector('img');
            if (!img) {
                console.warn('No image found in element', elem);
                return;
            }

            // Create a texture from the image
            const texture = new THREE.TextureLoader().load(img.src);
			const rect = elem.getBoundingClientRect();
			const { left, right, top, bottom, width, height } = rect;
			console.log(rect)

            const material = new THREE.ShaderMaterial( {
                uniforms: {
                    uResolution: { value: new THREE.Vector2(width, height) },
                    uTime: { value: 0 },
                    uMouse: { value: new THREE.Vector2() },
                    uTexture: { value: texture },
                    uPoint: { value: new THREE.Vector3() },
                    uOffset: { value: new THREE.Vector2(elem.offsetLeft, elem.offsetTop) },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                opacity: 0,
            })

            const testMaterial = new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: .5 });

            // Create a plane geometry matching the image dimensions
            const geometry = new THREE.PlaneGeometry(width, height, 1, 1)

            // Create a plane mesh with the image texture and add to the scene
            const plane = new THREE.Mesh(geometry, testMaterial)
            plane.position.set(mainCamera.right - left - width/2, mainCamera.top - top - height/2 + 100, counter--)

            scene.add(plane)

            // Hide the original image element
            img.style.opacity = .3;

            // img.addEventListener('mouseenter', this.onCardEnter);
            // img.addEventListener('mouseleave', this.onCardLeave);

            // The returned function is called on render
			return ( time, rect ) => {

				material.uniforms.uTime.value = time;
                const positiveYUpBottom = renderer.domElement.clientHeight - rect.bottom;
                material.uniforms.uOffset.value = new THREE.Vector2(rect.left, positiveYUpBottom )
				// camera.aspect = rect.width / rect.height;
				// camera.updateProjectionMatrix();
				// renderer.render( scene, camera );

			};
		},
	};

	document.querySelectorAll( '[data-mx-shader]' ).forEach( ( elem ) => {

		const sceneName = elem.getAttribute('data-mx-shader');
        if (!sceneName) return;
		const sceneInitFunction = sceneInitFunctionsByName[ sceneName ];
		const sceneRenderFunction = sceneInitFunction( elem );
		addScene( elem, sceneRenderFunction );

	} );

	function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = window.innerWidth;
		const height = document.documentElement.scrollHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

	const clearColor = new THREE.Color( '#000' );
	function render( time ) {

		time *= 0.001;

		resizeRendererToDisplaySize( renderer );

		// renderer.setScissorTest( false );
		// renderer.setClearColor( clearColor, 0 );
		// renderer.clear( true, true );
		// renderer.setScissorTest( true );

		// const transform = `translateY(${window.scrollY}px)`;
		// renderer.domElement.style.transform = transform;

		for ( const { elem, fn } of sceneElements ) {

			// get the viewport relative position of this element
			const rect = elem.getBoundingClientRect();
			const { left, right, top, bottom, width, height } = rect;

			const isOffscreen =
                bottom < 0 ||
                top > renderer.domElement.clientHeight ||
                right < 0 ||
                left > renderer.domElement.clientWidth;

			if ( true ) {

				const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
				// renderer.setScissor( left, positiveYUpBottom, width, height );
				// renderer.setViewport( left, positiveYUpBottom, width, height );
				// renderer.setScissor( left - width/2, positiveYUpBottom, width * 2, height * 2 );
				// renderer.setViewport( left - width/2, positiveYUpBottom, width * 2, height * 2 );

				fn( time, rect );

			}
            

		}

		// mainCamera.aspect = rect.width / rect.height;
		mainCamera.updateProjectionMatrix();
		renderer.render( mainScene, mainCamera );

		requestAnimationFrame( render );

	}

	requestAnimationFrame( render );

}
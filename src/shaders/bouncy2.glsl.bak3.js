import * as THREE from 'three'
import { vertexShader as vertexShaderBouncy, fragmentShader as fragmentShaderBouncy } from '../shaders/bouncy2.glsl.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
export default class ScrollRig {
    constructor(rig, itemSelector = '[data-mx-shader]') {

        if (!rig) {
            console.error('ScrollRig: No rig element provided');
            return;
        }

        this.rig = rig;
        this.scrollerItems = [];

        // Initialize scroller elements
        this.scroller = document.createElement('div');
        this.scroller.classList.add('scroller');
        this.rig.appendChild(this.scroller);
        this.rigItems = rig.querySelectorAll(itemSelector);

        // Bind methods
        this.update = this.update.bind(this);
        this.onResize = this.onResize.bind(this);

        this.init();
    }

    init() {
        this.initThree();
        window.addEventListener('resize', this.onResize)
        window.addEventListener('mousemove', this.onMouseMove)
        window.addEventListener('scroll', this.onMouseMove)
        window.requestAnimationFrame(this.update)
    }

    initThree() {
        // Create a scene
        this.scene = new THREE.Scene({ alpha: true })
        
        // Create a camera matching size of scroller
        this.camera = new THREE.OrthographicCamera( 
            this.scroller.offsetWidth / -2, 
            this.scroller.offsetWidth / 2, 
            this.scroller.offsetHeight / 2, 
            this.scroller.offsetHeight / -2, 
            1, 
            1000 
        )
        this.camera.position.set(0, 0, 10)
        
        // Create a renderer and attach to a dom element
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.domElement.width = '100%';
        this.renderer.domElement.height = '100%';
        this.renderer.setClearColor( 0x000000, 0 );
        this.renderer.setSize(this.scroller.offsetWidth, this.scroller.offsetHeight)
        this.scroller.appendChild(this.renderer.domElement)

        this.initScrollerItems();
    }
    
    initScrollerItems() {
        // Remove any existing scroller items
        this.scrollerItems.forEach(item => {
            if (item.plane) {
                this.scene.remove(item.plane);
            }
        })
        this.scrollerItems = [];
        
        // Set up individual scroller items
        this.rigItems.forEach((item, i) => {
            //images must have width and height attributes, or wait until loaded
            const img = item.querySelector('img');

            // Create a texture from the image
            const texture = new THREE.TextureLoader().load(img.src);
            const rect = item.getBoundingClientRect();
			let { left, right, top, bottom, width, height } = rect;

            // Shader material
            if (item.material) {
                item.material.uniforms.uResolution.value = new THREE.Vector2(width, height);
                item.material.uniforms.uWindow.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
            } else {
                item.material = new THREE.ShaderMaterial( {
                    uniforms: {
                        uTime: { value: 0 },
                        uMouse: { value: new THREE.Vector2() },
                        uTexture: { value: texture },
                        uResolution: { value: new THREE.Vector2(width, height) },
                        uEffect: { value: new THREE.Vector4() },
                        uMouse: { value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
                        uWindow: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                        uBorderRadius: { value: .04 }
                    },
                    vertexShader: vertexShaderBouncy,
                    fragmentShader: fragmentShaderBouncy,

                    transparent: true,
                    opacity: 0,
                })
            }            
            // const testMaterial = new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: .5 });
            // Create a plane geometry matching the image dimensions
            const geometry = new THREE.PlaneGeometry(width * 2 ,  height * 2 , 1, 1)

            // Create a plane mesh with the image texture and add to the scene
            const plane = new THREE.Mesh(geometry, item.material)

            plane.position.set(this.camera.left + width/2 + left, this.camera.top - top - height/2 - window.pageYOffset, -i)
            this.scene.add(plane)

            // Hide the original image element
            img.style.opacity = .0;

            const thisObj = this.scrollerItems.push({
                // DOM element
                ele: item,
                img,
                rect,

                // Three.js objects
                geometry,
                plane,
                texture,
                material: item.material,
            });

            const onEnter = (e) => {
                // if (item.material.uniforms.uEffect.value.z > 0) return;
                const rect = item.getBoundingClientRect();
                item.material.uniforms.uTime.value = 0;
                item.material.uniforms.uEffect.value = new THREE.Vector4( event.clientX - rect.left, rect.top - event.clientY, 60, -1 );

                console.log(item.material.uniforms.uWindow.value, item.material.uniforms.uResolution.value);

            }
            const onLeave = (e) => {
                // if (item.material.uniforms.uEffect.value.z > 0) return;
                const rect = item.getBoundingClientRect();
                item.material.uniforms.uTime.value = 0;
                item.material.uniforms.uEffect.value = new THREE.Vector4( event.clientX - rect.left, rect.top - event.clientY, 60, 1 );
            }
            img.addEventListener('mouseenter', onEnter);
            img.addEventListener('mouseleave', onLeave);
        })
    }

    update() {
        this.scrollerItems.forEach(item => {
            let curUEffect = item.material.uniforms.uEffect.value;
            item.material.uniforms.uTime.value += 1;
            item.material.uniforms.uEffect.value = new THREE.Vector4(curUEffect.x, curUEffect.y, Math.max(0, curUEffect.z - 1), curUEffect.w);
        })
        
        // Render the scene
        this.renderer.render(this.scene, this.camera)
        // this.composer.render();

        
        // Request next frame of animation
        requestAnimationFrame(this.update)
    }

    onResize() {

        // Update the camera and renderer when the screen is resized
        this.camera.left = this.scroller.offsetWidth / -2;
        this.camera.right = this.scroller.offsetWidth / 2;
        this.camera.top = this.scroller.offsetHeight / 2;
        this.camera.bottom = this.scroller.offsetHeight / -2;
        this.camera.updateProjectionMatrix()

        this.initScrollerItems();
        
        this.renderer.setSize(this.scroller.offsetWidth, this.scroller.offsetHeight)

        this.update()
    }
}
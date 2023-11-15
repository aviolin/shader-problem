import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/test2.glsl.js';
import { vertexShader as vertexShaderBuffer, fragmentShader as fragmentShaderBuffer } from '../shaders/buffer.glsl.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
        this.mouse = new THREE.Vector2();

        // Bind methods
        this.update = this.update.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onCardEnter = this.onCardEnter.bind(this);
        this.onCardLeave = this.onCardLeave.bind(this);

        this.init();
    }

    init() {
        this.initThree();
        window.addEventListener('resize', this.onResize)
        window.addEventListener('mousemove', this.onMouseMove)
        window.addEventListener('scroll', this.onMouseMove)
        document.addEventListener('click', this.onMouseClick)
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
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.domElement.width = '100%';
        this.renderer.domElement.height = '100%';
        this.renderer.setClearColor( 0x000000, 0 );
        this.renderer.setSize(this.scroller.offsetWidth, this.scroller.offsetHeight)
        this.scroller.appendChild(this.renderer.domElement)

        this.composer = new EffectComposer( this.renderer );
        const renderPass = new RenderPass( scene, camera );
        this.composer.addPass( renderPass );

        const smaaPass = new SMAAPass();
        this.composer.addPass( smaaPass );

        const outputPass = new OutputPass();
        this.composer.addPass( outputPass );

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

            const width = img.offsetWidth
            const height = img.offsetHeight
            const left =  img.offsetLeft;
            const top = img.offsetTop

            // Shader material
            if (item.material) {
                item.material.uniforms.uResolution.value = new THREE.Vector2(width, height);
            } else {
                item.material = new THREE.ShaderMaterial( {
                    uniforms: {
                        uResolution: { value: new THREE.Vector2(width, height) },
                        uTime: { value: 0 },
                        uMouse: { value: new THREE.Vector2() },
                        uTexture: { value: texture },
                        uPoint: { vlaue: new THREE.Vector3() },
                    },
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    opacity: 0,
                })
            }

            // Create a plane geometry matching the image dimensions
            const geometry = new THREE.PlaneGeometry(width * 2,  height * 2, 1, 1)

            // Create a plane mesh with the image texture and add to the scene
            const plane = new THREE.Mesh(geometry, item.material)

            plane.position.set(this.camera.right - left - width/2, this.camera.top - top - height/2, i)
            this.scene.add(plane)

            // Hide the original image element
            // img.style.opacity = 0;

            this.scrollerItems.push({
                // DOM element
                ele: item,
                img,
                width,
                height,
                left,
                top,

                // Three.js objects
                geometry,
                plane,
                texture,
                material: item.material,
            });

            img.addEventListener('mouseenter', this.onCardEnter);
            img.addEventListener('mouseleave', this.onCardLeave);
        })
    }

    update() {
        // Update the time uniform on each shader material
        this.scrollerItems.forEach(item => {
            item.material.uniforms.uTime.value += 1; //make more accurate timer
        })
        
        // Render the scene
        // this.renderer.render(this.scene, this.camera)
        this.composer.render();
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
        this.renderTarget.setSize(this.scroller.offsetWidth, this.scroller.offsetHeight)

        this.update()
    }

    onMouseMove(event) {
        this.scrollerItems.forEach((item,i) => {
            if (event.clientX) {
                // Save the current mouse position on page
                this.mouse.x = event.clientX;
                this.mouse.y = this.scroller.offsetHeight - event.clientY - window.pageYOffset;
            }
            item.material.uniforms.uMouse.value = new THREE.Vector2( this.mouse.x, this.mouse.y);
        })
    }

    // Effect specific methods

    onMouseClick(event) {
        // this.customPass.uniforms.uPoint.value = new THREE.Vector3(event.clientX, this.scroller.offsetHeight - event.clientY - window.pageYOffset, 60);
        // this.customPass.uniforms.time.value = 0;
    }

    onCardEnter(event) {
        // this.customPass.uniforms.uPoint.value = new THREE.Vector3(event.clientX, this.scroller.offsetHeight - event.clientY - window.pageYOffset, 60);
        // this.customPass.uniforms.time.value = 0;
        // console.log('enter', event)
    }

    onCardLeave(event) {
        // this.customPass.uniforms.uPoint.value = new THREE.Vector3(event.clientX, this.scroller.offsetHeight - event.clientY - window.pageYOffset, 60);
        // this.customPass.uniforms.time.value = 0;
        // console.log('leave', event)
    }
}
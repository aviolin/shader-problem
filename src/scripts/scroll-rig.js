import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/test.glsl.js';
import { vertexShader as vertexShaderBuffer, fragmentShader as fragmentShaderBuffer } from '../shaders/buffer.glsl.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CustomShader } from '../shaders/postprocessing.glsl.js';

export default class ScrollRig {
    constructor(rig, itemSelector = '[data-card]') {

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
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.domElement.width = '100%';
        this.renderer.domElement.height = '100%';
        this.renderer.setClearColor( 0x000000, 0 );
        this.renderer.setSize(this.scroller.offsetWidth, this.scroller.offsetHeight)
        this.scroller.appendChild(this.renderer.domElement)

        this.initBuffers();

        this.initPostProcessing();

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
        this.rigItems.forEach((item) => {
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
                item.material.uniforms.resolution.value = new THREE.Vector2(width, height);
            } else {
                item.material = new THREE.ShaderMaterial( {
                    uniforms: {
                        time: { value: 0 },
                        mouse: { value: new THREE.Vector2() },
                        image: {
                            value: texture
                        },
                        resolution: {
                            value: new THREE.Vector2(width, height)
                        },
                        bufferTexture: { 
                            value: null 
                        },
                    },
                    vertexShader,
                    fragmentShader,
                })
            }

            // Create a plane geometry matching the image dimensions
            const geometry = new THREE.PlaneGeometry(width, height, 1, 1)

            // Create a plane mesh with the image texture and add to the scene
            const plane = new THREE.Mesh(geometry, item.material)

            plane.position.set(this.camera.right - left - width/2, this.camera.top - top - height/2, 0)
            this.scene.add(plane)

            // Hide the original image element
            img.style.visibility = 'hidden';

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
        })
    }

    initPostProcessing() {
        // Post processing
        this.composer = new EffectComposer( this.renderer );

        // Get the scene as a texture
        this.renderPass = new RenderPass( this.scene, this.camera );
        this.composer.addPass( this.renderPass );

        // Apply custom shader to render pass
        this.customPass = new ShaderPass( CustomShader );
        this.customPass.uniforms.resolution.value = new THREE.Vector2( this.scroller.offsetWidth, this.scroller.offsetHeight );
        this.composer.addPass( this.customPass );        

        // Output final render
        this.outputPass = new OutputPass();
        this.composer.addPass( this.outputPass );
    }

    initBuffers() {
        // Create a buffer scene
        this.bufferScene = new THREE.Scene({ alpha: true });

        // Create a render target to buffer the scene to
        this.renderTarget = new THREE.WebGLRenderTarget(this.scroller.offsetWidth, this.scroller.offsetHeight);

        // Buffer Shader material
        const texture = new THREE.TextureLoader().load("../../dist/assets/grid.png");
        this.bufferMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                time: { value: 0 },
                mouse: { value: new THREE.Vector2() },
                image: {
                    value: texture
                },
                resolution: {
                    value: new THREE.Vector2(this.scroller.offsetWidth, this.scroller.offsetHeight)
                },
            },
            vertexShader: vertexShaderBuffer,
            fragmentShader: fragmentShaderBuffer,
        })

        // Set up buffer scene
        const geometry = new THREE.PlaneGeometry(this.scroller.offsetWidth, this.scroller.offsetHeight, 10, 10)
        const plane = new THREE.Mesh(geometry, this.bufferMaterial)
        this.bufferScene.add(plane)
    }

    update() {
        // First, render the scene to a buffer texture
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.bufferScene,this.camera)
        
        // Update the time uniform on each shader material  (EXTRACT OUT)
        this.scrollerItems.forEach(item => {
            item.material.uniforms.time.value += 1;
            // item.material.uniforms.bufferTexture.value = this.renderTarget.texture;
        })

        // Update the time uniform on the custom postprocessing shader
        this.customPass.uniforms.time.value += 1;

        // Update the bufferTexture with the render target texture
        this.customPass.uniforms.bufferTexture.value = this.renderTarget.texture;

        // Remove render target
        this.renderer.setRenderTarget(null);
        
        // Render the scene
        // this.renderer.render(this.scene, this.camera)
        this.composer.render(); // use postprocessing
        
        // Request next frame of animation
        requestAnimationFrame(this.update)
    }

    onResize() {
        this.customPass.uniforms.resolution.value = new THREE.Vector2( this.scroller.offsetWidth, this.scroller.offsetHeight );

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
                this.mouse.x = event.clientX;
                this.mouse.y = this.scroller.offsetHeight - event.clientY - window.pageYOffset;
            }
            item.material.uniforms.mouse.value = new THREE.Vector2( this.mouse.x, this.mouse.y);
            this.customPass.uniforms.mouse.value = new THREE.Vector2( this.mouse.x, this.mouse.y);
        })
    }
}
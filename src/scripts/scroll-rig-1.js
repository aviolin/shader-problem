import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/test2.glsl.js';
import { vertexShader as vertexShaderBouncy, fragmentShader as fragmentShaderBouncy } from '../shaders/bouncy.glsl.js';

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
            } else {
                item.material = new THREE.ShaderMaterial( {
                    uniforms: {
                        uTime: { value: 0 },
                        uMouse: { value: new THREE.Vector2() },
                        uTexture: { value: texture },
                        uResolution: { value: new THREE.Vector2(width, height) },
                        uPoint: { value: new THREE.Vector3() },
                    },
                    vertexShader: vertexShaderBouncy,
                    fragmentShader: fragmentShaderBouncy,
                    // vertexShader,
                    // fragmentShader,

                    transparent: true,
                    opacity: 0,
                })
            }            
            const testMaterial = new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: .5 });


            // Create a plane geometry matching the image dimensions
            const geometry = new THREE.PlaneGeometry(width * 2 ,  height * 2 , 1, 1)

            // Create a plane mesh with the image texture and add to the scene
            const plane = new THREE.Mesh(geometry, item.material)

            plane.position.set(this.camera.left + width/2 + left, this.camera.top - top - height/2 - window.pageYOffset, -i)
            this.scene.add(plane)

            // Hide the original image element
            img.style.opacity = 0;

            this.scrollerItems.push({
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
                item.material.uniforms.uPoint.value = new THREE.Vector3(event.clientX, this.scroller.offsetHeight - event.clientY - window.pageYOffset, 60);
                item.material.uniforms.uTime.value = 0;
            }
            const onLeave = (e) => {
                item.material.uniforms.uPoint.value = new THREE.Vector3(event.clientX, this.scroller.offsetHeight - event.clientY - window.pageYOffset, 60);
                item.material.uniforms.uTime.value = 0;
            }
            const onClick = (e) => {
                // item.material.uniforms.uPoint.value = new THREE.Vector3(event.clientX, this.scroller.offsetHeight - event.clientY - window.pageYOffset, 60);
                item.material.uniforms.uTime.value = 0;

                this.mouse.x = event.clientX;
                this.mouse.y = event.clientY;
                
                // item.material.uniforms.uMouse.value = new THREE.Vector2( -(left - this.mouse.x), (top - this.mouse.y - window.pageYOffset));
            }
            img.addEventListener('mouseenter', onEnter);
            img.addEventListener('mouseleave', onLeave);
            img.addEventListener('click', onClick);
        })
    }

    update() {
        // Update the time uniform on each shader material  (EXTRACT OUT)
        this.scrollerItems.forEach(item => {
            item.material.uniforms.uTime.value += 1;
            // item.material.uniforms.bufferTexture.value = this.renderTarget.texture;
        })

        // let curUPoint = this.customPass.uniforms.uPoint.value;
        // this.customPass.uniforms.uPoint.value = new THREE.Vector3(curUPoint.x, curUPoint.y,Math.max(0, curUPoint.z - 1));
        
        // Render the scene
        this.renderer.render(this.scene, this.camera)
        
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

    onMouseMove(event) {
        this.scrollerItems.forEach((item,i) => {
            if (event.clientX) {
                this.mouse.x = event.clientX;
                this.mouse.y = event.clientY;
            }
            const rect = item.ele.getBoundingClientRect();
            item.material.uniforms.uMouse.value = new THREE.Vector2( this.mouse.x - rect.left, rect.top - this.mouse.y );
        })
    }

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
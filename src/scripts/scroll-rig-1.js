import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'dat.gui';
import { vertexShader as vertexShaderBouncy, fragmentShader as fragmentShaderBouncy } from '../shaders/bouncy2.glsl.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';

// Easing functions
const lerp = ( a, b, alpha ) => {
    return a + alpha * ( b - a )
}
const easeIn = (t) => {
    return Math.pow(t, 2);
}
const flip = (x) => {
    return 1 - x;
}
const easeOut = (t) => {
    return flip(Math.pow(flip(t), 2));
}
const easeInOut = (t) => {
    return lerp(easeIn(t), easeOut(t), t);
}

const defaultOptions = {
    antialias: true,
    itemSelector: '[data-mx-shader]',
    rig: null,
    elementOpacity: 0,
    allowScaling: true,
    allowRotation: true,
    debug: false,
}

let taaRenderPass, renderPass;
let index = 0;
console.log(THREE.REVISION); 
export default class ScrollRig {
    constructor( options = {} ) {
        this.opts = Object.assign({}, defaultOptions, options);

        if (!this.opts.rig) {
            console.error('ScrollRig: No rig element provided');
            return;
        }

        this.scrollerItems = [];
        this.stats = null;

        // Initialize scroller elements
        this.scroller = document.createElement('div');
        this.scroller.classList.add('scroller');
        this.opts.rig.appendChild(this.scroller);
        this.rigItems = this.opts.rig.querySelectorAll(this.opts.itemSelector);

        // Bind methods
        this.update = this.update.bind(this);
        this.onResize = this.onResize.bind(this);

        this.shaderOpts = {
            warpFactor: 40.,
            warpRadius: 5.,
            deceleration: 7.,
            density: 25.,
        }
        this.scaleOpts = {
            amount: .15,
            speed: .04,
        }

        this.init();
    }

    init() {
        this.initThree();
        window.addEventListener('resize', this.onResize)
        window.requestAnimationFrame(this.update)
        this.initDebug();
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
        this.renderer = new THREE.WebGLRenderer({});
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.domElement.width = '100%';
        this.renderer.domElement.height = '100%';
        this.renderer.setClearColor( 0x000000, 0 );
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        // this.renderer.toneMappingExposure = 1

        this.renderer.setSize(this.scroller.offsetWidth, this.scroller.offsetHeight)
        this.renderer.autoClear = false;
        this.scroller.appendChild(this.renderer.domElement)

        if (this.opts.antialias) {
            this.composer = new EffectComposer( this.renderer );

            if (this.opts.antialias === 'taa') {
                // TAA antialiasing
                taaRenderPass = new TAARenderPass( this.scene, this.camera );
                taaRenderPass.unbiased = false;
                taaRenderPass.sampleLevel = 2;
                
                renderPass = new RenderPass( this.scene, this.camera );
                renderPass.enabled = false;
                
                const outputPass = new OutputPass();

                this.composer.addPass( taaRenderPass );
                this.composer.addPass( renderPass );
                this.composer.addPass( outputPass );
            } else if (this.opts.antialias === 'fxaa') {
                // FXAA antialiasing
                const renderPass = new RenderPass( this.scene, this.camera );
                renderPass.clearAlpha = 0;
                const fxaaPass = new ShaderPass( FXAAShader );
                const outputPass = new OutputPass();
        
                const pixelRatio = this.renderer.getPixelRatio();
        
                fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( this.scroller.offsetWidth * pixelRatio );
                fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( this.scroller.offsetHeight * pixelRatio );
        
                this.composer.addPass( renderPass );
                this.composer.addPass( outputPass );
                this.composer.addPass( fxaaPass );
            } else {
                const size = this.renderer.getDrawingBufferSize( new THREE.Vector2() );
				const renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, { samples: 4, type: THREE.HalfFloatType } );

				const renderPass = new RenderPass( this.scene, this.camera );
				const outputPass = new OutputPass();

                this.composer = new EffectComposer( this.renderer, renderTarget );
				this.composer.addPass( renderPass );
				this.composer.addPass( outputPass );
            }
        }

        this.initScrollerItems();
    }

    initDebug() {
        this.stats = new Stats()
        document.body.appendChild(this.stats.dom)

        const gui = new GUI()
        const cubeFolder = gui.addFolder('Shader Effect')
        cubeFolder.add(this.shaderOpts, 'warpFactor', -1000, 2000)
            .onChange(() => {
                this.scrollerItems.forEach(item => {
                    item.material.uniforms.uOptions.value.x = this.shaderOpts.warpFactor;
                })
            })
        cubeFolder.add(this.shaderOpts, 'warpRadius', 0, 50)
            .onChange(() => {
                this.scrollerItems.forEach(item => {
                    item.material.uniforms.uOptions.value.y = this.shaderOpts.warpRadius;
                })
            })
        cubeFolder.add(this.shaderOpts, 'deceleration', 0,50)
            .onChange(() => {
                this.scrollerItems.forEach(item => {
                    item.material.uniforms.uOptions.value.z = this.shaderOpts.deceleration;
                })
            })
        cubeFolder.add(this.shaderOpts, 'density', 0, 200)
            .onChange(() => {
                this.scrollerItems.forEach(item => {
                    item.material.uniforms.uOptions.value.w = this.shaderOpts.density;
                })
            })
        cubeFolder.open()

        const scaleFolder = gui.addFolder('Scaling Effect')
        scaleFolder.add(this.scaleOpts, 'speed', 0, .1, .001)
        scaleFolder.add(this.scaleOpts, 'amount', 0, 1, .01)
        scaleFolder.open()
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
            // Elements must have width and height attributes, or wait until loaded
            const img = item.querySelector('img');
            const video = item.querySelector('video');
            const mediaElement = img || video;

            // Get position and size of element
            const rect = item.getBoundingClientRect();
			let { left, right, top, bottom, width, height } = rect;

           

            // Create a texture from the image
            let texture = null;
            if (img) {
                texture = new THREE.TextureLoader().load(img.src)
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.anisotropy = 1;
                texture.maxAnisotropy = 10000;
                texture.generateMipmaps = false;
                texture.colorSpace = THREE.SRGBColorSpace;
            } else if (video) {
                texture = new THREE.VideoTexture(
                    video,
                    THREE.UVMapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.LinearFilter,
                    THREE.LinearFilter,
                    THREE.RGBAFormat,
                    THREE.UnsignedByteType,
                    4
                );
                texture.generateMipmaps = true;
                texture.premultiplyAlpha = true;
                texture.colorSpace = THREE.SRGBColorSpace;
            }

             // Shader material
             if (item.material) {
                // On resize update uniforms
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
                        uBorderRadius: { value: .4 },
                        uScale: { value: 1 },
                        uOptions: { value: new THREE.Vector4( this.shaderOpts.warpFactor, this.shaderOpts.warpRadius, this.shaderOpts.deceleration, this.shaderOpts.density )}
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
            
            // Hide original element
            mediaElement.style.opacity = this.opts.elementOpacity;
            
            let isHovering = false;
            let curScale = 0;

            const update = () => {
                let curUEffect = item.material.uniforms.uEffect.value;
                item.material.uniforms.uTime.value += 1;
                item.material.uniforms.uEffect.value = new THREE.Vector4(curUEffect.x, curUEffect.y, Math.max(0, curUEffect.z - 1), curUEffect.w);                

                if (isHovering) {
                    if (curScale < 1) {
                        curScale += this.scaleOpts.speed;
                        item.material.uniforms.uScale.value = 1 + easeInOut(curScale) * this.scaleOpts.amount;
                        console.log(item.material.uniforms.uScale.value)
                    }
                } else {
                    if (curScale > 0) {
                        curScale -= this.scaleOpts.speed;
                        item.material.uniforms.uScale.value = 1 + easeInOut(curScale) * this.scaleOpts.amount;
                        console.log(item.material.uniforms.uScale.value)
                    }
                }
            }
            const onEnter = (e) => {
                // if (item.material.uniforms.uEffect.value.z > 0) return;
                const rect = item.getBoundingClientRect();
                item.material.uniforms.uTime.value = 0;
                item.material.uniforms.uEffect.value = new THREE.Vector4( event.clientX - rect.left, rect.top - event.clientY, 60, -1 );
                item.material.uniforms.uScale.value = 1;

                isHovering = true;
                curScale = 0;
            }
            const onLeave = (e) => {
                // if (item.material.uniforms.uEffect.value.z > 0) return;
                const rect = item.getBoundingClientRect();
                item.material.uniforms.uTime.value = 0;
                item.material.uniforms.uEffect.value = new THREE.Vector4( event.clientX - rect.left, rect.top - event.clientY, 60, 1 );

                isHovering = false;
            }
            mediaElement.addEventListener('mouseenter', onEnter);
            mediaElement.addEventListener('mouseleave', onLeave);

            const thisObj = this.scrollerItems.push({
                // DOM element
                ele: item,
                mediaElement,
                initialRect: rect,

                // Three.js objects
                geometry,
                plane,
                texture,
                material: item.material,

                update,
            });
        })
    }

    update() {
        this.scrollerItems.forEach(item => {

            // Update the position of the plane to match the position of the DOM element
            const rect = item.ele.getBoundingClientRect();
            let { left, right, top, bottom, width, height } = rect;
            item.plane.position.set(this.camera.left + width/2 + left, this.camera.top - top - height/2 - window.pageYOffset, -1)
           
            if (this.opts.allowRotation || this.opts.allowScaling) {
                const transform = item.ele.style.transform.split(' ');

                if (this.opts.allowRotation) {
                    // Update the rotation of the plane to match the rotation of the DOM element
                    const rotate = transform.find(t => t.includes('rotate'));
                    const rotateVal = rotate ? rotate.split('(')[1].split('deg')[0] : 0;
                    item.plane.rotation.z = -rotateVal * Math.PI / 180;
                }
    
                if (this.opts.allowScaling) {     
                    // Update the scale of the plane to match the scale of the DOM element
                    const scale = transform.find(t => t.includes('scale'));
                    const scaleVal = scale ? parseFloat(scale.split('(')[1].split(')')[0]) : 1;
                    item.plane.scale.x = item.initialRect.width * (scaleVal / item.initialRect.width);
                    item.plane.scale.y = item.initialRect.height * (scaleVal / item.initialRect.height);
                }
            }
            item.update()

            if (this.opts.debug && this.stats) {
                this.stats.update()
            }
        })
        
        // Render the scene
        if (this.opts.antialias) {
            if (this.opts.antialias == 'taa') {
                index ++;
                if ( Math.round( index / .5 ) % 2 === 0 ) {
                    if ( taaRenderPass ) taaRenderPass.accumulate = false;
                } else {
                    if ( taaRenderPass ) taaRenderPass.accumulate = true;
                }
            }
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera)
        }
        
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
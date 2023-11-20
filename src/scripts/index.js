import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from '@studio-freight/lenis';

import ScrollRig from "./scroll-rig-1";



gsap.registerPlugin(ScrollTrigger);




document.addEventListener('DOMContentLoaded', () => {
    // Lenis smoothscroll, using window so it's accessible in other scripts
    window.mx = {};
    window.mx.lenis = new Lenis({
        lerp: 0,
    })
    function raf(time) {
        window.mx.lenis.raf(time)
        requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    window.mx.lenis.on("scroll", () => {
        ScrollTrigger.update();
    });
    window.addEventListener('resize', () => {
        window.mx.lenis.resize();
    })

    let scrollRig = new ScrollRig( {
        rig: document.querySelector('.scroll-rig'),
        antialias: null,
        debug: true,
        elementOpacity: .3,
    } );
})



const scrollTriggerTests = document.querySelectorAll('[data-test]');
scrollTriggerTests.forEach( (test) => {
    if (test.dataset.test === 'move') {
        const tl = gsap.timeline({
            repeat: -1,
            yoyo: true,
        })
        tl.to(test, {
            x: -500,
            // scale: .3,
            duration: 3,
            ease: 'ease.inOut'
        })
    } else {
        gsap.from(test, {
            y: 500,
            x: -500,
            scale: .3,
            duration: 3,
            rotate: 360,
        })
    }
})
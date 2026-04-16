import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer = null;
let camera = null;
let controls = null;
let sceneRef = null;
let animationId = null;
let resizeHandler = null;

function getCanvas() {
    return document.querySelector('#three-ex');
}

function stopNingyouScene() {
    const canvas = getCanvas();

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (controls) {
        controls.dispose();
        controls = null;
    }

    if (renderer) {
        renderer.dispose();
        renderer = null;
    }

    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }

    camera = null;
    sceneRef = null;

    if (canvas) {
        canvas.style.display = 'none';
    }
}

function initNingyouScene() {
    const canvas = getCanvas();
    if (!canvas) return;

    stopNingyouScene();

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

    const lightGray = new THREE.MeshBasicMaterial({ color: 0xcfcfcf });
    const midGray = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const darkGray = new THREE.MeshBasicMaterial({ color: 0x7f7f7f });
    const redMat = new THREE.MeshBasicMaterial({ color: 0x76373c });

    const blocks = [
        { x: -5.0, y: 0.0, z: 0, w: 3.2, h: 3.8, d: 1.0, mat: lightGray },
        { x: -4.2, y: 0.3, z: 0.2, w: 2.2, h: 2.5, d: 1.0, mat: midGray },
        { x: -2.0, y: 1.8, z: 0, w: 2.4, h: 3.0, d: 1.0, mat: midGray },
        { x: 0.0, y: 0.2, z: 0, w: 3.4, h: 3.4, d: 1.0, mat: darkGray },
        { x: 2.2, y: 2.0, z: 0, w: 1.3, h: 3.5, d: 1.0, mat: darkGray },
        { x: 2.8, y: -1.7, z: 0, w: 3.3, h: 1.2, d: 1.0, mat: darkGray },
        { x: -0.8, y: -2.3, z: 0, w: 3.0, h: 1.0, d: 1.0, mat: midGray },
    ];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9e9e9);
    sceneRef = scene;

    const grayGroup = new THREE.Group();
    scene.add(grayGroup);

    for (const b of blocks) {
        const mesh = new THREE.Mesh(boxGeometry, b.mat);
        mesh.position.set(b.x, b.y, b.z);
        mesh.scale.set(b.w, b.h, b.d);
        grayGroup.add(mesh);
    }

    const redSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32),
        redMat
    );
    redSphere.position.set(-1.5, 0.5, 0.8);
    scene.add(redSphere);

    
    const container = canvas.parentElement || document.body;
    const sizes = {
        width: canvas.clientWidth || container.clientWidth || 300,
        height: canvas.clientHeight || container.clientHeight || 300,
    };

    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 18);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // Use device pixel ratio for crisper rendering and update the canvas style
    // so the displayed size matches the drawing buffer.
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(sizes.width, sizes.height, true);
    canvas.style.width = sizes.width + 'px';
    canvas.style.height = sizes.height + 'px';
    canvas.style.display = 'block';

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    function animate() {
        controls.update();
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
    }

    animate();

    resizeHandler = () => {
        const width = canvas.clientWidth || 300;
        const height = canvas.clientHeight || 300;

        if (!camera || !renderer) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    };

    window.addEventListener('resize', resizeHandler);
}

window.showNingyouVisual = function () {
    const canvas = getCanvas();

    if (!canvas) {
        console.error('#three-ex still not found in showNingyouVisual');
        return {
            remove() {}
        };
    }

    // Ensure the canvas is visible and placed correctly.
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%) scale(1)';
    canvas.style.pointerEvents = 'none';

    console.debug('showNingyouVisual called, canvas client size:', canvas.clientWidth, canvas.clientHeight);
    initNingyouScene();

    return {
        remove() {
            stopNingyouScene();
        }
    };
};
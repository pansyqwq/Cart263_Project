import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#three-ex');
const songSelect = document.querySelector('#songSelect');

let sceneStarted = false;

function initNingyouScene() {
    if (sceneStarted) return;
    sceneStarted = true;

    canvas.style.display = 'block';
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
        //these are all cubes 
    ];

    //SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9e9e9);

    //Group
    const grayGroup = new THREE.Group();
    scene.add(grayGroup);

    for (const b of blocks) {
        //Take each item inside blocks, one by one, and call it b
        //for every block description, create a block
        const mesh = new THREE.Mesh(boxGeometry, b.mat);

        mesh.position.set(b.x, b.y, b.z);
        mesh.scale.set(b.w, b.h, b.d);

        grayGroup.add(mesh);
    }

    // RED SPHERE
    const redSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32),
        redMat
    );
    redSphere.position.set(-1.5, 0.5, 0.8);
    scene.add(redSphere);

    // SIZES
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };


    // camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 18);
    scene.add(camera);

    // renderer
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height);

    // controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    // ANIMATE
    function animate() {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    });
}

function checkSong() {
    if (songSelect.value === 'sounds/TsumikinoNingyou.mp3') {
        canvas.style.display = 'block';
        initNingyouScene();
    } else {
        canvas.style.display = 'none';
    }
}

checkSong();
songSelect.addEventListener('change', checkSong);

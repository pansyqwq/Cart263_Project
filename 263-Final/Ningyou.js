import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let renderer = null;
let camera = null;
let controls = null;
let sceneRef = null;
let animationId = null;
let resizeHandler = null;
let modelRoot = null;
let blockStates = null;
let modelBaseScale = 1;

function getCanvas() {
  return document.querySelector("#three-ex");
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
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }

  camera = null;
  // Removes and disposes of any loaded GLTF model
  if (modelRoot && sceneRef) {
    try {
      sceneRef.remove(modelRoot);
    } catch (e) {}

    // Dispose geometries and materials
    modelRoot.traverse((node) => {
      if (node.isMesh) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const m = node.material;
          if (Array.isArray(m)) {
            m.forEach((mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (m.map) m.map.dispose();
            m.dispose();
          }
        }
      }
    });

    modelRoot = null;
    modelBaseScale = 1;
  }
  sceneRef = null;

  // Clears any block state
  blockStates = null;

  if (canvas) {
    canvas.style.display = "none";
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

  // Loads the external GLTF model and places it behind the block geometry
  try {
    const loader = new GLTFLoader();
    loader.load(
      "models/cubes.glb",
      (gltf) => {
        modelRoot = gltf.scene || gltf.scenes[0];
        if (!modelRoot) return;

        // Position the model slightly behind the blocks (lower z)
        modelRoot.position.set(0, -1.0, -2.5);
        // scale of the model
        modelRoot.scale.set(4.0, 4.0, 4.0);
        // record base scale so we can modulate it with audio
        modelBaseScale = modelRoot.scale.x || 1;
        modelRoot.traverse((n) => {
          if (n.isMesh) {
            n.receiveShadow = true;
            // Ensure GLB meshes render behind the procedural blocks
            n.renderOrder = 0;
            if (n.material) {
              n.material.depthTest = true;
              n.material.depthWrite = true;
            }
          }
        });

        // Inserts the model as a background element
        scene.add(modelRoot);
        // Ensures it renders behind the grayGroup by moving it to the back
        scene.children.unshift(scene.children.pop());
      },
      undefined,
      (err) => {
        console.warn("Failed to load models/cubes.glb", err);
      },
    );
  } catch (e) {
    console.warn("GLTFLoader not available or failed to load model", e);
  }

  // Builds meshes and per-block audio motion state
  blockStates = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const mesh = new THREE.Mesh(boxGeometry, b.mat);
    mesh.position.set(b.x, b.y, b.z);
    mesh.scale.set(b.w, b.h, b.d);
    // Makes the procedural blocks render above the loaded GLB
    mesh.renderOrder = 1;
    if (mesh.material) {
      mesh.material.depthTest = true;
      mesh.material.depthWrite = true;
    }
    grayGroup.add(mesh);

    // Per-block state for audio-driven motion
    blockStates.push({
      mesh,
      baseX: b.x,
      baseY: b.y,
      baseW: b.w,
      baseH: b.h,
      phase: Math.random() * Math.PI * 2,
      baseSpeed: 0.6 + Math.random() * 1.2 + i * 0.08,
      ampBase: 0.5 + i * 0.6 + Math.random() * 0.8,
      // Determines behavior by material reference
      type: b.mat === lightGray ? "light" : b.mat === midGray ? "mid" : "dark",
    });
  }

  const container = canvas.parentElement || document.body;
  const sizes = {
    width: canvas.clientWidth || container.clientWidth || 300,
    height: canvas.clientHeight || container.clientHeight || 300,
  };

  camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100,
  );
  camera.position.set(0, 0, 18);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // Use device pixel ratio for crisper rendering and update the canvas style
  // so the displayed size matches the drawing buffer.
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(sizes.width, sizes.height, true);
  canvas.style.width = sizes.width + "px";
  canvas.style.height = sizes.height + "px";
  canvas.style.display = "block";

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

  window.addEventListener("resize", resizeHandler);

  // Return an API so audio.js can call update(vol, dt)
  return {
    update(vol, dt) {
      if (!blockStates) return;

      // Scale the loaded GLB subtly based on audio volume
      if (modelRoot) {
        // +/-6% based on vol
        const scaleFactor = 1 + 0.06 * vol;
        const s = modelBaseScale * scaleFactor;
        modelRoot.scale.set(s, s, s);
      }

      for (const s of blockStates) {
        const speed = s.baseSpeed + vol * 2.0;
        const amp = s.ampBase * (0.4 + vol * 1.6);
        s.phase += speed * dt;

        const offset = Math.sin(s.phase) * amp;

        if (s.type === "light") {
          // move horizontally around baseX
          s.mesh.position.x = s.baseX + offset;
        } else if (s.type === "mid") {
          // move vertically around baseY
          s.mesh.position.y = s.baseY + offset;
        } else if (s.type === "dark") {
          // change scale subtly based on audio
          const scale = 1 + 0.06 * Math.abs(offset);
          s.mesh.scale.set(s.baseW * scale, s.baseH * scale, 1.0);
        }
      }
    },

    remove() {
      stopNingyouScene();
    },
  };
}

window.showNingyouVisual = function () {
  const canvas = getCanvas();

  if (!canvas) {
    console.error("#three-ex still not found in showNingyouVisual");
    return {
      remove() {},
    };
  }

  // Ensure the canvas is visible and placed correctly.
  canvas.style.display = "block";
  canvas.style.position = "absolute";
  canvas.style.top = "50%";
  canvas.style.left = "50%";
  canvas.style.transform = "translate(-50%, -50%) scale(1)";
  canvas.style.pointerEvents = "none";

  console.debug(
    "showNingyouVisual called, canvas client size:",
    canvas.clientWidth,
    canvas.clientHeight,
  );
  const visual = initNingyouScene();

  return {
    update:
      visual && typeof visual.update === "function" ? visual.update : undefined,
    remove() {
      stopNingyouScene();
    },
  };
};

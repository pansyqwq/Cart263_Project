import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let renderer = null;
let camera = null;
let sceneRef = null;
let animationId = null;
let resizeHandler = null;
let modelRoot = null;
let modelPivot = null;
let meshStates = null;

function getCanvas() {
  return document.querySelector("#three-ex");
}

function stopTosenboScene() {
  const canvas = getCanvas();

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
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

  // Dispose of the loaded GLTF model
  if (modelRoot && sceneRef) {
    try {
      sceneRef.remove(modelRoot);
    } catch (e) {}

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
  }
  sceneRef = null;
  meshStates = null;

  if (canvas) {
    canvas.style.display = "none";
  }
}

function initTosenboScene() {
  const canvas = getCanvas();
  if (!canvas) return;

  stopTosenboScene();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  sceneRef = scene;

  // Load the tosenbo.glb model
  try {
    const loader = new GLTFLoader();
    loader.load(
      "models/tosenbo.glb",
      (gltf) => {
        modelRoot = gltf.scene || gltf.scenes[0];
        if (!modelRoot) return;

        // Initialize mesh states for all child meshes
        meshStates = [];

        modelRoot.traverse((node) => {
          if (node.isMesh) {
            // Store base position and create animation state
            // Randomly choose direction: vertical or horizontal movement
            const direction = Math.random() > 0.5 ? "vertical" : "horizontal";
            meshStates.push({
              mesh: node,
              baseX: node.position.x,
              baseY: node.position.y,
              direction: direction,
              phase: Math.random() * Math.PI * 2,
              speed: 1.0 + Math.random() * 2.0,
              amplitude: 0.3 + Math.random() * 0.7,
            });

            // Ensure meshes render properly
            node.receiveShadow = true;
            if (node.material) {
              node.material.depthTest = true;
              node.material.depthWrite = true;
            }
          }
        });

        // Center the model around its own bounding box
        const bbox = new THREE.Box3().setFromObject(modelRoot);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        modelRoot.position.sub(center);

        // Scale the model larger
        modelRoot.scale.set(2.5, 2.5, 2.5);

        // Wrap in a pivot group so rotation stays centered in the viewport
        modelPivot = new THREE.Group();
        modelPivot.add(modelRoot);
        scene.add(modelPivot);
      },
      undefined,
      (err) => {
        console.warn("Failed to load models/tosenbo.glb", err);
      },
    );
  } catch (e) {
    console.warn("GLTFLoader not available or failed to load model", e);
  }

  // Setup camera
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
  camera.position.set(0, 0, 8.5);
  scene.add(camera);

  // Setup renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(sizes.width, sizes.height, true);
  canvas.style.width = sizes.width + "px";
  canvas.style.height = sizes.height + "px";
  canvas.style.display = "block";

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Animation loop without rotation
  function animate() {
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Handle window resize
  resizeHandler = () => {
    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 300;

    if (!camera || !renderer) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  window.addEventListener("resize", resizeHandler);

  // Return update API for audio.js
  return {
    update(vol, dt) {
      if (!meshStates) return;

      for (const state of meshStates) {
        const speed = state.speed + vol * 0.8;
        const amp = state.amplitude * (0.5 + vol * 0.6);
        state.phase += speed * dt;

        // Move mesh based on its direction (vertical or horizontal)
        const offset = Math.sin(state.phase) * amp;
        if (state.direction === "vertical") {
          state.mesh.position.y = state.baseY + offset;
        } else {
          state.mesh.position.x = state.baseX + offset;
        }
      }
    },

    remove() {
      stopTosenboScene();
    },
  };
}

// Passes the analyser for the audio from audio.js
function goTosenbo(analyser) {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const canvas = getCanvas();

  if (!canvas) {
    return {
      remove() {},
    };
  }

  // Initialize the scene
  const sceneAPI = initTosenboScene();
  if (!sceneAPI) {
    return {
      remove() {},
    };
  }

  // Function to get audio data (RMS for amplitude)
  function updateAudio() {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(1, rms * 2.5);
  }

  let lastTime = performance.now();

  // Animation loop that syncs with audio
  function animate() {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.016); // Cap at 16ms
    lastTime = currentTime;

    const volume = updateAudio();
    sceneAPI.update(volume, dt);

    animationId = requestAnimationFrame(animate);
  }

  animate();

  return {
    remove() {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      sceneAPI.remove();
    },
  };
}

// Exposes globally
window.goTosenbo = goTosenbo;

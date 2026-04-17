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
            // Some meshes will use amplitude, others will use frequency energy.
            const direction = Math.random() > 0.5 ? "vertical" : "horizontal";
            const audioType = Math.random() > 0.6 ? "frequency" : "volume";
            meshStates.push({
              mesh: node,
              baseX: node.position.x,
              baseY: node.position.y,
              direction: direction,
              audioType: audioType,
              phase: Math.random() * Math.PI * 2,
              speed: 1.0 + Math.random() * 2.0,
              amplitude: 0.3 + Math.random() * 0.7,
              smoothedEnergy: 0,
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
        modelRoot.scale.set(2, 2, 2);

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

  // Animation loop using rubik-style flips around the model's center
  let lastRenderTime = performance.now();
  let flipTimer = 0;
  const flipInterval = 2.4;
  const flipDuration = 0.4;
  let isFlipping = false;
  let flipStartTime = 0;
  const startQuat = new THREE.Quaternion();
  const targetQuat = new THREE.Quaternion();
  const flipAxes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)];

  const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

  function beginFlip() {
    if (!modelPivot) return;
    isFlipping = true;
    flipStartTime = performance.now();
    startQuat.copy(modelPivot.quaternion);

    const axis = flipAxes[Math.random() > 0.5 ? 1 : 0];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const flipQuat = new THREE.Quaternion().setFromAxisAngle(
      axis,
      (Math.PI / 2) * direction,
    );
    targetQuat.copy(startQuat).multiply(flipQuat);
  }

  function animate() {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastRenderTime) / 1000, 0.033);
    lastRenderTime = currentTime;

    if (modelPivot) {
      if (!isFlipping) {
        flipTimer += dt;
        if (flipTimer >= flipInterval) {
          flipTimer = 0;
          beginFlip();
        }
      } else {
        const elapsed = (currentTime - flipStartTime) / 1000;
        const t = Math.min(elapsed / flipDuration, 1);
        const eased = easeInOutQuad(t);
        modelPivot.quaternion.copy(startQuat.clone().slerp(targetQuat, eased));
        if (t >= 1) {
          isFlipping = false;
        }
      }
    }

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
    update(vol, freq, dt) {
      if (!meshStates) return;

      for (const state of meshStates) {
        const energy = state.audioType === "frequency" ? freq : vol;
        // Smooth the energy value to reduce jitter
        state.smoothedEnergy += (energy - state.smoothedEnergy) * 0.05; // Low lerp factor for smoothness

        const speed = state.speed + state.smoothedEnergy * 0.3; // Reduced multiplier
        const amp = state.amplitude * (0.5 + state.smoothedEnergy * 0.4); // Reduced multiplier
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
  const freqArray = new Uint8Array(analyser.frequencyBinCount);
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

  // Function to get frequency data
  function updateFrequency() {
    analyser.getByteFrequencyData(freqArray);
    let sum = 0;
    for (let i = 0; i < freqArray.length; i++) {
      const v = freqArray[i] / 255;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / freqArray.length);
    return Math.min(1, rms * 2.5);
  }

  let lastTime = performance.now();
  let startTime = performance.now();

  // Animation loop that syncs with audio
  function animate() {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.016); // Cap at 16ms
    lastTime = currentTime;

    // Shrink the model over time from 8 to 3.5
    const elapsed = (currentTime - startTime) / 1000; // seconds
    const shrinkDuration = 208; // 3 minutes 28 seconds
    const targetScale = 0.25;
    const currentScale = Math.max(
      targetScale,
      8 - (elapsed / shrinkDuration) * (8 - targetScale),
    );
    if (modelPivot) {
      modelPivot.scale.set(currentScale, currentScale, currentScale);
    }

    const volume = updateAudio();
    const frequency = updateFrequency();
    sceneAPI.update(volume, frequency, dt);

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

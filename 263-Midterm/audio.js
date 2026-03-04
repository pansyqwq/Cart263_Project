window.onload = go;

function go() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playPauseBtn = document.querySelector("#playPause");
  const volumeSlider = document.querySelector("#volumeSlider");
  const songSelect = document.querySelector("#songSelect");
  const visualsContainer = document.querySelector(".a-visuals");

  // safety check
  if (!playPauseBtn || !volumeSlider || !songSelect || !visualsContainer) {
    console.error("Missing UI element(s). Check IDs: #playPause #volumeSlider #songSelect and .a-visuals");
    return;
  }

//   /* ==================== VISUALS  ==================== */
//   class GreyCircle {
//     constructor(container, size = 160, color = "#d9d9d9") {
//       this.container = container;
//       this.size = size;
//       this.color = color;
//       this.el = document.createElement("div");
//     }

//     render() {
//       // make sure container can position absolute children
//       this.container.style.position = "relative";

//       const centerX = this.container.clientWidth / 2;
//       const centerY = this.container.clientHeight / 2;

//       this.el.style.position = "absolute";
//       this.el.style.width = this.size + "px";
//       this.el.style.height = this.size + "px";
//       this.el.style.background = this.color;
//       this.el.style.borderRadius = "50%";

//       // center it
//       this.el.style.left = (centerX - this.size / 2) + "px";
//       this.el.style.top = (centerY - this.size / 2) + "px";

//       this.container.appendChild(this.el);
//     }

//     remove() {
//       this.el.remove();
//     }
//   }

  let currentVisual = null;

  function clearVisual() {
    if (currentVisual) {
      currentVisual.remove();
      currentVisual = null;
    }
  }

  function updateVisualForCurrentSong() {
    // clear first so we don't stack shapes
    clearVisual();

    // Only show circle when Zureteiku is the selected song AND audio is playing
    const path = songSelect.value.toLowerCase();
    const isZureteiku = path.includes("zureteiku") || path.includes("ずれていく") || path.includes("zure");

    if (isPlaying && isZureteiku) {
      currentVisual = new GreyCircle(visualsContainer, 180, "#d9d9d9");
      currentVisual.render();
    }
  }

  // If window resizes, keep the circle centered
  window.addEventListener("resize", () => {
    if (currentVisual) {
      updateVisualForCurrentSong();
    }
  });

  /* ==================== AUDIO ==================== */
  let currentBuffer = null;
  let currentSource = null;
  let isPlaying = false;

  // volume control using GainNode
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Number(volumeSlider.value);
  gainNode.connect(audioContext.destination);

  async function loadBuffer(filePath) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const arr = await res.arrayBuffer();
    return await audioContext.decodeAudioData(arr);
  }

  function stopSource() {
    if (currentSource) {
      try { currentSource.stop(); } catch (e) {}
      try { currentSource.disconnect(); } catch (e) {}
      currentSource = null;
    }
    isPlaying = false;

    // visuals should disappear when stopped
    clearVisual();
  }

  function startFromBuffer(loop = true) {
    if (!currentBuffer) return;

    stopSource(); // stop old one if any

    currentSource = audioContext.createBufferSource();
    currentSource.buffer = currentBuffer;
    currentSource.loop = loop;
    currentSource.connect(gainNode);
    currentSource.start(0);

    isPlaying = true;
    playPauseBtn.textContent = "⏹";

    // show visuals if needed
    updateVisualForCurrentSong();
  }

  async function ensureAudioRunning() {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  // 1) Load initial song
  (async () => {
    try {
      currentBuffer = await loadBuffer(songSelect.value);
      playPauseBtn.textContent = "▶";
    } catch (e) {
      console.error(e);
    }
  })();

  // 2) Dropdown change: load new song
  songSelect.addEventListener("change", async () => {
    const path = songSelect.value;

    // stop current audio + visuals
    stopSource();

    try {
      currentBuffer = await loadBuffer(path);

      //User clicks play.
      playPauseBtn.textContent = "▶";

      // If you WANT autoplay on change, uncomment:
      await ensureAudioRunning();
      startFromBuffer(true);

    } catch (e) {
      console.error(e);
    }
  });

  // 3) Play/pause button
  playPauseBtn.addEventListener("click", async () => {
    await ensureAudioRunning();

    if (!currentBuffer) return;

    if (!isPlaying) {
      startFromBuffer(true);
    } else {
      await audioContext.suspend();
      isPlaying = false;
      playPauseBtn.textContent = "▶";

      // hide visuals when paused
      clearVisual();
    }
  });

  // 4) Volume slider
  volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = Number(volumeSlider.value);
  });
}
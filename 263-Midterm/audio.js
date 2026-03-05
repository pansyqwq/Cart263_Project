window.onload = go;

function go() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playStopBtn = document.querySelector("#playStop");
  const volumeSlider = document.querySelector("#volumeSlider");
  const songSelect = document.querySelector("#songSelect");
  const songTitle = document.querySelector("#songtitle");
  const visualsContainer = document.querySelector(".a-visuals");
  const pauseBtn = document.querySelector("#pause");

  // safety check
  if (
    !playStopBtn ||
    !pauseBtn ||
    !volumeSlider ||
    !songSelect ||
    !visualsContainer
  ) {
    console.error(
      "Missing UI element(s). Check IDs: #playStop #volumeSlider #songSelect and .a-visuals",
    );
    return;
  }

  // /* ==================== VISUALS  ==================== */
  // class GreyCircle {
  //   constructor(container, size = 160, color = "#d9d9d9") {
  //     this.container = container;
  //     this.size = size;
  //     this.color = color;
  //     this.el = document.createElement("div");
  //   }

  //   render() {
  //     // make sure container can position absolute children
  //     this.container.style.position = "relative";

  //     const centerX = this.container.clientWidth / 2;
  //     const centerY = this.container.clientHeight / 2;

  //     this.el.style.position = "absolute";
  //     this.el.style.width = this.size + "px";
  //     this.el.style.height = this.size + "px";
  //     this.el.style.background = this.color;
  //     this.el.style.borderRadius = "50%";

  //     // center it
  //     this.el.style.left = centerX - this.size / 2 + "px";
  //     this.el.style.top = centerY - this.size / 2 + "px";

  //     this.container.appendChild(this.el);
  //   }

  //   remove() {
  //     this.el.remove();
  //   }
  // }

  let currentVisual = null;

  function clearVisual() {
    if (currentVisual) {
      currentVisual.remove();
      currentVisual = null;
    }
  }

  function updateVisualForCurrentSong() {
    // Clear previous visuals
    clearVisual();

    const path = songSelect.value.toLowerCase();

    const isZureteiku =
      path.includes("zureteiku") ||
      path.includes("ずれていく") ||
      path.includes("zure");

    const isUnknownMotherGoose = path.includes("umg");

    // Only show visuals when the song is playing
    if (!isPlaying) return;

    // Zureteiku visual
    if (isZureteiku && typeof window.showZureteikuVisual === "function") {
      currentVisual = window.showZureteikuVisual();
    }

    // UNKNOWN MOTHER-GOOSE visual
    if (isUnknownMotherGoose && typeof window.showHeartVisual === "function") {
      currentVisual = window.showHeartVisual();
    }
  }

  // Changes song title based on current song
  function updateSongTitle() {
    songTitle.textContent = songSelect.options[songSelect.selectedIndex].text;
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
  let isPaused = false;

  // volume control using GainNode
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Number(volumeSlider.value);
  gainNode.connect(audioContext.destination);

  async function loadBuffer(filePath) {
    const res = await fetch(filePath);
    if (!res.ok)
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const arr = await res.arrayBuffer();
    return await audioContext.decodeAudioData(arr);
  }

  function stopSource() {
    if (currentSource) {
      try {
        currentSource.stop();
      } catch (e) {}
      try {
        currentSource.disconnect();
      } catch (e) {}
      currentSource = null;
    }
    isPlaying = false;
    isPaused = false;
    pauseBtn.textContent = "⏸";

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
    playStopBtn.textContent = "⏹";

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
      playStopBtn.textContent = "▶";
      updateSongTitle();
    } catch (e) {
      console.error(e);
    }
  })();

  // 2) Dropdown change: load new song
  songSelect.addEventListener("change", async () => {
    updateSongTitle();
    const path = songSelect.value;

    // stop current audio + visuals
    stopSource();

    try {
      currentBuffer = await loadBuffer(path);

      //User clicks play.
      playStopBtn.textContent = "▶";

      // If you WANT autoplay on change, uncomment:
      await ensureAudioRunning();
      startFromBuffer(true);
    } catch (e) {
      console.error(e);
    }
  });

  // 3) Play/stop button
  playStopBtn.addEventListener("click", async () => {
    await ensureAudioRunning();

    if (!currentBuffer) return;

    if (!isPlaying) {
      startFromBuffer(true);
    } else {
      stopSource();
      playStopBtn.textContent = "▶";

      // hide visuals when stopped
      clearVisual();
    }
  });

  pauseBtn.addEventListener("click", async () => {
    if (!currentSource) return;

    if (!isPaused) {
      await audioContext.suspend();
      isPaused = true;
      isPlaying = false;

      pauseBtn.textContent = "▶";
      pauseBtn.classList.add("is-paused");
    } else {
      await audioContext.resume();
      isPaused = false;
      isPlaying = true;

      pauseBtn.textContent = "⏸";
      pauseBtn.classList.remove("is-paused");
    }
  });

  // 4) Volume slider
  volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = Number(volumeSlider.value);
  });
}

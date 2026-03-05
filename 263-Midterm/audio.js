// audio.js
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
      "Missing UI element(s). Check IDs: #playStop #pause #volumeSlider #songSelect and .a-visuals",
    );
    return;
  }

  /* ==================== VISUALS ==================== */
  let currentVisual = null;

  function clearVisual() {
    if (currentVisual && typeof currentVisual.remove === "function") {
      currentVisual.remove();
    }
    currentVisual = null;
  }

  function updateVisualForCurrentSong() {
    clearVisual();

    const path = songSelect.value.toLowerCase();

    const isZureteiku =
      path.includes("zureteiku") ||
      path.includes("ずれていく") ||
      path.includes("zure");

    const isUnknownMotherGoose = path.includes("umg");

    // Only show visuals when music is actually playing
    if (!isPlaying) return;

    if (isZureteiku && typeof window.showZureteikuVisual === "function") {
      currentVisual = window.showZureteikuVisual();
    } else if (
      isUnknownMotherGoose &&
      typeof window.showHeartVisual === "function"
    ) {
      // Set up the heart visual
      currentVisual = window.showHeartVisual();
      window.getAmplitude(currentSource, audioContext, 999999, currentVisual);

      // Call the waveform visual directly
      window.showWaveform(currentSource, audioContext, 999999, currentVisual);
      addBackgroundRectangle();
    }
  }

  function updateSongTitle() {
    if (songTitle) {
      songTitle.textContent = songSelect.options[songSelect.selectedIndex].text;
    }
  }

  // If window resizes, rebuild the visual (your visual already handles scaling)
  window.addEventListener("resize", () => {
    if (currentVisual && isPlaying) updateVisualForCurrentSong();
  });

  /* ==================== AUDIO ==================== */
  let currentBuffer = null;
  let currentSource = null;
  let isPlaying = false;
  let isPaused = false;

  // GainNode for volume slider
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Number(volumeSlider.value);

  // AnalyserNode for volume detection
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  const timeData = new Uint8Array(analyser.fftSize);

  // Connect final chain: analyser -> gain -> speakers
  analyser.connect(gainNode);
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

    stopVisualLoop();
    clearVisual();
  }

  function startFromBuffer(loop = true) {
    if (!currentBuffer) return;

    stopSource(); // stop old audio + visuals loop

    currentSource = audioContext.createBufferSource();
    currentSource.buffer = currentBuffer;
    currentSource.loop = loop;

    //  audio goes into analyser so we can measure volume
    currentSource.connect(analyser);

    currentSource.start(0);

    isPlaying = true;
    isPaused = false;
    playStopBtn.textContent = "⏹";
    pauseBtn.textContent = "⏸";
    pauseBtn.classList.remove("is-paused");

    updateVisualForCurrentSong();
    startVisualLoop();
  }

  async function ensureAudioRunning() {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  /* ==================== requestAnimationFrame ==================== */
  let rafId = null;

  function getVolume01() {
    // Time-domain RMS volume (0..~1)
    analyser.getByteTimeDomainData(timeData);

    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128; // -1..1
      sum += v * v;
    }

    const rms = Math.sqrt(sum / timeData.length); // 0..1
    return Math.min(1, rms * 2.5); // boost sensitivity
  }

  function startVisualLoop() {
    stopVisualLoop();

    let last = performance.now();

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;

      const vol = getVolume01();

      // If visual supports update(vol, dt), call it
      if (currentVisual && typeof currentVisual.update === "function") {
        currentVisual.update(vol, dt);
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  function stopVisualLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  /* ==================== UI EVENTS ==================== */

  // 1) Load initial song buffer (no autoplay)
  (async () => {
    try {
      currentBuffer = await loadBuffer(songSelect.value);
      playStopBtn.textContent = "▶";
      updateSongTitle();
    } catch (e) {
      console.error(e);
    }
  })();

  // 2) Dropdown: load new song
  songSelect.addEventListener("change", async () => {
    updateSongTitle();
    const path = songSelect.value;

    stopSource();

    try {
      currentBuffer = await loadBuffer(path);
      playStopBtn.textContent = "▶";

      await ensureAudioRunning();
      startFromBuffer(true);
    } catch (e) {
      console.error(e);
    }
  });

  // 3) Play/Stop
  playStopBtn.addEventListener("click", async () => {
    await ensureAudioRunning();
    if (!currentBuffer) return;

    if (!isPlaying) {
      startFromBuffer(true);
    } else {
      stopSource();
      playStopBtn.textContent = "▶";
    }
  });

  // 4) Pause/Resume
  pauseBtn.addEventListener("click", async () => {
    if (!currentSource) return;

    if (!isPaused) {
      await audioContext.suspend();
      isPaused = true;
      isPlaying = false;

      pauseBtn.textContent = "▶";
      pauseBtn.classList.add("is-paused");
      // stop animation updates while paused
      stopVisualLoop();
    } else {
      await audioContext.resume();
      isPaused = false;
      isPlaying = true;

      pauseBtn.textContent = "⏸";
      pauseBtn.classList.remove("is-paused");

      // rebuild visual + restart loop
      updateVisualForCurrentSong();
      startVisualLoop();
    }
  });

  // 5) Volume slider (controls gainNode)
  volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = Number(volumeSlider.value);
  });
}

window.onload = go;

function go() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playStopBtn = document.querySelector("#playStop");
  const volumeSlider = document.querySelector("#volumeSlider");
  const songSelect = document.querySelector("#songSelect");
  const songTitle = document.querySelector("#songtitle");
  const visualsContainer = document.querySelector(".a-visuals");
  const pauseBtn = document.querySelector("#pause");

  // Safety check
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

  const aboutBtn = document.querySelector(".about-btn");
  const popup = document.querySelector(".about-popup");
  const closeBtn = document.querySelector(".close-popup");

  aboutBtn.addEventListener("click", () => {
    popup.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

  /* ==================== VISUALS ==================== */
  let currentVisual = null;

  function hideAllVisuals() {
    const umgHeart = document.querySelector("#umg-heart");
    const threeCanvas = document.querySelector("#three-ex");

    if (umgHeart) {
      umgHeart.style.display = "none";
      umgHeart.style.transform = "translate(-50%, -50%) scale(1)";

      for (let p of umgHeart.querySelectorAll(".st0, .st1, .st2, .st3")) {
        p.style.transform = "scale(1)";
        p.style.transformOrigin = "center center";
      }
    }

    if (threeCanvas) {
      threeCanvas.style.display = "none";
    }
  }

  function clearVisual() {
    if (currentVisual && typeof currentVisual.remove === "function") {
      currentVisual.remove();
    }
    currentVisual = null;
    hideAllVisuals();
  }

  function updateVisualForCurrentSong() {
    // Removes old visuals
    clearVisual();

    const path = songSelect.value.toLowerCase();

    const isZureteiku =
      path.includes("zureteiku") ||
      path.includes("ずれていく") ||
      path.includes("zure");

    const isUnknownMotherGoose = path.includes("umg");
    const isNingyou =
      path.includes("tsumikinoningyou") ||
      path.includes("tsumiki") ||
      path.includes("ningyou");

    // Only show visuals when music is actually playing
    if (!isPlaying) return;

    if (isZureteiku && typeof window.showZureteikuVisual === "function") {
      currentVisual = window.showZureteikuVisual();
    } else if (isUnknownMotherGoose) {
      // Check if UMG heart is already in DOM
      let umgHeart = document.querySelector("#umg-heart");

      // Make it visible by displaying it to block
      if (umgHeart) {
        umgHeart.style.display = "block";
      }

      // Starts the UMG animation
      currentVisual = goUMG(analyser);
    } else if (isNingyou) {
      const threeCanvas = document.querySelector("#three-ex");
      if (threeCanvas) {
        threeCanvas.style.display = "block";
      }
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
    // Stops old audio and loops visuals
    stopSource();

    currentSource = audioContext.createBufferSource();
    currentSource.buffer = currentBuffer;
    currentSource.loop = loop;

    // Audio goes into analyser so we can measure volume
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
    // Time-domain RMS volume
    analyser.getByteTimeDomainData(timeData);

    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128;
      sum += v * v;
    }

    const rms = Math.sqrt(sum / timeData.length);
    // Boosts sensitivity
    return Math.min(1, rms * 2.5);
  }

  function startVisualLoop() {
    stopVisualLoop();

    let last = performance.now();

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;

      const vol = getVolume01();

      // If visual supports update, call it
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

  // Load initial song buffer (no autoplay)
  (async () => {
    try {
      currentBuffer = await loadBuffer(songSelect.value);
      playStopBtn.textContent = "▶";
      updateSongTitle();
      updateVisualForCurrentSong();
      hideAllVisuals();
    } catch (e) {
      console.error(e);
    }
  })();

  // Dropdown: loads new song
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

  // Play/Stop
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

  // Pause/Resume
  pauseBtn.addEventListener("click", async () => {
    if (!currentSource) return;

    if (!isPaused) {
      await audioContext.suspend();
      isPaused = true;
      isPlaying = false;

      pauseBtn.textContent = "▶";
      pauseBtn.classList.add("is-paused");
      // Stops animation updates while paused
      stopVisualLoop();
    } else {
      await audioContext.resume();
      isPaused = false;
      isPlaying = true;

      pauseBtn.textContent = "⏸";
      pauseBtn.classList.remove("is-paused");

      // Rebuild visual + restart loop
      updateVisualForCurrentSong();
      startVisualLoop();
    }
  });

  // Volume slider (controls gainNode)
  volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = Number(volumeSlider.value);
  });
}

// Opens Artist Statement when clicked
const aStatement = document.querySelector("#statement");

aStatement.addEventListener("click", () => {
  // Opens the PDF in a new tab
  window.open("cart263_midterm_artistStatement.pdf", "_blank");
});
window.addEventListener("DOMContentLoaded", go);

function go() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playStopBtn = document.querySelector("#playStop");
  const volumeSlider = document.querySelector("#volumeSlider");
  const songSelect = document.querySelector("#songSelect");
  const songTitle = document.querySelector("#songtitle");
  const visualsContainer = document.querySelector(".a-visuals");
  const pauseBtn = document.querySelector("#pause");

  if (
    !playStopBtn ||
    !pauseBtn ||
    !volumeSlider ||
    !songSelect ||
    !visualsContainer
  ) {
    console.error(
      "Missing UI element(s). Check IDs: #playStop #pause #volumeSlider #songSelect and .a-visuals"
    );
    return;
  }

  const aboutBtn = document.querySelector(".about-btn");
  const popup = document.querySelector(".about-popup");
  const closeBtn = document.querySelector(".close-popup");

  if (aboutBtn && popup) {
    aboutBtn.addEventListener("click", () => {
      popup.style.display = "flex";
    });
  }

  if (closeBtn && popup) {
    closeBtn.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }

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
    console.log("updateVisualForCurrentSong called");
    clearVisual();

    const path = songSelect.value.toLowerCase();
    console.log("current song path:", path);

    const isZureteiku =
      path.includes("zureteiku") ||
      path.includes("ずれていく") ||
      path.includes("zure");

    const isUnknownMotherGoose =
      path.includes("umg") ||
      path.includes("unknownmothergoose") ||
      path.includes("unknown-mother-goose");

    const isNingyou =
      path.includes("tsumikinoningyou") ||
      path.includes("tsumiki") ||
      path.includes("ningyou");

    console.log("isPlaying:", isPlaying);
    console.log("isZureteiku:", isZureteiku);
    console.log("isUnknownMotherGoose:", isUnknownMotherGoose);
    console.log("isNingyou:", isNingyou);

    if (!isPlaying) {
      console.log("Visual not started because audio is not playing");
      return;
    }

    visualsContainer.style.display = "block";

    if (isZureteiku && typeof window.showZureteikuVisual === "function") {
      console.log("Starting Zureteiku visual");
      currentVisual = window.showZureteikuVisual();
      console.log("showZureteikuVisual returned:", currentVisual);
    } else if (isUnknownMotherGoose) {
      console.log("Starting UMG visual");

      if (typeof goUMG === "function") {
        currentVisual = goUMG(analyser);
        console.log("goUMG returned:", currentVisual);
      } else {
        console.error("goUMG is not available");
      }
    } else if (isNingyou) {
      console.log("Starting Ningyou visual");

      if (typeof window.showNingyouVisual === "function") {
        currentVisual = window.showNingyouVisual();
        console.log("showNingyouVisual returned:", currentVisual);
      } else {
        console.error("showNingyouVisual is not available");
      }
    } else {
      console.log("No matching visual for this song");
      currentVisual = null;
    }
  }

  function updateSongTitle() {
    if (songTitle) {
      songTitle.textContent = songSelect.options[songSelect.selectedIndex].text;
    }
  }

  let currentBuffer = null;
  let currentSource = null;
  let isPlaying = false;
  let isPaused = false;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = Number(volumeSlider.value);

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  const timeData = new Uint8Array(analyser.fftSize);

  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);

  async function loadBuffer(filePath) {
    const res = await fetch(filePath);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    const arr = await res.arrayBuffer();
    return await audioContext.decodeAudioData(arr);
  }

  function stopVisualLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  }

  function stopSource() {
    stopVisualLoop();

    if (currentSource) {
      try {
        currentSource.stop();
      } catch (e) {}

      try {
        currentSource.disconnect();
      } catch (e) {}

      currentSource = null;
    }

    clearVisual();

    isPlaying = false;
    isPaused = false;
    pauseBtn.textContent = "⏸";
  }

  function startFromBuffer(loop = true) {
    if (!currentBuffer) return;

    stopSource();

    currentSource = audioContext.createBufferSource();
    currentSource.buffer = currentBuffer;
    currentSource.loop = loop;
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

  let rafId = null;

  function getVolume01() {
    analyser.getByteTimeDomainData(timeData);

    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128;
      sum += v * v;
    }

    const rms = Math.sqrt(sum / timeData.length);
    return Math.min(1, rms * 2.5);
  }

  function startVisualLoop() {
    stopVisualLoop();

    let last = performance.now();

    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;

      const vol = getVolume01();

      if (currentVisual && typeof currentVisual.update === "function") {
        currentVisual.update(vol, dt);
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    if (currentVisual && isPlaying) {
      updateVisualForCurrentSong();
    }
  });

  (async () => {
    try {
      currentBuffer = await loadBuffer(songSelect.value);
      playStopBtn.textContent = "▶";
      updateSongTitle();
      hideAllVisuals();
    } catch (e) {
      console.error(e);
    }
  })();

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

  pauseBtn.addEventListener("click", async () => {
    if (!currentSource) return;

    if (!isPaused) {
      await audioContext.suspend();
      isPaused = true;
      isPlaying = false;

      pauseBtn.textContent = "▶";
      pauseBtn.classList.add("is-paused");
      stopVisualLoop();
    } else {
      await audioContext.resume();
      isPaused = false;
      isPlaying = true;

      pauseBtn.textContent = "⏸";
      pauseBtn.classList.remove("is-paused");

      updateVisualForCurrentSong();
      startVisualLoop();
    }
  });

  volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = Number(volumeSlider.value);
  });
}

const aStatement = document.querySelector("#statement");

if (aStatement) {
  aStatement.addEventListener("click", () => {
    window.open("cart263_midterm_artistStatement.pdf", "_blank");
  });
}
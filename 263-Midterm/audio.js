window.onload = go;

function go() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playPauseBtn = document.querySelector("#playPause");
  const volumeSlider = document.querySelector("#volumeSlider");
  const songSelect = document.querySelector("#songSelect");

  // safety check (prevents null addEventListener crashes)
  if (!playPauseBtn || !volumeSlider || !songSelect) {
    console.error("Missing UI element(s). Check IDs: #playPause #volumeSlider #songSelect");
    return;
  }

  let currentBuffer = null;
  let currentSource = null;
  let isPlaying = false;

  // volume control using GainNode (WebAudio way)
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
  }

  async function ensureAudioRunning() {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  // 1) Load initial song (from first option)
  (async () => {
    try {
      currentBuffer = await loadBuffer(songSelect.value);
      // don’t autoplay on load; user clicks play
      playPauseBtn.textContent = "▶";
    } catch (e) {
      console.error(e);
    }
  })();

  // 2) Dropdown change: load new song, and auto-play if currently playing
  songSelect.addEventListener("change", async () => {
    const path = songSelect.value;

    stopSource();

    try {
      currentBuffer = await loadBuffer(path);
      if (isPlaying) {
        await ensureAudioRunning();
        startFromBuffer(true);
      } else {
        playPauseBtn.textContent = "▶";
      }
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
      // "pause" using suspend (keeps position only if you implement offset tracking;
      // simplest: suspend audioContext)
      await audioContext.suspend();
      isPlaying = false;
      playPauseBtn.textContent = "▶";
    }
  });

  // 4) Volume slider
  volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = Number(volumeSlider.value);
  });
}
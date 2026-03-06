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

  function clearVisual() {
    if (currentVisual && typeof currentVisual.remove === "function") {
      currentVisual.remove();
    }
    currentVisual = null;
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

    // Only show visuals when music is actually playing
    if (!isPlaying && !isUnknownMotherGoose) return;

    if (isZureteiku && typeof window.showZureteikuVisual === "function") {
      currentVisual = window.showZureteikuVisual();
    } else if (isUnknownMotherGoose) {
      // Check if UMG heart is already in DOM
      let umgHeart = document.querySelector("#umg-heart");
      // If it's not, bring it back
      if (!umgHeart) {
        visualsContainer.innerHTML = `
        <svg id="umg-heart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 427.31 438.41">
                <defs>
                    <style>
                        .st0 {
                            fill: #c4c4c4;
                        }
            
                        .st0,
                        .st1,
                        .st2,
                        .st3 {
                            stroke: #fff;
                            stroke-miterlimit: 10;
                            stroke-width: 4px;
                        }
            
                        .st1 {
                            fill: #a8a8a8;
                        }
            
                        .st2 {
                            fill: #8d8b88;
                        }
            
                        .st3 {
                            fill: #6e6e6e;
                        }
                    </style>
                </defs>
                <g id="umg-heart-group">
                <path class="st2" d="M50.08,130.92l69.6,135.86-77.75-42.66c-1.4-.43-1.19-2.34-1.53-2.78l7.73-93.79,1.95,3.37Z" />
                <path class="st2"
                    d="M48.14,127.56c.35-.21.74-.92.97-.97,41.93-8.35,87.96-22.94,129.79-34.1,10.99-2.93,22.57-8.11,33.61-10.38.3-.06.65.03.97,0,.85,5.38-.13,10.59-.04,16,.17,9.72,4.49,11.74-4.88,19.21-12.75,10.17-24.99,13.58-35.69,28.12-19.11,25.97-18.72,66.77,10.01,79.14,8.57,3.69,18.64,2.12,25.48-4.23,2.28-2.12,4.02-4.58,4.15-7.71.02-.57.12-1.51,0-1.93,2.63-.93,5.05-6.58,6.06-7.48.6-.54,9.12-5.45,10.15-5.81,13.85-4.76,25.98,6.26,32.48,17.28,12.16,20.59,7.59,42.92-5.73,61.68-8.19,11.54-19.1,20.4-30.41,28.68-6.16,4.51-10.2,11.47-10.65,19.09v.12c-1.33,24.62-.79,54.56.04,79.37.06,1.86-.99,3.88,1.93,3.34-.52.53-.16,3.64-2.88,2.89l-92.84-143.09c6.71-.92,6.59-7.08,17.65-1.7,13.2,6.43,18.66,12.43,35.16,15.12,26.98,4.41,63.13-9.3,67.81-39.27,2.06-13.17-6.25-29.1-20.69-30.13-8.96-.64-3.52,3.35-2.24,7.12,7.96,23.36-10.95,36.28-32.47,35.36-28.47-1.21-49.1-26.67-55.7-52.58-3.28-12.87-.91-27.23-10.56-36.82l-64.99-33.63-6.49-2.69" />
                <path class="st1"
                    d="M376.86,126.57c-52.39-14.17-104.84-28.2-157.21-42.48-.02,0-.03,0-.05-.01-1.58-.45-1.65-2.69-.15-3.35l.02.02L376.28,11.68c1.19-.52,2.52.35,2.52,1.64v112.58l-1.94.67Z" />
                <path class="st1"
                    d="M380.44,127.69l41.39,3.53c1.2.1,1.96,1.34,1.52,2.46l-32.74,82.27c-.68,1.7-3.16,1.42-3.45-.39-.31-1.92-.52-3.84-.62-5.36-1.71-26.69-4.55-53.36-6.76-80.09l.66-2.42Z" />
                <path class="st3"
                    d="M219.66,84.11c52.37,14.28,104.82,28.31,157.21,42.48.3,2.34-3.21,3.48-4.82,4.37-17.39,9.55-38.24,20.86-56.21,28.87-3.78,1.68-8.94,4.3-13.04,4.36-7.5.11-16.13-7.65-22.74-10.89-23.65-11.59-56.5-13.83-77.24,4.7-19.75,17.65-23.21,52.34,9.68,54.64-.19,4.39-3.54,7.47-7.13,10.14-5.31,3.94-12.21,5.24-18.52,3.27-32.64-10.2-33.94-53.48-13.99-80.61,10.7-14.54,22.94-17.95,35.69-28.12,9.37-7.47,5.05-9.49,4.88-19.21-.08-4.62.62-9.09.3-13.65-.1-1.39,1.07-2.59,2.44-2.38.07.01,1.91,1.61,3.48,2.04h.01Z" />
                <path class="st3"
                    d="M51.04,10.57c3.72,2.19,7.97,4.21,11.92,5.97,48.63,21.64,99.18,45.36,148.58,64.61.31.12.63.72.97.97-11.04,2.27-22.62,7.45-33.61,10.38-41.82,11.16-87.86,25.74-129.79,34.1V12.5c.14-.09-.33-2.59,1.93-1.93h0Z" />
                <path class="st3"
                    d="M306.29,266.79c-.29.56,0,2.28-.75,3.55-24.8,41.95-54.74,81.25-80.29,122.8-1.67,2.71-7.29,12.23-8.88,13.84-2.92.54-1.87-1.48-1.93-3.34-.83-24.81-1.37-54.74-.04-79.37v-.12c.45-7.62,4.49-14.57,10.65-19.09,11.3-8.28,22.21-17.14,30.41-28.68,13.32-18.76,17.89-41.09,5.73-61.68-6.51-11.02-18.63-22.05-32.48-17.28-1.03.35-9.55,5.27-10.15,5.81-1.01.9-3.43,6.55-6.06,7.48-.37-1.27-3.15-4.04-3.65-6.51-3.72-18.34,12-31.97,29.32-32.2,35.93-.48,56.79,33.06,59.29,65.42.83,10.79-4.14,25.55,8.83,29.37h0Z" />
                <path class="st3"
                    d="M119.69,266.79L50.08,130.92c-.83-2.68,3.34-1.11,4.55-.67l64.99,33.63c9.65,9.59,7.28,23.95,10.56,36.82,6.6,25.91,27.23,51.37,55.7,52.58,21.52.91,40.44-12,32.47-35.36-1.29-3.77-6.72-7.76,2.24-7.12,14.44,1.03,22.75,16.96,20.69,30.13-4.69,29.97-40.83,43.68-67.81,39.27-16.49-2.69-21.96-8.69-35.16-15.12-11.06-5.38-10.94.78-17.65,1.7-.32.04-.65-.03-.97,0h0Z" />
                <path class="st1"
                    d="M200.37,436.24L13.33,235.86c1.79-.45,2.68.67,3.99,1.31,29.48,14.53,57.96,32.77,86.44,48.92,28.07,43.9,57.85,86.76,85.94,130.64,3.96,6.19,8.06,12.4,11.5,18.92.28.53-.43,1.03-.83.59h0Z" />
                <path class="st3"
                    d="M377.84,129.49c.07.09,1.69-.39,1.95.64,2.22,26.72,5.05,53.4,6.76,80.09.2,3.17.92,8.12,1.92,11.13l-1.23,2.62c-.72.68-1.8.79-2.63,1.24-23.78,12.86-47.53,26.59-71.52,39.17-2.52,1.32-3.61,1.05-4.86,1.44l69.61-136.33h0Z" />
                <path class="st1"
                    d="M211.54,81.15C162.14,61.89,111.58,38.17,62.96,16.53c-3.36-1.5-6.94-3.19-10.23-5-.54-.3-.39-1.11.23-1.18,22.14-2.47,44.87-5.76,67.22-7.52,6.31-.5,12.8-1.02,19.13-.77,3.82,3.2,7.4,6.83,10.85,10.42,18.43,19.24,37.21,40.12,55.11,59.95,2.11,2.34,5.06,5.81,6.27,8.72h0Z" />
                <path class="st1"
                    d="M384.61,225.21c-4.86,7.6-11.71,14.6-17.87,21.28-47.78,51.79-143.15,149.36-141.48,146.65,25.54-41.55,55.49-80.85,80.29-122.8.75-1.27.46-3,.75-3.55.05-.1,1.6-.86,1.93-.97,1.25-.39,2.34-.12,4.86-1.44,24-12.58,47.74-26.31,71.52-39.17h0Z" />
                <path class="st3"
                    d="M48.14,127.56l-7.73,93.79c-7.1-9.27-17.7-40.41-22.71-53.19-3.4-8.7-10.6-23.85-12.59-31.88-.41-1.64-.69-3.15-.48-4.84l43.51-3.87h0Z" />
                <path class="st1"
                    d="M49.1,12.5v1.93c-2.16-.5-3.32,3.85-3.89,5.29C31.8,53.37,18.88,89.04,6.52,123.16c-.63,1.75-1.03,3.5-.93,5.37-1.25,1.56-1.76-.11-1.93-1.44-.49-3.83.22-8.54,0-12.58-.9-15.94-2.57-37.54-1.02-53.25.17-1.69.04-2.24.97-3.86,1.95-3.39,12.91-12.54,16.51-16.36,7.39-7.83,17.27-20.62,25.07-27.16,1.76-1.48,3.49-1.11,3.91-1.39h0Z" />
                <path class="st2"
                    d="M423.96,127.78l-43.21-114.31c2.39.86,4.08,2.57,5.82,4.32,13.12,13.26,25.1,27.78,38.45,40.83.68,23.09.06,46.13-.75,69.1,0,.17-.25.21-.31.05h0Z" />
                <path class="st0"
                    d="M377.84,129.49l-69.61,136.33c-.33.1-1.88.87-1.93.97-12.97-3.82-7.99-18.58-8.83-29.37-2.5-32.36-23.36-65.9-59.29-65.42-17.31.23-33.04,13.87-29.32,32.2.5,2.47,3.28,5.23,3.65,6.51.12.42.02,1.36,0,1.93-32.89-2.3-29.43-36.98-9.68-54.64,20.73-18.54,53.59-16.29,77.24-4.7,6.61,3.24,15.24,11,22.74,10.89,4.11-.06,9.26-2.68,13.04-4.36,17.97-8.01,38.82-19.33,56.21-28.87,1.62-.89,5.55-1.78,5.79-1.47h0Z" />
                <path class="st0"
                    d="M48.55,15.89L5.44,129.28c-.38.99.41,2.04,1.47,1.95l41.22-3.67.95-111.57c0-.31-.43-.39-.54-.1h0Z" />
                <path class="st0"
                    d="M378.81,14.32v112.61c0,.35.27.65.62.68l43.74,3.73c.5.04.87-.45.7-.92l-43.74-116.35c-.27-.71-1.32-.52-1.32.24h0Z" />
                </g>
            </svg>
      `;
        umgHeart = document.querySelector("#umg-heart");
      }

      // Make it visible by displaying it to block
      umgHeart.style.display = "block";

      // Starts the UMG animation
      currentVisual = startUMGAnimation();
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

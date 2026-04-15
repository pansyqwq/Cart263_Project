let umgAnimationId = null;

// Passes the analyser for the audio in the other script
function goUMG(analyser) {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const svg = document.getElementById("umg-heart");

  if (!svg) {
    return {
      remove() {}
    };
  }

  svg.style.display = "block";

  // Calculates and returns RMS value for amplitude
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

  function resetUMG() {
    svg.style.display = "none";
    svg.style.transform = "translate(-50%, -50%) scale(1)";

    for (let p of svg.querySelectorAll(".st0, .st1, .st2, .st3")) {
      p.style.transform = "scale(1)";
      p.style.transformOrigin = "center center";
    }
  }

  /* This SVG animation was provided by Sabine */
  function startUMGAnimation() {
    const mapRange = (value, oldMin, oldMax, newMin, newMax) =>
      ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;

    function animate() {
      let audioLevel = updateAudio();
      let scale = mapRange(audioLevel, 0, 1, 0.9, 1.15);

      for (let p of svg.querySelectorAll(".st2")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      for (let p of svg.querySelectorAll(".st3")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      for (let p of svg.querySelectorAll(".st1")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      for (let p of svg.querySelectorAll(".st0")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      umgAnimationId = requestAnimationFrame(animate);
    }

    animate();
  }

  function remove() {
    if (umgAnimationId !== null) {
      cancelAnimationFrame(umgAnimationId);
      umgAnimationId = null;
    }

    resetUMG();
  }

  startUMGAnimation();

  return {
    remove
  };
}
// Passes the analyser for the audio in the other script
function goUMG(analyser) {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  startUMGAnimation();

  function updateAudio() {
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }

    const rms = Math.sqrt(sum / dataArray.length);
    // Boosts sensitivity
    return Math.min(1, rms * 2.5);
  }

  // Calculates and returns RMS value for amplitude
  function updateAudio() {
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }

    const rms = Math.sqrt(sum / dataArray.length);
    return rms;
  }

  /* This SVG animation was provided by Sabine */
  function startUMGAnimation() {
    const mapRange = (value, oldMin, oldMax, newMin, newMax) =>
      ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;

    function animate() {
      let audioLevel = updateAudio();
      let scale = mapRange(audioLevel, 0, 1, 0.9, 1.15);

      for (let p of document.querySelectorAll(".st2")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      for (let p of document.querySelectorAll(".st3")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      for (let p of document.querySelectorAll(".st1")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      for (let p of document.querySelectorAll(".st0")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${scale})`;
      }

      // Scales entire heart based off of volume
      const overallScale = mapRange(audioLevel, 0, 1, 0.98, 1.05);
      const svg = document.getElementById("umg-heart");
      svg.style.transformOrigin = "center center";
      svg.style.transform = `scale(${overallScale})`;

      // Scales individual fragments
      const s0 = mapRange(audioLevel, 0, 1, 0.95, 1.15);
      for (let p of document.querySelectorAll(".st0")) {
        p.style.transformOrigin = "center center";
        p.style.transform = `scale(${s0})`;
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
}

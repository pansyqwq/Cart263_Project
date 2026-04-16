let tosenboAnimationId = null;

// Passes the analyser for the audio from audio.js
function goTosenbo(analyser) {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  // Add your visual elements here (e.g., an SVG, canvas, or Three.js scene)
  // Example: const svg = document.getElementById("tosenbo-visual"); // Assuming you add an element with this ID

  if (tosenboAnimationId !== null) {
    cancelAnimationFrame(tosenboAnimationId);
    tosenboAnimationId = null;
  }

  if (!svg) {
    // Replace 'svg' with your visual container
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
    return Math.min(1, rms * 2.5); // Adjust multiplier as needed
  }

  // Animation loop
  function animate() {
    const volume = updateAudio();
    // Add your visual logic here, e.g., scaling, color changes based on 'volume'
    // Example: svg.style.transform = `scale(${1 + volume})`;

    tosenboAnimationId = requestAnimationFrame(animate);
  }

  animate();

  return {
    remove() {
      if (tosenboAnimationId !== null) {
        cancelAnimationFrame(tosenboAnimationId);
        tosenboAnimationId = null;
      }
      // Reset visual state, e.g., svg.style.display = "none";
    },
  };
}

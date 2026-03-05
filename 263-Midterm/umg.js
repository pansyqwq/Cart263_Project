class HeartVisual {
  constructor(container, size = 100, color = "#FF4C4C") {
    this.container = container;
    this.size = size;
    this.color = color;
    this.heart = document.createElement("div");
    this.smoothRms = 0;
  }

  render() {
    // Make sure the container can position absolute children
    this.container.style.position = "relative";

    // Sets up the heart text
    this.heart.textContent = "♥";
    this.heart.style.position = "absolute";
    this.heart.style.fontSize = this.size + "px";
    this.heart.style.color = this.color;

    // Centers the heart in window with a vertical offset
    this.heart.style.left = "50%";
    this.heart.style.top = "40%";
    this.heart.style.transform = "translate(-50%, -50%)";

    // Changes the font to look more heart shaped
    this.heart.style.fontFamily = "'Segoe UI Symbol', 'Arial', sans-serif";

    // Adds to container
    this.container.appendChild(this.heart);
  }

  // Enables Heart Visual to accept RMS
  updateScale(rms) {
    // Smooth interpolation
    this.smoothRms = this.smoothRms * 0.85 + rms * 0.15;

    // Sensitivity control
    let scale = 1 + this.smoothRms / 60;

    this.heart.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  remove() {
    if (this.heart) {
      this.heart.remove();
      this.heart = null;
    }
  }
}

/* Global function so audio logic can utilize it */
function showHeartVisual() {
  const container = document.querySelector(".a-visuals");
  if (!container) return null;

  const heart = new HeartVisual(container, 450, "#706F6A");
  heart.render();
  return heart;
}

// Displays visual within window
window.showHeartVisual = showHeartVisual;

/* Gets the Amplitude from Audio and changes circle */
function getAmplitude(inputSource, audioContext, duration, heartVisual) {
  const analyser = audioContext.createAnalyser();
  inputSource.connect(analyser);

  analyser.fftSize = 2048;

  let frequencyData = new Uint8Array(analyser.frequencyBinCount);
  let stopped = false;
  let animRef;

  setTimeout(() => {
    stopped = true;
  }, duration);

  function runLoop() {
    let sum = 0;

    analyser.getByteTimeDomainData(frequencyData);

    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i] - 128;
      sum += value * value;
    }

    const rms = Math.sqrt(sum / frequencyData.length);

    // Animates the heart
    if (heartVisual) {
      heartVisual.updateScale(rms);
    }

    if (!stopped) {
      animRef = requestAnimationFrame(runLoop);
    } else {
      cancelAnimationFrame(animRef);
    }
  }

  animRef = requestAnimationFrame(runLoop);
}

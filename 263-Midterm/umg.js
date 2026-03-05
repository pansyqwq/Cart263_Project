class HeartVisual {
  constructor(container, size = 100, color = "#706F6A") {
    this.container = container;
    this.size = size;
    this.color = color;

    this.wrapper = document.createElement("div");
    this.left = document.createElement("img");
    this.right = document.createElement("img");

    this.smoothRms = 0;
  }

  render() {
    this.container.style.position = "relative";

    // Wrapper to center everything
    this.wrapper.style.position = "absolute";
    this.wrapper.style.left = "50%";
    this.wrapper.style.top = "50%";
    this.wrapper.style.transform = "translate(-50%, -50%)";
    this.wrapper.style.display = "flex";
    this.wrapper.style.alignItems = "center";

    // Image/SVG Sources
    this.left.src = "images/heart1.svg";
    this.right.src = "images/heart2.svg";

    // Adds margin to both halves to bring them closer
    this.left.style.marginRight = "-6px";
    this.right.style.marginLeft = "-6px";

    // Rotates the right heart half
    this.right.style.transform = "rotate(5deg)";

    // Scale Variable
    const heartScale = 0.8;

    // Size control
    this.left.style.width = (this.size / 2) * heartScale + "px";
    this.right.style.width = (this.size / 2) * heartScale + "px";

    this.left.style.height = "auto";
    this.right.style.height = "auto";

    // Appends the images and wrapper
    this.wrapper.appendChild(this.left);
    this.wrapper.appendChild(this.right);
    this.container.appendChild(this.wrapper);
  }

  // RMS Audio Scaling
  updateScale(rms) {
    this.smoothRms = this.smoothRms * 0.9 + rms * 0.1;

    // Sensitivity of the scale
    let scale = 1 + this.smoothRms / 380;
    // Adds a max cap to prevent spikes
    scale = Math.min(scale, 1.2);

    this.wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  remove() {
    if (this.wrapper) {
      this.wrapper.remove();
      this.wrapper = null;
    }
  }
}

/* Global function so audio logic can utilize it */
function showHeartVisual() {
  const container = document.querySelector(".a-visuals");
  if (!container) return null;

  const heart = new HeartVisual(container, 300, "#706F6A");
  heart.render();
  return heart;
}

// Displays visual within window
window.showHeartVisual = showHeartVisual;

// Makes RMS function accessible to other scripts
window.getAmplitude = getAmplitude;

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

function addBackgroundRectangle() {
  const container = document.querySelector(".a-visuals");
  if (!container) return;

  // Check if the rectangle already exists
  let rect = container.querySelector(".background-rect");
  if (!rect) {
    rect = document.createElement("div");
    rect.classList.add("background-rect");

    // Make it fill a portion below the visuals
    rect.style.position = "absolute";
    rect.style.left = "50%";
    rect.style.top = "50%"; // adjust vertical position
    rect.style.transform = "translate(-50%, -50%)";
    rect.style.width = "40%"; // adjust width
    rect.style.height = "325px"; // adjust height
    rect.style.backgroundColor = "#6E6E6E"; // color of rectangle
    rect.style.borderRadius = "10px"; // optional rounded corners
    rect.style.zIndex = "0"; // behind the heart/waveform

    // Insert it as the first element so it's behind
    container.insertBefore(rect, container.firstChild);
  }
}

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

  const heart = new HeartVisual(container, 360, "#706F6A");
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

/* --- WAVEFORM ---*/

function showWaveform(inputSource, audioContext, duration) {
  const container = document.querySelector(".a-visuals");
  if (!container) {
    console.error("Container .a-visuals not found");
    return;
  }

  // Create canvas if it doesn't exist yet
  let canvas = container.querySelector("canvas.waveform");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.classList.add("waveform");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    container.appendChild(canvas);
  }

  const context = canvas.getContext("2d");

  const analyser = audioContext.createAnalyser();
  inputSource.connect(analyser);

  analyser.fftSize = 2048;
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  let stopped = false;
  setTimeout(() => {
    stopped = true;
  }, duration);

  function animateWaveform() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    analyser.getByteTimeDomainData(frequencyData);

    // Decreases width of the waveform
    const waveformWidth = canvas.width * 0.4;
    context.beginPath();
    const sliceWidth = waveformWidth / frequencyData.length;
    // Centers waveform horizontally and vertically
    let x = (canvas.width - waveformWidth) / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < frequencyData.length; i += 8) {
      let v = (frequencyData[i] - 128) / 128;

      // Flattens lower frequency audi values
      if (Math.abs(v) < 0.18) v = 0;
      v = Math.pow(v, 3);

      const y = centerY + v * 120;

      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);

      x += sliceWidth * 8;
    }

    context.strokeStyle = "#fff";
    context.lineWidth = 5;
    context.stroke();

    if (!stopped) requestAnimationFrame(animateWaveform);
  }

  animateWaveform();
}

window.showWaveform = showWaveform;

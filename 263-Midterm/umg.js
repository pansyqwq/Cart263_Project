class HeartVisual {
  constructor(container, size = 100, color = "#FF4C4C") {
    this.container = container;
    this.size = size;
    this.color = color;
    this.heart = document.createElement("div");
  }

  render() {
    // Make sure the container can position absolute children
    this.container.style.position = "relative";

    // Sets up the heart text
    this.heart.textContent = "♥";
    this.heart.style.position = "absolute";
    this.heart.style.fontSize = this.size + "px";
    this.heart.style.color = this.color;

    // Centers the heart in window
    this.heart.style.left = "50%";
    this.heart.style.top = "50%";
    this.heart.style.transform = "translate(-50%, -50%)";

    // Changes the font to look more heart shaped
    this.heart.style.fontFamily = "'Segoe UI Symbol', 'Arial', sans-serif";

    // Adds to container
    this.container.appendChild(this.heart);
  }

  remove() {
    if (this.heart) {
      this.heart.remove();
      this.heart = null;
    }
  }
}

function showHeartVisual() {
  const container = document.querySelector(".a-visuals");
  if (!container) return null;

  const heart = new HeartVisual(container, 150, "#706F6A");
  heart.render();
  return heart;
}

// Global function so audio logic can utilize it
window.showHeartVisual = showHeartVisual;

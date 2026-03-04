class GreyCircle {
  constructor(container, size = 160, color = "#d9d9d9") {
    this.container = container;
    this.size = size;
    this.color = color;
    this.el = document.createElement("div");
  }

  render() {
    // ensure absolute positioning works inside container
    this.container.style.position = "relative";

    const centerX = this.container.clientWidth / 2;
    const centerY = this.container.clientHeight / 2;

    this.el.style.position = "absolute";
    this.el.style.width = this.size + "px";
    this.el.style.height = this.size + "px";
    this.el.style.background = this.color;
    this.el.style.borderRadius = "50%";

    // center it
    this.el.style.left = (centerX - this.size / 2) + "px";
    this.el.style.top = (centerY - this.size / 2) + "px";

    this.container.appendChild(this.el);
  }

  remove() {
    this.el.remove();
  }
}

   function showZureteikuVisual() {
  const container = document.querySelector(".a-visuals");
  if (!container) return null;

  const circle = new GreyCircle(container, 180, "#d9d9d9");
  circle.render();
  return circle;
}

// only show visual when the song plays
window.showZureteikuVisual = showZureteikuVisual;
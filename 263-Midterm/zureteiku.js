// zureteiku.js

class GreyCircle {
  constructor(container, size = 180, color = "#d9d9d9") {
    this.container = container;
    this.size = size;
    this.color = color;
    this.el = document.createElement("div");
  }

  render() {
    this.el.style.position = "absolute";
    this.el.style.width = this.size + "px";
    this.el.style.height = this.size + "px";
    this.el.style.background = this.color;
    this.el.style.borderRadius = "50%";
    this.el.style.left = "50%";
    this.el.style.top = "50%";
    this.el.style.transform = "translate(-50%, -50%)";
    this.el.style.zIndex = "10";
    this.el.style.pointerEvents = "none";
    this.container.appendChild(this.el);
  }

  remove() {
    this.el.remove();
  }
}

window.showZureteikuVisual = function () {
  const container = document.querySelector(".a-visuals");
  if (!container) {
    console.error("No .a-visuals container found");
    return null;
  }

  // Make sure container can hold absolute children
  container.style.position = "relative";
  container.style.overflow = "hidden";

  // Clear old visuals
  container.innerHTML = "";

  const files = [
    "images/One.png",
    "images/Two.png",
    "images/Three.png",
    "images/Four.png",
    "images/Five.png",
  ];

  // Add images as layered full-screen backgrounds
  files.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;

    // Debug: if image path is wrong, you'll see this in console
    img.onerror = () => console.error("Image failed to load:", src);
    img.onload = () => console.log("Loaded image:", src);

    img.style.position = "absolute";
    img.style.inset = "0";           // top/right/bottom/left = 0
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.zIndex = String(i);    // stack order
    img.style.opacity = "1";         // later you can change opacity for collage
    img.style.display = "block";

    container.appendChild(img);
  });

  // Circle on top
  const circle = new GreyCircle(container, 180, "#d9d9d9");
  circle.render();

  // Return object with remove() so audio.js clearVisual works
  return {
    remove() {
      container.innerHTML = "";
    },
  };
};
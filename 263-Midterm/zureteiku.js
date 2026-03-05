// zureteiku.js

function getContainRect(container, img) {
  const cw = container.clientWidth;
  const ch = container.clientHeight;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  if (!nw || !nh) {
    return { x: 0, y: 0, w: cw, h: ch, scale: 1 };
  }

  const scale = Math.min(cw / nw, ch / nh);
  const w = nw * scale;
  const h = nh * scale;
  const x = (cw - w) / 2;
  const y = (ch - h) / 2;

  return { x, y, w, h, scale };
}

class FitCircle {
  constructor(
    container,
    refImg,
    { u, v, size, color, z = 10, dx = 0, dy = 0, label = null }
  ) {
    this.container = container;
    this.refImg = refImg;

    this.u = u;
    this.v = v;

    this.size = size;
    this.color = color;
    this.z = z;

    this.dx = dx;
    this.dy = dy;

    this.label = label;

    this.scale = 1; // current scale multiplier

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.background = this.color;
    this.el.style.borderRadius = "50%";
    this.el.style.aspectRatio = "1 / 1";
    this.el.style.pointerEvents = "none";
    this.el.style.zIndex = String(this.z);

    // Center children (for label text)
    this.el.style.display = "flex";
    this.el.style.alignItems = "center";
    this.el.style.justifyContent = "center";

    this.container.appendChild(this.el);

    if (this.label) {
      const text = document.createElement("span");
      text.textContent = this.label;

      text.style.color = "#787878";
      // Use your @font-face name (recommended)
      text.style.fontFamily = "HelveticaOblique, Helvetica, Arial, sans-serif";
      text.style.fontWeight = "bold";
      text.style.fontSize = "clamp(10px, 2vmin, 22px)";
      text.style.textAlign = "center";

      this.el.appendChild(text);
    }

    this.update();
  }

  setScale(s) {
    this.scale = s;
  }

  update() {
    const r = getContainRect(this.container, this.refImg);

    // Base circle size based on displayed image width
    const s = r.w * this.size;

    // Circle center position in container pixels
    const cx = r.x + r.w * this.u + this.dx * r.scale;
    const cy = r.y + r.h * this.v + this.dy * r.scale;

    // Size + position
    this.el.style.width = s + "px";
    this.el.style.left = (cx - s / 2) + "px";
    this.el.style.top = (cy - s / 2) + "px";

    // Apply audio-driven scale (without breaking position math)
    this.el.style.transform = `scale(${this.scale})`;
    this.el.style.transformOrigin = "center";
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

  container.style.position = "relative";
  container.style.overflow = "hidden";
  container.innerHTML = "";

  const files = [
    "images/One.png",
    "images/Two.png",
    "images/Three.png",
    "images/Four.png",
    "images/Five.png",
  ];

  let refImg = null;
  const imgs = [];

  // Per-image drift state
  const drift = []; // { img, phase, baseSpeed, ampBase }

  // Create layered images
  files.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;

    img.style.position = "absolute";
    img.style.inset = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    img.style.zIndex = String(i);
    img.style.display = "block";
    img.style.willChange = "transform";

    container.appendChild(img);

    imgs.push(img);
    if (i === 0) refImg = img;

    drift.push({
      img,
      phase: Math.random() * Math.PI * 2,
      baseSpeed: 0.6 + Math.random() * 1.2 + i * 0.08, // each image different initial speed
      ampBase: 3 + i * 1.5 + Math.random() * 2.5,      // base movement in px
    });
  });

  let circles = [];
  let greyCircle = null; // reference to the top circle
  let t = 0;             // time accumulator for smooth pulsing

  function buildCircles() {
    if (!refImg || !refImg.naturalWidth) return;

    circles.forEach((c) => c.remove());
    circles = [];
    greyCircle = null;

    // Dark circles (bottom layer)
    circles.push(
      new FitCircle(container, refImg, {
        u: 0.9,
        v: 0.5,
        size: 0.2,
        color: "#868585ff",
        z: -1,
      })
    );

    circles.push(
      new FitCircle(container, refImg, {
        u: 0.1,
        v: 0.6,
        size: 0.18,
        color: "#868585ff",
        z: -1,
      })
    );

    // Grey circle (top layer)
    greyCircle = new FitCircle(container, refImg, {
      u: 0.5,
      v: 0.5,
      size: 0.16,
      color: "#d9d9d9",
      z: 10,
      dx: -20,
      dy: 60,
      label: "out of step",
    });
    circles.push(greyCircle);
  }

  function onResize() {
    buildCircles();
  }

  // Build circles when the reference image is ready
  if (refImg.complete) buildCircles();
  else refImg.onload = buildCircles;

  window.addEventListener("resize", onResize);

  return {
    // audio.js calls update(vol, dt)
    update(vol, dt) {
      // Drift images vertically based on volume
      for (const d of drift) {
        const speed = d.baseSpeed + vol * 2.0;
        const amp = d.ampBase * (0.4 + vol * 1.6);

        d.phase += speed * dt;

        const y = Math.sin(d.phase) * amp;
        d.img.style.transform = `translateY(${y.toFixed(2)}px)`;
      }

      // 2) Pulse the grey circle scale based on volume (like your keyframes)
      t += dt;

      // 8-second breathing wave: 0..1
      const wave = (Math.sin((t * 2 * Math.PI) / 8) + 1) / 2;

      // strength based on volume (quiet = small pulse, loud = bigger pulse)
      const strength = Math.min(1, vol * 1.3);

      // scale from 1.0 -> 1.1
      const scale = 1 + 0.1 * wave * strength;

      if (greyCircle) {
        greyCircle.setScale(scale);
        greyCircle.update();
      }
    },

    remove() {
      window.removeEventListener("resize", onResize);
      container.innerHTML = "";
    },
  };
};
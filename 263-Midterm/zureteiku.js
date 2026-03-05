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
    { u, v, size, color, z = 10, dx = 0, dy = 0, label = null },
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

    this.el = document.createElement("div");

    this.el.style.position = "absolute";
    this.el.style.background = this.color;
    this.el.style.borderRadius = "50%";
    this.el.style.aspectRatio = "1 / 1";
    this.el.style.pointerEvents = "none";
    this.el.style.zIndex = String(this.z);

    // center text inside circle
    this.el.style.display = "flex";
    this.el.style.alignItems = "center";
    this.el.style.justifyContent = "center";

    this.container.appendChild(this.el);

    if (this.label) {
      const text = document.createElement("span");
      text.textContent = this.label;

      text.style.color = "#787878";

      // IMPORTANT: match your @font-face name in CSS
      // If your CSS uses font-family: "HelveticaOblique"; use that here:
      text.style.fontFamily = "HelveticaOblique, Helvetica, Arial, sans-serif";

      text.style.fontWeight = "bold";
      text.style.fontSize = "clamp(10px, 2vmin, 22px)";
      text.style.textAlign = "center";

      this.el.appendChild(text);
    }

    this.update();
  }

  update() {
    const r = getContainRect(this.container, this.refImg);

    const s = r.w * this.size;

    const cx = r.x + r.w * this.u + this.dx * r.scale;
    const cy = r.y + r.h * this.v + this.dy * r.scale;

    this.el.style.width = s + "px";

    this.el.style.left = cx - s / 2 + "px";
    this.el.style.top = cy - s / 2 + "px";
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

    // Give each layer a different starting speed + phase + base amplitude
    drift.push({
      img,
      phase: Math.random() * Math.PI * 2,
      baseSpeed: 0.6 + Math.random() * 1.2 + i * 0.08, // different initial speed
      ampBase: 3 + i * 1.5 + Math.random() * 2.5,      // base vertical movement (px)
    });
  });

  let circles = [];

  function buildCircles() {
    if (!refImg || !refImg.naturalWidth) return;

    circles.forEach((c) => c.remove());
    circles = [];

    circles.push(
      new FitCircle(container, refImg, {
        u: 0.9,
        v: 0.5,
        size: 0.2,
        color: "#787878",
        z: -1,
      }),
    );

    circles.push(
      new FitCircle(container, refImg, {
        u: 0.1,
        v: 0.6,
        size: 0.18,
        color: "#787878",
        z: -1,
      }),
    );

    circles.push(
      new FitCircle(container, refImg, {
        u: 0.5,
        v: 0.5,
        size: 0.16,
        color: "#d9d9d9",
        z: 10,
        dx: -20,
        dy: 60,
        label: "out of step",
      }),
    );
  }

  // On resize: rebuild circles (because circle size depends on image rect)
  function onResize() {
    buildCircles();
  }

  // Build circles when reference image is ready
  if (refImg.complete) buildCircles();
  else refImg.onload = buildCircles;

  window.addEventListener("resize", onResize);

  return {
    // audio.js will call this each frame: update(volume, dt)
    update(vol, dt) {
      // vol is 0..1, dt is seconds since last frame

      for (const d of drift) {
        // Make speed respond to volume
        const speed = d.baseSpeed + vol * 2.0;

        // Make amplitude respond to volume (more movement when louder)
        const amp = d.ampBase * (0.4 + vol * 1.6);

        d.phase += speed * dt;

        const y = Math.sin(d.phase) * amp;

        // Move vertically. Each image has its own phase/speed.
        d.img.style.transform = `translateY(${y.toFixed(2)}px)`;
      }
    },

    remove() {
      window.removeEventListener("resize", onResize);
      container.innerHTML = "";
    },
  };
};
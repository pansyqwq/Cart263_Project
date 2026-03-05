// zureteiku.js


// This function calculates the visible rectangle of an image
// when object-fit: contain is applied.
// Because contain preserves the aspect ratio, the image may not
// fill the entire container. This function determines where the
// image is actually drawn inside the container.
function getContainRect(container, img) {

  const cw = container.clientWidth;
  const ch = container.clientHeight;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  // If the image has not loaded yet, return container size
  if (!nw || !nh) {
    return { x: 0, y: 0, w: cw, h: ch, scale: 1 };
  }

  // Determine scale factor used by object-fit: contain
  const scale = Math.min(cw / nw, ch / nh);

  const w = nw * scale;
  const h = nh * scale;

  // Center the image inside the container
  const x = (cw - w) / 2;
  const y = (ch - h) / 2;

  return { x, y, w, h, scale };
}


/*
Circle that is positioned relative to the image instead of the container.

u, v  → normalized coordinates (0–1) inside the image
size  → circle size relative to image width
dx,dy → optional pixel offsets (scaled with the image)
z     → layer order
*/
class FitCircle {

  constructor(container, refImg, { u, v, size, color, z = 10, dx = 0, dy = 0 }) {

    this.container = container;
    this.refImg = refImg;

    this.u = u;
    this.v = v;

    this.size = size;

    this.color = color;
    this.z = z;

    this.dx = dx;
    this.dy = dy;

    // Create DOM element
    this.el = document.createElement("div");

    this.el.style.position = "absolute";
    this.el.style.background = this.color;
    this.el.style.borderRadius = "50%";

    // Guarantees the element always stays a perfect circle
    this.el.style.aspectRatio = "1 / 1";

    this.el.style.pointerEvents = "none";
    this.el.style.zIndex = String(this.z);

    this.container.appendChild(this.el);

    // Initial positioning
    this.update();
  }


  // Update circle size and position based on image scaling
  update() {

    const r = getContainRect(this.container, this.refImg);

    // Circle size scales relative to the displayed image width
    const s = r.w * this.size;

    // Compute circle center position
    const cx = r.x + r.w * this.u + this.dx * r.scale;
    const cy = r.y + r.h * this.v + this.dy * r.scale;

    this.el.style.width = s + "px";

    this.el.style.left = (cx - s / 2) + "px";
    this.el.style.top = (cy - s / 2) + "px";
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

  // Ensure container supports absolute positioning
  container.style.position = "relative";
  container.style.overflow = "hidden";

  // Clear previous visuals
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


  // Create layered images
  files.forEach((src, i) => {

    const img = document.createElement("img");

    img.src = src;

    img.style.position = "absolute";
    img.style.inset = "0";

    img.style.width = "100%";
    img.style.height = "100%";

    // Always show the entire image without cropping
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";

    img.style.zIndex = String(i);

    img.style.display = "block";

    container.appendChild(img);

    imgs.push(img);

    // Use the first image as reference for scaling
    if (i === 0) refImg = img;

  });


  let circles = [];


  function buildCircles() {

    // Prevent building circles before image dimensions are known
    if (!refImg || !refImg.naturalWidth) return;

    // Remove old circles
    circles.forEach(c => c.remove());
    circles = [];


    // Dark background circles (bottom layer)

    circles.push(new FitCircle(container, refImg, {
      u: 0.90,
      v: 0.50,
      size: 0.20,
      color: "#787878",
      z: -1
    }));


    circles.push(new FitCircle(container, refImg, {
      u: 0.10,
      v: 0.60,
      size: 0.18,
      color: "#787878",
      z: -1
    }));


    // Foreground grey circle (top layer)

    circles.push(new FitCircle(container, refImg, {
      u: 0.5,
      v: 0.5,
      size: 0.16,
      color: "#d9d9d9",
      z: 10,
      dx: -20,
      dy: 60
    }));

  }



  // Update circle positions when window size changes
  function onResize() {

    circles.forEach(c => c.update());

  }



  // Wait until reference image loads before building circles
  if (refImg.complete) buildCircles();
  else refImg.onload = buildCircles;


  window.addEventListener("resize", onResize);



  return {

    remove() {

      window.removeEventListener("resize", onResize);

      container.innerHTML = "";

    }

  };

};
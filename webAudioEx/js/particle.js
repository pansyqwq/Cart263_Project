class Particle { //class group a set of data, needed if we need namy particle with variation of data
  constructor(x, y, canvas, context) { //the constructor is what makes it, we call the constructor
    this.x = x;
    this.y = y;
    this.scale = Math.random();
    this.speedX = 0;
    this.speedY = Math.random() * 10;
    this.color = {
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
    };
    this.canvas = canvas;//we need the canvas and the contect in the particle object class, allowing things to share information 
    this.context = context;
    this.startAngle = 0;
    this.endAngle = Math.PI * 2; //full rotation
  }

  // use FFT bin level to change speed and diameter
  update(someLevel) {
    this.y += this.speedY / (someLevel * 2);
    if (this.y > this.canvas.height) {
      this.y = 0;
    }
    // the freq in is between 0-1
    this.diameter = mapNumRange(someLevel, 0, 1, 0, 50) * this.scale;
    //console.log(this.diameter);
  }

  draw() {
    this.context.beginPath();
    this.context.fillStyle =  `rgba(${this.color.r},${this.color.g},${this.color.b},255)`;// the color changes according to the x and y 
    this.context.arc(this.x, this.y, this.diameter/2,this.startAngle, this.endAngle, true);
    this.context.fill(); // set the fill
    this.context.closePath();
  }
}
// const mapNumRange = function (num, inMin, inMax, outMin, outMax) {
//   return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
// };

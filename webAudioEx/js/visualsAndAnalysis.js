/***********************ANALYZE SPECTRUM ********************************************/

function analyzeSpectrum(inputSource, audioContext) {
  const analyser = audioContext.createAnalyser();
  inputSource.connect(analyser);

  analyser.fftSize = 256;// the more ou have the more bins you have, it have to be the multiple of 8 

  console.log(analyser.frequencyBinCount); // HALF OF FFT SIZE -> total number of data points available

  let frequencyData = new Uint8Array(analyser.frequencyBinCount);

  console.log(frequencyData.length);

  let canvas = document.getElementById("testCanvas");
  //get the context
  let context = canvas.getContext("2d");

  //call loop ...
  requestAnimationFrame(animateFrequenciesSpectrum);// basically a call function

  /****our looping callback function */ 
  function animateFrequenciesSpectrum() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    analyser.getByteFrequencyData(frequencyData);// get the range of frequencies

    context.fillStyle = "rgb(0 0 0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let barWidth = (canvas.width / frequencyData.length) * 2.5 - 1;
    let barHeight;
    let x = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      barHeight = frequencyData[i];

      context.fillStyle = `rgb(${barHeight + 100} 50 50)`;
      context.fillRect(
        x,
        canvas.height - barHeight / 2,
        barWidth,
        barHeight / 2,
      );
      x += barWidth;
    }
    requestAnimationFrame(animateFrequenciesSpectrum);
  }
}
/***********************ANALYZE SPECTRUM TIME DOMAN ********************************************/

function analyzeSpectrumTime(inputSource, audioContext, duration) {
  const analyser = audioContext.createAnalyser();
  inputSource.connect(analyser);

  analyser.fftSize = 2048;

  console.log(analyser.frequencyBinCount); // HALF OF FFT SIZE -> total number of data points available

  let frequencyData = new Uint8Array(analyser.frequencyBinCount);

  let animRef;
  let stopped = false;

  setTimeout(function () {
    stopped = true;
  }, duration);

  let canvas = document.getElementById("testCanvas");
  //get the context
  let context = canvas.getContext("2d");

  //call loop ...
  animRef = requestAnimationFrame(animateFrequenciesTime);

  /****our looping callback function */
  function animateFrequenciesTime() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    analyser.getByteTimeDomainData(frequencyData);

    context.fillStyle = "rgb(220, 11, 11)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 2;

    context.strokeStyle = "rgb(0 0 0)";
    let sliceWidth = canvas.width / frequencyData.length;
    let x = 0;

    context.beginPath();
    for (let i = 0; i < frequencyData.length; i++) {
      //console.log(frequencyData[i] ) // between 0 and 255
      const v = frequencyData[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }

      x += sliceWidth;
    }

    context.lineTo(canvas.width, canvas.height / 2);
    context.stroke();
    if (stopped === false) {
      animRef = requestAnimationFrame(animateFrequenciesTime);
    } else {
      cancelAnimationFrame(animRef);
    }
  }
}
/********************************ANALYZE AND APPLY TO PARTICLES******************************* */
function analyzeAndApplyToParticles(inputSource, audioContext, duration) {
  const analyser = audioContext.createAnalyser();
  inputSource.connect(analyser);

  analyser.fftSize = 64;

  console.log(analyser.frequencyBinCount); // HALF OF FFT SIZE -> total number of data points available

  let frequencyData = new Uint8Array(analyser.frequencyBinCount);

  let canvas = document.getElementById("testCanvas");
  //get the context
  let context = canvas.getContext("2d");
  let particles = [];
  let animRef;
  let stopped = false;

  setTimeout(function () {
    stopped = true;
  }, duration);

  for (let i = 0; i < analyser.frequencyBinCount; i++) {
    let x = mapNumRange(i, 0, analyser.frequencyBinCount, 0, canvas.width * 2); //generating x according to the frequency, the frequency wasn't detected at this point, we are just dividing the canvas into sections for this line
    let y = Math.random() * canvas.height;//randomizing y
    particles[i] = new Particle(x, y, canvas, context);
  }

  animRef = requestAnimationFrame(drawFrequencies);

  // in this example we have a circle (particle) representing a BIN.
  // the more dominant the frequency in a particular bin is the higher the number in that bin

  //(so our particle will get larger -> has more frequencies in the bin)
  function drawFrequencies() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    //for each frame -> get the array of frequency data
    //composed of values between 0-255

    analyser.getByteFrequencyData(frequencyData);
    // update and draw all [binCount] particles!
    // Each particle gets a level that corresponds to
    // the level at one bin of the FFT spectrum.
    // This level is like amplitude, often called "energy."
    // It will be a number between 0-255.

    ////each respective frequency goes in its own bin
    //lowest to highest frequency domain

    /* looking for dominant frequencies*/
    /* higher bars === more dominant frequency  (db)*/

    //each bin represents a given frequency

    for (let i = 0; i < analyser.frequencyBinCount; i++) {
      //console.log(frequencyData[i])

      let thisLevel = mapNumRange(frequencyData[i], 0, 255, 0, 1);// the frequeny is between 0 and 255, but we set it between 0 and 1

      // update values based on amplitude at this part of the frequency spectrum
      particles[i].update(thisLevel);

      // draw the particle
      particles[i].draw();
    }

    if(stopped ===false){
    animRef =requestAnimationFrame(drawFrequencies);
    }
    else{
        cancelAnimationFrame(animRef)
    }
    
  }
}

/***************************GET AMPLITUDE *******************/
// You can calculate peak amplitude or RMS (Root Mean Square)

function getAmplitude(inputSource, audioContext, duration) {
  const analyser = audioContext.createAnalyser();
  inputSource.connect(analyser);

  analyser.fftSize = 2048;
  let animRef;
  let stopped = false;

  console.log(analyser.frequencyBinCount); // HALF OF FFT SIZE -> total number of data points available

  let frequencyData = new Uint8Array(analyser.frequencyBinCount);
  let prevmrs =0

  setTimeout(function () {
    stopped = true;
  }, duration);

  animRef = requestAnimationFrame(runLoop);
  
    let radiusOFEllipse=50;

    let startAngle = 0;
    let endAngle = Math.PI * 2; //full rotation



  let canvas = document.getElementById("testCanvas");
  //get the context
  let context = canvas.getContext("2d");
  function runLoop() {
    let sum = 0;
    analyser.getByteTimeDomainData(frequencyData);
    for (let i = 0; i < analyser.frequencyBinCount; i++) {
      // For byte data (0-255), you might want to center it around 128 first for amplitude calculation

      const value = frequencyData[i] - 128;
      sum += value * value;
    }
    //he Root Mean Square (RMS) amplitude measures the effective power of a waveform
    const rms = Math.sqrt(sum / frequencyData.length);
    console.log("Current RMS Amplitude:", rms);


    //ADD SABS - use as animation
    if(prevmrs > rms){
        prevmrs=0
        radiusOFEllipse=50


    }
    else{
        prevmrs=rms
        radiusOFEllipse+=1
    }



    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `rgb(0,0,0)`;
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.beginPath();
    context.fillStyle =  `rgba(255,0,0)`;
    context.arc(canvas.width/2, canvas.height/2,radiusOFEllipse ,startAngle, endAngle, true);
    context.fill(); // set the fill
    context.closePath();


    if (stopped === false) {
      animRef = requestAnimationFrame(runLoop);
    } else {
      cancelAnimationFrame(animRef);
    }
  }
}

/***************************HELPER************************** */

const mapNumRange = function (num, inMin, inMax, outMin, outMax) {
  return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

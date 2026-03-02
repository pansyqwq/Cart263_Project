window.onload = go;

function go() {
  const audioContext = new AudioContext();
  let audioSource = null;
  let soundPlaying = false;
  let note = new Sound(audioContext); //make an instance...
  let freqVal = 220;
  /*****************************JUST PLAY A NOTE********************************** */

  document.querySelector("#note-detect").addEventListener("click", function () {
    let freq = parseInt(document.querySelector("#freq").value);
    note.offsetDuration = 3;
    let now = audioContext.currentTime;
    note.play(freq, now);
    //analyzeSpectrum(note.oscillator,audioContext,note.offsetDuration*1000);
    //analyzeSpectrumTime(note.oscillator,audioContext,note.offsetDuration*1000)
    //getAmplitude(note.oscillator,audioContext,note.offsetDuration*1000)


  });

  /********************************LOAD AUDIO FUNCTION ******************************* */
  function getAudio(fileName) {
    return new Promise(async function (resolve, reject) {
      const source = audioContext.createBufferSource();
      // data is initially put into a buffer
      const audioBuffer = await fetch(fileName);
      //get data from the audioBuffer
      const resultArrayBuffer = await audioBuffer.arrayBuffer();
      //decode the data
      const decodedData = await audioContext.decodeAudioData(resultArrayBuffer);
      source.buffer = decodedData;
      resolve(source);
    });
  } // getAudio
  /********************************LOAD SOUND FROM DROPDOWN ******************************* */
  // Add a 'change' event listener
  document
    .querySelector("#sound_dropdown")
    .addEventListener("change", async function (event) {
      // The event.target property refers to the select element
      const selectedValue = event.target.value;

      if (selectedValue !== "select") {
        console.log(selectedValue);

        if (audioSource !== null && soundPlaying === true) {
          audioSource.stop();
          audioContext.resume();
          soundPlaying = false;
        }

        audioSource = await getAudio(`sounds/${selectedValue}`);
        console.log(`loaded audio source: ${selectedValue}`);
        document.querySelector("#message").innerHTML =
          `loaded audio source: ${selectedValue}`;
      }
    });

  /********************************PLAY SOUND******************************* */

  document.querySelector("#start").addEventListener("click", async function () {
    //check if audioSource is loaded
    if (audioSource !== null) {
      // if sound was already playing and is paused we are resuming
      if (audioContext.state === "suspended" && soundPlaying === true) {
        await audioContext.resume();
        console.log("resumed");
        document.querySelector("#message").innerHTML = "resumed sound";
      }

      // first time playing
      else if (soundPlaying === false) {
        audioSource.connect(audioContext.destination);
        audioSource.start(0);
        audioSource.loop = true;
        soundPlaying = true;
        document.querySelector("#message").innerHTML = "playing sound";
      }
      //no change (sound is already playing)
      else {
        console.log("already running");
        document.querySelector("#message").innerHTML = "sound already playing";
      }

      //analyzeAndApplyToParticles(audioSource,audioContext,10000);
     // analyzeSpectrumTime(audioSource,audioContext,10000)
       //getAmplitude(audioSource,audioContext,60000)


    } else {
      console.log("no sound loaded");
      document.querySelector("#message").innerHTML = "no sound loaded";
    }
  });
  /********************************PAUSE SOUND ******************************* */
  document.querySelector("#stop").addEventListener("click", async function () {
    if (audioContext.state === "running") {
      await audioContext.suspend();
      console.log("suspended");
      document.querySelector("#message").innerHTML = "paused sound";
    }
  });

  }


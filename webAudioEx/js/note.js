/*** class for sound  inspired and copy-lefted from::
https://css-tricks.com/introduction-web-audio-api/*/
class Sound {
  constructor(context) {
    this.context = context;
    this.offsetDuration = 0;

  }

  init() {
    this.oscillator = this.context.createOscillator();
    //for volume
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = "sine";
  }

  play(value, time) {
    this.init();
    this.oscillator.frequency.value = value;
    //set gain
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

    this.oscillator.start(time);
    // How LONG should duration of note be?
    this.stop(time + this.offsetDuration);
  }

  stop(time) {
    // gradual change in value
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1);
    this.oscillator.stop(time + 0);
    
  }
} //end SOund object

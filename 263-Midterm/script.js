const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPause");
const volumeSlider = document.getElementById("volumeSlider");

// playPauseBtn.addEventListener("click", () => {
//   if (audio.paused) {
//     audio.play();
//     playPauseBtn.textContent = "Stop";
//   } else {
//     audio.pause();
//     playPauseBtn.textContent = "Play";
//   }
// });

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

/*
 * Entry point for the watch app
 */
import document from "document";
import clock from "clock";
clock.granularity = "seconds";

//grab screen elements
let background = document.getElementById("background");
let backgroundColor = document.getElementsByClassName("backgroundColor")
let progressArc = document.getElementById("progressArc");
let backgroundArc = document.getElementById("backgroundArc");
let countdown = document.getElementById("countdown");
let sprintCounter = document.getElementById("sprintCounter");
let playPauseButton = document.getElementById("playPauseButton");
let playPauseIcon = playPauseButton.getElementById("combo-button-icon");
let playPauseIconPressed = playPauseButton.getElementById("combo-button-icon-press");
let oldBackground = background.value;
background.value = 0;


let intervalInSeconds = 1500;
let formattedHours = 0;
let formattedMinutes = 0;
let formattedSeconds = 0;
let seconds = intervalInSeconds;
let counting = false;

function secondsToAngle(seconds){
  //degree per second * elapsedseconds
  return (360/intervalInSeconds) * seconds;
}

function progress(){
  if (counting){
    seconds--;

    //calculate and update angle
    let a = secondsToAngle(intervalInSeconds - seconds);
    progressArc.sweepAngle = a;

    //calculate time left
    formattedHours = Math.floor((seconds/60/60) % 60);
    formattedMinutes = Math.floor((seconds/60) % 60);
    formattedSeconds = Math.floor(seconds % 60);

    //pad with 0
    formattedHours = formattedHours < 10 ? "0" + formattedHours : formattedHours;
    formattedMinutes = formattedMinutes < 10 ? "0" + formmatedMinutes : formattedMinutes;
    formattedSeconds = formattedSeconds < 10 ? "0" + formattedSeconds : formattedSeconds;

    //update countdown text
    countdown.text = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
}

clock.ontick = () => progress();

playPauseButton.onactivate = (evt) => {
  //countingdown
  if (counting){
    counting = false
    playPauseIcon.image = "play.png";
    playPauseIconPressed.image = "play_press.png";
  } //paused
  else{
    counting = true;
    playPauseIcon.image = "pause.png";
    playPauseIconPressed.image = "pause_press.png";
  }
  
}


//style functions
setInterval(()=>{
  if(background.value != oldBackground){
    applyStyle(background.value);
    oldBackground = background.value;
  }}, 100);

function applyStyle(value){
  let colorProfile = style[value];
  backgroundColor[value].style.fill = colorProfile.background;
  progressArc.style.fill = colorProfile.accentColor;
  backgroundArc.style.fill = colorProfile.backgroundArc;
  countdown.style.fill = colorProfile.accentColor;
  playPauseButton.style.fill = colorProfile.accentColor;
  // pauseButton.style.fill = colorProfile.accentColor;
  sprintCounter.style.fill = colorProfile.baseColor;
}

const style = [
  { background: "#000",
    baseColor: "#fff",
    accentColor: "#FF9F1E",
    backgroundArc: "#636366"
  },
  { background: "#000",
    baseColor: "#fff",
    accentColor: "#00FFFF",
    backgroundArc: "#636366"  
  },
  { background: "#000",
    baseColor: "#fff",
    accentColor: "#48f442",
    backgroundArc: "#636366"
  },
  { background: "#000",
    baseColor: "#fff",
    accentColor: "#f727ca",
    backgroundArc: "#636366"
  },
  { background: "#44090C",
    baseColor: "#fff",
    accentColor: "#fff",
    backgroundArc: "#636366"
  },
  { background: "#51a3a3",
    baseColor: "#fff",
    accentColor: "#dfcc74",
    backgroundArc: "#636366"
  },
  { background: "#0b032d",
    baseColor: "#fff",
    accentColor: "#f67e7d",
    backgroundArc: "#636366"
  }
];
//style functions

import document from "document";

//grab screen elements
const background = document.getElementById("background");
const backgroundColor = document.getElementsByClassName("backgroundColor")
const progressArc = document.getElementById("progressArc");
const backgroundArc = document.getElementById("backgroundArc");
const countdown = document.getElementById("countdown");
const sprintCounter = document.getElementById("sprintCounter");
const playPauseButton = document.getElementById("playPauseButton");
const playPauseIcon = playPauseButton.getElementById("combo-button-icon");
const playPauseIconPressed = playPauseButton.getElementById("combo-button-icon-press");
const oldBackground = background.value;

export function style(){
  background.value = 0;
  
  //check if they changed the background every 100 ms
  setInterval(()=>{
  if(background.value != oldBackground){
    applyStyle(background.value);
    oldBackground = background.value;
  }}, 100);
}

function applyStyle(value){
  let colorProfile = styleProfiles[value];
  backgroundColor[value].style.fill = colorProfile.background;
  progressArc.style.fill = colorProfile.accentColor;
  backgroundArc.style.fill = colorProfile.backgroundArc;
  countdown.style.fill = colorProfile.accentColor;
  playPauseButton.style.fill = colorProfile.accentColor;
  // pauseButton.style.fill = colorProfile.accentColor;
  sprintCounter.style.fill = colorProfile.baseColor;
}

const styleProfiles = [
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
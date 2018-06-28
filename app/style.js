//style functions

import document from "document";

//grab screen elements
const background = document.getElementById("background");
const backgroundColor = document.getElementsByClassName("backgroundColor");
const progressArc = document.getElementById("progressArc");
const backgroundArc = document.getElementById("backgroundArc");
const countdown = document.getElementById("countdown");
const setCounter = document.getElementById("setCounter");
const playPauseButton = document.getElementById("playPauseButton");
const restartSkipButton = document.getElementById("restartSkipButton");
const oldBackground = background.value;

let styleInterval;

export function style(){
  //check if they changed the background every 100 ms
  styleInterval = setInterval(()=>{
    if(background.value != oldBackground){
      applyStyle(background.value);
      oldBackground = background.value;
    }}, 500);
}

export function stopStyle(){ // optimize battery life
  console.log("screen off.  No style interval necessary");
  clearInterval(styleInterval);
}

let colorProfile;
function applyStyle(value){
  colorProfile = styleProfiles[value];
  
  backgroundColor[value].style.fill = colorProfile.background;
  progressArc.style.fill = colorProfile.accentColor;
  backgroundArc.style.fill = colorProfile.backgroundArc;
  countdown.style.fill = colorProfile.accentColor;
  playPauseButton.style.fill = colorProfile.accentColor;
  restartSkipButton.style.fill = colorProfile.accentColor;
  setCounter.style.fill = colorProfile.baseColor;
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
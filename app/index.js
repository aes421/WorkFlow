/*
 * Entry point for the watch app
 */
import document from "document";
import clock from "clock";

let background = document.getElementById("background");
let play = document.getElementById("playButton");
let pause = document.getElementById("pauseButton");

let currentIndex = background.value;
background.value = 0;

clock.granularity = "seconds";
let startTime;
let hours = 0;
let minutes = 0;
let seconds = 0;

function minutesToAngle(minutes){
  return (360/60) * minutes;
}

function secondsToAngle(seconds){
  return (360/60) * seconds;
}

function progress(){
  seconds += 1;
  if (seconds >= 60){
    minutes += 1;
    seconds = 0;
    if (minutes >= 60){
      hours += 1;
      minutes = 0;
    }
  }
  
  console.log(hours + ":" + minutes + ":" + seconds);
  
}

clock.ontick = () => progress();

play.onactivate = (evt) => startTime = new Date();
/*
 * Entry point for the watch app
 */
import document from "document";
import clock from "clock";

let background = document.getElementById("background");
let play = document.getElementById("playButton");
let pause = document.getElementById("pauseButton");
let progressArc = document.getElementById("progressArc");
let countdown = document.getElementById("countdown");
let sprintCounter = document.getElementById("sprintCounter");

let currentIndex = background.value;
background.value = 0;

clock.granularity = "seconds";
let intervalInSeconds = 1500;
let formattedHours = 0;
let formattedMinutes = 0;
let formattedSeconds = 0;
let seconds = 0;

function secondsToAngle(seconds){
  return (360/intervalInSeconds) * seconds;
}

function progress(){
  seconds += 1;
  formattedSeconds++;
  if (formattedSeconds >= 60){
    formattedMinutes += 1;
    formattedSeconds = 0;
    if (formattedMinutes >= 60){
      formattedHours += 1;
      formattedMinutes = 0;
    }
  }
  
  let a = secondsToAngle(seconds);
  progressArc.sweepAngle = a;
  countdown.text = formattedHours + ":" + formattedMinutes + ":" + formattedSeconds;
  
}

clock.ontick = () => progress();

play.onactivate = (evt) => {}
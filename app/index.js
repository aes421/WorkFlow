/*
 * Entry point for the watch app
 */
import document from "document";
import clock from "clock";
clock.granularity = "seconds";

let background = document.getElementById("background");
let play = document.getElementById("playButton");
let pause = document.getElementById("pauseButton");
let progressArc = document.getElementById("progressArc");
let countdown = document.getElementById("countdown");
let sprintCounter = document.getElementById("sprintCounter");

let currentIndex = background.value;
background.value = 0;

let intervalInSeconds = 1500;
let formattedHours = 0;
let formattedMinutes = 0;
let formattedSeconds = 0;
let seconds = intervalInSeconds;

function secondsToAngle(seconds){
  //degree per second * elapsedseconds
  return (360/intervalInSeconds) * seconds;
}

function progress(){
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

clock.ontick = () => progress();

play.onactivate = (evt) => {}
/*
 * Entry point for the watch app
 */
import document from "document";
import clock from "clock";
clock.granularity = "seconds";
import { style } from "./style.js"

//grab screen elements
const progressArc = document.getElementById("progressArc");
const countdown = document.getElementById("countdown");
const sprintCounter = document.getElementById("sprintCounter");
const sessionText = document.getElementById("sessionText");
const playPauseButton = document.getElementById("playPauseButton");
const playPauseIcon = playPauseButton.getElementById("combo-button-icon");
const playPauseIconPressed = playPauseButton.getElementById("combo-button-icon-press");


const flowInSeconds = 5;//1500;
const shortBreakInSeconds = 10;//300;
const longBreakInSeconds = 15;//900;
const sprints = 4;
const flowText = "Flow";
const breakText = "Break";


let formattedHours = 0;
let formattedMinutes = 0;
let formattedSeconds = 0;
let seconds = flowInSeconds;
let counting = false;

//used to toggle between flow sessions and breaks
let flow = true;
let sessionTime = flowInSeconds;
let currentSprint = 1;

console.log(style);
style();
clock.ontick = () => progress();
playPauseButton.onactivate = (evt) => {
  //countingdown
  if (counting){
    pause();
  } //paused
  else{
    play();
  }
  
}

function secondsToAngle(seconds){
  //degree per second * elapsedseconds
  return (360/sessionTime) * seconds;
}

function progress(){
  if (counting){
    if( !isSprintOver(seconds) ) {
      seconds--;
      //calculate and update angle
      progressArc.sweepAngle = secondsToAngle(sessionTime - seconds);
    }
  }
  
  formatCountdown(seconds);
}

function isSprintOver(seconds){
  if(seconds === 0){
    pause();
    nextSprint();
    return true;
  }
  return false;
}

function nextSprint(){
  //swap session type
  flow = !flow;
  
  if (flow){ 
    setupSession(flowInSeconds, flowText);
    currentSprint++;
    sprintCounter.text = `${currentSprint} of ${sprints}`
  }
  else { 
    if(currentSprint < sprints){
      setupSession(shortBreakInSeconds, breakText);
    }
    else{
      setupSession(longBreakInSeconds, breakText);
    }
  }
}

function setupSession(nextSessionSeconds, text){
  //change the arc back to 0
  progressArc.sweepAngle = 0;
  //update session text
  sessionText.text = text;
  //set the correct seconds for progress
  sessionTime = seconds = nextSessionSeconds;
  
}

function play(){
    counting = true;
    playPauseIcon.image = "pause.png";
    playPauseIconPressed.image = "pause_press.png";
}

function pause(){
    counting = false
    playPauseIcon.image = "play.png";
    playPauseIconPressed.image = "play_press.png";
}

function formatCountdown(seconds){
  //calculate time left
    formattedHours = Math.floor((seconds/60/60) % 60);
    formattedMinutes = Math.floor((seconds/60) % 60);
    formattedSeconds = Math.floor(seconds % 60);

    //pad with 0
    formattedHours = formattedHours < 10 ? "0" + formattedHours : formattedHours;
    formattedMinutes = formattedMinutes < 10 ? "0" + formattedMinutes : formattedMinutes;
    formattedSeconds = formattedSeconds < 10 ? "0" + formattedSeconds : formattedSeconds;

    //update countdown text
    countdown.text = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

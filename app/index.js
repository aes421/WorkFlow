/*
 * Entry point for the watch app
 */
import document from "document";
import * as messaging from "messaging";
import { display } from "display";
import * as fs from "fs";
import clock from "clock";
clock.granularity = "minutes";
import { preferences } from "user-settings";
import { vibration } from "haptics";
import { style, stopStyle } from "./style.js"

//grab screen elements
const time = document.getElementById("time");
const progressArc = document.getElementById("progressArc");
const countdown = document.getElementById("countdown");
const sprintCounter = document.getElementById("sprintCounter");
const currentIntervalText = document.getElementById("currentIntervalText");
const playPauseButton = document.getElementById("playPauseButton");
const playPauseIcon = playPauseButton.getElementById("combo-button-icon");
const playPauseIconPressed = playPauseButton.getElementById("combo-button-icon-press");
const restartSkipButton = document.getElementById("restartSkipButton");
const restartSkipIcon = restartSkipButton.getElementById("combo-button-icon");


const totalFlowInSeconds = 5; //1500;
const totalShortBreakInSeconds = 10;//300;
const totalLongBreakInSeconds = 15;//900;
const totalSprints = 4;
const flowText = "Flow";
const breakText = "Break";

let counting = false;
let countdownSeconds = totalFlowInSeconds; 
let flow = true; //used to toggle between flow intervals and breaks
let currentIntervalTime;
let currentIntervalText;
let currentSprint = 1;

//setup clock
clock.ontick = (evt) => {
  let hours = evt.date.getHours();
  let minutes = evt.date.getMinutes();
  hours = hours > 12 && preferences.clockDisplay === "12h" ? hours - 12 : hours;
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  time.text = `${hours}:${minutes}`;
}

setupWithUserSettings();
style(display);
//clock.tick does not run in background so use setInterval instead
setInterval(() => progress(), 1000)
playPauseButton.onactivate = (evt) => {
  counting ? pause() : play();
}

restartSkipButton.onactivate = (evt) => {
  counting ? restart() : skip();
}

display.onchange = () => { // optimize battery life
    display.on ? style() : stopStyle();
}

messaging.peerSocket.onmessage = (evt)=>{
  //persist
  writeToFile(evt);
  setupWithUserSettings();
}




function writeToFile(evt){
  let log = 'write to file: {';
  for (var prop in evt.data){
    log += ` ${prop}:${evt.data[prop]}`;  
  }
  console.log(log + " }");
  fs.writeFileSync("flowSettings.txt", evt.data, "cbor");
}

function secondsToAngle(seconds){
  //degree per second * elapsedseconds
  return (360/currentIntervalTime) * seconds;
}

function progress(){
  if (counting){
    if( !isSprintOver(countdownSeconds) ) {
      countdownSeconds--;
    }
    if (display.on) {
      //calculate and update angle
      progressArc.sweepAngle = secondsToAngle(currentIntervalTime - countdownSeconds);
    }
  }
  if (display.on) {
    formatCountdown(countdownSeconds);
  }
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
  //swap interval type
  flow = !flow;
  
  if (flow){ 
    setupNextInterval(totalFlowInSeconds, flowText);
    currentSprint < totalSprints ? currentSprint++ : currentSprint = 1;
    
    sprintCounter.text = `${currentSprint} of ${totalSprints}`
  }
  else { 
    if(currentSprint < totalSprints){
      setupNextInterval(totalShortBreakInSeconds, breakText);
    }
    else{
      setupNextInterval(totalLongBreakInSeconds, breakText);
    }
  }
  
  vibration.start("nudge");
}

function setupWithUserSettings(){
  try {
    fs.readFileSync("flowSettings.txt", "cbor")
  }
  catch(err){
    writeToFile({data : {flowTime: 0, shortBreakTime: 0, longBreakTime: 0}});
  }
  let settings = fs.readFileSync("flowSettings.txt", "cbor");
  
  //setup consts based on user settings
  totalFlowInSeconds = settings.flowTime == 0 ? totalFlowInSeconds : parseInt(settings.flowTime)*60;
  totalShortBreakInSeconds = settings.shortBreakTime == 0?  totalShortBreakInSeconds : parseInt(settings.shortBreakTime)*60;
  totalLongBreakInSeconds = settings.longBreakTime == 0 ? totalLongBreakInSeconds : parseInt(settings.longBreakTime)*60;
  setupNextInterval(totalFlowInSeconds, flowText);
}

function setupNextInterval(nextIntervalSeconds, text){
  //change the arc back to 0
  progressArc.sweepAngle = 0;
  //update interval text
  currentIntervalText.text = text;
  //set the correct seconds for progress
  currentIntervalTime = countdownSeconds = nextIntervalSeconds;
  currentIntervalText = text;
}

function play(){
    counting = true;
    playPauseIcon.image = "pause.png";
    playPauseIconPressed.image = "pause_press.png";
  
    restartSkipIcon.image = "reset.png";
}

function pause(){
    counting = false;
    playPauseIcon.image = "play.png";
    playPauseIconPressed.image = "play_press.png";
  
    restartSkipIcon.image = "skip.png";
}

function skip(){
  counting = false;
  nextSprint();
}

function restart(){
  pause();
  setupNextInterval(currentIntervalTime, currentIntervalText);
}

function formatCountdown(seconds){
  //calculate time left
    let formattedHours = Math.floor((seconds/60/60) % 60);
    let formattedMinutes = Math.floor((seconds/60) % 60);
    let formattedSeconds = Math.floor(seconds % 60);

    //pad with 0
    formattedHours = formattedHours < 10 ? "0" + formattedHours : formattedHours;
    formattedMinutes = formattedMinutes < 10 ? "0" + formattedMinutes : formattedMinutes;
    formattedSeconds = formattedSeconds < 10 ? "0" + formattedSeconds : formattedSeconds;

    //update countdown text
    countdown.text = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

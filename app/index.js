/*
 * Entry point for the watch app
 */
import document from "document";
import * as messaging from "messaging";
import { display } from "display";
import { me } from "appbit";
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


//Default these incase they haven't setup custom times on mobile app
const totalFlowInSeconds = 1500;
const totalShortBreakInSeconds = 10;//300;
const totalLongBreakInSeconds = 15;//900;
const totalSprints = 4;
const flowText = "Flow";
const breakText = "Break";

let counting = false;
let countdownSeconds = totalFlowInSeconds; 
let flow = true; //used to toggle between flow intervals and breaks
let currentIntervalTime;
let currentSprint = 1;

//setup clock
clock.ontick = (evt) => {
  let hours;
  let minutes;
  hours = evt.date.getHours();
  minutes = evt.date.getMinutes();
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
  writeToFile(evt.data, "flowSettings.txt");
  setupWithUserSettings();
}

me.onunload = () => {
  //save data on exit
  let text = flow ? flowText : breakText;
  writeToFile({closeTime: Date.now(), timeLeft: countdownSeconds, text: text, state: currentIntervalTime, flow: flow, sprint: currentSprint, counting: counting},"saveState.txt");
}


function writeToFile(data, fileName){
  let log;
  log = 'write to file: {';
  for (var prop in data){
    log += ` ${prop}:${data[prop]}`;  
  }
  console.log(log + " }");
  fs.writeFileSync(fileName, data, "cbor");
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
    currentSprint < totalSprints ? currentSprint++ : currentSprint = 1;
    setupNextInterval(totalFlowInSeconds, totalFlowInSeconds, flowText, 0, currentSprint);

  }
  else { 
    if(currentSprint < totalSprints){
      setupNextInterval(totalShortBreakInSeconds, totalShortBreakInSeconds, breakText, 0, currentSprint);
    }
    else{
      setupNextInterval(totalLongBreakInSeconds, totalLongBreakInSeconds, breakText, 0, currentSprint);
    }
  }
  
  vibration.start("nudge");
}

function setupWithUserSettings(){
  let settings;
  try {
    settings = fs.readFileSync("flowSettings.txt", "cbor");
  }
  catch(err){
    settings = {flowTime: 0, shortBreakTime: 0, longBreakTime: 0}
    writeToFile({flowTime: 0, shortBreakTime: 0, longBreakTime: 0}, "flowSettings.txt");
  }
  //setup consts based on user settings
  totalFlowInSeconds = settings.flowTime == 0 ? totalFlowInSeconds : parseInt(settings.flowTime)*60;
  totalShortBreakInSeconds = settings.shortBreakTime == 0?  totalShortBreakInSeconds : parseInt(settings.shortBreakTime)*60;
  totalLongBreakInSeconds = settings.longBreakTime == 0 ? totalLongBreakInSeconds : parseInt(settings.longBreakTime)*60;
  
  //pick up where the user ended
  try {
    //{closeTime: Date.now(), timeLeft: countdownSeconds, text: text, state: currentIntervalTime, sprint: currentSprint, counting: counting}
    let saveState = fs.readFileSync("saveState.txt", "cbor");
    //secondsLeft when app closed - seconds passed since exit
    let secondsLeft = saveState.timeLeft - ((Date.now() - parseInt(saveState.closeTime))/1000);
    secondsLeft <= 0 ? 0 : Math.ceil(secondsLeft);
    countdownSeconds = saveState.secondsLeft; 
    flow = saveState.flow;
    currentIntervalTime = saveState.state;
    currentSprint = saveState.sprint;
    if (secondsLeft <= 0){
      pause();
      nextSprint();
    }
    else{
      saveState.counting ? play() : pause();
      currentIntervalTime = saveState.state;
      setupNextInterval(currentIntervalTime, countDownseconds, saveState.text, secondsToAngle(currentIntervalTime - countDownseconds), currentSprint);
    }
  }
  catch (err) {
    console.log(err);
    setupNextInterval(totalFlowInSeconds, totalFlowInSeconds, flowText, 0, currentSprint);
  } 
}

function setupNextInterval(nextIntervalSeconds, secondsLeft, text, angleLeft, currentSprint){
  //change the arc back to 0
  progressArc.sweepAngle = angleLeft;
  //update interval text
  currentIntervalText.text = text;
  //set the correct seconds for progress
  currentIntervalTime = nextIntervalSeconds;
  countdownSeconds = secondsLeft;
  currentIntervalText.text = text;
  sprintCounter.text = `${currentSprint} of ${totalSprints}`;
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
  setupNextInterval(currentIntervalTime, currentIntervalTime, flow ? flowText : breakText, 0, currentSprint);
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

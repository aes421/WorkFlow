/*
 * Entry point for the watch app
 */
import document from "document";
import * as messaging from "messaging";
import * as fs from "fs";
import clock from "clock";
clock.granularity = "minutes";
import { preferences } from "user-settings";
import { vibration } from "haptics";
import { style } from "./style.js"

//grab screen elements
const time = document.getElementById("time");
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
let counting = false;
let countdownSeconds = flowInSeconds;


let flow = true; //used to toggle between flow sessions and breaks
let sessionTime = flowInSeconds;
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
style();
//clock.tick does not run in background so use setInterval instead
setInterval(() => progress(), 1000)
playPauseButton.onactivate = (evt) => {
  counting ? pause() : play();
}

messaging.peerSocket.onmessage = (evt)=>{
  //persist
  writeToFile(evt);
  setupWithUserSettings();
}




function writeToFile(evt){
  fs.writeFileSync("flowSettings.txt", evt.data, "cbor");
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
  flowInSeconds = settings.flowTime == 0 ? flowInSeconds : parseInt(settings.flowTime)*60;
  shortBreakInSeconds = settings.shortBreakTime == 0?  shortBreakInSeconds : parseInt(settings.shortBreakTime)*60;
  longBreakInSeconds = settings.longBreakTime == 0 ? longBreakInSeconds : parseInt(settings.longBreakTime)*60;
  setupSession(flowInSeconds, flowText);
}


function secondsToAngle(seconds){
  //degree per second * elapsedseconds
  return (360/sessionTime) * seconds;
}

function progress(){
  if (counting){
    if( !isSprintOver(countdownSeconds) ) {
      countdownSeconds--;
      //calculate and update angle
      progressArc.sweepAngle = secondsToAngle(sessionTime - countdownSeconds);
    }
  }
  
  formatCountdown(countdownSeconds);
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
    currentSprint < sprints ? currentSprint++ : currentSprint = 1;
    
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
  
  vibration.start("nudge");
}

function setupSession(nextSessionSeconds, text){
  //change the arc back to 0
  progressArc.sweepAngle = 0;
  //update session text
  sessionText.text = text;
  //set the correct seconds for progress
  sessionTime = countdownSeconds = nextSessionSeconds;
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

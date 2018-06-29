/*
 * Terminology:
 * 1 Session is made up for 4 Sets
 * 1 Set is made up of 2 Sprints
 * Each Sprint is either a Flow Sprint of a Break Sprint
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
import { format } from "path";

//grab screen elements
const time = document.getElementById("time");
const progressArc = document.getElementById("progressArc");
const countdownText = document.getElementById("countdown");
const setCounter = document.getElementById("setCounter");
const currentSprintText = document.getElementById("currentSprintText");
const playPauseButton = document.getElementById("playPauseButton");
const playPauseIcon = playPauseButton.getElementById("combo-button-icon");
const playPauseIconPressed = playPauseButton.getElementById("combo-button-icon-press");
const restartSkipButton = document.getElementById("restartSkipButton");
const restartSkipIcon = restartSkipButton.getElementById("combo-button-icon");

//Default these incase they haven't setup custom times on mobile app
const totalFlowInSeconds = 1500;
const totalShortBreakInSeconds = 300;
const totalLongBreakInSeconds= 900;
const totalSets = 4;
const flowText = "Flow";
const breakText = "Break";

let paused = true;
let flow = true; //used to toggle between flow intervals and breaks
let currentSprintTotalTime;
let currentSet = 1;
let deadlineInSeconds;
let timeLeft; //= totalFlowInSeconds;
var countdown;

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
style();
progress();

playPauseButton.onactivate = (evt) => {
  paused ? play() : pause();
}
restartSkipButton.onactivate = (evt) => {
  paused ? skip() : restart();
}
display.onchange = () => { // optimize battery life
    display.on ? style() : stopStyle();
}
messaging.peerSocket.onmessage = (evt)=>{
  //persist
  writeToFile(evt.data, "flowSettings.txt");
  //determine time left
  paused = true;
  saveStateToFile();
  setupWithUserSettings();
  restart();
}
me.onunload = () => {
  //save data on exit
  saveStateToFile();
}

function saveStateToFile(){
   let text = flow ? flowText : breakText;
    let breakState = null;
    if (!flow){
      console.log(`${currentSprintTotalTime} === ${totalShortBreakInSeconds}`);
      if (currentSprintTotalTime === totalShortBreakInSeconds){
        breakState = "short";
      }
      else{
        breakState = "long";
      }
    }
    writeToFile({deadlineInSeconds: deadlineInSeconds, timeLeft: timeLeft, breakState: breakState, flow: flow, set: currentSet, paused: paused}, "saveState.txt");
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
  return (360/currentSprintTotalTime) * seconds;
}

function progress(){
  if( !isSprintOver(deadlineInSeconds) ) {
    let t = calculateRemainingTimeInSeconds(deadlineInSeconds);
    if (display.on) {
      formatCountdown(t);
      //calculate and update angle
      progressArc.sweepAngle = secondsToAngle(currentSprintTotalTime - t);
    }
  }
}

function calculateRemainingTimeInSeconds(deadlineInSeconds){
  let t = deadlineInSeconds - (Date.now()/1000);
  return t;
}

function isSprintOver(deadlineInSeconds){
  if(Date.now()/1000 >= deadlineInSeconds){
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
    currentSet < totalSets ? currentSet++ : currentSet = 1;
    console.log(`nextSprint`);
    setupSprint(totalFlowInSeconds, totalFlowInSeconds, flowText, 0, (Date.now()/1000) + totalFlowInSeconds);

  }
  else { 
    if(currentSet < totalSets){
      setupSprint(totalShortBreakInSeconds, totalShortBreakInSeconds, breakText, 0, (Date.now()/1000) + totalShortBreakInSeconds);
    }
    else{
      setupSprint(totalLongBreakInSeconds, totalLongBreakInSeconds, breakText, 0, (Date.now()/1000) + totalLongBreakInSeconds);
    }
  }
  
  vibration.start("nudge");
}

function setupSprint(sprintTotalTime, left, text, angleLeft, deadline){
  progressArc.sweepAngle = angleLeft;
  currentSprintText.text = text;

  currentSprintTotalTime = sprintTotalTime;
  timeLeft = left;
  deadlineInSeconds = deadline;
  
  formatCountdown(timeLeft);
  setCounter.text = `${currentSet} of ${totalSets}`;
}

function play(){
    paused = false;
    deadlineInSeconds = (Date.now()/1000) + timeLeft;
    timeLeft = 0;
    playPauseIcon.image = "pause.png";
    playPauseIconPressed.image = "pause_press.png";
    restartSkipIcon.image = "reset.png";
    //clock.tick does not run in background so use setInterval instead
    countdown = setInterval(() => progress(), 1000);
}

function pause(){
    console.log(`pause`);
    paused = true;
    //stop the clock
    clearInterval(countdown);
    timeLeft = calculateRemainingTimeInSeconds(deadlineInSeconds);
    playPauseIcon.image = "play.png";
    playPauseIconPressed.image = "play_press.png";
    restartSkipIcon.image = "skip.png";
}

function skip(){
  pause();
  timeLeft = 0;
  nextSprint();
}

function restart(){
  pause();
  console.log(`restart`);
  setupSprint(currentSprintTotalTime, currentSprintTotalTime, flow ? flowText : breakText, 0, (Date.now()/1000) + currentSprintTotalTime);
}

function setupWithUserSettings(){
  let settings;
  try { //read settings about time intervals
    settings = fs.readFileSync("flowSettings.txt", "cbor");
  }
  catch(err){
    settings = {flowTime: 0, shortBreakTime: 0, longBreakTime: 0}
    //writeToFile({flowTime: 0, shortBreakTime: 0, longBreakTime: 0}, "flowSettings.txt");
  }
  //setup consts based on user settings
  totalFlowInSeconds = settings.flowTime == 0 ? totalFlowInSeconds : parseInt(settings.flowTime)*60;
  totalShortBreakInSeconds = settings.shortBreakTime == 0?  totalShortBreakInSeconds : parseInt(settings.shortBreakTime)*60;
  totalLongBreakInSeconds = settings.longBreakTime == 0 ? totalLongBreakInSeconds : parseInt(settings.longBreakTime)*60;
  currentSprintTotalTime = totalFlowInSeconds;
  timeLeft = currentSprintTotalTime;
  
  //pick up where the user ended
  try { //read settings about past states
    restorePreviousSession(fs.readFileSync("saveState.txt", "cbor"));
  }
  catch (err) {
    console.log(err);
    console.log(`err`);
    setupSprint(totalFlowInSeconds, totalFlowInSeconds, flowText, 0, (Date.now()/1000) + totalFlowInSeconds);
  } 
}

function restorePreviousSession(saveState){
    timeLeft = calculateRemainingTimeInSeconds(saveState.deadlineInSeconds);

    //set state variables
    deadlineInSeconds = saveState.deadlineInSeconds;


    flow = saveState.flow;
    if(flow){
      currentSprintTotalTime = totalFlowInSeconds;
    }
    else{
      if (saveState.breakState === "short"){
        console.log(saveState.breakState);
        currentSprintTotalTime = totalShortBreakInSeconds;
      }
      else if (saveState.breakState === "long"){
        console.log(saveState.breakState);
        currentSprintTotalTime = totalLongBreakInSeconds;
      }
      else{  //something went wrong
        console.log("ERR" + saveState.breakState);
        console.log(typeof saveState.breakState);
        console.log(saveState.breakState == "short");
        currentSprintTotalTime = 0;
        skip();
      }
    }
    
    currentSet = saveState.set;

    let text = flow ? flowText : breakText;
    deadlineInSeconds = saveState.paused ? (Date.now()/1000) + saveState.timeLeft : saveState.deadlineInSeconds;
    saveState.paused ? pause() : play();
    if ( deadlineInSeconds >= (Date.now()/1000) || saveState.paused){
      console.log(`RESTORE setting up with total time ${currentSprintTotalTime}, timeleft ${timeLeft} and angle ${secondsToAngle(currentSprintTotalTime - timeLeft)}`);
      setupSprint(currentSprintTotalTime, timeLeft, text, secondsToAngle(currentSprintTotalTime - timeLeft), deadlineInSeconds);
    }
    else{  //finished sprint while our of app, so move to the next
      skip();
    }  
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
  countdownText.text = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
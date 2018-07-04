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
const appSettings = {
  totalFlowInSeconds : 1500,
  totalShortBreakInSeconds : 300,
  totalLongBreakInSeconds : 900,
  totalSets : 4,
  flowText : "Flow",
  breakText : "Break"
};


let sprintSettings = {
  paused: true,
  flow: true,
  totalTime: 0,
  set: 1,
  deadlineInSeconds: 0,
  timeLeft: 0
};

let countdownInterval;

//setup clock
const timeText = document.getElementById("time").text;
clock.ontick = (evt) => {
  let hours;
  let minutes;
  hours = evt.date.getHours();
  minutes = evt.date.getMinutes();
  hours = hours > 12 && preferences.clockDisplay === "12h" ? hours - 12 : hours;
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  timeText = `${hours}:${minutes}`;
}

setupWithUserSettings();
try{
  let s = fs.readFileSync("styleSettings.txt", "cbor");
  document.getElementById("background").value = s.value;
}
catch (err){
  document.getElementById("background").value = 0;
}
style();
progress();

//button handlers
playPauseButton.onactivate = (evt) => {
  sprintSettings.paused ? play() : pause();
}
restartSkipButton.onactivate = (evt) => {
  sprintSettings.paused ? skip() : restart();
}
display.onchange = () => { // optimize battery life
    display.on ? style() : stopStyle();
}

//called when settings are changed via fitbit app
messaging.peerSocket.onmessage = (evt)=>{
  //persist
  pause();
  writeToFile(evt.data, "flowSettings.txt");
  saveStateToFile();
  setupWithUserSettings();
  restart();
}

//save data on exit
me.onunload = () => {
  saveStateToFile();
  writeToFile({value: document.getElementById("background").value} ,"styleSettings.txt");
}

function saveStateToFile(){
   let text = sprintSettings.flow ? appSettings.flowText : appSettings.breakText;
    let breakState = null;
    if (!sprintSettings.flow){
      if (sprintSettings.totalTime === appSettings.totalShortBreakInSeconds){
        breakState = "short";
      }
      else{
        breakState = "long";
      }
    }
    writeToFile({deadlineInSeconds: sprintSettings.deadlineInSeconds, timeLeft: sprintSettings.timeLeft, breakState: breakState, flow: sprintSettings.flow, set: sprintSettings.set, paused: sprintSettings.paused}, "saveState.txt");
}


function writeToFile(data, fileName){
  let log = 'write to file: {';
  for (var prop in data){
    log += ` ${prop}:${data[prop]}`;  
  }
  console.log(log + " }");

  fs.writeFileSync(fileName, data, "cbor");
}

/**
 * Uses the total time of the current sprint to determine what degree each
 * second corresponds to, then mulitplies that by the amount of seconds passed
 * to set the progress arc
 * @param {int} seconds - how many seconds have passed
 */
function secondsToAngle(seconds){
  //degree per second * elapsedseconds
  progressArc.sweepAngle = (360/sprintSettings.totalTime) * seconds;
}

/**
 * The main loop of this app.  It's purpose is to calculate how much time is left in
 * the sprint, and then update the countdown timer and progress arc
 */
function progress(){
  if( !isSprintOver(sprintSettings.deadlineInSeconds) ) {
    let t = Math.ceil(sprintSettings.deadlineInSeconds - (Date.now()/1000));
    if (display.on) {
      formatCountdown(t);
      //calculate and update angle
      secondsToAngle(sprintSettings.totalTime - t);
    }
  }
}

/**
 * Takes in the time the current sprint will end and returns
 * the seconds remaining between right now and then
 * @param {int} deadlineInSeconds - time in seconds that the current sprint will end
 * @returns {int} t - seconds between now and the deadline
 */
function calculateRemainingTimeInSeconds(deadlineInSeconds){
  let t = deadlineInSeconds - (Date.now()/1000);
  return t;
}

/**
 * Determines if the current sprint is over by comparing if the deadline is passed
 * the current time.  If so, it pauses and sets up the next sprint
 * @param {int} deadlineInSeconds 
 * @returns {bool} - true if over, false if not
 */
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
  sprintSettings.flow = !sprintSettings.flow;
  
  if (sprintSettings.flow){ 
    sprintSettings.set < appSettings.totalSets ? sprintSettings.set++ : sprintSettings.set = 1;
    console.log(`nextSprint`);
    setupSprint(appSettings.totalFlowInSeconds, appSettings.totalFlowInSeconds, appSettings.flowText, 0, (Date.now()/1000) + appSettings.totalFlowInSeconds);

  }
  else { 
    if(sprintSettings.set < appSettings.totalSets){
      setupSprint(appSettings.totalShortBreakInSeconds, appSettings.totalShortBreakInSeconds, appSettings.breakText, 0, (Date.now()/1000) + appSettings.totalShortBreakInSeconds);
    }
    else{
      setupSprint(appSettings.totalLongBreakInSeconds, appSettings.totalLongBreakInSeconds, appSettings.breakText, 0, (Date.now()/1000) + appSettings.totalLongBreakInSeconds);
    }
  }
  
  vibration.start("nudge");
}

// let sprintSettings = {
//   paused: true,
//   flow: true,
//   totalTime: 0,
//   set: 1,
//   deadlineInSeconds: 0,
//   timeLeft: 0
// };
function setupSprint(sprintTotalTime, left, text, angleLeft, deadline){
  secondsToAngle(angleLeft);
  currentSprintText.text = text;

  sprintSettings.totalTime = sprintTotalTime;
  sprintSettings.timeLeft = left;
  sprintSettings.deadlineInSeconds = deadline;
  
  formatCountdown(sprintSettings.timeLeft);
  setCounter.text = `${sprintSettings.set} of ${appSettings.totalSets}`;
}

function play(){
    sprintSettings.paused = false;
    sprintSettings.deadlineInSeconds = (Date.now()/1000) + sprintSettings.timeLeft;
    sprintSettings.timeLeft = 0;
    playPauseIcon.image = "pause.png";
    playPauseIconPressed.image = "pause_press.png";
    restartSkipIcon.image = "reset.png";
    //clock.tick does not run in background so use setInterval instead
    countdownInterval = setInterval(() => progress(), 1000);
}

function pause(){
    sprintSettings.paused = true;
    //stop the clock
    clearInterval(countdownInterval);
    sprintSettings.timeLeft = calculateRemainingTimeInSeconds(sprintSettings.deadlineInSeconds);
    playPauseIcon.image = "play.png";
    playPauseIconPressed.image = "play_press.png";
    restartSkipIcon.image = "skip.png";
}

function skip(){
  pause();
  sprintSettings.timeLeft = 0;
  nextSprint();
}

function restart(){
  pause();
  setupSprint(sprintSettings.totalTime, sprintSettings.totalTime, sprintSettings.flow ? appSettings.flowText : appSettings.breakText, 0, (Date.now()/1000) + sprintSettings.totalTime);
}

function setupWithUserSettings(){
  let settings;
  try { //read settings about time intervals
    settings = fs.readFileSync("flowSettings.txt", "cbor");
  }
  catch(err){
    settings = {flowTime: 0, shortBreakTime: 0, longBreakTime: 0};
  }
  //setup consts based on user settings
  appSettings.totalFlowInSeconds = settings.flowTime == 0 ? appSettings.totalFlowInSeconds : parseInt(settings.flowTime)*60;
  appSettings.totalShortBreakInSeconds = settings.shortBreakTime == 0?  appSettings.totalShortBreakInSeconds : parseInt(settings.shortBreakTime)*60;
  appSettings.totalLongBreakInSeconds = settings.longBreakTime == 0 ? appSettings.totalLongBreakInSeconds : parseInt(settings.longBreakTime)*60;
  sprintSettings.totalTime = appSettings.totalFlowInSeconds;
  sprintSettings.timeLeft = sprintSettings.totalTime;
  
  //pick up where the user ended
  try { //read settings about past states
    restorePreviousSession(fs.readFileSync("saveState.txt", "cbor"));
  }
  catch (err) {
    console.log(err);
    console.log(`err`);
    setupSprint(appSettings.totalFlowInSeconds, appSettings.totalFlowInSeconds, appSettings.flowText, 0, (Date.now()/1000) + appSettings.totalFlowInSeconds);
  } 
}

function restorePreviousSession(saveState){
    sprintSettings.timeLeft = calculateRemainingTimeInSeconds(saveState.deadlineInSeconds);

    //set state variables
    sprintSettings.deadlineInSeconds = saveState.deadlineInSeconds;


    sprintSettings.flow = saveState.flow;
    if(sprintSettings.flow){
      sprintSettings.totalTime = appSettings.totalFlowInSeconds;
    }
    else{
      if (saveState.breakState === "short"){
        console.log(saveState.breakState);
        sprintSettings.totalTime = appSettings.totalShortBreakInSeconds;
      }
      else if (saveState.breakState === "long"){
        console.log(saveState.breakState);
        sprintSettings.totalTime = appSettings.totalLongBreakInSeconds;
      }
      else{  //something went wrong
        console.log("ERR" + saveState.breakState);
        console.log(typeof saveState.breakState);
        console.log(saveState.breakState == "short");
        sprintSettings.totalTime = 0;
        skip();
      }
    }
    
    sprintSettings.set = saveState.set;

    let text = sprintSettings.flow ? appSettings.flowText : appSettings.breakText;
    sprintSettings.deadlineInSeconds = saveState.paused ? (Date.now()/1000) + saveState.timeLeft : saveState.deadlineInSeconds;
    saveState.paused ? pause() : play();
    if ( sprintSettings.deadlineInSeconds >= (Date.now()/1000) || saveState.paused){
      console.log(`RESTORE setting up with total time ${sprintSettings.totalTime}, sprintSettings.timeLeft ${sprintSettings.timeLeft} and angle ${sprintSettings.totalTime - sprintSettings.timeLeft}`);
      setupSprint(sprintSettings.totalTime, sprintSettings.timeLeft, text, sprintSettings.totalTime - sprintSettings.timeLeft, sprintSettings.deadlineInSeconds);
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
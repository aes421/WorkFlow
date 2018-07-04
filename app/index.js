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
const playPauseButton = document.getElementById("playPauseButton");
const playPauseIcon = playPauseButton.getElementById("combo-button-icon");
const playPauseIconPressed = playPauseButton.getElementById("combo-button-icon-press");
const restartSkipButton = document.getElementById("restartSkipButton");
const restartSkipIcon = restartSkipButton.getElementById("combo-button-icon");
const countdownText = document.getElementById("countdown");
const setCounter = document.getElementById("setCounter");
const currentSprintText = document.getElementById("currentSprintText");

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
  totalTime: appSettings.totalFlowInSeconds,
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
    let t = Math.ceil(calculateRemainingTimeInSeconds(sprintSettings.deadlineInSeconds));
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
 * the current time.  If so, sets up the next sprint
 * @param {int} deadlineInSeconds 
 * @returns {bool} - true if over, false if not
 */
function isSprintOver(deadlineInSeconds){
  if(Date.now()/1000 >= deadlineInSeconds){
    nextSprint();
    return true;
  }
  return false;
}

/**
 * The purpose of this function is to determine what type of sprint to setup next
 * and pass that information to the setupSprint function.  It does this by checking
 * the flow variable and the amount of sets completed.
 * It also is in charge of alerting the user that the sprint is over.
 */
function nextSprint(){
  pause();

  //swap interval type
  let flow = !sprintSettings.flow;
  let deadline;
  
  if (flow){ 
    let set = sprintSettings.set;
    set = set < appSettings.totalSets ? set + 1 : 1;
    deadline = (Date.now()/1000) + appSettings.totalFlowInSeconds
    setupSprint(flow, appSettings.totalFlowInSeconds, set, deadline, appSettings.totalFlowInSeconds, 0);

  }
  else { 
    if(sprintSettings.set < appSettings.totalSets){
      deadline = (Date.now()/1000) + appSettings.totalShortBreakInSeconds;
      setupSprint(flow, appSettings.totalShortBreakInSeconds, sprintSettings.set, deadline, appSettings.totalShortBreakInSeconds, 0);

    }
    else{
      deadline = (Date.now()/1000) + appSettings.totalLongBreakInSeconds;
      setupSprint(flow, appSettings.totalLongBreakInSeconds, sprintSettings.set, deadline, appSettings.totalLongBreakInSeconds, 0);
    }
  }
  
  vibration.start("nudge");
}

/**
 * This function sets all the sprint variables and updates the screen elements
 * for the current sprint
 * @param {bool} flow 
 * @param {int} totalTime 
 * @param {int} set 
 * @param {int} deadline 
 * @param {int} timeLeft 
 * @param {string} text 
 * @param {int} angleLeft 
 */
function setupSprint(flow, totalTime, set, deadline, timeLeft, angleLeft){
  sprintSettings.flow = flow;
  sprintSettings.totalTime = totalTime;
  sprintSettings.set = set;
  sprintSettings.deadlineInSeconds = deadline;
  sprintSettings.timeLeft = timeLeft;
  
  formatCountdown(sprintSettings.timeLeft);
  secondsToAngle(angleLeft);
  currentSprintText.text = sprintSettings.flow ? appSettings.flowText : appSettings.breakText;;
  setCounter.text = `${sprintSettings.set} of ${appSettings.totalSets}`;
}

function play(){
    sprintSettings.paused = false;
    let deadline = (Date.now()/1000) + sprintSettings.timeLeft;
    let angle = sprintSettings.totalTime - sprintSettings.timeLeft;
    setupSprint(sprintSettings.flow, sprintSettings.totalTime, sprintSettings.set, deadline, sprintSettings.timeLeft, angle);
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
    let timeLeft = calculateRemainingTimeInSeconds(sprintSettings.deadlineInSeconds);
    let angle = sprintSettings.totalTime - timeLeft;
    setupSprint(sprintSettings.flow, sprintSettings.totalTime, sprintSettings.set, sprintSettings.deadlineInSeconds, timeLeft, angle);
    playPauseIcon.image = "play.png";
    playPauseIconPressed.image = "play_press.png";
    restartSkipIcon.image = "skip.png";
}

function skip(){
  sprintSettings.timeLeft = 0;
  nextSprint();
}

function restart(){
  pause();
  let deadline = (Date.now()/1000) + sprintSettings.totalTime;
  setupSprint(sprintSettings.flow, sprintSettings.totalTime, sprintSettings.set, deadline, sprintSettings.totalTime, 0);
}

function setupWithUserSettings(){
  let settings;
  try { //read settings about time intervals
    settings = fs.readFileSync("flowSettings.txt", "cbor");
  }
  catch(err){
    settings = {flowTime: 0, shortBreakTime: 0, longBreakTime: 0};
  }
  //setup consts based on user settings, if it's 0 use the defaults
  appSettings.totalFlowInSeconds = settings.flowTime == 0 ? appSettings.totalFlowInSeconds : parseInt(settings.flowTime)*60;
  appSettings.totalShortBreakInSeconds = settings.shortBreakTime == 0?  appSettings.totalShortBreakInSeconds : parseInt(settings.shortBreakTime)*60;
  appSettings.totalLongBreakInSeconds = settings.longBreakTime == 0 ? appSettings.totalLongBreakInSeconds : parseInt(settings.longBreakTime)*60;
  
  //pick up where the user ended
  try { //read settings about past states
    restorePreviousSession(fs.readFileSync("saveState.txt", "cbor"));
  }
  catch (err) {
    console.log(err);
    let deadline = (Date.now()/1000) + appSettings.totalFlowInSeconds;
    setupSprint(true, appSettings.totalFlowInSeconds, 1, deadline, appSettings.totalFlowInSeconds, 0);
  } 
}

function restorePreviousSession(saveState){
  saveState.paused ? pause() : play();

  let totalTime;
  if(saveState.flow){
    totalTime = appSettings.totalFlowInSeconds;
  }
  else{
    if (saveState.breakState === "short"){
      totalTime = appSettings.totalShortBreakInSeconds;
    }
    else if (saveState.breakState === "long"){
      totalTime = appSettings.totalLongBreakInSeconds;
    }
    else{  //something went wrong TODO WE PROBABLY NEED TO SETUP THE INTERVAL BEFORE SKIPPING??
      totalTime = 0;
      skip();
    }
  }

  let deadline = saveState.paused ? (Date.now()/1000) + saveState.timeLeft : saveState.deadlineInSeconds;

  let timeLeft = calculateRemainingTimeInSeconds(deadline);
  
  if ( deadline >= (Date.now()/1000) || saveState.paused){
    console.log(`RESTORE setting up with total time ${sprintSettings.totalTime}, sprintSettings.timeLeft ${sprintSettings.timeLeft} and angle ${sprintSettings.totalTime - sprintSettings.timeLeft}`);
    setupSprint(saveState.flow, totalTime, saveState.set, deadline, timeLeft, sprintSettings.totalTime - sprintSettings.timeLeft);
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
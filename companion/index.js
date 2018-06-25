/*
 * Entry point for the companion app
 */
import { settingsStorage } from "settings";
import { me } from "companion";
import * as messaging from "messaging";


// Event fires when a setting is changed
settingsStorage.onchange = (evt) => { sendSettings(); }

// Settings were changed while the companion was not running
if (me.launchReasons.settingsChanged) {
  sendSettings();
}

function sendSettings(){
  let flowTime = settingsStorage.getItem("flowTimeSlider");
  let shortTime = settingsStorage.getItem("shortBreakTimeSlider")
  let longTime = settingsStorage.getItem("longBreakTimeSlider")
  let data = {
      flowTime : flowTime ? flowTime.substring(1, flowTime.length-1) : 0,
      shortBreakTime : shortTime ? shortTime.substring(1, shortTime.length-1) : 0,
      longBreakTime : longTime ? longTime.substring(1, longTime.length-1) : 0
  }
  
  // If we have a MessageSocket, send the data to the device
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  } else {
    console.log("No peerSocket connection");
  }
}

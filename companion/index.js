/*
 * Entry point for the companion app
 */
import { settingsStorage } from "settings";
import { me } from "companion";
import * as messaging from "messaging";


// Event fires when a setting is changed
settingsStorage.onchange = (evt) => { sendSettings(); }

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  // Ready to send or receive messages
  sendSettings();
}

function sendSettings(){
  let flowTime = settingsStorage.getItem("flowTime");
  let shortTime = settingsStorage.getItem("shortBreakTime")
  let longTime = settingsStorage.getItem("longBreakTime")
  let data = {
      flowTime : flowTime ? flowTime : "25",
      shortBreakTime : shortTime ? shortTime : "5",
      longBreakTime : longTime ? longTime : "15"
  }
  
  // If we have a MessageSocket, send the data to the device
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  } else {
    console.log("No peerSocket connection");
  }
}

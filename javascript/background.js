const oneMinute = 60 * 1000;
const threeMinutes = 3 * 60 * 1000;
const fiveMinutes = 5 * 60 * 1000;
const rebootCommand = "1";

var operatingSystem = "";
var architecture = "";
var naclArchitecture = "";
var intervalProcess;

function init() {
  "use strict";
  console.log("init: start");
  // don't let computer sleep
  chrome.power.requestKeepAwake("display");

  // OS info is used by onUpdateAvailable no problem if this is set async
  determineOperatingSystem();
  // although the device ID should be available we check it here
  deviceId(function (deviceID) {
    if (deviceID !== undefined) {
      console.log("init: deviceID: " + deviceID);
      openWindow("main.html");
    } else {
      console.log("init: deviceID undefined");
      openWindow("error.html");
    }
  });

  function openWindow(path){
    chrome.system.display.getInfo(function(displayInfos){
      var windowOptions = {
        "frame": "none",
        "id": "browser",
        "innerBounds": {
          "left": 0,
          "top": 0,
          "width": displayInfos[0].bounds.width,
          "height": displayInfos[0].bounds.height
        }
      };
      chrome.app.window.create(path, windowOptions, function(createdWindow){
        createdWindow.fullscreen();
        createdWindow.onClosed.addListener(windowOnClosed);
      });
    });
  }
}

function windowOnClosed() {
  // accesses the "global" variables so do not use "use strict"
  console.log("window.Onclosed received");
  chrome.power.releaseKeepAwake();
  // stop restart check cycle
  clearInterval(intervalProcess);
  // cancel possibly set delayed restart
  chrome.runtime.restartAfterDelay(-1, preventUncheckedErrorMessageWhenErrorIsExpected);
}

function determineOperatingSystem() {
  // accesses the "global" variables so do not use "use strict"
  chrome.runtime.getPlatformInfo(function(platformInformation) {
    operatingSystem = platformInformation.os;
    architecture = platformInformation.arch;
    naclArchitecture = platformInformation.nacl_arch;
    console.log("Operating System: " + operatingSystem + " " + architecture + " " + naclArchitecture);
  });
}

function checkRestart() {
  // accesses the "global" variables so do not use "use strict"
  console.log("checkRestart: Running check at: " + (new Date()).toString());

  deviceId(function (deviceID) {
    if (deviceID !== undefined) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://ajax.playr.biz/watchdogs/" + deviceID + "/command", true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // JSON.parse does not evaluate scripts (in case of an attackers malicious script).
            var resp = JSON.parse(xhr.responseText);
            if (resp !== undefined && resp.toString() === rebootCommand) {
              console.log("checkRestart: Restart at: " + (new Date()).toString());
              // Restart the ChromeOS device when the app runs in kiosk mode. Otherwise, it's no-op.
              chrome.runtime.restart();
              preventUncheckedErrorMessageWhenErrorIsExpected();
            } else {
              // response was not reboot code -> no operation
            }
          } else {
            console.log("checkRestart: xhr.status !== 200");
            // non success HTTP status code -> no operation
          }
        } else {
          console.log("checkRestart: xhr.readyState !== 4");
          // XML HTTP Request ready status not ok -> no operation
        }
      };
      xhr.send();
    } else {
      // deviceID undefined, the required HTTP request cannot be made -> no operation
      console.log("checkRestart: deviceID is not defined");
    }
  });
}

function deviceId(callback) {
  "use strict";
  chrome.instanceID.getID(function (instanceID) {
    if (instanceID === undefined || instanceID === null || instanceID.length === 0) {
      if (chrome.runtime.lastError !== undefined && chrome.runtime.lastError.message !== undefined) {
        console.log("Error: deviceId; " + chrome.runtime.lastError.message);
      } else {
        console.log("Error: deviceId; instanceID is undefined");
      }
    } else {
      console.log("deviceId: instanceID = " + instanceID);
    }
    if (callback !== undefined) { callback(instanceID); }
  });
}

function preventUncheckedErrorMessageWhenErrorIsExpected() {
  "use strict";
  if (chrome.runtime.lastError !== undefined && chrome.runtime.lastError.message !== undefined) {
    // to prevent unchecked error messages during tests on
    // OSes other than ChromeOS or not running in Kiosk mode
    console.log("preventUncheckedErrorMessageWhenErrorIsExpected: expected error: " + chrome.runtime.lastError.message);
  }
}

chrome.app.runtime.onLaunched.addListener(function () { init(); });
chrome.app.runtime.onRestarted.addListener(function () { init(); });
chrome.runtime.onUpdateAvailable.addListener(function(details) {
  // accesses the "global" operatingSystem so do not use "use strict"
  if (operatingSystem === "cros") {
    console.log("Update available to version: " + details.version + ". Starting update.");
    // calculate delay until random time between 4 and 5 at night
    var now = new Date();
    var delay = ((24 - now.getHours() + 4)%24)*3600 + Math.floor(Math.random()*3600);
    chrome.runtime.restartAfterDelay(delay, function () {
      console.log("Restart scheduled in " + delay + " seconds.");
    });
  } else {
    console.log("onUpdateAvailable received but not supported on " + operatingSystem);
  }
});

// TODO use web worker for this if possible
console.log("Kicking off setInterval with delay: " + (oneMinute/1000).toString() + " seconds");
// accesses the "global" operatingSystem so do not use "use strict"
setTimeout(function() {
  intervalProcess = setInterval(function () { checkRestart(); }, fiveMinutes);
  console.log("Repeat checkRestart with interval: " + (fiveMinutes/1000).toString() + " seconds, intervalProcess: " + intervalProcess.toString());
}, oneMinute);

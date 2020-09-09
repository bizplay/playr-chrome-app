const fifteenSeconds = 15 * 1000;
const thirtySeconds = 30 * 1000;
const oneMinute = 60 * 1000;
const threeMinutes = 3 * 60 * 1000;
const fiveMinutes = 5 * 60 * 1000;
const rebootCommand = "1";

var device_id = "";
var operatingSystem = "";
var architecture = "";
var naclArchitecture = "";
var systemInformation = {};
var restartIntervalHandle;
var sysInfoIntervalHandle;
// the following two vars should not be turned into consts since a const
// is not in scope of the window when this is retrieved by chrome.runtime.getBackgroundPage
var watchdogTriggerNoRestart = 1234;
var watchdogTriggerRestart = 9876;
var watchdogTrigger = watchdogTriggerRestart;

function init() {
  "use strict";
  console.log("init: start");
  // don't let computer sleep
  chrome.power.requestKeepAwake("display");

  // OS info is used by onUpdateAvailable no problem if this is set async
  determineOperatingSystem();
  // although the device ID should be available we check it here
  deviceId(function (deviceID) {
    if (deviceID !== undefined && deviceID !==  null) {
      console.log("init: deviceID: " + deviceID.toString() + " => opening main.html");
      openWindow("main.html");
    } else {
      console.log("init: deviceID is undefined or null => opening error.html");
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
  clearInterval(restartIntervalHandle);
  clearInterval(sysInfoIntervalHandle);
  // cancel possibly set delayed restart
  chrome.runtime.restartAfterDelay(-1, preventUncheckedErrorMessageWhenErrorIsExpected);
}

function determineOperatingSystem() {
  // accesses the "global" variables so do not use "use strict"
  chrome.runtime.getPlatformInfo(function(platformInformation) {
    operatingSystem = (platformInformation.os || "").toString();
    architecture = (platformInformation.arch || "").toString();
    naclArchitecture = (platformInformation.nacl_arch || "").toString();
    console.log("Operating System: " + operatingSystem + " " + architecture + " " + naclArchitecture);
  });
}

function checkRestart() {
  // accesses the "global" variables so do not use "use strict"
  console.log("checkRestart: Running check at: " + (new Date()).toString());

  if (watchdogTrigger === watchdogTriggerRestart) {
    restartDevice();
  } else {
    // reset the trigger so a restart is done the next time
    // checkRestart is called (unless the GUI process sets
    // the watchdogTrigger to watchdogTriggerNoRestart)
    watchdogTrigger = watchdogTriggerRestart;
    // check server for restart signal
    deviceId(function (deviceID) {
      if (deviceID !== undefined) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://ajax.playr.biz/watchdogs/" + deviceID + "/command", true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              // JSON.parse does not evaluate scripts (in case of an attackers malicious script).
              var response = JSON.parse(xhr.responseText);
              if (response !== undefined && response.toString() === rebootCommand) {
                restartDevice();
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
}

function restartDevice() {
  "use strict";
  console.log("restartDevice: Restart device at: " + (new Date()).toString());
  // Restart the ChromeOS device when the app runs in kiosk mode. Otherwise, it's no-op.
  chrome.runtime.restart();
  preventUncheckedErrorMessageWhenErrorIsExpected();
}

// set system information in variables
// which will be used from the main.js to send into the webview
// (using DOM events) to enable the player software to report
// these in the playback_health calls
function getSystemInformation() {
  // accesses the "global" variables so do not use "use strict"
  cpuInformation(systemInformation);
}

function cpuInformation(informationContainer) {
  // accesses "global" variables so do not use "use strict"
  chrome.system.cpu.getInfo(function (info) {
    if (info !== undefined) {
      informationContainer.numberOfProcessors = (info.numOfProcessors || "0").toString();
      informationContainer.architectureName = (info.archName || "").toString();
      informationContainer.modelName = (info.modelName || "").toString();
      informationContainer.features = (info.features || "").toString();
      informationContainer.temperatures = (info.temperatures || "0").toString();
      informationContainer.processors = [];
      for (var i = 0; i < info.processors.length; i++) {
        informationContainer.processors.push({
          userTime: (info.processors[i].usage.user || "0").toString(),
          kernelTime: (info.processors[i].usage.kernel || "0").toString(),
          idleTime: (info.processors[i].usage.idle || "0").toString(),
          totalTime: (info.processors[i].usage.total || "0").toString()
        });
      }
    }
  });
}

function deviceId(callback) {
  // accesses "global" variables so do not use "use strict"
  if (device_id === "") {
    chrome.instanceID.getID(function (instanceID) {
      if (instanceID === undefined || instanceID === null || instanceID.length === 0) {
        if (chrome.runtime.lastError !== undefined && chrome.runtime.lastError.message !== undefined) {
          console.log("deviceId: Error; " + chrome.runtime.lastError.message);
        } else {
          console.log("deviceId: Error; instanceID is undefined");
        }
      } else {
        device_id = instanceID;
        console.log("deviceId: instanceID = " + instanceID.toString());
      }
      if (callback !== undefined) { callback(instanceID); }
    });
  } else {
    if (callback !== undefined) { callback(device_id); }
  }
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
  // accesses "global" variables so do not use "use strict"
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
console.log("Kicking off checkRestart interval with delay: " + (oneMinute/1000).toString() + " seconds");
// accesses "global" variables so do not use "use strict"
setTimeout(function () {
  restartIntervalHandle = setInterval(function () { checkRestart(); }, fiveMinutes);
  console.log("Repeat checkRestart with interval: " + (fiveMinutes/1000).toString() + " seconds, restartIntervalHandle: " + restartIntervalHandle.toString());
}, oneMinute);

console.log("Kicking off getSystemInformation interval with delay: " + (thirtySeconds/1000).toString() + " seconds");
// accesses "global" variables so do not use "use strict"
setTimeout(function () {
  sysInfoIntervalHandle = setInterval(function () { getSystemInformation(); }, fiveMinutes);
  console.log("Repeat getSystemInformation with interval: " + (fiveMinutes/1000).toString() + " seconds, sysInfoIntervalHandle: " + sysInfoIntervalHandle.toString());
}, thirtySeconds);

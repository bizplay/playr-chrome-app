var operatingSystem = '';
var architecture = '';
var naclArchitecture = '';
var interval = 5*60*1000; // 5 mins in ms
var aMinute = 60*1000;
var rebootCommand = "1";
var intervalProcess;

getUUID = function() {
  "use strict";
  // generate a type 4 (random) UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
};

function init() {
  "use strict";
  // don't let computer sleep
  chrome.power.requestKeepAwake("display");

  // OS info is used by onUpdateAvailable no problem if this is set async
  determineOperatingSystem();
  // make  sure a player id is present, note: async call
  chrome.storage.local.get('player_id', function(content){
    if ('player_id' in content) {
      // player_id defined no additional actions required
      openWindow("main.html");
    } else {
      chrome.storage.local.set({'player_id':getUUID()}, function() {
        if (chrome.runtime.lastError !== undefined) {
          console.log('init: Error during writing to storage.local: ' + chrome.runtime.lastError.message);
          openWindow("error.html");
        } else {
          openWindow("main.html");
        }
      });
      console.log("init: player_id was not yet defined, setting UUID");
    }
  });

  function openWindow(path){
    chrome.system.display.getInfo(function(displayInfos){
      var windowOptions = {
        'frame': 'none',
        'id': 'browser',
        'innerBounds':{
           'left':0,
           'top':0,
           'width':displayInfos[0].bounds.width,
           'height':displayInfos[0].bounds.height
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
  "use strict";
  console.log("window.Onclosed received");
  chrome.power.releaseKeepAwake();
  // stop restart check cycle
  clearInterval(intervalProcess);
  // cancel possibly set delayed restart
  chrome.runtime.restartAfterDelay(-1);
}

function determineOperatingSystem() {
  // accesses the "global" operatingSystem so do not use "use strict"
  chrome.runtime.getPlatformInfo(function(platformInformation) {
    operatingSystem = platformInformation.os;
    architecture = platformInformation.arch;
    naclArchitecture = platformInformation.nacl_arch;
    console.log("Operating System: " + operatingSystem + " " + architecture + " " + naclArchitecture);
  });
}

function checkRestart() {
  "use strict";
  console.log("checkRestart: Running check at: " + (new Date()).toString());

  chrome.storage.local.get('player_id', function(content){
    if ('player_id' in content) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://ajax.playr.biz/watchdogs/" + content.player_id +"/command", true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // JSON.parse does not evaluate scripts (in case of an attackers malicious script).
            var resp = JSON.parse(xhr.responseText);
            if (resp !== undefined && resp.toString() == rebootCommand) {
              console.log("checkRestart: Restart at: " + (new Date()).toString());
              // Restart the ChromeOS device when the app runs in kiosk mode. Otherwise, it's no-op.
              chrome.runtime.restart();
            } else {
              // response was not reboot code -> no operation
            }
          } else {
            // non success HTTP status code -> no operation
          }
        } else {
          // XML HTTP Request status not ok -> no operation
        }
      };
      xhr.send();
    } else {
      // player_id undefined, the required HTTP request cannot be made -> no operation
      console.log("checkRestart: player_id is not yet defined");
    }
  });
}

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
setTimeout(function() { intervalProcess = setInterval(checkRestart, interval); }, aMinute);

chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

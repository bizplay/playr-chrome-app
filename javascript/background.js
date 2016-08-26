var operatingSystem = '';

getUUID = function() {
  "use strict";
  // generate a type 4 (random) UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
};

function init() {
  "use strict";
  // don't let computer sleep
  chrome.power.requestKeepAwake("display");

  determineOperatingSystem();
  // make  sure a player id is present, note: async call
  chrome.storage.local.get('player_id', function(content){
    if ('player_id' in content) {
      // player_id defined no action required
    } else {
      chrome.storage.local.set({'player_id':getUUID()}, function() {
        if (chrome.runtime.lastError !== undefined) {
          console.log('init: Error during writing to storage.local: ' + chrome.runtime.lastError.message);
        }
      });
      console.log("init: player_id was not yet defined, has been given UUID");
    }
    openWindow("main.html");
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
}

function determineOperatingSystem() {
  // accesses the "global" operatingSystem so do not use "use strict"
  chrome.runtime.getPlatformInfo(function(platformInformation) {
    operatingSystem = platformInformation.os;
    console.log("Operating System: " + operatingSystem);
  });
}

chrome.runtime.onUpdateAvailable.addListener(function(details) {
  // accesses the "global" operatingSystem so do not use "use strict"
  if (operatingSystem === "cros") {
    console.log("Update available to version: " + details.version + ". Starting update.");
    chrome.runtime.reload();
  } else {
    console.log("onUpdateAvailable received but not supported on " + operatingSystem);
  }
});

chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);
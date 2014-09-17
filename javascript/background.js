var operatingSystem;

getUUID = function() {
  "use strict"
  // generate a type 4 (random) UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
}


function init() {
  "use strict"
  //don't let computer sleep
  chrome.power.requestKeepAwake("display");

  determineOperatingSystem();
  chrome.storage.local.get('player_id',function(content){
    if(('player_id' in content)){
      // player_id defined no action required
    }else{
      chrome.storage.local.set({'player_id':getUUID()});
      console.log("player_id was not yet defined, starting reload...");
      chrome.runtime.reload();
    }
    openWindow("main.html");
  });

  function openWindow(path){
    chrome.system.display.getInfo(function(display){
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'browser',
        'bounds':{
           'left':0,
           'top':0,
           'width':display[0].bounds.width,
           'height':display[0].bounds.height
        }
      },function(window){
        window.fullscreen();
        window.onClosed.addListener(windowOnClosed);
      });
    });
  }
};

function windowOnClosed() {
  "use strict"
	console.log("window.Onclosed received");
	chrome.power.releaseKeepAwake();
};

function determineOperatingSystem() {
  "use strict"
  chrome.runtime.getPlatformInfo(function(platformInformation) {
		operatingSystem = platformInformation.os;
    console.log("Operating System: " + operatingSystem);
  });
};

chrome.runtime.onUpdateAvailable.addListener(function(details) {
	if (operatingSystem === "cros") {
		console.log("Update available to version: " + details.version + ". Starting update.");
		chrome.runtime.reload();
	} else {
		console.log("onUpdateAvailable received but not supported on " + operatingSystem);
  }
});

chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

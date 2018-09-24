const countdownDuration = 15;
const shortPause = 1000;
const mediumPause = 2 * 1000;
const longPause = 10 * 1000;
const oneMinute = 60 * 1000;
const networkInfoDefault = "No network found";
const indent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

var intervalHandle = 0;
var watchdogResetHandle = 0;
var player_id = "";
var device_id = "";
var networkInfo = networkInfoDefault;

document.addEventListener("DOMContentLoaded", function() {
  "use strict";
  showAppInfo();
  // set visibility so only spinner and logo show
  document.getElementById("info").style.display = "block";
  document.getElementById("status").style.display = "none";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("browser").style.display = "none";
  // show spinner and info for a few seconds and then load player webview
  var tmp = setTimeout(function () { loadPlayer(); }, longPause);
});

function showAppInfo() {
  // accesses the "global" player_id so do not use "use strict"
  // we leave in the playerID to have the information show on
  // the screen in case we need to fix things manually
  // TODO remove playerID function if Chrome devices can be considered migrated
  playerId(function () {
    deviceId(function () {
      networkInterfaceList(function (networkInfo) { setInfoInPage(networkInfo); });
    });
  });
}

// global variables player_id and device_id have to be set before calling this function
function setInfoInPage(networkInfo) {
  "use strict";
  document.getElementById("info").innerHTML = "<p>device id: " + device_id + " (" + (player_id !== "" ? (player_id.substr(0, 13) + "...") : "none") + ")" +
                                              "</p><p>app id: " + appId() +
                                              "</p><p>app version: " + appVersion() +
                                              "</p><p>browser version: " + browserVersion() +
                                              "</p><p>OS: " + osVersion() + "</p>" +
                                              "</p><p>Network:<br>" + networkInfo + "</p>";
}

function networkInterfaceList(callback) {
  chrome.system.network.getNetworkInterfaces(function (networkInterfaces) {
    console.log("showAppInfo: networkInterfaces.length: " + networkInterfaces.length.toString());
    if (networkInterfaces !== undefined && networkInterfaces.length > 0) {
      for (var i = 0; i < networkInterfaces.length; i++) {
        console.log("showAppInfo: networkInterfaces[" + i.toString() + "].name: " + networkInterfaces[i].name);
        console.log("showAppInfo: networkInterfaces[" + i.toString() + "].address: " + networkInterfaces[i].address);
        if (networkInfo === networkInfoDefault) {
          if (networkInterfaces[i].address !== undefined && networkInterfaces[i].address !== null && networkInterfaces[i].address.length > 0) {
            networkInfo = "<table><tr><td>" + indent + "</td><td>" + networkInterfaces[i].name + ":</td><td>" + networkInterfaces[i].address + "</td</tr>";
          }
        } else {
          if (networkInterfaces[i].address !== undefined && networkInterfaces[i].address !== null && networkInterfaces[i].address.length > 0) {
            networkInfo += "<tr><td></td><td>" + networkInterfaces[i].name + ":</td><td>" + networkInterfaces[i].address + "</td>";
          }
        }
      }
      if (networkInfo !== networkInfoDefault) {
        networkInfo += "</table>";
      } else {
        networkInfo = indent + networkInfo;
      }
    }
    if (callback !== undefined) { callback(networkInfo); }
  });
}

function playerId(callback) {
  // accesses the "global" player_id so do not use "use strict"
  chrome.storage.local.get("player_id", function (content) {
    if (content !== undefined && content !== null &&
      content.player_id !== null && content.player_id !== undefined) {
      player_id = content.player_id;
      console.log("showAppInfo: player_id: " + player_id);
    }
    if (callback !== undefined) { callback(player_id); }
  });
}

function deviceId(callback) {
  // accesses "global" variables so do not use "use strict"
  chrome.instanceID.getID(function (instanceID) {
    if (instanceID === undefined || instanceID === null || instanceID.length === 0) {
      if (chrome.runtime.lastError !== undefined && chrome.runtime.lastError.message !== undefined) {
        console.log("Error: deviceId; " + chrome.runtime.lastError.message);
      } else {
        console.log("Error: deviceId; instanceID is undefined");
      }
    } else {
      device_id = instanceID;
      console.log("deviceId: instanceID = " + instanceID);
    }
    if (callback !== undefined) { callback(instanceID); }
  });
}

function osVersion() {
  "use strict";
  var result = "";
  var os_info_parts = window.navigator.userAgent.match(/\((.*?)\)/)[1].split(";");
  for (var i = 0; i < os_info_parts.length; i++) {
    result += os_info_parts[i] + (i === (os_info_parts.length - 1) ? "" : " ");
  }
  console.log("OS Version: " + result);
  return result;
}

function browserVersion() {
  "use strict";
  return window.navigator.appVersion.match(/Chrome\/(.*?) /)[1];
}

function appId() {
  "use strict";
  return chrome.runtime.id;
}

function appVersion() {
  "use strict";
  return chrome.runtime.getManifest().version;
}

function setPlayerIdCookieAndLoadWebView() {
  "use strict";
  console.log("setPlayerIdCookieAndLoadWebView: about to load WebView [" + currentTime() + "]");

  if (device_id !== "") {
    console.log("setPlayerIdCookieAndLoadWebView: load WebView with device_id=" + device_id);
    loadWebView(device_id);
  } else {
    console.log("setPlayerIdCookieAndLoadWebView: load WebView calling deviceId");
    deviceId(function (deviceID) {
      loadWebView(deviceID);
    });
  }
}

function loadWebView(deviceID) {
  // accesses the "global" watchdogResetHandle so do not use "use strict"
  // remove previous interval identifier
  if (watchdogResetHandle > 0) { clearInterval(watchdogResetHandle); }
  watchdogResetHandle = setInterval(function () {
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
      // prevent the watchdog from restarting the device (if this thread crashes/freezes a restart should occur)
      if (backgroundPage !== undefined) {
        backgroundPage.watchdogTrigger = backgroundPage.watchdogTriggerNoRestart;
      } else {
        console.log("loadWebView getBackgroundPage; Error: No background page found");
      }
    });
  }, oneMinute);
  console.log("loadWebView: started watchdog reset cycle: " + watchdogResetHandle.toString());
  console.log("loadWebView: resize browser to " + window.innerWidth + "x" + window.innerHeight + "px");
  document.getElementById("browser").setAttribute("style", "width:" + window.innerWidth + "px;height:" + window.innerHeight + "px;");
  console.log("loadWebView: reload browser element");
  document.getElementById("browser").setAttribute("src", "http://play.playr.biz/?player_id=" + deviceID + "&app_version=" + appVersion());
}

function loadPlayer() {
  // accesses the "global" countdownDuration so do not use "use strict"
  // set visibility of just spinner and logo and set retry time on screen
  document.getElementById("info").style.display = "block";
  document.getElementById("seconds").innerHTML = countdownDuration;
  document.getElementById("status").style.display = "none";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("browser").style.display = "none";
  // try loading image file to check internet connection
  // when successful start player, when not start and show retry timer
  tryLoadingImage(gotoPlayer, retryLoading);
}

function gotoPlayer() {
  "use strict";
  console.log("gotoPlayer: internet connection established, loading webview");
  // make only webview visible
  document.getElementById("info").style.display = "none";
  document.getElementById("ajax_loader").style.display = "none";
  document.getElementById("status").style.display = "none";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("browser").style.display = "block";
  // set cookie target and go to target url
  setPlayerIdCookieAndLoadWebView();
}

function retryLoading() {
  // accesses the "global" variables so do not use "use strict"
  console.log("retryLoading: internet connection not found, starting countdown before retry");
  // set timer and show retry message
  var countdown = countdownDuration;
  document.getElementById("status").style.display = "block";
  setTimeout(function () { document.getElementById("countdown").style.display = "block"; }, mediumPause);

  // remove previous interval identifier
  if (intervalHandle > 0) { clearInterval(intervalHandle); }

  // decrease timer on screen every second and run
  // loadPlayer function when timer is 0
  intervalHandle = setInterval(function () {
    if (countdown >= 0) {
      document.getElementById("seconds").innerHTML = countdown;
      countdown = countdown - 1;
    } else {
      clearInterval(intervalHandle);
      loadPlayer();
    }
  }, shortPause);
}

function tryLoadingImage(success_callback, fail_callback) {
  "use strict";
  // check presence of callback functions
  if (success_callback !== undefined && fail_callback !== undefined) {
    // the request for an image has to be done using XMLHttpRequest
    // because of the Content Security Policy of Chrome apps; https://developer.chrome.com/apps/contentSecurityPolicy
    // NOTE: the base of the url needs to be declared in the permissions part
    // of the manifest.json
    var url = "https://www.playr.biz/playr_loader_test_image.png?" + escape(new Date().getTime());
    try {
      var xhr = new XMLHttpRequest();
      xhr.responseType = "blob";
      xhr.onload = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            success_callback();
          } else {
            showStatus("Error", "code=" + xhr.status.toString(), "error");
            fail_callback();
          }
        } else {
          // since the onload event should only fire when readyState === 4
          // the handling of this situation is different from playr_loader.html
          showStatus("Error", "status=" + xhr.readyState.toString(), "error");
          fail_callback();
        }
      };
      xhr.onerror = function () {
        showStatus("Error", "event=onerror", "error");
        fail_callback();
      };
      xhr.onabort = function () {
        showStatus("Error", "event=onabort", "error");
        fail_callback();
      };
      xhr.ontimeout = function () {
        showStatus("Error", "event=ontimeout", "error");
        fail_callback();
      };
      xhr.onprogress = function () {
        showStatus("Loading", "status=" + xhr.readyState.toString(), "info");
      };

      xhr.open("GET", url, true); // true to make the call async
      xhr.send();
    } catch (exception) {
      showStatus(exception.name, exception.message, "error");
    }
  } else {
    console.log("tryLoadingImage: success_callback and/or fail_callback not defined");
  }
}

function showStatus(name, message, level) {
  if (level !== undefined && level === "error") {
    document.getElementById("status").innerHTML = "<p>Could not" +
      " connect to signage service.</p>" +
      " Does this device have a network connection or could" +
      " the internet connection be down? Please check your" +
      " network or restart this device." +
      ' <p><div id="exception_message">' + name +
      ": " + message + "</div></p>";
  } else {
    document.getElementById("status").innerHTML = '<p><div id="exception_message">' + name +
      ": " + message + "</div></p>";
  }
  document.getElementById("status").style.display = "block";
}

function currentTime() {
  "use strict";
  var now = new Date();
  return zeropad(now.getHours(), 2) + ":" + zeropad(now.getMinutes(), 2) + ":" + zeropad(now.getSeconds(), 2) + "." + zeropad(now.getMilliseconds(), 3);
}

function zeropad(number, places) {
  "use strict";
  // used this 'clever' solution because it is fast, see http://jsperf.com/left-zero-pad
  var aNumber = Math.abs(number);
  var zeros = Math.max(0, places - Math.floor(aNumber).toString().length);
  var padding = Math.pow(10, zeros).toString().substr(1);
  if (number < 0) {
    padding = "-" + padding;
  }

  return padding + number;
}

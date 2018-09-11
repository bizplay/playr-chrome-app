const countdownDuration = 15;
const oneSecond = 1000;
const fiveSeconds = 5 * 1000;
const networkInfoDefault = "No network found";
const indent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

var intervalHandle = 0;
var player_id = "";
var networkInfo = networkInfoDefault;

document.addEventListener("DOMContentLoaded", function(){
  "use strict";
  showAppInfo();
  // set visibility so only spinner and logo show
  document.getElementById("retry_message").style.display = "none";
  document.getElementById("browser").style.display = "none";
  // show spinner and info for a few seconds and then load player webview
  var tmp = setTimeout(function () { loadPlayer(); }, fiveSeconds);
});

var showAppInfo = function() {
  // accesses the "global" player_id so do not use "use strict"
  chrome.storage.local.get("player_id",function(content){
    if (content !== undefined && content !== null &&
        content.player_id !== null && content.player_id !== undefined) {
      player_id = content.player_id;
      console.log("showAppInfo: player_id: " + player_id);
    }
    chrome.system.network.getNetworkInterfaces(function (networkInterfaces) {
      console.log("showAppInfo: networkInterfaces.length: " + networkInterfaces.length.toString());
      if (networkInterfaces !== undefined && networkInterfaces.length > 0) {
        for (var i = 0; i < networkInterfaces.length ; i++) {
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
      setInfoInPage(player_id, networkInfo);
    });
  });
};

var setInfoInPage = function(player_id, networkInfo) {
  "use strict";
  document.getElementById("info").innerHTML = "<p>device id: " + (player_id !== "" ? player_id.substr(0,8) : "none") +
                                              "</p><p>app id: " + appId() +
                                              "</p><p>app version: " + appVersion() +
                                              "</p><p>browser version: " + browserVersion() +
                                              "</p><p>OS: " + osVersion() + "</p>" +
                                              "</p><p>Network:<br>" + networkInfo + "</p>";
};

var osVersion = function() {
  "use strict";
  var result = "";
  var os_info_parts = window.navigator.userAgent.match( /\((.*?)\)/ )[1].split(";");
  for (var i = 0; i < os_info_parts.length; i++) {
    result += os_info_parts[i] + (i === (os_info_parts.length - 1) ? "" : " ");
  }
  console.log("OS Version: " + result);
  return result;
};

var browserVersion = function() {
  "use strict";
  return window.navigator.appVersion.match(/Chrome\/(.*?) /)[1];
};

var appId = function() {
  "use strict";
  return chrome.runtime.id;
};

var appVersion = function() {
  "use strict";
  return chrome.runtime.getManifest().version;
};

var setPlayerIdCookieAndLoadWebView = function() {
  "use strict";
  console.log("setPlayerIdCookieAndLoadWebView: about to load WebView [" + currentTime() + "]");

  if (player_id === "") {
    getPlayerIdAndLoadWebView();
  } else {
    console.log("setPlayerIdCookieAndLoadWebView: load WebView with player_id = " + player_id);
    loadWebView(player_id);
  }
};

var getPlayerIdAndLoadWebView = function() {
  // accesses the "global" player_id so do not use "use strict"
  chrome.storage.local.get("player_id", function(content){
    if (content !== undefined && content !== null &&
        content.player_id !== null && content.player_id !== undefined) {
      player_id = content.player_id;
    }
    console.log("getPlayerIdAndLoadWebView: load WebView with player_id = " + player_id + " [" + currentTime() + "]");
    loadWebView(player_id);
  });
};

var loadWebView = function(player_id) {
  "use strict";
  console.log("loadWebView: resize browser to " + window.innerWidth + "x" + window.innerHeight + "px");
  document.getElementById("browser").setAttribute("style", "width:" + window.innerWidth + "px;height:"+window.innerHeight+"px;");
  console.log("loadWebView: reload browser element");
  document.getElementById("browser").setAttribute("src", "http://play.playr.biz/?player_id=" + player_id + "&app_version=" + appVersion());
};

var loadPlayer = function() {
  // accesses the "global" countdownDuration so do not use "use strict"
  // set visibility of just spinner and logo and set retry time on screen
  document.getElementById("info").style.display = "block";
  document.getElementById("seconds").innerHTML = countdownDuration;
  document.getElementById("status").style.display = "none";
  document.getElementById("countdown").style.display = "none";
  document.getElementById("browser").style.display = "none";
  // try loading image file to check internet connection
  // when successful start player, when not start and show retry timer
  tryLoadingImage(gotoPlayer,retryLoading);
};

var gotoPlayer = function() {
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
};

var retryLoading = function() {
  // accesses the "global" variables so do not use "use strict"
  console.log("retryLoading: internet connection not found, starting countdown before retry");
  // set timer and show retry message
  var countdown = countdownDuration;
  document.getElementById("status").style.display = "block";
  setTimeout(function () { document.getElementById("countdown").style.display = "block"; }, 2000);

  // remove previous interval identifier
  if (intervalHandle > 0) { clearInterval(intervalHandle); }

  // decrease timer on screen every second and run
  // loadPlayer function when timer is 0
  intervalHandle = setInterval(function() {
    if (countdown >= 0) {
      document.getElementById("seconds").innerHTML = countdown;
      countdown = countdown - 1;
    } else {
      clearInterval(intervalHandle);
      loadPlayer();
    }
  }, oneSecond);
};

var tryLoadingImage = function(success_callback, fail_callback) {
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
        } else{
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
        fail_callback();
      };

      xhr.open("GET", url, true); // true to make the call async
      xhr.send();
    } catch (exception) {
      showStatus(exception.name, exception.message, "error");
    }
  } else {
    console.log("tryLoadingImage: success_callback and/or fail_callback not defined");
  }
};

var showStatus = function(name, message, level) {
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
};

var currentTime = function() {
  "use strict";
  var now = new Date();
  return zeropad(now.getHours(), 2) + ":" + zeropad(now.getMinutes(), 2) + ":" + zeropad(now.getSeconds(), 2) + "." + zeropad(now.getMilliseconds(), 3);
};

var zeropad = function(number, places){
  "use strict";
  // used this 'clever' solution because it is fast, see http://jsperf.com/left-zero-pad
  var aNumber = Math.abs(number);
  var zeros = Math.max(0, places - Math.floor(aNumber).toString().length );
  var padding = Math.pow(10,zeros).toString().substr(1);
  if( number < 0 ) {
    padding = "-" + padding;
  }

  return padding + number;
};

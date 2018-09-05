var tryCountdown = 0;
var countdownDuration = 10;
var player_id = '';

document.addEventListener('DOMContentLoaded', function(){
  "use strict";
  showAppInfo();
  // set visibility so only spinner and logo show
  document.getElementById("retry_message").style.display = "none";
  document.getElementById("browser").style.display = "none";
  // show spinner and info for a few seconds and then load player webview
  var tmp = setTimeout( function() { loadPlayer(); }, 5000);
});

var showAppInfo = function() {
  // accesses the "global" player_id so do not use "use strict"
  chrome.storage.local.get('player_id',function(content){
    if (content !== undefined && content !== null &&
        content.player_id !== null && content.player_id !== undefined) {
      player_id = content.player_id;
    }
    setInfoInPage(player_id);
  });
};

var setInfoInPage = function(player_id) {
  "use strict";
  document.getElementById("info").innerHTML = "<p>device id: " + (player_id !== '' ? player_id.substr(0,8) : "none") +
                                              "</p><p>app id: " + appId() +
                                              "</p><p>app version: " + appVersion() +
                                              "</p><p>browser version: " + browserVersion() +
                                              "</p><p>OS: " + osVersion() + "</p>";
};

var osVersion = function() {
  "use strict";
  var result = "";
  var os_info_parts = window.navigator.userAgent.match( /\((.*?)\)/ )[1].split(';');
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

  if (player_id === '') {
    getPlayerIdAndLoadWebView();
  } else {
    console.log("setPlayerIdCookieAndLoadWebView: load WebView with player_id = " + player_id);
    loadWebView(player_id);
  }
};

var getPlayerIdAndLoadWebView = function() {
  // accesses the "global" player_id so do not use "use strict"
  chrome.storage.local.get('player_id', function(content){
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
  document.getElementById("browser").setAttribute('style', 'width:' + window.innerWidth + 'px;height:'+window.innerHeight+'px;');
  console.log("loadWebView: reload browser element");
  document.getElementById("browser").setAttribute('src', 'http://play.playr.biz/?player_id=' + player_id + '&app_version=' + appVersion());
};

var loadPlayer = function() {
  // accesses the "global" countdownDuration so do not use "use strict"
  // set visibility of just spinner and logo and set retry time on screen
  document.getElementById("info").style.display = "block";
  document.getElementById("seconds").innerHTML = countdownDuration;
  document.getElementById("retry_message").style.display = "none";
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
  document.getElementById("retry_message").style.display = "none";
  document.getElementById("loaderImage").style.display = "none";
  document.getElementById("browser").style.display = "block";
  // set cookie target and go to target url
  setPlayerIdCookieAndLoadWebView();
};

var retryLoading = function() {
  // accesses the "global" operatingSystem so do not use "use strict"
  console.log("retryLoading: internet connection not found, starting countdown before retry");
  // set timer and show retry message
  var countdown = countdownDuration;
  document.getElementById("retry_message").style.display = "block";

  // remove previous interval identifier
  if (tryCountdown > 0) { clearInterval(tryCountdown); }

  // decrease timer on screen every second and run
  // loadPlayer function when timer is 0
  tryCountdown = setInterval(function() {
    if (countdown >= 0) {
      document.getElementById("seconds").innerHTML = countdown;
      countdown = countdown - 1;
    } else {
      clearInterval(tryCountdown);
      loadPlayer();
    }
  }, 1000);
};

var tryLoadingImage = function(success_callback, fail_callback) {
  "use strict";
  // check presence of callback functions
  if (success_callback !== undefined && fail_callback !== undefined) {
    // the request for an image has to be done using XMLHttpRequest
    // because of the Content Security Policy of Chrome apps; https://developer.chrome.com/apps/contentSecurityPolicy
    // NOTE: the base of the url needs to be declared in the permissions part
    // of the manifest.json
    var url = "http://www.playr.biz/playr_loader_test_image.png?" + escape(new Date());
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          success_callback();
        } else {
          fail_callback();
        }
      } else{
        fail_callback();
      }
    };
    xhr.onerror = function () { fail_callback(); };
    xhr.onabort = function () { fail_callback(); };

    // do actual request
    xhr.send();
  } else {
    console.log("tryLoadingImage: success_callback and/or fail_callback not defined");
    document.getElementById("info").innerHTML = "<p><strong>An error occurred, please restart this device.</strong></p>" + document.getElementById("info").innerHTML;
    document.getElementById("info").style.display = "block";
  }
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
    padding = '-' + padding;
  }

  return padding + number;
};

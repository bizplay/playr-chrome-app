var tryCountdown = 0;
var countdownDuration = 10;

document.addEventListener('DOMContentLoaded', function(){
  // set visibility so only spinner and logo show
  showAppInfo();
  document.getElementById("retry_message").style.display = "none";
  document.getElementById("browser").style.display = "none";
  // show spinner and info for a few seconds and then load player webview
  var tmp = setTimeout( function() { loadPlayer(); }, 5000);
});

var showAppInfo = function() {
  "use strict"
  chrome.storage.local.get('player_id',function(content){
    var player_id = '';
    if (content !== undefined && content !== null
        && content["player_id"] !== null && content["player_id"] !== undefined) {
      player_id = content["player_id"];
    }
    setInfoInPage(player_id);
  });
};

var setInfoInPage = function(player_id) {
  "use strict"
  if (player_id !== '') {
    document.getElementById("info").innerHTML = "id: " + player_id.substr(0,8) + " version: " + getCurrentAppVersion();
  } else {
    document.getElementById("info").innerHTML = "id: none version: " + getCurrentAppVersion();
  }
};

var getCurrentAppVersion = function() {
  "use strict"
    return chrome.runtime.getManifest().version;
};

var setPlayerIdCookieAndLoadWebView = function() {
  "use strict"
  chrome.storage.local.get('player_id',function(content){
    var player_id = '';
    if (content !== undefined && content !== null
        && content["player_id"] !== null && content["player_id"] !== undefined) {
      player_id = content["player_id"];
    }
    loadWebView(player_id);
  });
};

var loadWebView = function(player_id) {
  "use strict"
  document.getElementById("browser").setAttribute('style', 'width:' + window.innerWidth + 'px;height:'+window.innerHeight+'px;');
  document.getElementById("browser").setAttribute('src', 'http://play.playr.biz/?player_id=' + player_id);
  document.getElementById("browser").reload();
};

var loadPlayer = function() {
  "use strict"
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
  "use strict"
  // only webview is visible, set target url
  document.getElementById("info").style.display = "none";
  document.getElementById("ajax_loader").style.display = "none";
  document.getElementById("retry_message").style.display = "none";
  document.getElementById("loaderImage").style.display = "none";
  document.getElementById("browser").style.display = "block";
  setPlayerIdCookieAndLoadWebView();
};

var retryLoading = function() {
  "use strict"
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
  "use strict"
  // check presence of callback functions
  if (success_callback !== undefined && fail_callback !== undefined) {
    // request to image at bizplay site has to be done using XMLHttpRequest
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
    xhr.onerror = fail_callback;
    xhr.onabort = fail_callback;

    // do actual request
    xhr.send();
  }
};

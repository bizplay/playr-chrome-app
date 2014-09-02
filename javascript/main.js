document.addEventListener('DOMContentLoaded', function(){
  // set visibility so only spinner and logo show
  // document.getElementById("retry_message").style.display = "none";
  // document.getElementById("the_webview").style.display = "none";
  // show logo and spinner for 2 seconds and then load player webview
  // var tmp = setTimeout( function() { loadPlayer(); }, 2000);
  chrome.storage.local.get('player_id',function(x){
    console.log("main.js::DOMContentLoaded start");
    var player_id = '';
    if (x !== undefined && x !== null && x["player_id"] !== null && x["player_id"] !== undefined) {
      console.log("main.js::DOMContentLoaded player_id: " + x["player_id"]);
      player_id = x["player_id"];
      var d = new Date();
      d.setTime(d.getTime() + (20*365*24*60*60*1000)); // set 20 years into the future
      var expires = "expires="+d.toUTCString();
      document.cookie = 'playback_device_id' + "=" + x["player_id"] + "; " + expires + "; path=/; domain=.playr.biz";
      document.cookie = 'KAK' + "=" + x["player_id"] + "; " + expires + "; path=/; domain=.playr.biz";
      document.cookie = 'POEP' + "=" + x["player_id"] + "; " + expires + "; path=/; domain=play.playr.biz";
    }

    //document.getElementById("browser").attr('src',x["url"]).get(0).reload();
    document.getElementById("browser").setAttribute('style', 'width:' + window.innerWidth + 'px;height:'+window.innerHeight+'px;');
    // document.getElementById("browser").setAttribute('src', 'http://www.google.com/').reload();
    document.getElementById("browser").setAttribute('src', 'http://play.playr.biz/?player_id=' + player_id);
    document.getElementById("browser").reload();
    console.log("main.js::DOMContentLoaded end");
  });
 });

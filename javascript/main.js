document.addEventListener('DOMContentLoaded', function(){
  // set visibility so only spinner and logo show
  // document.getElementById("retry_message").style.display = "none";
  // document.getElementById("the_webview").style.display = "none";
  // show logo and spinner for 2 seconds and then load player webview
  // var tmp = setTimeout( function() { loadPlayer(); }, 2000);
  chrome.storage.local.get('player_id',function(x){
    var d = new Date();
    d.setTime(d.getTime() + (20*365*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = 'player_id' + "=" + x["url"] + "; " + expires;
    // document.getElementById("browser").attr('src',x["url"]).get(0).reload();
    document.getElementById("browser").setAttribute('src', 'http://play.playr.biz/');
  });
 });

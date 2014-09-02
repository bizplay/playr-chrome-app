document.addEventListener('DOMContentLoaded', function(){
  // set visibility so only spinner and logo show
  // document.getElementById("retry_message").style.display = "none";
  // document.getElementById("the_webview").style.display = "none";
  // show logo and spinner for 2 seconds and then load player webview
  // var tmp = setTimeout( function() { loadPlayer(); }, 2000);
  chrome.storage.local.get('player_id',function(x){
    var player_id = '';
    if (x !== undefined && x !== null && x["player_id"] !== null && x["player_id"] !== undefined) {
      player_id = x["player_id"];
    }
    document.getElementById("browser").setAttribute('style', 'width:' + window.innerWidth + 'px;height:'+window.innerHeight+'px;');
    document.getElementById("browser").setAttribute('src', 'http://play.playr.biz/?player_id=' + player_id);
    document.getElementById("browser").reload();
  });
 });

getUUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
}

chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {

  //don't let computer sleep
  chrome.power.requestKeepAwake("display");

  chrome.storage.local.get('player_id',function(x){
    if(('player_id' in x)){
      // player_id defined no action required
    }else{
      chrome.storage.local.set({'player_id':getUUID()});
      chrome.runtime.reload();
    }
    openWindow("main.html");
  });

  function openWindow(path){
    chrome.system.display.getInfo(function(d){
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'browser',
        'bounds':{
           'left':0,
           'top':0,
           'width':d[0].bounds.width,
           'height':d[0].bounds.height
        }
      },function(w){
        w.fullscreen();
      });
    });
  }
}

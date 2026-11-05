/* 離線快取：開 App 時先向網站確認新版，最多等 WAIT 毫秒。沒回應或回應不正常就用快取，網站之後回應了再更新快取，下次打開就是新版 */
var CACHE='scoresheet-35b76b7e';
var PREFIX='scoresheet-';
var WAIT=1500;
var FILES=['./','index.html','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
// 同一個網域可能有別的程式：只清自己舊版的快取
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x.indexOf(PREFIX)===0&&x!==CACHE}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
function cached(req,nav){return caches.match(req).then(function(r){return r||(nav?caches.match('./'):undefined)})}
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  // 開 App 時一律向網站確認有沒有新版，不用瀏覽器 10 分鐘的快取
  var nav=e.request.mode==='navigate';
  var net=(nav?fetch(e.request.url,{cache:'no-cache'}):fetch(e.request)).then(function(r){
    if(!r||!r.ok)throw r; // 錯誤頁不能當成 App
    var cp=r.clone();
    return caches.open(CACHE).then(function(c){return c.put(e.request,cp)}).then(function(){return r},function(){return r});
  });
  e.waitUntil(net.catch(function(){}));
  e.respondWith(new Promise(function(done,fail){
    var sent=false;
    function send(r){if(!sent&&r){sent=true;done(r)}}
    var timer=setTimeout(function(){cached(e.request,nav).then(send)},WAIT);
    net.then(function(r){clearTimeout(timer);send(r)},function(bad){
      clearTimeout(timer);
      cached(e.request,nav).then(function(r){
        if(r)send(r);
        else if(bad&&bad.status)send(bad); // 沒有快取時才顯示網站的錯誤頁
        else if(!sent)fail(bad);
      });
    });
  }));
});

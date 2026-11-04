/* 離線快取：有網路時抓最新版，沒網路時用快取 */
var CACHE='scoresheet-25e8aafc';
var FILES=['./','index.html','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==CACHE}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  // 開 App 時一律向網站確認有沒有新版，不用瀏覽器 10 分鐘的快取
  var nav=e.request.mode==='navigate';
  e.respondWith((nav?fetch(e.request.url,{cache:'no-cache'}):fetch(e.request)).then(function(r){
    if(r&&r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp)})}
    return r;
  }).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match('./')})}));
});

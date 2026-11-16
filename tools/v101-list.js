/* 11/16 晚（使用者 23:35 提議、23:39 確認）：
   - 觀看端：「觀看比賽」改成比賽清單。加入代碼後留在清單，不會直接跳進觀看；每一列寫場地、誰打誰、比分、狀態，按「觀看」才進去。
     清單的比分來自記錄台另外傳的摘要 s（很小），不用下載整場紀錄。
   - 觀看的裝置登記「我在看」（m/代碼/w/自己的 uid：名稱、裝置種類、時間、在線），斷線自動改成離線。
   - 記錄台：分享視窗多「觀看裝置 N 台」，可以改名稱（只存在記錄台）、移除（m/代碼/b/uid，規則擋讀寫）、更換代碼。
   - 名稱：記錄台取的 ＞ 觀看的人自己填的「本機名稱」＞ 裝置種類。
   舊版規則（沒有 s、w、b）時這些寫不進去，比分照常同步，只是清單沒有比分、記錄台看不到誰在看。 */
var NAME_KEY=KEY+'-myname',VNAME_KEY=KEY+'-vnames';
function myName(){try{return (localStorage.getItem(NAME_KEY)||'').trim().slice(0,20)}catch(e){return ''}}
function devType(){var u=navigator.userAgent||'';
  if(/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1))return 'iPad';if(/iPhone|iPod/.test(u))return 'iPhone';
  if(/Android/.test(u))return /Mobile/.test(u)?'Android 手機':'Android 平板';if(/CrOS/.test(u))return 'Chromebook';
  if(/Windows/.test(u))return 'Windows 電腦';if(/Macintosh/.test(u))return 'Mac';return '其他裝置'}
function hm(t){var d=new Date(t);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}

/* ---------- 記錄台：比賽摘要（清單用） ---------- */
function syncSum(m){
  if(!share||!share.made||share.lost||!fb||!sy.conn||sy.sBad||!m)return;
  var q=safeReduce(m);if(!q)return;
  var n=q.setNo,c=q.sets[n]||{score:{t1:0,t2:0}},w=setsWon(q),st=matchOver(q)?'over':c.ended?'break':(n===1&&!c.firstServeAt&&!c.score.t1&&!c.score.t2)?'none':'play';
  var j=JSON.stringify({c:courtLabel(q.info&&q.info.court)||'',a:tName(q,'t1'),b:tName(q,'t2'),w:[w.t1,w.t2],n:n,sc:[c.score.t1||0,c.score.t2||0],st:st});
  if(j.length>400||j===sy.sKey)return;sy.sKey=j;
  fb.update('m/'+share.code,{s:j}).catch(function(e){sy.sKey=null;if(/permission/i.test(String(e&&(e.code||e.message)||e)))sy.sBad=true});
}
function sumText(s){
  if(!s)return '';
  if(s.st==='none')return '尚未開始';
  if(s.st==='over')return '比賽結束　局數 '+s.w[0]+':'+s.w[1];
  if(s.st==='break')return '第 '+s.n+' 局結束 '+s.sc[0]+':'+s.sc[1]+'　局數 '+s.w[0]+':'+s.w[1];
  return '第 '+s.n+' 局 '+s.sc[0]+':'+s.sc[1]+'　局數 '+s.w[0]+':'+s.w[1];
}

/* ---------- 觀看端：清單裡每個代碼的狀態 ---------- */
var wl={}; // 代碼 → {o,on,s,deny,offs,pres}
function wlSync(){
  var cs=watchedList().map(function(x){return x.c});
  Object.keys(wl).forEach(function(c){if(cs.indexOf(c)<0)wlDrop(c);
    else if(wl[c].deny&&Date.now()-wl[c].denyAt>10000){wl[c].offs.forEach(function(f){try{f()}catch(x){}});delete wl[c]}}); // 被移除時 Firebase 會斷掉監聽：10 秒後重新試（記錄台可能取消移除、或代碼已換掉）
  if(!cs.length)return;
  if(!fb){if(navigator.onLine!==false&&!fbErr)fbLoad();return}
  cs.forEach(function(c){if(wl[c])return;var e=wl[c]={o:undefined,on:null,s:null,deny:false,offs:[],pres:false};
    ['o','on','s'].forEach(function(k){e.offs.push(fb.on('m/'+c+'/'+k,function(v){if(wl[c]!==e)return;
      if(k==='s'){var o=null;try{o=v?JSON.parse(v):null}catch(x){}e.s=o;if(o)watchedSet(c,o.a+' 對 '+o.b,o.c)}else e[k]=v;e.deny=false;wlPaint()},
      function(){if(wl[c]!==e)return;e.deny=true;e.denyAt=Date.now();wlPaint()}))});
    wlPresence(c)});
}
function wlPresence(c){var e=wl[c];if(!e||!fb||!sy.conn||e.deny)return;var p='m/'+c+'/w/'+fb.uid;
  fb.update(p,{n:myName(),d:devType(),t:fb.ts(),on:true}).then(function(){e.pres=true;fb.onDrop(p,{on:false}).catch(function(){})},function(){})}
function wlResume(){Object.keys(wl).forEach(wlPresence);wlSync()}
function wlDrop(c){var e=wl[c];if(!e)return;e.offs.forEach(function(f){try{f()}catch(x){}});delete wl[c];
  if(fb&&e.pres){var p='m/'+c+'/w/'+fb.uid;fb.offDrop(p).catch(function(){});fb.remove(p).catch(function(){})}}
var wlDirty=false;
setInterval(function(){if(Object.keys(wl).some(function(c){return wl[c].deny}))wlSync()},5000);
/* 正在打字（欄位裡有字）時先不重畫，免得打到一半被清掉；空的就照常重畫 */
function typingNow(){var a=document.activeElement;return !!(a&&(a.id==='watch-code'&&a.value||a.id==='my-name'||a.id==='vw-name'))}
function wlPaint(){if(view!=='home')return;if(typingNow()){wlDirty=true;return}render()}
document.addEventListener('focusout',function(){setTimeout(function(){if(wlDirty&&!typingNow()){wlDirty=false;render()}},0)});
/* 打字中的內容記在 ui，畫面重畫也不會不見 */
document.addEventListener('input',function(e){var t=e.target;if(!t||!t.id)return;
  if(t.id==='watch-code'&&ui.watchAsk)ui.watchAsk.v=t.value;
  else if(t.id==='my-name'&&ui.watchAsk)ui.watchAsk.nm=t.value;
  else if(t.id==='vw-name'){var x=ui.shareAsk||ui.sheet;if(x)x.rn=t.value}});
function nameSave(){var x=ui.watchAsk;if(!x||x.nm==null)return;var v=String(x.nm).trim().slice(0,20);
  try{if(v)localStorage.setItem(NAME_KEY,v);else localStorage.removeItem(NAME_KEY)}catch(e){}
  x.nm=null;x.nmSaved=true;Object.keys(wl).forEach(wlPresence)}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='my-name'){if(ui.watchAsk)ui.watchAsk.nm=e.target.value;nameSave();render()}});
/* 主畫面「觀看比賽」的小字 */
function watchSmall(){var rc=watchedList();if(!rc.length)return '輸入代碼或掃描 QR code，觀看其他記錄台';
  var live=rc.filter(function(r){var e=wl[r.c];return e&&e.s&&(e.s.st==='play'||e.s.st==='break')&&e.o}).length;
  return '比賽清單 '+rc.length+' 場'+(live?'・進行中 '+live+' 場':'')}
function wsmPaint(){var t=watchSmall();[].forEach.call(document.querySelectorAll('[data-wsm]'),function(el){if(el.textContent!==t)el.textContent=t})}
function wlRow(r){
  var e=wl[r.c]||{},s=e.s,title=(s&&s.c)||r.ct||'',teams=s?s.a+' 對 '+s.b:r.t||'',st,cls='';
  if(e.deny){st='記錄台已停止本機的觀看權限';cls='bad'}
  else if(e.o===undefined)st=fb||navigator.onLine!==false?'讀取中…':'沒有網路';
  else if(e.o===null){st='找不到這個代碼：記錄台可能已停止分享或已更換代碼';cls='bad'}
  else{st=s?sumText(s):'記錄台尚未開始記錄';if(e.on===false){st+=(st?'・':'')+'記錄台離線';cls='bad'}}
  return '<div class="wrow"><div class="wri"><b>'+esc(title||teams||('代碼 '+r.c))+'</b>'+(title&&teams?'<span>'+esc(teams)+'</span>':'')+
    '<small class="'+cls+'">'+esc(st)+'</small><small>代碼 '+esc(r.c)+'</small></div>'+
    '<div class="wrb"><button class="wrgo" data-act="watchrecent" data-v="'+esc(r.c)+'"'+(e.deny||e.o===null?' aria-disabled="true"':'')+'>觀看</button>'+
    '<button class="wrx" data-act="wlrm" data-v="'+esc(r.c)+'" aria-label="從清單移除代碼 '+esc(r.c)+'">移除</button></div></div>';
}

/* ---------- 記錄台：觀看裝置清單 ---------- */
function vnames(){try{return JSON.parse(localStorage.getItem(VNAME_KEY))||{}}catch(e){return {}}}
function vLabel(uid,w){var m=vnames()[uid];return m||(w&&w.n)||(w&&w.d)||'觀看裝置'}
function vwList(){var w=sy.vw||{},b=sy.vb||{};return Object.keys(w).filter(function(u){return w[u]&&typeof w[u]==='object'&&!b[u]}).map(function(u){return {u:u,w:w[u]}})
  .sort(function(a,b2){return (b2.w.on===true)-(a.w.on===true)||(Number(a.w.t)||0)-(Number(b2.w.t)||0)})}
function vwCount(){return vwList().filter(function(x){return x.w.on===true}).length}
function vwPaint(){var x=ui.shareAsk||ui.sheet;if(x&&(x===ui.shareAsk||x.type==='sync')&&!typingNow())render()}
function vwBtn(){if(!share||!share.made||share.lost)return '';var n=vwCount();
  return '<button class="vwbtn" data-act="vwopen"><span>觀看裝置</span><b>'+(sy.sBad?'—':n+' 台連線中')+'</b><i>›</i></button>'}
function vwHtml(x){
  var head='<div class="shd"><button class="backbtn" data-act="vwback">‹ 返回</button><h2>觀看裝置</h2><button data-act="close">關閉</button></div>';
  if(x.vrm){var r=(sy.vw||{})[x.vrm];return '<h2>移除「'+esc(vLabel(x.vrm,r))+'」？</h2><p class="muted">這台會立刻無法觀看，也不能接手記錄。對方清除瀏覽器資料或換瀏覽器後可以重新加入；要確實擋掉，請更換代碼。</p>'+
    '<button class="primary" data-act="vwrm2">移除</button><button class="ghost" data-act="vwno">取消</button>'}
  if(x.vnew)return '<h2>更換代碼？</h2><p class="muted">所有觀看裝置都會中斷，需要重新掃描新的 QR code 或輸入新代碼。已移除的裝置也一併清除。</p>'+
    '<button class="primary" data-act="vwnew2">更換代碼</button><button class="ghost" data-act="vwno">取消</button>';
  if(sy.sBad)return head+'<p class="note">Firebase 規則尚未更新，暫時看不到觀看裝置。比分照常同步。</p>';
  var L=vwList(),b=sy.vb||{},banned=Object.keys(b).filter(function(u){return b[u]===true}),vn=vnames();
  var rows=L.length?L.map(function(it){var w=it.w,on=w.on===true,ed=x.ren===it.u;
    return '<div class="vwrow'+(on?'':' off')+'"><div class="vwi"><b>'+esc(vLabel(it.u,w))+'</b><small>'+esc([vn[it.u]&&w.n?w.n:'',vLabel(it.u,w)!==w.d?w.d:'',w.t?hm(Number(w.t))+' 連線':''].filter(Boolean).join('・'))+'</small><small class="'+(on?'ok':'')+'">'+(on?'連線中':'已離線')+'</small></div>'+
      (ed?'<div class="vwed"><input id="vw-name" maxlength="20" placeholder="例如：第二裁判" aria-label="名稱" value="'+esc(x.rn!=null?x.rn:(vn[it.u]||''))+'"><button class="primary" data-act="vwsave" data-v="'+esc(it.u)+'">儲存</button><button class="ghost" data-act="vwno">取消</button></div>':
      '<div class="vwb"><button data-act="vwren" data-v="'+esc(it.u)+'">改名稱</button><button data-act="vwrm" data-v="'+esc(it.u)+'">移除</button></div>')+'</div>'}).join(''):'<p class="muted">目前沒有觀看裝置。</p>';
  var bl=banned.length?'<h3 class="mhead">已移除（'+banned.length+'）</h3>'+banned.map(function(u){return '<div class="vwrow off"><div class="vwi"><b>'+esc(vLabel(u,(sy.vw||{})[u]))+'</b></div><div class="vwb"><button data-act="vwun" data-v="'+esc(u)+'">取消移除</button></div></div>'}).join(''):'';
  return head+'<p class="muted">名稱只存在本機；沒取名時顯示對方填的名稱或裝置種類。</p>'+rows+bl+
    '<h3 class="mhead">更換代碼</h3><p class="muted">要確實擋掉某台裝置時使用：所有觀看裝置都會中斷，再把新代碼給需要的人。</p><button data-act="vwnew">更換代碼</button>';
}
function vwAct(act,b){
  var x=ui.shareAsk||ui.sheet,u=b.getAttribute('data-v');if(!x||!share)return false;var code=share.code;
  switch(act){
    case 'vwopen': x.vw=true;x.ren=null;x.vrm=null;x.vnew=false; return true;
    case 'vwback': x.vw=false;x.ren=null; return true;
    case 'vwno': x.ren=null;x.vrm=null;x.vnew=false;x.rn=null; return true;
    case 'vwren': x.ren=u;x.rn=null;setTimeout(function(){var i=document.getElementById('vw-name');if(i)i.focus()},50); return true;
    case 'vwsave': var i=document.getElementById('vw-name'),nv=String(i?i.value:x.rn||'').trim().slice(0,20),m=vnames();
      if(nv)m[u]=nv;else delete m[u];try{localStorage.setItem(VNAME_KEY,JSON.stringify(m))}catch(e){}x.ren=null;x.rn=null; return true;
    case 'vwrm': x.vrm=u; return true;
    case 'vwrm2': var up={};up['b/'+x.vrm]=true;up['w/'+x.vrm]=null;if(fb)fb.update('m/'+code,up).catch(function(){});
      sy.vb=sy.vb||{};sy.vb[x.vrm]=true;x.vrm=null; return true;
    case 'vwun': var up2={};up2['b/'+u]=null;if(fb)fb.update('m/'+code,up2).catch(function(){});if(sy.vb)delete sy.vb[u]; return true;
    case 'vwnew': x.vnew=true; return true;
    case 'vwnew2': x.vnew=false;x.vw=false;syncRenew(shareMatch(),'已更換代碼，請把新代碼給需要觀看的人。'); return true;
  }
  return false;
}

/* ========== 11/14 連線顯示：記錄台把事件傳到雲端（Firebase Realtime Database），柱子上的手機輸入代碼，看同一場的球場畫面 ==========
   - 雲端只放 m/代碼：o 建立者、n 事件數、u 更新時間、on 記錄台在線、ev/第幾筆＝事件（JSON 字串，球員、職員、裁判姓名拿掉）
   - 事件只會往後加（復原也是加一筆 UNDO），所以只傳還沒傳的那幾筆；觀看端拿到後用同一個 reduce() 算出畫面
   - 規則在 tools/firebase-rules.json：只有開這場的那台能寫，知道代碼才能看
   - 沒網路時記錄照常存在這台；連上後自動補傳。觀看端寫最後更新時間，不會假裝是最新的 */
var FB_CFG={apiKey:'AIzaSyD8bEaESPE2Ecu4jpyEtGFiim5Vgl1ksf4',authDomain:'volleyball-scoresheet-71eb3.firebaseapp.com',databaseURL:'https://volleyball-scoresheet-71eb3-default-rtdb.asia-southeast1.firebasedatabase.app',projectId:'volleyball-scoresheet-71eb3',storageBucket:'volleyball-scoresheet-71eb3.firebasestorage.app',messagingSenderId:'806475506419',appId:'1:806475506419:web:fc57fabb0661a9bf4a0d86'};
var FB_URL='https://www.gstatic.com/firebasejs/10.12.2/';
var SYNC_KEY=KEY+'-sync';   // 這台開過連線的比賽：{比賽 id:{code,made}}，另外存，不進比賽資料（備份帶不走代碼）
var CODE_CH='23456789ABCDEFGHJKMNPQRSTUVWXYZ',CODE_LEN=6;
var SYNC_HIDE=REFS.map(function(x){return x[0]}).concat(['remarks']); // 不傳的比賽資料：裁判名字、記事
var syncMap={};try{syncMap=JSON.parse(localStorage.getItem(SYNC_KEY))||{}}catch(e){}
if(!Array.isArray(syncMap._del))syncMap._del=[];
var fb=null,fbP=null,fbErr='';
var sy={conn:null,busy:{},pushed:{},dropOn:{}};
var wt=null;   // 觀看中：{code,state,s,u,on,len,timer,ask}
function syncSaveMap(){try{localStorage.setItem(SYNC_KEY,JSON.stringify(syncMap))}catch(e){}}
function syncOf(m){return m&&syncMap[m.id]||null}
function newCode(){var a=new Uint32Array(CODE_LEN),t='';try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<CODE_LEN;i++)a[i]=Math.floor(Math.random()*1e9)}for(var j=0;j<CODE_LEN;j++)t+=CODE_CH[a[j]%CODE_CH.length];return t}
function codeNorm(v){return String(v||'').toUpperCase().replace(/[^0-9A-Z]/g,'').replace(/[O]/g,'0').replace(/[IL]/g,'1')}
function codeOk(c){return new RegExp('^['+CODE_CH+']{'+CODE_LEN+'}$').test(c)}
/* 載入 Firebase：用到時才從網路抓（gstatic），平常的記錄完全不需要它。自動測試會先放一個假的後端在 window.__VB_FB */
function fbLoad(){
  if(fbP)return fbP;
  fbErr='';
  var imp=function(u){return (new Function('u','return import(u)'))(u)};
  fbP=window.__VB_FB?Promise.resolve(window.__VB_FB):Promise.all(['app','auth','database'].map(function(n){return imp(FB_URL+'firebase-'+n+'.js')})).then(function(x){
    var A=x[0],U=x[1],D=x[2],app=A.initializeApp(FB_CFG),auth=U.getAuth(app),d=D.getDatabase(app),r=function(p){return D.ref(d,p)};
    return U.signInAnonymously(auth).then(function(cr){return {uid:cr.user.uid,
      set:function(p,v){return D.set(r(p),v)},update:function(p,v){return D.update(r(p),v)},remove:function(p){return D.remove(r(p))},
      get:function(p){return D.get(r(p)).then(function(sn){return sn.val()})},
      on:function(p,cb,bad){return D.onValue(r(p),function(sn){cb(sn.val())},bad)},
      onConn:function(cb){return D.onValue(r('.info/connected'),function(sn){cb(!!sn.val())})},
      onDrop:function(p,v){return D.onDisconnect(r(p)).update(v)},
      ts:function(){return D.serverTimestamp()}}});
  });
  fbP.then(function(b){fb=b;b.onConn(function(on){
      /* 剛連的頭一下 Firebase 會先報「沒連上」：等 4 秒還沒連上才算斷線 */
      if(!on&&sy.conn===null){setTimeout(function(){if(sy.conn===null){sy.conn=false;syncPaint()}},4000);return}
      sy.conn=on;if(on){sy.dropOn={};syncResume()}syncPaint()});syncPaint()},
    function(e){fbP=null;fbErr=navigator.onLine===false?'offline':'load';syncPaint()});
  return fbP;
}
/* 連線狀態變了：只有看得到狀態的畫面才重畫（觀看畫面、連線顯示視窗、「其他」；比賽上方的小標只在出現或消失時），記錄中不會每傳一次就重畫 */
function syncPaint(){var m=view==='setup'?current():null,bad=!!(m&&syncOf(m)&&syncState(m)[0]==='bad');
  if(view==='watch'||(ui.sheet&&(ui.sheet.type==='sync'||ui.sheet.type==='more'))||bad!==!!sy.bad){sy.bad=bad;render()}}
function syncClean(e){
  var x=JSON.parse(JSON.stringify(e)),d=x.data||{};
  if(e.type==='PLAYER_NAME_SET')d.name='';
  else if(e.type==='STAFF_SET')d.value='';
  else if(e.type==='INFO_SET'&&SYNC_HIDE.indexOf(d.field)>=0)d.value='';
  else if(e.type==='MATCH_CREATED'&&d.info)SYNC_HIDE.forEach(function(f){delete d.info[f]});
  else if(e.type==='TEAM_IMPORTED'&&d.snapshot){(d.snapshot.players||[]).forEach(function(p){if(p)p.name=''});var sf=d.snapshot.staff;if(sf)Object.keys(sf).forEach(function(f){sf[f]=''})}
  delete x.device;
  return JSON.stringify(x);
}
/* 開始連線：先建立 m/代碼（代碼被別台用掉就換一個），建好才開始傳事件 */
function syncStart(m,tries,note){
  var was=syncMap[m.id];tries=tries||0;
  var code=!tries&&was&&!was.made&&!note?was.code:newCode();
  syncMap[m.id]={code:code,made:false,note:note||(was&&was.note)||''};syncSaveMap();delete sy.pushed[m.id];
  fbLoad().then(function(){
    return fb.set('m/'+code,{o:fb.uid,n:0,u:fb.ts(),on:true}).then(function(){
      var me=syncMap[m.id];if(!me||me.code!==code)return;
      me.made=true;me.err='';syncSaveMap();sy.pushed[m.id]=0;syncDrop(code);syncPush(m);syncPaint();
    },function(){
      var me=syncMap[m.id];if(!me||me.code!==code)return;
      if(tries<3)syncStart(m,tries+1,me.note);else{me.err='建立連線失敗，請稍後再試';syncPaint()}
    });
  },function(){});
  syncPaint();
}
function syncDrop(code){if(fb&&sy.conn&&!sy.dropOn[code]){sy.dropOn[code]=1;fb.onDrop('m/'+code,{on:false}).catch(function(){})}}
/* 傳還沒傳的事件。一次最多 200 筆；雲端已有幾筆不知道時先問 */
function syncPush(m){
  var me=syncOf(m);if(!me||!me.made||!fb||!sy.conn||sy.busy[m.id])return;
  var from=sy.pushed[m.id],path='m/'+me.code;
  if(from==null){sy.busy[m.id]=1;fb.get(path+'/n').then(function(n){delete sy.busy[m.id];sy.pushed[m.id]=typeof n==='number'&&n<=m.events.length?n:0;syncPush(m)},function(e){delete sy.busy[m.id];syncFail(m,e)});return}
  var to=Math.min(m.events.length,from+200);
  var up={n:to,u:fb.ts(),on:true};for(var i=from;i<to;i++)up['ev/'+i]=syncClean(m.events[i]);
  sy.busy[m.id]=1;syncDrop(me.code);
  fb.update(path,up).then(function(){delete sy.busy[m.id];sy.pushed[m.id]=to;me.err='';me.at=Date.now();
    if(to<m.events.length)syncPush(m);else syncPaint()},function(e){delete sy.busy[m.id];syncFail(m,e)});
}
function syncFail(m,e){var me=syncOf(m);if(!me)return;
  /* 寫不進去：多半是這台的匿名身分換了（清過瀏覽器資料），舊代碼不再屬於這台。換新代碼重開 */
  if(e&&/permission/i.test(String(e.code||e.message||e))){syncStart(m,1,'代碼換新了（這台的連線身分變過），觀看的裝置要重新輸入');return}
  else{me.err='傳送失敗，稍後自動再試';clearTimeout(sy.retry);sy.retry=setTimeout(function(){syncPush(m)},5000)}
  syncPaint()}
function syncKick(m){if(syncOf(m)){if(!fb)fbLoad();else syncPush(m)}}
/* 連上網路（或重新開啟）：補傳每一場、刪掉該刪的；比賽結束超過一天的雲端紀錄自動刪掉 */
function syncResume(){
  if(view==='watch')return; // 觀看中不傳（同一台開兩個分頁、一個記一個看時，交給記錄的那個分頁）
  syncMap._del=syncMap._del.filter(function(code){fb.remove('m/'+code).then(function(){syncMap._del=syncMap._del.filter(function(x){return x!==code});syncSaveMap()},function(){});return true});
  Object.keys(syncMap).forEach(function(id){if(id==='_del')return;var me=syncMap[id],m=db.matches.filter(function(x){return x.id===id})[0],q=m&&safeReduce(m),last=m&&m.events.length?new Date(m.events[m.events.length-1].at).getTime():0;
    if(!m||(q&&matchOver(q)&&Date.now()-last>864e5)){syncStop(id);return}
    if(!me.made){syncStart(m);return}
    syncPush(m)});
}
function syncStop(id){var me=syncMap[id];delete syncMap[id];delete sy.pushed[id];if(me&&me.made){syncMap._del.push(me.code);if(fb)fb.remove('m/'+me.code).then(function(){syncMap._del=syncMap._del.filter(function(x){return x!==me.code});syncSaveMap()},function(){})}syncSaveMap()}
function syncUrl(code){var base=/^https?:$/.test(location.protocol)?location.origin+location.pathname:'https://kenchen0728.github.io/volleyball-scoresheet/';return base+'?watch='+code}
function syncState(m){var me=syncOf(m);if(!me)return ['off',''];
  if(fbErr&&!fb)return ['bad',fbErr==='offline'?'沒有網路，連上後自動開始。紀錄照常存在這台':'連線元件載入失敗，確認網路後重新整理'];
  if(me.err)return ['bad',me.err];
  if(!fb||sy.conn===null||!me.made&&sy.conn!==false)return ['wait','連線中…'];
  if(!sy.conn)return ['bad','沒有網路：紀錄照常存在這台，連上後自動補傳'];
  var p=sy.pushed[m.id];if(p==null||p<m.events.length)return ['wait','傳送中…'];
  return ['ok','已連線，觀看的裝置是最新的'];
}
function syncSheetHtml(s,m,x){
  var me=syncOf(m),st=syncState(m),h='<div class="shd"><h2>連線顯示</h2><button data-act="close">關閉</button></div>';
  if(!me)return h+'<p class="subhint">讓柱子上的手機或其他裝置看到這場的比分、發球和站位，只能看、不能改。</p><p class="muted">需要網路。球員、職員、裁判的名字不會傳出去。</p><button class="primary" data-act="syncstart">開始連線</button>';
  if(x.stop)return '<h2>停止連線？</h2><p class="muted">觀看的裝置會看不到這場，雲端的這份會刪掉。這台的紀錄不受影響，之後可以再開（代碼會換新的）。</p><button class="primary" data-act="syncstop2">停止連線</button><button class="ghost" data-act="syncstay">取消</button>';
  return h+'<div class="synccode"><small>代碼</small><b>'+me.code.split('').join('<i></i>')+'</b></div>'+
    '<div class="syncqr">'+qrSvg(syncUrl(me.code))+'</div>'+
    '<p class="subhint">另一台用相機掃 QR code；或打開這個網址，在主畫面按「觀看比賽」輸入代碼。</p>'+
    '<p class="syncst '+st[0]+'" role="status">'+esc(st[1])+'</p>'+(me.note?'<p class="note">'+esc(me.note)+'</p>':'')+
    '<button data-act="syncstop">停止連線</button>';
}
/* 比賽上方的小標：開著連線時讓記錄員知道有沒有傳出去 */
function syncTag(m){var me=syncOf(m);if(!me)return '';var st=syncState(m);return '<button class="synctag '+st[0]+'" data-act="syncopen" aria-label="連線顯示：'+esc(st[1])+'">'+(st[0]==='ok'?'連線中':st[0]==='wait'?'傳送中':'未連線')+'</button>'}

/* ---------- 觀看端 ---------- */
function watchStart(code){
  if(wt&&wt.off)try{wt.off()}catch(e){}
  view='watch';db.currentId=null;resetUi();wt={code:code,state:'load'};
  try{sessionStorage.setItem(KEY+'-watch',code)}catch(e){}
  fbLoad().then(function(){if(!wt||wt.code!==code)return;
    wt.off=fb.on('m/'+code,function(v){watchData(code,v)},function(){if(wt&&wt.code===code){wt.state='deny';render()}})},
    function(){if(wt&&wt.code===code){wt.state=navigator.onLine===false?'offline':'loadfail';render()}});
}
function watchData(code,v){
  if(!wt||wt.code!==code)return;
  if(!v||typeof v!=='object'){wt.state=wt.s?'gone':'none';wt.s=null;render();return}
  var n=Number(v.n)||0,ev=v.ev||{},list=[];
  for(var i=0;i<n;i++){var raw=ev[i];if(typeof raw!=='string')break;try{list.push(JSON.parse(raw))}catch(e){break}}
  wt.u=Number(v.u)||0;wt.on=v.on!==false;
  if(!list.length){wt.state='empty';wt.s=null;render();return}
  var mm={id:'watch',events:list};
  if(!validMatch(mm)){wt.state='bad';render();return}
  var s=reduce(list),old=wt.s;
  /* 暫停倒數：看著的時候對方按了暫停，從收到那一刻開始倒數 30 秒；復原了就收掉 */
  if(old&&old.setNo===s.setNo){var c0=old.sets[s.setNo],c1=s.sets[s.setNo];
    if(c1.rally!==c0.rally||c1.live)wt.timer=null; // 下一球開始或有人得分：暫停結束
    ['t1','t2'].forEach(function(k){if(c1.timeouts[k].length>c0.timeouts[k].length)wt.timer={team:k,end:Date.now()+30000};else if(c1.timeouts[k].length<c0.timeouts[k].length&&wt.timer&&wt.timer.team===k)wt.timer=null})}
  else wt.timer=null;
  wt.s=s;wt.len=list.length;wt.state='ok';render();
}
function watchLeave(){if(wt&&wt.off)try{wt.off()}catch(e){}wt=null;try{sessionStorage.removeItem(KEY+'-watch')}catch(e){}view='home';resetUi()}
function watchStatus(){
  if(!wt||wt.state==='load'||sy.conn===null&&!wt.u)return ['wait','連線中…'];
  var t=wt.u?'最後更新 '+new Date(wt.u).toTimeString().slice(0,8):'';
  if(sy.conn===false)return ['bad','這台沒有網路，畫面停在'+(t?t.slice(4):'剛才')];
  if(wt.state==='ok'&&!wt.on)return ['bad','記錄台離線，'+t];
  if(wt.state==='ok')return ['ok','同步中 '+(t?t.slice(5):'')];
  return ['bad',''];
}
function watchMsg(){
  var st=wt?wt.state:'load',c=esc(wt?wt.code:'');
  var m={load:['連線中…','第一次要幾秒鐘。'],none:['找不到代碼 '+c+' 的比賽','請確認代碼，或請記錄台在「其他」→「連線顯示」開啟連線。'],gone:['記錄台停止連線了','這場的雲端紀錄已經刪掉。'],empty:['這場還沒有資料','記錄台開始記錄後就會出現。'],
    bad:['這場的資料讀不懂','請記錄台更新到最新版。'],deny:['沒有權限看這場','請重新輸入代碼。'],offline:['這台沒有網路','連上網路後重新整理。'],loadfail:['連線元件載入失敗','確認網路後重新整理。']}[st]||['連線中…',''];
  return '<div class="wmsg"><h2>'+m[0]+'</h2><p class="muted">'+m[1]+'</p>'+(st!=='load'?'<button data-act="wretry">重新輸入代碼</button>':'')+'</div>';
}
function watchBoard(s){
  var n=s.setNo,c=s.sets[n],over=matchOver(s),win=!over&&setWinner(s);
  if(!s.sets[1].started||!c.started){var T=matchTitle(s),sw=setsWon(s);
    return '<div class="wmsg"><h2>'+esc(T[0])+' 對 '+esc(T[1])+'</h2>'+(n>1?'<p class="wsets">局數 '+sw[T[2]]+' : '+sw[T[3]]+'</p>':'')+'<p class="muted">等第 '+n+' 局開始</p></div>'}
  var L=c.left,R=other(L),cells='';
  for(var i=0;i<3;i++){cells+=playCell(s,L,LEFT_CELLS[i][0])+playCell(s,L,LEFT_CELLS[i][1]);if(i===0)cells+='<div class="net" aria-hidden="true"></div>';cells+=playCell(s,R,RIGHT_CELLS[i][0])+playCell(s,R,RIGHT_CELLS[i][1])}
  var srv=courtPlayer(c,c.serving,0);
  var srvm=c.serving?'<div class="srvmark '+(c.serving===L?'lf':'rt')+' '+c.serving+'" aria-label="'+esc(tName(s,c.serving))+' 發球 '+srv+' 號"><i>'+(c.serving===L?'◀':'')+'</i><span>'+BALL+'</span><b>'+srv+'</b><i>'+(c.serving===L?'':'▶')+'</i></div>':'';
  var cnt=function(k){var ex=c.subs[k].length-c.subCount[k];return '<div class="wcnt '+k+'"><span>暫停 <b>'+c.timeouts[k].length+'</b></span><span>替補 <b>'+c.subCount[k]+'</b></span>'+(ex?'<small>例外替補 '+ex+'</small>':'')+'</div>'};
  var tm=wt&&wt.timer&&Date.now()<wt.timer.end?'<div class="tbar '+wt.timer.team+'"><span>'+esc(tName(s,wt.timer.team))+' 暫停</span><b data-wtm>'+Math.ceil((wt.timer.end-Date.now())/1000)+'</b></div>':'';
  var ban=over?'<p class="wban">比賽結束 '+setsWon(s)[L]+' : '+setsWon(s)[R]+'</p>':win?'<p class="wban">第 '+n+' 局結束 '+c.score[L]+' : '+c.score[R]+'</p>':'';
  return '<div class="wview" inert><div class="board">'+wideBar(s,L)+wideBar(s,R)+sideScore(s,L)+setBox(s,L)+'<div class="mid">第 '+n+' 局'+srvm+'</div>'+setBox(s,R)+sideScore(s,R)+'</div>'+ban+tm+
    '<div class="pcourt" role="group" aria-label="球場，記錄台在下方">'+cells+'</div><div class="strips">'+libStrip(s,L)+libStrip(s,R,true)+'</div><div class="wcounts">'+cnt(L)+cnt(R)+'</div></div>';
}
function watchHtml(){
  var st=watchStatus(),s=wt&&wt.state==='ok'?wt.s:null;
  var head='<header class="wtbar"><button class="wleave" data-act="wleave">‹ 離開</button><span class="wcode">代碼 '+esc(wt?wt.code:'')+'</span><span class="wst '+st[0]+'" role="status">'+esc(st[1])+'</span></header>';
  var ask=wt&&wt.ask?'<div class="scrim" data-act="wstay"></div><div class="sheet" role="dialog" aria-modal="true"><h2>停止觀看？</h2><p class="muted">要再看時，在主畫面按「觀看比賽」輸入代碼 '+esc(wt.code)+'。</p><button class="primary" data-act="wleave2">停止觀看</button><button class="ghost" data-act="wstay">繼續看</button></div>':'';
  return '<div class="watch"><div class="wshell">'+head+'<main class="page wpage">'+(s?watchBoard(s):watchMsg())+'</main></div></div>'+ask;
}
function watchAskHtml(){
  if(!ui.watchAsk)return '';var x=ui.watchAsk;
  return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="shd"><h2>觀看比賽</h2><button data-act="close">關閉</button></div>'+
    '<p class="subhint">輸入記錄台「其他」→「連線顯示」上的 6 碼代碼。只能看、不能改。</p>'+
    '<input id="watch-code" class="wcodein" type="text" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="代碼" value="'+esc(x.v||'')+'">'+
    (x.err?'<p class="warning" role="alert">'+esc(x.err)+'</p>':'')+'<button class="primary" data-act="watchgo">觀看</button><p class="muted">需要網路。比賽中這台的螢幕會保持常亮。</p></div>';
}
/* 觀看畫面和連線相關的按鈕；回傳 true 表示處理過了 */
function syncAct(act,b){
  var m=current();
  switch(act){
    case 'watchopen': ui.watchAsk={v:''}; setTimeout(function(){var wi=document.getElementById('watch-code');if(wi)wi.focus()},60); return true;
    case 'watchgo': var wi=document.getElementById('watch-code'),wc=codeNorm(wi?wi.value:'');
      if(!codeOk(wc)){ui.watchAsk={v:wi?wi.value:'',err:'代碼是 '+CODE_LEN+' 個英文字母或數字'};return true}
      ui.watchAsk=null;watchStart(wc); return true;
    case 'wleave': if(wt)wt.ask=true; return true;
    case 'wstay': if(wt)wt.ask=false; return true;
    case 'wleave2': watchLeave(); return true;
    case 'wretry': var oc=wt?wt.code:'';watchLeave();ui.watchAsk={v:oc}; return true;
    case 'syncopen': ui.sheet={type:'sync',back:ui.sheet&&ui.sheet.type==='more'?ui.sheet:null}; if(syncOf(m))fbLoad(); return true;
    case 'syncstart': if(m)syncStart(m); return true;
    case 'syncstop': if(ui.sheet)ui.sheet.stop=true; return true;
    case 'syncstay': if(ui.sheet)ui.sheet.stop=false; return true;
    case 'syncstop2': if(m)syncStop(m.id); if(ui.sheet)ui.sheet.stop=false; return true;
  }
  return false;
}
/* 觀看端的暫停倒數，每秒更新數字；時間到就收掉 */
setInterval(function(){if(view!=='watch'||!wt||!wt.timer)return;var left=Math.ceil((wt.timer.end-Date.now())/1000);if(left<=0){wt.timer=null;render();return}var el=document.querySelector('[data-wtm]');if(el)el.textContent=left},250);
/* 網路回來了：之前載入失敗的話再載一次（記錄台補傳、觀看端重新連） */
addEventListener('online',function(){if(fb)return;var any=Object.keys(syncMap).some(function(k){return k!=='_del'})||syncMap._del.length;
  if(view==='watch'&&wt)watchStart(wt.code);else if(any)fbLoad()});

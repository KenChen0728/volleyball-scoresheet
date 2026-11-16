/* ========== 11/14 分享比賽／觀看比賽：記錄台把事件傳到雲端（Firebase Realtime Database），柱子上的手機輸入代碼，看同一場的球場畫面 ==========
   - 代碼跟著這台裝置（11/14 使用者：手機綁在柱子上不方便每場重掃）：主畫面先開「分享比賽」，之後這台記哪一場，觀看的裝置就自動看哪一場
   - 雲端只放 m/代碼：o 建立者、n 事件數、u 更新時間、on 記錄台在線、ev/第幾筆＝現在這一場的事件（JSON 字串，球員、職員、裁判姓名拿掉）
   - 事件只會往後加（復原也是加一筆 UNDO），所以只傳還沒傳的那幾筆；換一場時整份換掉（一次寫入，觀看端不會閃空白）
   - 觀看端拿到後用同一個 reduce() 算出畫面；第一筆事件的 matchId 不一樣就是換場了
   - t＝計時器（暫停 30 秒、傷停 3 分鐘）：記錄台的計時是畫面上的狀態、不是比賽事件，所以另外傳。開始、提早結束、發球收掉都同步；
     存剩下幾毫秒，配同一次寫入的伺服器時間 u，觀看端用 Firebase 的時間差換成自己的時鐘（兩台手機的時間不一樣也不會差）
   - 規則在 tools/firebase-rules.json：只有開這個代碼的那台能寫，知道代碼才能看
   - 沒網路時記錄照常存在這台；連上後自動補傳。觀看端寫最後更新時間，不會假裝是最新的
   - 11/15 接手記錄：記錄台離線時，觀看的裝置可以按「接手記錄」，把 o 改成自己，接著記（只有號碼）。代碼不變，其他觀看的照常看。
     原本的記錄台連上時發現 o 不是自己，就問要不要接回來：把接手那台記的合進這台（名字照這台的），再整份寫回雲端；接手那台看到 o 變了就自動改回觀看。
     兩台在斷線這段都記了、內容又不一樣時，問記錄員要用哪一份
   - 11/16 代碼每天換一次（使用者和試用的朋友討論後決定）：知道代碼就能看、也能在記錄台離線時接手，永遠不變的話外流一次就一直有效。
     每天第一次分享（開 App 連上、或換到新的一場時）發現代碼不是今天開的，就刪掉舊的、開新代碼；比賽進行中（最後一筆在 3 小時內、還沒結束）先不換，等換下一場。
     觀看端記住今天看過的代碼（-watched），「觀看比賽」裡點一下就能看；觀看畫面上方寫場地（比賽資料的「場地」，本來就會傳） */
var FB_CFG={apiKey:'AIzaSyD8bEaESPE2Ecu4jpyEtGFiim5Vgl1ksf4',authDomain:'volleyball-scoresheet-71eb3.firebaseapp.com',databaseURL:'https://volleyball-scoresheet-71eb3-default-rtdb.asia-southeast1.firebasedatabase.app',projectId:'volleyball-scoresheet-71eb3',storageBucket:'volleyball-scoresheet-71eb3.firebasestorage.app',messagingSenderId:'806475506419',appId:'1:806475506419:web:fc57fabb0661a9bf4a0d86'};
var FB_URL='https://www.gstatic.com/firebasejs/10.12.2/';
var SYNC_KEY=KEY+'-sync';   // 等著刪的舊代碼 {_del:[...]}（11/14 第一版每場一個代碼，留下來的在這裡清掉）
var SHARE_KEY=KEY+'-share'; // 這台的分享：{code,made,mid（現在分享哪一場）,note,err}，另外存，不進比賽資料（備份帶不走代碼）
var CODE_CH='23456789ABCDEFGHJKMNPQRSTUVWXYZ',CODE_LEN=6;
var SYNC_HIDE=REFS.map(function(x){return x[0]}).concat(['remarks']); // 不傳的比賽資料：裁判名字、記事
var syncMap={};try{syncMap=JSON.parse(localStorage.getItem(SYNC_KEY))||{}}catch(e){}
if(!Array.isArray(syncMap._del))syncMap._del=[];
Object.keys(syncMap).forEach(function(k){if(k!=='_del'){if(syncMap[k]&&syncMap[k].made)syncMap._del.push(syncMap[k].code);delete syncMap[k]}});
var share=null;try{share=JSON.parse(localStorage.getItem(SHARE_KEY))}catch(e){}
if(!share||typeof share.code!=='string')share=null;
var fb=null,fbP=null,fbErr='';
var sy={conn:null,busy:false,pushed:null,dropOn:{},off:0,tKey:null,oOff:null,oCode:null};
var wt=null;   // 觀看中：{code,state,s,u,on,len,timer,ask}
var WATCHED_KEY=KEY+'-watched'; // 觀看端：今天看過的代碼 [{c,d（哪一天）,t（隊名）,ct（場地）,at}]，最多 6 個
function syncDay(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function watchedList(){var a=[];try{a=JSON.parse(localStorage.getItem(WATCHED_KEY))||[]}catch(e){}var d=syncDay();return Array.isArray(a)?a.filter(function(x){return x&&x.d===d&&codeOk(x.c)}):[]}
function watchedSet(code,t,ct){var a=watchedList(),e=a.filter(function(x){return x.c===code})[0];if(!e||(e.t===t&&e.ct===ct))return;e.t=t;e.ct=ct;try{localStorage.setItem(WATCHED_KEY,JSON.stringify(a))}catch(err){}}
function watchedRemove(code){var a=watchedList().filter(function(x){return x.c!==code});try{localStorage.setItem(WATCHED_KEY,JSON.stringify(a))}catch(err){}}
function watchedSave(code,t,ct){var a=watchedList(),old=a.filter(function(x){return x.c===code})[0];
  if(old&&(t==null||old.t===t)&&(ct==null||old.ct===ct)&&a[0]===old)return;
  var e={c:code,d:syncDay(),t:t!=null?t:old?old.t:'',ct:ct!=null?ct:old?old.ct:'',at:Date.now()};
  a=[e].concat(a.filter(function(x){return x.c!==code})).slice(0,6);try{localStorage.setItem(WATCHED_KEY,JSON.stringify(a))}catch(err){}}
function syncSaveMap(){try{localStorage.setItem(SYNC_KEY,JSON.stringify(syncMap))}catch(e){}}
function shareSave(){try{if(share)localStorage.setItem(SHARE_KEY,JSON.stringify(share));else localStorage.removeItem(SHARE_KEY)}catch(e){}}
function syncOf(){return share}
function shareMatch(){return share&&share.mid?db.matches.filter(function(x){return x.id===share.mid})[0]||null:null}
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
      onDrop:function(p,v){return D.onDisconnect(r(p)).update(v)},offDrop:function(p){return D.onDisconnect(r(p)).cancel()},
      onOffset:function(cb){return D.onValue(r('.info/serverTimeOffset'),function(sn){cb(Number(sn.val())||0)})},
      ts:function(){return D.serverTimestamp()}}});
  });
  fbP.then(function(b){fb=b;if(b.onOffset)b.onOffset(function(o){sy.off=o});b.onConn(function(on){
      /* 剛連的頭一下 Firebase 會先報「沒連上」：等 4 秒還沒連上才算斷線 */
      if(!on&&sy.conn===null){setTimeout(function(){if(sy.conn===null){sy.conn=false;syncPaint()}},4000);return}
      sy.conn=on;if(on){sy.dropOn={};sy.tKey=null;sy.tBad=false;sy.sKey=null;sy.sBad=false;syncResume();wlResume()}syncPaint()});syncPaint()},
    function(e){fbP=null;fbErr=navigator.onLine===false?'offline':'load';syncPaint()});
  return fbP;
}
/* 連線狀態變了：只有看得到狀態的畫面才重畫（觀看畫面、分享視窗、「其他」、主畫面；比賽上方的小標只在出現或消失時），記錄中不會每傳一次就重畫 */
function syncPaint(){var bad=!!(share&&view==='setup'&&syncState()[0]==='bad');
  if(view==='watch'||view==='home'||(ui.sheet&&(ui.sheet.type==='sync'||ui.sheet.type==='more'))||bad!==!!sy.bad){sy.bad=bad;render()}}
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
/* 開始分享：先建立 m/代碼（代碼被別台用掉就換一個）。在比賽中開的，就從這一場開始分享 */
function syncStart(m,tries,note){
  var was=share;tries=tries||0;
  var code=!tries&&was&&!was.made&&!note?was.code:newCode();
  share={code:code,made:false,mid:m?m.id:(was&&!was.made&&was.mid)||null,note:note||(was&&was.note)||''};shareSave();sy.pushed=null;
  fbLoad().then(function(){
    return fb.get('m/'+code+'/o').then(function(o){if(o&&o!==fb.uid)throw new Error('taken')}).then(function(){return fb.update('m/'+code,{o:fb.uid,n:0,u:fb.ts(),on:true})}).then(function(){
      if(!share||share.code!==code)return;
      share.made=true;share.err='';share.day=syncDay();var sm=shareMatch();share.mid=null;shareSave();syncDrop(code);sy.sKey=null;syncOwner();if(sm)syncPush(sm);syncPaint();
    },function(){
      if(!share||share.code!==code)return;
      if(tries<3)syncStart(shareMatch(),tries+1,share.note);else{share.err='建立連線失敗，請稍後再試';syncPaint()}
    });
  },function(){});
  syncPaint();
}
function syncDrop(code){if(fb&&sy.conn&&!sy.dropOn[code]){sy.dropOn[code]=1;fb.onDrop('m/'+code,{on:false}).catch(function(){})}}
function syncDropOff(code){if(sy.dropOn[code]){delete sy.dropOn[code];if(fb&&fb.offDrop)fb.offDrop('m/'+code).catch(function(){})}}
function takeOn(m){return !!(share&&share.take&&m&&share.mid===m.id)}
/* 分享中的那場還在打（沒結束、最後一筆在 3 小時內）：跨過午夜也先不換代碼，免得柱子上的手機斷掉 */
function syncLive(){var sm=shareMatch();if(!sm||!share||share.mid!==sm.id||!sm.events.length)return false;var q=safeReduce(sm);if(!q||matchOver(q))return false;
  var t=Date.parse(sm.events[sm.events.length-1].at)||0;return Date.now()-t<3*3600*1000}
function syncRenewDue(switching){return !!(share&&share.made&&!share.take&&!share.lost&&share.day!==syncDay()&&(switching||!syncLive()))}
/* 換今天的新代碼：舊的雲端那份刪掉（刪不掉的記著，下次連上再刪） */
function syncRenew(m,note){var old=share.code;syncOwnerOff();syncDropOff(old);
  if(old){syncMap._del.push(old);syncSaveMap();if(fb)fb.remove('m/'+old).then(function(){syncMap._del=syncMap._del.filter(function(x){return x!==old});syncSaveMap()},function(){})}
  share.made=false;syncStart(m||null,0,note||'今日已更換新代碼，之前掃描的觀看裝置請重新掃描或輸入。')}
/* 盯著雲端這個代碼的 o（誰在記）和 on（記錄台在線）：o 變成別台＝被接手（或接手後被接回去）；自己在記卻被標成離線就改回來 */
function syncOwner(){
  if(!fb||!share||!share.made){syncOwnerOff();return}
  if(sy.oCode===share.code)return;
  syncOwnerOff();var code=share.code;sy.oCode=code;
  var a=fb.on('m/'+code+'/o',function(o){if(share&&share.code===code&&o&&o!==fb.uid)syncLost()},function(){}),
    b=fb.on('m/'+code+'/on',function(on){if(share&&share.code===code&&!share.lost&&sy.conn&&on===false)fb.update('m/'+code,{on:true}).catch(function(){})},function(){}),
    c=fb.on('m/'+code+'/w',function(v){if(share&&share.code===code){sy.vw=v&&typeof v==='object'?v:{};vwPaint()}},function(){}),
    d=fb.on('m/'+code+'/b',function(v){if(share&&share.code===code){sy.vb=v&&typeof v==='object'?v:{};vwPaint()}},function(){});
  sy.vw={};sy.vb={};
  sy.oOff=function(){[a,b,c,d].forEach(function(f){try{f()}catch(e){}})};
}
function syncOwnerOff(){if(sy.oOff)sy.oOff();sy.oOff=null;sy.oCode=null}
/* 11/16 被接手的那一場：只能收回記錄、觀看接手內容或回主畫面，不能自己再記（不然兩台都在記、各記各的） */
function syncLocked(){var m=view==='setup'&&current();return !!(share&&share.lost&&m&&m.id===share.mid)}
function syncLockCheck(){if(!syncLocked())return;if(!ui.sheet||ui.sheet.type!=='sync')ui.sheet={type:'sync',lock:true};else ui.sheet.lock=true}
/* 雲端的計時器（暫停、傷停）→ 這台的 ui.timer：接手、收回時接著倒數，不要歸零 */
function cloudTimer(v){var tj=null;try{tj=v&&v.t?JSON.parse(v.t):null}catch(e){}
  if(!tj||(tj.k!=='t1'&&tj.k!=='t2')||typeof tj.ms!=='number')return null;var end=(Number(v.u)||0)+tj.ms-sy.off;if(end<=Date.now())return null;
  return tj.label?{team:tj.k,end:end,shown:true,closed:true,label:String(tj.label).slice(0,20)}:{team:tj.k,end:end,shown:end-Date.now()<=5000,closed:false}}
/* 雲端這場現在不是這台在記 */
function syncLost(){
  if(!share||share.lost)return;
  var code=share.code;syncDropOff(code);clearTimeout(sy.retry);
  if(share.take){ // 這台是接手的：原本的記錄台接回去了，改回觀看
    var tm=shareMatch(),left=tm&&sy.pushed!=null?tm.events.length-sy.pushed:0;
    syncOwnerOff();share=null;shareSave();sy.pushed=null;watchStart(code);
    if(wt){wt.note=left>0?'原記錄台已收回記錄。本機有 '+left+' 筆尚未上傳，保留在本機紀錄中':'原記錄台已收回記錄，本機改為觀看';wt.noteUntil=Date.now()+(left>0?15000:8000)}
    render();return}
  share.lost=true;share.err='';shareSave();sy.pushed=null;
  if(syncLocked()){ui.sheet=null;syncLockCheck()}else if(view==='home'&&!ui.shareAsk&&!ui.watchAsk&&!ui.sheet)ui.shareAsk={};
  render();
}
/* 傳 m 這一場還沒傳的事件，一次最多 200 筆。雲端放的是別場（或還沒放）時整份換成這一場；雲端已有幾筆不知道時先問 */
function syncPush(m){
  if(!m||!share||!share.made||share.lost||share.take&&m.id!==share.mid||!fb||!sy.conn||sy.busy)return;
  var path='m/'+share.code,up,i,to;
  if(share.mid!==m.id){
    if(syncRenewDue(true)){syncRenew(m);return}
    to=Math.min(m.events.length,200);var ev={};for(i=0;i<to;i++)ev[i]=syncClean(m.events[i]);
    sy.busy=true;
    sy.tKey=null;
    fb.get(path+'/o').then(function(o){
      if(o&&o!==fb.uid){sy.busy=false;syncLost();return}
      syncDrop(share.code);
      return fb.update(path,{o:fb.uid,n:to,u:fb.ts(),on:true,ev:ev,t:null}).then(function(){sy.busy=false;if(!share)return;share.mid=m.id;share.err='';shareSave();sy.pushed=to;sy.sKey=null;
        if(to<m.events.length)syncPush(m);else{syncSum(m);syncPaint()}});
    }).then(null,function(e){sy.busy=false;syncFail(m,e)});
    return}
  if(sy.pushed==null){sy.busy=true;fb.get(path+'/n').then(function(n){sy.busy=false;sy.pushed=typeof n==='number'&&n<=m.events.length?n:0;syncPush(m)},function(e){sy.busy=false;syncFail(m,e)});return}
  to=Math.min(m.events.length,sy.pushed+200);if(to<=sy.pushed&&share.mid===m.id){syncSum(m);return}
  up={n:to,u:fb.ts(),on:true};for(i=sy.pushed;i<to;i++)up['ev/'+i]=syncClean(m.events[i]);
  sy.busy=true;syncDrop(share.code);
  fb.update(path,up).then(function(){sy.busy=false;sy.pushed=to;if(share)share.err='';
    if(to<m.events.length)syncPush(m);else{syncSum(m);syncPaint()}},function(e){sy.busy=false;syncFail(m,e)});
}
function syncFail(m,e){if(!share)return;
  /* 寫不進去：雲端這個代碼現在是別台在記（被接手，或這台的匿名身分換了）→ 問要不要接回來；雲端的不見了 → 換新代碼重開 */
  var again=function(){if(!share)return;share.err='傳送失敗，稍後自動重試';clearTimeout(sy.retry);sy.retry=setTimeout(function(){syncPush(m)},5000);syncPaint()};
  if(e&&/permission/i.test(String(e.code||e.message||e))&&fb){var code=share.code;
    fb.get('m/'+code+'/o').then(function(o){if(!share||share.code!==code)return;
      if(o&&o!==fb.uid)syncLost();else if(!o&&!share.take)syncStart(m,1,'雲端分享資料已不存在，已改用新代碼，觀看裝置需重新輸入');else again()},again);return}
  again()}
function syncKick(m){if(share){if(!fb)fbLoad();else syncPush(m)}}
/* 計時器跟著比賽傳：記錄台畫面重畫後比對一次，有變（開始、提早結束、發球收掉）才寫，一次只寫 t 和 u */
function timerJson(){var t=ui.timer;return t?JSON.stringify({k:t.team,ms:Math.max(0,Math.round(t.end-Date.now())),label:t.label||''}):''}
function syncTimer(){
  if(!share||!share.made||share.lost||!fb||!sy.conn||sy.tBad||view!=='setup')return;var m=current();if(!m||m.id!==share.mid)return;
  var t=ui.timer,key=t?t.team+'|'+t.end+'|'+(t.label||''):'';if(key===sy.tKey)return;
  /* 寫不進去（多半是 Firebase 規則還是舊版，沒有 t）：這次連線先不再試，比分照常傳 */
  sy.tKey=key;fb.update('m/'+share.code,{t:timerJson(),u:fb.ts(),on:true}).catch(function(){sy.tKey=null;sy.tBad=true});
}
/* 連上網路（或重新開啟）：刪掉該刪的舊代碼、補傳現在分享的那一場 */
function syncResume(){
  if(view==='watch')return; // 觀看中不傳（同一台開兩個分頁、一個記一個看時，交給記錄的那個分頁）
  syncMap._del=syncMap._del.filter(function(code){fb.remove('m/'+code).then(function(){syncMap._del=syncMap._del.filter(function(x){return x!==code});syncSaveMap()},function(){});return true});
  if(!share)return;
  if(!share.made){syncStart(shareMatch());return}
  if(syncRenewDue()){syncRenew(shareMatch());return}
  syncOwner();if(share.lost)return;
  /* 重新連上：先告訴觀看端記錄台在線，並登記斷線時自動改成離線（不然沒有新分數時，觀看端看不出記錄台斷了） */
  syncDrop(share.code);fb.update('m/'+share.code,{on:true}).catch(function(){});
  var sm=shareMatch();if(sm)syncPush(sm);
}
function syncStop(){var me=share;syncOwnerOff();if(me)syncDropOff(me.code);share=null;sy.pushed=null;shareSave();if(me&&me.made&&!me.lost&&!me.take){syncMap._del.push(me.code);syncSaveMap();if(fb)fb.remove('m/'+me.code).then(function(){syncMap._del=syncMap._del.filter(function(x){return x!==me.code});syncSaveMap()},function(){})}}
function syncUrl(code){var base=/^https?:$/.test(location.protocol)?location.origin+location.pathname:'https://kenchen0728.github.io/volleyball-scoresheet/';return base+'?watch='+code}
function syncState(){if(!share)return ['off',''];
  if(share.lost)return ['bad','其他裝置接手記錄中'];
  if(fbErr&&!fb)return ['bad',fbErr==='offline'?'目前沒有網路，連線後自動開始；紀錄照常儲存於本機':'連線元件載入失敗，請確認網路後重新整理'];
  if(share.err)return ['bad',share.err];
  if(!fb||sy.conn===null||!share.made&&sy.conn!==false)return ['wait','連線中…'];
  if(!sy.conn)return ['bad','連線中斷：紀錄照常儲存於本機，恢復後自動補傳'];
  var sm=shareMatch();if(!sm)return ['ok','已連線。開始記錄後，觀看裝置會自動顯示該場比賽'];
  if(sy.pushed==null||sy.pushed<sm.events.length)return ['wait','傳送中…'];
  return ['ok',share.take?'接手記錄中・已同步':'已同步，觀看裝置為最新狀態'];
}
function shareSmall(){return share.take?'接手記錄中・代碼 '+share.code:share.lost?'其他裝置接手中・代碼 '+share.code:'分享中・代碼 '+share.code}
function shareTitle(){var sm=shareMatch(),q=sm&&safeReduce(sm);if(!q)return '';var T=matchTitle(q),ct=courtLabel(q.info&&q.info.court);return (ct?ct+'　':'')+T[0]+' 對 '+T[1]}
function syncSheetHtml(x,inMatch){
  var st=syncState(),h='<div class="shd"><h2>分享比賽</h2><button data-act="close">關閉</button></div>',tt=share?shareTitle():'';
  if(!share)return h+'<p class="subhint">本機記錄，其他裝置輸入代碼即可觀看比分、發球與站位（僅供觀看，無法修改）。</p><p class="muted">代碼每天更換一次，當天固定不變；本機記錄哪一場，觀看裝置就自動顯示哪一場。需要網路；球員、職員與裁判姓名不會上傳。</p><button class="primary" data-act="syncstart">開始分享</button>';
  if(share.take){
    if(x.stop)return '<h2>結束接手？</h2><p class="muted">本機將停止記錄，已記錄的內容皆已上傳。原記錄台尚未恢復時，觀看裝置可再次接手記錄。</p><button class="primary" data-act="takeend">結束接手</button><button class="ghost" data-act="syncstay">取消</button>';
    return '<div class="shd"><h2>接手記錄</h2><button data-act="close">關閉</button></div><div class="synccode"><small>代碼</small><b>'+share.code.split('').join('<i></i>')+'</b></div>'+
      '<p class="syncst '+st[0]+'" role="status">'+esc(st[1])+'</p>'+(tt?'<p class="muted syncnow">記錄中：'+esc(tt)+'</p>':'')+
      '<p class="subhint">本機僅有背號，可記錄得分、發球、暫停、替補、自由球員與場上隊長；判罰與修正請待原記錄台收回後補登。</p><p class="muted">原記錄台恢復連線時可收回記錄，收回後本機自動改為觀看。</p>'+
      '<button data-act="syncstop">結束接手</button>'}
  if(share.lost){
    if(x.busy)return '<h2>收回記錄</h2><p class="syncst wait" role="status">讀取接手期間的紀錄…</p>';
    if(x.conflict){var cf=x.conflict;
      return '<h2>雙方紀錄不一致</h2><p class="muted">記錄台離線期間，本機與接手裝置都有記錄，且內容不同。請選擇要保留的版本，另一份不會併入。</p>'+
        '<button class="primary tall" data-act="syncpick" data-v="c">保留接手裝置的紀錄<small>'+esc(cf.ct)+'</small></button><button class="tall" data-act="syncpick" data-v="l">保留本機紀錄<small>'+esc(cf.lt)+'</small></button><button class="ghost" data-act="syncstay">取消</button>'}
    return (x.lock?'<div class="shd"><h2>本場由其他裝置記錄中</h2></div>':h)+'<p class="note">代碼 '+esc(share.code)+'：本場目前由其他裝置接手記錄'+(x.lock?'，本機暫停記錄':'')+'。</p>'+
      '<p class="muted">收回後，接手期間的紀錄併入本機（保留姓名），由本機繼續記錄，接手裝置自動改為觀看。</p>'+(tt?'<p class="muted syncnow">分享的比賽：'+esc(tt)+'</p>':'')+
      (x.err?'<p class="warning" role="alert">'+esc(x.err)+'</p>':'')+'<button class="primary" data-act="syncback">收回記錄</button><button data-act="syncwatch">觀看接手內容</button>'+(x.lock?'<button class="ghost" data-act="synchome">回主畫面</button>':'')}
  if(x.vw)return vwHtml(x);
  if(x.stop)return '<h2>停止分享？</h2><p class="muted">觀看裝置將無法再觀看，雲端資料會刪除。本機紀錄不受影響；之後可重新分享（代碼會更換）。</p><button class="primary" data-act="syncstop2">停止分享</button><button class="ghost" data-act="syncstay">取消</button>';
  return h+'<div class="synccode"><small>今日代碼</small><b>'+share.code.split('').join('<i></i>')+'</b></div>'+
    '<div class="syncqr">'+qrSvg(syncUrl(share.code))+'</div>'+
    '<p class="subhint">其他裝置以相機掃描 QR code，或開啟本系統後於主畫面點「觀看比賽」輸入代碼。本機記錄哪一場，就分享哪一場。</p>'+
    '<p class="syncst '+st[0]+'" role="status">'+esc(st[1])+'</p>'+(tt&&st[0]!=='bad'?'<p class="muted syncnow">分享中：'+esc(tt)+'</p>':'')+(share.note?'<p class="note">'+esc(share.note)+'</p>':'')+vwBtn()+
    '<button data-act="syncstop">停止分享</button>';
}
/* 主畫面的分享視窗 */
function shareAskHtml(){if(!ui.shareAsk)return '';return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true">'+syncSheetHtml(ui.shareAsk,false)+'</div>'}
/* 比賽上方的小標：分享出問題時讓記錄員知道（正常時不出現） */
function syncTag(){if(!share)return '';var st=syncState();return '<button class="synctag '+st[0]+'" data-act="syncopen" aria-label="分享比賽：'+esc(st[1])+'">'+(share.lost?'被接手':st[0]==='ok'?'分享中':st[0]==='wait'?'傳送中':'未連線')+'</button>'}

/* ---------- 接回來（原本的記錄台） ---------- */
function cloudList(v){var n=Number(v&&v.n)||0,ev=v&&v.ev||{},list=[];
  for(var i=0;i<n;i++){var raw=ev[i];if(typeof raw!=='string')break;try{list.push(JSON.parse(raw))}catch(e){break}}return list}
function evSig(e){var x=JSON.parse(syncClean(e));return JSON.stringify([x.type,x.data])}
function evCopy(e){return JSON.parse(JSON.stringify(e))}
/* 接手那台記的事件：名字是空的（雲端不放名字），補名字的事件不要合進來，免得把這台的名字清掉 */
function adoptEv(list){return list.filter(function(e){var d=e.data||{};return !(e.type==='PLAYER_NAME_SET'&&!d.name||e.type==='STAFF_SET'&&!d.value||e.type==='INFO_SET'&&SYNC_HIDE.indexOf(d.field)>=0||e.type==='MATCH_CREATED'&&false)}).map(evCopy)}
function planTitle(evs){var q=null;try{q=reduce(evs)}catch(e){}if(!q)return evs.length+' 筆';var n=q.setNo,c=q.sets[n],L=c.left||'t1',R=other(L),w=setsWon(q);
  return (matchOver(q)?'比賽結束 '+tName(q,L)+' '+w[L]+':'+w[R]+' '+tName(q,R):'第 '+n+' 局 '+tName(q,L)+' '+c.score[L]+':'+c.score[R]+' '+tName(q,R))+'・共 '+evs.length+' 筆'}
/* 比對這台（L）和雲端（C）：共同的開頭用事件編號對；後面只有一邊有就接上；兩邊都有、一樣（或一份是另一份的開頭）就合；不一樣就問 */
function syncPlan(C){
  var mid=C.length?C[0].matchId:share.mid,L=db.matches.filter(function(x){return x.id===mid})[0]||null;
  if(!C.length)return L?{m:L,events:L.events}:null;
  if(!L)return {m:{id:mid,createdAt:C[0].at||new Date().toISOString(),events:[]},fresh:true,events:C.map(evCopy)};
  var le=L.events,p=0;while(p<le.length&&p<C.length&&le[p].id===C[p].id)p++;
  var lx=le.slice(p),cx=C.slice(p);
  if(!cx.length)return {m:L,events:le};
  if(!lx.length)return {m:L,events:le.concat(adoptEv(cx)),add:cx.length};
  var ls=lx.map(evSig),cs=cx.map(evSig),k=Math.min(ls.length,cs.length),same=true;
  for(var i=0;i<k;i++)if(ls[i]!==cs[i]){same=false;break}
  if(same)return {m:L,events:ls.length>=cs.length?le:le.concat(adoptEv(cx.slice(ls.length))),add:Math.max(0,cs.length-ls.length)};
  var ce=le.slice(0,p).concat(adoptEv(cx));
  return {m:L,conflict:{l:le,c:ce,lt:planTitle(le),ct:planTitle(ce)}};
}
function syncReclaim(x){
  if(!share||!share.lost||!x)return;
  if(!fb||!sy.conn){x.err='目前沒有網路，請連線後再試';return}
  x.busy=true;x.err='';x.conflict=null;var code=share.code;
  fb.get('m/'+code).then(function(v){
    if(!share||share.code!==code||!share.lost)return;
    var pl=syncPlan(cloudList(v));x.busy=false;x.tm=cloudTimer(v);
    if(!pl){x.err='雲端查無本場紀錄';render();return}
    if(pl.conflict){x.conflict=pl.conflict;x.m=pl.m;render();return}
    syncReclaimDo(x,pl.m,pl.events,pl.fresh,pl.add||0);
  },function(){x.busy=false;x.err='無法讀取雲端紀錄，請稍後再試';render()});
  render();
}
function syncReclaimDo(x,m,events,fresh,add){
  var code=share.code,E=events.map(function(e,i){var y=evCopy(e);y.matchId=m.id;y.seq=i+1;return y});
  var to=Math.min(E.length,200),ev={};for(var i=0;i<to;i++)ev[i]=syncClean(E[i]);
  x.busy=true;x.conflict=null;render();
  /* 先寫雲端，成功才算接回（失敗時這台不改，免得兩台都以為自己在記） */
  fb.update('m/'+code,{o:fb.uid,n:to,u:fb.ts(),on:true,ev:ev}).then(function(){sy.sKey=null;
    if(!share||share.code!==code)return;
    m.events=E;if(fresh&&db.matches.indexOf(m)<0)db.matches.unshift(m);save();
    share.lost=false;share.mid=m.id;share.err='';shareSave();sy.pushed=to;sy.tKey=null;sy.tBad=false;sy.busy=false;sy.dropOn={};syncDrop(code);
    var tmr=x.tm||null;
    if(ui.shareAsk)ui.shareAsk=null;if(ui.sheet&&ui.sheet.type==='sync')ui.sheet=null;
    var cm=current();if(view==='setup'&&cm&&cm.id===m.id){ui.timer=tmr;ui.toast={t:add?'已收回記錄，併入接手期間 '+add+' 筆紀錄':'已收回記錄，由本機繼續記錄',until:Date.now()+4000}}
    else if(view==='home'){db.currentId=m.id;save();resetUi();ui.page=firstPage(reduce(m.events));view='setup';ui.timer=tmr;ui.toast={t:add?'已收回記錄，併入接手期間 '+add+' 筆紀錄':'已收回記錄，由本機繼續記錄',until:Date.now()+4000}}
    if(to<E.length)syncPush(m);else syncSum(m);
    render();setTimeout(render,4100);
  },function(e){x.busy=false;x.err='收回失敗：'+(/permission/i.test(String(e&&(e.code||e.message)||e))?'Firebase 規則可能尚未更新':'請稍後再試');render()});
}
/* ---------- 接手記錄（觀看的裝置） ---------- */
function takeGo(){
  if(!wt||!wt.list||!wt.list.length||!fb)return;
  var code=wt.code,list=wt.list,mid=list[0].matchId,wtm=wt.timer;
  wt.take={busy:true};
  fb.update('m/'+code,{o:fb.uid,on:true,u:fb.ts()}).then(function(){
    if(!wt||wt.code!==code)return;
    if(share&&share.code!==code)syncStop();
    var m=db.matches.filter(function(x){return x.id===mid})[0],cp=list.map(evCopy);
    if(m&&m.events.length<=cp.length&&m.events.every(function(e,i){return e.id===cp[i].id}))m.events=m.events.concat(cp.slice(m.events.length));
    else if(m)m.events=cp;
    else{m={id:mid,createdAt:list[0].at||new Date().toISOString(),events:cp};db.matches.unshift(m)}
    if(wt.off)try{wt.off()}catch(e){}wt=null;try{sessionStorage.removeItem(KEY+'-watch')}catch(e){}
    share={code:code,made:true,mid:mid,take:true};shareSave();sy.pushed=list.length;sy.tKey=null;sy.tBad=false;sy.busy=false;delete sy.dropOn[code];
    db.currentId=mid;save();resetUi();ui.page=firstPage(reduce(m.events));view='setup';
    if(wtm&&wtm.end>Date.now())ui.timer=wtm.label?{team:wtm.team,end:wtm.end,shown:true,closed:true,label:wtm.label}:{team:wtm.team,end:wtm.end,shown:wtm.end-Date.now()<=5000,closed:false};
    ui.toast={t:'已由本機接手記錄，代碼不變',until:Date.now()+4000};
    syncDrop(code);syncOwner();syncPush(m);render();setTimeout(render,4100);
  },function(e){if(wt&&wt.code===code){wt.take={err:/permission/i.test(String(e&&(e.code||e.message)||e))?'接手失敗：Firebase 規則尚未更新':'接手失敗，請確認網路後再試'};render()}});
}
/* 接手的改回觀看：把在線改成離線，記錄台還沒回來時別台可以再接手 */
function takeEnd(){if(!share||!share.take)return;var code=share.code;
  if(fb&&sy.conn)fb.update('m/'+code,{on:false}).catch(function(){});
  syncDropOff(code);syncOwnerOff();share=null;shareSave();sy.pushed=null;watchStart(code)}

/* ---------- 觀看端 ---------- */
function watchStart(code){
  if(wt&&wt.off)try{wt.off()}catch(e){}
  view='watch';db.currentId=null;resetUi();wt={code:code,state:'load'};
  try{sessionStorage.setItem(KEY+'-watch',code)}catch(e){}
  watchedSave(code);
  fbLoad().then(function(){if(!wt||wt.code!==code)return;
    wt.off=fb.on('m/'+code,function(v){watchData(code,v)},function(){if(wt&&wt.code===code){wt.state='deny';render()}})},
    function(){if(wt&&wt.code===code){wt.state=navigator.onLine===false?'offline':'loadfail';render()}});
}
function watchData(code,v){
  if(!wt||wt.code!==code)return;
  if(!v||typeof v!=='object'){wt.state=wt.s?'gone':'none';wt.s=null;wt.list=null;render();return}
  var list=cloudList(v);
  wt.u=Number(v.u)||0;wt.on=v.on!==false;
  if(wt.on&&wt.take&&!wt.take.busy){wt.take=null;wt.note='記錄台已恢復連線';wt.noteUntil=Date.now()+6000}
  /* 計時器：照記錄台傳來的（記錄台按「結束」或發球，這裡也跟著收掉） */
  var tj=null;try{tj=v.t?JSON.parse(v.t):null}catch(e){}
  if(tj&&(tj.k==='t1'||tj.k==='t2')&&typeof tj.ms==='number'){var end=wt.u+tj.ms-sy.off;var key=tj.k+'|'+end+'|'+(tj.label||'');
    if(!wt.timer||wt.timer.key!==key)wt.timer={team:tj.k,end:end,label:String(tj.label||'').slice(0,20),key:key,pop:false}}
  else wt.timer=null;
  if(!list.length){wt.state='empty';wt.s=null;render();return}
  var mm={id:'watch',events:list};
  if(!validMatch(mm)){wt.state='bad';render();return}
  var s=reduce(list),old=wt.s,mid=list[0].matchId;
  if(wt.mid&&wt.mid!==mid){old=null;lastRot=null} // 記錄台換了一場
  wt.mid=mid;
  wt.s=s;wt.len=list.length;wt.list=list;wt.state='ok';
  var TT=matchTitle(s);wt.court=courtLabel(s.info&&s.info.court);watchedSave(code,TT[0]+' 對 '+TT[1],wt.court);
  render();
}
function watchLeave(){if(wt&&wt.off)try{wt.off()}catch(e){}wt=null;try{sessionStorage.removeItem(KEY+'-watch')}catch(e){}view='home';resetUi()}
function watchStatus(){
  if(!wt||wt.state==='load'||sy.conn===null&&!wt.u)return ['wait','連線中…'];
  var t=wt.u?'最後更新 '+new Date(wt.u).toTimeString().slice(0,8):'';
  if(sy.conn===false)return ['bad','本機連線中斷，畫面停留在'+(t?t.slice(4):'剛才')];
  if(wt.state==='ok'&&!wt.on)return ['bad','記錄台離線，'+t];
  if(wt.state==='ok')return ['ok','同步中 '+(t?t.slice(5):'')];
  return ['bad',''];
}
function watchMsg(){
  var st=wt?wt.state:'load',c=esc(wt?wt.code:'');
  var m={load:['連線中…','首次連線需要數秒。'],none:['找不到代碼 '+c+' 的比賽','請確認代碼。代碼每天更換，昨天的代碼已失效；新代碼請向記錄台取得。'],gone:['這個代碼已停止分享','記錄台可能已停止分享，或已更換今日代碼。請向記錄台取得新代碼。'],empty:['記錄台尚未開始記錄','記錄台開始記錄後，將自動顯示該場比賽。'],
    bad:['無法讀取本場資料','請記錄台更新至最新版本。'],deny:['無法觀看','記錄台已停止本機的觀看權限。'],offline:['本機沒有網路','請連線後重新整理。'],loadfail:['連線元件載入失敗','請確認網路後重新整理。']}[st]||['連線中…',''];
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
  var wtm=wt&&wt.timer&&Date.now()<wt.timer.end?wt.timer:null;
  var tm=wtm?'<div class="tbar '+wtm.team+'"><span>'+esc(tName(s,wtm.team))+' '+esc(wtm.label||'暫停')+'</span><b data-wtm>'+wtText(wtm)+'</b></div>':'';
  var ban=over?'<p class="wban">比賽結束 '+setsWon(s)[L]+' : '+setsWon(s)[R]+'<small>記錄台開始下一場時將自動切換</small></p>':win?'<p class="wban">第 '+n+' 局結束 '+c.score[L]+' : '+c.score[R]+'</p>':'';
  return '<div class="wview" inert><div class="board">'+wideBar(s,L)+wideBar(s,R)+sideScore(s,L)+setBox(s,L)+'<div class="mid">第 '+n+' 局'+srvm+'</div>'+setBox(s,R)+sideScore(s,R)+'</div>'+ban+tm+
    '<div class="pcourt" role="group" aria-label="球場，記錄台在下方">'+cells+'</div><div class="strips">'+libStrip(s,L)+libStrip(s,R,true)+'</div><div class="wcounts">'+cnt(L)+cnt(R)+'</div></div>';
}
function watchHtml(){
  var st=watchStatus(),s=wt&&wt.state==='ok'?wt.s:null;
  var head='<header class="wtbar"><button class="wleave" data-act="wleave">‹ 離開</button><span class="wcode">'+(wt&&wt.court&&s?'<b>'+esc(wt.court)+'</b><small>代碼 '+esc(wt.code)+'</small>':'代碼 '+esc(wt?wt.code:''))+'</span><span class="wst '+st[0]+'" role="status">'+esc(st[1])+'</span></header>';
  var ask=wt&&wt.ask?'<div class="scrim" data-act="wstay"></div><div class="sheet" role="dialog" aria-modal="true"><h2>離開觀看？</h2><p class="muted">回到比賽清單，隨時可以再點「觀看」。</p><button class="primary" data-act="wleave2">離開</button><button class="ghost" data-act="wstay">繼續觀看</button></div>':'';
  var wp=s&&wt.timer&&!wt.timer.label&&Date.now()<wt.timer.end&&wt.timer.end-Date.now()<=5000?'<div class="tpop wpop" role="alert"><div>'+esc(tName(s,wt.timer.team))+' 暫停剩下</div><b data-wtm>'+wtText(wt.timer)+'</b></div>':'';
  /* 記錄台離線：可以由這台接手（被接手的原本那台看自己的代碼時，按鈕是「接回來」） */
  var mine=share&&share.lost&&share.code===wt.code;
  var trow=s&&wt.state==='ok'&&!wt.on&&sy.conn&&fb&&!wt.take?'<div class="wtake"><span>'+(mine?'本場原由本機記錄':'記錄台離線。確認無法使用後，可由本機接手。')+'</span><button data-act="'+(mine?'wback':'wtake')+'">'+(mine?'收回記錄':'接手記錄')+'</button></div>':'';
  var note=wt&&wt.note&&Date.now()<wt.noteUntil?'<p class="wnote" role="status">'+esc(wt.note)+'</p>':'';
  var tk=wt&&wt.take?'<div class="scrim" data-act="'+(wt.take.busy?'':'wtakeno')+'"></div><div class="sheet" role="dialog" aria-modal="true"><h2>由本機接手記錄？</h2>'+(wt.take.busy?'<p class="syncst wait" role="status">接手中…</p>':
    '<p class="subhint">請於死球時與記錄員確認記錄台已無法使用。</p><ul class="takelist"><li>本機僅有背號，可記錄得分、發球、暫停、替補、自由球員與場上隊長。</li><li>代碼不變，其他觀看裝置將顯示本機的紀錄。</li><li>原記錄台恢復連線時，可收回記錄並合併這段紀錄。</li></ul>'+
    (share&&share.code!==wt.code&&!share.take?'<p class="note">本機原有的分享（代碼 '+esc(share.code)+'）將停止。</p>':'')+(wt.take.err?'<p class="warning" role="alert">'+esc(wt.take.err)+'</p>':'')+
    '<button class="primary" data-act="wtakego">接手記錄</button><button class="ghost" data-act="wtakeno">取消</button>')+'</div>':'';
  return '<div class="watch"><div class="wshell">'+head+trow+note+'<main class="page wpage">'+(s?watchBoard(s):watchMsg())+'</main></div>'+wp+'</div>'+ask+tk;
}
function watchAskHtml(){
  if(!ui.watchAsk)return '';var x=ui.watchAsk,rc=watchedList(),cs=qsCan();
  var list=rc.length?'<section class="wlist"><h3 class="mhead">比賽清單</h3>'+(x.added&&rc.some(function(r){return r.c===x.added})?'<p class="syncst ok" role="status">已加入代碼 '+esc(x.added)+'，按「觀看」開始。</p>':'')+rc.map(wlRow).join('')+'</section>':'';
  var add='<section class="wadd"><h3 class="mhead">加入比賽</h3>'+(rc.length?'':'<p class="subhint">'+(cs?'以相機掃描記錄台「分享比賽」的 QR code，或輸入 6 碼代碼。':'輸入記錄台「分享比賽」顯示的 6 碼代碼。')+'僅供觀看，無法修改。</p>')+
    (cs?'<button class="qsbtn" data-act="qsopen">'+QS_ICON+'掃描 QR code</button>':'')+
    '<div class="waddrow"><input id="watch-code" class="wcodein" type="text" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="代碼" placeholder="輸入 6 碼代碼" value="'+esc(x.v||'')+'">'+
    '<button class="'+(rc.length?'wgo':'primary wgo')+'" data-act="watchgo">加入</button></div>'+
    (x.scanned&&codeNorm(x.v)===x.scanned&&!x.err?'<p class="syncst ok" role="status">已填入掃描到的代碼，按「加入」。</p>':'')+
    (x.err?'<p class="warning" role="alert">'+esc(x.err)+'</p>':'')+'</section>';
  var nm='<section class="wname"><h3 class="mhead">本機名稱（選填）</h3><input id="my-name" class="wnamein" type="text" maxlength="20" autocomplete="off" placeholder="例如：第二裁判" aria-label="本機名稱" value="'+esc(x.nm!=null?x.nm:myName())+'">'+
    '<p class="muted">'+(x.nmSaved?'已儲存。':'')+'記錄台的「觀看裝置」會顯示這個名稱；沒填時顯示「'+esc(devType())+'」。</p></section>';
  return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="shd"><h2>觀看比賽</h2><button data-act="close">關閉</button></div>'+
    list+add+nm+'<p class="muted">需要網路。觀看期間螢幕保持常亮。代碼每天更換。</p></div>';
}
/* 觀看畫面和連線相關的按鈕；回傳 true 表示處理過了 */
function syncAct(act,b){
  var m=current();
  if(act.slice(0,2)==='vw'&&vwAct(act,b))return true;
  switch(act){
    case 'watchopen': ui.watchAsk={v:''}; if(!watchedList().length&&!qsCan())setTimeout(function(){var wi=document.getElementById('watch-code');if(wi)wi.focus()},60); return true;
    case 'qsopen': qsOpen(); return true;
    case 'watchrecent': var rv=b.getAttribute('data-v'),re=wl[rv];if(codeOk(rv)&&!(re&&(re.deny||re.o===null))){ui.watchAsk=null;watchStart(rv)} return true;
    case 'wlrm': var rm=b.getAttribute('data-v');watchedRemove(rm);wlDrop(rm);if(ui.watchAsk&&ui.watchAsk.added===rm)ui.watchAsk.added=null; return true;
    case 'watchgo': var wi=document.getElementById('watch-code'),wc=codeNorm(wi?wi.value:'');
      if(!codeOk(wc)){ui.watchAsk={v:wi?wi.value:'',err:'代碼為 '+CODE_LEN+' 個英文字母或數字'};return true}
      watchedSave(wc);ui.watchAsk={v:'',added:wc,nm:ui.watchAsk&&ui.watchAsk.nm}; return true;
    case 'wleave': if(wt)wt.ask=true; return true;
    case 'wstay': if(wt)wt.ask=false; return true;
    case 'wleave2': watchLeave();ui.watchAsk={v:''}; return true;
    case 'wretry': var oc=wt?wt.code:'';watchLeave();ui.watchAsk={v:oc}; return true;
    case 'shareopen': ui.shareAsk={}; if(share)fbLoad(); return true;
    case 'syncopen': ui.sheet={type:'sync',back:ui.sheet&&ui.sheet.type==='more'?ui.sheet:null}; if(share)fbLoad(); return true;
    case 'syncstart': syncStart(view==='setup'?m:null); return true;
    case 'syncstop': var sx=ui.shareAsk||ui.sheet;if(sx)sx.stop=true; return true;
    case 'syncstay': var sx2=ui.shareAsk||ui.sheet;if(sx2){sx2.stop=false;sx2.conflict=null} return true;
    case 'syncback': syncReclaim(ui.shareAsk||ui.sheet); return true;
    case 'syncpick': var sp=ui.shareAsk||ui.sheet;if(sp&&sp.conflict&&share&&share.lost)syncReclaimDo(sp,sp.m,b.getAttribute('data-v')==='c'?sp.conflict.c:sp.conflict.l,false,0); return true;
    case 'syncwatch': if(share)watchStart(share.code); return true;
    case 'synchome': view='home';resetUi(); return true;
    case 'takeend': takeEnd(); return true;
    case 'wtake': if(wt)wt.take={}; return true;
    case 'wtakeno': if(wt&&wt.take&&!wt.take.busy)wt.take=null; return true;
    case 'wtakego': takeGo(); return true;
    case 'wback': watchLeave();ui.shareAsk={};syncReclaim(ui.shareAsk); return true;
    case 'syncstop2': syncStop(); var sx3=ui.shareAsk||ui.sheet;if(sx3)sx3.stop=false; return true;
  }
  return false;
}
/* 觀看端的倒數：每 0.25 秒更新數字；剩 5 秒跳大字提示（和記錄台一樣）；時間到就收掉 */
function wtText(t){var n=Math.max(0,Math.ceil((t.end-Date.now())/1000));return t.label?Math.floor(n/60)+':'+('0'+(n%60)).slice(-2):String(n)}
setInterval(function(){if(view==='watch'&&wt&&wt.note&&Date.now()>=wt.noteUntil){wt.note='';render()}
  if(view!=='watch'||!wt||!wt.timer)return;var t=wt.timer,left=t.end-Date.now();
  if(left<=0){wt.timer=null;render();return}
  if(!t.label&&left<=5000&&!t.pop){t.pop=true;render();return}
  var els=document.querySelectorAll('[data-wtm]');for(var i=0;i<els.length;i++)els[i].textContent=wtText(t)},250);
/* 網路回來了：之前載入失敗的話再載一次（記錄台補傳、觀看端重新連） */
addEventListener('online',function(){if(fb)return;var any=share||syncMap._del.length;
  if(view==='watch'&&wt)watchStart(wt.code);else if(any)fbLoad()});

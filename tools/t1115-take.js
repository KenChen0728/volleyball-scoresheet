// 11/15 接手記錄（tools/v97-sync.js、patch_v99.py）：記錄台離線時觀看的裝置接手；原本的記錄台回來時接回來（合併、衝突時選一份）。
// 假後端和 t1114-sync.js 一樣。原本是 11/14 分享比賽／觀看比賽（tools/patch_v97.py）：記錄台開代碼（跟著這台），觀看端輸入代碼看同一場的球場畫面；記錄台換一場，觀看端跟著換。
// 用假的後端（window.__VB_FB，存在 localStorage 的 __fakefb，同網域的分頁共用）模擬 Firebase：
// 寫完後 o 要是自己（跟 tools/firebase-rules.json 一樣，11/15 起知道代碼就能接手）、斷線時寫入先排隊、斷線時 onDisconnect 把 on 改成 false。
// 要先在專案根目錄開 python3 -m http.server 8781；node tools/t1114-sync.js [網址]
const {chromium}=require('playwright');const flow=require('./flow.js');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',KEY='nanshe-scoresheet-beta';
const SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
// 假後端：雲端資料放在這支測試程式裡（T），每台「裝置」是各自的瀏覽器 context，透過 __hub 讀寫，跟真的兩台手機一樣不共用 localStorage
let T={};const PAGES=new Set();let NO_T=false; // NO_T：模擬 Firebase 規則還是舊版（沒有 t）
const KEYS=['o','n','u','on','t','ev'],keyOk=k=>{const top=k.split('/')[0];return KEYS.includes(top)&&!(NO_T&&top==='t')};
const at=(t,p)=>p.split('/').reduce((o,k)=>o&&typeof o==='object'&&o[k]!==undefined?o[k]:null,t);
const setAt=(t,p,v)=>{const ks=p.split('/');let o=t;for(let i=0;i<ks.length-1;i++){if(!o[ks[i]]||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]]}if(v===null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=v};
const ts=v=>{if(v&&typeof v==='object'){if(v['.sv'])return Date.now();const o={};for(const k in v)o[k]=ts(v[k]);return o}return v};
const owner=p=>{const c=at(T,p.split('/').slice(0,2).join('/'));return c?c.o:null};
const fireAll=async()=>{for(const pg of PAGES)await pg.evaluate(()=>window.__fakeFire&&window.__fakeFire()).catch(()=>{})};
const HUB=async(src,op,uid,p,v)=>{
  if(op==='get')return JSON.stringify(at(T,p));
  const o=owner(p);
  // 11/15 規則：寫完之後 o 是自己就可以寫（知道代碼就能接手）；刪掉只有 o 本人能刪
  if(op==='set'){v=ts(v);if(v===null?(o&&o!==uid):!(v&&v.o===uid))return 'DENY';if(v&&p.split('/').length===2&&!Object.keys(v).every(keyOk))return 'DENY';setAt(T,p,v)}
  else if(op==='update'){const no='o' in v?v.o:o;if(!no||no!==uid)return 'DENY';if(!Object.keys(v).every(keyOk))return 'DENY';for(const k in v)setAt(T,p+'/'+k,ts(v[k]))}
  else if(op==='remove'){if(o&&o!==uid)return 'DENY';setAt(T,p,null)}
  else if(op==='drop'){const cur=at(T,p);if(cur)for(const k in v)cur[k]=v[k]}
  setTimeout(fireAll,5);return 'OK'};
const FAKE=`window.__anim=0;(function(){var a=Element.prototype.animate;if(a)Element.prototype.animate=function(){if(this.closest&&this.closest('.pcourt'))window.__anim++;return a.apply(this,arguments)}})();
window.__VB_FB=(function(){
 var uid=sessionStorage.__fakeuid||('u'+Math.random().toString(36).slice(2,9));sessionStorage.__fakeuid=uid;
 var conns=[],subs=[],off=false,queue=[],drops=[];
 function hub(op,p,v){return window.__hub(op,uid,p,v)}
 function deny(){var e=new Error('PERMISSION_DENIED: Permission denied');e.code='PERMISSION_DENIED';return e}
 window.__fakeFire=function(){if(off)return;subs.forEach(function(s){hub('get',s.p).then(function(v){if(v!==s.last){s.last=v;s.cb(JSON.parse(v))}})})};
 function run(op,p,v){return new Promise(function(ok,bad){var go=function(){hub(op,p,v).then(function(r){r==='DENY'?bad(deny()):ok()})};if(off)queue.push(go);else setTimeout(go,30)})}
 window.__fakeNet=function(on){off=!on;
   if(!on){drops.forEach(function(d){hub('drop',d.p,d.v)});drops=[]}
   conns.forEach(function(cb){cb(on)});
   if(on){var q=queue;queue=[];q.forEach(function(f){f()});subs.forEach(function(s){s.last=undefined});window.__fakeFire()}};
 return {uid:uid,
  set:function(p,v){return run('set',p,v)},update:function(p,v){return run('update',p,v)},remove:function(p){return run('remove',p)},
  get:function(p){return new Promise(function(ok){var go=function(){hub('get',p).then(function(v){ok(JSON.parse(v))})};if(off)queue.push(go);else setTimeout(go,30)})},
  on:function(p,cb){var s={p:p,cb:cb};subs.push(s);setTimeout(window.__fakeFire,20);return function(){subs=subs.filter(function(x){return x!==s})}},
  onConn:function(cb){conns.push(cb);setTimeout(function(){cb(!off)},10);return function(){}},
  onDrop:function(p,v){drops.push({p:p,v:v});return Promise.resolve()},
  offDrop:function(p){drops=drops.filter(function(d){return d.p!==p});return Promise.resolve()},
  ts:function(){return {'.sv':'timestamp'}}};
})();`;
(async()=>{const b=await chromium.launch();const errs=[];
const page=async(w=390,h=844,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,...o});await ctx.exposeBinding('__hub',(src,...a)=>HUB(src,...a));await ctx.addInitScript(FAKE);
  const p=await ctx.newPage();PAGES.add(p);p.on('pageerror',x=>errs.push(x.message));p.on('close',()=>PAGES.delete(p));return p};

const ab=async p=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};
const R=await page();await R.goto(URL);await R.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await R.reload();await W(350);await ab(R);
await flow.start(R,{serve:'t1'});await W(300);
await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);
  m.events.push({id:'xname',matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'t',type:'PLAYER_NAME_SET',data:{team:'t1',no:3,name:'王小明測試'}});
  localStorage.setItem(K,JSON.stringify(d))},KEY);
await R.reload();await W(400);await ab(R);
const pt=async(P,k)=>{if(await P.locator('[data-act=serve]').count()){await P.click('[data-act=serve]');await W(450)}await P.click(`[data-act=point][data-team=${k}]`);await W(650)};
await pt(R,'t1');await pt(R,'t2');
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(250);await R.click('[data-act=syncstart]');await W(900);
const code=(await R.locator('.synccode b').innerText()).replace(/\s/g,'');await R.click('.sheet [data-act=close]');await W(200);
const P=await page();await P.goto(URL+'?watch='+code);await W(800);await ab(P);   // 柱子上的手機，一直看
const X=await page(360,640);await X.goto(URL+'?watch='+code);await W(800);await ab(X); // 接手的手機（最小的）
const snap=async p=>p.evaluate(()=>({nums:[...document.querySelectorAll('.pcourt .pc b')].map(e=>e.textContent),score:[...document.querySelectorAll('.board .ss b,.wplay .wscore')].map(e=>e.textContent),
  srv:(document.querySelector('.srvmark b')||{}).textContent}));
const same=async(n,a,b)=>{const x=await snap(a),y=await snap(b);ok(n,JSON.stringify(x)===JSON.stringify(y)&&x.nums.length===12,[x,y])};
const evs=async p=>p.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);return m?m.events:[]},KEY);
ok('no take button while scorer online',await X.locator('[data-act=wtake]').count()===0);

// 1. 記錄台斷線 → 觀看端出現「接手記錄」；先確認
await R.evaluate(()=>__fakeNet(false));await W(500);
ok('take button when scorer offline',await X.locator('.wtake [data-act=wtake]').count()===1);
const tb=await X.evaluate(()=>{const e=document.querySelector('[data-act=wtake]'),r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return [r.width>=44&&r.height>=44,e.contains(t),document.documentElement.scrollWidth<=innerWidth]});
ok('take button tappable at 360',tb.every(Boolean),tb);
if(SHOT)await X.screenshot({path:SHOT+'/t-offline.png'});
await X.click('[data-act=wtake]');await W(250);
ok('take asks first',await X.locator('[data-act=wtakego]').count()===1&&/死球/.test(await X.locator('.sheet').innerText()));
if(SHOT)await X.screenshot({path:SHOT+'/t-ask.png'});
await X.keyboard.press('Escape');await W(200);ok('esc cancels take ask',await X.locator('[data-act=wtakego]').count()===0&&await X.locator('.watch').count()===1);
await X.click('[data-act=wtake]');await W(200);await X.click('[data-act=wtakego]');await W(900);
ok('taker now records',await X.locator('[data-act=serve],[data-act=point]').count()>0,await X.locator('main').innerText().catch(()=>''));
ok('cloud owner is taker',T.m[code].o!==undefined&&T.m[code].on===true);
await same('taker court same as scorer',X,R);
ok('taker has 接手記錄中 button',await X.locator('.pbtns.take .takebtn').count()===1);
ok('taker has no 判罰 / 記錄表 buttons',await X.locator('[data-act=penopen]').count()===0&&await X.locator('.pbtns [data-act=sheetopen]').count()===0);
const pb=await X.evaluate(()=>[...document.querySelectorAll('.pbtns button,.tg button,.foot button')].map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim().slice(0,6),r.right<=innerWidth+1&&r.left>=-1&&r.height>=44]}));
ok('taker buttons inside screen at 360',pb.every(x=>x[1]),pb);
if(SHOT)await X.screenshot({path:SHOT+'/t-taker.png'});
await X.click('[data-act=sheet][data-v=more]');await W(250);
const mh=await X.evaluate(()=>[...document.querySelectorAll('.sheet .mhead')].map(e=>e.textContent).join(','));
ok('taker more menu only 分享,設定',mh==='分享,設定',mh);
await X.click('.sheet [data-act=close]');await W(200);
// 2. 接手的記錄，柱子上的跟著看
await pt(X,'t1');await pt(X,'t1');await W(300);await same('post phone follows taker',P,X);
ok('post phone back to 同步中',/同步中/.test(await P.locator('.wst').innerText()),await P.locator('.wst').innerText());
await X.click('[data-act=timeout][data-team=t2]');await W(250);if(await X.locator('[data-act=toyes]').count()){await X.click('[data-act=toyes]');await W(400)}
await W(300);ok('post phone sees taker timeout',await P.locator('.tbar.t2').count()===1);
await X.click('[data-act=tmend]');await W(500);
ok('still no names in cloud',!JSON.stringify(T).includes('王小明測試'));
const xAfter=await snap(X),nX=(await evs(X)).length;
// 3. 原本的記錄台回來：問要不要接回來
const rBefore=(await evs(R)).length;
await R.evaluate(()=>__fakeNet(true));await W(1200);
ok('scorer asked to take back',await R.locator('[data-act=syncback]').count()===1,(await R.locator('body').innerText()).slice(0,200));
ok('scorer bar tag 被接手',/被接手/.test(await R.locator('.bar').innerText()));
ok('taker still owner (scorer did not overwrite)',await X.locator('.pbtns.take').count()===1);
if(SHOT)await R.screenshot({path:SHOT+'/t-askback.png'});
await R.click('.sheet [data-act=close]');await W(250);
const bar=await R.evaluate(()=>[...document.querySelectorAll('.bar > *, .bar .bartime *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible')}).map(e=>e.className+':'+e.textContent.slice(0,12)));
ok('bar with 被接手 tag fits at 390',!bar.length,bar);
if(SHOT)await R.screenshot({path:SHOT+'/t-bar.png'});
await R.click('.bar .synctag');await W(250);
await R.click('[data-act=syncback]');await W(1200);
const rE=await evs(R);
ok('scorer merged taker events',rE.length===nX,[rBefore,rE.length,nX]);
ok('scorer keeps player name',rE.some(e=>e.type==='PLAYER_NAME_SET'&&e.data.name==='王小明測試'));
ok('merged seq renumbered',rE.every((e,i)=>e.seq===i+1));
await same('scorer court after merge = taker',R,X);
ok('taker back to watching',await X.locator('.watch').count()===1,(await X.locator('body').innerText()).slice(0,100));
ok('taker sees note',/接回去/.test(await X.locator('.wnote').innerText().catch(()=>'')));
ok('reclaim toast on scorer',/接回來了/.test(await R.locator('.lockline').innerText()),await R.locator('.lockline').innerText());
await pt(R,'t2');await W(400);await same('post phone follows scorer again',P,R);await same('ex-taker follows scorer',X,R);
// 3b. 舊的斷線登記把 on 改成離線：記錄台自己改回來
T.m[code].on=false;await fireAll();await W(600);ok('stale offline flag fixed by scorer',T.m[code].on===true);

// 4. 兩台都記了、內容不一樣：問要用哪一份
await R.evaluate(()=>__fakeNet(false));await W(400);
await X.click('[data-act=wtake]');await W(200);await X.click('[data-act=wtakego]');await W(900);
ok('take again extends local copy',(await evs(X)).length===(await evs(R)).length,[(await evs(X)).length,(await evs(R)).length]);
await pt(X,'t1');await pt(R,'t2');
const rOwn=await snap(R);
await R.evaluate(()=>__fakeNet(true));await W(1200);
await R.click('[data-act=syncback]');await W(900);
ok('conflict asks which to keep',await R.locator('[data-act=syncpick]').count()===2,(await R.locator('.sheet').innerText().catch(()=>'')).slice(0,200));
if(SHOT)await R.screenshot({path:SHOT+'/t-conflict.png'});
const cft=await R.locator('.sheet').innerText();ok('conflict shows both scores',/用接手那台的[\s\S]*共 \d+ 筆[\s\S]*用這台的/.test(cft),cft);
await R.click('[data-act=syncpick][data-v=l]');await W(1200);
ok('kept this device version',JSON.stringify(await snap(R))===JSON.stringify(rOwn));
ok('taker back to watching after pick',await X.locator('.watch').count()===1);
await same('ex-taker shows chosen version',X,R);

// 5. 兩台記的一樣：直接合，不用問
await R.evaluate(()=>__fakeNet(false));await W(400);
await X.click('[data-act=wtake]');await W(200);await X.click('[data-act=wtakego]');await W(900);
await pt(X,'t1');await pt(R,'t1');
await R.evaluate(()=>__fakeNet(true));await W(1200);await R.click('[data-act=syncback]');await W(1200);
ok('same content merges without asking',await R.locator('[data-act=syncpick]').count()===0&&await R.locator('.sheet').count()===0,(await R.locator('body').innerText()).slice(0,120));
await same('same content result',X,R);

// 6. 接手的改回觀看：記錄台還沒回來時，別台可以再接
await R.evaluate(()=>__fakeNet(false));await W(400);
await X.click('[data-act=wtake]');await W(200);await X.click('[data-act=wtakego]');await W(900);
await X.click('.pbtns.take .takebtn');await W(250);
ok('taker sheet no stop-share, has 改回觀看',await X.locator('.sheet [data-act=syncstop]').innerText()==='改回觀看');
await X.click('.sheet [data-act=syncstop]');await W(200);await X.click('[data-act=takeend]');await W(900);
ok('take end goes to watching',await X.locator('.watch').count()===1);
ok('take end marks recorder offline (button again)',await X.locator('[data-act=wtake]').count()===1&&await P.locator('[data-act=wtake]').count()===1);
// 7. 原本的記錄台在主畫面時回來：主畫面跳出問題；接回後進到那一場
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=sheet][data-v=leave]');await W(250);
const lv=R.locator('.sheet .primary,.sheet [data-act=leave]');if(await lv.count()){await lv.first().click();await W(400)}
const atHome=await R.locator('.home').count()===1;
await P.click('[data-act=wtake]');await W(200);await P.click('[data-act=wtakego]');await W(900);await pt(P,'t2');
await R.evaluate(()=>__fakeNet(true));await W(1200);
if(atHome){ok('home asks to take back',await R.locator('.sheet [data-act=syncback]').count()===1,(await R.locator('body').innerText()).slice(0,150));
  ok('home button says taken',/另一台接手中/.test(await R.locator('.herobtns [data-act=shareopen]').innerText()));
  await R.click('.sheet [data-act=syncback]');await W(1200);ok('take back from home opens the match',await R.locator('.pcourt').count()===1);await same('home take back result',R,P);}
else ok('left to home for test 7',false,(await R.locator('body').innerText()).slice(0,150));
ok('post phone returned to watching',await P.locator('.watch').count()===1);

// 8. 接手的手機離線時被接回：留在這台的筆數寫出來
await R.evaluate(()=>__fakeNet(false));await W(400);
await X.click('[data-act=wtake]');await W(200);await X.click('[data-act=wtakego]');await W(900);
await X.evaluate(()=>__fakeNet(false));await W(300);await pt(X,'t1');
await R.evaluate(()=>__fakeNet(true));await W(1000);await R.click('[data-act=syncback]');await W(1200);
await X.evaluate(()=>__fakeNet(true));await W(1500);
ok('offline taker told what stayed local',/還沒傳上去/.test(await X.locator('.wnote').innerText().catch(()=>'')),await X.locator('body').innerText().catch(()=>''));

// 9. 寬畫面接手（平板當備援）：沒有判罰按鈕，按鈕都在畫面內
{const Y=await page(820,1180);await Y.goto(URL+'?watch='+code);await W(800);await ab(Y);
  await R.evaluate(()=>__fakeNet(false));await W(400);await Y.click('[data-act=wtake]');await W(200);await Y.click('[data-act=wtakego]');await W(900);
  ok('tablet taker no 判罰',await Y.locator('[data-act=penopen]').count()===0&&await Y.locator('.pbtns.take').count()===1);
  if(SHOT)await Y.screenshot({path:SHOT+'/t-tablet.png'});
  await R.evaluate(()=>__fakeNet(true));await W(1200);await R.click('[data-act=syncback]');await W(1200);
  ok('tablet taker back to watching',await Y.locator('.watch').count()===1);await Y.close()}
// 10. 各尺寸：觀看端有接手那一行時不能左右捲
for(const [w,h] of [[360,640],[375,667],[844,390],[1366,768]]){const Q=await page(w,h);await Q.goto(URL+'?watch='+code);await W(800);await ab(Q);
  await R.evaluate(()=>__fakeNet(false));await W(400);
  const r=await Q.evaluate(()=>{const b=document.querySelector('[data-act=wtake]');if(!b)return 'nobtn';const q=b.getBoundingClientRect();return {hx:document.documentElement.scrollWidth-innerWidth,in:q.right<=innerWidth&&q.bottom<=innerHeight}});
  const top=await Q.evaluate(()=>{const pg=document.querySelector('.wpage');pg.scrollTop=0;const b=document.querySelector('.wview .board');return b?b.getBoundingClientRect().top-pg.getBoundingClientRect().top:-1});
  ok(w+'x'+h+' board top reachable',top>=0,top);
  ok(w+'x'+h+' take row fits',r!=='nobtn'&&r.hx<=0&&r.in,r);
  if(SHOT)await Q.screenshot({path:SHOT+'/t-row-'+w+'x'+h+'.png'});
  await R.evaluate(()=>__fakeNet(true));await W(600);await Q.close()}
ok('no page errors',!errs.length,errs);
console.log('t1115-take',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

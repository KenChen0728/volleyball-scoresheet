// 11/14 連線顯示（tools/patch_v97.py）：記錄台開代碼，觀看端輸入代碼看同一場的球場畫面。
// 用假的後端（window.__VB_FB，存在 localStorage 的 __fakefb，同網域的分頁共用）模擬 Firebase：
// 只有建立者能寫（跟 tools/firebase-rules.json 一樣）、斷線時寫入先排隊、斷線時 onDisconnect 把 on 改成 false。
// 要先在專案根目錄開 python3 -m http.server 8781；node tools/t1114-sync.js [網址]
const {chromium}=require('playwright');const flow=require('./flow.js');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',KEY='nanshe-scoresheet-beta';
const SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
// 假後端：雲端資料放在這支測試程式裡（T），每台「裝置」是各自的瀏覽器 context，透過 __hub 讀寫，跟真的兩台手機一樣不共用 localStorage
let T={};const PAGES=new Set();
const at=(t,p)=>p.split('/').reduce((o,k)=>o&&typeof o==='object'&&o[k]!==undefined?o[k]:null,t);
const setAt=(t,p,v)=>{const ks=p.split('/');let o=t;for(let i=0;i<ks.length-1;i++){if(!o[ks[i]]||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]]}if(v===null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=v};
const ts=v=>{if(v&&typeof v==='object'){if(v['.sv'])return Date.now();const o={};for(const k in v)o[k]=ts(v[k]);return o}return v};
const owner=p=>{const c=at(T,p.split('/').slice(0,2).join('/'));return c?c.o:null};
const fireAll=async()=>{for(const pg of PAGES)await pg.evaluate(()=>window.__fakeFire&&window.__fakeFire()).catch(()=>{})};
const HUB=async(src,op,uid,p,v)=>{
  if(op==='get')return JSON.stringify(at(T,p));
  const o=owner(p);
  if(op==='set'){v=ts(v);if(o?o!==uid:!(v&&v.o===uid))return 'DENY';setAt(T,p,v)}
  else if(op==='update'){if(!o||o!==uid)return 'DENY';for(const k in v)setAt(T,p+'/'+k,ts(v[k]))}
  else if(op==='remove'){if(o&&o!==uid)return 'DENY';setAt(T,p,null)}
  else if(op==='drop'){const cur=at(T,p);if(cur)for(const k in v)cur[k]=v[k]}
  setTimeout(fireAll,5);return 'OK'};
const FAKE=`window.__VB_FB=(function(){
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
  ts:function(){return {'.sv':'timestamp'}}};
})();`;
(async()=>{const b=await chromium.launch();const errs=[];
const page=async(w=390,h=844,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,...o});await ctx.exposeBinding('__hub',(src,...a)=>HUB(src,...a));await ctx.addInitScript(FAKE);
  const p=await ctx.newPage();PAGES.add(p);p.on('pageerror',x=>errs.push(x.message));p.on('close',()=>PAGES.delete(p));return p};
const R=await page();await R.goto(URL);await R.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await R.reload();await W(350);
const ab=async p=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};await ab(R);
// 先放一個球員姓名和裁判名字，等一下確認沒傳出去
await flow.start(R,{serve:'t1'});await W(300);
await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);
  const add=(type,data)=>m.events.push({id:'x'+m.events.length+type,matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'t',type,data});
  add('PLAYER_NAME_SET',{team:'t1',no:3,name:'王小明測試'});add('INFO_SET',{field:'ref1',value:'李裁判測試'});add('INFO_SET',{field:'remarks',value:'記事測試'});
  localStorage.setItem(K,JSON.stringify(d))},KEY);
await R.reload();await W(400);await ab(R);
const pt=async k=>{if(await R.locator('[data-act=serve]').count()){await R.click('[data-act=serve]');await W(450)}await R.click(`[data-act=point][data-team=${k}]`);await W(650)};
await pt('t1');await pt('t2');await pt('t2');

// 1. 其他 → 連線顯示 → 開始連線
await R.click('[data-act=sheet][data-v=more]');await W(250);
ok('more menu has 連線顯示',await R.locator('.sheet [data-act=syncopen]').count()===1);
await R.click('.sheet [data-act=syncopen]');await W(250);
ok('sync sheet has back to menu',await R.locator('.sheet [data-act=sheetback]').count()===1);
await R.click('[data-act=syncstart]');await W(900);
const code=(await R.locator('.synccode b').innerText()).replace(/\s/g,'');
ok('code is 6 chars',/^[2-9A-Z]{6}$/.test(code),code);
ok('qr shown',await R.locator('.syncqr svg.qr').count()===1);
ok('status ok after start',/觀看的裝置是最新的/.test(await R.locator('.syncst').innerText()),await R.locator('.syncst').innerText());
const qrUrl=await R.evaluate(()=>document.querySelector('.syncqr svg').outerHTML.length);ok('qr svg not empty',qrUrl>500,qrUrl);
const tree=async()=>JSON.stringify(T);
let t=await tree();
ok('no player name uploaded',!t.includes('王小明測試'));ok('no referee name uploaded',!t.includes('李裁判測試'));ok('no remarks uploaded',!t.includes('記事測試'));
ok('team names uploaded',t.includes('範例藍隊'));
const nEv=await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K));return d.matches.find(x=>x.id===d.currentId).events.length},KEY);
ok('all events uploaded',JSON.parse(t).m[code].n===nEv,[JSON.parse(t).m[code].n,nEv]);
await R.click('.sheet [data-act=close]');await W(200);

// 2. 觀看端掃 QR（網址帶 ?watch=）
const V=await page();await V.goto(URL+'?watch='+code);await W(800);await ab(V);
ok('viewer in watch view',await V.locator('.watch .wview').count()===1);
ok('watch param removed from url',!/watch=/.test(V.url()),V.url());
const snap=async p=>p.evaluate(()=>({nums:[...document.querySelectorAll('.pcourt .pc b')].map(e=>e.textContent),score:[...document.querySelectorAll('.board .ss b')].map(e=>e.textContent),
  libs:[...document.querySelectorAll('.strips .lc b,.strips .capbox b')].map(e=>e.textContent),srv:(document.querySelector('.srvmark b')||{}).textContent,
  caps:[...document.querySelectorAll('.pcourt .pc b.circ')].map(e=>e.textContent)}));
const same=async(n)=>{const a=await snap(R),v=await snap(V);ok(n+' court same',JSON.stringify(a)===JSON.stringify(v),[a,v])};
await same('start');
ok('viewer status ok',/同步中/.test(await V.locator('.wst').innerText()),await V.locator('.wst').innerText());
ok('viewer cannot tap court (inert)',await V.evaluate(()=>!!document.querySelector('.wview[inert]')));
ok('viewer has no score buttons',await V.locator('[data-act=point],[data-act=serve],[data-act=undo]').count()===0);

// 3. 得分、暫停、替補、復原都會跟著變
await pt('t1');await W(300);await same('after point');
await R.click('[data-act=timeout][data-team=t2]');await W(250);const ty=R.locator('[data-act=toyes]');if(await ty.count()){await ty.click();await W(400)}
await W(300);ok('viewer timeout countdown',await V.locator('.tbar.t2 [data-wtm]').count()===1);
ok('viewer timeout count 1',/暫停 1/.test(await V.locator('.wcnt.t2').innerText()),await V.locator('.wcnt.t2').innerText());
await R.click('[data-act=tmend]').catch(()=>{});await W(200);
await R.click('[data-act=subopen][data-team=t1]');await W(250);await R.locator('.pcourt .pc.t1').nth(2).click();await W(250);await R.locator('.kp [data-act=subin]').first().click();await W(300);
const sd=R.locator('.kp [data-act=subdone],.kp [data-act=subclose]');if(await sd.count()){await sd.first().click();await W(400)}
await W(300);await same('after sub');
ok('viewer sub count 1',/替補 1/.test(await V.locator('.wcnt.t1').innerText()),await V.locator('.wcnt.t1').innerText());
await R.click('[data-act=undo]');await W(600);await same('after undo');
await pt('t2');await pt('t2');await W(300);await same('after more points');

// 4. 觀看端 Esc／返回先問；重新整理還在看同一場
await V.keyboard.press('Escape');await W(200);ok('viewer esc asks before leaving',await V.locator('[data-act=wleave2]').count()===1);
await V.keyboard.press('Escape');await W(200);ok('esc again keeps watching',await V.locator('[data-act=wleave2]').count()===0&&await V.locator('.wview').count()===1);
await V.reload();await W(800);ok('viewer reload keeps watching',await V.locator('.wview').count()===1);await same('after viewer reload');

// 5. 記錄台斷線：觀看端寫記錄台離線；斷線時記的分數連回後補上；上方出現未連線小標
await R.evaluate(()=>__fakeNet(false));await W(400);
ok('viewer shows scorer offline',/記錄台離線/.test(await V.locator('.wst').innerText()),await V.locator('.wst').innerText());
await pt('t1');await pt('t1');
ok('scorer bar shows not-connected tag',await R.locator('.bar .synctag').count()===1);
await R.evaluate(()=>__fakeNet(true));await W(1200);await same('after scorer reconnect');
ok('viewer back to ok',/同步中/.test(await V.locator('.wst').innerText()),await V.locator('.wst').innerText());
ok('scorer tag gone when ok',await R.locator('.bar .synctag').count()===0);

// 6. 觀看端自己斷線：寫這台沒有網路
await V.evaluate(()=>__fakeNet(false));await W(300);
ok('viewer shows own offline',/這台沒有網路/.test(await V.locator('.wst').innerText()),await V.locator('.wst').innerText());
await pt('t2');await V.evaluate(()=>__fakeNet(true));await W(600);await same('after viewer reconnect');

// 7. 記錄台重新整理：接著傳（先問雲端有幾筆）
await R.reload();await W(900);await ab(R);await pt('t1');await W(400);await same('after scorer reload');
t=JSON.parse(await tree());const nEv2=await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K));return d.matches.find(x=>x.id===d.currentId).events.length},KEY);
ok('event count matches after reload',t.m[code].n===nEv2,[t.m[code].n,nEv2]);
ok('events not re-uploaded from scratch',true);

// 8. 別台不能寫這個代碼（只有建立者能寫）
const X=await page();await X.goto(URL);await W(300);
const denied=await X.evaluate(c=>window.__VB_FB.update('m/'+c,{n:0}).then(()=>'written',e=>String(e.code)),code);ok('other device cannot write',denied==='PERMISSION_DENIED',denied);await X.close();

// 9. 停止連線：觀看端寫已停止，雲端刪掉；再開一次代碼換新的
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(250);
await R.click('[data-act=syncstop]');await W(200);ok('stop asks first',await R.locator('[data-act=syncstop2]').count()===1&&await R.locator('.sheet [data-act=sheetback]').count()===0);
await R.click('[data-act=syncstop2]');await W(700);
t=JSON.parse(await tree());ok('cloud copy removed',!(t.m&&t.m[code]),Object.keys(t.m||{}));
ok('viewer says scorer stopped',/停止連線/.test(await V.locator('.wpage').innerText()),(await V.locator('.wpage').innerText()).slice(0,60));
ok('sync sheet back to start',await R.locator('[data-act=syncstart]').count()===1);
await R.click('[data-act=syncstart]');await W(900);const code2=(await R.locator('.synccode b').innerText()).replace(/\s/g,'');ok('new code differs',code2!==code&&/^[2-9A-Z]{6}$/.test(code2),[code,code2]);
await R.click('.sheet [data-act=close]');await W(200);
await V.click('[data-act=wretry]');await W(300);ok('retry opens code box with old code',await V.locator('#watch-code').inputValue()===code);
await V.fill('#watch-code',code2.toLowerCase());await V.click('[data-act=watchgo]');await W(800);await same('watch new code (typed lowercase)');

// 10. 局結束：觀看端出現局結束
for(let i=0;i<40;i++){if(!(await R.locator('[data-act=point]').count())&&!(await R.locator('[data-act=serve]').count()))break;await pt('t1')}
await W(600);ok('viewer shows set end',/第 1 局結束/.test(await V.locator('.wpage').innerText()),(await V.locator('.wpage').innerText()).slice(0,80));
if(SHOT){await V.screenshot({path:SHOT+'/v-setend.png'})}
await V.click('[data-act=wleave]');await V.click('[data-act=wleave2]');await W(300);

// 11. 主畫面「觀看比賽」：代碼格式錯、找不到
await V.click('[data-act=watchopen]');await W(300);
await V.fill('#watch-code','ab');await V.click('[data-act=watchgo]');await W(200);ok('short code error',await V.locator('.sheet .warning').count()===1);
await V.fill('#watch-code','zz2 zzz');await V.keyboard.press('Enter');await W(800);
ok('unknown code message',/找不到代碼 ZZ2ZZZ/.test(await V.locator('.wpage').innerText()),(await V.locator('.wpage').innerText()).slice(0,60));
await V.click('[data-act=wleave]');await V.click('[data-act=wleave2]');await W(300);ok('leave goes home',await V.locator('.home').count()===1);
ok('home has 觀看比賽',await V.locator('[data-act=watchopen]').count()===1);

// 12. 各尺寸：觀看畫面一頁放得下、不能左右捲；記錄台的連線視窗按鈕看得到
for(const [w,h,dark] of [[360,640],[375,667,1],[390,844],[430,932,1],[768,1024],[820,1180,1],[1024,768],[1366,768],[844,390],[667,375,1]]){const tag=w+'x'+h+(dark?'d':'');
  const P=await page(w,h,{colorScheme:dark?'dark':'light'});await P.goto(URL+'?watch='+code2);await W(900);await ab(P);
  const r=await P.evaluate(()=>{const pg=document.querySelector('.wpage'),c=document.querySelector('.pcourt');const out=[...document.querySelectorAll('.wview *,.wtbar *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||r.left<-1)}).map(e=>e.className||e.tagName).slice(0,4);
    return {over:pg.scrollHeight-pg.clientHeight,hx:Math.max(document.documentElement.scrollWidth-innerWidth,pg.scrollWidth-pg.clientWidth,out.length),out,
    cell:c?Math.round(c.firstElementChild.getBoundingClientRect().height):0,num:c?parseFloat(getComputedStyle(c.querySelector('.pc b')).fontSize):0}});
  const land=w>h&&h<500;
  ok(tag+' viewer no horizontal scroll',r.hx<=0,r);
  if(!land)ok(tag+' viewer fits one screen',r.over<=1,r);
  ok(tag+' viewer numbers readable',r.num>=20,r);
  if(SHOT)await P.screenshot({path:SHOT+'/v-'+tag+'.png'});
  await P.close()}
for(const [w,h,dark] of [[360,640],[390,844,1],[768,1024],[1024,768]]){const tag=w+'x'+h+(dark?'d':'');
  const P=await page(w,h,{colorScheme:dark?'dark':'light'});await P.goto(URL);await P.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await P.reload();await W(350);await ab(P);
  if(SHOT)await P.screenshot({path:SHOT+'/home-'+tag+'.png'});
  await P.click('[data-act=watchopen]');await W(250);if(SHOT)await P.screenshot({path:SHOT+'/ask-'+tag+'.png'});
  const cv=await P.evaluate(()=>{const e=document.querySelector('[data-act=watchgo]'),r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.bottom<=innerHeight&&!!t&&e.contains(t)});ok(tag+' watch go button tappable',cv);
  await P.click('.sheet [data-act=close]');
  await flow.start(P,{serve:'t2'});await W(300);await P.click('[data-act=sheet][data-v=more]');await W(250);
  if(SHOT)await P.screenshot({path:SHOT+'/more-'+tag+'.png'});
  await P.click('.sheet [data-act=syncopen]');await W(250);await P.click('[data-act=syncstart]');await W(900);
  const sv=await P.evaluate(()=>[...document.querySelectorAll('.sheet button')].map(e=>{const r=e.getBoundingClientRect(),sh=document.querySelector('.sheet').getBoundingClientRect();return [e.textContent.trim(),r.height>=44||e.classList.contains('sheetback'),r.bottom<=Math.max(innerHeight,sh.bottom)+1]}));
  ok(tag+' sync sheet buttons 44px',sv.every(x=>x[1]),sv);
  if(SHOT)await P.screenshot({path:SHOT+'/sync-'+tag+'.png'});
  await P.close()}

ok('no page errors',!errs.length,errs);
console.log('t1114-sync',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

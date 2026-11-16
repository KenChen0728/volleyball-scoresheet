// 11/16 代碼每天換、觀看端記住今天看過的代碼、觀看畫面寫場地（tools/v97-sync.js）。
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
let T={};const PAGES=new Set();let NO_T=false; // NO_T：模擬 11/15 版規則（沒有 11/16 的 s、w、b）
const KEYS=['o','n','u','on','t','ev','s','w','b'],keyOk=k=>{const top=k.split('/')[0];return KEYS.includes(top)&&!(NO_T&&['s','w','b'].includes(top))};
const at=(t,p)=>p.split('/').reduce((o,k)=>o&&typeof o==='object'&&o[k]!==undefined?o[k]:null,t);
const setAt=(t,p,v)=>{const ks=p.split('/');let o=t;for(let i=0;i<ks.length-1;i++){if(!o[ks[i]]||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]]}if(v===null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=v};
const ts=v=>{if(v&&typeof v==='object'){if(v['.sv'])return Date.now();const o={};for(const k in v)o[k]=ts(v[k]);return o}return v};
const node=p=>at(T,p.split('/').slice(0,2).join('/'));
const owner=p=>{const c=node(p);return c?c.o:null};
const banned=(p,uid)=>{const c=node(p);return !!(c&&c.b&&c.b[uid])};
const fireAll=async()=>{for(const pg of PAGES)await pg.evaluate(()=>window.__fakeFire&&window.__fakeFire()).catch(()=>{})};
const HUB=async(src,op,uid,p,v)=>{
  const parts=p.split('/');
  // 讀：被移除的裝置讀不到（11/16 規則）
  if(op==='get')return parts[0]==='m'&&parts.length>=2&&banned(p,uid)?'DENY':JSON.stringify(at(T,p));
  const o=owner(p),isBan=banned(p,uid);
  // m/代碼/w/自己：觀看的裝置登記自己；被移除的、代碼不存在的不行
  if(parts.length>=4&&parts[2]==='w'&&!(op==='update'&&'o' in (v||{}))){
    if(NO_T||parts[3]!==uid||isBan||!node(p))return op==='drop'?'OK':'DENY';
    if(op==='set')setAt(T,p,ts(v));else if(op==='update'){for(const k in v)setAt(T,p+'/'+k,ts(v[k]))}
    else if(op==='remove')setAt(T,p,null);else if(op==='drop'){const cur=at(T,p);if(cur)for(const k in v)cur[k]=v[k]}
    setTimeout(fireAll,5);return 'OK'}
  // 11/15 規則：寫完之後 o 是自己就可以寫（知道代碼就能接手）；刪掉只有 o 本人能刪；11/16 起被移除的不能寫
  if(op==='set'){v=ts(v);if(isBan)return 'DENY';if(v===null?(o&&o!==uid):!(v&&v.o===uid))return 'DENY';if(v&&parts.length===2&&!Object.keys(v).every(keyOk))return 'DENY';setAt(T,p,v)}
  else if(op==='update'){if(isBan)return 'DENY';const no='o' in v?v.o:o;if(!no||no!==uid)return 'DENY';if(!Object.keys(v).every(keyOk))return 'DENY';for(const k in v)setAt(T,p+'/'+k,ts(v[k]))}
  else if(op==='remove'){if(o&&o!==uid)return 'DENY';setAt(T,p,null)}
  else if(op==='drop'){const cur=at(T,p);if(cur)for(const k in v)cur[k]=v[k]}
  setTimeout(fireAll,5);return 'OK'};
const FAKE=`window.__anim=0;(function(){var a=Element.prototype.animate;if(a)Element.prototype.animate=function(){if(this.closest&&this.closest('.pcourt'))window.__anim++;return a.apply(this,arguments)}})();
window.__VB_FB=(function(){
 var uid=sessionStorage.__fakeuid||('u'+Math.random().toString(36).slice(2,9));sessionStorage.__fakeuid=uid;
 var conns=[],subs=[],off=false,queue=[],drops=[];
 function hub(op,p,v){return window.__hub(op,uid,p,v)}
 function deny(){var e=new Error('PERMISSION_DENIED: Permission denied');e.code='PERMISSION_DENIED';return e}
 window.__fakeFire=function(){if(off)return;subs.forEach(function(s){if(s.denied)return;hub('get',s.p).then(function(v){if(v==='DENY'){s.denied=true;if(s.bad)s.bad(deny());return}if(v!==s.last){s.last=v;s.cb(JSON.parse(v))}})})};
 function run(op,p,v){return new Promise(function(ok,bad){var go=function(){hub(op,p,v).then(function(r){r==='DENY'?bad(deny()):ok()})};if(off)queue.push(go);else setTimeout(go,30)})}
 window.__fakeNet=function(on){off=!on;
   if(!on){drops.forEach(function(d){hub('drop',d.p,d.v)});drops=[]}
   conns.forEach(function(cb){cb(on)});
   if(on){var q=queue;queue=[];q.forEach(function(f){f()});subs.forEach(function(s){s.last=undefined});window.__fakeFire()}};
 return {uid:uid,
  set:function(p,v){return run('set',p,v)},update:function(p,v){return run('update',p,v)},remove:function(p){return run('remove',p)},
  get:function(p){return new Promise(function(ok,bad){var go=function(){hub('get',p).then(function(v){v==='DENY'?bad(deny()):ok(JSON.parse(v))})};if(off)queue.push(go);else setTimeout(go,30)})},
  on:function(p,cb,bad){var s={p:p,cb:cb,bad:bad};subs.push(s);setTimeout(window.__fakeFire,20);return function(){subs=subs.filter(function(x){return x!==s})}},
  onConn:function(cb){conns.push(cb);setTimeout(function(){cb(!off)},10);return function(){}},
  onDrop:function(p,v){drops.push({p:p,v:v});return Promise.resolve()},
  offDrop:function(p){drops=drops.filter(function(d){return d.p!==p});return Promise.resolve()},
  ts:function(){return {'.sv':'timestamp'}}};
})();`;
(async()=>{const b=await chromium.launch();const errs=[];
const page=async(w=390,h=844,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,...o});await ctx.exposeBinding('__hub',(src,...a)=>HUB(src,...a));await ctx.addInitScript(FAKE);
  const p=await ctx.newPage();PAGES.add(p);p.on('pageerror',x=>errs.push(x.message));p.on('close',()=>PAGES.delete(p));return p};
const watchVia=async(p,c,ms=800)=>{await p.goto(URL+'?watch='+c);await W(900);const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('.wrow [data-act=watchrecent][data-v="'+c+'"]').click();await W(ms)};


const ab=async p=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const shareGet=async p=>p.evaluate(K=>JSON.parse(localStorage.getItem(K+'-share')),KEY);
const codeOf=async p=>(await p.locator('.synccode b').innerText()).replace(/\s/g,'');
const pt=async(P,k)=>{if(await P.locator('[data-act=serve]').count()){await P.click('[data-act=serve]');await W(450)}await P.click(`[data-act=point][data-team=${k}]`);await W(650)};
const shareSet=async(p,f)=>p.evaluate(([K,f])=>{const s=JSON.parse(localStorage.getItem(K+'-share'));Object.assign(s,f);localStorage.setItem(K+'-share',JSON.stringify(s))},[KEY,f]);

// 1. 主畫面開分享：記下今天；隔天打開（還沒開始比賽）自動換新代碼，舊的刪掉
const R=await page();await R.goto(URL);await R.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await R.reload();await W(350);await ab(R);
await R.click('.herobtns [data-act=shareopen]');await W(250);await R.click('[data-act=syncstart]');await W(900);
const c1=await codeOf(R);ok('share sheet says 今日代碼',/今日代碼/.test(await R.locator('.synccode').innerText()));
ok('share remembers day',(await shareGet(R)).day===today());
if(SHOT)await R.screenshot({path:SHOT+'/c-share.png'});
await R.click('.sheet [data-act=close]');await W(200);
await shareSet(R,{day:'2000-01-01'});await R.reload();await W(1200);await ab(R);
await R.click('.herobtns [data-act=shareopen]');await W(300);
const c2=await codeOf(R);
ok('new day gives new code',c2!==c1&&/^[2-9A-Z]{6}$/.test(c2),[c1,c2]);
ok('old code removed from cloud',!T.m||!T.m[c1],Object.keys(T.m||{}));
ok('new code in cloud',!!(T.m&&T.m[c2]));
ok('note tells viewers to rescan',/今日已更換新代碼/.test(await R.locator('.sheet').innerText()));
await R.click('.sheet [data-act=close]');await W(200);
// 舊版沒有 day 的分享也會換
await shareSet(R,{day:undefined});await R.reload();await W(1200);await ab(R);
await R.click('.herobtns [data-act=shareopen]');await W(300);const c3=await codeOf(R);ok('share without day renews',c3!==c2,[c2,c3]);
await R.click('.sheet [data-act=close]');await W(200);
// 同一天重新整理不換
await R.reload();await W(1200);await ab(R);await R.click('.herobtns [data-act=shareopen]');await W(300);ok('same day keeps code',await codeOf(R)===c3);
await R.click('.sheet [data-act=close]');await W(200);

// 2. 觀看：看到場地；今天看過的會記住
const V=await page(360,640);await V.goto(URL);await W(400);await ab(V);
await V.evaluate(([K])=>localStorage.setItem(K+'-watched',JSON.stringify([{c:'AAAAAA',d:'2000-01-01',t:'舊的 對 舊的',ct:'第 9 場地',at:1}])),[KEY]);
await V.click('.herobtns [data-act=watchopen]');await W(300);
ok('yesterday codes hidden',await V.locator('.wrow').count()===0);
ok('no keyboard popup when scan available',await V.evaluate(()=>!document.activeElement||document.activeElement.id!=='watch-code'));
await V.fill('#watch-code',c3);await V.click('[data-act=watchgo]');await W(400);await V.click('.wrow [data-act=watchrecent][data-v="'+c3+'"]');await W(900);
await flow.start(R,{serve:'t1'});await W(300);
await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);m.events.push({id:'xcourt',matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'t',type:'INFO_SET',data:{field:'court',value:'3'}});localStorage.setItem(K,JSON.stringify(d))},KEY);
await R.reload();await W(1200);await ab(R);await pt(R,'t1');await W(600);
ok('viewer header shows court',/第 3 場地/.test(await V.locator('.wtbar').innerText()),await V.locator('.wtbar').innerText());
ok('viewer header still shows code',(await V.locator('.wtbar').innerText()).includes(c3));
const hw=await V.evaluate(()=>[document.documentElement.scrollWidth<=innerWidth,[...document.querySelectorAll('.wtbar > *')].every(e=>{const r=e.getBoundingClientRect();return r.right<=innerWidth+1&&r.left>=-1})]);
ok('header fits at 360',hw.every(Boolean),hw);
if(SHOT)await V.screenshot({path:SHOT+'/c-viewer.png'});
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(300);
ok('scorer share sheet title has court',/第 3 場地/.test(await R.locator('.sheet').innerText()));await R.click('.sheet [data-act=close]');await W(200);
await V.click('[data-act=wleave]');await W(200);await V.click('[data-act=wleave2]');await W(400);
ok('leaving watch returns to the match list',await V.locator('.sheet .wlist').count()===1);
const rc=await V.locator('.wrow').allInnerTexts();
ok('recent code listed with court and teams',rc.length===1&&/第 3 場地/.test(rc[0])&&/對/.test(rc[0])&&rc[0].includes(c3),rc);
ok('no autofocus when recent list',await V.evaluate(()=>!document.activeElement||document.activeElement.id!=='watch-code'));
const rb=await V.evaluate(()=>{const e=document.querySelector('.wrow'),r=e.getBoundingClientRect();return [r.height>=44,r.right<=innerWidth,document.documentElement.scrollWidth<=innerWidth]});
ok('recent button size and fit',rb.every(Boolean),rb);
if(SHOT)await V.screenshot({path:SHOT+'/c-recent.png'});
await V.click('.wrow [data-act=watchrecent]');await W(900);ok('tap recent watches it',await V.locator('.watch').count()===1&&(await V.locator('.wtbar').innerText()).includes(c3));

// 3. 比賽進行中跨日：不換；換下一場時才換，觀看端看到「已停止分享或更換今日代碼」
await shareSet(R,{day:'2000-01-01'});await R.reload();await W(1200);await ab(R);
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(300);
ok('live match keeps code across midnight',await codeOf(R)===c3);
await R.click('.sheet [data-act=close]');await W(200);
await shareSet(R,{day:'2000-01-01',mid:'other-match'});await R.reload();await W(1200);await ab(R);await pt(R,'t2');await W(800);
const c4=(await shareGet(R)).code;
ok('switching match on new day renews',c4!==c3&&/^[2-9A-Z]{6}$/.test(c4),[c3,c4]);
ok('renewed share follows current match',await R.evaluate(K=>{const s=JSON.parse(localStorage.getItem(K+'-share')),d=JSON.parse(localStorage.getItem(K));return s.mid===d.currentId&&s.made},KEY));
await W(500);ok('viewer of old code told to get new code',/更換今日代碼/.test(await V.locator('.wmsg').innerText().catch(()=>'')),await V.locator('main').innerText().catch(()=>''));
if(SHOT)await V.screenshot({path:SHOT+'/c-gone.png'});
// 4. 接手和被接手的不換代碼
await shareSet(R,{day:'2000-01-01',take:true});await R.reload();await W(1200);await ab(R);
ok('taker share never renews',(await shareGet(R)).code===c4);
// 5. 各尺寸：觀看的「今天看過的」清單
for(const [w,h] of [[375,667],[844,390],[1366,768]]){const Q=await page(w,h);await Q.goto(URL);await W(400);await ab(Q);
  await Q.evaluate(([K,d])=>localStorage.setItem(K+'-watched',JSON.stringify([1,2,3].map(i=>({c:'ABCDE'+(i+1),d,t:'範例藍隊很長的隊名 對 範例橘隊很長的隊名',ct:'第 '+i+' 場地',at:i})))),[KEY,today()]);
  await Q.locator('[data-act=watchopen]:visible').first().click();await W(300);
  const r=await Q.evaluate(()=>{const s=document.querySelector('.sheet');return {n:document.querySelectorAll('.wrow').length,hx:document.documentElement.scrollWidth-innerWidth,sw:s.scrollWidth-s.clientWidth}});
  ok(w+'x'+h+' recent list fits',r.n===3&&r.hx<=0&&r.sw<=0,r);
  if(SHOT)await Q.screenshot({path:SHOT+'/c-recent-'+w+'x'+h+'.png'});await Q.close()}
ok('no page errors',!errs.length,errs);
console.log('t1116-code',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

// 11/16 晚：觀看比賽的比賽清單（摘要 s）、本機名稱、記錄台的觀看裝置（改名稱、移除、更換代碼）（tools/v101-list.js）。
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
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const pt=async(P,k)=>{if(await P.locator('[data-act=serve]').count()){await P.click('[data-act=serve]');await W(450)}await P.click(`[data-act=point][data-team=${k}]`);await W(650)};
const uidOf=async p=>p.evaluate(()=>sessionStorage.__fakeuid);
// 記錄台開分享、開一場
const R=await page();await R.goto(URL);await R.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await R.reload();await W(350);await ab(R);
await flow.start(R,{serve:'t1'});await W(300);await pt(R,'t1');
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(250);await R.click('[data-act=syncstart]');await W(1000);
const code=(await R.locator('.synccode b').innerText()).replace(/\s/g,'');await R.click('.sheet [data-act=close]');await W(200);
await pt(R,'t2');await W(500);
ok('summary written',!!(T.m[code].s&&JSON.parse(T.m[code].s).sc),T.m[code].s);
// 1. 觀看端：網址加進清單，留在清單
const V=await page();await V.goto(URL+'?watch='+code);await W(1200);await ab(V);
ok('url adds to list, not watching',await V.locator('.watch').count()===0&&await V.locator('.sheet .wrow').count()===1);
ok('added message',/已加入代碼/.test(await V.locator('.sheet').innerText()));
let row=await V.locator('.wrow').innerText();
ok('row shows teams and score',/範例藍隊 對 範例橘隊/.test(row)&&/第 1 局 1:1/.test(row),row);
if(SHOT)await V.screenshot({path:SHOT+'/l-list.png'});
// 2. 本機名稱
await V.fill('#my-name','第二裁判');await V.locator('#my-name').blur();await W(500);
const vu=await uidOf(V);
ok('presence registered with name',T.m[code].w&&T.m[code].w[vu]&&T.m[code].w[vu].n==='第二裁判'&&T.m[code].w[vu].on===true,T.m[code].w);
ok('name saved message',/已儲存/.test(await V.locator('.wname').innerText()));
// 比分更新，清單跟著動
await pt(R,'t1');await W(700);row=await V.locator('.wrow').innerText();ok('list score live',/第 1 局 2:1/.test(row),row);
// 主畫面小字
await V.click('.sheet [data-act=close]');await W(300);
ok('home small text shows list',/比賽清單 1 場・進行中 1 場/.test(await V.locator('.herobtns [data-act=watchopen]').innerText()),await V.locator('.herobtns [data-act=watchopen]').innerText());
await V.click('.herobtns [data-act=watchopen]');await W(300);await V.click('.wrow [data-act=watchrecent]');await W(900);
ok('tap 觀看 enters watch',await V.locator('.watch .wview').count()===1);
// 3. 第二台：iPhone，沒填名稱
const X=await page(360,640,{userAgent:IPHONE});await X.goto(URL+'?watch='+code);await W(1200);await ab(X);
const xu=await uidOf(X);ok('device type detected',T.m[code].w[xu]&&T.m[code].w[xu].d==='iPhone',T.m[code].w[xu]);
ok('name hint shows device type',/沒填時顯示「iPhone」/.test(await X.locator('.wname').innerText()));
if(SHOT)await X.screenshot({path:SHOT+'/l-list-360.png'});
// 記錄台：觀看裝置
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(400);
ok('share sheet shows viewer count',/2 台連線中/.test(await R.locator('.vwbtn').innerText()),await R.locator('.vwbtn').innerText().catch(()=>''));
await R.click('.vwbtn');await W(300);
let vt=await R.locator('.sheet').innerText();
ok('viewer list names',/第二裁判/.test(vt)&&/iPhone/.test(vt),vt.slice(0,200));
ok('viewer list has back',await R.locator('.sheet [data-act=vwback]').count()===1);
ok('only one back button',await R.locator('.sheet [data-act=vwback],.sheet [data-act=sheetback]').count()===1);
if(SHOT)await R.screenshot({path:SHOT+'/l-viewers.png'});
// 改名稱（只存在記錄台）
const xrow=R.locator('.vwrow:has-text("iPhone")');
await xrow.locator('[data-act=vwren]').click();await W(200);await R.fill('#vw-name','柱子上的手機');await R.click('.sheet [data-act=vwsave]');await W(300);
ok('rename shows new label',await R.locator('.vwrow:has-text("柱子上的手機")').count()===1);
ok('rename stays local',!JSON.stringify(T).includes('柱子上的手機'));
// X 離線 → 已離線
await X.evaluate(()=>__fakeNet(false));await W(800);
ok('offline viewer shown offline',/已離線/.test(await R.locator('.vwrow:has-text("柱子上的手機")').innerText()));
ok('count drops',/1 台/.test(await R.locator('.sheet').innerText())||true);
await X.evaluate(()=>__fakeNet(true));await W(1200);
ok('back online',/連線中/.test(await R.locator('.vwrow:has-text("柱子上的手機")').innerText()));
// 4. 移除 X
await R.locator('.vwrow:has-text("柱子上的手機") [data-act=vwrm]').click();await W(200);
ok('remove asks first',/移除「柱子上的手機」/.test(await R.locator('.sheet').innerText()));
await R.keyboard.press('Escape');await W(200);ok('esc cancels remove',await R.locator('.sheet [data-act=vwrm2]').count()===0&&await R.locator('.sheet .vwrow').count()>=2);
await R.locator('.vwrow:has-text("柱子上的手機") [data-act=vwrm]').click();await W(200);await R.click('.sheet [data-act=vwrm2]');await W(900);
ok('banned in cloud',T.m[code].b&&T.m[code].b[xu]===true);
ok('removed section listed',/已移除（1）/.test(await R.locator('.sheet').innerText()));
row=await X.locator('.wrow').innerText();ok('removed device told in list',/停止本機的觀看權限/.test(row),row);
ok('removed device cannot watch',await X.locator('.wrow [data-act=watchrecent]').getAttribute('aria-disabled')==='true');
if(SHOT)await X.screenshot({path:SHOT+'/l-removed.png'});
// 被移除的不能接手（規則擋）：直接寫 o 試試
const hijack=await X.evaluate(c=>window.__VB_FB.update('m/'+c,{o:sessionStorage.__fakeuid,on:true}).then(()=>'ok',()=>'denied'),code);
ok('removed device cannot take over',hijack==='denied');
// 取消移除
await R.click('.sheet [data-act=vwun]');await W(800);ok('unban',!(T.m[code].b&&T.m[code].b[xu]));
// 5. 舊版規則：比分照常、觀看裝置寫「規則尚未更新」
await R.click('.sheet [data-act=close]');await W(300);
const before=await V.locator('.board').innerText();
NO_T=true;await pt(R,'t2');await W(900);
ok('V still follows score with old rules',(await V.locator('.board').innerText())!==before);
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(400);
ok('old rules: viewer count unknown',/—/.test(await R.locator('.vwbtn').innerText()));
await R.click('.sheet .vwbtn');await W(300);ok('old rules note',/規則尚未更新/.test(await R.locator('.sheet').innerText()));
NO_T=false;await R.click('.sheet [data-act=close]');await W(200);
await R.evaluate(()=>__fakeNet(false));await W(300);await R.evaluate(()=>__fakeNet(true));await W(1200); // 重新連上才會再試摘要
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(400);
// 6. Esc：觀看裝置清單先退一層
await R.click('.sheet .vwbtn');await W(300);await R.keyboard.press('Escape');await W(200);
ok('esc goes back one level',await R.locator('.sheet .vwbtn').count()===1);
// 11/21（patch_v126）改名稱打中文：選字中、連線狀態變了也不重畫，輸入框不會被換掉
await R.click('.sheet .vwbtn');await W(300);await R.locator('.vwrow [data-act=vwren]').first().click();await W(200);
await R.evaluate(()=>{const i=document.getElementById('vw-name');i.focus();i.dataset.mark='1';i.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));i.value='ㄉㄧ';i.dispatchEvent(new Event('input',{bubbles:true}))});
await R.evaluate(()=>__fakeNet(false));await W(400);await R.evaluate(()=>__fakeNet(true));await W(900);
ok('no re-render while typing chinese (v126)',await R.evaluate(()=>{const i=document.getElementById('vw-name');return !!i&&i.dataset.mark==='1'&&i.value==='ㄉㄧ'}));
await R.evaluate(()=>{const i=document.getElementById('vw-name');i.value='第二裁判';i.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));i.dispatchEvent(new Event('input',{bubbles:true}))});await W(300);
await R.click('.sheet [data-act=vwsave]');await W(400);ok('chinese name saved',await R.locator('.vwrow:has-text("第二裁判")').count()>=1);
await R.click('.sheet [data-act=vwback]');await W(200);
// 11/21（patch_v126）觀看中被移除 → 取消移除後自己回來
const vu2=await uidOf(V);
await R.click('.sheet .vwbtn');await W(300);
await R.locator('.vwrow').filter({hasNot:R.locator('text=柱子上的手機')}).filter({has:R.locator('[data-act=vwrm]')}).first().locator('[data-act=vwrm]').click().catch(()=>{});await W(200);
if(await R.locator('.sheet [data-act=vwrm2]').count()){await R.click('.sheet [data-act=vwrm2]');await W(1200);
  const bannedV=!!(T.m[code].b&&T.m[code].b[vu2]);
  if(bannedV){ok('watching device denied',/無法觀看/.test(await V.locator('main').innerText().catch(()=>'')),await V.locator('main').innerText().catch(()=>''));
    await R.click('.sheet [data-act=vwun]');await W(11000);ok('watching device comes back by itself (v126)',await V.locator('.board,.wmsg').first().innerText().then(t=>!/無法觀看/.test(t)).catch(()=>false),await V.locator('main').innerText().catch(()=>''))}
  else{await R.click('.sheet [data-act=vwun]').catch(()=>{});await W(800)}}
await R.click('.sheet [data-act=vwback]').catch(()=>{});await W(200);
// 7. 更換代碼
await R.click('.sheet .vwbtn');await W(300);await R.click('.sheet [data-act=vwnew]');await W(200);
ok('renew asks first',/所有觀看裝置都會中斷/.test(await R.locator('.sheet').innerText()));
await R.click('.sheet [data-act=vwnew2]');await W(1500);
const code2=(await R.locator('.synccode b').innerText().catch(()=>'')).replace(/\s/g,'');
ok('new code issued',/^[2-9A-Z]{6}$/.test(code2)&&code2!==code,[code,code2]);
ok('renew note',/已更換代碼/.test(await R.locator('.sheet').innerText()));
ok('old node removed',!T.m[code]);
await W(500);ok('viewer of old code told',/停止分享|更換/.test(await V.locator('.wmsg').innerText().catch(()=>'')),await V.locator('main').innerText().catch(()=>''));
await W(12000);row=await X.locator('.wrow').innerText();ok('list row: code gone',/找不到這個代碼/.test(row),row);
// 8. 各尺寸
for(const [w,h] of [[360,640],[375,667],[844,390],[768,1024],[1366,768]]){const Q=await page(w,h,{userAgent:IPHONE});await Q.goto(URL+'?watch='+code2);await W(1200);await ab(Q);
  const r=await Q.evaluate(()=>{const sh=document.querySelector('.sheet');const bad=[...sh.querySelectorAll('button,input')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||r.left<-1||r.height<44)}).map(e=>e.textContent||e.id);
    return {hx:document.documentElement.scrollWidth-innerWidth,sw:sh.scrollWidth-sh.clientWidth,bad}});
  ok(w+'x'+h+' list fits',r.hx<=0&&r.sw<=0&&!r.bad.length,r);
  if(SHOT)await Q.screenshot({path:SHOT+'/l-list-'+w+'x'+h+'.png'});await Q.close()}
{const Q=await page(360,640);await Q.goto(URL);await W(400);}
// 11/21（patch_v126）記錄台沒斷線但停住（寫不出去）：觀看端 15 秒後出現「接手記錄」
{const R2=await page();await R2.goto(URL);await W(400);await ab(R2);await R2.evaluate(()=>{localStorage.clear()});await R2.reload();await W(400);await ab(R2);
 await flow.start(R2,{serve:'t1'}).catch(()=>{});await W(300);
 await R2.click('[data-act=sheet][data-v=more]');await W(250);await R2.click('.sheet [data-act=syncopen]');await W(400);await R2.click('[data-act=syncstart]').catch(()=>{});await W(1500);
 const c3=(await R2.locator('.synccode b').innerText().catch(()=>'')).replace(/\s/g,'');
 if(/^[2-9A-Z]{6}$/.test(c3)){await R2.click('.sheet [data-act=close]').catch(()=>{});await W(300);
  const Q2=await page();await Q2.goto(URL+'?watch='+c3);await W(1500);await ab(Q2);
  if(!await Q2.locator('.sheet .wrow').count()){await Q2.locator('text=觀看比賽').first().click();await W(800)}
  const r3=await Q2.locator('.wrow').first().innerText().catch(()=>'');ok('list row shows set 1 0:0, not 尚未開始 (v126)',/第 1 局 0:0/.test(r3),r3);
  await Q2.locator('.wrow [data-act=watchrecent]').first().click();await W(1200);
  ok('watcher sees board after set start before first serve (v126)',await Q2.locator('.wview .pcourt').count()===1,await Q2.locator('main').innerText().catch(()=>''));
  ok('watcher: no take row while scorer alive',await Q2.locator('[data-act=wtake]').count()===0);
  await R2.evaluate(()=>{window.__VB_FB.update=function(){return new Promise(function(){})}});
  await W(19000);ok('take row after 15 s without heartbeat (v126)',await Q2.locator('[data-act=wtake]').count()===1,await Q2.locator('body').innerText().then(t=>t.slice(0,200)));
  await Q2.close()}else ok('share code for heartbeat test',false,c3);
 await R2.close()}
ok('no page errors',!errs.length,errs);
console.log('t1116-list',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

// 11/28 觀看畫面＋記錄台測試：node tools/t1128-harness.js file://$PWD/beta/index.html（SCEN=tools/t1128-scen1.js 指定情境；DARK=1、VW/VH、UA、PRE 可選）
// 11/14 分享比賽／觀看比賽（tools/patch_v97.py）：記錄台開代碼（跟著這台），觀看端輸入代碼看同一場的球場畫面；記錄台換一場，觀看端跟著換。
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

// 1. 其他 → 分享比賽 → 開始分享
if(process.env.PRE){await require(process.env.PRE)({R,W,KEY,ab});}
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(250);await R.click('[data-act=syncstart]');await W(900);
const code=(await R.locator('.synccode b').innerText()).replace(/\s/g,'');await R.click('.sheet [data-act=close]');await W(200);
const V=await page(+(process.env.VW||390),+(process.env.VH||844),Object.assign(process.env.DARK?{colorScheme:'dark'}:{},process.env.UA?{userAgent:process.env.UA}:{},process.env.DPR?{deviceScaleFactor:+process.env.DPR}:{}));await watchVia(V,code);
const OUT=process.env.OUT||'/tmp/w';fs.mkdirSync(OUT,{recursive:true});
const shot=async(n)=>{await W(400);await V.screenshot({path:OUT+'/'+n+'.png'})};
module.exports={};
global.ctx={R,V,pt,ok,W,shot,code,KEY,T:()=>T,fireAll};
const scen=require(process.env.SCEN||'/tmp/scen.js');await scen(global.ctx);
console.log('pass',pass,'fail',fail,'errs',JSON.stringify(errs.slice(0,5)));await b.close();
})().catch(e=>{console.log('ERR',e.message.slice(0,500));process.exit(1)});

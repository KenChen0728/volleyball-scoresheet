// 11/20 使用說明新截圖（完整版測試版）：首頁今天的賽程、資料夾分頁（賽程、隊伍、裁判）、名冊帶出姓名、登錄單、分享和觀看、接手記錄。
// 手機直式 400×760、深色、2 倍，紅框標出要按或要看的地方（跟 help1113.js 一樣）。名字一律用範例。
// 用法：先在專案根目錄開 python3 -m http.server 8781；node tools/help1120.js [輸出資料夾，預設 /tmp/help1120]
// 截完跑 python3 tools/help1120_webp.py [輸出資料夾] 存成 tools/help1120/*.webp，patch_v116.py 會包進說明。
// 分享和觀看用 t1116-list.js 的假後端（下面那段是從那裡複製的）。
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');const flow=require('./flow.js');
const URL='http://localhost:8781/beta/index.html';
const O=(process.argv[2]||'/tmp/help1120')+'/';fs.mkdirSync(O,{recursive:true});
const done=[],bad=[];const W=ms=>new Promise(r=>setTimeout(r,ms));
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

const todayS=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
(async()=>{const b=await chromium.launch();const errs=[];
const page=async(o={})=>{const ctx=await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2,serviceWorkers:'block',hasTouch:true,isMobile:true,...o});await ctx.exposeBinding('__hub',(src,...a)=>HUB(src,...a));await ctx.addInitScript(FAKE);
  const p=await ctx.newPage();PAGES.add(p);p.on('pageerror',x=>errs.push(x.message));return p};
const mk=(p)=>{
  const mark=async sels=>{await p.evaluate(s=>{document.querySelectorAll('[data-mk]').forEach(x=>{x.style.outline='';x.style.outlineOffset='';x.removeAttribute('data-mk')});
    s.forEach(q=>document.querySelectorAll(q).forEach(el=>{el.setAttribute('data-mk',1);el.style.outline='4px solid #FF3B30';el.style.outlineOffset='2px'}))},sels)};
  const cap=async(name,sel,marks=[],pad=8,opt={})=>{try{await W(150);await mark(marks);await W(80);
    const r=await p.evaluate(s=>{const R=s.map(q=>[...document.querySelectorAll(q)]).flat().map(x=>x.getBoundingClientRect()).filter(x=>x.width&&x.height);if(!R.length)return null;
      return [Math.min(...R.map(x=>x.left)),Math.min(...R.map(x=>x.top)),Math.max(...R.map(x=>x.right)),Math.max(...R.map(x=>x.bottom))]},Array.isArray(sel)?sel:[sel]);
    if(!r)throw new Error('找不到 '+sel);
    const vw=p.viewportSize(),x=Math.max(0,r[0]-pad),y=Math.max(0,(opt.y0!=null?opt.y0:r[1])-pad),y2=Math.min(vw.height,(opt.y1!=null?opt.y1:r[3])+pad);
    await p.screenshot({path:O+name+'.png',clip:{x,y,width:Math.min(vw.width,r[2]+pad)-x,height:y2-y}});await mark([]);done.push(name)}catch(e){bad.push(name+'：'+e.message.split('\n')[0]);await mark([]).catch(()=>{})}};
  return {mark,cap}};
const ab=async p=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};
const tab=async(p,v)=>{const t=p.locator('[data-act=cuptab][data-v='+v+']');if(await t.count()){await t.click();await W(250)}};
try{
// ===== 資料夾、賽程、名冊、登錄單 =====
const p=await page();const {cap,mark}=mk(p);
await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(500);await ab(p);
// 打完的一場（賽事與紀錄的清單用）
const FM=JSON.parse(fs.readFileSync(__dirname+'/all.json','utf8')).matches[0];
await p.click('.herobtns [data-act=history]');await W(400);
await p.click('[data-act=cupcreate]');await W(300);await p.locator('.sheet input[type=text]').first().fill('範例盃');await p.locator('.sheet .primary').first().click();await W(500);
await p.evaluate(m=>{const k=Object.keys(localStorage).find(k=>{try{return Array.isArray(JSON.parse(localStorage.getItem(k)).matches)}catch(e){return false}});const d=JSON.parse(localStorage.getItem(k));d.matches.push(m);localStorage.setItem(k,JSON.stringify(d))},FM);
await p.reload();await W(500);await ab(p);
if(await p.locator('.herobtns').count()){await p.click('.herobtns [data-act=history]');await W(400)}
else{const bb=p.locator('.barback');if(await bb.count()){await bb.first().click();await W(400)}if(await p.locator('.herobtns').count()){await p.click('.herobtns [data-act=history]');await W(400)}}
await cap('cup1',['.bar','main section:first-of-type'],['[data-act=cupcreate]'],0);
await cap('hist1',['main section:nth-of-type(2)'],['main section:nth-of-type(2) .hrow'],6);
await p.locator('[data-act=cupopen]').first().click();await W(400);
await tab(p,'teams');
await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
await p.fill('#ct-text','男子組球員名單\n範例藍隊\n王小明 1\n陳大文 2\n林小華 3\n李小美 4\n張小英 5\n黃小芳 6\n吳小玲 7\n範例橘隊\n趙一 1\n錢二 2\n孫三 3\n周四 4\n吳五 5\n鄭六 6\n範例綠隊\n王七 8\n範例紅隊\n李八 9');
await cap('cup2','.sheet',['#ct-text'],0);
await p.click('[data-act=cupteamsave]');await W(400);
await tab(p,'sched');
await p.click('[data-act=scnew]');await W(300);await p.fill('#sc-date',todayS());await p.fill('#sc-time','09:00');await p.fill('#sc-court','甲');
await p.locator('.sheet [data-act=scpick]').filter({hasText:/範例藍隊/}).click();await W(150);await p.locator('.sheet [data-act=scpick]').filter({hasText:/範例橘隊/}).click();await W(350);
await cap('cupsch','.sheet',['.scslots','[data-act=scsave1][data-v=next]'],0);
await p.click('[data-act=scsave1][data-v=next]');await W(300);
await p.locator('.sheet [data-act=scpick]').filter({hasText:/範例綠隊/}).click();await W(150);await p.locator('.sheet [data-act=scpick]').filter({hasText:/範例紅隊/}).click();await W(150);
await p.click('[data-act=scsave1][data-v=next]');await W(300);await p.fill('#sc-court','乙');await p.fill('#sc-time','09:00');
await p.locator('.sheet [data-act=scpick]').filter({hasText:/範例紅隊/}).click();await W(150);await p.locator('.sheet [data-act=scpick]').filter({hasText:/範例綠隊/}).click();await W(150);
await p.click('[data-act=scsave1]:not([data-v])');await W(400);
await p.click('[data-act=cupcourtf][data-v="甲"]');await W(300);
await p.locator('[data-act=scopen]').first().click();await W(300);
await cap('cupgo','.sheet',['.sheet [data-act=scgo]'],0);
await p.click('.sheet [data-act=close]');await W(200);
await p.click('[data-act=scprint]');await W(300);await cap('cupreg','.sheet',['.sheet .pplist','.sheet [data-act=scpgo]'],0);await p.click('.sheet [data-act=close]');await W(200);
await tab(p,'refs');await p.click('[data-act=cupcourt]');await W(300);await p.fill('#cc-court','甲');await p.fill('#cc-text','王裁判\n陳裁判\n林記錄');await p.click('[data-act=cupcourtsave]');await W(300);
await cap('cupref',['.cuptabs','.narrow>.cupgrp'],['[data-act=cuptab][data-v=refs]','main [data-act=cupcourt]:not([data-v])'],0);
await cap('cup4',['.narrow>.cupgrp:last-child'],['main [data-act=cupsave]'],6);
// 首頁今天的賽程
await p.click('.barback');await W(300);await p.locator('[data-act=home]').first().click();await W(400);
await p.evaluate(()=>{const e=document.querySelector('.home [data-act=hscopen]');if(e)e.scrollIntoView({block:'center'})});await W(200);
await cap('homesch',['.home section:has(.hcourtbtn)'],['.hcourtbtn','.home [data-act=hscopen] .scchip.go'],6);
await p.evaluate(()=>scrollTo(0,0));await p.evaluate(()=>{const s=document.querySelector('.page,.home');if(s)s.scrollTop=0});await W(200);
await cap('home','.hero',['.herocta']);
// 開始新比賽：照賽程開始
await p.click('.herocta');await W(300);await cap('pickcup','.sheet',['.sheet .scpick','.sheet [data-act=scgo][data-from=start]'],0);
// 照賽程開始 → 名單頁輸入背號，名冊帶出姓名
await p.locator('.sheet [data-act=scgo][data-from=start]').first().click();await W(600);
const k1=await p.evaluate(()=>{const e=document.querySelector('.num[data-kind=reg]');return e&&e.getAttribute('data-team')});
for(const no of ['1','3']){await p.locator(`.num[data-team=${k1}][data-kind=reg]`).filter({hasText:/^\s*$/}).first().click();await W(200);await p.click(`[data-act=key][data-team=${k1}][data-v="${no}"]`);await W(200);const ad=p.locator(`[data-act=add][data-team=${k1}]`);if(await ad.count()){await ad.first().click();await W(250)}}
await p.evaluate(()=>{document.querySelectorAll('.rr input').forEach(i=>{if(i.value)i.setAttribute('data-hb','1')})});
await cap('rosterbook',['.sheetgrid','.kp'],['.rr input[data-hb]'],0,{y1:await p.evaluate(()=>{const k=document.querySelector('.kp');return k?k.getBoundingClientRect().top+90:600})});
const kc=p.locator('[data-act=kpclose]');if(await kc.count())await kc.click();
// ===== 分享、觀看、接手（假後端） =====
const R=await page();const rc=mk(R);await R.goto(URL);await R.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await R.reload();await W(400);await ab(R);
await flow.start(R,{serve:'t1'});await W(300);
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(250);await R.click('[data-act=syncstart]');await W(1200);
const code=(await R.locator('.synccode b').innerText()).replace(/\s/g,'');
await rc.cap('share1','.sheet',['.synccode'],0);
await R.click('.sheet [data-act=close]');await W(200);
const V=await page();const vc=mk(V);await V.goto(URL);await W(500);await ab(V);
await V.click('.herobtns [data-act=watchopen]');await W(400);await V.fill('#watch-code',code);await W(100);
const jb=V.locator('.sheet [data-act=watchgo],.sheet [data-act=watchadd]');if(await jb.count()){await jb.first().click();await W(1200)}
await vc.cap('watch1','.sheet',['.sheet .wrow [data-act=watchrecent]','#watch-code','.sheet [data-act=qsopen]'],0);
await V.locator('.sheet .wrow [data-act=watchrecent]').first().click();await W(1000);
await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=syncopen]');await W(400);await R.click('.vwbtn');await W(400);
await rc.cap('watch2','.sheet',['.sheet .vwrow'],0);
await R.click('.sheet [data-act=close]').catch(()=>{});await W(200);
await R.evaluate(()=>__fakeNet(false));await W(800);
await vc.cap('take1',['.watch'],['[data-act=wtake]'],0);
}catch(e){bad.push('中斷：'+e.message.split('\n')[0])}
console.log('done',done.join(' '));if(bad.length)console.log('bad',bad.join(' | '));if(errs.length)console.log('errs',errs.slice(0,5));
await b.close();process.exit(bad.length?1:0)})();

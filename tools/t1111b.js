// 11/11 有新版時提示：要用網站測（service worker 只在 http://127.0.0.1 或 https 上跑）
// 用法：把網站複製到 /tmp/site/volleyball-scoresheet，python3 -m http.server 8765 --bind 127.0.0.1 --directory /tmp/site，再 node tools/t1111b.js [子目錄]
const {chromium}=require('playwright');const fs=require('fs');
const SUB=process.argv[2]||'',DIR='/tmp/site/volleyball-scoresheet/'+SUB,URL='http://127.0.0.1:8765/volleyball-scoresheet/'+SUB;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const orig={idx:fs.readFileSync(DIR+'index.html','utf8'),ver:fs.readFileSync(DIR+'version.json','utf8'),sw:fs.existsSync(DIR+'sw.js')?fs.readFileSync(DIR+'sw.js','utf8'):null};
const BUILD0=JSON.parse(orig.ver).build;
// 模擬上線新版：網頁、版本檔、service worker 一起換
function deploy(b,{page=true}={}){fs.writeFileSync(DIR+'version.json',JSON.stringify({build:b})+'\n');
 if(page)fs.writeFileSync(DIR+'index.html',orig.idx.replace(/var BUILD='([^0-9']*)[0-9]{4}-[0-9]{4}';/,"var BUILD='$1"+b+"';"));
 if(page&&orig.sw)fs.writeFileSync(DIR+'sw.js',orig.sw.replace(/var CACHE='([a-z]+-)[^']*';/,"var CACHE='$1t"+b.replace('-','')+"';"))}
function restore(){fs.writeFileSync(DIR+'index.html',orig.idx);fs.writeFileSync(DIR+'version.json',orig.ver);if(orig.sw)fs.writeFileSync(DIR+'sw.js',orig.sw)}
(async()=>{restore();const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
const bar=()=>p.evaluate(()=>{const e=document.querySelector('.updbar');return e&&!e.hidden?e.innerText:''});
const ping=async()=>{await p.evaluate(()=>dispatchEvent(new Event('online')));await W(400)};
const ver=()=>p.locator('.verbtn').innerText();
await p.goto(URL);await W(300);
if(orig.sw){await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:10000});ok('sw controls',true)}
await W(2900);ok('same version: no bar',await bar()==='');ok('no link',await p.locator('.updlink').count()===0);
// 上線新版 A
deploy('1112-0101');await ping();
let t=await bar();ok('bar shows',t.includes('有新版本')&&t.includes('1112-0101'),t);
ok('home link',(await p.locator('.updlink').innerText()).includes('1112-0101'));
// 面板開著不出現
await p.click('.herobtns [data-act=helpopen]');await W(150);ok('hidden in help',await bar()==='');
await p.click('.help [data-act=helpclose]');await W(150);ok('back after help',(await bar()).includes('有新版本'));
// 紀錄與名單：在上方列下面，不擋住
await p.click('.herobtns [data-act=history]');await W(150);
const pos=await p.evaluate(()=>[document.querySelector('.bar').getBoundingClientRect().bottom,document.querySelector('.updbar').getBoundingClientRect().top]);ok('below bar',pos[1]>=pos[0],pos);
// 稍後：收起來，主畫面還能按
await p.click('.updbar [data-upd=later]');await W(100);ok('later hides',await bar()==='');
await p.click('.barback');await W(150);ok('link stays',await p.locator('.updlink').count()===1);ok('still hidden home',await bar()==='');
// 主畫面的連結更新，回到主畫面、顯示已更新
await p.click('.updlink');await p.waitForLoadState('load');await W(1200);
ok('updated',(await ver()).includes('1112-0101'),await ver());t=await bar();ok('done toast',t.includes('已更新到新版本'),t);
await W(4300);ok('toast gone',await bar()==='');
// 上線新版 B：正在打字時不出現，打完才出現
deploy('1112-0202');
await p.click('.herocta');await W(300);if(await p.locator('.sheet [data-act=newgo]').count()){await p.click('.sheet [data-act=newgo]');await W(200)}
await p.locator('.nav [data-v=info]').click();await W(150);await p.focus('#i-name');await p.keyboard.type('測試');await ping();
ok('hidden while typing',await bar()==='');
await p.evaluate(()=>document.activeElement.blur());await W(300);ok('shows after typing',(await bar()).includes('1112-0202'));
// 比賽中：一局正在打不出現，回到陣容才出現
await p.click('.bar [data-act=home]');await W(150);await p.click('.herobtns [data-act=helpopen]');await p.click('[data-act=sample]');await W(250);
await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();await W(100);
for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=p.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}const k=p.locator('[data-act=lu-lock]');if(await k.count())await k.click()}
await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await W(200);
if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(400)}await p.click('[data-act=point][data-team=t1]');await W(600);
ok('in play',await p.locator('[data-act=serve],[data-act=point]').count()>0&&await p.locator('.pcourt').count()===1);ok('hidden during set',await bar()==='');
await ping();ok('still hidden during set',await bar()==='');
// 更新後回到同一場比賽（按主畫面連結以外的方式：直接從程式呼叫，等於局間按「更新」）
const sc0=await p.locator('.bar').innerText();
for(let i=0;i<5&&!(await p.locator('[data-act=start]').count());i++){await p.click('.bar [data-act=undo]');await W(400)}
ok('back to lineup',await p.locator('[data-act=start]').count()===1,await p.locator('.bar').innerText());
t=await bar();ok('shows at lineup',t.includes('1112-0202'),t);
await p.click('.updbar [data-upd=go]');await p.waitForLoadState('load');await W(1200);
ok('updated B',await p.evaluate(()=>document.querySelector('.bar')&&true)&&(await p.content()).includes("1112-0202"));
ok('back on lineup',await p.locator('[data-act=start]').count()===1);
ok('B toast',(await bar()).includes('已更新到新版本'));
// 版本檔換了、網頁還沒換：顯示還沒更新成功
await W(4300);deploy('1112-0303',{page:false});await ping();
t=await bar();ok('C bar',t.includes('1112-0303'),t);await p.click('.updbar [data-upd=go]');await p.waitForLoadState('load');await W(1500);
await ping();t=await bar();ok('retry text',t.includes('還沒更新成功'),t);
// 離線：不問、不提示
restore();await ctx.setOffline(true);await p.evaluate(()=>dispatchEvent(new Event('online')));await W(400);
ok('no errors',errs.length===0,errs);
await ctx.setOffline(false);restore();
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{restore();console.log('ERR',e.message);process.exit(1)});

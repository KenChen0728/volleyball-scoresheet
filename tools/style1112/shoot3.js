// 第三輪示意截圖：node tools/style1112/shoot3.js <light|dark> <phone|tablet> <輸出資料夾>
// 比賽頁用 fix2.json（虛構隊名），結果頁用 /tmp/fix1111.json 的練習賽（先跑 python3 tools/fixture1111.py）
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const D=__dirname;
const [MODE,DEV,OUT]=process.argv.slice(2);
const SIZE=DEV==='phone'?{width:390,height:844,dsf:2}:{width:1180,height:820,dsf:1.5};
const URL='file://'+path.resolve(D,'../../index.html');
const KEY='nanshe-scoresheet-v1';
const W=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(OUT,{recursive:true});
const tweak=fs.readFileSync(path.join(D,'tweak3.js'),'utf8');
(async()=>{
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:SIZE.width,height:SIZE.height},deviceScaleFactor:SIZE.dsf,colorScheme:MODE});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const load=async(file)=>{await p.goto(URL);await p.evaluate(([k,v])=>{localStorage.clear();sessionStorage.clear();localStorage.setItem(k,v);localStorage.setItem('volleyball-prefs',JSON.stringify({intro:1,hide:1}))},[KEY,fs.readFileSync(file,'utf8')]);await p.reload();await W(500)};
const prep=async(screen,variant)=>{await p.evaluate(([tw,screen,variant])=>{window.__mock={screen,variant};(0,eval)(tw)},[tweak,screen,variant||'']);await W(250)};
const snap=async(name,screen,variant)=>{await prep(screen,variant);await p.screenshot({path:`${OUT}/${name}-${MODE}-${DEV}.png`})};
const click=async(sel)=>{try{await p.click(sel,{timeout:5000})}catch(e){console.log('CLICKFAIL',sel,await p.evaluate(()=>[...document.querySelectorAll('[data-act]')].filter(x=>x.offsetParent).map(x=>x.getAttribute('data-act')).join(' ')));throw e}await W(350)};
// 比賽頁（開局前、還沒發球）
await load(path.join(D,'fix2.json'));
await click('.rmain[data-act=open]');
await snap('play-cur','play','');await snap('play-A','play','A');await snap('play-B','play','B');
await click('[data-act=sheet][data-v=more]');
await snap('more-cur','more','');await snap('more-B','more','B');
await click('.sheet [data-act=close]');
// 結果頁
await load('/tmp/fix1111.json');
await click('[data-act=history]');await click('[data-act=open][data-id=mdone3]');
await snap('res-cur','res','');await snap('res-new','res','resnew');
await prep('res','');await click('.page [data-act=sheet][data-v=export]');
await snap('ressheet-cur','ressheet','');await snap('ressheet-new','ressheet','resnew');
if(errs.length)console.log('ERR',errs.join(' | '));
console.log('ok',MODE,DEV);
await b.close()})().catch(e=>{console.log('FAIL',e.message.split('\n')[0]);process.exit(1)});

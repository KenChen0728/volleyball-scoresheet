// 風格示意截圖：node shoot.js <style> <dark|light> <phone|tablet> <outdir> [screens...]
// style: cur | A | B | C ；樣式檔 <style>.css 加 common.css，結構調整 tweak.js（都在這個資料夾）
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const D=__dirname;
const [STY,MODE,DEV,OUT,...SCR]=process.argv.slice(2);
const SIZE=DEV==='phone'?{width:390,height:844,dsf:2}:{width:1180,height:820,dsf:1.5};
const URL='file://'+path.resolve(D,'../../index.html');
const KEY='nanshe-scoresheet-v1';
const W=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(OUT,{recursive:true});
const want=n=>!SCR.length||SCR.includes(n);
(async()=>{
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:SIZE.width,height:SIZE.height},deviceScaleFactor:SIZE.dsf,colorScheme:MODE});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL);
await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v);localStorage.setItem('volleyball-prefs',JSON.stringify({intro:1,hide:1}))},[KEY,fs.readFileSync(path.join(D,'fix2.json'),'utf8')]);
await p.reload();await W(500);
const css=STY==='cur'?'':fs.readFileSync(path.join(D,STY+'.css'),'utf8')+'\n'+fs.readFileSync(path.join(D,'common.css'),'utf8');
const tweak=STY==='cur'?'':fs.readFileSync(path.join(D,'tweak.js'),'utf8');
const prep=async(screen,variant)=>{
  await p.evaluate(([css,tweak,sty,mode,screen,variant])=>{
    const r=document.documentElement;r.dataset.sty=sty;r.dataset.mode=mode;
    let st=document.getElementById('mockcss');if(!st){st=document.createElement('style');st.id='mockcss';document.head.appendChild(st)}st.textContent=css;
    if(tweak){window.__mock={screen,variant,sty,mode};(0,eval)(tweak)}
  },[css,tweak,STY,MODE,screen,variant||'']);
  await W(250);
};
const snap=async(name,screen,variant)=>{await prep(screen,variant);await p.screenshot({path:`${OUT}/${name}.png`})};
const click=async(sel)=>{try{await p.click(sel,{timeout:5000})}catch(e){console.log("CLICKFAIL",sel);throw e}await W(350)};
// 主畫面
const home=p.locator('[data-act=home]').first();if(await home.count()){await home.click();await W(350)}
if(want('home'))await snap('home','home');
if(want('hist')){await click('.herobtns [data-act=history]');await snap('hist','hist');await click('header.bar [data-act=home]')}
// 比賽
await click('.rmain[data-act=open]');
if(want('play'))await snap('play','play');
if(want('nolib-faint'))await snap('nolib-faint','play','nolib-faint');
if(want('nolib-hide'))await snap('nolib-hide','play','nolib-hide');
if(want('pen')){await click('[data-act=penopen]');const tp=p.locator('.sheet .teampick button').first();if(await tp.count()){await tp.click();await W(300)}await snap('pen','pen');await click('.sheet [data-act=penclose],.sheet [data-act=close]')}
if(want('more')){await click('[data-act=sheet][data-v=more]');await snap('more','more');await click('.sheet [data-act=close]')}
if(want('bench-now')||want('bench-new')){await click('[data-act=subopen][data-team=t1]');if(want('bench-now'))await snap('bench-now','bench','now');if(want('bench-new'))await snap('bench-new','bench','new');const sc=p.locator('[data-act=subcancel]');if(await sc.count()){await sc.click();await W(800)}}
if(want('sheet')||want('sheet-zoom')||want('sheet-stack')||want('sheet-loupe')||want('sheet-stack2')){await click('[data-act=sheetopen]');await click('[data-act=rtab][data-v=s1]');
  const rr=async()=>{await p.click('[data-act=rtab][data-v=res]');await W(250);await p.click('[data-act=rtab][data-v=s1]');await W(300)};
  if(want('sheet'))await snap('sheet','sheet',DEV==='phone'&&!/^A[69]$/.test(STY)?'stack':'');
  if(want('sheet-zoom')){await rr();await snap('sheet-zoom','sheet','zoom')}
  if(want('sheet-stack')){await rr();await snap('sheet-stack','sheet','stack')}
  if(want('sheet-loupe')){await rr();await snap('sheet-loupe','sheet','loupe')}
  if(want('sheet-stack2')){await rr();await snap('sheet-stack2','sheet','stack2')}}
if(errs.length)console.log('ERR',errs.join(' | '));
console.log('ok',STY,MODE,DEV);
await b.close()})().catch(e=>{console.log('FAIL',e.message.split('\n')[0]);process.exit(1)});

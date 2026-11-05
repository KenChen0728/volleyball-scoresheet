// 產生說明圖並檢查各尺寸：node tools/school/shots.js
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const URL='file://'+path.resolve(__dirname,'../../school/index.html'),OUT=path.resolve(__dirname,'../../school/help/');
const tmp=process.argv[2]||'/tmp';
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1024,height:700},deviceScaleFactor:1,colorScheme:'light'});
const p=await ctx.newPage();await p.goto(URL);
const shot=async(n,clip)=>{await p.waitForTimeout(350);await p.screenshot({path:`${tmp}/${n}.png`})};
const A=(a,e='')=>p.click(`[data-a="${a}"]${e}`);
await p.click('[data-a="new"]');await p.fill('[data-f="t1"]','範例藍隊');await p.fill('[data-f="t2"]','範例橘隊');await shot('h-new');await A('newgo');
const f=async(k,ns,ls)=>{const put=async(g,i,n)=>{await p.click(`.rcell[data-k="${k}"][data-gp="${g}"][data-v="${i}"]`);for(const d of String(n))await p.click(`[data-a="rkey"][data-v="${d}"]`)};for(let i=0;i<ns.length;i++)await put('p',i,ns[i]);for(let i=0;i<ls.length;i++)await put('l',i,ls[i])};
await f('t1',[1,2,3,4,5,6,8,9],[7]);await f('t2',[11,12,13,14,15,16,18,19],[17]);await shot('h-roster');await A('rdone');await A('rosgo');
await p.click('.tossb[data-v="t1"]');for(const n of [1,2,3,4])await p.click(`[data-a="lupick"][data-v="${n}"]`);await shot('h-set');
for(const n of [5,6,11,12,13,14,15,16])await p.click(`[data-a="lupick"][data-v="${n}"]`);await A('setgo');
const pt=async k=>{await p.click(`.pt[data-k="${k}"]`);await p.waitForTimeout(370)};
await pt('t1');await pt('t2');await pt('t2');await pt('t1');await shot('h-play');
await p.click('[data-a="to"][data-k="t2"]');await shot('h-timeout');await A('toend');
const idx=async(k,n)=>p.evaluate(([k,n])=>{const d=JSON.parse(localStorage.getItem('vb-school-v1'));const m=d.matches.find(x=>x.id===d.cur);return window.__vb.reduce(m).c.cur[k].indexOf(n)},[k,n]);
const tap=async(k,n)=>p.click(`.cellbtn[data-k="${k}"][data-v="${await idx(k,n)}"]`);
await tap('t1',3);await shot('h-sub');await p.click('[data-a="subpick"][data-v="8"]');await p.waitForTimeout(2800);await shot('h-bound');
await tap('t1',8);await shot('h-back');await A('force');await shot('h-force');await A('close');
await A('undo');await p.waitForTimeout(2800);
await tap('t2',11);await shot('h-libin');await p.click('[data-a="libin"]');await p.waitForTimeout(300);await shot('h-libon');
await A('undo');await p.waitForTimeout(100);
let g=0;while(!(await p.isVisible('.sheet.center'))&&g++<40)await pt('t1');await p.waitForTimeout(850);await A('end');await shot('h-setnext');
await b.close();})();

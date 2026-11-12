const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const D=__dirname;
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1180,height:820}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto('file://'+path.resolve(D,'../../index.html'));
await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v);localStorage.setItem('volleyball-prefs',JSON.stringify({intro:1,hide:1}))},['nanshe-scoresheet-v1',fs.readFileSync(path.join(D,'fix.json'),'utf8')]);
await p.reload();await W(500);
await p.click('.rmain[data-act=open]');await W(400);
const cl=async s=>{await p.click(s,{timeout:5000});await W(300)};
// 第 2 局陣容：B 已填，確認；A 複製第 1 局
await cl('[data-act=lu-lock]');
const tabs=p.locator('[data-act=lutab]');console.log('tabs',await tabs.count());
await tabs.nth(1).click();await W(300);
const cp=p.locator('[data-act=copy]');console.log('copy',await cp.count());
if(await cp.count()){await cp.first().click();await W(300)}
const lk=p.locator('[data-act=lu-lock]');if(await lk.count()){await lk.click();await W(300)}
await cl('[data-act=start]');
const y=p.locator('[data-act=cs-yes]');if(await y.count()){await y.click();await W(500)}
const serve=async()=>{const s=p.locator('[data-act=serve]');if(await s.count()){await s.click();await W(750)}};
const pt=async t=>{await serve();await p.click(`[data-act=point][data-team=${t}]`);await W(750)};
for(const t of ['t2','t1','t1','t2','t1','t1','t2','t1','t2','t2','t1','t1'])await pt(t);
// 一次暫停
await p.click('[data-act=timeout][data-team=t2]');await W(300);await p.click('[data-act=toyes]');await W(400);await p.click('.tbar [data-act=tmend]');await W(400);
for(const t of ['t2','t1'])await pt(t);
const st=await p.evaluate(()=>({sc:document.querySelector('.ss.t1 b')?.innerText+':'+document.querySelector('.ss.t2 b')?.innerText,h1:document.querySelector('h1')?.innerText,ls:localStorage.getItem('nanshe-scoresheet-v1')}));
console.log(st.sc,st.h1);const o=JSON.parse(st.ls);o.currentId=null;fs.writeFileSync(path.join(D,'fix2.json'),JSON.stringify(o));
await b.close()})().catch(e=>{console.log('FAIL',e.message.split('\n')[0]);process.exit(1)});

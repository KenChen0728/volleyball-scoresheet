// 11/11 說明圖「標出舉球員」：手機直式深色，兩隊各標一位舉球員，截球場那一塊
// 用法：node tools/help1111d.js <網址> <輸出 png>（完整版和學校版都能用；學校版沒有發球鍵）
const {chromium}=require('playwright');const flow=require('./flow.js');
const [URL,OUT]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2})).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
const w=(ms=60)=>p.waitForTimeout(ms);
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await w(200);
await flow.start(p,{serve:'t1'});await w(200);
const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
for(const [k,no] of [['t1',5],['t2',8]]){await cell(k,no).click();await w(120);await p.click('.sheet [data-act=pmsetter]');await w(150)}
await p.evaluate(()=>{const l=document.querySelector('.lockline');if(l)l.style.visibility='hidden'}); // 提示字不入鏡
const r=await p.evaluate(()=>{const a=document.querySelector('.wbar').getBoundingClientRect(),c=document.querySelector('.pcourt').getBoundingClientRect();return [Math.min(a.left,c.left),Math.min(a.top,c.top),Math.max(a.right,c.right),Math.max(a.bottom,c.bottom)]});
const pad=8,x=Math.max(0,r[0]-pad),y=Math.max(0,r[1]-pad);
await p.screenshot({path:OUT,clip:{x,y,width:Math.min(400,r[2]+pad)-x,height:Math.min(760,r[3]+pad)-y}});
console.log('setter',OUT,e.join('|')||'no errors');await b.close()})().catch(x=>{console.log('ERR',x.message);process.exit(1)});

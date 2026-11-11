// 11/11 說明圖「修改內容」（更正判罰時的職員按鈕：執行教練 C、教練 AC、領隊 T、管理 M）
// 用法：node tools/help1111c.js <網址> <輸出 png>（完整版和學校版都能用；學校版沒有發球鍵）
const {chromium}=require('playwright');
const [URL,OUT]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2})).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
const w=(ms=60)=>p.waitForTimeout(ms);
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await w(200);
await p.click('.herobtns [data-act=helpopen]');await p.click('[data-act=sample]');await w(150);
await p.locator('.nav [data-v=toss]').click();await p.click('.side.t2');await p.locator('.nav [data-v=lineup]').click();await w(80);
for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=p.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}const k=p.locator('[data-act=lu-lock]');if(await k.count())await k.click()}
await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await w(200);
const point=async t=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await w(700)}await p.click(`[data-act=point][data-team=${t}]`);await w(700)};
for(const t of ['t2','t1','t2','t2','t1','t1'])await point(t);
await p.click('[data-act=penopen]');await w(60);await p.click('[data-act=penteam][data-team=t2]');await w(60);await p.click('[data-act=penkind][data-v=W]');await w(60);await p.click('[data-act=penwho][data-no="6"]');await w(60);await p.click('[data-act=penyes]');await w(200);
await p.click('[data-act=sheetopen]');await w(150);await p.click('[data-act=rtab][data-v=fix]');await w(120);await p.locator('.fixrow').last().click();await w(150);
const r=await p.evaluate(()=>{const x=document.querySelector('.sheet').getBoundingClientRect();return [x.left,x.top,x.right,x.bottom]});
const pad=8,x=Math.max(0,r[0]-pad),y=Math.max(0,r[1]);
await p.screenshot({path:OUT,clip:{x,y,width:Math.min(400,r[2]+pad)-x,height:Math.min(760,r[3]+pad)-y}});
const t=await p.locator('.sheet .stf').innerText();console.log('fix2',OUT,JSON.stringify(t),e.join('|')||'no errors');await b.close()})().catch(x=>{console.log('ERR',x.message);process.exit(1)});

// 11/11 說明圖「改替補、暫停的比分」：手機直式深色，替補那筆的更正視窗（有「當時的比分」兩格）
// 用法：node tools/help1111e.js <網址> <輸出 png>（完整版和學校版都能用；學校版沒有發球鍵）
const {chromium}=require('playwright');const flow=require('./flow.js');
const [URL,OUT]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2})).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
const w=(ms=60)=>p.waitForTimeout(ms);
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await w(200);
await flow.start(p,{serve:'t1'});await w(200);
const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
const point=async t=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await w(700)}await p.click(`[data-act=point][data-team=${t}]`);await w(700)};
for(const t of ['t1','t1','t2','t1','t2'])await point(t);
await cell('t1',5).click();await w(120);if(!(await p.locator('.sheet .pm3 [data-act=pmsubin]').count())){await p.click('.sheet [data-act=pmstep][data-v=sub]');await w(100)}
await p.locator('.sheet [data-act=pmsubin]').first().click();await w(250);const go=p.locator('.kp.bench .go');if(await go.count()){await go.first().click();await w(250)}
await p.click('[data-act=sheetopen]');await w(150);await p.click('[data-act=rtab][data-v=fix]');await w(120);await p.locator('.fixrow').first().click();await w(150);
await p.fill('#amsc0','2');await p.fill('#amsc1','1');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(100);
const r=await p.evaluate(()=>{const x=document.querySelector('.sheet').getBoundingClientRect();return [x.left,x.top,x.right,x.bottom]});
const x=Math.max(0,r[0]-8),y=Math.max(0,r[1]);
await p.screenshot({path:OUT,clip:{x,y,width:Math.min(400,r[2]+8)-x,height:Math.min(760,r[3]+8)-y}});
console.log('fixsc',OUT,e.join('|')||'no errors');await b.close()})().catch(x=>{console.log('ERR',x.message);process.exit(1)});

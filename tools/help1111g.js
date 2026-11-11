// 11/11 晚上 說明圖「改替補、暫停的比分」：手機直式深色，按完替補後下方的提示列（已記錄 3:2、修正比分）
// 用法：node tools/help1111g.js <網址> <輸出 png>（完整版和學校版都能用；學校版沒有發球鍵）
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
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(100);
// 從兩隊的暫停、替補那一列到「判罰、記錄表、其他」那一列
const r=await p.evaluate(()=>{const q=s=>{const x=document.querySelector(s);return x?x.getBoundingClientRect():null};
 const a=q('.tt')||q('.scnote'),z=q('.pbtns')||q('.scnote');return [a.top,z.bottom]});
const y=Math.max(0,r[0]-8),h=Math.min(760,r[1]+8)-y;
await p.screenshot({path:OUT,clip:{x:0,y,width:400,height:h}});
console.log('fixsc',OUT,Math.round(h),e.join('|')||'no errors');await b.close()})().catch(x=>{console.log('ERR',x.message);process.exit(1)});

// 11/11 晚上 說明圖「少用的功能」：手機直式深色，改版後的「其他」（四區分開、先選功能再選隊）
// 用法：node tools/help1111h.js <網址> <輸出 png>（完整版和學校版都能用）
const {chromium}=require('playwright');const flow=require('./flow.js');
const [URL,OUT]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2})).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
const w=(ms=60)=>p.waitForTimeout(ms);
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await w(200);
await flow.start(p,{serve:'t1'});await w(200);
await p.click('[data-act=sheet][data-v=more]');await w(300);
const r=await p.evaluate(()=>{const x=document.querySelector('.sheet').getBoundingClientRect();return [x.top,x.bottom]});
const y=Math.max(0,r[0]-8),h=Math.min(760,r[1])-y;
await p.screenshot({path:OUT,clip:{x:0,y,width:400,height:h}});
console.log('more',OUT,Math.round(h),e.join('|')||'no errors');await b.close()})().catch(x=>{console.log('ERR',x.message);process.exit(1)});

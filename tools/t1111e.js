// 11/11 替補、暫停改比分：只能改成這局打過的比分、同一個位置換回來不能比換下去早（也不能一樣）、暫停改隊時比分跟著換、Enter 送出、復原、CSV
// node tools/t1111e.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:1180,height:820}})).newPage();p.on('pageerror',x=>errs.push(x.message));
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);
await flow.start(p,{serve:'t1'});await W(200);
const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
const point=async t=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}await p.click(`[data-act=point][data-team=${t}]`);await W(700)};
const sub=async(k,no)=>{await cell(k,no).click();await W(120);if(!(await p.locator('.sheet .pm3 [data-act=pmsubin]').count())){await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(100)} // 學校版只有一個人能換時直接寫「換 5 號」
 const c=p.locator('.sheet [data-act=pmsubin]').first();const inNo=Number(await c.getAttribute('data-no'));await c.click();await W(250);
 const go=p.locator('.kp.bench .go');if(await go.count()){await go.first().click();await W(250)}return inNo};
const sheet=async()=>{await p.click('[data-act=sheetopen]');await W(200);await p.click('[data-act=rtab][data-v=fix]');await W(150)};
const back=async()=>{await p.click('[data-act=sheetclose]');await W(200)};
const rows=()=>p.locator('.fixrow').allInnerTexts();
const edit=async(i,a,c,enter)=>{await p.locator('.fixrow').nth(i).click();await W(150);await p.fill('#amsc0',String(a));await p.fill('#amsc1',String(c));if(enter)await p.press('#amsc1','Enter');else await p.click('.sheet [data-act=amendscore]');await W(200)};
const warn=async()=>(await p.locator('.sheet .warning').count())?await p.locator('.sheet .warning').innerText():'';
const close=async()=>{if(await p.locator('.sheet').count()){await p.click('.sheet [data-act=close]');await W(120)}};
// 比分經過：1:0 2:0 2:1 3:1 3:2（藍:橘）
for(const t of ['t1','t1','t2','t1','t2'])await point(t);
const inNo=await sub('t1',5);           // 3:2 換下 5 號
await point('t1');await point('t1');     // 5:2
await p.locator('.wcol .tg button,.tg button',{hasText:'暫停'}).last().click();await W(150);await p.click('[data-act=toyes]');await W(300);
const tc=p.locator('[data-act=tmclose]');if(await tc.count()){await tc.first().click();await W(200)}
await point('t1');                        // 6:2
await sub('t1',inNo);                     // 6:2 換回 5 號
await point('t1');await point('t1');      // 8:2
await sheet();
let r=await rows();ok('rows',r.length===3&&r[0].includes('3:2')&&r[1].includes('2:5')&&r[2].includes('6:2'),r);
// 打開替補那筆：有兩格，預設是現在的比分
await p.locator('.fixrow').nth(0).click();await W(150);
ok('inputs',await p.inputValue('#amsc0')==='3'&&await p.inputValue('#amsc1')==='2');
ok('numeric keyboard',await p.getAttribute('#amsc0','inputmode')==='numeric');await close();
// 沒出現過的比分擋下來
await edit(0,1,2);ok('never happened blocked',(await warn()).includes('這局沒有出現過 1:2'),await warn());
ok('typed kept',await p.inputValue('#amsc0')==='1'&&await p.inputValue('#amsc1')==='2');await close();
await edit(0,9,9);ok('future blocked',(await warn()).includes('沒有出現過'));await close();
await edit(0,'a',2);ok('not number',(await warn()).includes('要填數字'));await close();
// 改成 2:1（打過的）
await edit(0,2,1);ok('saved closes',await p.locator('.sheet').count()===0);r=await rows();ok('row shows 2:1',r[0].includes('2:1'),r);
// 同一個位置：換回來不能比換下去早，換下去不能比換回來晚
await edit(2,2,0);ok('return earlier blocked',(await warn()).includes('換回來的比分不能比換下去的（2:1）還早'),await warn());await close();
await edit(0,7,2);ok('entry later blocked',(await warn()).includes('換下去的比分不能比換回來的（6:2）還晚'),await warn());await close();
await edit(2,2,1);ok('return same blocked',(await warn()).includes('換回來的比分不能和換下去的（2:1）一樣'),await warn());await close();
await edit(0,6,2);ok('entry same blocked',(await warn()).includes('換下去的比分不能和換回來的（6:2）一樣'),await warn());await close();
await edit(2,3,1);r=await rows();ok('return to 3:1 ok',r[2].includes('3:1'),r);
// Enter 送出
await edit(2,4,2,true);r=await rows();ok('enter submits',r[2].includes('4:2'),r);
// 暫停改比分（橘隊在前），再改成藍隊的暫停：比分跟著換成藍隊在前
await edit(1,1,3);r=await rows();ok('timeout 1:3',r[1].includes('1:3'),r);
await p.locator('.fixrow').nth(1).click();await W(150);await p.click('.sheet [data-act=amendto]');await W(200);r=await rows();
ok('timeout team flipped keeps score',r[1].includes('3:1')&&r[1].includes('範例藍隊'),r);
// 記錄表（紙本格式）照改過的寫：替補格、暫停格
if(!SCHOOL){await p.click('[data-act=rtab][data-v=s1]');await W(200);
 const tx=await p.evaluate(()=>[...document.querySelectorAll('.ctv svg text')].map(t=>t.textContent).join(' '));ok('sheet drawn',tx.length>0)}
// 復原：退掉最後一次更正
await back();await p.click('header.bar [data-act=undo]');await W(300);await sheet();r=await rows();ok('undo amend',r[1].includes('1:3')&&r[1].includes('範例橘隊'),r);await back();
const ev=await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));return d.matches.filter(m=>m.id===d.currentId)[0].events.filter(e=>e.type==='AMEND').map(e=>e.data.patch)},KEY);
ok('amend events',ev.some(x=>x.sc&&x.sc.join(':')==='2:1'),ev);
await p.context().close();
// CSV：打完的比賽，更正過的替補比分
{const d=JSON.parse(fs.readFileSync('/tmp/fix1111.json','utf8'));const m=d.matches.filter(x=>x.id==='mdone1')[0];
 const su=m.events.find(e=>e.type==='SUB');
 if(su){m.events.push({id:'mamd1',matchId:'mdone1',seq:0,at:m.events[m.events.length-1].at,device:'scorer-table',type:'AMEND',data:{target:su.id,patch:{sc:[1,0]},note:'test'}});
  const ctx=await b.newContext({viewport:{width:1180,height:820},acceptDownloads:true});const q=await ctx.newPage();q.on('pageerror',x=>errs.push(x.message));
  await q.goto(URL);await q.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(d)]);await q.reload();await W(200);
  await q.click('.herobtns [data-act=history]');await W(120);await q.click('.hrow[data-id=mdone1]');await W(250);
  if(!(await q.locator('.page [data-act=rpcsv]').count())){await q.click('.page [data-act=sheet][data-v=export]');await new Promise(r=>setTimeout(r,250))} // 11/12 完整版的試算表在「存檔／分享」裡
 const [dl]=await Promise.all([q.waitForEvent('download',{timeout:8000}),q.click('[data-act=rpcsv]')]);
  const csv=fs.readFileSync(await dl.path(),'utf8').split('\n').filter(x=>x.includes('替補')&&x.includes(su.data.out+' 換 '+su.data.in));
  const A=(d=>d)(null);ok('csv sub corrected',csv.some(x=>/,(1,0|0,1)\r?$/.test(x)),csv);
  await ctx.close()}else ok('fixture has sub',false)}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'full ')+'pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

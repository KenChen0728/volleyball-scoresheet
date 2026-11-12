// 11/12 補記漏按的暫停、替補：放進時間軸、檢查規則、刪除、復原、確定比賽結束後只能看
// node tools/t1112f.js [網址] [資料 key]（要先 python3 tools/fixture1111.py；第 1 局 25:12，恆春 16:7 暫停、來義 2 換 12 在 7:15）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
const FIX=fs.readFileSync('/tmp/fix1111.json','utf8');
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));const tag=w+' ';
  const evs=()=>p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));return d.matches.filter(m=>m.id===d.currentId)[0].events},KEY);
  await p.goto(URL);await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,FIX]);await p.reload();await W(300);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  // 進行中的那場停在第 2 局陣容：照上一局、鎖好、開始
  await p.locator('.rmain',{hasText:'恆春'}).click();await W(400);
  for(let i=0;i<4;i++){const cp=p.locator('[data-act=copy]');if(await cp.count()){await cp.first().click();await W(250)}const lk=p.locator('[data-act=lu-lock]');if(await lk.count()&&!(await lk.first().isDisabled())){await lk.first().click();await W(250)}if(await p.locator('[data-act=start]').count())break}
  await p.click('[data-act=start]');await W(300);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await W(300)}
  ok(tag+'set 2 playing',await p.locator('[data-act=point]').count()>=1||await p.locator('[data-act=serve]').count()>=1);
  const openFix=async n=>{if(!(await p.locator('.sheettabs').count())){await p.click('[data-act=sheetopen]');await W(300)}await p.click('[data-act=rtab][data-v=fix]');await W(250);await p.click(`[data-act=fixset][data-v="${n}"]`);await W(200)};
  const score=async(a,c)=>{await p.fill('#ins0',a);await p.fill('#ins1',c);await p.click('[data-act=insgo]');await W(250)};
  const warn=async()=>(await p.locator('.sheet .warning').allInnerTexts()).join('|');
  await openFix(1);
  ok(tag+'add button',await p.locator('[data-act=insopen]').count()===1);
  // 1. 補恆春的暫停在 5:2
  await p.click('[data-act=insopen]');await W(250);
  ok(tag+'sheet title',(await p.locator('.sheet h2').innerText()).includes('補記第 1 局'));
  await p.click('.sheet [data-act=insteam][data-team=t1]');await W(150);await p.click('.sheet [data-act=inskind][data-v=T]');await W(150);
  await score('30','1');ok(tag+'score not in set',(await warn()).includes('沒有出現過'),await warn());
  await score('25','12');ok(tag+'last point',(await warn()).includes('最後一分'),await warn());
  await score('5','2');
  ok(tag+'timeout saved',await p.locator('.sheet').count()===0&&(await p.locator('.fixdone').innerText()).includes('已補記'),await p.locator('.fixdone').count()&&await p.locator('.fixdone').innerText());
  const tRows=await p.locator('.fixrow.t1',{hasText:'暫停'}).allInnerTexts();
  ok(tag+'two t1 timeouts',tRows.length===2&&tRows.some(t=>t.includes('5:2'))&&tRows.some(t=>t.includes('16:7')),tRows);
  let ev=await evs();const last=ev[ev.length-1];
  ok(tag+'amend ins event',last.type==='AMEND'&&last.data.ins&&last.data.ins.type==='TIMEOUT'&&last.data.ins.data.team==='t1');
  // 順序：5:2 的暫停排在 16:7 前面
  const order=await p.locator('.fixrow').allInnerTexts();
  ok(tag+'timeline order',order.findIndex(t=>t.includes('5:2'))<order.findIndex(t=>t.includes('16:7')),order);
  // 2. 再補一次恆春暫停：會變 3 次
  await p.click('[data-act=insopen]');await W(250);await p.click('.sheet [data-act=insteam][data-team=t1]');await W(120);await p.click('.sheet [data-act=inskind][data-v=T]');await W(120);
  await score('6','3');ok(tag+'third timeout refused',(await warn()).includes('最多 2 次'),await warn());
  await p.click('.sheet [data-act=close]');await W(200);
  // 3. 補來義的替補在 5:10：位置二 2 號換人，後面 7:15 那次 2 換 12 會不合規則
  await p.click('[data-act=insopen]');await W(250);await p.click('.sheet [data-act=insteam][data-team=t2]');await W(120);await p.click('.sheet [data-act=inskind][data-v=S]');await W(120);
  await score('5','10');
  ok(tag+'court grid',await p.locator('.sheet .insgrid button').count()===6);
  const grid=await p.locator('.sheet .insgrid button').allInnerTexts();
  await p.click('.sheet [data-act=insout][data-v="1"]');await W(150);
  const ins=await p.locator('.sheet [data-act=insin]').allInnerTexts();
  ok(tag+'bench options',ins.length>0,ins);
  await p.locator('.sheet [data-act=insin]').first().click();await W(120);
  await p.click('.sheet [data-act=insdo]');await W(300);
  ok(tag+'later sub conflict',(await warn()).includes('7:15')&&(await warn()).includes('2 換 12'),await warn());
  // 換位置四的人就可以
  const g3=grid[3].replace(/\D+/g,' ').trim();
  await p.click('.sheet [data-act=insout][data-v="3"]');await W(150);
  const in3=(await p.locator('.sheet [data-act=insin]').allInnerTexts()).map(t=>t.trim());
  const pick=in3.filter(t=>t!=='12')[0];
  await p.locator('.sheet [data-act=insin]',{hasText:pick}).first().click();await W(120);
  await p.click('.sheet [data-act=insdo]');await W(300);
  ok(tag+'sub saved',await p.locator('.sheet').count()===0,await warn());
  const sRows=await p.locator('.fixrow.t2',{hasText:'替補'}).allInnerTexts();
  ok(tag+'sub row',sRows.some(t=>t.includes('換 '+pick)&&t.includes('5:10')),[sRows,pick,g3]);
  // 4. 刪掉補的暫停
  await p.locator('.fixrow.t1',{hasText:'5:2'}).click();await W(250);
  await p.click('.sheet [data-act=amendask]');await W(150);await p.click('.sheet [data-act=amenddel]');await W(300);
  ok(tag+'deleted inserted timeout',await p.locator('.fixrow.t1',{hasText:'5:2'}).count()===0&&await p.locator('.fixrow.t1',{hasText:'暫停'}).count()===1);
  // 5. 復原：補的替補拿掉
  await p.click('[data-act=sheetclose]');await W(300);
  await p.click('[data-act=undo]');await W(300);
  if(await p.locator('.sheet [data-act=undoyes]').count()){await p.click('.sheet [data-act=undoyes]');await W(300)}
  await p.click('[data-act=undo]');await W(300);
  if(await p.locator('.sheet [data-act=undoyes]').count()){await p.click('.sheet [data-act=undoyes]');await W(300)}
  await openFix(1);
  ok(tag+'undo removed inserted sub',(await p.locator('.fixrow.t2',{hasText:'5:10'}).count())===0,await p.locator('.fixrow').allInnerTexts());
  // 6. 打完的比賽：更正只能看
  await p.evaluate(([k,v])=>{localStorage.setItem(k,v);sessionStorage.clear()},[KEY,FIX]);await p.reload();await W(300);
  if(await ab.count()){await ab.first().click();await W(200)}
  if(await p.locator('.bar [data-act=home]').count()){await p.click('.bar [data-act=home]');await W(200)}
  await p.click('.herobtns [data-act=history]');await W(250);await p.locator('.hrow[data-id=mdone1]').click();await W(400);
  await p.click('[data-act=rtab][data-v=fix]');await W(250);
  ok(tag+'done: locked note',(await p.locator('.narrow').innerText()).includes('比賽已經確定結束'));
  const dc=[0,0,0,0];
  for(const n of [1,2,3]){const sb=p.locator(`[data-act=fixset][data-v="${n}"]`);if(!(await sb.count()))continue;await sb.click();await W(150);
    dc[0]+=await p.locator('[data-act=insopen]').count();dc[1]+=await p.locator('button.fixrow').count();dc[2]+=await p.locator('div.fixrow').count();dc[3]+=await p.locator('[data-act=amendopen]').count()}
  ok(tag+'done: no add, rows not buttons',dc[0]===0&&dc[1]===0&&dc[2]>0&&dc[3]===0,dc);
  ok(tag+'done: times disabled',await p.locator('.fixtimes input').evaluateAll(a=>a.length>0&&a.every(e=>e.disabled)));
  await p.context().close();
}
console.log('t1112f pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

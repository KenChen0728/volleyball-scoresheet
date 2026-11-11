// 11/11 晚上「修正比分」兩個新入口和改完的回饋
// 按完替補（點球員、替補面板）或暫停：下方提示列寫「已記錄 3:2」和「修正比分」，暫停計時中寫在計時列裡；到下一球開始、或那一筆被復原就收起來
// 「其他」→「修正比分」：帶出這局最後一筆、可以換一筆、「‹ 返回」回到其他、這局沒有時寫出來
// 改完：比賽畫面提示字、更正清單上方寫「已修正：… 3:2 → 3:1」、那一筆加框；下一次點東西就收掉
// node tools/t1111g.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[1180,820],[390,844]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
const tag=w+'x'+h+' ';
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);
await flow.start(p,{serve:'t1'});await W(200);
// 練習資料每隊場下只有一位：橘隊多加兩位，才能在替補面板一次換兩組
await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0];
 m.events.splice(1,0,...[21,22].map(no=>({id:'tadd'+no,matchId:m.id,seq:0,at:e0.at,device:e0.device,type:'PLAYER_ADDED',data:{team:'t2',no}})));localStorage.setItem(k,JSON.stringify(d))},KEY);
await p.reload();await W(250);
const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
const serve=async()=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}};
const point=async t=>{await serve();await p.click(`[data-act=point][data-team=${t}]`);await W(700)};
const sub=async(k,no)=>{await cell(k,no).click();await W(120);if(!(await p.locator('.sheet .pm3 [data-act=pmsubin]').count())){await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(100)}
 const c=p.locator('.sheet [data-act=pmsubin]').first();const inNo=Number(await c.getAttribute('data-no'));await c.click();await W(250);
 const go=p.locator('.kp.bench .go');if(await go.count()){await go.first().click();await W(250)}return inNo};
const note=async()=>(await p.locator('.scnote').count())?(await p.locator('.scnote').innerText()).replace(/\s+/g,' '):'';
const tbar=async()=>(await p.locator('.tbar').count())?(await p.locator('.tbar').innerText()).replace(/\s+/g,' '):'';
const lock=async()=>(await p.locator('.lockline').count())?await p.locator('.lockline').first().innerText():'';
const warn=async()=>(await p.locator('.sheet .warning').count())?await p.locator('.sheet .warning').innerText():'';
const fill=async(a,c,enter)=>{await p.fill('#amsc0',String(a));await p.fill('#amsc1',String(c));if(enter)await p.press('#amsc1','Enter');else await p.click('.sheet [data-act=amendscore]');await W(250)};
const ev=async()=>p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));return d.matches.filter(m=>m.id===d.currentId)[0].events},KEY);
const more=async()=>{await p.click('[data-act=sheet][data-v=more]');await W(200)};

// 這局還沒有暫停或替補：「其他」→「修正比分」寫出來
await more();ok(tag+'more has 修正比分',await p.locator('.sheet [data-act=scfixpick]').innerText()==='修正比分');
await p.click('.sheet [data-act=scfixpick]');await W(200);
ok(tag+'empty set note',(await p.locator('.sheet').innerText()).includes('還沒有暫停或替補'));
ok(tag+'empty no inputs',await p.locator('#amsc0').count()===0);
ok(tag+'back button',await p.locator('.sheet [data-act=sheetback]').count()===1);
await p.click('.sheet [data-act=sheetback]');await W(150);ok(tag+'back to more',await p.locator('.sheet [data-act=scfixpick]').count()===1);
await p.click('.sheet [data-act=close]');await W(150);
ok(tag+'no note at start',await p.locator('.scnote').count()===0);

// 比分經過：1:0 2:0 2:1 3:1 3:2（藍:橘）
for(const t of ['t1','t1','t2','t1','t2'])await point(t);
// 點球員替補：提示列
const in1=await sub('t1',5);
let nt=await note();ok(tag+'note after sub',nt.includes('替補 5 換 '+in1)&&nt.includes('已記錄 3:2')&&nt.includes('修正比分'),nt);
ok(tag+'old toast gone',!(await lock()).includes('號換'),await lock());
// 點「修正比分」：只改這一筆，預設現在的比分
await p.click('.scnote [data-act=scfix]');await W(200);
ok(tag+'dialog title',(await p.locator('.sheet h2').innerText())==='修正比分');
ok(tag+'dialog who',(await p.locator('.sheet .scwho').innerText()).includes('替補 5 換 '+in1));
ok(tag+'prefilled',await p.inputValue('#amsc0')==='3'&&await p.inputValue('#amsc1')==='2');
ok(tag+'score only',await p.locator('.sheet [data-act=amendask],.sheet [data-act=amendin],.sheet .fixlist').count()===0);
ok(tag+'button label',(await p.locator('.sheet [data-act=amendscore]').innerText())==='修正比分');
await fill(9,9);ok(tag+'never happened blocked',(await warn()).includes('沒有出現過'),await warn());
ok(tag+'dialog stays',await p.locator('.sheet h2').count()===1);
await fill(2,1,true); // Enter 送出
ok(tag+'saved closes',await p.locator('.sheet').count()===0);
ok(tag+'toast from-to',(await lock()).includes('已修正')&&(await lock()).includes('3:2 → 2:1'),await lock());
nt=await note();ok(tag+'note updated',nt.includes('已記錄 2:1'),nt);
// 復原退掉更正，提示列回到 3:2；再復原退掉替補，提示列收起來
await p.click('header.bar [data-act=undo]');await W(300);nt=await note();ok(tag+'undo amend',nt.includes('已記錄 3:2'),nt);
await p.click('header.bar [data-act=undo]');await W(300);ok(tag+'undo sub hides note',await p.locator('.scnote').count()===0);
// 再替補一次，下一球開始就收起來
const in2=await sub('t1',5);ok(tag+'note again',(await note()).includes('5 換 '+in2));
if(!SCHOOL){await p.click('[data-act=serve]');await W(700);ok(tag+'hidden at serve',await p.locator('.scnote').count()===0);
 await p.click('[data-act=replay]');await W(700);ok(tag+'stays hidden after replay',await p.locator('.scnote').count()===0)}
await point('t1');ok(tag+'hidden after point',await p.locator('.scnote').count()===0); // 4:2
// 暫停：計時列照原本的樣子，不放修正比分，計時結束後也沒有提示列（使用者 23:42：暫停不用）
await p.locator('.wcol .tg button,.tg button',{hasText:'暫停'}).last().click();await W(150);await p.click('[data-act=toyes]');await W(300);
let tb=await tbar();ok(tag+'timer bar plain',tb.includes('暫停')&&!tb.includes('修正比分')&&!tb.includes('已記錄'),tb);
ok(tag+'no note for timeout',await p.locator('.scnote').count()===0);
await p.click('.tbar [data-act=tmend]');await W(200);ok(tag+'no note after timer',await p.locator('.scnote').count()===0);
// 暫停的比分從「其他」→「修正比分」改：先列出這局的暫停和替補，點那一筆才出現比分格子
await more();await p.click('.sheet [data-act=scfixpick]');await W(200);
ok(tag+'list first, no inputs',await p.locator('#amsc0').count()===0&&await p.locator('.sheet .fixlist .fixrow').count()===2);
await p.locator('.sheet .fixrow',{hasText:'暫停'}).click();await W(200);
ok(tag+'list hidden after pick',await p.locator('.sheet .fixlist').count()===0);
ok(tag+'timeout via more',(await p.locator('.sheet .scwho').innerText()).includes('暫停')&&await p.inputValue('#amsc0')==='2'&&await p.inputValue('#amsc1')==='4');
await fill(1,3);ok(tag+'timeout fixed toast',(await lock()).includes('2:4 → 1:3'),await lock());
// 替補面板一次換兩組：一起改
await p.click('[data-act=subopen][data-team=t2]');await W(150);
const pick2=async pos=>{await p.locator(`.pcourt .pc.t2[data-pos="${pos}"]`).click();await W(80);await p.locator('.kp.bench [data-act=subin]:enabled').first().click();await W(150)};
await pick2(4);await pick2(3);await p.click('[data-act=subclose]');await W(800);
nt=await note();ok(tag+'batch note',/替補 \d+ 換 \d+、\d+ 換 \d+/.test(nt)&&nt.includes('已記錄 2:4'),nt);
await p.click('.scnote [data-act=scfix]');await W(200);ok(tag+'batch who',/、/.test(await p.locator('.sheet .scwho').innerText()));
await fill(1,3);
let es=await ev();const am=es.filter(e=>e.type==='AMEND'&&e.data.patch&&e.data.patch.sc&&e.data.patch.sc.join(':')==='1:3');
ok(tag+'batch two amends',am.length===3,am.length); // 暫停 1 筆 + 兩組替補
nt=await note();ok(tag+'batch note updated',nt.includes('已記錄 1:3'),nt);
// 「其他」→「修正比分」：第一步只有清單，點一筆 → 只顯示那一筆和比分格子；「‹ 返回」回清單、再返回回到其他
await more();await p.click('.sheet [data-act=scfixpick]');await W(200);
const rows=await p.locator('.sheet .fixlist .fixrow').allInnerTexts();
ok(tag+'pick list',rows.length===4,rows); // 5 號那組、暫停、面板的兩組（復原的那筆不算）
ok(tag+'pick list no inputs',await p.locator('#amsc0').count()===0);
ok(tag+'pick list back to more',await p.locator('.sheet>.sheetback[data-act=sheetback]').count()===1);
await p.locator('.sheet .fixrow').last().click();await W(200);
ok(tag+'pick shows one',await p.locator('.sheet .fixlist').count()===0&&await p.inputValue('#amsc0')==='1'&&await p.inputValue('#amsc1')==='3');
ok(tag+'pick step back btn',await p.locator('.sheet>.sheetback[data-act=scback]').count()===1&&await p.locator('.sheet>.sheetback').count()===1);
await p.click('.sheet [data-act=scback]');await W(150);ok(tag+'step back to list',await p.locator('.sheet .fixlist .fixrow').count()===4&&await p.locator('#amsc0').count()===0);
await p.locator('.sheet .fixrow').first().click();await W(150);await p.keyboard.press('Escape');await W(150);ok(tag+'esc back to list',await p.locator('.sheet .fixlist').count()===1);
await p.keyboard.press('Escape');await W(150);ok(tag+'esc back to more',await p.locator('.sheet [data-act=scfixpick]').count()===1);
await p.click('.sheet [data-act=scfixpick]');await W(200);
await p.locator('.sheet .fixrow').first().click();await W(200);
ok(tag+'pick switch',await p.inputValue('#amsc0')==='3'&&await p.inputValue('#amsc1')==='2');
await fill(3,1);ok(tag+'pick saved closes',await p.locator('.sheet').count()===0);
ok(tag+'pick toast',(await lock()).includes('3:2 → 3:1'),await lock());
// 沒改也寫出來
await more();await p.click('.sheet [data-act=scfixpick]');await W(200);await p.locator('.sheet .fixrow').last().click();await W(200);await fill(1,3);ok(tag+'unchanged told',(await lock()).includes('比分沒有改'),await lock());
// 記錄表 → 更正：改完寫在清單上方，那一筆加框；點別的就收掉
await p.click('[data-act=sheetopen]');await W(200);await p.click('[data-act=rtab][data-v=fix]');await W(150);
await p.locator('.fixrow').first().click();await W(150);await fill(2,1);
ok(tag+'fix list message',(await p.locator('.fixdone').innerText()).includes('3:1 → 2:1'),await p.locator('.fixdone').count());
ok(tag+'fix row marked',await p.locator('.fixrow.just').count()===1&&(await p.locator('.fixrow').first().getAttribute('class')).includes('just'));
await p.click('[data-act=rtab][data-v=res]');await W(150);await p.click('[data-act=rtab][data-v=fix]');await W(150);
ok(tag+'message cleared',await p.locator('.fixdone').count()===0&&await p.locator('.fixrow.just').count()===0);
// 其他更正也寫出來（暫停改成另一隊）
const ti=(await p.locator('.fixrow').allInnerTexts()).findIndex(x=>x.includes('暫停'));
await p.locator('.fixrow').nth(ti).click();await W(150);await p.click('.sheet [data-act=amendto]');await W(250);
ok(tag+'other amend message',(await p.locator('.fixdone').innerText()).includes('已更正')&&(await p.locator('.fixdone').innerText()).includes('暫停改為'),await p.locator('.fixdone').count());
await p.click('[data-act=sheetclose]');await W(200);
// 球在進行中也能從「其他」修正比分（寬畫面才看得到按鈕）
if(!SCHOOL&&w>=1000){await p.click('[data-act=serve]');await W(700);await more();await p.click('.sheet [data-act=scfixpick]');await W(200);
 await p.locator('.sheet .fixrow').first().click();await W(200);ok(tag+'live pick works',await p.locator('#amsc0').count()===1);await p.click('.sheet [data-act=close]');await W(150);
 ok(tag+'no note during live',await p.locator('.scnote').count()===0)}
await p.context().close()}

// 各尺寸：提示列、計時列不會被球場蓋住，按鈕在畫面內
const sizes=[[360,640],[375,667],[390,844],[430,932],[768,1024],[1024,768],[844,390],[667,375],[740,360],[932,430],[1180,820],[1366,768],[1280,800],[1920,1080]];
for(const [w,h] of sizes){const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
 await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);await flow.start(p,{serve:'t1'});await W(200);
 const serve=async()=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}};
 for(const t of ['t1','t2']){await serve();await p.click(`[data-act=point][data-team=${t}]`);await W(700)}
 // 另一隊暫停（計時列）中，這隊又替補（提示列）：兩條同時出現，最擠的情況
 await p.locator('[data-act=timeout][data-team=t2]').first().click();await W(150);await p.click('[data-act=toyes]');await W(300);
 const c=p.locator(`.pcourt .pc.t1`).filter({has:p.locator('b',{hasText:/^5$/})});await c.click();await W(120);
 if(!(await p.locator('.sheet .pm3 [data-act=pmsubin]').count())){await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(100)}
 await p.locator('.sheet [data-act=pmsubin]').first().click();await W(250);const go=p.locator('.kp.bench .go');if(await go.count()){await go.first().click();await W(250)}
 const r=await p.evaluate(()=>{const R=e=>{const x=e.getBoundingClientRect();return {t:x.top,b:x.bottom,l:x.left,r:x.right}};
  const court=document.querySelector('.pcourt'),bars=[...document.querySelectorAll('.tbar,.scnote')].map(R),btns=[...document.querySelectorAll('.tbar button,.scnote button,[data-act=serve],[data-act=point],.pbtns button')].map(R);
  return {court:R(court),bars,btns,vw:innerWidth,vh:innerHeight}});
 const tag=w+'x'+h+' ';
 ok(tag+'bars shown',r.bars.length===2,r.bars.length);
 ok(tag+'court not over bars',r.bars.every(x=>x.t>=r.court.b-1),{court:r.court,bars:r.bars});
 ok(tag+'buttons on screen',r.btns.every(x=>x.b<=r.vh+1&&x.t>=0&&x.r<=r.vw+1&&x.l>=-1),r.btns.filter(x=>x.b>r.vh+1||x.r>r.vw+1));
 await p.screenshot({path:`/tmp/t1111g-${SCHOOL?'school':'full'}-${w}x${h}.png`});
 await p.context().close()}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'full ')+'pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

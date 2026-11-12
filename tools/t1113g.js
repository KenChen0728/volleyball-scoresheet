// 11/13 第 20 項：截說明圖時發現的小問題，和使用說明的分組、圖
// - 陣容填滿 6 格後「確認這張陣容單」在矮的手機看得到（以前被下方步驟列蓋住）
// - 球在進行中按「復原」退掉得分，「已復原」的提示字看得到（完整版）
// - 局結束視窗改的時間，畫面重畫後還在；按「確定」存的是改過的
// - 使用說明：每組 3～5 張（裁判 2 張例外）、每張都有圖；「更正」分頁按問號打開「更正」那一組（完整版）
// node tools/t1113g.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},...o});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}return [ctx,p]};
const vis=async p=>p.evaluate(()=>{const l=document.querySelector('[data-act=lu-lock]'),g=document.querySelector('main.page');if(!l||!g)return null;const a=l.getBoundingClientRect(),c=g.getBoundingClientRect();return [Math.round(a.top),Math.round(a.bottom),Math.round(c.top),Math.round(c.bottom)]});

// 1. 陣容填滿後確認鈕看得到（兩隊都試）
for(const [w,h] of [[360,640],[375,667],[400,760],[402,874]]){
  const [ctx,p]=await open(w,h,{hasTouch:true,isMobile:true});const tag=w+'x'+h+' ';
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(250);
  await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();await W(250);
  for(const n of [1,3,5,7,9,11]){await p.locator(`[data-act=fill][data-no="${n}"]`).dispatchEvent('click');await W(80)}await W(250);
  let r=await vis(p);ok(tag+'A lock button visible',r&&r[1]<=r[3]&&r[0]>=r[2],r);
  await p.locator('[data-act=lu-lock]').dispatchEvent('click');await W(250);
  for(const n of [2,4,6,8,10,14]){await p.locator(`[data-act=fill][data-no="${n}"]`).dispatchEvent('click');await W(80)}await W(250);
  r=await vis(p);ok(tag+'B lock button visible',r&&r[1]<=r[3]&&r[0]>=r[2],r);
  await ctx.close();
}

// 2. 球在進行中復原：提示字浮在上面（學校版沒有發球，不會有這種情況）
if(!SCHOOL){
  const [ctx,p]=await open(400,760);await flow.start(p,{serve:'t1'});await W(300);
  for(const k of ['t1','t2']){await p.click('[data-act=serve]');await W(450);await p.click(`[data-act=point][data-team=${k}]`);await W(450)}
  await p.click('.bar [data-act=undo]');await W(250);
  ok('undo point: ball live again',await p.locator('.zone.islive').count()===1);
  const ft=await p.locator('.ftoast').innerText().catch(()=>'');ok('live undo toast shows',ft.includes('已復原'),ft);
  const fb=await p.locator('.ftoast').boundingBox();ok('toast inside screen',!!fb&&fb.y>=0&&fb.y+fb.height<=760,fb);
  await W(4600);ok('toast gone after 3.5 s',await p.locator('.ftoast').count()===0);
  // 死球時照舊寫在提示列，不另外浮
  await p.click('[data-act=point][data-team=t2]');await W(600);
  await p.click('[data-act=timeout][data-team=t1]');await W(200);await p.click('[data-act=toyes]');await W(200);await p.click('[data-act=tmend]');await W(200);
  await p.click('.bar [data-act=undo]');await W(250);
  ok('dead-ball undo in lockline',(await p.locator('.zone .lockline').innerText()).includes('已復原'));
  ok('dead-ball undo no float',await p.locator('.ftoast').count()===0);
  await ctx.close();
}

// 3. 局結束視窗改的時間，重畫後還在
{
  const [ctx,p]=await open(400,760);await flow.start(p,{serve:'t1'});await W(300);
  await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0],T=Date.now()-20*60000;
    for(let j=0;j<24;j++){const at=new Date(T+j*20000).toISOString();m.events.push({id:'ts'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'SERVE',data:{set:1}});m.events.push({id:'tp'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'POINT',data:{set:1,team:'t1'}})}
    localStorage.setItem(k,JSON.stringify(d))},KEY);
  await p.reload();await W(500);
  if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(450)}
  await p.click('[data-act=point][data-team=t1]');await W(150);
  ok('set end window',await p.locator('.sheet.setend').count()===1);
  await p.fill('#se-st','09:00');await p.fill('#se-en','09:24');
  await W(1400); // 最後一分後 0.7、1 秒會重畫一次（按鈕先鎖 1 秒）
  ok('edits kept after re-render',(await p.inputValue('#se-st'))==='09:00'&&(await p.inputValue('#se-en'))==='09:24',[await p.inputValue('#se-st'),await p.inputValue('#se-en')]);
  ok('duration follows edits',(await p.locator('#sedur').innerText()).includes('24'),await p.locator('#sedur').innerText());
  await p.click('.sheet.setend [data-act=endok]');await W(400);
  const info=await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0];const o={};m.events.filter(e=>e.type==='INFO_SET').forEach(e=>{o[e.data.field]=e.data.value});return o},KEY);
  ok('saved start',info.actual==='09:00',info);ok('saved end',info.en1==='09:24',info);
  await ctx.close();
}

// 4. 使用說明：分組和圖
{
  const [ctx,p]=await open(400,760);
  await p.click('.herobtns [data-act=helpopen]');await W(250);
  const gs=await p.locator('[data-act=helpgroup]').evaluateAll(x=>x.map(e=>e.getAttribute('data-v')));
  ok('help groups',gs.length===(SCHOOL?17:19)&&gs.includes('rare')&&(SCHOOL||(gs.includes('fix')&&gs.includes('libero')&&gs.includes('sheet'))),gs);
  for(const g of gs){
    await p.click(`[data-act=helpgroup][data-v=${g}]`);await W(250);
    const n=await p.locator('.hslide').count();ok('cards '+g,(n>=3&&n<=5)||(g==='refs'&&n===2),n);
    const imgs=await p.evaluate(async()=>{const a=[...document.querySelectorAll('.hslide')].map(s=>s.querySelector('img'));
      await Promise.all(a.filter(Boolean).map(i=>i.decode().catch(()=>{})));return a.map(i=>i?i.naturalWidth:0)});
    ok('every card has an image '+g,imgs.every(x=>x>0),imgs);
    await p.click('[data-act=helpmenu]');await W(200);
  }
  if(!SCHOOL){
    await p.click('[data-act=helpgroup][data-v=rare]');await W(250);ok('rare has rotation card',(await p.locator('.hslide').nth(1).innerText()).includes('輪轉錯誤'));
    await p.click('[data-act=helpmenu]');await W(200);
  }
  await p.click('[data-act=helpclose]');await W(200);
  if(SCHOOL){
    await flow.start(p,{serve:'t1'});await W(300);
    await p.click('[data-act=sheetopen]');await W(300);await p.click('[data-act=rtab][data-v=fix]');await W(300);
    await p.click('.bar [data-act=helpopen]');await W(300);ok('school help on fix tab opens 比賽紀錄',(await p.locator('.help .hhead').innerText()).includes('比賽紀錄'),await p.locator('.help .hhead').innerText());
  }else{
    await flow.start(p,{serve:'t1'});await W(300);
    await p.click('[data-act=sheetopen]');await W(300);await p.click('[data-act=rtab][data-v=fix]');await W(300);
    await p.click('.bar [data-act=helpopen]');await W(300);ok('help on fix tab opens 更正',(await p.locator('.help .hhead').innerText()).includes('更正'),await p.locator('.help .hhead').innerText());
    await p.click('[data-act=helpclose]');await W(200);
    await p.click('[data-act=rtab][data-v=s1]');await W(300);
    await p.click('.bar [data-act=helpopen]');await W(300);ok('help on sets tab opens 記錄表',(await p.locator('.help .hhead').innerText()).includes('記錄表'),await p.locator('.help .hhead').innerText());
  }
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);
await b.close();console.log('t1113g',SCHOOL?'school':'full',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

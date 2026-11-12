// 11/13 第 19 項：逐頁細修（步驟列還不能按的說原因、開賽後比賽資料寫原因、每局分數設定寫原因、挑邊內容放中間）
// node tools/t1113f.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[402,874],[1180,820]]){
  const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));const tag=w+' ';
  const ab=p.locator('.sheet.about [data-act=aboutclose]');
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);if(await ab.count()){await ab.first().click();await W(200)}
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  // 還沒挑邊：陣容、比賽灰掉，點了說原因
  const lu=p.locator('.nav [data-v=lineup]');
  ok(tag+'lineup step dim',await lu.getAttribute('aria-disabled')==='true'&&(await lu.getAttribute('class')||'').includes('dim'));
  await lu.click({force:true});await W(250);ok(tag+'lineup why toast',(await p.locator('.ftoast').innerText().catch(()=>'')).includes('先挑邊'),await p.locator('.ftoast').innerText().catch(()=>''));
  ok(tag+'still not on lineup',await p.locator('[data-act=lu-lock]').count()===0);
  await p.locator('.nav [data-v=play]').click({force:true});await W(250);ok(tag+'play why toast',(await p.locator('.ftoast').innerText().catch(()=>'')).includes('開始比賽'));
  // 挑邊：內容放中間
  await p.locator('.nav [data-v=toss]').click();await W(250);
  ok(tag+'toss centered',await p.locator('.page>.stephint.vc').count()===1);
  const tb=await p.locator('.toss').boundingBox(),pb=await p.locator('.page').boundingBox();ok(tag+'toss not stuck at top',tb.y-pb.y>40||pb.height<tb.height+200,[tb,pb]);
  // 開賽後：比賽資料寫原因、每局分數設定寫原因
  await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);if(await ab.count()){await ab.first().click();await W(200)}
  await flow.start(p,{serve:'t1'});await W(300);
  await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0],T=Date.now()-20*60000;
    for(let j=0;j<25;j++){const at=new Date(T+j*20000).toISOString();m.events.push({id:'ts'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'SERVE',data:{set:1}});m.events.push({id:'tp'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'POINT',data:{set:1,team:'t1'}})}
    localStorage.setItem(k,JSON.stringify(d))},KEY);
  await p.reload();await W(500);if(await ab.count()){await ab.first().click();await W(200)}
  await W(900);if(await p.locator('.sheet.setend [data-act=endok]').count()){await p.click('.sheet.setend [data-act=endok]');await W(300)}
  await p.click('.foot [data-act=endset]');await W(400);
  await p.locator('.nav [data-v=info]').click();await W(250);
  ok(tag+'info locked note',(await p.locator('.page .note').first().innerText()).includes('已開局，比賽資料不能再修改'));
  await p.click('[data-act=sheet][data-v=points]');await W(200);ok(tag+'points note',(await p.locator('.sheet').innerText()).includes('已經開始的局不能改'));
  await p.click('.sheet [data-act=close]');await W(150);
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);
await b.close();console.log('t1113f',SCHOOL?'school':'full',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

// 11/13 第 11 項：比賽中手機轉橫，整個畫面變成這一局的記錄表（只能看），轉回直的繼續記錄；可以關掉
// node tools/t1113e.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2，只確認不會出現）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
  const ctx=await b.newContext({viewport:{width:874,height:402},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  const ab=p.locator('.sheet.about [data-act=aboutclose]');const closeAbout=async()=>{if(await ab.count()){await ab.first().click();await W(200)}};
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);await closeAbout();
  await flow.start(p,{serve:'t1'});await W(400);
  const land=p.locator('.land');
  if(SCHOOL){ok('school: no landscape sheet',await land.count()===0);}
  else{
    ok('landscape shows sheet',await land.count()===1&&await p.locator('.land .ctv-set svg').count()===1);
    const bar=await p.locator('.landbar').innerText();ok('bar text',bar.includes('第 1 局')&&bar.includes('0 : 0')&&bar.includes('轉回直的就能繼續記錄'),bar);
    const sv=await p.locator('.land svg').boundingBox();ok('sheet fills width',sv&&sv.width>=800&&sv.height<=402,sv);
    const cov=await p.evaluate(()=>{const b=document.querySelector('[data-act=serve],[data-act=point]');if(!b)return 'nobtn';const r=b.getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(e&&e.closest('.land'))});
    ok('play buttons covered',cov===true,cov);
    // 轉回直的
    await p.setViewportSize({width:402,height:874});await W(400);
    ok('portrait: no sheet',await land.count()===0&&await p.locator('[data-act=serve]').isVisible());
    await p.click('[data-act=serve]');await W(700);await p.click('[data-act=point][data-team=t1]');await W(700);
    await p.setViewportSize({width:874,height:402});await W(400);
    ok('landscape again',await land.count()===1&&(await p.locator('.landbar').innerText()).includes('1 : 0')||(await p.locator('.landbar').innerText()).includes('0 : 1'),await p.locator('.landbar').innerText());
    // 關掉
    await p.click('.land [data-act=landoff]');await W(300);
    ok('off: play page',await land.count()===0);
    ok('off toast',(await p.locator('.toast').innerText().catch(()=>'')).includes('照常記錄'));
    await p.setViewportSize({width:402,height:874});await W(300);await p.setViewportSize({width:874,height:402});await W(300);
    ok('off stays off',await land.count()===0);
    await p.reload();await W(500);await closeAbout();ok('off after reload',await land.count()===0);
    // 其他 → 設定 → 手機轉橫
    await p.click('[data-v=more]');await W(250);
    ok('setting row',(await p.locator('.sheet').last().innerText()).includes('手機轉橫'));
    ok('setting off pressed',await p.locator('.sheet [data-act=landpref][data-v=off][aria-pressed=true]').count()===1);
    await p.click('.sheet [data-act=landpref][data-v=on]');await W(300);ok('on again',await land.count()===1);
    // 局打完還沒確定：轉橫也看得到這一局（含局末的線）
    await p.setViewportSize({width:402,height:874});await W(300);if(await p.locator('.sheet [data-act=close]').count()){await p.click('.sheet [data-act=close]');await W(200)}
    await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0],T=Date.now()-20*60000;
      for(let j=0;j<24;j++){const at=new Date(T+j*20000).toISOString();m.events.push({id:'ts'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'SERVE',data:{set:1}});m.events.push({id:'tp'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'POINT',data:{set:1,team:'t2'}})}
      localStorage.setItem(k,JSON.stringify(d))},KEY);
    await p.reload();await W(500);await closeAbout();
    if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}
    await p.click('[data-act=point][data-team=t2]');await W(800);
    ok('set end window',await p.locator('.sheet.setend').count()===1);
    await p.setViewportSize({width:874,height:402});await W(400);
    ok('pending: landscape sheet',await land.count()===1&&(await p.locator('.landbar').innerText()).includes('25'),await p.locator('.landbar').innerText().catch(()=>''));
    await p.setViewportSize({width:402,height:874});await W(400);ok('window still there',await p.locator('.sheet.setend').count()===1&&await land.count()===0);
    await ctx.close();
    // 電腦把視窗拉成很矮很寬（不是觸控）：不會出現
    const c2=await b.newContext({viewport:{width:874,height:402}});const q=await c2.newPage();q.on('pageerror',x=>errs.push(x.message));
    await q.goto(URL);await q.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await q.reload();await W(350);
    const ab2=q.locator('.sheet.about [data-act=aboutclose]');if(await ab2.count()){await ab2.first().click();await W(200)}
    await flow.start(q,{serve:'t1'});await W(400);ok('desktop short window: no sheet',await q.locator('.land').count()===0);
    await c2.close();
  }
  ok('no page errors',errs.length===0,errs);
  await b.close();console.log('t1113e',SCHOOL?'school':'full',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

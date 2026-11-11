// 11/12 替補時點到另一隊：另一隊的格子變灰不能點；另一隊閃的自由球員點了是換回，不會選到替補這隊的人
// node tools/t1112b.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);
  await flow.start(p,{serve:'t1'});await W(300);
  // 一般情況：t1 替補時 t2 的格子變灰、不能點
  await p.click('[data-act=subopen][data-team=t1]');await W(400);
  const t2=await p.locator('.pcourt .pc.t2').evaluateAll(a=>a.map(e=>({dis:e.disabled,dim:e.classList.contains('dim')})));
  ok(tag+'other team disabled and grey',t2.length===6&&t2.every(x=>x.dis&&x.dim),t2);
  const t1=await p.locator('.pcourt .pc.t1').evaluateAll(a=>a.map(e=>e.disabled));
  ok(tag+'own team tappable',t1.every(x=>!x),t1);
  await p.click('[data-act=subcancel]');await W(900);
  ok(tag+'after cancel enabled again',(await p.locator('.pcourt .pc.t2').evaluateAll(a=>a.every(e=>!e.disabled&&!e.classList.contains('dim')))));
  const hasLib=await p.locator('.lc.t2[data-act=libcell]').count()>0;
  if(hasLib){
    // t2 自由球員換進後排 V，t2 得分輪轉 → 自由球員到前排閃
    await p.click('.pcourt [data-act=pcell][data-team=t2][data-v="4"]');await W(300);
    await p.locator('.sheet .pmb').filter({hasText:'換自由'}).click();await W(300);
    const pl=p.locator('.sheet [data-act=pmlin]');if(await pl.count()){await pl.first().click();await W(300)}
    await p.click('[data-act=serve]');await W(800);await p.click('[data-act=point][data-team=t2]');await W(800);
    ok(tag+'t2 libero flashing',await p.locator('.pcourt .pc.t2.bad').count()===1);
    await p.click('[data-act=subopen][data-team=t1]');await W(400);
    const bad=p.locator('.pcourt .pc.t2.bad');
    ok(tag+'flashing libero still tappable',await bad.isEnabled());
    ok(tag+'other t2 cells disabled',(await p.locator('.pcourt .pc.t2:not(.bad)').evaluateAll(a=>a.every(e=>e.disabled&&e.classList.contains('dim')))));
    await bad.click();await W(500);
    const sel=await p.locator('.pcourt .pc.t1.sel').count();
    ok(tag+'no wrong selection on t1',sel===0,sel);
    ok(tag+'t2 libero swapped back',await p.locator('.pcourt .pc.t2.bad').count()===0);
    ok(tag+'bench still open',await p.locator('.kp.bench').count()===1);
    // 替補照常：點 t1 場上的人、點號碼、完成
    await p.click('.pcourt [data-act=pcell][data-team=t1][data-v="4"]');await W(300);
    ok(tag+'t1 select works',await p.locator('.pcourt .pc.t1.sel').count()===1);
    const chip=p.locator('.kp.bench [data-act=subin]:enabled').first();
    if(await chip.count()){await chip.click();await W(300);const go=p.locator('.kp.bench .go');if(await go.count()){await go.click();await W(500)}}
    const note=(await p.locator('.scnote').count())?await p.locator('.scnote').innerText():'';
    ok(tag+'sub done',/替補\s*\d+\s*換\s*\d+/.test(note),note);
  }
  await p.context().close();
}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'')+'t1112b pass',pass,'fail',fail);
await b.close()})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

// 11/28 晚：上方重排＋提醒教練
module.exports=async({R,V,pt,ok,W,shot})=>{
  const fp=require('./t1128-fp.js')(R,W);
  await fp.to('t1',12);await shot('top');
  ok('no remind at start',await V.locator('.wrem').count()===0);
  const to=async k=>{await R.click(`[data-act=timeout][data-team=${k}]`);await W(300);await R.click('[data-act=toyes]');await W(400);await R.click('[data-act=tmend]').catch(()=>{});await W(300)};
  await to('t2');await W(800);ok('no remind after 1st timeout',await V.locator('.wrem').count()===0);
  await fp.to('t1',13);await to('t2');await W(1200);await shot('remind');
  ok('remind shown after 2nd timeout',await V.locator('.wrem').count()===1);
  ok('remind text',/暫停 2 次（用完）/.test(await V.locator('.wrem').innerText().catch(()=>'')));
  const sv=R.locator('[data-act=serve]');if(await sv.count())await sv.click();await W(1200);
  ok('remind hidden after serve',await V.locator('.wrem').count()===0);
};

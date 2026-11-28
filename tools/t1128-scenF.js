module.exports=async({R,V,pt,ok,W,shot})=>{
  const fp=require('./t1128-fp.js')(R,W);
  await fp.to('t1',12);await R.click('[data-act=timeout][data-team=t2]');await W(300);await R.click('[data-act=toyes]');await W(1500);await shot('F1-play');
  await V.click('[data-act=wside][data-v=r1]');await shot('F2-r1');await V.click('[data-act=wside][data-v=r2]');
  await R.click('[data-act=tmend]').catch(()=>{});
  await fp.to('t1',25);await W(800);await R.click('[data-act=endok]');await W(500);await R.click('[data-act=endset]');await W(1500);await shot('F3-break');
  for(let i=0;i<2;i++){await R.click('[data-act=copy]');await W(200);await R.click('[data-act=lu-lock]');await W(300)}
  await R.click('[data-act=start]');await W(400);const y=R.locator('[data-act=cs-yes]');if(await y.count())await y.click();await W(600);
  await fp.to('t1',25);await W(1200);await shot('F4-pending');
  await R.click('[data-act=endok]');await W(400);await R.click('[data-act=endset]');await W(600);const yy=R.locator('.sheet .primary');if(await yy.count())await yy.first().click();await W(1500);await shot('F5-final');
};

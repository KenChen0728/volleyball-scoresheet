// 11/28 Gemini 修改：觀看畫面暫停條固定位置（球場不跳）、提醒教練在下方
module.exports=async({R,V,ok,W,shot})=>{
  const fp=require('./t1128-fp.js')(R,W);await fp.to('t1',3);await W(600);
  const top=async()=>V.evaluate(()=>Math.round(document.querySelector('.wview .pcourt').getBoundingClientRect().top));
  const t0=await top();await shot('noto');
  const to=async k=>{await R.click(`[data-act=timeout][data-team=${k}]`);await W(300);await R.click('[data-act=toyes]');await W(1200)};
  await to('t2');const t1=await top();await shot('to1');ok('court does not move when timeout starts',t0===t1,[t0,t1]);
  await R.click('[data-act=tmend]').catch(()=>{});await W(1000);const t2=await top();ok('court does not move when timeout ends',t0===t2,[t0,t2]);
  await fp.to('t1',4);await to('t2');await W(800);await shot('remind');
  const r=await V.evaluate(()=>{const a=document.querySelector('.wrem'),s=document.querySelector('.wsc');if(!a||!s)return null;const ra=a.getBoundingClientRect(),rs=s.getBoundingClientRect();return {remTop:Math.round(ra.top),scoreBottom:Math.round(rs.bottom),vh:innerHeight,remBottom:Math.round(ra.bottom)}});
  ok('remind does not cover score',r&&r.remTop>r.scoreBottom,r);ok('remind inside screen',r&&r.remBottom<=r.vh,r);
};

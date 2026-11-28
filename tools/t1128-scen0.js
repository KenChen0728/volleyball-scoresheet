module.exports=async({R,V,pt,ok,W,shot})=>{
  const fp=require('./t1128-fp.js')(R,W);await fp.to('t1',12);
  await R.click('[data-act=timeout][data-team=t2]');await W(300);await R.click('[data-act=toyes]');await W(1500);await shot('to');
  const m=await V.evaluate(()=>{const r=document.querySelector('.wview').getBoundingClientRect(),o=[];document.querySelectorAll('.wview *').forEach(e=>{const b=e.getBoundingClientRect();if(b.right>innerWidth+1||b.bottom>innerHeight+1)o.push(e.className+':'+Math.round(b.right)+','+Math.round(b.bottom))});return {h:Math.round(r.bottom),ih:innerHeight,over:o.slice(0,5)}});console.log(JSON.stringify(m));
};

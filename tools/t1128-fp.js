module.exports=(R,W)=>{
 const fp=async k=>{for(let t=0;t<30;t++){const sv=R.locator('[data-act=serve]'),p=R.locator(`[data-act=point][data-team=${k}]`);
   if(await p.count()){await p.click({timeout:3000}).catch(()=>{});await W(250);return}
   if(await sv.count()){await sv.click({timeout:3000}).catch(()=>{});await W(250);continue}
   await W(150)}};
 fp.to=async(k,n)=>{for(let i=0;i<120;i++){const sc=await R.evaluate(k=>{const e=document.querySelector('.ss.'+k+' b,.wcol.'+k+' .wscore');return e?+e.textContent:-1},k);if(sc>=n||sc<0)return;
   if(!(await R.locator('[data-act=point],[data-act=serve]').count()))return;await fp(k)}};
 return fp};

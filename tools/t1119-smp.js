// 11/19 首頁的練習比賽可以刪除（tools/patch_v104.py）
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
(async()=>{const b=await chromium.launch();
  for(const vp of [{width:360,height:640},{width:820,height:1180}]){
  const ctx=await b.newContext({viewport:vp,hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('[data-act=helpopen]').first().click();await W(300);await p.locator('[data-act=sample]').first().click();await W(400);await p.locator('.barback').first().click();await W(400);
  const T=vp.width+' ';
  ok(T+'practice card has restart and delete',await p.locator('.rrow.smp [data-act=del-ask]:not([data-v])').count()===1&&await p.locator('.rrow.smp [data-act=del-ask][data-v=smpdel]').count()===1);
  const ov=await p.evaluate(()=>{const s=document.querySelector('.rrow.smp strong').getBoundingClientRect(),r=document.querySelector('.rcdels').getBoundingClientRect(),t=document.createRange();const st=document.querySelector('.rrow.smp strong');t.selectNodeContents(st);const tr=t.getBoundingClientRect();return {txtRight:tr.right,btnLeft:r.left,rowRight:document.querySelector('.rrow.smp').getBoundingClientRect().right,btnRight:r.right}});
  ok(T+'title not under buttons',ov.txtRight<=ov.btnLeft+1&&ov.btnRight<=ov.rowRight,ov);
  if(SHOT)await p.screenshot({path:SHOT+'/smp-'+vp.width+'.png'});
  await p.click('[data-act=del-ask][data-v=smpdel]');await W(200);
  ok(T+'asks delete practice',/刪除這場練習？/.test(await p.locator('.rrow.ask').innerText()));
  await p.click('[data-act=del-no]');await W(200);
  await p.click('[data-act=del-ask]:not([data-v])');await W(200);ok(T+'restart ask unchanged',/重新開始練習？/.test(await p.locator('.rrow.ask').innerText()));
  await p.click('[data-act=del-no]');await W(200);
  await p.click('[data-act=del-ask][data-v=smpdel]');await W(200);await p.click('.rrow.ask [data-act=del-yes]');await W(300);
  ok(T+'practice gone',await p.locator('.rrow.smp').count()===0&&!/範例藍隊 對/.test(await p.locator('body').innerText()));
  const d=await p.evaluate(()=>{const k=Object.keys(localStorage).find(k=>{try{return Array.isArray(JSON.parse(localStorage.getItem(k)).matches)}catch(e){return false}});const d=JSON.parse(localStorage.getItem(k));return {m:d.matches.length,t:(d.trash||[]).length}});
  ok(T+'not kept anywhere',d.m===0,d);
  await p.locator('[data-act=helpopen]').first().click();await W(300);await p.locator('[data-act=sample]').first().click();await W(300);ok(T+'can start practice again',await p.locator('.barback').count()>0);
  await ctx.close()}
  ok('no page errors',!errs.length,errs);
  console.log('t1119-smp',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

// 11/20 朋友回報：同一次死球裡剛換上的人又被換下（9 換 18、18 換 9）。剛換過的位置要打完一球才能再換（tools/patch_v123.py）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count())await a.first().click();
  await flow.start(p,{serve:'t1'});await W(300);
  await p.click('[data-act=subopen][data-team=t1]');await W(250);
  const cell=p.locator('.pcourt .pc.t1').nth(0);const before=(await cell.innerText()).replace(/\D/g,' ').trim().split(/\s+/).pop();
  await cell.click();await W(200);await p.locator('.kp [data-act=subin]').first().click();await W(300);
  ok('first pair made',await p.locator('.kp .subpair').count()===1);
  await p.locator('.pcourt .pc.t1').nth(0).click();await W(250);const kt=await p.locator('.kp').innerText();
  ok('same position cannot be swapped back in same interruption',await p.locator('.kp [data-act=subin]:not([disabled])').count()===0&&/剛換上/.test(kt),kt.slice(0,300));
  ok('starter not offered from bench',!(await p.locator('.kp [data-act=subbench]:not([disabled])').allInnerTexts()).map(x=>x.trim()).includes(before));
  await p.locator('.kp .go').first().click();await W(400);
  ok('one sub counted',/替補 1/.test(await p.locator('main').innerText()));
  // 打完一球後可以換回
  for(let k=0;k<4&&!await p.locator('[data-act=point][data-team=t1]').count();k++){await W(800);await p.locator('[data-act=serve]').click().catch(()=>{});await W(800)}
  await p.click('[data-act=point][data-team=t1]');await W(1600);
  await p.click('[data-act=subopen][data-team=t1]');await W(250);await p.locator('.pcourt .pc.t1').nth(0).click();await W(250);
  ok('after a rally the starter can come back',(await p.locator('.kp [data-act=subin]:not([disabled])').allInnerTexts()).map(x=>x.trim()).includes(before),await p.locator('.kp').innerText());
  ok('no page errors',!errs.length,errs);
  console.log('t1120-sub',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

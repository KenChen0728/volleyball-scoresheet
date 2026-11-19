// 11/20 第一批正式版（tools/patch_nosync.py）：連線功能的入口都藏起來，其他照常
const {chromium}=require('playwright');const flow=require('./flow.js');const W=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8781/next/index.html';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
(async()=>{const b=await chromium.launch();const errs=[],reqs=[];
  for(const vp of [{width:390,height:844},{width:844,height:390},{width:1180,height:820}]){
  const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>reqs.push(r.url()));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(500);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  const T=vp.width+'x'+vp.height+' ';
  ok(T+'no share/watch on home',await p.locator('[data-act=shareopen]:visible,[data-act=watchopen]:visible,.landshare:visible').count()===0);
  ok(T+'main buttons still there',await p.locator('.herocta:visible').count()===1&&await p.locator('.herobtns [data-act=history]:visible').count()===1&&await p.locator('.herobtns [data-act=helpopen]:visible').count()===1);
  // 主畫面按鈕沒有疊到、沒有超出
  const lay=await p.evaluate(()=>{const bs=[...document.querySelectorAll('.herobtns button')].filter(x=>x.offsetParent);return {n:bs.length,w:document.documentElement.scrollWidth<=innerWidth+1,ov:bs.some(x=>{const r=x.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t&&!x.contains(t)&&r.top>=0&&r.bottom<=innerHeight})}});
  ok(T+'hero buttons layout',lay.n===2&&lay.w&&!lay.ov,lay);
  if(vp.width===390){
    await p.goto(URL+'?watch=ABC123');await W(800);const a2=p.locator('.sheet.about [data-act=aboutclose]');if(await a2.count()){await a2.first().click();await W(200)}
    ok('watch link ignored',await p.locator('.watch').count()===0&&await p.locator('.sheet').count()===0&&await p.locator('.home').count()===1);
    await p.click('.herobtns [data-act=helpopen]');await W(300);
    ok('help has no share group',!(await p.locator('.hmenu').innerText()).includes('分享和觀看'));
    await p.click('[data-act=helpclose]');await W(200);
    await flow.start(p,{serve:'t1'});await W(300);
    await p.click('[data-act=sheet][data-v=more]');await W(300);
    const mt=await p.locator('.sheet').innerText();
    ok('match more sheet has no share',!/分享比賽/.test(mt)&&await p.locator('.sheet [data-act=syncopen]').count()===0,mt.slice(0,300));
    ok('more sheet still has other tools',/離開這場比賽/.test(mt));
  }
  await ctx.close()}
  ok('firebase never loaded',!reqs.some(u=>/gstatic\.com\/firebasejs|firebaseio|googleapis/.test(u)),reqs.filter(u=>/gstatic|firebase|googleapis/.test(u)).slice(0,3));
  ok('no page errors',!errs.length,errs);
  console.log('t1120-nosync',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

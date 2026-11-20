// 11/19 首頁：今天的賽程、賽事資料夾、開始前準備（tools/patch_v108.py）；平板橫放右邊不再空著
const {scDate,scTime,scGet}=require('./scpick.js');
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const tab=async(pg,v)=>{const t=pg.locator('[data-act=cuptab][data-v='+v+']');if(await t.count()){await t.click();await W(200)}};
const todayS=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
(async()=>{const b=await chromium.launch();
  for(const [vp,tag] of [[{width:1180,height:820},'t'],[{width:390,height:844},'p']]){
  const ctx=await b.newContext({viewport:vp,hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  const T=tag+' ';
  ok(T+'getting started when empty',await p.locator('.hsteps').count()===1);
  if(SHOT)await p.screenshot({path:SHOT+'/home-empty-'+tag+'.png'});
  await p.click('.hsteps [data-act=cupcreate]');await W(300);await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(400);
  await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);await p.fill('#ct-text','男子組球員名單\n範例藍隊\n王小明1\n範例橘隊\n李小美3');await p.click('[data-act=cupteamsave]');await W(300);
  await tab(p,'sched');await p.click('[data-act=scnew]');await W(300);await scDate(p,todayS());await scTime(p,'08:30');await p.fill('#sc-court','室內場 B');
  await p.locator('.sheet [data-act=scpick]').nth(0).click();await W(120);await p.locator('.sheet [data-act=scpick]').nth(1).click();await W(120);
  await p.click('[data-act=scsave1][data-v=next]');await W(300);await p.fill('#sc-court','室內場 A');await p.click('[data-act=scsave1]:not([data-v])');await W(300);
  await p.click('.barback');await W(300);await p.locator('[data-act=home]').first().click();await W(400);
  ok(T+'no getting started once folder exists',await p.locator('.hsteps').count()===0);
  ok(T+'today schedule on home',/今天的賽程/.test(await p.locator('body').innerText())&&await p.locator('.home [data-act=hscopen]').count()===2);
  ok(T+'no folder cards when schedule exists',await p.locator('.home .cupcard').count()===0);
  await p.click('.hcourtbtn');await W(300);ok(T+'court picker popup',await p.locator('.sheet [data-act=hcourt]').count()===3&&/這台記錄哪個場地/.test(await p.locator('.sheet').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/home-picker-'+tag+'.png'});
  await p.click('.sheet [data-act=hcourt][data-v="室內場 B"]');await W(300);ok(T+'filter by court',await p.locator('.sheet').count()===0&&await p.locator('.home [data-act=hscopen]').count()===1&&/場地：室內場 B/.test(await p.locator('.hcourtbtn').innerText()));
  await p.reload();await W(500);ok(T+'court remembered',await p.locator('.home [data-act=hscopen]').count()===1&&/室內場 B/.test(await p.locator('.hcourtbtn').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/home-court-'+tag+'.png'});
  await p.click('.hcourtbtn');await W(300);await p.click('.sheet [data-act=hcourt][data-v=""]');await W(300);
  if(SHOT)await p.screenshot({path:SHOT+'/home-full-'+tag+'.png'});
  if(tag==='t'){const r=await p.evaluate(()=>{const h=document.querySelector('.hero').getBoundingClientRect(),s=document.querySelector('[data-act=hscopen]').getBoundingClientRect();return {heroRight:h.right,rowLeft:s.left,rowTop:s.top}});
    ok(T+'schedule sits in right column',r.rowLeft>=r.heroRight-1&&r.rowTop<500,r)}
  await p.click('.home [data-act=cupopen][data-from=home]');await W(300);
  ok(T+'all schedule opens folder on schedule tab',await p.locator('[data-act=cuptab][data-v=sched][aria-selected=true]').count()===1&&/主畫面/.test(await p.locator('.barback').innerText()));
  await p.click('.barback');await W(300);ok(T+'back goes home',await p.locator('.home').count()===1);
  await p.locator('.home [data-act=hscopen]').first().click();await W(300);
  ok(T+'tap opens the match sheet first',/男子組第 1 場/.test(await p.locator('.sheet').innerText())&&await p.locator('.sheet [data-act=scgo][data-from=start]').count()===1);
  await p.keyboard.press('Escape');await W(200);ok(T+'esc closes, still home',await p.locator('.sheet').count()===0&&await p.locator('.home').count()===1);
  await p.locator('.home [data-act=hscopen]').first().click();await W(300);await p.click('.sheet [data-act=scgo]');await W(500);
  ok(T+'started to roster',await p.locator('.num[data-kind=reg]').count()>0);
  await p.locator('.barback').first().click();await W(400);
  ok(T+'back goes home, live + remaining schedule',await p.locator('.home').count()===1&&/進行中/.test(await p.locator('body').innerText())&&await p.locator('.home [data-act=hscopen]').count()===1);
  await ctx.close()}
  ok('no page errors',!errs.length,errs);
  console.log('t1119-home',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

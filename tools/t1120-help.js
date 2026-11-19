// 11/20 使用說明：新主題都有圖、資料夾頁的問號開賽事資料夾那組、分享和觀看那組（tools/patch_v116.py）
const {chromium}=require('playwright');const W=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHARE=process.argv[3]!=='noshare',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear()});await p.reload();await W(400);const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.click('.herobtns [data-act=helpopen]');await W(300);
  const groups=await p.locator('.hmenu [data-act=helpgroup] strong').allInnerTexts();
  ok('menu has 賽事資料夾',groups.includes('賽事資料夾'),groups);
  ok('share group '+(SHARE?'present':'absent'),groups.includes('分享和觀看')===SHARE,groups);
  // 每一組每一張都有圖
  const ids=await p.locator('.hmenu [data-act=helpgroup]').evaluateAll(es=>es.map(e=>e.getAttribute('data-v')));
  let noimg=[],old=[];
  for(const g of ids){await p.click('.hmenu [data-act=helpgroup][data-v='+g+']').catch(async()=>{await p.click('[data-act=helpmenu]');await W(150);await p.click('.hmenu [data-act=helpgroup][data-v='+g+']')});await W(200);
    const r=await p.evaluate(g=>[...document.querySelectorAll('.help .hslide')].map(x=>({g,t:x.querySelector('h2').textContent,d:x.querySelector('.htxt').textContent,img:!!x.querySelector('.himg img')})),g);
    r.forEach(x=>{if(!x.img)noimg.push(x.g+':'+x.t);if(/紀錄與名單/.test(x.d))old.push(x.g+':'+x.t)});
    await p.click('[data-act=helpmenu]');await W(150)}
  ok('every card has an image',!noimg.length,noimg);
  ok('no old name in help text',!old.length,old);
  await p.click('[data-act=helpclose]');await W(200);
  // 資料夾頁的問號
  await p.click('.herobtns [data-act=history]');await W(300);await p.click('[data-act=cupcreate]');await W(300);await p.locator('.sheet input[type=text]').first().fill('範例盃');await p.locator('.sheet .primary').first().click();await W(400);
  await p.click('[data-act=helpopen]');await W(300);ok('cup page help opens folder group',/新增資料夾/.test(await p.locator('.help').innerText()));
  if(SHOT){await p.click('#hnext');await W(400);await p.click('#hnext');await W(500);await p.screenshot({path:SHOT+'/help-card.png'})}
  ok('no page errors',!errs.length,errs);
  console.log('t1120-help',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

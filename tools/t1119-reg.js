// 11/19 賽前登錄單：資料夾賽程「印登錄單」，A4 橫式 PDF 一場一張，加印空白的（tools/patch_v106.py）
// 虛構的隊名和姓名（真實資料不進 git）
const {scDate,scTime,scGet,scTbd}=require('./scpick.js');
const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];const Y=new Date().getFullYear();
const tab=async(pg,v)=>{const t=pg.locator('[data-act=cuptab][data-v='+v+']');if(await t.count()){await t.click();await W(200)}};
const pdfInfo=f=>{const t=fs.readFileSync(f).toString('latin1');const m=/\/Type\/Pages\/Count (\d+)/.exec(t);return {head:t.slice(0,5),count:m?+m[1]:0,a4:(t.match(/MediaBox\[0 0 842 595\]/g)||[]).length}};
(async()=>{const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(500);
  // 沒有賽程也能印空白的
  await tab(p,'sched');await p.click('[data-act=scprint]');await W(300);
  ok('no schedule: blank 1 by default',/還沒有比賽/.test(await p.locator('.sheet').innerText())&&/預覽（1 張）/.test(await p.locator('.sheet [data-act=scpgo]').innerText()));
  await p.click('.sheet [data-act=close]');await W(200);
  await tab(p,'teams');await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  await p.fill('#ct-text','女子組球員名單\n範例藍隊\n王小明1\n陳大文2\n範例橘隊\n李小美3\n林小華4');await p.click('[data-act=cupteamsave]');await W(400);
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  const pick=async n=>{await p.locator('.sheet [data-act=scpick]').filter({hasText:new RegExp('^\\s*'+n)}).first().click();await W(150)};
  await tab(p,'sched');await p.click('[data-act=scnew]');await W(300);await scDate(p,Y+'-12-05');await scTime(p,'08:30');await p.fill('#sc-court','室內場 A');await pick('範例藍隊');await pick('範例橘隊');
  await p.click('[data-act=scsave1][data-v=next]');await W(300);await scTbd(p);await p.fill('#sc-n1','A組第一');await scTbd(p);await p.fill('#sc-n2','B組第二');await p.click('[data-act=scsave1]:not([data-v])');await W(300);
  // 第一場開始記錄，回來印
  await p.locator('[data-act=scopen]').first().click();await W(200);await p.click('[data-act=scgo]');await W(500);await p.click('[data-act=cupback]');await W(300);
  await p.click('[data-act=scprint]');await W(300);
  const sh=await p.locator('.sheet').innerText();
  ok('lists schedule',/女子組第 1 場/.test(sh)&&/女子組第 2 場/.test(sh)&&/已開始/.test(sh),sh.slice(0,400));
  ok('unstarted preselected',await p.locator('.sheet [data-act=scptog][aria-pressed=true]').count()===1);
  await p.locator('.sheet [data-act=scptog]').first().click();await W(150);
  ok('toggle adds',/預覽（2 張）/.test(await p.locator('.sheet [data-act=scpgo]').innerText()));
  await p.click('.sheet [data-act=scpb][data-v="1"]');await W(150);
  ok('blank stepper',/預覽（3 張）/.test(await p.locator('.sheet [data-act=scpgo]').innerText())&&/1 張/.test(await p.locator('.regstep').innerText()));
  await p.click('.sheet [data-act=scpall]');await W(150);ok('select none',/（1 張/.test(await p.locator('.sheet [data-act=scpgo]').innerText()));
  await p.click('.sheet [data-act=scpall]');await W(150);ok('select all',/（3 張/.test(await p.locator('.sheet [data-act=scpgo]').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/reg-sheet.png'});
  await p.click('.sheet [data-act=scpgo]');await p.waitForSelector('.regprev img',{timeout:30000});await W(300);
  ok('preview 3 pages',await p.locator('.regprev img').count()===3&&/預覽（3 張）/.test(await p.locator('.sheet h2').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/reg-prev.png'});
  const pv=await p.evaluate(()=>{const i=document.querySelector('.regprev img');return {w:i.naturalWidth,h:i.naturalHeight,cw:i.clientWidth}});ok('preview image landscape',pv.w>pv.h&&pv.cw>200,pv);
  // 11/21：下面「‹ 第 1／3 張 ›」；點圖全螢幕、兩指放大、換張
  ok('page bar',/第 1／3 張/.test(await p.locator('#regpn').innerText())&&await p.locator('.sheet .rgpbar [data-d="-1"]').isDisabled());
  await p.click('.sheet .rgpbar [data-d="1"]');await W(700);ok('arrow scrolls strip',/第 2／3 張/.test(await p.locator('#regpn').innerText()),await p.locator('#regpn').innerText());
  await p.locator('.regimg').nth(1).click();await W(300);ok('fullscreen opens on page 2',await p.locator('.rgv').count()===1&&/第 2／3 張/.test(await p.locator('#rgfpn').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/reg-full.png'});
  await p.click('.rgv [data-act=rgz][data-v="1"]');await W(200);ok('zoom 150%',/150%/.test(await p.locator('.rgv .whbar').innerText())&&await p.evaluate(()=>document.querySelector('.rgv .whin').getBoundingClientRect().width>innerWidth*1.4));
  await p.click('.rgv [data-act=rgpg][data-d="1"]');await W(200);ok('next page resets zoom',/第 3／3 張/.test(await p.locator('#rgfpn').innerText())&&/100%/.test(await p.locator('.rgv .whbar').innerText()));
  // 兩指放大（模擬兩隻手指）
  const cdp=await ctx.newCDPSession(p);const tp=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  await tp('touchStart',[[150,400],[240,400]]);for(const d of [60,90,120]){await tp('touchMove',[[195-d,400],[195+d,400]]);await W(40)}await tp('touchEnd',[]);await W(200);
  const pz=await p.locator('.rgv .whbar span').innerText();ok('pinch zoom',parseInt(pz)>200,pz);
  await tp('touchStart',[[300,400]]);await tp('touchMove',[[100,410]]);await tp('touchEnd',[]);await W(200);ok('no page swipe while zoomed',/第 3／3 張/.test(await p.locator('#rgfpn').innerText()));
  await p.click('.rgv [data-act=rgz][data-v="-1"]');await p.click('.rgv [data-act=rgz][data-v="-1"]');await p.click('.rgv [data-act=rgz][data-v="-1"]').catch(()=>{});await W(200);
  for(let i=0;i<4;i++)if(!/100%/.test(await p.locator('.rgv .whbar').innerText())){await p.click('.rgv [data-act=rgz][data-v="-1"]').catch(()=>{});await W(120)}
  await tp('touchStart',[[100,400]]);await tp('touchMove',[[200,402]]);await tp('touchMove',[[300,404]]);await tp('touchEnd',[]);await W(250);ok('swipe changes page',/第 2／3 張/.test(await p.locator('#rgfpn').innerText()),await p.locator('#rgfpn').innerText());
  await p.keyboard.press('Escape');await W(200);ok('Esc closes fullscreen only',await p.locator('.rgv').count()===0&&await p.locator('.regprev').count()===1);
  await p.click('.sheet [data-act=scpback]');await W(200);ok('back to list',await p.locator('.sheet [data-act=scptog]').count()===2);
  await p.click('.sheet [data-act=scpgo]');await p.waitForSelector('.regprev img',{timeout:30000});await W(200);
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.click('.sheet [data-act=scpsave]')]);
  const F='/tmp/t1119-reg.pdf';await dl.saveAs(F);const pi=pdfInfo(F);
  ok('pdf 3 pages A4 landscape',pi.head==='%PDF-'&&pi.count===3&&pi.a4===3,pi);
  const xm=await p.locator('#xpmsg').innerText();ok('no long explanations',!/A4 橫式，一場一張|排名賽|分享選單/.test(await p.locator('.sheet').innerText()));ok('file name',/登錄單_測試盃_\d{4}-\d{2}-\d{2}_3張\.pdf/.test(xm),xm); // 測試環境的下載名稱一律是 download，看畫面上的訊息
  if(SHOT){execSync('pdftoppm -r 110 -png '+F+' '+SHOT+'/reg-page');}
  ok('no page errors',!errs.length,errs);
  console.log('t1119-reg',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

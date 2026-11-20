// 檢查 mk-ranktest.js 做的「積分測試盃」：在預覽版匯入，比賽都讀得到、比分對、積分表名次照預期
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8781/next/index.html',F=process.argv[3]||'/home/claude/out/積分測試盃.json',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count())await a.first().click();
  await p.locator('text=/賽事與紀錄/').first().click();await W(400);await p.setInputFiles('#import-file',F);await W(500);
  const plan=await p.locator('.sheet').innerText();ok('import plan',/比賽：新增 12 場/.test(plan)&&/賽程新增 15 場/.test(plan)&&/新增 11 隊/.test(plan),plan);
  await p.click('[data-act=impgo]');await W(500);await p.locator('.sheet [data-act=close]').first().click().catch(()=>{});await W(200);
  await p.locator('[data-act=cupopen]').first().click();await W(400);
  const tabs=await p.locator('.cuptabs').innerText();ok('tabs counts',/賽程\s*15/.test(tabs)&&/積分\s*12/.test(tabs)&&/隊伍\s*11/.test(tabs),tabs);
  const rowsets=await p.locator('.scsets').allInnerTexts();ok('12 finished rows show set scores',rowsets.length===12,rowsets);
  await p.click('[data-act=cuptab][data-v=rank]');await W(300);
  const read=async()=>p.locator('.rksec').evaluateAll(ss=>ss.map(s=>({h:s.querySelector('h2').innerText,n:s.querySelector('.shead .muted').innerText,rows:[...s.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(c=>c.innerText.replace(/\s+/g,' ').trim()))})));
  await p.click('[data-act=cupdiv][data-v=男子組]');await W(300);let R=await read();
  const order=t=>t.rows.map(r=>r[0]+r[1].split(' ')[0]).join(' ');
  ok('men order',R.length===1&&order(R[0])==='1山貓隊 2海豚隊 3雪豹隊 4飛鷹隊'&&/打完 6／6 場/.test(R[0].n),R);
  ok('men 山貓 = 海豚 numbers',R[0].rows[0].slice(2).join()===R[0].rows[1].slice(2).join(),R[0].rows.slice(0,2));
  console.log(JSON.stringify(R[0].rows));
  if(SHOT)await p.screenshot({path:SHOT+'/men.png',fullPage:true});
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);R=await read();
  ok('women two groups',R.map(x=>x.h).join()==='A 組,B 組',R.map(x=>x.h));
  ok('women A order and played count',order(R[0])==='1黑鳶隊 2藍鵲隊 3白鷺隊 4綠繡眼隊'&&/打完 3／4 場/.test(R[0].n),R[0]);
  ok('women B three-way draw',R[1].rows.every(r=>r[0]==='1'&&/需抽籤/.test(r[1]))&&/打完 3／3 場/.test(R[1].n),R[1]);
  console.log(JSON.stringify(R[0].rows));console.log(JSON.stringify(R[1].rows));
  if(SHOT)await p.screenshot({path:SHOT+'/women.png',fullPage:true});
  // 清單 B8：綠繡眼對白鷺，白鷺賽前沒收 → A 組名次 黑鳶、藍鵲、綠繡眼、白鷺
  await p.click('[data-act=cuptab][data-v=sched]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]').catch(()=>{});await W(200);
  await p.locator('[data-act=scopen]:has-text("綠繡眼隊"):has-text("白鷺隊")').first().click();await W(300);await p.click('.sheet [data-act=scgo]');await W(600);
  await p.locator('.nav [data-v=toss]').click();await W(400);const tossOk=await p.locator('[data-act=sheet][data-v=pf]').count();
  ok('toss page reachable without roster (pre-match forfeit button)',tossOk===1,await p.locator('main').innerText().then(t=>t.slice(0,200)));
  if(tossOk){await p.click('[data-act=sheet][data-v=pf]');await W(300);await p.click('.sheet [data-act=pfreason][data-v=逾時未出賽]');await p.locator('.sheet [data-act=pfwin]',{hasText:'綠繡眼隊'}).click();await W(150);await p.click('.sheet [data-act=pfdo]');await W(500);
    await p.locator('.barback,[data-act=cupback]').first().click().catch(()=>{});await W(400);
    if(!await p.locator('[data-act=cuptab]').count()){await p.locator('text=/賽事與紀錄/').first().click().catch(()=>{});await W(300);await p.locator('[data-act=cupopen]').first().click();await W(300)}
    await p.click('[data-act=cuptab][data-v=rank]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);R=await read();
    ok('B8: A after forfeit',order(R[0])==='1黑鳶隊 2藍鵲隊 3綠繡眼隊 4白鷺隊'&&/打完 4／4 場/.test(R[0].n),R[0]);console.log(JSON.stringify(R[0].rows));}
  ok('no page errors',!errs.length,errs);
  console.log('t1120-ranktest',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

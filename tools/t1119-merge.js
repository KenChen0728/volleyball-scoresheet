// 11/19 兩台各自建了同名資料夾，匯入時併進同名的（tools/patch_v110.py）
const {scDate,scTime,scGet}=require('./scpick.js');
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];const Y=new Date().getFullYear();
(async()=>{const b=await chromium.launch();
  const mk=async()=>{const ctx=await b.newContext({viewport:{width:820,height:1180},acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
    await p.goto(URL);await p.evaluate(()=>{localStorage.clear()});await p.reload();await W(400);const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}return p};
  const DB=async p=>p.evaluate(()=>{const k=Object.keys(localStorage).find(k=>{try{return Array.isArray(JSON.parse(localStorage.getItem(k)).cups)}catch(e){return false}});return JSON.parse(localStorage.getItem(k))});
  const folder=async(p,roster)=>{await p.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(300);await p.click('[data-act=cupcreate]');await W(300);await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(400);
    if(await p.locator('[data-act=cuptab][data-v=teams]').count()){await p.click('[data-act=cuptab][data-v=teams]');await W(200)}
    await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);await p.fill('#ct-text',roster);await p.click('[data-act=cupteamsave]');await W(300)};
  // 平板：兩隊加一場賽程
  const A=await mk();await folder(A,'男子組球員名單\n範例藍隊\n王小明1\n陳大文2\n範例橘隊\n李小美3');
  if(await A.locator('[data-act=cuptab][data-v=sched]').count()){await A.click('[data-act=cuptab][data-v=sched]');await W(200)}
  await A.click('[data-act=scnew]');await W(300);await scDate(A,Y+'-12-05');await scTime(A,'08:30');await A.fill('#sc-court','甲');
  await A.locator('.sheet [data-act=scpick]').filter({hasText:/範例藍隊/}).click();await W(120);await A.locator('.sheet [data-act=scpick]').filter({hasText:/範例橘隊/}).click();await W(120);
  await A.click('[data-act=scsave1]:not([data-v])');await W(300);
  const [dl]=await Promise.all([A.waitForEvent('download'),A.click('[data-act=cupsave]')]);const F='/tmp/t1119-merge.json';await dl.saveAs(F);
  // 手機：自己也建了「測試盃」，有一隊同名（舊名單）、一隊不同
  const B=await mk();await folder(B,'男子組球員名單\n範例藍隊\n王小明1\n範例綠隊\n趙一5');
  const before=await DB(B);const blueB=before.cups[0].teams.find(t=>t.team.name==='範例藍隊').id;
  await B.click('.barback');await W(300);await B.setInputFiles('#import-file',F);await W(400);
  const plan=await B.locator('.sheet').innerText();
  ok('plan says merged into same-name folder',/「測試盃」資料夾：併入這台同名的資料夾/.test(plan)&&!/新的資料夾/.test(plan),plan);
  await B.click('[data-act=impgo]');await W(400);
  const d=await DB(B);
  ok('still one folder',d.cups.length===1,d.cups.map(c=>c.name));
  const ts=d.cups[0].teams.filter(t=>!t.del);
  ok('teams merged by name, no duplicate',ts.length===3&&ts.filter(t=>t.team.name==='範例藍隊').length===1,ts.map(t=>t.team.name));
  ok('same-name team keeps local id, last edited roster wins',ts.find(t=>t.team.name==='範例藍隊').id===blueB&&ts.find(t=>t.team.name==='範例藍隊').team.players.length===1);
  const sc=(d.cups[0].sched||[]).filter(x=>!x.del);
  ok('schedule came over with local team ids',sc.length===1&&sc[0].t1===blueB&&ts.some(t=>t.id===sc[0].t2&&t.team.name==='範例橘隊'),sc);
  // 再匯入同一個檔案：不會重複
  await B.setInputFiles('#import-file',F);await W(400);const plan2=await B.locator('.sheet').innerText();
  ok('re-import: nothing new',/都已經有了/.test(plan2)||!/新增/.test(plan2),plan2);
  ok('no page errors',!errs.length,errs);
  console.log('t1119-merge',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

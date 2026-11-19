// 11/19 名冊：賽事資料夾的隊伍不限人數、可以整份貼上名單 PDF；開比賽選隊伍時出賽名單空著，輸入背號自動帶出姓名（tools/patch_v102.py）
// 用的是虛構的名單（真實名單不進 git）
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',KEY='nanshe-scoresheet-beta',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const PDF='女⼦組球員名單\n範例藍隊\n王⼩明1\n陳⼤文2\n林⼩華3\n李⼩美4\n張⼩英5\n黃⼩芳6\n吳⼩玲7\n周⼩雯8\n鄭⼩惠9\n謝⼩娟10\n許⼩萍11\n何⼩真12\n郭⼩如13\n曾⼩蘭14\n蔡⼩琪15\n范⼩雲16\n潘⼩青17\n範例橘隊\n趙⼀1\n錢⼆2\n孫三3\n李四4\n周五5\n吳六6\n鄭七7\n王八8\n';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(500);
  const DBK=await p.evaluate(()=>Object.keys(localStorage).find(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d&&Array.isArray(d.cups)}catch(e){return false}}));
  // 1. 整份貼上（在男子組的視窗貼女子組的 PDF 也會分到女子組）
  await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  await p.fill('#ct-text',PDF);await p.click('[data-act=cupteamsave]');await W(400);
  ok('paste saved without errors',await p.locator('.sheet .warning,.sheet .err').count()===0,await p.locator('.sheet').innerText().catch(()=>''));
  const cup=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);
  ok('two teams in 女子組',cup.teams.length===2&&cup.teams.every(t=>t.division==='女子組'),cup.teams.map(t=>t.division+t.team.name));
  const blue=cup.teams.find(t=>t.team.name==='範例藍隊');
  ok('17 players kept (no 12-player limit)',blue&&blue.team.players.length===17);
  ok('kangxi radicals normalized',blue&&blue.team.players[0].name==='王小明',blue&&blue.team.players[0]);
  // 1b. 放錯男女組：在修改視窗改，打到一半的字不會不見
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  await p.locator('[data-act=cupteam][data-id]:has-text("範例橘隊")').click();await W(300);
  ok('editor shows division choice',await p.locator('.sheet [data-act=ctdiv][data-v=女子組][aria-pressed=true]').count()===1);
  await p.fill('#ct-text',(await p.inputValue('#ct-text'))+'\n9 新來的');
  await p.click('.sheet [data-act=ctdiv][data-v=男子組]');await W(200);
  ok('typed text kept after switching',/9 新來的/.test(await p.inputValue('#ct-text')));
  if(SHOT)await p.screenshot({path:SHOT+'/b-div.png'});
  await p.click('[data-act=cupteamsave]');await W(400);
  let cupx=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);
  const orange=cupx.teams.find(t=>t.team.name==='範例橘隊');
  ok('team moved to 男子組',orange.division==='男子組'&&orange.team.players.length===9,orange&&[orange.division,orange.team.players.length]);
  ok('view follows to 男子組',await p.locator('[data-act=cupdiv][data-v=男子組][aria-pressed=true]').count()===1&&await p.locator('[data-act=cupteam]:has-text("範例橘隊")').count()===1);
  await p.locator('[data-act=cupteam][data-id]:has-text("範例橘隊")').click();await W(300);await p.click('.sheet [data-act=ctdiv][data-v=女子組]');await W(200);await p.click('[data-act=cupteamsave]');await W(400);
  cupx=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);ok('moved back',cupx.teams.find(t=>t.team.name==='範例橘隊').division==='女子組');
  // 2. 開比賽：兩隊
  await p.click('[data-act=history]');await W(300);await p.click('[data-act=home]').catch(()=>{});await W(300);
  await p.click('[data-act=new]');await W(300);await p.locator('[data-act=newpick]').first().click();await W(200);await p.click('[data-act=newgo]');await W(500);
  await p.click('[data-act=page][data-v=roster]');await W(500);
  for(const [i,nm] of [[0,'範例藍隊'],[1,'範例橘隊']]){await p.locator('[data-act=sheet]:has-text("載入")').nth(i).click();await W(300);
    await p.locator('.sheet [data-act=import-pick]:has-text("'+nm+'")').first().click();await W(400)}
  const st=await p.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);const e=m.events.filter(x=>x.type==='TEAM_IMPORTED');return e.map(x=>({n:x.data.snapshot.name,pl:x.data.snapshot.players.length,bk:(x.data.snapshot.book||[]).length}))},DBK);
  ok('match roster starts empty, book kept',st.length===2&&st.every(x=>x.pl===0)&&st.find(x=>x.n==='範例藍隊').bk===17,st);
  ok('hint about book',/姓名會自動帶出/.test(await p.locator('.stephint').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/b-empty.png'});
  // 3. 輸入背號 → 姓名帶出
  const k=await p.evaluate(()=>{const h=[...document.querySelectorAll('.rr')].find(r=>r.closest('section,div')&&r.textContent);return null});
  const team=await p.evaluate(()=>{const t=[...document.querySelectorAll('h2,h3,.tname,b')].find(e=>/範例藍隊/.test(e.textContent));return null});
  const kOf=await p.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);return m.events.find(x=>x.type==='TEAM_IMPORTED'&&x.data.snapshot.name==='範例藍隊').data.team},DBK);
  const typeNo=async(no)=>{await p.locator(`.num[data-team=${kOf}][data-kind=reg]`).filter({hasText:/^\s*$/}).first().click();await W(200);
    for(const ch of String(no).padStart(String(no).length,''))await p.click(`[data-act=key][data-team=${kOf}][data-v="${ch}"]`),await W(150);
    if(String(no).length<2){const add=p.locator(`[data-act=add][data-team=${kOf}]`);if(await add.count())await add.first().click();await W(200)}};
  await typeNo(12);await typeNo(3);await typeNo(16);
  const pl=async()=>p.evaluate(([K,k])=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);const t={};m.events.forEach(e=>{if(e.data&&e.data.team===k){if(e.type==='PLAYER_ADDED')t[e.data.no]='';if(e.type==='PLAYER_NAME_SET')t[e.data.no]=e.data.name}});return t},[DBK,kOf]);
  let ps=await pl();ok('typed numbers fill names',ps[12]==='何小真'&&ps[3]==='林小華'&&ps[16]==='范小雲',ps);
  ok('names show on screen',(await p.evaluate(()=>[...document.querySelectorAll('input')].map(i=>i.value).join(' ')+document.body.innerText)).includes('何小真'));
  await typeNo(88);await W(200);ps=await pl();
  ok('number not in book added with blank name',ps[88]==='',ps);
  ok('not-in-book message',/名冊沒有 88 號/.test(await p.locator('body').innerText()),(await p.locator('body').innerText()).slice(-300));
  if(SHOT)await p.screenshot({path:SHOT+'/b-typed.png'});
  // 4. 改背號：原本帶出的姓名跟著換
  await p.locator(`.num[data-team=${kOf}][data-no="3"]`).first().click();await W(200);
  await p.click(`[data-act=key][data-team=${kOf}][data-v="1"]`);await W(150);await p.click(`[data-act=key][data-team=${kOf}][data-v="5"]`);await W(300);
  const nm=await p.evaluate(([K,k])=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);let t={};m.events.forEach(e=>{if(!e.data||e.data.team!==k)return;if(e.type==='PLAYER_ADDED')t[e.data.no]='';if(e.type==='PLAYER_NAME_SET')t[e.data.no]=e.data.name;if(e.type==='PLAYER_NUMBER_CHANGED'){t[e.data.to]=t[e.data.from];delete t[e.data.from]}});return t},[DBK,kOf]);
  ok('changed number takes book name',nm[15]==='蔡小琪'&&nm[3]===undefined,nm);
  // 5. 分享比賽不上傳名冊（syncClean）
  // 6. 把賽事資料夾存成檔案傳給夥伴：另一台匯入後，輸入背號一樣帶出姓名
  await p.evaluate(()=>{const b=document.querySelector('[data-act=history]');if(b)b.click()});await W(300);
  if(!await p.locator('[data-act=cupopen]').count()){await p.evaluate(()=>{const b=document.querySelector('[data-act=home]');if(b)b.click()});await W(300);await p.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(400)}
  await p.locator('[data-act=cupopen]').first().click();await W(300);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=cupsave]')]);const FF='/tmp/t1119-cup.json';await dl.saveAs(FF);
  const fj=JSON.parse(require('fs').readFileSync(FF,'utf8'));
  ok('folder file has names',fj.cups[0].teams.find(t=>t.team.name==='範例藍隊').team.players.length===17);
  const ctx2=await b.newContext({viewport:{width:820,height:1180},hasTouch:true});const q=await ctx2.newPage();q.on('pageerror',e=>errs.push(e.message));
  await q.goto(URL);await W(400);const a2=q.locator('.sheet.about [data-act=aboutclose]');if(await a2.count()){await a2.first().click();await W(200)}
  await q.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(400);
  await q.setInputFiles('#import-file',FF);await W(400);await q.click('[data-act=impgo]');await W(500);
  ok('partner sees folder',/測試盃/.test(await q.locator('body').innerText()));
  await q.click('[data-act=history]').catch(()=>{});await W(200);await q.click('[data-act=home]').catch(()=>{});await W(300);
  await q.click('[data-act=new]');await W(300);await q.locator('[data-act=newpick]').first().click();await W(200);await q.click('[data-act=newgo]');await W(500);
  await q.click('[data-act=page][data-v=roster]');await W(500);
  await q.locator('[data-act=sheet]:has-text("載入")').first().click();await W(300);await q.locator('.sheet [data-act=import-pick]:has-text("範例藍隊")').first().click();await W(400);
  const k2=await q.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);return m.events.find(x=>x.type==='TEAM_IMPORTED').data.team},DBK);
  await q.locator(`.num[data-team=${k2}][data-kind=reg]`).filter({hasText:/^\s*$/}).first().click();await W(200);
  for(const ch of '12')await q.click(`[data-act=key][data-team=${k2}][data-v="${ch}"]`),await W(150);await W(300);
  const n2=await q.evaluate(([K,k])=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);let t={};m.events.forEach(e=>{if(e.data&&e.data.team===k&&e.type==='PLAYER_NAME_SET')t[e.data.no]=e.data.name});return t},[DBK,k2]);
  ok('partner device fills name from book',n2[12]==='何小真',n2);
  ok('no page errors',!errs.length,errs);
  console.log('t1119-book',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

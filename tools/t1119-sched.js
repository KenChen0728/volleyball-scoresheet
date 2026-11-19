// 11/19 賽程：資料夾裡貼上賽程表、逐場修改、照賽程開始（左邊第一隊、右邊第二隊，場次男女各自編號），匯入匯出（tools/patch_v103.py）
// 用的是虛構的隊名和姓名（真實資料不進 git）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const names='王小明 陳大文 林小華 李小美 張小英 黃小芳 吳小玲 周小雯'.split(' ');
const team=(t,k)=>t+'\n'+names.map((n,i)=>n.slice(0,1)+k+n.slice(1)+(i+1)).join('\n');
const ROSTER='女子組球員名單\n'+['藍隊','橘隊','綠隊','紅隊','白隊','黑隊'].map(t=>team(t,t[0])).join('\n')+'\n男子組球員名單\n'+['甲隊','乙隊','丙隊','丁隊','藍隊'].map(t=>team(t,t[0])).join('\n');
const SCHED=`三、室內場 A 為女子組，室內場 B 為男子組。 8:00–8:30 為報到與開幕。
12/5（六） 室內場 A（女子組） 室內場 B（男子組）
8:30-9:30 藍隊 vs 橘隊 甲隊 vs 乙隊
9:30-10:30 綠隊 vs 紅隊 丙隊 vs 藍隊
10:30-11:30 白隊 vs 黑隊 空場
11:30-12:30 女子未晉級隊伍簽到、拍照 丁隊 vs 甲隊
16:30 場復 男子組頒獎、合照、簽到，場復
12/6（日） 室內場 A（女子組） 室內場 B（男子組）
9:00-10:00 A1 vs B2 甲隊 vs 丙隊`;
const CELLS=`12/5（六）
室內場 A（女子組）
室內場 B（男子組）
8:30-9:30
藍隊 vs 橘隊
甲隊 vs 乙隊
10:30-11:30
白隊 vs 黑隊
空場
11:30-12:30
空場
丁隊 vs 甲隊`;
(async()=>{const b=await chromium.launch();
  const mk=async(vp)=>{const ctx=await b.newContext({viewport:vp,hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return p};
  const p=await mk({width:390,height:844});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('text=紀錄與名單').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(500);
  const DBK=await p.evaluate(()=>Object.keys(localStorage).find(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d&&Array.isArray(d.cups)}catch(e){return false}}));
  const cup=()=>p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);
  ok('empty schedule hint',/把大會的賽程表整份貼上/.test(await p.locator('main').innerText()));
  await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);await p.fill('#ct-text',ROSTER);await p.click('[data-act=cupteamsave]');await W(400);
  ok('11 teams',(await cup()).teams.length===11,(await cup()).teams.map(t=>t.division+t.team.name));
  // 1. 一格一行的貼法（直接算，不存）
  await p.click('[data-act=scpaste]');await W(300);await p.fill('#sc-text',CELLS);await p.click('[data-act=scparse]');await W(300);
  const cells=[...(await p.locator('.scprev li:not(.scpd)').allInnerTexts())].map(t=>t.replace(/\s+/g,' ').trim());
  ok('cell-per-line format',JSON.stringify(cells)===JSON.stringify(['08:30 室內場 A 女子組 藍隊 vs 橘隊','08:30 室內場 B 男子組 甲隊 vs 乙隊','10:30 室內場 A 女子組 白隊 vs 黑隊','11:30 室內場 B 男子組 丁隊 vs 甲隊']),cells);
  await p.click('.sheet [data-act=close]');await W(200);
  // 2. 貼上整份賽程 → 先看排出什麼
  await p.click('[data-act=scpaste]');await W(300);await p.fill('#sc-text',SCHED);await p.click('[data-act=scparse]');await W(300);
  const pv=await p.locator('.sheet').innerText();
  ok('preview count',/會排出 8 場/.test(pv),pv.slice(0,300));
  ok('preview warns unknown teams',/A1（女子組）、B2（女子組）/.test(pv),pv);
  if(SHOT)await p.screenshot({path:SHOT+'/s-preview.png'});
  await p.click('[data-act=scadd]');await W(400);
  let c=await cup();const it=c.sched.filter(x=>!x.del);
  ok('8 items saved',it.length===8,it.length);
  const by=(d,t,div)=>it.find(x=>x.date.endsWith(d)&&x.time===t&&x.division===div);
  const tn=id=>(c.teams.find(t=>t.id===id)||{team:{name:'?'}}).team.name;
  ok('left team is t1',tn(by('12-05','08:30','女子組').t1)==='藍隊'&&tn(by('12-05','08:30','女子組').t2)==='橘隊');
  ok('men court B',by('12-05','08:30','男子組').court==='室內場 B');
  const b2=by('12-05','09:30','男子組');ok('same name picks right division',c.teams.find(t=>t.id===b2.t2).division==='男子組',b2);
  ok('chunk before match shifts column',tn(by('12-05','11:30','男子組').t1)==='丁隊'&&!by('12-05','11:30','女子組'));
  const tbd=by('12-06','09:00','女子組');ok('ranking match tbd with labels',tbd&&!tbd.t1&&tbd.n1==='A1'&&tbd.n2==='B2',tbd);
  ok('no row from notes lines',!it.some(x=>x.time==='16:30'||x.time==='08:00'));
  // 3. 資料夾頁：照男女組列出，場次男女各自編號
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  let main=await p.locator('main').innerText();
  ok('women list numbered',/第 1 場・08:30・室內場 A/.test(main)&&/第 4 場・09:00/.test(main)&&/12\/5（六）/.test(main)&&/12\/6（日）/.test(main),main.slice(0,600));
  ok('tbd shown',/待定・A1/.test(main));
  if(SHOT)await p.screenshot({path:SHOT+'/s-list.png',fullPage:true});
  await p.click('[data-act=cupdiv][data-v=男子組]');await W(300);main=await p.locator('main').innerText();
  ok('men numbered from 1',/第 1 場・08:30・室內場 B/.test(main)&&/第 3 場・11:30/.test(main));
  // 4. 再貼一次同一份：不會重複
  await p.click('[data-act=scpaste]');await W(300);await p.fill('#sc-text',SCHED);await p.click('[data-act=scparse]');await W(300);
  ok('repaste says update',/其中 8 場同一時間、場地已經有了/.test(await p.locator('.sheet').innerText()));
  await p.click('[data-act=scadd]');await W(300);c=await cup();ok('no duplicates',c.sched.filter(x=>!x.del).length===8);
  // 5. 排名賽知道隊伍了：修改這一場
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  await p.locator('[data-act=scopen]:has-text("A1")').click();await W(300);
  ok('one-match sheet',/女子組第 4 場/.test(await p.locator('.sheet').innerText())&&/還有隊伍待定/.test(await p.locator('.sheet').innerText()));
  await p.click('[data-act=scedit]');await W(300);
  ok('edit has back',await p.locator('.sheet [data-act=scback]').count()===1);
  await p.fill('#sc-court','室內場 A');await p.locator('.sheet [data-act=scpick]:has-text("白隊")').click();await W(200);
  ok('typed court kept after tap',await p.inputValue('#sc-court')==='室內場 A');
  await p.locator('.sheet [data-act=scpick]:has-text("綠隊")').click();await W(200);
  ok('picked order shown',/白隊第一隊/.test((await p.locator('.sheet').innerText()).replace(/\s/g,'')));
  if(SHOT)await p.screenshot({path:SHOT+'/s-edit.png'});
  await p.keyboard.press('Escape');await W(200);ok('esc goes back one level',/女子組第 4 場/.test(await p.locator('.sheet').innerText()));
  await p.click('[data-act=scedit]');await W(300);await p.locator('.sheet [data-act=scpick]:has-text("白隊")').click();await W(150);await p.locator('.sheet [data-act=scpick]:has-text("綠隊")').click();await W(150);
  await p.click('[data-act=scsave1]');await W(300);c=await cup();const t4=c.sched.find(x=>x.id===tbd.id);
  ok('edit saved',tn(t4.t1)==='白隊'&&tn(t4.t2)==='綠隊'&&t4.n1==='',t4);
  // 6. 加一場、刪除
  await p.click('[data-act=scnew]');await W(300);await p.fill('#sc-time','14:00');await p.locator('.sheet [data-act=scpick]:has-text("紅隊")').click();await W(150);await p.locator('.sheet [data-act=scpick]:has-text("紅隊")').click();await W(150);
  ok('tap again cancels',!/紅隊第一隊/.test((await p.locator('.sheet').innerText()).replace(/\s/g,'')));
  await p.click('[data-act=scsave1]');await W(300);c=await cup();ok('new item added',c.sched.filter(x=>!x.del).length===9);
  await p.locator('[data-act=scopen]:has-text("14:00")').click();await W(200);await p.click('[data-act=scedit]');await W(200);await p.click('[data-act=scdel]');await W(200);await p.click('[data-act=scdel2]');await W(300);
  c=await cup();ok('deleted',c.sched.filter(x=>!x.del).length===8);
  // 7. 照賽程開始：到名單頁，資料、場次、兩隊都帶好，輸入背號帶出姓名
  await p.locator('[data-act=scopen]:has-text("第 1 場")').click();await W(300);
  if(SHOT)await p.screenshot({path:SHOT+'/s-one.png'});
  await p.click('[data-act=scgo]');await W(500);
  const cur=()=>p.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId),ti=m.events.filter(e=>e.type==='TEAM_IMPORTED');const T=k=>ti.find(e=>e.data.team===k)||{data:{snapshot:{players:[0],book:[]},fromName:''}};
    return {info:m.events[0].data.info,t1:T('t1').data.fromName,t2:T('t2').data.fromName,p1:T('t1').data.snapshot.players.length,bk:(T('t1').data.snapshot.book||[]).length,cup:m.cup===d.cups[0].id}},DBK);
  const st=await cur();
  ok('started on roster page',await p.locator('[data-act=page][data-v=roster][aria-current]').count()+await p.locator('.num[data-kind=reg]').count()>0);
  ok('info from schedule',st.info.game==='1'&&st.info.division==='女子組'&&st.info.court==='室內場 A'&&st.info.time==='08:30'&&/-12-05$/.test(st.info.date)&&st.info.name==='測試盃',st.info);
  ok('teams left/right',st.t1==='藍隊'&&st.t2==='橘隊'&&st.p1===0&&st.bk===8&&st.cup,st);
  const k1=await p.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);return m.events.find(x=>x.type==='TEAM_IMPORTED'&&x.data.fromName==='藍隊').data.team},DBK);
  await p.locator(`.num[data-team=${k1}][data-kind=reg]`).filter({hasText:/^\s*$/}).first().click();await W(200);await p.click(`[data-act=key][data-team=${k1}][data-v="3"]`);await W(150);
  const add=p.locator(`[data-act=add][data-team=${k1}]`);if(await add.count()){await add.first().click();await W(300)}
  ok('number fills name',(await p.evaluate(()=>document.body.innerText+[...document.querySelectorAll('input')].map(i=>i.value).join(' '))).includes('林藍小華'));
  if(SHOT)await p.screenshot({path:SHOT+'/s-roster.png'});
  await p.click('[data-act=cupback]');await W(300);main=await p.locator('main').innerText();
  ok('back to folder, row shows recording',/記錄中 ›/.test(main),main.slice(0,400));
  await p.locator('.scrow:has-text("記錄中")').click();await W(300);ok('row opens the match',await p.locator('[data-act=cupback]').count()===1);
  // 8. 首頁「開始新比賽」：列出最近一天還沒開始的
  await p.click('[data-act=cupback]');await W(300);await p.click('[data-act=history]');await W(300);await p.locator('[data-act=home]').first().click();await W(300);
  await p.locator('[data-act=new]').first().click();await W(300);
  const ss=await p.locator('.sheet').innerText();
  ok('start sheet lists schedule',/照賽程開始（12\/5（六））/.test(ss)&&/綠隊\s*vs\s*紅隊/.test(ss)&&!/藍隊\s*vs\s*橘隊/.test(ss),ss);
  if(SHOT)await p.screenshot({path:SHOT+'/s-start.png'});
  await p.locator('.sheet [data-act=scgo]:has-text("甲隊 vs 乙隊")').click();await W(500);
  const s2=await cur(),st2=[s2.info.division,s2.info.game,s2.t1,s2.t2];
  ok('started from home',JSON.stringify(st2)==='["男子組","1","甲隊","乙隊"]',st2);
  // 9. 資料夾存成檔案：另一台匯入後賽程和已開始的比賽都在
  await p.locator('.barback').first().click();await W(300);await p.locator('text=紀錄與名單').first().click().catch(()=>{});await W(300);if(!await p.locator('[data-act=cupsave]').count()){await p.locator('[data-act=cupopen]').first().click();await W(300)}
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=cupsave]')]);const FF='/tmp/t1119-sched.json';await dl.saveAs(FF);
  const q=await mk({width:820,height:1180});await q.goto(URL);await W(400);const a2=q.locator('.sheet.about [data-act=aboutclose]');if(await a2.count()){await a2.first().click();await W(200)}
  await q.locator('text=紀錄與名單').first().click();await W(400);await q.setInputFiles('#import-file',FF);await W(400);
  ok('import plan mentions schedule',/賽程新增 8 場/.test(await q.locator('.sheet').innerText()),await q.locator('.sheet').innerText());
  await q.click('[data-act=impgo]');await W(500);await q.locator('[data-act=cupopen]').first().click();await W(300);
  await q.click('[data-act=cupdiv][data-v=女子組]');await W(300);const qm=await q.locator('main').innerText();
  ok('partner sees schedule and status',/記錄中 ›/.test(qm)&&/第 4 場/.test(qm),qm.slice(0,500));
  if(SHOT)await q.screenshot({path:SHOT+'/s-tablet.png',fullPage:true});
  // 改了再傳回來：最後改的為主
  ok('no page errors',!errs.length,errs);
  console.log('t1119-sched',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

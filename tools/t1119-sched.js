// 11/19 賽程：資料夾裡一場一場加（加一場、儲存再加下一場）、逐場修改、照賽程開始（左邊第一隊、右邊第二隊，場次男女各自編號），匯入匯出（tools/patch_v103.py）
// 用的是虛構的隊名和姓名（真實資料不進 git）
const {scDate,scTime,scGet,scTbd}=require('./scpick.js');
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const tab=async(pg,v)=>{const t=pg.locator('[data-act=cuptab][data-v='+v+']');if(await t.count()){await t.click();await W(200)}};
const names='王小明 陳大文 林小華 李小美 張小英 黃小芳 吳小玲 周小雯'.split(' ');
const team=(t,k)=>t+'\n'+names.map((n,i)=>n.slice(0,1)+k+n.slice(1)+(i+1)).join('\n');
const ROSTER='女子組球員名單\n'+['藍隊','橘隊','綠隊','紅隊','白隊','黑隊'].map(t=>team(t,t[0])).join('\n')+'\n男子組球員名單\n'+['甲隊','乙隊','丙隊','丁隊','藍隊'].map(t=>team(t,t[0])).join('\n');
const Y=new Date().getFullYear();
(async()=>{const b=await chromium.launch();
  const mk=async(vp)=>{const ctx=await b.newContext({viewport:vp,hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return p};
  const p=await mk({width:390,height:844});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(500);
  const DBK=await p.evaluate(()=>Object.keys(localStorage).find(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d&&Array.isArray(d.cups)}catch(e){return false}}));
  const cup=()=>p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);
  await tab(p,'sched');
  ok('empty schedule hint',/還沒有賽程。/.test(await p.locator('main').innerText()));
  ok('rare tools in more',await p.locator('main [data-act=cupdel]').count()===0&&await p.locator('main [data-act=cupsave]').count()===1);
  await p.click('[data-act=cupmore]');await W(200);ok('more sheet',await p.locator('.sheet [data-act=cupadd]').count()===1&&await p.locator('.sheet [data-act=cuprename]').count()===1&&await p.locator('.sheet .dellink[data-act=cupdel]').count()===1);
  await p.keyboard.press('Escape');await W(200);ok('esc closes more',await p.locator('.sheet').count()===0);
  await tab(p,'teams');await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);await p.fill('#ct-text',ROSTER);await p.click('[data-act=cupteamsave]');await W(400);
  ok('11 teams',(await cup()).teams.length===11,(await cup()).teams.map(t=>t.division+t.team.name));
  await tab(p,'sched');ok('button says 新增比賽',(await p.locator('[data-act=scnew]').innerText())==='新增比賽'&&/新增比賽/.test(await (async()=>{await p.click('[data-act=scnew]');await W(200);const x=await p.locator('.sheet h2').innerText();await p.click('.sheet [data-act=close]');await W(200);return x})()));
  ok('no paste button',await p.locator('[data-act=scpaste]').count()===0);
  // 1. 加一場：一場一場加，「儲存，再加下一場」日期、場地留著，時間加一小時
  const pick=async n=>{await p.locator('.sheet [data-act=scpick]').filter({hasText:new RegExp('^\\s*'+n)}).first().click();await W(150)};
  const addOne=async(o,next)=>{if(o.div)await p.click('.sheet [data-act=scdiv][data-v='+o.div+']'),await W(150);if(o.date)await scDate(p,o.date);if(o.time)await scTime(p,o.time);if(o.court!=null)await p.fill('#sc-court',o.court);
    for(const n of o.teams||[])await pick(n);if(o.n1){await scTbd(p);await p.fill('#sc-n1',o.n1)}if(o.n2){await scTbd(p);await p.fill('#sc-n2',o.n2)}
    await p.click(next?'[data-act=scsave1][data-v=next]':'[data-act=scsave1]:not([data-v])');await W(300)};
  await tab(p,'sched');await p.click('[data-act=scnew]');await W(300);
  ok('new defaults today',await scGet(p,'#sc-date')===await p.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}));
  await addOne({div:'女子組',date:Y+'-12-05',time:'08:30',court:'室內場 A',teams:['藍隊','橘隊']},true);
  ok('next keeps date and court, time +1h',await scGet(p,'#sc-date')===Y+'-12-05'&&await p.inputValue('#sc-court')==='室內場 A'&&await scGet(p,'#sc-time')==='09:30'&&/已加入女子組第 1 場（08:30）/.test(await p.locator('.sheet').innerText()));
  ok('teams cleared for next',await p.locator('.sheet [data-act=scpick][aria-pressed=true]').count()===0);
  if(SHOT)await p.screenshot({path:SHOT+'/s-next.png'});
  await addOne({teams:['綠隊','紅隊']},true);await addOne({teams:['白隊','黑隊']},false);
  ok('sheet closed after save',await p.locator('.sheet').count()===0);
  await p.click('[data-act=scnew]');await W(300);
  ok('new uses last date and court of division',await scGet(p,'#sc-date')===Y+'-12-05'&&await p.inputValue('#sc-court')==='室內場 A');
  ok('new time follows last match +1h',await scGet(p,'#sc-time')==='11:30',await scGet(p,'#sc-time'));
  ok('two slots instead of hint',await p.locator('.sheet .scslots .scslot').count()===2&&!/點兩隊：/.test(await p.locator('.sheet').innerText()));
  await pick('藍隊');ok('tap fills first slot',/藍隊/.test(await p.locator('.scslot').nth(0).innerText())&&await p.locator('.scslot.cur').count()===1&&await p.locator('.scslot').nth(1).getAttribute('aria-pressed')==='true');
  await pick('橘隊');await pick('綠隊');ok('both full: replaces second',/綠隊/.test(await p.locator('.scslot').nth(1).innerText())&&/藍隊/.test(await p.locator('.scslot').nth(0).innerText()));
  ok('no tbd notes when both picked',await p.locator('#sc-n1').count()===0);
  await p.click('.scslot >> nth=0');await W(150);ok('tap filled slot selects it (not cleared)',/藍隊/.test(await p.locator('.scslot').nth(0).innerText())&&await p.locator('.scslot').nth(0).getAttribute('aria-pressed')==='true');
  await pick('紅隊');ok('pick replaces selected slot',/紅隊/.test(await p.locator('.scslot').nth(0).innerText())&&/綠隊/.test(await p.locator('.scslot').nth(1).innerText()));
  await pick('紅隊');ok('tap picked team again clears it',!/紅隊/.test(await p.locator('.scslot').nth(0).innerText())&&await p.locator('[data-act=sctbd]').count()===1);
  const lay=await p.evaluate(()=>{const sh=document.querySelector('.sheet.scsheet'),l=sh.querySelector('.scteams'),sv=sh.querySelector('[data-act=scsave1]').getBoundingClientRect();return {sheetScroll:sh.scrollHeight>sh.clientHeight+1&&getComputedStyle(sh).overflowY!=='hidden',listScroll:getComputedStyle(l).overflowY,saveVisible:sv.bottom<=innerHeight&&sv.top>=0}});
  ok('only team list scrolls, save visible',!lay.sheetScroll&&lay.listScroll==='auto'&&lay.saveVisible,lay);
  if(SHOT)await p.screenshot({path:SHOT+'/s-slots.png'});
  await pick('綠隊');
  await addOne({date:Y+'-12-06',time:'09:00',n1:'A1',n2:'B2'},false);
  await p.click('[data-act=scnew]');await W(300);await p.click('.sheet [data-act=scdiv][data-v=男子組]');await W(150);
  ok('division picked in sheet',await p.locator('.sheet [data-act=scdiv][data-v=男子組][aria-pressed=true]').count()===1);
  await addOne({date:Y+'-12-05',time:'08:30',court:'室內場 B',teams:['甲隊','乙隊']},true);await addOne({teams:['丙隊','藍隊']},true);await addOne({time:'11:30',teams:['丁隊','甲隊']},false);
  let c=await cup();const it=c.sched.filter(x=>!x.del);
  ok('7 items saved',it.length===7,it.length);
  const by=(d,t,div)=>it.find(x=>x.date.endsWith(d)&&x.time===t&&x.division===div);
  const tn=id=>(c.teams.find(t=>t.id===id)||{team:{name:'?'}}).team.name;
  ok('first pick is t1',tn(by('12-05','08:30','女子組').t1)==='藍隊'&&tn(by('12-05','08:30','女子組').t2)==='橘隊');
  const b2=by('12-05','09:30','男子組');ok('same name picks right division',b2&&c.teams.find(t=>t.id===b2.t2).division==='男子組',b2);
  const tbd=by('12-06','09:00','女子組');ok('ranking match tbd with labels',tbd&&!tbd.t1&&tbd.n1==='A1'&&tbd.n2==='B2',tbd);
  ok('no end time stored',!it.some(x=>x.end));
  // 3. 資料夾頁：照男女組列出，場次男女各自編號
  await p.click('[data-act=cupcourtf][data-v="室內場 A"]');await W(300);
  ok('court filter chips',await p.locator('[data-act=cupcourtf]').count()===3);
  let main=await p.locator('main').innerText();
  ok('women list numbered',/女子組第 1 場・08:30/.test(main)&&/女子組第 4 場・09:00/.test(main)&&!/男子組/.test(main)&&/12\/5（六）/.test(main)&&/12\/6（日）/.test(main),main.slice(0,600));
  ok('tbd shown',/待定・A1/.test(main));
  if(SHOT)await p.screenshot({path:SHOT+'/s-list.png',fullPage:true});
  await p.click('[data-act=cupcourtf][data-v="室內場 B"]');await W(300);main=await p.locator('main').innerText();
  ok('men numbered from 1',/男子組第 1 場・08:30/.test(main)&&/男子組第 3 場・11:30/.test(main));
  await p.click('[data-act=cupcourtf][data-v=""]');await W(300);main=await p.locator('main').innerText();
  ok('all courts mixed by time, court shown',/女子組第 1 場・08:30・場地：室內場 A/.test(main)&&/男子組第 1 場・08:30・場地：室內場 B/.test(main));
  // 5. 排名賽知道隊伍了：修改這一場
  await p.click('[data-act=cupcourtf][data-v="室內場 A"]');await W(300);
  await p.locator('[data-act=scopen]:has-text("A1")').click();await W(300);
  ok('one-match sheet',/女子組第 4 場/.test(await p.locator('.sheet').innerText())&&/還有隊伍待定/.test(await p.locator('.sheet').innerText()));
  await p.click('[data-act=scedit]');await W(300);
  ok('edit has back',await p.locator('.sheet [data-act=scback]').count()===1);
  await p.fill('#sc-court','室內場 A');await p.locator('.sheet [data-act=scpick]:has-text("白隊")').click();await W(200);
  ok('typed court kept after tap',await p.inputValue('#sc-court')==='室內場 A');
  await p.locator('.sheet [data-act=scpick]:has-text("綠隊")').click();await W(200);
  ok('picked team marked',/白隊已選/.test((await p.locator('.sheet').innerText()).replace(/\s/g,'')));
  if(SHOT)await p.screenshot({path:SHOT+'/s-edit.png'});
  await p.keyboard.press('Escape');await W(200);ok('esc goes back one level',/女子組第 4 場/.test(await p.locator('.sheet').innerText()));
  await p.click('[data-act=scedit]');await W(300);await p.locator('.sheet [data-act=scpick]:has-text("白隊")').click();await W(150);await p.locator('.sheet [data-act=scpick]:has-text("綠隊")').click();await W(150);
  await p.click('[data-act=scsave1]:not([data-v])');await W(300);c=await cup();const t4=c.sched.find(x=>x.id===tbd.id);
  ok('edit saved',tn(t4.t1)==='白隊'&&tn(t4.t2)==='綠隊'&&t4.n1==='',t4);
  // 6. 加一場、刪除
  await p.click('[data-act=scnew]');await W(300);await scTime(p,'14:00');await p.locator('.sheet [data-act=scpick]:has-text("紅隊")').click();await W(150);await p.locator('.sheet [data-act=scpick]:has-text("紅隊")').click();await W(150);
  ok('tap again cancels',!/紅隊第一隊/.test((await p.locator('.sheet').innerText()).replace(/\s/g,'')));
  await p.click('[data-act=scsave1]:not([data-v])');await W(300);c=await cup();ok('new item added',c.sched.filter(x=>!x.del).length===8);
  await p.locator('[data-act=scopen]:has-text("14:00")').click();await W(200);
  ok('delete right in the match sheet',await p.locator('.sheet [data-act=scdel]').count()===1);
  await p.click('.sheet [data-act=scdel]');await W(200);ok('asks before delete',/刪除這一場賽程？/.test(await p.locator('.sheet').innerText())&&await p.locator('.sheet [data-act=scgo]').count()===0);
  await p.keyboard.press('Escape');await W(200);ok('esc cancels delete',await p.locator('.sheet [data-act=scgo]').count()===1);
  c=await cup();ok('not deleted yet',c.sched.filter(x=>!x.del).length===8);
  if(SHOT){await p.click('.sheet [data-act=scdel]');await W(200);await p.screenshot({path:SHOT+'/s-del.png'});await p.click('.sheet [data-act=scdelno]');await W(200)}
  await p.click('.sheet [data-act=scdel]');await W(200);await p.click('[data-act=scdel2]');await W(300);
  c=await cup();ok('deleted',c.sched.filter(x=>!x.del).length===7);
  // 6b. 時間衝突：同場地同時間、同一隊同時間 → 提醒，可以照存
  await p.click('[data-act=scnew]');await W(300);await scDate(p,Y+'-12-05');await scTime(p,'08:30');await p.fill('#sc-court','室內場 A');await pick('紅隊');
  await p.click('[data-act=scsave1]:not([data-v])');await W(300);let wt=await p.locator('.sheet').innerText();
  ok('conflict warned',/時間衝突/.test(wt)&&/女子組第 1 場.*藍隊 vs 橘隊（同時間同場地）/.test(wt),wt.slice(0,500));
  await p.click('[data-act=scwarnno]');await W(200);ok('back to edit keeps fields',await scGet(p,'#sc-time')==='08:30'&&await p.locator('.sheet [data-act=scsave1]:not([data-force])').count()>=1);
  await p.fill('#sc-court','室內場 C');await pick('藍隊');await p.click('[data-act=scsave1]:not([data-v])');await W(300);wt=await p.locator('.sheet').innerText();
  ok('same team same time warned',/「藍隊」同時間有比賽/.test(wt)&&!/同時間同場地/.test(wt),wt.slice(0,500));
  await p.click('[data-act=scsave1][data-force]');await W(300);c=await cup();ok('save anyway works',c.sched.filter(x=>!x.del).length===8&&await p.locator('.sheet').count()===0);
  await p.click('[data-act=cupcourtf][data-v=""]');await W(300);await p.locator('[data-act=scopen]:has-text("室內場 C")').click();await W(200);await p.click('.sheet [data-act=scdel]');await W(150);await p.click('[data-act=scdel2]');await W(300);
  // 6c. 分頁：隊伍照隊名排；裁判分頁不分組
  await tab(p,'teams');const order=await p.locator('main [data-act=cupteam][data-id] strong').allInnerTexts();
  ok('teams tab sorted by name',JSON.stringify(order)===JSON.stringify(order.slice().sort((a,b)=>a.localeCompare(b,'zh-Hant',{numeric:true}))),order);
  ok('teams tab has division seg, no schedule',await p.locator('main [data-act=cupdiv]').count()===2&&await p.locator('main [data-act=scnew]').count()===0);
  await tab(p,'refs');ok('refs tab has no division seg',await p.locator('main [data-act=cupdiv]').count()===0&&await p.locator('main [data-act=cupcourt]').count()>=1);
  await tab(p,'sched');ok('no old matches section',!/這一組還沒有比賽/.test(await p.locator('main').innerText()));
  // 7. 照賽程開始：到名單頁，資料、場次、兩隊都帶好，輸入背號帶出姓名
  await p.locator('[data-act=scopen]:has-text("女子組第 1 場")').click();await W(300);
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
  ok('back to folder, row shows recording',/記錄中/.test(main),main.slice(0,400));
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
  await p.locator('.barback').first().click();await W(300);await p.locator('text=/紀錄與名單|賽事與紀錄/').first().click().catch(()=>{});await W(300);if(!await p.locator('[data-act=cupsave]').count()){await p.locator('[data-act=cupopen]').first().click();await W(300)}
  const [dl]=await (async()=>{await p.click('[data-act=cupsave]');await new Promise(r=>setTimeout(r,250));return Promise.all([p.waitForEvent('download'),p.click('.sheet [data-act=cupsvgo]')])})();const FF='/tmp/t1119-sched.json';await dl.saveAs(FF);
  const q=await mk({width:820,height:1180});await q.goto(URL);await W(400);const a2=q.locator('.sheet.about [data-act=aboutclose]');if(await a2.count()){await a2.first().click();await W(200)}
  await q.locator('text=/紀錄與名單|賽事與紀錄/').first().click();await W(400);await q.setInputFiles('#import-file',FF);await W(400);
  ok('import plan mentions schedule',/賽程新增 7 場/.test(await q.locator('.sheet').innerText()),await q.locator('.sheet').innerText());
  await q.click('[data-act=impgo]');await W(500);await q.locator('[data-act=cupopen]').first().click();await W(300);
  await q.click('[data-act=cupcourtf][data-v="室內場 A"]');await W(300);const qm=await q.locator('main').innerText();
  ok('partner sees schedule and status',/記錄中/.test(qm)&&/第 4 場/.test(qm),qm.slice(0,500));
  if(SHOT)await q.screenshot({path:SHOT+'/s-tablet.png',fullPage:true});
  // 打完的場次：列上直接看到局數，右邊是「已結束」
  const FM=JSON.parse(fs.readFileSync(__dirname+'/all.json','utf8')).matches[0];
  await q.evaluate(([K,m])=>{const d=JSON.parse(localStorage.getItem(K));m.cup=d.cups[0].id;d.matches.push(m);const it=d.cups[0].sched.filter(x=>!x.del&&x.division==='女子組').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[1];it.mid=m.id;localStorage.setItem(K,JSON.stringify(d))},[DBK,FM]);
  await q.reload();await W(500);if(!await q.locator('[data-act=cuptab]').count()){await q.locator('text=/紀錄與名單|賽事與紀錄/').first().click().catch(()=>{});await W(300);await q.locator('[data-act=cupopen]').first().click();await W(300)}
  await q.click('[data-act=cupcourtf][data-v="室內場 A"]');await W(300);
  const fr=await q.locator('.scrow').nth(1).innerText();
  ok('finished row shows set score',/\d : \d/.test(fr)&&!/已結束/.test(fr),fr);
  const fi=await q.evaluate(()=>{const r=document.querySelectorAll('.scrow')[1];const sp=r.querySelectorAll('.hnames>span');return {sets:[...r.querySelectorAll('.scsets>span')].map(x=>x.textContent),cls:[...sp].map(x=>x.className),win:getComputedStyle(r.querySelector('.hnames .win')).color}});
  ok('per-set scores, left team first',fi.sets.length>=2&&fi.sets.every(x=>/^\d+:\d+$/.test(x)),fi);
  ok('winner green, loser faded',fi.cls.includes('win')&&fi.cls.includes('lose')&&/rgb\((11, 110, 67|95, 211, 154)\)/.test(fi.win),fi);
  ok('next match chip is accent',await q.locator('.scrow .scchip.go').count()===1&&/第 3 場/.test(await q.locator('.scrow:has(.scchip.go)').innerText()));
  if(SHOT){await q.setViewportSize({width:390,height:844});await W(300);await q.screenshot({path:SHOT+'/s-rows.png'})}
  // 改了再傳回來：最後改的為主
  ok('no page errors',!errs.length,errs);
  console.log('t1119-sched',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

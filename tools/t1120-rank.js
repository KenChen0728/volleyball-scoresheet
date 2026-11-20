// 11/20 積分分頁（tools/patch_v124.py）：照南社盃秩序冊算名次、自動分組、同分抽籤、名次規則可以調、第二次碰面不算
// 打完的比賽用 all.json 的一場（左邊那隊 2:1 贏）複製，棄權用「建立比賽＋棄權」兩筆事件。名字都是虛構的
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const FM=JSON.parse(fs.readFileSync(__dirname+'/all.json','utf8')).matches[0];
let seq=0;const clone=()=>{const id='mx'+(++seq);const m=JSON.parse(JSON.stringify(FM));m.id=id;m.events.forEach((e,i)=>{e.id=id+'e'+i;e.matchId=id});return m};
const forfeit=team=>{const id='mf'+(++seq);const e0=JSON.parse(JSON.stringify(FM.events[0]));e0.id=id+'e0';e0.matchId=id;return {id,createdAt:FM.createdAt,events:[e0,{id:id+'e1',matchId:id,seq:2,at:e0.at,device:'t',type:'FORFEIT',data:{team}}]}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const ab=async()=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};await ab();
  await p.locator('text=/賽事與紀錄/').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('範例盃');await p.locator('.sheet .primary').first().click();await W(500);
  const DBK=await p.evaluate(()=>Object.keys(localStorage).find(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d&&Array.isArray(d.cups)}catch(e){return false}}));
  await p.click('[data-act=cuptab][data-v=teams]');await W(200);await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  await p.fill('#ct-text','女子組球員名單\n甲一隊\n1 王一\n甲二隊\n2 王二\n甲三隊\n3 王三\n甲四隊\n4 王四\n乙一隊\n5 李一\n乙二隊\n6 李二\n乙三隊\n7 李三');await p.click('[data-act=cupteamsave]');await W(400);
  // 賽程：A 組四邊形（對角不打），B 組三角；最後加一場甲一、甲二再碰面（名次賽，不算）
  await p.evaluate(([K,FMs])=>{const d=JSON.parse(localStorage.getItem(K)),c=d.cups[0],id=n=>c.teams.find(t=>t.team.name===n).id;const ms=FMs;let o=0;c.sched=[];
    const add=(a,b2,tm,m)=>{o++;const it={id:'s'+o,at:Date.now(),date:'2026-12-05',time:tm,court:'甲',division:'女子組',t1:id(a),t2:id(b2),n1:'',n2:'',ord:o};if(m){m.cup=c.id;d.matches.push(m);it.mid=m.id}c.sched.push(it)};
    add('甲一隊','甲二隊','08:00',ms[0]);add('甲二隊','甲三隊','09:00',ms[1]);add('甲三隊','甲四隊','10:00',ms[2]);add('甲四隊','甲一隊','11:00',ms[3]);
    add('乙一隊','乙二隊','12:00',ms[4]);add('乙二隊','乙三隊','13:00',ms[5]);add('乙三隊','乙一隊','14:00',ms[6]);
    add('甲二隊','甲一隊','16:00',ms[7]);
    localStorage.setItem(K,JSON.stringify(d))},[DBK,[clone(),forfeit('t2'),clone(),forfeit('t1'),clone(),clone(),clone(),clone()]]);
  await p.reload();await W(600);await ab();
  if(!await p.locator('[data-act=cuptab]').count()){await p.locator('text=/賽事與紀錄/').first().click();await W(300);await p.locator('[data-act=cupopen]').first().click();await W(300)}
  ok('rank tab with count',/積分\s*7/.test(await p.locator('.cuptabs').innerText()),await p.locator('.cuptabs').innerText());
  await p.click('[data-act=cuptab][data-v=rank]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  const secs=await p.locator('.rksec h2').allInnerTexts();ok('two groups detected',secs.join()==='A 組,B 組',secs);
  ok('ask to confirm groups',await p.locator('.rkask').count()===1);
  const rows=async i=>p.locator('.rksec').nth(i).locator('tbody tr').evaluateAll(tr=>tr.map(r=>[...r.cells].map(c=>c.innerText.replace(/\s+/g,' ').trim())));
  let A=await rows(0);
  ok('A order 甲一 甲二 甲三 甲四',A.map(r=>r[1].split(' ')[0]).join()==='甲一隊,甲二隊,甲三隊,甲四隊',A);
  ok('甲一: 2-0, 5 points (2:1→2, 2:0→3), sets 4:1',A[0][2]==='2-0'&&A[0][3]==='5'&&/^4:1/.test(A[0][4]),A[0]);
  ok('甲二 4 points, 甲三 2 points, 甲四 1 point',A[1][3]==='4'&&A[2][3]==='2'&&A[3][3]==='1',A.map(r=>r[3]));
  ok('forfeit counts 0:2 with 0:25 each',/^0:50/.test(A[1][5].split(' ')[0])===false&&A[1][5].startsWith('75:'),A[1][5]);
  ok('rematch not counted',/打完 4／4 場/.test(await p.locator('.rksec').nth(0).innerText()));
  let B=await rows(1);ok('B three-way tie needs draw',B.length===3&&B.every(r=>/需抽籤/.test(r[1]))&&B.every(r=>r[0]==='1'),B);
  if(SHOT)await p.screenshot({path:SHOT+'/r-table.png',fullPage:true});
  // 名次規則：只留勝場 → 甲二、甲三同勝場，兩隊看對戰結果（甲三棄權給甲二）
  await p.click('[data-act=rkrule]');await W(300);
  if(SHOT)await p.screenshot({path:SHOT+'/r-rule.png'});
  for(const k of ['p','s','r'])await p.click('.sheet [data-act=rkkey][data-v='+k+']'),await W(120);
  await p.click('.sheet [data-act=close]');await W(250);A=await rows(0);
  ok('only wins: head-to-head decides two-team tie',A[1][1].startsWith('甲二隊')&&A[2][1].startsWith('甲三隊')&&!/需抽籤/.test(A[1][1])&&A[1][0]==='2'&&A[2][0]==='3',A);
  ok('rule text follows settings',/名次：勝場。/.test(await p.locator('.rkrule').innerText()));
  await p.click('[data-act=rkrule]');await W(300);await p.click('.sheet [data-act=rktie][data-v=none]');await W(150);await p.click('.sheet [data-act=close]');await W(250);A=await rows(0);
  ok('no head-to-head: draw',/需抽籤/.test(A[1][1])&&/需抽籤/.test(A[2][1]),A);
  await p.click('[data-act=rkrule]');await W(300);await p.click('.sheet [data-act=rkmove][data-v=r][data-d="-1"]');await W(120);
  let order=await p.locator('.sheet .rkkey .rkon').allInnerTexts();ok('move up works',order.map(x=>x.trim()).join()==='勝場,積分,分數比,局數比,分數差',order);
  await p.click('.sheet [data-act=rkreset]');await W(150);order=await p.locator('.sheet .rkkey .rkon').allInnerTexts();ok('reset to 秩序冊',order.map(x=>x.trim()).join()==='勝場,積分,局數比,分數比,分數差');
  await p.click('.sheet [data-act=close]');await W(250);
  // 分組：確認後存起來；把乙三隊換到 A 組
  await p.click('.rkask [data-act=rkgrp]');await W(300);if(SHOT)await p.screenshot({path:SHOT+'/r-grp.png'});
  const gid=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0].teams.find(t=>t.team.name==='乙三隊').id,DBK);
  await p.click('.sheet [data-act=rkgset][data-id="'+gid+'"][data-v="A 組"]');await W(120);await p.click('.sheet [data-act=rkgsave]');await W(300);
  ok('confirmed: no ask',await p.locator('.rkask').count()===0);
  const pools=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0].rank.pools['女子組'],DBK);ok('pools saved',pools&&pools[gid]==='A 組'&&Object.keys(pools).length===7,pools);
  A=await rows(0);ok('moved team listed in A',A.length===5&&A.some(r=>r[1].startsWith('乙三隊')),A);
  await p.click('[data-act=rkgrp]');await W(300);await p.click('.sheet [data-act=rkgauto]');await W(300);ok('back to auto',await p.locator('.rkask').count()===1);
  // 男子組沒有賽程
  await p.click('[data-act=cupdiv][data-v=男子組]');await W(250);ok('empty division message',/還沒有排好兩隊的比賽/.test(await p.locator('main').innerText()));
  // 版面：最窄的手機表格不超出
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(250);await p.setViewportSize({width:360,height:640});await W(300);
  ok('no horizontal page scroll at 360',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(process.env.HELPSHOT){await p.setViewportSize({width:400,height:760});await p.emulateMedia({colorScheme:'dark'});await p.evaluate(()=>{document.querySelectorAll('.page,main').forEach(e=>e.scrollTop=0);scrollTo(0,0)});await W(300);
    const r=await p.evaluate(()=>{const a=document.querySelector('.cuptabs').getBoundingClientRect(),b=document.querySelectorAll('.rksec')[0].getBoundingClientRect();return {x:0,y:Math.max(0,a.top-6),width:innerWidth,height:Math.min(innerHeight,b.bottom+6)-Math.max(0,a.top-6)}});
    await p.evaluate(()=>{const t=document.querySelector('[data-act=cuptab][data-v=rank]');t.style.outline='3px solid #E53935';t.style.outlineOffset='-3px'});
    fs.mkdirSync(process.env.HELPSHOT,{recursive:true});await p.screenshot({path:process.env.HELPSHOT+'/cuprank.png',clip:r})}
  ok('no page errors',!errs.length,errs);
  console.log('t1120-rank',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

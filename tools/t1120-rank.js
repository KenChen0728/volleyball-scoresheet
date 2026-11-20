// 積分分頁（tools/patch_v124.py → 11/21 改版 patch_v127.py）：照南社盃秩序冊算名次、分組（隊伍的組別）、一次看一組、
// 明細、抽籤結果填入、取幾名晉級、名次規則可以調、賽別（只有預賽算）、待定隊伍自動帶入、看積分捷徑、主畫面捷徑。
// 打完的比賽用 all.json 的一場（左邊那隊 2:1 贏）複製，棄權用「建立比賽＋棄權」兩筆事件。名字都是虛構的
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
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
  const cup=()=>p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);
  await p.click('[data-act=cuptab][data-v=teams]');await W(200);await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  await p.fill('#ct-text','女子組球員名單\n甲一隊\n1 王一\n甲二隊\n2 王二\n甲三隊\n3 王三\n甲四隊\n4 王四\n乙一隊\n5 李一\n乙二隊\n6 李二\n乙三隊\n7 李三');await p.click('[data-act=cupteamsave]');await W(400);
  // 賽程：A 組四邊形（對角不打），B 組三角；甲二對甲一再碰面那場是「複賽」（不算）
  await p.evaluate(([K,FMs])=>{const d=JSON.parse(localStorage.getItem(K)),c=d.cups[0],id=n=>c.teams.find(t=>t.team.name===n).id;const ms=FMs;let o=0;c.sched=[];
    const add=(a,b2,tm,m,st)=>{o++;const it={id:'s'+o,at:Date.now(),date:'2026-12-05',time:tm,court:'甲',division:'女子組',t1:id(a),t2:id(b2),n1:'',n2:'',ord:o};if(st)it.stage=st;if(m){m.cup=c.id;d.matches.push(m);it.mid=m.id}c.sched.push(it)};
    add('甲一隊','甲二隊','08:00',ms[0]);add('甲二隊','甲三隊','09:00',ms[1]);add('甲三隊','甲四隊','10:00',ms[2]);add('甲四隊','甲一隊','11:00',ms[3]);
    add('乙一隊','乙二隊','12:00',ms[4]);add('乙二隊','乙三隊','13:00',ms[5]);add('乙三隊','乙一隊','14:00',ms[6]);
    add('甲二隊','甲一隊','16:00',ms[7],'複賽');
    localStorage.setItem(K,JSON.stringify(d))},[DBK,[clone(),forfeit('t2'),clone(),forfeit('t1'),clone(),clone(),clone(),clone()]]);
  await p.reload();await W(600);await ab();
  if(!await p.locator('[data-act=cuptab]').count()){await p.locator('text=/賽事與紀錄/').first().click();await W(300);await p.locator('[data-act=cupopen]').first().click();await W(300)}
  ok('rank tab with count (複賽 not counted)',/積分\s*7/.test(await p.locator('.cuptabs').innerText()),await p.locator('.cuptabs').innerText());
  await p.click('[data-act=cuptab][data-v=sched]');await W(300);
  ok('schedule row shows stage and green set winners',/複賽/.test(await p.locator('.scrow').last().innerText())&&await p.locator('.scsets .sw').count()>0);
  await p.click('[data-act=cuptab][data-v=rank]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  const pools=await p.locator('.rkpools button').allInnerTexts();ok('pool tabs A/B',pools.map(x=>x.trim()).join()==='A 組,B 組',pools);
  ok('B tab has draw dot',await p.locator('.rkpools button').nth(1).locator('.rkdot').count()===1);
  ok('ask to confirm groups',await p.locator('.rkask').count()===1);
  const rows=async()=>p.locator('.rksec tbody tr').evaluateAll(tr=>tr.map(r=>[...r.cells].map(c=>c.innerText.replace(/\s+/g,' ').trim())));
  ok('one table at a time',await p.locator('.rksec').count()===1);
  const hd=await p.locator('.rktable thead').innerText();ok('headers',/勝局:敗局/.test(hd)&&/局數比/.test(hd)&&/得分:失分/.test(hd)&&/得失分比/.test(hd)&&/場/.test(hd),hd);
  let A=await rows();
  ok('A order',A.map(r=>r[1].replace(/\s*明細.*$/,'').split(' ')[0]).join()==='甲一隊,甲二隊,甲三隊,甲四隊',A);
  ok('甲一: 勝 2 場 2 積分 5 局 4:1',A[0][2]==='2'&&A[0][3]==='2'&&A[0][4]==='5'&&/^4:1/.test(A[0][5]),A[0]);
  ok('points 4,2,1',A[1][4]==='4'&&A[2][4]==='2'&&A[3][4]==='1',A.map(r=>r[4]));
  ok('A complete: top 2 advance',/晉級/.test(A[0][1])&&/晉級/.test(A[1][1])&&!/晉級/.test(A[2][1])&&await p.locator('.rksec tbody tr.rkcut').count()===1,A.map(r=>r[1]));
  ok('A 4/4 played',/打完 4／4 場/.test(await p.locator('.rkhead').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/r-table.png',fullPage:true});
  // 明細
  await p.locator('.rksec tbody tr').nth(1).locator('[data-act=rkdet]:visible').click();await W(300);const dt=await p.locator('.sheet').innerText();
  ok('detail lines',/甲二隊　明細/.test(dt)&&/對 甲一隊/.test(dt)&&/1:2/.test(dt)&&/積分 1/.test(dt)&&/對方棄權（每局 0:25）/.test(dt)&&/1 \+ 3 = 4/.test(dt)&&/勝 3 局 ÷ 敗 2 局 = 1\.500/.test(dt),dt);
  if(SHOT)await p.screenshot({path:SHOT+'/r-det.png'});
  await p.click('.sheet [data-act=close]');await W(200);
  // B 組：三隊同分 → 抽籤
  await p.locator('.rkpools button').nth(1).click();await W(300);let B=await rows();
  ok('B draw range cells',B.length===3&&B.every(r=>/^1–3 抽籤/.test(r[0])),B.map(r=>r[0]));
  ok('B header tag',/需抽籤/.test(await p.locator('.rkhead').innerText()));
  ok('draw crosses advance line',B.every(r=>/抽籤決定晉級/.test(r[1])),B.map(r=>r[1]));
  if(SHOT)await p.screenshot({path:SHOT+'/r-draw.png'});
  await p.locator('.rkdrawbtn').first().click();await W(300);
  for(const n of ['乙三隊','乙一隊','乙二隊']){await p.locator('.sheet [data-act=rkdpick]',{hasText:n}).click();await W(100)}
  ok('draw order shows places',/第 1 名/.test(await p.locator('.sheet').innerText()));
  await p.click('.sheet [data-act=rkdsave]');await W(300);B=await rows();
  ok('draw result applied',B.map(r=>r[1].replace(/\s*明細.*$/,'').split(' ')[0]).join()==='乙三隊,乙一隊,乙二隊'&&B[0][0].startsWith('1')&&/抽籤/.test(B[0][0])&&/晉級/.test(B[1][1]),B);
  ok('no more draw tag/dot',!/需抽籤/.test(await p.locator('.rkhead').innerText())&&await p.locator('.rkdot').count()===0);
  // 名次規則：只留勝場 → 甲二、甲三兩隊同勝場，看對戰
  await p.locator('.rkpools button').nth(0).click();await W(200);
  await p.click('[data-act=rkrule]');await W(300);if(SHOT)await p.screenshot({path:SHOT+'/r-rule.png'});
  for(const k of ['p','s','r']){await p.click('.sheet [data-act=rkkey][data-v='+k+']');await W(120)}
  await p.click('.sheet [data-act=close]');await W(250);A=await rows();
  ok('only wins: head-to-head',A[1][1].startsWith('甲二隊')&&A[2][1].startsWith('甲三隊')&&A[1][0]==='2'&&A[2][0]==='3',A);
  await p.click('[data-act=rkrule]');await W(300);await p.click('.sheet [data-act=rktie][data-v=none]');await W(150);await p.click('.sheet [data-act=close]');await W(250);A=await rows();
  ok('no head-to-head: 2–3 draw',/^2–3 抽籤/.test(A[1][0])&&/^2–3 抽籤/.test(A[2][0]),A.map(r=>r[0]));
  await p.click('[data-act=rkrule]');await W(300);await p.click('.sheet [data-act=rkreset]');await W(150);await p.click('.sheet [data-act=close]');await W(250);
  // 分組：確認（寫進隊伍的組別）、改組名、取幾名、不分組
  await p.click('.rkask [data-act=rkgrp]');await W(300);if(SHOT)await p.screenshot({path:SHOT+'/r-grp.png'});
  const ord0=await p.locator('.sheet .rkgrow strong').allInnerTexts();
  const gid=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0].teams.find(t=>t.team.name==='乙三隊').id,DBK);
  await p.click('.sheet [data-act=rkgset][data-id="'+gid+'"][data-v="0"]');await W(120);
  ok('team order fixed after moving',(await p.locator('.sheet .rkgrow strong').allInnerTexts()).join()===ord0.join());
  await p.click('.sheet [data-act=rkgset][data-id="'+gid+'"][data-v="1"]');await W(120);
  await p.fill('.sheet [data-rkg="1"]','乙');await p.click('.sheet [data-act=rkgadv][data-d="-1"]');await W(120);
  await p.click('.sheet [data-act=rkgsave]');await W(300);
  let c=await cup();ok('groups saved on teams',c.teams.filter(t=>t.group==='A組').length===4&&c.teams.filter(t=>t.group==='乙組').length===3,c.teams.map(t=>t.team.name+':'+t.group));
  ok('adv saved',c.rank&&c.rank.adv&&c.rank.adv['女子組']===1,c.rank);
  ok('pool tabs renamed',(await p.locator('.rkpools button').allInnerTexts()).map(x=>x.trim()).join()==='A 組,乙組',await p.locator('.rkpools button').allInnerTexts());
  ok('ask gone after confirm',await p.locator('.rkask').count()===0);
  A=await rows();ok('adv 1: only first advances',/晉級/.test(A[0][1])&&!/晉級/.test(A[1][1]),A.map(r=>r[1]));
  await p.click('[data-act=cuptab][data-v=teams]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]').catch(()=>{});await W(200);
  const th=await p.locator('main').innerText();ok('teams tab grouped with headings',/A 組/.test(th)&&/乙組/.test(th)&&await p.locator('.tsegrow [data-act=rkgrp]').count()===1,th.slice(0,300));
  await p.click('.tsegrow [data-act=rkgrp]');await W(300);ok('group sheet from teams tab',await p.locator('.sheet .rkgrow').count()===7);
  await p.click('.sheet [data-act=rkgdiv][data-v=男子組]');await W(200);ok('group sheet switches division',/男子組還沒有隊伍/.test(await p.locator('.sheet').innerText()));
  await p.click('.sheet [data-act=close]');await W(200);
  // 待定隊伍：複賽「A 組第 1 名」對「乙組第 1 名」
  await p.click('[data-act=cuptab][data-v=sched]');await W(300);await p.click('[data-act=scnew]');await W(300);
  await p.click('.sheet [data-act=scdiv][data-v=女子組]').catch(()=>{});await W(100);
  await p.click('.sheet [data-act=scstage][data-v=複賽]');await W(100);await p.click('.sheet [data-act=sctbd]');await W(200);
  const chips=await p.locator('.sheet [data-act=scref]').allInnerTexts();
  ok('ref chips',chips.some(x=>/A 組第 1 名/.test(x)&&/甲一隊/.test(x))&&chips.some(x=>/乙組第 1 名/.test(x)&&/乙三隊/.test(x))&&chips.some(x=>/勝隊/.test(x)),chips);
  if(SHOT)await p.screenshot({path:SHOT+'/r-ref.png'});
  await p.locator('.sheet [data-act=scref]',{hasText:'A 組第 1 名'}).click();await W(120);await p.locator('.sheet [data-act=scref]',{hasText:'乙組第 1 名'}).click();await W(120);
  ok('slots show resolved teams',/甲一隊/.test(await p.locator('.scslots').innerText())&&/乙三隊/.test(await p.locator('.scslots').innerText()),await p.locator('.scslots').innerText());
  await p.click('[data-act=scsave1]:not([data-v])');await W(300);if(await p.locator('[data-act=scsave1][data-force]').count()){await p.click('[data-act=scsave1][data-force]');await W(300)}
  c=await cup();const ko=c.sched.find(x=>x.stage==='複賽'&&x.r1);ok('ref saved',ko&&ko.r1==='g|A|1'&&!ko.t1,ko);
  const lr=await p.locator('.scrow').filter({hasText:'甲一隊'}).filter({hasText:'複賽'}).count();ok('schedule row shows resolved names',lr>=1);
  if(ko){await p.click('[data-act=cuptab][data-v=teams]');await W(200);await p.click('.tsegrow [data-act=rkgrp]');await W(300);await p.fill('.sheet [data-rkg="1"]','丙');await p.click('.sheet [data-act=rkgsave]');await W(300);
    c=await cup();const kr=c.sched.find(x=>x.id===ko.id);ok('rename group updates ref',kr.r2==='g|丙|1'&&c.teams.filter(t=>t.group==='丙組').length===3,kr);
    await p.click('[data-act=cuptab][data-v=sched]');await W(300);ok('row shows renamed ref resolved',await p.locator('.scrow').filter({hasText:'乙三隊'}).filter({hasText:'複賽'}).count()>=1)}
  if(ko){await p.locator('[data-act=scopen]').filter({hasText:'乙三隊'}).first().click();await W(300);await p.click('.sheet [data-act=scgo]');await W(600);
    c=await cup();const ko2=c.sched.find(x=>x.id===ko.id);ok('start writes team ids',!!ko2.t1&&!!ko2.t2&&!!ko2.mid,ko2);
    await p.locator('.barback').first().click().catch(()=>{});await W(400)}
  // 看積分：打完的那場
  if(!await p.locator('[data-act=cuptab]').count()){await p.locator('[data-act=cupopen]').first().click().catch(()=>{});await W(300)}
  await p.click('[data-act=cuptab][data-v=sched]');await W(300);await p.locator('.scrow').first().click();await W(600);
  ok('result page has 看積分',await p.locator('[data-act=rkgo]').count()===1);
  await p.click('[data-act=rkgo]');await W(400);ok('rkgo opens rank tab',await p.locator('.cuptabs [data-v=rank][aria-selected=true]').count()===1&&await p.locator('.rksec').count()===1);
  // 主畫面捷徑
  await p.locator('.barback').first().click();await W(300);await p.locator('[data-act=home]').first().click().catch(()=>{});await W(400);
  const nav=p.locator('.hcupnav [data-tab=rank]');ok('home has 賽程｜積分｜隊伍',await nav.count()===1);
  if(await nav.count()){await nav.click();await W(400);ok('home → rank tab',await p.locator('.cuptabs [data-v=rank][aria-selected=true]').count()===1)}
  if(process.env.HELPSHOT){await p.setViewportSize({width:400,height:760});await p.emulateMedia({colorScheme:'dark'});await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
    await p.evaluate(()=>{document.querySelectorAll('.page,main').forEach(e=>e.scrollTop=0);scrollTo(0,0)});await W(300);
    const r=await p.evaluate(()=>{const a=document.querySelector('.cuptabs').getBoundingClientRect(),b=document.querySelector('.rksec').getBoundingClientRect();return {x:0,y:Math.max(0,a.top-6),width:innerWidth,height:Math.min(innerHeight,b.bottom+6)-Math.max(0,a.top-6)}});
    await p.evaluate(()=>{const t=document.querySelector('[data-act=cuptab][data-v=rank]');t.style.outline='3px solid #E53935';t.style.outlineOffset='-3px'});
    fs.mkdirSync(process.env.HELPSHOT,{recursive:true});await p.screenshot({path:process.env.HELPSHOT+'/cuprank.png',clip:r});
    await p.evaluate(()=>{const t=document.querySelector('[data-act=cuptab][data-v=rank]');t.style.outline='';t.style.outlineOffset=''});
    await p.click('[data-act=cuptab][data-v=teams]');await W(300);await p.click('.tsegrow [data-act=rkgrp]');await W(400);
    await p.evaluate(()=>{const t=document.querySelector('.tsegrow [data-act=rkgrp]');if(t){t.style.outline='3px solid #E53935';t.style.outlineOffset='-3px'}});
    await p.screenshot({path:process.env.HELPSHOT+'/cupgrp.png'});await p.click('.sheet [data-act=close]');await W(200)}
  await p.setViewportSize({width:390,height:844});await p.click('[data-act=cuptab][data-v=rank]');await W(300);
  // 不分組
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(200);await p.click('[data-act=rkgrp]');await W(300);await p.click('.sheet [data-act=rkgnone]');await W(300);c=await cup();ok('no groups',c.teams.every(t=>!t.group));
  await p.setViewportSize({width:360,height:640});await W(300);ok('no horizontal page scroll at 360',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  ok('no page errors',!errs.length,errs);
  console.log('t1120-rank',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

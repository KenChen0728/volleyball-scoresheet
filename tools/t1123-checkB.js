// 11/23 照「實機測試清單-1121」B 段一步一步做（用 mk-ranktest.js 產生的積分測試盃，跟給使用者的檔案一樣），iPhone 390×844 觸控
// 用法：node tools/mk-ranktest.js /tmp/ck/rank.json；node tools/t1123-checkB.js [網址] [檔案]
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',FILE=process.argv[3]||'/tmp/ck/rank.json',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;console.log('ok  ',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,500))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errs.push(e.message));
  const shot=async n=>{if(SHOT)await p.screenshot({path:SHOT+'/'+n+'.png'})};
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(500);
  const ab=async()=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};await ab();
  // B1 匯入
  await p.getByText('賽事與紀錄',{exact:true}).first().click();await W(400);
  await p.setInputFiles('#import-file',FILE);await W(400);const plan=await p.locator('.sheet').innerText();
  ok('B1 匯入計畫：比賽 12 場、隊伍 11 隊、賽程 16 場',/新增 12 場/.test(plan)&&/新增 11 隊/.test(plan)&&/賽程新增 16 場/.test(plan),plan);await shot('B1');
  await p.click('[data-act=impgo]');await W(500);
  // B2 打開積分
  await p.locator('[data-act=cupopen]').filter({hasText:'積分測試盃'}).first().click();await W(400);
  await p.click('[data-act=cuptab][data-v=rank]');await W(400);
  const hd=await p.locator('.rktable thead').innerText().catch(()=>'' );
  ok('B2 欄位',['名次','隊名','勝','場','積分','勝局:敗局','局數比','得分:失分','得失分比'].every(k=>hd.includes(k)),hd);
  ok('B2 手機上隊名下面有「明細 ›」',await p.locator('.rksec tbody tr').first().locator('[data-act=rkdet]:visible').filter({hasText:'明細'}).count()>=1);
  const rows=()=>p.locator('.rksec tbody tr').evaluateAll(tr=>tr.map(r=>[...r.cells].map(c=>c.innerText.replace(/\s+/g,' ').trim())));
  const names=R=>R.map(r=>r[1].split(' ')[0]);
  // B3 男子組
  await p.click('[data-act=cupdiv][data-v=男子組]').catch(()=>{});await W(300);let R=await rows();
  ok('B3 男子組 6／6 場',/打完 6／6 場/.test(await p.locator('.rkhead').innerText()),await p.locator('.rkhead').innerText());
  ok('B3 名次 山貓、海豚、雪豹、飛鷹',names(R).join()==='山貓隊,海豚隊,雪豹隊,飛鷹隊',names(R));
  ok('B3 沒有 A 組｜B 組',await p.locator('.rkpools button').count()===0);await shot('B3');
  // B4 女子組
  await p.click('[data-act=cupdiv][data-v=女子組]');await W(300);
  ok('B4 A 組｜B 組，B 有橘點',(await p.locator('.rkpools button').allInnerTexts()).map(x=>x.trim()).join()==='A 組,B 組'&&await p.locator('.rkpools button').nth(1).locator('.rkdot').count()===1);
  ok('B4 提醒一行',/照賽程分成 2 組，組名請確認/.test(await p.locator('main').innerText()));
  R=await rows();
  ok('B4 A 組 3／4 場：黑鳶、藍鵲、白鷺、綠繡眼，不標晉級',/打完 3／4 場/.test(await p.locator('.rkhead').innerText())&&names(R).join()==='黑鳶隊,藍鵲隊,白鷺隊,綠繡眼隊'&&!R.some(r=>/晉級/.test(r[1])),R);await shot('B4-A');
  // B5 明細
  await p.locator('.rksec tbody tr').nth(1).locator('[data-act=rkdet]:visible').click();await W(300);const dt=await p.locator('.sheet').innerText();
  ok('B5 藍鵲明細',/對 黑鳶隊/.test(dt)&&/0:2/.test(dt)&&/對 綠繡眼隊/.test(dt)&&/對方棄權（每局 0:25）/.test(dt)&&/0 \+ 3 = 3/.test(dt)&&/勝 2 局 ÷ 敗 2 局 = 1\.000/.test(dt),dt);await shot('B5');
  await p.click('.sheet [data-act=close]');await W(200);
  // B4 B 組
  await p.locator('.rkpools button').nth(1).click();await W(300);R=await rows();
  ok('B4 B 組需抽籤、1–3 抽籤、抽籤決定晉級',/需抽籤/.test(await p.locator('.rkhead').innerText())&&R.length===3&&R.every(r=>/^1–3 抽籤/.test(r[0])&&/抽籤決定晉級/.test(r[1])),R);await shot('B4-B');
  // B6 填抽籤
  const draw=async()=>{await p.locator('.rkdrawbtn').first().click();await W(300);for(const n of ['灰鶴隊','紅隼隊','黃鸝隊']){await p.locator('.sheet [data-act=rkdpick]',{hasText:n}).click();await W(120)}await p.click('.sheet [data-act=rkdsave]');await W(300)};
  await draw();R=await rows();
  ok('B6 名次 1 灰鶴 2 紅隼 3 黃鸝，寫「抽籤」',names(R).join()==='灰鶴隊,紅隼隊,黃鸝隊'&&R.every(r=>/抽籤/.test(r[0])),R);
  ok('B6 橘色需抽籤和橘點不見',!/需抽籤/.test(await p.locator('.rkhead').innerText())&&await p.locator('.rkdot').count()===0);await shot('B6');
  await p.locator('.rkdrawbtn.done').first().click();await W(300);await p.getByText('清除抽籤結果').click();await W(300);R=await rows();
  ok('B6 清除後回到 1–3 抽籤',R.every(r=>/^1–3 抽籤/.test(r[0])),R.map(r=>r[0]));await draw();
  // B7 分組
  await p.getByRole('button',{name:'分組'}).last().click();await W(300);const gs=await p.locator('.sheet').innerText();
  ok('B7 分組視窗：男女組切換、三個組名框',await p.locator('.sheet [data-act=rkgdiv]').count()>=2&&await p.locator('.sheet [data-rkg]').count()===3,gs.slice(0,300));await shot('B7');
  await p.fill('.sheet [data-rkg="1"]','乙');
  for(let i=0;i<3;i++){const t=await p.locator('.sheet').innerText();if(/每組取前\s*\n*\s*−\s*\n*\s*1\s*\n/.test(t))break;await p.click('.sheet [data-act=rkgadv][data-d="-1"]');await W(120)}
  0&&console.log('改完：',(await p.locator('.sheet').innerText()).replace(/\n+/g,' | ').slice(-200));
  await p.getByRole('button',{name:'確定分組'}).click();await W(400);
  ok('B7 變成 A 組｜乙組、提醒不見、抽籤還在',(await p.locator('.rkpools button').allInnerTexts()).map(x=>x.trim()).join()==='A 組,乙組'&&!/組名請確認/.test(await p.locator('main').innerText()),await p.locator('.rkpools button').allInnerTexts());
  await p.locator('.rkpools button').nth(1).click();await W(300);R=await rows();ok('B7 乙組抽籤結果還在',names(R).join()==='灰鶴隊,紅隼隊,黃鸝隊',names(R));
  // B8 隊伍分頁
  await p.click('[data-act=cuptab][data-v=teams]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]').catch(()=>{});await W(200);const th=await p.locator('main').innerText();
  ok('B8 隊伍照 A 組、乙組分段，旁邊有分組',/A 組/.test(th)&&/乙組/.test(th)&&await p.locator('.tsegrow [data-act=rkgrp]').count()===1,th.slice(0,200));await shot('B8');
  // B9 打一場：綠繡眼對白鷺，白鷺賽前沒收
  await p.click('[data-act=cuptab][data-v=sched]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]').catch(()=>{});await W(200);
  const row=p.locator('.scrow').filter({hasText:'綠繡眼隊'}).filter({hasText:'白鷺隊'}).first();
  await row.click();await W(400);await p.locator('.sheet [data-act=scgo]').first().click();await W(700);
  let reached=false;for(let i=0;i<6&&!reached;i++){if(await p.locator('[data-act=sheet][data-v=pf]').count()){reached=true;break}
    const st=p.locator('[data-act=page][data-v=toss]');if(await st.count()){await st.first().click();await W(400);continue}
    const nx=p.locator('.foot .primary').first();if(await nx.count()){await nx.click();await W(400)}else break}
  ok('B9 走到挑邊頁看得到「賽前沒收」',reached,(await p.locator('main').innerText()).slice(0,200));
  if(reached){await p.click('[data-act=sheet][data-v=pf]');await W(300);await p.click('.sheet [data-act=pfreason][data-v=逾時未出賽]');await W(100);
    await p.locator('.sheet [data-act=pfwin]').filter({hasText:'綠繡眼隊'}).click();await W(100);await p.click('.sheet [data-act=pfdo]');await W(500);
    for(let i=0;i<3;i++){const yes=p.locator('.sheet button').filter({hasText:/確定|結束/});if(!await yes.count())break;await yes.first().click();await W(500)}
    0&&console.log('沒收後畫面：',(await p.locator('body').innerText()).replace(/\n+/g,' | ').slice(0,400));
    if(!await p.locator('[data-act=rkgo]').count()){const rt=p.locator('[data-act=rtab][data-v=res],.rtabs [data-v=res]');if(await rt.count()){await rt.first().click();await W(400)}
      0&&console.log('結果分頁：',(await p.locator('main').innerText()).replace(/\n+/g,' | ').slice(0,300),'| rkgo',await p.locator('[data-act=rkgo]').count())}
    const rk=p.locator('[data-act=rkgo]');ok('B12 結果頁有「看積分」',await rk.count()>=1);await shot('B12');
    if(await rk.count()){await rk.first().click();await W(500);R=await rows();
      ok('B12 直接到 A 組積分表',/A 組/.test(await p.locator('.rkhead').innerText()),await p.locator('.rkhead').innerText());
      ok('B9 A 組 4／4 場：黑鳶（晉級）、藍鵲、綠繡眼、白鷺，第 1 名下面一條線',/打完 4／4 場/.test(await p.locator('.rkhead').innerText())&&names(R).join()==='黑鳶隊,藍鵲隊,綠繡眼隊,白鷺隊'&&/晉級/.test(R[0][1])&&!/晉級/.test(R[1][1])&&await p.locator('.rksec tbody tr.rkcut').count()===1,R);await shot('B9')}}
  // B10 待定隊伍
  await p.click('[data-act=cuptab][data-v=sched]');await W(300);await p.click('[data-act=cupdiv][data-v=女子組]').catch(()=>{});await W(200);
  const rws=await p.locator('.scrow').allInnerTexts();const last3=rws.slice(-3).map(x=>x.replace(/\s+/g,' '));
  ok('B10 最後三場是複賽、冠亞賽，A 組打完乙組抽過籤直接寫隊名',last3.some(x=>/複賽/.test(x))&&last3.some(x=>/冠亞賽/.test(x))&&last3.some(x=>/黑鳶隊/.test(x)),last3);
  ok('B10 冠亞賽寫「第 N 場勝隊」',last3.some(x=>/冠亞賽/.test(x)&&/第 \d+ 場勝隊/.test(x)),last3);await shot('B10');
  // B14 綠色比分
  ok('B14 打完的場次贏的那邊綠色粗體',await p.locator('.scsets .sw').count()>0&&await p.locator('.scsets .sw').first().evaluate(e=>{const c=getComputedStyle(e);return +c.fontWeight>=600}));
  // B11 新增待定的比賽
  await p.click('[data-act=scnew]');await W(300);await p.click('.sheet [data-act=scdiv][data-v=女子組]').catch(()=>{});await W(100);
  await p.click('.sheet [data-act=scstage][data-v=冠亞賽]');await W(100);await p.getByText('隊伍還沒確定').click();await W(200);
  const chips=await p.locator('.sheet [data-act=scref]').allInnerTexts();
  ok('B11 有 A 組第 1 名（黑鳶隊）、乙組第 1 名、第 N 場勝隊',chips.some(x=>/A 組第 1 名/.test(x)&&/黑鳶隊/.test(x))&&chips.some(x=>/乙組第 1 名/.test(x))&&chips.some(x=>/第 \d+ 場勝隊/.test(x)),chips);await shot('B11');
  await p.locator('.sheet [data-act=scref]',{hasText:'A 組第 1 名'}).click();await W(120);await p.locator('.sheet [data-act=scref]',{hasText:'乙組第 1 名'}).click();await W(120);
  const sl=await p.locator('.scslots').innerText();ok('B11 兩個格子寫隊名',/黑鳶隊/.test(sl)&&/灰鶴隊/.test(sl),sl);
  await p.click('[data-act=scsave1]:not([data-v])');await W(300);if(await p.locator('[data-act=scsave1][data-force]').count()){await p.click('[data-act=scsave1][data-force]');await W(300)}
  ok('B11 儲存了',await p.locator('.sheet [data-act=scref]').count()===0);
  // B13 主畫面捷徑
  for(let i=0;i<3&&!await p.locator('.hcupnav').count();i++){const bk=p.locator('.barback,[data-act=home]');if(!await bk.count())break;await bk.first().click();await W(400)}
  ok('B13 主畫面有「賽程｜積分｜隊伍」',await p.locator('.hcupnav [data-tab=rank]').count()===1,(await p.locator('main').innerText()).slice(0,200));await shot('B13');
  if(await p.locator('.hcupnav [data-tab=rank]').count()){await p.locator('.hcupnav [data-tab=rank]').click();await W(400);ok('B13 按「積分」直接到積分頁',await p.locator('.rktable').count()===1)}
  ok('沒有畫面錯誤',errs.length===0,errs);
  console.log('t1123-checkB',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

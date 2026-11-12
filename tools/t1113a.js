// 11/13 第 1～6 項：0:0 不能暫停、修正比分擋最後一分、記事欄那一隊分數在前、同一次死球第二組替補先問、羅馬數字不碰號碼、最近刪除
// node tools/t1113a.js [網址] [資料 key]（要先 python3 tools/fixture1111.py；學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const fs=require('fs');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
const FIX=fs.readFileSync('/tmp/fix1111.json','utf8');
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[402,874],[1180,820]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));const tag=w+' ';
  const db=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');
  const closeAbout=async()=>{if(await ab.count()){await ab.first().click();await W(200)}};
  const fresh=async data=>{await p.goto(URL);await p.evaluate(([k,v])=>{localStorage.clear();sessionStorage.clear();if(v)localStorage.setItem(k,v)},[KEY,data||null]);await p.reload();await W(350);await closeAbout()};
  const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
  const serve=async()=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}};
  const point=async t=>{await serve();await p.click(`[data-act=point][data-team=${t}]`);await W(700)};
  const sheet=async()=>(await p.locator('.sheet').count())?(await p.locator('.sheet').first().innerText()).replace(/\s+/g,' '):'';
  const evs=async()=>{const d=await db();return d.matches.filter(m=>m.id===d.currentId)[0].events};
  // 程式的函式不在 window 上：比分、左邊的隊從事件算（這場沒有判罰給分）
  const st=async()=>{const e=await evs(),dead={};e.forEach(x=>{if(x.type==='UNDO')dead[x.data.target]=1});const live=e.filter(x=>!dead[x.id]&&x.type!=='UNDO');let A='t1';const score={t1:0,t2:0};
    live.forEach(x=>{if(x.type==='TOSS_SET'&&x.data.set===1)A=x.data.left;if(x.type==='POINT'&&x.data.set===1)score[x.data.team]++});return {score,A}};

  // ---------- 1. 0:0 不能暫停 ----------
  await fresh();await flow.start(p,{serve:'t1'});await W(300);
  await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0];
    m.events.splice(1,0,...[21,22,23].map(no=>({id:'tadd'+no,matchId:m.id,seq:0,at:e0.at,device:e0.device,type:'PLAYER_ADDED',data:{team:'t2',no}})));localStorage.setItem(k,JSON.stringify(d))},KEY);
  await p.reload();await W(350);await closeAbout();
  ok(tag+'0:0 timeout dim both',await p.locator('[data-act=why][data-v*="0:0 不能暫停"]').count()===2);
  await p.locator('[data-act=why][data-v*="0:0 不能暫停"]').first().click({force:true});await W(150);
  ok(tag+'0:0 timeout reason shown',(await p.locator('.lockline').first().innerText()).includes('0:0 不能暫停'));
  ok(tag+'0:0 sub allowed',await p.locator('[data-act=subopen][data-team=t2]').count()===1);
  await point('t1');
  ok(tag+'1:0 timeout enabled',await p.locator('[data-act=timeout]').count()===2);

  // ---------- 4. 同一次死球換第二組替補 ----------
  await cell('t2',2).click();await W(150);await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(150);
  const in1=Number(await p.locator('.sheet [data-act=pmsubin]').first().getAttribute('data-no'));
  await p.locator('.sheet [data-act=pmsubin]').first().click();await W(300);
  await cell('t2',4).click();await W(150);
  ok(tag+'2nd sub: 替補 button enabled',await p.locator('.sheet [data-act=pmstep][data-v=sub]:not([disabled])').count()===1);
  await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(150);
  if(!SCHOOL){
    ok(tag+'2nd sub asks together',(await sheet()).includes('是一起到替補區的嗎')&&(await sheet()).includes('2 換 '+in1),await sheet());
    ok(tag+'ask has back',await p.locator('.sheet [data-act=srback]').count()===1);
    await p.click('.sheet [data-act=srback]');await W(150);ok(tag+'back to player menu',await p.locator('.sheet [data-act=pmstep][data-v=sub]').count()===1);
    await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(150);
    await p.click('.sheet [data-act=srno]');await W(150);
    ok(tag+'not together: blocked',(await sheet()).includes('這次不能再換')&&(await sheet()).includes('判罰'),await sheet());
    await p.click('.sheet [data-act=close]');await W(150);
    ok(tag+'blocked: no sub recorded',(await evs()).filter(e=>e.type==='SUB').length===1);
    await cell('t2',4).click();await W(150);await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(150);
    await p.click('.sheet [data-act=sryes]');await W(150);
    ok(tag+'together: chips shown',await p.locator('.sheet [data-act=pmsubin]').count()>=1);
  }else ok(tag+'school: no ask',await p.locator('.sheet [data-act=sryes]').count()===0&&await p.locator('.sheet [data-act=pmsubin]').count()>=1);
  const in2=Number(await p.locator('.sheet [data-act=pmsubin]').first().getAttribute('data-no'));
  await p.locator('.sheet [data-act=pmsubin]').first().click();await W(300);
  let subs=(await evs()).filter(e=>e.type==='SUB');
  ok(tag+'two subs recorded',subs.length===2&&subs[1].data.out===4&&subs[1].data.in===in2,subs.map(e=>e.data));
  if(!SCHOOL){
    ok(tag+'2nd marked same request',subs[1].data.same===true&&!subs[0].data.same);
    const nt=(await p.locator('.scnote').count())?(await p.locator('.scnote').innerText()).replace(/\s+/g,' '):'';
    ok(tag+'note lists both pairs',nt.includes('2 換 '+in1)&&nt.includes('4 換 '+in2),nt);
    // 替補鈕：同一次死球再按，先問；是 → 面板
    await p.click('[data-act=subopen][data-team=t2]');await W(200);
    ok(tag+'sub button asks',(await sheet()).includes('是一起到替補區的嗎'));
    await p.click('.sheet [data-act=sryes]');await W(250);
    ok(tag+'yes opens panel',await p.locator('.kp.bench').count()===1);
    await p.locator('.kp.bench .go').first().click();await W(900); // 面板關掉後 0.7 秒內不能發球
    // 打完一球就不用問
    await point('t2');
    await p.click('[data-act=subopen][data-team=t2]');await W(250);
    ok(tag+'new rally: no ask',await p.locator('.sheet [data-act=sryes]').count()===0&&await p.locator('.kp.bench').count()===1);
    await p.locator('.kp.bench .go').first().click();await W(250);
  }
  ok(tag+'lockline: no old lock text',!(await p.locator('.lockline').first().innerText()).includes('打完下一球才能再替補'));

  // ---------- 3. 記事欄：那一隊的分數在前 ----------
  const s0=await st(),Akey=s0.A,L=k=>k===Akey?'A 隊':'B 隊',oth=k=>k==='t1'?'t2':'t1';
  await p.click('[data-act=sheetopen]');await W(350);await p.click('[data-act=rtab][data-v=note]');await W(300);
  if(await p.locator('[data-act=accadd][data-team=t2]').count()){
    await p.click('[data-act=accadd][data-team=t2]');await W(300);
    const want='第 1 局 '+L('t2')+' '+s0.score.t2+':'+s0.score.t1+' 請求 AC 代 C';
    const body=(await p.locator('body').innerText()).replace(/\s+/g,' ');
    ok(tag+'remark AC team-first',body.includes(want),want);
    ok(tag+'no A:B in remarks',!body.includes('局 A:B '));
    ok(tag+'quick buttons per team',await p.locator('[data-act=rmscore][data-team=t1]').count()===1&&await p.locator('[data-act=rmscore][data-team=t2]').count()===1);
    await p.click('[data-act=rmscore][data-team=t1]');await W(300);
    const rm=(await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0];return m.events.filter(e=>e.type==='INFO_SET'&&e.data.field==='remarks').pop().data.value},KEY));
    ok(tag+'remark quick text',rm.endsWith('第 1 局 '+L('t1')+' '+s0.score.t1+':'+s0.score.t2+'，'),rm);
  }else ok(tag+'no quick notes here (school)',SCHOOL);

  // ---------- 1. 補記、修正比分：0:0 不能暫停 ----------
  await p.click('[data-act=rtab][data-v=fix]');await W(300);
  await p.click('[data-act=insopen]');await W(250);
  await p.click('.sheet [data-act=insteam][data-team=t1]');await W(150);await p.click('.sheet [data-act=inskind][data-v=T]');await W(150);
  await p.fill('#ins0','0');await p.fill('#ins1','0');await p.click('[data-act=insgo]');await W(250);
  ok(tag+'insert TO at 0:0 blocked',(await sheet()).includes('0:0 不能暫停'),await sheet());
  await p.fill('#ins0','1');await p.fill('#ins1','0');await p.click('[data-act=insgo]');await W(300);
  const toRows=p.locator('.fixrow',{hasText:'暫停'});
  ok(tag+'insert TO at 1:0 ok',await toRows.count()===1);
  await toRows.first().click();await W(200);
  if(await p.locator('#amsc0').count()===0){const sc=p.locator('.sheet [data-act=amendsc],.sheet [data-act=scedit]');if(await sc.count()){await sc.first().click();await W(150)}}
  await p.fill('#amsc0','0');await p.fill('#amsc1','0');await p.click('.sheet [data-act=amendscore]');await W(250);
  ok(tag+'fix TO score to 0:0 blocked',(await sheet()).includes('0:0 不能暫停'),await sheet());
  if(await p.locator('.sheet [data-act=close]').count()){await p.locator('.sheet [data-act=close]').first().click();await W(150)}

  // ---------- 2. 修正比分：不能改到局已經結束的最後一分 ----------
  await fresh(FIX);
  await p.locator('.rmain',{hasText:'恆春'}).click();await W(400);
  for(let i=0;i<4;i++){const cp=p.locator('[data-act=copy]');if(await cp.count()){await cp.first().click();await W(250)}const lk=p.locator('[data-act=lu-lock]');if(await lk.count()&&!(await lk.first().isDisabled())){await lk.first().click();await W(250)}if(await p.locator('[data-act=start]').count())break}
  await p.click('[data-act=start]');await W(300);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await W(300)}
  await p.click('[data-act=sheetopen]');await W(300);await p.click('[data-act=rtab][data-v=fix]');await W(250);await p.click('[data-act=fixset][data-v="1"]');await W(200);
  await p.locator('.fixrow',{hasText:'暫停'}).first().click();await W(200);
  // 第 1 局 25:12：暫停那一隊是 25 或 12，兩種都試，有一種是這局最後一分
  await p.fill('#amsc0','25');await p.fill('#amsc1','12');await p.click('.sheet [data-act=amendscore]');await W(250);
  if(!(await sheet()).includes('最後一分')){await p.fill('#amsc0','12');await p.fill('#amsc1','25');await p.click('.sheet [data-act=amendscore]');await W(250)}
  ok(tag+'fix to final score blocked',(await sheet()).includes('最後一分'),await sheet());
  if(await p.locator('.sheet [data-act=close]').count()){await p.locator('.sheet [data-act=close]').first().click();await W(150)}

  // ---------- 6. 最近刪除 ----------
  await fresh(FIX);
  ok(tag+'home card delete button',(await p.locator('.rrow.hasdel .rcdel').first().innerText()).includes('刪除'));
  await p.locator('.rrow.hasdel',{hasText:'恆春'}).locator('.rcdel').click();await W(200);
  ok(tag+'ask mentions trash',(await p.locator('.rrow.ask').innerText()).includes('最近刪除'));
  ok(tag+'ask button not red',await p.locator('.rrow.ask [data-act=del-yes]:not(.danger)').count()===1);
  await p.click('.rrow.ask [data-act=del-yes]');await W(300);
  let d=await db();
  ok(tag+'moved to trash',!d.matches.some(m=>m.id==='mlive1')&&d.trash.length===1&&d.trash[0].id==='mlive1'&&!!d.trash[0].deletedAt);
  ok(tag+'home note after delete',(await p.locator('.homenote').innerText()).includes('最近刪除'));
  await p.click('.herobtns [data-act=history]');await W(300);
  ok(tag+'trash section',await p.locator('.trash .trow').count()===1&&(await p.locator('.trash').innerText()).includes('還留 30 天'));
  await p.click('.trash [data-act=trashback]');await W(300);d=await db();
  ok(tag+'restored',d.matches.some(m=>m.id==='mlive1')&&d.trash.length===0&&!d.matches.filter(m=>m.id==='mlive1')[0].deletedAt);
  ok(tag+'restore message',(await p.locator('#rvmsg').innerText()).includes('已救回'));
  ok(tag+'trash section gone',await p.locator('.trash').count()===0);
  // 救回時照建立時間放回去（新的在前）
  const order=d.matches.map(m=>m.id),ca=d.matches.map(m=>String(m.createdAt||''));ok(tag+'restored by created time',ca.every((c,i)=>i===0||ca[i-1]>=c),[order,ca]);
  // 選擇 → 刪除兩場 → 最近刪除
  await p.click('.shead [data-act=bksel]');await W(200);
  for(const id of ['mdone1','mdone2']){await p.click(`[data-act=bkpick][data-id=${id}]`);await W(120)}
  await p.click('.selacts [data-act=seldel]');await W(200);
  ok(tag+'select delete mentions trash',(await sheet()).includes('最近刪除'));
  await p.click('.sheet [data-act=seldelyes]');await W(300);d=await db();
  ok(tag+'select delete to trash',d.trash.length===2&&await p.locator('.trash .trow').count()===2);
  await p.locator('.trash [data-act=trashask]').first().click();await W(150);
  ok(tag+'permanent ask red',await p.locator('.trash .rrow.ask .danger[data-act=trashdel]').count()===1);
  await p.click('.trash [data-act=trashdel]');await W(250);d=await db();ok(tag+'permanent delete one',d.trash.length===1);
  await p.click('.trash [data-act=trashask][data-id="*"]');await W(150);await p.click('.trash [data-act=trashall]');await W(250);d=await db();
  ok(tag+'delete all',d.trash.length===0&&await p.locator('.trash').count()===0);
  // 30 天自動清掉
  await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const a=JSON.parse(JSON.stringify(d.matches[0])),c=JSON.parse(JSON.stringify(d.matches[0]));a.id='old31';c.id='old29';a.deletedAt=new Date(Date.now()-31*864e5).toISOString();c.deletedAt=new Date(Date.now()-29*864e5).toISOString();d.trash=[a,c];localStorage.setItem(k,JSON.stringify(d))},KEY);
  await p.reload();await W(350);await closeAbout();
  if(!(await p.locator('.trash').count())&&await p.locator('.herobtns [data-act=history]').count()){await p.click('.herobtns [data-act=history]');await W(300)}
  ok(tag+'31 days purged, 29 kept',await p.locator('.trash .trow').count()===1&&(await p.locator('.trash').innerText()).includes('還留 1 天'),await p.locator('.trash').count()?await p.locator('.trash').innerText():'none');
  // 結果頁刪除
  const doneId=(await db()).matches.filter(m=>m.id.indexOf('mdone')===0)[0].id;
  await p.click(`.hrow[data-id=${doneId}]`);await W(400);
  await p.click('[data-v=delmatch]');await W(200);
  ok(tag+'result delete not red',await p.locator('.sheet [data-act=del-yes]:not(.danger)').count()===1&&(await sheet()).includes('最近刪除'));
  await p.click('.sheet [data-act=del-yes]');await W(350);d=await db();
  ok(tag+'result delete to trash',d.trash.some(m=>m.id===doneId)&&!d.matches.some(m=>m.id===doneId));

  // 練習：重新開始、使用教學選繼續或重開
  await fresh();await p.click('[data-act=helpopen]');await W(150);
  ok(tag+'help: try sample',(await p.locator('.hsample').allInnerTexts()).join('|').includes('用範例比賽試試'));
  await p.click('[data-act=sample]');await W(300);
  const id1=(await db()).currentId;
  await p.click('.bar [data-act=home]');await W(300);
  ok(tag+'practice card restart',(await p.locator('.rrow.hasdel .rcdel').innerText()).includes('重新開始'));
  ok(tag+'home note uses button name',!(await p.locator('.homenote').count())||(await p.locator('.homenote').innerText()).includes('繼續準備'),await p.locator('.homenote').count()?await p.locator('.homenote').innerText():'');
  await p.click('[data-act=helpopen]');await W(150);
  const hs=(await p.locator('.hsample').allInnerTexts()).join('|');
  ok(tag+'help: continue or new',hs.includes('繼續上次的練習')&&hs.includes('重新開一場練習'),hs);
  await p.click('[data-act=helpclose]');await W(150);
  await p.click('.rrow.hasdel .rcdel');await W(150);
  ok(tag+'restart ask',(await p.locator('.rrow.ask').innerText()).includes('重新開始練習'));
  await p.click('.rrow.ask [data-act=smpnew]');await W(400);d=await db();
  const smp=d.matches.filter(m=>m.events[0].data&&m.events[0].data.info&&m.events[0].data.info.sample);
  ok(tag+'restart: one new practice',smp.length===1&&smp[0].id!==id1&&d.currentId===smp[0].id&&d.trash.length===0,[smp.length,d.trash.length]);
  await ctx.close();
}

// ---------- 5. 羅馬數字不碰號碼（各尺寸） ----------
for(const [w,h] of [[360,640],[390,844],[402,874],[430,932],[844,390],[768,1024],[1024,768],[1180,820],[1366,768],[1920,1080]]){
  const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(300);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(150)}
  await flow.start(p,{serve:'t1'});await W(400);
  const r=await p.evaluate(()=>{var out={hit:[],sizes:[]};document.querySelectorAll('.pcourt .pc').forEach(function(c){var p=c.querySelector('.pos'),b=c.querySelector('b');if(!p||!b)return;
    var pr=p.getBoundingClientRect(),br=b.getBoundingClientRect(),fs=parseFloat(getComputedStyle(b).fontSize),f=parseFloat(getComputedStyle(p).fontSize);out.sizes.push(f);
    var hit;if(b.classList.contains('circ')){var cx=br.left+br.width/2,cy=br.top+br.height/2,rad=fs*0.75,qx=Math.max(pr.left,Math.min(cx,pr.right)),qy=Math.max(pr.top,Math.min(cy,pr.bottom));hit=(qx-cx)*(qx-cx)+(qy-cy)*(qy-cy)<rad*rad}
    else hit=pr.right>br.left&&pr.left<br.right&&pr.bottom>br.top&&pr.top<br.bottom;
    if(hit&&f>11)out.hit.push(p.textContent+'/'+b.textContent+' '+f)});return out});
  ok(w+'x'+h+' numerals clear of numbers',r.hit.length===0,r.hit);
  ok(w+'x'+h+' numerals readable',Math.min(...r.sizes)>=11,r.sizes);
  if(w===402)ok('402 phone numerals smaller than 26',Math.max(...r.sizes)<26,r.sizes);
  if(w===1180)ok('1180 tablet numerals kept',Math.max(...r.sizes)>=20,r.sizes);
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'')+'t1113a pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})();

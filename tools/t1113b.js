// 11/13 第 7、8 項：局結束先跳視窗（比分、時間、經過分鐘），確定後「本局」看這局記錄表和結果，格子點了能改或補記
// node tools/t1113b.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2，只測視窗和結果頁）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const hmAdd=(t,m)=>{const [h,mi]=t.split(':').map(Number);const x=((h*60+mi+m)%1440+1440)%1440;return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0')};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of SCHOOL?[[402,874]]:[[402,874],[1180,820]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));const tag=w+' ';
  const db=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');
  const closeAbout=async()=>{if(await ab.count()){await ab.first().click();await W(200)}};
  const fresh=async()=>{await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);await closeAbout()};
  const serve=async()=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}};
  const point=async t=>{await serve();await p.click(`[data-act=point][data-team=${t}]`);await W(700)};
  const sheet=async()=>(await p.locator('.sheet').count())?(await p.locator('.sheet').last().innerText()).replace(/\s+/g,' '):'';
  const evs=async()=>{const d=await db();return d.matches.filter(m=>m.id===d.currentId)[0].events};
  const live=async()=>{const e=await evs(),dead={};e.forEach(x=>{if(x.type==='UNDO')dead[x.data.target]=1});return e.filter(x=>!dead[x.id]&&x.type!=='UNDO')};
  const st=async()=>{const e=await live();let A='t1';const score={t1:0,t2:0};e.forEach(x=>{if(x.type==='TOSS_SET'&&x.data.set===1)A=x.data.left;if(x.type==='POINT'&&x.data.set===1)score[x.data.team]++});return {score,A,B:A==='t1'?'t2':'t1'}};
  const info=async f=>{const e=await live();const l=e.filter(x=>x.type==='INFO_SET'&&x.data.field===f);return l.length?l[l.length-1].data.value:null};
  // 打到 24:20（輪流得分，5:5、6:5 這些比分都有出現），第一球在 20 分鐘前；兩隊各加三個替補
  const setup=async()=>{await fresh();await flow.start(p,{serve:'t1'});await W(300);
    await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0];
      m.events.splice(1,0,...[21,22,23].flatMap(no=>['t1','t2'].map(t=>({id:'tadd'+t+no,matchId:m.id,seq:0,at:e0.at,device:e0.device,type:'PLAYER_ADDED',data:{team:t,no}}))));
      const T=Date.now()-20*60000,seq=[];m.events.forEach(x=>{if(x.type==='SET_STARTED'&&x.data.set===1)x.at=new Date(T-1000).toISOString()}); /* 學校版沒有發球：第一球時間是開局時間 */for(let r=0;r<20;r++)seq.push('t1','t2');for(let r=0;r<4;r++)seq.push('t1');
      seq.forEach((t,j)=>{const at=new Date(T+j*25000).toISOString();m.events.push({id:'ts'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'SERVE',data:{set:1}});m.events.push({id:'tp'+j,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'POINT',data:{set:1,team:t}})});
      localStorage.setItem(k,JSON.stringify(d))},KEY);
    await p.reload();await W(400);await closeAbout()};
  const win=p.locator('.sheet.setend');

  // ---------- 視窗 ----------
  await setup();const s0=await st();ok(tag+'24:20',s0.score.t1===24&&s0.score.t2===20,s0.score);
  ok(tag+'no window before end',await win.count()===0);
  await serve();await p.click('[data-act=point][data-team=t1]');await W(250);
  ok(tag+'ok guarded',await p.locator('.sheet.setend [data-act=endok]').isDisabled());
  ok(tag+'undo guarded',await p.locator('.sheet.setend [data-act=undo]').isDisabled());
  await W(450);
  ok(tag+'window shown',await win.count()===1);
  ok(tag+'window title',(await p.locator('.sheet.setend h2').innerText()).includes('第 1 局結束'));
  const sc=await p.locator('.sescore b').allTextContents(),s1=await st();
  ok(tag+'score in court order',sc[0]===String(s1.score[s1.A])&&sc[1]===String(s1.score[s1.B]),[sc,s1]);
  const pills=await p.locator('.sescore .tpill').evaluateAll(a=>a.map(e=>e.className));ok(tag+'pills order',pills[0].includes(s1.A)&&pills[1].includes(s1.B),pills);
  const act0=await info('actual'),stv=await p.inputValue('#se-st'),env=await p.inputValue('#se-en');
  ok(tag+'start = actual',!!act0&&stv===act0,[stv,act0]);
  ok(tag+'end = start + 20',env===hmAdd(act0,20),[env,act0]);
  ok(tag+'duration 20',(await p.locator('#sedur').innerText()).includes('經過 20 分鐘'),await p.locator('#sedur').innerText());
  ok(tag+'hint',(await p.locator('.sehint').innerText()).includes(SCHOOL?'結果':'記錄表'));
  await W(450);ok(tag+'ok enabled after 1s',await p.locator('.sheet.setend [data-act=endok]').isEnabled());
  const bx=await p.locator('.sheet.setend').boundingBox();ok(tag+'window fits',bx&&bx.y>=0&&bx.y+bx.height<=h+1&&bx.x>=0&&bx.x+bx.width<=w+1,bx);
  const ob=await p.locator('.sheet.setend [data-act=endok]').boundingBox();ok(tag+'ok big',ob&&ob.height>=44,ob);
  // 點外面不會關掉
  await p.mouse.click(5,5);await W(150);ok(tag+'scrim keeps window',await win.count()===1);
  // 復原上一步
  await p.click('.sheet.setend [data-act=undo]');await W(250);
  const s2=await st();ok(tag+'undo back to 24:20',s2.score.t1===24&&s2.score.t2===20&&await win.count()===0&&await p.locator('[data-act=point]').count()===2,s2.score);
  await point('t1');ok(tag+'window again',await win.count()===1);await W(450);
  // 改開始時間：結束跟著移；改過結束時間就不跟了
  const nSt=hmAdd(act0,5);await p.fill('#se-st',nSt);await W(80);
  ok(tag+'end follows start',await p.inputValue('#se-en')===hmAdd(nSt,20),await p.inputValue('#se-en'));
  ok(tag+'duration kept',(await p.locator('#sedur').innerText()).includes('經過 20 分鐘'));
  const nEn=hmAdd(nSt,25);await p.fill('#se-en',nEn);await W(80);
  ok(tag+'duration 25',(await p.locator('#sedur').innerText()).includes('經過 25 分鐘'),await p.locator('#sedur').innerText());
  await p.fill('#se-st',hmAdd(act0,6));await W(80);ok(tag+'end stays after edit',await p.inputValue('#se-en')===nEn);
  ok(tag+'duration 24',(await p.locator('#sedur').innerText()).includes('經過 24 分鐘'));
  await p.fill('#se-st',nSt);await W(80);
  await p.fill('#se-en','');await W(80);ok(tag+'empty end text',(await p.locator('#sedur').innerText()).includes('填好開始和結束時間'));
  await p.fill('#se-en',nEn);await W(80);
  ok(tag+'not saved before ok',await info('actual')===act0&&await info('en1')===null,[await info('actual'),await info('en1')]);
  await p.click('.sheet.setend [data-act=endok]');await W(250);
  ok(tag+'window closed',await win.count()===0);
  ok(tag+'start saved',await info('actual')===nSt,await info('actual'));
  ok(tag+'end saved',await info('en1')===nEn,await info('en1'));
  // ---------- 確定之後 ----------
  ok(tag+'good banner',(await p.locator('.page .good').first().innerText()).includes('贏下第 1 局'));
  ok(tag+'next set btn',(await p.locator('.foot [data-act=endset]').innerText()).trim()==='下一局',await p.locator('.foot [data-act=endset]').innerText());
  ok(tag+'no old wording',!(await p.locator('.page').innerText()).includes('確定本局結束'));
  if(SCHOOL){
    ok(tag+'school no end tab',await p.locator('[data-act=rtab][data-v=end]').count()===0);
    ok(tag+'school result',await p.locator('[data-act=rtab][data-v=res][aria-pressed=true]').count()===1);
    await p.reload();await W(400);await closeAbout();ok(tag+'school no window after reload',await win.count()===0);
  }else{
    ok(tag+'end tab first and on',await p.locator('.sheettabs [data-act=rtab]').first().getAttribute('data-v')==='end'&&await p.locator('[data-act=rtab][data-v=end][aria-pressed=true]').count()===1);
    ok(tag+'end view',await p.locator('.endview .ctv.hot').count()>=1&&await p.locator('.endview .ctv-res').count()===1);
    ok(tag+'end hint',(await p.locator('.endhint').innerText()).includes('點一下，就能修改或補記'));
    const hot=p.locator('rect.hot');ok(tag+'hot cells 26',await hot.count()===26,await hot.count()); // 11/13 加發球格 12 格
    if(w<600){ok(tag+'two parts on phone',await p.locator('.ctparts .ctv').count()===2);
      ok(tag+'part A has A cells',await p.locator('.ctparts .ctv').nth(0).locator(`rect.hot[data-team=${s1.A}]`).count()===13&&await p.locator('.ctparts .ctv').nth(1).locator(`rect.hot[data-team=${s1.B}]`).count()===13);
    }else ok(tag+'one sheet on tablet',await p.locator('.ctparts').count()===0&&await p.locator('.ctv.hot').count()===1);
    const ws=await p.locator('rect.hot[data-v$=":P:0"]').evaluateAll(a=>a.map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]}));
    ok(tag+'cells big enough',ws.every(x=>x[0]>=30&&x[1]>=60),ws);
    // 重新整理：確定過就不再跳
    await p.reload();await W(400);await closeAbout();ok(tag+'no window after reload',await win.count()===0&&await p.locator('.endview').count()===1);
    // 暫停格：沒有紀錄 → 補記 → 有一筆 → 點了是更正
    await p.locator(`rect.hot[data-team=${s1.A}][data-v="1:T"]`).click();await W(150);
    let t=await sheet();ok(tag+'TO cell sheet',t.includes('第 1 局暫停')&&t.includes('這局還沒有暫停'),t);
    await p.click('.sheet [data-act=insopen]');await W(150);
    ok(tag+'ins preset team',await p.locator(`.sheet [data-act=insteam][data-team=${s1.A}][aria-pressed=true]`).count()===1);
    ok(tag+'ins preset TO',await p.locator('.sheet [data-act=inskind][data-v=T][aria-pressed=true]').count()===1);
    await p.click('.sheet [data-act=sheetback]');await W(150);ok(tag+'ins back to cell',(await sheet()).includes('第 1 局暫停'));
    await p.click('.sheet [data-act=insopen]');await W(150);
    await p.fill('#ins0','5');await p.fill('#ins1','5');await p.click('.sheet [data-act=insgo]');await W(200);
    ok(tag+'TO inserted, sheet closed',await p.locator('.sheet').count()===0,await sheet());
    await p.locator(`rect.hot[data-team=${s1.A}][data-v="1:T"]`).click();await W(150);
    ok(tag+'TO listed',await p.locator('.sheet .fixrow').count()===1&&(await p.locator('.sheet .fixrow em').innerText())==='5:5',await sheet());
    await p.click('.sheet .fixrow');await W(150);t=await sheet();ok(tag+'amend opened',t.includes('暫停')&&await p.locator('.sheet [data-act=sheetback]').count()===1,t);
    await p.click('.sheet [data-act=amendask]');await W(120);ok(tag+'delete confirm one back',await p.locator('.sheet [data-act=sheetback]').count()===0&&await p.locator('.sheet [data-act=amendback]').count()===1);
    await p.click('.sheet [data-act=amendback]');await W(120);
    await p.click('.sheet [data-act=sheetback]');await W(150);ok(tag+'amend back to cell',(await sheet()).includes('第 1 局暫停'));
    await p.click('.sheet [data-act=close]');await W(150);
    // 位置格：先發背號、替補
    await p.locator(`rect.hot[data-team=${s1.A}][data-v="1:P:0"]`).click();await W(150);
    t=await sheet();ok(tag+'pos sheet',t.includes('第 1 局 I 位')&&t.includes('先發')&&t.includes('這個位置沒有替補'),t);
    await p.click('.sheet [data-act=cellfix][data-v="1:L:0"]');await W(150);t=await sheet();ok(tag+'lineup fix preset',t.includes('I 位原本是'),t);
    await p.click('.sheet [data-act=fixback]');await W(150);ok(tag+'lineup back to cell',(await sheet()).includes('第 1 局 I 位'));
    await p.click('.sheet [data-act=insopen]');await W(150);
    ok(tag+'ins preset sub',await p.locator('.sheet [data-act=inskind][data-v=S][aria-pressed=true]').count()===1);
    const own=s1.A==='t1'?['6','5']:['5','6'];await p.fill('#ins0',own[0]);await p.fill('#ins1',own[1]);await p.click('.sheet [data-act=insgo]');await W(200);
    ok(tag+'ins out preset pos I',await p.locator('.sheet [data-act=insout][data-v="0"][aria-pressed=true]').count()===1,await sheet());
    await p.locator('.sheet [data-act=insin]').first().click();await W(120);await p.click('.sheet [data-act=insdo]');await W(200);
    ok(tag+'sub inserted',await p.locator('.sheet').count()===0,await sheet());
    await p.locator(`rect.hot[data-team=${s1.A}][data-v="1:P:0"]`).click();await W(150);
    ok(tag+'sub listed',await p.locator('.sheet .fixrow').count()===1&&(await p.locator('.sheet .fixrow b').innerText()).includes('換'),await sheet());
    await p.click('.sheet [data-act=close]');await W(150);
    // 先發背號真的改
    await p.locator(`rect.hot[data-team=${s1.B}][data-v="1:P:1"]`).click();await W(150);
    await p.click('.sheet [data-act=cellfix][data-v="1:L:1"]');await W(150);await p.locator('.sheet [data-act=fixno]').first().click();await W(120);
    await p.click('.sheet [data-act=fixdo]');await W(200);ok(tag+'lineup corrected',(await live()).some(x=>x.type==='LINEUP_CORRECTED')&&await p.locator('.sheet').count()===0);
    ok(tag+'still end tab',await p.locator('[data-act=rtab][data-v=end][aria-pressed=true]').count()===1);
    // 其他分頁再回來
    await p.click('[data-act=rtab][data-v=res]');await W(120);await p.click('[data-act=rtab][data-v=end]');await W(120);ok(tag+'end tab again',await p.locator('.endview').count()===1);
  }
  ok(tag+'help text',true);
  // 下一局
  await p.click('.foot [data-act=endset]');await W(300);
  ok(tag+'went to set 2',await p.locator('[data-act=copy]').count()===1||await p.locator('.side').count()>=2,await p.locator('.page').innerText().catch(()=>''));
  ok(tag+'no window in set 2',await win.count()===0);

  // ---------- 復原到這局還沒打完：局末填的結束時間清掉 ----------
  if(w<600&&!SCHOOL){
    await setup();await point('t1');await W(450);const a1=await info('actual');await p.fill('#se-en',hmAdd(a1,30));await W(60);await p.click('.sheet.setend [data-act=endok]');await W(250);
    ok(tag+'stale end saved',await info('en1')===hmAdd(a1,30));
    await p.click('.foot [data-act=undo]');await W(300);
    ok(tag+'stale end cleared',await info('en1')==='',await info('en1'));
    await point('t1');ok(tag+'window default end again',await win.count()===1&&await p.inputValue('#se-en')===hmAdd(a1,20),await p.inputValue('#se-en'));
  }
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);
await b.close();console.log('t1113b',SCHOOL?'school':'full',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

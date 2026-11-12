// 11/13 第 10 項：輪轉錯誤／非法替補（「其他」裡追回分數、記事欄自動寫、記錄表取消的分再得到畫叉）
// node tools/t1113c.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
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
  const st=async()=>{const e=await live();let A='t1';const score={t1:0,t2:0};e.forEach(x=>{if(x.type==='TOSS_SET'&&x.data.set===1)A=x.data.left;if(x.type==='POINT'&&x.data.set===1)score[x.data.team]++;if(x.type==='SCORE_CANCEL'&&x.data.set===1&&x.data.to<score[x.data.team])score[x.data.team]=x.data.to});return {score,A,B:A==='t1'?'t2':'t1'}};
  const inject=async seq=>{await p.evaluate(([k,seq])=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0],T=Date.now()-30*60000;
      seq.forEach((t,j)=>{const at=new Date(T+j*20000).toISOString();m.events.push({id:'ts'+m.events.length,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'SERVE',data:{set:1}});m.events.push({id:'tp'+m.events.length,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'POINT',data:{set:1,team:t}})});
      localStorage.setItem(k,JSON.stringify(d))},[KEY,seq]);await p.reload();await W(400);await closeAbout()};
  const rotOpen=async k=>{await p.click('[data-v=more]');await W(200);await p.click('.sheet [data-act=mteam][data-v=rot]');await W(150);await p.click(`.sheet [data-act=rotopen][data-team=${k}]`);await W(150)};
  const court=async()=>(await p.locator('.ss b, .wscore').allTextContents()).map(Number);

  await fresh();await flow.start(p,{serve:'t1'});await W(300);
  const seq=[];for(let r=0;r<9;r++)seq.push('t1','t2');seq.push('t2','t1');await inject(seq); // 10:10，t1 發球
  let s0=await st();ok(tag+'10:10',s0.score.t1===10&&s0.score.t2===10,s0.score);
  const LA=s0.A==='t1'?'A 隊':'B 隊',LB=s0.A==='t1'?'B 隊':'A 隊';
  // 「其他」裡有這一項
  await p.click('[data-v=more]');await W(200);
  const rb=p.locator('.sheet [data-act=mteam][data-v=rot]');ok(tag+'menu item',await rb.count()===1&&(await rb.innerText()).includes('輪轉錯誤／非法替補'),await sheet());
  ok(tag+'menu item enabled',await rb.isEnabled());
  await rb.click();await W(150);ok(tag+'team pick title',(await sheet()).includes('哪一隊輪轉錯誤或非法替補'));
  await p.click('.sheet [data-act=rotopen][data-team=t1]');await W(150);
  // 最後一分不是對方的：先擋
  let t=await sheet();ok(tag+'blocked until opponent point',t.includes('先給')&&t.includes('得分')&&await p.locator('#rot-to').count()===0,t);
  ok(tag+'back to menu btn',await p.locator('.sheet [data-act=sheetback]').count()===1);
  await p.click('.sheet [data-act=sheetback]');await W(150);ok(tag+'back to more',await p.locator('.sheet [data-act=mteam][data-v=rot]').count()===1);
  await p.click('.sheet [data-act=close]');await W(150);
  // 發球時抓到：按 t2 得分
  await point('t2');s0=await st();ok(tag+'10:11',s0.score.t1===10&&s0.score.t2===11,s0.score);
  await rotOpen('t1');t=await sheet();
  ok(tag+'rot sheet',t.includes('輪轉錯誤')&&t.includes('發現時')&&t.includes('10:10'),t);
  ok(tag+'kind R default',await p.locator('.sheet [data-act=rotkind][data-v=R][aria-pressed=true]').count()===1);
  await p.fill('#rot-to','12');await p.click('.sheet [data-act=rotgo]');await W(150);ok(tag+'too big',(await sheet()).includes('要填比 10 小的分數（0～9）'),await sheet());
  await p.fill('#rot-to','a');await p.click('.sheet [data-act=rotgo]');await W(150);ok(tag+'not number',(await sheet()).includes('要填數字'));
  await p.fill('#rot-to','5');await p.click('.sheet [data-act=rotgo]');await W(150);t=await sheet();
  ok(tag+'confirm text',t.includes('10 分改成 5 分')&&t.includes('取消第 6～10 分')&&t.includes('比分變成 5:11'),t);
  const want=`第 1 局 ${LA} 10:10 輪轉錯誤，${LB}得 1 分，取消 ${LA}第 6～10 分，於 5:11 繼續比賽`;
  ok(tag+'note preview',t.includes(want),[t,want]);
  ok(tag+'confirm no top back',await p.locator('.sheet [data-act=sheetback]').count()===0&&await p.locator('.sheet [data-act=rotback]').count()===1);
  await p.click('.sheet [data-act=rotback]');await W(150);ok(tag+'back keeps value',await p.inputValue('#rot-to')==='5');
  await p.click('.sheet [data-act=rotkind][data-v=S]');await W(120);ok(tag+'kind S title',(await p.locator('.sheet h2').innerText()).includes('非法替補'));
  await p.click('.sheet [data-act=rotkind][data-v=R]');await W(120);
  await p.click('.sheet [data-act=rotgo]');await W(150);await p.click('.sheet [data-act=rotdo]');await W(250);
  ok(tag+'sheet closed',await p.locator('.sheet').count()===0,await sheet());
  s0=await st();ok(tag+'5:11',s0.score.t1===5&&s0.score.t2===11,s0.score);
  const cv=await court();ok(tag+'court shows 5 and 11',cv.includes(5)&&cv.includes(11),cv);
  const ev=(await live()).filter(x=>x.type==='SCORE_CANCEL');ok(tag+'event',ev.length===1&&ev[0].data.to===5&&ev[0].data.kind==='R'&&ev[0].data.team==='t1',ev.map(x=>x.data));
  // 剛取消過：不能馬上再取消
  await rotOpen('t1');ok(tag+'no double cancel',(await sheet()).includes('剛剛已經取消過分數'));await p.click('.sheet [data-act=close]');await W(150);
  // 復原
  await p.click('.bar [data-act=undo]');await W(250);s0=await st();ok(tag+'undo restores 10:11',s0.score.t1===10&&s0.score.t2===11,s0.score);
  ok(tag+'undo toast',(await p.locator('.toast').innerText().catch(()=>'')).includes('取消分數'),await p.locator('.toast').innerText().catch(()=>''));
  // 非法替補
  await rotOpen('t1');await p.click('.sheet [data-act=rotkind][data-v=S]');await W(100);await p.fill('#rot-to','5');await p.click('.sheet [data-act=rotgo]');await W(120);
  ok(tag+'S preview',(await sheet()).includes(want.replace('輪轉錯誤','非法替補')));
  await p.click('.sheet [data-act=rotdo]');await W(250);s0=await st();ok(tag+'S 5:11',s0.score.t1===5&&s0.score.t2===11,s0.score);
  // 左右寫反對調：取消過分數要先復原
  await p.click('[data-v=more]');await W(200);await p.click('.sheet [data-act=tossfix]');await W(150);
  ok(tag+'swap blocked after cancel',await p.locator('.sheet [data-act=tfask][data-v=swap]').isDisabled()&&(await sheet()).includes('取消分數'),await sheet());
  await p.click('.sheet [data-act=close]');await W(150);
  // 記事欄
  await p.click('[data-act=sheetopen]');await W(350);await p.click('[data-act=rtab][data-v=note]');await W(300);
  const nt=(await p.locator(SCHOOL?'.page':'.ctv-note').evaluate(e=>e.textContent)).replace(/\s+/g,'');
  ok(tag+'remark written',nt.includes(want.replace('輪轉錯誤','非法替補').replace(/\s+/g,'')),nt.slice(0,400));
  // 補記：取消後的比分可以補，沒出現過的不行
  await p.click('[data-act=rtab][data-v=fix]');await W(250);await p.click('[data-act=insopen]');await W(150);
  await p.click('.sheet [data-act=insteam][data-team=t2]');await p.click('.sheet [data-act=inskind][data-v=T]');await W(100);
  await p.fill('#ins0','11');await p.fill('#ins1','7');await p.click('.sheet [data-act=insgo]');await W(150);ok(tag+'ins never-happened score',(await sheet()).includes('這局沒有出現過 11:7'),await sheet());
  await p.fill('#ins0','11');await p.fill('#ins1','5');await p.click('.sheet [data-act=insgo]');await W(200);ok(tag+'ins after cancel ok',await p.locator('.sheet').count()===0,await sheet());
  await p.click('[data-act=insopen]');await W(150);await p.click('.sheet [data-act=insteam][data-team=t2]');await p.click('.sheet [data-act=inskind][data-v=T]');await W(100);
  await p.fill('#ins0','11');await p.fill('#ins1','10');await p.click('.sheet [data-act=insgo]');await W(200);ok(tag+'ins before cancel ok',await p.locator('.sheet').count()===0,await sheet());
  const tos=(await live()).filter(x=>x.type==='AMEND'&&x.data.ins&&x.data.ins.type==='TIMEOUT');ok(tag+'two TO inserted',tos.length===2);
  // 修正比分：取消後沒出現過的比分擋下
  await p.locator('.fixrow').first().click();await W(150);await p.fill('#amsc0','11');await p.fill('#amsc1','8');await p.click('.sheet [data-act=amendscore]');await W(150);
  ok(tag+'amend never-happened',(await sheet()).includes('這局沒有出現過 11:8'),await sheet());await p.click('.sheet [data-act=close]');await W(150);
  await p.click('[data-act=sheetclose]');await W(250);
  // 打完這一局：記錄表取消的分再得到畫叉
  const rest=[];for(let r=0;r<19;r++)rest.push('t1');await inject(rest);await point('t1');
  s0=await st();ok(tag+'25:11',s0.score.t1===25&&s0.score.t2===11,s0.score);
  ok(tag+'set end window',await p.locator('.sheet.setend').count()===1);
  const sc=await p.locator('.sescore b').allTextContents();ok(tag+'window score',sc.includes('25')&&sc.includes('11'),sc);
  await W(400);await p.click('.sheet.setend [data-act=endok]');await W(300);
  if(!SCHOOL){
    // 取消的 6～10 分再得到：反方向的線（左上到右下）
    const back=await p.evaluate(()=>{let n=0;document.querySelector('.endview .ctv svg').querySelectorAll('line').forEach(l=>{const x1=+l.getAttribute('x1'),y1=+l.getAttribute('y1'),x2=+l.getAttribute('x2'),y2=+l.getAttribute('y2');if(+l.getAttribute('stroke-width')===.9&&x2>x1&&y2>y1&&Math.abs((x2-x1)-(y2-y1))<.01&&x2-x1<9)n++});return n});
    ok(tag+'5 crosses drawn',back===5,back);
    await p.screenshot({path:`/tmp/t1113c-${w}.png`});
  }
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);
await b.close();console.log('t1113c',SCHOOL?'school':'full',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

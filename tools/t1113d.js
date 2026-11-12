// 11/13 第 9 項：改發球格（照紙本改發球格的數字，得分過程照發球格重算）
// 用 11/12 實際比賽的例子：先發球的隊 0、1、2、4、5、6、⑦；另一隊電子記錄 4、15、16、17、18、19、㉕，紙本 4、14、15、20、21、22、㉕
// node tools/t1113d.js [網址] [資料 key]（只有完整版有記錄表）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
// 得分順序 → 每隊的發球格（跟程式 applyPoint 一樣）
function boxes(path,S){let sv=S,sc={},b={};sc[S]=0;const R=path.find(k=>k!==S)||'?';sc[R]=0;b[S]=[];b[R]=[];
  path.forEach(k=>{if(k!==sv){b[sv].push(sc[sv]);sv=k}sc[k]++});b[sv].push(sc[sv]);return b}
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[402,874],[1180,820]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));const tag=w+' ';
  const db=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');
  const closeAbout=async()=>{if(await ab.count()){await ab.first().click();await W(200)}};
  const fresh=async()=>{await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);await closeAbout()};
  const serve=async()=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}};
  const point=async t=>{await serve();await p.click(`[data-act=point][data-team=${t}]`);await W(700)};
  const sheet=async()=>(await p.locator('.sheet').count())?(await p.locator('.sheet').last().innerText()).replace(/\s+/g,' '):'';
  const evs=async()=>{const d=await db();return d.matches.filter(m=>m.id===d.currentId)[0].events};
  // 這局每一分是哪隊得的（套用 AMEND 的改隊）
  const path=async()=>{const e=await evs(),dead={},pt={};e.forEach(x=>{if(x.type==='UNDO')dead[x.data.target]=1});
    e.forEach(x=>{if(x.type!=='AMEND'||dead[x.id])return;if(x.data.multi)x.data.multi.forEach(q=>{pt[q.target]=Object.assign(pt[q.target]||{},q.patch)});else if(x.data.del)dead[x.data.target]=1;else if(x.data.target)pt[x.data.target]=Object.assign(pt[x.data.target]||{},x.data.patch)});
    const out=[];e.forEach(x=>{if(dead[x.id]||x.type==='UNDO'||x.type==='AMEND')return;const d=Object.assign({},x.data,pt[x.id]||{});if(d.set!==1)return;if(x.type==='POINT')out.push(d.team);if(x.type==='SANCTION'&&(d.kind==='P'||d.kind==='DP'))out.push(d.team==='t1'?'t2':'t1')});return out};
  const show=async sel=>{if(await p.locator(sel).count()||!await p.locator('.ctov').count())return;for(const f of [.7,.3,.5,.15,.9]){const o=await p.locator('.ctov').first().boundingBox();await p.mouse.click(o.x+o.width*f,o.y+o.height/2);await W(250);if(await p.locator(sel).count())return}};
  const setup=async pen=>{await fresh();await flow.start(p,{serve:'t1'});await W(300);
    const e0=await evs();const toss=e0.filter(x=>x.type==='TOSS_SET'&&x.data.set===1).pop().data,N=toss.serve,Z=N==='t1'?'t2':'t1';
    const seq=[Z,Z,Z,Z,N,Z].concat(Array(10).fill(Z),[N,Z,N,N,Z,N,Z,N,Z,N,Z],Array(4).fill(Z)); // 打到 7:24，最後一分用按的
    await p.evaluate(([k,seq,N,pen])=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0],T=Date.now()-30*60000;
      const add=(type,data,j)=>m.events.push({id:'tx'+m.events.length,matchId:m.id,seq:m.events.length+1,at:new Date(T+j*20000).toISOString(),device:e0.device,type,data});
      seq.forEach((t,j)=>{add('SERVE',{set:1},j);if(pen&&j===15)add('SANCTION',{set:1,team:t==='t1'?'t2':'t1',kind:'DP'},j);else add('POINT',{set:1,team:t},j);if(j===15)add('TIMEOUT',{set:1,team:N},j)}); // 第 16 分之後先發球隊暫停
      localStorage.setItem(k,JSON.stringify(d))},[KEY,seq,N,!!pen]);
    await p.reload();await W(400);await closeAbout();return {N,Z,seq}};

  const {N,Z,seq}=await setup();
  const elec=boxes(seq.concat([Z]),N);ok(tag+'setup boxes',elec[Z].join()==='4,15,16,17,18,19,25'&&elec[N].join()==='0,1,2,4,5,6,7',elec);
  // 還在打的局：記錄表只能點暫停、替補、先發，不能點發球格
  await p.click('[data-act=sheetopen]');await W(350);await p.locator('.sheettabs [data-act=rtab][data-v^=s]').first().click();await W(300);
  ok(tag+'live set: P cells',await p.locator('rect.hot[data-v^="1:P:"]').count()===(w<600?6:12),await p.locator('rect.hot').count());
  ok(tag+'live set: no box cells',await p.locator('rect.hot[data-v^="1:B:"]').count()===0);
  ok(tag+'live set note',(await p.locator('.ctnote').innerText()).includes('這局打完，發球格也能改'));
  await p.click('[data-act=sheetclose]');await W(250);
  await point(Z);await W(450);await p.click('.sheet.setend [data-act=endok]');await W(300);
  ok(tag+'box cells on end view',await p.locator('rect.hot[data-v^="1:B:"]').count()===(w<600?6:12),await p.locator('rect.hot').count());
  ok(tag+'end hint mentions box',(await p.locator('.endhint').innerText()).includes('發球格'));
  // 點 Z 隊 III 位的發球格
  await show(`rect.hot[data-team=${Z}][data-v="1:B:2"]`);await p.locator(`rect.hot[data-team=${Z}][data-v="1:B:2"]`).first().click();await W(200);
  let t=await sheet();ok(tag+'box sheet',t.includes('第 1 局發球格')&&t.includes('照紙本改不一樣的格子'),t);
  ok(tag+'six columns',await p.locator('.sheet .bxcol').count()===6);
  ok(tag+'tapped column on',(await p.locator('.sheet .bxcol.on > b').innerText())==='III');
  ok(tag+'X in column I',(await p.locator('.sheet .bxcol').nth(0).locator('.bxx').count())===1);
  ok(tag+'last box read only',(await p.locator('.sheet .bxlast').innerText())==='25'&&await p.locator('.sheet .bxcol').nth(1).locator('.bxlast').count()===1);
  const vals=await p.locator('.sheet input.bxc').evaluateAll(a=>a.map(e=>e.value));ok(tag+'inputs',vals.join()==='19,4,15,16,17,18',vals);
  const inp=(col,i)=>p.locator('.sheet .bxcol').nth(col).locator('input.bxc').nth(i);
  // 不合理的
  await inp(4,0).fill('20');await p.click('.sheet [data-act=bxgo]');await W(200);
  ok(tag+'V alone too big',(await sheet()).includes('VI 位第 1 格填 18，比這一輪開始發球時的 21 分還小'),await sheet());
  await inp(4,0).fill('17');await inp(2,0).fill('3');await p.click('.sheet [data-act=bxgo]');await W(200);
  ok(tag+'too small',(await sheet()).includes('III 位第 1 格填 3，比這一輪開始發球時的 5 分還小'),await sheet());
  await inp(2,0).fill('x');await p.click('.sheet [data-act=bxgo]');await W(200);ok(tag+'not number',(await sheet()).includes('要填數字'));
  await inp(2,0).fill('15');await p.click('.sheet [data-act=bxgo]');await W(200);ok(tag+'no change',(await sheet()).includes('沒有改到任何一格'));
  // 照紙本改五格
  await inp(2,0).fill('14');await inp(3,0).fill('15');await inp(4,0).fill('20');await inp(5,0).fill('21');await inp(0,0).fill('22');
  await p.click('.sheet [data-act=bxgo]');await W(250);t=await sheet();
  ok(tag+'confirm lists',['III 位第 1 格：15 → 14','IV 位第 1 格：16 → 15','V 位第 1 格：17 → 20','VI 位第 1 格：18 → 21','I 位第 2 格：19 → 22'].every(x=>t.includes(x)),t);
  ok(tag+'score kept',t.includes('比分維持 25:7'),t);
  ok(tag+'timeout score change listed',t.includes('暫停：1:15 → 2:14'),t);
  ok(tag+'confirm no top back',await p.locator('.sheet [data-act=sheetback]').count()===0&&await p.locator('.sheet [data-act=bxback]').count()===1);
  await p.click('.sheet [data-act=bxback]');await W(150);ok(tag+'back keeps edits',(await inp(4,0).inputValue())==='20');
  await p.click('.sheet [data-act=bxgo]');await W(200);await p.click('.sheet [data-act=bxdo]');await W(300);
  ok(tag+'sheet closed',await p.locator('.sheet').count()===0,await sheet());
  let np=await path(),nb=boxes(np,N);ok(tag+'paper boxes',nb[Z].join()==='4,14,15,20,21,22,25'&&nb[N].join()==='0,1,2,4,5,6,7',nb);
  ok(tag+'one amend',(await evs()).filter(x=>x.type==='AMEND'&&x.data.multi).length===1);
  ok(tag+'done message',(await p.locator('.endview .fixdone').innerText().catch(()=>'')).includes('已照發球格重算'));
  // 改完之後，紙本的比分 20:4 可以拿來修正替補、暫停
  // 復原
  await p.click('.foot [data-act=undo]');await W(300);np=await path();ok(tag+'undo restores',boxes(np,N)[Z].join()==='4,15,16,17,18,19,25',boxes(np,N));
  ok(tag+'still pending after undo',await p.locator('.foot [data-act=endset]').count()===1);
  // 「各局」也能改發球格（這局已經有勝隊）
  await p.click('.sheettabs [data-act=rtab][data-v^=s]');await W(300);
  const sbc=await p.locator('rect.hot[data-v^="1:B:"]').count();ok(tag+'set tab box cells',w<600?sbc>=3:sbc===12,sbc);
  ok(tag+'set tab note',(await p.locator('.ctnote').innerText()).includes('發球格點一下'));
  if(w<600)ok(tag+'set tab loupe on phone',await p.locator('.loupe .lmag').count()===1);
  await show(`rect.hot[data-team=${N}][data-v="1:B:0"]`);await p.locator(`rect.hot[data-team=${N}][data-v="1:B:0"]`).first().click();await W(200);
  ok(tag+'N sheet: first box editable',(await p.locator('.sheet .bxcol').nth(0).locator('input.bxc').count())===1&&(await p.locator('.sheet .bxcol').nth(0).locator('.bxlast').innerText())==='7');
  await p.click('.sheet [data-act=close]');await W(200);
  // 比賽確定結束後不能改：這裡只確認下一局之後上一局還能改
  await p.click('.foot [data-act=endset]');await W(400);
  // 判罰給分那一分不能被改到
  await setup(true);await point(Z);await W(450);await p.click('.sheet.setend [data-act=endok]');await W(300);
  await show(`rect.hot[data-team=${Z}][data-v="1:B:2"]`);await p.locator(`rect.hot[data-team=${Z}][data-v="1:B:2"]`).first().click();await W(200);
  await inp(2,0).fill('14');await inp(3,0).fill('15');await p.click('.sheet [data-act=bxgo]');await W(250);
  ok(tag+'penalty point blocked',(await sheet()).includes('會動到判罰給分的那一分'),await sheet());
  await p.click('.sheet [data-act=close]');await W(200);
  await ctx.close();
}
ok('no page errors',errs.length===0,errs);
await b.close();console.log('t1113d',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

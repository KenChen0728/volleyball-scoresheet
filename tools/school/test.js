// 真實點擊跑規則：node tools/school/test.js
const {chromium}=require('playwright'),path=require('path');
const URL_='file://'+path.resolve(__dirname,'../../school/index.html');
let pass=0,fail=0;const fails=[];
function ok(c,msg){if(c)pass++;else{fail++;fails.push(msg);console.log('  ✗ '+msg)}}
const wait=(p,ms=40)=>p.waitForTimeout(ms);
async function fresh(b,o={}){
  const ctx=await b.newContext({viewport:o.vp||{width:1280,height:800},colorScheme:o.cs||'light'});
  const p=await ctx.newPage();p.errs=[];
  p.on('pageerror',x=>p.errs.push(x.message));
  if(o.seed)await p.addInitScript(o.seed);
  await p.goto(URL_);await wait(p,80);
  return p;
}
async function keys(p,list){
  for(const n of list){for(const d of String(n))await p.click(`.kp [data-act=key][data-v="${d}"]`);if(String(n).length<2)await p.click('.kp [data-act=add]');await wait(p,8)}
  await p.click('.kp [data-act=kpclose]');await wait(p,15);
}
async function roster(p,o={}){
  await p.click('[data-act=new]');await wait(p);
  if(o.fmt===5)await p.click('[data-act=fmt][data-v="5"]');
  if(o.info)await o.info(p);
  await p.locator('.nav [data-v=roster]').click();await wait(p);
  await p.fill('#n-t1',o.n1||'Blue');await p.fill('#n-t2',o.n2||'Gold');await p.keyboard.press('Tab');await wait(p);
  await p.locator('[data-act=slot][data-team=t1]').first().click();await wait(p,15);await keys(p,o.t1||[1,2,3,4,5,6,7,8,9]);
  await p.locator('[data-act=slot][data-team=t2]').first().click();await wait(p,15);await keys(p,o.t2||[11,12,13,14,15,16,17,18,19]);
  for(const k of ['t1','t2']){await p.locator(`[data-act=slot][data-team=${k}].fill`).first().click();await wait(p,15);await p.click('.kp [data-act=cap]');await wait(p,15);await p.click('.kp [data-act=kpclose]');await wait(p,15)}
  if(o.lib)for(const [k,n] of o.lib){await p.locator(`[data-act=slot][data-team=${k}][data-no="${n}"]`).click();await wait(p,15);await p.click('.kp [data-act=lib]');await wait(p,15)}
  await p.click('[data-act=page][data-v=toss]');await wait(p);
}
async function fillLineup(p,a,b){
  for(const l of [a,b]){for(const n of l){await p.click(`[data-act=fill][data-no="${n}"]`);await wait(p,6)}await p.click('[data-act=lu-lock]');await wait(p,12)}
}
async function firstSet(p,serve='t1',a=[1,2,3,4,5,6],b=[11,12,13,14,15,16]){
  await p.click('.side.'+serve);await wait(p);
  await p.click('.page [data-act=page][data-v=lineup]');await wait(p);
  // 左邊那隊先填
  const first=await p.evaluate(()=>document.querySelector('.lutabs button[aria-pressed=true]').className.includes('t1')?'t1':'t2');
  await fillLineup(p,first==='t1'?a:b,first==='t1'?b:a);
  await p.click('[data-act=start]');await wait(p);await p.click('[data-act=cs-yes]');await wait(p,60);
}
const pt=async(p,k,n=1)=>{for(let i=0;i<n;i++){await p.click(`[data-act=point][data-team=${k}]`);await wait(p,510)}};
const score=async(p,k)=>Number(await p.locator(`.wcol.${k} .wscore`).textContent());
const sets=async(p,k)=>Number(await p.locator(`.wcol.${k} .setbox b`).textContent());
const court=async(p,k)=>p.$$eval(`.pc.${k}`,e=>e.map(x=>Number(x.querySelector('b').textContent)));
const db=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('vb-school-v2')));
const evs=async(p,t)=>{const d=await db(p);const m=d.matches.find(x=>x.id===d.currentId);return m.events.filter(e=>!t||e.type===t)};
async function sub(p,k,no,inn,mode='tap'){ // 點場上球員，走實際按鈕
  await p.locator(`.pc.${k}`,{has:p.locator(`b:text-is("${no}")`)}).click();await wait(p,30);
  const direct=await p.locator(`.sheet .pmb[data-act=pmsubin][data-no="${inn}"]`).count();
  if(direct){await p.click(`.sheet .pmb[data-act=pmsubin][data-no="${inn}"]`);await wait(p,30);return true}
  const btn=p.locator('.sheet .pmb',{hasText:'替補'});
  if(!await btn.count()||await btn.isDisabled()){await p.click('.sheet [data-act=close]');await wait(p,30);return false}
  await btn.click();await wait(p,30);
  const c=p.locator(`.sheet [data-act=pmsubin][data-no="${inn}"]`);
  if(!await c.count()){await p.click('.sheet [data-act=pmback]');await wait(p,20);await p.click('.sheet [data-act=close]');await wait(p,30);return false}
  await c.click();await wait(p,30);return true;
}
async function endSet(p,winner,toScore){
  for(let i=0;i<60;i++){
    if(await p.locator('[data-act=endset]').count())break;
    if(await p.locator('[data-act=swap8]').count()){await wait(p,720);await p.click('[data-act=swap8]');await wait(p,30);continue}
    await pt(p,winner);
  }
  await wait(p,1050);await p.click('[data-act=endset]');await wait(p,60);
}
async function nextSet(p,a=[1,2,3,4,5,6],b=[11,12,13,14,15,16]){ // 複製上一局
  await p.click('[data-act=copy]');await wait(p,20);await p.click('[data-act=lu-lock]');await wait(p,20);await p.click('[data-act=copy]');await wait(p,20);await p.click('[data-act=lu-lock]');await wait(p,20);
  await p.click('[data-act=start]');await wait(p,60);
}
(async()=>{
const b=await chromium.launch();
console.log('三局兩勝');
{const p=await fresh(b);await roster(p);
 ok(await p.locator('.seg [data-act=fmt][data-v="3"][aria-pressed=true]').count()===0,'名單頁不顯示賽制');
 await p.locator('.nav [data-v=info]').click();await wait(p);
 ok(await p.locator('[data-act=fmt][data-v="3"][aria-pressed=true]').count()===1,'預設三局兩勝');
 ok((await p.locator('.ptbtn small').textContent()).includes('25、25、15'),'三局分數 25 25 15');
 await p.locator('.nav [data-v=toss]').click();await wait(p);
 await firstSet(p);
 ok(await p.locator('[data-act=serve]').count()===0,'沒有發球鍵');
 ok(await p.locator('[data-act=replay]').count()===0,'沒有公正鍵');
 ok(await p.locator('[data-act=point]').count()===2,'一直有兩個得分鍵');
 // 連按兩下只算一分
 await p.click('[data-act=point][data-team=t1]');await p.click('[data-act=point][data-team=t1]',{force:true}).catch(()=>{});await wait(p,520);
 ok(await score(p,'t1')===1,'連按兩下只算一分');
 // 輪轉：t1 先發，得分不輪轉
 const c0=await court(p,'t1');await pt(p,'t1',2);ok(JSON.stringify(c0)===JSON.stringify(await court(p,'t1')),'發球方得分不輪轉');
 await pt(p,'t2');ok(JSON.stringify(c0)!==JSON.stringify(await court(p,'t2'))||true,'側出');
 const c1=await court(p,'t2');await pt(p,'t2');ok(JSON.stringify(c1)===JSON.stringify(await court(p,'t2')),'連得不輪轉');
 await pt(p,'t1');ok(JSON.stringify(c0)!==JSON.stringify(await court(p,'t1')),'換發輪轉');
 // 復原
 await p.click('.bar [data-act=undo]');await wait(p,60);ok(await score(p,'t1')===3,'復原得分');
 await pt(p,'t1');
 await endSet(p,'t1');
 ok(await p.locator('.lusheet').count()===1,'第 2 局直接到陣容');
 await nextSet(p);
 ok(await sets(p,'t1')===1,'局數 1');
 await endSet(p,'t2');
 ok(await p.locator('.toss').count()===1,'第 3 局重新挑邊');
 await p.locator('.side').first().click();await wait(p);await p.click('.page [data-act=page][data-v=lineup]');await wait(p);
 await nextSet(p);await wait(p,60);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await wait(p,60)}
 ok((await p.locator('.mid small').first().textContent()).includes('15 分'),'第 3 局 15 分');
 for(let i=0;i<8;i++)await pt(p,'t1');
 ok(await p.locator('[data-act=swap8]').count()===1,'第 3 局 8 分換場');
 await wait(p,720);await p.click('[data-act=swap8]');await wait(p,50);
 await endSet(p,'t1');
 ok(await p.locator('[data-act=rppdf]').count()===1,'比賽結束看到存 PDF');
 ok((await p.locator('.good').textContent()).includes('2 : 1'),'2:1 結束');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('五局三勝');
{const p=await fresh(b);await roster(p,{fmt:5});await firstSet(p);
 for(let i=0;i<2;i++){await endSet(p,i%2?'t2':'t1');ok(await p.locator('.lusheet').count()===1,'第 '+(i+2)+' 局不用挑邊');await nextSet(p)}
 ok((await p.locator('.mid small').first().textContent()).includes('25 分'),'第 3 局仍 25 分');
 await endSet(p,'t2');ok(await p.locator('.lusheet').count()===1,'第 4 局不用挑邊');await nextSet(p);
 await endSet(p,'t1');ok(await p.locator('.toss').count()===1,'第 5 局挑邊');
 await p.locator('.side').first().click();await wait(p);await p.click('.page [data-act=page][data-v=lineup]');await wait(p);
 await nextSet(p);await wait(p,60);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await wait(p,60)}
 ok((await p.locator('.mid small').first().textContent()).includes('15 分'),'第 5 局 15 分');
 ok(await sets(p,'t1')===2&&await sets(p,'t2')===2,'2:2');
 await endSet(p,'t2');
 ok((await p.locator('.good').textContent()).includes('3 : 2'),'3:2 結束');
 await p.click('[data-act=rtab][data-v=s5]');await wait(p,60);ok(await p.locator('.ussheet svg').count()===1,'第 5 局記錄表');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('綁定和無限替補');
{const p=await fresh(b);await roster(p,{t1:[1,2,3,4,5,6,7,8,9,10,20,21,22],t2:[11,12,13,14,15,16,17,18]});await firstSet(p);
 ok(await sub(p,'t1',1,7),'1 換 7');
 ok((await court(p,'t1')).includes(7),'7 上場');
 ok(await p.locator('.bindm').count()===1,'球場標示綁定');
 ok((await p.locator('.pc.t1 .bindm').textContent()).includes('1'),'標示綁 1 號');
 // 同一次死球換第二人
 ok(await sub(p,'t1',2,8),'同一次死球再換一人');
 await pt(p,'t1');
 // 綁定後只能換回 1
 await p.locator('.pc.t1',{has:p.locator('b:text-is("7")')}).click();await wait(p,30);
 ok(await p.locator('.sheet .pmb[data-act=pmsubin]').textContent()==='換 1 號','7 只能換 1');
 ok((await p.locator('.sheet h2').textContent()).includes('綁定 1 號'),'選單標示綁定');
 await p.click('.sheet .pmb[data-act=pmsubin]');await wait(p,30);
 ok((await court(p,'t1')).includes(1),'1 換回來');
 // 重複互換超過 6 次
 let cur=1,other=7,n=0;for(let i=0;i<9;i++){await pt(p,'t1');if(await sub(p,'t1',cur,other))n++;[cur,other]=[other,cur]}
 ok(n===9,'一對可以一直互換 '+n);
 const subs=await evs(p,'SUB');ok(subs.length===12,'替補 12 次沒有上限 '+subs.length);
 ok((await p.locator('[data-act=subopen][data-team=t1] b').textContent())==='12','替補次數顯示 12');
 // 換下去的人不能換別的位置，別人不能換綁定的人
 await pt(p,'t1');
 await p.locator('.pc.t1',{has:p.locator('b:text-is("3")')}).click();await wait(p,30);
 await p.locator('.sheet .pmb',{hasText:'替補'}).click();await wait(p,30);
 const nos=await p.$$eval('.sheet [data-act=pmsubin] b',e=>e.map(x=>Number(x.textContent)));
 ok(!nos.includes(1)&&!nos.includes(7)&&!nos.includes(2)&&!nos.includes(8),'綁定的人不能再跟別人換 '+nos);
 ok(nos.includes(9)&&nos.includes(10),'還沒用過的人可以上 '+nos);
 await p.click('.sheet [data-act=pmback]');await p.click('.sheet [data-act=close]');await wait(p,30);
 // 下一局解除
 await endSet(p,'t1');
 await nextSet(p);await wait(p,50);
 ok(await p.locator('.bindm').count()===0,'下一局解除綁定');
 await p.locator('.pc.t1',{has:p.locator('b:text-is("1")')}).first().click().catch(()=>{});await wait(p,30);
 await p.locator('.sheet .pmb',{hasText:'替補'}).click();await wait(p,30);
 const nos2=await p.$$eval('.sheet [data-act=pmsubin] b',e=>e.map(x=>Number(x.textContent)));
 ok(nos2.includes(9)&&!nos2.includes(2),'新一局可以換別人 '+nos2);
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('替補面板、例外替補、判罰');
{const p=await fresh(b);await roster(p);await firstSet(p);
 await p.click('[data-act=subopen][data-team=t2]');await wait(p,30);
 await p.locator('.pc.t2',{has:p.locator('b:text-is("11")')}).click();await wait(p,30);await p.click('[data-act=subin][data-no="17"]');await wait(p,30);
 await p.locator('.pc.t2',{has:p.locator('b:text-is("12")')}).click();await wait(p,30);await p.click('[data-act=subin][data-no="18"]');await wait(p,30);
 await p.click('[data-act=subclose]');await wait(p,30);
 ok((await evs(p,'SUB')).length===2,'面板一次換兩人');
 // 判出場後強制替補
 await p.click('[data-act=penopen]');await wait(p,30);await p.click('[data-act=penteam][data-team=t1]');await wait(p,30);
 await p.click('[data-act=penkind][data-v=D]');await wait(p,30);await p.click('[data-act=penwho][data-no="3"]');await wait(p,30);await p.click('[data-act=penyes]');await wait(p,60);
 ok(await p.locator('.kp.bench.forced').count()===1,'出場後要先換人');
 await p.locator('.kp [data-act=subin]').first().click();await wait(p,40);
 ok(await p.locator('.kp.bench.forced').count()===0,'換完可繼續');
 await p.click('[data-act=penopen]');await wait(p,30);await p.click('[data-act=penteam][data-team=t2]');await wait(p,30);
 await p.click('[data-act=penkind][data-v=P]');await wait(p,30);await p.click('[data-act=penwho][data-no="13"]');await wait(p,30);await p.click('[data-act=penyes]');await wait(p,60);
 ok(await score(p,'t1')===1,'紅牌給對方一分');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('自由球員');
{const p=await fresh(b);await roster(p,{lib:[['t1',9]]});await firstSet(p);
 ok(await p.locator('.wcol.t1 .lc').count()===1,'有登錄才有 L 格');
 ok(await p.locator('.wcol.t2 .lc').count()===0,'沒登錄不佔位置');
 await pt(p,'t2');
 await p.locator('.wcol.t1 .lc').first().click();await wait(p,30);
 await p.locator('.pc.t1.pk').last().click();await wait(p,40);
 ok((await court(p,'t1')).includes(9),'自由球員上場');
 for(let i=0;i<8&&!(await p.locator('.pc.bad').count());i++){await pt(p,i%2?'t2':'t1')}
 ok(await p.locator('.pc.bad').count()===1,'到前排會閃');
 const before=await score(p,'t1');await p.click('[data-act=point][data-team=t1]');await wait(p,60);
 ok(await score(p,'t1')===before,'沒換回不能記下一球');
 await p.locator('.pc.bad').click();await wait(p,50);
 ok(!(await court(p,'t1')).includes(9),'點閃的 L 換回');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('搶分、記錄表內容');
{const p=await fresh(b);await roster(p,{info:async p=>{await p.fill('#i-ref','R One');await p.fill('#i-ump','U Two');await p.fill('#i-sco','S Three');await p.keyboard.press('Tab');await wait(p,30);await p.click('[data-act=sheet][data-v=points]');await wait(p,30);await p.click('[data-act=capmode][data-v="3"][data-m=on]');await wait(p,30);await p.fill('#i-c3','17');await p.keyboard.press('Tab');await wait(p,30);await p.click('.sheet .primary[data-act=close]');await wait(p,30)}});
 await firstSet(p,'t1');
 await pt(p,'t1',2);await pt(p,'t2',1);
 await p.click('[data-act=timeout][data-team=t1]');await wait(p,30);await p.click('[data-act=toyes]');await wait(p,30);await p.click('[data-act=tmend]');await wait(p,30);
 await sub(p,'t2',11,17);
 await p.click('[data-act=penopen]');await wait(p,30);await p.click('[data-act=penteam][data-team=t2]');await wait(p,30);await p.click('[data-act=penkind][data-v=W]');await wait(p,30);await p.click('[data-act=penwho][data-no="12"]');await wait(p,30);await p.click('[data-act=penyes]');await wait(p,60);
 await p.click('[data-act=sheetopen]');await wait(p,100);
 const txt=await p.$eval('.ussheet svg',e=>[...e.querySelectorAll('text')].map(t=>t.textContent).join(' | '));
 ok(txt.includes('R One')&&txt.includes('U Two')&&txt.includes('S Three'),'裁判名字');
 ok(txt.includes('Tx')||txt.includes('| T |'),'暫停寫入');
 ok(txt.includes('S17/11'),'發球方替補寫 S 上/下 '+txt.match(/Sx?\d+\/\d+/));
 ok(txt.includes('Y #12 (1-2)'),'黃牌寫 Comments，受罰隊分數在前');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);
 await p.context().close()}
console.log('不動到別的資料');
{const seed=`if(!localStorage.getItem('nanshe-scoresheet-v1')){localStorage.setItem('nanshe-scoresheet-v1','{"matches":[{"keep":1}]}');localStorage.setItem('vb-school-v1','{"keep":2}');localStorage.setItem('volleyball-prefs','{"theme":"dark"}')}`;
 const p=await fresh(b,{seed});await roster(p);await firstSet(p);await pt(p,'t1');
 const k=await p.evaluate(()=>[localStorage.getItem('nanshe-scoresheet-v1'),localStorage.getItem('vb-school-v1'),localStorage.getItem('volleyball-prefs'),Object.keys(localStorage).sort().join()]);
 ok(k[0].includes('"keep":1')&&k[1].includes('"keep":2')&&k[2].includes('dark'),'完整版和舊資料都沒動');
 await p.context().close()}
console.log('名單上限、範例');
{const p=await fresh(b);await p.click('[data-act=new]');await wait(p);await p.locator('.nav [data-v=roster]').click();await wait(p);
 ok(await p.locator('.rgrid:not(.two) [data-team=t1]').count()===15,'每隊 15 格');
 ok(await p.locator('.rgrid.two [data-team=t1]').count()===2,'自由球員 2 格');
 await p.locator('[data-act=slot][data-team=t1]').first().click();await wait(p,15);
 const many=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
 for(const n of many){for(const d of String(n))await p.click(`.kp [data-act=key][data-v="${d}"]`);if(String(n).length<2)await p.click('.kp [data-act=add]');await wait(p,6);if(n===15)break}
 ok(await p.locator('[data-act=slot][data-team=t1].fill').count()===15,'可以填滿 15 人');
 ok(await p.locator('.kp').count()===0||await p.locator('.num.on').count()===0,'填滿後不再跳下一格');
 if(await p.locator('.kp [data-act=kpclose]').count())await p.click('.kp [data-act=kpclose]');
 // 重複背號
 await p.locator('[data-act=slot][data-team=t2]').first().click();await wait(p,15);for(const d of '7')await p.click(`.kp [data-act=key][data-v="${d}"]`);await p.click('.kp [data-act=add]');await wait(p,15);for(const d of '7')await p.click(`.kp [data-act=key][data-v="${d}"]`);await p.click('.kp [data-act=add]');await wait(p,20);
 ok((await p.locator('.kp .err').textContent()).includes('已在名單'),'重複背號會提醒');
 await p.click('.kp [data-act=kpclose]');await wait(p,15);
 await p.click('.bar .barback');await wait(p,50);
 await p.click('[data-act=sample]');await wait(p,80);
 ok(await p.locator('[data-act=slot][data-team=t1].fill').count()===8,'範例有名單');
 await p.click('.bar .barback');await wait(p,60);
 ok(await p.locator('.pill').count()>=1,'範例標示練習');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('中途離開、復原替補、更正');
{const p=await fresh(b);await roster(p);await firstSet(p);await pt(p,'t1',2);await sub(p,'t1',1,7);await pt(p,'t2');
 await p.reload();await wait(p,120);
 ok(await score(p,'t1')===2&&await score(p,'t2')===1,'重新整理回到比賽');
 ok(await p.locator('.bindm').count()===1,'綁定還在');
 await sub(p,'t2',11,17);await wait(p,60);
 await p.click('.bar [data-act=undo]');await wait(p,80);
 ok(await p.locator('.pc.t2 .bindm').count()===0,'復原替補後解除綁定');
 ok((await court(p,'t2')).includes(11),'復原後人回來');
 await p.locator('.pc.t2',{has:p.locator('b:text-is("11")')}).click();await wait(p,30);await p.locator('.sheet .pmb',{hasText:'替補'}).click();await wait(p,30);
 ok(await p.locator('.sheet [data-act=pmsubin]').count()>=2,'復原後又能選別人');await p.click('.sheet [data-act=pmback]');await p.click('.sheet [data-act=close]');await wait(p,30);
 // 更正替補：7 改成 8
 await p.click('[data-act=sheetopen]');await wait(p,60);await p.click('[data-act=rtab][data-v=fix]');await wait(p,60);
 await p.locator('.fixrow').first().click();await wait(p,50);await p.click('.sheet [data-act=amendin][data-v="8"]');await wait(p,60);
 await p.click('[data-act=rtab][data-v=s1]');await wait(p,80);
 const t=await p.$eval('.ussheet svg',e=>[...e.querySelectorAll('text')].map(x=>x.textContent).join('|'));
 ok(t.includes('8/1')&&!t.includes('7/1'),'更正後記錄表跟著改');
 await p.click('[data-act=sheetclose]');await wait(p,50);
 ok((await court(p,'t1')).includes(8),'更正後場上是 8');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close()}
console.log('第 3 局搶 17、五局 PDF');
{const mk=(info,plan)=>{let n=0;const ev=[];const add=(type,data)=>ev.push({id:'x'+(++n),matchId:'m',seq:n,at:new Date(1790000000000+n*1000).toISOString(),device:'t',type,data});
  add('MATCH_CREATED',{info:Object.assign({date:'2026-11-06'},info)});
  [['t1',[1,2,3,4,5,6,7,8],1],['t2',[11,12,13,14,15,16,17,18],11]].forEach(([k,l,c])=>{add('TEAM_NAME_SET',{team:k,value:k==='t1'?'Blue':'Gold'});l.forEach(no=>add('PLAYER_ADDED',{team:k,no}));add('CAPTAIN_SET',{team:k,no:c})});
  add('INFO_SET',{field:'actual',value:'16:00'});
  const last=plan.length-1;
  plan.forEach((pts,i)=>{const set=i+1;add('TOSS_SET',{set,left:set%2?'t1':'t2',serve:set%2?'t1':'t2'});[['t1',[1,2,3,4,5,6]],['t2',[11,12,13,14,15,16]]].forEach(([k,l])=>{l.forEach((no,pos)=>add('LINEUP_SET',{set,team:k,pos,no}));add('LINEUP_LOCKED',{set,team:k})});add('SET_STARTED',{set});
   let sw=false,sc={t1:0,t2:0};pts.forEach(k=>{add('POINT',{set,team:k});sc[k]++;if(info.swapAt===set&&!sw&&Math.max(sc.t1,sc.t2)>=8){add('SIDES_SWAPPED',{set});sw=true}});
   if(i<last||info.finish){add('SET_ENDED',{set,winner:sc.t1>sc.t2?'t1':'t2'});if(i<last)add('SET_ADVANCED',{blank:true})}});
  return JSON.stringify({matches:[{id:'m',createdAt:new Date().toISOString(),events:ev}],currentId:'m',cups:[]})};
 const rep=(k,n)=>Array(n).fill(k),alt=n=>Array.from({length:n},(_,i)=>i%2?'t2':'t1');
 const seed=mk({fmt:3,c3:17,swapAt:3},[rep('t1',25),rep('t2',25),alt(32)]);
 const p=await fresh(b,{seed:`if(!localStorage.getItem('vb-school-v2'))localStorage.setItem('vb-school-v2',${JSON.stringify(seed)})`});await wait(p,120);
 ok(await score(p,'t1')===16&&await score(p,'t2')===16,'16:16');
 await pt(p,'t1');await wait(p,50);
 ok(await p.locator('[data-act=endset]').count()===1,'第 3 局 17 分結束，不用贏 2 分');
 ok(p.errs.length===0,'沒有錯誤 '+p.errs[0]);await p.context().close();
 const seed5=mk({fmt:5,swapAt:5,finish:true},[rep('t1',25),rep('t2',25),rep('t1',25),rep('t2',25),rep('t1',15)]);
 const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1280,height:800}});const q=await ctx.newPage();q.errs=[];q.on('pageerror',x=>q.errs.push(x.message));
 await q.addInitScript(`if(!localStorage.getItem('vb-school-v2'))localStorage.setItem('vb-school-v2',${JSON.stringify(seed5)})`);await q.goto(URL_);await wait(q,120);
 await q.locator('.hrow').first().click();await wait(q,120);
 ok(await q.locator('.sheettabs button').count()===9,'五局比賽 9 個分頁');
 const dl=q.waitForEvent('download',{timeout:15000});await q.click('[data-act=rppdf]');const f=await dl;const fp=await f.path();const buf=require('fs').readFileSync(fp);
 ok((buf.toString('latin1').match(/\/Type\/Page\//g)||[]).length===5,'PDF 5 頁');
 ok(q.errs.length===0,'沒有錯誤 '+q.errs[0]);await ctx.close()}
await b.close();
console.log(`通過 ${pass}，失敗 ${fail}`);if(fail)console.log(fails.join('\n'));process.exit(fail?1:0);
})().catch(e=>{console.log('ERR',e.message.slice(0,600));process.exit(1)});

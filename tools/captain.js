// 球隊隊長一定要有：下一步或開始時跳回名單、列出背號讓人點；陣容頁不問場上隊長，開賽後隊長格閃
// node tools/captain.js [截圖資料夾]（先跑 build.py、derive.py）
const {chromium}=require('playwright');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.argv[2]||null;
// 從瀏覽器存檔推算（程式包在函式裡，拿不到 reduce）
const ST=p=>p.evaluate(()=>{let db=null;for(const k of ['nanshe-scoresheet-v1','vb-school-v2']){try{const v=localStorage.getItem(k);if(v){db=JSON.parse(v);break}}catch(e){}}
 const m=db.matches.find(x=>x.id===db.currentId),dead={};m.events.forEach(e=>{if(e.type==='UNDO')dead[e.data.target]=1});
 const cap={t1:null,t2:null},pts={t1:0,t2:0};
 m.events.forEach(e=>{if(dead[e.id]||e.type==='UNDO')return;const d=e.data;if(e.type==='CAPTAIN_SET')cap[d.team]=d.no;if(e.type==='PLAYER_REMOVED'&&cap[d.team]===d.no)cap[d.team]=null;if(e.type==='POINT'&&d.set===1)pts[d.team]++});
 return {cap,pts}});
const txt=async(p,sel)=>(await p.locator(sel).first().textContent().catch(()=>''))||'';
(async()=>{const b=await chromium.launch();let fail=0;const ok=(n,c)=>{console.log((c?'ok ':'FAIL ')+n);if(!c)fail++};
for(const [name,url,vw,vh] of [['完整版手機','index.html',402,874],['完整版寬','index.html',1275,607],['學校版手機','school/index.html',402,874]]){
const p=await b.newPage({viewport:{width:vw,height:vh},deviceScaleFactor:OUT?2:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/volleyball-scoresheet/'+url);await W(300);
await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(200);
const tag=n=>name+' '+n,shot=async f=>{if(OUT&&vw<500)await p.screenshot({path:OUT+'/'+(url.startsWith('school')?'school-':'')+f})};
// 名單：拿掉兩隊隊長
for(const [k,no] of [['t1',3],['t2',6]]){await p.click(`[data-act=slot][data-team=${k}][data-no="${no}"]`);await W(100);await p.click('.kp [data-act=cap]');await W(100);await p.click(`[data-act=kpclose][data-team=${k}]`);await W(100)}
const c0=(await ST(p)).cap;ok(tag('兩隊隊長拿掉了'),c0.t1===null&&c0.t2===null);
if(url==='index.html')ok(tag('名單下方寫還缺球隊隊長'),(await txt(p,'#foot-t1')).includes('還缺：球隊隊長'));
// 下一步：跳出來選隊長；關掉留在名單
ok(tag('名單頁有下一步'),await p.locator('[data-act=rnext]').count()===1);
await p.click('[data-act=rnext]');await W(150);
ok(tag('按下一步跳出：'+await txt(p,'.sheet h2')),(await txt(p,'.sheet h2')).includes('請指定球隊隊長')&&await p.locator('.sheet [data-act=needset]').count()===8);
await p.click('.sheet [data-act=close]');await W(150);
ok(tag('關掉後還在名單'),await p.locator('.sheet').count()===0&&await p.locator('[data-act=rnext]').count()===1);
// 再按一次，藍隊點 3 號，接著跳橘隊，這次關掉，從下方分頁去挑邊
await p.click('[data-act=rnext]');await W(150);await p.click('.sheet [data-act=needset][data-no="3"]');await W(150);
ok(tag('藍隊選好接著跳橘隊'),(await txt(p,'.sheet h2')).includes('範例橘隊')&&(await ST(p)).cap.t1===3);
await p.click('.sheet [data-act=close]');await W(150);
await p.locator('[data-act=page][data-v=toss]').first().click();await W(150);await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');await W(150);
for(const x of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');
for(const x of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');await W(150);
ok(tag('陣容頁不問場上隊長'),await p.locator('[data-act=gcap]').count()===0&&!(await txt(p,'.page')).includes('場上隊長'));
const wn=await txt(p,'.foot .warning');ok(tag('陣容頁提醒：'+wn),wn.includes('範例橘隊缺球隊隊長'));
ok(tag('開始鍵沒有變灰'),await p.locator('[data-act=startneed]').isEnabled());
await shot('need-lineup.png');
// 按開始：跳回名單、彈出橘隊；先關掉
await p.click('[data-act=startneed]');await W(200);
ok(tag('按開始跳回名單、彈出橘隊'),(await txt(p,'.sheet h2')).includes('範例橘隊 請指定球隊隊長')&&(await txt(p,'.sheet p')).includes('開始比賽前')&&await p.locator('.sheet [data-act=needset]').count()===9);
await shot('need-roster.png');
await p.click('.sheet [data-act=close]');await W(150);
ok(tag('關掉後在名單，可以自己設'),await p.locator('.sheet').count()===0&&await p.locator('[data-act=slot][data-team=t2][data-no="77"]').count()===1);
// 回陣容再按開始，這次在視窗點 77 號（不在先發）→ 回陣容、直接跳開局確認
await p.locator('[data-act=page][data-v=lineup]').first().click();await W(150);
await p.click('[data-act=startneed]');await W(200);await p.click('.sheet [data-act=needset][data-no="77"]');await W(250);
ok(tag('選好直接跳開局確認'),await p.locator('[data-act=cs-yes]').count()===1&&(await ST(p)).cap.t2===77);
await p.click('[data-act=cs-yes]');await W(250);
ok(tag('進比賽：藍隊隊長在場上不閃'),await p.locator('.capbox.t1.need').count()===0&&await p.locator('.capbox.t1.fixed').count()===1);
ok(tag('橘隊隊長 77 不在場上：隊長格閃'),await p.locator('.capbox.t2.need').count()===1);
const lk=await txt(p,'.lockline');ok(tag('提示行：'+lk),lk.includes('指定場上隊長'));
await shot('need-play.png');
const sv=p.locator('[data-act=serve]');if(await sv.count()){await sv.click();await W(400)}
await p.click('[data-act=point][data-team=t1]');await W(300);
ok(tag('閃的時候照樣能得分'),(await ST(p)).pts.t1===1);
await p.click('.capbox.t2');await W(150);
ok(tag('點了選場上隊長：'+await txt(p,'.sheet p.muted')),(await txt(p,'.sheet h2')).includes('場上隊長')&&(await txt(p,'.sheet p.muted')).includes('77 號不在場上'));
await p.click('.sheet [data-act=gcset][data-no="2"]');await W(200);
ok(tag('選了 2 號不閃'),await p.locator('.sheet').count()===0&&await p.locator('.capbox.t2.need').count()===0&&(await txt(p,'.capbox.t2')).includes('2'));
ok(tag('沒有錯誤 '+errs.join('|')),errs.length===0);await p.close()}
// 使用者 11/6 那場的舊資料：已開賽、名單沒有隊長、有場上隊長 → 還能點格子補
{const p=await b.newPage({viewport:{width:402,height:874}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/volleyball-scoresheet/index.html');await W(300);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(200);
await p.locator('[data-act=page][data-v=toss]').first().click();await W(150);await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');await W(150);
for(const x of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');
for(const x of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');await W(150);
await p.click('[data-act=start]');await W(150);await p.click('[data-act=cs-yes]');await W(250);
await p.evaluate(()=>{const K='nanshe-scoresheet-v1',db=JSON.parse(localStorage.getItem(K)),m=db.matches.find(x=>x.id===db.currentId),add=(type,data)=>m.events.push({id:'old-'+type,matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'test',type,data});add('CAPTAIN_SET',{team:'t2',no:null});add('GAME_CAPTAIN_SET',{set:1,team:'t2',no:2});localStorage.setItem(K,JSON.stringify(db))});
await p.reload();await W(500);
const t2=await txt(p,'.capbox.t2');ok('舊資料 格子顯示場上隊長 2 並且閃：'+t2,await p.locator('.capbox.t2.need').count()===1&&t2.includes('2'));
await p.click('.capbox.t2');await W(150);ok('舊資料 點了是選球隊隊長',(await txt(p,'.sheet h2')).trim().endsWith(' 隊長'));
await p.click('.sheet [data-act=tcset][data-no="2"]');await W(200);
ok('舊資料 選 2 號後不閃',await p.locator('.sheet').count()===0&&await p.locator('.capbox.t2.need').count()===0);
ok('舊資料 沒有錯誤 '+errs.join('|'),errs.length===0);await p.close()}
console.log('fail',fail);await b.close();process.exit(fail?1:0)})();

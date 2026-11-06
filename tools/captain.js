// 名單沒有隊長也能開賽，比賽時隊長格閃、點了補：node tools/captain.js 截圖資料夾（先跑 build.py、derive.py）
const {chromium}=require('playwright');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.argv[2]||null;
// 從瀏覽器存檔推算（程式包在函式裡，拿不到 reduce）
const ST=p=>p.evaluate(()=>{let db=null;for(const k of ['nanshe-scoresheet-v1','vb-school-v2']){try{const v=localStorage.getItem(k);if(v){db=JSON.parse(v);break}}catch(e){}}
 const m=db.matches.find(x=>x.id===db.currentId),dead={};m.events.forEach(e=>{if(e.type==='UNDO')dead[e.data.target]=1});
 const cap={t1:null,t2:null},pts={t1:0,t2:0};let nCap=0;
 m.events.forEach(e=>{if(dead[e.id]||e.type==='UNDO')return;const d=e.data;if(e.type==='CAPTAIN_SET'){cap[d.team]=d.no;nCap++}if(e.type==='PLAYER_REMOVED'&&cap[d.team]===d.no)cap[d.team]=null;if(e.type==='POINT'&&d.set===1)pts[d.team]++});
 return {cap,pts,nCap}});
(async()=>{const b=await chromium.launch();let fail=0;const ok=(n,c)=>{console.log((c?'ok ':'FAIL ')+n);if(!c)fail++};
for(const [name,url,vw,vh] of [['完整版手機','index.html',402,874],['完整版寬','index.html',1275,607],['學校版手機','school/index.html',402,874]]){
const p=await b.newPage({viewport:{width:vw,height:vh},deviceScaleFactor:OUT?2:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/volleyball-scoresheet/'+url);await W(300);
await p.click('[data-act=sample]');await W(200);
const tag=n=>name+' '+n;
// 名單：拿掉兩隊隊長
for(const [k,no] of [['t1',3],['t2',6]]){await p.click(`[data-act=slot][data-team=${k}][data-no="${no}"]`);await W(100);await p.click('.kp [data-act=cap]');await W(100);await p.click(`[data-act=kpclose][data-team=${k}]`);await W(100)}
const cap=(await ST(p)).cap;
ok(tag('兩隊隊長拿掉了'),cap.t1===null&&cap.t2===null);
if(url==='index.html'){ok(tag('名單下方寫還沒有隊長'),(await p.locator('#foot-t1').textContent()).includes('還沒有隊長'));
 ok(tag('名單頁有下一步'),await p.locator('#rnext button').count()===1)}
await p.locator('[data-act=page][data-v=toss]').first().click();await W(150);await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');await W(150);
for(const x of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');
for(const x of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');await W(150);
ok(tag('陣容頁沒有場上隊長選項'),await p.locator('[data-act=gcap]').count()===0);
const note=await p.locator('.foot .capnote').textContent().catch(()=>'');
ok(tag('陣容頁提醒兩隊沒有隊長：'+note),note.includes('範例藍隊')&&note.includes('範例橘隊'));
ok(tag('開始第 1 局可以按'),await p.locator('[data-act=start]').isEnabled());
ok(tag('沒有「請回名單補齊」'),await p.locator('.foot .warning').count()===0);
if(OUT&&vw<500)await p.screenshot({path:OUT+'/'+(url.startsWith('school')?'school-':'')+'cap-lineup.png'});
await p.click('[data-act=start]');await W(150);await p.click('[data-act=cs-yes]');await W(250);
ok(tag('比賽頁兩隊隊長格都閃'),await p.locator('.capbox.need').count()===2);
const lk=await p.locator('.lockline').textContent();ok(tag('提示行：'+lk),lk.includes('還沒有隊長'));
if(OUT)await p.screenshot({path:OUT+'/'+(url.startsWith('school')?'school-':'')+'cap-play-'+(vw<500?'phone':'wide')+'.png'});
// 不擋比賽：照樣可以發球、得分
const sv=p.locator('[data-act=serve]');if(await sv.count()){await sv.click();await W(400)}
await p.click('[data-act=point][data-team=t1]');await W(300);
ok(tag('隊長格閃的時候照樣能得分'),(await ST(p)).pts.t1===1);
// 藍隊：點閃的格子，指定場上的 3 號
await p.click('.capbox.t1');await W(150);
ok(tag('點隊長格跳出指定隊長'),(await p.locator('.sheet h2').textContent()).includes('隊長')&&await p.locator('.sheet [data-act=tcset]').count()===8);
await p.click('.sheet [data-act=tcset][data-no="3"]');await W(200);
ok(tag('3 號在場上：關掉、不閃'),await p.locator('.sheet').count()===0&&await p.locator('.capbox.t1.need').count()===0&&await p.locator('.capbox.t1.fixed').count()===1);
// 橘隊：指定不在場上的 77 號，接著選場上隊長
await p.click('.capbox.t2');await W(150);await p.click('.sheet [data-act=tcset][data-no="77"]');await W(200);
ok(tag('77 號不在場上：接著選場上隊長、左上有返回'),(await p.locator('.sheet p.muted').first().textContent()).includes('77 號不在場上')&&await p.locator('.sheet>.sheetback').count()===1);
await p.keyboard.press('Escape');await W(150);
ok(tag('Esc 回指定隊長、77 已選'),await p.locator('.sheet [data-act=tcset][data-no="77"][aria-pressed=true]').count()===1);
await p.click('.sheet [data-act=tcset][data-no="77"]');await W(150);
const nEv=(await ST(p)).nCap;
await p.click('.sheet [data-act=gcset][data-no="2"]');await W(200);
ok(tag('選了場上隊長 2 號：不閃'),await p.locator('.sheet').count()===0&&await p.locator('.capbox.t2.need').count()===0&&(await p.locator('.capbox.t2').textContent()).includes('2'));
ok(tag('同一位再點不重複記'),nEv===(await ST(p)).nCap);
const c2=(await ST(p)).cap;ok(tag('名單記到隊長'),c2.t1===3&&c2.t2===77);
// 復原兩次：先退場上隊長，再退隊長
await p.click('[data-act=undo]');await W(200);ok(tag('復原場上隊長後又閃'),await p.locator('.capbox.t2.need').count()===1);
await p.click('[data-act=undo]');await W(200);
ok(tag('復原隊長：'+await p.locator('.lockline').textContent()),(await p.locator('.lockline').textContent()).includes('隊長')&&(await p.locator('.capbox.t2').getAttribute('aria-label')).includes('還沒有隊長'));
ok(tag('沒有錯誤 '+errs.join('|')),errs.length===0);await p.close()}
// 使用者 11/6 截圖的舊資料：名單沒有隊長，但陣容頁已選了場上隊長
{const p=await b.newPage({viewport:{width:402,height:874}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/volleyball-scoresheet/index.html');await W(300);await p.click('[data-act=sample]');await W(200);
for(const [k,no] of [['t1',3],['t2',6]]){await p.click(`[data-act=slot][data-team=${k}][data-no="${no}"]`);await W(100);await p.click('.kp [data-act=cap]');await W(100);await p.click(`[data-act=kpclose][data-team=${k}]`);await W(100)}
await p.locator('[data-act=page][data-v=toss]').first().click();await W(150);await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');await W(150);
for(const x of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');
for(const x of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');await W(150);
ok('舊資料 開始第 1 局可以按',await p.locator('[data-act=start]').isEnabled());
await p.click('[data-act=start]');await W(150);await p.click('[data-act=cs-yes]');await W(250);
await p.evaluate(()=>{const K='nanshe-scoresheet-v1',db=JSON.parse(localStorage.getItem(K)),m=db.matches.find(x=>x.id===db.currentId);m.events.push({id:'gc-old',matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'test',type:'GAME_CAPTAIN_SET',data:{set:1,team:'t2',no:2}});localStorage.setItem(K,JSON.stringify(db))});
await p.reload();await W(500);
ok('舊資料 重新開啟回到比賽',await p.locator('.capbox.t2').count()===1);
const t2=await p.locator('.capbox.t2').textContent();
ok('舊資料 橘隊隊長格閃、顯示場上隊長 2：'+t2,await p.locator('.capbox.t2.need').count()===1&&t2.includes('2'));
await p.click('.capbox.t2');await W(150);
ok('舊資料 點了是指定隊長',(await p.locator('.sheet h2').textContent()).trim().endsWith(' 隊長'));
await p.click('.sheet [data-act=tcset][data-no="2"]');await W(200);
ok('舊資料 選 2 號後不閃',await p.locator('.sheet').count()===0&&await p.locator('.capbox.t2.need').count()===0&&await p.locator('.capbox.t2.fixed').count()===1);
ok('舊資料 沒有錯誤 '+errs.join('|'),errs.length===0);await p.close()}
console.log('fail',fail);await b.close();process.exit(fail?1:0)})();

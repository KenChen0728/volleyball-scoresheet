// 11/9 第二批：主畫面、開新比賽選資料夾、裁判名單、匯入合併、統一選取樣式：node tools/fb1109c.js（先跑 build.py）
const {chromium}=require('playwright');const fs=require('fs');const URL='file:///home/claude/nanshe/排球電子記錄表.html',KEY='nanshe-scoresheet-v1';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const db=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
await p.goto(URL);await W(150);
// 主畫面
ok('主畫面三個主要按鈕',await p.locator('.herocta').count()===1&&await p.locator('.herobtns [data-act=history]').count()===1&&await p.locator('.herobtns [data-act=helpopen]').count()===1);
ok('主畫面沒有資料夾和歷史清單',await p.locator('.cupcard').count()===0&&await p.locator('[data-act=cupcreate]').count()===0);
await p.click('[data-act=helpopen]');await W(80);ok('範例比賽在使用教學裡',await p.locator('.help [data-act=sample]').count()===1);await p.click('[data-act=helpclose]');await W(60);
// 沒有資料夾時，開新比賽直接開始
await p.click('[data-act=new]');await W(80);ok('沒資料夾直接到資料頁',await p.locator('#i-name').count()===1&&await p.locator('.folderrow').count()===0);
await p.click('.bar [data-act=home]');await W(80);
// 建資料夾、場地裁判名單
await p.click('[data-act=history]');await W(60);ok('紀錄與名單頁',(await p.locator('.bar h1').textContent())==='紀錄與名單');
await p.click('[data-act=cupcreate]');await p.fill('#cup-name','媽祖盃');await p.click('[data-act=cupnamesave]');await W(60);
await p.click('[data-act=cupcourt]');await W(40);await p.fill('#cc-court','第五場地');await p.fill('#cc-text','王大明\n李小華\n陳志明\n林美玲');await p.click('[data-act=cupcourtsave]');await W(60);
await p.click('[data-act=cupcourt]');await W(40);await p.fill('#cc-court','6');await p.fill('#cc-text','周小芬、吳建宏');await p.click('[data-act=cupcourtsave]');await W(60);
ok('兩個場地',(await p.locator('[data-act=cupcourt][data-v] strong').allTextContents()).join()==='第五場地,第 6 場地',await p.locator('[data-act=cupcourt][data-v] strong').allTextContents());
ok('場地人數',(await p.locator('[data-act=cupcourt][data-v="5"]').textContent()).includes('4 位'));
// 開新比賽：第一步選資料夾，預設剛建的
await p.click('.bar .barback');await W(40);await p.click('.bar .barback');await W(40);
await p.click('[data-act=new]');await W(60);ok('預設選剛建的資料夾',(await p.locator('.sheet [aria-pressed=true]').textContent()).includes('媽祖盃'));
await p.click('[data-act=newgo]');await W(80);
ok('比賽名稱帶資料夾名',await p.inputValue('#i-name')==='媽祖盃');
await p.fill('#i-court','第 5 場');await p.locator('#i-court').blur();await W(40);
// 裁判頁
await p.locator('.nav [data-v=refs]').click();await W(60);
ok('列出第五場地的裁判',(await p.locator('.refnames').first().locator('.refname').allTextContents()).join()==='王大明,李小華,陳志明,林美玲');
ok('預設選第一裁判',(await p.locator('.refrole[aria-pressed=true]').getAttribute('data-v'))==='ref1');
await p.click('[data-act=refname][data-v="李小華"]');await W(40);
ok('填好跳到下一個角色',(await p.locator('.refrole[aria-pressed=true]').getAttribute('data-v'))==='ref2');
ok('用過的人變灰標角色',(await p.locator('.refname.used').textContent()).includes('第一裁判')&&await p.locator('.refname.used').isDisabled());
await p.click('[data-act=refrole][data-v=scorer]');await W(30);await p.fill('#ref-type','新記錄員');await p.press('#ref-type','Enter');await W(60);
ok('直接打字按 Enter 填入',(await p.locator('[data-act=refrole][data-v=scorer] b').textContent())==='新記錄員');
await p.click('[data-act=refother]');await W(40);ok('其他場地的裁判',(await p.locator('.refnames').nth(1).locator('.refname').allTextContents()).join()==='周小芬,吳建宏');
await p.click('[data-act=refrole][data-v=ref1]');await W(30);await p.click('[data-act=refclear]');await W(40);ok('清空角色',(await p.locator('[data-act=refrole][data-v=ref1] b').textContent())==='未填');
await p.click('[data-act=refname][data-v="王大明"]');await W(40);
ok('已選有勾',await p.evaluate(()=>getComputedStyle(document.querySelector('.refrole[aria-pressed=true]'),'::after').content.includes('✓')));
// 賽前沒收結束比賽 → 新名字自動加進第五場地
await p.locator('.nav [data-v=roster]').click();await W(40);await p.fill('#n-t1','甲隊');await p.locator('#n-t1').blur();await p.fill('#n-t2','乙隊');await p.locator('#n-t2').blur();
await p.locator('.nav [data-v=toss]').click();await W(60);await p.click('[data-act=sheet][data-v=pf]');await p.click('[data-act=pfreason] >> nth=0');await p.click('[data-act=pfwin][data-team=t1]');await p.click('[data-act=pfdo]');await W(120);
let d=await db(p);const refs5=d.cups[0].refs.filter(r=>r.court==='5'&&!r.del).map(r=>r.name);
ok('比賽結束自動加進場地名單',refs5.includes('新記錄員')&&refs5.length===5,refs5);
// 資料夾名單刪掉後，不會被同一場加回來
await p.click('.bar [data-act=home]');await W(60);await p.click('[data-act=history]');await W(60);
ok('打完的比賽標資料夾',(await p.locator('.ftag').first().textContent())==='媽祖盃');
await p.click('.cupcard');await W(60);await p.click('[data-act=cupcourt][data-v="5"]');await W(40);
await p.fill('#cc-text','王大明\n李小華\n陳志明\n林美玲');await p.click('[data-act=cupcourtsave]');await W(60);
await p.click('.bar .barback');await W(60);await p.locator('.hrow[data-act=open]').first().click();await W(100);await p.click('.bar .barback');await W(60);await p.click('.cupcard');await W(60);
d=await db(p);ok('刪掉的不會被同一場加回來',!d.cups[0].refs.some(r=>r.name==='新記錄員'&&!r.del));
// 資料頁改資料夾、同名提示
await p.click('.bar .barback');await W(40);await p.click('.bar .barback');await W(40);
await p.click('[data-act=new]');await W(60);await p.click('[data-act=newpick][data-id=""]');await p.click('[data-act=newgo]');await W(80);
ok('不屬於資料夾',(await p.locator('.folderrow button').textContent()).includes('不屬於任何盃賽'));
await p.fill('#i-name','媽祖盃');await p.locator('#i-name').blur();await W(60);
ok('同名提示',(await p.locator('.page .note').textContent()).includes('一樣'));
await p.click('.page .note [data-act=setcup]');await W(60);ok('放進資料夾',(await p.locator('.folderrow button').textContent()).includes('媽祖盃'));
await p.click('.folderrow button');await W(40);await p.click('.sheet [data-act=setcup][data-id=""]');await W(60);ok('也能拿出來',(await p.locator('.folderrow button').textContent()).includes('不屬於'));
await p.click('.bar [data-act=home]');await W(60);
// 匯出資料夾，改成另一台的樣子，再匯入
await p.click('[data-act=history]');await W(60);await p.click('.cupcard');await W(60);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=cupsave]')]);const f1='/home/claude/t/cup1.json';await dl.saveAs(f1);
const o=JSON.parse(fs.readFileSync(f1,'utf8'));const later=Date.now()+60000;
o.cups[0].teams.push({id:'tX',division:'男子組',group:'國中甲組',team:{name:'新隊',players:[{no:1,name:''},{no:2,name:''}],captain:1,liberos:[],staff:{},locked:false,color:null,liberoColor:null},at:later});
o.cups[0].refs.forEach(r=>{if(r.name==='陳志明'){r.del=true;r.at=later}});o.cups[0].refs.push({court:'5',label:'第五場地',name:'許大同',at:later});
fs.writeFileSync('/home/claude/t/cup2.json',JSON.stringify(o));
await p.click('.bar .barback');await W(60);
await p.setInputFiles('#import-file','/home/claude/t/cup2.json');await W(150);
const plan=await p.locator('.sheet').innerText();
ok('匯入前列出會改什麼',plan.includes('新增 1 隊')&&plan.includes('第五場地新增 1 位裁判')&&plan.includes('第五場地刪除 1 位裁判'),plan);
await p.click('[data-act=impgo]');await W(100);
d=await db(p);const r5=d.cups[0].refs.filter(r=>r.court==='5'&&!r.del).map(r=>r.name).sort();
ok('合併：新增、刪除都照較新的',r5.join()==='李小華,林美玲,王大明,許大同'.split(',').sort().join(),r5);
ok('合併：新隊加進來',d.cups[0].teams.some(t=>t.id==='tX'&&!t.del));
await p.setInputFiles('#import-file','/home/claude/t/cup2.json');await W(150);ok('同一個檔案再匯入：都有了',(await p.locator('.sheet').innerText()).includes('已經有了'));await p.click('.sheet [data-act=impcancel]');await W(60);
await p.setInputFiles('#import-file',f1);await W(150);ok('舊檔案不會把刪掉的加回來',(await p.locator('.sheet').innerText()).includes('已經有了'),await p.locator('.sheet').innerText());await p.click('.sheet [data-act=impcancel]');await W(60);
// 統一選取樣式：替補選人、陣容格
await p.click('.bar .barback');await W(60);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(100);
await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();await W(60);
ok('陣容選中的格子有勾',await p.evaluate(()=>getComputedStyle(document.querySelector('.cell.sel'),'::after').content.includes('✓')));
for(const n of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');for(const n of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');
await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await W(100);
await p.click('[data-act=subopen][data-team=t1]');await W(40);await p.click('.pc.t1:has(b:text-is("3"))');await W(40);
ok('替補選中的球員有勾',await p.evaluate(()=>getComputedStyle(document.querySelector('.pc.sel'),'::after').content.includes('✓')));
await p.click('.pc.t1:has(b:text-is("3"))');await W(40);await p.click('.kp.bench [data-act=subbench] >> nth=0');await W(40);
ok('場下選中的號碼有勾',await p.evaluate(()=>getComputedStyle(document.querySelector('.kp.bench .chip[aria-pressed=true]'),'::after').content.includes('✓')));
ok('沒有錯誤',!errs.length,errs);
console.log('pass',pass,'fail',fail);await b.close()})();

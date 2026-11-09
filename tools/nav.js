// 返回、關閉、Esc（手機返回鍵）的行為檢查：node tools/nav.js（先跑 build.py）
const {chromium}=require('playwright');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(n,c)=>{console.log((c?'ok ':'FAIL ')+n);if(!c)fail++};
for(const [vw,vh] of [[402,874],[1275,607]]){
const p=await b.newPage({viewport:{width:vw,height:vh}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/volleyball-scoresheet/index.html');await W(300);
await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(200);
await p.locator('[data-act=page][data-v=toss]').first().click();await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');
for(const x of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');for(const x of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${x}"]`);await p.click('[data-act=lu-lock]');
await p.click('[data-act=start]');await W(100);await p.click('[data-act=cs-yes]');await W(200);
const h2=()=>p.evaluate(()=>{const e=document.querySelector('.sheet h2');return e?e.textContent:null});
// 判罰 → 黃牌 → 選對象
await p.click('[data-act=penopen]');await W(150);
if(await p.locator('.sheet [data-act=penteam]').count())await p.locator('.sheet [data-act=penteam]').first().click();await W(150);
await p.click('.sheet [data-act=penkind][data-v=P]');await W(150);
ok(vw+' 選對象 有左上返回',await p.locator('.sheet>.sheetback[data-act=penback]').count()===1);
ok(vw+' 選對象 有關閉',await p.locator('.sheet [data-act=penclose]').count()===1);
await p.keyboard.press('Escape');await W(150);ok(vw+' Esc 回判罰第一層：'+await h2(),(await h2()||'').startsWith('判罰'));
await p.click('.sheet [data-act=penkind][data-v=LOG]');await W(150);ok(vw+' 判罰紀錄 左上返回',await p.locator('.sheet>.sheetback[data-act=penback]').count()===1);
await p.click('.sheet>.sheetback');await W(150);ok(vw+' 按返回回判罰',(await h2()||'').startsWith('判罰'));
await p.click('.sheet [data-act=penclose]');await W(150);ok(vw+' 關閉',await p.locator('.sheet').count()===0);
// 球員選單 → 替補
await p.locator('.pcourt [data-act=pcell]').first().click();await W(200);
const step=p.locator('.sheet [data-act=pmstep]').first();
if(await step.count()&&await step.isEnabled()){await step.click();await W(150);
 ok(vw+' 替補步驟 左上返回',await p.locator('.sheet>.sheetback[data-act=pmback]').count()===1);
 await p.keyboard.press('Escape');await W(150);ok(vw+' Esc 回球員選單',await p.locator('.sheet [data-act=pmstep]').count()>0);}
else console.log('skip pm');
await p.keyboard.press('Escape');await W(150);ok(vw+' 再 Esc 關掉',await p.locator('.sheet').count()===0);
// 其他 → 球衣顏色
await p.click('[data-act=sheet][data-v=more]');await W(150);
await p.locator('.sheet [data-act=sheet][data-v=color]').first().click();await W(150);
ok(vw+' 球衣顏色 左上返回',await p.locator('.sheet>.sheetback[data-act=sheetback]').count()===1);
await p.keyboard.press('Escape');await W(150);ok(vw+' Esc 回其他：'+await h2(),(await h2()||'').startsWith('其他'));
await p.keyboard.press('Escape');await W(150);
// 陣容修正
await p.click('[data-act=sheet][data-v=more]');await W(150);await p.locator('.sheet [data-act=fixopen]').first().click();await W(150);
await p.locator('.sheet [data-act=fixpos]').first().click();await W(150);
ok(vw+' 陣容修正背號步驟：只有一個左上返回',await p.locator('.sheet>.sheetback').count()===1&&await p.locator('.sheet>.sheetback[data-act=fixback]').count()===1);
await p.locator('.sheet [data-act=fixno]').first().click();await W(150);
ok(vw+' 確定修正步驟：沒有左上返回',await p.locator('.sheet>.sheetback').count()===0);
await p.keyboard.press('Escape');await W(150);await p.keyboard.press('Escape');await W(150);await p.keyboard.press('Escape');await W(150);await p.keyboard.press('Escape');await W(150);
ok(vw+' 連按 Esc 全部關掉',await p.locator('.sheet').count()===0);
// 記錄表頁左上
await p.locator('[data-act=sheetopen]').first().click();await W(200);
ok(vw+' 記錄表頁 左上 ‹ 比賽',(await p.locator('.bar .barback').textContent()).includes('比賽'));
await p.click('.bar .barback');await W(200);ok(vw+' 回到比賽',await p.locator('.pcourt').count()>0);
console.log('errs',errs);await p.close()}
// 主畫面開新比賽 → 選資料夾 → 資料頁；資料夾頁回到「紀錄與名單」
const p=await b.newPage({viewport:{width:402,height:874}});
await p.goto('file:///home/claude/volleyball-scoresheet/index.html');await W(300);
await p.evaluate(()=>{localStorage.setItem('nanshe-scoresheet-v1',JSON.stringify({matches:[],cups:[{id:'c1',name:'南社盃',createdAt:'2026-11-09T10:00:00.000Z',teams:[]}]}))});await p.reload();await W(300);
await p.click('[data-act=new]');await W(200);ok('先選資料夾',(await p.locator('.sheet h2').textContent())==='開始新比賽');
ok('預設選剛建的資料夾',(await p.locator('.sheet [data-act=newpick][aria-pressed=true]').textContent()).includes('南社盃'));
await p.click('[data-act=newgo]');await W(300);
ok('到資料頁',await p.locator('#i-game').count()===1);ok('資料頁寫著資料夾',(await p.locator('.folderrow button').textContent()).includes('南社盃'));
const bt=await p.locator('.page button.ghost.full').last().textContent();ok('下方是回主畫面：'+bt,bt.trim()==='回主畫面');
await p.locator('.page button.ghost.full').last().click();await W(200);ok('回到主畫面',await p.locator('.herocta').count()===1);
await p.click('[data-act=history]');await W(200);await p.click('.cupcard');await W(200);
ok('資料夾頁沒有開新比賽',await p.locator('[data-act=cupnew]').count()===0);
ok('資料夾頁左上是紀錄與名單',(await p.locator('.bar .barback').textContent()).includes('紀錄與名單'));
await p.click('.bar .barback');await W(200);ok('回到紀錄與名單',(await p.locator('.bar h1').textContent())==='紀錄與名單');
await p.keyboard.press('Escape');await W(100);
console.log('fail',fail);await b.close()})();

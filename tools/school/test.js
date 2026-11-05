// 用真實點擊跑完整比賽和規則：node tools/school/test.js
const {chromium}=require('playwright'),path=require('path');
const URL='file://'+path.resolve(__dirname,'../../school/index.html');
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m))};
(async()=>{
const b=await chromium.launch(),p=await b.newPage({viewport:{width:1024,height:768}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL);
const A=(a,extra='')=>p.click(`[data-a="${a}"]${extra}`);
const st=()=>p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('vb-school-v1'));const m=d.matches.find(x=>x.id===d.cur);return m&&window.__vb.reduce(m)});
const pt=async k=>{await p.click(`.pt[data-k="${k}"]`);await p.waitForTimeout(370)};
// 新比賽＋名單
await A('new');await A('newgo');
ok(await p.isVisible('[data-r="t1"]'),'名單頁');
await A('rosgo');ok((await p.textContent('#roserr')).includes('至少要 6 位'),'少於 6 人擋下');
const fill=async(k,ns,ls)=>{for(let i=0;i<ns.length;i++)await p.fill(`[data-r="${k}"][data-g="p"][data-i="${i}"]`,''+ns[i]);for(let i=0;i<ls.length;i++)await p.fill(`[data-r="${k}"][data-g="l"][data-i="${i}"]`,''+ls[i])};
await fill('t1',[1,2,3,4,5,6,8,9,10,11,12,13],[7,14]);await fill('t2',[21,22,23,24,25,26,28],[27]);
ok(await p.locator('[data-r="t1"][data-g="p"]').count()===12&&await p.locator('[data-r="t1"][data-g="l"]').count()===2,'12+2 格');
await p.fill('[data-r="t2"][data-g="p"][data-i="6"]','21');ok(await p.inputValue('[data-r="t2"][data-g="p"][data-i="6"]')===''&&(await p.textContent('#roserr')).includes('21 號'),'兩位數重複馬上清掉');
await p.fill('[data-r="t1"][data-g="l"][data-i="1"]','5');await p.keyboard.press('Tab');ok(await p.inputValue('[data-r="t1"][data-g="l"][data-i="1"]')==='','一位數重複離開才清');
await p.fill('[data-r="t1"][data-g="l"][data-i="1"]','5');await p.fill('[data-r="t1"][data-g="l"][data-i="1"]','51');ok(await p.inputValue('[data-r="t1"][data-g="l"][data-i="1"]')==='51','5 可以接著打成 51');await p.fill('[data-r="t1"][data-g="l"][data-i="1"]','14');
await p.fill('[data-r="t2"][data-g="p"][data-i="6"]','28');await A('rosgo');
// 先發
await A('setgo');ok((await p.textContent('#seterr')).includes('先發球'),'要先選發球');
await p.click('.tossb[data-v="t1"]');
for(const n of [1,2,3,4,5,6])await p.click(`[data-a="lupick"][data-v="${n}"]`);
for(const n of [21,22,23,24,25,26])await p.click(`[data-a="lupick"][data-v="${n}"]`);
await A('setgo');
let s=await st();ok(s.c&&s.c.serving==='t1'&&s.c.cur.t1[0]===1,'開局');
// 輪轉與發球
await pt('t1');s=await st();ok(s.c.rot.t1===0&&s.c.score.t1===1,'發球隊得分不輪轉');
await pt('t2');s=await st();ok(s.c.rot.t2===1&&s.c.serving==='t2','換發輪轉');
await pt('t1');s=await st();ok(s.c.rot.t1===1,'換回輪轉');
// 綁定替補
const cellNo=async n=>{s=await st();const i=s.c.cur.t1.indexOf(n);await p.click(`.cellbtn[data-k="t1"][data-v="${i}"]`)};
await cellNo(3);await p.click('[data-a="subpick"][data-v="8"]');s=await st();ok(s.c.cur.t1.includes(8)&&s.c.subs.t1===1,'8 上 3 下');
ok(await p.locator('.cellbtn',{hasText:'綁 3'}).count()===1,'顯示綁定');
await cellNo(8);ok(await p.isVisible('[data-a="subback"]')&&!(await p.isVisible('[data-a="subpick"]')),'綁定中只能換回');await A('subback');
s=await st();ok(s.c.cur.t1.includes(3)&&Object.keys(s.c.bind.t1).length===0,'換回解除綁定');
await cellNo(3);ok(await p.isVisible('[data-a="subpick"][data-v="9"]')&&await p.isVisible('[data-a="subpick"][data-v="8"]'),'完成後可換別人或同人');await p.click('[data-a="subpick"][data-v="9"]');
await cellNo(4);ok(!(await p.isVisible('[data-a="subpick"][data-v="3"]')),'被綁定的人不能換到別的位置');await A('close');
// 卡住時的出路
await cellNo(9);await A('force');await p.click('[data-a="subpick"][data-v="10"]');s=await st();ok(s.c.cur.t1.includes(10)&&Object.values(s.c.bind.t1).includes(9)&&!Object.values(s.c.bind.t1).includes(3),'受傷改換別人');
// 名單外
await cellNo(5);await A('ext');await p.keyboard.press('3');await p.keyboard.press('3');await p.keyboard.press('Enter');s=await st();ok(s.c.cur.t1.includes(33)&&s.roster.t1.p.includes(33),'名單外補輸入');
// 復原連退
await A('undo');await A('undo');s=await st();ok(!s.c.cur.t1.includes(33)&&s.c.cur.t1.includes(5)&&!s.roster.t1.p.includes(33),'復原替補和補輸入');
// 自由球員：找後排一人
s=await st();const pos=i=>(i-s.c.rot.t2+6)%6;
let bi=[0,1,2,3,4,5].find(i=>pos(i)===5);await p.click(`.cellbtn[data-k="t2"][data-v="${bi}"]`);await p.click('[data-a="libin"][data-v="27"]');
s=await st();ok(s.c.libOut.t2&&s.c.cur.t2[bi]===27,'自由上場');
// 雙方輪到自由到前排：VI→V→IV 需 t2 再兩次換發
let safety=0;while((await st()).c.libOut.t2&&safety++<8){const c=(await st()).c;if(c.serving==='t2')await pt('t1');await pt('t2')}
s=await st();ok(!s.c.libOut.t2&&!s.c.cur.t2.includes(27),'前排自動換回');
// 打完第一局：復原和確定
const finish=async k=>{let g=0;while(!(await p.isVisible('.sheet.center'))&&g++<80)await pt(k)};
await finish('t1');ok((await p.textContent('.sheet.center')).includes('局結束'),'局末面板');
await p.waitForTimeout(850);await p.click('.sheet [data-a="undo"]');ok(!(await p.isVisible('.sheet.center')),'局末復原');
await pt('t1');await p.waitForTimeout(850);await A('end');
ok(await p.isVisible('[data-a="setgo"]'),'第二局開局');ok(await p.isDisabled('.tossb >> nth=0'),'第二局不用挑邊');
await A('setgo');s=await st();ok(s.c.n===2&&s.c.serving==='t2'&&s.c.left==='t2','第二局換邊換發');
await finish('t2');await p.waitForTimeout(850);await A('end');
// 決勝局 15 分，8 分換場
await p.click('.tossb[data-v="t2"]');await A('setgo');
await finish('t1');ok((await p.textContent('.sheet.center')).includes('換場'),'決勝局換場');s=await st();ok(s.c.score.t1===8,'8 分換場');
await p.waitForTimeout(850);await A('swap');await finish('t1');await p.waitForTimeout(850);await A('end');
ok((await p.textContent('.result')).includes('2:1'),'三局結束');
// 五局制
await A('home');await A('new');await p.click('[data-a="fmt"][data-v="5"]');await A('newgo');await fill('t1',[1,2,3,4,5,6],[]);await fill('t2',[11,12,13,14,15,16],[]);await A('rosgo');
for(let n=1;n<=3;n++){if(n===1){await p.click('.tossb[data-v="t1"]');for(const x of [1,2,3,4,5,6,11,12,13,14,15,16])await p.click(`[data-a="lupick"][data-v="${x}"]`)}await A('setgo');await finish('t1');await p.waitForTimeout(850);await A('end')}
ok((await p.textContent('.result')).includes('3:0'),'五局三勝');
ok(!errs.length,'無錯誤 '+errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})();

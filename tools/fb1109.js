const {chromium}=require('playwright');const URL='file:///home/claude/nanshe/排球電子記錄表.html';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function roster(p,k,nums,cap,lib){
 for(let i=0;i<nums.length;i++){const empty=p.locator(`[data-act=slot][data-team=${k}][data-kind=reg][data-no=""]`).first();await empty.click();for(const c of String(nums[i]))await p.click(`.kp [data-act=key][data-v="${c}"]`);await p.click('.kp [data-act=add]');await W(10);if(await p.locator('.kp').count())await p.click('.kp [data-act=kpclose]');await W(10)}
 await p.click(`[data-act=slot][data-team=${k}][data-no="${cap}"]`);await p.click('.kp [data-act=cap]');await p.click('.kp [data-act=kpclose]').catch(()=>{});
 for(const l of lib){await p.click(`[data-act=slot][data-team=${k}][data-no="${l}"]`);await p.click('.kp [data-act=lib]');await W(10);if(await p.locator('.kp').count())await p.click('.kp [data-act=kpclose]')}
}
const nos=async(p,sel)=>p.locator(sel).evaluateAll(es=>es.map(e=>e.getAttribute('data-no')));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
await p.goto(URL);await W(100);
await p.click('.herocta');await W(60);await p.fill('#i-name','測試盃');await p.locator('#i-name').blur();
await p.locator('.nav [data-v=roster]').click();await W(60);
await p.fill('#n-t1','藍隊');await p.locator('#n-t1').blur();await p.fill('#n-t2','橘隊');await p.locator('#n-t2').blur();
await roster(p,'t1',[7,1,12,3,5,9,11,15],7,[15]);await roster(p,'t2',[2,4,6,8,10,14,16],2,[]);await W(50);
const ro=await nos(p,'[data-act=slot][data-team=t1][data-kind=reg]:not([data-no=""])');
ok('3 名單照輸入順序',ro.join()==='7,1,12,3,5,9,11',ro);
ok('3 隊長圈在原本那列',await p.locator('[data-act=slot][data-team=t1][data-no="7"] b.circ').count()===1);
await p.click('#rnext [data-act=rnext]');await W(60);await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');await W(60);
let ch=await nos(p,'.bench [data-act=fill]');ok('3 陣容頁號碼小到大',ch.join()==='1,3,5,7,9,11,12',ch);
await p.click('[data-act=fill][data-no="7"]');await W(40);
ok('4 填過的 7 號還在',await p.locator('.bench .chip.used').count()===1);
ok('4 7 號變灰不能點',await p.locator('.bench .chip.used').isDisabled());
ok('4 標位置 I',(await p.locator('.bench .chip.used .at').textContent())==='I');
ch=await p.locator('.bench .benchrow .chip').evaluateAll(es=>es.map(e=>e.textContent));ok('4 順序不變',ch.slice(0,7).join()==='1,3,5,7I,9,11,12',ch);
for(const n of [1,3,5,9,11])await p.click(`[data-act=fill][data-no="${n}"]`);
ok('4 六格都填滿，號碼還在（6 個都灰）',await p.locator('.bench .chip.used').count()===6,await p.locator('.bench .chip.used').count());
ok('4 停在剛填的那格',(await p.locator('.cell.sel').count())===1&&(await p.locator('.cell.sel').textContent()).includes('11'));
ok('4 提示都填好了',(await p.locator('.lineup .subhint, .subhint').last().textContent()).includes('都填好了'));
await p.click('[data-act=fill][data-no="12"]');await W(40);
ok('4 按錯直接點正確的號碼',(await p.locator('.cell.sel').textContent()).includes('12')&&await p.locator('.bench .chip.used').count()===6);
await p.click('[data-act=fill][data-no="11"]');await W(40);
await p.click('[data-act=lu-lock]');await W(40);
for(const n of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');await W(40);
await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await W(80);
// 2. 先點場上（橘隊）
await p.click('[data-act=subopen][data-team=t2]');await W(40);
ch=await nos(p,'.kp.bench .benchrow .chip');ok('2 場下列出可上場的人',ch.join()==='16',ch);
await p.click('.pc.t2 >> text=4');await W(40);
ok('2 點場上後可上場的亮著',await p.locator('.kp.bench [data-act=subin][data-no="16"]').isEnabled());
await p.click('.kp.bench [data-act=subin][data-no="16"]');await W(40);
ok('2 列出這一組',(await p.locator('.subpair').textContent()).includes('4 號下・16 號上'));
await p.click('[data-act=subclose]');await W(40);
// 2. 先點場下（藍隊）
await p.click('[data-act=subopen][data-team=t1]');await W(40);
ch=await nos(p,'.kp.bench .benchrow .chip');ok('2 藍隊場下',ch.join()==='12',ch);
await p.click('.kp.bench [data-act=subbench][data-no="12"]');await W(40);
ok('2 選了 12 號有標示',(await p.locator('.kp.bench [data-no="12"]').getAttribute('aria-pressed'))==='true');
ok('2 沒綁定時六個位置都亮',await p.locator('.pc.t1.dim').count()===0&&await p.locator('.pc.t1.pk').count()===6);
await p.click('.kp.bench [data-act=subbench][data-no="12"]');await W(40);
ok('2 再點一次取消選取',(await p.locator('.kp.bench [data-no="12"]').getAttribute('aria-pressed'))==='false');
await p.click('.kp.bench [data-act=subbench][data-no="12"]');await p.click('.pc.t1 >> text=3');await W(40);
ok('2 換好一組',(await p.locator('.subpair').textContent()).includes('3 號下・12 號上'));
ch=await nos(p,'.kp.bench .benchrow .chip');ok('2 換下的 3 號出現在場下',ch.join()==='3',ch);
await p.click('.kp.bench [data-act=subbench][data-no="3"]');await W(40);
ok('2 綁定：點 3 號只有 12 號那格亮',await p.locator('.pc.t1.dim').count()===5&&await p.locator('.pc.t1.pk').count()===1);
ok('2 亮的是 12 號',(await p.locator('.pc.t1.pk b').textContent())==='12');
await p.click('.kp.bench [data-act=subbench][data-no="3"]');await W(40);
await p.click('.subpair [data-act=subdel]');await W(40);
ok('2 刪除後沒有配對',await p.locator('.subpair').count()===0);
ok('2 3 號回到場上',await p.locator('.pc.t1 >> text=3').count()===1);
ok('2 替補次數回到 0',(await p.locator('.kp.bench .kphead span').first().textContent()).includes('替補 0'));
await p.click('.kp.bench [data-act=subbench][data-no="12"]');await p.click('.pc.t1 >> text=5');await W(40);
await p.click('[data-act=subclose]');await W(40);
ok('2 完成後 12 號在場上',await p.locator('.pc.t1 >> text=12').count()===1);
await p.screenshot({path:'/home/claude/t/play.png'});
ok('沒有錯誤',errs.length===0,errs);
// 1. 平板號碼
for(const [w,h] of [[1280,800],[1340,800],[800,1280],[1024,768],[390,844],[360,640],[1920,1080]]){await p.setViewportSize({width:w,height:h});await W(400);
 const r=await p.evaluate(()=>{const e=document.querySelector('.pcourt .pc'),bb=e.querySelector('b'),R=e.getBoundingClientRect(),G=document.querySelector('.pcourt').getBoundingClientRect();return [R.width,R.height,parseFloat(getComputedStyle(bb).fontSize),G.height]});
 console.log('   ',w+'x'+h,'cell',r[0].toFixed(0),r[1].toFixed(0),'font',r[2],'ratio',(r[2]/Math.min(r[0],r[1])).toFixed(2));
 if(w===1280)await p.screenshot({path:'/home/claude/t/tab.png'});
}
console.log('pass',pass,'fail',fail);await b.close()})();

const {chromium}=require('playwright');const fs=require('fs');const URL='file:///home/claude/nanshe/排球電子記錄表.html';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':x)}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function roster(p,k,nums,cap,lib){ // 用數字鍵輸入
 for(let i=0;i<nums.length;i++){const empty=p.locator(`[data-act=slot][data-team=${k}][data-kind=reg][data-no=""]`).first();await empty.click();for(const c of String(nums[i]))await p.click(`.kp [data-act=key][data-v="${c}"]`);await p.click('.kp [data-act=add]');await W(10);if(await p.locator('.kp').count())await p.click('.kp [data-act=kpclose]');await W(10)}
 await p.click(`[data-act=slot][data-team=${k}][data-no="${cap}"]`);await p.click('.kp [data-act=cap]');await p.click('.kp [data-act=kpclose]').catch(()=>{});
 for(const l of lib){await p.click(`[data-act=slot][data-team=${k}][data-no="${l}"]`);await p.click('.kp [data-act=lib]');await W(10);if(await p.locator('.kp').count())await p.click('.kp [data-act=kpclose]')}
}
async function rally(p,t){if(await p.locator('.sheet [data-act=libout]').count()){await p.click('.sheet [data-act=libout]');await W(30)}await p.click('[data-act=serve]');await W(370);await p.click(`[data-act=point][data-team=${t}]`);await W(370)}
const S=async p=>(await p.locator('.ss b').allTextContents()).join(':');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
await p.goto(URL);await W(100);
ok('home cta',await p.locator('.herocta').isVisible());
await p.click('.herocta');await W(60);ok('info page',await p.locator('#i-name').count()===1);
await p.fill('#i-name','範例盃');await p.locator('#i-name').blur();
await p.click('.bar [data-act=home]');await W(60);ok('match kept',await p.locator('.rmain').count()===1);await p.click('.rmain');await W(60);
await p.locator('.nav [data-v=roster]').click();await W(60);
ok('no next yet',await p.locator('#rnext button').count()===0);
await p.fill('#n-t1','範例藍隊');await p.locator('#n-t1').blur();await p.fill('#n-t2','範例橘隊');await p.locator('#n-t2').blur();await W(30);
await roster(p,'t1',[1,3,5,7,8,9,10,16],7,[16]);await roster(p,'t2',[2,4,6,9,11,12,15,18],9,[18]);await W(50);
ok('next shown',await p.locator('#rnext button').count()===1);await p.click('#rnext button');await W(60);
await p.click('.side.t1');await p.click('.page [data-act=page][data-v=lineup]');await W(60);
for(const n of [7,1,8,3,5,10])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');await W(40);
for(const n of [9,2,11,4,6,12])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');await W(40);
await p.click('[data-act=start]');await p.fill('#cs-time','19:00');await p.click('[data-act=cs-yes]');await W(60);
ok('nav hidden in play',await p.locator('.nav').count()===0);
ok('undo enabled at 0:0',await p.locator('[data-act=undo]').isEnabled());
await p.click('[data-act=undo]');await W(60);ok('back to lineup',await p.locator('[data-act=start]').count()===1);await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await W(60);
// 連點保護
await p.click('[data-act=serve]');await p.mouse.click(100,10);await p.locator('[data-act=point][data-team=t1]').click({timeout:500});ok('double tap no point',await S(p)==='0:0',await S(p));await W(370);
await p.click('[data-act=point][data-team=t1]');const sc=await S(p);ok('point',sc==='1:0',sc);await p.locator('.foot [data-act=serve]').click();ok('tap after point ignored',await p.locator('.foot [data-act=serve]').count()===1);await W(370);
await rally(p,'t1');ok('2:0',await S(p)==='2:0',await S(p));
await p.reload();await W(120);ok('resume after reload',await p.locator('.foot [data-act=serve]').count()===1&&await S(p)==='2:0',await S(p));
await p.click('[data-act=timeout][data-team=t2]');ok('confirm',await p.locator('[data-act=toyes]').count()===1);ok('no timer',await p.locator('.tbar').count()===0);await p.click('[data-act=tono]');await p.click('[data-act=timeout][data-team=t2]');await p.click('[data-act=toyes]');await W(40);ok('timer',await p.locator('.tbar.t2').count()===1);await p.click('[data-act=tmend]');
// 替補
await p.click('[data-act=subopen][data-team=t2]');await W(40);await p.locator('.pc.t2[data-pos="4"]').click();await W(40);await p.locator('[data-act=subin]').first().click();await p.click('[data-act=subclose]');await W(760);
// 自由球員：接發隊後排
const lc=p.locator('.lc.t2').first();await lc.click();await W(40);const pk=p.locator('.pc.t2.pk').first();if(await pk.count()){await pk.click();await W(40)}
await W(50);ok('libero on court',await p.locator('.pc.isl').count()>=1);
// 其他：例外替補面板
await p.click('[data-v=more]');await W(50);ok('more',await p.locator('.mbtn').count()===5);await p.locator('.sheet [data-act=close]').click();
// 處罰
await p.click('[data-act=penopen]');await p.click('[data-act=penteam][data-team=t2]');await p.click('[data-act=pendo][data-v=DP]');ok('pending',await S(p)==='2:0');await p.click('[data-act=penyes]');await W(40);ok('penalty point',await S(p)==='3:0',await S(p));
// 打完第一局
let g=0;while(!(await p.locator('[data-act=endset]').count())&&g++<30)await rally(p,'t1');await W(60);
ok('pending result page',await p.locator('.pres,.ctv-res').count()===1);ok('pending foot',await p.locator('.foot [data-act=endset]').isVisible());
await p.locator('.foot [data-act=undo]').click();await W(60);ok('undo to play',await p.locator('[data-act=point]').count()===2,await S(p));await W(370);await p.click('[data-act=point][data-team=t1]');await W(60);await p.click('[data-act=endset]');await W(80);
ok('set2 lineup',await p.locator('[data-act=copy]').count()===1);ok('break timer',(await p.locator('.breakt').innerText()).includes('局間休息'));
ok('set2 blank',(await p.locator('.cell.fill').count())===0);
await p.click('[data-act=copy]');await W(30);ok('copied',(await p.locator('.cell.fill').count())===6,await p.locator('.cell.fill').count());
await p.click('[data-act=lu-lock]');await W(30);await p.click('[data-act=copy]');await W(30);await p.click('[data-act=lu-lock]');await W(30);await p.click('[data-act=start]');await W(60);ok('set2 direct',await p.locator('[data-act=serve]').count()===1);
g=0;while(!(await p.locator('[data-act=endset]').count())&&g++<30)await rally(p,'t2');await W(60);await p.click('[data-act=endset]');await W(80);
ok('set3 toss',await p.locator('.side').count()===2);await p.click('.side >> nth=0');await W(30);await p.click('.page [data-act=page][data-v=lineup]');await W(60);await p.click('[data-act=copy]');await W(30);await p.click('[data-act=lu-lock]');await W(30);await p.click('[data-act=copy]');await W(30);await p.click('[data-act=lu-lock]');await W(30);await p.click('[data-act=start]');await W(40);await p.click('[data-act=cs-yes]');await W(60);
g=0;while(g++<8){await rally(p,'t1');if(await p.locator('[data-act=swap8]').count())break}ok('swap prompt',await p.locator('[data-act=swap8]').count()===1);await p.click('[data-act=swap8]');await W(60);
g=0;while(!(await p.locator('[data-act=endset]').count())&&g++<20)await rally(p,'t1');await W(60);ok('final btn',(await p.locator('.foot [data-act=endset]').innerText()).includes('比賽'));await p.click('[data-act=endset]');await W(100);
ok('over: back to home',await p.locator('.bar [data-act=home]').count()===1);ok('over bar time',(await p.locator('.bartime').innerText()).includes('全場'));
for(const t of ['s1','s2','s3','res','pen','r6','note','fix']){await p.click(`[data-act=rtab][data-v=${t}]`);await W(40)}
await p.click('[data-act=rtab][data-v=fix]');await p.click('[data-act=fixset][data-v="1"]');await W(40);const r0=await p.locator('.fixrow').count();ok('fix rows',r0>=2,r0);
await p.click('[data-act=rtab][data-v=res]');await W(40);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=rpjson]')]);await dl.saveAs(__dirname+'/one.json');
await p.click('.bar [data-act=home]');await W(100);ok('no live',await p.locator('.rmain').count()===0);await p.click('[data-act=history]');await W(80);ok('in history',await p.locator('.hrow').count()===1);
await p.reload();await W(100);ok('home after reload when over',await p.locator('.herocta').count()===1);
await p.click('[data-act=history]');await W(80);await p.locator('.hrow').click();await W(80);ok('opens result',await p.locator('.pres,.ctv-res').count()===1);ok('no nav',await p.locator('.nav').count()===0);ok('back label',(await p.locator('.barback').innerText()).includes('紀錄與名單'));await p.click('.barback');await W(80);ok('history view',(await p.locator('.bar h1').innerText())==='紀錄與名單');
await p.click('.shead [data-act=bksel]');await W(60);await p.click('[data-act=bkall]');await W(40);await p.click('[data-act=bkgo]');await W(60);ok('bk sheet',(await p.locator('.sheet h2').innerText()).includes('備份 1 場'));
const [dl2]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=bksave]')]);await dl2.saveAs(__dirname+'/all.json');await W(60);ok('bk mode off',await p.locator('.bkpick').count()===0);
await p.click('[data-act=del-ask]');await W(40);await p.click('[data-act=del-no]');await W(40);ok('del cancel',await p.locator('.hrow').count()===1);await p.click('[data-act=del-ask]');await W(40);await p.click('[data-act=del-yes]');await W(60);ok('deleted',await p.locator('.hrow').count()===0);
await p.setInputFiles('#import-file',__dirname+'/all.json');await W(200);ok('import plan',(await p.locator('.sheet').innerText()).includes('新增 1 場'));await p.click('[data-act=impgo]');await W(100);ok('import all',await p.locator('.hrow').count()===1);ok('import msg',(await p.locator('#import-msg').innerText()).includes('已匯入'));
await p.setInputFiles('#import-file',__dirname+'/all.json');await W(200);ok('dup msg',(await p.locator('.sheet').innerText()).includes('已經有了'));await p.click('.sheet [data-act=impcancel]');await W(60);
await p.setInputFiles('#import-file',__dirname+'/sim.json');await W(200);await p.click('[data-act=impgo]');await W(100);await p.click('.barback');await W(80);ok('old format imported',await p.locator('.rmain').count()===1,await p.locator('.rmain').count());
await p.click('[data-act=history]');await W(80);
// 從結果頁刪除
await p.locator('.hrow').first().click();await W(80);await p.click('.dangerlink');await W(40);await p.click('.sheet [data-act=del-yes]');await W(80);ok('deleted from sheet',await p.locator('.hrow').count()===0,await p.locator('.hrow').count());
// 空比賽自動清除
await p.goto(URL);await W(80);const c0=await p.evaluate(()=>JSON.parse(localStorage['nanshe-scoresheet-v1']).matches.length);if(await p.locator('.herocta').count()){await p.click('.herocta');await W(40);await p.click('.bar [data-act=home]');await W(40)}const c1=await p.evaluate(()=>JSON.parse(localStorage['nanshe-scoresheet-v1']).matches.length);ok('empty removed',c0===c1,[c0,c1]);
// 賽前沒收、棄權、不完整
await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(60);await p.locator('.nav [data-v=toss]').click();await p.click('[data-act=sheet][data-v=pf]');await p.click('[data-act=pfreason][data-v=陣容不完整]');await p.click('[data-act=pfwin][data-team=t2]');await p.click('[data-act=pfdo]');await W(80);ok('pre-forfeit note',(await p.locator('.ctv-note svg').textContent()).includes('陣容不完整'));await p.click('.bar [data-act=home]');await W(50);
// 範例重複按不會多一筆
await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(60);await p.click('.bar [data-act=home]');await W(60);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(60);await p.click('.bar [data-act=home]');await W(60);const sn=await p.evaluate(()=>JSON.parse(localStorage['nanshe-scoresheet-v1']).matches.filter(m=>m.events[0].data.info.sample&&!m.events.some(e=>e.type==='PRE_FORFEIT')).length);ok('one sample',sn===1,sn);
// 更正頁：時間、陣容
await p.click('.rmain');await W(60);await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();await W(60);
for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=p.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}const k=p.locator('[data-act=lu-lock]');if(await k.count())await k.click();await W(20)}
await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await W(60);
await rally(p,'t1');
await p.click('[data-act=penopen]');await p.click('[data-act=penteam][data-team=t2]');await p.click('[data-act=penkind][data-v=W]');await p.click('[data-act=penwho][data-no="2"]');await p.click('[data-act=penyes]');await W(60);ok('toast',(await p.locator('.lockline').innerText()).includes('已記錄'));ok('card on court',await p.locator('.cdm').count()===1);
// 自由球員上場後被判出場
await p.locator('.lc.t2').first().click();await W(40);const pk2=p.locator('.pc.t2.pk').first();await pk2.click();await W(40);
await p.click('[data-act=penopen]');await p.click('[data-act=penteam][data-team=t2]');await p.click('[data-act=penkind][data-v=D]');const lb=await p.locator('.pc.isl b').first().innerText();await p.click(`[data-act=penwho][data-no="${lb}"]`);await p.click('[data-act=penyes]');await W(60);ok('libero notice',(await p.locator('.sheet').innerText()).includes('已換回'));await p.click('[data-act=nclose]');await W(40);ok('libero off court',await p.locator('.pc.isl').count()===0);ok('libero marked away',await p.locator(`.lc.t2.away[data-no="${lb}"][data-act=libaway]`).count()===1);
await p.click('[data-act=sheetopen]');await p.click('[data-act=rtab][data-v=fix]');await W(60);await p.fill('.fixtimes input >> nth=0','18:30');await p.locator('.fixtimes input >> nth=0').blur();await W(30);await p.click('[data-act=rtab][data-v=s1]');await W(40);ok('start edited',await p.locator('.ctv-set svg').evaluate(e=>[...e.querySelectorAll('text')].map(t=>t.textContent).join('|')).then(t=>/\|18\|/.test(t)&&/\|30\|/.test(t)));
await p.click('[data-act=rtab][data-v=fix]');await W(40);await p.locator('[data-act=fixopen]').first().click();await W(40);await p.click('[data-act=fixpos][data-v="0"]');await W(40);await p.locator('[data-act=fixno]').first().click();await W(40);await p.click('[data-act=fixdo]');await W(40);
await p.click('[data-act=sheetclose]');await W(60);
console.log('errors',errs);
// 版面
for(const [w,h] of [[320,568],[360,640],[375,667],[390,844],[430,932],[768,1024],[820,1180],[667,375],[844,390],[1024,768],[1180,820],[1440,900],[1920,1080]]){
 const c=await b.newContext({viewport:{width:w,height:h}});const q=await c.newPage();q.on('pageerror',x=>errs.push(x.message));await q.goto(URL);await W(60);
 const over=async(tag)=>{const o=await q.evaluate(()=>[document.documentElement.scrollWidth,innerWidth,document.documentElement.scrollHeight,innerHeight]);ok(`${w}x${h} ${tag} no page scroll`,o[0]<=o[1]&&o[2]<=o[3],o)};
 await over('home');await q.click('[data-act=helpopen]');await q.click('[data-act=sample]');await W(60);await over('roster');
 const nav=q.locator('.nav [data-v=info]');await nav.click();await W(40);await over('info');
 await q.locator('.nav [data-v=toss]').click();await W(40);await q.click('.side.t2');await W(30);await over('toss');await q.locator('.nav [data-v=lineup]').click();await W(50);await over('lineup');
 for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=q.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}const k=q.locator('[data-act=lu-lock]');if(await k.count())await k.click();await W(20)}
 const stt=await q.evaluate(()=>{const e=document.querySelector('[data-act=start]');if(!e)return null;const r=e.getBoundingClientRect();return r.bottom<=innerHeight+1});
 await q.locator('[data-act=start]').scrollIntoViewIfNeeded();await q.click('[data-act=start]');await W(30);await q.click('[data-act=cs-yes]');await W(80);await over('play');
 const vis=await q.evaluate(()=>{const P=document.querySelector('.page'),F=document.querySelector('.foot').getBoundingClientRect(),C=document.querySelector('.pcourt').getBoundingClientRect(),T=document.querySelector('.pbtns').getBoundingClientRect();return {need:P.scrollHeight-P.clientHeight,fb:F.bottom,h:innerHeight,cell:Math.round(C.height/3),cw:Math.round(C.width/4),tb:T.bottom}});
 ok(`${w}x${h} play fits`,vis.need<=0&&vis.fb<=h,vis);console.log(w,h,'cell',vis.cell,'x',vis.cw,'scroll',vis.need);
 await q.click('[data-act=sheetopen]');await W(60);const tv=await q.evaluate(()=>{const b=[...document.querySelectorAll('.sheettabs button')].map(x=>x.getBoundingClientRect());const F=document.querySelector('.sheetfoot').getBoundingClientRect();return {r:Math.max(...b.map(x=>x.right)),l:Math.min(...b.map(x=>x.left)),clip:[...document.querySelectorAll('.sheettabs button')].some(x=>x.scrollWidth>x.clientWidth+1),fb:F.bottom,w:innerWidth,h:innerHeight}});ok(`${w}x${h} tabs visible`,tv.r<=tv.w&&!tv.clip,tv);ok(`${w}x${h} back visible`,tv.fb<=tv.h+1,tv);
 await q.click('[data-act=sheetclose]');await W(40);await q.click('[data-v=more]');await W(60);const mv=await q.evaluate(()=>{const c=document.querySelector('.shd button').getBoundingClientRect();return c.top>=0&&c.bottom<=innerHeight});ok(`${w}x${h} more close visible`,mv);
 await c.close();
}
console.log('pass',pass,'fail',fail,'errs',errs);await b.close()})().catch(x=>{console.log('ERR',x.message.slice(0,500));process.exit(1)});

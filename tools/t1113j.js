// 11/13 往下滑關掉全部統一（tools/patch_v93.py）：使用者「我是希望可以全部都統一，不會一下有的可以有的不行」。
// 觸控螢幕直放、橫放都一樣：視窗、數字鍵盤（=完成，號碼存好）、替補面板（=完成，換好的保留）、使用說明、看整張、全螢幕（轉 90 度時照記錄表的下）。
// 沒有關閉鍵的（局結束、被判罰一定要換人）不能滑；滑一點點會彈回去；捲到一半往下是捲動；橫的不算（說明左右換張）；電腦用滑鼠不顯示。
// node tools/t1113j.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h,touch=true)=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('volleyball-prefs','{"landSheet":false}')});await p.reload();await W(350);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}return [ctx,p]};
// 從圖層裡一點往某個方向滑（螢幕座標），用真的觸控事件
const swipe=(p,sel,dx,dy,o={})=>p.evaluate(async([sel,dx,dy,o])=>{const L=document.querySelector(sel);if(!L)return 'nolayer';const r=L.getBoundingClientRect();
  const x=o.x!=null?o.x:r.left+r.width/2,y=o.y!=null?o.y:r.top+Math.min(40,r.height/3);const tg=document.elementFromPoint(x,y)||L;
  const mk=(xx,yy)=>new Touch({identifier:1,target:tg,clientX:xx,clientY:yy});
  tg.dispatchEvent(new TouchEvent('touchstart',{touches:[mk(x,y)],changedTouches:[mk(x,y)],bubbles:true}));
  for(let i=1;i<=10;i++){await new Promise(r=>setTimeout(r,16));tg.dispatchEvent(new TouchEvent('touchmove',{touches:[mk(x+dx*i/10,y+dy*i/10)],changedTouches:[mk(x+dx*i/10,y+dy*i/10)],bubbles:true}))}
  tg.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[mk(x+dx,y+dy)],bubbles:true}));return tg.tagName},[sel,dx,dy,o]);
const has=async(p,sel)=>(await p.locator(sel).count())>0;
const pt=async(p,k)=>{if(await has(p,'[data-act=serve]')){await p.click('[data-act=serve]');await W(450)}await p.click(`[data-act=point][data-team=${k}]`);await W(SCHOOL?600:700)};
const grab=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const c=e.classList.contains('swipe');const pick=e.matches('.fsv')?e.querySelector('.fsin'):e.matches('.whv')?e.querySelector('.whbar'):e;const bf=getComputedStyle(pick,'::before');return {swipe:c,bar:bf.content!=='none'&&bf.display!=='none'&&parseFloat(bf.width)>=20}},sel);

for(const [w,h,tag] of [[393,760,'portrait'],[874,402,'landscape']]){
  // 1. 數字鍵盤：滑掉 = 完成，號碼存好
  {const [ctx,p]=await open(w,h);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
    if(!(await has(p,'[data-act=slot]')))await p.locator('.nav [data-v=roster]').click();await W(300);
    await p.locator('[data-act=slot][data-team=t1]:not(.fill)').first().click();await W(300);
    const g=await grab(p,'.kp');ok(tag+' keypad swipeable with bar',g&&g.swipe&&g.bar,g);
    await p.click('.kp [data-act=key][data-v="4"]');await p.click('.kp [data-act=key][data-v="2"]');
    await swipe(p,'.kp',0,25);await W(350);ok(tag+' keypad small swipe stays',await has(p,'.kp'));
    await swipe(p,'.kp',0,200);await W(450);
    ok(tag+' keypad swiped closed',!(await has(p,'.kp')));
    ok(tag+' keypad swipe keeps number (like 完成)',await p.evaluate(()=>[...document.querySelectorAll('[data-act=slot][data-team=t1].fill,[data-team=t1].fill')].some(e=>/\b42\b/.test(e.textContent))));
    // 2. 視窗（說明目錄）往下滑、說明卡片左右滑不關、往下滑關
    await p.click('.bar [data-act=helpopen],[data-act=helpopen]').catch(()=>{});await W(300);
    if(await has(p,'.help')){const gh=await grab(p,'.help');ok(tag+' help swipeable with bar',gh&&gh.swipe&&gh.bar,gh);
      if(!(await has(p,'.help .htrack'))){const first=p.locator('.help [data-act=helpgroup]').first();if(await first.count()){await first.click();await W(350)}}
      if(await has(p,'.help .htrack')){const i0=await p.evaluate(()=>document.getElementById('htrack').scrollLeft);
        await swipe(p,'.help',-220,6,{y:h*0.55});await W(400);ok(tag+' help sideways swipe does not close',await has(p,'.help'));
        ok(tag+' help layer not moved by sideways swipe',await p.evaluate(()=>!document.querySelector('.help').style.translate),i0)}
      else ok(tag+' help cards opened',false);
      await swipe(p,'.help',0,260,{y:h*0.45});await W(450);ok(tag+' help swiped closed',!(await has(p,'.help')))}
    else ok(tag+' help opened',false);
    await ctx.close()}

  // 3. 比賽中：視窗、替補面板、記錄表的看整張、全螢幕
  {const [ctx,p]=await open(w,h);await flow.start(p,{serve:'t1'});await W(300);
    await pt(p,'t1');
    await p.click('[data-act=timeout][data-team=t2]');await W(250);
    const gs=await grab(p,'.sheet');ok(tag+' sheet swipeable with bar',gs&&gs.swipe&&gs.bar,gs);
    await swipe(p,'.sheet',0,260);await W(450);ok(tag+' sheet swiped closed',!(await has(p,'.sheet')));
    ok(tag+' timeout not recorded',await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches?d.matches.find(x=>x.id===d.currentId):null;return !JSON.stringify(m||d).includes('"TIMEOUT"')},KEY));
    // 替補面板：換一組再滑 = 完成（換好的保留）
    await p.click('[data-act=subopen][data-team=t2]');await W(300);
    const gb=await grab(p,'.kp.bench');ok(tag+' sub panel swipeable with bar',gb&&gb.swipe&&gb.bar,gb);
    await p.locator('.pcourt .pc.t2').nth(2).click();await W(200);
    const bn=p.locator('.kp.bench [data-act=subbench]:not([disabled]),.kp.bench [data-act=subin]:not([disabled])');if(await bn.count()){await bn.first().click();await W(300)}
    const subs=()=>p.evaluate(k=>{const s=localStorage.getItem(k);return (s.match(/"type":"SUB"/g)||[]).length*100+(s.match(/"type":"UNDO"/g)||[]).length},KEY); // 替補幾筆×100 + 復原幾筆
    const made=await p.evaluate(()=>{const k=document.querySelector('.kp.bench');return k?k.textContent:''});const n0=await subs();
    await swipe(p,'.kp.bench',0,260,{y:null});await W(500);
    ok(tag+' sub panel swiped closed',!(await has(p,'.kp.bench')));
    ok(tag+' a sub was made before the swipe',n0>=100,made.slice(0,80));
    ok(tag+' sub kept after swipe (like 完成, no undo)',(await subs())===n0&&n0>=100,[n0,await subs()]);
    if(!SCHOOL){
      await p.click('[data-act=sheetopen]');await W(400);
      if(await has(p,'[data-act=whole]')){await p.click('[data-act=whole]');await W(450);const gw=await grab(p,'.whv');ok(tag+' whole view swipeable with bar',gw&&gw.swipe&&gw.bar,gw);
        await swipe(p,'.whv',0,260,{y:h*0.4});await W(450);ok(tag+' whole view swiped closed',!(await has(p,'.whv')))}
      const tb=p.locator('.sheettabs [data-act=rtab]').first();if(await tb.count()){await tb.click();await W(350)}
      if(await has(p,'[data-act=fsopen]')){await p.click('[data-act=fsopen]');await W(450);const gf=await grab(p,'.fsv');ok(tag+' fullscreen swipeable with bar',gf&&gf.swipe&&gf.bar,gf);
        const rot=await p.evaluate(()=>{const m=/matrix\(([^)]+)\)/.exec(getComputedStyle(document.querySelector('.fsin')).transform||'');if(!m)return 0;const a=m[1].split(',').map(parseFloat);return Math.round(Math.atan2(a[1],a[0])*180/Math.PI)});
        if(rot===90){await swipe(p,'.fsv',0,260,{x:w*0.5,y:h*0.3});await W(450);ok(tag+' rotated fullscreen: screen-down is sideways for the sheet, stays',await has(p,'.fsv'));
          await swipe(p,'.fsv',-260,0,{x:w*0.8,y:h*0.5});await W(450)}
        else{await swipe(p,'.fsv',0,260,{y:h*0.3});await W(450)}
        ok(tag+' fullscreen swiped closed (sheet down, rot '+rot+')',!(await has(p,'.fsv')))}}
    await ctx.close()}
}

// 4. 不能滑的：局結束（一定要選一個）、捲到一半的視窗
{const [ctx,p]=await open(393,760);await flow.start(p,{serve:'t1'});await W(300);
  await p.evaluate(()=>{});
  for(let i=0;i<30&&!(await has(p,'.sheet.setend'));i++)await pt(p,'t1');
  if(await has(p,'.sheet.setend')){ok('set-end not swipeable',!(await p.evaluate(()=>document.querySelector('.sheet.setend').classList.contains('swipe'))));
    await swipe(p,'.sheet.setend',0,300);await W(450);ok('set-end stays after swipe',await has(p,'.sheet.setend'))}
  else ok('reached set end',false);
  await ctx.close()}
{const [ctx,p]=await open(393,560);await flow.start(p,{serve:'t1'});await W(300);
  await p.click('[data-act=sheet][data-v=more]');await W(350);
  const sc=await p.evaluate(()=>{const s=document.querySelector('.sheet');s.scrollTop=80;return s.scrollTop});
  if(sc>0){await swipe(p,'.sheet',0,220,{y:300});await W(450);ok('scrolled sheet: swipe down scrolls, does not close',await has(p,'.sheet'))}
  await ctx.close()}

// 5. 電腦（滑鼠、寬螢幕）：沒有往下滑，也不顯示小橫槓
{const [ctx,p]=await open(1366,768,false);await flow.start(p,{serve:'t1'});await W(300);
  await pt(p,'t1');
  await p.click('[data-act=timeout][data-team=t1]');await W(250);
  const gd=await grab(p,'.sheet');ok('desktop sheet: no swipe/bar',gd&&!gd.swipe&&!gd.bar,gd);
  await ctx.close()}

ok('no page errors',errs.length===0,errs.slice(0,3));
console.log(fail?'FAIL':'OK',pass,'pass',fail,'fail');await b.close()})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

// 11/13 健檢的修正（tools/patch_v90.py）：聚焦的輸入框不被黏著的列蓋住、比賽資料的下一步看得到、補記選隊按鈕不變淡、
// 刪除鈕 44px、深色紅框字的對比、藍色球衣、Esc 退一層、很矮的畫面球場不擠、窄手機用過的號碼不被位置字蓋到
// node tools/t1113h.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},...o});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}return [ctx,p]};
const covered=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return 'none';const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t&&(e.contains(t)||t.contains(e))?'':(t?t.className+' '+(t.textContent||'').slice(0,12):'outside')},sel);
const lum=c=>{const v=c.match(/\d+(\.\d+)?/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const cr=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05)};

// 1. 比賽資料「下一步」不用捲；聚焦的輸入框不被黏著的列蓋住
{const [ctx,p]=await open(375,667,{hasTouch:true,isMobile:true,colorScheme:'dark'});
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  await p.locator('.nav [data-v=info]').click();await W(300);
  const r=await p.evaluate(()=>{const e=document.querySelector('.page>.primary.full[data-act=page]'),n=document.querySelector('.nav');return e&&n?[e.getBoundingClientRect().bottom,n.getBoundingClientRect().top]:null});
  ok('info next visible without scroll',r&&r[0]<=r[1]+1,r);
  await p.evaluate(()=>{const e=document.querySelector('#i-place');e.focus()});await W(300);ok('info last field not covered when focused',(await covered(p,'#i-place'))==='',await covered(p,'#i-place'));
  if(!SCHOOL){await p.locator('.nav [data-v=refs]').click();await W(300);await p.evaluate(()=>document.querySelector('#ref-type').focus());await W(300);
    ok('refs type box not covered when focused',(await covered(p,'#ref-type'))==='',await covered(p,'#ref-type'))}
  await p.locator('.nav [data-v=roster]').click();await W(300);
  const lib=await p.evaluate(()=>{const e=document.querySelector('input[id^=pn-t1-lib], input[id^=pn-t1-reg]:last-of-type');return e?'#'+e.id:null});
  if(lib){await p.evaluate(s=>document.querySelector(s).focus(),lib);await W(300);ok('roster name box not covered when focused '+lib,(await covered(p,lib))==='',await covered(p,lib))}
  // 深色紅框字
  await p.locator('.nav [data-v=toss]').click();await W(300);
  const c=await p.evaluate(()=>{const e=document.querySelector('[data-act=sheet][data-v=pf]');let bg='rgb(0,0,0)';for(let q=e;q;q=q.parentElement){const x=getComputedStyle(q).backgroundColor;if(x!=='rgba(0, 0, 0, 0)'){bg=x;break}}return [getComputedStyle(e).color,bg]});
  ok('dark forfeit text contrast >= 4.5',cr(c[0],c[1])>=4.5,[c,cr(c[0],c[1]).toFixed(2)]);
  await ctx.close()}

// 2. 補記選隊、替補刪除鈕、藍色球衣、Esc 退一層
{const [ctx,p]=await open(400,760);await flow.start(p,{serve:'t1'});await W(300);
  const pt=async k=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(450)}await p.click(`[data-act=point][data-team=${k}]`);await W(600)};
  await pt('t1');await pt('t2');
  ok('blue jersey #1D76CD',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--t1-j').trim().toUpperCase())==='#1D76CD');
  await p.click('[data-act=subopen][data-team=t2]');await W(200);await p.locator('.pcourt .pc.t2').nth(3).click();await W(200);await p.locator('.kp [data-act=subin]').first().click();await W(250);
  const dh=await p.locator('.kp [data-act=subdel]').boundingBox();ok('sub delete 44px tall',dh&&dh.height>=44,dh);
  await p.click('.kp .go');await W(900);
  await p.click('[data-act=sheetopen]');await W(300);await p.click('[data-act=rtab][data-v=fix]');await W(300);await p.click('[data-act=insopen]');await W(300);
  const op=await p.locator('.sheet [data-act=insteam]').evaluateAll(x=>x.map(e=>getComputedStyle(e).opacity));ok('insert team buttons not dimmed before choosing',op.length===2&&op.every(v=>v==='1'),op);
  await p.locator('.sheet [data-act=insteam]').first().click();await W(250);
  const op2=await p.locator('.sheet [data-act=insteam]').evaluateAll(x=>x.map(e=>getComputedStyle(e).opacity));ok('other team dimmed after choosing',op2.includes('1')&&op2.some(v=>+v<1),op2);
  await p.keyboard.press('Escape');await W(250);await p.click('[data-act=sheetclose]');await W(300);
  // 輪轉錯誤確認步驟按 Esc 退回填分數
  await pt('t2');await pt('t1');await W(300);
  await p.click('[data-act=sheet][data-v=more]');await W(250);await p.click('.sheet [data-act=mteam][data-v=rot]');await W(200);await p.click('.sheet [data-act=rotopen][data-team=t2]');await W(250);
  if(await p.locator('#rot-to').count()){await p.fill('#rot-to','0');await p.click('.sheet [data-act=rotgo]');await W(250);
    ok('rot confirm step',await p.locator('.sheet [data-act=rotdo]').count()===1);
    await p.keyboard.press('Escape');await W(250);ok('Esc on rot confirm goes back',await p.locator('.sheet [data-act=rotgo]').count()===1&&await p.locator('.sheet [data-act=rotdo]').count()===0)}
  else ok('rot sheet input',false,await p.locator('.sheet').innerText());
  await p.keyboard.press('Escape');await W(250);
  // 暫停倒數小視窗按 Esc 關掉
  for(let i=0;i<3&&await p.locator('.sheet').count();i++){await p.keyboard.press('Escape');await W(200)}
  await p.click('[data-act=timeout][data-team=t1]');await W(200);await p.click('[data-act=toyes]');await W(300);
  if(await p.locator('.tpop').count()){await p.keyboard.press('Escape');await W(250);ok('Esc closes timeout popup',await p.locator('.tpop').count()===0)}
  await ctx.close()}

// 3. 很矮的畫面（筆電放大 200%）：按完替補球場不擠
{const [ctx,p]=await open(683,330,{colorScheme:'dark'});await flow.start(p,{serve:'t1'});await W(300);
  await p.click('[data-act=subopen][data-team=t2]');await W(200);await p.locator('.pcourt .pc.t2').nth(3).click();await W(200);await p.locator('.kp [data-act=subin]').first().click().catch(()=>{});await W(250);await p.locator('.kp .go').first().click();await W(500);
  const mc=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('.pcourt .pc')].map(c=>c.getBoundingClientRect().height)));ok('short screen court cells >= 44',mc>=44,mc);
  await ctx.close()}

// 4. 窄手機：用過的號碼和右上角位置字不重疊
{const [ctx,p]=await open(360,640,{hasTouch:true,isMobile:true});
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(250);
  await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();await W(250);
  for(const n of [1,3,5,7,9,11]){await p.locator(`[data-act=fill][data-no="${n}"]`).dispatchEvent('click');await W(80)}await W(250);
  const ov=await p.evaluate(()=>[...document.querySelectorAll('.bench .chip.used')].map(c=>{const b=c.querySelector('b'),a=c.querySelector('.at');if(!b||!a)return 0;const r=b.getBoundingClientRect(),q=a.getBoundingClientRect();return Math.max(0,Math.min(r.right,q.right)-Math.max(r.left,q.left))*Math.max(0,Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top))}));
  ok('used chip number not under tag',ov.length>0&&ov.every(x=>x<12),ov);
  await ctx.close()}

ok('no page errors',errs.length===0,errs);
await b.close();console.log('t1113h',SCHOOL?'school':'full',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();

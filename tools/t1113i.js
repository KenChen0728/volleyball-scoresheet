// 11/13 iPhone 橫放的安全區（tools/patch_v91.py）：左右各 62（動態島、圓角）、下面 21（橫條）時，
// 步驟列的字不被切掉、數字鍵和替補面板不被擠扁、正中間的視窗不多留邊、比賽中球場的羅馬數字不碰號碼、下面的按鈕離開橫條；
// 沒有安全區時（平板、電腦、安卓大部分）樣子不變。
// 安全區用「把 env(safe-area-inset-*) 換成數字」模擬（瀏覽器模擬器沒有安全區）
// node tools/t1113i.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const fs=require('fs');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const SRC=decodeURIComponent(URL.replace(/^file:\/\//,'')),TMP=SRC.replace(/[^\/]*$/,'.t1113i-'+process.pid+'.html');
fs.writeFileSync(TMP,fs.readFileSync(SRC,'utf8').replace(/env\(safe-area-inset-(left|right|bottom|top),0px\)/g,(m,k)=>({left:62,right:62,bottom:21,top:0})[k]+'px'));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(inset,o={})=>{const ctx=await b.newContext({viewport:{width:874,height:402},hasTouch:true,isMobile:true,...o});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto(inset?'file://'+TMP:URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('volleyball-prefs','{"landSheet":false}')});await p.reload();await W(350);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}return [ctx,p]};
const pt=async(p,k)=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(450)}await p.click(`[data-act=point][data-team=${k}]`);await W(650)};
// 羅馬數字碰到號碼（隊長圈照圓形算）
const touching=p=>p.evaluate(()=>{const bad=[];document.querySelectorAll('.pcourt .pc').forEach(c=>{const s=c.querySelector('.pos'),n=c.querySelector('b');if(!s||!n)return;
  const a=s.getBoundingClientRect(),r=n.getBoundingClientRect();
  if(n.classList.contains('circ')){const cx=r.left+r.width/2,cy=r.top+r.height/2,rad=Math.min(r.width,r.height)/2,qx=Math.max(a.left,Math.min(cx,a.right)),qy=Math.max(a.top,Math.min(cy,a.bottom));if(Math.hypot(qx-cx,qy-cy)<rad-1)bad.push(s.textContent+'/'+n.textContent)}
  else{const g=document.createRange();g.selectNodeContents(n);const t=g.getBoundingClientRect();if(a.right>t.left+1&&a.left<t.right-1&&a.bottom>t.top+1&&a.top<t.bottom-1)bad.push(s.textContent+'/'+n.textContent)}});return bad});

// 1. 賽前步驟：步驟列的字完整、頁面不再多留左邊的安全區、數字鍵不扁、下面的按鈕離開橫條
{const [ctx,p]=await open(true);
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  await p.locator('.nav [data-v=info]').click();await W(300);
  const nv=await p.evaluate(()=>{const n=document.querySelector('.nav'),cs=getComputedStyle(n),bs=[...n.querySelectorAll('button')];
    return {w:n.getBoundingClientRect().width,pl:parseFloat(cs.paddingLeft),minBtn:Math.min(...bs.map(x=>x.getBoundingClientRect().width)),cut:bs.map(x=>[...x.querySelectorAll('span')].some(s=>s.scrollWidth>s.clientWidth+1)).filter(Boolean).length,
      page:parseFloat(getComputedStyle(document.querySelector('.page')).paddingLeft)}});
  ok('nav keeps 92 after the inset',nv.w-nv.pl>=91&&nv.minBtn>=88,nv);ok('nav labels not cut',nv.cut===0,nv);ok('page beside nav: no extra left inset',nv.page===12,nv);
  const nx=await p.evaluate(()=>{const e=document.querySelector('.page>.primary.full[data-act=page]');if(!e)return null;const r=e.getBoundingClientRect();return {bottom:r.bottom,shadow:getComputedStyle(e).boxShadow}});
  ok('info next above home bar',nx&&nx.bottom<=402-16,nx);ok('strip under the sticky next covered (page color)',nx&&/0px 24px 0px/.test(nx.shadow),nx);
  await p.locator('.nav [data-v=roster]').click();await W(300);
  await p.locator('[data-act=slot][data-team=t1]:not(.fill)').first().click();await W(300);
  const kp=await p.evaluate(()=>[...document.querySelectorAll('.kp .pad button')].map(x=>{const r=x.getBoundingClientRect();return Math.min(r.width,r.height)}));
  ok('roster keypad keys >= 40',kp.length>=10&&Math.min(...kp)>=40,kp);
  const kr=await p.evaluate(()=>{const k=document.querySelector('.kp');return [k.getBoundingClientRect().right,parseFloat(getComputedStyle(k).paddingRight),parseFloat(getComputedStyle(k).paddingLeft)]});
  ok('keypad: inset only on the screen side',kr[0]>=873&&kr[1]>=62&&kr[2]===12,kr);
  // 11/13 使用者（語音）：白框剛好包住鍵盤、靠下對齊；填左邊那隊在右邊、填右邊那隊在左邊；「下一格」不換行
  const kpBox=()=>p.evaluate(()=>{const k=document.querySelector('.kp'),r=k.getBoundingClientRect(),a=k.querySelector('.pad .add'),g=document.createRange();g.selectNodeContents(a);
    const nav=document.querySelector('.nav');return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,h:r.height,lines:new Set([...g.getClientRects()].map(x=>Math.round(x.top))).size,navR:nav?nav.getBoundingClientRect().right:0}});
  const k1=await kpBox();ok('keypad hugs the keys, at the bottom (t1 on the right)',k1.h<=230&&k1.bottom>=401&&k1.right>=873,k1);ok('next-slot key one line (t1)',k1.lines===1,k1);
  await p.click('[data-act=kpclose]');await W(200);
  await p.locator('[data-act=slot][data-team=t2]:not(.fill)').first().click();await W(300);
  const k2=await kpBox();ok('keypad hugs the keys, at the bottom (t2 on the left, next to steps)',k2.h<=230&&k2.bottom>=401&&Math.abs(k2.left-k2.navR)<=2,k2);ok('next-slot key one line (t2)',k2.lines===1,k2);
  await p.click('[data-act=kpclose]');await W(200);
  await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await W(200);
  await p.locator('.nav [data-v=lineup]').click();await W(300);
  const lu=await p.evaluate(()=>{const e=document.querySelector('[data-act=lu-lock]');const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+20,innerHeight-6);return {bottom:r.bottom,under:t?t.tagName+'.'+t.className:''}});
  ok('lineup button above home bar',lu.bottom<=402-16,lu);ok('nothing peeks under the lineup foot',!/^(BUTTON|B|I|SPAN)\./.test(lu.under)||/foot|primary/.test(lu.under),lu);
  for(const n of [1,3,5,7,9,11])await p.click(`[data-act=fill][data-no="${n}"]`);await W(200);
  const chip=await p.evaluate(()=>{const bad=[];document.querySelectorAll('.luside .chip.used').forEach(c=>{const a=c.querySelector('.at'),n=c.querySelector('b');if(!a||!n)return;const g=document.createRange();g.selectNodeContents(n);const t=g.getBoundingClientRect(),r=a.getBoundingClientRect(),gt=t.top+0.18*parseFloat(getComputedStyle(n).fontSize); // 數字的字形從字框上緣往下約 0.2 個字高才開始
    if(r.right>t.left+1&&r.left<t.right-1&&r.bottom>gt+0.5&&r.top<t.bottom-1)bad.push(a.textContent+'/'+n.textContent)});return bad});
  ok('used numbers not touched by position tag',chip.length===0,chip);
  // 正中間的視窗：左右照一般間距
  await p.click('.bar [data-act=home]').catch(()=>{});await W(300);
  if(await p.locator('[data-act=settings]').count()){await p.click('[data-act=settings]');await W(300);
    const sp=await p.evaluate(()=>{const s=document.querySelector('.sheet');const cs=getComputedStyle(s);return [parseFloat(cs.paddingLeft),parseFloat(cs.paddingRight),s.getBoundingClientRect().left]});
    ok('centered sheet: normal side padding',sp[0]===14&&sp[1]===14&&sp[2]>=62,sp);await p.keyboard.press('Escape');await W(200)}
  const hb=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('.hero button')].map(x=>x.getBoundingClientRect().bottom)));
  ok('home buttons above home bar',hb<=402-14,hb);
  await ctx.close()}

// 2. 比賽中：球場羅馬數字不碰號碼（暫停倒數、替補後多一行時格子最矮）、替補面板不扁
{const [ctx,p]=await open(true);await flow.start(p,{serve:'t1'});await W(300);
  await pt(p,'t1');await pt(p,'t2');
  ok('court numerals clear (normal)',(await touching(p)).length===0,await touching(p));
  await p.click('[data-act=timeout][data-team=t1]');await W(200);if(await p.locator('[data-act=toyes]').count()){await p.click('[data-act=toyes]');await W(400)}
  ok('court numerals clear (timeout)',(await touching(p)).length===0,await touching(p));
  if(await p.locator('[data-act=tmend]').count()){await p.click('[data-act=tmend]');await W(300)}
  await p.click('[data-act=subopen][data-team=t2]');await W(250);
  const bp=await p.evaluate(()=>{const k=document.querySelector('.kp.bench');if(!k)return null;const r=k.getBoundingClientRect(),cs=getComputedStyle(k);return {w:r.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),l:r.left,r:r.right,pl:parseFloat(cs.paddingLeft),pr:parseFloat(cs.paddingRight)}});
  ok('sub panel content >= 300 wide',bp&&bp.w>=300,bp);ok('sub panel: inset only on the screen side',bp&&((bp.l<=1&&bp.pl>=62&&bp.pr===12)||(bp.r>=873&&bp.pr>=62&&bp.pl===12)),bp);
  await p.locator('.pcourt .pc.t2').nth(3).click();await W(200);await p.locator('.kp [data-act=subin],.kp [data-act=subbench]').first().click().catch(()=>{});await W(250);
  if(await p.locator('.kp .go').count()){await p.click('.kp .go');await W(900)}
  ok('court numerals clear (after sub)',(await touching(p)).length===0,await touching(p));
  const bt=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('.wplay button')].map(x=>x.getBoundingClientRect().bottom)));
  ok('play buttons above home bar',bt<=402-20,bt);
  await ctx.close()}

// 3. 沒有安全區：樣子不變（步驟列 92、頁面左邊 12、視窗 14、比賽頁兩邊隊伍欄 210）
{const [ctx,p]=await open(false);
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);await p.locator('.nav [data-v=info]').click();await W(300);
  const v=await p.evaluate(()=>[document.querySelector('.nav').getBoundingClientRect().width,parseFloat(getComputedStyle(document.querySelector('.page')).paddingLeft)]);
  ok('no inset: nav 92, page 12',Math.round(v[0])===92&&v[1]===12,v);
  await p.locator('.nav [data-v=lineup]').click().catch(()=>{});await W(200);
  await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();
  for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=p.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}await p.click('[data-act=lu-lock]');await W(150)}
  await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await W(400);
  const cols=await p.evaluate(()=>getComputedStyle(document.querySelector('.wplay')).gridTemplateColumns);
  ok('no inset: team columns 210',/^210px .* 210px$/.test(cols),cols);
  await ctx.close()}

// 4. 平板直放、電腦：步驟列、視窗不受影響
{const [ctx,p]=await open(false,{viewport:{width:820,height:1180}});
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  const sp=await p.evaluate(()=>[document.querySelector('.nav').getBoundingClientRect().width,parseFloat(getComputedStyle(document.querySelector('.page')).paddingLeft)]);
  ok('tablet portrait nav/page unchanged',sp[1]===12,sp);
  await ctx.close()}
{const [ctx,p]=await open(false,{viewport:{width:1180,height:820},hasTouch:true,isMobile:false});
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  if(!(await p.locator('[data-act=slot]').count()))await p.locator('.nav [data-v=roster]').click();await W(300);
  await p.locator('[data-act=slot][data-team=t1]:not(.fill)').first().click();await W(300);
  const kt=await p.evaluate(()=>{const r=document.querySelector('.kp').getBoundingClientRect();return {top:r.top,bottom:r.bottom,right:r.right,h:r.height}});
  ok('tablet landscape keypad hugs the keys at the bottom right',kt.h<=230&&kt.bottom>=819&&kt.right>=1179,kt);
  await ctx.close()}

if(!SCHOOL){// 5. 手機轉橫看記錄表：在安全區裡面
  const [ctx,p]=await open(true);await p.evaluate(()=>localStorage.setItem('volleyball-prefs','{}'));await p.reload();await W(300);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  await flow.start(p,{serve:'t1'});await W(500);
  const ld=await p.evaluate(()=>{const l=document.querySelector('.land');if(!l)return null;const bar=l.querySelector('.landbar').getBoundingClientRect();return {left:bar.left,right:bar.right,bottom:l.querySelector('.landsheet').getBoundingClientRect().bottom}});
  ok('landscape sheet inside safe area',ld&&ld.left>=62&&ld.right<=874-62&&ld.bottom<=402-4,ld);
  await ctx.close()}

ok('no page errors',errs.length===0,errs.slice(0,3));
try{fs.unlinkSync(TMP)}catch(e){}
console.log(fail?'FAIL':'OK',pass,'pass',fail,'fail');await b.close()})().catch(e=>{try{fs.unlinkSync(TMP)}catch(x){}console.log('ERR',e.message);process.exit(1)});

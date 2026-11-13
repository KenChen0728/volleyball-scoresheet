// 11/13 使用者：手機橫放（又寬又矮）時，設定頁一頁放得下，下面的設定不會沒看到（tools/patch_v94.py）。
// 比賽資料、裁判、挑邊、陣容：不用上下滑，每個按鈕和欄位都看得到、點得到（沒有被黏在下面的按鈕蓋住）；
// 挑邊的「換球衣顏色」看得到；名單的兩顆按鈕排一列；直放和平板樣子不變。安全區用把 env() 換成數字的副本模擬。
// node tools/t1113k.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const SRC=decodeURIComponent(URL.replace(/^file:\/\//,''));
const copy=(ins)=>{const f=SRC.replace(/[^\/]*$/,'.t1113k-'+process.pid+'-'+ins+'.html');fs.writeFileSync(f,fs.readFileSync(SRC,'utf8').replace(/env\(safe-area-inset-(left|right|bottom|top),0px\)/g,(m,k)=>({left:ins,right:ins,bottom:ins?21:0,top:0})[k]+'px'));return f};
const made=[];
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h,ins,touch=true)=>{const f=copy(ins);made.push(f);const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+f);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(350);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}return [ctx,p]};
// 這一頁：要不要捲、每個按鈕和欄位的中間點得到它自己（沒被蓋住）
const check=p=>p.evaluate(()=>{const pg=document.querySelector('.page');const over=pg.scrollHeight-pg.clientHeight;const bad=[];
  pg.querySelectorAll('button,input,select').forEach(e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return;const x=r.left+r.width/2,y=r.top+r.height/2;
    if(y>innerHeight||y<0){bad.push((e.textContent||e.id).trim().slice(0,10)+'@'+Math.round(y));return}
    const t=document.elementFromPoint(x,y);if(!t||!(t===e||e.contains(t)||t.contains(e)&&t.tagName==='LABEL'))bad.push((e.textContent||e.id).trim().slice(0,10)+' 被 '+(t?(t.textContent||t.className).trim().slice(0,10):'無')+' 蓋住')});
  return {over,bad}});

for(const [w,h,ins] of [[874,402,62],[812,375,50],[667,375,0],[956,440,62]]){const tag=w+'x'+h+(ins?'i':'');
  const [ctx,p]=await open(w,h,ins);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  for(const v of ['info','refs','toss','lineup']){const l=p.locator(`.nav [data-v=${v}]`);if(!(await l.count()))continue;if(await l.getAttribute('aria-disabled')==='true')continue;await l.click();await W(350);
    if(v==='toss'){const r0=await check(p);ok(tag+' toss before pick fits',r0.over<=1&&!r0.bad.length,r0);await p.click('.side.t1');await W(300);
      const tc=await p.evaluate(()=>[...document.querySelectorAll('.tosscolors button')].map(e=>{const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!t&&e.contains(t)}));
      ok(tag+' jersey colour buttons visible and tappable',tc.length===2&&tc.every(Boolean),tc);
      const ft=await p.evaluate(()=>[...document.querySelectorAll('.page>.foot>button')].map(e=>Math.round(e.getBoundingClientRect().top)));
      ok(tag+' toss next + no-show in one row',ft.length<2||Math.abs(ft[0]-ft[1])<=2,ft)}
    const r=await check(p);ok(tag+' '+v+' fits one screen, nothing covered',r.over<=1&&!r.bad.length,r)}
  if(!SCHOOL){await p.locator('.nav [data-v=roster]').click();await W(300);
    const rn=await p.evaluate(()=>[...document.querySelectorAll('.rnext>button')].map(e=>Math.round(e.getBoundingClientRect().top)));ok(tag+' roster: next and print in one row',rn.length===2&&Math.abs(rn[0]-rn[1])<=2,rn)}
  await ctx.close()}

// 有資料夾（實際比賽）：比賽資料也一頁放得下
if(!SCHOOL&&fs.existsSync('/tmp/fix1113.json')){const [ctx,p]=await open(874,402,62);
  await p.evaluate(([k,d])=>localStorage.setItem(k,d),[KEY,fs.readFileSync('/tmp/fix1113.json','utf8')]);await p.reload();await W(400);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  await p.click('[data-act=new]');await W(300);await p.click('[data-act=newpick][data-id=cupsample]');await p.click('[data-act=newgo]');await W(500);
  const r=await check(p);ok('folder match: info fits one screen',r.over<=1&&!r.bad.length,r);
  await p.locator('.nav [data-v=refs]').click();await W(350);
  const sh=await p.evaluate(()=>getComputedStyle(document.querySelector('.page>.primary.full')).boxShadow);ok('refs next: strip under it covered',/0px 24px 0px/.test(sh),sh);
  await ctx.close()}

// 直放、平板、電腦：樣子不變
for(const [w,h,touch] of [[393,760,true],[1180,820,true],[1366,768,false]]){const [ctx,p]=await open(w,h,0,touch);
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);await p.locator('.nav [data-v=info]').click();await W(300);
  const cols=await p.evaluate(()=>getComputedStyle(document.querySelector('.page>.fields')).gridTemplateColumns.split(' ').length);ok(w+'x'+h+' info still 2 columns',cols===2,cols);
  await p.locator('.nav [data-v=toss]').click();await W(300);
  const ball=await p.evaluate(()=>Math.round(document.querySelector('.side .ball').getBoundingClientRect().width));ok(w+'x'+h+' toss ball unchanged',w>=700?ball===120:ball>=70,ball);
  await ctx.close()}

ok('no page errors',errs.length===0,errs.slice(0,3));
made.forEach(f=>{try{fs.unlinkSync(f)}catch(e){}});
console.log(fail?'FAIL':'OK',pass,'pass',fail,'fail');await b.close()})().catch(e=>{made.forEach(f=>{try{fs.unlinkSync(f)}catch(x){}});console.log('ERR',e.message);process.exit(1)});

// 11/23 語音實測後四項（tools/patch_v129.py）：時間自己的數字鍵、備份匯入的字、賽程比分不拆開＋平板隊名、拖框時下面不空白。
// 手機、平板直放橫放都量。用 mk-ranktest.js 的積分測試盃（虛構名字）
const {chromium}=require('playwright');const {execFileSync}=require('child_process');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
const FILE='/tmp/rank-v129.json';execFileSync('node',[__dirname+'/mk-ranktest.js',FILE]);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const SIZES=[[390,844,1],[844,390,1],[360,640,1],[820,1180,1],[1180,820,1],[1366,768,0]];
(async()=>{const b=await chromium.launch();
for(const [w,h,touch] of SIZES){const tag=w+'x'+h;
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:!!touch,isMobile:!!touch&&w<700,deviceScaleFactor:2});const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errs.push(tag+' '+e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(500);
  await p.getByText('賽事與紀錄',{exact:true}).first().click();await W(400);
  // 2. 備份和匯入
  const bt=await p.locator('.histtools').innerText();ok(tag+' backup buttons 備份／匯入',/^\s*備份\s*匯入\s*$/.test(bt),bt);
  const mt=await p.locator('main').innerText();ok(tag+' short notes',/打完的比賽會放在這裡。/.test(mt)&&/換手機前先備份。/.test(mt)&&!/清除瀏覽器/.test(mt),mt.slice(0,300));
  await p.setInputFiles('#import-file',FILE);await W(400);await p.click('[data-act=impgo]');await W(500);
  await p.locator('[data-act=cupopen]').filter({hasText:'積分測試盃'}).first().click();await W(400);
  await p.click('[data-act=cuptab][data-v=sched]');await W(400);
  // 3. 比分一局一行
  const sets=await p.locator('.scsets>span').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),lh=parseFloat(getComputedStyle(e).lineHeight)||parseFloat(getComputedStyle(e).fontSize)*1.2;return {t:e.innerText,one:r.height<lh*1.5,in:r.right<=innerWidth+.5}}));
  ok(tag+' each set score on one line',sets.length>0&&sets.every(x=>x.one&&!/\n/.test(x.t)&&x.in),sets.filter(x=>!x.one||x.t.includes('\n')).slice(0,3));
  const fs=await p.locator('.scrow .hnames').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  ok(tag+' team name size',w>=760?fs>=19:fs===16,fs);
  ok(tag+' no page side scroll',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(SHOT)await p.screenshot({path:SHOT+'/v129-sched-'+tag+'.png'});
  // 1. 時間數字鍵
  await p.click('[data-act=scnew]');await W(300);await p.click('#sc-time');await W(200);await p.click('.sheet [data-act=scpkdone]');await W(150);await p.click('#sc-time');await W(200);
  await p.click('.sheet .scwlist[data-wk=h] .scwi[aria-selected=true]');await W(200);
  ok(tag+' own keypad, no text input',await p.locator('.sheet .sctkp button').count()===12&&await p.locator('.sheet input#sc-tin').count()===0);
  const kp=await p.evaluate(()=>{const sh=document.querySelector('.sheet').getBoundingClientRect();return [...document.querySelectorAll('.sheet .sctkp button,.sheet .scpbtns button')].map(e=>{const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return {t:e.innerText,w:Math.round(r.width),h:Math.round(r.height),inSheet:r.left>=sh.left-1&&r.right<=sh.right+1&&r.top>=0&&r.bottom<=innerHeight+1,top:!!t&&(t===e||e.contains(t)),one:e.scrollWidth<=e.clientWidth+1&&r.height<64}})});
  ok(tag+' keypad buttons inside sheet, not covered, ≥44, one line',kp.every(k=>k.inSheet&&k.top&&k.w>=44&&k.h>=44&&k.one),kp.filter(k=>!(k.inSheet&&k.top&&k.w>=44&&k.h>=44&&k.one)));
  for(const d of '0930'){await p.click('.sheet [data-act=sctk][data-v="'+d+'"]');await W(50)}
  ok(tag+' display 09:30',/09:30/.test(await p.locator('.sheet .sctdisp').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/v129-time-'+tag+'.png'});
  await p.click('.sheet [data-act=sctok]');await W(200);ok(tag+' time set 09:30',(await p.getAttribute('#sc-time','data-v'))==='09:30');
  await p.keyboard.press('Escape');await W(200);await p.keyboard.press('Escape');await W(200);
  // 4. 拖框（只有手機直放有）
  if(w<600&&h>w){await p.click('[data-act=cupdiv][data-v=男子組]').catch(()=>{});await W(200);
    await p.locator('.scrow').filter({hasText:'山貓隊'}).filter({hasText:'海豚隊'}).first().click();await W(700);
    const rt=p.locator('.rtabs [data-v^=s]').first();if(await rt.count()){await rt.click();await W(400)}
    const mag=p.locator('.loupe .lmag');ok(tag+' loupe shown',await mag.count()===1);
    if(await mag.count()){const r=await mag.boundingBox();const y=r.y+r.height/2;
      await p.mouse.move(r.x+r.width*0.5,y);await p.mouse.down();for(let i=1;i<=12;i++){await p.mouse.move(r.x+r.width*0.5-i*20,y);await W(16)}
      const cov=await p.evaluate(()=>{const m=document.querySelector('.loupe .lmag'),sv=m.querySelector('svg'),a=m.getBoundingClientRect(),s=sv.getBoundingClientRect();return {full:s.width>a.width*1.2,left:s.left<=a.left+1,right:s.right>=a.right-1,mw:a.width,sw:s.width}});
      ok(tag+' while dragging: magnified covers whole box (no blank)',cov.full&&cov.left&&cov.right,cov);
      if(SHOT)await p.screenshot({path:SHOT+'/v129-drag-'+tag+'.png'});
      await p.mouse.up();await W(400);
      const after=await p.evaluate(()=>{const m=document.querySelector('.loupe .lmag'),sv=m.querySelector('svg'),a=m.getBoundingClientRect(),s=sv.getBoundingClientRect();return {w:Math.round(s.width),mw:Math.round(a.width),hot:!!m.querySelector('.hot,rect[data-act]')||true}});
      ok(tag+' after release: redrawn to box size',Math.abs(after.w-after.mw)<=2,after);
      ok(tag+' frame moved right',await p.evaluate(()=>parseFloat(document.querySelector('.lframe').style.left)>5))}}
  await ctx.close()}
ok('no page errors',errs.length===0,errs);
console.log('t1123-v129',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

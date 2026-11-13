// 11/13 健檢：每個畫面狀態 × 各種尺寸，量排版和按鈕的問題（超出畫面、被蓋住、按不到、太小、字被切、對比不夠、字重疊）
// 用法：node tools/audit1113.js [網址] [資料 key] [輸出資料夾] [尺寸…]
//   尺寸寫法：寬x高，後面可加 t（觸控手機）、l（淺色，預設深色），例如 375x667t、1180x820l
//   學校版：node tools/audit1113.js file://.../school/index.html vb-school-v2 /tmp/audit-school 375x667t
// 結果寫在 輸出資料夾/report.json；有問題的畫面另存截圖（ALL=1 每個畫面都存）。比分用注入事件快速推進（和 t1113f.js 一樣的做法）。
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
const O=(process.argv[4]||'/tmp/audit1113')+'/';fs.mkdirSync(O,{recursive:true});
const SIZES=(process.argv.slice(5).length?process.argv.slice(5):['375x667t']).map(s=>{const m=s.match(/^(\d+)x(\d+)(t?)(l?)$/);return {w:+m[1],h:+m[2],touch:!!m[3],light:!!m[4],tag:s}});
const W=ms=>new Promise(r=>setTimeout(r,ms));
const ALL=!!process.env.ALL; // ALL=1：每個畫面都存截圖（看整體樣子用），不只有問題的
// INSET=左,右,下（例如 62,62,21 = iPhone 16/17 Pro 橫放）：把 env(safe-area-inset-*) 換成這些數字，量東西有沒有跑到動態島和下方橫條；截圖畫上動態島的位置
const INSET=process.env.INSET?process.env.INSET.split(',').map(Number):null;
let RUNURL=URL,TMPF=null;
if(INSET&&URL.startsWith('file://')){const f=decodeURIComponent(URL.slice(7)),h=fs.readFileSync(f,'utf8').replace(/env\(safe-area-inset-(left|right|bottom|top),0px\)/g,(m,k)=>({left:INSET[0],right:INSET[1],bottom:INSET[2],top:0})[k]+'px');
  TMPF=f.replace(/[^\/]*$/,'.inset-audit-'+process.pid+'.html');fs.writeFileSync(TMPF,h);RUNURL='file://'+TMPF}

// 在頁面裡量：只看最上層（有視窗開著時只看視窗裡）
function auditPage(ins){
  const out=[],vw=innerWidth,vh=innerHeight;
  const desc=e=>{const a=e.getAttribute('data-act'),v=e.getAttribute('data-v'),id=e.id,c=(typeof e.className==='string'?e.className:'').trim().split(/\s+/).slice(0,2).join('.');
    return e.tagName.toLowerCase()+(id?'#'+id:'')+(c?'.'+c:'')+(a?'['+a+(v?'='+v:'')+']':'')+' 「'+(e.innerText||e.value||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,16)+'」'};
  // 看得到的範圍：被捲動容器切掉的部分不算（捲到下面的內容不算疊到下方步驟列）
  const clip=e=>{let r=e.getBoundingClientRect(),L=r.left,T=r.top,R=r.right,B=r.bottom;
    for(let p=e.parentElement;p&&p!==document.documentElement;p=p.parentElement){const cs=getComputedStyle(p);if(cs.overflowX!=='visible'||cs.overflowY!=='visible'){const q=p.getBoundingClientRect();
      if(cs.overflowX!=='visible'){L=Math.max(L,q.left);R=Math.min(R,q.right)}if(cs.overflowY!=='visible'){T=Math.max(T,q.top);B=Math.min(B,q.bottom)}}}
    L=Math.max(L,0);T=Math.max(T,0);R=Math.min(R,innerWidth);B=Math.min(B,innerHeight);return {left:L,top:T,right:R,bottom:B,width:Math.max(0,R-L),height:Math.max(0,B-T)}};
  const shown=e=>{const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return false;for(let p=e;p&&p.nodeType===1;p=p.parentElement){const cs=getComputedStyle(p);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false;if(p.hasAttribute('inert')||p.getAttribute('aria-hidden')==='true')return false}return true};
  const seen=e=>{const c=clip(e);return c.width>=2&&c.height>=2};
  const stuck=e=>{for(let p=e;p&&p.nodeType===1;p=p.parentElement){const ps=getComputedStyle(p).position;if(ps==='sticky'||ps==='fixed')return true}return false}; // 黏在上下的列
  const layers=[...document.querySelectorAll('.help,.land,.stale,.whv,.fsv,.sheet,.kp')].filter(shown);
  const top=layers.length?layers[layers.length-1]:document.getElementById('app');
  const inTop=e=>top.contains(e)||(top.classList.contains('kp')&&false);
  const hscroll=e=>{for(let p=e.parentElement;p;p=p.parentElement){const cs=getComputedStyle(p);if((cs.overflowX==='auto'||cs.overflowX==='scroll')&&p.scrollWidth>p.clientWidth+1)return true}return false};
  const se=document.scrollingElement;if(se.scrollWidth>vw+1)out.push(['頁面可以左右捲',se.scrollWidth+' > '+vw]);
  if(ins){const iy0=vh/2-63,iy1=vh/2+63,iz=Math.max(0,Math.min(ins[0],ins[1])-10); // 動態島或瀏海：橫放時在左邊或右邊（看手機往哪邊轉），到安全區往內約 10（動態島約 11～51）、高約 126 置中；下方橫條在最下面 ins[2]
    for(const e of [...document.querySelectorAll('button,a[href],input,select,textarea,[data-act],h1,h2,h3,p,b,span,label,td,th,li')].filter(x=>!x.closest('svg')&&shown(x)&&inTop(x)&&(x.matches('button,a,input,select,textarea,[data-act]')||[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())))){
      const c=clip(e);if(c.width<2||c.height<2)continue;
      if(c.bottom>iy0&&c.top<iy1&&(c.left<iz||c.right>vw-iz))out.push(['被動態島擋到',desc(e),Math.round(c.left)+'～'+Math.round(c.right)+' / '+Math.round(c.top)+'～'+Math.round(c.bottom)]);
      else if(e.matches('button,a,input,select,textarea,[data-act]')&&c.bottom>vh-ins[2]+4&&c.top>vh-ins[2]-30){
        let more=false;for(let q=e.parentElement;q&&q!==document.documentElement;q=q.parentElement){if(stuck(q)&&getComputedStyle(q).position==='sticky')break;const oy=getComputedStyle(q).overflowY;if((oy==='auto'||oy==='scroll')&&q.scrollHeight-q.scrollTop-q.clientHeight>4){more=true;break}}
        if(!more)out.push(['按鈕貼著下方橫條',desc(e),Math.round(c.top)+'～'+Math.round(c.bottom)])}}}  // 還能往下捲的內容不算（捲上來就離開橫條）
  const act=[...document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[data-act]')].filter(e=>!e.closest('svg')&&shown(e)&&inTop(e));
  for(const e of act){
    const r=e.getBoundingClientRect(),dis=e.disabled||e.getAttribute('aria-disabled')==='true';
    if(!hscroll(e)&&(r.right>vw+1||r.left<-1))out.push(['超出畫面左右',desc(e),Math.round(r.left)+'～'+Math.round(r.right)]);
    if(!dis&&e.tagName!=='LABEL'&&(r.width<40||r.height<40)&&!e.closest('.sheetgrid,.lusheet,.ctv,.ussheet'))out.push(['按鈕太小',desc(e),Math.round(r.width)+'×'+Math.round(r.height)]);
    const c=clip(e),cx=c.left+c.width/2,cy=c.top+c.height/2;
    if(c.width>=8&&c.height>=8&&!dis){const t=document.elementFromPoint(cx,cy);
      if(t&&!e.contains(t)&&!t.contains(e)&&!(t.closest('label')&&t.closest('label').contains(e))&&!(stuck(t)&&!stuck(e))){const tl=t.closest('.help,.land,.sheet,.scrim,.kp');if(!tl||tl.contains(e)||tl===top)out.push(['被蓋住',desc(e),'被 '+desc(t)])}}
    if((e.tagName==='BUTTON')&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflow!=='visible')out.push(['按鈕字被切',desc(e),e.scrollWidth+' > '+e.clientWidth]);
  }
  // 文字：太小、對比、重疊
  const rgb=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return [a[0],a[1],a[2],a.length>3?a[3]:1]};
  const lum=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])};
  const bgOf=e=>{const st=[];for(let p=e;p&&p.nodeType===1;p=p.parentElement){const cs=getComputedStyle(p);if(cs.backgroundImage&&cs.backgroundImage!=='none')return null;const c=rgb(cs.backgroundColor);if(c&&c[3]>0){st.push(c);if(c[3]>=1)break}}
    let base=st.length&&st[st.length-1][3]>=1?st.pop():(matchMedia('(prefers-color-scheme: dark)').matches?[0,0,0,1]:[255,255,255,1]);
    while(st.length){const c=st.pop();base=[c[0]*c[3]+base[0]*(1-c[3]),c[1]*c[3]+base[1]*(1-c[3]),c[2]*c[3]+base[2]*(1-c[3]),1]}return base};
  const texts=[...document.querySelectorAll('body *')].filter(e=>!e.closest('svg')&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&shown(e)&&seen(e)&&inTop(e));
  const boxes=[];
  for(const e of texts){const cs=getComputedStyle(e),fs=parseFloat(cs.fontSize),r=e.getBoundingClientRect();
    if(fs<12&&!e.closest('.ctv,.ussheet'))out.push(['字太小',desc(e),fs+'px']);
    const dis=e.closest('button:disabled,[aria-disabled=true]')||e.matches('.pc .pos');let op=1;for(let q=e;q&&q.nodeType===1;q=q.parentElement)op*=+getComputedStyle(q).opacity;const fg0=rgb(cs.color),fg=fg0&&[fg0[0],fg0[1],fg0[2],fg0[3]*op],bg=bgOf(e);
    if(fg&&bg&&!dis){const f2=fg[3]<1?[fg[0]*fg[3]+bg[0]*(1-fg[3]),fg[1]*fg[3]+bg[1]*(1-fg[3]),fg[2]*fg[3]+bg[2]*(1-fg[3])]:fg;const L1=lum(f2),L2=lum(bg),cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
      const big=fs>=24||(fs>=18.6&&+cs.fontWeight>=700);if(cr<(big?3:4.5)&&!e.closest('.ctv'))out.push(['對比不夠',desc(e),cr.toFixed(2)+(big?'（大字要 3）':'（要 4.5）')])}
    const c=clip(e);if(c.width>2&&c.height>2)boxes.push([e,c])}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const [a,ra]=boxes[i],[b,rb]=boxes[j];if(a.contains(b)||b.contains(a))continue;
    const ix=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left),iy=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top);
    if(stuck(a)!==stuck(b))continue; // 黏著的列蓋住捲動中的內容，捲一下就看得到（另外檢查）
    if(ix>3&&iy>3&&ix*iy>0.25*Math.min(ra.width*ra.height,rb.width*rb.height)){const pa=getComputedStyle(a).position,pb=getComputedStyle(b).position;out.push(['字疊在一起',desc(a),desc(b)+(pa!=='static'||pb!=='static'?'（有定位）':'')])}}
  // 主要按鈕要不要捲動才看得到
  const main=document.querySelector('main.page'),nav=document.querySelector('.nav');
  for(const e of act.filter(x=>x.matches('.primary,.go')&&!x.disabled)){const r=e.getBoundingClientRect();let lim=vh;if(nav&&shown(nav)&&!top.closest('.sheet')){const nt=nav.getBoundingClientRect().top;if(nt>vh/2)lim=Math.min(lim,nt)} // 步驟列在下面時才扣掉
    if(r.bottom>lim+1)out.push(['主要按鈕要捲動',desc(e),'下緣 '+Math.round(r.bottom)+' > '+Math.round(lim)])}
  // 捲動容器裡的每個按鈕、輸入框：捲過去（置中）還被黏在上下的東西蓋住，或聚焦時（捲到剛好看得到）被蓋住
  const sc=[main,...document.querySelectorAll('.sheet')].filter(x=>x&&shown(x)&&x.scrollHeight>x.clientHeight+2&&(x===top||top.contains(x)||x.contains(top)));
  const hit=e=>{const c=clip(e);if(c.width<4||c.height<4)return 'out';const t=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);return t&&!e.contains(t)&&!t.contains(e)?t:null};
  for(const box of sc){const keep=box.scrollTop;
    for(const e of [...box.querySelectorAll('button,input,textarea,select')].filter(x=>shown(x)&&inTop(x)&&!x.disabled&&!stuck(x))){
      e.scrollIntoView({block:'center'});let t=hit(e);if(t)out.push(['捲過去也被蓋住',desc(e),t==='out'?'看不到':'被 '+desc(t)]);
      else if(e.matches('input,textarea,select')){box.scrollTop=keep;e.scrollIntoView({block:'nearest'});t=hit(e);if(t&&t!=='out')out.push(['聚焦時被蓋住',desc(e),'被 '+desc(t)])}
    }
    box.scrollTop=keep}
  return out;
}

(async()=>{const b=await chromium.launch();const report={};
for(const S of SIZES){
  const ctx=await b.newContext({viewport:{width:S.w,height:S.h},colorScheme:S.light?'light':'dark',hasTouch:S.touch,isMobile:S.touch,serviceWorkers:'block'});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
  const w=(ms=80)=>p.waitForTimeout(ms);let shotN=0;
  const audit=async name=>{await w(250);await p.evaluate(()=>document.querySelectorAll('.ftoast').forEach(x=>x.remove()));
    let r;try{r=await p.evaluate(auditPage,INSET)}catch(e){r=[['檢查失敗',e.message.slice(0,80)]]}
    if(r.length||ALL){const f=S.tag+'-'+(++shotN)+'-'+name+'.png';
      if(INSET)await p.evaluate(b=>{const vh=innerHeight,vw=innerWidth,mk=(css)=>{const d=document.createElement('div');d.className='__ins';d.style.cssText='position:fixed;z-index:2147483647;pointer-events:none;'+css;document.body.appendChild(d)};
        mk('left:'+Math.max(0,b[0]-51)+'px;top:'+(vh/2-63)+'px;width:'+Math.min(37,Math.max(20,b[0]-14))+'px;height:126px;border-radius:19px;background:#000');mk('right:'+0+'px;top:0;width:'+b[1]+'px;height:100%;background:rgba(255,0,0,.12)');mk('left:0;top:0;width:'+b[0]+'px;height:100%;background:rgba(255,0,0,.12)');mk('left:'+(vw/2-70)+'px;bottom:8px;width:140px;height:5px;border-radius:3px;background:#000')},INSET);
      await p.screenshot({path:O+f}).catch(()=>{});if(INSET)await p.evaluate(()=>document.querySelectorAll('.__ins').forEach(x=>x.remove()));if(r.length)report[S.tag+' '+name]={shot:f,issues:r}}};
  const click=async(sel,opt={})=>{const l=p.locator(sel).first();if(await l.count()){await l.click(opt).catch(async()=>{await l.dispatchEvent('click')});await w(opt.ms||200);return true}return false};
  const close=async()=>{for(let i=0;i<3;i++){if(!(await click('.sheet [data-act=close]')))break}};
  const inject=async(set,team,n)=>{await p.evaluate(([k,set,team,n])=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0],e0=m.events[0],T=Date.now()-20*60000;
    for(let j=0;j<n;j++){const at=new Date(T+j*20000).toISOString(),id=Math.random().toString(36).slice(2,9);m.events.push({id:'as'+id,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'SERVE',data:{set}});m.events.push({id:'ap'+id,matchId:m.id,seq:m.events.length+1,at,device:e0.device,type:'POINT',data:{set,team}})}
    localStorage.setItem(k,JSON.stringify(d))},[KEY,set,team,n]);await p.reload();await w(600);await click('.sheet.about [data-act=aboutclose]')};
  const point=async k=>{if(await p.locator('[data-act=serve]').count()){await click('[data-act=serve]',{ms:450})}await click(`[data-act=point][data-team=${k}]`,{ms:600})};
  const lockBoth=async(copy)=>{for(let i=0;i<2;i++){if(copy)await click('[data-act=copy]',{ms:150});else for(const n of (i?[2,4,6,8,10,14]:[1,3,5,7,9,11]))await click(`[data-act=fill][data-no="${n}"]`,{ms:60});await click('[data-act=lu-lock]',{ms:200})}};
  try{
    await p.goto(RUNURL);await p.evaluate(land=>{localStorage.clear();sessionStorage.clear();if(land)localStorage.setItem('volleyball-prefs','{"landSheet":false}')},S.touch&&S.w>S.h);await p.reload();await w(500);
    if(await p.locator('.sheet.about').count()){await audit('about-intro');await click('.sheet.about [data-act=aboutclose]')}
    await audit('home');
    await click('.herobtns [data-act=helpopen]');await audit('help-menu');await click('[data-act=helpgroup][data-v=sets]',{ms:400});await audit('help-card');await click('[data-act=helpclose]');
    if(await click('[data-act=settings]')){await audit('settings');await close()}
    await click('.herobtns [data-act=helpopen]');await click('[data-act=sample]',{ms:400});
    await audit('roster');await click('[data-act=slot][data-team=t1]:not(.fill)');await audit('roster-keypad');await click('[data-act=kpclose]');
    if(await click('[data-act=sheet][data-v=staff]')){await audit('staff');await close()}
    await click('.nav [data-v=info]');await audit('info');if(await click('[data-act=sheet][data-v=points]')){await audit('points');await close()}
    if(!SCHOOL){await click('.nav [data-v=refs]');await audit('refs')}
    await click('.nav [data-v=toss]');await audit('toss');await click('.side.t1');await audit('toss-picked');
    if(await click('[data-act=sheet][data-v=pf]')){await audit('pf');await close()}
    await click('.nav [data-v=lineup]');await audit('lineup');
    for(const n of [1,3,5,7,9,11])await click(`[data-act=fill][data-no="${n}"]`,{ms:60});await audit('lineup-full');
    await click('[data-act=lu-lock]');for(const n of [2,4,6,8,10,14])await click(`[data-act=fill][data-no="${n}"]`,{ms:60});await click('[data-act=lu-lock]');
    await click('[data-act=start]');await audit('start-sheet');await click('[data-act=cs-yes]',{ms:400});
    await audit('play');
    if(await p.locator('[data-act=serve]').count()){await click('[data-act=serve]',{ms:450});await audit('play-live');await click('[data-act=point][data-team=t1]',{ms:600})}else await point('t1');
    await point('t2');await point('t2');
    await click('[data-act=timeout][data-team=t1]');await audit('timeout-ask');await click('[data-act=toyes]');await audit('timer');await click('[data-act=tmend]');
    await click('[data-act=subopen][data-team=t2]');await audit('sub-panel');
    await p.locator('.pcourt .pc.t2').nth(3).click().catch(()=>{});await w(200);await p.locator('.kp [data-act=subin],.kp [data-act=subbench]').first().click().catch(()=>{});await w(250);await audit('sub-pair');
    await click('.kp .go',{ms:900});await audit('play-after-sub');
    await p.locator('.pcourt .pc.t1').nth(1).click().catch(()=>{});await w(250);await audit('player-menu');await close();
    await click('[data-act=sheet][data-v=more]');await audit('more');
    await click('.sheet [data-act=mteam][data-v=exc]');await audit('more-team');await close();
    await click('[data-act=penopen]');await audit('pen');await click('[data-act=penteam][data-team=t2]');await audit('pen-team');
    await click('[data-act=penkind][data-v=W]');await click('[data-act=penwho]');await audit('pen-confirm');await click('[data-act=penno]');await click('.sheet [data-act=penclose]');await close();
    await point('t2');await point('t1');await w(400);
    await click('[data-act=sheet][data-v=more]');await click('.sheet [data-act=mteam][data-v=rot]');await click('.sheet [data-act=rotopen][data-team=t2]');await audit('rot');
    if(await p.locator('#rot-to').count()){await p.fill('#rot-to','1');await click('.sheet [data-act=rotgo]');await audit('rot-confirm')}
    await close();await click('.sheet [data-act=rotback]');await close();
    // 記錄表
    await click('[data-act=sheetopen]',{ms:400});
    const tabs=await p.locator('.sheettabs [data-act=rtab]').evaluateAll(x=>x.map(e=>e.getAttribute('data-v')));
    for(const t of tabs){await click(`.sheettabs [data-act=rtab][data-v=${t}]`,{ms:350});await audit('sheet-'+t)}
    if(await click('[data-act=insopen]',{ms:300})){await audit('insert');await close()}
    if(await click('.fixrow')){await audit('fix-row');await close()}
    if(!SCHOOL){await click('.sheettabs [data-act=rtab]',{ms:300});const hot=p.locator('.ctv.hot rect.hot');if(await hot.count()){await hot.first().click({force:true});await w(300);await audit('cellfix');await close()}}
    for(const a of ['[data-act=sheet][data-v=export]','[data-act=whole]']){if(await click(a,{ms:400})){await audit(a.replace(/\W+/g,''));await click('.sheet [data-act=close],[data-act=wholeclose]')}}
    await click('[data-act=sheetclose]',{ms:300});
    // 局結束
    await inject(1,'t1',22);await point('t1');await w(300);await audit('setend');
    await click('.sheet.setend [data-act=endok]',{ms:1200});await audit('end-view');
    if(!SCHOOL){const bx=p.locator('.ctv.hot rect.hot[data-v*=":B:"]');if(await bx.count()){await bx.first().click({force:true});await w(300);await audit('box');await click('.sheet [data-act=bxgo]');await audit('box-next');await close()}}
    await click('.pendrow [data-act=endset]',{ms:500});await audit('lineup-set2');
    await lockBoth(true);await click('[data-act=start]',{ms:400});await click('[data-act=cs-yes]',{ms:300});await audit('play-set2');
    await inject(2,'t2',24);await point('t2');await w(300);await click('.sheet.setend [data-act=endok]',{ms:1200});await click('.pendrow [data-act=endset]',{ms:500});
    await audit('toss-set3');await click('.side',{ms:200});await click('.nav [data-v=lineup]');await lockBoth(true);await click('[data-act=start]',{ms:400});await click('[data-act=cs-yes]',{ms:300});
    await inject(3,'t1',7);await point('t1');await w(800);await audit('swap');await click('[data-act=swap8]',{ms:400});
    await inject(3,'t1',6);await point('t1');await w(300);await click('.sheet.setend [data-act=endok]',{ms:1200});await audit('final-view');
    await click('.pendrow [data-act=endset]',{ms:600});await audit('match-over');
    if(await click('[data-act=sheet][data-v=export]',{ms:400})){await audit('export');await close()}
    if(!SCHOOL&&S.touch&&S.w>S.h){/* 橫放手機：比賽中轉橫 */}
    await click('.bar [data-act=home]',{ms:400});await audit('home-after');
    await click('.herobtns [data-act=history]',{ms:400});await audit('history');
    if(await click('.shead [data-act=bksel]')){await audit('history-select');await click('[data-act=bkcancel]')}
    if(await click('[data-act=cupcreate]')){await audit('cup-new');await close()}
  }catch(e){report[S.tag+' 流程中斷']={issues:[['流程中斷',e.message.split('\n')[0].slice(0,160)]]};await p.screenshot({path:O+S.tag+'-ERR.png'}).catch(()=>{})}
  if(errs.length)report[S.tag+' 頁面錯誤']={issues:errs.map(x=>['頁面錯誤',x.slice(0,160)])};
  await ctx.close();console.log(S.tag,'done');
}
if(TMPF)fs.unlinkSync(TMPF);
const f=O+'report-'+SIZES.map(s=>s.tag).join('_')+(INSET?'-inset':'')+'.json';fs.writeFileSync(f,JSON.stringify(report,null,1));console.log('寫好',f,Object.keys(report).length,'個畫面有問題');
await b.close()})().catch(x=>{console.log('ERR',x.message);process.exit(1)});

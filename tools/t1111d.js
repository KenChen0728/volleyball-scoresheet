// 11/11 舉球員標示：設定、取消、一隊最多兩位、自由球員不能設、跟著背號輪轉、換下不轉給別人、不佔用復原、不寫進記錄表
// node tools/t1111d.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h)=>{const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
 await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);return p};
const cell=(p,k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})}); // 學校版標籤裡有「綁定 5 號」，用格子裡的號碼找
const badge=async(p,k,no)=>{const c=cell(p,k,no);return (await c.count())?await c.locator('.stmk').count():-1};
const menu=async(p,k,no)=>{await cell(p,k,no).click();await W(120)};
const score=p=>p.evaluate(()=>[...document.querySelectorAll('.wscore,.sc b,.score b')].map(e=>e.textContent.trim()).join(':'));
const point=async(p,t)=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}await p.click(`[data-act=point][data-team=${t}]`);await W(700)};
const evs=p=>p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));return d.matches.filter(m=>m.id===d.currentId)[0].events},KEY);
let p=await open(1180,820);await flow.start(p,{serve:'t1'});await W(200);
await point(p,'t1');const sc1=await score(p);
// 設定
await menu(p,'t1',5);ok('menu has setter button',(await p.locator('.sheet [data-act=pmsetter]').innerText()).includes('設為舉球員'));
await p.click('.sheet [data-act=pmsetter]');await W(150);
ok('menu closed',await p.locator('.sheet').count()===0);ok('badge shown',await badge(p,'t1',5)===1);
ok('toast',(await p.locator('.lockline').innerText()).includes('5 號舉球員'),await p.locator('.lockline').innerText());
ok('event',(await evs(p)).some(e=>e.type==='SETTER_SET'&&e.data.team==='t1'&&e.data.no===5&&e.data.on===true));
// 復原不會退掉舉球員，退的是上一分
await p.click('header.bar [data-act=undo]');await W(300);
ok('undo undid the point',(await score(p))!==sc1,[sc1,await score(p)]);ok('badge kept after undo',await badge(p,'t1',5)===1);
await point(p,'t1'); // 復原後球還在進行中（完整版），先打完這一球才能點球員
// 第二位、第三位
await menu(p,'t1',9);await p.click('.sheet [data-act=pmsetter]');await W(150);ok('second setter',await badge(p,'t1',9)===1);
await menu(p,'t1',3);const b3=p.locator('.sheet [data-act=pmsetter]');ok('third disabled',await b3.isDisabled());
ok('third note',(await p.locator('.sheet').innerText()).includes('已經有兩位舉球員（5、9 號）'));
await p.click('.sheet [data-act=close]');await W(100);
// 另一隊不受影響
await menu(p,'t2',8);ok('other team free',!(await p.locator('.sheet [data-act=pmsetter]').isDisabled()));await p.click('.sheet [data-act=pmsetter]');await W(150);ok('t2 setter',await badge(p,'t2',8)===1);
// 取消
await menu(p,'t1',9);ok('cancel label',(await p.locator('.sheet [data-act=pmsetter]').innerText()).includes('取消舉球員'));await p.click('.sheet [data-act=pmsetter]');await W(150);ok('badge removed',await badge(p,'t1',9)===0);
// 跟著背號輪轉
const pos0=await cell(p,'t1',5).getAttribute('data-pos');await point(p,'t2');await point(p,'t1');await W(200);
const pos1=await cell(p,'t1',5).getAttribute('data-pos');ok('rotated',pos0!==pos1,[pos0,pos1]);ok('badge follows',await badge(p,'t1',5)===1);
// 自由球員：選單沒有這顆（學校版這時候不能換自由就跳過，完整版已經測）
const libIn=async()=>{if(await p.locator('.pcourt .pc.t1.isl').count())return true;const back=p.locator('.pcourt .pc.t1[data-pos="5"]');await back.click();await W(120);
 const ln=p.locator('.sheet [data-act=pmlin]:not([disabled])');if(await ln.count()){await ln.first().click();await W(200);return true}
 const st=p.locator('.sheet [data-act=pmstep][data-v=lib]:not([disabled])');if(await st.count()){await st.click();await W(80);await p.locator('.sheet [data-act=pmlin]').first().click();await W(200);return true}
 await p.click('.sheet [data-act=close]');await W(100);return false};
if(await libIn()){await p.locator('.pcourt .pc.t1.isl').click();await W(120);ok('libero no setter button',await p.locator('.sheet [data-act=pmsetter]').count()===0);await p.click('.sheet [data-act=close]');await W(100)}
else if(!SCHOOL)ok('libero on court',false);
// 換下：換上來的人沒有標示，舉球員名單不變
await menu(p,'t1',5);await p.click('.sheet [data-act=pmstep][data-v=sub]');await W(100);const inNo=Number(await p.locator('.sheet [data-act=pmsubin]').first().getAttribute('data-no'));await p.locator('.sheet [data-act=pmsubin]').first().click();await W(250);
const go=p.locator('.kp.bench [data-act=subdone],.kp.bench .go');if(await go.count()){await go.first().click();await W(250)}
ok('subbed in',await cell(p,'t1',inNo).count()===1,inNo);ok('sub has no badge',await badge(p,'t1',inNo)===0);ok('setter off court',await cell(p,'t1',5).count()===0);
ok('setter list kept',!(await evs(p)).some(e=>e.type==='SETTER_SET'&&e.data.no===5&&e.data.on===false));
// 重新整理還在
await p.reload();await W(300);const nav=p.locator('.nav [data-v=play]');if(await nav.count()&&await nav.isVisible()){await nav.click();await W(200)}
ok('t2 badge after reload',await badge(p,'t2',8)===1);
// 記錄表上沒有「舉」
await p.click('[data-act=sheetopen]');await W(200);
const sheetTxt=await p.evaluate(()=>[...document.querySelectorAll('.sheetwrap svg text,.ctv svg text,.ppr')].map(e=>e.textContent).join(''));
ok('not on sheet',sheetTxt.length>0&&!sheetTxt.includes('舉'),sheetTxt.length);
await p.context().close();
// 手機：「舉」不壓到號碼
p=await open(390,844);await flow.start(p,{serve:'t1'});await W(200);await menu(p,'t1',5);await p.click('.sheet [data-act=pmsetter]');await W(150);
const rr=await p.evaluate(()=>{const c=[...document.querySelectorAll('.pcourt .pc.t1')].find(e=>e.querySelector('.stmk'));const a=c.querySelector('.stmk').getBoundingClientRect(),n=c.querySelector('b').getBoundingClientRect(),r=c.getBoundingClientRect();return {ov:!(a.right<=n.left||a.left>=n.right||a.bottom<=n.top||a.top>=n.bottom),inside:a.right<=r.right+1&&a.top>=r.top-1,bg:getComputedStyle(c.querySelector('.stmk')).backgroundColor}});
ok('phone badge no overlap',!rr.ov,rr);ok('phone badge inside',rr.inside,rr);ok('white badge',rr.bg==='rgb(255, 255, 255)',rr.bg);
await p.context().close();
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'full ')+'pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

// 11/11 判罰職員（執行教練 C、教練 AC、領隊 T、管理 M）、上方列每頁一樣、寬畫面字級
// node tools/t1111c.js [網址] [資料 key]（先跑 build.py；學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
 await p.goto(URL);await p.evaluate(k=>{localStorage.clear()},KEY);await p.reload();await W(150);return p};
const sanc=async(p,team,kind,who)=>{await p.click('[data-act=penopen]');await W(80);await p.click(`.sheet [data-act=penteam][data-team=${team}]`);await W(60);
 await p.click(`.sheet [data-act=penkind][data-v=${kind}]`);await W(60);await p.click(`.sheet [data-act=penwho][data-v="${who}"]`);await W(60)};
const dbGet=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const cur=d=>d.matches.filter(m=>m.id===d.currentId)[0];
const last=async p=>{const m=cur(await dbGet(p));const e=m.events.filter(x=>x.type==='SANCTION').pop();return e&&e.data};
const sanOf=async p=>cur(await dbGet(p)).events.filter(x=>x.type==='SANCTION'||x.type==='AMEND');
// 直接加事件（模擬 11/11 以前存的舊資料），再重新載入
const addEv=(p,list)=>p.evaluate(([k,list])=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0];let q=Math.max(...m.events.map(e=>e.seq));
 list.forEach((x,i)=>m.events.push({id:'mtest'+q+'x'+i,matchId:m.id,seq:++q,at:new Date().toISOString(),device:'scorer-table',type:x[0],data:x[1]}));localStorage.setItem(k,JSON.stringify(d))},[KEY,list]);
const rect=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width}},s);
// ---------- 判罰職員（iPad 橫的） ----------
let p=await open(1180,820);await flow.start(p,{serve:'t1'});await W(200);
await p.click('[data-act=penopen]');await W(80);await p.click('.sheet [data-act=penteam][data-team=t1]');await W(60);await p.click('.sheet [data-act=penkind][data-v=W]');await W(60);
const st=(await p.locator('.sheet .stf button').allInnerTexts()).map(x=>x.replace(/\s+/g,' ').trim());
ok('staff buttons',st.join('|')==='執行教練 C|教練 AC|領隊 T|管理 M',st);
await p.click('.sheet [data-act=penwho][data-v="領隊"]');await W(60);
ok('confirm title',(await p.locator('.sheet h2').innerText()).includes('領隊 T 黃牌警告'),await p.locator('.sheet h2').innerText());
await p.click('[data-act=penyes]');await W(120);
ok('toast',(await p.locator('.lockline').innerText()).includes('領隊 T 黃牌警告'),await p.locator('.lockline').innerText());
ok('stored as 領隊',(await last(p)).who==='領隊',await last(p));
await sanc(p,'t1','D','管理');await p.click('[data-act=penyes]');await W(120);
ok('stored as 管理',(await last(p)).who==='管理');
await sanc(p,'t2','W','C');await p.click('[data-act=penyes]');await W(120);
ok('C kept',(await last(p)).who==='C');
// 已出場的職員不能再點
await p.click('[data-act=penopen]');await W(80);await p.click('.sheet [data-act=penteam][data-team=t1]');await W(60);
ok('one W per team',await p.locator('.sheet [data-act=penkind][data-v=W]').isDisabled());await p.click('.sheet [data-act=penkind][data-v=P]');await W(60);
const mg=p.locator('.sheet [data-act=penwho][data-v="管理"]');
ok('manager disabled',await mg.isDisabled());ok('manager gone text',(await mg.innerText()).replace(/\s+/g,' ').includes('管理 M 已出場'),await mg.innerText());
await p.click('.sheet [data-act=penback]').catch(()=>{});await W(60);
// 判罰紀錄：只寫英文代號
await p.click('.sheet [data-act=penkind][data-v=LOG]');await W(80);
const log=await p.locator('.sheet .logbox table').innerText();
ok('log codes',/\bT\b/.test(log)&&/\bM\b/.test(log)&&/\bC\b/.test(log)&&!/領隊|管理/.test(log),log);
await p.keyboard.press('Escape');await W(80);await p.keyboard.press('Escape');await W(80);
// 以前判給防護員、隊醫的（舊的代號 T、M）照當時的名稱
await addEv(p,[['SANCTION',{set:1,team:'t2',kind:'E',who:'T'}],['SANCTION',{set:1,team:'t2',kind:'D',who:'M'}]]);await p.reload();await W(300);
const nav=p.locator('.nav [data-v=play]');if(await nav.count()&&await nav.isVisible()){await nav.click();await W(200)}
ok('resumed in play',await p.locator('.wplay').count()===1);
await p.click('[data-act=penopen]');await W(80);await p.click('.sheet [data-act=penteam][data-team=t2]');await W(60);await p.click('.sheet [data-act=penkind][data-v=LOG]');await W(80);
const log2=await p.locator('.sheet .logbox table').innerText();ok('old in log as codes',(log2.match(/\bT\b/g)||[]).length>=2&&(log2.match(/\bM\b/g)||[]).length>=2&&!/防護員|隊醫/.test(log2),log2);
await p.click('.sheet [data-act=penback]').catch(()=>{});await W(60);await p.click('.sheet [data-act=penkind][data-v=P]');await W(60);
ok('old staff not disabled',!(await p.locator('.sheet [data-act=penwho][data-v="領隊"]').isDisabled())&&!(await p.locator('.sheet [data-act=penwho][data-v="管理"]').isDisabled()));
await p.keyboard.press('Escape');await W(80);await p.keyboard.press('Escape');await W(80);
// 上方列：比賽頁
ok('play barmid',await p.locator('header.bar>.barmid').count()===1);ok('play undo',await p.locator('header.bar [data-act=undo]').count()===1);
ok('end hidden in set',await p.evaluate(()=>{const e=document.querySelector('.bar .bartime .pend');return !!e&&getComputedStyle(e).display==='none'}));
const tb=await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.bar .bartime b')).fontSize));
// 記錄表頁：同一條，左邊「‹ 比賽」，沒有復原，時間靠右貼著問號
await p.click('[data-act=sheetopen]');await W(200);
ok('sheet barmid',await p.locator('header.bar>.barmid').count()===1);ok('sheet no undo',await p.locator('header.bar [data-act=undo]').count()===0);
const bk=await rect(p,'header.bar .barback'),mid=await rect(p,'header.bar>.barmid'),tm=await rect(p,'header.bar .bartime'),hp=await rect(p,'header.bar .helpbtn');
ok('back at left',bk&&bk.l<20&&bk.r<mid.l,[bk,mid]);ok('time next to ?',hp.l-tm.r<=9&&hp.l-tm.r>=0,hp.l-tm.r);
ok('same time size',await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.bar .bartime b')).fontSize))===tb,tb);
ok('tabs bigger',await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.sheettabs button')).fontSize))>=17);
// 記錄表（協會記錄表或判罰表）上的判罰欄只寫英文代號
await p.click('[data-act=rtab][data-v=pen]');await W(150);
if(await p.locator('.ctv-pen').count()){
 const tx=await p.evaluate(()=>[...document.querySelectorAll('.ctv-pen svg text')].map(t=>t.textContent).join(' '));
 ok('sheet pen codes',/(^| )T( |$)/.test(tx)&&/(^| )M( |$)/.test(tx)&&/(^| )C( |$)/.test(tx)&&!/領隊|管理|防護員|隊醫/.test(tx),tx);
 ok('sheet note',(await p.locator('.ctnote').innerText()).includes('C 執行教練、AC 教練、T 領隊、M 管理'))}
else if(await p.locator('.psan').count()){const cells=await p.locator('.psan table td').allInnerTexts();
 ok('result codes',cells.includes('T')&&cells.includes('M')&&cells.includes('C')&&!cells.some(x=>/領隊|管理|防護員|隊醫/.test(x)),cells.filter(x=>x.trim()));
 ok('result note',(await p.locator('.psan p').innerText()).includes('C 執行教練、AC 教練、T 領隊、M 管理'))}
else ok('pen tab shown',false);
// 更正：改對象的按鈕也是中文加英文，不列現在的對象
await p.click('[data-act=rtab][data-v=fix]');await W(120);
const rows=await p.locator('.fixrow').allInnerTexts();ok('fix rows',rows.some(x=>x.includes('領隊 T'))&&rows.some(x=>x.includes('防護員 T'))&&rows.some(x=>x.includes('隊醫 M')),rows);
await p.locator('.fixrow',{hasText:'領隊 T'}).first().click();await W(120);
const am=(await p.locator('.sheet .stf button').allInnerTexts()).map(x=>x.replace(/\s+/g,' ').trim());
ok('amend staff',am.join('|')==='執行教練 C|教練 AC|管理 M',am);
await p.click('.sheet [data-act=amendwho][data-v="管理"]');await W(150);
const amd=(await sanOf(p)).filter(e=>e.type==='AMEND').pop();ok('amended',amd&&amd.data.patch&&amd.data.patch.who==='管理',amd&&amd.data);
const rows2=await p.locator('.fixrow').allInnerTexts();ok('fix rows after amend',rows2.filter(x=>x.includes('管理 M')).length>=2&&!rows2.some(x=>x.includes('領隊 T')),rows2);
await p.context().close();
// ---------- 上方列：寬度 920 不重疊、手機記錄表頁也有「25 分」 ----------
p=await open(920,700);await flow.start(p,{serve:'t1'});await W(200);
const m2=await rect(p,'header.bar>.barmid'),t2=await rect(p,'header.bar .bartime');ok('920 no overlap',m2&&t2&&t2.l-m2.r>=4,[m2,t2]);
await p.click('[data-act=sheetopen]');await W(200);const m3=await rect(p,'header.bar>.barmid'),t3=await rect(p,'header.bar .bartime');ok('920 sheet no overlap',m3&&t3&&t3.l-m3.r>=4,[m3,t3]);
await p.context().close();
p=await open(390,844);await flow.start(p,{serve:'t1'});await W(200);
if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await W(700)}await p.click('[data-act=point][data-team=t1]');await W(700);
await p.click('[data-act=sheetopen]');await W(200);
ok('phone sheet title',(await p.locator('header.bar h1').innerText()).includes('25 分'),await p.locator('header.bar h1').innerText());
ok('phone sheet back',await p.locator('header.bar .barback').count()===1);ok('phone sheet no undo',await p.locator('header.bar [data-act=undo]').count()===0);
await p.context().close();
// ---------- CSV：打完的比賽存成試算表，職員只寫英文代號 ----------
{const fs=require('fs');const d=JSON.parse(fs.readFileSync('/tmp/fix1111.json','utf8'));const m=d.matches.filter(x=>x.id==='mdone1')[0];
 const i=m.events.findIndex(e=>e.type==='POINT');
 const add=[['W','領隊'],['W','T'],['D','管理'],['W','AC']].map((x,j)=>({id:'mcsv'+j,matchId:'mdone1',seq:0,at:m.events[i].at,device:'scorer-table',type:'SANCTION',data:{set:1,team:'t1',kind:x[0],who:x[1]}}));
 m.events.splice(i+1,0,...add);
 const ctx=await b.newContext({viewport:{width:1180,height:820},acceptDownloads:true});const q=await ctx.newPage();q.on('pageerror',x=>errs.push(x.message));
 await q.goto(URL);await q.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(d)]);await q.reload();await W(200);
 await q.click('.herobtns [data-act=history]');await W(120);await q.click('.hrow[data-id=mdone1]');await W(250);
 if(!(await q.locator('.page [data-act=rpcsv]').count())){await q.click('.page [data-act=sheet][data-v=export]');await new Promise(r=>setTimeout(r,250))} // 11/12 完整版的試算表在「存檔／分享」裡
 const [dl]=await Promise.all([q.waitForEvent('download',{timeout:8000}),q.click('[data-act=rpcsv]')]);
 const csv=fs.readFileSync(await dl.path(),'utf8');const sl=csv.split('\n').filter(x=>/警告|出場/.test(x));
 ok('csv codes',sl.some(x=>x.includes('黃牌警告 T'))&&sl.filter(x=>x.includes('黃牌警告 T')).length===2&&sl.some(x=>x.includes('出場 M'))&&sl.some(x=>x.includes('黃牌警告 AC'))&&!/領隊|管理|防護員|隊醫/.test(csv),sl);
 await ctx.close()}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'full ')+'pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

// 用真實畫面產生使用教學的截圖：node tools/school/help-shots.js，再跑 python3 tools/school/help-img.py
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const R=path.resolve(__dirname,'../..'),URL_='file://'+R+'/school/index.html',O=(process.argv[2]||'/tmp/school-help')+'/';
fs.mkdirSync(O,{recursive:true});
(async()=>{const b=await chromium.launch();
const W=400,H=760,SHEET=false; // SHEET 和 derive.py 一致
const ctx=await b.newContext({viewport:{width:W,height:H},colorScheme:'dark',deviceScaleFactor:2});const p=await ctx.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
// 安裝示意圖
const q=await (await b.newContext({viewport:{width:640,height:520},deviceScaleFactor:1})).newPage();await q.goto('file://'+__dirname+'/ins.html');
for(const id of ['ins_ios1','ins_ios2','ins_ios3','ins_android','ins_pc','ins_mac','ins_line','ins_bk']){await q.evaluate(i=>{document.querySelectorAll('.s').forEach(x=>x.style.display=x.id===i?'block':'none')},id);await q.waitForTimeout(40);await q.screenshot({path:O+id+'.png'})}
const w=(ms=60)=>p.waitForTimeout(ms);
const mark=async(sels)=>{await p.evaluate(s=>{document.querySelectorAll('[data-mk]').forEach(x=>{x.style.outline='';x.removeAttribute('data-mk')});s.forEach(q=>document.querySelectorAll(q).forEach(el=>{el.setAttribute('data-mk',1);el.style.outline='4px solid #FF3B30';el.style.outlineOffset='2px';el.style.zIndex=5}))},sels)};
const cap=async(name,sel,marks=[],pad=8)=>{await w(80);await mark(marks);await w(40);
 const r=await p.evaluate(s=>{const R=s.map(q=>[...document.querySelectorAll(q)]).flat().map(x=>x.getBoundingClientRect()).filter(x=>x.width);return [Math.min(...R.map(x=>x.left)),Math.min(...R.map(x=>x.top)),Math.max(...R.map(x=>x.right)),Math.max(...R.map(x=>x.bottom))]},Array.isArray(sel)?sel:[sel]);
 const vw=p.viewportSize(),x=Math.max(0,r[0]-pad),y=Math.max(0,r[1]-pad);await p.screenshot({path:O+name+'.png',clip:{x,y,width:Math.min(vw.width,r[2]+pad)-x,height:Math.min(vw.height,r[3]+pad)-y}});await mark([])};
const point=async k=>{await p.click(`[data-act=point][data-team=${k}]`);await w(520)};
const close=async()=>{await p.locator('.sheet [data-act=close]').last().click();await w(50)};
await p.goto(URL_);await w(120);
await cap('home','.hero',['.herocta'],0);
await cap('sample','.herolinks',['[data-act=sample]'],10);
await p.click('[data-act=sample]');await p.reload();await w(120);
await cap('resume','.rlist',['.rmain em'],6);await p.click('[data-act=open]');await w(100);
await cap('steps','.nav',['.nav'],6);
await p.locator('.nav [data-v=info]').click();await w(80);
await cap('info','.fields');
await cap('fmt',['[data-act=fmt]','.ptbtn'],['[data-act=fmt]'],6);
if(SHEET)await cap('crew','.crewrow',['.crewrow input'],6);
await p.click('[data-act=sheet][data-v=points]');await cap('points','.sheet');await close();
await p.locator('.nav [data-v=roster]').click();await w(100);
await cap('roster1',['.rh.t1','.rh.t2'],['#n-t1','#n-t2'],6);
await p.locator('[data-act=slot]:not(.fill)').first().click();await w(80);await cap('roster2','.kp',['.pad']);await p.click('[data-act=kpclose]');await w(50);
await p.locator('[data-act=slot][data-team=t1].fill').first().click();await w(80);await cap('roster3','.kp',['.acts']);await p.click('[data-act=kpclose]');await w(50);
await p.locator('[data-act=slot][data-team=t1][data-no="12"]').click();await w(60);await p.click('.kp [data-act=lib]');await w(60);
await p.locator('.nav [data-v=toss]').click();await p.click('.side.t2');await w(60);await cap('toss1','.toss',['.side.t2','.swap']);await cap('toss2','.foot',['.pfbtn'],10);
await p.click('[data-act=sheet][data-v=pf]');await p.click('[data-act=pfreason][data-v=逾時未出賽]');await p.click('[data-act=pfwin][data-team=t2]');await cap('pf','.sheet');await close();
await p.locator('.nav [data-v=lineup]').click();await w(100);
const first=await p.evaluate(()=>document.querySelector('.lutabs button[aria-pressed=true]').className.includes('t1')?'t1':'t2');
const L1=first==='t1'?[1,3,5,7,9,11]:[2,4,6,8,10,14],L2=first==='t1'?[2,4,6,8,10,14]:[1,3,5,7,9,11];
for(const n of L1.slice(0,2))await p.click(`[data-act=fill][data-no="${n}"]`);await cap('lu1',['.lusheet','.bench'],['.cell.sel','.bench .chip'],8);
for(const n of L1.slice(2))await p.click(`[data-act=fill][data-no="${n}"]`);await cap('lu2',['.lutabs','.lusheet'],['.lutabs'],6);await cap('lu3','.foot',['.foot button'],6);
await p.click('[data-act=lu-lock]');await w(60);
for(const n of L2)await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');await w(60);
await p.click('[data-act=start]');await p.fill('#cs-time','16:05');await cap('start','.sheet',['#cs-time','[data-act=cs-yes]']);{const d=new Date(Date.now()-1200000);await p.fill('#cs-time',('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2))}await p.click('[data-act=cs-yes]');await w(120);
await cap('serve',['.board','.pcourt'],['.srvmark'],6);await cap('point','.foot',['.sbs'],6);
for(const t of ['t2','t1','t2','t2','t1'])await point(t);
await point('t1');await p.click('.bar [data-act=undo]');await w(120);await cap('undo',['.bar','.lockline'],['.bar [data-act=undo]','.lockline'],4);
await p.click('[data-act=timeout][data-team=t1]');await cap('to','.sheet');await p.click('[data-act=toyes]');await w(60);await p.click('[data-act=tmend]');await w(60);
// 替補和綁定
await p.locator('.pc.t2').nth(3).click();await w(80);await cap('sub','.sheet',['.pmb:nth-child(2)']);await p.locator('.sheet .pmb',{hasText:'替補'}).click();await w(60);await p.locator('.sheet [data-act=pmsubin]').first().click();await w(80);
await cap('bind','.pcourt',['.bindm']);
await p.locator('.pc.t2',{has:p.locator('.bindm')}).click();await w(80);await cap('swapback','.sheet',['.pmb[data-act=pmsubin]']);await close();
// 自由球員
await p.locator('.lc.t1').first().click();await w(80);await cap('lib',['.pcourt','.strips'],['.lc.sel']);
await p.locator('.pc.t1.pk').last().click();await w(100);
for(let i=0;i<10&&!(await p.locator('.pc.bad').count());i++)await point(i%2?'t2':'t1');
await cap('libf',['.pcourt','.lockline'],['.pc.bad'],6);await p.locator('.pc.bad').click();await w(80);
await p.click('.pbtns [data-v=more]');await w(80);await cap('more','.sheet');
await p.locator('.sheet [data-act=redopen]').first().click();await w(80);await cap('redes','.sheet');await close();
// 判罰
await p.click('[data-act=penopen]');await w(50);await p.click('[data-act=penteam][data-team=t2]');await w(60);await cap('pen','.sheet');await cap('pt','.sheet .pk3:not(.four)',['.sheet .pk3:not(.four)']);await cap('pp','.sheet .pk3.four',['.sheet .pk3.four']);
await p.click('[data-act=penkind][data-v=W]');await w(50);await p.click('[data-act=penwho][data-no="6"]');await w(60);await cap('pen2','.sheet',['[data-act=penyes]']);await p.click('[data-act=penyes]');await w(100);
await cap('pencard','.pcourt',['.cdm'],6);
// 記錄表
await p.click('[data-act=sheetopen]');await w(120);if(SHEET){await cap('sheet1',['.sheettabs','.ussheet'],['.sheettabs'],6);await cap('sheet2',['.ussheet','.sheetbtns'],['.fsbtn[data-act=fsopen]'],6)}else await cap('rec',['.sheettabs','.pres'],['.sheettabs'],6);
await p.click('[data-act=rtab][data-v=fix]');await w(100);await cap('fix1',['.narrow .seg','.fixrow'],['.fixrow'],6);await p.locator('.fixrow').last().click();await w(100);await cap('fix2','.sheet');await close();
await p.click('[data-act=sheetclose]');await w(100);
await p.click('.pbtns [data-v=more]');await w(60);await p.locator('.sheet [data-act=fixopen]').first().click();await w(100);await cap('fixlu','.sheet',['.fixpos']);await close();
await p.click('.pbtns [data-v=more]');await w(60);await p.click('.sheet [data-act=tossfix]');await w(100);await cap('tossfix','.sheet');await p.locator('.sheet .ghost[data-act=close]').click();await w(60);
const rally=async t=>{if(await p.locator('.pc.bad').count()){await p.locator('.pc.bad').click();await w(50)}await point(t)};
for(let i=0;i<50;i++){if(await p.locator('[data-act=endset]').count())break;await rally('t1')}
await w(1100);await cap('end',['.good','.pendfoot','.sheettabs','.pres'],['[data-act=endset]'],6);await cap('endback','.pendfoot',['.pendrow [data-act=undo]'],6);
await p.click('[data-act=endset]');await w(120);await cap('copy',['.lusheet','.lucopy'],['.lucopy'],6);
await p.click('[data-act=copy]');await w(30);await p.click('[data-act=lu-lock]');await w(30);await p.click('[data-act=copy]');await w(30);await p.click('[data-act=lu-lock]');await w(30);await p.click('[data-act=start]');await w(100);
for(let i=0;i<50;i++){if(await p.locator('[data-act=endset]').count())break;await rally('t2')}
await w(1100);await p.click('[data-act=endset]');await w(150);
await p.locator('.side').first().click();await w(80);await cap('toss3',['.stephint','.toss'],['.side.on','.swap'],6);
await p.click('.page [data-act=page][data-v=lineup]');await w(80);await p.click('[data-act=copy]');await w(30);await p.click('[data-act=lu-lock]');await w(30);await p.click('[data-act=copy]');await w(30);await p.click('[data-act=lu-lock]');await w(30);await p.click('[data-act=start]');await w(60);await p.click('[data-act=cs-yes]');await w(100);
for(let i=0;i<9;i++){if(await p.locator('[data-act=swap8]').count())break;await rally('t1')}
await w(760);await cap('swap','.sheet',['[data-act=swap8]']);await p.click('[data-act=swap8]');await w(80);
for(let i=0;i<9;i++){if(await p.locator('[data-act=endset]').count())break;await rally('t1')}
await w(1100);await cap('final',['.good','.pendfoot'],['[data-act=endset]'],6);await p.click('[data-act=endset]');await w(150);
await cap('bk',['#bkwarn','.savebtns'],['[data-act=rpjson]'],6);if(SHEET)await cap('output',['[data-act=rppdf]','.savebtns'],['[data-act=rppdf]'],6);
// 記錄表局部放大，說明怎麼看
if(SHEET){await p.click('[data-act=rtab][data-v=s1]');await w(100);await p.setViewportSize({width:1000,height:760});await w(150);
const r=await p.$eval('.ussheet',x=>{const b=x.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}});await p.screenshot({path:O+'sheetread.png',clip:{x:r.x,y:r.y+r.h*.095,width:r.w*.56,height:r.h*.44}})
await p.setViewportSize({width:W,height:H});await w(120)}
await p.click('.bar [data-act=home]');await w(150);
await p.evaluate(()=>{const e=document.querySelector('.home');if(e)e.scrollTop=9999});await w(80);await cap('hist1','.homebody section:nth-of-type(2)',['.hrow'],6);
await p.click('.shead [data-act=history]');await w(120);await cap('hist2','.narrow',['.histtools'],6);
await p.click('.bar [data-act=home]');await w(150);await p.click('[data-act=cupcreate]');await p.fill('#cup-name','範例盃');await cap('cup1','.sheet',['#cup-name']);await p.click('[data-act=cupnamesave]');await w(120);
await p.click('[data-act=cupteam]');await p.fill('#ct-name','範例藍隊');await p.fill('#ct-text','1 隊長\n3\n5\n7\n9\n11\n12 L');await cap('cup2','.sheet',['#ct-text']);await p.click('[data-act=cupteamsave]');await w(120);
await p.click('[data-act=cupteam]');await p.fill('#ct-name','範例橘隊');await p.fill('#ct-text','2 隊長\n4\n6\n8\n10\n14');await p.click('[data-act=cupteamsave]');await w(120);
await p.click('[data-act=cupnew]');await p.locator('.sheet [data-act=cuppick]').nth(0).click();await w(60);await p.locator('.sheet [data-act=cuppick]').nth(1).click();await cap('cup3','.sheet',['.sheet [data-act=cuppick]']);await close();
await cap('cup4','.histtools',['[data-act=cupsave]'],6);
console.log(e.length?e:'沒有錯誤');await b.close()})().catch(x=>{console.log('ERR',x.message.slice(0,500));process.exit(1)});

const {chromium}=require('playwright');const O='/home/claude/nanshe/help/raw/';(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2});const p=await ctx.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
// 安裝示意圖
const q=await (await b.newContext({viewport:{width:640,height:520},deviceScaleFactor:1})).newPage();await q.goto('file:///home/claude/nanshe/help/ins.html');
for(const id of ['ins_ios1','ins_ios2','ins_ios3','ins_android','ins_pc','ins_mac','ins_line','ins_bk']){await q.evaluate(i=>{document.querySelectorAll('.s').forEach(x=>x.style.display=x.id===i?'block':'none')},id);await q.waitForTimeout(60);await q.screenshot({path:O+id+'.png'})}
const mark=async(sels)=>{await p.evaluate(s=>{document.querySelectorAll('[data-mk]').forEach(x=>{x.style.outline='';x.removeAttribute('data-mk')});s.forEach(q=>document.querySelectorAll(q).forEach(el=>{el.setAttribute('data-mk',1);el.style.outline='4px solid #FF3B30';el.style.outlineOffset='2px';el.style.zIndex=5}))},sels)};
const cap=async(name,sel,marks=[],pad=8)=>{await p.waitForTimeout(80);await mark(marks);await p.waitForTimeout(40);
 const r=await p.evaluate(s=>{const R=s.map(q=>[...document.querySelectorAll(q)]).flat().map(x=>x.getBoundingClientRect()).filter(x=>x.width);return [Math.min(...R.map(x=>x.left)),Math.min(...R.map(x=>x.top)),Math.max(...R.map(x=>x.right)),Math.max(...R.map(x=>x.bottom))]},Array.isArray(sel)?sel:[sel]);
 const x=Math.max(0,r[0]-pad),y=Math.max(0,r[1]-pad);await p.screenshot({path:O+name+'.png',clip:{x,y,width:Math.min(400,r[2]+pad)-x,height:Math.min(760,r[3]+pad)-y}});await mark([])};
await p.goto('file:///home/claude/nanshe/排球電子記錄表.html');await p.waitForTimeout(100);
await cap('home','.hero',['.herocta'],0);
await cap('sample','.herolinks',['[data-act=sample]'],10);
await p.click('[data-act=sample]');
await p.reload();await p.waitForTimeout(100);await cap('resume','.rlist',['.rmain em'],6);await p.click('[data-act=open]');await p.waitForTimeout(100);
await cap('steps','.nav',['.nav'],6);
await p.locator('.nav [data-v=info]').click();await cap('info','.fields');
await p.click('[data-act=sheet][data-v=points]');await cap('points','.sheet');await p.click('.sheet button[data-act=close]');
await p.locator('.nav [data-v=roster]').click();await p.waitForTimeout(100);
await cap('roster1',['.rh.t1','.rh.t2'],['#n-t1','#n-t2'],6);
await p.locator('[data-act=slot]').nth(14).click();await p.waitForTimeout(80);await cap('roster2','.kp',['.pad']);
if(await p.locator('.kp').count())await p.click('[data-act=kpclose]');
await p.locator('[data-act=slot][data-team=t1]').first().click();await p.waitForTimeout(80);await cap('roster3','.kp',['.acts']);await p.click('[data-act=kpclose]').catch(()=>{});
await p.addStyleTag({content:'.rnext{position:static!important}'});await cap('roster4',['.tool'],['[data-v=staff]'],6);
await p.locator('.nav [data-v=toss]').click();await p.click('.side.t2');await p.waitForTimeout(60);await cap('toss1','.toss',['.side.t2','.swap']);await cap('toss2','.foot',['.pfbtn'],10);
await p.click('[data-act=sheet][data-v=pf]');await p.click('[data-act=pfreason][data-v=逾時未出賽]');await p.click('[data-act=pfwin][data-team=t2]');await cap('pf','.sheet');await p.click('.sheet button[data-act=close]');
await p.locator('.nav [data-v=lineup]').click();await p.waitForTimeout(100);
for(const n of [1,3])await p.click(`[data-act=fill][data-no="${n}"]`);await p.waitForTimeout(60);await cap('lu1',['.lusheet','.bench'],['.cell.sel','.bench .chip'],8);
for(const n of [5,7,9,11])await p.click(`[data-act=fill][data-no="${n}"]`);await p.waitForTimeout(60);await cap('lu2',['.lutabs','.lusheet'],['.lutabs'],6);await cap('lu3','.foot',['.foot button'],6);await p.click('[data-act=lu-lock]');
for(const n of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');await p.waitForTimeout(60);
await p.click('[data-act=start]');await p.fill('#cs-time','19:00');await cap('start','.sheet',['#cs-time','[data-act=cs-yes]']);{const d=new Date(Date.now()-1200000);await p.fill('#cs-time',('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2))}await p.click('[data-act=cs-yes]');await p.waitForTimeout(80);
await cap('serve',['.board','.pcourt'],['.srvmark'],6);await cap('serve2','.foot',['.foot .sv'],6);
await p.click('[data-act=serve]');await p.waitForTimeout(400);await cap('point','.foot',['.sbs'],6);await p.click('[data-act=point][data-team=t2]');await p.waitForTimeout(400);
for(const t of ['t1','t2','t2','t1']){await p.click('[data-act=serve]');await p.waitForTimeout(380);await p.click(`[data-act=point][data-team=${t}]`);await p.waitForTimeout(380)}
await p.click('[data-act=serve]');await p.waitForTimeout(380);await p.click('[data-act=point][data-team=t1]');await p.waitForTimeout(380);await p.click('.bar [data-act=undo]');await p.waitForTimeout(120);await cap('undo',['.bar','.lockline'],['.bar [data-act=undo]','.lockline'],0);await p.click('[data-act=point][data-team=t1]');await p.waitForTimeout(380);
await p.click('[data-act=timeout][data-team=t1]');await p.waitForTimeout(80);await cap('to','.sheet');await p.click('[data-act=toyes]');await p.waitForTimeout(80);await p.click('[data-act=tmend]');
await p.click('[data-act=subopen][data-team=t2]');await p.waitForTimeout(80);await p.locator('.pc.t2').nth(3).click();await p.waitForTimeout(80);await cap('sub',['.pcourt','.kp'],['.kp .subhint','.kp .benchrow']);await p.click('[data-act=subin]');await p.click('[data-act=subclose]');await p.waitForTimeout(800);
await p.locator('.lc.t1').first().click();await p.waitForTimeout(80);await cap('lib',['.pcourt','.strips'],['.lc.sel']);
await p.locator('.lc.t1').first().click();await p.waitForTimeout(80);
await p.click('[data-act=penopen]');await p.click('[data-act=penteam][data-team=t2]');await p.waitForTimeout(60);await cap('pen','.sheet');await cap('pt','.sheet .pk3:not(.four)',['.sheet .pk3:not(.four)'],8);await cap('pp','.sheet .pk3.four',['.sheet .pk3.four'],8);await p.click('[data-act=pendo][data-v=DW]');await p.waitForTimeout(60);await cap('pen2','.sheet');await p.click('[data-act=penno]');await p.click('.sheet [data-act=penclose]');await p.waitForTimeout(60);
await p.click('[data-act=penopen]');await p.click('[data-act=penteam][data-team=t2]');await p.click('[data-act=penkind][data-v=W]');await p.click('[data-act=penwho][data-no="6"]');await p.click('[data-act=penyes]');await p.waitForTimeout(80);await cap('pencard','.pcourt',['.cdm'],6);
// 自由球員到前排
for(let i=0;i<8;i++){await p.click('[data-act=serve]');await p.waitForTimeout(380);await p.click('[data-act=point][data-team=t2]');await p.waitForTimeout(380);const pk=await p.locator('.lc.t1:not([disabled])').count();if(pk)break}
await p.locator('.lc.t1:not([disabled])').first().click();await p.waitForTimeout(80);await p.locator('.pc.t1.pk[data-pos="4"]').click();await p.waitForTimeout(80);await p.click('[data-act=serve]');await p.waitForTimeout(380);await p.click('[data-act=point][data-team=t1]');await p.waitForTimeout(800);await cap('libf',['.pcourt','.sheet'],['.sheet [data-act=libout]'],6);await p.click('.sheet [data-act=libout]');await p.waitForTimeout(80);
await p.click('[data-v=more]');await p.waitForTimeout(100);await cap('more','.sheet');await p.locator('.sheet [data-act=close]').click();
await p.click('[data-act=sheetopen]');await p.waitForTimeout(80);await cap('sheet1',['.sheettabs','.sv-wrap','.fsbtn'],['.sheettabs'],6);await cap('sheet2',['.sv-wrap','.fsbtn'],['.fsbtn'],6);
await p.click('[data-act=rtab][data-v=fix]');await p.waitForTimeout(80);await cap('fix1',['.narrow .seg','.fixrow'],['.fixrow'],6);await p.locator('.fixrow').last().click();await p.waitForTimeout(80);await cap('fix2','.sheet');await p.click('.sheet [data-act=close]');
await p.click('[data-act=sheetclose]');await p.waitForTimeout(80);
await p.click('[data-v=more]');await p.locator('.sheet [data-act=fixopen]').first().click();await p.waitForTimeout(100);await cap('fixlu','.sheet',['.fixpos']);await p.locator('.sheet [data-act=close]').click();await p.waitForTimeout(80);
for(let i=0;i<40;i++){if(await p.locator('[data-act=endset]').count())break;if(await p.locator('.sheet [data-act=libout]').count()){await p.click('.sheet [data-act=libout]');await p.waitForTimeout(40)}await p.click('[data-act=serve]');await p.waitForTimeout(370);await p.click('[data-act=point][data-team=t1]');await p.waitForTimeout(370)}
await p.waitForTimeout(1200);await cap('end',['.good','.pendfoot','.sheettabs','.pres'],['[data-act=endset]'],6);await cap('endback','.pendfoot',['.pendrow [data-act=undo]'],6);
await p.click('[data-act=endset]');await p.waitForTimeout(100);await cap('copy',['.lusheet','.lucopy'],['.lucopy'],6);
await p.click('[data-act=copy]');await p.click('[data-act=lu-lock]');await p.click('[data-act=copy]');await p.click('[data-act=lu-lock]');await p.click('[data-act=start]');await p.waitForTimeout(80);
// 第二局 t2 贏，打到第 3 局
const rally=async t=>{if(await p.locator('.sheet [data-act=libout]').count()){await p.waitForTimeout(760);await p.click('.sheet [data-act=libout]');await p.waitForTimeout(40)}await p.click('[data-act=serve]');await p.waitForTimeout(370);await p.click(`[data-act=point][data-team=${t}]`);await p.waitForTimeout(370)};
for(let i=0;i<40;i++){if(await p.locator('[data-act=endset]').count())break;await rally('t2')}
await p.waitForTimeout(800);await p.click('[data-act=endset]');await p.waitForTimeout(150);
await p.locator('.side').first().click();await p.waitForTimeout(80);await cap('toss3',['.stephint','.toss'],['.side.on','.swap'],6);
await p.click('.page [data-act=page][data-v=lineup]');await p.waitForTimeout(80);await p.click('[data-act=copy]');await p.click('[data-act=lu-lock]');await p.click('[data-act=copy]');await p.click('[data-act=lu-lock]');await p.click('[data-act=start]');await p.waitForTimeout(60);await p.click('[data-act=cs-yes]');await p.waitForTimeout(80);
for(let i=0;i<9;i++){if(await p.locator('[data-act=swap8]').count())break;await rally('t1')}
await p.waitForTimeout(760);await cap('swap','.sheet',['[data-act=swap8]']);await p.click('[data-act=swap8]');await p.waitForTimeout(80);
for(let i=0;i<9;i++){if(await p.locator('[data-act=endset]').count())break;await rally('t1')}
await p.waitForTimeout(1200);await cap('final',['.good','.pendfoot'],['[data-act=endset]'],6);await p.click('[data-act=endset]');await p.waitForTimeout(150);
await cap('bk',['#bkwarn','.savebtns'],['[data-act=rpjson]'],6);
await p.click('.bar [data-act=home]');await p.waitForTimeout(150);await p.locator('.homebody').scrollIntoViewIfNeeded();
await p.evaluate(()=>document.querySelector('.home').scrollTop=9999);await p.waitForTimeout(80);await cap('hist1','.homebody section',['.hrow'],6);
await p.click('.shead [data-act=history]');await p.waitForTimeout(120);await cap('hist2','.narrow',['.histtools'],6);
await p.click('.bar [data-act=home]');await p.waitForTimeout(150);await p.click('[data-act=cupcreate]');await p.fill('#cup-name','範例盃');await cap('cup1','.sheet',['#cup-name']);await p.click('[data-act=cupnamesave]');await p.waitForTimeout(120);
await p.click('[data-act=cupteam]');await p.fill('#ct-name','範例藍隊');await p.fill('#ct-text','教練：王教練\n1 王小明 隊長\n3 陳大文\n5 林小華\n7 張小強\n9 李小志\n11 黃小宇\n12 吳小安 L');await cap('cup2','.sheet',['#ct-text']);await p.click('[data-act=cupteamsave]');await p.waitForTimeout(100);
await p.click('[data-act=cupteam]');await p.fill('#ct-name','範例橘隊');await p.fill('#ct-text','2 趙小傑 隊長\n4 周小文\n6 鄭小偉\n8 謝小祥\n10 許小明\n14 何小光');await p.click('[data-act=cupteamsave]');await p.waitForTimeout(100);
await p.click('[data-act=cupnew]');await p.locator('.sheet [data-act=cuppick]').nth(0).click();await p.waitForTimeout(60);await p.locator('.sheet [data-act=cuppick]').nth(1).click();await cap('cup3','.sheet',['.sheet .imp']);await p.click('.sheet [data-act=close]');await p.waitForTimeout(100);
await cap('cup4','.histtools',['[data-act=cupsave]'],6);
console.log(e);await b.close()})().catch(x=>{console.log('ERR',x.message.slice(0,400));process.exit(1)});

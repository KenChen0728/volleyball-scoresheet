// 11/13 使用說明的截圖（完整版，新風格）。用真實畫面：手機直式 400×760、深色、2 倍，紅框標出要按或要看的地方。
// 名字一律用範例（範例藍隊、範例橘隊、範例盃、王大明這類），不放學校或真實的名字。
// 用法：node tools/help1113.js [輸出資料夾，預設 /tmp/help1113] [只跑哪幾段：A B C]
//   A 範例比賽從名單打到比賽結束；B 盃賽資料夾、紀錄與名單、備份（用 fixture1113.py 的資料）；C 有新版本的提示（要用 http）
// 截完跑 python3 tools/help1113_import.py [輸出資料夾]，把圖換進原始檔（再跑 build.py）。安裝示意圖（ins_*）不用重截。
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),http=require('http'),{execFileSync}=require('child_process');
const R=path.resolve(__dirname,'..'),FILE='file://'+R+'/index.html',KEY='nanshe-scoresheet-v1';
const O=(process.argv[2]||'/tmp/help1113')+'/',ONLY=process.argv.slice(3);fs.mkdirSync(O,{recursive:true});
const W=400,H=760,done=[],bad=[];
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:W,height:H},colorScheme:'dark',deviceScaleFactor:2,serviceWorkers:'block'});
const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
const w=(ms=80)=>p.waitForTimeout(ms);
const mark=async sels=>{await p.evaluate(s=>{document.querySelectorAll('[data-mk]').forEach(x=>{x.style.outline='';x.style.outlineOffset='';x.removeAttribute('data-mk')});
  s.forEach(q=>document.querySelectorAll(q).forEach(el=>{el.setAttribute('data-mk',1);el.style.outline='4px solid #FF3B30';el.style.outlineOffset='2px'}))},sels)};
// 截 sel 那幾個元素合起來的範圍（加 pad），marks 加紅框；opt.y0/y1 可以只截一段
const cap=async(name,sel,marks=[],pad=8,opt={})=>{try{await w(120);await mark(marks);await w(60);
  const r=await p.evaluate(s=>{const R=s.map(q=>[...document.querySelectorAll(q)]).flat().map(x=>x.getBoundingClientRect()).filter(x=>x.width&&x.height);if(!R.length)return null;
   return [Math.min(...R.map(x=>x.left)),Math.min(...R.map(x=>x.top)),Math.max(...R.map(x=>x.right)),Math.max(...R.map(x=>x.bottom))]},Array.isArray(sel)?sel:[sel]);
  if(!r)throw new Error('找不到 '+sel);
  const vw=p.viewportSize(),x=Math.max(0,r[0]-pad),y=Math.max(0,(opt.y0!=null?opt.y0:r[1])-pad),y2=Math.min(vw.height,(opt.y1!=null?opt.y1:r[3])+pad);
  await p.screenshot({path:O+name+'.png',clip:{x,y,width:Math.min(vw.width,r[2]+pad)-x,height:y2-y}});await mark([]);done.push(name)}catch(e){bad.push(name+'：'+e.message.split('\n')[0]);await mark([]).catch(()=>{})}};
const shot=async(name,clip)=>{await w(150);await p.screenshot({path:O+name+'.png',clip});done.push(name)};
const close=async()=>{const c=p.locator('.sheet [data-act=close]');if(await c.count()){await c.last().click();await w(80)}};
const aboutOff=async()=>{const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await w(150)}};
const fresh=async(url,store)=>{await p.goto(url);await p.evaluate(([k,v])=>{localStorage.clear();sessionStorage.clear();if(v)localStorage.setItem(k,v)},[KEY,store||null]);await p.reload();await w(400);await aboutOff()};
const hideToast=async()=>{await p.evaluate(()=>{document.querySelectorAll('.ftoast').forEach(x=>x.remove())})};
const point=async k=>{if(await p.locator('.sheet .go[data-act=libout]').count()){await p.locator('.sheet .go[data-act=libout]').click();await w(120)}
  const lb=p.locator('.pc.bad');if(await lb.count()){await lb.first().click();await w(120)}
  if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await w(450)}await p.click(`[data-act=point][data-team=${k}]`);await w(450)};
const endOk=async()=>{const e=p.locator('.sheet.setend [data-act=endok]');if(await e.count()){await e.click();await w(250)}};
const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
const run=k=>!ONLY.length||ONLY.includes(k);
const tag=async(sel,i=0)=>p.evaluate(([q,n])=>{document.querySelectorAll('[data-h13]').forEach(x=>x.removeAttribute('data-h13'));const e=document.querySelectorAll(q)[n];if(e)e.setAttribute('data-h13','1')},[sel,i]); // 只標第 i 個
try{

// ===== A：範例比賽 =====
if(run('A')){
await fresh(FILE);
await cap('home','.hero',['.herocta']);
await p.click('.herobtns [data-act=helpopen]');await w(200);
await cap('sample',['.help .hhead','.help .hsample','.help .hmenu [data-act=helpgroup]:first-of-type'],['.help .hsample'],0);
await p.click('[data-act=sample]');await w(300);
await cap('steps','.nav',[],0);
// 名單
await p.locator('.nav [data-v=roster]').click();await w(150);
await cap('roster1',['.rh.t1','.rh.t2'],['#n-t1','#n-t2'],6,{y1:await p.evaluate(()=>document.querySelectorAll('[data-act=slot][data-team=t1]')[3].getBoundingClientRect().bottom)});
await p.locator('[data-act=slot][data-team=t1]:not(.fill)').first().click();await w(150);
await cap('roster2',['.num.on','.kp'],['.num.on','.kp .pad'],6,{y0:await p.evaluate(()=>document.querySelector('.num.on').getBoundingClientRect().top-64)});await p.click('[data-act=kpclose]');await w(100);
await p.locator('[data-act=slot][data-team=t1].fill').first().click();await w(150);await cap('roster3','.kp',['.kp .acts']);await p.click('[data-act=kpclose]');await w(100);
await p.addStyleTag({content:'.rnext{position:static!important}'});await p.locator('.tools').scrollIntoViewIfNeeded();await w(150);
await cap('roster4','.tools',['[data-act=sheet][data-v=staff]'],6);
// 挑邊
await p.locator('.nav [data-v=toss]').click();await w(150);await p.click('.side.t1');await w(100);
await cap('toss1','.toss',['.side.t1','.swap']);
await cap('toss2','[data-act=sheet][data-v=pf]',['[data-act=sheet][data-v=pf]'],14);
await p.click('[data-act=sheet][data-v=pf]');await w(150);await p.click('[data-act=pfreason][data-v=逾時未出賽]');await p.click('[data-act=pfwin][data-team=t1]');await w(100);await cap('pf','.sheet');await close();
// 陣容
await p.locator('.nav [data-v=lineup]').click();await w(150);
for(const n of [1,3])await p.click(`[data-act=fill][data-no="${n}"]`);await cap('lu1',['.lusheet','.bench'],['.cell.sel','.bench .chip'],8);
for(const n of [5,7,9,11])await p.click(`[data-act=fill][data-no="${n}"]`);await w(100);await cap('lu2',['.lutabs','.lusheet'],['.lutabs'],6);
await cap('lu3',['.bench','[data-act=lu-lock]'],['[data-act=lu-lock]'],8);await p.click('[data-act=lu-lock]');await w(120);
for(const n of [2,4,6,8,10,14])await p.click(`[data-act=fill][data-no="${n}"]`);await p.click('[data-act=lu-lock]');await w(120);
await p.click('[data-act=start]');await w(200);await p.fill('#cs-time','09:00');await cap('start','.sheet',['#cs-time','[data-act=cs-yes]']);
{const d=new Date(Date.now()-1500000);await p.fill('#cs-time',('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2))}await p.click('[data-act=cs-yes]');await w(300);
// 比賽
await cap('serve',['.board','.pcourt'],['.srvmark'],6);
}
const toPlay=async()=>{await fresh(FILE);await p.click('.herobtns [data-act=helpopen]');await p.click('[data-act=sample]');await w(150);
  await p.locator('.nav [data-v=toss]').click();await p.click('.side.t1');await p.locator('.nav [data-v=lineup]').click();await w(100);
  for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=p.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}const k=p.locator('[data-act=lu-lock]');if(await k.count())await k.click()}
  await p.click('[data-act=start]');await w(100);{const d=new Date(Date.now()-1500000);await p.fill('#cs-time',('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2))}await p.click('[data-act=cs-yes]');await w(300)};
// ===== B：比賽中 =====
if(run('B')){
await toPlay();
await cap('serve2',['.zone .lockline','.foot'],['[data-act=serve]'],6);
await p.click('[data-act=serve]');await w(500);await cap('point','.liveover',['[data-act=point]'],6);
await p.click('[data-act=point][data-team=t1]');await w(500);
for(const k of ['t2','t2','t1'])await point(k);
await p.click('[data-act=serve]');await w(450);await p.click('[data-act=point][data-team=t2]');await w(450);
await p.click('.bar [data-act=undo]');await w(150);await cap('undo',['.bar','.board'],['.bar [data-act=undo]','.ftoast'],4);await hideToast();await w(3000); // 提示字 3 秒後才收
await p.click('[data-act=point][data-team=t2]');await w(500);
await p.click('[data-act=timeout][data-team=t1]');await w(150);await cap('to','.sheet');await p.click('[data-act=toyes]');await w(150);await p.click('[data-act=tmend]');await w(150);
await p.click('[data-act=sheet][data-v=more]');await w(200);await p.click('.sheet [data-act=tossfix]');await w(250);await cap('tossfix','.sheet',[],0);await close();
// 替補：先點場上要換下的，再點要上場的
await p.click('[data-act=subopen][data-team=t2]');await w(150);await cell('t2',8).click();await w(150);await p.locator('.kp [data-act=subin][data-no="77"],.kp [data-act=subbench][data-no="77"]').first().click();await w(200);
await cap('sub',['.pcourt','.kp'],['.kp .subpair,.kp .pairs','.kp .go'],6);
await p.locator('.kp .go').first().click();await w(300);
await cap('fixsc',['.tt','.pbtns'],['[data-act=scfix]'],6);
await w(700);await point('t1'); // 按完替補 0.7 秒內按發球不算（防連點）
// 舉球員
for(const [k,no] of [['t1',5],['t2',6]]){await cell(k,no).click();await w(150);await p.click('.sheet [data-act=pmsetter]');await w(200)}
await hideToast();await p.evaluate(()=>{const l=document.querySelector('.zone .lockline');if(l)l.style.visibility='hidden'});
await cap('setter',['.board','.pcourt'],['.pcourt .stmk'],6);
// 自由球員：先點 L 格，能換的後排會亮
const rawPoint=async k=>{if(await p.locator('[data-act=serve]').count()){await p.click('[data-act=serve]');await w(450)}await p.click(`[data-act=point][data-team=${k}]`);await w(450)};
await p.evaluate(()=>{const l=document.querySelector('.zone .lockline');if(l)l.style.visibility=''});
await p.locator('.lc.t1').first().click();await w(150);await cap('lib',['.pcourt','.strips'],['.lc.sel','.pc.t1.pk'],6);
await p.locator('.pc.t1.pk[data-pos="4"]').click();await w(250);
const sv=async()=>p.evaluate(()=>{const b=document.querySelector('.mid');return b?b.innerHTML.indexOf('◀')>=0||/srv-l|left/.test(b.innerHTML):null});
for(let i=0;i<12;i++){if(await p.locator('.pc.bad').count()||await p.locator('.sheet [data-act=libout]').count())break;
  const ser=await p.evaluate(()=>{const m=document.querySelector('.srvmark');if(!m)return '';const r=m.getBoundingClientRect();return r.left+r.width/2<innerWidth/2?'L':'R'});
  await rawPoint(ser==='L'?'t2':'t1')}
await w(900);
await cap('libf',['.pcourt','.zone .lockline','.sheet'],['.pc.bad','.sheet [data-act=libout]'],6);
console.log('libf 狀態',await p.evaluate(()=>[document.querySelectorAll('.pc.bad').length,!!document.querySelector('.sheet [data-act=libout]'),(document.querySelector('.zone .lockline')||{}).textContent]));
await p.locator('.pc.bad').first().click();await w(250);
// 其他
await p.click('[data-act=sheet][data-v=more]');await w(250);await cap('more','.sheet',[],0);
await p.click('.sheet [data-act=mteam][data-v=red]');await w(200);await p.locator('.sheet [data-act=redopen]').first().click();await w(200);await cap('redes','.sheet',[],0);await close();
// 判罰
await p.click('[data-act=penopen]');await w(150);await p.click('[data-act=penteam][data-team=t2]');await w(200);
await cap('pen','.sheet',[],0);await cap('pt','.sheet .pk3:not(.four)',['.sheet .pk3:not(.four)']);await cap('pp','.sheet .pk3.four',['.sheet .pk3.four']);
await p.click('[data-act=penkind][data-v=W]');await w(150);await p.click('[data-act=penwho][data-no="6"]');await w(200);await cap('pen2','.sheet',['[data-act=penyes]'],0);
await p.click('[data-act=penyes]');await w(300);await hideToast();await cap('pencard','.pcourt',['.pcourt .cdm'],6);
// 輪轉錯誤：範例橘隊錯，範例藍隊先照平常得分
const sc=async()=>p.evaluate(()=>[...document.querySelectorAll('.board .sc,.board .big,.ss b')].map(x=>x.textContent).join(','));
for(const k of ['t2','t2','t2','t1'])await point(k);
await w(3000);
await p.click('[data-act=sheet][data-v=more]');await w(250);await p.click('.sheet [data-act=mteam][data-v=rot]');await w(200);await cap('rot0','.sheet',['.sheet [data-act=rotopen][data-team=t2]'],0);
await p.click('.sheet [data-act=rotopen][data-team=t2]');await w(200);await p.fill('#rot-to','3');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);
await cap('rot1','.sheet',['.sheet .rotrow input','.sheet [data-act=rotkind][aria-pressed=true]'],0);
await p.click('.sheet [data-act=rotgo]');await w(250);await cap('rot2','.sheet',['.sheet [data-act=rotdo]'],0);
await p.click('.sheet [data-act=rotdo]');await w(300);await w(3000);
// 記錄表
await p.click('[data-act=sheetopen]');await w(300);
await hideToast();
await cap('sheet1',['.sheettabs','.ctov'],['.sheettabs'],6);
await cap('loupe',['.ctov','.lhint','.lmag'],[],6);
// 點格子：先把放大的那塊移到範例橘隊（點上面記錄表的右邊）
const ov=await p.locator('.ctov').boundingBox();await p.mouse.click(ov.x+ov.width*.72,ov.y+ov.height*.4);await w(300);
await cap('loupe2',['.ctov','.lhint','.lmag'],[],6);
const hot=p.locator('.lmag rect.hot[data-v="1:P:3"]');console.log('格子',await hot.count());
if(await hot.count()){await hot.first().click({force:true});await w(300);await cap('cell','.sheet',[],0);await close()}
// 更正
await p.click('[data-act=rtab][data-v=fix]');await w(300);await hideToast();
await p.screenshot({path:O+'_fix.png'});
await cap('fix1',['.narrow .seg','.fixrow'],['.fixrow'],6);
await p.locator('.fixrow').last().click();await w(300);await cap('fix2','.sheet',[],0);await close();
await p.click('[data-act=sheetclose]');await w(300);
await p.click('[data-act=sheet][data-v=more]');await w(200);await p.click('.sheet [data-act=mteam][data-v=fix]');await w(200);await p.locator('.sheet [data-act=fixopen]').first().click();await w(250);await cap('fixlu','.sheet',['.sheet .fixpos'],0);await close();
// 手機轉橫：另開一個橫放的觸控手機，資料搬過去
{const st=await p.evaluate(()=>JSON.stringify(Object.assign({},localStorage)));
 const lc=await b.newContext({viewport:{width:844,height:390},colorScheme:'dark',deviceScaleFactor:2,hasTouch:true,isMobile:true,serviceWorkers:'block'});const q=await lc.newPage();
 await q.goto(FILE);await q.evaluate(s=>{localStorage.clear();const o=JSON.parse(s);for(const k in o)localStorage.setItem(k,o[k])},st);await q.reload();await q.waitForTimeout(400);
 const ab=q.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await q.waitForTimeout(150)}
 const go=q.locator('[data-act=open]').first();if(await go.count()){await go.click();await q.waitForTimeout(400)}
 if(await q.locator('.land').count()){await q.waitForTimeout(200);await q.screenshot({path:O+'land.png'});done.push('land')}else{bad.push('land：沒有出現');await q.screenshot({path:O+'_land.png'})}
 await lc.close()}
// 打完第 1 局（兩隊輪流得分，範例藍隊多一點）
const playSet=async(win,lose,cap2,pat='WWLWLLWWWLWL')=>{let n2=0;for(let i=0;i<90;i++){if(await p.locator('.sheet.setend').count()||await p.locator('[data-act=swap8]').count())break;if(pat[i%pat.length]==='L'&&n2<cap2){await point(lose);n2++}else await point(win)}await w(400);await hideToast()};
await playSet('t1','t2',16);
await p.fill('#se-st','09:00');await p.fill('#se-en','09:24');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);
await cap('end','.sheet.setend',['#se-st','#se-en','.sheet.setend [data-act=endok]'],0);
await p.click('.sheet.setend [data-act=endok]');await w(400);await hideToast();
await cap('endview',['.sheettabs','.endhint','.loupe'],['.sheettabs [data-v=end]','.lmag'],6);
await cap('endback',['.good','.pendrow'],['.pendrow [data-act=undo]'],6);
await p.screenshot({path:O+'_endview.png'});
// 下一局：陣容複製
await p.click('[data-act=endset]');await w(400);await hideToast();
await cap('copy',['.lusheet','.lucopy'],['.lucopy [data-act=copy]'],6);
const lock2=async()=>{for(let i=0;i<2;i++){await p.click('[data-act=copy]');await w(120);await p.click('[data-act=lu-lock]');await w(150)}};
await lock2();await p.click('[data-act=start]');await w(300);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await w(300)}
// 第 2 局範例橘隊贏
await playSet('t2','t1',20);
await p.click('.sheet.setend [data-act=endok]');await w(400);await hideToast();
// 改發球格（這局沒有取消分數）
const bx=p.locator('.lmag rect.hot[data-v^="2:B:"]');
if(await bx.count()){await bx.nth(2).click({force:true});await w(300);await cap('box','.sheet',[],0);await p.screenshot({path:O+'_box.png'});
  console.log('發球格視窗',await p.evaluate(()=>[...document.querySelectorAll('.sheet button')].map(x=>x.getAttribute('data-act')+':'+x.textContent.trim()).join(' | ')));
  await p.locator('.sheet [data-act=close],.sheet [data-act=bxback]').first().click();await w(200)}else bad.push('box：沒有發球格');
await p.click('[data-act=endset]');await w(400);await hideToast();
// 第 3 局：重新挑邊、8 分換場、比賽結束
await p.locator('.side').first().click();await w(200);await cap('toss3',['.stephint','.toss'],['.side.on','.swap'],6);
await p.locator('.nav [data-v=lineup]').click();await w(200);await lock2();
await p.click('[data-act=start]');await w(300);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await w(300)}
await playSet('t1','t2',5,'WLWWL');
await w(800);await cap('swap','.sheet',['[data-act=swap8]'],0);await p.click('[data-act=swap8]');await w(300);
await playSet('t1','t2',9,'WLWWL');
await p.click('.sheet.setend [data-act=endok]');await w(400);await hideToast();
await cap('final',['.good','.pendrow'],['.pendrow [data-act=endset]'],6);
await p.click('.pendrow [data-act=endset]');await w(500);await hideToast();
await p.screenshot({path:O+'_final.png'});
await cap('bk',['#bkwarn','.savebtns'],['#bkwarn [data-act]'],6);
console.log('B 完');
}
// ===== C：盃賽資料夾、紀錄與名單、備份（fixture1113.py 的資料）=====
if(run('C')){
const FIX=(()=>{execFileSync('python3',[__dirname+'/fixture1113.py','/tmp/fix1113.json']);return fs.readFileSync('/tmp/fix1113.json','utf8')})();
await fresh(FILE,FIX);
await p.click('[data-act=new]');await w(250);await cap('pickcup','.sheet',['.sheet [data-act=newpick][aria-pressed=true]','.sheet [data-act=newgo]'],0);
await p.click('.sheet [data-act=newgo]');await w(300);
await p.fill('#i-group','甲組');await p.fill('#i-game','3');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);
await cap('info','.fields',['.fields [data-act=sheet]:not([data-v=points])'],6,{y1:await p.evaluate(()=>document.querySelector('#i-date').getBoundingClientRect().bottom)});
await p.click('[data-act=sheet][data-v=points]');await w(200);await cap('points','.sheet',[],0);await close();
await p.locator('.nav [data-v=refs]').click();await w(250);
await p.click('[data-act=refname][data-v=王大明]');await w(200);await p.click('[data-act=refname][data-v=李小華]');await w(200);
await p.addStyleTag({content:'.page [data-act=page][data-v=roster]{visibility:hidden}'}); // 黏在下面的「下一步」不入鏡
await cap('refs1',['[data-act=refrole]','[data-act=refname]'],['[data-act=refrole][aria-pressed=true]','[data-act=refname]'],8);
await p.evaluate(()=>{const m=document.querySelector('main.page');m.scrollTop=9999});await w(150);
const fin=p.locator('.page input[type=text]').last();await fin.fill('許大同');await w(100);
await cap('refs2',['[data-act=refname]','[data-act=reftype]'],['[data-act=reftype]'],8);
await p.locator('.nav [data-v=roster]').click();await w(250);await p.fill('#n-t1','範例黃隊');await p.fill('#n-t2','範例紫隊');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(200);
await p.click('.bar [data-act=home]');await w(300);
await tag('.rrow .rmain em',0);await cap('resume',['.homenote','.rrow'],['[data-h13]'],6,{y1:await p.evaluate(()=>document.querySelector('.rrow').getBoundingClientRect().bottom)});
// 紀錄與名單
await p.click('.herobtns [data-act=history]');await w(300);
const secs=await p.evaluate(()=>[...document.querySelectorAll('.page section')].map(s=>{const r=s.getBoundingClientRect();return [r.top,r.bottom]}));
await cap('cup1','.page section:nth-of-type(1)',['[data-act=cupcreate]'],6);
await cap('hist1','.page section:nth-of-type(2)',['.page section:nth-of-type(2) [data-act=open]'],6);
await cap('bkimp','.page section:nth-of-type(3)',['.page section:nth-of-type(3) [data-act=bksel]','.page section:nth-of-type(3) .ghost-file,.page section:nth-of-type(3) label'],6);
await p.click('.shead [data-act=bksel]');await w(200);await p.click('.bkone[data-id=mdone1]');await p.click('.bkone[data-id=mdone2]');await w(200);
await cap('bksel',['.bkpick','.selacts'],['.bkone[aria-pressed=true] .bkbox','.selacts'],6);
await p.click('[data-act=bkgo]');await w(250);await cap('bkopt','.sheet',['.sheet .imp'],0);
await close();await p.click('[data-act=bkcancel]');await w(200);
// 資料夾：加入隊伍名單、新增場地
await p.click('[data-act=cupopen][data-id=cupsample]');await w(300);
await p.click('[data-act=cupteam]:not([data-id])');await w(250);
await p.fill('#ct-name','範例青隊');await p.fill('#ct-group','甲組');await p.fill('#ct-text','教練：王教練\n1 王小明 隊長\n3 陳大文\n5 林小華\n7 張小強\n9 李小志\n11 黃小宇\n12 吳小安 L');
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);await cap('cup2','.sheet',['#ct-text'],0);await close();
await p.locator('[data-act=cupcourt]:not([data-v])').first().click();await w(250);
await p.fill('#cc-court','第三場地');await p.fill('#cc-text','許大同\n周美君\n鄭志明\n蔡佳玲');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);
await cap('cupref','.sheet',['#cc-court','#cc-text'],0);await close();
// 傳到另一台：存成檔案，再到「紀錄與名單」匯入（檔案裡多一隊、多一位裁判）
const dlP=p.waitForEvent('download',{timeout:8000}).catch(()=>null);await p.click('[data-act=cupsave]');const dl=await dlP;await w(300);
if(dl){const f='/tmp/h13cup.json';await dl.saveAs(f);const d=JSON.parse(fs.readFileSync(f,'utf8'));
  const T1=Date.now()+60000,c0=d.cups[0];
  c0.teams.push({id:'tmnew',division:'男子組',group:'甲組',at:T1,team:{name:'範例青隊',players:[1,3,5,7,9,11].map(n=>({no:n,name:''})),captain:1,liberos:[],staff:{coach:'',execCoach:'',teacher:'',leader:''},locked:false,color:null,liberoColor:null}});
  ['許大同','周美君'].forEach(n=>c0.refs.push({court:'3',label:'第三場地',name:n,at:T1}));c0.at=T1;
  fs.writeFileSync(f,JSON.stringify(d));
  await p.click('.bar [data-act=history],.barback').catch(()=>{});await w(300);
  if(!(await p.locator('#import-file').count())){await p.click('.bar [data-act=home]').catch(()=>{});await w(200);await p.click('.herobtns [data-act=history]');await w(300)}
  await p.setInputFiles('#import-file',f);await w(500);
  await cap('cup4','.sheet',['.sheet [data-act=impgo],.sheet [data-act=import-yes]'],0);
  await p.screenshot({path:O+'_imp.png'});
  const cn=p.locator('.sheet [data-act=impcancel],.sheet [data-act=import-cancel]');if(await cn.count())await cn.first().click();await w(200);
}else{bad.push('cup4：沒有下載');await p.screenshot({path:O+'_cupsave.png'})}
}
// ===== D：有新版本的提示（要用 http 才會去問 version.json）=====
if(run('D')){
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]),f=path.join(R,u==='/'?'index.html':u);
  if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"build":"1114-0800"}');return}
  fs.readFile(f,(e,b)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'text/javascript':'application/octet-stream'});r.end(b)})});
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));const URLH='http://127.0.0.1:'+srv.address().port+'/index.html';
const FIX=fs.readFileSync('/tmp/fix1113.json','utf8');
await fresh(URLH,FIX);await p.click('.herobtns [data-act=history]');await w(300);
await p.evaluate(()=>dispatchEvent(new Event('online')));await w(800);
await cap('upd',['.bar','.updbar'],['.updbar [data-upd=go]'],0);
srv.close();
}
}catch(x){await p.screenshot({path:O+'_err.png'}).catch(()=>{});throw x}
console.log('截好',done.length,'張：',done.join(' '));if(bad.length)console.log('沒截到：\n'+bad.join('\n'));console.log(errs.length?errs:'沒有錯誤');await b.close()})().catch(x=>{console.log('ERR',x.message.slice(0,600));console.log('截好',done.join(' '));process.exit(1)});

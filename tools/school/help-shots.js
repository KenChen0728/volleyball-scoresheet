// 學校版使用教學的截圖（11/13 照新的畫面重寫）：node tools/school/help-shots.js [輸出資料夾，預設 /tmp/school-help] [只跑哪幾段：A C D]
// 再跑 python3 tools/school/help-img.py [輸出資料夾]。手機直式 400×760、深色、2 倍，紅框標出要按或要看的地方。
// 名字一律用範例（範例藍隊、範例盃、王小明這類），不放學校或真實的名字。
//   A 範例比賽從名單打到比賽結束；C 資料夾、紀錄與名單、備份（用 tools/fixture1113.py 的資料）；D 有新版本的提示（要用 http）
// 只有 SHEET=false（derive.py 預設）的圖；SHEET 改成 True 時，記錄表那幾張（crew、sheet1、sheet2、sheetread、output）要另外補截。
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),http=require('http'),{execFileSync}=require('child_process');
const R=path.resolve(__dirname,'../..'),URL_='file://'+R+'/school/index.html',KEY='vb-school-v2';
const O=(process.argv[2]||'/tmp/school-help')+'/',ONLY=process.argv.slice(3);fs.mkdirSync(O,{recursive:true});
const W=400,H=760,done=[],bad=[];
(async()=>{const b=await chromium.launch();
// 安裝示意圖
const q=await (await b.newContext({viewport:{width:640,height:520},deviceScaleFactor:1})).newPage();await q.goto('file://'+__dirname+'/ins.html');
for(const id of ['ins_ios1','ins_ios2','ins_ios3','ins_android','ins_pc','ins_mac','ins_line','ins_bk']){await q.evaluate(i=>{document.querySelectorAll('.s').forEach(x=>x.style.display=x.id===i?'block':'none')},id);await q.waitForTimeout(40);await q.screenshot({path:O+id+'.png'})}
const ctx=await b.newContext({viewport:{width:W,height:H},colorScheme:'dark',deviceScaleFactor:2,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
const w=(ms=80)=>p.waitForTimeout(ms);
const mark=async sels=>{await p.evaluate(s=>{document.querySelectorAll('[data-mk]').forEach(x=>{x.style.outline='';x.style.outlineOffset='';x.removeAttribute('data-mk')});
  s.forEach(q=>document.querySelectorAll(q).forEach(el=>{el.setAttribute('data-mk',1);el.style.outline='4px solid #FF3B30';el.style.outlineOffset='2px'}))},sels)};
const cap=async(name,sel,marks=[],pad=8,opt={})=>{try{await w(120);await mark(marks);await w(60);
  const r=await p.evaluate(s=>{const R=s.map(q=>[...document.querySelectorAll(q)]).flat().map(x=>x.getBoundingClientRect()).filter(x=>x.width&&x.height);if(!R.length)return null;
   return [Math.min(...R.map(x=>x.left)),Math.min(...R.map(x=>x.top)),Math.max(...R.map(x=>x.right)),Math.max(...R.map(x=>x.bottom))]},Array.isArray(sel)?sel:[sel]);
  if(!r)throw new Error('找不到 '+sel);
  const vw=p.viewportSize(),x=Math.max(0,r[0]-pad),y=Math.max(0,(opt.y0!=null?opt.y0:r[1])-pad),y2=Math.min(vw.height,(opt.y1!=null?opt.y1:r[3])+pad);
  await p.screenshot({path:O+name+'.png',clip:{x,y,width:Math.min(vw.width,r[2]+pad)-x,height:y2-y}});await mark([]);done.push(name)}catch(e){bad.push(name+'：'+e.message.split('\n')[0]);await mark([]).catch(()=>{})}};
const close=async()=>{const c=p.locator('.sheet [data-act=close]');if(await c.count()){await c.last().click();await w(80)}};
const aboutOff=async()=>{const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await w(150)}};
const fresh=async(url,store)=>{await p.goto(url);await p.evaluate(([k,v])=>{localStorage.clear();sessionStorage.clear();if(v)localStorage.setItem(k,v)},[KEY,store||null]);await p.reload();await w(400);await aboutOff()};
const hideToast=async()=>{await p.evaluate(()=>{document.querySelectorAll('.ftoast').forEach(x=>x.remove())})};
const tag=async(sel,i=0)=>p.evaluate(([q,n])=>{document.querySelectorAll('[data-h13]').forEach(x=>x.removeAttribute('data-h13'));const e=document.querySelectorAll(q)[n];if(e)e.setAttribute('data-h13','1')},[sel,i]); // 只標第 i 個
const point=async k=>{if(await p.locator('.sheet .go[data-act=libout]').count()){await p.locator('.sheet .go[data-act=libout]').click();await w(120)}
  const lb=p.locator('.pc.bad');if(await lb.count()){await lb.first().click();await w(120)}
  await p.click(`[data-act=point][data-team=${k}]`);await w(560)}; // 學校版得分後 0.5 秒內再按不算（連按兩下只算一分）
const cell=(k,no)=>p.locator(`.pcourt .pc.${k}`).filter({has:p.locator('b',{hasText:new RegExp('^'+no+'$')})});
const playSet=async(win,lose,cap2,pat='WWLWLLWWWLWL')=>{let n2=0;for(let i=0;i<90;i++){if(await p.locator('.sheet.setend').count()||await p.locator('[data-act=swap8]').count())break;if(pat[i%pat.length]==='L'&&n2<cap2){await point(lose);n2++}else await point(win)}await w(400);await hideToast()};
const lock2=async()=>{for(let i=0;i<2;i++){await p.click('[data-act=copy]');await w(120);await p.click('[data-act=lu-lock]');await w(150)}};
const run=k=>!ONLY.length||ONLY.includes(k);
try{
// ===== A：範例比賽 =====
if(run('A')){
await fresh(URL_);
await cap('home','.hero',['.herocta']);
await p.click('.herobtns [data-act=helpopen]');await w(200);await cap('sample',['.help .hhead','.help .hsample'],['.help .hsample'],0);
await p.click('[data-act=sample]');await w(300);
await cap('steps','.nav',[],0);
await p.locator('.nav [data-v=info]').click();await w(150);
await cap('info','.fields',[],6,{y1:await p.evaluate(()=>document.querySelector('#i-date').getBoundingClientRect().bottom)});
await cap('fmt',['[data-act=fmt]','.ptbtn'],['[data-act=fmt]'],6);
await p.click('[data-act=sheet][data-v=points]');await w(200);await cap('points','.sheet',[],0);await close();
// 名單
await p.locator('.nav [data-v=roster]').click();await w(150);
await cap('roster1',['.rh.t1','.rh.t2'],['#n-t1','#n-t2'],6,{y1:await p.evaluate(()=>document.querySelectorAll('[data-act=slot][data-team=t1]')[3].getBoundingClientRect().bottom)});
await p.locator('[data-act=slot][data-team=t1]:not(.fill)').first().click();await w(150);
await cap('roster2','.kp',['.kp .pad']);await p.click('[data-act=kpclose]');await w(100);
await p.locator('[data-act=slot][data-team=t1].fill').first().click();await w(150);await cap('roster3','.kp',['.kp .acts']);await p.click('[data-act=kpclose]');await w(100);
await p.locator('[data-act=slot][data-team=t1][data-no="12"]').click();await w(120);await p.click('.kp [data-act=lib]');await w(120);const kc=p.locator('[data-act=kpclose]');if(await kc.count()){await kc.click();await w(100)} // 12 號當自由球員
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
await p.click('[data-act=start]');await w(200);await p.fill('#cs-time','09:00');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await cap('start','.sheet',['#cs-time','[data-act=cs-yes]']);
{const d=new Date(Date.now()-1500000);await p.fill('#cs-time',('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2))}await p.click('[data-act=cs-yes]');await w(300);
// 比賽
await cap('serve',['.board','.pcourt'],['.srvmark'],6);
await cap('point',['.lockline','.foot'],['[data-act=point]'],6);
for(const k of ['t1','t2','t2','t1'])await point(k);
await point('t2');await p.click('.bar [data-act=undo]');await w(200);await cap('undo',['.bar','.lockline'],['.bar [data-act=undo]','.lockline'],4);
await hideToast();await w(3000);await point('t2');
await p.click('[data-act=timeout][data-team=t1]');await w(150);await cap('to','.sheet');await p.click('[data-act=toyes]');await w(150);await p.click('[data-act=tmend]');await w(150);
await p.click('[data-act=sheet][data-v=more]');await w(200);await p.click('.sheet [data-act=tossfix]');await w(250);await cap('tossfix','.sheet',[],0);await close();
// 替補和綁定
await p.click('[data-act=subopen][data-team=t2]');await w(150);await cell('t2',8).click();await w(150);await p.locator('.kp [data-act=subin][data-no="77"],.kp [data-act=subbench][data-no="77"]').first().click();await w(200);
await cap('sub',['.pcourt','.kp'],['.kp .subpair,.kp .pairs','.kp .go'],6);
await p.locator('.kp .go').first().click();await w(300);
await cap('fixsc',['.tt','.pbtns'],['[data-act=scfix]'],6);
await cap('bind','.pcourt',['.bindm'],6);
await w(700);await point('t1');
await p.locator('.pc.t2',{has:p.locator('.bindm')}).first().click();await w(200);await cap('swapback','.sheet',['.sheet [data-act=pmsubin]'],0);await close();
// 舉球員
for(const [k,no] of [['t1',5],['t2',6]]){await cell(k,no).click();await w(150);await p.click('.sheet [data-act=pmsetter]');await w(200)}
await hideToast();await p.evaluate(()=>{const l=document.querySelector('.lockline');if(l)l.style.visibility='hidden'});
await cap('setter',['.board','.pcourt'],['.pcourt .stmk'],6);
await p.evaluate(()=>{const l=document.querySelector('.lockline');if(l)l.style.visibility=''});
// 自由球員
await p.locator('.lc.t1').first().click();await w(150);await cap('lib',['.pcourt','.strips'],['.lc.sel','.pc.t1.pk'],6);
await p.locator('.pc.t1.pk[data-pos="4"]').click();await w(250);
for(let i=0;i<12;i++){if(await p.locator('.pc.bad').count()||await p.locator('.sheet [data-act=libout]').count())break;
  const ser=await p.evaluate(()=>{const m=document.querySelector('.srvmark');if(!m)return '';const r=m.getBoundingClientRect();return r.left+r.width/2<innerWidth/2?'L':'R'});
  await p.click(`[data-act=point][data-team=${ser==='L'?'t2':'t1'}]`);await w(560)}
await w(900);await cap('libf',['.pcourt','.lockline','.sheet'],['.pc.bad','.sheet [data-act=libout]'],6);
if(await p.locator('.pc.bad').count()){await p.locator('.pc.bad').first().click();await w(250)}
// 其他
await p.click('[data-act=sheet][data-v=more]');await w(250);await cap('more','.sheet',[],0);
await p.click('.sheet [data-act=mteam][data-v=red]');await w(200);await p.locator('.sheet [data-act=redopen]').first().click();await w(200);await cap('redes','.sheet',[],0);await close();
// 判罰
await p.click('[data-act=penopen]');await w(150);await p.click('[data-act=penteam][data-team=t2]');await w(200);
await cap('pen','.sheet',[],0);await cap('pt','.sheet .pk3:not(.four)',['.sheet .pk3:not(.four)']);await cap('pp','.sheet .pk3.four',['.sheet .pk3.four']);
await p.click('[data-act=penkind][data-v=W]');await w(150);await p.click('[data-act=penwho][data-no="6"]');await w(200);await cap('pen2','.sheet',['[data-act=penyes]'],0);
await p.click('[data-act=penyes]');await w(300);await hideToast();await cap('pencard','.pcourt',['.pcourt .cdm'],6);
// 輪轉錯誤：範例橘隊錯，範例藍隊先照平常得分
for(const k of ['t2','t2','t2','t1'])await point(k);
await w(3000);
await p.click('[data-act=sheet][data-v=more]');await w(250);await p.click('.sheet [data-act=mteam][data-v=rot]');await w(200);
await p.click('.sheet [data-act=rotopen][data-team=t2]');await w(200);await p.fill('#rot-to','3');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);
await cap('rot1','.sheet',['.sheet .rotrow input','.sheet [data-act=rotkind][aria-pressed=true]'],0);
await p.click('.sheet [data-act=rotgo]');await w(250);await cap('rot2','.sheet',['.sheet [data-act=rotdo]'],0);
await p.click('.sheet [data-act=rotdo]');await w(300);await w(3000);
// 比賽紀錄、更正
await p.click('[data-act=sheetopen]');await w(300);await hideToast();
await cap('rec',['.sheettabs','.pres'],['.sheettabs'],6);
await p.click('[data-act=rtab][data-v=fix]');await w(300);await hideToast();
await cap('fix1',['.narrow .seg','.fixrow'],['.fixrow'],6);
await p.locator('.fixrow').last().click();await w(300);await cap('fix2','.sheet',[],0);await close();
await p.click('[data-act=sheetclose]');await w(300);
await p.click('[data-act=sheet][data-v=more]');await w(200);await p.click('.sheet [data-act=mteam][data-v=fix]');await w(200);await p.locator('.sheet [data-act=fixopen]').first().click();await w(250);await cap('fixlu','.sheet',['.sheet .fixpos'],0);await close();
// 打完第 1 局
await playSet('t1','t2',16);
await p.fill('#se-st','09:00');await p.fill('#se-en','09:24');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);
await cap('end','.sheet.setend',['#se-st','#se-en','.sheet.setend [data-act=endok]'],0);
await p.click('.sheet.setend [data-act=endok]');await w(400);await hideToast();
await cap('endback',['.good','.pendrow'],['.pendrow [data-act=undo]'],6);
await p.click('.pendrow [data-act=endset]');await w(400);await hideToast();
await cap('copy',['.lusheet','.lucopy'],['.lucopy [data-act=copy]'],6);
await lock2();await p.click('[data-act=start]');await w(300);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await w(300)}
// 第 2 局範例橘隊贏
await playSet('t2','t1',20);
await p.click('.sheet.setend [data-act=endok]');await w(400);await hideToast();
await p.click('.pendrow [data-act=endset]');await w(400);await hideToast();
// 決勝局
await p.locator('.side').first().click();await w(200);await cap('toss3',['.stephint','.toss'],['.side.on','.swap'],6);
await p.locator('.nav [data-v=lineup]').click();await w(200);await lock2();
await p.click('[data-act=start]');await w(300);if(await p.locator('[data-act=cs-yes]').count()){await p.click('[data-act=cs-yes]');await w(300)}
await playSet('t1','t2',5,'WLWWL');
await w(800);await cap('swap','.sheet',['[data-act=swap8]'],0);await p.click('[data-act=swap8]');await w(300);
await playSet('t1','t2',9,'WLWWL');
await p.click('.sheet.setend [data-act=endok]');await w(400);await hideToast();
await cap('final',['.good','.pendrow'],['.pendrow [data-act=endset]'],6);
await p.click('.pendrow [data-act=endset]');await w(500);await hideToast();
await cap('bk',['#bkwarn','.savebtns'],['#bkwarn [data-act]'],6);
}
// ===== C：資料夾、紀錄與名單、備份（fixture1113.py 的資料）=====
if(run('C')){
execFileSync('python3',[R+'/tools/fixture1113.py','/tmp/fix1113.json']);const FIX=fs.readFileSync('/tmp/fix1113.json','utf8');
await fresh(URL_,FIX);
await p.click('[data-act=new]');await w(250);await cap('pickcup','.sheet',['.sheet [data-act=newpick][aria-pressed=true]','.sheet [data-act=newgo]'],0);
await p.click('.sheet [data-act=newgo]');await w(300);
await p.locator('.nav [data-v=roster]').click();await w(250);await p.fill('#n-t1','範例黃隊');await p.fill('#n-t2','範例紫隊');await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(200);
await p.click('.bar [data-act=home]');await w(300);
await tag('.rrow .rmain em',0);await cap('resume',['.homenote','.rrow'],['[data-h13]'],6,{y1:await p.evaluate(()=>document.querySelector('.rrow').getBoundingClientRect().bottom)});
await p.click('.herobtns [data-act=history]');await w(300);
await cap('cup1','.page section:nth-of-type(1)',['[data-act=cupcreate]'],6);
await cap('hist1','.page section:nth-of-type(2)',['.page section:nth-of-type(2) [data-act=open]'],6);
await cap('bkimp','.page section:nth-of-type(3)',['.page section:nth-of-type(3) [data-act=bksel]','.page section:nth-of-type(3) .ghost-file'],6);
await p.click('.shead [data-act=bksel]');await w(200);await p.click('.bkone[data-id=mdone1]');await p.click('.bkone[data-id=mdone2]');await w(200);
await cap('bksel',['.bkpick','.selacts'],['.bkone[aria-pressed=true] .bkbox','.selacts'],6);
await p.click('[data-act=bkgo]');await w(250);await cap('bkopt','.sheet',['.sheet .imp'],0);
await close();await p.click('[data-act=bkcancel]');await w(200);
await p.click('[data-act=cupopen][data-id=cupsample]');await w(300);
await p.click('[data-act=cupteam]:not([data-id])');await w(250);
await p.fill('#ct-name','範例青隊');if(await p.locator('#ct-group').count())await p.fill('#ct-group','甲組');await p.fill('#ct-text','教練：王教練\n1 王小明 隊長\n3 陳大文\n5 林小華\n7 張小強\n9 李小志\n11 黃小宇\n12 吳小安 L');
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await w(150);await cap('cup2','.sheet',['#ct-text'],0);await close();
// 傳到另一台：存成檔案，再到「紀錄與名單」匯入（檔案裡多一隊）
const dlP=p.waitForEvent('download',{timeout:8000}).catch(()=>null);await p.click('[data-act=cupsave]');const dl=await dlP;await w(300);
if(dl){const f='/tmp/h13cup-school.json';await dl.saveAs(f);const d=JSON.parse(fs.readFileSync(f,'utf8'));const T1=Date.now()+60000,c0=d.cups[0];
  c0.teams.push({id:'tmnew',division:'男子組',group:'甲組',at:T1,team:{name:'範例青隊',players:[1,3,5,7,9,11].map(n=>({no:n,name:''})),captain:1,liberos:[],staff:{coach:'',execCoach:'',teacher:'',leader:''},locked:false,color:null,liberoColor:null}});c0.at=T1;
  fs.writeFileSync(f,JSON.stringify(d));
  await p.click('.barback');await w(300);if(!(await p.locator('#import-file').count())){await p.click('.bar [data-act=home]');await w(200);await p.click('.herobtns [data-act=history]');await w(300)}
  await p.setInputFiles('#import-file',f);await w(500);
  await cap('cup4','.sheet',['.sheet [data-act=impgo],.sheet [data-act=import-yes]'],0);
  const cn=p.locator('.sheet [data-act=impcancel],.sheet [data-act=import-cancel]');if(await cn.count())await cn.first().click();await w(200);
}else bad.push('cup4：沒有下載');
}
// ===== D：有新版本的提示（要用 http 才會去問 version.json）=====
if(run('D')){
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]),f=path.join(R,u==='/'?'index.html':u);
  if(/version\.json$/.test(u)){r.writeHead(200,{'content-type':'application/json'});r.end('{"build":"1114-0800"}');return}
  fs.readFile(f,(e,b2)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'text/javascript':f.endsWith('.webp')?'image/webp':'application/octet-stream'});r.end(b2)})});
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
const FIX=fs.existsSync('/tmp/fix1113.json')?fs.readFileSync('/tmp/fix1113.json','utf8'):null;
await fresh('http://127.0.0.1:'+srv.address().port+'/school/index.html',FIX);await p.click('.herobtns [data-act=history]');await w(300);
await p.evaluate(()=>dispatchEvent(new Event('online')));await w(800);
await cap('upd',['.bar','.updbar'],['.updbar [data-upd=go]'],0);
srv.close();
}
}catch(x){await p.screenshot({path:O+'_err.png'}).catch(()=>{});throw x}
console.log('截好',done.length,'張：',done.join(' '));if(bad.length)console.log('沒截到：\n'+bad.join('\n'));console.log(errs.length?errs:'沒有錯誤');await b.close()})().catch(x=>{console.log('ERR',x.message.slice(0,600));process.exit(1)});

// 11/11 新的說明圖（勾選備份、帶不帶名單、匯入、有新版本、舊資料帶過去）
// 用法：node tools/help1111.js <網址> <資料 key> <版本檔所在資料夾> <示意圖 ins.html> <輸出資料夾>
// 網址要用 http://127.0.0.1（更新提示要向網站問版本），資料用 fixture1111.py 產生的 /tmp/fix1111.json
const {chromium}=require('playwright');const fs=require('fs');
const [URL,KEY,VDIR,INS,O]=process.argv.slice(2);fs.mkdirSync(O,{recursive:true});
const FIX=fs.readFileSync('/tmp/fix1111.json','utf8'),VER=fs.readFileSync(VDIR+'/version.json','utf8');
(async()=>{const b=await chromium.launch();
const q=await (await b.newContext({viewport:{width:640,height:520},deviceScaleFactor:1})).newPage();await q.goto('file://'+INS);
await q.evaluate(()=>document.querySelectorAll('.s').forEach(x=>x.style.display=x.id==='ins_bk'?'block':'none'));await q.waitForTimeout(80);await q.screenshot({path:O+'/ins_bk.png'});
const ctx=await b.newContext({viewport:{width:400,height:760},colorScheme:'dark',deviceScaleFactor:2});const p=await ctx.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
const w=(ms=60)=>p.waitForTimeout(ms);
const mark=async(sels)=>{await p.evaluate(s=>{document.querySelectorAll('[data-mk]').forEach(x=>{x.style.outline='';x.removeAttribute('data-mk')});s.forEach(q=>document.querySelectorAll(q).forEach(el=>{el.setAttribute('data-mk',1);el.style.outline='4px solid #FF3B30';el.style.outlineOffset='2px';el.style.zIndex=5}))},sels)};
const cap=async(name,sel,marks=[],pad=8)=>{await w(80);await mark(marks);await w(40);
 const r=await p.evaluate(s=>{const R=s.map(q=>[...document.querySelectorAll(q)]).flat().map(x=>x.getBoundingClientRect()).filter(x=>x.width);return [Math.min(...R.map(x=>x.left)),Math.min(...R.map(x=>x.top)),Math.max(...R.map(x=>x.right)),Math.max(...R.map(x=>x.bottom))]},Array.isArray(sel)?sel:[sel]);
 const vw=p.viewportSize(),x=Math.max(0,r[0]-pad),y=Math.max(0,r[1]-pad);await p.screenshot({path:O+'/'+name+'.png',clip:{x,y,width:Math.min(vw.width,r[2]+pad)-x,height:Math.min(vw.height,r[3]+pad)-y}});await mark([])};
try{
await p.goto(URL);await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,FIX]);await p.reload();await w(300);
await p.click('.herobtns [data-act=history]');await w(150);
await cap('bkimp','.narrow>section:last-child',['.histtools [data-act=bksel]','.histtools .ghost-file'],6);
await p.click('.shead [data-act=bksel]');await w(80);await p.click('.bkone[data-id=mdone1]');await p.click('.bkone[data-id=mdone2]');await w(80);
await cap('bksel','.bkpick',['.bktools','.bkone[aria-pressed=true] .bkbox'],6);
await p.click('[data-act=bkgo]');await w(150);await cap('bkopt','.sheet',['.sheet .imp']);
await p.click('.sheet [data-act=close]');await w(60);await p.click('[data-act=bkcancel]');await w(80);
fs.writeFileSync(VDIR+'/version.json','{"build":"1112-0900"}\n');await p.evaluate(()=>dispatchEvent(new Event('online')));await w(600);
await cap('upd',['.bar','.updbar'],['.updbar [data-upd=go]'],0);
}finally{fs.writeFileSync(VDIR+'/version.json',VER)}
console.log('shots ok',e.join('|'));await b.close()})().catch(x=>{fs.writeFileSync(VDIR+'/version.json',VER);console.log('ERR',x.message);process.exit(1)});

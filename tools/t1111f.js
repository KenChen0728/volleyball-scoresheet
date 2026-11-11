// 11/11 說明頁（每天第一次打開跳一次）和「關於這個程式」
// node tools/t1111f.js [網址] [偏好設定 key]（學校版：file://.../school/index.html vb-school-prefs）
// 自動測試平常不跳說明頁，網址加 ?intro 才會跳
const {chromium}=require('playwright');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',PK=process.argv[3]||'volleyball-prefs',SCHOOL=PK.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();p.on('pageerror',x=>errs.push(x.message));
const today=await p.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)});
// 自動測試（沒有 ?intro）不跳
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
ok('no intro for tests',await p.locator('.sheet.about').count()===0);
// 第一次打開跳
await p.goto(URL+'?intro');await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
const ab=p.locator('.sheet.about');ok('intro shown',await ab.count()===1);
const tx=await ab.innerText();
ok('sections',['系統說明','著作權','使用授權','注意事項','© 2026 Ken Chen','免費提供非商業用途使用','PolyForm Noncommercial 1.0.0','比賽資料僅儲存於本裝置'].every(x=>tx.includes(x)),tx);
ok('desc',SCHOOL?tx.includes('記錄比賽過程與結果'):tx.includes('依中華民國排球協會記錄表格式產生紀錄'),tx);
ok('intro has no version row',!tx.includes('授權全文與原始碼'));
ok('start button',(await p.locator('.sheet.about [data-act=aboutclose]').innerText()).includes('開始使用'));
ok('day saved',await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).introDay,PK)===today);
await p.click('.sheet.about [data-act=aboutclose]');await W(150);ok('closed',await ab.count()===0);
// 同一天再打開不跳
await p.reload();await W(200);ok('same day no intro',await ab.count()===0);
// 隔天再跳，Esc 可以關
await p.evaluate(k=>{const q=JSON.parse(localStorage.getItem(k));q.introDay='2000-01-01';localStorage.setItem(k,JSON.stringify(q))},PK);await p.reload();await W(200);
ok('next day intro',await ab.count()===1);await p.keyboard.press('Escape');await W(150);ok('esc closes',await ab.count()===0);
// 主畫面「關於這個程式」
const btn=p.locator('[data-act=about]');ok('about button',await btn.count()===1&&(await btn.innerText()).includes('關於這個程式'));
const bb=await btn.boundingBox();ok('about button big enough',bb&&bb.height>=40,bb);
await btn.click();await W(150);const t2=await ab.innerText();
ok('about has version',/版本\s*\S*1111-\d{4}/.test(t2),t2);ok('about has report',t2.includes('有問題請截圖傳給 Ken Chen'));
ok('github link',(await p.locator('.sheet.about a').getAttribute('href'))==='https://github.com/KenChen0728/volleyball-scoresheet');
ok('close label',(await p.locator('.sheet.about [data-act=aboutclose]').innerText()).includes('關閉'));
await p.click('.scrim[data-act=aboutclose]',{position:{x:10,y:10}});await W(150);ok('scrim closes',await ab.count()===0);
// 說明頁開著時不跳更新提示（面板開著算忙）
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'full ')+'pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

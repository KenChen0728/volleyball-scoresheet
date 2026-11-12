// 11/12 賽前紙本記錄表：名單頁印單張、紀錄與名單選多張或全選，存成 A3 PDF（一場一頁）
// node tools/t1112g.js（只有完整版；要先 python3 tools/fixture1111.py）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
const FIX=fs.readFileSync('/tmp/fix1111.json','utf8');
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const pdfInfo=f=>{const b=fs.readFileSync(f),t=b.toString('latin1');const m=/\/Type\/Pages\/Count (\d+)/.exec(t);return {head:t.slice(0,5),count:m?+m[1]:0,imgs:(t.match(/\/Subtype\/Image/g)||[]).length,size:b.length,a3:/MediaBox\[0 0 1191 842\]/.test(t)}};
(async()=>{const b=await chromium.launch();const errs=[];
  const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));
  await p.goto(URL);await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,FIX]);await p.reload();await W(300);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  // 一場新的、還沒挑邊：用範例比賽（有兩隊名單）
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  await p.locator('.nav [data-v=roster]').click();await W(300);
  const one=p.locator('#rnext [data-act=ppsel][data-v=cur]');
  ok('roster page button',await one.count()===1&&(await one.innerText()).includes('印紙本記錄表'));
  await one.click();await W(300);
  ok('sheet opens',(await p.locator('.sheet h2').innerText()).includes('賽前紙本記錄表'));
  ok('current preselected',await p.locator('.sheet .bkone[aria-pressed=true]').count()===1);
  ok('go label',(await p.locator('.sheet [data-act=ppgo]').innerText()).includes('1 場'));
  let [dl]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.click('.sheet [data-act=ppgo]')]);
  await dl.saveAs('/tmp/t1112g-1.pdf');let pi=pdfInfo('/tmp/t1112g-1.pdf');
  ok('single pdf',pi.head==='%PDF-'&&pi.count===1&&pi.imgs===1&&pi.a3&&pi.size>100000,pi);
  ok('single name',/^紙本記錄表_/.test(dl.suggestedFilename()),dl.suggestedFilename());
  await p.click('.sheet [data-act=close]');await W(200);
  // 再多一場還沒挑邊的（複製範例比賽），到紀錄與名單一次印兩場
  await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0];const c=JSON.parse(JSON.stringify(m));c.id='mcopy2';c.events.forEach(e=>{e.matchId='mcopy2';e.id='c2'+e.id});d.matches.push(c);d.currentId=null;localStorage.setItem(k,JSON.stringify(d));sessionStorage.clear()},KEY);
  await p.reload();await W(300);if(await ab.count()){await ab.first().click();await W(200)}
  await p.click('.herobtns [data-act=history]');await W(300);
  const sel=p.locator('[data-act=ppsel]');ok('history button',await sel.count()===1);
  await sel.click();await W(300);
  const rows=await p.locator('.sheet .bkone').count();
  ok('lists not-started only',rows===2,rows);
  ok('none selected',await p.locator('.sheet .bkone[aria-pressed=true]').count()===0&&await p.locator('.sheet [data-act=ppgo]').isDisabled());
  await p.click('.sheet [data-act=ppall]');await W(200);
  ok('all selected',await p.locator('.sheet .bkone[aria-pressed=true]').count()===2&&(await p.locator('.sheet [data-act=ppall]').innerText()).includes('全不選'));
  await p.locator('.sheet .bkone').first().click();await W(150);
  ok('toggle one off',await p.locator('.sheet .bkone[aria-pressed=true]').count()===1);
  await p.locator('.sheet .bkone').first().click();await W(150);
  [dl]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.click('.sheet [data-act=ppgo]')]);
  await dl.saveAs('/tmp/t1112g-2.pdf');pi=pdfInfo('/tmp/t1112g-2.pdf');
  ok('two-page pdf',pi.count===2&&pi.imgs===2&&pi.a3,pi);
  ok('multi name',/^紙本記錄表_\d{4}-\d{2}-\d{2}_2場\.pdf$/.test(dl.suggestedFilename()),dl.suggestedFilename());
  ok('done msg',(await p.locator('.sheet #xpmsg').innerText()).includes('下載'),await p.locator('.sheet #xpmsg').innerText());
  await ctx.close();
  // 學校版沒有這個功能
  console.log('t1112g pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

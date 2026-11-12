// 11/12 Android 備份分享：.json 改用 .txt 分享、分享被擋時自動改成下載、.txt 匯入得回來、iPhone 照舊 .json
// node tools/t1112e.js [網址] [資料 key]（要先 python3 tools/fixture1111.py）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
const FIX=fs.readFileSync('/tmp/fix1111.json','utf8');
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const UA={android:'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  ios:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'};
// 模擬分享：記下檔名和類型；mode=deny 時照 Android 對 .json 的做法丟 NotAllowedError
const mock=mode=>{window.__shared=[];navigator.canShare=()=>true;navigator.share=async d=>{const f=d.files[0];const t=await f.text();window.__shared.push({name:f.name,type:f.type,text:t});
  if(mode==='deny'||(mode==='android'&&!/\.(txt|csv|pdf|png|jpe?g)$/i.test(f.name)))throw new DOMException('Permission denied','NotAllowedError')}};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [plat,mode] of [['android','android'],['android','deny'],['ios','ios']]){
  const ctx=await b.newContext({viewport:{width:820,height:1180},userAgent:UA[plat],acceptDownloads:true,hasTouch:true});
  await ctx.addInitScript(mock,mode);
  const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));const tag=plat+'/'+mode+' ';
  await p.goto(URL);await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,FIX]);await p.reload();await W(250);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  await p.click('.herobtns [data-act=history]');await W(150);
  await p.click('.shead [data-act=bksel]');await W(100);
  await p.click('.bkone[data-id=mdone1]');await W(80);await p.click('[data-act=bkgo]');await W(150);
  let dl=null;const dlp=p.waitForEvent('download',{timeout:3000}).then(d=>dl=d).catch(()=>{});
  await p.click('[data-act=bksave]');await W(600);await dlp;
  const sh=await p.evaluate(()=>window.__shared);const msg=await p.locator('#rvmsg').innerText();
  if(mode==='android'){
    ok(tag+'shared as txt',sh.length===1&&/備份_.*\.txt$/.test(sh[0].name)&&sh[0].type==='text/plain',sh.map(x=>[x.name,x.type]));
    ok(tag+'content is backup json',sh.length===1&&JSON.parse(sh[0].text).matches.length===1);
    ok(tag+'no download',!dl);
    ok(tag+'shared msg',msg.includes('已分享'),msg);
    fs.writeFileSync('/tmp/t1112e-bk.txt',sh[0].text);
  }else if(mode==='deny'){
    ok(tag+'tried share',sh.length===1);
    ok(tag+'fell back to download',!!dl&&/\.txt$/.test(dl.suggestedFilename()),dl&&dl.suggestedFilename());
    ok(tag+'fallback msg',msg.includes('這台不能用分享')&&msg.includes('下載')&&await p.locator('#rvmsg [data-act=rpclip]').count()===1,msg);
  }else{
    ok(tag+'ios keeps json',sh.length===1&&/\.json$/.test(sh[0].name)&&sh[0].type==='application/json',sh.map(x=>[x.name,x.type]));
    ok(tag+'no download',!dl);
  }
  if(mode==='android'){
    // .txt 匯入得回來：清空後匯入
    await p.evaluate(k=>{localStorage.setItem(k,JSON.stringify({matches:[],cups:[]}))},KEY);await p.reload();await W(250);
    if(await ab.count()){await ab.first().click();await W(200)}
    await p.click('.herobtns [data-act=history]');await W(150);
    await p.setInputFiles('#import-file','/tmp/t1112e-bk.txt');await W(300);
    if(await p.locator('[data-act=impgo]').count()){await p.click('[data-act=impgo]');await W(200)}
    const d=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
    ok(tag+'txt imports',d.matches.length===1&&d.matches[0].id==='mdone1',d.matches.map(m=>m.id));
    // CSV 匯出：類型不帶 charset
    await p.evaluate(()=>{window.__shared=[]});
    await p.locator('.hrow[data-id=mdone1]').click();await W(300);
    if(!(await p.locator('.page [data-act=rpcsv]').count())&&await p.locator('.page [data-act=sheet][data-v=export]').count()){await p.click('.page [data-act=sheet][data-v=export]');await W(250)} // 11/12 完整版的試算表在「存檔／分享」裡
    const csv=p.locator('[data-act=rpcsv]');
    if(await csv.count()){await csv.first().click();await W(400);const s2=await p.evaluate(()=>window.__shared);
      ok(tag+'csv type plain',s2.length===1&&s2[0].type==='text/csv'&&/\.csv$/.test(s2[0].name),s2.map(x=>[x.name,x.type]))}
    else ok(tag+'csv button found',false);
  }
  await ctx.close();
}
console.log('t1112e pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

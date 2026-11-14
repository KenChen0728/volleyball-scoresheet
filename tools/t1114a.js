// 11/14 使用者：「裁判的代入直觀嗎？再檢查有沒有按鈕會讓人不知所措、選項太多不知道點哪個」（tools/patch_v96.py）
// 完整版：裁判頁點已經框起來的角色不會取消；名字清單上面寫點名字會填進哪個角色；存檔／分享的整張記錄表是黃色，
// PDF 和圖片寫什麼時候選。兩版：陣容還沒填號碼時「全隊…移一格」變淡、點了說原因，填了才能轉。
// node tools/t1114a.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(w,h,mobile=true)=>{const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(300);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(150)}return [ctx,p]};
const store=async(p,f)=>{await p.evaluate(([k,d])=>{localStorage.clear();localStorage.setItem(k,d)},[KEY,fs.readFileSync(f,'utf8')]);await p.reload();await W(400);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(150)}};
const now=async p=>(await p.locator('.refpick .refnow').count())?(await p.locator('.refpick .refnow').innerText()).trim():'';
const pressed=async(p,v)=>(await p.locator(`[data-act=refrole][data-v=${v}]`).getAttribute('aria-pressed'))==='true';
const role=async(p,v)=>(await p.locator(`[data-act=refrole][data-v=${v}] b`).innerText()).trim();

if(!SCHOOL){
  // A. 資料夾裡的比賽：第一場地有名單
  if(fs.existsSync('/tmp/fix1113.json')){const [ctx,p]=await open(402,874);await store(p,'/tmp/fix1113.json');
    await p.click('[data-act=new]');await W(250);await p.click('[data-act=newpick][data-id=cupsample]');await p.click('[data-act=newgo]');await W(400);
    await p.fill('#i-court','第一場地');await p.locator('#i-court').dispatchEvent('change');await W(150);
    await p.locator('.nav [data-v=refs]').click();await W(300);
    ok('stephint',(await p.locator('.refpick .stephint').innerText()).includes('點名字會填進框起來的角色'));
    ok('first role framed',await pressed(p,'ref1'));
    ok('line: fills 第一裁判員',await now(p)==='點名字，填進「第一裁判員」',await now(p));
    // 照提示先點角色（已經框起來的那個）：不會取消，再點名字就填進去
    await p.click('[data-act=refrole][data-v=ref1]');await W(150);
    ok('tap framed role: stays',await pressed(p,'ref1'));
    await p.click('.refnames [data-act=refname][data-v=王大明]');await W(200);
    ok('name filled',await role(p,'ref1')==='王大明',await role(p,'ref1'));
    ok('no warning',await p.locator('.refpick .warning').count()===0);
    ok('next role framed',await pressed(p,'ref2'));
    ok('line follows next role',await now(p)==='點名字，填進「第二裁判員」',await now(p));
    // 點已經有人的角色：換人或清空
    await p.click('[data-act=refrole][data-v=ref1]');await W(150);
    ok('line: change or clear',await now(p)==='點別的名字換人，或按「清空」',await now(p));
    await p.click('.refnames [data-act=refname][data-v=李小華]');await W(200);
    ok('changed',await role(p,'ref1')==='李小華',await role(p,'ref1'));
    // 其他角色用打字填完
    for(const [r,n] of [['ref2','甲'],['scorer','乙'],['ascorer','丙'],['lj1','丁'],['lj2','戊']]){await p.click(`[data-act=refrole][data-v=${r}]`);await W(80);await p.fill('#ref-type',n);await p.press('#ref-type','Enter');await W(150)}
    ok('all filled',await role(p,'lj2')==='戊'&&await role(p,'ref2')==='甲');
    ok('no role framed when all filled',await p.locator('[data-act=refrole][aria-pressed=true]').count()===0);
    ok('line: all filled',(await now(p)).startsWith('六個角色都填好了'),await now(p));
    // 沒選角色時點名字：只有一行提醒（不會兩行一樣的字）
    await p.click('.refnames [data-act=refname][data-v=陳志強]');await W(150);
    ok('warning shown',(await p.locator('.refpick .warning').innerText()).includes('先點上面要改的角色'));
    ok('line hidden while warning',await now(p)==='',await now(p));
    // 搬人之後沒有框起來的角色：寫先點角色
    await p.click('[data-act=refrole][data-v=lj2]');await W(100);await p.click('.refnames [data-act=refname][data-v=李小華]');await W(200);
    ok('moved',await role(p,'lj2')==='李小華'&&await role(p,'ref1')==='未填',[await role(p,'lj2'),await role(p,'ref1')]);
    ok('line after move',await now(p)==='先點上面要填的角色',await now(p));
    // 其他場地收起來時，名字看不到：寫打名字
    await p.click('[data-act=refrole][data-v=ref1]');await W(100);
    ok('line with list',await now(p)==='點名字，填進「第一裁判員」',await now(p));
    await ctx.close()}
  // B. 沒放資料夾的比賽：只能打名字
  {const [ctx,p]=await open(402,874);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
    await p.locator('.nav [data-v=refs]').click();await W(250);
    ok('no folder: type line',await now(p)==='打名字，按「填入」，填進「第一裁判員」',await now(p));
    await ctx.close()}
  // C. 打完的比賽：記錄表的「裁判」分頁也有這一行；存檔／分享
  if(fs.existsSync('/tmp/fix1113.json')){const [ctx,p]=await open(1366,768,false);await store(p,'/tmp/fix1113.json');
    await p.click('[data-act=history]');await W(300);await p.locator('[data-act=open]',{hasText:'範例藍隊'}).first().click();await W(400);
    await p.locator('[data-act=rtab]',{hasText:'裁判'}).click();await W(250);
    ok('sheet tab has line',(await now(p)).length>0,await now(p));
    await p.locator('[data-act=rtab]',{hasText:'結果'}).click();await W(250);
    await p.locator('[data-act=sheet]',{hasText:'存檔'}).first().click();await W(250);
    const all=p.locator('.sheet [data-act=xpitem][data-v=all]');
    ok('full sheet is the main choice',(await all.getAttribute('class')).includes('primary'));
    const bg=await all.evaluate(e=>[getComputedStyle(e).backgroundColor,getComputedStyle(document.querySelector('.sheet .mbtn:not(.primary)')).backgroundColor]);
    ok('main choice looks different',bg[0]!==bg[1],bg);
    ok('only one main',await p.locator('.sheet .primary').count()===1);
    await all.click();await W(250);
    const t=await p.locator('.sheet .xpfmt').innerText();
    ok('pdf says print',/存成 PDF\s*要列印選這個/.test(t),t);ok('image says LINE',/存成圖片\s*要傳 LINE 選這個/.test(t),t);
    const dl=p.waitForEvent('download',{timeout:20000}).catch(()=>null);
    await p.click('.sheet [data-act=xpsave][data-v=png]');const d=await dl;
    // file:// 開的頁面，Chromium 回報的下載檔名是 "download"（舊版也一樣），改看畫面上寫的檔名
    const xm=await p.locator('#xpmsg').innerText().catch(()=>'');ok('image still saves',!!d&&/整張記錄表\.png/.test(xm),[d&&d.suggestedFilename(),xm]);
    await ctx.close()}
}

// D. 兩版：陣容頁還在填號碼時不放「全隊…移一格」（還沒填時按了沒反應），六格都填好才出現，轉得動
{const [ctx,p]=await open(402,874);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(300);
  await p.click('[data-act=rnext]');await W(250);await p.locator('[data-act=ball]').first().click();await W(200);
  await p.locator('.nav [data-v=lineup]').click();await W(300);
  ok('no rotate while empty',await p.locator('.rotb').count()===0);
  for(let i=0;i<5;i++){await p.locator('[data-act=fill]').first().click();await W(150)}
  ok('no rotate with 5 filled',await p.locator('.rotb').count()===0);
  await p.locator('[data-act=fill]').first().click();await W(200);
  ok('rotate after 6 filled',await p.locator('.rotb button[data-act=lurot]').count()===2);
  const cells=async()=>await p.evaluate(()=>[...document.querySelectorAll('.lugrid [data-act=cell]')].map(x=>x.innerText.replace(/\s+/g,' ').trim()));
  const c1=await cells();await p.locator('.rotb button[data-v=cw]').click();await W(250);
  ok('rotate works',JSON.stringify(await cells())!==JSON.stringify(c1),[c1,await cells()]);
  await ctx.close()}

ok('no page errors',!errs.length,errs.slice(0,3));
console.log((SCHOOL?'school':'full')+' pass '+pass+' fail '+fail);
await b.close();process.exit(fail?1:0)})();

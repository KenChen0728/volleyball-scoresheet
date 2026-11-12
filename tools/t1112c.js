// 11/12 新風格第一批：設定、刪除的位置、卡片、各局、空的 L 格、判罰小字、紅色只給救不回來的
// node tools/t1112c.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  // 主畫面：設定和關於並排，設定裡有提示字和外觀
  ok(tag+'home settings button',await p.locator('.homefoot [data-act=settings]').count()===1);
  await p.click('.homefoot [data-act=settings]');await W(250);
  ok(tag+'settings: hints and theme',await p.locator('.sheet [data-act=hints]').count()===2&&await p.locator('.sheet [data-act=theme]').count()===3);
  await p.click('.sheet [data-act=theme][data-v=dark]');await W(150);
  ok(tag+'settings: dark applied',await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='dark');
  ok(tag+'settings: selected has check',await p.evaluate(()=>getComputedStyle(document.querySelector('.sheet [data-act=theme][aria-pressed=true]'),'::before').content).then(c=>c.indexOf('✓')>=0));
  await p.click('.sheet [data-act=theme][data-v=auto]');await W(150);
  await p.click('.sheet [data-act=aboutclose]');await W(200);
  ok(tag+'settings closed',await p.locator('.sheet').count()===0);
  // 開一場範例比賽：進行中的卡片沒有刪除
  await flow.start(p,{serve:'t1'});await W(250);
  if(!SCHOOL){
    // 空的 L 格不顯示（範例藍隊只有一位自由球員時第二格留白）
    const empty=await p.evaluate(()=>[...document.querySelectorAll('.lc.empty')].map(e=>getComputedStyle(e).visibility));
    ok(tag+'empty L hidden',empty.every(v=>v==='hidden'),empty);
  }else{
    const strips=await p.evaluate(()=>[...document.querySelectorAll('.strip')].map(e=>e.classList.contains('nolib')));
    ok(tag+'school: strips marked nolib',strips.length>0&&strips.every(Boolean),strips);
  }
  // 判罰：出局、出場底下沒有小字
  await p.click('[data-act=penopen]');await W(200);await p.click('.sheet [data-act=penteam][data-team=t1]');await W(200);
  const sm=await p.evaluate(()=>[...document.querySelectorAll('.sheet small')].map(e=>e.textContent).filter(t=>/一手|兩手/.test(t)));
  ok(tag+'penalty: no small text',sm.length===0,sm);
  await p.locator('.sheet [data-act=penclose]').last().click();await W(250);
  ok(tag+'penalty closed',await p.locator('.sheet').count()===0);
  // 離開這場比賽：比賽頁的「其他」→ 離開 → 一般按鈕確定、紅框刪除
  await p.click('[data-act=sheet][data-v=more]');await W(200);
  await p.click('.sheet [data-act=sheet][data-v=leave]');await W(200);
  ok(tag+'leave: primary is not red',await p.evaluate(()=>{const b=document.querySelector('.sheet [data-act=home]');return !!b&&!b.classList.contains('danger')}));
  ok(tag+'leave: delete link',await p.locator('.sheet .dellink[data-act=leavedel]').count()===1);
  await p.click('.sheet [data-act=leavedel]');await W(200);
  ok(tag+'delete confirm has back',await p.locator('.sheet [data-act=sheetback],.sheet .sheetback').count()>=1);
  ok(tag+'delete confirm red',await p.locator('.sheet .danger[data-act=del-yes]').count()===1);
  // 返回不刪，再進來刪
  await p.locator('.sheet .sheetback').first().click();await W(200);
  ok(tag+'back to leave sheet',await p.locator('.sheet .dellink[data-act=leavedel]').count()===1);
  await p.click('.sheet [data-act=home]');await W(300);
  ok(tag+'left: live card, no delete',await p.locator('.rmain').count()===1&&await p.locator('.rrow [data-act=del-ask],.rrow .rdel').count()===0);
  await p.locator('.rmain').first().click();await W(300);
  await p.click('[data-act=sheet][data-v=more]');await W(200);await p.click('.sheet [data-act=sheet][data-v=leave]');await W(200);
  await p.click('.sheet [data-act=leavedel]');await W(200);await p.click('.sheet [data-act=del-yes]');await W(300);
  ok(tag+'deleted live match',await p.locator('.rmain').count()===0&&await p.evaluate(k=>JSON.parse(localStorage.getItem(k)).matches.length,KEY)===0);
  // 紀錄與名單：卡片和「打開 ›」，比賽列沒有刪除
  if(!SCHOOL){
    await p.evaluate(([k,v])=>{localStorage.setItem(k,v)},[KEY,require('fs').readFileSync('/tmp/fix1111.json','utf8')]).catch(()=>{});
  }
  await p.reload();await W(300);if(await ab.count()){await ab.first().click();await W(200)}
  if(await p.locator('.bar [data-act=home]').count()){await p.click('.bar [data-act=home]');await W(200)}
  await p.click('.herobtns [data-act=history]');await W(300);
  const rows=await p.locator('.hrow').count();
  if(rows){
    ok(tag+'history: cards with open label',await p.locator('.hrow.card .hgo, .hrow.cupcard .cupgo').count()===rows,rows);
    ok(tag+'history: open label text',(await p.locator('.hrow .hgo, .hrow .cupgo').allInnerTexts()).every(t=>t.indexOf('打開')>=0));
    ok(tag+'history: no delete',await p.locator('.hrow [data-act=del-ask]').count()===0);
  }
  if(!SCHOOL){
    // 打完的比賽：各局按鈕帶最後一局，下面可以選局；刪除是紅框小按鈕
    await p.locator('.hrow[data-id=mdone1]').click();await W(400);
    const del=p.locator('.linkbtn.dangerlink[data-v=delmatch]');
    ok(tag+'done: delete outlined',await del.count()===1&&await del.evaluate(e=>{const c=getComputedStyle(e);return parseFloat(c.borderTopWidth)>=1&&c.textDecorationLine==='none'}));
    await p.locator('.sheettabs [data-act=rtab][data-v^=s]').first().click();await W(250);
    const sp=await p.locator('.setpick [data-act=rtab]').evaluateAll(a=>a.map(e=>e.getAttribute('data-v')));
    ok(tag+'done: set pick',sp.length>=2,sp);
    await p.click('.setpick [data-v=s1]');await W(250);
    ok(tag+'done: set 1 shown',(await p.locator('.setpick [aria-pressed=true]').getAttribute('data-v'))==='s1'&&(await p.locator('.sheettabs [aria-pressed=true]').innerText()).includes('各局'));
  }
  await p.context().close();
}
console.log((SCHOOL?'school ':'')+'t1112c pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

// 11/12 晚上：「紀錄與名單」按「選擇」後，下面一排備份、移到資料夾、印紙本、刪除；比賽中「離開這場比賽」沒有刪除
// node tools/t1112j.js [網址] [資料 key]（要先 python3 tools/fixture1111.py；學校版：school/index.html vb-school-v2）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
const SCHOOL=/school/.test(URL);
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  const db=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  await p.goto(URL);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');
  const loadFix=async f=>{await p.evaluate(([k,v])=>{localStorage.clear();sessionStorage.clear();localStorage.setItem(k,v);localStorage.setItem('volleyball-prefs',JSON.stringify({intro:1,hide:1}))},[KEY,fs.readFileSync(f,'utf8')]);await p.reload();await W(400);if(await ab.count()){await ab.first().click();await W(200)}};
  // 比賽中：其他 → 離開這場比賽，沒有刪除（第 2 局打到一半的示意資料）
  await loadFix('/home/claude/volleyball-scoresheet/tools/style1112/fix2.json');
  await p.click('.rmain[data-act=open]');await W(400);
  await p.click('[data-act=sheet][data-v=more]');await W(200);await p.click('.sheet [data-act=sheet][data-v=leave]');await W(200);
  ok(tag+'leave: no delete',await p.locator('.sheet [data-act=leavedel],.sheet .dellink').count()===0);
  ok(tag+'leave: keep and leave',await p.locator('.sheet [data-act=home]').count()===1);
  await p.click('.sheet [data-act=home]');await W(300);
  await loadFix('/tmp/fix1111.json');
  if(await p.locator('.bar [data-act=home]').count()){await p.click('.bar [data-act=home]');await W(200)}
  // 開一場新的（還沒開賽，可以印賽前紙本）
  await p.click('[data-act=new]');await W(300);
  if(await p.locator('.sheet [data-act=newpick]').count()){await p.locator('.sheet [data-act=newpick]').last().click();await W(150);await p.click('.sheet [data-act=newgo]');await W(300)}
  await p.fill('#i-name','測試盃');await p.locator('#i-name').blur();await W(100);
  await p.click('.bar [data-act=home]');await W(300);
  const fresh=(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).matches.map(m=>m.id).filter(id=>!/^m(live|done)/.test(id))[0];
  await p.click('.herobtns [data-act=history]');await W(300);
  ok(tag+'no separate paper section',await p.locator('.page [data-act=ppsel]').count()===0);
  // 進入選擇
  await p.click('.shead [data-act=bksel]');await W(250);
  const bar=p.locator('.selbar');
  ok(tag+'bar shown',await bar.isVisible());
  const acts=await p.locator('.selacts button').evaluateAll(bs=>bs.map(x=>x.getAttribute('data-act')+(x.disabled?'(x)':'')));
  ok(tag+'actions',JSON.stringify(acts)===JSON.stringify(SCHOOL?['bkgo(x)','selmove(x)','seldel(x)']:['bkgo(x)','selmove(x)','selpp(x)','seldel(x)']),acts);
  ok(tag+'count none',(await p.locator('.selcount').textContent()).includes('還沒選'));
  const all=(await db()).matches.map(m=>m.id);
  const pick=async id=>{await p.click(`[data-act=bkpick][data-id=${id}]`);await W(120)};
  await pick('mdone2');await pick('mdone3');
  ok(tag+'count 2',(await p.locator('.selcount').textContent()).includes('已選 2 場'));
  ok(tag+'enabled',await p.locator('.selacts button:disabled').count()===0);
  // 刪除鍵是紅框、在最右邊
  const del=await p.evaluate(()=>{const bs=[...document.querySelectorAll('.selacts button')],d=bs[bs.length-1];return {last:d.getAttribute('data-act'),color:getComputedStyle(d).color,bw:getComputedStyle(d).borderTopWidth}});
  ok(tag+'delete last, plain outline (goes to trash, 11/13)',del.last==='seldel'&&del.bw==='1px',del);
  // 移到資料夾
  await p.click('.selacts [data-act=selmove]');await W(200);
  const folders=await p.locator('.sheet [data-act=selmoveto]').evaluateAll(bs=>bs.map(x=>x.getAttribute('data-id')));
  const cups=(await db()).cups.map(c=>c.id);
  ok(tag+'folders listed',JSON.stringify(folders)===JSON.stringify(cups.concat([''])),[folders,cups]);
  const target=cups[cups.length-1];
  await p.click(`.sheet [data-act=selmoveto][data-id="${target}"]`);await W(250);
  let d=await db();
  ok(tag+'moved',['mdone2','mdone3'].every(id=>d.matches.find(m=>m.id===id).cup===target),d.matches.map(m=>[m.id,m.cup]));
  ok(tag+'select mode closed',await p.locator('.selbar').count()===0);
  ok(tag+'moved message',(await p.locator('#rvmsg').textContent()).includes('已把 2 場移到'));
  // 改成未分類
  await p.click('.shead [data-act=bksel]');await W(200);await pick('mdone3');
  await p.click('.selacts [data-act=selmove]');await W(200);
  ok(tag+'current folder marked',await p.locator(`.sheet [data-act=selmoveto][data-id="${target}"][aria-current=true]`).count()===1);
  await p.click('.sheet [data-act=selmoveto][data-id=""]');await W(250);
  d=await db();ok(tag+'unfiled',!d.matches.find(m=>m.id==='mdone3').cup);
  // 印紙本（完整版）：只印還沒開賽的，略過已經開打的
  if(!SCHOOL){
    await p.click('.shead [data-act=bksel]');await W(200);await pick(fresh);await pick('mdone1');
    await p.click('.selacts [data-act=selpp]');await W(250);
    const pre=await p.evaluate(()=>[...document.querySelectorAll('.sheet [data-act=pptoggle][aria-pressed=true]')].map(x=>x.getAttribute('data-id')));
    const printable=await p.evaluate(()=>[...document.querySelectorAll('.sheet [data-act=pptoggle]')].map(x=>x.getAttribute('data-id')));
    ok(tag+'pp sheet open',await p.locator('.sheet [data-act=ppgo]').count()===1);
    ok(tag+'pp preselected only printable',pre.length===1&&pre[0]===fresh&&!printable.includes('mdone1'),[pre,printable,fresh]);
    ok(tag+'pp skip note',(await p.locator('.sheet').textContent()).includes('略過'));
    await p.click('.sheet [data-act=close]');await W(200);
    ok(tag+'still selecting after close',await p.locator('.selbar').count()===1);
    await p.click('.bktools [data-act=bkcancel]');await W(200);
  }
  // 刪除：列出哪幾場、狀態，取消不刪，確定才刪
  await p.click('.shead [data-act=bksel]');await W(200);await pick('mlive1');await pick('mdone1');
  await p.click('.selacts [data-act=seldel]');await W(200);
  const rows=await p.locator('.sheet .dellist .hrow').evaluateAll(xs=>xs.map(x=>x.textContent));
  ok(tag+'delete lists 2',rows.length===2,rows);
  ok(tag+'delete shows status',rows.some(r=>/還沒打完|還沒開賽/.test(r))&&rows.some(r=>r.includes('打完了')),rows);
  ok(tag+'delete confirm not red (goes to trash, 11/13)',await p.locator('.sheet [data-act=seldelyes]:not(.danger)').count()===1);
  await p.click('.sheet [data-act=close]');await W(200);
  d=await db();ok(tag+'cancel keeps',d.matches.length===all.length);
  await p.click('.selacts [data-act=seldel]');await W(200);await p.click('.sheet [data-act=seldelyes]');await W(300);
  d=await db();
  ok(tag+'deleted 2',d.matches.length===all.length-2&&!d.matches.some(m=>m.id==='mlive1'||m.id==='mdone1'),d.matches.map(m=>m.id));
  ok(tag+'current cleared',d.currentId!=='mlive1');
  ok(tag+'deleted message',(await p.locator('#rvmsg').textContent()).includes('已刪除 2 場'));
  // 全選、全不選
  await p.click('.shead [data-act=bksel]');await W(200);await p.click('.bktools [data-act=bkall]');await W(150);
  ok(tag+'select all',(await p.locator('.selcount').textContent()).includes('已選 '+(all.length-2)+' 場'));
  await p.click('.bktools [data-act=bkall]');await W(150);
  ok(tag+'select none',(await p.locator('.selacts button:disabled').count())===(SCHOOL?3:4));
  // 備份照舊
  await p.click(`[data-act=bkpick][data-id=mdone2]`);await W(120);await p.click('.selacts [data-act=bkgo]');await W(200);
  ok(tag+'backup sheet',await p.locator('.sheet [data-act=bksave]').count()===1);
  await p.click('.sheet [data-act=close]');await W(200);
  await p.context().close();
}
console.log('t1112j pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

// 11/12 裁判：清空放在角色下面、已排的名字點了搬過來、沒選角色時不會自動填進空的角色
// node tools/t1112d.js（只有完整版有裁判頁；要先 python3 tools/fixture1111.py）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  const info=async()=>p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0];const o={};m.events.filter(e=>e.type==='INFO_SET').forEach(e=>{o[e.data.field]=e.data.value});return o},KEY);
  const role=v=>p.locator(`[data-act=refrole][data-v=${v}]`);
  const type=async n=>{await p.fill('#ref-type',n);await p.click('[data-act=reftype]');await W(150)};
  // A. 範例比賽的裁判頁，打字填
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(200);
  await p.locator('.nav [data-v=refs]').click();await W(200);
  ok(tag+'first role selected',await role('ref1').getAttribute('aria-pressed')==='true');
  ok(tag+'no clear bar when empty',await p.locator('.refsel').count()===0);
  for(const n of ['甲','乙','丙','丁'])await type(n);
  let I=await info();ok(tag+'filled in order',I.ref1==='甲'&&I.ref2==='乙'&&I.scorer==='丙'&&I.ascorer==='丁',I);
  ok(tag+'auto next is line judge 1',await role('lj1').getAttribute('aria-pressed')==='true');
  // 丁 其實是司線員 1：選著司線員 1 打「丁」→ 從助理搬過來
  await type('丁');I=await info();
  ok(tag+'moved by typing',I.ascorer===''&&I.lj1==='丁',I);
  ok(tag+'move note',(await p.locator('.refpick p.good').innerText()).includes('丁 從「助理記錄員」改到「司線員 1」'));
  ok(tag+'no role after move',await p.locator('[data-act=refrole][aria-pressed=true]').count()===0);
  // 沒選角色時打名字：請他先點角色，不會自動填進助理記錄員
  await type('戊');I=await info();
  ok(tag+'no role: ask first',(await p.locator('.refpick p.warning').innerText()).includes('先點上面要填的角色')&&!I.ascorer&&I.lj2!=='戊',I);
  // 點已填的角色：下面有「角色：名字　清空」
  await role('ref1').click();await W(150);
  ok(tag+'clear bar',(await p.locator('.refsel').innerText()).replace(/\s+/g,'').includes('第一裁判員：甲清空'));
  await p.click('.refsel [data-act=refclear]');await W(150);I=await info();
  ok(tag+'cleared',I.ref1==='',I);
  ok(tag+'bar gone, role kept',await p.locator('.refsel').count()===0&&await role('ref1').getAttribute('aria-pressed')==='true');
  ok(tag+'old link gone',await p.locator('.refpick .linkbtn[data-act=refclear]').count()===0);
  // B. 資料夾裡的比賽（有場地的裁判名單），點名字搬
  await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,fs.readFileSync('/tmp/fix1111.json','utf8')]);await p.reload();await W(300);
  if(await ab.count()){await ab.first().click();await W(200)}
  await p.locator('.rmain',{hasText:'恆春'}).click();await W(300);
  // 這場停在第 2 局陣容，從步驟列進裁判頁
  await p.locator('.nav [data-v=refs]').click();await W(200);
  ok(tag+'chips',await p.locator('.refname').count()>=4,await p.locator('.refname').count());
  await role('ref1').click();await W(100);if(await role('ref1').getAttribute('aria-pressed')!=='true'){await role('ref1').click();await W(100)}
  await p.locator('.refname',{hasText:'王大明'}).click();await W(150);I=await info();
  ok(tag+'chip fills',I.ref1==='王大明',I);
  const chip=p.locator('.refname',{hasText:'王大明'});
  ok(tag+'used chip still enabled',await chip.isEnabled()&&(await chip.innerText()).includes('第一裁判'));
  await role('lj1').click();await W(100);if(await role('lj1').getAttribute('aria-pressed')!=='true'){await role('lj1').click();await W(100)}
  ok(tag+'chip label says move',(await chip.getAttribute('aria-label')||'').includes('點了改排司線員 1'),await chip.getAttribute('aria-label'));
  await chip.click();await W(150);I=await info();
  ok(tag+'chip moves',I.ref1===''&&I.lj1==='王大明',I);
  ok(tag+'chip tag updated',(await p.locator('.refname',{hasText:'王大明'}).innerText()).includes('司線員 1'));
  await p.context().close();
}
console.log('t1112d pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

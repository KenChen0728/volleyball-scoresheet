// 11/12 下午：裁判名字沒按「填入」就換角色或離開，字不會不見；名單的數字鍵盤開著時不出現「下一步」
// node tools/t1112h.js [網址] [資料 key]（學校版：school/index.html vb-school-v2）
const {chromium}=require('playwright');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  const info=async()=>p.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));const m=d.matches.filter(x=>x.id===d.currentId)[0];const o={};m.events.filter(e=>e.type==='INFO_SET').forEach(e=>{o[e.data.field]=e.data.value});return o},KEY);
  const role=v=>p.locator(`[data-act=refrole][data-v=${v}]`);
  const pressed=async v=>await role(v).getAttribute('aria-pressed')==='true';
  const pick=async v=>{if(!await pressed(v)){await role(v).click();await W(120)}};
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(200)}
  await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await W(200);
  const hasRefs=await p.locator('.nav [data-v=refs]').count()>0;
  if(hasRefs){
    await p.locator('.nav [data-v=refs]').click();await W(200);
    await pick('ref1');
    // A. 打了沒按「填入」就點別的角色：填進原本的角色，再換過去
    await p.fill('#ref-type','甲');await role('scorer').click();await W(150);
    let I=await info();
    ok(tag+'saved on role switch',I.ref1==='甲',I);
    ok(tag+'switched to tapped role',await pressed('scorer'));
    ok(tag+'input cleared after save',await p.inputValue('#ref-type')==='');
    // B. 點的剛好是自動跳到的下一個空角色，也要停在那個角色（不能變成取消選取）
    await p.fill('#ref-type','乙');await role('ascorer').click();await W(150);
    I=await info();ok(tag+'saved again',I.scorer==='乙',I);
    ok(tag+'next empty role stays selected',await pressed('ascorer'));
    // C. 打了沒按「填入」就點步驟列離開
    await p.fill('#ref-type','丙');await p.locator('.nav [data-v=roster]').click();await W(200);
    I=await info();ok(tag+'saved on leaving page',I.ascorer==='丙',I);
    await p.locator('.nav [data-v=refs]').click();await W(200);
    // D. 點同一個角色（取消選取）也先存
    await pick('lj1');
    await p.fill('#ref-type','丁');await role('lj1').click();await W(150);
    I=await info();ok(tag+'saved when tapping same role',I.lj1==='丁',I);
    // E. 沒選角色時打字再點角色：字不會不見（測試版留在框裡，再按填入；正式版會填進第一個空的角色）
    const none=await p.locator('[data-act=refrole][aria-pressed=true]').count();
    await p.fill('#ref-type','戊');await role('ref2').click();await W(150);
    I=await info();const kept=await p.inputValue('#ref-type');
    ok(tag+'not lost without role',Object.values(I).includes('戊')||kept==='戊',[none,kept,I]);
    if(kept==='戊'){ok(tag+'ref2 selected',await pressed('ref2'));await p.click('[data-act=reftype]');await W(150);I=await info();ok(tag+'then fill works',I.ref2==='戊',I)}
    // F. 「清空」時打的字留在框裡，不會填進去
    await pick('ref1');
    await p.fill('#ref-type','庚');await p.locator('[data-act=refclear]').first().click();await W(150);
    I=await info();ok(tag+'clear keeps typed text',I.ref1===''&&await p.inputValue('#ref-type')==='庚'&&!Object.values(I).includes('庚'),[I,await p.inputValue('#ref-type')]);
    await p.click('[data-act=reftype]');await W(150);I=await info();ok(tag+'fill after clear',I.ref1==='庚',I);
    // G. Enter 照常填入
    await pick('lj2');
    await p.fill('#ref-type','己');await p.press('#ref-type','Enter');await W(150);
    I=await info();ok(tag+'enter fills',I.lj2==='己',I);
    // H. 沒打字時點角色，照原本的樣子切換
    await role('ref2').click();await W(120);ok(tag+'plain switch',await pressed('ref2'));
    await role('ref2').click();await W(120);ok(tag+'plain toggle off',!(await pressed('ref2')));
  }
  // I. 名單：數字鍵盤開著時不出現「下一步」，按「完成」才出現
  await p.locator('.nav [data-v=roster]').click();await W(200);
  const nxt=()=>p.locator('#rnext [data-act=rnext]').count();
  ok(tag+'next shown when keypad closed',await nxt()===1,await nxt());
  await p.locator('[data-act=slot][data-team=t1][data-kind=reg][data-no=""]').first().click();await W(150);
  ok(tag+'keypad open',await p.locator('.kp [data-act=kpclose]').count()===1);
  ok(tag+'next hidden while typing',await nxt()===0&&!(await p.locator('#rnext').isVisible()));
  await p.click('.kp [data-act=key][data-v="5"]');await p.click('.kp [data-act=key][data-v="5"]');await W(100);
  ok(tag+'still hidden after keys',await nxt()===0);
  await p.click('.kp [data-act=add]');await W(150);
  ok(tag+'still hidden after next cell',await nxt()===0);
  await p.click('.kp [data-act=kpclose]');await W(150);
  ok(tag+'next back after done',await nxt()===1&&await p.locator('#rnext').isVisible());
  // 點已經有號碼的格（隊長、自由、移除）時也一樣
  await p.locator('[data-act=slot][data-team=t2][data-kind=reg]:not([data-no=""])').first().click();await W(150);
  ok(tag+'hidden while editing a player',await p.locator('.kp').count()===1&&await nxt()===0);
  await p.click('.kp [data-act=kpclose]');await W(150);
  ok(tag+'back again',await nxt()===1);
  await p.context().close();
}
console.log('t1112h pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

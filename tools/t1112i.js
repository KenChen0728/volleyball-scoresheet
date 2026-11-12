// 11/12 傍晚：手機直放時名單的數字鍵盤壓矮、打字時收起說明；平板照舊是正方形的鍵、說明不收
// node tools/t1112i.js [網址] [資料 key]（學校版：school/index.html vb-school-v2）
const {chromium}=require('playwright');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
// 402x743：使用者的 iPhone 加到主畫面、扣掉上下色帶的大小
for(const [w,h,phone] of [[402,743,true],[360,640,true],[820,1180,false],[874,402,false]]){
  const land=w>h; // 手機橫放：鍵盤在旁邊、說明本來就不顯示，只確認鍵的形狀沒變
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
  const ab=p.locator('.sheet.about [data-act=aboutclose]');if(await ab.count()){await ab.first().click();await W(150)}
  await p.click('.herocta');await W(100);await p.locator('.nav [data-v=roster]').click();await W(150);
  const hint=()=>p.locator('.stephint').isVisible();
  if(!land)ok(tag+'hint shown before typing',await hint());
  await p.locator('[data-act=slot][data-team=t2][data-kind=reg][data-no=""]').first().click();await W(150);
  const key=await p.locator('.kp .pad [data-act=key][data-v="1"]').boundingBox();
  if(phone){
    ok(tag+'keys 46px',Math.round(key.height)===46,key);
    ok(tag+'keys still >=44 wide',key.width>=44,key);
    ok(tag+'hint hidden while typing',!(await hint()));
  }else{
    ok(tag+'keys unchanged (square)',Math.abs(key.height-key.width)<2,key);
    if(!land)ok(tag+'hint kept',await hint());
  }
  // 打 11 位：正在輸入的那格不能被鍵盤蓋住
  const nums=[8,6,9,3,4,2,1,11,5,7,10];
  for(const n of nums){for(const c of String(n))await p.click(`.kp [data-act=key][data-v="${c}"]`);if(String(n).length===1)await p.click('.kp [data-act=add]');await W(60)}
  const r=await p.evaluate(()=>{const kp=document.querySelector('.kp').getBoundingClientRect(),on=document.querySelector('.num.on').getBoundingClientRect(),pg=document.querySelector('.page').getBoundingClientRect(),nm=document.querySelector('#n-t2').getBoundingClientRect();
    return {kpTop:Math.round(kp.top),onBottom:Math.round(on.bottom),onTop:Math.round(on.top),pgTop:Math.round(pg.top),nameVisible:nm.top>=pg.top-1&&nm.bottom<=kp.top}});
  if(!land)ok(tag+'active cell above keypad',r.onBottom<=r.kpTop&&r.onTop>=r.pgTop,r);
  if(w===402)ok(tag+'team name still visible on the user phone',r.nameVisible,r);
  // 按完成：說明回來
  await p.click('.kp [data-act=kpclose]');await W(150);
  if(!land)ok(tag+'hint back after done',await hint());
  ok(tag+'keypad closed',await p.locator('.kp').count()===0);
  await p.context().close();
}
console.log('t1112i pass',pass,'fail',fail,'errs',JSON.stringify(errs));process.exit(fail||errs.length?1:0);
})();

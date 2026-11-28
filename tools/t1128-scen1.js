module.exports=async({R,V,pt,ok,W,shot})=>{
  const S=async n=>{await W(300);await R.screenshot({path:'/tmp/w/R-'+n+'.png'})};
  const acts=async()=>R.evaluate(()=>[...document.querySelectorAll('.sheet button,.kp button')].map(e=>e.getAttribute('data-act')+':'+e.textContent.trim().slice(0,10)).join(' | '));
  // 自由球員點錯
  await R.click('[data-act=libcell][data-team=t1]');await W(200);
  await R.click('.pcourt .pc.t1[data-pos="4"]');await W(500);await S('lib-in');
  const lb=R.locator('[data-act=libwrong][data-team=t1]');ok('libwrong button on strip',await lb.count()>=1);
  await lb.first().click();await W(300);await S('libwrong');console.log(await acts());
  await R.click('[data-act=libundo]');await W(500);await S('lib-undone');
  ok('libero gone from court',!(await R.evaluate(()=>[...document.querySelectorAll('.pcourt .pc.t1 b')].map(e=>e.textContent)).then(a=>a.includes('12'))));
  // 正確的人再換上去（同一個死球）
  await R.click('[data-act=libcell][data-team=t1]');await W(200);await R.click('.pcourt .pc.t1[data-pos="5"]');await W(500);
  ok('libero now in',(await R.evaluate(()=>[...document.querySelectorAll('.pcourt .pc.t1 b')].map(e=>e.textContent))).includes('12'));
  // 場上自由球員格的選單
  await R.click('.pcourt .pc.t1.isl');await W(300);await S('pmenu-lib');console.log(await acts());await R.click('.sheet [data-act=close]').catch(()=>{});await W(200);
  // 打一球之後，鎖解除，不再出現「換錯了」
  const fp=require('./t1128-fp.js')(R,W);await fp.to('t1',2);await W(800);
  ok('after rally no libwrong',await R.locator('.strips [data-act=libwrong]').count()===0);
  await S('before-more');
  // 補登球員
  await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=page][data-v=roster]');await W(400);await S('roster-locked');
  await R.click('[data-act=sheet][data-v=lateask][data-team=t1]');await W(300);await S('lateask');
  await R.click('[data-act=lateok]');await W(300);
  await R.click('[data-act=key][data-v="2"]');await R.click('[data-act=key][data-v="3"]');await W(300);await S('late-typed');
  await R.click('[data-act=kpclose]');await W(300);await S('late-done');
  ok('23 added',await R.evaluate(()=>[...document.querySelectorAll('.rr.t1 .num b')].some(e=>e.textContent==='23')));
  // 回比賽，替補面板有 23
  await R.click('.nav [data-v=play],[data-act=page][data-v=play]').catch(()=>{});await W(500);
  await R.click('[data-act=subopen][data-team=t1]').catch(e=>console.log('subopen fail'));await W(400);await S('sub');
  ok('23 in bench',await R.evaluate(()=>document.body.innerText.includes('23')));
  // 觀看端沒壞
  await W(800);await shot('after-late');
};

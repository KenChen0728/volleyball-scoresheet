// 11/28 晚：比賽中補登自由球員
module.exports=async({R,V,ok,W,shot})=>{
  await R.click('[data-act=sheet][data-v=more]');await W(250);await R.click('.sheet [data-act=page][data-v=roster]');await W(400);
  await R.click('[data-act=sheet][data-v=lateask][data-team=t1]');await W(300);await R.click('[data-act=lateok]');await W(300);await R.click('[data-act=kpclose]');await W(200);
  const e=R.locator('[data-act=slot][data-team=t1][data-kind=lib][data-no=""]');ok('empty libero slot enabled',await e.count()>0&&await e.first().isEnabled());
  await e.first().click();await W(200);await R.click('[data-act=key][data-v="3"]');await R.click('[data-act=key][data-v="3"]');await W(300);await R.click('[data-act=kpclose]').catch(()=>{});await W(300);
  await R.screenshot({path:'/tmp/w/R-latelib.png'});
  ok('33 in libero rows',await R.evaluate(()=>[...document.querySelectorAll('[data-kind=lib][data-team=t1] b')].some(b=>b.textContent==='33')));
  ok('existing filled slots still disabled',await R.locator('[data-act=slot][data-team=t1][data-no="12"]').isDisabled());
  await R.locator('.nav [data-v=play]').click().catch(()=>{});await W(600);
  ok('33 shown as L in strip',await R.evaluate(()=>[...document.querySelectorAll('.strip.t1 .lc b')].some(b=>b.textContent==='33')));
  await W(800);ok('viewer shows 33',await V.evaluate(()=>[...document.querySelectorAll('.strip .lc b')].some(b=>b.textContent==='33')));await shot('latelib');
};

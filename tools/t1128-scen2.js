module.exports=async({R,V,pt,ok,W,shot})=>{
  await R.evaluate(()=>__fakeNet(false));await W(2500);await shot('down-r');
  ok('red bar when scorer offline',await V.locator('.wdown').count()===1);
  await R.evaluate(()=>__fakeNet(true));await W(2500);ok('bar gone after reconnect',await V.locator('.wdown').count()===0);
  await V.evaluate(()=>__fakeNet(false));await W(2500);await shot('down-v');ok('red bar when viewer offline',await V.locator('.wdown').count()===1);
};

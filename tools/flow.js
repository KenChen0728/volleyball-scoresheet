// 共用：走到比賽開始
exports.start=async function(p,opt={}){
 await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await p.waitForTimeout(60);
 await p.locator('.nav [data-v=toss]').click();await p.click('.side.'+(opt.serve||'t2'));await p.locator('.nav [data-v=lineup]').click();
 for(const a of [[1,3,5,7,9,11],[2,4,6,8,10,14]]){for(const n of a){const l=p.locator(`[data-act=fill][data-no="${n}"]`);if(await l.count())await l.click()}const k=p.locator('[data-act=lu-lock]');if(await k.count())await k.click()}
 await p.click('[data-act=start]');await p.click('[data-act=cs-yes]');await p.waitForTimeout(60);
};

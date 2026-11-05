const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),c=await b.newContext(),p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);           // 先開舊版，裝好主程式的 service worker
await p.goto('http://localhost:8765/school/');await p.waitForTimeout(2000);await p.reload();await p.waitForTimeout(1500);
console.log('cached',await p.evaluate(async()=>{const k=await caches.keys();return k}));
await p.click('[data-a=sample]');await p.click('.tossb[data-v=t1]').catch(()=>{});await p.click('[data-a=setgo]');await p.click('.pt >> nth=0');
await c.setOffline(true);await p.reload();await p.waitForTimeout(1200);
console.log('offline resumed',await p.textContent('.bar h1'),await p.locator('.sc').first().textContent());
await p.click('[data-a=help]');await p.click('[data-a=helpt] >> nth=1').catch(()=>{});await p.click('[data-a=helpt]').catch(()=>{});await p.waitForTimeout(500);
console.log('help img ok',await p.evaluate(()=>{const i=document.querySelector('.himg img');return i&&i.complete&&i.naturalWidth>0}));
await c.setOffline(false);await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
console.log('main keys',await p.evaluate(()=>Object.keys(localStorage)),await p.title(),await p.evaluate(async()=>(await caches.keys())));
console.log('errs',errs);await b.close()})();

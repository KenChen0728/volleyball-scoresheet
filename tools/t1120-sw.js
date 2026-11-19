// 11/20 離線快取只管自己網站：同網域照舊能離線打開（sw.js）
const {chromium}=require('playwright');const W=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();const p=await ctx.newPage();
  await p.goto('http://localhost:8781/index.html');await p.evaluate(()=>navigator.serviceWorker.ready);await W(1500);await p.reload();await W(1000);
  const ctl=await p.evaluate(()=>!!navigator.serviceWorker.controller);ok('sw controls page',ctl);
  const xo=await p.evaluate(async()=>{try{await fetch('http://127.0.0.1:8781/version.json',{cache:'no-store',mode:'no-cors'});return 'ok'}catch(e){return 'err'}});
  ok('cross-origin fetch passes through (not cached)',xo==='ok');
  const keys=await p.evaluate(async()=>{const c=await caches.open((await caches.keys())[0]);return (await c.keys()).map(r=>r.url)});
  ok('no cross-origin entries in cache',keys.every(u=>u.startsWith('http://localhost:8781/')),keys);
  await ctx.setOffline(true);await p.reload().catch(()=>{});await W(2500);
  ok('opens offline',(await p.locator('text=開始新比賽').count())>0);
  console.log('t1120-sw',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

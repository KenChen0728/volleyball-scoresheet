// 用本機伺服器測離線、和完整版並存、下載檔名：先在專案根目錄開 python3 -m http.server 8765
const {chromium}=require('playwright'),fs=require('fs');
const seed=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):null;
(async()=>{const b=await chromium.launch(),c=await b.newContext({acceptDownloads:true,viewport:{width:1280,height:800}}),p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);            // 先開完整版，裝好它的 service worker
await p.evaluate(()=>{localStorage.setItem('nanshe-scoresheet-v1',JSON.stringify({matches:[],currentId:null,keep:1}))});
await p.goto('http://localhost:8765/school/');await p.waitForTimeout(2500);await p.reload();await p.waitForTimeout(1500);
console.log('快取',await p.evaluate(async()=>await caches.keys()));
console.log('已可離線',await p.locator('.offok').count());
console.log('安裝檢查',await p.evaluate(async()=>{const m=await (await fetch(document.querySelector('link[rel=manifest]').href)).json();return [m.name,m.short_name,m.start_url,m.display,m.icons.length]}));
if(seed){await p.evaluate(s=>localStorage.setItem('vb-school-v2',s),seed);await p.reload();await p.waitForTimeout(500);
 await p.locator('.hrow').first().click();await p.waitForTimeout(200);
 for(const [act,tab] of [['rppdf',null],['rpcsv',null],['rpjson',null]]){const d=p.waitForEvent('download',{timeout:15000});await p.click(`[data-act=${act}]`);const f=await d;console.log('下載',f.suggestedFilename())}
 await p.click('[data-act=rtab][data-v=s2]');await p.waitForTimeout(100);const d=p.waitForEvent('download',{timeout:15000});await p.click('[data-act=rppng]');console.log('下載',(await d).suggestedFilename());
 await p.click('.bar .barback');await p.waitForTimeout(150);await p.click('.bar .barback');await p.waitForTimeout(150);}
await p.click('[data-act=sample]');await p.waitForTimeout(300);
await c.setOffline(true);await p.reload();await p.waitForTimeout(1500);
console.log('離線重開',await p.title(),await p.locator('.bar h1').first().textContent().catch(()=>'home'));
await p.click('[data-act=helpopen]');await p.waitForTimeout(500);await p.locator('.hmenu button').first().click().catch(()=>{});await p.waitForTimeout(600);
console.log('離線看教學圖',await p.evaluate(()=>{const i=document.querySelector('.himg img');return !!(i&&i.complete&&i.naturalWidth>0)}));
await c.setOffline(false);await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
console.log('完整版',await p.title(),await p.evaluate(()=>[Object.keys(localStorage).sort().join(),localStorage.getItem('nanshe-scoresheet-v1').includes('keep')]),await p.evaluate(async()=>await caches.keys()));
console.log('錯誤',errs);await b.close()})().catch(e=>{console.log('ERR',e.message.slice(0,400));process.exit(1)});

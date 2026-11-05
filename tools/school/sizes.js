const {chromium}=require('playwright'),path=require('path');
const URL='file://'+path.resolve(__dirname,'../../school/index.html');
const SZ=[[360,640],[375,667],[390,844],[402,874],[430,932],[844,390],[640,360],[768,1024],[820,1180],[1024,768],[1180,820],[1366,768],[1280,800],[1920,1080],[2560,1440]];
(async()=>{const b=await chromium.launch();let bad=0;
for(const scheme of ['light','dark'])for(const [w,h] of SZ){
 const c=await b.newContext({viewport:{width:w,height:h},colorScheme:scheme});const p=await c.newPage();
 const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'display-mode',value:scheme==='dark'?'standalone':'browser'}]}); // 深色這輪同時模擬安裝成 App
 await p.goto(URL);
 const chk=async n=>{const r=await p.evaluate(()=>{const W=innerWidth,H=innerHeight,o=[];if(document.documentElement.scrollWidth>W)o.push('橫向超出');
  document.querySelectorAll('button:not(.link):not(.q)').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&(r.height<40||r.width<40)&&!e.closest('.keys'))o.push('小鈕 '+e.textContent.slice(0,8)+' '+Math.round(r.width)+'x'+Math.round(r.height))});
  document.querySelectorAll('.pt,.cellbtn,[data-a=undo],[data-a=to]').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom>H+1||r.right>W+1||r.height<34)o.push('超出 '+e.textContent.slice(0,8)+' '+Math.round(r.height))});
  const pg=document.querySelector('.play');if(pg&&pg.scrollHeight>pg.clientHeight+1)o.push('比賽頁要捲');
  document.querySelectorAll('.cellbtn b').forEach(e=>{if(e.scrollWidth>e.parentElement.clientWidth)o.push('字超格')});return o});if(r.length){bad++;console.log(w,h,scheme,n,[...new Set(r)].slice(0,4).join(' | '))}};
 await chk('home');await p.click('[data-a=sample]');await chk('set');await p.click('.tossb[data-v=t1]').catch(()=>{});await p.click('[data-a=setgo]');await chk('play');
 await p.click('.cellbtn >> nth=0');await chk('sub');
 if(w===1024&&scheme==='dark')await p.screenshot({path:process.argv[2]+'/dark.png'});
 if(w===390)await p.screenshot({path:process.argv[2]+'/p390-'+scheme+'.png'});
 await p.click('button[data-a=close]');
 for(let i=0;i<25;i++){await p.click('.pt >> nth=0');await p.waitForTimeout(360);if(await p.isVisible('.sheet.center'))break}
 const sb=await p.evaluate(()=>[...document.querySelectorAll('.sheet.center button')].map(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}));if(sb.length!==2||sb.includes(false)){bad++;console.log(w,h,scheme,'局末按鈕超出',sb)}
 if(w===820&&scheme==='dark')await p.screenshot({path:process.argv[2]+'/end820.png'});await p.waitForTimeout(850);await p.click('.sheet [data-a=undo]');if(w===390)await p.screenshot({path:process.argv[2]+'/p390b-'+scheme+'.png'});if(w===844)await p.screenshot({path:process.argv[2]+'/l844.png'});if(w===360)await p.screenshot({path:process.argv[2]+'/p360.png'});
 await c.close()}
console.log('done',bad);await b.close()})();

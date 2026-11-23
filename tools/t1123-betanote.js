// 11/23 測試版和正式版一樣時，測試版主畫面寫「目前沒有測試中的功能」（patch_v133）。用暫存資料夾換 version.json，不動專案檔案
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const R=path.dirname(__dirname),T='/tmp/bntest',PORT=8798;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
fs.rmSync(T,{recursive:true,force:true});fs.mkdirSync(T+'/beta',{recursive:true});
for(const f of ['index.html','version.json','beta/index.html','beta/version.json'])fs.copyFileSync(R+'/'+f,T+'/'+f);fs.cpSync(R+'/icons',T+'/icons',{recursive:true});
fs.writeFileSync(T+'/index.html',fs.readFileSync(T+'/index.html','utf8').replace(/<script>if\('serviceWorker'.*?<\/script>/s,'')); // 測試不要 service worker 擋住換檔
(async()=>{const srv=spawn('python3',['-m','http.server',String(PORT)],{cwd:T,stdio:'ignore'});await W(800);const b=await chromium.launch();const errs=[];
  for(const [w,h] of [[390,844],[820,1180],[844,390]]){const tag=w+'x'+h;
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:'+PORT+'/beta/');await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(1200);
    const n=p.locator('.betanote');ok(tag+' note shown when same version',await n.count()===1,(await p.locator('body').innerText()).slice(0,120));
    if(await n.count()){const r=await n.boundingBox();ok(tag+' note visible without scrolling',r.y>=0&&r.y+r.height<=h,r);
      const btns=await n.locator('a,button').evaluateAll(es=>es.map(e=>{const q=e.getBoundingClientRect(),t=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return {t:e.innerText,h:q.height,top:!!t&&(t===e||e.contains(t))}}));
      ok(tag+' buttons ≥44 and tappable',btns.length===2&&btns.every(x=>x.h>=44&&x.top),btns);
      if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'/betanote-'+tag+'.png'});}
    if(w===390){await p.click('.betanote [data-act=betanotehide]');await W(300);ok('continue hides note',await p.locator('.betanote').count()===0);
      await p.reload();await W(1200);ok('stays hidden this session',await p.locator('.betanote').count()===0);
      await p.evaluate(()=>sessionStorage.clear());await p.reload();await W(1200);
      await p.click('.betanote a');await p.waitForLoadState('load');await W(800);ok('go to 正式版 opens root',new URL(p.url()).pathname==='/'&&!/測試版/.test(await p.locator('.verbtn').innerText()),p.url());
      // 正式版不會出現這塊
      ok('no note on 正式版',await p.locator('.betanote').count()===0);
      // 測試版有新號碼：不出現
      fs.writeFileSync(T+'/version.json',JSON.stringify({build:'1101-0000',ver:'2026.11.01.1'})+'\n');
      await p.goto('http://localhost:'+PORT+'/beta/');await p.evaluate(()=>sessionStorage.clear());await p.reload();await W(1200);ok('no note when versions differ',await p.locator('.betanote').count()===0);
      fs.copyFileSync(R+'/version.json',T+'/version.json')}
    await ctx.close()}
  ok('no page errors',errs.length===0,errs);
  console.log('t1123-betanote',pass,'ok',fail,'fail');await b.close();srv.kill();process.exit(fail?1:0)})();

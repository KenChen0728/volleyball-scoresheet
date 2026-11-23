// 11/23 版本號換成「年.月.日.第幾版」（patch_v130）：舊手機（舊程式只認 build）會跳更新，更新後顯示新寫法、不再跳；之後再出新版也會跳。
// 用自己的暫存資料夾和伺服器，不動專案檔案
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),{spawn,execSync}=require('child_process');
const R=path.dirname(__dirname),T='/tmp/vtest',PORT=8799;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
fs.rmSync(T,{recursive:true,force:true});fs.mkdirSync(T+'/beta',{recursive:true});
const NEW=fs.readFileSync(R+'/beta/index.html','utf8'),NEWV=JSON.parse(fs.readFileSync(R+'/beta/version.json','utf8'));
let OLD;try{OLD=execSync('git -C '+R+' show aff7da6:beta/index.html',{maxBuffer:1e8}).toString()}catch(e){OLD=null}
(async()=>{const srv=spawn('python3',['-m','http.server',String(PORT)],{cwd:T,stdio:'ignore'});await W(800);
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  const U='http://localhost:'+PORT+'/beta/';const ver=async()=>(await p.locator('.verbtn').innerText().catch(()=>'')).trim();
  ok('new version.json has both fields',/^\d{4}-\d{4}$/.test(NEWV.build)&&/^\d{4}\.\d{2}\.\d{2}\.\d+$/.test(NEWV.ver),NEWV);
  ok('page shows 測試版 年.月.日.第幾版',new RegExp("var BUILD='測試版 "+NEWV.ver.replace(/\./g,'\\.')+"'").test(NEW));
  if(OLD){fs.writeFileSync(T+'/beta/index.html',OLD);fs.writeFileSync(T+'/beta/version.json',JSON.stringify({build:'1123-0800'})+'\n');
    await p.goto(U);await W(600);await p.evaluate(()=>{localStorage.clear()});await p.reload();await W(800);
    ok('old page shows old number',/1123-0843/.test(await ver()),await ver());
    // 上線：伺服器換成新檔
    fs.writeFileSync(T+'/beta/index.html',NEW);fs.writeFileSync(T+'/beta/version.json',JSON.stringify(NEWV)+'\n');
    await p.evaluate(()=>dispatchEvent(new Event('online')));await W(800);
    const bar=await p.locator('[data-upd=go]').count();ok('old phone sees update prompt',bar>=1,(await p.locator('body').innerText()).slice(0,200));
    if(bar){await p.click('[data-upd=go]');await p.waitForLoadState('load');await W(1500)}
    ok('after update shows new number',(await ver()).includes(NEWV.ver),await ver());
    ok('no 還沒更新成功',!/還沒更新成功/.test(await p.locator('body').innerText()));}
  else ok('old version available',false);
  await p.evaluate(()=>dispatchEvent(new Event('online')));await W(800);ok('same ver: no prompt',await p.locator('[data-upd=go]').count()===0);
  // 同一天第二版
  const v2=NEWV.ver.replace(/\.(\d+)$/,(m,n)=>'.'+(+n+1));fs.writeFileSync(T+'/beta/version.json',JSON.stringify({build:'1123-2359',ver:v2})+'\n');
  await p.evaluate(()=>dispatchEvent(new Event('online')));await W(800);ok('next ver prompts with new number',await p.locator('[data-upd=go]').count()>=1&&(await p.locator('body').innerText()).includes(v2));
  // 只有舊欄位（不該發生）：新程式不跳
  fs.writeFileSync(T+'/beta/version.json',JSON.stringify({build:'1124-0100'})+'\n');await p.reload();await W(800);await p.evaluate(()=>dispatchEvent(new Event('online')));await W(800);
  ok('build-only json ignored by new page',await p.locator('[data-upd=go]').count()===0);
  console.log('t1123-ver',pass,'ok',fail,'fail');await b.close();srv.kill();process.exit(fail?1:0)})();

// 11/16 觀看比賽：App 裡掃描 QR code（tools/v100-qrscan.js）。用 Chromium 的假相機播放一段「拍到螢幕上 QR code」的影片。
// 影片由 /home/claude/qrt/cam 產生（tools 外面，不進 git）；沒有影片時跳過相機的部分。
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',KEY='nanshe-scoresheet-beta',CAM=process.env.CAM||'/home/claude/qrt/cam',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,300))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const launch=y4m=>chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'].concat(y4m?['--use-file-for-fake-video-capture='+y4m]:[])});
const open=async(b,w,h,init)=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true});if(init)await ctx.addInitScript(init);
  const p=await ctx.newPage();p.on('pageerror',x=>errs.push(x.message));await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
  await p.locator('[data-act=watchopen]:visible').first().click();await W(300);return p};
(async()=>{
  // 1. 掃到記錄台的 QR code：填進代碼欄，不直接開始
  let b=await launch(CAM+'/ours.y4m');let p=await open(b,390,844);
  ok('scan button shown',await p.locator('.qsbtn').count()===1);
  ok('no keyboard when scan available',await p.evaluate(()=>!document.activeElement||document.activeElement.id!=='watch-code'));
  if(SHOT)await p.screenshot({path:SHOT+'/s-sheet.png'});
  await p.click('.qsbtn');
  ok('scanner opens',await p.locator('.qscan video').count()===1); // 假相機一下就讀到，所以按下去馬上檢查
  let done=false;for(let i=0;i<40&&!done;i++){await W(150);done=await p.locator('.qscan').count()===0}
  ok('scanner closes after reading',done);
  ok('code filled in',await p.inputValue('#watch-code')==='QMVJTD',await p.inputValue('#watch-code').catch(()=>''));
  ok('filled message',/已填入掃描到的代碼/.test(await p.locator('.sheet').innerText()));
  ok('still on home (not watching yet)',await p.locator('.watch').count()===0&&await p.locator('[data-act=watchgo]').count()===1);
  ok('camera stopped',await p.evaluate(()=>!document.querySelector('video')));
  if(SHOT)await p.screenshot({path:SHOT+'/s-filled.png'});
  // 改了代碼，提示就不出現
  await p.fill('#watch-code','ABC');await p.click('[data-act=watchgo]');await W(300);
  ok('typing still validated',/代碼為 6 個/.test(await p.locator('.sheet').innerText()));
  await b.close();
  // 2. Esc 只關掃描，視窗還在（假相機不放影片：畫面上沒有 QR code，掃描畫面會一直開著）
  b=await launch('');p=await open(b,390,844);
  await p.click('.qsbtn');await W(400);if(SHOT)await p.screenshot({path:SHOT+'/s-scan.png'});await p.keyboard.press('Escape');await W(300);
  ok('esc closes scanner only',await p.locator('.qscan').count()===0&&await p.locator('.qsbtn').count()===1);
  // 3. 各尺寸掃描畫面
  for(const [w,h] of [[360,640],[844,390],[1366,768]]){const q=await open(b,w,h);await q.click('.qsbtn');await W(400);
    const r=await q.evaluate(()=>{const v=s=>document.querySelector(s).getBoundingClientRect(),c=v('.qsbar [data-qs=cancel]'),t=v('.qstip');
      const f=v('.qsframe');return [c.bottom<=innerHeight&&c.right<=innerWidth&&c.height>=44,t.top>=0&&t.right<=innerWidth,document.documentElement.scrollWidth<=innerWidth,f.top>=t.bottom+8,f.bottom<=c.top-8,f.width>=150]});
    ok(w+'x'+h+' scanner fits',r.every(Boolean),r);if(SHOT)await q.screenshot({path:SHOT+'/s-scan-'+w+'x'+h+'.png'});
    await q.click('.qsbar [data-qs=cancel]');await W(200);ok(w+'x'+h+' cancel closes',await q.locator('.qscan').count()===0);await q.context().close()}
  // Android 返回鍵（popstate）：先關掃描
  await p.click('.qsbtn');await W(300);await p.goBack().catch(()=>{});await W(400);
  ok('back closes scanner only',await p.locator('.qscan').count()===0&&await p.locator('.qsbtn').count()===1);
  await b.close();
  // 4. 別的 QR code：說明不是記錄台的，繼續掃
  b=await launch(CAM+'/other.y4m');p=await open(b,390,844);await p.click('.qsbtn');
  let seen=false;for(let i=0;i<40&&!seen;i++){await W(150);seen=/這不是記錄台/.test(await p.locator('.qstip').innerText().catch(()=>''))}
  ok('other QR explained',seen);ok('keeps scanning',await p.locator('.qscan').count()===1);
  if(SHOT)await p.screenshot({path:SHOT+'/s-other.png'});await b.close();
  // 5. 不允許相機：說明＋改為輸入代碼
  b=await launch('');p=await open(b,390,844,()=>{navigator.mediaDevices.getUserMedia=()=>Promise.reject(Object.assign(new Error('x'),{name:'NotAllowedError'}))});
  await p.click('.qsbtn');await W(400);
  ok('denied explained',/無法使用相機/.test(await p.locator('.qstip').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/s-denied.png'});
  await p.click('[data-qs=type]');await W(300);ok('type instead closes scanner',await p.locator('.qscan').count()===0&&await p.locator('#watch-code').count()===1);
  await p.context().close();
  // 6. 沒有相機功能的瀏覽器：沒有掃描鈕，直接打字
  p=await open(b,390,844,()=>{Object.defineProperty(navigator,'mediaDevices',{value:undefined})});
  ok('no camera api: no scan button',await p.locator('.qsbtn').count()===0);
  ok('no camera api: input focused',await p.evaluate(()=>document.activeElement&&document.activeElement.id==='watch-code'));
  await b.close();
  ok('no page errors',!errs.length,errs);
  console.log('t1116-scan',pass,'ok',fail,'fail');process.exit(fail?1:0)})();

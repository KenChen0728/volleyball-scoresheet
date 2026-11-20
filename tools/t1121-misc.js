// 11/21 其他改進（tools/patch_v128.py）：日曆圓圈、記錄表各局拖框、說明字精簡、存檔視窗「尚未建立」
// 時間滾輪在 t1120-fix.js、登錄單全螢幕在 t1119-reg.js。名字都是虛構的
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const FM=JSON.parse(fs.readFileSync(__dirname+'/all.json','utf8')).matches[0];
(async()=>{const b=await chromium.launch();
  for(const scheme of ['light','dark']){
  const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,colorScheme:scheme});const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const ab=async()=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};await ab();
  await p.locator('text=/賽事與紀錄/').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('範例盃');await p.locator('.sheet .primary').first().click();await W(500);
  // 日曆：今天外框圓、選到的實心綠圓
  await p.click('[data-act=cuptab][data-v=sched]');await W(200);await p.click('[data-act=scnew]');await W(300);await p.click('#sc-date');await W(200);
  const cal=await p.evaluate(()=>{const td=document.querySelector('.sccal .td'),sel=document.querySelector('.sccal [aria-pressed=true]'),cs=getComputedStyle(sel),ct=getComputedStyle(td),ok=getComputedStyle(document.documentElement).getPropertyValue('--ok').trim();
    const rgb=h=>{const x=document.createElement('i');x.style.color=h;document.body.appendChild(x);const v=getComputedStyle(x).color;x.remove();return v};
    return {same:td===sel,selBg:cs.backgroundColor,ok:rgb(ok),radius:cs.borderRadius,w:sel.offsetWidth,h:sel.offsetHeight,tdBorder:ct.borderTopWidth,tdColor:ct.borderTopColor,selColor:cs.color}});
  ok(scheme+' selected day solid green circle',cal.selBg===cal.ok&&cal.radius==='50%'&&cal.w===cal.h&&cal.w>=44,cal);
  ok(scheme+' today outlined circle',cal.tdBorder==='2px',cal);
  const lum=c=>{const m=c.match(/\d+/g).map(Number).slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*m[0]+.7152*m[1]+.0722*m[2]};
  const cr=(a,b2)=>{const x=lum(a),y=lum(b2);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};ok(scheme+' selected day contrast',cr(cal.selBg,cal.selColor)>=4.5,[cal.selBg,cal.selColor,cr(cal.selBg,cal.selColor)]);
  if(SHOT)await p.screenshot({path:SHOT+'/m-cal-'+scheme+'.png'});
  await p.click('.sheet [data-act=scpkdone]');await W(150);await p.click('#sc-time');await W(300);if(SHOT)await p.screenshot({path:SHOT+'/m-wheel-'+scheme+'.png'});
  await p.click('.sheet [data-act=close]').catch(()=>{});await W(200);
  if(scheme==='dark'){await ctx.close();continue}
  // 存檔視窗
  await p.locator('.cuphead [data-act=cupsave],[data-act=cupsave]').first().click().catch(()=>{});await W(300);
  if(await p.locator('.sheet [data-act=cupsvtog]').count()){ok('save sheet 尚未建立',/尚未建立/.test(await p.locator('.sheet').innerText())&&!/還沒有/.test(await p.locator('.sheet').innerText()));await p.click('.sheet [data-act=close]');await W(200)}
  // 記錄表各局：拖框
  const DBK=await p.evaluate(()=>Object.keys(localStorage).find(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d&&Array.isArray(d.cups)}catch(e){return false}}));
  await p.evaluate(([K,m])=>{const d=JSON.parse(localStorage.getItem(K));d.matches.push(m);d.currentId=null;localStorage.setItem(K,JSON.stringify(d))},[DBK,FM]);
  await p.reload();await W(600);await ab();await p.evaluate(id=>{},FM.id);
  await p.locator('[data-act=home]').first().click().catch(()=>{});await W(300);
  await p.locator('text=/賽事與紀錄/').first().click().catch(()=>{});await W(300);
  await p.locator('[data-act=open][data-id="'+FM.id+'"]').first().click();await W(700);
  if(SHOT)await p.screenshot({path:SHOT+'/m-dbg.png'});
  await p.locator('.rtabs [data-act=rtab]',{hasText:'各局'}).click();await W(400);const t1=p.locator('.setpick [data-v=s1]');if(await t1.count()){await t1.click();await W(400)}
  ok('loupe shown',await p.locator('.loupe .ctov').count()===1&&await p.locator('.loupe .lmag').count()===1);
  ok('loupe hint mentions drag',/拖/.test(await p.locator('.lhint').innerText()));
  const fl=()=>p.evaluate(()=>parseFloat(document.querySelector('.lframe').style.left));
  const vb=()=>p.evaluate(()=>document.querySelector('.lmag svg').getAttribute('viewBox'));
  const l0=await fl(),v0=await vb();await p.locator('.loupe .ctov').scrollIntoViewIfNeeded();
  let r=await p.locator('.loupe .ctov').boundingBox();
  await p.mouse.move(r.x+r.width*0.2,r.y+r.height/2);await p.mouse.down();for(let i=1;i<=6;i++){await p.mouse.move(r.x+r.width*(0.2+i*0.08),r.y+r.height/2);await W(30)}
  const lmid=await fl();await p.mouse.up();await W(400);const l1=await fl(),v1=await vb();
  ok('drag frame moves live',lmid>l0+5,[l0,lmid]);ok('drag frame updates magnified',l1>l0+5&&v1!==v0,[l0,l1,v0,v1]);
  // 拖下面放大的那塊：往左拖 → 框往右
  r=await p.locator('.loupe .lmag').boundingBox();await p.mouse.move(r.x+r.width*0.8,r.y+r.height*0.3);await p.mouse.down();for(let i=1;i<=5;i++){await p.mouse.move(r.x+r.width*(0.8-i*0.1),r.y+r.height*0.3);await W(30)}await p.mouse.up();await W(400);
  const l2=await fl();ok('drag magnified moves frame',l2>l1+3||l1>90,[l1,l2]);ok('drag did not open an edit sheet',await p.locator('.sheet').count()===0);
  r=await p.locator('.loupe .ctov').boundingBox();await p.mouse.click(r.x+r.width*0.05,r.y+r.height/2);await W(400);ok('tap still moves frame',await fl()<l2-5,[l2,await fl()]);
  if(SHOT)await p.screenshot({path:SHOT+'/m-loupe.png'});
  await ctx.close()}
  ok('no page errors',!errs.length,errs);
  console.log('t1121-misc',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

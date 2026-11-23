// 11/23 補測清單 A 沒有被舊測試涵蓋的兩步：A6 三位數背號（隊伍名單）、A11 看整張兩指放大（用 CDP 送兩指觸控）。名字都是虛構的
const {chromium}=require('playwright');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;console.log('ok  ',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(500);
  await p.getByText('賽事與紀錄',{exact:true}).first().click();await W(300);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(500);
  await p.click('[data-act=cuptab][data-v=teams]');await W(200);await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  await p.fill('#ct-text','藍隊\n100 王小明');await p.click('[data-act=cupteamsave]');await W(400);
  ok('A6 隊伍名單打三位數：寫「背號只能 0～99」',/背號只能 0～99/.test(await p.locator('.sheet').innerText().catch(()=>'')));
  // A11 看整張
  await p.evaluate(()=>sessionStorage.clear());await p.reload();await W(500);
  for(let i=0;i<3&&!await p.locator('#import-file').count();i++){const bk=p.locator('.barback');if(await bk.count())await bk.first().click();else await p.getByText('賽事與紀錄',{exact:true}).first().click();await W(400)}
  await p.setInputFiles('#import-file',__dirname+'/all.json');await W(300);await p.click('[data-act=impgo]');await W(500);
  await p.locator('.hrow').filter({hasText:'範例藍隊'}).first().click();await W(700);
  const rt=p.locator('.rtabs [data-v=res]');if(await rt.count()){await rt.click();await W(300)}
  await p.getByRole('button',{name:'看整張'}).first().click();await W(500);
  const sc=p.locator('.whsc').first();ok('A11 看整張打開',await sc.count()===1);
  const lab=async()=>p.locator('.whbar span').first().innerText().catch(()=>'');const z0=await lab();
  const r=await sc.boundingBox();const cx=r.x+r.width/2,cy=r.y+r.height/2;const cdp=await ctx.newCDPSession(p);
  const tp=(d)=>[{x:cx-d,y:cy,id:1},{x:cx+d,y:cy,id:2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp(30)});
  for(let d=40;d<=150;d+=10){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:tp(d)});await W(16)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await W(300);const z1=await lab();
  ok('A11 兩指張開會放大',parseInt(z1)>parseInt(z0||'100'),[z0,z1]);if(SHOT)await p.screenshot({path:SHOT+'/A11.png'});
  ok('沒有畫面錯誤',errs.length===0,errs);
  console.log('t1123-checkA',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

// 11/12 小修：換自由灰掉寫原因、全場幾分鐘、紀錄與名單、比賽資料頁不放重複的回主畫面、面板返回 44px
// node tools/t1112a.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/volleyball-scoresheet/index.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
  const tag=w+'x'+h+' ';
  await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);
  await flow.start(p,{serve:'t1'});await W(250);
  const cell=i=>p.locator(`.pcourt [data-act=pcell][data-team=t1][data-v="${i}"]`);
  const why=async()=>(await p.locator('.sheet .pmwhy').count())?(await p.locator('.sheet .pmwhy').innerText()):'';
  const libBtn=()=>p.locator('.sheet .pmb').filter({hasText:'換自由'});
  const close=async()=>{await p.click('.sheet [data-act=close]');await W(200)};
  const hasLib=await p.locator('.lc.t1[data-act=libcell]').count()>0;
  // 前排
  await cell(1).click();await W(250);
  ok(tag+'front: libero button disabled',await libBtn().isDisabled());
  ok(tag+'front: reason',(await why())==='換自由：前排的人不能換自由球員',await why());
  await close();
  // I 號位、這隊發球
  await cell(0).click();await W(250);
  ok(tag+'server: reason',(await why())==='換自由：I 號位要發球，不能換自由球員',await why());
  await close();
  if(hasLib){
    // 後排可以換：沒有原因那一行
    await cell(4).click();await W(250);
    ok(tag+'back row: enabled, no reason',await libBtn().isEnabled()&&(await why())==='',await why());
    await libBtn().click();await W(300);
    const step=p.locator('.sheet [data-act=pmlin]');if(await step.count()){await step.first().click();await W(300)}
    ok(tag+'libero went in',await p.locator('.sheet').count()===0);
    // 另一個後排：自由球員已經在場上
    await cell(5).click();await W(250);
    ok(tag+'libero on court: reason',(await why())==='換自由：自由球員已經在場上，一次只能一位',await why());
    await close();
    // 自由球員自己：剛換過，要打完一球
    await cell(4).click();await W(250);
    ok(tag+'libero menu: reason',(await why()).indexOf('換回、換自由：剛換過自由球員，要打完一球才能再換')===0,await why());
    await close();
  }
  // 面板的「‹ 返回」至少 44px
  await p.click('[data-act=sheet][data-v=more]');await W(250);
  await p.click('.sheet [data-act=mteam][data-v=exc]');await W(250);
  const bh=await p.locator('.sheet>.sheetback').evaluate(e=>e.getBoundingClientRect().height);
  ok(tag+'sheetback >= 44px',bh>=44,bh);
  await p.click('.sheet [data-act=close]');await W(200);
  // 打完的比賽：全場幾分鐘、紀錄與名單
  if(!SCHOOL){
    await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,fs.readFileSync('/tmp/fix1111.json','utf8')]);await p.reload();await W(300);
    const hm=p.locator('[data-act=home]').first();if(await hm.count()){await hm.click();await W(250)}
    await p.click('.herobtns [data-act=history]');await W(250);await p.click('.hrow[data-id=mdone1]');await W(400);
    const bt=await p.locator('.bartime').innerText();
    ok(tag+'match length in minutes',/全場\s*(\d+ 小時 )?\d+ 分鐘/.test(bt),bt);
    const pg=await p.locator('.page').innerText();
    ok(tag+'no old name',pg.indexOf('歷史紀錄')<0&&pg.indexOf('「紀錄與名單」可以再打開')>=0);
  }
  // 比賽資料頁：下面沒有重複的回主畫面，左上可以回去
  await p.evaluate(()=>localStorage.clear());await p.reload();await W(200);
  await p.click('[data-act=new]');await W(250);
  const ng=p.locator('.sheet [data-act=newgo]');if(await ng.count()){await ng.click();await W(300)}
  ok(tag+'info page: no bottom back',await p.locator('.page button.ghost.full').count()===0);
  ok(tag+'info page: top back',(await p.locator('.bar .barback').innerText()).indexOf('主畫面')>=0);
  await p.click('.bar .barback');await W(250);ok(tag+'back home',await p.locator('.herocta').count()===1);
  await p.context().close();
}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'')+'t1112a pass',pass,'fail',fail);
await b.close()})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

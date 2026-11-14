// 11/11 晚上「其他」改版：四區分開；例外替補、重新指定自由球員、陣容、球衣顏色先按功能再選隊
// 選隊那層有「‹ 返回」回到其他、「取消」整個關掉；選完進下一步，那一步的「‹ 返回」直接回到其他；球在進行中換人那區寫原因
// node tools/t1111h.js [網址] [資料 key]（學校版：file://.../school/index.html vb-school-v2）
const {chromium}=require('playwright');const flow=require('./flow.js');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',SCHOOL=KEY.indexOf('vb-school')===0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of [[390,844],[1180,820],[360,640],[844,390]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();p.on('pageerror',x=>errs.push(x.message));
const tag=w+'x'+h+' ';
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await W(150);
await flow.start(p,{serve:'t1'});await W(200);
const h2=async()=>(await p.locator('.sheet h2').count())?(await p.locator('.sheet h2').first().innerText()):'';
const more=async()=>{await p.click('[data-act=sheet][data-v=more]');await W(200)};
await more();
const SYNC=await p.locator('.sheet [data-act=syncopen]').count()>0; // 11/14 完整版多「連線」一區（學校版還沒有）
ok(tag+'four sections',await p.locator('.sheet .msec').count()===(SYNC?5:4));
ok(tag+'full version has sync',SCHOOL||SYNC);
ok(tag+'headings',(await p.locator('.sheet .msec>.mhead').allInnerTexts()).join()===(SYNC?'換人,比賽狀況,修正,連線,設定':'換人,比賽狀況,修正,設定'));
const labels=(await p.locator('.sheet .mbtn strong').allInnerTexts()).join(),RED=await p.locator('.sheet [data-act=mteam][data-v=red]').count()>0; // 學校版沒有自由球員時不放重新指定
ok(tag+'buttons',labels==='例外替補,'+(RED?'重新指定自由球員,':'')+'傷停,陣容不完整,棄權,輪轉錯誤／非法替補,修正比分,陣容,挑邊,球衣顏色,查看名單'+(SYNC?',連線顯示':''),labels); // 11/13 加輪轉錯誤／非法替補
if(!RED)ok(tag+'exc alone full row',await p.locator('.sheet .mgrid.one [data-v=exc]').count()===1);else ok(tag+'two in row',await p.locator('.sheet .mgrid.two [data-v=red]').count()===1);
ok(tag+'red only in school',RED||SCHOOL);
ok(tag+'no team rows left',await p.locator('.sheet .mteams').count()===0);
ok(tag+'sub buttons enabled',await p.locator('.sheet [data-act=mteam][data-v=exc]').isEnabled()&&(!RED||await p.locator('.sheet [data-act=mteam][data-v=red]').isEnabled()));
// 畫面放得下：按鈕不超出左右
const over=await p.evaluate(()=>[...document.querySelectorAll('.sheet .mbtn')].filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1||e.scrollWidth>e.clientWidth+1}).length);
ok(tag+'buttons fit',over===0,over);
// 例外替補：選隊 → 替補面板（例外）
await p.click('.sheet [data-act=mteam][data-v=exc]');await W(200);
ok(tag+'picker title',await h2()==='例外替補',await h2());
const tb=await p.locator('.sheet .mtpick button').evaluateAll(a=>a.map(e=>[e.className,e.getAttribute('data-act'),e.getAttribute('data-m'),e.getBoundingClientRect().height]));
ok(tag+'picker two teams left first',tb.length===2&&tb[0][0]==='t1'&&tb[1][0]==='t2'&&tb.every(x=>x[1]==='subopen'&&x[2]==='exc'),tb);
ok(tag+'picker big buttons',tb.every(x=>x[3]>=50),tb.map(x=>x[3]));
ok(tag+'picker back + cancel',await p.locator('.sheet>.sheetback[data-act=sheetback]').count()===1&&await p.locator('.sheet [data-act=close]').count()===1);
await p.click('.sheet [data-act=sheetback]');await W(150);ok(tag+'back to more',(await h2())==='其他');
await p.click('.sheet [data-act=mteam][data-v=exc]');await W(150);await p.keyboard.press('Escape');await W(150);ok(tag+'esc back to more',(await h2())==='其他');
await p.click('.sheet [data-act=mteam][data-v=exc]');await W(150);await p.click('.sheet [data-act=close]');await W(150);ok(tag+'cancel closes all',await p.locator('.sheet').count()===0);
await more();await p.click('.sheet [data-act=mteam][data-v=exc]');await W(150);await p.click('.sheet .mtpick button.t2');await W(250);
ok(tag+'exc panel opens',await p.locator('.kp.bench').count()===1&&await p.locator('.sheet').count()===0);
ok(tag+'exc mode',(await p.locator('.kp.bench').innerText()).includes('例外'),await p.locator('.kp.bench').innerText());
await p.click('[data-act=subcancel]');await W(800);
// 重新指定自由球員、陣容、球衣顏色：選完的那一步「‹ 返回」回到其他
for(const [key,title,next] of [['red','重新指定自由球員','重新指定'],['fix','修正陣容','陣容'],['color','球衣顏色','球衣']]){
 if(key==='red'&&!RED)continue;
 if(!(await p.locator('.sheet h2',{hasText:'其他'}).count()))await more();
 await p.click(`.sheet [data-act=mteam][data-v=${key}]`);await W(150);
 ok(tag+key+' picker title',await h2()===title,await h2());
 await p.click('.sheet .mtpick button.t1');await W(200);
 const t=await h2();ok(tag+key+' next step',t.includes(next)&&t.includes('範例藍隊'),t);
 ok(tag+key+' back btn',await p.locator('.sheet>.sheetback').count()===1);
 await p.click('.sheet>.sheetback');await W(150);ok(tag+key+' back skips picker',(await h2())==='其他',await h2());
}
await p.click('.sheet [data-act=close]');await W(150);
// 球在進行中：換人兩顆不能按，寫原因（寬畫面才按得到「其他」）
if(!SCHOOL&&w>=1000){await p.click('[data-act=serve]');await W(700);await more();
 ok(tag+'live disabled',!(await p.locator('.sheet [data-act=mteam][data-v=exc]').isEnabled())&&(!RED||!(await p.locator('.sheet [data-act=mteam][data-v=red]').isEnabled())));
 ok(tag+'live note',(await p.locator('.sheet .mnote').innerText()).includes('球在進行中'));
 ok(tag+'live fix ok',await p.locator('.sheet [data-act=mteam][data-v=fix]').isEnabled());
 await p.click('.sheet [data-act=close]');await W(150)}
await more();await p.screenshot({path:`/tmp/t1111h-${SCHOOL?'school':'full'}-${w}x${h}.png`});
await p.context().close()}
ok('no page errors',errs.length===0,errs);
console.log((SCHOOL?'school ':'full ')+'pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

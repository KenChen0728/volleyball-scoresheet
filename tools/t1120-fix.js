// 11/20 早上使用者實測後的修改（tools/patch_v118～v120）：名冊背號可空、名冊沒有的號碼、補姓名、
// 新增比賽的日期時間選擇器和版面、重複對戰提醒、印登錄單預覽、使用教學回目錄。名字都是虛構的
const {chromium}=require('playwright');
const {scDate,scTime,scGet}=require('./scpick.js');
const fs=require('fs');
const URL=process.argv[2]||'http://localhost:8781/beta/index.html',SHOT=process.env.SHOT||'';
let pass=0,fail=0;const ok=(n,v,x)=>{if(v){pass++;if(process.env.VERBOSE)console.log('ok',n)}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x).slice(0,400))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const todayS=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
  const ab=async()=>{const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}};await ab();
  await p.locator('text=/賽事與紀錄/').first().click();await W(400);await p.click('[data-act=cupcreate]');await W(300);
  await p.locator('.sheet input[type=text]').first().fill('測試盃');await p.locator('.sheet .primary').first().click();await W(500);
  const DBK=await p.evaluate(()=>Object.keys(localStorage).find(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d&&Array.isArray(d.cups)}catch(e){return false}}));
  const cup=()=>p.evaluate(K=>JSON.parse(localStorage.getItem(K)).cups[0],DBK);
  const tab=async v=>{const t=p.locator('[data-act=cuptab][data-v='+v+']');if(await t.count()){await t.click();await W(250)}};
  // 1. 名冊：隊名有填，只打姓名就是還沒有背號的球員
  await tab('teams');await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  const hint=await p.locator('.sheet').innerText();
  ok('roster help shows example, no 身分 text',/7 陳大文/.test(hint)&&/沒有背號就只打姓名/.test(hint)&&!/身分寫 L/.test(hint),hint);
  await p.fill('#ct-name','藍隊');await p.fill('#ct-text','1 王小明\n林小華\n陳大文 L\n教練 王教練');await p.click('[data-act=cupteamsave]');await W(400);
  ok('saved without error',await p.locator('.sheet').count()===0,await p.locator('.sheet').innerText().catch(()=>''));
  let c=await cup(),blue=c.teams.find(t=>t.team.name==='藍隊');
  ok('names without number kept',blue&&blue.team.players.length===3&&blue.team.players.filter(q=>q.no===null).map(q=>q.name).join()==='林小華,陳大文',blue&&blue.team.players);
  ok('team card shows missing numbers',/3 人・2 人缺背號/.test(await p.locator('[data-act=cupteam][data-id]').first().innerText()));
  await p.locator('[data-act=cupteam][data-id]').first().click();await W(300);const tx=await p.inputValue('#ct-text');
  ok('edit text has bare names, no null',/^林小華$/m.test(tx)&&!/null/.test(tx),tx);await p.click('.sheet [data-act=close]');await W(200);
  // 1b. 一次貼好幾隊（隊名空著）：只有名字的那行還是隊名；CSV 背號空著也可以
  await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);
  await p.fill('#ct-text','男子組名單\n白隊\n1 甲一\n2 甲二\n黑隊\n3 乙一\n男子組,白隊,,丙三');await p.click('[data-act=cupteamsave]');await W(400);
  c=await cup();const white=c.teams.find(t=>t.team.name==='白隊'),black=c.teams.find(t=>t.team.name==='黑隊');
  ok('multi-team paste: headers still teams',white&&black&&c.teams.length===3,c.teams.map(t=>t.team.name));
  ok('csv empty number = player without number',white&&white.team.players.length===3&&white.team.players.some(q=>q.no===null&&q.name==='丙三'),white&&white.team.players);
  // 2. 新增比賽：版面、選擇器
  await tab('sched');await p.click('[data-act=scnew]');await W(300);
  const lay=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {d:r('#sc-date').top,t:r('#sc-time').top,c:r('#sc-court').top,v:r('.sheet [data-act=scdiv]').top,sl:r('.scslot').height,lab:getComputedStyle(document.querySelector('.scf>span')).display,
    list:document.querySelectorAll('.sheet [data-act=scpick]').length,listVis:[...document.querySelectorAll('.sheet [data-act=scpick]')].filter(x=>{const q=x.getBoundingClientRect(),l=document.querySelector('.scteams').getBoundingClientRect();return q.bottom<=l.bottom+1}).length,native:document.querySelectorAll('.sheet input[type=date],.sheet input[type=time]').length}});
  ok('date and time on one row',Math.abs(lay.d-lay.t)<2,lay);ok('court and division on one row',Math.abs(lay.c-lay.v)<12,lay);
  ok('slots shorter',lay.sl<=52,lay);ok('no native date/time inputs',lay.native===0,lay);ok('all 3 teams visible in list',lay.listVis===3,lay);
  const slotTx=await p.locator('.scslots').innerText();ok('no 第一隊/第二隊 words',!/第一隊|第二隊/.test(slotTx)&&/點下面的隊伍/.test(slotTx)&&/選隊伍/.test(slotTx),slotTx);
  const cur=await p.evaluate(()=>{const e=document.querySelector('.scslot.cur'),cs=getComputedStyle(e),ok=getComputedStyle(document.documentElement).getPropertyValue('--ok').trim();return {b:cs.borderTopColor,st:cs.borderTopStyle,w:cs.borderTopWidth,ok}});
  ok('selected slot green solid',cur.st==='solid'&&cur.w==='2px',cur);
  if(SHOT)await p.screenshot({path:SHOT+'/f-new.png'});
  ok('default date today',await scGet(p,'#sc-date')===todayS());
  await p.click('#sc-time');await W(200);
  ok('time wheel 24 hours + 60 minutes',await p.locator('.sheet .scwlist[data-wk=h] .scwi').count()===24&&await p.locator('.sheet .scwlist[data-wk=m] .scwi').count()===60);
  ok('team list hidden while picking',await p.locator('.sheet .scteams').count()===0);
  if(SHOT)await p.screenshot({path:SHOT+'/f-time.png'});
  const wheel=async(k,i)=>{await p.evaluate(([k,i])=>{const el=document.querySelector('.scwlist[data-wk='+k+']'),ih=el.querySelector('.scwi').offsetHeight;el.scrollTop=i*ih;el.dispatchEvent(new Event('scroll'))},[k,i]);await W(450)};
  await wheel('h',15);ok('scroll hours sets time, panel stays',await scGet(p,'#sc-time')==='15:00'&&await p.locator('.scpk').count()===1,await scGet(p,'#sc-time'));
  ok('wheel scrolled to value after render',await p.evaluate(()=>{const el=document.querySelector('.scwlist[data-wk=h]');return Math.round(el.scrollTop/el.querySelector('.scwi').offsetHeight)})===15);
  await p.click('.sheet .scwlist[data-wk=m] .scwi[data-v="01"]');await W(500);ok('tap minute item',await scGet(p,'#sc-time')==='15:01');
  await p.evaluate(()=>document.querySelector('.sheet [data-act=scwstep][data-k=m][data-d="1"]').click());await W(500);ok('arrow step',await scGet(p,'#sc-time')==='15:02');
  await p.focus('.sheet .scwlist[data-wk=h]');await p.keyboard.press('ArrowDown');await W(500);ok('keyboard arrow',await scGet(p,'#sc-time')==='16:02');
  await p.evaluate(()=>document.querySelector('.sheet [data-act=scwstep][data-k=h][data-d="-1"]').click());await W(400);
  await p.click('.sheet .scwlist[data-wk=h] .scwi[aria-selected=true]');await W(150);ok('tap center number opens typing',await p.locator('#sc-tin').count()===1);
  await p.fill('#sc-tin','2599');await p.click('.sheet [data-act=sctok]');await W(150);
  ok('bad custom time rejected',/四個數字/.test(await p.locator('.sheet').innerText())&&await scGet(p,'#sc-time')==='15:02');
  await p.fill('#sc-tin','1517');await p.press('#sc-tin','Enter');await W(150);ok('custom time 1517',await scGet(p,'#sc-time')==='15:17'&&await p.locator('.scpk').count()===0);
  await p.click('#sc-time');await W(150);await p.click('.sheet [data-act=sctnone]');await W(150);ok('時間未定',await scGet(p,'#sc-time')==='');
  await p.click('#sc-time');await W(150);await p.click('.sheet [data-act=scpkdone]');await W(150);ok('done with no time takes 08:00',await scGet(p,'#sc-time')==='08:00');
  await p.click('#sc-time');await W(150);await p.click('.sheet .scwlist[data-wk=h] .scwi[aria-selected=true]');await W(120);await p.fill('#sc-tin','1517');await p.press('#sc-tin','Enter');await W(150);
  await p.click('#sc-date');await W(150);
  ok('calendar shows today',await p.locator('.sccal .td').count()===1&&await p.locator('.sccal [data-act=scday][aria-pressed=true]').count()===1);
  if(SHOT)await p.screenshot({path:SHOT+'/f-date.png'});
  await p.click('.sccalh [data-act=sccal][data-v="1"]');await W(100);await p.locator('.sccal [data-act=scday]').nth(4).click();await W(150);
  const nd=await scGet(p,'#sc-date');ok('next month day 5',/-05$/.test(nd)&&nd>todayS(),nd);
  await scDate(p,todayS());await scTime(p,'10:00');await p.fill('#sc-court','甲');
  const pick=async n=>{await p.locator('.sheet [data-act=scpick]').filter({hasText:new RegExp('^\\s*'+n)}).first().click();await W(150)};
  await pick('藍隊');await pick('白隊');
  await p.locator('.scslot').nth(0).click();await W(150);
  const fc=await p.evaluate(()=>{const e=document.querySelectorAll('.scslot')[0],cs=getComputedStyle(e),t=document.createElement('i');t.style.color='var(--ok)';document.body.appendChild(t);const okc=getComputedStyle(t).color;t.remove();return {b:cs.borderTopColor,okc,cur:e.classList.contains('cur')}});
  ok('tap filled slot shows green (A6)',fc.cur&&fc.b===fc.okc,fc);
  await p.click('[data-act=scsave1][data-v=next]');await W(300);
  await pick('白隊');await pick('藍隊');await p.click('[data-act=scsave1]:not([data-v])');await W(300);
  const wt=await p.locator('.sheet .warning').innerText().catch(()=>'');
  ok('rematch warning',/重複對戰/.test(wt)&&/同兩隊/.test(wt)&&wt.split('\n').filter(l=>/第 1 場/.test(l)).length===1,wt);
  ok('back-to-edit button visible (A8)',await p.evaluate(()=>{const b=document.querySelector('.sheet [data-act=scwarnno]');if(!b)return false;const r=b.getBoundingClientRect(),sh=document.querySelector('.sheet');sh.scrollTop=sh.scrollHeight;const r2=b.getBoundingClientRect();return r2.bottom<=innerHeight&&r2.top>=0}));
  ok('team list hidden while warning',await p.locator('.sheet .scteams').count()===0);
  await p.click('[data-act=scsave1][data-force]');await W(300);c=await cup();ok('saved anyway',c.sched.filter(x=>!x.del).length===2);
  await p.click('[data-act=scnew]');await W(300);ok('new: last + 1h',await scGet(p,'#sc-time')==='12:00',await scGet(p,'#sc-time'));
  await scTime(p,'11:50');await pick('黑隊');await pick('白隊');await p.click('[data-act=scsave1][data-v=next]');await W(300);
  ok('next follows 50-minute gap',await scGet(p,'#sc-time')==='12:40',await scGet(p,'#sc-time'));await p.click('.sheet [data-act=close]');await W(200);
  // 存成檔案：先勾要存什麼
  await p.click('[data-act=cupsave]');await W(300);const svt=await p.locator('.sheet').innerText();
  ok('save sheet lists parts with counts',/隊伍名冊/.test(svt)&&/3 隊/.test(svt)&&/3 場/.test(svt)&&/裁判名單/.test(svt)&&/尚未建立/.test(svt)&&/測試盃_資料夾_/.test(svt),svt);
  ok('empty part disabled',await p.locator('.sheet [data-act=cupsvtog][data-v=r]').isDisabled());
  await p.click('.sheet [data-act=cupsvtog][data-v=t]');await W(150);
  ok('file name shows parts',/測試盃_賽程_\d{4}-\d{2}-\d{2}\.json/.test(await p.locator('.cupsvname').innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/f-save.png'});
  const [sdl]=await Promise.all([p.waitForEvent('download'),p.click('.sheet [data-act=cupsvgo]')]);const SF='/tmp/t1120-fix-save.json';await sdl.saveAs(SF);
  const sj=JSON.parse(fs.readFileSync(SF,'utf8'));ok('partial file: schedule only',sj.cups[0].teams.length===0&&sj.cups[0].sched.length===3&&sj.matches.length===0,{t:sj.cups[0].teams.length,s:sj.cups[0].sched.length,m:sj.matches.length});
  sj.cups[0].sched[0].court='乙';sj.cups[0].sched[0].at=Date.now()+5000;fs.writeFileSync(SF,JSON.stringify(sj));
  await p.click('.sheet [data-act=close]');await W(200);
  // 匯回同一台：隊伍不會被刪
  await p.locator('.barback').first().click();await W(300);await p.setInputFiles('#import-file',SF);await W(400);
  ok('import plan: schedule updated, no team change',/賽程更新 1 場/.test(await p.locator('.sheet').innerText())&&!/隊伍/.test(await p.locator('.sheet').innerText()),await p.locator('.sheet').innerText());await p.click('[data-act=impgo]');await W(400);
  c=await cup();ok('teams kept after importing schedule-only file',c.teams.filter(t=>!t.del).length===3&&c.sched.filter(x=>!x.del).length===3&&c.sched.some(x=>x.court==='乙'));
  await p.locator('.sheet [data-act=close]').first().click().catch(()=>{});await W(200);await p.locator('[data-act=cupopen]').first().click();await W(300);await tab('sched');
  // 3. 照賽程開始：名冊沒有的號碼
  await p.locator('[data-act=scopen]').first().click();await W(200);await p.click('[data-act=scgo]');await W(600);
  const key=async(...ds)=>{for(const d of ds){await p.click('.kp [data-act=key][data-v="'+d+'"]');await W(120)}};
  await p.locator('.rr.t1 .num').first().click();await W(200);await key(1);await p.click('.kp [data-act=add]');await W(200);
  ok('book name filled',await p.inputValue('#pn-t1-reg0')==='王小明');
  await key(1,5);await W(200);await p.click('.kp [data-act=kpclose]');await W(250);
  const bm=p.locator('.bookmiss');ok('missing number listed at top',await bm.count()===1&&/名冊沒有 15 號/.test(await bm.innerText()));
  if(SHOT)await p.screenshot({path:SHOT+'/f-miss.png'});
  await bm.click();await W(250);ok('bookfix sheet',/名冊沒有的號碼/.test(await p.locator('.sheet').innerText())&&await p.locator('#bf-15').count()===1);
  if(SHOT)await p.screenshot({path:SHOT+'/f-fix.png'});
  await p.click('.sheet [data-act=bookpick][data-no="15"]');await W(250);
  const pl=await p.locator('.sheet').innerText();ok('pick list: names without number',/15 號是名冊上的哪一位/.test(pl)&&pl.indexOf('林小華')>=0&&/還沒有背號/.test(pl),pl);
  ok('number in use not listed',!/王小明/.test(pl));
  ok('back button on second level',await p.locator('.sheet [data-act=sheetback]').count()===1);
  await p.locator('.sheet [data-act=bookset]').filter({hasText:'林小華'}).click();await W(300);
  c=await cup();blue=c.teams.find(t=>t.team.name==='藍隊');ok('cup roster: 林小華 now 15',blue.team.players.some(q=>q.no===15&&q.name==='林小華'),blue.team.players);
  ok('match name set',await p.inputValue('#pn-t1-reg1')==='林小華');ok('sheet closed, nothing missing',await p.locator('.sheet').count()===0&&await p.locator('.bookmiss').count()===0);
  await p.locator('.rr.t1 .num').nth(2).click();await W(200);await key(2,2);await W(200);await p.click('.kp [data-act=kpclose]');await W(250);
  await p.locator('.bookmiss').click();await W(250);await p.fill('#bf-22','新同學');await p.click('.sheet [data-act=bookadd][data-no="22"]');await W(300);
  c=await cup();blue=c.teams.find(t=>t.team.name==='藍隊');ok('added to cup roster',blue.team.players.some(q=>q.no===22&&q.name==='新同學'));
  ok('match name for 22',await p.inputValue('#pn-t1-reg2')==='新同學');
  // 沒有名冊的隊伍（名冊空）不提醒：黑隊不在這場；白隊有名冊，打 9 號會提醒
  await p.locator('.rr.t2 .num').first().click();await W(200);await key(9);await p.click('.kp [data-act=kpclose]');await W(250);
  ok('t2 missing listed too',await p.locator('.bookmiss[data-team=t2]').count()===1);
  ok('bookmiss not covered',await p.evaluate(()=>[...document.querySelectorAll('.bookmiss')].every(e=>{const q=e.getBoundingClientRect(),t=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return t&&e.contains(t)})));
  // 4. 打完的比賽：從名冊補姓名
  const FM=JSON.parse(fs.readFileSync(__dirname+'/all.json','utf8')).matches[0];
  await p.evaluate(([K,m])=>{const d=JSON.parse(localStorage.getItem(K));m.cup=d.cups[0].id;d.matches.push(m);d.cups[0].teams.push({id:'tq1',division:'男子組',group:'',at:Date.now(),team:{name:'範例藍隊',players:[{no:1,name:'王一'},{no:3,name:'李三'},{no:99,name:'不在'}],liberos:[],captain:null,staff:{}}});
    const it=d.cups[0].sched.filter(x=>!x.del)[1];it.mid=m.id;d.currentId=null;localStorage.setItem(K,JSON.stringify(d))},[DBK,FM]);
  await p.reload();await W(600);await ab();
  if(!await p.locator('[data-act=cuptab]').count()){await p.locator('text=/賽事與紀錄/').first().click().catch(()=>{});await W(300);await p.locator('[data-act=cupopen]').first().click();await W(300)}
  if(SHOT)await p.screenshot({path:SHOT+'/f-reload.png'});
  await tab('sched');await p.locator('.scrow').nth(1).click();await W(700);
  ok('fill note above tabs, also on other tab (A13)',await p.evaluate(()=>{const n=document.querySelector('.bookfill'),t=document.querySelector('.rtabs');return !!(n&&t)}));
  const t1b=p.locator('.rtabs [data-v=s1]');if(await t1b.count()){await t1b.click();await W(300);ok('fill note on 各局 tab',await p.locator('.bookfill').count()===1)}
  const bf=p.locator('.bookfill');ok('fill-names note on finished match',await bf.count()===1&&/2 位/.test(await bf.innerText()),await p.locator('main').innerText().then(t=>t.slice(0,300)));
  if(SHOT)await p.screenshot({path:SHOT+'/f-fill.png',fullPage:true});
  await p.click('[data-act=bookfill]');await W(400);
  const ev=await p.evaluate(([K,id])=>JSON.parse(localStorage.getItem(K)).matches.find(m=>m.id===id).events.filter(e=>e.type==='PLAYER_NAME_SET').map(e=>e.data.no+e.data.name),[DBK,FM.id]);
  ok('names filled from roster',ev.indexOf('1王一')>=0&&ev.indexOf('3李三')>=0&&ev.length===2,ev);
  ok('note gone after fill',await p.locator('.bookfill').count()===0);
  // 5. 使用教學：從目錄點進去，最後一張「回目錄」
  await p.locator('.barback').first().click().catch(()=>{});await W(300);
  for(let i=0;i<4&&!await p.locator('[data-act=helpopen]').count();i++){await p.locator('.barback').first().click().catch(()=>{});await W(300)}
  await p.locator('[data-act=helpopen]').first().click();await W(300);
  if(await p.locator('.help.menu').count()===0){await p.click('.help [data-act=helpmenu]');await W(250)}
  await p.locator('.help [data-act=helpgroup]').first().click();await W(300);
  for(let i=0;i<10&&await p.locator('#hnext[data-act=helpgo]').count();i++){await p.click('#hnext');await W(700)}
  ok('last card says 回目錄',(await p.locator('#hnext').innerText())==='回目錄');
  await p.click('#hnext');await W(300);ok('back to menu',await p.locator('.help.menu').count()===1);
  ok('no page errors',!errs.length,errs);
  console.log('t1120-fix',pass,'ok',fail,'fail');await b.close();process.exit(fail?1:0)})();

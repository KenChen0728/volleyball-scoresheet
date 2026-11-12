// 11/11 勾選比賽再備份、帶不帶名單、匯入：node tools/t1111a.js [網址] [資料 key]（先跑 build.py 和 fixture1111.py）
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.argv[2]||'file:///home/claude/nanshe/排球電子記錄表.html',KEY=process.argv[3]||'nanshe-scoresheet-v1',PREF=KEY.indexOf('vb-school')===0?'vb-school-prefs':'volleyball-prefs';
const FIX=fs.readFileSync('/tmp/fix1111.json','utf8'),XP=KEY.indexOf('vb-school')!==0;
let pass=0,fail=0;const ok=(n,v,x)=>{if(v)pass++;else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x))}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
const load=async(data)=>{await p.goto(URL);await p.evaluate(([k,v,pf])=>{localStorage.clear();if(v)localStorage.setItem(k,v);localStorage.removeItem(pf)},[KEY,data,PREF]);await p.reload();await W(150)};
const db=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const save=async(name)=>{const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=bksave]')]);const f='/tmp/'+name;await dl.saveAs(f);await W(80);return JSON.parse(fs.readFileSync(f,'utf8'))};
const pressed=sel=>p.locator(sel).getAttribute('aria-pressed');
await load(FIX);
ok('home count',(await p.locator('.bkrow').innerText()).includes('有 4 場還沒備份'),await p.locator('.bkrow').innerText());
await p.click('.herobtns [data-act=history]');await W(80);
ok('no backup-all',await p.locator('[data-act=rpall]').count()===0);
ok('select link',await p.locator('.shead [data-act=bksel]').innerText()==='選擇');
ok('section button',(await p.locator('.histtools [data-act=bksel]').innerText()).includes('選擇要備份的比賽'));
// 進入選擇模式
await p.click('.shead [data-act=bksel]');await W(60);
ok('mode on',await p.locator('.bkpick').count()===1);ok('folders hidden',await p.locator('.cupcard').count()===0);
ok('rows incl live',await p.locator('.bkone').count()===4,await p.locator('.bkone').count());
ok('live pill',(await p.locator('.bkone[data-id=mlive1]').innerText()).includes('進行中'));
ok('not backed pill',(await p.locator('.bkone[data-id=mdone1]').innerText()).includes('還沒備份'));
ok('go disabled',await p.locator('[data-act=bkgo]').isDisabled());ok('go text 0',(await p.locator('.selcount').innerText()).includes('還沒選'));
await p.click('.bkone[data-id=mdone1]');await W(40);
ok('picked',await pressed('.bkone[data-id=mdone1]')==='true');ok('go 1',(await p.locator('.selcount').innerText()).includes('已選 1 場'));ok('go enabled',!(await p.locator('[data-act=bkgo]').isDisabled()));
await p.click('.bkone[data-id=mdone1]');await W(40);ok('unpicked',await pressed('.bkone[data-id=mdone1]')==='false');
await p.click('[data-act=bkall]');await W(40);ok('all 4',(await p.locator('.selcount').innerText()).includes('已選 4 場'));ok('label none',await p.locator('[data-act=bkall]').innerText()==='全不選');
await p.click('[data-act=bkall]');await W(40);ok('none',(await p.locator('.selcount').innerText()).includes('還沒選'));ok('label all',await p.locator('[data-act=bkall]').innerText()==='全選');
await p.click('[data-act=bkcancel]');await W(40);ok('cancel exits',await p.locator('.bkpick').count()===0&&await p.locator('.cupcard').count()===2);
await p.click('.histtools [data-act=bksel]');await W(40);ok('section enters',await p.locator('.bkpick').count()===1);
await p.keyboard.press('Escape');await W(60);ok('esc exits',await p.locator('.bkpick').count()===0);
// 選兩場，名單：南社盃的隊伍、裁判
await p.click('.shead [data-act=bksel]');await W(40);await p.click('.bkone[data-id=mdone1]');await p.click('.bkone[data-id=mdone3]');await W(40);
await p.click('[data-act=bkgo]');await W(60);
ok('sheet title',(await p.locator('.sheet h2').innerText())==='備份 2 場比賽');
const opts=await p.locator('.sheet .imp').allInnerTexts();
ok('options',XP?(opts.length===2&&opts[0]==='南社盃全部隊伍名單（12 隊）'&&opts[1]==='南社盃裁判名單（8 人）'):(opts.length===1&&opts[0]==='南社盃全部隊伍名單（12 隊）'),opts);
ok('default on',(await p.locator('.sheet .imp[aria-pressed=true]').count())===opts.length);
// 取消：視窗關掉，勾的還在
await p.click('.sheet [data-act=close]');await W(50);ok('sheet closed',await p.locator('.sheet').count()===0);ok('still picked',(await p.locator('.selcount').innerText()).includes('已選 2 場'));
await p.click('[data-act=bkgo]');await W(50);await p.click('.scrim');await W(50);ok('scrim closes',await p.locator('.sheet').count()===0&&await p.locator('.bkpick').count()===1);
await p.click('[data-act=bkgo]');await W(50);
if(XP){await p.click('.sheet .imp[data-v=refs]');await W(30);ok('refs off',await pressed('.sheet .imp[data-v=refs]')==='false')}
const f1=await save('bk-two.json');
ok('file matches',f1.matches.map(m=>m.id).join()==='mdone1,mdone3',f1.matches.map(m=>m.id));
ok('file cups',f1.cups.length===1&&f1.cups[0].name==='南社盃'&&f1.cups[0].teams.length===12&&f1.cups[0].refs.length===0,f1.cups.map(c=>[c.name,c.teams.length,c.refs.length]));
ok('file app',/^volleyball-(scoresheet|school)$/.test(f1.app));
ok('mode off after save',await p.locator('.bkpick').count()===0);
ok('msg shown',(await p.locator('#rvmsg').innerText()).includes('已送出下載'),await p.locator('#rvmsg').innerText());
await p.click('.barback');await W(60);ok('home 2 left',(await p.locator('.bkrow').innerText()).includes('有 2 場還沒備份'),await p.locator('.bkrow').innerText());
// 全選：沒有比賽的校際盃也列出來
await p.click('.herobtns [data-act=history]');await W(60);await p.click('.shead [data-act=bksel]');await W(40);
ok('backed pill gone',!(await p.locator('.bkone[data-id=mdone1]').innerText()).includes('還沒備份'));
await p.click('[data-act=bkall]');await W(30);await p.click('[data-act=bkgo]');await W(60);
const opts2=await p.locator('.sheet .imp').allInnerTexts();
ok('all options',opts2.includes('校際盃全部隊伍名單（3 隊）')&&opts2.length===(XP?3:2),opts2);
await p.click('.sheet .imp >> text=校際盃全部隊伍名單');await W(30);
const f2=await save('bk-all-noschool.json');
ok('all file',f2.matches.length===4&&f2.cups.length===1&&f2.cups[0].teams.length===12&&f2.cups[0].refs.length===(XP?8:0),f2.cups.map(c=>[c.name,c.teams.length,c.refs.length]));
await p.click('.barback');await W(60);ok('home all done',(await p.locator('.bkrow').innerText()).includes('都備份過了（上次'),await p.locator('.bkrow').innerText());
await p.click('.herobtns [data-act=history]');await W(60);await p.click('.shead [data-act=bksel]');await W(40);await p.click('[data-act=bkall]');await W(30);await p.click('[data-act=bkgo]');await W(60);
const f3=await save('bk-all.json');ok('all with school',f3.cups.map(c=>c.name).join()==='南社盃,校際盃'&&f3.cups[1].teams.length===3,f3.cups.map(c=>c.name));
// 只帶比賽：資料夾外殼還在，名單不帶
await p.click('.shead [data-act=bksel]');await W(40);await p.click('.bkone[data-id=mdone2]');await p.click('[data-act=bkgo]');await W(60);
for(const v of XP?['teams','refs']:['teams'])await p.click(`.sheet .imp[data-v=${v}]`);await W(30);
const f4=await save('bk-shell.json');ok('shell',f4.cups.length===1&&f4.cups[0].id==='cupnanshe'&&f4.cups[0].teams.length===0&&f4.cups[0].refs.length===0,f4.cups);
// 匯入：新裝置
await load(null);await p.click('.herobtns [data-act=history]');await W(60);
ok('empty: no select',await p.locator('.shead [data-act=bksel]').count()===0&&await p.locator('.histtools [data-act=bksel]').isDisabled());
await p.setInputFiles('#import-file','/tmp/bk-two.json');await W(200);
const plan=await p.locator('.sheet').innerText();ok('plan',plan.includes('新增 2 場')&&plan.includes('「南社盃」資料夾：新的資料夾、新增 12 隊'),plan);
await p.click('[data-act=impgo]');await W(100);let d=await db();
ok('imported',d.matches.length===2&&d.cups.length===1&&d.cups[0].teams.length===12&&(d.cups[0].refs||[]).length===0&&d.matches.every(m=>m.cup==='cupnanshe'||!m.cup),[d.matches.length,d.cups.length]);
// 只有外殼的檔案不會刪掉這台的名單
await p.setInputFiles('#import-file','/tmp/bk-shell.json');await W(200);const plan2=await p.locator('.sheet').innerText();ok('shell plan',plan2.includes('新增 1 場')&&!plan2.includes('刪除'),plan2);
await p.click('[data-act=impgo]');await W(100);d=await db();ok('teams kept',d.cups[0].teams.length===12&&d.matches.length===3);
// 全部的檔案：校際盃也進來
await p.setInputFiles('#import-file','/tmp/bk-all.json');await W(200);await p.click('[data-act=impgo]');await W(100);d=await db();
ok('all imported',d.matches.length===4&&d.cups.length===2&&(d.cups.find(c=>c.name==='南社盃').refs||[]).length===(XP?8:0),[d.matches.length,d.cups.length]);
// 舊格式（單場、資料夾檔）照樣能匯入：回歸
ok('no errors',errs.length===0,errs);
console.log('pass',pass,'fail',fail);await b.close();process.exit(fail?1:0)})().catch(e=>{console.log('ERR',e.message);process.exit(1)});

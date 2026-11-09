// 各尺寸版面檢查：node tools/school/demo.js /tmp/mid.json mid，再 node tools/school/layout.js /tmp/mid.json 輸出資料夾 [尺寸,尺寸]
// 報告超出畫面、文字被切、主要按鈕不在畫面內；「需捲動」只是提醒，表格類頁面捲動是正常的
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const seed=fs.readFileSync(process.argv[2],'utf8'),OUT=process.argv[3]||'/tmp/school-layout',only=process.argv[4]?process.argv[4].split(','):null;
const URL_='file://'+path.resolve(__dirname,'../../school/index.html');fs.mkdirSync(OUT,{recursive:true});
const VP=[['360x640',360,640,1],['375x667',375,667,1],['390x844',390,844,1],['402x874',402,874,1],['430x932',430,932,1],['667x375',667,375,1],['844x390',844,390,1],['768x1024',768,1024,1],['820x1180',820,1180,1],['1024x768',1024,768,1],['1180x820',1180,820,1],['1280x800',1280,800,0],['1366x768',1366,768,0],['1920x1080',1920,1080,0],['2560x1440',2560,1440,0]];
const audit=(must)=>{const o=[];if(document.documentElement.scrollWidth>innerWidth+1)o.push('橫向溢出');
 document.querySelectorAll('button,input').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.height&&(r.right>innerWidth+1||r.left<-1))o.push('超出左右：'+(e.textContent||e.id).trim().slice(0,12))});
 document.querySelectorAll('.sb,.tg button,.pbtns button,.sheet button').forEach(e=>{if(e.scrollWidth>e.clientWidth+2)o.push('文字切到：'+e.textContent.trim().slice(0,14))});
 // 按鈕和輸入格的中心被別的東西蓋住（鍵盤、面板蓋住是正常的，可以捲動）
 [...document.querySelectorAll('#app button,#app input')].forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight-1)return;const t=document.elementFromPoint(r.left+r.width/2,Math.min(r.top+r.height/2,innerHeight-1));if(t&&!(t===e||e.contains(t)||t.contains(e))&&!t.closest('.kp,.sheet,.scrim,.help,.tpop'))o.push('被蓋住：'+(e.getAttribute('aria-label')||e.textContent||e.id).trim().slice(0,14))});
 must.forEach(q=>{const e=document.querySelector(q);if(!e){o.push('找不到 '+q);return}const r=e.getBoundingClientRect();if(r.bottom>innerHeight+1||r.top<0)o.push('不在畫面內 '+q)});
 const m=document.querySelector('main.page');return {o:[...new Set(o)].slice(0,5),sc:m?m.scrollHeight-m.clientHeight:0}};
(async()=>{const b=await chromium.launch();let bad=0;
for(const [name,w,h,touch] of VP){if(only&&!only.includes(name))continue;
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:!!touch});const p=await ctx.newPage();const errs=[];p.on('pageerror',x=>errs.push(x.message));
 const check=async(n,must=[])=>{await p.waitForTimeout(40);const r=await p.evaluate(audit,must);if(r.o.length){bad++;console.log(name,n,r.o.join('；'))}if(r.sc>0)console.log(' ',name,n,'需捲動',r.sc);await p.screenshot({path:`${OUT}/${name}-${n}.png`})};
 await p.goto(URL_);await p.waitForTimeout(100);await check('home',['.herocta']);
 await p.click('[data-act=new]');await p.waitForTimeout(60);await check('info');
 await p.locator('.nav [data-v=roster]').click();await check('roster');
 await p.locator('[data-act=slot][data-team=t2]').nth(7).click();await check('roster-kp',['.kp [data-act=kpclose]','.num.on']);await p.click('.kp [data-act=kpclose]');
 await p.locator('.bar .barback').click();await p.waitForTimeout(40);await p.click('[data-act=helpopen]');await p.click('[data-act=sample]');await p.waitForTimeout(60);await check('roster-sample',['.rnext .primary']);await p.locator('[data-act=slot]:not(.fill)').first().click();await check('roster-sample-kp',['.kp [data-act=kpclose]','.num.on']);await p.click('.kp [data-act=kpclose]');
 await p.evaluate(s=>{localStorage.setItem('vb-school-v2',s);location.reload()},seed);await p.waitForTimeout(250);
 await check('play',['[data-act=point]','[data-act=sheetopen]','[data-act=timeout]']);
 await p.locator('.pc.t1').nth(3).click();await check('pmenu',['.sheet [data-act=close]']);await p.click('.sheet [data-act=close]');
 await p.click('[data-act=subopen][data-team=t2]');await check('subpanel',['[data-act=subclose]']);await p.click('[data-act=subcancel]');
 await p.click('[data-act=sheetopen]');await check('rec',['.sheettabs']);
 for(const t of ['pen','note','fix']){await p.click(`[data-act=rtab][data-v=${t}]`);await check('tab-'+t)}
 if(errs.length){bad++;console.log(name,'錯誤',errs[0])}await ctx.close();
}
await b.close();console.log('版面問題',bad);process.exit(bad?1:0)})().catch(e=>{console.log('ERR',e.message.slice(0,400));process.exit(1)});

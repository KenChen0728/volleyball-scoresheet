// 11/20 新畫面在各尺寸：首頁、資料夾三個分頁、新增比賽、點開那一場、印登錄單、更多、選場地。量：左右超出、按鈕被蓋住、按鈕小於 44、字小於 12
const {scDate,scTime,scGet}=require('./scpick.js');
const {chromium}=require('playwright');const W=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8782/next/index.html',SHOT=process.env.SHOT||'';
const SIZES=[[360,640],[375,667],[390,844],[430,932],[844,390],[768,1024],[820,1180],[1180,820],[1366,768],[1920,1080]];
const issues=[];const todayS=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const measure=async(p,tag)=>{const r=await p.evaluate(()=>{const out=[];const vw=innerWidth,vh=innerHeight;
  if(document.documentElement.scrollWidth>vw+1)out.push('頁面可以左右捲 '+document.documentElement.scrollWidth);
  const root=document.querySelector('.sheet')||document;
  root.querySelectorAll('button,[role=tab],input,textarea').forEach(e=>{const rc=e.getBoundingClientRect();if(!rc.width||!rc.height)return;const st=getComputedStyle(e);if(st.visibility==='hidden'||st.display==='none')return;
    if(rc.right>vw+1||rc.left<-1)out.push('超出畫面：'+(e.textContent||e.id).trim().slice(0,14));
    if(e.tagName==='BUTTON'&&rc.height<43.5&&!e.closest('.hdots')&&!e.classList.contains('linkbtn'))out.push('按鈕太矮 '+Math.round(rc.height)+'：'+e.textContent.trim().slice(0,12));
    let sc=e.parentElement,hid=false;while(sc&&sc!==document.body){const o=getComputedStyle(sc).overflowY;if((o==='auto'||o==='scroll')&&sc.scrollHeight>sc.clientHeight+1){const q=sc.getBoundingClientRect(),cy=rc.top+rc.height/2;if(cy<q.top||cy>q.bottom){hid=true;break}
      // 捲得開的容器裡，被黏在下面的按鈕蓋住不算（捲過去就看得到）
      const t0=document.elementFromPoint(rc.left+rc.width/2,cy);if(t0&&sc.contains(t0)&&getComputedStyle(t0.closest('button')||t0).position!=='static'){hid=true;break}
      if(t0&&t0.closest('.sheet>button:last-child')&&sc.contains(e)){hid=true;break}}sc=sc.parentElement}
    if(!hid&&rc.top>=0&&rc.bottom<=vh&&rc.left>=0&&rc.right<=vw){const t=document.elementFromPoint(rc.left+rc.width/2,rc.top+rc.height/2);if(t&&!e.contains(t)&&!t.contains(e)&&!t.closest('.sheet')===!e.closest('.sheet'))out.push('被蓋住：'+(e.textContent||e.id).trim().slice(0,14)+' ← '+(t.className||t.tagName))}});
  document.querySelectorAll('.sheet *,main *,.home *').forEach(e=>{if(e.children.length)return;const t=e.textContent.trim();if(!t)return;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<12&&e.offsetParent)out.push('字太小 '+fs+'：'+t.slice(0,10))});
  return [...new Set(out)].slice(0,12)});r.forEach(x=>issues.push(tag+'｜'+x))};
(async()=>{const b=await chromium.launch();
  for(const [w,h] of SIZES){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<1100});const p=await ctx.newPage();
    await p.goto(URL);await p.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await p.reload();await W(400);
    const a=p.locator('.sheet.about [data-act=aboutclose]');if(await a.count()){await a.first().click();await W(200)}
    const T=w+'x'+h;
    await p.click('.herobtns [data-act=history]');await W(300);await p.click('[data-act=cupcreate]');await W(300);await p.locator('.sheet input[type=text]').first().fill('範例盃');await p.locator('.sheet .primary').first().click();await W(400);
    await p.locator('[data-act=cupteam]:not([data-id])').first().click();await W(300);await p.fill('#ct-text','男子組球員名單\n範例藍隊A\n王小明1\n範例藍隊B\n陳大文2\n範例橘隊\n李小美3\n範例綠隊\n張小英4\n範例紅隊\n黃小芳5\n範例白隊\n林小華6\n範例黑隊\n吳小玲7');await p.click('[data-act=cupteamsave]');await W(400);
    await measure(p,T+' 隊伍分頁');
    await p.click('[data-act=cuptab][data-v=sched]');await W(300);
    for(const [tm,ct] of [['09:00','甲'],['09:00','乙'],['10:00','甲']]){await p.click('[data-act=scnew]');await W(300);await scDate(p,todayS());await scTime(p,tm);await p.fill('#sc-court',ct);
      const picks=p.locator('.sheet [data-act=scpick]');await picks.nth(ct==='甲'?0:2).click();await W(120);await picks.nth(ct==='甲'?1:3).click();await W(120);
      if(tm==='09:00'&&ct==='甲')await measure(p,T+' 新增比賽');
      if(tm==='09:00'&&ct==='甲'){await p.click('#sc-time');await W(200);await measure(p,T+' 選時間');await p.click('.sheet [data-act=sctin]');await W(150);await measure(p,T+' 自己輸入時間');await p.click('.sheet [data-act=scpkdone]');await W(150);
        await p.click('#sc-date');await W(200);await measure(p,T+' 選日期');if(SHOT)await p.screenshot({path:SHOT+'/L-date-'+T+'.png'});await p.click('.sheet [data-act=scpkdone]');await W(150)}
      await p.click('[data-act=scsave1]:not([data-v])');await W(300);if(await p.locator('[data-act=scsave1][data-force]').count()){await p.click('[data-act=scsave1][data-force]');await W(300)}}
    await measure(p,T+' 賽程分頁');
    const ord=(await p.locator('.cupcourts button').allInnerTexts()).join(',');if(ord!=='全部,場地：甲,場地：乙')issues.push(T+'｜場地順序 '+ord);if(SHOT)await p.screenshot({path:SHOT+'/L-sched-'+T+'.png'});
    await p.locator('[data-act=scopen]').first().click();await W(300);await measure(p,T+' 點開那一場');await p.click('.sheet [data-act=close]');await W(200);
    await p.click('[data-act=scprint]');await W(300);await measure(p,T+' 印登錄單');await p.click('.sheet [data-act=scpgo]');await p.waitForSelector('.regprev img',{timeout:30000});await W(300);await measure(p,T+' 登錄單預覽');if(SHOT)await p.screenshot({path:SHOT+'/L-prev-'+T+'.png'});await p.click('.sheet [data-act=close]');await W(200);
    await p.click('[data-act=cupmore]');await W(300);await measure(p,T+' 更多');await p.click('.sheet [data-act=close]');await W(200);
    await p.click('[data-act=cuptab][data-v=refs]');await W(300);await measure(p,T+' 裁判分頁');
    await p.click('.barback');await W(300);await p.locator('[data-act=home]').first().click();await W(400);
    await measure(p,T+' 首頁');if(SHOT)await p.screenshot({path:SHOT+'/L-home-'+T+'.png'});
    if(await p.locator('.hcourtbtn').count()){await p.click('.hcourtbtn');await W(300);await measure(p,T+' 選場地');await p.click('.sheet [data-act=close]');await W(200)}
    await p.locator('[data-act=hscopen]').first().click();await W(300);await p.click('.sheet [data-act=scgo]');await W(600);
    const nb=p.locator('.num[data-kind=reg]').first();await nb.click();await W(200);await p.click('.kp [data-act=key][data-v="9"]');await W(120);await p.click('.kp [data-act=kpclose]');await W(300);
    if(!await p.locator('.bookmiss').count())issues.push(T+'｜名單頁沒有出現名冊沒有的號碼');else{await measure(p,T+' 名單頁名冊沒有');if(SHOT)await p.screenshot({path:SHOT+'/L-miss-'+T+'.png'});await p.locator('.bookmiss').first().click();await W(300);await measure(p,T+' 對照名冊');await p.click('.sheet [data-act=bookpick]');await W(300);await measure(p,T+' 名冊上的人');}
    await ctx.close()}
  console.log(issues.length?issues.join('\n'):'沒有問題');console.log('t1120-layout',issues.length,'issues');await b.close()})();

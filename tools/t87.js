const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(),pg=await b.newPage({viewport:{width:393,height:760}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/nanshe/test/t.html'); let ok=0,bad=0;
 const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
 const st=()=>pg.evaluate(()=>T.reduce(T.current().events).sets[1]);
 await pg.evaluate(()=>{
  var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
  [['t1','藍',[1,3,5,7,9,11,18,12,13],[12,13]],['t2','橘',[2,4,6,8,10,14,77,15],[15]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
  T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t2'});
  [[1,3,5,7,9,11],[2,4,6,8,10,14]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
  T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();
 });
 // 固定格
 T('slots t1',await pg.locator('.strip.t1 .lc').count()===2);
 T('slots t2 (one empty)',await pg.locator('.strip.t2 .lc').count()===2&&await pg.locator('.strip.t2 .lc.empty').count()===1);
 T('cap boxes',await pg.locator('.capbox').count()===2);
 T('cap shows 1',(await pg.textContent('.capbox.t1')).includes('1'));
 // 對稱：右隊隊長格在左邊（靠網）
 const bx=async q=>(await pg.locator(q).boundingBox()).x;
 T('left cap near net',await bx('.capbox.t1')>await bx('.strip.t1 .lc >> nth=1'));
 T('right cap near net',await bx('.capbox.t2')<await bx('.strip.t2 .lc >> nth=0'));
 // 自由上場、互換、換回
 await pg.click('[data-act=libcell][data-no="12"]'); await pg.click('.pc.t1[data-pos="5"]');
 let c=await st(); T('12 in',c.cur.t1.indexOf(12)>=0);
 T('12 shows 下一球可換',(await pg.textContent('[data-act=libback][data-no="12"]')).includes('下一球可換'));
 T('13 disabled same rally',await pg.isDisabled('[data-act=libcell][data-no="13"]'));
 await pg.waitForTimeout(800);await pg.click('[data-act=serve]');await pg.waitForTimeout(400);await pg.click('[data-act=point][data-team=t1]');await pg.waitForTimeout(500);
 T('13 shows 互換',(await pg.textContent('[data-act=libcell][data-no="13"]')).includes('互換'));
 await pg.click('[data-act=libcell][data-no="13"]');
 c=await st(); T('one tap swap',c.cur.t1.indexOf(13)>=0&&c.cur.t1.indexOf(12)<0);
 await pg.waitForTimeout(800);await pg.click('[data-act=serve]');await pg.waitForTimeout(400);await pg.click('[data-act=point][data-team=t1]');await pg.waitForTimeout(500);
 const lfr=await pg.evaluate(()=>!!document.querySelector('.pc.bad'));
 if(lfr){await pg.click('.pc.bad')}else{T('libback text',(await pg.textContent('[data-act=libback][data-no="13"]')).includes('換回'));await pg.click('[data-act=libback][data-no="13"]')}
 c=await st(); T('back out',c.cur.t1.indexOf(13)<0&&c.cur.t1.indexOf(12)<0);
 // 隊長不在場：替補換下 1 號 → 隊長格紅色，點它指定
 await pg.waitForTimeout(800);
 await pg.evaluate(()=>{var s=T.reduce(T.current().events),c=s.sets[1];T.dispatch('SUB',{set:1,team:'t1',idx:c.cur.t1.indexOf(1),out:1,in:18,exc:false,injury:false});T.render()});
 T('cap need',await pg.$('.capbox.t1.need')!==null);
 T('no warnrow',!(await pg.$('.warnrow')));
 T('hint text',(await pg.textContent('.lockline')).includes('隊長'));
 await pg.screenshot({path:'/home/claude/nanshe/test/t87a.png'});
 await pg.click('.capbox.t1'); await pg.click('[data-act=gcset][data-no="3"]');
 T('cap set 3',(await pg.textContent('.capbox.t1')).includes('3')&&!(await pg.$('.capbox.t1.need')));
 // 強制換人：例外替補不顯示受傷
 await pg.evaluate(()=>{T.ui.pen={team:'t2',kind:'D',ok:{kind:'D',who:4}};T.render()}); await pg.click('[data-act=penyes]');
 await pg.click('.kp.forced [data-act=forceexc]');
 T('no injury toggle',!(await pg.$('.kp.forced .excinj')));
 await pg.click('.kp.forced [data-act=forceundo]');
 // 提示字關閉
 await pg.evaluate(()=>{T.ui.page='play';T.render()});
 await pg.goto('file:///home/claude/nanshe/test/t.html');await pg.evaluate(()=>{T.setView('home');T.render()});
 await pg.click('[data-act=hints][data-v=off]');
 T('nohint class',await pg.evaluate(()=>document.documentElement.classList.contains('nohint')));
 await pg.click('[data-act=hints][data-v=on]');
 T('hint back',await pg.evaluate(()=>!document.documentElement.classList.contains('nohint')));
 // 開賽前返回回上一步
 await pg.click('[data-act=new]'); await pg.evaluate(()=>{T.ui.page='toss';T.render()});
 await pg.goBack(); await pg.waitForTimeout(200);
 T('toss->roster',await pg.evaluate(()=>T.view==='setup'&&T.ui.page==='roster'));
 await pg.goBack(); await pg.waitForTimeout(200);
 T('roster->info',await pg.evaluate(()=>T.ui.page==='info'));
 // 回主畫面說明（名單有輸入才算有資料）
 await pg.evaluate(()=>{T.dispatch('TEAM_NAME_SET',{team:'t1',value:'甲'});T.render()});
 await pg.goBack(); await pg.waitForTimeout(200);
 T('home',await pg.evaluate(()=>T.view==='home'));
 T('homenote',await pg.$('.homenote')!==null);
 T('no errors',errs.length===0); if(errs.length)console.log(errs);
 console.log('ok',ok,'bad',bad); await b.close();
})();

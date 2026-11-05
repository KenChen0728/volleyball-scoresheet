const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(),pg=await b.newPage({viewport:{width:402,height:760}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/nanshe/test/t.html'); let ok=0,bad=0;
 const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
 const st=()=>pg.evaluate(()=>T.reduce(T.current().events).sets[1]);
 // 從主畫面開始，讓返回有上一頁可回
 await pg.evaluate(()=>{
  var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
  [['t1','藍',[1,3,5,7,9,11,18,12],[12]],['t2','橘',[2,4,6,8,10,14,77],[]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
  T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t2'});
  [[1,3,5,7,9,11],[2,4,6,8,10,14]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
  T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();
 });
 // 藍隊接發球：自由 12 換 pos4 (idx4=9)。藍隊得分換發後輪轉，9 的位置 4→3（前排）
 await pg.click('.pc.t1[data-pos="4"]'); await pg.click('[data-act=pmlin][data-no="12"]');
 T('lib in',(await st()).cur.t1.indexOf(12)>=0);
 await pg.waitForTimeout(800); await pg.click('[data-act=serve]'); await pg.waitForTimeout(400);
 await pg.click('[data-act=point][data-team=t1]'); await pg.waitForTimeout(500);
 T('no modal',!(await pg.$('.sheet')));
 T('bad flashing',await pg.$('.pc.t1.bad')!==null);
 T('hint',(await pg.textContent('.lockline')).includes('點閃的 L 換回 9 號'));
 await pg.waitForTimeout(500);
 let ev0=await pg.evaluate(()=>T.current().events.length);
 await pg.click('[data-act=serve]');
 T('serve blocked',await pg.evaluate(()=>T.current().events.length)===ev0);
 await pg.screenshot({path:'/home/claude/nanshe/test/t86a.png'});
 await pg.click('.pc.t1.bad');
 let c=await st(); T('swapped back',c.cur.t1.indexOf(9)>=0&&c.cur.t1.indexOf(12)<0);
 T('no bad now',!(await pg.$('.pc.bad')));
 await pg.waitForTimeout(500); await pg.click('[data-act=serve]');
 T('serve ok',(await st()).live===true);
 // 返回鍵
 await pg.click('[data-act=point][data-team=t1]'); await pg.waitForTimeout(400);
 await pg.click('[data-act=sheetopen]'); T('sheet open',await pg.evaluate(()=>T.ui.liveSheet));
 await pg.goBack(); await pg.waitForTimeout(200);
 T('back closes sheet',await pg.evaluate(()=>!T.ui.liveSheet&&T.view==='setup'));
 await pg.click('[data-act=sheet][data-v=more]'); T('more open',await pg.$('.sheet')!==null);
 await pg.goBack(); await pg.waitForTimeout(200);
 T('back closes more',!(await pg.$('.sheet')));
 await pg.goBack(); await pg.waitForTimeout(200);
 T('back on play stays',await pg.evaluate(()=>T.view==='setup'&&T.ui.page==='play'));
 T('leave toast',(await pg.textContent('.lockline')).includes('離開比賽'));
 await pg.goBack(); await pg.waitForTimeout(200);
 T('still in app',pg.url().includes('t.html')&&await pg.evaluate(()=>T.view==='setup'));
 T('no errors',errs.length===0); if(errs.length)console.log(errs);
 console.log('ok',ok,'bad',bad); await b.close();
})();

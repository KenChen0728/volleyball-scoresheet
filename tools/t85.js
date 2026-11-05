const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(),pg=await b.newPage({viewport:{width:402,height:760}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file:///home/claude/nanshe/test/t.html'); let ok=0,bad=0;
 const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
 const st=()=>pg.evaluate(()=>T.reduce(T.current().events).sets[1]);
 await pg.evaluate(()=>{
  var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
  [['t1','藍',[1,3,5,7,9,11,18,12,13],[12,13]],['t2','橘',[2,4,6,8,10,14,77,15],[15]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
  T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t1'});
  [[1,3,5,7,9,11],[2,4,6,8,10,14]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
  T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();
 });
 const y=async sel=>(await pg.locator(sel).boundingBox()).y;
 const y0=await y('.pbtns');
 // 後排 t2 pos5 (idx5=14) 不在發球：點了有選單
 await pg.click('.pc.t2[data-pos="5"]');
 T('menu opens',await pg.isVisible('[data-act=pmlin][data-no="15"]'));
 await pg.screenshot({path:'/home/claude/nanshe/test/t85a.png'});
 await pg.click('[data-act=pmlin][data-no="15"]');
 let c=await st(); T('libero in',c.cur.t2.indexOf(15)>=0);
 // 點自由球員：換回要隔一球
 await pg.click('.pc.t2[data-pos="5"]');
 T('libout disabled same rally',await pg.isDisabled('[data-act=pmlout]'));
 await pg.click('.sheet [data-act=close]');
 // 前排：只有替補
 await pg.click('.pc.t1[data-pos="2"]');
 T('front no libero',!(await pg.$('[data-act=pmlin]')));
 T('front sub',await pg.isEnabled('[data-act=pmsub]'));
 await pg.click('[data-act=pmsub]');
 T('sub panel idx',await pg.evaluate(()=>T.ui.sub&&T.ui.sub.idx===2));
 await pg.screenshot({path:'/home/claude/nanshe/test/t85b.png'});
 await pg.click('[data-act=subcancel]');
 // 舊方法：點 L 號碼再點格子
 await pg.click('[data-act=libcell][data-no="12"]');
 T('libmode',await pg.$('.pcourt.libmode')!==null);
 T('pbtns no jump (libhint)',Math.abs(await y('.pbtns')-y0)<1);
 await pg.click('.pc.t1[data-pos="4"]');
 c=await st(); T('chip way',c.cur.t1.indexOf(12)>=0);
 T('pbtns no jump',Math.abs(await y('.pbtns')-y0)<1);
 // 發球中點格子
 await pg.waitForTimeout(800); await pg.click('[data-act=serve]'); await pg.waitForTimeout(400);
 T('pbtns no jump live',Math.abs(await y('.pbtns')-y0)<1);
 await pg.click('.pc.t1[data-pos="1"]');
 T('live no menu',!(await pg.$('[data-act=pmsub]')));
 T('toast',(await pg.textContent('.lockline')).includes('球在進行中'));
 T('pbtns no jump toast',Math.abs(await y('.pbtns')-y0)<1);
 T('no errors',errs.length===0); if(errs.length)console.log(errs);
 console.log('ok',ok,'bad',bad); await b.close();
})();

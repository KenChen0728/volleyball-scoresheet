const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:393,height:760},hasTouch:true,isMobile:true});const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));let ok=0,bad=0;const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
await pg.goto('file:///home/claude/nanshe/test/t.html');
const setup=async()=>pg.evaluate(()=>{var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
 [['t1','藍',[1,3,5,7,9,11,18,12],[12]],['t2','橘',[2,4,6,8,10,14,77,15],[15]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
 T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t2'});
 [[1,3,5,7,9,11],[2,4,6,8,10,14]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
 T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();});
await setup();
const swipe=async(dy)=>pg.evaluate(async(dy)=>{const sh=document.querySelector('.sheet');const r=sh.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+20;
 const mk=(yy)=>new Touch({identifier:1,target:sh,clientX:x,clientY:yy});
 sh.dispatchEvent(new TouchEvent('touchstart',{touches:[mk(y)],changedTouches:[mk(y)],bubbles:true}));
 for(let i=1;i<=10;i++){await new Promise(r=>setTimeout(r,16));sh.dispatchEvent(new TouchEvent('touchmove',{touches:[mk(y+dy*i/10)],changedTouches:[mk(y+dy*i/10)],bubbles:true}))}
 sh.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[mk(y+dy)],bubbles:true}));},dy);
// 暫停確認：隊名在標題同一行、有把手、往下滑關閉
await pg.click('[data-act=timeout][data-team=t1]');
T('tpill in h2',await pg.$('.sheet h2 .tpill.t1')!==null);
T('no toask',!(await pg.$('.toask')));
T('swipe class',await pg.$('.sheet.swipe')!==null);
await pg.screenshot({path:'/home/claude/nanshe/test/t89a.png'});
await swipe(30); await pg.waitForTimeout(300);
T('small swipe stays',await pg.$('.sheet')!==null);
await swipe(220); await pg.waitForTimeout(400);
T('big swipe closes',!(await pg.$('.sheet')));
T('no timeout recorded',await pg.evaluate(()=>T.reduce(T.current().events).sets[1].timeouts.t1.length===0));
// 點球員選單：關閉、往下滑
await pg.click('.pc.t1[data-pos="5"]'); T('pmenu 關閉',(await pg.textContent('.sheet [data-act=close]'))==='關閉');
await swipe(250); await pg.waitForTimeout(400); T('pmenu swiped',!(await pg.$('.sheet')));
// 隊長在場上：點了有文字
await pg.click('.capbox.t1'); T('cap toast',(await pg.textContent('.lockline')).includes('不用指定'));
T('cap fixed style',await pg.$('.capbox.t1.fixed')!==null);
// 替補取消不是紅色
await pg.click('[data-act=subopen][data-team=t1]'); T('subcancel neutral',!(await pg.$('[data-act=subcancel].danger')));
await pg.click('[data-act=subcancel]');
// 其他：提示字、球衣含自由
await pg.click('[data-act=sheet][data-v=more]'); T('hints in other',await pg.$('.sheet [data-act=hints]')!==null);
T('jersey label',(await pg.textContent('.sheet')).includes('含自由球員'));
await pg.click('.sheet [data-act=hints][data-v=off]'); T('nohint on',await pg.evaluate(()=>document.documentElement.classList.contains('nohint')));
await pg.click('.sheet [data-act=hints][data-v=on]');
await pg.screenshot({path:'/home/claude/nanshe/test/t89b.png'});
await swipe(260); await pg.waitForTimeout(400); T('other swiped',!(await pg.$('.sheet')));
// 替補面板內顯示自由到前排警告
await pg.evaluate(()=>{T.dispatch('LIBERO_IN',{set:1,team:'t1',lib:12,idx:4});T.dispatch('SERVE',{set:1});T.dispatch('POINT',{set:1,team:'t1'});T.render()});
await pg.waitForTimeout(800);
await pg.click('[data-act=subopen][data-team=t2]');
T('warn in sub panel',(await pg.textContent('.kp')).includes('點閃的 L 換回'));
await pg.screenshot({path:'/home/claude/nanshe/test/t89c.png'});
await pg.click('[data-act=subcancel]');
// 橫向鏡像
await pg.setViewportSize({width:844,height:390}); await pg.waitForTimeout(200); await pg.evaluate(()=>T.render());
const bx=async q=>(await pg.locator(q).boundingBox()).x;
T('wide right cap near court',await bx('.capbox.t2')<await bx('.strip.t2 .lc >> nth=0'));
T('wide left cap near court',await bx('.capbox.t1')>await bx('.strip.t1 .lc >> nth=0'));
await pg.screenshot({path:'/home/claude/nanshe/test/t89d.png'});
T('no errors',errs.length===0);if(errs.length)console.log(errs);console.log('ok',ok,'bad',bad);await b.close()})();

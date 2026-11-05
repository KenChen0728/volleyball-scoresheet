const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),pg=await b.newPage({viewport:{width:402,height:874}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));let ok=0,bad=0;const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
await pg.goto('file:///home/claude/nanshe/test/t.html');
await pg.evaluate(()=>{var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
 [['t1','藍',[1,2,3,4,5,6,7,8,12,13],[12,13]],['t2','橘',[21,22,23,24,25,26,27],[]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
 T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t2'});
 [[1,2,3,4,5,6],[21,22,23,24,25,26]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
 T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();});
const st=()=>pg.evaluate(()=>T.reduce(T.current().events));
// 新選單：三顆
await pg.click('.pc.t1[data-pos="4"]');
T('three buttons',await pg.locator('.sheet .pm3 .pmb').count()===3);
T('no small text',!(await pg.$('.sheet .pmb small')));
await pg.screenshot({path:'/home/claude/nanshe/test/t98a.png'});
// 兩位自由 → 第二層選號碼
await pg.click('[data-act=pmstep][data-v=lib]'); T('lib list 2',await pg.locator('.sheet [data-act=pmlin]').count()===2);
await pg.click('.sheet [data-act=pmlin][data-no="13"]');
T('libero 13 in',(await st()).sets[1].cur.t1.indexOf(13)>=0);
// 替補直接換好
await pg.click('.pc.t1[data-pos="1"]'); await pg.click('[data-act=pmstep][data-v=sub]');
await pg.screenshot({path:'/home/claude/nanshe/test/t98b.png'});
await pg.click('.sheet [data-act=pmsubin][data-no="7"]');
let s=await st(); T('sub direct',s.sets[1].cur.t1.indexOf(7)>=0&&!(await pg.$('.sheet')));
// 場上隊長（新的一場）
await pg.evaluate(()=>{var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
 [['t1','藍',[1,2,3,4,5,6,7,8,9],[]],['t2','橘',[21,22,23,24,25,26,27],[]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]})});
 T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t1'});
 [[1,2,3,4,5,6],[21,22,23,24,25,26]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
 T.dispatch('SET_STARTED',{set:1});
 var sub=(n,o,i)=>{var c=T.reduce(T.current().events).sets[n];T.dispatch('SUB',{set:n,team:'t1',idx:c.cur.t1.indexOf(o),out:o,in:i,exc:false,injury:false})};
 sub(1,1,7);T.dispatch('GAME_CAPTAIN_SET',{set:1,team:'t1',no:2});
 T.dispatch('SERVE',{set:1});T.dispatch('POINT',{set:1,team:'t1'});
 sub(1,2,8);T.dispatch('GAME_CAPTAIN_SET',{set:1,team:'t1',no:3});
 window.__sub=sub;
 T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();});
T('set1 cap 3',(await pg.textContent('.capbox.t1')).includes('3'));
const ord=await pg.evaluate(()=>T.reduce(T.current().events).teams.t1.capOrder);
T('order 2,3',JSON.stringify(ord)==='[2,3]');
await pg.evaluate(()=>{for(var j=0;j<24;j++){T.dispatch('SERVE',{set:1});T.dispatch('POINT',{set:1,team:'t1'})}T.dispatch('SET_ENDED',{set:1});T.dispatch('SET_ADVANCED',{});
 [[1,2,3,4,5,6],[21,22,23,24,25,26]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:2,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:2,team:k})});
 T.dispatch('SET_STARTED',{set:2});T.ui.page='play';T.render()});
T('set 2',(await pg.evaluate(()=>T.reduce(T.current().events).setNo))===2);
T('set2 cap 1',(await pg.textContent('.capbox.t1')).includes('1'));
await pg.evaluate(()=>{__sub(2,1,7);T.render()});
T('set2 auto 2',(await pg.textContent('.capbox.t1')).includes('2')&&!(await pg.$('.capbox.t1.need')));
await pg.evaluate(()=>{T.dispatch('SERVE',{set:2});T.dispatch('POINT',{set:2,team:'t2'});__sub(2,2,8);T.render()});
T('set2 auto 3',(await pg.textContent('.capbox.t1')).includes('3'));
T('no errors',errs.length===0);if(errs.length)console.log(errs);console.log('ok',ok,'bad',bad);await b.close()})();

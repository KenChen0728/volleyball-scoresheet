const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),pg=await b.newPage({viewport:{width:393,height:760}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));let ok=0,bad=0;const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
await pg.goto('file:///home/claude/nanshe/test/t.html');
const setup=(bench)=>pg.evaluate((bench)=>{var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
 [['t1','藍',[1,3,5,7,9,11,12].concat(bench),[12]],['t2','橘',[2,4,6,8,10,14,77],[]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][0]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
 T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t1'});
 [[1,3,5,7,9,11],[2,4,6,8,10,14]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
 T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();},bench);
const inj=async(no)=>{await pg.evaluate(()=>{T.ui.pen={team:'t1',kind:'INJ'};T.render()});await pg.click(`[data-act=injpick][data-no="${no}"]`)};
// 傷停：可合法替補 → 替補面板
await setup([18]);
await inj(3); T('inj->legal sub',await pg.evaluate(()=>T.ui.sub&&!T.ui.sub.exc&&!T.ui.pen));
await pg.click('[data-act=subcancel]');
// 例外：位置已換回
await pg.evaluate(()=>{T.dispatch('SUB',{set:1,team:'t1',idx:1,out:3,in:18,exc:false,injury:false});T.dispatch('SERVE',{set:1});T.dispatch('POINT',{set:1,team:'t1'});T.dispatch('SUB',{set:1,team:'t1',idx:1,out:18,in:3,exc:false,injury:false});T.render()});
await inj(3); T('inj->exc with injury',await pg.evaluate(()=>T.ui.sub&&T.ui.sub.exc&&T.ui.sub.inj));
await pg.click('[data-act=subcancel]');
// 沒人可換 → 傷停計時；再一次 → 陣容不完整
await setup([]);
await inj(5); T('inj timer',await pg.evaluate(()=>T.ui.timer&&/傷停/.test(T.ui.timer.label)));
await pg.evaluate(()=>{T.ui.timer=null;T.render()});
await inj(5); T('inj again -> INC',await pg.evaluate(()=>T.ui.pen&&T.ui.pen.kind==='INC'));
await pg.evaluate(()=>{T.ui.pen=null;T.render()});
// 灰按鈕說明
await pg.evaluate(()=>{T.dispatch('TIMEOUT',{set:1,team:'t2'});T.dispatch('TIMEOUT',{set:1,team:'t2'});T.render()});
await pg.click('[data-act=why][data-team=t2]',{force:true}); T('why toast',(await pg.textContent('.lockline')).includes('2 次暫停已用完'));
// 點球員判罰
await pg.click('.pc.t2[data-pos="2"]'); await pg.click('[data-act=pmpen]');
T('pen preset who',(await pg.textContent('.sheet h2')).includes('號 判罰'));
await pg.click('.sheet [data-act=penkind][data-v=P]');
T('ok confirm',(await pg.textContent('.sheet h2')).includes('紅牌懲罰'));
await pg.click('[data-act=penno]'); T('back to kinds',(await pg.textContent('.sheet h2')).includes('號 判罰'));
await pg.click('.sheet [data-act=penkind][data-v=W]'); await pg.click('[data-act=penyes]');
T('sanction recorded',await pg.evaluate(()=>{var x=T.reduce(T.current().events).sanctions.pop();return x&&x.kind==='W'&&x.team==='t2'&&typeof x.who==='number'}));
// 自由球員選單：重新指定
await setup([18]);
await pg.click('[data-act=libcell][data-no="12"]'); await pg.click('.pc.t1[data-pos="5"]');
await pg.click('.pc.t1.isl'); T('libero redes option',await pg.isVisible('[data-act=redopen]'));
await pg.click('.sheet [data-act=close]');
// L 格不能上
await pg.evaluate(()=>{T.dispatch('SANCTION',{set:1,team:'t1',kind:'D',who:12});T.render()});
await pg.waitForTimeout(200);
await pg.click('[data-act=libaway][data-no="12"]'); T('libaway sheet',(await pg.textContent('.sheet')).includes('本場不能再上'));
T('libaway redes',await pg.isVisible('.sheet [data-act=redopen]'));
T('no errors',errs.length===0);if(errs.length)console.log(errs);console.log('ok',ok,'bad',bad);await b.close()})();

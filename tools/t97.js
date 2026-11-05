const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let ok=0,bad=0;const T=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n)}};
for(const [w,h] of [[800,1232],[768,1024],[820,1180],[1024,768],[402,874]]){const pg=await b.newPage({viewport:{width:w,height:h}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/nanshe/test/t.html');
await pg.evaluate(()=>{var m=T.createMatch(T.defaultInfo());T.db.currentId=m.id;
 [['t1','MAK',[5,4,3,77,99,9,27,31],[27,31]],['t2','KAS',[4,5,8,9,28,33,2,1],[2,1]]].forEach(c=>{T.dispatch('TEAM_NAME_SET',{team:c[0],value:c[1]});c[2].forEach(n=>T.dispatch('PLAYER_ADDED',{team:c[0],no:n}));T.dispatch('CAPTAIN_SET',{team:c[0],no:c[2][2]});c[3].forEach(n=>T.dispatch('LIBERO_SET',{team:c[0],no:n,on:true}))});
 T.dispatch('TOSS_SET',{set:1,left:'t1',serve:'t1'});
 [[5,4,3,77,99,9],[4,5,8,9,28,33]].forEach((l,i)=>{var k=i?'t2':'t1';l.forEach((no,p)=>T.dispatch('LINEUP_SET',{set:1,team:k,pos:p,no:no}));T.dispatch('LINEUP_LOCKED',{set:1,team:k})});
 T.dispatch('SET_STARTED',{set:1});T.save();T.resetUi();T.setView('setup');T.ui.page='play';T.render();});
await pg.waitForTimeout(200);
const r=await pg.evaluate(()=>{const sv=document.querySelector('.sv').getBoundingClientRect(),pb=document.querySelector('.pbtns').getBoundingClientRect(),ts=document.querySelector('.tallsheet');return {gap:Math.round(sv.top-pb.bottom),svBottom:Math.round(sv.bottom),H:innerHeight,sheetBelow:ts?ts.getBoundingClientRect().top>=sv.bottom-1:null}});
if(r.sheetBelow!==null)T(w+'x'+h+' serve near tools',r.gap<40); T(w+'x'+h+' serve visible',r.svBottom<=r.H); if(r.sheetBelow!==null)T(w+'x'+h+' sheet below serve',r.sheetBelow);
console.log(w+'x'+h,JSON.stringify(r));
await pg.screenshot({path:`/home/claude/nanshe/test/t97_${w}.png`});T('no errors',errs.length===0);await pg.close()}
console.log('ok',ok,'bad',bad);await b.close()})();

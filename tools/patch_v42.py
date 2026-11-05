# v42：自由球員到前排改成閃爍點一下換回；手機返回鍵只關最上層（朋友 11/5 試用回饋）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
# 1. 自由球員到前排或輪到發球：不跳視窗，格子閃，點它換回
rep("function matchOver(s){","""function libFront(s){
  var c=s.sets[s.setNo];if(!c||!c.started||c.ended||c.live||matchOver(s)||setWinner(s))return null;var who=null;
  ['t1','t2'].forEach(function(k){
    var t=s.teams[k];if(who||!c.libOut[k])return;
    var fr=[1,2,3].filter(function(p){return t.liberos.indexOf(courtPlayer(c,k,p))>=0}).length>0;
    var sv=c.serving===k&&t.liberos.indexOf(courtPlayer(c,k,0))>=0;
    if(fr||sv)who={k:k,sv:sv&&!fr,no:c.libOut[k].no};
  });
  return who;
}
function matchOver(s){""")
rep("""  }else{
    var who=null;
    ['t1','t2'].forEach(function(k){
      var t=s.teams[k],k2=c.rally+'-'+c.rot[k];""","""  }else{
    return '';
    var who=null;
    ['t1','t2'].forEach(function(k){
      var t=s.teams[k],k2=c.rally+'-'+c.rot[k];""")
rep("""  var tap=pick||(!ui.sub&&!ui.lib);""","""  var tap=pick||bad||(!ui.sub&&!ui.lib);""")
rep("""      if(!ui.lib){
        if(c.live){""","""      var lf=libFront(s);
      if(lf&&lf.k===k&&s.teams[k].liberos.indexOf(c.cur[k][ix])>=0){ui.sub=null;ui.lib=null;dispatch('LIBERO_OUT',{set:n,team:k});ui.toast={t:'已換回 '+lf.no+' 號',until:Date.now()+2500};break}
      if(!ui.lib){
        if(c.live){""")
rep("""  var lockT=ui.toast&&Date.now()<ui.toast.until?ui.toast.t:c.live?""","""  var lfr=libFront(s);
  var lockT=ui.toast&&Date.now()<ui.toast.until?ui.toast.t:lfr?tName(s,lfr.k)+' 自由球員'+(lfr.sv?'輪到發球':'到前排')+'，點閃的 L 換回 '+lfr.no+' 號':c.live?""")
rep("""  var lock='<div class="muted lockline'+(ui.toast&&Date.now()<ui.toast.until?' toast':'')+'">'""","""  var lock='<div class="muted lockline'+(ui.toast&&Date.now()<ui.toast.until?' toast':lfr?' toast lfr':'')+'">'""")
rep("""  if(po&&['serve',""","""  var lfb=(s&&view==='setup'&&ui.page==='play'&&!po)?libFront(s):null;
  if(lfb&&['serve','endset'].indexOf(act)>=0){ui.toast={t:'先點閃的 L 換回 '+lfb.no+' 號才能發球',until:Date.now()+3000};render();return}
  if(po&&['serve',""")
# 2. 手機返回鍵
rep("""function render(){
  var had=kbd&&document.activeElement&&document.activeElement!==document.body,fk=had?focusKey():null;
  paint();""","""var backGuard=false,backSkip=false;
function backNeed(){return view!=='home'||!!(ui.help||ui.sheet||ui.cupSheet||ui.delMatch)}
function backSync(){
  if(!history.pushState)return;
  var need=backNeed();
  if(need&&!backGuard){try{history.pushState({vsb:1},'');backGuard=true}catch(e){}}
  else if(!need&&backGuard){backGuard=false;backSkip=true;history.back()}
}
addEventListener('popstate',function(){
  if(backSkip){backSkip=false;return}
  backGuard=false;
  if(staleTab){backSync();return}
  if(escClose())return;
  var x=app.querySelector('[data-act=sheetclose],[data-act=rpclose],.bar .barback');
  if(x){x.click();return}
  if(view==='setup'&&ui.page!=='play'){var m=current(),s=m?safeReduce(m):null;if(s&&s.sets[s.setNo].started&&!matchOver(s)){ui.page='play';render();return}}
  if(view==='setup'&&ui.page==='play'){ui.toast={t:'要離開比賽，請按「其他」裡的離開比賽',until:Date.now()+3500}}
  render();
});
function render(){
  var had=kbd&&document.activeElement&&document.activeElement!==document.body,fk=had?focusKey():null;
  paint();backSync();""")
rep("""  if(kbd&&(had||topLayer()))restoreFocus(fk);
}""","""  if(kbd&&(had||topLayer()))restoreFocus(fk);
}
""")
rep("</style>",""".lockline.lfr{color:var(--bad);font-weight:700}
</style>""")
open(P,'w',encoding='utf8').write(s); print('ok')

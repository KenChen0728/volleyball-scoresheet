# v39：被判出局或出場的球員一定要換下（使用者 11/5 回報可重複給同一人出場）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
# 1. 由比賽狀態推算「還在場上但已被判離場」的球員
rep("function matchOver(s){",
"""function pendingOut(s){
  var c=s.sets[s.setNo];if(!c||!c.started||c.ended||s.incomplete||matchOver(s)||setWinner(s))return null;var r=null;
  ['t1','t2'].some(function(k){var t=s.teams[k];return c.cur[k].some(function(no,i){if(no!=null&&t.liberos.indexOf(no)<0&&(c.expelled[k].indexOf(no)>=0||s.matchOut[k].indexOf(no)>=0)){r={team:k,idx:i,no:no,d:s.matchOut[k].indexOf(no)>=0};return true}})});
  return r;
}
function sanGone(s,k,w){var n=s.setNo;return s.sanctions.some(function(x){return x.team===k&&x.who===w&&x.kind==='D'})?'D':s.sanctions.some(function(x){return x.team===k&&x.who===w&&x.kind==='E'&&x.set===n})?'E':''}
function matchOver(s){""")
# 2. 畫面：有人待換下就一直開著強制替補面板
rep("  var body=pageHtml(s,m),kp=kpHtml(s)+subHtml(s);",
"""  if(ui.page==='play'&&!ui.pen&&!ui.liveSheet){var po=pendingOut(s);
    if(po){if(!(ui.sub&&ui.sub.forced&&ui.sub.team===po.team&&ui.sub.idx===po.idx))ui.sub={team:po.team,idx:po.idx,exc:!!(ui.sub&&ui.sub.forced&&ui.sub.team===po.team&&ui.sub.exc),ids:[],forced:true};ui.sub.po=po;ui.lib=null;ui.toAsk=null}
    else if(ui.sub&&ui.sub.forced)ui.sub=null}
  var body=pageHtml(s,m),kp=kpHtml(s)+subHtml(s);""")
# 3. 強制面板：沒有取消、完成；說明要換下誰
rep("""  return '<div class="kp bench '+k+(k===c.left?' onright':' onleft')+'"><div class="kphead"><span>'+esc(tName(s,k))+(ui.sub.exc?' 例外替補':' 替補 '+c.subCount[k])+'</span><span class="row" style="flex:none"><button class="danger" data-act="subcancel">取消</button><button class="go" data-act="subclose">完成</button></span></div>""",
"""  var fp=ui.sub.forced&&ui.sub.po;
  return '<div class="kp bench '+k+(k===c.left?' onright':' onleft')+(fp?' forced':'')+'"><div class="kphead"><span>'+esc(tName(s,k))+(ui.sub.exc?' 例外替補':' 替補 '+c.subCount[k])+'</span>'+(fp?'':'<span class="row" style="flex:none"><button class="danger" data-act="subcancel">取消</button><button class="go" data-act="subclose">完成</button></span>')+'</div>'+(fp?'<p class="forcedmsg">'+fp.no+' 號已被判'+(fp.d?'出場':'出局')+'，要先換下場才能繼續比賽。判錯了請按上方「復原」。</p>':'')+'""")
# 4. 待換下時擋住會讓比賽繼續的動作
rep("""  var m=current(),s=m?reduce(m.events):null,t=(s&&k)?s.teams[k]:null,n=s?s.setNo:1,c=s?s.sets[n]:null;
  switch(act){""",
"""  var m=current(),s=m?reduce(m.events):null,t=(s&&k)?s.teams[k]:null,n=s?s.setNo:1,c=s?s.sets[n]:null;
  var po=(s&&view==='setup'&&ui.page==='play')?pendingOut(s):null;
  if(po&&['serve','replay','point','timeout','toyes','libcell','libout','subopen','subcancel','subclose','swap8','endset','injopen'].indexOf(act)>=0){ui.toast={t:tName(s,po.team)+' '+po.no+' 號要先換下場',until:Date.now()+3000};render();return}
  switch(act){""")
rep("      if(ui.sub){ui.sub.idx=ix;break}","      if(ui.sub){if(!ui.sub.forced)ui.sub.idx=ix;break}")
# 5. 判罰對象：出場的人不能再選；本局出局的人只能再判出場
rep("""    var pl=t.players.map(function(q){return '<button class="chip '+k+'" data-act="penwho" data-team="'+k+'" data-no="'+q.no+'"><b>'+q.no+'</b></button>'}).join('');
    var st=STAFFWHO.map(function(x){return '<button data-act="penwho" data-team="'+k+'" data-v="'+x[0]+'">'+x[1]+'</button>'}).join('');""",
"""    var gone=function(w){var g=sanGone(s,k,w);return g==='D'||(g==='E'&&p.kind!=='D')?g:''},gtx={D:'已出場',E:'已出局'};
    var pl=t.players.map(function(q){var g=gone(q.no);return '<button class="chip '+k+(g?' off':'')+'" data-act="penwho" data-team="'+k+'" data-no="'+q.no+'"'+(g?' disabled':'')+'><b>'+q.no+'</b>'+(g?'<small>'+gtx[g]+'</small>':'')+'</button>'}).join('');
    var st=STAFFWHO.map(function(x){var g=gone(x[0]);return '<button data-act="penwho" data-team="'+k+'" data-v="'+x[0]+'"'+(g?' disabled':'')+'>'+x[1]+(g?' '+gtx[g]:'')+'</button>'}).join('');""")
# 樣式
rep("</style>",".kp.forced .forcedmsg{margin:6px 10px 0;font-weight:700;color:var(--danger,#b3261e);line-height:1.4}\n</style>")
open(P,'w',encoding='utf8').write(s); print('ok')

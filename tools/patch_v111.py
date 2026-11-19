#!/usr/bin/env python3
"""11/20 使用者 23:5x 選的四項：
- 賽事資料夾頁改成上面分頁：賽程｜隊伍｜裁判（像記錄表的分頁）。男女組切換只在賽程、隊伍分頁；裁判不分組。
  「比賽」區拿掉：照賽程開始的比賽在賽程裡看得到；不在賽程的放賽程分頁最下面「其他比賽」。
  第一次打開：還沒有隊伍也沒有賽程就先到隊伍分頁，其他先到賽程。
- 首頁今天的賽程加「選場地」：每台記自己選的場地（localStorage，KEY-hcourt），只列這個場地。
- 新增、修改比賽時檢查同一天同一時間：同場地已經有比賽、同一隊另一場也在這個時間 → 提醒，可以「還是要儲存」。
- 隊伍照隊名排（同校 A、B 隊排在一起，A 在前）：資料夾的隊伍分頁、新增比賽選隊伍。先跑 patch_v97～v110。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'data-act="cuptab"' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
# ---- 隊伍排序
one("function cupSched(c){","function teamSort(a,b){return String(a.team.name).localeCompare(String(b.team.name),'zh-Hant',{numeric:true})} // 同校 A、B 隊排在一起\nfunction cupSched(c){")
one("  var ts=dts.filter(function(x){return !cupView.grp||groupName(x.group)===cupView.grp});","  var ts=dts.filter(function(x){return !cupView.grp||groupName(x.group)===cupView.grp}).sort(teamSort);")
one("  if(x.type==='scedit'){var f=x.f,ts=liveTeams(c).filter(function(t){return t.division===f.division}),cs=[];","  if(x.type==='scedit'){var f=x.f,ts=liveTeams(c).filter(function(t){return t.division===f.division}).sort(teamSort),cs=[];")
# ---- 分頁
one("""  var liveN=all.filter(function(x){return !matchOver(x.s)}).length;
  return '<header class="bar">""","""  var liveN=all.filter(function(x){return !matchOver(x.s)}).length;
  var tab=cupView.tab||(liveTeams(c).length||liveSched(c).length?'sched':'teams');if(tab==='refs'&&!XP_ON)tab='sched';cupView.tab=tab;
  var tabs=[['sched','賽程',liveSched(c).length],['teams','隊伍',liveTeams(c).length]].concat(XP_ON?[['refs','裁判',cts.length]]:[]);
  var tabbar='<div class="cuptabs" role="tablist">'+tabs.map(function(t){return '<button role="tab" data-act="cuptab" data-v="'+t[0]+'" aria-selected="'+(tab===t[0])+'">'+t[1]+'<small>'+t[2]+'</small></button>'}).join('')+'</div>';
  var mids={};cupSched(c).forEach(function(q){if(q.mid&&!q.del)mids[q.mid]=1}); // 照賽程開始的在賽程裡看得到
  var oms=all.filter(function(x){return !mids[x.m.id]&&cupDivOf(x.s)===cupView.div}).map(function(x){var h=matchOver(x.s)?historyRow(x.m,x.s,true):resumeRow(x.m,x.s);return h.replace('data-from="history"','data-from="cup"').replace('class="rmain" data-act="open"','class="rmain" data-act="open" data-from="cup"')}).join('');
  var teamSec='<section><div class="shead"><h2>隊伍 '+ts.length+' 隊</h2><button class="linkbtn" data-act="cupteam">加入隊伍名單</button></div>'+(tr?'<div class="rlist">'+tr+'</div>':'<p class="muted">還沒有隊伍。</p>')+'</section>';
  var body=tab==='refs'?refSec:tab==='teams'?seg+teamSec:seg+schedSec(c)+(oms?'<section><h2>其他比賽</h2><p class="muted">不在賽程裡的比賽。</p><div class="rlist">'+oms+'</div></section>':'');
  return '<header class="bar">""")
one("""<main class="page"><div class="narrow"><div class="cupgrp">'+seg+schedSec(c)+'<section><div class="shead"><h2>隊伍 '+ts.length+' 隊</h2><button class="linkbtn" data-act="cupteam">加入隊伍名單</button></div>'+(tr?'<div class="rlist">'+tr+'</div>':'<p class="muted">還沒有隊伍。</p>')+'</section><section><h2>比賽</h2>'+(ms?'<div class="rlist">'+ms+'</div>':'<p class="muted">這一組還沒有比賽。</p>')+'</section></div>'+(refSec?'<div class="cupgrp">'+refSec+'</div>':'')+'<div class="cupgrp">""",
    """<main class="page"><div class="narrow">'+tabbar+'<div class="cupgrp">'+body+'</div><div class="cupgrp">""")
one("    case 'cupmore': ui.cupSheet={type:'more'}; break;","    case 'cupmore': ui.cupSheet={type:'more'}; break;\n    case 'cuptab': cupView.tab=b.getAttribute('data-v'); ui.delMatch=null; break;")
one(".cupgrp+.cupgrp{border-top:2px solid var(--line);padding-top:20px}",""".cupgrp+.cupgrp{border-top:2px solid var(--line);padding-top:20px}
.cuptabs{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);border-bottom:1px solid var(--line);margin-bottom:12px}
.cuptabs button{min-height:50px;border:0;border-radius:0;background:transparent;color:var(--muted);font-size:16px;font-weight:600;border-bottom:3px solid transparent;margin-bottom:-1px;display:flex;align-items:center;justify-content:center;gap:6px}
.cuptabs button small{font-size:13px;font-weight:600;min-width:22px;padding:0 6px;border-radius:10px;background:var(--soft);color:var(--muted)}
.cuptabs button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--ink)}""")
# ---- 首頁選場地
one("""  db.cups.forEach(function(c){var td=schedTodo(c);if(!td.length)return;var nos=schedNos(c),d=td[0].date,t=d===today()?'今天的賽程':schedDay(d)+'的賽程';""",
"""  var hcm={};try{hcm=JSON.parse(localStorage.getItem(KEY+'-hcourt')||'{}')||{}}catch(e){}
  db.cups.forEach(function(c){var td=schedTodo(c);if(!td.length)return;var nos=schedNos(c),d=td[0].date,t=d===today()?'今天的賽程':schedDay(d)+'的賽程';
    var cs=[];td.forEach(function(it){if(it.court&&cs.indexOf(it.court)<0)cs.push(it.court)});cs.sort(function(a,b){return a.localeCompare(b,'zh-Hant',{numeric:true})});
    var pick=cs.indexOf(hcm[c.id])>=0?hcm[c.id]:'',all=td;td=pick?td.filter(function(it){return it.court===pick}):td;
    var chips=cs.length>1?'<div class="hcourts" role="group" aria-label="選場地">'+[''].concat(cs).map(function(q){return '<button data-act="hcourt" data-cup="'+esc(c.id)+'" data-v="'+esc(q)+'" aria-pressed="'+(pick===q)+'">'+(q?'場地：'+esc(q):'全部')+'</button>'}).join('')+'</div>':'';""")
one("""<button class="linkbtn" data-act="cupopen" data-id="'+esc(c.id)+'">全部賽程</button></div><div class="rlist">'+td.slice(0,6)""","""<button class="linkbtn" data-act="cupopen" data-id="'+esc(c.id)+'">全部賽程</button></div>'+chips+'<div class="rlist">'+td.slice(0,6)""")
one("""    case 'hscopen':""","""    case 'hcourt': var hcm2={};try{hcm2=JSON.parse(localStorage.getItem(KEY+'-hcourt')||'{}')||{}}catch(e){}hcm2[b.getAttribute('data-cup')]=b.getAttribute('data-v');try{localStorage.setItem(KEY+'-hcourt',JSON.stringify(hcm2))}catch(e){} break; // 每台記自己的場地
    case 'hscopen':""")
one(".hsteps>button{width:100%}",""".hsteps>button{width:100%}
.hcourts{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 8px}
.hcourts button{min-height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--line);background:transparent;font-size:15px}
.hcourts button[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--bg)}""")
# ---- 時間衝突
one("""    case 'scsave1':
      var g=x.f;if(!g.date){x.err='請選日期';return true}
      if(g.t1&&g.t1===g.t2){x.err='兩邊選了同一隊';return true}""","""    case 'scwarnno': if(x){x.warn=null} return true;
    case 'scsave1':
      var g=x.f;if(!g.date){x.err='請選日期';return true}
      if(g.t1&&g.t1===g.t2){x.err='兩邊選了同一隊';return true}
      if(!b.getAttribute('data-force')){var cfl=schedConflicts(c,x.id,g);if(cfl.length){x.warn=cfl;x.next=b.getAttribute('data-v')==='next';return true}} // 提醒，但可以照存（使用者）
      x.warn=null;""")
one("function schedNextTime(t){","""function schedConflicts(c,id,g){
  var out=[],nos=schedNos(c),tm=String(g.time||'').trim(),ck=courtKey(g.court);if(!tm)return out;
  liveSched(c).forEach(function(o){if(o.id===id||o.date!==g.date||o.time!==tm)return;var nm=o.division+'第 '+nos[o.id]+' 場（'+(schedSide(c,o,'t1').name||'待定')+' vs '+(schedSide(c,o,'t2').name||'待定')+'）';
    if(ck&&courtKey(o.court)===ck)out.push('這個時間「場地：'+o.court+'」已經有'+nm);
    ['t1','t2'].forEach(function(k){var t=g[k]&&schedTeam(c,g[k]);if(t&&(o.t1===g[k]||o.t2===g[k]))out.push('「'+t.team.name+'」這個時間在'+o.division+'第 '+nos[o.id]+' 場也有比賽')})});
  return out;
}
function schedNextTime(t){""")
one("""      '<button class="primary" data-act="scsave1">儲存</button>'+(x.id?'':'<button data-act="scsave1" data-v="next">儲存，再新增下一場</button>')+""",
"""      (x.warn?'<div class="warning" role="alert"><b>時間衝突</b><ul class="scwarn">'+x.warn.map(function(w){return '<li>'+esc(w)+'</li>'}).join('')+'</ul></div><button class="primary" data-act="scsave1" data-force="1"'+(x.next?' data-v="next"':'')+'>還是要儲存</button><button data-act="scwarnno">回去修改</button>':
      '<button class="primary" data-act="scsave1">儲存</button>'+(x.id?'':'<button data-act="scsave1" data-v="next">儲存，再新增下一場</button>'))+""")
one("    case 'scpick': if(x&&x.f){x.saved='';","    case 'scpick': if(x&&x.f){x.saved='';x.warn=null;")
one("    case 'scclr': if(x&&x.f){","    case 'scclr': if(x&&x.f){x.warn=null;")
one("    case 'scclr': case 'scprint':","    case 'scwarnno': case 'scclr': case 'scprint':")
one("    case 'scdiv': if(x&&x.f){","    case 'scdiv': if(x&&x.f){x.warn=null;")
one(".scrow>.muted{text-align:center}",".scrow>.muted{text-align:center}\n.scwarn{margin:6px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:4px}")
open(SRC,'w',encoding='utf8').write(s)
print('patched v111')

#!/usr/bin/env python3
"""11/20 賽程照場地、隊伍照男女組（使用者 00:30：一個場地可能男女組都打，隊伍才分男女組）。
- 賽程分頁上面是「全部｜場地：甲｜場地：乙」（只有一個場地就不顯示），同一個場地男女組照時間排在一起，每場寫「男子組第 1 場」。
- 新增比賽：選了場地就預設這個場地，男女組、時間照這個場地的上一場（時間加一小時）。
- 不在賽程的「其他比賽」全部列出來。先跑 patch_v97～v112。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'data-act="cupcourtf"' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""function schedSec(c){
  var sl=liveSched(c).filter(function(x){return x.division===cupView.div}).sort(schedSort),nos=schedNos(c),dd=null,sr='';""",
"""function schedCourts(c){var cs=[];liveSched(c).forEach(function(x){if(x.court&&cs.indexOf(x.court)<0)cs.push(x.court)});return cs.sort(function(a,b){return a.localeCompare(b,'zh-Hant',{numeric:true})})}
function schedSec(c){
  var cs=schedCourts(c);if(cupView.court&&cs.indexOf(cupView.court)<0)cupView.court='';
  var sl=liveSched(c).filter(function(x){return !cupView.court||x.court===cupView.court}).sort(schedSort),nos=schedNos(c),dd=null,sr='';""")
one("""<span class="muted">第 '+no+' 場・'+esc(x.time||'時間未定')+(x.court?'・場地：'+esc(x.court):'')+'</span><span class="hnames">""",
    """<span class="muted">'+esc(x.division)+'第 '+no+' 場・'+esc(x.time||'時間未定')+(x.court&&!cupView.court?'・場地：'+esc(x.court):'')+'</span><span class="hnames">""")
# 賽程分頁：場地切換取代男女組
one("""  var body=tab==='refs'?refSec:tab==='teams'?seg+teamSec:seg+schedSec(c)+""","""  var scs=schedCourts(c),cseg=scs.length>1?'<div class="cupcourts" role="group" aria-label="場地">'+[''].concat(scs).map(function(q){return '<button data-act="cupcourtf" data-v="'+esc(q)+'" aria-pressed="'+((cupView.court||'')===q)+'">'+(q?'場地：'+esc(q):'全部')+'</button>'}).join('')+'</div>':'';
  var body=tab==='refs'?refSec:tab==='teams'?seg+teamSec:cseg+schedSec(c)+""")
one("""  var oms=all.filter(function(x){return !mids[x.m.id]&&cupDivOf(x.s)===cupView.div}).map(""","""  var oms=all.filter(function(x){return !mids[x.m.id]}).map(""")
one("    case 'cuptab': cupView.tab=b.getAttribute('data-v'); ui.delMatch=null; break;","    case 'cuptab': cupView.tab=b.getAttribute('data-v'); ui.delMatch=null; break;\n    case 'cupcourtf': cupView.court=b.getAttribute('data-v'); break;")
# 新增比賽：照選的場地的上一場
one("""  var dv=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],all=liveSched(c).sort(schedSort),last=all.filter(function(x){return x.division===dv}).pop()||all[all.length-1]||null;
  var same=last&&last.division===dv;""","""  var dv=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],all=liveSched(c).sort(schedSort),last;
  if(cupView.court){last=all.filter(function(x){return x.court===cupView.court}).pop()||null;if(last)dv=last.division}
  else last=all.filter(function(x){return x.division===dv}).pop()||all[all.length-1]||null;
  var same=last&&(cupView.court||last.division===dv);""")
one("""  return {type:'scedit',id:null,f:{date:last?last.date:today(),time:same?schedNextTime(last.time):'',court:same?last.court:'',division:dv,t1:'',t2:'',n1:'',n2:''}};""",
    """  return {type:'scedit',id:null,f:{date:last?last.date:today(),time:same?schedNextTime(last.time):'',court:cupView.court||(same?last.court:''),division:dv,t1:'',t2:'',n1:'',n2:''}};""")
one(".cupshare{",""".cupcourts{display:flex;flex-wrap:wrap;gap:8px}
.cupcourts button{min-height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--line);background:transparent;font-size:15px}
.cupcourts button[aria-pressed="true"]{background:var(--sel);border-color:var(--sel);color:var(--sel-on)}
.cupshare{""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v113')

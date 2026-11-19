#!/usr/bin/env python3
"""11/19 首頁（平板橫放右邊沒有比賽時很空，使用者 23:33）：進行中下面加
- 今天的賽程（今天沒有就最近一天，還沒開始的；點了先看那一場再開始，不會誤按就開賽）
- 賽事資料夾卡片
- 什麼都還沒有時：開始前準備三步驟（建資料夾、加隊伍名單、新增比賽）
手機直放一樣接在下面。先跑 patch_v97～v107。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function homeExtra' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
JS=r"""/* 11/19 首頁的賽程、資料夾、開始前準備 */
function homeExtra(g){
  var out='';
  db.cups.forEach(function(c){var td=schedTodo(c);if(!td.length)return;var nos=schedNos(c),d=td[0].date,t=d===today()?'今天的賽程':schedDay(d)+'的賽程';
    out+='<section><div class="shead"><h2>'+esc(t)+'<small class="cupshare">'+esc(c.name)+'</small></h2><button class="linkbtn" data-act="cupopen" data-id="'+esc(c.id)+'">全部賽程</button></div><div class="rlist">'+td.slice(0,6).map(function(it,i){var A=schedSide(c,it,'t1'),B=schedSide(c,it,'t2');
      return '<button class="hrow card scrow" data-act="hscopen" data-cup="'+esc(c.id)+'" data-id="'+esc(it.id)+'"><span class="muted">'+esc(it.division)+'第 '+nos[it.id]+' 場・'+esc(it.time||'時間未定')+(it.court?'・場地：'+esc(it.court):'')+'</span><span class="hnames"><span>'+schedSideHtml(A)+'</span><b>vs</b><span>'+schedSideHtml(B)+'</span></span><span class="hgo"><span class="scchip'+(i===0&&!g.live.length?' go':'')+'">開始</span></span></button>'}).join('')+'</div>'+(td.length>6?'<p class="muted">還有 '+(td.length-6)+' 場，按「全部賽程」看。</p>':'')+'</section>'});
  if(db.cups.length)out+=cupHomeHtml();
  else if(!g.live.length&&!g.done.filter(function(x){return !x.s.info.sample}).length)
    out+='<section class="hsteps"><h2>開始前準備</h2><ol><li><b>建立賽事資料夾</b><span>一個盃賽一個資料夾</span></li><li><b>加入隊伍名單</b><span>報名名單可以整份貼上</span></li><li><b>新增比賽，排好賽程</b><span>比賽當天點那一場就開始記錄</span></li></ol><button data-act="cupcreate">建立賽事資料夾</button><p class="muted">不用資料夾也可以，直接按「開始新比賽」。想先練習，到「使用教學」用範例比賽。</p></section>';
  return out;
}
"""
one("function homeHtml(){",JS+"function homeHtml(){")
one("""  if(g.live.length)body+='<section><h2>進行中</h2><div class="rlist">'+g.live.map(function(x){return resumeRow(x.m,x.s)}).join('')+'</div></section>';""",
    """  if(g.live.length)body+='<section><h2>進行中</h2><div class="rlist">'+g.live.map(function(x){return resumeRow(x.m,x.s)}).join('')+'</div></section>';
  body+=homeExtra(g);""")
# 首頁點賽程：先開那一場的視窗（開始記錄、修改、刪除），開始後返回首頁
one("    case 'cupmore': ui.cupSheet={type:'more'}; break;","""    case 'cupmore': ui.cupSheet={type:'more'}; break;
    case 'hscopen': var hc=db.cups.filter(function(q){return q.id===b.getAttribute('data-cup')})[0],hi=hc&&schedById(hc,b.getAttribute('data-id'));if(hi){cupView={id:hc.id,div:hi.division,grp:''};ui.cupSheet={type:'scone',id:hi.id,home:true}} break;""")
one("""'<button class="primary" data-act="scgo" data-id="'+esc(it.id)+'">開始記錄</button>""","""'<button class="primary" data-act="scgo" data-id="'+esc(it.id)+'"'+(x.home?' data-from="start"':'')+'>開始記錄</button>""")
one('\n</style>\n\n<div class="statusband"','''
.hsteps ol{margin:4px 0 12px;padding-left:24px;display:flex;flex-direction:column;gap:10px}
.hsteps li b{display:block}
.hsteps li span{color:var(--muted);font-size:14px}
.hsteps>button{width:100%}
.hsteps>p{margin-top:10px}
</style>

<div class="statusband"''')
open(SRC,'w',encoding='utf8').write(s)
print('patched v108')

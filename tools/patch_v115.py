#!/usr/bin/env python3
"""11/20 打完的場次（使用者 01:1x 語音）：贏的隊名綠色粗體、輸的變淡；右邊「已結束」改成各局比分直排，
每局都是賽程左邊那隊的分數在前（跟那一列的隊名順序一樣）。
另外：印登錄單、賽前紙本的清單場次多時，每一列照內容高度，不被擠扁（原本文字會疊在一起）。先跑 patch_v97～v114。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'class="scsets"' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""  var chip=s?(w?'<span class="scchip done">已結束</span>':'<span class="scchip live">記錄中</span>'):'<span class="scchip'+(next?' go':'')+'">開始</span>';""",
"""  var sets=w?[1,2,3,4,5].filter(function(n){return s.sets[n]&&s.sets[n].ended}).map(function(n){var q=s.sets[n].score;return q.t1+':'+q.t2}):[];
  var chip=s?(w?'<span class="scsets" aria-label="各局比分 '+sets.join('、')+'">'+sets.map(function(q){return '<span>'+q+'</span>'}).join('')+'</span>':'<span class="scchip live">記錄中</span>'):'<span class="scchip'+(next?' go':'')+'">開始</span>';""")
one("""<span class="hnames"><span'+(w&&w.t1>w.t2?' class="win"':'')+'>'+schedSideHtml(a)+'</span><b>'+(w?w.t1+' : '+w.t2:'vs')+'</b><span'+(w&&w.t2>w.t1?' class="win"':'')+'>'+schedSideHtml(b)+'</span></span>""",
    """<span class="hnames"><span'+(w?(w.t1>w.t2?' class="win"':' class="lose"'):'')+'>'+schedSideHtml(a)+'</span><b>'+(w?w.t1+' : '+w.t2:'vs')+'</b><span'+(w?(w.t2>w.t1?' class="win"':' class="lose"'):'')+'>'+schedSideHtml(b)+'</span></span>""")
one(".scrow>.muted{text-align:center}",""".scrow>.muted{text-align:center}
.scrow .hnames .win{color:var(--ok);font-weight:800}
.scrow .hnames .lose{color:var(--muted);font-weight:500}
.pplist>*{flex-shrink:0}
.scsets{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:56px;font-family:var(--num);font-size:15px;font-weight:600;color:var(--muted);line-height:1.2}""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v115')

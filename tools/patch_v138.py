#!/usr/bin/env python3
"""11/28 晚 使用者：積分表看不懂哪幾場打完、哪幾場還沒打。先跑 patch_v137。
- 組名旁：「打完 N 場、還剩 M 場」放大
- 表格下面加「本組賽程」：打完的打勾寫比分，進行中、還沒打的寫時間、場地
- 「場」改「已打」；比值沒辦法算時「最大」改「全勝」；整組沒打完時名次標「暫定」
- 名次規則那一長句拿掉，按「名次規則」再看"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function rankSchedHtml' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("function rankFmt(v){return v===Infinity?'最大':","function rankFmt(v){return v===Infinity?'全勝':")
one("""'<span class="muted">打完 '+done+'／'+R.games.length+' 場</span></div>';""",
    """'<span class="rkprog">打完 '+done+' 場、還剩 '+(R.games.length-done)+' 場</span></div>';""")
one(""":q.rank;
    if(q.draw&&adv>0)""",""":q.rank+(R.done?'':'<small class="rktmp">暫定</small>');
    if(q.draw&&adv>0)""")
one("""<th>勝</th><th>場</th><th>積分</th>""","""<th>勝</th><th>已打</th><th>積分</th>""")
one("""(R.done?'':'，整組打完才標晉級')+'。</p>':'')+'</section>'}""","""(R.done?'':'，整組打完才標晉級')+'。</p>':'')+rankSchedHtml(c,R)+'</section>'}
/* 11/28 本組賽程：哪幾場打完、哪幾場還沒打 */
function rankSchedHtml(c,R){if(!R.games.length)return '';
  var nm=function(id){var t=schedTeam(c,id);return esc(t?t.team.name:'')};
  return '<h3 class="rksh">本組賽程</h3><ul class="rksl">'+R.games.map(function(g){var it=g.it,m=schedMatch(it),r=g.res;
    var st=g.done?'<span class="rkdn">✓ '+(r?r.t1.s+' : '+r.t2.s:'打完')+'</span>':m?'<span class="rkpl">進行中</span>':'<span class="rkno">還沒打</span>';
    return '<li class="'+(g.done?'dn':'')+'"><span class="rkvs">'+nm(g.a)+' VS '+nm(g.b)+'</span>'+st+(g.done?'':'<small>'+esc(schedDay(it.date))+' '+esc(it.time||'時間未定')+(it.court?'　'+esc(it.court):'')+'</small>')+'</li>'}).join('')+'</ul>'}""")
one("""  var foot='<div class="rkrule"><p class="muted">名次：'+esc(ks.join(' → '))+'。'+esc(tie)+'。只算預賽打完的比賽。</p><div class="row">""","""  var foot='<div class="rkrule"><div class="row">""")
one("</style>","""/* 11/28 積分表看得懂 */
.rkprog{margin-left:auto;font-size:17px;font-weight:800;color:var(--ink)}
.rktmp{display:block;font-size:11px;font-weight:700;color:var(--muted)}
.rksh{margin:14px 0 6px;font-size:17px}
.rksl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.rksl li{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;padding:8px 10px;border:1px solid var(--line);border-radius:8px}
.rksl li.dn{opacity:.85}
.rkvs{flex:1 1 auto;font-weight:700}
.rkdn{font-weight:800;color:var(--ok-ink,var(--ok));font-family:var(--num)}
.rkpl{font-weight:800;color:#C77700}
.rkno{font-weight:800;color:var(--muted)}
.rksl small{flex-basis:100%;color:var(--muted);font-size:13px}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

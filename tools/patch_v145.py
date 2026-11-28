#!/usr/bin/env python3
"""11/29 凌晨 使用者語音：積分表表頭兩層——上面合併「場次」，底下「勝、敗、剩」（剩＝這隊還有幾場預賽沒打），後面接「積分」；拿掉「已打」。
局數、得失分欄先不動（語音最後定案只講場次）。先跑 patch_v144。測試版。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'rkgh' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""<td><b>'+st.W+'</b></td><td>'+st.G+'</td><td><b>'+st.P+'</b></td>""",
    """<td><b>'+st.W+'</b></td><td>'+(st.G-st.W)+'</td><td class="rkleft'+(rkLeft(R,q.id)?'':' zero')+'">'+rkLeft(R,q.id)+'</td><td><b>'+st.P+'</b></td>""")
one("""<thead><tr><th>名次</th><th class="rkn">隊名</th><th>勝</th><th>已打</th><th>積分</th><th>勝局:敗局<small>局數比</small></th><th>得分:失分<small>得失分比</small></th><th class="rkdc"><span class="vh">明細</span></th></tr></thead>""",
    """<thead><tr><th rowspan="2">名次</th><th rowspan="2" class="rkn">隊名</th><th colspan="3" class="rkgh">場次</th><th rowspan="2">積分</th><th rowspan="2">勝局:敗局<small>局數比</small></th><th rowspan="2">得分:失分<small>得失分比</small></th><th rowspan="2" class="rkdc"><span class="vh">明細</span></th></tr><tr><th>勝</th><th>敗</th><th>剩</th></tr></thead>""")
one("function rankNeedDraw(R){","function rkLeft(R,id){return R.games.filter(function(g){return !g.done&&(g.a===id||g.b===id)}).length} // 11/29 這隊還有幾場預賽沒打\nfunction rankNeedDraw(R){")
one("</style>",""".rktable th.rkgh{border-bottom:1px solid var(--line2);padding-bottom:2px}
.rktable thead tr+tr th{padding-top:2px}
@media (max-width:380px){.rktable th,.rktable td{padding-left:2px;padding-right:2px}.rktable{font-size:14px}} /* 小手機：多一欄「剩」也放得下 */
.rktable td.rkleft{font-weight:800}.rktable td.rkleft.zero{font-weight:500;color:var(--muted)}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

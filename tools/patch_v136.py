#!/usr/bin/env python3
"""11/28 晚 使用者：觀看畫面下方 L、隊長的字不要寫在框框裡（平板記錄台那樣寫在旁邊比較清楚）。先跑 patch_v135。
- 框框裡只放號碼；「自由」橫寫在兩格正中間上面、「隊長」橫寫在隊長格上面；自由固定兩格，沒有的用淡虛線空框；右隊左右鏡像
- 上方「同步中」在 390 寬會被切掉，改成「● 同步」"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if '11/28 晚 自由、隊長字放框外' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""(st[0]==='bad'?'':esc(st[0]==='ok'?'● 同步中':st[1]))""","""(st[0]==='bad'?'':esc(st[0]==='ok'?'● 同步':st[1]))""")
one("</style>","""/* 11/28 晚 自由、隊長字放框外（只限觀看畫面）：字橫寫在格子上面；自由固定兩格，沒有的用淡虛線空框 */
.watch .wview .strips{padding-top:20px}
.watch .wview .strip{gap:6px}
.watch .wview .lc .lno{display:none}
.watch .wview .ls,.watch .wview .capbox{position:relative}
.watch .wview .ls::before,.watch .wview .capbox span{position:absolute;left:0;right:0;top:-20px;text-align:center;font-size:15px;font-weight:800;line-height:18px;color:var(--ink);white-space:nowrap;opacity:1}
.watch .wview .ls::before{content:"自由"}
.watch .wview .lc.empty{visibility:visible;display:flex;background:transparent;border:2px dashed var(--line);opacity:.7}
.watch .wview .lc.empty b{visibility:hidden}
.watch .wview .capbox{overflow:visible}
.watch .wview .lc b,.watch .wview .capbox b{font-size:clamp(26px,4vh,36px)}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

#!/usr/bin/env python3
"""11/28 晚 使用者：觀看畫面下方 L、隊長的字不要寫在框框裡（平板記錄台那樣寫在旁邊比較清楚）。先跑 patch_v135。
- 框框裡只放號碼；「自由」「隊長」寫在框框外側（直排兩個字，手機寬度才放得下兩位自由＋隊長）；右隊左右鏡像
- 上方「同步中」在 390 寬會被切掉，改成「● 同步」"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if '11/28 晚 自由、隊長字放框外' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""(st[0]==='bad'?'':esc(st[0]==='ok'?'● 同步中':st[1]))""","""(st[0]==='bad'?'':esc(st[0]==='ok'?'● 同步':st[1]))""")
one("</style>","""/* 11/28 晚 自由、隊長字放框外（只限觀看畫面） */
.watch .wview .lc .lno,.watch .wview .capbox span{display:none}
.watch .wview .lc.empty{display:none}
.watch .wview .strip .ls::before,.watch .wview .strip::after{writing-mode:vertical-rl;font-size:15px;font-weight:800;line-height:1.05;letter-spacing:.05em;color:var(--ink);align-self:center}
.watch .wview .strip .ls::before{content:"自由"}
.watch .wview .strip.nolib .ls::before{content:none}
.watch .wview .strip::after{content:"隊長";order:1}
.watch .wview .strip>.capbox{order:2}
.watch .wview .strip>.ls{order:0;margin-right:auto}
.watch .wview .strip.mir,.watch .wview .strip.mir .ls{flex-direction:row} /* 右隊也是「字在號碼左邊」：隊長 6 … 自由 20 15，不會把「隊長」看成 20 的 */
.watch .wview .strip.mir::after{order:0}.watch .wview .strip.mir>.capbox{order:1}
.watch .wview .strip.mir>.ls{order:2;margin-right:0;margin-left:auto}
.watch .wview .strip{gap:4px}
.watch .wview .lc b,.watch .wview .capbox b{font-size:clamp(30px,4.6vh,42px)}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

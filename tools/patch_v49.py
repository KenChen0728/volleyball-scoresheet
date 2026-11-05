# v49：隊長背號和其他背號同大小，圈疊在外面（使用者 11/5：陣容單 6 的字明顯不一樣）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
add="""/* v49 隊長圈：數字不縮小，圈用 ::after 疊在外面（同名單頁做法） */
.cell b.circ,.pc b.circ,.chip b.circ{position:relative;width:auto;height:auto;border:0;overflow:visible}
.cell b.circ::after,.pc b.circ::after,.chip b.circ::after{content:"";position:absolute;left:50%;top:50%;width:1.5em;height:1.5em;box-sizing:border-box;transform:translate(-50%,-50%);border:3px solid currentColor;border-radius:50%;pointer-events:none}
.chip b.circ::after{border-width:2px}
.cell b.circ{font-size:44px}
.pc b.circ{font-size:34px}
.chip b.circ{font-size:26px}
@media (orientation:portrait) and (max-height:700px){.pc b.circ{font-size:30px}}
@media (orientation:landscape) and (max-height:520px){.cell b.circ{font-size:32px}}
"""
assert s.count('</style>')==1
s=s.replace('</style>',add+'</style>')
open(P,'w',encoding='utf8').write(s);print('ok')

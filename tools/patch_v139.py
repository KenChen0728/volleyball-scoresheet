#!/usr/bin/env python3
"""11/28 晚（測試版）使用者說「好」：
1. 陣容頁「全隊逆時針／順時針移一格」按鈕看不懂方向 → 按鈕直接寫結果「改成 N 號發球」，小字寫「照輪轉方向」「反方向」
2. 記錄台直拿（非寬版）局數跟觀看畫面一樣：隊名中間寫「1 : 0」，比分旁的局數框拿掉。原本的元素留著（隱藏），舊測試和其他程式抓得到。平板橫放（寬版）不動
先跑 patch_v138。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'class="board rb"' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""'<div class="rotb"><button data-act="lurot" data-team="'+k+'" data-v="ccw">↺ 全隊逆時針移一格</button><button data-act="lurot" data-team="'+k+'" data-v="cw">↻ 全隊順時針移一格</button></div>';""",
"""'<div class="rotb"><button data-act="lurot" data-team="'+k+'" data-v="cw" aria-label="全隊照輪轉方向移一格，改成 '+c.lineups[k][1]+' 號發球"><b>↻ 改成 '+c.lineups[k][1]+' 號發球</b><small>全隊照輪轉方向移一格</small></button><button data-act="lurot" data-team="'+k+'" data-v="ccw" aria-label="全隊反方向移一格，改成 '+c.lineups[k][5]+' 號發球"><b>↺ 改成 '+c.lineups[k][5]+' 號發球</b><small>全隊反方向移一格</small></button></div>';""")
one("""  return '<div class="board">'+wideBar(s,L)+wideBar(s,R)+sideScore(s,L)+setBox(s,L)+'<div class="mid">'+srvm+'</div>'+setBox(s,R)+sideScore(s,R)+'</div>'+court+""",
"""  var rsw=setsWon(s);
  return '<div class="board rb">'+wideBar(s,L)+wideBar(s,R)+'<b class="rsets" aria-label="局數 '+rsw[L]+' 比 '+rsw[R]+'">'+rsw[L]+' : '+rsw[R]+'</b>'+sideScore(s,L)+setBox(s,L)+'<div class="mid">'+srvm+'</div>'+setBox(s,R)+sideScore(s,R)+'</div>'+court+""")
one("</style>","""/* 11/28 陣容轉一格：寫結果 */
.rotb button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:52px;line-height:1.15}
.rotb button b{font-size:16px}.rotb button small{font-size:12px;font-weight:600;color:var(--muted)}
/* 11/28 記錄台直拿：局數寫在兩隊名稱中間（和觀看畫面一樣） */
.board.rb{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);column-gap:8px}
.board.rb>.setbox{display:none}
.board.rb>.wbar:first-child,.board.rb>.wbar+.wbar{grid-row:1;width:auto;margin:0;justify-self:stretch}
.board.rb>.wbar:first-child{grid-column:1}.board.rb>.wbar+.wbar{grid-column:3}
.board.rb>.rsets{grid-row:1;grid-column:2;font-family:var(--num);font-size:24px;font-weight:800;line-height:1;padding:3px 10px;border-radius:8px;background:var(--box,#3A4048);color:#fff}
.board.rb>.ss{grid-column:1}.board.rb>.mid~.ss{grid-column:3}
.board.rb>.mid{grid-row:2;grid-column:2}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

#!/usr/bin/env python3
"""11/19 賽事資料夾頁精簡（使用者 23:18：說明字太多、區塊沒有劃分清楚、「新增場地」不直觀）。
- 空著時說明只留一句；詳細的放在說明頁和各視窗裡。
- 版面分三塊：男女組切換＋賽程、隊伍、比賽（跟著組別）｜裁判（男女組共用）｜存成檔案、更多。
- 「裁判名單／新增場地」改成「裁判／加入裁判名單」，移到組別那一塊下面。
- 把舊比賽加進來、改名、刪除資料夾收進「更多」。比賽區照舊（使用者沒選拿掉）。先跑 patch_v97～v106。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if "data-act=\"cupmore\"" in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""refSec=XP_ON?'<section><div class="shead"><h2>裁判名單</h2><button class="linkbtn" data-act="cupcourt">新增場地</button></div>'""",
    """refSec=XP_ON?'<section><div class="shead"><h2>裁判<small class="cupshare">男女組共用</small></h2><button class="linkbtn" data-act="cupcourt">加入裁判名單</button></div>'""")
one("""'<p class="muted">依場地建裁判名單，記錄時點名字就好。比賽結束後，那一場的裁判也會自動加進該場地的名單。</p>')+'</section>':'';""",
    """'<p class="muted">還沒有裁判名單。</p>')+'</section>':'';""")
one("""<main class="page"><div class="narrow">'+refSec+seg+schedSec(c)+'<section>""","""<main class="page"><div class="narrow"><div class="cupgrp">'+seg+schedSec(c)+'<section>""")
one("""'<p class="muted">先把各隊名單放進來，名單頁按「載入」就能選。</p>')+'</section><section><h2>比賽</h2>'+(ms?'<div class="rlist">'+ms+'</div>':'<p class="muted">這一組還沒有比賽。</p>')+'</section><div class="histtools"><button data-act="cupadd">把舊比賽加進來</button><button data-act="cupsave">存成檔案</button><button data-act="cuprename">改名</button><button class="delout" data-act="cupdel">刪除資料夾</button></div><p class="muted">存成檔案後傳到另一台裝置，在「賽事與紀錄」按匯入：名單、比賽都會帶過去，匯入前會先列出會改什麼。</p>'""",
    """'<p class="muted">還沒有隊伍。</p>')+'</section><section><h2>比賽</h2>'+(ms?'<div class="rlist">'+ms+'</div>':'<p class="muted">這一組還沒有比賽。</p>')+'</section></div>'+(refSec?'<div class="cupgrp">'+refSec+'</div>':'')+'<div class="cupgrp"><div class="histtools"><button data-act="cupsave">存成檔案</button><button data-act="cupmore">更多</button></div><p class="muted">存成檔案可以傳給裁判夥伴，對方在「賽事與紀錄」按匯入。</p>'""")
one("""'<p class="warning">這個資料夾有 '+liveN+' 場比賽還在進行。要換手機記錄時，存成檔案傳過去之後，原本這台就不要再記那一場。</p>':'')+'</div></main>';""",
    """'<p class="warning">這個資料夾有 '+liveN+' 場比賽還在進行。要換手機記錄時，存成檔案傳過去之後，原本這台就不要再記那一場。</p>':'')+'</div></div></main>';""")
one("'<p class=\"muted\">按「新增比賽」把賽程一場一場加進來，隊伍還不知道可以先不選。到時候點那一場就開始記錄，兩隊隊名和名冊自動帶入，只要輸入背號。</p>'","'<p class=\"muted\">還沒有賽程。</p>'")
# 裁判名單視窗：原本放在頁面上的說明搬進來
one("<p class=\"muted\">同一個人可以在好幾個場地。不會再來的人，刪掉那一行就好。</p>","<p class=\"muted\">記錄時點名字就好。同一個人可以在好幾個場地；比賽結束後，那一場的裁判也會自動加進這個場地。不會再來的人，刪掉那一行就好。</p>")
one("h='<h2>'+(x.key?'修改裁判名單':'新增場地')+'</h2>","h='<h2>'+(x.key?'修改裁判名單':'加入裁判名單')+'</h2>")
# 更多：少用的功能
one("""  else if(x.type==='del')h='<h2>刪除「'""","""  else if(x.type==='more')h='<h2>「'+esc(c.name)+'」資料夾</h2><button data-act="cupadd">把舊比賽加進來</button><button data-act="cuprename">改名</button><button class="dellink" data-act="cupdel">刪除資料夾</button><button class="ghost" data-act="close">關閉</button>';
  else if(x.type==='del')h='<h2>刪除「'""")
one("    case 'cupadd': ui.cupSheet={type:'add'}; break;","    case 'cupadd': ui.cupSheet={type:'add'}; break;\n    case 'cupmore': ui.cupSheet={type:'more'}; break;")
one('\n</style>\n\n<div class="statusband"','''
.cupgrp{display:flex;flex-direction:column;gap:22px;padding-block:6px 22px}
.cupgrp+.cupgrp{border-top:2px solid var(--line);padding-top:20px}
.cupgrp>section{margin:0}
.cupshare{margin-left:8px;font-size:14px;font-weight:500;color:var(--muted)}
</style>

<div class="statusband"''')
open(SRC,'w',encoding='utf8').write(s)
print('patched v107')

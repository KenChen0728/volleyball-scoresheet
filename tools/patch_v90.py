# 11/13 健檢（使用者：仔細檢查排版、按鈕和沒想到的地方，有問題直接改上線）
# 用 tools/audit1113.js 在 36 種尺寸、深淺色量完整版和學校版，修這些：
# - 黏在下面的「下一步」「存檔／分享」、視窗最下面的按鈕，會蓋住聚焦的輸入框（名單的姓名、裁判名字、比賽資料）：捲動容器留出它們的高度。
# - 比賽資料頁：矮的手機「下一步：裁判」要往下捲才看得到 → 和裁判頁一樣黏在下面。
# - 補記漏按的暫停或替補：還沒選隊時兩隊按鈕都變淡，像不能按 → 選了一隊才把另一隊變淡。
# - 替補面板配好一組旁邊的「刪除」只有 36px 高 → 44px。
# - 深色模式紅框按鈕（隊伍沒到或人數不足、刪除這場比賽）的紅字對比不夠 → 深色另用亮一點的紅（--del-ink）。
# - 藍色球衣配白字對比 4.3，差一點 → 藍色調深一點點（#1E7BD6 → #1D76CD）；淺色模式橘隊隊名的字、綠色「贏下第 N 局」的字也調深一點。
# - 記錄表「局數」小字、自由球員 L1/L2 小字對比不夠 → 調亮。陣容單填好的格子，位置字（I～VI）改用格子的字色。
# - 窄手機陣容下面用過的號碼，右上角的位置字（VI）蓋到兩位數的號碼 → 號碼往左下移一點。
# - 鍵盤 Esc、Android 返回鍵：輪轉錯誤、改發球格的確認步驟、同一次死球的詢問、最近刪除的確認、暫停倒數小視窗按了沒反應 → 退一層或關掉。
# - 筆電放大 200% 這種很矮的畫面（高 350 以下）：比賽頁按完替補，球場被擠到號碼疊在一起 → 球場保持看得清楚的高度，畫面可以往下捲。
# 用法：python3 tools/patch_v90.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'function stickyPad' not in t, 'already'

# 顏色
t = one(t, '--del:#9E4A3F;', '--del:#9E4A3F;--del-ink:#9E4A3F;')
t = one(t, '--del:#B4594D;', '--del:#B4594D;--del-ink:#E58A7E;', 2)
t = one(t, '--ok:#0E7A4B;', '--ok:#0B6E43;')
t = one(t, "j:'#1E7BD6'", "j:'#1D76CD'")
t = one(t, "l:['#B8420B','#FBE6DA']", "l:['#A83D0A','#FBE6DA']")

# 補記：還沒選隊時不要兩隊都變淡
t = one(t, "h='<h2>補記第 '+iz+' 局</h2><p class=\"subhint\">哪一隊漏按了</p><div class=\"teampick picked\">'",
        "h='<h2>補記第 '+iz+' 局</h2><p class=\"subhint\">哪一隊漏按了</p><div class=\"teampick'+(ik?' picked':'')+'\">'")

# Esc、Android 返回鍵
t = one(t, "'.sheet [data-act=close]','[data-act=subclose]'",
        "'.sheet [data-act=rotback]','.sheet [data-act=bxback]','.sheet [data-act=srback]','.sheet [data-act=srno]','.sheet [data-act=close]','[data-act=subclose]'")
t = one(t, "'[data-act=del-no]','[data-act=bkcancel]'];", "'[data-act=del-no]','[data-act=trashno]','[data-act=bkcancel]','[data-act=tmclose]'];")

# 黏著的列不蓋住聚焦的輸入框
t = one(t, "  if(ui.luShow){ui.luShow=false;",
        "  stickyPad();\n  if(ui.luShow){ui.luShow=false;")
t = one(t, "    var ask=app.querySelector('.rrow.ask');if(ask)ask.scrollIntoView({block:'nearest'});\n    syncAwake(false);return;",
        "    var ask=app.querySelector('.rrow.ask');if(ask)ask.scrollIntoView({block:'nearest'});\n    stickyPad();syncAwake(false);return;")
t = one(t, "/* 11/9 朋友回饋：平板格子大、號碼還是手機大小。",
        "/* 11/13 黏在上下的列（下一步、存檔／分享、視窗最下面的按鈕）會蓋住捲過去或聚焦的輸入框：捲動容器留出它們的高度（scroll-padding） */\n"
        "function stickyPad(){\n"
        "  [].forEach.call(app.querySelectorAll('.page,.sheet'),function(box){var b=0,tp=0;\n"
        "    function add(c){var cs=getComputedStyle(c);if(cs.position!=='sticky')return;var h=c.offsetHeight;if(cs.bottom!=='auto')b=Math.max(b,h);else if(cs.top!=='auto')tp=Math.max(tp,h)}\n"
        "    [].forEach.call(box.children,add);[].forEach.call(box.querySelectorAll('.rnext,.sheetfoot,.selbar,.pendfoot,.bktools'),add);\n"
        "    box.style.scrollPaddingBottom=b?(b+8)+'px':'';box.style.scrollPaddingTop=tp?(tp+8)+'px':''});\n"
        "}\n"
        "/* 11/9 朋友回饋：平板格子大、號碼還是手機大小。")

# 樣式
t = one(t, "</style>",
        "/* 11/13 健檢 */\n"
        ".linkbtn.dangerlink,.foot .pfbtn.ghost.full,.sheet .dellink,.sheet .dellink:last-child{color:var(--del-ink);border-color:var(--del-ink)} /* 紅框按鈕的紅字：深色模式用亮一點的紅 */\n"
        ".page>.fields+.primary.full{position:sticky;bottom:0;z-index:3;box-shadow:0 -6px 8px var(--bg)} /* 比賽資料的「下一步」和裁判頁一樣黏在下面 */\n"
        ".subpair button{min-height:44px}\n"
        ".setbox small{color:rgba(255,255,255,.85)}\n"
        ".lc .lno{font-size:12px}.lc:not(.empty) .lno{opacity:1}\n"
        ".cell.fill .pos{color:inherit}\n"
        ".bench .chip.used b{position:relative;left:-3px;top:4px} /* 窄手機：用過的號碼不要被右上角的位置字蓋到 */\n"
        "@media (min-width:600px) and (max-height:350px){.wplay{min-height:460px}} /* 很矮的畫面（筆電放大 200%）：球場不要擠到號碼疊在一起，畫面往下捲 */\n"
        "</style>")

open(SRC, 'w', encoding='utf-8').write(t)
print('patch_v90 ok')

# 11/13 使用者：手機解除方向鎖定、轉成橫的，版面全部跑掉（iPhone 截圖）。
# 原因：iPhone 橫放時左右各有一段安全區（動態島、瀏海、圓角，約 44～62），下面有橫條（約 21）。以前每個靠邊的東西左右兩邊都留安全區，
# 夾在中間的東西被擠到只剩一半：左邊步驟列 92 寬留 62 → 字只剩 29 寬被切掉；數字鍵、替補面板左右各留 62 → 按鈕 29px、字一直換行；
# 跳出的視窗（已經在畫面正中間）左右也留 62 → 選項擠在一起。模擬器沒有安全區，所以之前測橫向沒看到（tools/audit1113.js 加了 INSET 模擬）。
# 改法：只在貼著螢幕邊的那一側留安全區，另一側照原本的間距；步驟列加寬安全區的寬度；黏在下面的按鈕離開下方橫條。
# 用法：python3 tools/patch_v91.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert '11/13 iPhone 橫放' not in t, 'already'

CSS = '''/* 11/13 iPhone 橫放：左右各有一段安全區（動態島、瀏海、圓角，約 44～62），下面有橫條（約 21）。
   只在貼著螢幕邊的那一側留，另一側照原本的間距；步驟列加寬安全區的寬度，字不被切掉 */
@media (orientation:landscape) and (min-width:640px){
  .nav{width:calc(92px + env(safe-area-inset-left,0px))}
  .shell:not(.nonav)>.page{padding-left:12px}
  .kp:not(.bench){width:calc(330px + env(safe-area-inset-right,0px));padding-left:12px}
  .kp.t2:not(.bench){left:calc(92px + env(safe-area-inset-left,0px));width:330px;padding-left:12px;padding-right:12px}
  .kp.bench{width:calc(min(340px,38vw) + env(safe-area-inset-right,0px));padding-left:12px}
  .kp.bench.onleft{width:calc(min(340px,38vw) + env(safe-area-inset-left,0px));padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:12px}
  .shell.nonav~.kp.bench{width:calc(min(clamp(340px,49vh,400px),40vw) + env(safe-area-inset-right,0px))}
  .shell.nonav~.kp.bench.onleft{width:calc(min(clamp(340px,49vh,400px),40vw) + env(safe-area-inset-left,0px))}
}
/* 跳出的視窗在畫面正中間，離螢幕邊很遠，不用再留安全區 */
@media (min-width:760px){.sheet{padding-left:14px;padding-right:14px}}
/* 比賽頁：兩邊隊伍欄讓出一半安全區給球場，格子不會窄到羅馬數字碰到號碼（沒有安全區的裝置不變） */
@media (orientation:landscape) and (min-width:761px){
  .wplay{grid-template-columns:minmax(150px,calc(210px - env(safe-area-inset-left,0px)/2)) minmax(0,780px) minmax(150px,calc(210px - env(safe-area-inset-right,0px)/2))}
}
/* 下面的按鈕離開下方橫條（手機橫放時橫條在正下方，往上滑會回主畫面）；黏在下面的按鈕下方用底色蓋住捲過去的內容 */
@media (orientation:landscape) and (max-height:620px){
  .hero{padding-bottom:max(14px,env(safe-area-inset-bottom,0px))}
}
@media (orientation:landscape) and (max-height:520px){
  .shell:not(.nonav)>.page{padding-bottom:max(8px,env(safe-area-inset-bottom,0px))}
  .rnext,.page>.foot{box-shadow:0 24px 0 var(--bg)}
  .page>.primary.full,.page>.fields+.primary.full{box-shadow:0 -6px 8px var(--bg),0 24px 0 var(--bg)}
  .cell{height:calc((100vh - 196px - max(0px,env(safe-area-inset-bottom,0px) - 8px))/2)}
  .luside .chip.used b{left:-5px;top:7px} /* 陣容下面用過的號碼：右上角的位置字（VI）不碰到兩位數 */
}
</style>'''

t = one(t, '</style>', CSS)
open(SRC, 'w', encoding='utf-8').write(t)
print('patched v91')

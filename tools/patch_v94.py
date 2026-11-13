# 11/13 使用者（附挑邊頁截圖）：「可以滑掉，有些感覺會沒發現下面還有東西可以設定，是不是變成這種細長的頁面就要把一些圖示縮小不用這樣滑來滑去啊？」
# 手機橫放（又寬又矮，高 520 以下、寬 640 以上）時，設定頁改成一頁放得下：
#   比賽資料：一列四格（寬 760 以下一列三格），格子和字收緊一點；有資料夾時「資料夾」和比賽名稱排同一列。
#   裁判：記錄表的證明欄放左邊，選角色放右邊（三個一列）。
#   挑邊：排球縮小，「下一步」和「隊伍沒到」排一列，「換球衣顏色」不再被蓋住。
#   名單：「下一步」和「印紙本記錄表」排一列（名單是清單，照舊往下捲）。陣容：剛好放得下。
# 另外：裁判頁黏在下面的「下一步」下方也用底色蓋住捲過去的內容（v91 漏了這頁）；
# 畫面正中間的視窗上面那條小橫槓（v93）改成疊在留白裡，不佔高度（改發球格、每局分數設定的視窗在 844×390 不會再多要捲一段）。
# 用法：python3 tools/patch_v94.py（先跑過 v91～v93）
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'SWIPE_LAYERS' in t, 'v93 first'
assert '設定頁不用上下滑' not in t, 'already'
CSS = '/* 11/13 使用者：手機橫放（又寬又矮）時，設定頁不用上下滑，下面的設定才不會沒看到（以前挑邊頁的「換球衣顏色」被黏在下面的按鈕蓋住）。\n   比賽資料一列四格、裁判的證明欄和選角色左右並排、挑邊的排球縮小、下面的按鈕排一列。名單是清單，照舊往下捲。\n   只改這幾個設定頁：開賽確認視窗裡的挑邊、記錄表頁的「裁判」分頁不動 */\n@media (orientation:landscape) and (max-height:520px) and (min-width:640px){\n  /* 比賽資料：一列四格（窄一點的一列三格），字和格子收緊一點 */\n  .page:has(>.fields){padding-top:4px}\n  .page>.fields{grid-template-columns:repeat(8,minmax(0,1fr));gap:5px 10px;max-width:none}\n  .page>.fields>*{grid-column:span 2}\n  .page>.fields>label[for=i-name]{grid-column:span 4}\n  .page>.fields>.folderrow~label[for=i-name]{grid-column:span 2}\n  .page>.fields>.note{grid-column:1/-1}\n  .page>.fields>.ptbtn{grid-column:span 6}\n  .page>.fields>label{line-height:1.2}\n  .page>.fields input{height:44px;min-height:44px}\n  .page>.fields>.folderrow{flex-direction:column;align-items:stretch;gap:3px;line-height:1.2}\n  .page>.fields>.folderrow>span{font-size:14px}\n  .page>.fields>.seg,.page>.fields>.ptsum,.page>.fields>button.wide,.page>.fields>.folderrow{align-self:end}\n  .page>.fields>.seg{min-height:44px}\n  .page>.fields>.seg button{font-size:14px;padding-inline:2px;line-height:1.15}\n  .page>.fields>.ptbtn{min-height:44px}\n  .page>.fields>.ptsum strong{font-size:13px;white-space:nowrap}\n  .page>.fields>.ptsum .muted{font-size:12px}\n  .page>.fields>.seg:has([data-act=fmt]){grid-column:span 3}\n  .page>.fields>.seg:has([data-act=fmt])~.ptbtn{grid-column:span 5}\n  /* 挑邊：排球縮小，下面兩顆按鈕排一列 */\n  .page>.toss .side .ball{width:60px;height:60px}\n  .page>.toss .side{padding:6px 6px 4px;gap:2px}\n  .page>.foot{flex-direction:row;justify-content:center;gap:8px}\n  .page>.foot>.full{flex:1 1 0;min-width:0}\n  .page>.foot>.pfbtn:only-child{flex:none}\n  /* 裁判：記錄表的證明欄放左邊，選角色放右邊 */\n  .page:has(>.refpick:not(.narrow)){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);grid-template-rows:auto 1fr auto;column-gap:14px;align-content:start}\n  .page:has(>.refpick:not(.narrow))>*{grid-column:1/-1}\n  .page:has(>.refpick:not(.narrow))>.ctv-ref{grid-column:1;grid-row:1/3;margin:0;align-self:start;max-width:none}\n  .page:has(>.refpick:not(.narrow))>.refpick{grid-column:2;grid-row:1/3}\n  .page:has(>.refpick:not(.narrow)) .refroles{grid-template-columns:repeat(3,minmax(0,1fr))}\n  /* 名單：下面兩顆按鈕排一列 */\n  .rnext:has(>.primary+.ppone){display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:8px}\n  .rnext:has(>.primary+.ppone)>.ppone{margin-top:0}\n  /* 陣容：剛好放得下，不用上下滑 */\n  .cell{height:calc((100vh - 212px - max(0px,env(safe-area-inset-bottom,0px) - 8px))/2)}\n}\n@media (orientation:landscape) and (max-height:520px) and (min-width:640px) and (max-width:759px){\n  .page>.fields{grid-template-columns:repeat(6,minmax(0,1fr))}\n  .page>.fields>.ptbtn,.page>.fields>.seg:has([data-act=fmt])~.ptbtn{grid-column:span 3;flex-direction:column;justify-content:center;gap:0;padding:2px 8px}\n  .page>.fields{gap:4px 8px}\n  .page>.fields>label{font-size:13px}\n  .page>.fields input{height:42px;min-height:42px}\n}\n/* 畫面正中間的視窗：上面那條小橫槓（v93 起觸控螢幕都有）疊在上方留白裡，不佔高度，視窗不會因此變高、按鈕被擠到要捲 */\n@media (min-width:760px){.sheet.swipe::before{position:absolute;top:5px;left:50%;margin:0 0 0 -20px}}\n/* 裁判頁黏在下面的「下一步」下方也用底色蓋住捲過去的內容（v91 漏了這頁） */\n@media (orientation:landscape) and (max-height:520px){\n  .page>.refpick+.primary.full{box-shadow:0 -6px 8px var(--bg),0 24px 0 var(--bg)}\n}\n'
t = one(t, '</style>', CSS + '</style>')
open(SRC, 'w', encoding='utf-8').write(t)
print('patched v94')

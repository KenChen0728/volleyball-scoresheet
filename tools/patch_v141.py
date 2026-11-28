#!/usr/bin/env python3
"""11/28 晚 Gemini 建議收斂後的修改（專案檔 Gemini建議評估-1128.md 第 1～6 條，測試版）。先跑 patch_v140。
1 連線提示白話　2 轉一格小字「輪轉／退回」　3 公正按鈕和得分鍵拉開　4 觀看畫面暫停條固定位置、提醒教練移到下方
5 灰色層次（Gemini 色碼；不能按 55%）　6 深色主題站位格淡色內框"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if '11/28 Gemini 灰階' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
# 1 連線提示
one("fbErr==='offline'?'目前沒有網路，連線後自動開始；紀錄照常儲存於本機':'連線元件載入失敗，請確認網路後重新整理'",
    "fbErr==='offline'?'目前沒有網路，比賽仍可離線記錄，連上網路後自動開始分享':'無法啟動分享連線，請檢查網路後重試（不影響本機記分）'")
one("'連線中斷：紀錄照常儲存於本機，恢復後自動補傳'","'目前斷線，比賽仍可離線記錄，連線恢復後再同步'")
one("st[0]==='wait'?'傳送中':'未連線')","st[0]==='wait'?'傳送中':'離線記錄')")
one("loadfail:['連線元件載入失敗','請確認網路後重新整理。']","loadfail:['無法連線','請檢查網路後重新整理。']")
# 2 轉一格
one("<small>全隊照輪轉方向移一格</small>","<small>全隊輪轉一格</small>")
one("<small>全隊反方向移一格</small>","<small>全隊退回一格</small>")
one("aria-label=\"全隊照輪轉方向移一格，改成 '","aria-label=\"全隊輪轉一格，改成 '")
one("aria-label=\"全隊反方向移一格，改成 '","aria-label=\"全隊退回一格，改成 '")
# 4 觀看：暫停條固定位置（沒暫停時留空），球場不跳動
one("'<b class=\"'+R+'\">'+c.score[R]+'</b></div>'+ban+tm+","'<b class=\"'+R+'\">'+c.score[R]+'</b></div>'+ban+'<div class=\"wtslot\">'+tm+'</div>'+")
one("</style>","""/* 11/28 Gemini 灰階：次要按鈕淺底＋細邊框、不能按 55%（體育館強光下還看得到）、卡片 */
:root{--btn:#F1EFEA;--btn-edge:#C8C3B8;--btn-ink:#1F2421;--off-ink:#6E736F;--card:#FAF8F5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--btn:#252A30;--btn-edge:#454D57;--btn-ink:#F0F2F5;--off-ink:#8A929B;--card:#1A1D21}}
:root[data-theme="dark"]{--btn:#252A30;--btn-edge:#454D57;--btn-ink:#F0F2F5;--off-ink:#8A929B;--card:#1A1D21}
.tg button,.pbtns button,.seg button:not([aria-pressed="true"]),.mgrid button,.sheet .mbtn,.sheet .pk3 button,.homefoot button,.shead .linkbtn,.histtools button,.fsbtn,.xpbtn,.rotb button,.sheet>.sheetback{box-shadow:inset 0 0 0 1px var(--btn-edge)}
button:disabled,button.dim,.nav button:disabled,.nav button.dim{opacity:.55}
/* 公正重打：虛線框、不填色，和兩側實心得分鍵分得開 */
.rp{background:transparent!important;border:2px dashed var(--muted)!important;box-shadow:none!important;color:var(--ink)}
/* 觀看：暫停條固定位置；提醒教練移到下方 */
.watch .wview .wtslot{flex:none;min-height:84px;display:flex;flex-direction:column;justify-content:center}
@media (max-height:700px){.watch .wview .wtslot{min-height:58px}}
.watch .wrem{top:auto;bottom:max(16px,env(safe-area-inset-bottom,0px));transform:translateX(-50%)}
/* 深色主題：站位格加淡色內框，深藍、黑色球衣分得出格子 */
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pc:not(.srv){box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}}
:root[data-theme="dark"] .pc:not(.srv){box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

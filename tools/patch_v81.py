# 11/12 晚上使用者在比較頁選 A：結果頁只留「看整張」和「存檔／分享」。
# 圖片、PDF、試算表、備份都在「存檔／分享」裡；還沒備份時，提醒那格裡直接有「存備份」。
# 比賽中記錄表下面的「存成圖片／PDF」也改叫「存檔／分享」，打開是同一個視窗。學校版沒有匯出，按鈕照舊。
# 用法：python3 tools/patch_v81.py（改原始檔和學校版的 patches.txt）
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
SCHOOL = '/home/claude/volleyball-scoresheet/tools/school/patches.txt'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:80])
    return t.replace(a, b)


OLD_ROW = ("(XP_ON?'<button class=\"primary full\" data-act=\"sheet\" data-v=\"export\">存成圖片／PDF（整張記錄表）</button>':'')+'"
           "<div class=\"row savebtns\">'+(XP_ON?'<button data-act=\"whole\">看整張</button>':'')+'<button data-act=\"rpjson\">存備份</button><button data-act=\"rpcsv\">存成試算表</button></div><div id=\"rvmsg\" class=\"muted\"></div>")
NEW_ANCHOR = ("<div class=\"row savebtns'+(XP_ON?' two':'')+'\">'+(XP_ON?'<button data-act=\"whole\">看整張</button><button class=\"primary\" data-act=\"sheet\" data-v=\"export\">存檔／分享</button>'"
              ":'<button data-act=\"rpjson\">存備份</button><button data-act=\"rpcsv\">存成試算表</button>')+'</div><div id=\"rvmsg\" class=\"muted\"></div>")

t = open(SRC, encoding='utf-8').read()
assert '存檔／分享' not in t, 'already'
# 結果頁：兩顆
t = one(t, OLD_ROW, "'" + NEW_ANCHOR)
# 還沒備份的提醒裡直接放「存備份」
t = one(t, "建議現在按「存備份」。</div>')", "建議現在存一份備份。<button class=\"bkinline\" data-act=\"rpjson\">存備份</button></div>')")
# 「存檔／分享」視窗：圖片／PDF，加上試算表和備份
t = one(t, "'<div class=\"shd\"><h2>存成圖片／PDF</h2><button data-act=\"close\">關閉</button></div>'+",
        "'<div class=\"shd\"><h2>存檔／分享</h2><button data-act=\"close\">關閉</button></div><p class=\"xphd\">圖片／PDF</p>'+")
t = one(t, "      '<div class=\"mgrid two\">'+it('res','比賽結果','')+it('r6','R6 自由球員','')+'</div>';",
        "      '<div class=\"mgrid two\">'+it('res','比賽結果','')+it('r6','R6 自由球員','')+'</div>'+\n"
        "      '<p class=\"xphd\">其他</p><div class=\"mgrid two\"><button class=\"mbtn\" data-act=\"rpcsv\"><strong>存成試算表</strong><small class=\"muted\">CSV，可以用 Excel 打開</small></button><button class=\"mbtn\" data-act=\"rpjson\"><strong>存備份</strong><small class=\"muted\">換手機時可以還原</small></button></div>';")
# 比賽中記錄表下面的按鈕
t = one(t, "function xpBtn(){return XP_ON?'<button class=\"xpbtn\" data-act=\"sheet\" data-v=\"export\">存成圖片／PDF</button>':''}",
        "function xpBtn(){return XP_ON?'<button class=\"xpbtn\" data-act=\"sheet\" data-v=\"export\">存檔／分享</button>':''}")
# 從「存檔／分享」按試算表、備份：先關掉視窗，訊息才看得到
t = one(t, "    case 'rpcsv': saveFile(", "    case 'rpcsv': if(ui.sheet&&ui.sheet.type==='export'){ui.sheet=null;render()} saveFile(")
t = one(t, "    case 'rpjson':\n      saveFile(", "    case 'rpjson':\n      if(ui.sheet&&ui.sheet.type==='export'){ui.sheet=null;render()}\n      saveFile(")
# 說明
t = one(t, '"d": "資料只存在這台裝置。比賽打完按「存備份」，存到檔案或傳給自己。"',
        '"d": "資料只存在這台裝置。比賽打完按提醒裡的「存備份」，或「存檔／分享」→「存備份」，存到檔案或傳給自己。"')
CSS = ("/* 11/12 結果頁：看整張、存檔／分享兩顆；提醒裡的存備份 */\n"
       ".savebtns.two>button{flex:1 1 0}\n.savebtns.two>.primary{flex:1.6 1 0}\n"
       ".bkinline{display:block;width:100%;margin-top:8px;min-height:44px}\n"
       ".xphd{margin:6px 2px 0;font-weight:700;font-size:14px;color:var(--muted)}\n")
t = one(t, '</style>', CSS + '</style>')
open(SRC, 'w', encoding='utf-8').write(t)
print('patched', SRC)

# 學校版：結果頁的按鈕照舊（patches.txt 對到新的那一段）
s = open(SCHOOL, encoding='utf-8').read()
old_school = "<div class=\"row savebtns\">'+(XP_ON?'<button data-act=\"whole\">看整張</button>':'')+'<button data-act=\"rpjson\">存備份</button><button data-act=\"rpcsv\">存成試算表</button></div><div id=\"rvmsg\" class=\"muted\"></div>\n===="
s = one(s, old_school, NEW_ANCHOR + "\n====")
open(SCHOOL, 'w', encoding='utf-8').write(s)
print('patched', SCHOOL)

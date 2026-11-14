# 11/14 使用者：「裁判的代入直觀嗎？再檢查一次有沒有按鈕會讓人不知所措、選項太多不知道點哪個，有就直接改」
# 1. 裁判頁（完整版；記錄表的「裁判」分頁同一套）
#    - 進來時第一個角色已經框起來，提示卻寫「先點角色，再點名字」：照著點那個角色，框反而被取消，再點名字只跳「先點上面要填的角色」。
#      改成點已經框起來的角色不會取消。
#    - 名字清單上面多一行，寫現在點名字會填進哪個角色（填好跳下一個時跟著變）；框起來的角色已經有人時寫「點別的名字換人，或按「清空」」。
#    - 頁面提示改成「點名字會填進框起來的角色。可以空著，比賽中、比賽後也能補。」使用說明的文字跟著改。
# 2. 存檔／分享：八個選項一樣灰，不知道要點哪個。最常用的「整張記錄表」改成黃色；
#    下一步的「存成 PDF」「存成圖片」底下寫「要列印選這個」「要傳 LINE 選這個」。
# 3. 陣容頁：還沒填號碼時「全隊逆時針／順時針移一格」看起來能按，按了沒反應。改成六格都填好才出現（學校版本來就是這樣，
#    tools/school/patches.txt 那一段拿掉）。複製上一局陣容後六格是滿的，照樣可以轉。
# 用法：python3 tools/patch_v96.py（先跑過 v95）
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'max="9999-12-31"' in t, 'v95 first'
assert 'class="refnow"' not in t, 'already'

# 1. 裁判頁
t = one(t, "case 'refrole': var rv=b.getAttribute('data-v'); ui.refRole=ui.refRole===rv?null:rv; ui.refMsg=''; ui.refNote=''; break;",
        "case 'refrole': var rv=b.getAttribute('data-v'); ui.refRole=rv; ui.refMsg=''; ui.refNote=''; break; // 11/14 點已經框起來的角色不會取消（照提示點了，名字反而填不進去）")
t = one(t, "  var body=roles+selbar+msg+list+oth+(note?'<p class=\"muted\">'+esc(note)+'</p>':'')+typ;",
        "  /* 11/14 名字清單上面寫現在點名字會填進哪個角色 */\n"
        "  var seen=names.length||(ui.refOther&&others.length),now=ui.refMsg?'':role?(selv?'點別的名字換人，或按「清空」':seen?'點名字，填進「'+refLabel(role)+'」':'打名字，按「填入」，填進「'+refLabel(role)+'」'):(firstEmptyRole(s)?'先點上面要填的角色':'六個角色都填好了。要改，先點上面的角色');\n"
        "  var body=roles+selbar+msg+(now?'<p class=\"refnow\">'+esc(now)+'</p>':'')+list+oth+(note?'<p class=\"muted\">'+esc(note)+'</p>':'')+typ;")
t = one(t, '<p class="stephint">先點角色，再點名字。可以空著，比賽中、比賽後也能補。</p>',
        '<p class="stephint">點名字會填進框起來的角色。可以空著，比賽中、比賽後也能補。</p>')
t = one(t, '先點角色，再點名字，填好會自動跳到下一個角色。排錯時點那個角色按「清空」；點已經排在別處的人，會直接搬過來。',
        '點名字會填進框起來的角色，填好自動跳到下一個。要填別的角色，先點那個角色；排錯時點那個角色按「清空」；點已經排在別處的人，會直接搬過來。')

# 2. 存檔／分享
t = one(t, "var it=function(v,t,sub,dis){return '<button class=\"mbtn\" data-act=\"xpitem\"",
        "var it=function(v,t,sub,dis,cl){return '<button class=\"mbtn'+(cl?' '+cl:'')+'\" data-act=\"xpitem\"")
t = one(t, "it('all','整張記錄表','協會三局制記錄表的格式，A3 一張')",
        "it('all','整張記錄表','協會三局制記錄表的格式，A3 一張',false,'primary')")
t = one(t, """'<div class="row"><button class="go" data-act="xpsave" data-v="pdf">存成 PDF</button><button class="go" data-act="xpsave" data-v="png">存成圖片</button></div>'""",
        """'<div class="row xpfmt"><button class="go" data-act="xpsave" data-v="pdf"><b>存成 PDF</b><small>要列印選這個</small></button><button class="go" data-act="xpsave" data-v="png"><b>存成圖片</b><small>要傳 LINE 選這個</small></button></div>'""")

# 3. 陣容頁：六格都填好才放整隊轉一格的按鈕
t = one(t, """  var rotb=c.locked[k]||c.started?'':'<div class="rotb">""",
        """  var rotb=c.locked[k]||c.started||c.lineups[k].indexOf(null)>=0?'':'<div class="rotb">""")

css = """
/* 11/14 裁判頁：名字清單上面寫現在會填進哪個角色；存檔／分享：最常用的整張記錄表用黃色，PDF 和圖片寫什麼時候選 */
.refnow{margin:0;font-size:15px;font-weight:700;line-height:1.4;color:var(--ink)}
.sheet .mbtn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.sheet .mbtn.primary small,.sheet .mbtn.primary .muted{color:var(--accent-ink)}
.xpfmt .go{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:60px;line-height:1.25}
.xpfmt .go small{font-size:13px;font-weight:600}
"""
i = t.rindex('</style>')
t = t[:i] + css + t[i:]
open(SRC, 'w', encoding='utf-8').write(t)
print('patched v96')

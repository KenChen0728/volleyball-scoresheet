# 11/13 第 20 項：使用說明照新風格重截，加新功能的說明卡；截圖時發現的兩個小問題一起修
# - 陣容填滿 6 格（或按「複製」）後，「確認這張陣容單」在矮的手機（375×667、400×760）被下方步驟列蓋住：自動捲到看得到。
# - 球在進行中按「復原」退掉得分時，「已復原：…」寫在被得分鍵蓋住的提示列，看不到：這時改浮在上面（和其他頁一樣）。
# - 局結束視窗改了時間、還沒按「確定」時畫面重畫（例如提示字收起來），時間會變回原本的：改的值記住，重畫照用。
# - 使用說明：組別重新分（自由球員、少見的狀況、記錄表、更正各自一組），每組 3～5 張；新卡片：輪轉錯誤、本局記錄表點格子、
#   改發球格、手機直放的放大、手機轉橫。在「記錄表」的「更正」分頁按問號，直接打開「更正」那一組。
# 用法：python3 tools/patch_v89.py（說明圖另外用 tools/help1113.js 截、tools/help1113_import.py 換進去）
import json
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'ui.luShow' not in t, 'already'

# 陣容填滿後「確認這張陣容單」要看得到
t = one(t, "ui.sel=null; autoSelect(reduce(m.events),fsel); break;", "ui.sel=null; autoSelect(reduce(m.events),fsel); ui.luShow=true; break;")
t = one(t, "case 'copy': dispatch('LINEUP_COPIED',{set:n,team:k}); ui.sel=null; autoSelect(reduce(m.events)); break;",
        "case 'copy': dispatch('LINEUP_COPIED',{set:n,team:k}); ui.sel=null; autoSelect(reduce(m.events)); ui.luShow=true; break;")
t = one(t, "if(on&&box){var lim=box.getBoundingClientRect().top-8,rb=on.getBoundingClientRect();if(rb.bottom>lim)pg.scrollTop+=rb.bottom-lim;if(on.getBoundingClientRect().top<pg.getBoundingClientRect().top)pg.scrollTop-=pg.getBoundingClientRect().top-on.getBoundingClientRect().top}\n}",
        "if(on&&box){var lim=box.getBoundingClientRect().top-8,rb=on.getBoundingClientRect();if(rb.bottom>lim)pg.scrollTop+=rb.bottom-lim;if(on.getBoundingClientRect().top<pg.getBoundingClientRect().top)pg.scrollTop-=pg.getBoundingClientRect().top-on.getBoundingClientRect().top}\n"
        "  /* 11/13 陣容填滿後「確認這張陣容單」才出現，矮的手機會被下方步驟列蓋住：捲到看得到 */\n"
        "  if(ui.luShow){ui.luShow=false;var lkb=app.querySelector('[data-act=lu-lock]');if(lkb){var lkr=lkb.getBoundingClientRect(),pgr=pg.getBoundingClientRect();if(lkr.bottom>pgr.bottom-8)pg.scrollTop+=lkr.bottom-pgr.bottom+8}}\n}")

# 球在進行中，提示列藏在得分鍵下面：提示字改浮在上面
t = one(t, "if(ui.toast&&Date.now()<ui.toast.until&&!app.querySelector('.lockline.toast')){var ftn",
        "var ltx=app.querySelector('.lockline.toast');if(ui.toast&&Date.now()<ui.toast.until&&(!ltx||ltx.closest('.lvh'))){var ftn")

# 局結束視窗改了時間還沒按「確定」，畫面重畫（提示字到時間收起來時）會變回原本的時間：改的值先記在 ui.seEdit，重畫照用
t = one(t, "  var auto=v.info['en'+n]||!c.firstServeAt?'':' data-auto=\"'+Math.max(0,Math.round((new Date(c.lastPointAt||c.endAt)-new Date(c.firstServeAt))/60000))+'\"'; // 結束時間沒改過：開始時間改了，結束時間跟著移\n",
        "  var auto=v.info['en'+n]||!c.firstServeAt?'':' data-auto=\"'+Math.max(0,Math.round((new Date(c.lastPointAt||c.endAt)-new Date(c.firstServeAt))/60000))+'\"'; // 結束時間沒改過：開始時間改了，結束時間跟著移\n"
        "  var se=ui.seEdit&&ui.seEdit.wp===wp?ui.seEdit:null;if(se){st=se.st;en=se.en;if(!se.auto)auto=''} // 11/13 改了還沒按確定，重畫照用改過的\n")
t = one(t, "  d.innerHTML=durText(a.value,b.value)}\napp.addEventListener('input',seDur);",
        "  d.innerHTML=durText(a.value,b.value);\n"
        "  var sok=document.querySelector('.sheet.setend [data-act=endok]');if(sok)ui.seEdit={wp:sok.getAttribute('data-v'),st:a.value,en:b.value,auto:b.hasAttribute('data-auto')}}\n"
        "app.addEventListener('input',seDur);")
t = one(t, "if(ui.toast&&Date.now()>ui.toast.until){ui.toast=null;if(view==='setup'&&ui.page==='play'&&!ui.liveSheet&&!ui.pen&&!ui.sub&&!ui.sheet)render()}",
        "if(ui.toast&&Date.now()>ui.toast.until){ui.toast=null;if(view==='setup'&&ui.page==='play'&&!ui.liveSheet&&!ui.pen&&!ui.sub&&!ui.sheet&&!document.querySelector('.sheet.setend'))render()}")

# 在「記錄表」的「更正」分頁按問號，直接打開「更正」那一組
t = one(t, "  if(ui.page==='play'&&(ui.liveSheet||matchOver(s)))return 'sheet';",
        "  if(ui.page==='play'&&(ui.liveSheet||matchOver(s)))return ui.rtab==='fix'&&HELP.some(function(g){return g.id==='fix'})?'fix':'sheet'; // 學校版沒有「更正」組，更正放在「比賽紀錄」組")

# 使用說明：重新分組、加新卡片（圖另外換）。沿用的卡片照舊，只改要改的字
i = t.index('var HELP=')
j = t.index(';\n', i)
H = json.loads(t[i + len('var HELP='):j])
cards = {}
for g in H:
    for c in g['cards']:
        cards.setdefault(c['img'], dict(c))


def C(img, title=None, text=None):
    c = dict(cards[img]) if img in cards else {'img': img}
    if title:
        c['t'] = title
    if text:
        c['d'] = text
    assert c.get('t') and c.get('d'), img
    return c


def G(gid, name, desc, cs):
    assert 1 <= len(cs) <= 5, gid
    return {'id': gid, 'name': name, 'desc': desc, 'cards': cs}


old = {g['id']: g for g in H}
old['start']['cards'] = [C('steps', text='資料、裁判、名單、挑邊、陣容、比賽。完成的步驟會打勾；還不能按的步驟點了會說原因。不確定就按右上角的問號。') if c['img'] == 'steps' else c for c in old['start']['cards']]
NEW = [
    old['start'],
    old['info'],
    old['refs'],
    old['roster'],
    old['toss'],
    G('lineup', '陣容', '填先發站位、確認開局', [C('lu1'), C('lu2'), C('lu3', text='填完按「確認這張陣容單」。還要改時按「修改」。'), C('start')]),
    G('play', '比賽', '發球、得分、復原、舉球員', [C('serve'), C('serve2'), C('point'), C('undo'), C('setter')]),
    G('subs', '暫停和替補', '暫停、替補、改當時的比分', [C('to'), C('sub'), C('fixsc')]),
    G('libero', '自由球員', '換上場、到前排、重新指定', [C('lib'), C('libf'), C('redes')]),
    old['penalty'],
    G('rare', '少見的狀況', '「其他」裡的功能、輪轉錯誤', [
        C('more', text='例外替補、重新指定自由球員、傷停、陣容不完整、棄權、輪轉錯誤，還有修正和設定，都在「其他」。最下面是「離開這場比賽」。'),
        C('rot1', '輪轉錯誤、非法替補', '對方的 1 分先照平常按「得分」。再按「其他」→「輪轉錯誤／非法替補」，選犯錯的隊和種類，填這隊要追回到幾分。不知道從哪一分開始錯，只要給對方得分，不用按這個。'),
        C('rot2', '確認取消的分數', '會寫出取消哪幾分、比分變成多少，記事欄自動寫好；記錄表上取消的分數留著斜線。輪轉不倒回，按錯可以「復原」。')]),
    G('sets', '局結束和下一局', '核對比分和時間、核對記錄表、下一局', [
        C('end', text='打完最後一分會跳出比分和時間。時間跟紙本不同就點時間改，再按「確定」。'),
        C('endview', '核對這局', '確定後打開「本局」：上面是這局的記錄表，下面是結果。跟紙本核對，暫停、替補、先發背號、發球格點一下就能修改或補記。核對完按上方的「下一局」。'),
        C('endback', text='按「下一局」之前，都能按「復原上一步」退回最後一分。按了之後比分就不能改；暫停、替補、時間和發球格，在比賽確定結束前都還能改。'),
        C('copy', text='第 2、3 局要沿用，就按「複製第 1 局陣容」這類按鈕，再用旋轉鈕調整。')]),
    old['set3'],
    G('sheet', '記錄表', '看各局、手機直放和轉橫、點格子修改', [
        C('sheet1', text='比賽中按「記錄表」，上方切換各局、結果、判罰、自由、記事、裁判和更正。'),
        C('loupe', '手機直放時', '上面是整局縮小，框起來的那一塊在下面放大。點上面哪裡，下面就放大那一塊。平板和電腦直接看整局。'),
        C('cell', '點格子修改', '下面放大的那塊，暫停、替補、先發背號的格子點一下，就能修改或補記漏按的。打完的局連發球格都能改。按了「確定比賽結束」就只能看。'),
        C('land', '手機轉橫', '比賽中把手機轉橫，整個畫面變成這一局的記錄表，轉回直的就能繼續記錄。要橫著記錄就按「橫的也要記錄」，或到「其他」的「手機轉橫」改。手機鎖定直向時，按記錄表下面的「橫向全螢幕」。')]),
    G('fix', '更正', '改按錯的紀錄、發球格、先發背號、挑邊', [
        C('fix1'), C('fix2'),
        C('box', '改發球格', '打完的局，點記錄表的發球格，這隊的發球格會照紙本排成六欄。改不一樣的格子，按「下一步」會列出改了哪幾格、哪些暫停替補的比分跟著變，確定才改。粗框是最後比分，不能在這裡改。'),
        C('fixlu'), C('tossfix')]),
    old['cup'],
    old['history'],
    old['install'],
    old['install2'],
]
for g in NEW:
    assert 1 <= len(g['cards']) <= 5, g['id']
ids = [g['id'] for g in NEW]
assert len(ids) == len(set(ids)), ids
t = t[:i] + 'var HELP=' + json.dumps(NEW, ensure_ascii=False) + t[j:]

open(SRC, 'w', encoding='utf-8').write(t)
print('patch_v89 ok')

# 11/13 第 19 項：逐頁細修（灰掉的按鈕寫原因、每頁一句說明、上下置中）
# - 下方步驟列還不能按的「陣容」「比賽」：點了說原因（以前灰掉、點了沒反應）。
# - 比賽資料頁開賽後欄位灰掉：上面寫「已開局，比賽資料不能再修改。」（名單、挑邊本來就有）。
# - 每局分數設定：已經開始的局灰掉，寫原因。
# - 挑邊頁：內容放在畫面中間（以前擠在上面，下面一大片空白）。
# 用法：python3 tools/patch_v88.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'data-why=' not in t, 'already'

# 步驟列：還不能按的點了說原因
t = one(t, "    ['lineup','陣容',st(4+NAV_OFF(),c.started||(c.locked.t1&&c.locked.t2),'lineup'),!tossed],\n    ['play','比賽',st(5+NAV_OFF(),false,'play'),!begun]",
        "    ['lineup','陣容',st(4+NAV_OFF(),c.started||(c.locked.t1&&c.locked.t2),'lineup'),!tossed,'先挑邊，才能填陣容'],\n    ['play','比賽',st(5+NAV_OFF(),false,'play'),!begun,'兩隊陣容確認後，按「開始比賽」']")
t = one(t, "    return '<button data-act=\"page\" data-v=\"'+i[0]+'\" aria-current=\"'+(ui.page===i[0])+'\"'+(i[3]?' disabled':'')+'>'",
        "    return '<button data-act=\"page\" data-v=\"'+i[0]+'\" aria-current=\"'+(ui.page===i[0])+'\"'+(i[3]?' class=\"dim\" aria-disabled=\"true\" data-why=\"'+esc(i[4]||'')+'\"':'')+'>'")
t = one(t, "    case 'page': ui.page=b.getAttribute('data-v');",
        "    case 'page': if(b.getAttribute('aria-disabled')==='true'){ui.toast={t:b.getAttribute('data-why')||'這一步還不能用',until:Date.now()+3000};break} // 11/13 還不能按的步驟點了說原因\n"
        "      ui.page=b.getAttribute('data-v');")
# 比賽資料：開賽後寫原因
t = one(t, "  return (lk?'':'<p class=\"stephint\">這一頁都可以空著，不確定就直接按下一步。</p>')+'<div class=\"fields\">'+",
        "  return (lk?'<p class=\"note\">已開局，比賽資料不能再修改。</p>':'<p class=\"stephint\">這一頁都可以空著，不確定就直接按下一步。</p>')+'<div class=\"fields\">'+")
# 每局分數設定：已經開始的局寫原因
t = one(t, "    }).join('')+'</div>'+(ui.ptErr?'<p class=\"fielderr\" role=\"alert\">'+esc(ui.ptErr)+'</p>':'')+'<button class=\"primary\" data-act=\"close\">完成</button>';",
        "    }).join('')+'</div>'+([1,2,3].some(function(n){return s.sets[n].started})?'<p class=\"muted\">已經開始的局不能改。</p>':'')+(ui.ptErr?'<p class=\"fielderr\" role=\"alert\">'+esc(ui.ptErr)+'</p>':'')+'<button class=\"primary\" data-act=\"close\">完成</button>';")
# 挑邊：放在畫面中間
t = one(t, "  var h='<p class=\"stephint\">'+(n===1?'點先發球隊伍的排球。", "  var h='<p class=\"stephint'+(c.started?'':' vc')+'\">'+(n===1?'點先發球隊伍的排球。")
t = one(t, ".nav button:disabled{opacity:.45}", ".nav button:disabled,.nav button.dim{opacity:.45}\n.page>.vc{margin-top:auto} /* 11/13 內容放中間：和下面按鈕列的 margin-top:auto 平分空白 */")

# 提示字（ui.toast）以前只寫在比賽頁的提示列，其他頁（步驟列、記錄表頁、局結束）按了看不到：沒有提示列時浮在下面，幾秒自己消失，不擋手指
t = one(t, "  lastPgKey=pgKey;\n  fitNums();flipRun(flip);helpPlace();",
        "  lastPgKey=pgKey;\n"
        "  if(ui.toast&&Date.now()<ui.toast.until&&!app.querySelector('.lockline.toast')){var ftn=document.createElement('div');ftn.className='ftoast';ftn.setAttribute('role','status');ftn.textContent=ui.toast.t;app.appendChild(ftn)}\n"
        "  fitNums();flipRun(flip);helpPlace();")
t = one(t, "setInterval(function(){if(ui.toast&&Date.now()>ui.toast.until){ui.toast=null;",
        "setInterval(function(){var ftx=document.querySelector('.ftoast');if(ftx&&!(ui.toast&&Date.now()<ui.toast.until))ftx.remove();if(ui.toast&&Date.now()>ui.toast.until){ui.toast=null;")
t = one(t, ".page>.vc{margin-top:auto} /* 11/13 內容放中間：和下面按鈕列的 margin-top:auto 平分空白 */",
        ".page>.vc{margin-top:auto} /* 11/13 內容放中間：和下面按鈕列的 margin-top:auto 平分空白 */\n"
        ".ftoast{position:fixed;left:50%;transform:translateX(-50%);top:calc(var(--safe-top,0px) + 66px);z-index:95;width:max-content;max-width:min(560px,calc(100vw - 32px));background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:12px;font-weight:700;font-size:15px;line-height:1.4;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;text-align:center}")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

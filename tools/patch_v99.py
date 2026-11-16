#!/usr/bin/env python3
"""11/15 接手記錄的畫面：接手的那台只留比賽進行要用的（得分、發球、暫停、替補、自由球員、場上隊長、復原），
判罰、記錄表、「其他」裡的換人／比賽狀況／修正先收起來，等原本的記錄台接回去再補。程式在 tools/v97-sync.js。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'pbtns take' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("<button data-act=\"sheet\" data-v=\"more\">其他</button></div>';\n  var lfr=libFront(s)",
    "<button data-act=\"sheet\" data-v=\"more\">其他</button></div>';\n  if(takeOn(current()))tools='<div class=\"pbtns take\"><button class=\"takebtn\" data-act=\"syncopen\">接手記錄中<small>代碼 '+esc(share.code)+'</small></button><button data-act=\"sheet\" data-v=\"more\">其他</button></div>';\n  var lfr=libFront(s)")
one("    h='<div class=\"shd\"><h2>其他</h2><button data-act=\"close\">關閉</button></div>'+\n      '<section class=\"msec\"><h3 class=\"mhead\">換人</h3>",
    "    var tkm=takeOn(current());\n    h='<div class=\"shd\"><h2>其他</h2><button data-act=\"close\">關閉</button></div>'+\n      (tkm?'<p class=\"note\">本機為接手記錄：例外替補、修正與判罰請待原記錄台收回後補登。</p>':'<section class=\"msec\"><h3 class=\"mhead\">換人</h3>")
one("mb('page','roster','查看名單')+'</div></section>'+","mb('page','roster','查看名單')+'</div></section>')+")
CSS='''
/* 11/15 接手記錄 */
.pbtns.take{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.takebtn{display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;font-weight:800;color:var(--ok-ink,var(--ok));border-color:currentColor}
.takebtn small{font-size:12px;font-weight:600;color:var(--muted)}
.wtake{flex:none;display:flex;align-items:center;gap:10px;padding:8px max(10px,env(safe-area-inset-right,0px)) 8px max(10px,env(safe-area-inset-left,0px));background:var(--panel);border-bottom:1px solid var(--line)}
.wtake span{flex:1;min-width:0;font-size:14px;font-weight:700}
.wtake button{flex:none;min-height:44px;padding:0 16px;font-weight:800;color:var(--del-ink,#B3261E);border:2px solid currentColor}
.wnote{flex:none;margin:0;padding:8px 12px;text-align:center;font-weight:700;font-size:14px;background:var(--panel);border-bottom:1px solid var(--line)}
.takelist{margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:4px;color:var(--muted);font-size:14px}
.sheet button.tall{display:flex;flex-direction:column;align-items:center;line-height:1.25;padding-block:8px}
.sheet button.tall small{font-size:13px;font-weight:600;opacity:.85}
@media (max-width:429px){.bar:has(.synctag) h1 .btgt{display:none}} /* 手機上出現「被接手／未連線」小標時，先收掉幾分制，時間才放得下 */
.wcode b{display:block;font-size:15px;line-height:1.2}.wcode small{display:block;font-size:12px;font-weight:600;color:var(--muted)} /* 11/16 觀看畫面上方：場地＋代碼 */
.wrecent{display:flex;flex-direction:column;gap:8px}
.wrc{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;text-align:left;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
.wrc span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.wrc b{font-size:16px}.wrc small{font-size:13px;color:var(--muted);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wrc i{flex:none;font-style:normal;font-weight:800;color:var(--ink)}
.wpage{justify-content:flex-start}.wpage>.wview{margin-block:auto} /* 內容比畫面高時（手機橫放＋接手那一行），上面不會被切掉、捲得到 */
'''
one('\n</style>\n\n<div class="statusband"',CSS+'</style>\n\n<div class="statusband"')
# 11/16 被接手的那一場鎖住：每次畫面前檢查；萬一還是記了（例如程式其他地方直接記），事件也不寫進去
one('\nfunction render(){','\nfunction render(){syncLockCheck();')
one("  if(syncAct(act,b)){render();return}","  if(syncLocked()&&!b.closest('.sheet')){syncLockCheck();render();return} // 被接手的那一場：只有收回記錄的視窗能按\n  if(syncAct(act,b)){render();return}")
one("function dispatch(type,data,match){\n  var m=match||current();\n","function dispatch(type,data,match){\n  var m=match||current();\n  if(share&&share.lost&&m&&share.mid===m.id){syncLockCheck();return}\n")
open(SRC,'w',encoding='utf8').write(s)
print('patched v99')

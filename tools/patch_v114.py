#!/usr/bin/env python3
"""11/20 從首頁「全部賽程」進資料夾，左上返回回主畫面（使用者 01:07：返回卻進到賽事與紀錄）。
從賽事與紀錄進來的照舊回賽事與紀錄。先跑 patch_v97～v113。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if "cupView.from==='home'" in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""<button class="linkbtn" data-act="cupopen" data-id="'+esc(c.id)+'">全部賽程</button>""","""<button class="linkbtn" data-act="cupopen" data-from="home" data-id="'+esc(c.id)+'">全部賽程</button>""")
one("""    case 'cupopen': cupView={id:b.getAttribute('data-id'),div:CUP_DIVS[0],grp:''};""","""    case 'cupopen': cupView={id:b.getAttribute('data-id'),div:CUP_DIVS[0],grp:'',from:b.getAttribute('data-from')||''};if(cupView.from==='home')cupView.tab='sched';""")
one("""<header class="bar"><button class="barback" data-act="history">‹ 賽事與紀錄</button><h1>'+esc(c.name)+'</h1>""","""<header class="bar">'+(cupView.from==='home'?'<button class="barback" data-act="home">‹ 主畫面</button>':'<button class="barback" data-act="history">‹ 賽事與紀錄</button>')+'<h1>'+esc(c.name)+'</h1>""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v114')

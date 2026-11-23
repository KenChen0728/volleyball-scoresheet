#!/usr/bin/env python3
"""11/23 10:12 使用者：自己打時間時「確定」和「完成」顯示一個就好（先跑 patch_v131）。
- 數字鍵拿掉「確定」，按下面的「完成」就套用打的時間（v131 已經會套用；打一半會說還差幾個）
- 排成兩排：1～6 / 7、8、9、0、⌫（⌫ 佔兩格）
- 電腦按 Enter 等於「完成」"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'class="sctkdel"' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""  for(i=1;i<=5;i++)k+='<button data-act="sctk" data-v="'+i+'"'+(scTkOk(b,i)?'':' disabled')+'>'+i+'</button>';
  k+='<button data-act="sctkdel" aria-label="刪除"'+(b?'':' disabled')+'>⌫</button>';
  [6,7,8,9,0].forEach(function(n){k+='<button data-act="sctk" data-v="'+n+'"'+(scTkOk(b,n)?'':' disabled')+'>'+n+'</button>'});
  k+='<button class="primary" data-act="sctok"'+(b.length===4?'':' aria-disabled="true"')+'>確定</button>';""",
"""  [1,2,3,4,5,6,7,8,9,0].forEach(function(n){k+='<button data-act="sctk" data-v="'+n+'"'+(scTkOk(b,n)?'':' disabled')+'>'+n+'</button>'});
  k+='<button class="sctkdel" data-act="sctkdel" aria-label="刪除"'+(b?'':' disabled')+'>⌫</button>'; // 11/23 拿掉「確定」，按下面的「完成」""")
one("""<span class="muted">打四個數字，例如 1517</span>""","""<span class="muted">打四個數字，例如 1517，再按「完成」</span>""")
one("""else if(e.key==='Enter')q='[data-act="sctok"]';""","""else if(e.key==='Enter')q='[data-act="scpkdone"]';""")
one(""".sctkp>button.primary{font-family:inherit;font-size:16px}""",""".sctkp>button.sctkdel{grid-column:span 2}""")
open(SRC,'w',encoding='utf8').write(s)
print('v132 ok')

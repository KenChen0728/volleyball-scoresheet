#!/usr/bin/env python3
"""11/29 凌晨 使用者：公正用 B（實線框、不填色，虛線不像按鈕）；可以按的按鈕加淡陰影，更像按鈕。先跑 patch_v142。
不能按（disabled、.dim）不加陰影，所以能按、不能按更好分；深色主題陰影看不太出來，主要靠細框"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if '11/29 按鈕陰影' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one(".rp{background:transparent!important;border:2px dashed var(--muted)!important;box-shadow:none!important;color:var(--ink)}",
    ".rp{background:transparent!important;border:2px solid var(--ink)!important;box-shadow:var(--lift)!important;color:var(--ink)}")
one("</style>","""/* 11/29 按鈕陰影：可以按的按鈕微微浮起來；不能按的平的 */
:root{--lift:0 2px 0 rgba(60,50,40,.22),0 3px 6px rgba(60,50,40,.10)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--lift:0 2px 0 rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.10)}}
:root[data-theme="dark"]{--lift:0 2px 0 rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.10)}
.tg button:not(.dim):not(:disabled),.pbtns button:not(:disabled),.rotb button:not(:disabled),.sheet .mbtn:not(:disabled),.homefoot button,.mgrid button:not(:disabled){box-shadow:inset 0 0 0 1px var(--btn-edge),var(--lift)}
.sb:not(:disabled),.sv:not(:disabled),.primary:not(:disabled){box-shadow:var(--lift)}
</style>""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

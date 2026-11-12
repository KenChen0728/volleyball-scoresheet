#!/usr/bin/env python3
"""11/12 13:26 使用者看名單頁：「格子裡面不要打勾，會看不到數字」。
名單的號碼格很窄，正在輸入的那格右上角的小勾會蓋住號碼。正在輸入的格子本來就有粗框，拿掉小勾。
（陣容格比較大，勾在角落不會蓋到號碼，先不動。）
用法：python3 tools/patch_v74.py [檔案]（預設改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py；也可以直接改正式版的 index.html）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
MARK = '/* 11/12 名單號碼格不打勾 */'
assert MARK not in s, '已經改過了'
assert s.count('</style>') == 1
s = s.replace('</style>', MARK + '\n.num.on::after{content:none}\n</style>')
open(SRC, 'w', encoding='utf8').write(s)
print('patch_v74 ok')

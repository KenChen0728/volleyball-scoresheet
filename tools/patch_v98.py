#!/usr/bin/env python3
"""11/14 使用者（平板實測）：陣容頁下面的號碼一列固定 6 個，右邊還有空位，第 7 個就跑到下一行。
改成照寬度排：手機照舊一列 6 個；寬 600 以上（平板、電腦）一列排得下幾個就排幾個，每格 60px。
手機橫放（.luside 44px 那條規則在後面）不變。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
NEW='@media (min-width:600px){.luside .benchrow{grid-template-columns:repeat(auto-fill,60px)}}\n'
if NEW in s:sys.exit('already patched')
a='.chips,.libs,.pad,.benchrow{display:grid;grid-template-columns:repeat(6,minmax(0,60px));gap:6px;justify-content:start}\n'
assert s.count(a)==1
s=s.replace(a,a+NEW)
open(SRC,'w',encoding='utf8').write(s)
print('patched v98')

# 11/12 晚上使用者在比較頁選 A：比賽中最常用的是發球、得分、暫停、替補、復原。
# 暫停、替補加大（用掉下面的空白）；判罰、記錄表、其他留在下面那排，字變小（高度不低於 44px）。
# 平板的那排也變矮一點。
# 用法：python3 tools/patch_v80.py [檔案 ...]（預設改原始檔；也能直接套在正式版）
import sys
files = sys.argv[1:] or ['/home/claude/nanshe/nanshe-scoresheet.html']
CSS = ("/* 11/12 使用者選 A：暫停、替補加大；判罰、記錄表、其他留在下面那排，字變小 */\n"
       ".zone .tt button{min-height:52px;font-size:18px}\n"
       "@media (min-height:700px){.zone .tt button{min-height:64px;font-size:19px}}\n"
       ".pbtns button{font-size:15px}\n"
       ".pagewide .pbtns button{min-height:48px}\n")


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:80])
    return t.replace(a, b)


for f in files:
    t = open(f, encoding='utf-8').read()
    if '使用者選 A：暫停、替補加大' in t:
        print('skip (already)', f)
        continue
    t = one(t, '</style>', CSS + '</style>')
    open(f, 'w', encoding='utf-8').write(t)
    print('patched', f)

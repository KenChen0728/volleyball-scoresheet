# 11/12 傍晚使用者：手機上名單的數字鍵盤跳出來後，上面的東西看不到，要一直上下滑。
# 使用者選「鍵盤變矮」：手機直放時，名單的數字鍵不再是正方形，改成 46px 高；鍵盤開著時收起最上面那行說明。
# 平板、電腦、手機橫放照舊。正在輸入的那格本來就會自動捲到鍵盤上方（不用改）。
# 用法：python3 tools/patch_v78.py [檔案 ...]（預設改原始檔和學校版的 patches.txt；也能直接套在正式版 index.html、school/index.html）
import sys
files = sys.argv[1:] or ['/home/claude/nanshe/nanshe-scoresheet.html', '/home/claude/volleyball-scoresheet/tools/school/patches.txt']

KP = "'+(ui.slot.t1||ui.slot.t2?' kpon':'')+'"
CSS = ("/* 11/12 使用者：手機上名單的數字鍵盤太高，打字時看不到上面。手機直放時鍵盤壓矮、打字時收起說明 */\n"
       "@media (orientation:portrait) and (max-width:599px){\n"
       "  .kp:not(.bench) .pad button{aspect-ratio:auto;height:46px}\n"
       "  .stephint.kpon{display:none}\n"
       "}\n")


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:80])
    return t.replace(a, b)


for f in files:
    t = open(f, encoding='utf-8').read()
    if ' kpon' in t:
        print('skip (already)', f)
        continue
    hit = 0
    for a in ['<p class="stephint">點「號碼」空格輸入背號。', '<p class="stephint">點空格輸入背號，每隊至少 6 位。']:
        if a in t:
            t = one(t, a, a.replace('<p class="stephint">', '<p class="stephint' + KP + '">'))
            hit += 1
    assert hit == 1, (f, hit)
    if not f.endswith('patches.txt'):
        t = one(t, '</style>', CSS + '</style>')
    open(f, 'w', encoding='utf-8').write(t)
    print('patched', f)

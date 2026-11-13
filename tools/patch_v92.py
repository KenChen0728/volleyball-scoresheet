# 11/13 使用者（語音）：手機橫放時，名單的數字鍵盤不需要那麼大的白框。
# 改成白框剛好包住鍵盤、靠下對齊，上面讓出來給名單看；左右照舊（填左邊那隊時在右邊，填右邊那隊時在左邊）。
# 平板、電腦橫放是同一個面板，一起改（以前從上面的列一路到底，鍵盤放在正中間，上下都是空白）。
# 用法：python3 tools/patch_v92.py（先跑過 patch_v91.py）
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert '11/13 iPhone 橫放' in t, 'v91 first'
assert '白框剛好包住鍵盤' not in t, 'already'

CSS = '''/* 11/13 使用者（語音）：橫放時名單的數字鍵盤，白框剛好包住鍵盤、靠下對齊，上面讓出來給名單看。
   左右照舊：填左邊那隊時在右邊，填右邊那隊時在左邊 */
@media (orientation:landscape) and (min-width:640px){
  .kp:not(.bench){top:auto;max-height:calc(100% - 60px);overflow-y:auto;overscroll-behavior:contain;border-top:2px solid var(--ink);justify-content:flex-start}
  .kp:not(.bench) .pad .add{font-size:13px;white-space:nowrap} /* 鍵寬 42～48 時「下一格」不換行 */
}
</style>'''

t = one(t, '</style>', CSS)
open(SRC, 'w', encoding='utf-8').write(t)
print('patched v92')

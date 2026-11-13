# 11/13 晚上（接 v94）：手機橫放時比賽資料一列四格，日期欄右邊的小日曆圖示在 Chrome、Edge 被切掉一截
# （寬 760～875 左右：手機橫放、筆電放大 175%）。
# 原因：Chrome 的日期欄照「最大年份」留寬度，沒有設 max 時年份留 6 位數（可以打到 275760 年），數字和圖示中間空一大段，
# 欄位一窄圖示就被擠出去。日期欄加 max="9999-12-31"，年份只留 4 位數，圖示放得下。
# 其他畫面的日期欄只是圖示離數字近一點；iPhone 的日期欄沒有圖示，不受影響。
# 用法：python3 tools/patch_v95.py（先跑過 v94）
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert '設定頁不用上下滑' in t, 'v94 first'
assert 'max="9999-12-31"' not in t, 'already'
A = """(x.type==='number'?' inputmode="numeric" min="5" max="99" step="1"':'')"""
t = one(t, A, A + """+(x.type==='date'?' max="9999-12-31"':'')/* Chrome 的日期欄照最大年份留寬度，沒設會留 6 位數，欄位窄時日曆圖示被切掉 */""")
open(SRC, 'w', encoding='utf-8').write(t)
print('patched v95')

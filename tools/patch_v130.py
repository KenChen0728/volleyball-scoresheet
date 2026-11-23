#!/usr/bin/env python3
"""11/23 版本號改成「年.月.日.當天第幾版」（app-checkup 的新規定）。先跑 patch_v129。
- 畫面上寫 2026.11.23.1（測試版寫「測試版 2026.11.23.1」），由 tools/build.py、tools/beta-from-src.py 用 tools/vernum.py 產生
- 偵測新版改看 version.json 的 ver；舊手機（11/23 以前的程式）只認 build（MMDD-HHMM），所以 version.json 兩個都寫，舊手機照樣會跳更新"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'v.ver===' in s or "typeof v.ver==='string'" in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""var b=v&&typeof v.build==='string'&&/^\\d{4}-\\d{4}$/.test(v.build)?v.build:'';if(!b)return;""",
"""var b=v&&typeof v.ver==='string'&&/^\\d{4}\\.\\d{2}\\.\\d{2}\\.\\d+$/.test(v.ver)?v.ver:'';if(!b)return; // 11/23 起看 ver（年.月.日.第幾版），build 留給舊手機""")
# 舊程式按更新時記的是舊寫法，換到新寫法的第一次重新載入算更新成功
one("if(updTry){if(updTry===BUILD_ID)upd.done=updTry;else upd.retry=updTry}","if(updTry){if(updTry===BUILD_ID||/^\\d{4}-\\d{4}$/.test(updTry))upd.done=BUILD_ID;else upd.retry=updTry}")
open(SRC,'w',encoding='utf8').write(s)
print('v130 ok')

#!/usr/bin/env python3
"""由 index.html（第一批正式版的建置）產生預覽版 next/index.html：給使用者在正式上線前用手機看一遍。
資料另外存（nanshe-scoresheet-next），不碰正式版的比賽；不安裝、不離線；標題和版本號寫「預覽版」。"""
import re, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(R, 'index.html'), encoding='utf8').read()


def one(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)


one("'nanshe-scoresheet-v1'", "'nanshe-scoresheet-next'")
s = re.sub(r"<script>if\('serviceWorker'.*?</script>\n?", "", s, flags=re.S)
one('<link rel="manifest" href="manifest.webmanifest">\n', '')
s = s.replace('href="icons/', 'href="../icons/')
s = s.replace('href="../icons/icon2-180.png"', 'href="../icons/beta-180.png"').replace('href="../icons/icon2-192.png"', 'href="../icons/beta-192.png"')
one('<title>排球電子記錄表</title>', '<title>排球電子記錄表（預覽版）</title>')
s = re.sub(r"var BUILD='([^']*)';", lambda m: "var BUILD='預覽版 " + m.group(1) + "';", s, count=1)
os.makedirs(os.path.join(R, 'next'), exist_ok=True)
open(os.path.join(R, 'next', 'index.html'), 'w', encoding='utf8').write(s)
open(os.path.join(R, 'next', 'version.json'), 'w', encoding='utf8').write('{"build":"' + re.search(r"var BUILD='[^0-9']*([0-9]{4}-[0-9]{4})';", s).group(1) + '"}\n')
print('next ok', len(s) // 1024, 'KB')

#!/usr/bin/env python3
"""由 school/index.html 產生學校版測試版 school/beta/index.html：資料另外存（vb-school-beta），不安裝、不離線，
說明圖用上一層的 school/help。先跑 derive.py。正式上線時不用這個檔。"""
import os, re
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
s = open(R + '/school/index.html', encoding='utf8').read()


def one(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)


one("var KEY='vb-school-v2';", "var KEY='vb-school-beta';")
s, k = re.subn(r"<script>if\('serviceWorker'.*?</script>\n?", '', s, flags=re.S)
assert k == 1
one('<link rel="manifest" href="manifest.webmanifest">\n', '')
s = s.replace('href="icons/', 'href="../icons/')
one("var src='help/'+x.img+'.webp'", "var src='../help/'+x.img+'.webp'")
s, k = re.subn(r'<title>([^<]*)</title>', lambda m: '<title>' + m.group(1) + '（測試版）</title>', s, count=1)
assert k == 1
s, k = re.subn(r"var BUILD='([^']*)';", lambda m: "var BUILD='測試版 " + m.group(1) + "';", s, count=1)
assert k == 1
build = re.search(r"var BUILD='測試版 ([0-9]{4}-[0-9]{4})';", s).group(1)
os.makedirs(R + '/school/beta', exist_ok=True)
open(R + '/school/beta/index.html', 'w', encoding='utf8').write(s)
open(R + '/school/beta/version.json', 'w', encoding='utf8').write('{"build":"%s"}\n' % build)
print('school beta ok', build, len(s) // 1024, 'KB')

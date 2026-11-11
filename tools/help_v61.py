#!/usr/bin/env python3
"""11/11 說明圖「修改內容」換成新的判罰職員按鈕（執行教練 C、教練 AC、領隊 T、管理 M）。
完整版的圖包在原始檔裡（560 寬 webp）；學校版的圖放 school/help（640 寬 webp），測試版也讀這個資料夾，所以正式上線時才換。
用法：python3 tools/help_v61.py <完整版 fix2.png> [學校版 fix2.png]（截圖用 tools/help1111c.js 產生）"""
import base64, io, json, os, sys
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def webp(path, width, q):
    i = Image.open(path).convert('RGB')
    if i.width > width:
        i = i.resize((width, int(i.height * width / i.width)), Image.LANCZOS)
    b = io.BytesIO()
    i.save(b, 'WEBP', quality=q, method=6)
    return b.getvalue()


s = open(SRC, encoding='utf8').read()
i = s.index('var HELP_IMG=')
j = s.index(';\n', i)
imgs = json.loads(s[i + len('var HELP_IMG='):j])
assert 'fix2' in imgs
imgs['fix2'] = 'data:image/webp;base64,' + base64.b64encode(webp(sys.argv[1], 560, 60)).decode()
s = s[:i] + 'var HELP_IMG=' + json.dumps(imgs) + s[j:]
open(SRC, 'w', encoding='utf8').write(s)
print('full fix2', len(imgs['fix2']) * 3 // 4 // 1024, 'KB')
if len(sys.argv) > 2:
    o = R + '/school/help/fix2.webp'
    assert os.path.exists(o)
    open(o, 'wb').write(webp(sys.argv[2], 640, 62))
    print('school fix2', os.path.getsize(o) // 1024, 'KB')

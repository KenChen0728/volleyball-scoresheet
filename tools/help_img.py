#!/usr/bin/env python3
"""換或新增一張說明圖（11/11 起用這支，不用每次寫新的）。
完整版：包進原始檔的 HELP_IMG（560 寬 webp），要再跑 build.py。
學校版：存成 school/help/<key>.webp（640 寬 webp），要再跑 school/derive.py。
注意：學校版測試版也讀 school/help，換掉「已經有的圖」會讓正式版先看到新圖，那種要等上線才換；新的檔名不受影響。
用法：python3 tools/help_img.py <key> <完整版截圖.png> [學校版截圖.png]（完整版那張可以寫 - 跳過）"""
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


key = sys.argv[1]
if sys.argv[2] != '-':
    s = open(SRC, encoding='utf8').read()
    i = s.index('var HELP_IMG=')
    j = s.index(';\n', i)
    imgs = json.loads(s[i + len('var HELP_IMG='):j])
    new = key not in imgs
    imgs[key] = 'data:image/webp;base64,' + base64.b64encode(webp(sys.argv[2], 560, 60)).decode()
    s = s[:i] + 'var HELP_IMG=' + json.dumps(imgs) + s[j:]
    open(SRC, 'w', encoding='utf8').write(s)
    print('full', key, '新增' if new else '換掉', len(imgs[key]) * 3 // 4 // 1024, 'KB')
if len(sys.argv) > 3:
    o = R + '/school/help/' + key + '.webp'
    new = not os.path.exists(o)
    open(o, 'wb').write(webp(sys.argv[3], 640, 62))
    print('school', key, '新增' if new else '換掉', os.path.getsize(o) // 1024, 'KB')

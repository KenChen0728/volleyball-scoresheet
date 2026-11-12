#!/usr/bin/env python3
"""11/13 把 help1113.js 截好的圖一次換進完整版原始檔的 HELP_IMG（560 寬 webp），再刪掉說明卡片沒用到的圖。
用法：python3 tools/help1113_import.py [截圖資料夾，預設 /tmp/help1113]；換完要再跑 python3 tools/build.py
安裝示意圖（ins_*）沒有重截，照舊。"""
import base64, io, json, os, sys
from PIL import Image
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
D = sys.argv[1] if len(sys.argv) > 1 else '/tmp/help1113'
FROM = {'loupe': 'loupe2'}  # 說明卡片的圖 ← 截圖檔名（不一樣的才寫）


def webp(path, width=560, q=60):
    i = Image.open(path).convert('RGB')
    if i.width > width:
        i = i.resize((width, int(i.height * width / i.width)), Image.LANCZOS)
    b = io.BytesIO()
    i.save(b, 'WEBP', quality=q, method=6)
    return b.getvalue()


s = open(SRC, encoding='utf8').read()
i = s.index('var HELP=')
j = s.index(';\n', i)
need = {c['img'] for g in json.loads(s[i + len('var HELP='):j]) for c in g['cards']}
i = s.index('var HELP_IMG=')
j = s.index(';\n', i)
imgs = json.loads(s[i + len('var HELP_IMG='):j])
miss, n = [], 0
for k in sorted(need):
    if k.startswith('ins_'):
        continue
    f = os.path.join(D, FROM.get(k, k) + '.png')
    if not os.path.exists(f):
        miss.append(k)
        continue
    imgs[k] = 'data:image/webp;base64,' + base64.b64encode(webp(f)).decode()
    n += 1
gone = sorted(k for k in imgs if k not in need)
for k in gone:
    del imgs[k]
lost = sorted(k for k in need if k not in imgs)
s = s[:i] + 'var HELP_IMG=' + json.dumps(imgs) + s[j:]
open(SRC, 'w', encoding='utf8').write(s)
print('換了', n, '張；沒有截圖', miss, '；刪掉沒用到的', gone, '；還缺', lost, '；全部', sum(len(v) for v in imgs.values()) * 3 // 4 // 1024, 'KB')

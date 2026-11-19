#!/usr/bin/env python3
"""把 help1120.js 截好的 png 轉成 560 寬的 webp，存到 tools/help1120/（patch_v116.py 會包進使用說明）。
用法：python3 tools/help1120_webp.py [截圖資料夾，預設 /tmp/help1120]"""
import io, os, sys, glob
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else '/tmp/help1120'
O = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'help1120')
os.makedirs(O, exist_ok=True)
for f in sorted(glob.glob(os.path.join(D, '*.png'))):
    n = os.path.basename(f)[:-4]
    if n.startswith('_'):
        continue
    i = Image.open(f).convert('RGB')
    if i.width > 560:
        i = i.resize((560, int(i.height * 560 / i.width)), Image.LANCZOS)
    i.save(os.path.join(O, n + '.webp'), 'WEBP', quality=60, method=6)
    print(n, os.path.getsize(os.path.join(O, n + '.webp')) // 1024, 'KB')

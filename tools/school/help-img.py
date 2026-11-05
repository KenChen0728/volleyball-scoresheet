#!/usr/bin/env python3
"""把截圖轉成 school/help/*.webp：python3 tools/school/help-img.py /tmp/school-help"""
import glob, json, os, sys
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/school-help'
H = json.load(open(R + '/tools/school/help.json', encoding='utf8'))
need = {c['img'] for g in H for c in g['cards']}
os.makedirs(R + '/school/help', exist_ok=True)
for f in glob.glob(R + '/school/help/*.webp'):
    os.remove(f)
tot = 0
miss = []
for n in sorted(need):
    f = '%s/%s.png' % (src, n)
    if not os.path.exists(f):
        miss.append(n)
        continue
    i = Image.open(f).convert('RGB')
    if i.width > 640:
        i = i.resize((640, int(i.height * 640 / i.width)), Image.LANCZOS)
    o = '%s/school/help/%s.webp' % (R, n)
    i.save(o, 'WEBP', quality=62, method=6)
    tot += os.path.getsize(o)
print(len(need) - len(miss), 'imgs', tot // 1024, 'KB', 'missing', miss)

#!/usr/bin/env python3
"""把標題字轉成 SVG 外框，存成 lettering.json，網頁和圖示都用這份，不用帶字型檔。

字型：Graduate（Eduardo Tunni，SIL Open Font License 1.1），美國校隊球衣常見的方角粗襯線字。
只有要改標題文字時才需要重跑：
    git clone --depth 1 --filter=blob:none --sparse https://github.com/google/fonts /tmp/gf
    git -C /tmp/gf sparse-checkout set ofl/graduate
    python3 tools/school/lettering.py /tmp/gf/ofl/graduate/Graduate-Regular.ttf
"""
import json, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

D = os.path.dirname(os.path.abspath(__file__)) + '/'
f = TTFont(sys.argv[1])
gs = f.getGlyphSet()
cmap = f.getBestCmap()
upm = f['head'].unitsPerEm
cap = f['OS/2'].sCapHeight or 700


def outline(text, track=0):
    """回傳 (path, 寬, 高)，字高縮放成 100，Y 軸往下"""
    k = 100 / cap
    x = 0
    d = []
    for ch in text:
        g = gs[cmap[ord(ch)]]
        pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
        g.draw(TransformPen(pen, (k, 0, 0, -k, x, 100)))
        if ch != ' ':
            d.append(pen.getCommands())
        x += g.width * k + track
    return ' '.join(d), round(x - track, 1)


out = {}
for key, text, track in [('score', 'SCORE SHEET', 0), ('volley', 'VOLLEYBALL', 0), ('vb', 'VB', 0)]:
    p, w = outline(text, track)
    out[key] = {'d': p, 'w': w, 'h': 100}
json.dump(out, open(D + 'lettering.json', 'w'), separators=(',', ':'))
print({k: (v['w'], len(v['d'])) for k, v in out.items()})

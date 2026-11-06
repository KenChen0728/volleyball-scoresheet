# 從協會三局制記錄表 PDF 取出線條和文字位置，產生精簡的樣板資料
# 用法：python3 tools/ct/extract.py 三局制記錄表.pdf t3.json（PDF 從中華民國排球協會網站下載，不放進 repo）
import pdfplumber, json, sys, collections
src = sys.argv[1]; out = sys.argv[2]
pg = pdfplumber.open(src).pages[0]
W, H = pg.width, pg.height

# ---- 線：細長的黑色填色矩形 → 線段 ----
segs = []
for r in pg.rects:
    x0, x1, t, b = r['x0'], r['x1'], r['top'], r['bottom']
    w, h = x1 - x0, b - t
    col = r.get('non_stroking_color')
    if r.get('fill') and str(col) in ('0.0', '0', '(0,)', '[0]') or (r.get('fill') and col in (0, 0.0, [0], (0,), [0.0], (0.0,))):
        if h <= w and h < 3:   # 橫線
            segs.append(('h', round((t + b) / 2, 2), round(x0, 2), round(x1, 2), round(h, 2)))
        elif w < 3:            # 直線
            segs.append(('v', round((x0 + x1) / 2, 2), round(t, 2), round(b, 2), round(w, 2)))
        else:
            segs.append(('box', x0, t, x1, b))
boxes = [(round(r['x0'], 2), round(r['top'], 2), round(r['x1'], 2), round(r['bottom'], 2)) for r in pg.rects if r.get('stroke') and not r.get('fill')]
dashes = [(round(l['x0'], 2), round(l['top'], 2), round(l['x1'], 2), round(l['bottom'], 2)) for l in pg.lines]

# 合併同一條線上相連的線段
def merge(kind):
    by = collections.defaultdict(list)
    for s in segs:
        if s[0] == kind:
            by[(s[1], s[4])].append((s[2], s[3]))
    res = []
    for (pos, wd), arr in by.items():
        arr.sort()
        cur = list(arr[0])
        for a, b in arr[1:]:
            if a <= cur[1] + 0.6:
                cur[1] = max(cur[1], b)
            else:
                res.append((pos, cur[0], cur[1], wd)); cur = [a, b]
        res.append((pos, cur[0], cur[1], wd))
    return res
hs = merge('h'); vs = merge('v')

# ---- 字：同一行、同字型、緊鄰的字併成一段 ----
FONT = {}
def fid(name):
    n = name.split('+')[-1]
    if 'MingLiU' in n: k = 'ming'
    elif 'KaiShu' in n: k = 'kai'
    elif 'TimesNewRomanPS-Bold' in n: k = 'timesb'
    elif 'TimesNewRoman' in n: k = 'times'
    elif 'JhengHeiBold' in n: k = 'heib'
    elif 'Arial-Bold' in n: k = 'arialb'
    elif 'Arial' in n: k = 'arial'
    elif 'Verdana-Bold' in n: k = 'verdanab'
    else: k = 'other:' + n
    return k
chars = sorted(pg.chars, key=lambda c: (round(c['bottom'], 1), c['x0']))
runs = []
for c in chars:
    f = fid(c['fontname']); sz = round(c['size'], 2)
    if runs:
        r = runs[-1]
        gap = c['x0'] - r['x1']
        if r['f'] == f and r['sz'] == sz and abs(r['bottom'] - c['bottom']) < 0.6 and -0.5 < gap < sz * 0.35 and c['text'].strip():
            r['t'] += c['text']; r['x1'] = c['x1']; continue
    if not c['text'].strip():
        continue
    runs.append({'t': c['text'], 'f': f, 'sz': sz, 'x0': c['x0'], 'x1': c['x1'], 'top': c['top'], 'bottom': c['bottom'], 'up': c.get('upright', True)})
img = [(round(i['x0'], 1), round(i['top'], 1), round(i['x1'], 1), round(i['bottom'], 1)) for i in pg.images]
json.dump({'W': W, 'H': H, 'hs': hs, 'vs': vs, 'boxes': boxes, 'dashes': dashes, 'runs': runs, 'img': img}, open(out, 'w'), ensure_ascii=False)
print('W', W, 'H', H, 'h', len(hs), 'v', len(vs), 'boxes', len(boxes), 'dashes', len(dashes), 'runs', len(runs), 'img', img)
print('fonts', collections.Counter(r['f'] for r in runs))
print('widths', collections.Counter(round(x[3], 2) for x in hs + vs).most_common(6))

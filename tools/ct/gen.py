# 由協會三局制記錄表 PDF 的線條與文字，產生 App 用的樣板 (CT3) 與填資料的座標 (CTG)
# 用法：python3 tools/ct/gen.py t3.json ct3.js，再把 ct3.js 的內容換掉原始檔「存成圖片／PDF」前面那段 var CT3、var CTG
import json, sys
d = json.load(open(sys.argv[1])); out = sys.argv[2]
R = lambda v: round(v, 1)
runs = d['runs']

def find(text, x0=0, y0=0, x1=9999, y1=9999):
    a = [r for r in runs if r['t'] == text and r['x0'] >= x0 - .5 and r['x1'] <= x1 + .5 and r['top'] >= y0 - .5 and r['bottom'] <= y1 + .5]
    a.sort(key=lambda r: (r['top'], r['x0']))
    return a
def one(text, *box):
    a = find(text, *box)
    assert a, ('not found', text, box)
    return a[0]
def ctr(r): return [R((r['x0'] + r['x1']) / 2), R((r['top'] + r['bottom']) / 2)]
def vx(x0, x1, y0, y1):
    return sorted(set(round(x, 2) for x, a, b, w in d['vs'] if x0 - 1 <= x <= x1 + 1 and a < y1 - 1 and b > y0 + 1))

# ---------- 樣板 ----------
FONTS = ['ming', 'kai', 'timesb', 'heib', 'verdanab', 'arialb', 'times']
T = []
for r in runs:
    if r['f'] not in FONTS: continue
    T.append([R(r['x0']), R((r['top'] + r['bottom']) / 2), R(r['x1'] - r['x0']), round(r['sz'], 2), FONTS.index(r['f']), r['t']])
HL = [[R(y), R(a), R(b), w] for y, a, b, w in d['hs']]
VL = [[R(x), R(a), R(b), w] for x, a, b, w in d['vs']]
BX = [[R(a), R(b), R(c), R(e)] for a, b, c, e in d['boxes']]
DS = [[R(a), R(b), R(c)] for a, b, c, e in d['dashes']]

# ---------- 座標 ----------
G = {}
# 標題列
nm = one('比賽名稱：'); city = one('承辦城市：'); plc = one('地點：'); crt = one('場地：', 1000, 50, 1090, 72); di = one('第', 1070, 50, 1095, 72); cd = one('場地', 1100, 50, 1145, 72)
grp = one('組別：'); gm = one('場次：'); male = one('男子組'); fem = one('女子組')
dt = one('日期：'); sl = find('/', 900, 75, 1000, 100); tm = one('時間:'); tc = one(':', 1090, 75, 1115, 100)
circ = find('○', 400, 75, 800, 100)
G['head'] = {
    'name': [R(nm['x1'] + 2), R(city['x0'] - 10), R((nm['top'] + nm['bottom']) / 2)],
    'city': [R(city['x1'] + 2), R(plc['x0'] - 10), R((city['top'] + city['bottom']) / 2)],
    'place': [R(plc['x1'] + 2), R(crt['x0'] - 8), R((plc['top'] + plc['bottom']) / 2)],
    'court': [R(di['x1'] + 1), R(cd['x0'] - 1), R((di['top'] + di['bottom']) / 2)],
    'group': [R(grp['x1'] + 1), R(gm['x0'] - 2), R((grp['top'] + grp['bottom']) / 2)],
    'game': [R(gm['x1'] + 1), R(male['x0'] - 2), R((gm['top'] + gm['bottom']) / 2)],
    'male': BX[0] if BX[0][0] < 300 else BX[1], 'female': BX[1] if BX[0][0] < 300 else BX[0],
    'ca': ctr(circ[0]) + [R((circ[0]['x1'] - circ[0]['x0']) / 2)], 'cb': ctr(circ[1]) + [R((circ[1]['x1'] - circ[1]['x0']) / 2)],
    'ta': [R(circ[0]['x1'] + 16), R(one('隊', 570, 70, 600, 90)['x0'] - 3), R((circ[0]['top'] + circ[0]['bottom']) / 2 + 1)],
    'tb': [R(one('VS')['x1'] + 8), R(circ[1]['x0'] - 3), R((circ[1]['top'] + circ[1]['bottom']) / 2 + 1)],
    'y': [R(dt['x1']), R(sl[0]['x0']), R((dt['top'] + dt['bottom']) / 2)], 'm': [R(sl[0]['x1']), R(sl[1]['x0'])], 'd': [R(sl[1]['x1']), R(tm['x0'] - 6)],
    'hh': [R(tm['x1']), R(tc['x0'])], 'mm': [R(tc['x1']), 1141.0], 'ty': R((tm['top'] + tm['bottom']) / 2),
}

def rows_of(x0, x1, y0, y1):
    # 同一高度的線段先接起來（表格線常在欄界斷開 1pt）
    by = {}
    for y, a, b, w in d['hs']:
        if y0 - 2 <= y <= y1 + 2: by.setdefault(round(y, 1), []).append((a, b))
    ys = []
    for y, arr in by.items():
        arr.sort(); cur = list(arr[0]); ok = False
        for a, b in arr[1:]:
            if a <= cur[1] + 2.5: cur[1] = max(cur[1], b)
            else:
                if cur[0] <= x0 + 3 and cur[1] >= x1 - 3: ok = True
                cur = [a, b]
        if cur[0] <= x0 + 3 and cur[1] >= x1 - 3: ok = True
        if ok: ys.append(y)
    ys = sorted(ys)
    # 相差不到 1.5pt 的雙線只留一條
    out = []
    for y in ys:
        if out and y - out[-1] < 1.5: continue
        out.append(y)
    return out

def block(x0, x1, y0, y1, side, time=None, chg=False):
    """x0..x1 為一隊的六欄；回傳欄、列、表頭各項位置"""
    ys = rows_of(x0, x1, y0, y1)
    rot_y = (ys[6] + ys[7]) / 2
    cols = vx(x0, x1, ys[1] + 2, ys[2] - 2)          # 「一」那列的直線
    rcols = vx(x0, x1, ys[6] + 2, ys[7] - 2)         # 發球輪轉列的直線（含中線）
    hy0, hy1 = ys[0], ys[1]
    b = {'cols': [R(c) for c in cols], 'rcols': [R(c) for c in rcols], 'rows': [R(y) for y in ys]}
    team = one('隊伍', x0, hy0, x1, hy1)
    big = [r for r in find('○', x0, hy0, x1 + 2, hy1) if r['sz'] >= 17]
    fa = [r for r in find('○', x0, hy0, x1 + 2, hy1) if r['sz'] < 13]
    cy = (hy0 + hy1) / 2
    if big:
        c = big[0]; b['circ'] = ctr(c) + [R((c['x1'] - c['x0']) / 2)]
        b['name'] = [R(team['x1'] + 2), R(c['x0'] - 1), R(cy)]
    if len(fa) >= 2:
        fa.sort(key=lambda r: r['top'])  # 上面那個是「發」、下面是「接」
        b['fa'] = ctr(fa[0]) + [R((fa[0]['x1'] - fa[0]['x0']) / 2)]
        b['jie'] = ctr(fa[1]) + [R((fa[1]['x1'] - fa[1]['x0']) / 2)]
    if time:
        lab = one(time, x0 - 2, hy0, x1 + 70, hy1); col = one('：', lab['x1'], hy0, lab['x1'] + 30, hy1)
        right = [c for c in vx(x0 - 2, x1 + 70, hy0 + 2, hy1 - 2) if c > col['x1'] + 2][0]
        b['time'] = [R(col['x1'] + .5), R(right - 1.5), R(cy)]
    if chg:
        lab = one('換場分數', x0, hy0, x1 + 120, hy1); c = [r for r in find('○', lab['x1'], hy0, lab['x1'] + 60, hy1)][0]
        b['chg'] = ctr(c) + [R((c['x1'] - c['x0']) / 2)]
    return b

def pts(x0, x1, y0, y1, maxv):
    cells = {}
    for r in runs:
        if r['t'].isdigit() and x0 - 1 <= r['x0'] and r['x1'] <= x1 + 1 and y0 - 1 <= r['top'] and r['bottom'] <= y1 + 1 and 1 <= int(r['t']) <= maxv:
            v = int(r['t'])
            if v not in cells: cells[v] = ctr(r) + [round(r['sz'], 2)]
    assert len(cells) == maxv, (x0, x1, y0, y1, len(cells), sorted(cells))
    cols = [R(c) for c in vx(x0, x1, (y0 + y1) / 2 - 3, (y0 + y1) / 2 + 3)]
    to = sorted([ctr(r) for r in find('：', x0, y1, x1, y1 + 80)], key=lambda p: p[1])[:2]
    return {'cells': cells, 'cols': cols, 'to': to}

S = {}
# 第 1 局：左 A、右 B；第 2 局：左 B、右 A（表上印好的）
S['1'] = {'L': block(142.34, 342.86, 112.6, 310.2, 'L', time='開始'), 'R': block(391.85, 590.11, 112.6, 310.2, 'R', time='結束'),
          'PL': pts(342.86, 391.85, 136.7, 252.3, 48), 'PR': pts(590.11, 637.63, 136.7, 252.3, 48)}
S['2'] = {'L': block(662.11, 864.1, 109.8, 311.4, 'L', time='開始'), 'R': block(913.66, 1113.84, 109.8, 311.4, 'R', time='結束'),
          'PL': pts(864.1, 913.66, 133.9, 252.2, 48), 'PR': pts(1113.84, 1161.72, 133.9, 252.2, 48)}
S['3'] = {'B1': block(135.02, 354.89, 324.1, 531.2, 'L', time='開始'), 'B2': block(396.29, 593.59, 324.1, 531.2, 'R', time='結束'),
          'B3': block(666.07, 871.66, 324.1, 531.2, 'L', chg=True),
          'P1': pts(354.89, 396.29, 351.0, 464.8, 8), 'P2': pts(593.59, 641.23, 351.0, 464.8, 48), 'P3': pts(871.66, 927.1, 351.0, 464.8, 48)}
G['sets'] = S
G['setBox'] = {'1': [32.9, 112.6, 637.6, 310.2], '2': [639.4, 109.8, 1161.7, 311.4], '3': [33.2, 324.1, 927.1, 531.2]}

# 制裁
san_cols = [34.56, 64.68, 94.8, 131.18, 167.66, 192.14, 219.14, 259.94]
san_rows = [594.58, 612.22, 637.18, 655.9, 674.38, 692.86, 711.34, 729.82, 748.42, 764.52, 780.6]
ir = find('○', 195, 553, 260, 571)
G['san'] = {'cols': san_cols, 'rows': san_rows, 'ir': [ctr(r) + [R((r['x1'] - r['x0']) / 2)] for r in ir], 'box': [34.56, 540.55, 259.94, 780.6]}
# 記事欄：第一行在「記事欄」右邊，另外兩行整行
G['notes'] = {'lines': [[332.0, 617.5, 555.55], [274.0, 617.5, 582.6], [274.0, 617.5, 603.4]], 'box': [271.7, 540.55, 619.39, 612.22]}
# 證明
lj1 = one('1', 380, 729, 412, 749); lj2 = one('2', 474, 729, 500, 749)
G['proof'] = {'name': [345.5, 473.5], 'rows': [[655.9, 674.38], [674.38, 692.86], [692.86, 711.34], [711.34, 729.82]],
              'lj1': [274.0, R(lj1['x0'] - 3), R((729.82 + 748.42) / 2)], 'lj2': [R(lj2['x1'] + 3), 617.0, R((729.82 + 748.42) / 2)],
              'box': [271.7, 612.22, 619.39, 780.6]}
# 比賽成績
G['res'] = {'cols': [631.15, 650.11, 674.23, 697.75, 730.51, 804.91, 839.26, 863.5, 883.42, 904.42],
            'rows': [637.18, 655.9, 674.38, 692.86, 729.82], 'team': [570.55, 612.22], 'mid': 767.59,
            'times': [729.82, 764.52, 722.11, 813.07], 'win': [764.52, 791.04], 'box': [631.15, 540.55, 904.42, 791.04]}
for k, t in [('ca', 'A'), ('cb', 'B')]:
    pass
ra = find('隊伍', 631, 570, 905, 612); G['res']['tl'] = [R(ra[0]['x1'] + 3)]; G['res']['tr'] = [R(ra[-1]['x0'] - 3)]
rc = [r for r in find('○', 631, 570, 905, 612)] or []
# 每局時間欄的「1（ ）」位置
G['res']['paren'] = []
for n in ['1', '2', '3']:
    a = find('（', 730, 637, 805, 693); b = find('）', 730, 637, 805, 693)
G['res']['paren'] = [[R(x['x1']), R(y['x0']), R((x['top'] + x['bottom']) / 2)] for x, y in zip(sorted(find('（', 730, 630, 805, 730), key=lambda r: r['top']), sorted(find('）', 730, 630, 805, 730), key=lambda r: r['top']))]
hs_ = sorted(find('時', 631, 729, 905, 765), key=lambda r: r['x0']); ms_ = sorted(find('分', 631, 729, 905, 765), key=lambda r: r['x0'])
G['res']['hm'] = [[R(h['x0']), R(m['x0']), R((h['top'] + h['bottom']) / 2)] for h, m in zip(hs_, ms_)]
G['res']['labs'] = [R(one('開始', 631, 729, 725, 765)['x1']), R(one('結束', 722, 729, 815, 765)['x1']), 813.07]
w2 = one('2：', 631, 764, 905, 792) if find('2：', 631, 764, 905, 792) else None
wd = one('勝', 631, 764, 700, 792)
wq = one('隊：', 650, 764, 700, 792); wc = one('：', 820, 764, 860, 792)
G['res']['winner'] = [R(wq['x1'] + 4), R(wc['x0'] - 22), R((764.52 + 791.04) / 2), R(wc['x1'] + 2)]
oc = sorted([r for r in find('○', 700, 570, 820, 612)], key=lambda r: r['x0'])
G['res']['ca'] = [R(oc[0]['x0'] - 2)]; G['res']['cb'] = [R(oc[1]['x1'] + 2)]
# 名單
G['roster'] = {'rows': [370.13, 389.57, 409.01, 428.47, 448.03, 467.47, 486.91, 506.35, 525.79, 545.23, 564.67, 584.14, 603.58],
               'cols': [928.9, 955.9, 1045.9, 1072.92, 1162.92], 'lrows': [623.14, 639.34, 655.66],
               'staff': [675.1, 694.9, 714.7, 734.5, 754.2], 'scols': [928.9, 1009.9, 1072.92, 1162.92],
               'ca': ctr(one('○', 925, 320, 955, 347)) + [9.0], 'cb': ctr(one('○', 1130, 320, 1160, 347)) + [9.0],
               'ta': [962.0, 1027.5], 'tb': [1056.0, 1117.0], 'ty': R((320.45 + 346.25) / 2), 'box': [928.9, 320.45, 1162.92, 824.28]}
# 頁尾：裁判委員
jw = one('：', 100, 791, 300, 825) if find('：', 100, 791, 300, 825) else None
sig = find('簽章', 300, 791, 480, 825)
G['foot'] = {'del': [R((jw['x1'] if jw else 190) + 4), R((sig[0]['x0'] if sig else 410) - 8), R((791.04 + 824.28) / 2)]}

# ---------- 使用者要求的版面調整（11/7）：原表這幾處沒對齊，照使用者要的置中、對齊 ----------
# 1. 組別那一列：場次、男子組、女子組和兩個框框，跟「組別：」一樣垂直置中（框框都改成 18×18）
rowc = R((grp['top'] + grp['bottom']) / 2)
for t in T:
    if t[5] in ('場次：', '男子組', '女子組') and abs(t[1] - (gm['top'] + gm['bottom']) / 2) < .6: t[1] = rowc
for b in BX:
    if 70 < b[1] < 80: b[1] = R(rowc - 9); b[3] = R(rowc + 9)
G['head']['game'][2] = rowc
# 2. 各局左邊的「第 N 局」在那一欄垂直置中
for t0 in [t for t in T if t[5] == '第' and t[4] == 0 and abs(t[3] - 14.04) < .1]:
    grpT = [t for t in T if t[4] == 0 and abs(t[0] - t0[0]) < .5 and abs(t[3] - 14.04) < .1 and t0[1] - 1 <= t[1] <= t0[1] + 45 and t[5] in ('第', '１', '２', '３', '局')]
    if not any(t[5] == '局' for t in grpT): continue
    cx = t0[0] + t0[2] / 2; top = t0[1] - t0[3] / 2; bot = max(t[1] for t in grpT) + t0[3] / 2
    up = max(y for y, a, b, w in d['hs'] if a <= cx <= b and y < top); dn = min(y for y, a, b, w in d['hs'] if a <= cx <= b and y > bot)
    dy = (up + dn) / 2 - (top + bot) / 2
    for t in grpT: t[1] = R(t[1] + dy)
    print('第N局 置中', [t[5] for t in grpT], 'dy', round(dy, 2))
# 3. 「A or B」三行左邊對齊（名單右上那組的 B 原本偏右）
for o in [t for t in T if t[5] == 'or']:
    for t in T:
        if t[5] in ('A', 'B') and abs(t[3] - o[3]) < .1 and 0 < abs(t[0] - o[0]) < 4 and abs(t[1] - o[1]) < 12: print('A or B 對齊', t[5], t[0], '->', o[0]); t[0] = o[0]

# 4. 名單表頭：以「球隊」為中心左右對稱。「球隊」放在左右邊線正中間（也是下面名單表格的中線），右邊的 A or B、圓圈、隊名位置照左邊鏡射
rb = G['roster']['box']; C = R((rb[0] + rb[2]) / 2)
qd = [t for t in T if t[5] == '球隊' and 320 < t[1] < 345][0]; qd[0] = R(C - qd[2] / 2)
cir = sorted([t for t in T if t[5] == '○' and 320 < t[1] < 345 and t[0] > 900], key=lambda t: t[0])
lcx = cir[0][0] + cir[0][2] / 2; cir[1][0] = R(2 * C - lcx - cir[1][2] / 2)
stk = [t for t in T if t[5] in ('A', 'or', 'B') and abs(t[3] - 6.96) < .1 and 318 < t[1] < 346 and t[0] > 900]
lx = min(t[0] for t in stk); orw = [t for t in stk if t[5] == 'or'][0][2]; rx = R(2 * C - (lx + orw / 2) - orw / 2)
for t in stk:
    if t[0] > C: t[0] = rx
G['roster']['cb'][0] = R(2 * C - lcx)
gap = 2.5; G['roster']['ta'] = [G['roster']['ta'][0], R(qd[0] - gap)]; G['roster']['tb'] = [R(qd[0] + qd[2] + gap), R(2 * C - G['roster']['ta'][0])]
print('名單表頭對稱', 'C', C, '球隊 x0', qd[0], '右圓', G['roster']['cb'][0], '右 A or B x0', rx, 'ta', G['roster']['ta'], 'tb', G['roster']['tb'])

tpl = {'W': d['W'], 'H': d['H'], 'h': HL, 'v': VL, 'b': BX, 'd': DS, 't': T}
js = 'var CT3=' + json.dumps(tpl, ensure_ascii=False, separators=(',', ':')) + ';\nvar CTG=' + json.dumps(G, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(out, 'w', encoding='utf8').write(js)
print('bytes', len(js.encode()), 'texts', len(T), 'h', len(HL), 'v', len(VL))
print(json.dumps(G['head'], ensure_ascii=False))
for k in ['1', '2', '3']:
    for bk, bv in S[k].items():
        if 'cells' in bv: print(k, bk, 'cols', bv['cols'], 'to', bv['to'], 'n', len(bv['cells']))
        else: print(k, bk, {kk: vv for kk, vv in bv.items() if kk not in ('cols', 'rcols')}, len(bv['cols']), len(bv['rcols']))
print('res', json.dumps({k: v for k, v in G['res'].items() if k in ('tl', 'tr', 'paren', 'hm', 'labs', 'winner')}))
print('proof', G['proof']['lj1'], G['proof']['lj2'], 'foot', G['foot'], 'san ir', G['san']['ir'], 'roster c', G['roster']['ca'], G['roster']['cb'])

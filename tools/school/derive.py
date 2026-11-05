#!/usr/bin/env python3
"""由完整版（根目錄 index.html）產生美國學校版 school/index.html。

完整版更新後重跑這支就能同步：
    python3 tools/school/derive.py
改動都寫在 tools/school/patches.txt，找不到要改的地方會直接停下來，不會默默產生壞掉的網頁。
"""
import hashlib, json, os, re, sys, time

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = R + '/tools/school/'


def patches():
    text = open(D + 'patches.txt', encoding='utf8').read()
    # 區塊開頭一定在行首，結尾 >>>> 也獨立一行
    for m in re.finditer(r'^<<<<(cut| \d+)?\n(.*?)\n?^====\n(.*?)\n?^>>>>$', text, re.S | re.M):
        yield m.group(1) or '', m.group(2), m.group(3)


def apply(s):
    n = 0
    for mode, old, new in patches():
        n += 1
        if mode == 'cut':
            a, b = old.split('\n----\n')
            assert s.count(a) == 1, ('cut 開頭', s.count(a), a[:70])
            i = s.index(a)
            assert b in s[i:], ('cut 結尾', b[:70])
            s = s[:i] + new + ('\n' if new else '') + s[s.index(b, i):]
        else:
            want = int(mode) if mode else 1
            got = s.count(old)
            assert got == want, ('次數不對', got, want, old[:90])
            s = s.replace(old, new)
    return s, n


def hero_mark():
    """主畫面標題：VOLLEYBALL 接兩條校隊色線，下面 SCORE SHEET。字形見 lettering.py"""
    L = json.load(open(D + 'lettering.json'))
    W, k, top, gap = L['score']['w'], .5, 50, 22
    vw = L['volley']['w'] * k
    x = vw + 26
    h = top + gap + 104
    return ('<svg viewBox="-2 -2 %g %g" aria-hidden="true"><path transform="scale(%g)" fill="#FFD21F" d="%s"/>'
            '<rect x="%g" y="13" width="%g" height="13" fill="#FFD21F"/><rect x="%g" y="33" width="%g" height="5" fill="#FFD21F"/>'
            '<path transform="translate(0 %g)" fill="#fff" stroke="#fff" stroke-width="2.4" d="%s"/></svg>') % (
        W + 4, h, k, L['volley']['d'], x, W - x, x, W - x, top + gap, L['score']['d'])


def main():
    s = open(R + '/index.html', encoding='utf8').read()
    # 完整版把說明圖包在網頁裡，學校版改成獨立檔案，先拿掉再改
    s, k = re.subn(r'^var HELP_IMG=\{.*\};\n', '', s, count=1, flags=re.M)
    assert k == 1, 'HELP_IMG'
    help_txt = json.load(open(D + 'help.json', encoding='utf8'))
    s, k = re.subn(r'^var HELP=\[.*\];\n', lambda _: 'var HELP=' + json.dumps(help_txt, ensure_ascii=False, separators=(',', ':')) + ';\n', s, count=1, flags=re.M)
    assert k == 1, 'HELP'
    s, n = apply(s)
    s = s.replace('/*US-SHEET*/', open(D + 'sheet.js', encoding='utf8').read())
    s = s.replace('__HERO_MARK__', hero_mark())
    build = time.strftime('%m%d-%H%M')
    s, k = re.subn(r"var BUILD='[^']*';", "var BUILD='%s';" % build, s, count=1)
    assert k == 1, 'BUILD'
    css = open(D + 'extra.css', encoding='utf8').read()
    assert s.count('</style>') == 1
    s = s.replace('</style>', css + '</style>')
    # 不該留下的東西
    for bad in ['nanshe', '6 次替補', 'HELP_IMG', 'r6Svg', '二裁核對', '請告知二裁', 'data-act="serve"', 'data-act="replay"']:
        assert bad not in s, ('殘留', bad)
    for bad in [r'\[1,2,3\]\.(forEach|map)\(function\(n\)', r'===3\?15', r's\.sets\[3\]\.started']:
        assert not re.search(bad, s), ('殘留', bad)
    open(R + '/school/index.html', 'w', encoding='utf8').write(s)

    imgs = sorted('help/' + f for f in os.listdir(R + '/school/help') if f.endswith('.webp'))
    files = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'] + imgs
    ver = hashlib.sha1((s + ''.join(imgs)).encode()).hexdigest()[:8]
    w = open(D + 'sw.template.js', encoding='utf8').read().replace('__VER__', ver).replace('__FILES__', json.dumps(files))
    open(R + '/school/sw.js', 'w', encoding='utf8').write(w)
    print('patches', n, 'build', build, 'sw', ver, len(s) // 1024, 'KB', len(imgs), 'imgs')


if __name__ == '__main__':
    main()

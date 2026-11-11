#!/usr/bin/env python3
"""11/11 使用教學：勾選備份、帶不帶名單、匯入、有新版本、舊資料帶過去。
完整版的圖包在原始檔裡（560 寬 webp），學校版的圖放 school/help（640 寬 webp）。
用法：python3 tools/help_v60.py <完整版截圖資料夾> <學校版截圖資料夾>（截圖用 tools/help1111.js 產生）"""
import base64, io, json, os, sys
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
FULL, SCHOOL = sys.argv[1], sys.argv[2]
NEW = ['bksel', 'bkopt', 'bkimp', 'upd', 'ins_bk']


def webp(path, width, q):
    i = Image.open(path).convert('RGB')
    if i.width > width:
        i = i.resize((width, int(i.height * width / i.width)), Image.LANCZOS)
    b = io.BytesIO()
    i.save(b, 'WEBP', quality=q, method=6)
    return b.getvalue()


def edit(H, xp):
    g = {x['id']: x for x in H}
    card = lambda img, t, d: {'img': img, 't': t, 'd': d}
    # 第一次使用：有新版本時
    st = g['start']['cards']
    assert not any(c['img'] == 'upd' for c in st)
    st.append(card('upd', '有新版本時', '有網路時如果有新版本，上方會出現提示。按「更新」換成新版，比賽紀錄不會不見；按「稍後」先收起來，主畫面最下面也能更新。一局正在打的時候不會出現。'))
    # 紀錄與名單：勾選備份、帶不帶名單、匯入；「賽後先備份」移到比賽結束那組
    hs = g['history']['cards']
    bk = [c for c in hs if c['img'] == 'bk'][0]
    keep = [c for c in hs if c['img'] in ('hist1', 'cup1')]
    assert len(keep) == 2, [c['img'] for c in hs]
    g['history']['cards'] = keep + [
        card('bksel', '選要備份的比賽', '按「打完的比賽」旁的「選擇」，點比賽打勾，再點一次取消。要全部就按「全選」，選好按「備份」。進行中的比賽也列在這裡。'),
        card('bkopt', '要不要帶名單', '按「備份」後，可以勾要不要一起帶盃賽的全部隊伍名單' + ('和裁判名單' if xp else '') + '。每場比賽自己的兩隊名單' + ('和裁判' if xp else '') + '一定會帶。'),
        card('bkimp', '匯入', '到新裝置按「匯入備份或資料夾」，選備份檔。匯入前會先列出會改什麼，按「匯入」才會改。')]
    g['set3']['cards'].append(bk)
    # 舊資料怎麼帶過去
    for c in g['install2']['cards']:
        if c['img'] == 'ins_data':
            c['img'] = 'ins_bk'
            c['d'] = '瀏覽器和主畫面的資料是分開的。先在原本的地方到「紀錄與名單」按「選擇」、「全選」再按「備份」，到新的地方匯入。'
    used = {c['img'] for x in H for c in x['cards']}
    assert 'hist2' not in used and 'ins_data' not in used
    return used


# ---------- 完整版 ----------
s = open(SRC, encoding='utf8').read()
i = s.index('var HELP_IMG=')
j = s.index(';\n', i)
imgs = json.loads(s[i + len('var HELP_IMG='):j])
k = s.index('var HELP=', j)
l = s.index(';\n', k)
H = json.loads(s[k + len('var HELP='):l])
used = edit(H, True)
for n in NEW:
    imgs[n] = 'data:image/webp;base64,' + base64.b64encode(webp('%s/%s.png' % (FULL, n), 560, 60)).decode()
for n in list(imgs):
    if n not in used:
        del imgs[n]
miss = sorted(used - set(imgs))
assert not miss, miss
s = s[:i] + 'var HELP_IMG=' + json.dumps(imgs) + s[j:k] + 'var HELP=' + json.dumps(H, ensure_ascii=False) + s[l:]
open(SRC, 'w', encoding='utf8').write(s)
print('full', len(imgs), 'imgs')

# ---------- 學校版 ----------
P = R + '/tools/school/help.json'
H = json.load(open(P, encoding='utf8'))
used = edit(H, False)
json.dump(H, open(P, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
for n in NEW:
    open('%s/school/help/%s.webp' % (R, n), 'wb').write(webp('%s/%s.png' % (SCHOOL, n), 640, 62))
have = {f[:-5] for f in os.listdir(R + '/school/help') if f.endswith('.webp')}
miss = sorted(used - have)
assert not miss, miss
print('school unused', sorted(have - used))

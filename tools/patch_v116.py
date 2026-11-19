#!/usr/bin/env python3
"""11/20 使用說明補新功能（使用者 01:21：使用說明先補）：
- 第一次使用：首頁今天的賽程。
- 比賽資料：開始新比賽可以照賽程開始。
- 名單：名冊帶出姓名。
- 賽事資料夾整組重寫：新增資料夾、隊伍名冊、排賽程、照賽程開始、印登錄單、裁判名單、傳到另一台。
- 新的一組「分享和觀看」：分享比賽、觀看比賽、觀看裝置、接手記錄（第一批正式版沒有連線，patch_nosync.py 會拿掉這組）。
- 截圖：tools/help1120/*.webp（tools/help1120.js 截、help1120_webp.py 轉），換掉舊名稱、舊版面的圖；沒用到的圖刪掉。
先跑 patch_v97～v115。"""
import base64, glob, json, os, sys
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'help1120')
s = open(SRC, encoding='utf8').read()
if '"id": "share"' in s or '"id":"share"' in s:
    sys.exit('already patched')


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:80])
    s = s.replace(a, b)


i = s.index('var HELP=')
j = s.index(';\n', i)
H = json.loads(s[i + len('var HELP='):j])
G = {g['id']: g for g in H}


def card(img, t, d):
    return {'img': img, 't': t, 'd': d}


def find(g, img):
    for k, c in enumerate(G[g]['cards']):
        if c['img'] == img:
            return k
    raise KeyError(g + '/' + img)


# 第一次使用
G['start']['cards'][find('start', 'home')]['d'] = '按「開始新比賽」，先選要放進哪個盃賽資料夾，再照步驟往下走。比賽當天，首頁下面會列出今天的賽程。'
G['start']['cards'].insert(find('start', 'home') + 1, card('homesch', '今天的賽程', '資料夾排好賽程後，首頁會列出今天還沒開始的場次，今天沒有就列最近一天。點那一場就能開始。有兩個以上場地時，按「場地」選這台記錄的場地，這台會記住。'))
# 比賽資料
G['info']['cards'][find('info', 'pickcup')]['d'] = '按「開始新比賽」會先問要放進哪個盃賽，預設是上一場的。資料夾有賽程時，下面會列出今天的場次，點了直接照賽程開始。'
# 名單
G['roster']['cards'].insert(find('roster', 'roster2') + 1, card('rosterbook', '名冊帶出姓名', '從資料夾載入隊伍或照賽程開始時，出賽名單先空著。照球隊寫的紙本輸入背號，名冊有的姓名會自動帶出；名冊沒有的號碼照樣加入，姓名可以自己填。'))
# 賽事資料夾
G['cup']['desc'] = '盃賽的賽程、隊伍名冊、裁判名單'
G['cup']['cards'] = [
    card('cup1', '新增資料夾', '主畫面按「賽事與紀錄」，再按「新增資料夾」，填賽事名稱。打開資料夾，上面分「賽程」「隊伍」「裁判」三頁。'),
    card('cup2', '隊伍名冊', '隊伍頁選男子組或女子組，按「加入隊伍名單」。報名名單可以整份貼上（「王小明 1」或「1 王小明」都可以），人數不限，會照標題分男女組、照隊名分隊。放錯男女組，打開那一隊切換。'),
    card('cupsch', '排賽程', '賽程頁按「新增比賽」，填日期、時間、場地，點下面的隊伍填進「第一隊 vs 第二隊」，點空格取消。按「儲存，再新增下一場」可以接著排，時間自動往後一小時。隊伍還不知道可以先空著；同一時間同場地或同一隊有兩場會提醒。'),
    card('cupgo', '照賽程開始', '點那一場，按「開始記錄」，日期、場次、場地和兩隊都帶好，直接到名單頁輸入背號。打完的場次會寫局數，贏的隊伍是綠色，右邊是各局比分。上面的場地按鈕可以只看一個場地。'),
    card('cupreg', '印登錄單', '沒有紙本記錄表時，賽程頁按「印登錄單」，勾要印的場次，存成 A4 PDF，一場一張。名單留白給球隊寫，有賽程的先印隊名和比賽資料；排名賽可以加印空白的。'),
    card('cupref', '裁判名單', '裁判頁按「加入裁判名單」，填場地和裁判名字，一行一位。記錄時點名字就好；比賽結束後，那一場的裁判也會自動加進這個場地。'),
    card('cup4', '傳到另一台', '按「存成檔案」傳給裁判夥伴，對方在「賽事與紀錄」按匯入。隊伍、賽程、裁判名單都會帶過去；同名的資料夾會合併，以最後修改的為主。'),
]
# 分享和觀看（放在賽事資料夾後面）
share = {'id': 'share', 'name': '分享和觀看', 'desc': '其他手機看比分、接手記錄', 'cards': [
    card('share1', '分享比賽', '記錄台按主畫面「分享比賽」，會出現代碼和 QR code，其他裝置輸入代碼就能看同一場。代碼每天換；球員姓名和名冊不會上傳。'),
    card('watch1', '觀看比賽', '觀看的裝置按「觀看比賽」，輸入代碼或按「掃描 QR code」，按「加入」，再按那一場的「觀看」。加過的代碼當天會留在清單。'),
    card('watch2', '觀看裝置', '記錄台在分享視窗按「觀看裝置」，看得到哪幾台在看，可以改名稱、移除不想給看的裝置，或更換代碼。'),
    card('take1', '接手記錄', '記錄台沒電或斷線時，觀看的裝置會出現「接手記錄」，在死球時按下接著記。原本的記錄台回來後按「接回」，兩邊的紀錄會合併。'),
]}
H.insert([g['id'] for g in H].index('cup') + 1, share)
s = s[:i] + 'var HELP=' + json.dumps(H, ensure_ascii=False) + s[j:]

# 截圖
i = s.index('var HELP_IMG=')
j = s.index(';\n', i)
imgs = json.loads(s[i + len('var HELP_IMG='):j])
need = {c['img'] for g in H for c in g['cards']}
n = 0
for f in sorted(glob.glob(os.path.join(IMG, '*.webp'))):
    k = os.path.basename(f)[:-5]
    if k in need:
        imgs[k] = 'data:image/webp;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
        n += 1
for k in [k for k in imgs if k not in need]:
    del imgs[k]
miss = sorted(k for k in need if k not in imgs)
assert not miss, ('說明圖缺少', miss)
s = s[:i] + 'var HELP_IMG=' + json.dumps(imgs) + s[j:]

# 觀看畫面的問號開「分享和觀看」
one("  if(view==='cup')return 'cup';", "  if(view==='cup')return 'cup';\n  if(view==='watch'&&HELP.some(function(g){return g.id==='share'}))return 'share';")
open(SRC, 'w', encoding='utf8').write(s)
print('patched v116', n, 'images')

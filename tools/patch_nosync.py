#!/usr/bin/env python3
"""11/20 第一批正式版：先不上連線功能（分享比賽、觀看比賽、接手記錄），等實機測完再上（使用者 01:1x 語音決定）。
程式照樣在，只把入口藏起來：主畫面的「分享比賽」「觀看比賽」、比賽中「其他」的分享、網址帶 ?watch= 的觀看、使用說明的「分享和觀看」那組。
SYNC_ON=false 時連線的按鍵都不處理，也不會去載 Firebase。要開回來：不要跑這支就好。
用在 patch_v97～v116 之後、build.py 之前（只給第一批正式版用，測試版不跑）。"""
import json, sys
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
if 'var SYNC_ON=' in s:
    sys.exit('already patched')


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:80])
    s = s.replace(a, b)


one("var FB_URL=", "var SYNC_ON=false; // 第一批正式版：連線功能先關（tools/patch_nosync.py）\nvar FB_URL=")
one("  if(syncAct(act,b)){render();return}", "  if(!SYNC_ON&&/^(shareopen|watchopen|syncopen|syncstart|watchgo|watchrecent|qsopen|wtake|wtakego)$/.test(act))return;\n  if(SYNC_ON&&syncAct(act,b)){render();return}")
one("(function(){\n  var q=location.search.match(/[?&]watch=([^&#]*)/)", "(function(){if(!SYNC_ON)return;\n  var q=location.search.match(/[?&]watch=([^&#]*)/)")
one("""      '<section class="msec"><h3 class="mhead">分享</h3><div class="mgrid one"><button class="mbtn" data-act="syncopen">""", """      (SYNC_ON?'':'<!--')+'<section class="msec"><h3 class="mhead">分享</h3><div class="mgrid one"><button class="mbtn" data-act="syncopen">""")
# 上面那段結尾補回註解結束
i = s.index("""(SYNC_ON?'':'<!--')+'<section class="msec"><h3 class="mhead">分享</h3>""")
j = s.index("</small></button></div></section>'+", i) + len("</small></button></div></section>'")
s = s[:j] + "+(SYNC_ON?'':'-->')" + s[j:]
one('\n</style>\n\n<div class="statusband"', '\n.herobtns [data-act=shareopen],.herobtns [data-act=watchopen],.landshare,.synctag{display:none!important}\n</style>\n\n<div class="statusband"')
# 使用說明拿掉「分享和觀看」
i = s.index('var HELP=')
j = s.index(';\n', i)
H = [g for g in json.loads(s[i + len('var HELP='):j]) if g['id'] != 'share']
s = s[:i] + 'var HELP=' + json.dumps(H, ensure_ascii=False) + s[j:]
need = {c['img'] for g in H for c in g['cards']}
i = s.index('var HELP_IMG=')
j = s.index(';\n', i)
imgs = {k: v for k, v in json.loads(s[i + len('var HELP_IMG='):j]).items() if k in need}
s = s[:i] + 'var HELP_IMG=' + json.dumps(imgs) + s[j:]
open(SRC, 'w', encoding='utf8').write(s)
print('patched nosync')

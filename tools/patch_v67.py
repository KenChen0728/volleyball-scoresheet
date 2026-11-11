#!/usr/bin/env python3
"""11/11 晚上 23:42 使用者看了測試版：暫停那裡不用「修正比分」。
- 按完暫停不出提示列，30 秒計時列恢復原本的樣子（隊名 暫停、秒數、結束）；計時結束後也不出提示列。
- 替補的提示列照舊。暫停的比分要改：「其他」→「修正比分」（會帶出這局最後一筆），或「記錄表」→「更正」。
- 說明「改替補、暫停的比分」照這個改寫。
用法：python3 tools/patch_v67.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import json, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'inT=' in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


one("/* 11/11 晚上：按完替補或暫停，下方寫「已記錄 3:2」和「修正比分」，到下一球開始前都在（學校版到下一分） */",
    "/* 11/11 晚上：按完替補，下方寫「已記錄 3:2」和「修正比分」，到下一球開始前都在（學校版到下一分）。暫停不放（使用者 23:42），暫停的比分從「其他」或更正改 */")
one("  if(!ids)ids=e&&(e.type==='SUB'||e.type==='TIMEOUT')?[e.id]:[];",
    "  if(!ids)ids=e&&e.type==='SUB'?[e.id]:[];")
one("dispatch('TIMEOUT',{set:n,team:k}); scNoteSet(); ui.timer=", "dispatch('TIMEOUT',{set:n,team:k}); ui.timer=")
one("""  var ev=scNote(s),t=ui.timer,inT=!!(ev&&t&&!t.label&&ev[0].kind==='T'&&ev[0].team===t.team); // 暫停還在計時：寫在計時列裡
  var rec=ev?'<small>已記錄 <b>'+ev[0].score+'</b></small>':'',fx=ev?'<button data-act="scfix">修正比分</button>':'';
  var nb=ev&&!inT?'<div class="scnote '+ev[0].team+'"><span><b>'+esc(tName(s,ev[0].team))+'</b> '+esc(scWhat(ev))+rec+'</span>'+fx+'</div>':'';
  if(!t)return nb;
  return nb+'<div class="tbar '+t.team+'"><span>'+esc(tName(s,t.team))+' '+(t.label||'暫停')+(inT?rec:'')+'</span><b data-tm>'+timerText()+'</b>'+(inT?fx:'')+'<button data-act="tmend">'+(t.label?'恢復':'結束')+'</button></div>';""",
    """  var ev=scNote(s),t=ui.timer;
  var nb=ev?'<div class="scnote '+ev[0].team+'"><span><b>'+esc(tName(s,ev[0].team))+'</b> '+esc(scWhat(ev))+'<small>已記錄 <b>'+ev[0].score+'</b></small></span><button data-act="scfix">修正比分</button></div>':'';
  if(!t)return nb;
  return nb+'<div class="tbar '+t.team+'"><span>'+esc(tName(s,t.team))+' '+(t.label||'暫停')+'</span><b data-tm>'+timerText()+'</b><button data-act="tmend">'+(t.label?'恢復':'結束')+'</button></div>';""")

i = s.index('var HELP=[') + 9
j = s.index('];', i) + 1
H = json.loads(s[i:j])
n = 0
for g in H:
    for c in g['cards']:
        if c.get('img') == 'fixsc':
            c['d'] = '按完替補，下方會寫「已記錄 3:2」，比分不對就按「修正比分」，打當時的比分。暫停的比分或之後才發現的，按「其他」→「修正比分」，或到「記錄表」→「更正」點那一筆。只能改成這局打過的比分。'
            n += 1
assert n == 1
s = s[:i] + json.dumps(H, ensure_ascii=False) + s[j:]
open(SRC, 'w', encoding='utf8').write(s)
print('ok')

#!/usr/bin/env python3
"""11/19 首頁進行中的練習比賽也能刪除（使用者 22:01：只能重新開始，不能刪除？）。
練習卡片右上角「重新開始」旁邊加「刪除」；刪掉後可以在「使用教學」再開一場。
刪除的配色統一（使用者 22:05）：救不回來的刪除，入口是紅框紅字（dellink），確認是紅底（danger）；
會進「最近刪除」的（首頁的比賽）和練習比賽維持一般按鈕。先跑 patch_v97～v103。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if "data-v=\"smpdel\"" in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""  if(ui.delMatch===m.id)return '<div class="rrow ask"><span>'+(smp?'重新開始練習？""","""  var sdel=smp&&ui.delMode==='del';if(sdel)smp=false; // 練習也能刪除：問法和一般比賽一樣，刪掉不進最近刪除
  if(ui.delMatch===m.id&&sdel)return '<div class="rrow ask"><span>刪除這場練習？之後可以在「使用教學」再開一場練習。</span><div class="row"><button data-act="del-no">取消</button><button data-act="del-yes" data-id="'+esc(m.id)+'">刪除</button></div></div>';
  smp=!!s.info.sample;
  if(ui.delMatch===m.id)return '<div class="rrow ask"><span>'+(smp?'重新開始練習？""")
one("""<button class="rcdel" data-act="del-ask" data-id="'+esc(m.id)+'">'+(smp?AGAIN_IC+'重新開始':TRASH_IC+'刪除')+'</button></div>';""",
"""'+(smp?'<span class="rcdels"><button class="rcdel" data-act="del-ask" data-id="'+esc(m.id)+'">'+AGAIN_IC+'重新開始</button><button class="rcdel" data-act="del-ask" data-v="smpdel" data-id="'+esc(m.id)+'">'+TRASH_IC+'刪除</button></span>':'<button class="rcdel" data-act="del-ask" data-id="'+esc(m.id)+'">'+TRASH_IC+'刪除</button>')+'</div>';""")
one("""  return '<div class="rrow hasdel"><button class="rmain" data-act="open" data-id="'+esc(m.id)+'">""","""  return '<div class="rrow hasdel'+(smp?' smp':'')+'"><button class="rmain" data-act="open" data-id="'+esc(m.id)+'">""")
one("    case 'del-ask': ui.delMatch=b.getAttribute('data-id'); break;","    case 'del-ask': ui.delMatch=b.getAttribute('data-id'); ui.delMode=b.getAttribute('data-v')==='smpdel'?'del':''; break;")
one("    case 'del-yes':\n      var id=b.getAttribute('data-id'),","    case 'del-yes': ui.delMode='';\n      var id=b.getAttribute('data-id'),")
one('\n</style>\n\n<div class="statusband"','''
.rcdels{position:absolute;top:10px;right:12px;display:flex;gap:6px;z-index:1}
.rcdels .rcdel{position:static}
.rrow.hasdel.smp .rmain strong{padding-right:196px}
</style>

<div class="statusband"''')
one('<button class="ghost" data-act="scdel">','<button class="dellink" data-act="scdel">',2)
one('<button class="ghost" data-act="cupteamdel"','<button class="dellink" data-act="cupteamdel"')
one('<button class="ghost" data-act="cupcourtdel"','<button class="dellink" data-act="cupcourtdel"')
one('<button data-act="cupdel">刪除資料夾</button>','<button class="delout" data-act="cupdel">刪除資料夾</button>')
one('\n</style>\n\n<div class="statusband"','\n.histtools button.delout{background:transparent;box-shadow:inset 0 0 0 1.5px var(--del-ink);color:var(--del-ink)}\n</style>\n\n<div class="statusband"')
open(SRC,'w',encoding='utf8').write(s)
print('patched v104')

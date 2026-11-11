#!/usr/bin/env python3
"""11/11 晚上 23:44 使用者：「其他」→「修正比分」點進去一瞬間找不到要點哪裡（上面是改比分的格子、下面是清單，兩件事擠在一起）。
- 改成兩步：先列出這局的暫停和替補（沒有就寫出來），點一筆 → 清單收起來，只顯示那一筆（幾比幾、誰換誰或誰暫停）和比分格子，
  按「修正比分」就整個關掉。和按完替補後的「修正比分」是同一個畫面。
- 第二步左上「‹ 返回」回到清單（Esc 一樣），清單的「‹ 返回」回到「其他」，「取消」整個關掉。
- 清單每一筆右邊加「›」，看得出可以點（更正清單也一樣）。
用法：python3 tools/patch_v68.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'data-act="scback"' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


one("""    if(sfe.length)h+='<p class="subhint scwho">第 '+sfe[0].set+' 局 <span class="tpill '+sfe[0].team+'">'+esc(tName(s,sfe[0].team))+'</span> '+esc(scWhat(sfe))+'</p>'+scEditHtml(s,sfe[0]);
    if(x.pick)h+=sfl.length?'<p class="subhint">第 '+s.setNo+' 局的暫停和替補，點要改的那一筆</p><div class="fixlist">'+sfl.map(function(q){return '<button class="fixrow '+q.team+'" data-act="scpick" data-v="'+esc(q.id)+'" aria-pressed="'+(!!sfe[0]&&sfe[0].id===q.id)+'"><span>'+esc(tName(s,q.team))+'</span><b>'+esc(scWhat([q]))+'</b><em>'+q.score+'</em></button>'}).join('')+'</div>':'<p class="note">第 '+s.setNo+' 局還沒有暫停或替補。</p>';
    else if(!sfe.length)h+='<p class="note">找不到這筆紀錄，可能已經復原了。</p>';
    h+='<button data-act="close">'+(sfe.length?'取消':'關閉')+'</button>';""",
    """    if(sfe.length){ // 第二步（或從替補後的提示列打開）：只顯示這一筆和比分格子
      if(x.pick)stepBack='<button class="sheetback" data-act="scback">‹ 返回</button>';
      h+='<p class="subhint scwho">第 '+sfe[0].set+' 局 <span class="tpill '+sfe[0].team+'">'+esc(tName(s,sfe[0].team))+'</span> '+esc(scWhat(sfe))+'</p>'+scEditHtml(s,sfe[0]);
    }else if(x.pick)h+=sfl.length?'<p class="subhint">第 '+s.setNo+' 局的暫停和替補，點要改的那一筆</p><div class="fixlist">'+sfl.map(function(q){return '<button class="fixrow '+q.team+'" data-act="scpick" data-v="'+esc(q.id)+'"><span>'+esc(tName(s,q.team))+'</span><b>'+esc(scWhat([q]))+'</b><em>'+q.score+'</em></button>'}).join('')+'</div>':'<p class="note">第 '+s.setNo+' 局還沒有暫停或替補，沒有可以修正的比分。</p>';
    else h+='<p class="note">找不到這筆紀錄，可能已經復原了。</p>';
    h+='<button data-act="close">'+(sfe.length||x.pick&&sfl.length?'取消':'關閉')+'</button>';""")
one("""    case 'scfixpick': var sfp=s.log.filter(function(q){return q.set===n&&(q.kind==='S'||q.kind==='T')}); ui.sheet={type:'scfix',pick:true,ids:sfp.length?[sfp[sfp.length-1].id]:[]}; break;""",
    """    case 'scfixpick': ui.sheet={type:'scfix',pick:true,ids:[]}; break;
    case 'scback': ui.sheet.ids=[]; ui.sheet.scv=null; ui.sheet.scerr=null; break;""")
one("""'.sheet [data-act=pmback]','.sheet [data-act=sheetback]'""", """'.sheet [data-act=pmback]','.sheet [data-act=scback]','.sheet [data-act=sheetback]'""")

CSS = """/* 11/11 晚上：清單每一筆右邊有「›」，看得出可以點 */
.fixrow{grid-template-columns:1fr 1.4fr auto auto}
.fixrow::after{content:'\\203A';font-size:22px;line-height:1;color:var(--muted);font-weight:700}
"""
one('</style>', CSS + '</style>')
open(SRC, 'w', encoding='utf8').write(s)
print('ok')

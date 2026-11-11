#!/usr/bin/env python3
"""11/11 下午（語音討論）：舉球員標示。
- 比賽中點球員，選單多一顆「設為舉球員」，再點一次取消（朋友：比賽常常上場後才知道誰舉球）。
- 格子右上角「舉」，白底黑字加細框，和自由球員的 L（球衣色底）分得出來；自由球員不能設。
- 一隊最多兩位；被換下時不自動轉給換上來的人；跟著背號走，下一局繼續有效。
- 只在畫面上，不寫進記錄表；和球衣顏色一樣不算比賽動作：不佔用「復原」，按錯再點一次取消。
- 存成事件 SETTER_SET {set, team, no, on}，比賽狀態 s.setters={t1:[],t2:[]}（不放在隊伍名單裡，名單存進資料夾時不會帶走）。
用法：python3 tools/patch_v62.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import json, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert "SETTER_SET" not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 比賽狀態
one("var s={info:{},teams:{t1:emptyTeam(),t2:emptyTeam()},setNo:1,",
    "var s={info:{},teams:{t1:emptyTeam(),t2:emptyTeam()},setters:{t1:[],t2:[]},setNo:1,")
one("      case 'CAPTAIN_SET': t.captain=d.no; break;",
    "      case 'CAPTAIN_SET': t.captain=d.no; break;\n"
    "      case 'SETTER_SET': var stl=s.setters[d.team]=s.setters[d.team].filter(function(q){return q!==d.no}); if(d.on&&stl.length<2)stl.push(d.no); break; // 舉球員只是畫面標示，一隊最多兩位")
# 不算比賽動作：不擋住復原，也不會被復原
one("var skip=['INFO_SET','TEAM_COLOR_SET','LIBERO_COLOR_SET','STAFF_SET','PLAYER_NAME_SET','TEAM_NAME_SET'];",
    "var skip=['INFO_SET','TEAM_COLOR_SET','LIBERO_COLOR_SET','STAFF_SET','PLAYER_NAME_SET','TEAM_NAME_SET','SETTER_SET'];")
one("    case 'GAME_CAPTAIN_SET':return n+'場上隊長';",
    "    case 'GAME_CAPTAIN_SET':return n+'場上隊長';\n    case 'SETTER_SET':return n+(d.on?'標出舉球員':'取消舉球員');")
# 球場格子右上角
one("var isL=t.liberos.indexOf(no)>=0,cap=actingCap(c,t,k)===no,srv=pos===0&&c.serving===k;",
    "var isL=t.liberos.indexOf(no)>=0,cap=actingCap(c,t,k)===no,srv=pos===0&&c.serving===k,isS=!isL&&no!=null&&(s.setters[k]||[]).indexOf(no)>=0;")
one("' class=\"pc '+k+(isL?' isl':'')", "' class=\"pc '+k+(isL?' isl':'')+(isS?' ist':'')")
one("'<span class=\"lmk\">L</span>':'')+cardMark(s,k,no)",
    "'<span class=\"lmk\">L</span>':'')+(isS?'<span class=\"stmk\" aria-label=\"舉球員\">舉</span>':'')+cardMark(s,k,no)")
one("+(isL?' 自由球員':'')+'\"><span class=\"pos\">'",
    "+(isL?' 自由球員':'')+(isS?' 舉球員':'')+'\"><span class=\"pos\">'")
# 點球員的選單（自由球員不能設）
one("+big('pmpen','判罰',penOk,' data-no=\"'+pno+'\"')+'</div><button data-act=\"close\">關閉</button>';",
    "+big('pmpen','判罰',penOk,' data-no=\"'+pno+'\"')+'</div>'+\n"
    "        (function(){var sts=s.setters[k]||[],isS=sts.indexOf(pno)>=0,full=!isS&&sts.length>=2;return '<button class=\"pmset\" data-act=\"pmsetter\" data-team=\"'+k+'\" data-no=\"'+pno+'\"'+(full?' disabled':'')+'><span class=\"stmk\">舉</span>'+(isS?'取消舉球員':'設為舉球員')+'</button>'+(full?'<p class=\"muted\">已經有兩位舉球員（'+sts.join('、')+' 號），要先取消一位。</p>':'')})()+\n"
    "        '<button data-act=\"close\">關閉</button>';")
one("    case 'pmlswap': ui.sheet=null;dispatch('LIBERO_SWAP',{set:n,team:k,lib:no});break;",
    "    case 'pmlswap': ui.sheet=null;dispatch('LIBERO_SWAP',{set:n,team:k,lib:no});break;\n"
    "    case 'pmsetter': var ston=(s.setters[k]||[]).indexOf(no)<0; ui.sheet=null; dispatch('SETTER_SET',{set:n,team:k,no:no,on:ston}); ui.toast={t:(ston?'已標出 ':'已取消 ')+tName(s,k)+' '+no+' 號舉球員',until:Date.now()+2500}; break;")

CSS = r"""/* 11/11 舉球員：格子右上角「舉」，白底黑字加細框，和自由球員的 L（球衣色底）分得出來；跟著號碼等比例放大 */
.stmk{position:absolute;right:0;top:0;width:28px;height:25px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;line-height:1;background:#fff;color:#111;box-shadow:inset 0 0 0 1.5px #111;border-radius:0 5px 0 7px}
.pcourt .pc .stmk{transform:scale(var(--k,1));transform-origin:100% 0}
.pc.ist.sel::after{top:30px}
/* 學校版的換人綁定標記也在右上角，有「舉」時移到下面 */
.pc.ist .bindm{top:calc(25px * var(--k,1) + 4px)}
.pmset{display:flex;align-items:center;justify-content:center;gap:10px}
.pmset .stmk{position:static;flex:none;border-radius:5px}
.pmset:disabled .stmk{opacity:.5}
"""
one('</style>', CSS + '</style>')

# 使用教學：比賽那組加一張
i = s.index('var HELP=')
j = s.index(';\n', i)
H = json.loads(s[i + len('var HELP='):j])
g = [x for x in H if x['id'] == 'play'][0]
assert all(c['img'] != 'setter' for c in g['cards'])
g['cards'].append({'img': 'setter', 't': '標出舉球員', 'd': '點場上的人，按「設為舉球員」，格子右上角會標「舉」，看得出他在前排還是後排。一隊最多兩位；換下場不會自動轉給別人，再點一次可以取消。'})
s = s[:i] + 'var HELP=' + json.dumps(H, ensure_ascii=False) + s[j:]
open(SRC, 'w', encoding='utf8').write(s)
print('patch_v62 ok')

#!/usr/bin/env python3
"""11/29 凌晨 使用者：名單「載入」同名隊伍會不會帶錯。
- 以前比賽的隊伍改用「隊名＋組別」分辨（男子組、女子組同名不再只剩一隊）
- 清單上一直顯示組別和日期（原本按「顯示其他組別」才看得到組別）
正式版、測試版都套（只動 pastTeams、importChoices、載入清單）。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if '11/29 同名分組別' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""      var t=s.teams[k], key=t.name.trim();
      if(!key||!t.players.length||seen[key])return;
      seen[key]=1;""","""      var t=s.teams[k], key=t.name.trim(), sk=key+'|'+(s.info.division||''); // 11/29 同名分組別：男女組同名各留一份
      if(!key||!t.players.length||seen[sk])return;
      seen[sk]=1;""")
one("""pastTeams(m.id).forEach(function(p){if(p.name===oth||all.some(function(q){return q.name===p.name}))return;""",
    """pastTeams(m.id).forEach(function(p){if(p.name===oth||all.some(function(q){return q.name===p.name&&(q.division||'')===(p.division||'')}))return;""")
one("""[p.team.players.length+' 人',ui.impAll?[normGroup(p.group),p.division].filter(Boolean).join(''):'',p.date?esc(p.date.slice(5)):''].filter(Boolean).join('・')""",
    """[p.team.players.length+' 人',[normGroup(p.group),p.division].filter(Boolean).join(''),p.date?esc(p.date.slice(5)):'',p.src&&p.src!=='先前比賽'?esc(p.src):''].filter(Boolean).join('・')""")
open(SRC,'w',encoding='utf8').write(s);print('ok')

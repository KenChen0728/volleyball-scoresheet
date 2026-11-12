#!/usr/bin/env python3
"""11/12 早上：使用者看示意時問「替補時還看得到另一隊的號碼，會不會點錯？」
實測：平常另一隊的格子點了沒反應，但另一隊的自由球員在前排閃的時候，那一格在替補時還能點，
點了會選到替補這隊同一個位置的人（藍隊替補時點橘隊閃的 L，選到藍隊 9 號），接著點號碼就換錯人。
- 替補面板開著時，另一隊的格子變灰、不能點（和不能換的格子同樣的樣子），看得出現在只點這一隊。
- 例外：另一隊閃的自由球員照提示可以點，點了就是換回原本的球員（和平常一樣），不會選到替補這隊的人；替補面板留著。
用法：python3 tools/patch_v70.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'other=!!ui.sub&&ui.sub.team!==k' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


one("""  var dim=false;
  if(ui.sub&&ui.sub.team===k){if(ui.sub.inNo!=null&&!ui.sub.forced&&!subFits(s,k,idx,ui.sub.inNo,ui.sub.exc))dim=true;else pick=true}""",
    """  var dim=false,other=!!ui.sub&&ui.sub.team!==k; // 替補面板開著時，另一隊的格子變灰、不能點（閃的自由球員除外，點了是換回）
  if(ui.sub&&ui.sub.team===k){if(ui.sub.inNo!=null&&!ui.sub.forced&&!subFits(s,k,idx,ui.sub.inNo,ui.sub.exc))dim=true;else pick=true}
  if(other&&!bad)dim=true;""")
one("""  var tap=pick||bad||(!ui.sub&&!ui.lib);""",
    """  var tap=other?bad:(pick||bad||(!ui.sub&&!ui.lib));""")
one("""      var ix=Number(b.getAttribute('data-v'));
      if(ui.sub){if(ui.sub.forced)break;""",
    """      var ix=Number(b.getAttribute('data-v'));
      if(ui.sub&&k!==ui.sub.team){ // 替補時點到另一隊：只有閃的自由球員能換回，不會選到替補這隊的人
        var lfo=libFront(s);
        if(lfo&&lfo.k===k&&s.teams[k].liberos.indexOf(c.cur[k][ix])>=0){dispatch('LIBERO_OUT',{set:n,team:k});ui.toast={t:'已換回 '+lfo.no+' 號',until:Date.now()+2500}}
        break;
      }
      if(ui.sub){if(ui.sub.forced)break;""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v70 ok')

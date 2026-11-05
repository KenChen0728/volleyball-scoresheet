# v59：場上隊長照整場的指定順序自動帶入（使用者 11/5：台灣習慣，控委說照指定順序不用再問）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""      case 'GAME_CAPTAIN_SET': s.sets[d.set].gameCaptain[d.team]=d.no; break;""","""      case 'GAME_CAPTAIN_SET': s.sets[d.set].gameCaptain[d.team]=d.no; var co=s.teams[d.team].capOrder=(s.teams[d.team].capOrder||[]).slice(); if(d.no!=null&&co.indexOf(d.no)<0)co.push(d.no); break;""")
rep("""function actingCap(c,t,k){var u=c.cur[k]||c.lineups[k];if(u.indexOf(t.captain)>=0)return t.captain;return u.indexOf(c.gameCaptain[k])>=0?c.gameCaptain[k]:null}""",
"""function actingCap(c,t,k){var u=c.cur[k]||c.lineups[k];if(u.indexOf(t.captain)>=0)return t.captain;if(u.indexOf(c.gameCaptain[k])>=0)return c.gameCaptain[k];var o=(t.capOrder||[]).filter(function(n){return u.indexOf(n)>=0})[0];return o==null?null:o}""")
open(P,'w',encoding='utf8').write(s);print('ok')

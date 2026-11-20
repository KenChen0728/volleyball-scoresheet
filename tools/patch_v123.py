#!/usr/bin/env python3
"""11/20 朋友在預覽版發現：同一次死球、同一個替補請求裡，9 號換 18 號之後，又能把 18 號換回 9 號（替補 2）。
規則 15.2.2、15.2.3、15.6：同一次死球裡剛換上的人不能再被換下，剛換下的人也不能換回來，要打完一球才可以。
同一個位置這次死球已經換過，就不能再換（例外替補不受這條限制）。先跑 patch_v97～v122。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if "rq[d.team].push({id:ev.id,t:d.out+' 換 '+d.in,idx:d.idx})" in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
one("rq[d.team].push({id:ev.id,t:d.out+' 換 '+d.in});","rq[d.team].push({id:ev.id,t:d.out+' 換 '+d.in,idx:d.idx});")
one("""  if(ps.done)return {err:'這個位置已換回，不能再換'};""",
"""  if(c.subRally&&c.subRally[k]===c.rally&&c.reqSubs&&(c.reqSubs[k]||[]).some(function(q){return q.idx===idx}))return {err:now+' 號這次死球剛換上，要打完一球才能再換'};
  if(ps.done)return {err:'這個位置已換回，不能再換'};""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v123')

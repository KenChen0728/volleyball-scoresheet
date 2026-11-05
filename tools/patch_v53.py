# v53：發球打勾直接打在格子右上角的小數字上（使用者 11/5：紙本是把數字打勾）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""      if(v!=='X')h+=boxW<30?svT(bx+5,by+7,'✓',9,INK):svT(bx+5,by+7,'✓',11,INK);""","""      if(v!=='X')h+=svTick(bx+boxW,by,boxW);""")
rep("""h+=svT(cx+boxW*Math.floor(b1/rots)+5,yr+(b1%rots)*hr+7,'✓',boxW<30?9:11,INK)}""","""h+=svTick(cx+boxW*(Math.floor(b1/rots)+1),yr+(b1%rots)*hr,boxW)}""")
rep("""function svSc(""","""function svTick(xr,yt,boxW){var n=boxW<30,cx=xr-(n?2:3)-(n?2:2.5),cy=yt+(n?6:7);return svT(cx-.5,cy+1,'✓',n?12:14,INK,700)}
function svSc(""")
open(P,'w',encoding='utf8').write(s);print('ok')

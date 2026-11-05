# v57：直拿平板把發球、得分鈕放在球場和按鈕下面，記錄表放到最後（朋友 11/5：Android 平板直拿找不到發球鍵）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""+warn+timerBar(s)+lock+tools+(isTall()?'<div class="tallsheet">'+setSvg(s,n)+'</div>':'')+foot;""","""+warn+timerBar(s)+lock+tools+(isTall()?'<div class="foot tallfoot">'+main+'</div><div class="tallsheet">'+setSvg(s,n)+'</div>':foot);""")
rep("</style>",""".foot.tallfoot{margin-top:4px}
.tallsheet{margin-top:4px}
</style>""")
open(P,'w',encoding='utf8').write(s);print('ok')

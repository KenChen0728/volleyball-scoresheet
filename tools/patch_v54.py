# v54：自由球員上場後，原本的 L 格改顯示被換下的人（使用者 11/5：這樣才知道是誰被換下來）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""    else if(inC){act='libback';cls=' incourt';sm=can?'換回 '+out.no:wait?'下一球可換':'換 '+out.no;dis=!can}""",
"""    else if(inC){act='libback';dis=!can;
      return '<button class="lc '+k+' outp" data-act="libback" data-team="'+k+'" data-no="'+no+'"'+(dis?' disabled':'')+' aria-label="'+out.no+' 號被自由球員 L'+(i+1)+' '+no+' 號換下'+(can?'，點一下換回':wait?'，下一球可換':'')+'"><span>換下</span><b>'+out.no+'</b>'+(can?'<small>點我換回</small>':'')+'</button>'}""")
rep("""    else if(!can){dis=true;if(wait&&out)sm='下一球可換'}""","""    else if(!can){dis=true}""")
rep("</style>","""/* v54 被自由換下的人放在 L 格 */
.lc.outp{opacity:1;box-shadow:0 0 0 2px var(--ink)}
.lc.outp:disabled{opacity:.45;box-shadow:none}
</style>""")
open(P,'w',encoding='utf8').write(s);print('ok')

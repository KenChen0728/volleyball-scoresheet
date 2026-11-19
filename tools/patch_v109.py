#!/usr/bin/env python3
"""11/19 新增比賽視窗、賽程列（使用者 23:42～23:44 平板實測）：
- 「點兩隊」的說明改成上面兩個空格「第一隊 vs 第二隊」，點下面的隊伍就填進下一個空格，點空格取消；兩格都滿再點換掉第二隊。
- 畫面夠高時只有隊伍清單上下捲，日期、空格、儲存都一直看得到；很矮的畫面（手機橫放）照舊整個視窗捲。
- 新增比賽的時間照這一組上一場往後一小時，不再是空的（iPad 空的時間格會跳成現在的時間）。
- 賽程列上面那行「第 1 場・時間・場地」跟 vs 一樣置中。先跑 patch_v97～v108。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'class="scslots"' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""'<p class="muted">點兩隊：先點的是第一隊（賽程表左邊），再點一次取消。還不知道是哪兩隊就先不選。</p>'+""",
"""(function(){function slot(k){var t=schedTeam(c,f[k]),nx=!t&&(k==='t1'||f.t1);return '<button class="scslot'+(t?' on':'')+(nx?' next':'')+(x.just===k?' just':'')+'" data-act="scclr" data-v="'+k+'" aria-label="'+(k==='t1'?'第一隊':'第二隊')+(t?'：'+esc(t.team.name)+'，點一下取消':'：還沒選')+'"><small>'+(k==='t1'?'第一隊':'第二隊')+'</small><strong>'+(t?esc(t.team.name):'點下面的隊伍')+'</strong>'+(t?'<i aria-hidden="true">✕</i>':'')+'</button>'}
        return '<div class="scslots">'+slot('t1')+'<b>vs</b>'+slot('t2')+'</div>'})()+""")
one("""      (ts.length?ts.map(function(t){""","""      '<div class="scteams">'+(ts.length?ts.map(function(t){""")
one("""      lab('t1')+lab('t2')+err+""","""      '</div>'+(f.t1&&f.t2?'':'<div class="scnotes">'+lab('t1')+lab('t2')+'</div>')+err+""")
one("    function lab(k){var nk=k==='t1'?'n1':'n2';return f[k]?'':'<label for=\"sc-'+nk+'\">'+(k==='t1'?'第一隊':'第二隊')+'還沒定：說明（可以不填）<input",
    "    function lab(k){var nk=k==='t1'?'n1':'n2';return f[k]?'':'<label for=\"sc-'+nk+'\">'+(k==='t1'?'第一隊':'第二隊')+'待定說明<input")
one("""    case 'scpick': if(x&&x.f){x.saved='';var id=b.getAttribute('data-id'),f=x.f;if(f.t1===id)f.t1='';else if(f.t2===id)f.t2='';else if(!f.t1)f.t1=id;else if(!f.t2)f.t2=id;x.err=''} return true;""",
"""    case 'scpick': if(x&&x.f){x.saved='';var id=b.getAttribute('data-id'),f=x.f;x.just='';if(f.t1===id)f.t1='';else if(f.t2===id)f.t2='';else if(!f.t1){f.t1=id;x.just='t1'}else{f.t2=id;x.just='t2'}x.err=''} return true; // 兩格都滿就換掉第二隊
    case 'scclr': if(x&&x.f){x.f[b.getAttribute('data-v')]='';x.just='';x.saved=''} return true;""")
one("    case 'scprint': case 'scptog':","    case 'scclr': case 'scprint': case 'scptog':")
# 視窗本身加 class，畫面夠高時只捲隊伍清單
one("""  return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true">'+h+'</div>';""",
    """  return '<div class="scrim" data-act="close"></div><div class="sheet'+(x.type==='scedit'?' scsheet':'')+'" role="dialog" aria-modal="true">'+h+'</div>';""")
# 新增比賽的時間：這一組上一場往後一小時
one("""  return {type:'scedit',id:null,f:{date:last?last.date:today(),time:'',court:last&&last.division===dv?last.court:'',division:dv,t1:'',t2:'',n1:'',n2:''}};""",
    """  var same=last&&last.division===dv;
  return {type:'scedit',id:null,f:{date:last?last.date:today(),time:same?schedNextTime(last.time):'',court:same?last.court:'',division:dv,t1:'',t2:'',n1:'',n2:''}};""")
one('\n</style>\n\n<div class="statusband"','''
.scrow>.muted{text-align:center}
.scslots{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center}
.scslots>b{color:var(--muted);font-weight:600}
.scslot{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;padding:6px 26px;border:2px dashed var(--line2);background:transparent;color:var(--muted);text-align:center}
.scslot small{font-size:13px;font-weight:500}
.scslot strong{font-size:15px;font-weight:600;overflow-wrap:anywhere}
.scslot.next{border-color:var(--ink);color:var(--ink)}
.scslot.on{border-style:solid;border-color:var(--ink);background:var(--card);color:var(--ink)}
.scslot.on strong{font-size:17px;font-weight:700}
.scslot i{position:absolute;right:8px;top:6px;font-style:normal;font-size:13px;color:var(--muted)}
@keyframes scjust{from{transform:scale(.94);box-shadow:0 0 0 4px var(--accent)}to{transform:none;box-shadow:0 0 0 0 transparent}}
.scslot.just{animation:scjust .25s ease-out}
@media (prefers-reduced-motion:reduce){.scslot.just{animation:none}}
.scteams{display:flex;flex-direction:column;gap:8px}
.scnotes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (min-height:600px){
  .sheet.scsheet{overflow:hidden}
  .sheet.scsheet>*{flex:none}
  .sheet.scsheet>.scteams{flex:1 1 auto;min-height:96px;overflow:auto;padding:2px;margin:-2px;overscroll-behavior:contain}
}
</style>

<div class="statusband"''')
open(SRC,'w',encoding='utf8').write(s)
print('patched v109')

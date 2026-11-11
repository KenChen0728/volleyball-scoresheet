#!/usr/bin/env python3
"""11/11 下午（語音討論）：替補和暫停的比分可以直接改。
情況：當下忘了按替補（或暫停），後來才補按，記錄的是補按當下的比分，要能改回真正的比分。
- 「記錄表 → 更正」點替補或暫停那筆，上面多「比分」兩格，直接打數字，按「改比分」。
- 這局沒有出現過的比分擋下來，寫原因（使用者：只能回溯之前的分數，不能寫還沒發生過的）。
- 同一個位置：換回來的比分不能比換下去的還早（換下去的也不能比換回來的還晚）。不同位置之間不管先後。
- 記錄表（紙本格式）、更正清單、CSV 都照改過的數字寫；暫停兩格照比分先後排。
- 存成更正事件 AMEND {target, patch:{sc:[本隊, 對方]}}：比分用「這筆那一隊在前」存，挑邊更正兩隊對調時不用跟著改。
- 每局記下得分順序 c.path（誰得分），用來判斷比分有沒有出現過。
用法：python3 tools/patch_v63.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import json, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert "function scCheck(" not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 得分順序
one("swapScore:null,swapSnap:null,libRows:{t1:[],t2:[]}}}", "swapScore:null,swapSnap:null,libRows:{t1:[],t2:[]},path:[]}}")
one("  c.score[k]++; c.rally++; c.live=false; c.replayLock=false;",
    "  c.score[k]++; c.rally++; c.live=false; c.replayLock=false; (c.path||(c.path=[])).push(k); // 得分順序：更正比分時判斷有沒有出現過")
# 替補：更正過的比分
one("""        s.log.push({id:ev.id,set:d.set,kind:'S',team:d.team,idx:d.idx,out:d.out,in:d.in,exc:!!d.exc,ret:!d.exc&&ps.sub!=null,score:sb.score[d.team]+':'+sb.score[other(d.team)]});""",
    """        var so=d.sc?d.sc[0]:sb.score[d.team],sp=d.sc?d.sc[1]:sb.score[other(d.team)]; // 更正過的比分（本隊在前）
        s.log.push({id:ev.id,set:d.set,kind:'S',team:d.team,idx:d.idx,out:d.out,in:d.in,exc:!!d.exc,ret:!d.exc&&ps.sub!=null,score:so+':'+sp,scx:!!d.sc});""")
one("""        sb.subRows[d.team][d.idx].push({in:d.in,score:sb.score[d.team]+':'+sb.score[other(d.team)],exc:!!d.exc});
        sb.subs[d.team].push({out:d.out,in:d.in,score:sb.score.t1+':'+sb.score.t2,exc:!!d.exc,injury:!!d.injury});""",
    """        sb.subRows[d.team][d.idx].push({in:d.in,score:so+':'+sp,exc:!!d.exc});
        sb.subs[d.team].push({out:d.out,in:d.in,score:d.team==='t1'?so+':'+sp:sp+':'+so,exc:!!d.exc,injury:!!d.injury});""")
# 暫停：更正過的比分，兩格照比分先後排
one("""      case 'TIMEOUT': var to=s.sets[d.set]; s.log.push({id:ev.id,set:d.set,kind:'T',team:d.team,score:to.score[d.team]+':'+to.score[other(d.team)]}); to.timeouts[d.team].push(to.score.t1+':'+to.score.t2); to.toRows[d.team].push(to.score[d.team]+':'+to.score[other(d.team)]); break;""",
    """      case 'TIMEOUT': var to=s.sets[d.set],tq=d.sc?d.sc[0]:to.score[d.team],tr=d.sc?d.sc[1]:to.score[other(d.team)]; s.log.push({id:ev.id,set:d.set,kind:'T',team:d.team,score:tq+':'+tr,scx:!!d.sc}); to.timeouts[d.team].push(d.team==='t1'?tq+':'+tr:tr+':'+tq); to.toRows[d.team].push(tq+':'+tr); to.timeouts[d.team].sort(scOrder); to.toRows[d.team].sort(scOrder); break;""")
# 更正畫面
one("function fixList(s){",
    """/* 11/11 替補、暫停晚按了：直接改當時的比分。只能改成這局打過的；同一個位置換回來不能比換下去早 */
function scOrder(a,b){var x=String(a).split(':'),y=String(b).split(':');return (+x[0]+ +x[1])-(+y[0]+ +y[1])} // 比分先後（打了幾球）
function scCheck(s,e,own,opp){
  if(!(own>=0&&opp>=0))return '比分要填數字。';
  var c=s.sets[e.set],t1=e.team==='t1'?own:opp,n=own+opp,path=c.path||[];
  if(n>path.length||path.slice(0,n).filter(function(q){return q==='t1'}).length!==t1)return '這局沒有出現過 '+own+':'+opp+' 這個比分，只能改成這局已經打過的比分。';
  if(e.kind==='S'){var row=s.log.filter(function(q){return q.set===e.set&&q.kind==='S'&&q.team===e.team&&q.idx===e.idx}),i=row.indexOf(e);
    for(var j=0;j<row.length;j++){if(j===i)continue;var q=String(row[j].score).split(':'),qt=Number(q[0])+Number(q[1]);
      if(j<i&&n<qt)return '換回來的比分不能比換下去的（'+row[j].score+'）還早。';
      if(j>i&&n>qt)return '換下去的比分不能比換回來的（'+row[j].score+'）還晚。'}}
  return '';
}
function scEditHtml(s,e){
  var x=ui.sheet,p=String(e.score).split(':'),v=x.scv||p,o=other(e.team);
  function box(i,k){return '<label><span class="tpill '+k+'">'+esc(tName(s,k))+'</span><input id="amsc'+i+'" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" value="'+esc(v[i])+'" aria-label="'+esc(tName(s,k))+' 的分數"></label>'}
  return '<div class="scedit"><p class="subhint">當時的比分（晚按了可以直接改）</p><div class="scrow">'+box(0,e.team)+'<b>:</b>'+box(1,o)+'<button data-act="amendscore">改比分</button></div>'+(x.scerr?'<p class="warning" role="alert">'+esc(x.scerr)+'</p>':'')+'</div>';
}
function fixList(s){""")
one("h='<h2>'+hd+' 暫停</h2>'+(full?", "h='<h2>'+hd+' 暫停</h2>'+scEditHtml(s,e)+(full?")
one("h='<h2>'+hd+' '+e.out+' 換 '+e.in+'</h2>';", "h='<h2>'+hd+' '+e.out+' 換 '+e.in+'</h2>'+scEditHtml(s,e);")
one("if(later)h+='<p class=\"muted\">這個位置後面還有替補或自由球員，要先處理後面那筆才能改。</p><button data-act=\"close\">關閉</button>';",
    "if(later)h+='<p class=\"muted\">這個位置後面還有替補或自由球員，要先處理後面那筆才能改人或刪除；比分可以直接改。</p><button data-act=\"close\">關閉</button>';")
one("    case 'amendask': ui.sheet.del=true; break;",
    """    case 'amendscore':
      var se=s.log.filter(function(q){return q.id===ui.sheet.id})[0],sv=['amsc0','amsc1'].map(function(id){var el=document.getElementById(id);return el?el.value.trim():''});
      var sn=sv.map(function(v){return /^\\d{1,2}$/.test(v)?Number(v):NaN}),serr=se?scCheck(s,se,sn[0],sn[1]):'找不到這筆紀錄。';
      if(serr){ui.sheet.scv=sv;ui.sheet.scerr=serr;break}
      if(sn.join(':')!==se.score){dispatch('AMEND',{target:se.id,patch:{sc:sn},note:'第 '+se.set+' 局 '+tName(s,se.team)+' '+(se.kind==='T'?'暫停':'替補 '+se.out+' 換 '+se.in)+' 比分 '+se.score+' 改為 '+sn.join(':')});
        ui.toast={t:'已改比分：'+tName(s,se.team)+' '+(se.kind==='T'?'暫停':se.out+' 換 '+se.in)+' '+sn.join(':'),until:Date.now()+3000}}
      ui.sheet=null; break;
    case 'amendask': ui.sheet.del=true; break;""")
# 比分格按 Enter 就是「改比分」（選字中不算，上面已經擋）
one("  if(e.key==='Enter'&&tg.id==='ref-type'){",
    "  if(e.key==='Enter'&&(tg.id==='amsc0'||tg.id==='amsc1')){e.preventDefault();var asb=app.querySelector('[data-act=amendscore]');if(asb)asb.click();return}\n  if(e.key==='Enter'&&tg.id==='ref-type'){")
# 暫停改隊：改過的比分跟著換成新那隊在前
one("else if(act==='amendto')dispatch('AMEND',{target:ae.id,patch:{team:other(ae.team)},note:ah+'暫停改為 '+tName(s,other(ae.team))});",
    "else if(act==='amendto'){var atp={team:other(ae.team)};if(ae.scx)atp.sc=ae.score.split(':').map(Number).reverse();dispatch('AMEND',{target:ae.id,patch:atp,note:ah+'暫停改為 '+tName(s,other(ae.team))})}")
# CSV：替補、暫停寫改過的比分
one("    var fl=s.flipped&&s.flipped[e.id];lines.push([hm(e.at),n,map[e.type],d.team?nm[fl?other(d.team):d.team]:'',txt,fl?c.score[B]:c.score[A],fl?c.score[A]:c.score[B]].map(q).join(','));",
    """    var fl=s.flipped&&s.flipped[e.id],at=d.team?(fl?other(d.team):d.team):null,ca=fl?c.score[B]:c.score[A],cb=fl?c.score[A]:c.score[B];
    if(d.sc&&at&&(e.type==='SUB'||e.type==='TIMEOUT')){ca=at===A?d.sc[0]:d.sc[1];cb=at===A?d.sc[1]:d.sc[0]} // 更正過的比分
    lines.push([hm(e.at),n,map[e.type],at?nm[at]:'',txt,ca,cb].map(q).join(','));""")

CSS = r"""/* 11/11 更正：替補、暫停改比分 */
.scedit{display:flex;flex-direction:column;gap:6px}
.scrow{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}
.scrow label{display:flex;flex-direction:column;gap:4px;flex:1 1 90px;min-width:0}
.scrow label .tpill{align-self:flex-start;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.scrow input{width:100%;min-height:48px;font-size:24px;font-family:var(--num);font-weight:700;text-align:center;color:var(--ink)}
.scrow>b{font-size:24px;padding-bottom:10px}
.scrow>button{flex:1 1 100%;min-height:48px}
@media (min-width:420px){.scrow>button{flex:0 0 auto;padding-inline:16px}}
@media (min-width:760px){.shell.nonav~.sheet .warning{font-size:clamp(14px,2.1vh,17px)}}
"""
one('</style>', CSS + '</style>')

# 使用教學：「修改內容」改說明，加一張「改比分」
i = s.index('var HELP=')
j = s.index(';\n', i)
H = json.loads(s[i + len('var HELP='):j])
g = [x for x in H if x['id'] == 'sheet'][0]
f2 = [c for c in g['cards'] if c['img'] == 'fix2'][0]
assert f2['d'] == '可改人、改隊或刪除。暫停和替補改了比分不變；有給分的判罰改了，分數和輪轉會重算。', f2['d']
f2['d'] = '可改人、改隊或刪除，暫停和替補改人不會動到比分；有給分的判罰改了，分數和輪轉會重算。'
k = g['cards'].index(f2)
g['cards'].insert(k + 1, {'img': 'fixsc', 't': '改替補、暫停的比分', 'd': '替補或暫停晚按了，點那一筆，在「當時的比分」打正確的比分，按「改比分」，記錄表會照著改。只能改成這局打過的比分；同一個位置換回來不能比換下去早。'})
s = s[:i] + 'var HELP=' + json.dumps(H, ensure_ascii=False) + s[j:]
open(SRC, 'w', encoding='utf8').write(s)
print('patch_v63 ok')

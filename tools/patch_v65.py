#!/usr/bin/env python3
"""11/11 晚上（語音討論）：替補、暫停的比分多兩個「修正比分」入口，改完看得出來。
- 按完替補或暫停：下方提示列寫「已記錄 3:2」和「修正比分」，點了直接改那一筆的比分（同時按的幾組替補一起改）。
  暫停的 30 秒計時列裡也有。到下一球開始（學校版：下一分）、或那一筆被復原就收起來。
- 「其他」→「修正」多一顆「修正比分」：先帶出這局最後一筆，下面列出這局的暫停和替補，點別筆就換。
- 「記錄表 → 更正」原本的路照舊。改比分的按鈕統一叫「修正比分」。
- 使用者 21:48 問要不要多一步確認：比分改錯可以再改、也能復原，所以不加確認，改成改完一定看得到結果——
  比賽畫面的提示字寫「已修正：…3:2 → 3:1」，更正清單上方寫同一句、那一筆加框；其他更正（改人、改隊、刪除）也寫出來。
- 手機橫放時計時列和提示列會把球場擠到蓋住（暫停計時列 11/9 就有）：有提示列時球場可以再縮。
- 說明「改替補、暫停的比分」搬到「暫停和替補」，照新的入口改寫。
用法：python3 tools/patch_v65.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import json, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function scNote(' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 提示列：最後一次替補或暫停（同一個死球裡），到下一球開始前都在
one("function timerLeft(){",
    """/* 11/11 晚上：按完替補或暫停，下方寫「已記錄 3:2」和「修正比分」，到下一球開始前都在（學校版到下一分） */
function scNote(s){
  var x=ui.scnote,c=s&&s.sets[s.setNo];if(!x||!c)return null;
  if(x.set!==s.setNo||x.rally!==c.rally||c.live){ui.scnote=null;return null}
  var ev=x.ids.map(function(id){return s.log.filter(function(q){return q.id===id})[0]}).filter(Boolean);
  return ev.length?ev:null;
}
function scNoteSet(ids){
  var m=current();if(!m)return;var st=reduce(m.events),e=m.events[m.events.length-1];
  if(!ids)ids=e&&(e.type==='SUB'||e.type==='TIMEOUT')?[e.id]:[];
  ui.scnote=ids.length?{ids:ids.slice(),set:st.setNo,rally:st.sets[st.setNo].rally}:null;
}
function scWhat(ev){return ev[0].kind==='T'?'暫停':(ev[0].exc?'例外替補 ':'替補 ')+ev.map(function(e){return e.out+' 換 '+e.in}).join('、')}
function timerLeft(){""")

one("""function timerBar(s){
  if(!ui.timer)return '';
  return '<div class="tbar '+ui.timer.team+'"><span>'+esc(tName(s,ui.timer.team))+' '+(ui.timer.label||'暫停')+'</span><b data-tm>'+timerText()+'</b><button data-act="tmend">'+(ui.timer.label?'恢復':'結束')+'</button></div>';
}""",
    """function timerBar(s){
  var ev=scNote(s),t=ui.timer,inT=!!(ev&&t&&!t.label&&ev[0].kind==='T'&&ev[0].team===t.team); // 暫停還在計時：寫在計時列裡
  var rec=ev?'<small>已記錄 <b>'+ev[0].score+'</b></small>':'',fx=ev?'<button data-act="scfix">修正比分</button>':'';
  var nb=ev&&!inT?'<div class="scnote '+ev[0].team+'"><span><b>'+esc(tName(s,ev[0].team))+'</b> '+esc(scWhat(ev))+rec+'</span>'+fx+'</div>':'';
  if(!t)return nb;
  return nb+'<div class="tbar '+t.team+'"><span>'+esc(tName(s,t.team))+' '+(t.label||'暫停')+(inT?rec:'')+'</span><b data-tm>'+timerText()+'</b>'+(inT?fx:'')+'<button data-act="tmend">'+(t.label?'恢復':'結束')+'</button></div>';
}""")

# 按完替補（點場上球員、替補面板按完成）或暫停，記下提示列要寫的那幾筆。提示列取代原本 3 秒的「替補：5 號換 18 號」
one("""dispatch('SUB',{set:n,team:k,idx:psx.idx,out:pout,in:no,exc:pex,injury:pex&&!!psx.inj});ui.toast={t:(pex?'例外替補：':'替補：')+pout+' 號換 '+no+' 號',until:Date.now()+3000};break;""",
    """dispatch('SUB',{set:n,team:k,idx:psx.idx,out:pout,in:no,exc:pex,injury:pex&&!!psx.inj});scNoteSet();break;""")
one("""dispatch('TIMEOUT',{set:n,team:k}); ui.timer={team:k,end:Date.now()+30000,shown:false,closed:false}; break;""",
    """dispatch('TIMEOUT',{set:n,team:k}); scNoteSet(); ui.timer={team:k,end:Date.now()+30000,shown:false,closed:false}; break;""")
one("""      if(!ui.sub.exc&&(ui.sub.ids||[]).length&&cnt>=5)ui.notice=tName(s,ui.sub.team)+' 第 '+cnt+' 次替補';
      ui.sub=null; ui.noServe=Date.now()+700; break;""",
    """      if(!ui.sub.exc&&(ui.sub.ids||[]).length&&cnt>=5)ui.notice=tName(s,ui.sub.team)+' 第 '+cnt+' 次替補';
      if((ui.sub.ids||[]).length)scNoteSet(ui.sub.ids);
      ui.sub=null; ui.noServe=Date.now()+700; break;""")

# 「其他」→「修正」：修正比分、挑邊、查看名單排一列
one("""'<div class="mgrid two">'+mb('tossfix','','挑邊',mc.live||s.setNo===2)+mb('page','roster','查看名單')+'</div>'+""",
    """'<div class="mgrid">'+mb('scfixpick','','修正比分')+mb('tossfix','','挑邊',mc.live||s.setNo===2)+mb('page','roster','查看名單')+'</div>'+""")

# 修正比分視窗：從提示列打開只改那一筆；從「其他」打開，上面改、下面列出這局的暫停和替補可以換一筆
one("""  }else if(x.type==='amend'){""",
    """  }else if(x.type==='scfix'){
    var sfl=s.log.filter(function(q){return q.set===s.setNo&&(q.kind==='S'||q.kind==='T')}),sfe=(x.ids||[]).map(function(id){return s.log.filter(function(q){return q.id===id})[0]}).filter(Boolean);
    h='<h2>修正比分</h2>';
    if(sfe.length)h+='<p class="subhint scwho">第 '+sfe[0].set+' 局 <span class="tpill '+sfe[0].team+'">'+esc(tName(s,sfe[0].team))+'</span> '+esc(scWhat(sfe))+'</p>'+scEditHtml(s,sfe[0]);
    if(x.pick)h+=sfl.length?'<p class="subhint">第 '+s.setNo+' 局的暫停和替補，點要改的那一筆</p><div class="fixlist">'+sfl.map(function(q){return '<button class="fixrow '+q.team+'" data-act="scpick" data-v="'+esc(q.id)+'" aria-pressed="'+(!!sfe[0]&&sfe[0].id===q.id)+'"><span>'+esc(tName(s,q.team))+'</span><b>'+esc(scWhat([q]))+'</b><em>'+q.score+'</em></button>'}).join('')+'</div>':'<p class="note">第 '+s.setNo+' 局還沒有暫停或替補。</p>';
    else if(!sfe.length)h+='<p class="note">找不到這筆紀錄，可能已經復原了。</p>';
    h+='<button data-act="close">'+(sfe.length?'取消':'關閉')+'</button>';
  }else if(x.type==='amend'){""")
one("""<button data-act="amendscore">改比分</button>""", """<button data-act="amendscore">修正比分</button>""")

one("""    case 'amendopen': ui.sheet={type:'amend',id:b.getAttribute('data-v')}; break;""",
    """    case 'scfix': var sfn=scNote(s); ui.sheet=sfn?{type:'scfix',ids:sfn.map(function(q){return q.id})}:null; break;
    case 'scfixpick': var sfp=s.log.filter(function(q){return q.set===n&&(q.kind==='S'||q.kind==='T')}); ui.sheet={type:'scfix',pick:true,ids:sfp.length?[sfp[sfp.length-1].id]:[]}; break;
    case 'scpick': ui.sheet.ids=[b.getAttribute('data-v')]; ui.sheet.scv=null; ui.sheet.scerr=null; break;
    case 'amendopen': ui.sheet={type:'amend',id:b.getAttribute('data-v')}; break;""")

# 送出：同時按的幾組替補一起改；改完一定寫出結果（比賽畫面的提示字、更正清單上方）
one("""      var se=s.log.filter(function(q){return q.id===ui.sheet.id})[0],sv=['amsc0','amsc1'].map(function(id){var el=document.getElementById(id);return el?el.value.trim():''});
      var sn=sv.map(function(v){return /^\\d{1,2}$/.test(v)?Number(v):NaN}),serr=se?scCheck(s,se,sn[0],sn[1]):'找不到這筆紀錄。';
      if(serr){ui.sheet.scv=sv;ui.sheet.scerr=serr;break}
      if(sn.join(':')!==se.score){dispatch('AMEND',{target:se.id,patch:{sc:sn},note:'第 '+se.set+' 局 '+tName(s,se.team)+' '+(se.kind==='T'?'暫停':'替補 '+se.out+' 換 '+se.in)+' 比分 '+se.score+' 改為 '+sn.join(':')});
        ui.toast={t:'已改比分：'+tName(s,se.team)+' '+(se.kind==='T'?'暫停':se.out+' 換 '+se.in)+' '+sn.join(':'),until:Date.now()+3000}}
      ui.sheet=null; break;""",
    """      var sel=(ui.sheet.ids||[ui.sheet.id]).map(function(id){return s.log.filter(function(q){return q.id===id})[0]}).filter(Boolean),se=sel[0],sv=['amsc0','amsc1'].map(function(id){var el=document.getElementById(id);return el?el.value.trim():''});
      var sn=sv.map(function(v){return /^\\d{1,2}$/.test(v)?Number(v):NaN}),serr=se?'':'找不到這筆紀錄。';
      sel.forEach(function(q){if(!serr)serr=scCheck(s,q,sn[0],sn[1])});
      if(serr){ui.sheet.scv=sv;ui.sheet.scerr=serr;break}
      var sto=sn.join(':'),sold=se.score,chg=sel.filter(function(q){return q.score!==sto});
      chg.forEach(function(q){dispatch('AMEND',{target:q.id,patch:{sc:sn},note:'第 '+q.set+' 局 '+tName(s,q.team)+' '+(q.kind==='T'?'暫停':'替補 '+q.out+' 換 '+q.in)+' 比分 '+q.score+' 改為 '+sto})});
      var sdt=chg.length?'已修正：'+tName(s,se.team)+' '+scWhat(sel)+' '+sold+' → '+sto:'比分沒有改，還是 '+sto;
      ui.toast={t:sdt,until:Date.now()+3500}; ui.fixDone={ids:sel.map(function(q){return q.id}),t:sdt};
      ui.sheet=null; break;""")
# 其他更正（改人、改隊、刪除）也在更正清單上方寫出來
one("""      else{var ano=s.sets[ae.set].lineups[ae.team][av];dispatch('AMEND',{target:ae.id,patch:{idx:av,out:ano},note:ah+'替補更正：'+ae.out+' 換 '+ae.in+' 改為 '+ano+' 換 '+ae.in})}
      ui.sheet=null; break;""",
    """      else{var ano=s.sets[ae.set].lineups[ae.team][av];dispatch('AMEND',{target:ae.id,patch:{idx:av,out:ano},note:ah+'替補更正：'+ae.out+' 換 '+ae.in+' 改為 '+ano+' 換 '+ae.in})}
      var aev=m.events[m.events.length-1]; if(aev&&aev.type==='AMEND'&&aev.data.target===ae.id)ui.fixDone={ids:[ae.id],t:'已更正：'+aev.data.note};
      ui.sheet=null; break;""")
# 下一次點任何東西就收掉
one("""  if(staleTab)return;
  var fromMenu=""", """  if(staleTab)return;
  ui.fixDone=null;
  var fromMenu=""")
one("""    return '<button class="fixrow '+x.team+'" data-act="amendopen" data-v="'+x.id+'"><span>'""",
    """    return '<button class="fixrow '+x.team+(ui.fixDone&&ui.fixDone.ids.indexOf(x.id)>=0?' just':'')+'" data-act="amendopen" data-v="'+x.id+'"><span>'""")
one("""'<p class="subhint">暫停、替補或判罰按錯，點那一筆</p>'+(rows.length?""",
    """'<p class="subhint">暫停、替補或判罰按錯，點那一筆</p>'+(ui.fixDone?'<p class="good fixdone" role="status">'+esc(ui.fixDone.t)+'</p>':'')+(rows.length?""")

CSS = """/* 11/11 晚上：按完替補或暫停的提示列（已記錄的比分、修正比分），更正後的結果 */
.scnote{flex:none;display:flex;align-items:center;gap:8px;padding:2px 2px 2px 10px;border:1px solid var(--line);border-left:6px solid var(--t1);border-radius:6px;background:var(--panel);color:var(--ink);font-size:14px;line-height:1.3}
.scnote.t2{border-left-color:var(--t2)}
.scnote>span{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:700}
.scnote>span>b{font-weight:800;color:var(--t1)}
.scnote.t2>span>b{color:var(--t2)}
.tbar>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.scnote small,.tbar small{display:block;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis}
.scnote small b,.tbar small b{font-family:var(--num);font-size:16px;line-height:1.1;color:inherit}
.scnote button{flex:none;min-height:44px;padding-inline:14px;font-size:15px}
.fixrow.just{border-color:var(--ok);box-shadow:inset 0 0 0 2px var(--ok)}
.fixrow[aria-pressed=true]{border-color:var(--ink);box-shadow:inset 0 0 0 2px var(--ink)}
.fixdone{margin:0;flex:none}
.scwho .tpill{vertical-align:0}
@media (orientation:landscape) and (max-height:620px){
  .wplay:has(.wctl>.tbar,.wctl>.scnote) .wmid .pcourt{min-height:0} /* 手機橫放：有計時列或提示列時球場再縮，不會蓋到 */
  .wctl>.tbar,.wctl>.scnote{padding-block:0}
}
@media (orientation:portrait) and (max-height:700px){
  .tbar,.scnote{padding-block:0}
  .pcourt:has(~.zone .tbar,~.tbar):has(~.zone .scnote,~.scnote){min-height:0} /* 暫停計時中又替補，兩條都在：球場再縮，發球鍵不會被擠出畫面 */
}
@media (orientation:landscape) and (min-width:761px) and (min-height:521px){
  .wmid .tbar,.wmid .scnote{font-size:clamp(14px,2.3vh,19px)}
  .wmid .tbar small,.wmid .scnote small{font-size:clamp(13px,2vh,17px)}
  .wmid .tbar small b,.wmid .scnote small b{font-size:clamp(16px,2.6vh,22px)}
  .wmid .tbar button,.wmid .scnote button{font-size:clamp(14px,2.2vh,18px);min-height:clamp(44px,6vh,50px)}
}
"""
one('</style>', CSS + '</style>')

# 說明：搬到「暫停和替補」，照新的入口寫
i = s.index('var HELP=[') + 9
j = s.index('];', i) + 1
H = json.loads(s[i:j])
card = None
for g in H:
    for c in g['cards']:
        if c.get('img') == 'fixsc':
            card = c
    g['cards'] = [c for c in g['cards'] if c.get('img') != 'fixsc']
card['d'] = '按完替補或暫停，下方會寫「已記錄 3:2」。比分不對就按「修正比分」，打當時的比分。之後才發現，按「其他」→「修正比分」，或到「記錄表」→「更正」點那一筆。只能改成這局打過的比分。'
sub = [g for g in H if g['id'] == 'subs'][0]
k = [c.get('img') for c in sub['cards']].index('sub')
sub['cards'].insert(k + 1, card)
s = s[:i] + json.dumps(H, ensure_ascii=False) + s[j:]

open(SRC, 'w', encoding='utf8').write(s)
print('ok')

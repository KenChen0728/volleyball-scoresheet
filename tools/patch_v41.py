# v41：強制替補面板直接有「復原判罰」（使用者 11/5）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""'，要先換下場才能繼續比賽。判錯了請按上方「復原」。</p>'""","""'，要先換下場才能繼續比賽。</p>'""")
rep("""(ui.sub.forced?'<div class="row">'+(ui.sub.exc?'':'<button data-act="forceexc">改用例外替補</button>')+'<button class="danger" data-act="penkind" data-v="INC" data-team="'+k+'">陣容不完整</button></div>':'')""",
"""(ui.sub.forced?'<div class="row">'+(ui.sub.exc?'':'<button data-act="forceexc">改用例外替補</button>')+'<button class="danger" data-act="penkind" data-v="INC" data-team="'+k+'">陣容不完整</button></div>'+(fp?'<button class="full" data-act="forceundo">↶ 判錯了，復原這個判罰</button>':''):'')""")
rep("""    case 'forceexc': ui.sub.exc=true; break;""",
"""    case 'forceexc': ui.sub.exc=true; break;
    case 'forceundo':
      var fpo=pendingOut(s),fdead={},fev=null;if(!fpo)break;
      m.events.forEach(function(e){if(e.type==='UNDO')fdead[e.data.target]=1});
      m.events.forEach(function(e){if(e.type==='SANCTION'&&!fdead[e.id]&&e.data.team===fpo.team&&e.data.who===fpo.no&&(e.data.kind==='E'||e.data.kind==='D'))fev=e});
      if(fev){dispatch('UNDO',{target:fev.id});ui.sub=null;ui.toast={t:'已復原：'+tName(s,fpo.team)+' '+fpo.no+' 號'+(fev.data.kind==='D'?'出場':'出局'),until:Date.now()+3500}}
      break;""")
open(P,'w',encoding='utf8').write(s); print('ok')

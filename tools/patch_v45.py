# v45：記事欄快捷「助理教練代理教練」（朋友 11/5 試用回饋，句型比照 eScore Message_ACtoC）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""      case 'INJURY': var ij=s.sets[d.set];""","""      case 'AC_COACH': var ac=s.sets[d.set]; s.acc=(s.acc||[]).concat([{id:ev.id,set:d.set,team:d.team,raw:{t1:ac.score.t1,t2:ac.score.t2}}]); break;
      case 'INJURY': var ij=s.sets[d.set];""")
rep("""  s.injuries.forEach(function(x){notes.push('第 '+x.set+' 局 '+ab(x.raw)+tag(x.team)+x.no+' 號傷停')});""","""  s.injuries.forEach(function(x){notes.push('第 '+x.set+' 局 '+ab(x.raw)+tag(x.team)+x.no+' 號傷停')});
  (s.acc||[]).forEach(function(x){notes.push('第 '+x.set+' 局 '+ab(x.raw)+tag(x.team)+'助理教練(AC)成為執行教練(C)')});""")
# 11/5 使用者：改成紙本寫法「第 1 局 2:1 B 隊請求 AC 代 C」（比分請求隊在前）
rep("""  (s.acc||[]).forEach(function(x){notes.push('第 '+x.set+' 局 '+ab(x.raw)+tag(x.team)+'助理教練(AC)成為執行教練(C)')});""","""  (s.acc||[]).forEach(function(x){var o=other(x.team);notes.push('第 '+x.set+' 局 '+x.raw[x.team]+':'+x.raw[o]+' '+(x.team===A?'A':'B')+' 隊請求 AC 代 C')});""")
rep("""  return '<div class="ppr prem"><h3>記事欄</h3>'+(rows?'<ul>'+rows+'</ul>':'')+'<textarea""","""  var qk=matchOver(s)||s.preForfeit?'':'<div class="quicknote"><span class="muted">快速加入</span>'+[A,other(A)].map(function(k){var x=(s.acc||[]).filter(function(q){return q.team===k})[0];return x?'<button class="qn on '+k+'" data-act="accdel" data-v="'+x.id+'">'+esc(tName(s,k))+' AC 代 C ✓<small>點一下取消</small></button>':'<button class="qn '+k+'" data-act="accadd" data-team="'+k+'">'+esc(tName(s,k))+'<br>AC 代 C</button>'}).join('')+'</div>';
  return '<div class="ppr prem"><h3>記事欄</h3>'+qk+(rows?'<ul>'+rows+'</ul>':'')+'<textarea""")
rep("""    case 'hints':""","""    case 'accadd': dispatch('AC_COACH',{set:n,team:k}); ui.toast={t:'已加入記事：'+tName(s,k)+' 助理教練代理教練',until:Date.now()+3000}; break;
    case 'accdel': dispatch('UNDO',{target:b.getAttribute('data-v')}); break;
    case 'hints':""")
rep("</style>","""/* v45 */
.quicknote{display:flex;align-items:center;gap:8px;margin:6px 0 8px;padding:0 6px;flex-wrap:wrap}
.quicknote .qn{flex:1 1 0;min-width:0;min-height:48px;padding:4px 8px;font-size:14px;font-weight:700;line-height:1.25;border:1px solid #1616c8;color:#1616c8;background:#fff;border-radius:8px}
.quicknote .qn.on{background:#1616c8;color:#fff}
.quicknote .qn small{display:block;font-size:11px;font-weight:400;opacity:.85}
.quicknote .muted{flex:none;font-size:13px;color:#444}
</style>""")
open(P,'w',encoding='utf8').write(s); print('ok')

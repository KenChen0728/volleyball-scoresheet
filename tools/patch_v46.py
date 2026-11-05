# v46：AC 代 C 按鈕依狀態切換 C 代 AC，一直往下加；每行旁邊 ✕ 可刪（使用者 11/5）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""s.acc=(s.acc||[]).concat([{id:ev.id,set:d.set,team:d.team,raw:{t1:ac.score.t1,t2:ac.score.t2}}]);""","""s.acc=(s.acc||[]).concat([{id:ev.id,set:d.set,team:d.team,back:!!d.back,raw:{t1:ac.score.t1,t2:ac.score.t2}}]);""")
rep("""notes.push('第 '+x.set+' 局 '+x.raw[x.team]+':'+x.raw[o]+' '+(x.team===A?'A':'B')+' 隊請求 AC 代 C')});""","""var ln=new String('第 '+x.set+' 局 '+x.raw[x.team]+':'+x.raw[o]+' '+(x.team===A?'A':'B')+' 隊請求 '+(x.back?'C 代 AC':'AC 代 C'));ln.accId=x.id;notes.push(ln)});""")
i=s.index("  var qk=matchOver(s)||s.preForfeit?'':"); j=s.index("\n",i)
s=s[:i]+"""  var qk=matchOver(s)||s.preForfeit?'':'<div class="quicknote"><span class="muted">快速加入</span>'+[A,other(A)].map(function(k){var nb=(s.acc||[]).filter(function(q){return q.team===k}).length%2===1;return '<button class="qn '+k+'" data-act="accadd" data-team="'+k+'" data-v="'+(nb?'back':'')+'">'+esc(tName(s,k))+'<br>'+(nb?'C 代 AC':'AC 代 C')+'</button>'}).join('')+'</div>';"""+s[j:]
rep("""nt=notesList(s,A,other(A)),rows=nt.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')""","""nt=notesList(s,A,other(A)),done=matchOver(s),rows=nt.map(function(x){return '<li>'+esc(x)+(x.accId&&!done?' <button class="accx" data-act="accdel" data-v="'+esc(x.accId)+'" aria-label="刪除這行">✕</button>':'')+'</li>'}).join('')""")
rep("""    case 'accadd': dispatch('AC_COACH',{set:n,team:k}); ui.toast={t:'已加入記事：'+tName(s,k)+' 助理教練代理教練',until:Date.now()+3000}; break;""","""    case 'accadd': var abk=b.getAttribute('data-v')==='back'; dispatch('AC_COACH',{set:n,team:k,back:abk}); ui.toast={t:'已加入記事：'+tName(s,k)+(abk?' C 代 AC':' AC 代 C'),until:Date.now()+3000}; break;""")
rep("</style>",""".accx{min-height:0;width:30px;height:26px;padding:0;margin-left:4px;font-size:14px;line-height:1;border:1px solid #bbb;border-radius:6px;background:#fff;color:#a3211a;vertical-align:middle}
</style>""")
open(P,'w',encoding='utf8').write(s); print('ok')

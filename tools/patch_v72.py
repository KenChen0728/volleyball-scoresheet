#!/usr/bin/env python3
"""11/12 早上實際比賽（使用者 09:07）：沒有助理記錄員，卻把司線員填進了助理記錄員，找不到怎麼刪。
原本要先點那個角色，「清空」才會出現在打字框下面；已經排過的名字變灰不能點。
- 點到已經填好的角色，角色下面直接出現「角色：名字　[清空]」。
- 點已經排在別的角色的名字，直接搬過來（原本那格變空），上面寫「誰從哪裡改到哪裡」；打字填入也一樣，不會同一個人排兩個角色。
- 沒有選角色時點名字，請他先點角色（以前會自動填進第一個空的角色，例如沒有人的助理記錄員）。
- 這一頁的「其他場地的裁判」改成小按鈕，不是底線字。
用法：python3 tools/patch_v72.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function refLabel(' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 角色的全名（助理記錄員、司線員 1）
one("""function firstEmptyRole(s,after){""",
    """function refLabel(k){var r=REFS.filter(function(x){return x[0]===k})[0];return r?r[1]:''}
function firstEmptyRole(s,after){""")

# 名字：已經排過的也能點（搬過來），旁邊照樣標出排在哪裡
one("""  function chip(n){var u=used[n];return '<button class="refname'+(u?' used':'')+'" data-act="refname" data-v="'+esc(n)+'"'+(u?' disabled aria-label="'+esc(n)+' 已排'+REF_SHORT[u]+'"':'')+'>'+esc(n)+(u?'<i class="at">'+REF_SHORT[u]+'</i>':'')+'</button>'}""",
    """  function chip(n){var u=used[n],mine=!!u&&u===role;return '<button class="refname'+(u?' used':'')+(mine?' mine':'')+'" data-act="refname" data-v="'+esc(n)+'"'+(u?' aria-label="'+esc(n)+'，已排'+REF_SHORT[u]+(role&&!mine?'，點了改排'+REF_SHORT[role]:'')+'"':'')+'>'+esc(n)+(u?'<i class="at">'+REF_SHORT[u]+'</i>':'')+'</button>'}""")

# 「清空」從打字框下面搬到角色下面
one("""<button data-act="reftype">填入</button></div>'+(role&&String(i[role]||'').trim()?'<button class="linkbtn" data-act="refclear">清空「'+REF_SHORT[role]+'」</button>':'');""",
    """<button data-act="reftype">填入</button></div>';
  var selv=role?String(i[role]||'').trim():'',selbar=selv?'<div class="refsel"><span>'+esc(refLabel(role))+'：<b>'+esc(selv)+'</b></span><button data-act="refclear">清空</button></div>':'';""")
one("""  var msg=ui.refMsg?'<p class="warning" role="status">'+esc(ui.refMsg)+'</p>':'';""",
    """  var msg=(ui.refMsg?'<p class="warning" role="status">'+esc(ui.refMsg)+'</p>':'')+(ui.refNote?'<p class="good" role="status">'+esc(ui.refNote)+'</p>':'');""")
one("""  var body=roles+msg+list+oth+""", """  var body=roles+selbar+msg+list+oth+""")

# 點角色、點名字、清空
one("""    case 'refrole': var rv=b.getAttribute('data-v'); ui.refRole=ui.refRole===rv?null:rv; ui.refMsg=''; break;""",
    """    case 'refrole': var rv=b.getAttribute('data-v'); ui.refRole=ui.refRole===rv?null:rv; ui.refMsg=''; ui.refNote=''; break;""")
one("""      if(!rn)break;
      var rr=ui.refRole||firstEmptyRole(s);
      if(!rr){ui.refMsg='六個角色都填了，先點上面要改的角色';break}
      ui.refMsg='';dispatch('INFO_SET',{field:rr,value:rn});ui.refRole=firstEmptyRole(reduce(m.events),rr);break;
    case 'refclear': if(ui.refRole)dispatch('INFO_SET',{field:ui.refRole,value:''}); break;""",
    """      if(!rn)break;
      ui.refNote='';
      var rr=ui.refRole;
      if(!rr){ui.refMsg=firstEmptyRole(s)?'先點上面要填的角色':'六個角色都填了，先點上面要改的角色';break}
      ui.refMsg='';
      if(String(s.info[rr]||'').trim()===rn){ui.refRole=firstEmptyRole(s,rr);break}
      // 已經排在別的角色：搬過來，原本那格變空（同一個人不會排兩個角色）
      var rfrom=REFS.filter(function(x){return x[0]!==rr&&String(s.info[x[0]]||'').trim()===rn}).map(function(x){return x[0]})[0];
      if(rfrom){dispatch('INFO_SET',{field:rfrom,value:''});dispatch('INFO_SET',{field:rr,value:rn});ui.refNote=rn+' 從「'+refLabel(rfrom)+'」改到「'+refLabel(rr)+'」';ui.refRole=null;break}
      dispatch('INFO_SET',{field:rr,value:rn});ui.refRole=firstEmptyRole(reduce(m.events),rr);break;
    case 'refclear': if(ui.refRole)dispatch('INFO_SET',{field:ui.refRole,value:''}); ui.refMsg=''; ui.refNote=''; break;""")

# 樣式：角色下面的清空列；已排的名字可以點，不再是虛線灰框
one("""</style>""", """/* 11/12 裁判：清空放在角色下面；已排的名字點了會搬過來 */
.refsel{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 4px 4px 14px;border-radius:var(--rc);background:var(--panel);border:1px solid var(--line)}
.refsel span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;color:var(--muted)}
.refsel b{font-size:17px;color:var(--ink)}
.refsel button{flex:none;min-height:44px;padding:0 18px}
.refname.used{color:var(--ink);border:1px solid var(--line);background:var(--soft)}
.refname.mine{outline:2px solid var(--ink);outline-offset:-2px}
.refpick .linkbtn{text-decoration:none;align-self:flex-start;min-height:44px;padding:0 16px;border:0;border-radius:var(--rb);background:var(--btn);color:var(--btn-ink)}
</style>""")

# 說明
one("""先點角色，再點名字，填好會自動跳到下一個角色。這場已經排的人會變灰，標出角色。""",
    """先點角色，再點名字，填好會自動跳到下一個角色。排錯時點那個角色按「清空」；點已經排在別處的人，會直接搬過來。""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v72 ok')

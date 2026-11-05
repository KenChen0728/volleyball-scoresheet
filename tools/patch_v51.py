# v51：不能合法替補時直接給「改用例外替補」（使用者朋友 11/5 試用：這個位置已換回後找不到例外替補）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("""function sheetLibs(t){""","""function excAvail(s,k,idx){var lg=subOptions(s,k,idx,false);if(lg.err==='自由球員要先換回原本的球員')return false;if(lg.nos&&lg.nos.length)return false;var ex=subOptions(s,k,idx,true);return !!(ex.nos&&ex.nos.length)}
function sheetLibs(t){""")
rep("""    if(o.err)h='<div class="kphead"><span class="err">'+esc(o.err)+'</span></div>'+(o.legal?'<button class="full" data-act="excoff">改用一般替補</button>':'');
    else if(!o.nos.length)h='<div class="subhint">沒有可以上場的球員</div>';
    else h='<div class="subhint">'+now+' 號換下，上場：</div>""","""    var ea=!ui.sub.exc&&excAvail(s,k,ui.sub.idx),eb=ea?'<button class="full" data-act="forceexc">改用例外替補</button>':'';
    var en=ui.sub.exc&&!o.err?'<p class="excnote">被例外替補換下的人，本場比賽不能再上場</p>':'';
    if(o.err)h='<div class="kphead"><span class="err">'+esc(o.err)+'</span></div>'+(o.legal?'<button class="full" data-act="excoff">改用一般替補</button>':'')+eb;
    else if(!o.nos.length)h='<div class="subhint">沒有可以上場的球員</div>'+eb;
    else h=en+'<div class="subhint">'+now+' 號換下，上場：</div>""")
rep("""      var sOk=pOk&&pc.subRally[k]!==pc.rally;
      opts.push(""","""      var sOk=pOk&&pc.subRally[k]!==pc.rally;
      if(pOk&&excAvail(s,k,x.idx))opts.push('<button class="mbtn big" data-act="pmexc" data-team="'+k+'"><strong>例外替補：換下 '+pno+' 號</strong><small>不能一般替補時使用，換下的人本場不能再上場</small></button>');
      else opts.push(""")
rep("""    case 'pmsub':""","""    case 'pmexc': var pme=ui.sheet;ui.sheet=null;ui.lib=null;ui.sub={team:k,idx:pme.idx,exc:true,ids:[]};break;
    case 'pmsub':""")
rep("</style>",""".excnote{margin:6px 10px 0;font-weight:700;color:var(--bad);line-height:1.4}
</style>""")
open(P,'w',encoding='utf8').write(s);print('ok')

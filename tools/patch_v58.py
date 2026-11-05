# v58：點球員選單改成三顆短按鈕（換自由／替補／判罰），第二層在同一面板選號碼，點了直接換好（使用者 11/5）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
i=s.index("  }else if(x.type==='pmenu'){"); j=s.index("  }else if(x.type==='points'){")
s=s[:i]+r"""  }else if(x.type==='pmenu'){
    var pc=s.sets[s.setNo],pno=pc.cur[k][x.idx],pL=t.liberos.indexOf(pno)>=0,pOk=canPause(pc),lOk=canLib(pc,k);
    var free=t.liberos.filter(function(q){return pc.cur[k].indexOf(q)<0&&pc.expelled[k].indexOf(q)<0&&s.matchOut[k].indexOf(q)<0});
    var back=x.pos===4||x.pos===5||(x.pos===0&&pc.serving!==k),penOk=sanGone(s,k,pno)!=='D';
    var chip=function(act,q,extra){return '<button class="chip '+k+'" data-act="'+act+'" data-team="'+k+'" data-no="'+q+'"'+(extra||'')+'><b>'+q+'</b></button>'};
    var big=function(act,label,ok,extra){return '<button class="pmb" data-act="'+act+'" data-team="'+k+'"'+(extra||'')+(ok?'':' disabled')+'>'+label+'</button>'};
    var head='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> '+pno+' 號'+(pL?'（自由）':'')+'</h2>';
    var lg=subOptions(s,k,x.idx,false),lgN=(lg.nos||[]),sOk=pOk&&pc.subRally[k]!==pc.rally&&lgN.length>0,eOk=pOk&&excAvail(s,k,x.idx);
    if(x.step){
      var list='';
      if(x.step==='lib')list=free.map(function(q){return chip('pmlin',q)}).join('');
      else if(x.step==='swap')list=free.map(function(q){return chip('pmlswap',q)}).join('');
      else if(x.step==='sub')list=lgN.map(function(q){return chip('pmsubin',q)}).join('');
      else if(x.step==='exc')list=(subOptions(s,k,x.idx,true).nos||[]).map(function(q){return chip('pmsubin',q,' data-exc="1"')}).join('');
      h=head+(x.step==='exc'?'<p class="excnote">被例外替補換下的人，本場比賽不能再上場</p>':'')+'<p class="subhint">'+({lib:'自由球員上場',swap:'換成哪一位自由',sub:pno+' 號換下，上場：',exc:pno+' 號例外替補，上場：'}[x.step])+'</p><div class="bench"><div class="benchrow">'+list+'</div></div>'+
        (x.step==='exc'?'<button class="ghost" data-act="pminj" aria-pressed="'+!!x.inj+'">'+(x.inj?'☑':'☐')+' 宣告受傷</button>':'')+'<button data-act="pmback">返回</button>';
    }else if(pL){
      h=head+'<div class="pm3">'+big('pmlout','換回',lOk&&!!pc.libOut[k])+big(free.length===1?'pmlswap':'pmstep','換自由',lOk&&free.length>0,free.length===1?' data-no="'+free[0]+'"':' data-v="swap"')+big('pmpen','判罰',penOk,' data-no="'+pno+'"')+'</div>'+
        '<button class="linkbtn" data-act="redopen" data-team="'+k+'">不能繼續：重新指定自由球員</button><button data-act="close">關閉</button>';
    }else{
      var lAv=!pc.libOut[k]&&back&&free.length>0&&lOk;
      h=head+'<div class="pm3">'+big(free.length===1?'pmlin':'pmstep','換自由',lAv,free.length===1?' data-no="'+free[0]+'"':' data-v="lib"')+
        big('pmstep',!sOk&&eOk?'例外替補':'替補',sOk||eOk,' data-v="'+(sOk?'sub':'exc')+'"')+big('pmpen','判罰',penOk,' data-no="'+pno+'"')+'</div><button data-act="close">關閉</button>';
    }
"""+s[j:]
rep("""    case 'pmexc':""","""    case 'pmstep': ui.sheet.step=b.getAttribute('data-v'); ui.sheet.inj=ui.sheet.step==='exc'; break;
    case 'pmback': ui.sheet.step=null; break;
    case 'pminj': ui.sheet.inj=!ui.sheet.inj; break;
    case 'pmsubin': var psx=ui.sheet,pex=b.getAttribute('data-exc')==='1',pout=c.cur[k][psx.idx];ui.sheet=null;ui.lib=null;ui.sub=null;
      dispatch('SUB',{set:n,team:k,idx:psx.idx,out:pout,in:no,exc:pex,injury:pex&&!!psx.inj});ui.toast={t:(pex?'例外替補：':'替補：')+pout+' 號換 '+no+' 號',until:Date.now()+3000};break;
    case 'pmexc':""")
rep("</style>","""/* v58 點球員選單 */
.pm3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pmb{min-height:64px;font-size:19px;font-weight:800}
.pmb:disabled{opacity:.4}
</style>""")
rep("var SHEET_DISMISS=['[data-act=close]',","var SHEET_DISMISS=['[data-act=close]','[data-act=pmback]',")
open(P,'w',encoding='utf8').write(s);print('ok')

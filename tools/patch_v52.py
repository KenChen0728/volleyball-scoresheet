# v52（11/5 晚，使用者同意）：傷停依規則分流、灰按鈕點了說明、點球員可判罰、自由球員重新指定入口、第 3 局記錄表（換場前分數直線、打勾位置、比分左右置中）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
# 1. 傷停：先點受傷的人，系統依序 合法替補 → 例外替補 → 傷停 → 陣容不完整（規則 17.1）
i=s.index("  }else if(p.kind==='INJ'){"); j=s.index("  }else if(p.kind==='LOG'){")
s=s[:i]+"""  }else if(p.kind==='INJ'){
    var used=s.injuries.filter(function(i){return i.team===k}).map(function(i){return i.no});
    h='<h2>傷停</h2>'+teams+'<p class="muted">點受傷的球員。能替補就先替補，不能替補才傷停 3 分鐘（規則 17.1）。</p><div class="bench"><div class="benchrow">'+c.cur[k].map(function(no){var u=used.indexOf(no)>=0;return '<button class="chip '+k+'" data-act="injpick" data-team="'+k+'" data-no="'+no+'"><b>'+no+'</b>'+(u?'<small>已傷停</small>':t.liberos.indexOf(no)>=0?'<small>自由</small>':'')+'</button>'}).join('')+'</div></div><button data-act="penclose">關閉</button>';
"""+s[j:]
rep("""    case 'injpick':
      dispatch('INJURY',{set:n,team:k,no:no}); ui.pen=null;""","""    case 'injpick':
      var ii=c.cur[k].indexOf(no);
      if(s.teams[k].liberos.indexOf(no)>=0){ui.pen=null;ui.sheet={type:'pmenu',team:k,idx:ii,pos:5};ui.toast={t:'自由球員受傷：換回原球員，或重新指定自由球員',until:Date.now()+3500};break}
      var ilg=subOptions(s,k,ii,false);
      if(ilg.nos&&ilg.nos.length){ui.pen=null;ui.sub={team:k,idx:ii,exc:false,ids:[]};ui.toast={t:no+' 號可以合法替補，請選上場的人',until:Date.now()+3500};break}
      if(excAvail(s,k,ii)){ui.pen=null;ui.sub={team:k,idx:ii,exc:true,ids:[],inj:true};ui.toast={t:no+' 號不能合法替補，改用例外替補',until:Date.now()+3500};break}
      if(s.injuries.some(function(q){return q.team===k&&q.no===no})){ui.pen={team:k,kind:'INC',resume:null};ui.toast={t:no+' 號整場已傷停過一次，又沒人可換，只能判陣容不完整',until:Date.now()+4000};break}
      dispatch('INJURY',{set:n,team:k,no:no}); ui.pen=null;""")
# 2. 灰掉的暫停、替補：點了說明原因（不自動記不當請求）
rep("""  return '<button data-act="timeout" data-team="'+k+'"'+(ok&&c.timeouts[k].length<2?'':' disabled')+'>暫停 <b>'+c.timeouts[k].length+'</b></button><button data-act="subopen" data-team="'+k+'"'+(ok&&c.subRally[k]!==c.rally?'':' disabled')+'>替補 <b>'+c.subCount[k]+'</b></button>'""",
"""  var tw=c.live?'球在進行中，得分後才能暫停':c.timeouts[k].length>=2?'這局 2 次暫停已用完，請告知二裁':'',sw2=c.live?'球在進行中，得分後才能替補':c.subRally[k]===c.rally?'這次死球已換過人，打完一球才能再換':'';
  return '<button data-act="'+(tw?'why':'timeout')+'" data-team="'+k+'"'+(tw?' class="dim" aria-disabled="true" data-v="'+tw+'"':'')+'>暫停 <b>'+c.timeouts[k].length+'</b></button><button data-act="'+(sw2?'why':'subopen')+'" data-team="'+k+'"'+(sw2?' class="dim" aria-disabled="true" data-v="'+sw2+'"':'')+'>替補 <b>'+c.subCount[k]+'</b></button>'""")
rep("""    case 'pmexc':""","""    case 'why': ui.toast={t:b.getAttribute('data-v'),until:Date.now()+3000}; break;
    case 'pmpen': var pmp=ui.sheet;ui.sheet=null;ui.lib=null;ui.sub=null;ui.pen={team:k,kind:null,who:no}; break;
    case 'libaway': ui.sheet={type:'libaway',team:k,no:no}; break;
    case 'pmexc':""")
# 3. 點球員選單：判罰這位；自由球員可重新指定
rep("""    if(pL){""","""    var penB=sanGone(s,k,pno)==='D'?'':'<button class="mbtn big" data-act="pmpen" data-team="'+k+'" data-no="'+pno+'"><strong>判罰 '+pno+' 號</strong><small>選警告、懲罰、出局或出場</small></button>';
    if(pL){""")
rep("""      if(!lOk)why='自由球員剛換過，要隔一球才能再換。';
    }else{""","""      opts.push('<button class="mbtn big" data-act="redopen" data-team="'+k+'"><strong>不能繼續：重新指定自由球員</strong><small>受傷、生病或被判離場時</small></button>');
      if(!lOk)why='自由球員剛換過，要隔一球才能再換。';
    }else{""")
rep("""    h='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> '+pno+' 號'""","""    opts.push(penB);
    h='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> '+pno+' 號'""")
# 判罰：已選好對象時直接選牌
rep("""    case 'penkind': ui.pen={team:k,kind:b.getAttribute('data-v'),resume:ui.sub}; ui.sub=null; break;""","""    case 'penkind': var pwh=ui.pen&&ui.pen.who,pkv=b.getAttribute('data-v'); ui.pen={team:k,kind:pkv,resume:ui.sub}; ui.sub=null; if(pwh!=null&&'WPED'.indexOf(pkv)>=0){ui.pen.who=pwh;ui.pen.ok={kind:pkv,who:pwh}} break;""")
rep("""    case 'penno': ui.pen.ok=null; break;""","""    case 'penno': ui.pen.ok=null; if(ui.pen.who!=null)ui.pen.kind=null; break;""")
rep("""    var ir=cnt('IR'),dw=cnt('DW'),yw=cnt('W');
    h='<h2>判罰</h2>""","""    var ir=cnt('IR'),dw=cnt('DW'),yw=cnt('W');
    if(p.who!=null){var pg=sanGone(s,k,p.who);
      h='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> '+p.who+' 號 判罰</h2><p class="muted">照裁判的判決點選。'+(pg==='E'?'這局已出局，只能再判出場。':'')+'</p><div class="pk3 four"><button class="yl" data-act="penkind" data-team="'+k+'" data-v="W"'+(yw||pg?' disabled':'')+'><span class="ic"><i class="cd cy"></i></span>黃牌警告'+(yw?'（已用）':'')+'</button><button class="rd" data-act="penkind" data-team="'+k+'" data-v="P"'+(pg?' disabled':'')+'><span class="ic"><i class="cd cr"></i></span>紅牌懲罰</button><button class="rd" data-act="penkind" data-team="'+k+'" data-v="E"'+(pg?' disabled':'')+'><span class="ic same"><i class="cd cy"></i><i class="cd cr"></i></span>出局<small>一手舉兩張</small></button><button class="rd" data-act="penkind" data-team="'+k+'" data-v="D"><span class="ic apart"><i class="cd cy"></i><i class="cd cr"></i></span>出場<small>兩手各一張</small></button></div><button data-act="penclose">取消</button>';
      return '<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true">'+h+'</div>';}
    h='<h2>判罰</h2>""")
# 4. L 格「不能上」：點了說明原因，沒有自由可用時可重新指定
rep("""    if(gone){sm='不能上';dis=true;cls=' away'}""","""    if(gone){sm='不能上';act='libaway';cls=' away'}""")
rep("""  if(x.type==='pmenu'){""","""  if(x.type==='libaway'){
    var ac=s.sets[s.setNo],aE=ac.expelled[k].indexOf(x.no)>=0,aFree=t.liberos.filter(function(q){return ac.cur[k].indexOf(q)<0&&ac.expelled[k].indexOf(q)<0&&s.matchOut[k].indexOf(q)<0});
    h='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 自由球員 '+x.no+' 號不能上</h2><p class="muted">'+(aE?'這局被判出局，下一局可以再上。':'本場不能再上（被判出場、受傷或已重新指定）。')+'</p>'+(!aFree.length&&!aE?'<button class="mbtn big" data-act="redopen" data-team="'+k+'"><strong>重新指定自由球員</strong><small>這隊目前沒有自由球員可以上</small></button>':'')+'<button data-act="close">關閉</button>';
  }else if(x.type==='pmenu'){""")
# 5. 記錄表：比分左右置中、第 3 局換場前分數畫直線、窄格的打勾不壓到小數字
rep("""function svBlank(){""","""function svSc(x,w,y,v,fs,col){var p=String(v).split(':');if(p.length!==2||p[0]===''||p[1]==='')return svT(x,y,v,fs,col);var q=w/4+fs*.12;return svT(x-q,y,p[0],fs,col)+svT(x,y,':',fs,col)+svT(x+q,y,p[1],fs,col)}
function svBlank(){""")
rep("""    h+=svT(mid,y0+hr*3.5,a?a.score:':',o.tfs||21,a?INK:'#000');
    h+=svT(mid,y0+hr*4.5,b?b.score:':',o.tfs||21,b?INK:'#000');""","""    h+=svSc(mid,cw,y0+hr*3.5,a?a.score:':',o.tfs||21,a?INK:'#000');
    h+=svSc(mid,cw,y0+hr*4.5,b?b.score:':',o.tfs||21,b?INK:'#000');""")
rep("""h+=svT(px+pw/2,ty+th*(q+1.5),v||':',v?(pw<90?20:27):20,v?INK:'#000')""","""h+=svSc(px+pw/2,pw,ty+th*(q+1.5),v||':',v?(pw<90?20:27):20,v?INK:'#000')""")
rep("""      [0,1].forEach(function(hf){var b0=hf*rots+r;h+=svT(cx+boxW*(hf+1)-3,yr+r*hr+7,b0+1,9,'#000',400,'end')})}""","""      [0,1].forEach(function(hf){var b0=hf*rots+r;h+=svT(cx+boxW*(hf+1)-(boxW<30?2:3),yr+r*hr+(boxW<30?6:7),b0+1,boxW<30?7.5:9,'#000',400,'end')})}""")
rep("""      if(v!=='X')h+=svT(bx+5,by+7,'✓',11,INK);""","""      if(v!=='X')h+=boxW<30?svT(bx+5,by+7,'✓',9,INK):svT(bx+5,by+7,'✓',11,INK);""")
rep("""h+=svT(cx+boxW*Math.floor(b1/rots)+5,yr+(b1%rots)*hr+7,'✓',11,INK)}""","""h+=svT(cx+boxW*Math.floor(b1/rots)+5,yr+(b1%rots)*hr+7,'✓',boxW<30?9:11,INK)}""")
rep("""    if(ci)h+=svL(cl,y0,cl,y0+pH,.8);""","""    if(o.pre){var pf=Math.max(q[0],1),pt=Math.min(q[1],o.pre);if(pf<=pt)h+=svL(cl+colW/2,y0+rh*(pf-q[0])+2,cl+colW/2,y0+rh*(pt-q[0]+1)-2,1.8,INK)}
    if(ci)h+=svL(cl,y0,cl,y0+pH,.8);""")
rep("""cols:cols3,m:sw?[sw.score[A]+1,c.score[A]]:null,hg:!!sw}));""","""cols:cols3,m:sw?[sw.score[A]+1,c.score[A]]:null,pre:sw?sw.score[A]:0,hg:!!sw}));""")
rep("</style>","""button.dim{opacity:.45}
</style>""")
open(P,'w',encoding='utf8').write(s);print('ok')

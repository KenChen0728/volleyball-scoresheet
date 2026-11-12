# 11/13 凌晨討論的 1～6 項（使用者授權直接做完上線）：
# 1. 0:0 不能暫停（比賽畫面、補記、修正比分）
# 2. 修正比分不能改到局已經結束的最後一分
# 3. 記事欄改成「寫哪一隊，就那一隊的分數在前」；「申訴、其他」每隊一顆
# 4. 同一次死球換第二組替補：不鎖住，先問「是一起到替補區的嗎？」（學校版沒有這個限制）
# 5. 球場格子的羅馬數字跟著格子大小，量到碰到號碼就再縮
# 6. 首頁卡片可以刪除，刪掉的放「最近刪除」30 天；練習比賽改成「重新開始」
# 用法：python3 tools/patch_v82.py（改原始檔、學校版的 patches.txt、patches-nosheet.txt、help.json）
import json

SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
SCH = '/home/claude/volleyball-scoresheet/tools/school/'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'REQ_ONCE' not in t, 'already'

# ---------- 共用常數、最近刪除的資料 ----------
t = one(t, "var MAX_PLAYERS=12, MAX_LIBEROS=2, MIN_ON_COURT=6;",
        "var MAX_PLAYERS=12, MAX_LIBEROS=2, MIN_ON_COURT=6;\n"
        "var REQ_ONCE=true;  // 同一次死球只能請求一次替補（規則 15.2.2），要再換先問是不是一起到替補區（15.10.4）\n"
        "var TRASH_DAYS=30;  // 刪除的比賽在「最近刪除」留幾天")
t = one(t, "if(!Array.isArray(db.cups))db.cups=[]; // 舊資料沒有資料夾，比賽內容不動",
        "if(!Array.isArray(db.cups))db.cups=[]; // 舊資料沒有資料夾，比賽內容不動\n"
        "if(!Array.isArray(db.trash))db.trash=[]; // 11/13 最近刪除：刪除的比賽先放這裡（帶 deletedAt），30 天後自動清掉\n"
        "db.trash=db.trash.filter(function(x){return x&&Date.now()-new Date(x.deletedAt).getTime()<TRASH_DAYS*864e5});")

# ---------- 4. 同一次死球的替補：記下這次請求換了哪幾組 ----------
t = one(t, "if(!d.exc)sb.subRally[d.team]=sb.rally;",
        "if(!d.exc){var rq=sb.reqSubs||(sb.reqSubs={t1:[],t2:[]});if(sb.subRally[d.team]!==sb.rally)rq[d.team]=[];rq[d.team].push({id:ev.id,t:d.out+' 換 '+d.in});sb.subRally[d.team]=sb.rally}")
t = one(t, "function doSub(ix,no){\n  var m=current(),st=reduce(m.events),n=st.setNo,c=st.sets[n],k=ui.sub.team;\n"
           "  dispatch('SUB',{set:n,team:k,idx:ix,out:c.cur[k][ix],in:no,exc:ui.sub.exc,injury:!!(ui.sub.exc&&ui.sub.inj)});\n",
        "/* 11/13 同一次死球已經換過人：回傳這次請求換過的幾組，要再換先問是不是一起到替補區。學校版 REQ_ONCE=false，不問 */\n"
        "function sameReq(c,k){if(!REQ_ONCE||!c||c.subRally[k]!==c.rally)return null;var l=c.reqSubs&&c.reqSubs[k];return l&&l.length?l:null}\n"
        "function reqIds(k){var m=current(),st=reduce(m.events),c=st.sets[st.setNo];return (c.reqSubs&&c.reqSubs[k]||[]).map(function(q){return q.id})}\n"
        "function doSub(ix,no){\n  var m=current(),st=reduce(m.events),n=st.setNo,c=st.sets[n],k=ui.sub.team;\n"
        "  var sd={set:n,team:k,idx:ix,out:c.cur[k][ix],in:no,exc:ui.sub.exc,injury:!!(ui.sub.exc&&ui.sub.inj)};if(ui.sub.same&&!ui.sub.exc)sd.same=true;dispatch('SUB',sd);\n")

# ---------- 1. 暫停鈕：0:0 不能暫停；4. 替補鈕不再鎖住 ----------
t = one(t, "var tw=c.live?'球在進行中，得分後才能暫停':c.timeouts[k].length>=2?'這局 2 次暫停已用完，請告知二裁':'',"
           "sw2=c.live?'球在進行中，得分後才能替補':c.subRally[k]===c.rally?'這次死球已換過人，打完一球才能再換':'';",
        "var tw=c.live?'球在進行中，得分後才能暫停':c.rally===0?'這局還沒開始，0:0 不能暫停':c.timeouts[k].length>=2?'這局 2 次暫停已用完，請告知二裁':'',"
        "sw2=c.live?'球在進行中，得分後才能替補':'';")
t = one(t, "sOk=pOk&&pc.subRally[k]!==pc.rally&&lgN.length>0,eOk=", "sOk=pOk&&lgN.length>0,eOk=")
t = one(t, "  var subDone=[L,R].filter(function(k){return c.subRally[k]===c.rally&&c.rally>0})[0];\n", "")
t = one(t, "subDone?tName(s,subDone)+' 這次已替補過，打完下一球才能再替補':", "")

# 確認視窗
t = one(t, "  }else if(x.type==='pmenu'){\n",
        "  }else if(x.type==='samereq'){ // 11/13 同一次死球要再換：先問是不是一起到替補區\n"
        "    var rq=sameReq(s.sets[s.setNo],k)||[],rqt=rq.map(function(q){return q.t}).join('、');\n"
        "    if(x.pm)stepBack='<button class=\"sheetback\" data-act=\"srback\">‹ 返回</button>';\n"
        "    h=x.no?'<h2><span class=\"tpill '+k+'\">'+esc(tName(s,k))+'</span> 這次不能再換</h2><p class=\"subhint\">同一次死球不能再請求替補，要打完下一球才能再換。</p><p class=\"muted\">裁判判不當請求時，到「判罰」記。</p><button data-act=\"close\">知道了</button>'\n"
        "      :'<h2><span class=\"tpill '+k+'\">'+esc(tName(s,k))+'</span> 這次已經換過人</h2><p class=\"subhint\">要換的人'+(rqt?'和剛剛的 <b>'+esc(rqt)+'</b>，':'')+'是一起到替補區的嗎？</p><p class=\"muted\">一起到替補區的算同一次請求，可以一起換。</p><div class=\"row\"><button data-act=\"srno\">不是</button><button class=\"go\" data-act=\"sryes\">是，一起換</button></div>';\n"
        "  }else if(x.type==='pmenu'){\n")
# 點球員 → 替補；替補鈕
t = one(t, "    case 'pmstep': ui.sheet.step=b.getAttribute('data-v'); ui.sheet.inj=ui.sheet.step==='exc'; break;",
        "    case 'pmstep': var pmv=b.getAttribute('data-v'); if(pmv==='sub'&&!ui.sheet.same&&sameReq(c,k)){ui.sheet={type:'samereq',team:k,pm:ui.sheet};break} ui.sheet.step=pmv; ui.sheet.inj=pmv==='exc'; break;\n"
        "    case 'sryes': var srx=ui.sheet; if(srx.pm){ui.sheet=srx.pm;ui.sheet.step='sub';ui.sheet.inj=false;ui.sheet.same=true}else{ui.sheet=null;ui.lib=null;ui.sub={team:srx.team,idx:null,exc:false,ids:[],same:true}} break;\n"
        "    case 'srno': ui.sheet.no=true; break;\n"
        "    case 'srback': ui.sheet=ui.sheet.pm; break;")
t = one(t, "      dispatch('SUB',{set:n,team:k,idx:psx.idx,out:pout,in:no,exc:pex,injury:pex&&!!psx.inj});scNoteSet();break;",
        "      var psd={set:n,team:k,idx:psx.idx,out:pout,in:no,exc:pex,injury:pex&&!!psx.inj};if(psx.same&&!pex)psd.same=true;dispatch('SUB',psd);scNoteSet(psd.same?reqIds(k):null);break;")
t = one(t, "    case 'subopen': ui.sheet=null; ui.lib=null; ui.sub={team:k,idx:null,exc:b.getAttribute('data-m')==='exc',ids:[]}; break;",
        "    case 'subopen': var sxo=b.getAttribute('data-m')==='exc'; ui.lib=null; if(!sxo&&sameReq(c,k)){ui.sub=null;ui.sheet={type:'samereq',team:k};break} ui.sheet=null; ui.sub={team:k,idx:null,exc:sxo,ids:[]}; break;")

# ---------- 1. 補記、修正比分：0:0 不能暫停；2. 修正比分擋最後一分 ----------
t = one(t, "      if(ix.kind==='S'){ix.anc=ia;break}\n",
        "      if(ix.kind==='S'){ix.anc=ia;break}\n      if(inn[0]+inn[1]===0){ix.err='這局還沒開始，0:0 不能暫停。';break}\n")
t = one(t, "  if(n>path.length||path.slice(0,n).filter(function(q){return q==='t1'}).length!==t1)return '這局沒有出現過 '+own+':'+opp+' 這個比分，只能改成這局已經打過的比分。';",
        "  if(n>path.length||path.slice(0,n).filter(function(q){return q==='t1'}).length!==t1)return '這局沒有出現過 '+own+':'+opp+' 這個比分，只能改成這局已經打過的比分。';\n"
        "  if(e.kind==='T'&&n===0)return '這局還沒開始，0:0 不能暫停。';\n"
        "  if(n===path.length&&(c.ended||(s.setNo===e.set&&setWinner(s))))return own+':'+opp+' 是這局最後一分，局已經打完，不能改到這裡。';")

# ---------- 3. 記事欄：寫哪一隊，就那一隊的分數在前 ----------
t = one(t, "  /* 記事欄的句子照使用者常寫的寫法（11/7）：用 A 隊、B 隊；比分一律 A:B 在前 */\n",
        "  /* 記事欄的句子（11/13 使用者）：用 A 隊、B 隊；寫哪一隊，比分就是那一隊在前，例如「第 1 局 B 隊 3:2 請求 AC 代 C」。\n"
        "     比分後面接號碼時加逗號，免得「5:3 7 號」看混。取代 11/7 的「比分一律 A:B 在前」 */\n")
t = one(t, "  function sc(r){return A==='t1'?r.t1+':'+r.t2:r.t2+':'+r.t1}\n  function ab(n,r){return '第 '+n+' 局 A:B '+sc(r)+'，'}\n  function L(k){return k===A?'A 隊':'B 隊'}\n",
        "  function L(k){return k===A?'A 隊':'B 隊'}\n  function at(n,k,r){return '第 '+n+' 局 '+L(k)+' '+r[k]+':'+r[other(k)]}\n")
t = one(t, "if(x.exc){var p=x.score.split(':');notes.push(ab(n,{t1:p[0],t2:p[1]})+L(k)+' '+x.out+' 號受傷，由 '+x.in+' 號例外替補')}",
        "if(x.exc){var p=x.score.split(':');notes.push(at(n,k,{t1:p[0],t2:p[1]})+'，'+x.out+' 號受傷，由 '+x.in+' 號例外替補')}")
t = one(t, "notes.push(ab(x.set,x.raw)+L(x.team)+'自由球員 '+x.old+' 號不能繼續比賽'",
        "notes.push(at(x.set,x.team,x.raw)+'，自由球員 '+x.old+' 號不能繼續比賽'")
t = one(t, "notes.push(ab(x.set,x.raw)+L(x.team)+' '+x.no+' 號受傷暫停比賽')",
        "notes.push(at(x.set,x.team,x.raw)+'，'+x.no+' 號受傷暫停比賽')")
t = one(t, "new String(ab(x.set,x.raw)+L(x.team)+'請求 '+(x.back?'C 代 AC':'AC 代 C'))",
        "new String(at(x.set,x.team,x.raw)+' 請求 '+(x.back?'C 代 AC':'AC 代 C'))")
t = one(t, "notes.push(ab(ii.set,ii.raw)+'因 '+L(il)+'陣容不完整，由 '+L(iw)+",
        "notes.push(at(ii.set,il,ii.raw)+' 陣容不完整，由 '+L(iw)+")
# 申訴、其他：每隊一顆，帶入「第 1 局 B 隊 3:2，」
t = one(t, "+'<button class=\"qn\" data-act=\"rmscore\">申訴、其他<br>帶入比分</button></div>';",
        "+[A,other(A)].map(function(k){return '<button class=\"qn '+k+'\" data-act=\"rmscore\" data-team=\"'+k+'\">'+esc(tName(s,k))+'<br>申訴、其他</button>'}).join('')+'</div>';")
t = one(t, "    case 'rmscore': var rc=s.sets[s.setNo],rA=s.sets[1].left||'t1',rr=String(s.info.remarks||'').replace(/\\s+$/,''); dispatch('INFO_SET',{field:'remarks',value:(rr?rr+'\\n':'')+'第 '+s.setNo+' 局 A:B '+rc.score[rA]+':'+rc.score[other(rA)]+'，'}); ui.focusRemarks=true; break;",
        "    case 'rmscore': var rc=s.sets[s.setNo],rA=s.sets[1].left||'t1',rk=k||rA,rr=String(s.info.remarks||'').replace(/\\s+$/,''); dispatch('INFO_SET',{field:'remarks',value:(rr?rr+'\\n':'')+'第 '+s.setNo+' 局 '+(rk===rA?'A 隊':'B 隊')+' '+rc.score[rk]+':'+rc.score[other(rk)]+'，'}); ui.focusRemarks=true; break;")

# ---------- 5. 羅馬數字：跟著格子大小，量到碰到號碼就再縮 ----------
t = one(t, "    if(want>sz[i][2]+1){bs[i].style.fontSize=Math.round(want)+'px';bs[i].parentNode.style.setProperty('--k',Math.min(want/sz[i][2],1.7).toFixed(2))}}\n}\n",
        "    if(want>sz[i][2]+1){bs[i].style.fontSize=Math.round(want)+'px';bs[i].parentNode.style.setProperty('--k',Math.min(want/sz[i][2],1.7).toFixed(2))}}\n"
        "  /* 11/13 使用者：手機直拿時羅馬數字（VI）跟兩位數號碼（14）連在一起。羅馬數字原本跟著螢幕高度放大，改成最多格子短邊的 0.26 倍；\n"
        "     再量一次，碰到號碼（隊長圈照圓形算）就再縮，最小 11px。平板、電腦格子大，維持原本大小 */\n"
        "  var ps=app.querySelectorAll('.pcourt .pc .pos');\n"
        "  for(i=0;i<ps.length;i++)ps[i].style.fontSize='';\n"
        "  for(i=0;i<ps.length;i++){var p=ps[i],cl=p.parentNode,nb=cl.querySelector('b');if(!cl.clientWidth||!cl.clientHeight)continue;\n"
        "    var pcs=getComputedStyle(p),f0=parseFloat(pcs.fontSize),f=Math.max(11,Math.min(f0,Math.round(0.26*Math.min(cl.clientWidth,cl.clientHeight))));\n"
        "    if(f!==f0)p.style.fontSize=f+'px';\n"
        "    if(!nb)continue;\n"
        "    var pr=p.getBoundingClientRect(),br=nb.getBoundingClientRect(),circ=nb.classList.contains('circ'),fs=parseFloat(getComputedStyle(nb).fontSize),onR=pcs.left==='auto';\n"
        "    var cx=br.left+br.width/2,cy=br.top+br.height/2,rad=fs*0.75+2,g=f;\n"
        "    while(g>11){var r=g/f,w2=pr.width*r,h2=pr.height*r,L2=onR?pr.right-w2:pr.left,R2=L2+w2,T2=pr.top,B2=T2+h2,hit;\n"
        "      if(circ){var qx=Math.max(L2,Math.min(cx,R2)),qy=Math.max(T2,Math.min(cy,B2));hit=(qx-cx)*(qx-cx)+(qy-cy)*(qy-cy)<rad*rad}\n"
        "      else hit=R2>br.left-2&&L2<br.right+2&&B2>br.top-2&&T2<br.bottom+2;\n"
        "      if(!hit)break;g--}\n"
        "    if(g!==f)p.style.fontSize=g+'px'}\n"
        "}\n")

# ---------- 6. 最近刪除、首頁刪除、練習重新開始 ----------
TRASH_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/></svg>'
AGAIN_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>'
t = one(t, "function resumeRow(m,s){\n  var T=matchTitle(s),c=s.sets[s.setNo],started=s.sets[1].started;\n"
           "  if(ui.delMatch===m.id)return '<div class=\"rrow ask\"><span>刪除「'+esc(T[0])+' 對 '+esc(T[1])+'」？這場的紀錄會消失。</span><div class=\"row\"><button data-act=\"del-no\">取消</button><button class=\"danger\" data-act=\"del-yes\" data-id=\"'+esc(m.id)+'\">確定刪除</button></div></div>';\n"
           "  return '<div class=\"rrow\"><button class=\"rmain\"",
        "var TRASH_IC='" + TRASH_IC + "',AGAIN_IC='" + AGAIN_IC + "';\n"
        "/* 11/13 首頁的進行中卡片：右上角「刪除」（移到最近刪除），練習比賽是「重新開始」 */\n"
        "function resumeRow(m,s){\n  var T=matchTitle(s),c=s.sets[s.setNo],started=s.sets[1].started,smp=!!s.info.sample;\n"
        "  if(ui.delMatch===m.id)return '<div class=\"rrow ask\"><span>'+(smp?'重新開始練習？這場練習會清掉，換成一場新的。':'刪除「'+esc(T[0])+' 對 '+esc(T[1])+'」？會移到「紀錄與名單」最下面的「最近刪除」，'+TRASH_DAYS+' 天內可以救回。'+(backedUp(m)?'':'這場還沒備份。'))+'</span><div class=\"row\"><button data-act=\"del-no\">取消</button><button data-act=\"'+(smp?'smpnew':'del-yes')+'\" data-id=\"'+esc(m.id)+'\">'+(smp?'重新開始':'刪除')+'</button></div></div>';\n"
        "  return '<div class=\"rrow hasdel\"><button class=\"rmain\"")
t = one(t, "'<em>'+(started?'繼續記錄':'繼續準備')+'</em></button></div>';",
        "'<em>'+(started?'繼續記錄':'繼續準備')+'</em></button><button class=\"rcdel\" data-act=\"del-ask\" data-id=\"'+esc(m.id)+'\">'+(smp?AGAIN_IC+'重新開始':TRASH_IC+'刪除')+'</button></div>';")
t = one(t, "  if(ui.delMatch===m.id)return '<div class=\"rrow ask\"><span>刪除這場資料有問題的比賽？</span><div class=\"row\"><button data-act=\"del-no\">取消</button><button class=\"danger\" data-act=\"del-yes\"",
        "  if(ui.delMatch===m.id)return '<div class=\"rrow ask\"><span>刪除這場資料有問題的比賽？會移到「紀錄與名單」最下面的「最近刪除」。</span><div class=\"row\"><button data-act=\"del-no\">取消</button><button data-act=\"del-yes\"")
t = one(t, "    h='<h2>刪除這場比賽？</h2><p class=\"muted\">記錄表會一起消失，無法復原。要保留的話先下載備份。</p><div class=\"row\"><button data-act=\"close\">取消</button><button class=\"danger\" data-act=\"del-yes\"",
        "    h='<h2>刪除這場比賽？</h2><p class=\"muted\">會移到「紀錄與名單」最下面的「最近刪除」，'+TRASH_DAYS+' 天內可以救回。</p><div class=\"row\"><button data-act=\"close\">取消</button><button data-act=\"del-yes\"")
t = one(t, "<button class=\"linkbtn dangerlink\" data-act=\"sheet\" data-v=\"delmatch\">刪除這場比賽</button>",
        "<button class=\"minibtn\" data-act=\"sheet\" data-v=\"delmatch\">'+TRASH_IC+'刪除這場比賽</button>")
t = one(t, "    case 'del-yes':\n      var id=b.getAttribute('data-id');\n      db.matches=db.matches.filter(function(x){return x.id!==id});\n      if(db.currentId===id)db.currentId=null;\n"
           "      ui.delMatch=null; ui.sheet=null; if(view==='setup')view=ui.from==='history'?'history':ui.from==='cup'?'cup':'home'; save(); break;\n",
        "    case 'del-yes':\n      var id=b.getAttribute('data-id'),dsm=db.matches.filter(function(x){return x.id===id})[0],dss=dsm&&safeReduce(dsm),dsp=!!(dss&&dss.info.sample);\n      trashMatches([id]);\n"
        "      ui.delMatch=null; ui.sheet=null; if(view==='setup')view=ui.from==='history'?'history':ui.from==='cup'?'cup':'home';\n"
        "      if(view==='history')ui.selMsg=dsp?'已刪除練習比賽':'已移到這一頁最下面的「最近刪除」，'+TRASH_DAYS+' 天內可以救回'; else homeNote={t:dsp?'已刪除練習比賽':'已移到「最近刪除」，'+TRASH_DAYS+' 天內可以到「紀錄與名單」最下面救回',until:Date.now()+6000,any:true}; save(); break;\n"
        "    case 'smpnew':\n      db.matches=db.matches.filter(function(x){var q=safeReduce(x);return !(q&&q.info.sample&&!matchOver(q))});\n"
        "      makeSample(); var snw=db.matches[0]; db.currentId=snw.id; save(); resetUi(); ui.page=firstPage(reduce(snw.events)); view='setup'; break;\n"
        "    case 'trashback': var tbm=db.trash.filter(function(x){return x.id===b.getAttribute('data-id')})[0],tbs=tbm&&safeReduce(tbm);\n"
        "      if(tbm&&restoreMatch(tbm.id)){var tbt=tbs?matchTitle(tbs):null;ui.selMsg='已救回'+(tbt?'「'+tbt[0]+' 對 '+tbt[1]+'」':'這場比賽')+'，在'+(tbs&&matchOver(tbs)?'「打完的比賽」':'主畫面的「進行中」')}\n"
        "      ui.trashAsk=null; save(); break;\n"
        "    case 'trashask': ui.trashAsk=b.getAttribute('data-id'); break;\n"
        "    case 'trashno': ui.trashAsk=null; break;\n"
        "    case 'trashdel': var tdl=b.getAttribute('data-id'); db.trash=db.trash.filter(function(x){return x.id!==tdl}); ui.trashAsk=null; ui.selMsg='已永久刪除 1 場比賽'; save(); break;\n"
        "    case 'trashall': var tan=db.trash.length; db.trash=[]; ui.trashAsk=null; ui.selMsg='已永久刪除 '+tan+' 場比賽'; save(); break;\n")
t = one(t, "      db.matches=db.matches.filter(function(q){return !dids[q.id]}); if(db.currentId&&dids[db.currentId])db.currentId=null;\n"
           "      ui.sheet=null; ui.bkSel=null; ui.selMsg='已刪除 '+dms.length+' 場比賽'; save(); break;",
        "      var dsmp=dms.filter(function(q){var r=safeReduce(q);return r&&r.info.sample}).length; trashMatches(Object.keys(dids));\n"
        "      ui.sheet=null; ui.bkSel=null; ui.selMsg='已刪除 '+dms.length+' 場比賽'+(dms.length>dsmp?'，在最下面的「最近刪除」可以救回':''); save(); break;")
t = one(t, "'<p class=\"muted\">記錄表會一起消失，無法復原。'+(nb?'其中 '+nb+' 場還沒備份，要保留的話先按「備份」。':'')+'</p><div class=\"row\"><button data-act=\"close\">取消</button><button class=\"danger\" data-act=\"seldelyes\">確定刪除 '+ms.length+' 場</button></div>';",
        "'<p class=\"muted\">會移到這一頁最下面的「最近刪除」，'+TRASH_DAYS+' 天內可以救回；練習比賽直接清掉。'+(nb?'其中 '+nb+' 場還沒備份。':'')+'</p><div class=\"row\"><button data-act=\"close\">取消</button><button data-act=\"seldelyes\">刪除 '+ms.length+' 場</button></div>';")
# 移到最近刪除、救回
t = one(t, "/* 11/12 選好的比賽：移到資料夾、刪除",
        "/* 11/13 最近刪除：刪除的比賽先移到 db.trash（帶刪除時間），30 天內可以救回；練習比賽直接清掉 */\n"
        "function trashMatches(ids){\n"
        "  var at=new Date().toISOString();\n"
        "  db.matches=db.matches.filter(function(m){if(ids.indexOf(m.id)<0)return true;var r=safeReduce(m);if(!(r&&r.info.sample)){m.deletedAt=at;db.trash.unshift(m)}return false});\n"
        "  if(db.currentId&&ids.indexOf(db.currentId)>=0)db.currentId=null;\n"
        "}\n"
        "function restoreMatch(id){\n"
        "  var m=db.trash.filter(function(x){return x.id===id})[0];if(!m)return false;\n"
        "  db.trash=db.trash.filter(function(x){return x!==m});delete m.deletedAt;\n"
        "  if(db.matches.some(function(x){return x.id===id}))return true; // 同一場已經在（例如又匯入了），不重複放\n"
        "  var i=0,ca=String(m.createdAt||'');while(i<db.matches.length&&String(db.matches[i].createdAt||'')>ca)i++;\n"
        "  db.matches.splice(i,0,m);return true;\n"
        "}\n"
        "/* 紀錄與名單最下面，有刪除的比賽才出現 */\n"
        "function trashHtml(){\n"
        "  if(!db.trash.length)return '';\n"
        "  var now=Date.now(),rows=db.trash.map(function(m){\n"
        "    var s=safeReduce(m),T=s?matchTitle(s):null,dt=new Date(m.deletedAt).getTime(),left=Math.max(1,TRASH_DAYS-Math.floor((now-dt)/864e5)),name=T?esc(T[0])+' 對 '+esc(T[1]):'資料有問題的比賽';\n"
        "    if(ui.trashAsk===m.id)return '<div class=\"rrow ask\"><span>永久刪除「'+name+'」？刪了就救不回來。</span><div class=\"row\"><button data-act=\"trashno\">取消</button><button class=\"danger\" data-act=\"trashdel\" data-id=\"'+esc(m.id)+'\">永久刪除</button></div></div>';\n"
        "    return '<div class=\"trow\"><div class=\"ttx\"><strong>'+name+(s?'　<b>'+setsText(s)+'</b>':'')+'</strong><span class=\"muted\">'+(s&&s.info.date?esc(s.info.date)+' 的比賽・':'')+shortTime(dt)+' 刪除・還留 '+left+' 天</span></div>'+\n"
        "      '<div class=\"tbtns\"><button data-act=\"trashback\" data-id=\"'+esc(m.id)+'\">救回</button><button data-act=\"trashask\" data-id=\"'+esc(m.id)+'\">永久刪除</button></div></div>'}).join('');\n"
        "  var all=ui.trashAsk==='*'?'<div class=\"rrow ask\"><span>把最近刪除的 '+db.trash.length+' 場全部永久刪除？刪了就救不回來。</span><div class=\"row\"><button data-act=\"trashno\">取消</button><button class=\"danger\" data-act=\"trashall\">全部永久刪除</button></div></div>'\n"
        "    :'<button class=\"minibtn tall\" data-act=\"trashask\" data-id=\"*\">'+TRASH_IC+'全部永久刪除</button>';\n"
        "  return '<section class=\"trash\"><h2>最近刪除</h2><p class=\"muted\">刪除的比賽在這裡留 '+TRASH_DAYS+' 天，之後自動清掉。救回後回到原本的地方。</p><div class=\"rlist\">'+rows+'</div>'+all+'</section>';\n"
        "}\n"
        "/* 11/12 選好的比賽：移到資料夾、刪除")
t = one(t, "<p class=\"muted\">換手機或清除瀏覽器資料前，請先備份。</p></section></div></main>';",
        "<p class=\"muted\">換手機或清除瀏覽器資料前，請先備份。</p></section>'+trashHtml()+'</div></main>';")
# 首頁提示：刪除後也要看得到；離開時寫按鈕的名字
t = one(t, "  if(homeNote&&Date.now()<homeNote.until&&g.live.length)body+=",
        "  if(homeNote&&Date.now()<homeNote.until&&(g.live.length||homeNote.any))body+=")
t = one(t, "if(r&&!matchOver(r))homeNote={t:'剛剛的比賽還在，放在「進行中」，按「繼續」就能接回',until:Date.now()+6000}}",
        "if(r&&!matchOver(r))homeNote={t:'剛剛的比賽還在，放在「進行中」，按「'+(r.sets[1].started?'繼續記錄':'繼續準備')+'」就能接回',until:Date.now()+6000}}")
# 使用教學：有還沒打完的練習時，選繼續或重開
t = one(t, "(view==='home'?'<button class=\"hsample\" data-act=\"sample\"><strong>用範例比賽試試</strong><small>名單已經填好，可以放心亂按，標示「練習」，不會混進正式紀錄</small></button>':'')",
        "(view==='home'?smpBtns():'')")
t = one(t, "function helpHtml(", "/* 11/13 使用教學最上面：有還沒打完的練習時，選「繼續上次的練習」或「重新開一場練習」 */\n"
        "function smpBtns(){\n"
        "  var sm=db.matches.map(function(x){return {m:x,s:safeReduce(x)}}).filter(function(q){return q.s&&q.s.info.sample&&!matchOver(q.s)})[0];\n"
        "  if(!sm)return '<button class=\"hsample\" data-act=\"sample\"><strong>用範例比賽試試</strong><small>名單已經填好，可以放心亂按，標示「練習」，不會混進正式紀錄</small></button>';\n"
        "  return '<button class=\"hsample\" data-act=\"sample\"><strong>繼續上次的練習</strong><small>'+(sm.s.sets[1].started?'打到第 '+sm.s.setNo+' 局，接著練':'還沒開賽，接著準備')+'</small></button><button class=\"hsample\" data-act=\"smpnew\"><strong>重新開一場練習</strong><small>上次的練習會清掉</small></button>';\n"
        "}\nfunction helpHtml(")
# 空間快滿：提醒可以清最近刪除
t = one(t, "else if(lastRaw&&lastRaw.length>NEAR_FULL)h+='<div class=\"warning\">這台裝置存的比賽快滿了。請先備份，再刪除不需要的舊比賽。</div>';",
        "else if(lastRaw&&lastRaw.length>NEAR_FULL)h+='<div class=\"warning\">這台裝置存的比賽快滿了。請先備份，再刪除不需要的舊比賽。'+(db.trash.length?'「紀錄與名單」最下面的「最近刪除」還有 '+db.trash.length+' 場，永久刪除也能空出空間。':'')+'</div>';")
t = one(t, "(saveFull?'這台裝置的空間滿了，新的紀錄存不進去。請先備份，再刪除不需要的舊比賽。'",
        "(saveFull?'這台裝置的空間滿了，新的紀錄存不進去。請先備份，再刪除不需要的舊比賽。'+(db.trash.length?'「紀錄與名單」最下面的「最近刪除」還有 '+db.trash.length+' 場，永久刪除也能空出空間。':'')")
# 匯入：匯入的比賽如果在最近刪除裡，從最近刪除拿掉；刪資料夾時最近刪除的比賽也一起改成未分類
t = one(t, "      ip.add.slice().reverse().forEach(function(im){db.matches.unshift(im)});\n",
        "      ip.add.slice().reverse().forEach(function(im){db.matches.unshift(im)});\n"
        "      db.trash=db.trash.filter(function(x){return !db.matches.some(function(q){return q.id===x.id})});\n")
t = one(t, "    case 'history': noteLeave(m); db.currentId=null; save(); view='history'; ui.delMatch=null; ui.importMsg='';",
        "    case 'history': noteLeave(m); db.currentId=null; save(); view='history'; ui.delMatch=null; ui.selMsg=''; ui.trashAsk=null; ui.importMsg='';")
t = one(t, "var cx=cupView.id; db.matches.forEach(function(x){if(x.cup===cx)delete x.cup});",
        "var cx=cupView.id; db.matches.concat(db.trash).forEach(function(x){if(x.cup===cx)delete x.cup});")

# ---------- 使用說明 ----------
def help_fix(t, a, b):
    return one(t, a, b)
t = help_fix(t, "範例標示「練習」，不會混進正式紀錄。\"}",
             "範例標示「練習」，不會混進正式紀錄。要重來，按練習卡片右上角的「重新開始」。\"}")
t = help_fix(t, "到「進行中」按「繼續準備」接著填。要先印紙本記錄表",
             "到「進行中」按「繼續準備」接著填；不要了就按卡片右上角的「刪除」。要先印紙本記錄表")
t = help_fix(t, "配好的一組會列出來，按錯可以刪除，最後按「完成」。\"}",
             "配好的一組會列出來，按錯可以刪除，最後按「完成」。同一次死球要再換一組，會先問是不是一起到替補區的。\"}")
t = help_fix(t, "選好按下面的「備份」「移到資料夾」「印紙本」或「刪除」。進行中的比賽也列在這裡。\"}",
             "選好按下面的「備份」「移到資料夾」「印紙本」或「刪除」。進行中的比賽也列在這裡。刪除的比賽先放到最下面的「最近刪除」，30 天內可以救回。\"}")

# ---------- 樣式 ----------
t = one(t, ".xphd{margin:6px 2px 0;font-weight:700;font-size:14px;color:var(--muted)}\n</style>",
        ".xphd{margin:6px 2px 0;font-weight:700;font-size:14px;color:var(--muted)}\n"
        "/* 11/13 首頁卡片的刪除、最近刪除、小按鈕 */\n"
        ".rrow.hasdel{position:relative}\n"
        ".rrow.hasdel .rmain strong{padding-right:104px}\n"
        ".rrow.hasdel .rmain .rscore{grid-row:2;margin-top:6px}\n"
        ".rcdel,.minibtn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 12px;border:1px solid var(--line);border-radius:var(--rb);background:var(--card);color:var(--ink);font-size:14px;font-weight:700;box-shadow:none}\n"
        ".rcdel{position:absolute;top:10px;right:12px;min-height:38px;z-index:1}\n"
        ".minibtn{min-height:44px;align-self:center;margin-top:12px}\n"
        ".rcdel svg,.minibtn svg{width:16px;height:16px;flex:none}\n"
        ".trash .rlist{gap:8px}\n"
        ".trash .trow{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border-radius:var(--rc);box-shadow:var(--card-shadow)}\n"
        ".trash .ttx{flex:1;min-width:0;display:grid;gap:2px}\n"
        ".trash .ttx strong{overflow-wrap:anywhere}\n"
        ".trash .tbtns{display:flex;gap:6px;flex:none}\n"
        ".trash .tbtns button{min-height:44px;padding:0 12px;font-size:14px}\n"
        ".trash .minibtn{display:flex;margin:12px auto 0}\n"
        "@media (max-width:429px){.trash .trow{flex-direction:column;align-items:stretch}.trash .tbtns button{flex:1}}\n"
        ".selacts .seldel:not(:disabled){color:inherit;border:1px solid var(--line);background:var(--card)}\n"
        ".quicknote .qn{flex:1 1 40%}\n"
        "</style>")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

# ---------- 學校版：沒有「同一次死球」的限制（綁定替補，次數不限） ----------
p = open(SCH + 'patches.txt', encoding='utf-8').read()
for old in ["<<<<\nsw2=c.live?'球在進行中，得分後才能替補':c.subRally[k]===c.rally?'這次死球已換過人，打完一球才能再換':'';\n====\nsw2=c.live?'球在進行中，得分後才能替補':'';\n>>>>\n",
            "<<<<\n  var subDone=[L,R].filter(function(k){return c.subRally[k]===c.rally&&c.rally>0})[0];\n====\n  var subDone=null;\n>>>>\n",
            "<<<<\nsOk=pOk&&pc.subRally[k]!==pc.rally&&lgN.length>0,eOk=\n====\nsOk=pOk&&lgN.length>0,eOk=\n>>>>\n"]:
    p = one(p, old, '')
p = one(p, "＝＝＝ 替補：次數不限，綁定一對 ＝＝＝\n",
        "＝＝＝ 替補：次數不限，綁定一對 ＝＝＝\n同一次死球可以換好幾次，不問「是不是一起到替補區」（完整版的 REQ_ONCE）。\n"
        "<<<<\nvar REQ_ONCE=true;\n====\nvar REQ_ONCE=false;\n>>>>\n")
open(SCH + 'patches.txt', 'w', encoding='utf-8').write(p)
q = open(SCH + 'patches-nosheet.txt', encoding='utf-8').read()
q = one(q, "<<<<\n<p class=\"muted\">記錄表會一起消失，無法復原。要保留的話先下載備份。</p>\n====\n<p class=\"muted\">紀錄會一起消失，無法復原。要保留的話先下載備份。</p>\n>>>>\n", '')
open(SCH + 'patches-nosheet.txt', 'w', encoding='utf-8').write(q)
H = json.load(open(SCH + 'help.json', encoding='utf-8'))
fixes = {('start', 'sample'): ('不會混進正式紀錄。', '不會混進正式紀錄。要重來，按練習卡片右上角的「重新開始」。'),
         ('info', 'resume'): ('到「進行中」按「繼續準備」接著填。', '到「進行中」按「繼續準備」接著填；不要了就按卡片右上角的「刪除」。'),
         ('history', 'bksel'): ('進行中的比賽也列在這裡。', '進行中的比賽也列在這裡。刪除的比賽先放到最下面的「最近刪除」，30 天內可以救回。')}
done = 0
for g in H:
    for c in g['cards']:
        key = (g['id'], c.get('img'))
        if key in fixes:
            a, b = fixes[key]
            assert c['d'].count(a) == 1, key
            c['d'] = c['d'].replace(a, b)
            done += 1
assert done == 3, done
json.dump(H, open(SCH + 'help.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('school ok')

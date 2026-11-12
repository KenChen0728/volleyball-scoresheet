# 11/13 第 9 項：改發球格（使用者授權直接做完上線）
# - 照紙本改發球格的數字，得分過程照發球格重算；比分、誰發球、輪轉都不變（每隊最後一格就是最後比分，不能在這裡改）。
# - 打完的局（含已經有勝隊、還沒按下一局的這局）都能改，到按「確定比賽結束」為止。
# - 「本局」和「各局」的記錄表點發球格 → 這隊這局的發球格（照紙本排成六欄）→ 改不一樣的格子 → 下一步看會改哪幾格、
#   哪些暫停替補的比分會跟著變 → 確定。改法是一筆 AMEND（multi：好幾分改成另一隊得分），可以復原。
# - 擋下（寫原因）：比分會變、改到判罰給分那一分、這局有取消分數、不是打出來的局（陣容不完整、棄權）、決勝局換場時間對不上、比前一輪小。
# - 「各局」也改用可以點的記錄表（手機兩隊分開上下排），打完的局連發球格都能點；還在打的局只能點暫停、替補、先發。
# 用法：python3 tools/patch_v85.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'function svTurns' not in t, 'already'

# ---------- reduce：每一分是哪個事件、決勝局換場在第幾分、AMEND 一次改好幾筆 ----------
t = one(t, "    if(ev.data.ins)return; // 補記：下面照時間軸放進去",
        "    if(ev.data.ins)return; // 補記：下面照時間軸放進去\n"
        "    if(ev.data.multi){ev.data.multi.forEach(function(q){patch[q.target]=Object.assign(patch[q.target]||{},q.patch)});return} // 11/13 改發球格：一次改好幾分")
t = one(t, "  m.events.forEach(function(e){if(e.type!=='AMEND'||dead[e.id])return;if(e.data.del)dead[e.data.target]=1;else if(e.data.target)patch[e.data.target]=Object.assign(patch[e.data.target]||{},e.data.patch)});",
        "  m.events.forEach(function(e){if(e.type!=='AMEND'||dead[e.id])return;if(e.data.multi)e.data.multi.forEach(function(q){patch[q.target]=Object.assign(patch[q.target]||{},q.patch)});else if(e.data.del)dead[e.data.target]=1;else if(e.data.target)patch[e.data.target]=Object.assign(patch[e.data.target]||{},e.data.patch)});")
t = one(t, "  var pt={};m.events.forEach(function(e){if(e.type!=='AMEND'||dead[e.id])return;if(e.data.del)dead[e.data.target]=1;else pt[e.data.target]=Object.assign(pt[e.data.target]||{},e.data.patch)});",
        "  var pt={};m.events.forEach(function(e){if(e.type!=='AMEND'||dead[e.id])return;if(e.data.multi)e.data.multi.forEach(function(q){pt[q.target]=Object.assign(pt[q.target]||{},q.patch)});else if(e.data.del)dead[e.data.target]=1;else if(e.data.target)pt[e.data.target]=Object.assign(pt[e.data.target]||{},e.data.patch)});")
t = one(t, "      case 'SIDES_SWAPPED': var sw=s.sets[d.set]; sw.left=other(sw.left);",
        "      case 'SIDES_SWAPPED': var sw=s.sets[d.set]; sw.swapAt=(sw.path||[]).length; sw.left=other(sw.left);")
t = one(t, "        ['t1','t2'].forEach(function(q,qi){if(csx.score[q]===+cp0[qi]+1){var pc=csx.ptCnt||(csx.ptCnt={t1:{},t2:{}});pc[q][csx.score[q]]=(pc[q][csx.score[q]]||0)+1}})}}",
        "        ['t1','t2'].forEach(function(q,qi){if(csx.score[q]===+cp0[qi]+1){var pc=csx.ptCnt||(csx.ptCnt={t1:{},t2:{}});pc[q][csx.score[q]]=(pc[q][csx.score[q]]||0)+1;(csx.ptEv||(csx.ptEv=[])).push({id:ev.id,pen:ev.type==='SANCTION'})}})}}")

# ---------- 發球格 ↔ 得分過程 ----------
t = one(t, "function scCheck(s,e,own,opp){",
        "/* 11/13 改發球格：這局每一輪發球，照時間先後。team 發球隊、idx 第幾個位置發（0 是 I 位）、v 發球結束時這隊的分數（發球格的數字）、\n"
        "   last 這隊最後一格（就是這隊最後的分數，不能改）。跟 applyPoint 記發球格的方法一樣，從得分順序 path 算 */\n"
        "function svTurns(s,n){\n"
        "  var c=s.sets[n],path=c.path||[],sv=c.serve,rot={t1:0,t2:0},sc={t1:0,t2:0},T=[],ended=c.ended||(n===s.setNo&&!!setWinner(s));\n"
        "  if(!sv)return T;\n"
        "  path.forEach(function(k){if(k!==sv){T.push({team:sv,idx:rot[sv],v:sc[sv]});sv=k;rot[k]=(rot[k]+1)%6}sc[k]++});\n"
        "  if(ended)T.push({team:sv,idx:rot[sv],v:sc[sv]});\n"
        "  ['t1','t2'].forEach(function(k){for(var i=T.length-1;i>=0;i--)if(T[i].team===k){T[i].last=true;break}});\n"
        "  return T;\n"
        "}\n"
        "/* 發球格的數字 → 每一分是哪一隊得的：每一輪發球隊連得到格子的數字，接著對方得一分換發球（最後一輪不換） */\n"
        "function svSeq(T,vals){var sc={t1:0,t2:0},P=[];\n"
        "  for(var t=0;t<T.length;t++){var X=T[t].team,need=vals[t]-sc[X];if(!(need>=0))return {err:t,start:sc[X]};\n"
        "    for(var q=0;q<need;q++)P.push(X);sc[X]=vals[t];\n"
        "    if(t<T.length-1){var Y=other(X);P.push(Y);sc[Y]++}}\n"
        "  return {P:P}}\n"
        "function boxWhy(s,n){var c=s.sets[n];\n"
        "  return matchOver(s)?'比賽已經確定結束，不能再改。':!(c.ended||(n===s.setNo&&setWinner(s)))?'這局還在打，打完再對發球格。':(s.cancels||[]).some(function(q){return q.set===n})?'這局有取消分數（輪轉錯誤／非法替補），不能改發球格。':c.score.t1+c.score.t2!==(c.path||[]).length?'這局的比分不是一分一分打出來的（陣容不完整或棄權），不能改發球格。':''}\n"
        "function boxLab(c,T,t){var q=T[t],j=T.filter(function(z,zi){return zi<t&&z.team===q.team&&z.idx===q.idx}).length+(q.idx===0&&c.serve!==q.team?1:0);return ROMAN[q.idx]+' 位第 '+(j+1)+' 格'}\n"
        "/* 照新的發球格算出要改哪幾分（AMEND multi），和哪些暫停、替補、判罰的比分會跟著變 */\n"
        "function boxPlan(m,s,n,T,vals){\n"
        "  var c=s.sets[n],path=c.path||[],ev=c.ptEv||[],r=svSeq(T,vals);\n"
        "  if(r.err!=null)return {err:boxLab(c,T,r.err)+'填 '+vals[r.err]+'，比這一輪開始發球時的 '+r.start+' 分還小。'};\n"
        "  if(r.P.length!==path.length||ev.length!==path.length)return {err:'改了之後總分會變，不能這樣改。'};\n"
        "  var multi=[];\n"
        "  for(var i=0;i<r.P.length;i++){if(r.P[i]===path[i])continue;if(ev[i].pen)return {err:'這樣改會動到判罰給分的那一分（這局第 '+(i+1)+' 分），不能這樣改。'};multi.push({target:ev[i].id,patch:{team:s.flipped&&s.flipped[ev[i].id]?other(r.P[i]):r.P[i]}})}\n"
        "  if(!multi.length)return {err:'改了之後得分過程沒有變。'};\n"
        "  if(c.swapAt!=null){var hf=Math.ceil(target(s,n)/2),a={t1:0,t2:0};for(var j=0;j<c.swapAt;j++)a[r.P[j]]++;if(Math.max(a.t1,a.t2)!==hf||(c.swapAt&&a[r.P[c.swapAt-1]]!==hf))return {err:'第 '+n+' 局要在一隊到 '+hf+' 分時換場，這樣改換場的時間會對不上。'}}\n"
        "  var sim=reduce(m.events.concat([{id:'__bx',type:'AMEND',at:'',data:{multi:multi}}])),recs=[];\n"
        "  s.log.forEach(function(q){if(q.set!==n||q.score==null)return;var q2=sim.log.filter(function(z){return z.id===q.id})[0];if(q2&&q2.score!==q.score)recs.push(tName(s,q.team)+' '+(q.kind==='T'?'暫停':q.kind==='J'?sanText(q):q.out+' 換 '+q.in)+'：'+q.score+' → '+q2.score)});\n"
        "  return {multi:multi,recs:recs};\n"
        "}\n"
        "function scCheck(s,e,own,opp){")

# ---------- 記錄表上的發球格可以點 ----------
t = one(t, "function ctHot(s,n,box){", "function ctHot(s,n,box,o){ o=o||{pt:true}; // o.pt 位置和暫停、o.sv 發球格")
t = one(t, "    for(i=0;i<6;i++)h+=rect(C[i],R[2],C[i+1],R[6],k,n+':P:'+i,ROMAN[i]+' 位的先發和替補');\n    if(p&&p.to&&p.cols)h+=rect(p.cols[0],p.to[0][1]-9.6,p.cols[p.cols.length-1],p.to[1][1]+9.6,k,n+':T','暫停')}",
        "    if(o.pt){for(i=0;i<6;i++)h+=rect(C[i],R[2],C[i+1],R[6],k,n+':P:'+i,ROMAN[i]+' 位的先發和替補');\n      if(p&&p.to&&p.cols)h+=rect(p.cols[0],p.to[0][1]-9.6,p.cols[p.cols.length-1],p.to[1][1]+9.6,k,n+':T','暫停')}\n"
        "    if(o.sv)for(i=0;i<6;i++)h+=rect(C[i],R[6],C[i+1],R[R.length-1],k,n+':B:'+i,ROMAN[i]+' 位的發球格')}")
t = one(t, "function ctViewHot(s,n){\n  var m0=1.2,lab=' role=\"img\" aria-label=\"第 '+n+' 局記錄表，點格子可以修改\">';",
        "function ctViewHot(s,n,o){\n  var m0=1.2,ed=o&&(o.pt||o.sv),lab=' role=\"img\" aria-label=\"第 '+n+' 局記錄表'+(ed?'，點格子可以修改':'')+'\">';")
t = one(t, "false,(w?mask(b):'')+ctHot(s,n,b)).replace(/ width=\"[\\d.]+\" height=\"[\\d.]+\">/,lab);return '<div class=\"ctv ctv-set hot\"'",
        "false,(w?mask(b):'')+(ed?ctHot(s,n,b,o):'')).replace(/ width=\"[\\d.]+\" height=\"[\\d.]+\">/,lab);return '<div class=\"ctv ctv-set'+(ed?' hot':'')+'\"'")
t = one(t, "    ctViewHot(s,s.setNo)+'<div class=\"endres\">'", "    ctViewHot(s,s.setNo,{pt:true,sv:true})+'<div class=\"endres\">'")
t = one(t, "跟紙本核對。暫停、替補、先發背號的格子點一下，就能修改或補記。", "跟紙本核對。暫停、替補、先發背號、發球格點一下，就能修改或補記。")
# 「各局」：可以點的記錄表（打完的局連發球格都能點）
t = one(t, "  if(XP_ON&&(tab==='pen'||tab==='note'||tab==='res'&&!over||/^s[123]$/.test(tab)))return head+ctPage(s,tab)+(/^s/.test(tab)?wide:'')+back+(/^s/.test(tab)?fs(ctPage(s,tab)):'');",
        "  if(XP_ON&&(tab==='pen'||tab==='note'||tab==='res'&&!over||/^s[123]$/.test(tab)))return head+(/^s[123]$/.test(tab)?ctSetTab(s,Number(tab.slice(1)),!!pv||!matchOver(s)):ctPage(s,tab))+(/^s/.test(tab)?wide:'')+back+(/^s/.test(tab)?fs(ctPage(s,tab)):'');")
t = one(t, "function pendingHtml(s,win){",
        "/* 11/13 「各局」：比賽確定結束前格子都能點；打完的局連發球格都能改 */\n"
        "function ctSetTab(s,n,ed){var c=s.sets[n],o=ed?{pt:true,sv:!!c.ended}:null;\n"
        "  return ctViewHot(s,n,o)+(ed?'<p class=\"muted ctnote\">'+(o.sv?'暫停、替補、先發背號、發球格點一下，就能修改或補記。':'暫停、替補、先發背號點一下，就能修改或補記。這局打完，發球格也能改。')+'</p>':'')}\n"
        "function pendingHtml(s,win){")
t = one(t, "      ui.sheet={type:'cellfix',team:k,set:cfn,kind:cfv[1],idx:cfi}; break;",
        "      if(cfv[1]==='B'){ui.sheet={type:'boxfix',team:k,set:cfn,idx:cfi};break}\n"
        "      ui.sheet={type:'cellfix',team:k,set:cfn,kind:cfv[1],idx:cfi}; break;")

# ---------- 發球格視窗 ----------
t = one(t, "  }else if(x.type==='cellfix'){",
        "  }else if(x.type==='boxfix'){ // 11/13 改發球格：照紙本改這隊這局的發球格（排成六欄跟紙本一樣），得分過程照發球格重算\n"
        "    var bc=s.sets[x.set],bT=svTurns(s,x.set),bX=bc.serve&&bc.serve!==k,bwhy=boxWhy(s,x.set);\n"
        "    h='<h2><span class=\"tpill '+k+'\">'+esc(tName(s,k))+'</span> 第 '+x.set+' 局發球格</h2>';\n"
        "    if(bwhy)h+='<p class=\"note\">'+esc(bwhy)+'</p><button data-act=\"close\">關閉</button>';\n"
        "    else if(!x.plan){\n"
        "      var bcols=[0,1,2,3,4,5].map(function(i){var a=bX&&i===0?[{x:1}]:[];bT.forEach(function(q,t){if(q.team===k&&q.idx===i)a.push({t:t,q:q})});return a});\n"
        "      h+='<p class=\"subhint\">照紙本改不一樣的格子，得分過程會照發球格重算，比分不變。</p><div class=\"bxgrid\">'+\n"
        "        bcols.map(function(a,i){return '<div class=\"bxcol'+(i===x.idx?' on':'')+'\"><b>'+ROMAN[i]+'</b><small>'+(bc.lineups[k][i]!=null?bc.lineups[k][i]+' 號':'')+'</small>'+\n"
        "          a.map(function(e,j){if(e.x)return '<span class=\"bxc bxx\" title=\"先接發，沒有發球\">X</span>';var v=x.vals&&x.vals[e.t]!=null?x.vals[e.t]:e.q.v;\n"
        "            return e.q.last?'<span class=\"bxc bxlast\" title=\"這隊最後的分數，不能在這裡改\">'+e.q.v+'</span>':'<input class=\"bxc\" data-t=\"'+e.t+'\" type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" maxlength=\"2\" autocomplete=\"off\" value=\"'+esc(v)+'\" aria-label=\"'+ROMAN[i]+' 位第 '+(j+1)+' 格\">'}).join('')+'</div>'}).join('')+'</div>'+\n"
        "        '<p class=\"muted\">粗框是這隊最後的分數，不能在這裡改；X 是先接發、還沒發球。</p>'+(x.err?'<p class=\"warning\" role=\"alert\">'+esc(x.err)+'</p>':'')+\n"
        "        '<button class=\"primary\" data-act=\"bxgo\">下一步</button><button data-act=\"close\">關閉</button>';\n"
        "    }else{\n"
        "      stepBack='';\n"
        "      h+='<p class=\"subhint\">改這幾格：</p><ul class=\"bxchg\">'+x.plan.chg.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ul>'+\n"
        "        '<p class=\"muted\">比分維持 '+bc.score[k]+':'+bc.score[other(k)]+'，得分過程照發球格重算。'+(x.plan.recs.length?'下面這些紀錄的比分會跟著變，改完再到「更正」對一下紙本：':'暫停、替補、判罰的比分都不會變。')+'</p>'+\n"
        "        (x.plan.recs.length?'<ul class=\"bxchg\">'+x.plan.recs.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ul>':'')+\n"
        "        '<div class=\"row\"><button data-act=\"bxback\">返回</button><button class=\"go\" data-act=\"bxdo\">確定修改</button></div>';\n"
        "    }\n"
        "  }else if(x.type==='cellfix'){")
t = one(t, "    case 'rotopen':",
        "    case 'bxgo':\n"
        "      var bx=ui.sheet,bT2=svTurns(s,bx.set),bv=bT2.map(function(q){return q.v}),bch=[],bbad='';bx.vals={};bx.err=null;\n"
        "      app.querySelectorAll('.sheet input[data-t]').forEach(function(el){var t2=+el.getAttribute('data-t'),v2=el.value.trim();bx.vals[t2]=v2;if(!/^\\d{1,2}$/.test(v2)){bbad=bbad||boxLab(s.sets[bx.set],bT2,t2)+'要填數字。';return}if(+v2!==bT2[t2].v){bv[t2]=+v2;bch.push(t2)}});\n"
        "      if(bbad){bx.err=bbad;break}\n"
        "      if(!bch.length){bx.err='沒有改到任何一格。';break}\n"
        "      var bpl=boxPlan(m,s,bx.set,bT2,bv);if(bpl.err){bx.err=bpl.err;break}\n"
        "      bpl.chg=bch.map(function(t2){return boxLab(s.sets[bx.set],bT2,t2)+'：'+bT2[t2].v+' → '+bv[t2]});bx.plan=bpl; break;\n"
        "    case 'bxback': ui.sheet.plan=null; break;\n"
        "    case 'bxdo':\n"
        "      var bxp=ui.sheet.plan,bxs=ui.sheet.set,bxk=ui.sheet.team;if(!bxp||boxWhy(s,bxs))break;\n"
        "      dispatch('AMEND',{multi:bxp.multi,note:'第 '+bxs+' 局 '+tName(s,bxk)+' 發球格更正：'+bxp.chg.join('、')});\n"
        "      ui.fixDone={ids:[],t:'已照發球格重算第 '+bxs+' 局的得分過程'}; ui.toast={t:ui.fixDone.t,until:Date.now()+3500}; ui.sheet=null; break;\n"
        "    case 'rotopen':")

# ---------- 樣式 ----------
t = one(t, ".rotrow label{font-size:17px;font-weight:700;color:inherit;margin:0}\n",
        ".rotrow label{font-size:17px;font-weight:700;color:inherit;margin:0}\n"
        "/* 11/13 改發球格：跟紙本一樣排成六欄 */\n"
        ".bxgrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;flex:none}\n"
        ".bxcol{display:flex;flex-direction:column;gap:6px;padding:4px 2px;border-radius:8px;min-width:0}\n"
        ".bxcol.on{box-shadow:inset 0 0 0 2px var(--focus,#2e6cb7)}\n"
        ".bxcol>b{text-align:center;font-size:16px;line-height:1.2}\n"
        ".bxcol>small{text-align:center;color:var(--muted);font-size:12px;line-height:1.2;margin-top:-4px;min-height:14px}\n"
        ".bxc{min-height:44px;font-size:20px;font-weight:700;text-align:center;width:100%;min-width:0;padding:0;box-sizing:border-box}\n"
        "span.bxc{display:flex;align-items:center;justify-content:center;border-radius:8px}\n"
        ".bxx{color:var(--muted);border:1px dashed var(--line)}\n"
        ".bxlast{border:3px solid currentColor}\n"
        ".bxchg{margin:0;padding-left:1.2em;font-size:16px;line-height:1.55}\n")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

# 11/13 第 10 項：輪轉錯誤／非法替補（使用者授權直接做完上線）
# - 對方的 1 分照平常按「得分」；「其他」→「輪轉錯誤／非法替補」選犯錯的隊和種類，填這隊要追回到幾分，取消之後的分數。
# - 記事欄自動寫：「第 1 局 A 隊 10:10 輪轉錯誤，B 隊得 1 分，取消 A 隊第 6～10 分，於 5:11 繼續比賽」（非法替補只換那四個字）
# - 輪轉不倒回（使用者 11/13 02:52）。記錄表：取消的分數斜線留著，之後再得到同一分加反方向一條變成叉。
# - 事件 SCORE_CANCEL {set, team, kind:'R'|'S', to}，可以復原。
# - 比分出現過沒有、先後順序，改用這局的比分紀錄（hist），取消過分數時「打了幾球」不能當時間順序。
# 用法：python3 tools/patch_v84.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'SCORE_CANCEL' not in t, 'already'

# ---------- reduce：取消分數、每個事件之後的比分、這局的比分紀錄、每一分得過幾次 ----------
t = one(t, "  s.log=[];s.amends=[];s.flipped={};", "  s.log=[];s.amends=[];s.flipped={};s.scAfter={};")
t = one(t, "    var t=d.team?s.teams[d.team]:null;\n    switch(ev.type){",
        "    var t=d.team?s.teams[d.team]:null,cs0=d&&d.set&&s.sets[d.set]?s.sets[d.set].score.t1+':'+s.sets[d.set].score.t2:'';\n    switch(ev.type){")
t = one(t, "      case 'SET_ENDED': var en=s.sets[d.set];",
        "      case 'SCORE_CANCEL': // 11/13 輪轉錯誤／非法替補：犯錯隊追回到 d.to 分（對方的 1 分照平常按得分），輪轉不倒回\n"
        "        var xc=s.sets[d.set],xo=other(d.team),xf=xc.score[d.team],xp=xc.path||[];\n"
        "        if(!(d.to>=0&&d.to<xf))break;\n"
        "        (s.cancels=s.cancels||[]).push({id:ev.id,set:d.set,team:d.team,kind:d.kind,from:xf,to:d.to,opp:xc.score[xo],gave:xp[xp.length-1]===xo});\n"
        "        xc.score[d.team]=d.to; xc.cxRally=xc.rally; break;\n"
        "      case 'SET_ENDED': var en=s.sets[d.set];")
t = one(t, "        break;\n    }\n  });\n  /* 11/9 朋友回饋：名單頁和記錄表照輸入順序",
        "        break;\n    }\n"
        "    /* 11/13 每個事件之後的比分（補記找時間點用）；比分有變就記進這局的比分紀錄 hist，每一分得過幾次記在 ptCnt（取消後再得到同一分，記錄表畫叉） */\n"
        "    if(cs0){var csx=s.sets[d.set],cs1=csx.score.t1+':'+csx.score.t2;s.scAfter[ev.id]=cs1;\n"
        "      if(cs1!==cs0&&(ev.type==='POINT'||ev.type==='SANCTION'||ev.type==='SCORE_CANCEL')){(csx.hist||(csx.hist=['0:0'])).push(cs1);var cp0=cs0.split(':');\n"
        "        ['t1','t2'].forEach(function(q,qi){if(csx.score[q]===+cp0[qi]+1){var pc=csx.ptCnt||(csx.ptCnt={t1:{},t2:{}});pc[q][csx.score[q]]=(pc[q][csx.score[q]]||0)+1}})}}\n"
        "  });\n  /* 11/9 朋友回饋：名單頁和記錄表照輸入順序")
# 暫停照時間先後排（取消過分數時，打了幾球不是先後）
t = one(t, "to.timeouts[d.team].sort(scOrder); to.toRows[d.team].sort(scOrder);",
        "to.timeouts[d.team].sort(function(x,y){return scPos(to,'t1',x)-scPos(to,'t1',y)}); to.toRows[d.team].sort(function(x,y){return scPos(to,d.team,x)-scPos(to,d.team,y)});")

# ---------- 比分出現過沒有、先後：用這局的比分紀錄 ----------
t = one(t, "function scCheck(s,e,own,opp){",
        "/* 11/13 這局的比分紀錄裡第幾個（沒取消過分數時就是打了幾球）；k 隊在前的比分。找不到就用打了幾球 */\n"
        "function hIdx(c,a,b){return (c.hist||['0:0']).lastIndexOf(a+':'+b)}\n"
        "function scPos(c,k,sc){var p=String(sc).split(':').map(Number),a=k==='t1'?p[0]:p[1],b=k==='t1'?p[1]:p[0],i=hIdx(c,a,b);return i<0?p[0]+p[1]:i}\n"
        "function hLast(c){return (c.hist||['0:0']).length-1}\n"
        "function scCheck(s,e,own,opp){")
t = one(t, "  var c=s.sets[e.set],t1=e.team==='t1'?own:opp,n=own+opp,path=c.path||[];\n  if(n>path.length||path.slice(0,n).filter(function(q){return q==='t1'}).length!==t1)return '這局沒有出現過 '+own+':'+opp+' 這個比分，只能改成這局已經打過的比分。';",
        "  var c=s.sets[e.set],n=hIdx(c,e.team==='t1'?own:opp,e.team==='t1'?opp:own);\n  if(n<0)return '這局沒有出現過 '+own+':'+opp+' 這個比分，只能改成這局已經打過的比分。';")
t = one(t, "  if(e.kind==='T'&&n===0)return '這局還沒開始，0:0 不能暫停。';", "  if(e.kind==='T'&&own+opp===0)return '這局還沒開始，0:0 不能暫停。';")
t = one(t, "  if(n===path.length&&(c.ended||(s.setNo===e.set&&setWinner(s))))return own+':'+opp+' 是這局最後一分，局已經打完，不能改到這裡。';",
        "  if(n===hLast(c)&&(c.ended||(s.setNo===e.set&&setWinner(s))))return own+':'+opp+' 是這局最後一分，局已經打完，不能改到這裡。';")
t = one(t, "    for(var j=0;j<row.length;j++){if(j===i)continue;var q=String(row[j].score).split(':'),qt=Number(q[0])+Number(q[1]);",
        "    for(var j=0;j<row.length;j++){if(j===i)continue;var qt=scPos(c,e.team,row[j].score);")
t = one(t, "  var c=s.sets[n],tot=own+opp,path=c.path||[],t1=k==='t1'?own:opp;\n  if(tot>path.length||path.slice(0,tot).filter(function(q){return q==='t1'}).length!==t1)return {err:'這局沒有出現過 '+own+':'+opp+' 這個比分，只能補在這局打過的比分。'};\n  if(tot===path.length&&(c.ended||(s.setNo===n&&setWinner(s))))return {err:own+':'+opp+' 是這局最後一分，局已經打完，不能補在這裡。'};",
        "  var c=s.sets[n],ia=k==='t1'?own:opp,ib=k==='t1'?opp:own,key=ia+':'+ib,hi=hIdx(c,ia,ib),sa=s.scAfter||{};\n  if(hi<0)return {err:'這局沒有出現過 '+own+':'+opp+' 這個比分，只能補在這局打過的比分。'};\n  if(hi===hLast(c)&&(c.ended||(s.setNo===n&&setWinner(s))))return {err:own+':'+opp+' 是這局最後一分，局已經打完，不能補在這裡。'};")
t = one(t, "  var cnt=0,inSet=false,served=false,cand=null;", "  var inSet=false,served=false,cand=null; // 11/13 用每個事件之後的比分找（取消過分數時，打了幾球對不上比分）")
t = one(t, "    if(e.type==='SET_STARTED'){inSet=true;if(cnt===tot)cand=e;return}", "    var hit=sa[e.id]===key;\n    if(e.type==='SET_STARTED'){inSet=true;if(hit)cand=e;return}")
t = one(t, "    if(e.type==='REPLAY'){served=false;if(cnt===tot)cand=e;return}", "    if(e.type==='REPLAY'){served=false;if(hit)cand=e;return}")
t = one(t, "    if(e.type==='POINT'||(e.type==='SANCTION'&&(d.kind==='P'||d.kind==='DP'))){cnt++;served=false;if(cnt===tot)cand=e;return}",
        "    if(e.type==='POINT'||e.type==='SCORE_CANCEL'||(e.type==='SANCTION'&&(d.kind==='P'||d.kind==='DP'))){served=false;if(hit)cand=e;return}")
t = one(t, "    if(cnt===tot&&!served)cand=e;", "    if(hit&&!served)cand=e;")

# ---------- 局結束視窗：取消分數讓局打完時也算一個新的時間點 ----------
t = one(t, "if(e.type==='POINT'||(e.type==='SANCTION'&&(e.data.kind==='P'||e.data.kind==='DP')))id=e.id});return id}",
        "if(e.type==='POINT'||e.type==='SCORE_CANCEL'||(e.type==='SANCTION'&&(e.data.kind==='P'||e.data.kind==='DP')))id=e.id});return id}")

# ---------- 復原、事件名稱、試算表 ----------
t = one(t, "'GAME_CAPTAIN_SET','CAPTAIN_SET','SANCTION','INJURY'].indexOf(e.type)>=0?e:null;",
        "'GAME_CAPTAIN_SET','CAPTAIN_SET','SANCTION','INJURY','SCORE_CANCEL'].indexOf(e.type)>=0?e:null;")
t = one(t, "    case 'SET_STARTED':return '開局';", "    case 'SET_STARTED':return '開局';\n    case 'SCORE_CANCEL':return n+'取消分數';")
t = one(t, "SIDES_SWAPPED:'換場',SET_STARTED:'開局',SET_ENDED:'局結束'};", "SIDES_SWAPPED:'換場',SET_STARTED:'開局',SET_ENDED:'局結束',SCORE_CANCEL:'取消分數'};")
t = one(t, "e.type==='SUB'?d.out+' 換 '+d.in+(d.exc?'（例外）':''):",
        "e.type==='SUB'?d.out+' 換 '+d.in+(d.exc?'（例外）':''):e.type==='SCORE_CANCEL'?(d.kind==='S'?'非法替補':'輪轉錯誤')+'，追回到 '+d.to+' 分':")

# ---------- 記事欄 ----------
t = one(t, "  (s.acc||[]).forEach(function(x){var ln=new String(at(x.set,x.team,x.raw)+' 請求 '+(x.back?'C 代 AC':'AC 代 C'));ln.accId=x.id;notes.push(ln)});",
        "  (s.acc||[]).forEach(function(x){var ln=new String(at(x.set,x.team,x.raw)+' 請求 '+(x.back?'C 代 AC':'AC 代 C'));ln.accId=x.id;notes.push(ln)});\n"
        "  (s.cancels||[]).forEach(function(x){notes.push(cxText(x,L))});")
t = one(t, "/* 記錄員自己寫的記事，一行算一項 */",
        "/* 11/13 輪轉錯誤／非法替補的記事：「第 1 局 A 隊 10:10 輪轉錯誤，B 隊得 1 分，取消 A 隊第 6～10 分，於 5:11 繼續比賽」。\n"
        "   發現時的比分是對方得分之前；最後一分不是對方得的（之後更正過）就不寫「得 1 分」 */\n"
        "function cxText(x,L){var o=other(x.team),d=x.gave?x.opp-1:x.opp;\n"
        "  return '第 '+x.set+' 局 '+L(x.team)+' '+x.from+':'+d+' '+(x.kind==='S'?'非法替補':'輪轉錯誤')+'，'+(x.gave?L(o)+'得 1 分，':'')+'取消 '+L(x.team)+'第 '+(x.to+1===x.from?x.from:(x.to+1)+'～'+x.from)+' 分，於 '+x.to+':'+x.opp+' 繼續比賽'}\n"
        "/* 記錄員自己寫的記事，一行算一項 */")

# ---------- 記錄表：取消的分數斜線留著，再得到同一分畫成叉 ----------
t = one(t, "  if(o.m)for(var v=o.m[0];v<=o.m[1]&&v<=maxv;v++){var q=cells[v];if(!q)continue;h+=ctL(q[0]-sz,q[1]+sz,q[0]+sz,q[1]-sz,.9);if(c.penPts[k].indexOf(v)>=0)h+=ctC(q[0],q[1],sz*1.45)}",
        "  if(o.m)for(var v=o.m[0];v<=o.m[1]&&v<=maxv;v++){var q=cells[v];if(!q)continue;h+=ctL(q[0]-sz,q[1]+sz,q[0]+sz,q[1]-sz,.9);if(c.penPts[k].indexOf(v)>=0)h+=ctC(q[0],q[1],sz*1.45)}\n"
        "  /* 11/13 輪轉錯誤取消的分數：原本的斜線留著；取消後再得到同一分，加反方向一條變成叉（學長的畫法） */\n"
        "  var pcn=(c.ptCnt||{})[k]||{},own=o.own||[1,maxv];\n"
        "  for(var v2=Math.max(1,own[0]);v2<=own[1]&&v2<=maxv;v2++){var q2=cells[v2],nv=pcn[v2]||0;if(!q2||!nv)continue;\n"
        "    if(!(o.m&&v2>=o.m[0]&&v2<=o.m[1]))h+=ctL(q2[0]-sz,q2[1]+sz,q2[0]+sz,q2[1]-sz,.9);\n"
        "    if(nv>1)h+=ctL(q2[0]-sz,q2[1]-sz,q2[0]+sz,q2[1]+sz,.9)}")
t = one(t, "    o+=ctBlock(s,3,A,G.B1,G.P1,{data:sw?{rounds:sw.rounds,subRows:sw.subRows,toRows:sw.toRows}:c,time:'start',m:[1,cA],letter:true});",
        "    o+=ctBlock(s,3,A,G.B1,G.P1,{data:sw?{rounds:sw.rounds,subRows:sw.subRows,toRows:sw.toRows}:c,time:'start',m:[1,cA],letter:true,own:[1,sw?sw.score[A]:99]});")
t = one(t, "    o+=ctBlock(s,3,A,G.B3,G.P3,{data:sw?c:svBlank(),chg:sw?sw.score[A]:null,m:sw?[sw.score[A]+1,c.score[A]]:null,pre:sw?sw.score[A]:0,hg:!!sw,letter:true});",
        "    o+=ctBlock(s,3,A,G.B3,G.P3,{data:sw?c:svBlank(),chg:sw?sw.score[A]:null,m:sw?[sw.score[A]+1,c.score[A]]:null,pre:sw?sw.score[A]:0,hg:!!sw,letter:true,own:sw?[sw.score[A]+1,99]:[1,0]});")

# ---------- 「其他」→「輪轉錯誤／非法替補」 ----------
t = one(t, "var MTEAM={exc:['例外替補','例外替補','subopen',' data-m=\"exc\"'],",
        "var MTEAM={rot:['輪轉錯誤／非法替補','哪一隊輪轉錯誤或非法替補','rotopen',''],exc:['例外替補','例外替補','subopen',' data-m=\"exc\"'],")
t = one(t, "'<section class=\"msec\"><h3 class=\"mhead\">比賽狀況</h3><div class=\"mgrid\">'+mb('injopen','INJ','傷停')+mb('injopen','INC','陣容不完整')+mb('injopen','FF','棄權')+'</div></section>'+",
        "'<section class=\"msec\"><h3 class=\"mhead\">比賽狀況</h3><div class=\"mgrid\">'+mb('injopen','INJ','傷停')+mb('injopen','INC','陣容不完整')+mb('injopen','FF','棄權')+'</div><div class=\"mgrid one\">'+mp('rot',mc.live,mc.live?'球在進行中，得分後才能用':'對方的 1 分先按得分，這裡取消犯錯隊的分數')+'</div></section>'+")
t = one(t, "  }else if(x.type==='tossfix'){",
        "  }else if(x.type==='rot'){ // 11/13 輪轉錯誤／非法替補：對方的 1 分照平常按得分，這裡只取消犯錯隊的分數、寫記事欄\n"
        "    var rc=s.sets[s.setNo],ro=other(k),rk=x.kind||'R',rp=rc.path||[],rf=rc.score[k],rA=sheetTeams(s,1).A,rL=function(q){return q===rA?'A 隊':'B 隊'};\n"
        "    h='<h2><span class=\"tpill '+k+'\">'+esc(tName(s,k))+'</span> '+(rk==='S'?'非法替補':'輪轉錯誤')+'</h2>';\n"
        "    var rwhy=!rc.started||rc.ended||setWinner(s)?'這局沒有在進行，不能用。':rc.live?'球在進行中，得分後才能用。':rc.cxRally===rc.rally?'剛剛已經取消過分數。要改追回的分數，先按「復原」再重做。':rp[rp.length-1]!==ro?'先給 '+tName(s,ro)+' 1 分：按「關閉」，按 '+tName(s,ro)+' 的「得分」，再回來這裡。':rf===0?tName(s,k)+' 現在 0 分，沒有分數可以取消。':'';\n"
        "    if(rwhy)h+='<p class=\"note\">'+esc(rwhy)+'</p><button data-act=\"close\">關閉</button>';\n"
        "    else if(x.to==null){\n"
        "      h+='<div class=\"seg\" style=\"flex:none\">'+[['R','輪轉錯誤'],['S','非法替補']].map(function(q){return '<button data-act=\"rotkind\" data-v=\"'+q[0]+'\" aria-pressed=\"'+(rk===q[0])+'\">'+q[1]+'</button>'}).join('')+'</div>'+\n"
        "        '<p class=\"subhint\">發現時 '+esc(tName(s,k))+' '+rf+':'+(rc.score[ro]-1)+'（'+esc(tName(s,ro))+'得分之前）</p>'+\n"
        "        '<div class=\"rotrow\"><label for=\"rot-to\">'+esc(tName(s,k))+' 追回到</label><input id=\"rot-to\" type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" maxlength=\"2\" autocomplete=\"off\" value=\"'+esc(x.tv||'')+'\"><span>分</span></div>'+\n"
        "        '<p class=\"muted\">'+(function(){var ex=Math.floor(rf/2);return '例如從第 '+(ex+1)+' 分開始錯，就填 '+ex+'，取消第 '+(ex+1===rf?rf:(ex+1)+'～'+rf)+' 分。'})()+'</p><button class=\"primary\" data-act=\"rotgo\">下一步</button>'+\n"
        "        (x.err?'<p class=\"warning\" role=\"alert\">'+esc(x.err)+'</p>':'')+'<p class=\"muted\">不知道從哪一分開始錯：分數不取消，按「關閉」就好。輪轉不會倒回。</p><button data-act=\"close\">關閉</button>';\n"
        "    }else{\n"
        "      stepBack='';\n"
        "      var rrec={set:s.setNo,team:k,kind:rk,from:rf,to:x.to,opp:rc.score[ro],gave:true};\n"
        "      h+='<p class=\"subhint\">'+esc(tName(s,k))+' '+rf+' 分改成 <b>'+x.to+'</b> 分，取消第 '+(x.to+1===rf?rf:(x.to+1)+'～'+rf)+' 分，比分變成 '+x.to+':'+rc.score[ro]+'。</p><p class=\"muted\">記事欄會寫：</p><p class=\"note\">'+esc(cxText(rrec,rL))+'</p>'+\n"
        "        '<div class=\"row\"><button data-act=\"rotback\">返回</button><button class=\"go\" data-act=\"rotdo\">確定取消</button></div>';\n"
        "    }\n"
        "  }else if(x.type==='tossfix'){")
t = one(t, "    case 'swap8': dispatch('SIDES_SWAPPED',{set:n}); break;",
        "    case 'swap8': dispatch('SIDES_SWAPPED',{set:n}); break;\n"
        "    case 'rotopen': ui.sheet={type:'rot',team:k,kind:'R'}; break;\n"
        "    case 'rotkind': ui.sheet.kind=b.getAttribute('data-v'); break;\n"
        "    case 'rotgo':\n"
        "      var rtv=(document.getElementById('rot-to')||{}).value||'',rtn=/^\\d{1,2}$/.test(rtv.trim())?Number(rtv.trim()):NaN,rtf=c.score[ui.sheet.team];\n"
        "      ui.sheet.tv=rtv.trim(); ui.sheet.err=isNaN(rtn)?'要填數字。':rtn>=rtf?'要填比 '+rtf+' 小的分數（0～'+(rtf-1)+'）。':null;\n"
        "      if(!ui.sheet.err)ui.sheet.to=rtn; break;\n"
        "    case 'rotback': ui.sheet.to=null; break;\n"
        "    case 'rotdo':\n"
        "      var rx=ui.sheet,rxf=c.score[rx.team];if(rx.to==null||!(rx.to<rxf)||c.live){ui.sheet.to=null;break}\n"
        "      dispatch('SCORE_CANCEL',{set:n,team:rx.team,kind:rx.kind||'R',to:rx.to});\n"
        "      ui.toast={t:'已取消 '+tName(s,rx.team)+' 第 '+(rx.to+1===rxf?rxf:(rx.to+1)+'～'+rxf)+' 分，記事欄寫好了',until:Date.now()+4000}; ui.sheet=null; break;")

t = one(t, ".endview>.ctv-set{max-width:1100px}\n",
        ".endview>.ctv-set{max-width:1100px}\n"
        "/* 11/13 輪轉錯誤／非法替補：追回到幾分 */\n"
        ".rotrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-weight:700;font-size:17px}\n"
        ".rotrow input{width:4.5em;min-height:52px;font-size:24px;font-weight:700;text-align:center}\n"
        ".rotrow label{font-size:17px;font-weight:700;color:inherit;margin:0}\n")

# 左右寫反對調：取消過分數也要先復原（不然對調後取消的分數會跑到另一隊）
t = one(t, "||s.injuries.some(function(x){return x.set===n});", "||s.injuries.some(function(x){return x.set===n})||(s.cancels||[]).some(function(x){return x.set===n});")
t = one(t, "這局已有替補、自由球員或判罰紀錄。請先按復原退回那些動作。", "這局已有替補、自由球員、判罰或取消分數的紀錄。請先按復原退回那些動作。")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

#!/usr/bin/env python3
"""11/20 積分分頁（使用者：每個盃賽算法不一樣，要能自己選用哪幾項、排先後）。先跑 patch_v97～v123。
預設照 115 南社盃秩序冊「拾貳、競賽辦法」：勝場 → 積分 → 局數比 → 分數比；2:0 勝 3 分、敗 0 分，2:1 勝 2 分、敗 1 分；
比值用整個循環賽的總數，分母 0 算最大；還是相同時兩隊看對戰結果、三隊以上抽籤；棄權照 0:2（每局 0:25）。
- 只算賽程裡打完的比賽；同兩隊第二次碰面（複賽、名次賽）不算
- 分組：照賽程誰跟誰打自動分；分成兩組以上時請使用者確認、可以把隊伍換到另一組；存在資料夾 rank.pools
- 名次規則存在資料夾 rank.rule（整個資料夾共用），匯入時比 rank.at，新的為主"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function rankTables' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

JS=r"""/* ===== 積分（11/20） ===== */
var RANK_KEYS=[['w','勝場'],['p','積分'],['s','局數比'],['r','分數比'],['pd','分數差']];
var RANK_PTS=[['fivb','直落勝 3 分、打滿局數勝 2 分、敗 1 分、直落敗 0 分','2:0 勝 3 分、2:1 勝 2 分、1:2 敗 1 分、0:2 敗 0 分'],['w21','勝 2 分、敗 1 分',''],['w10','勝 1 分、敗 0 分','']];
var RANK_TIE=[['two','只有兩隊同分看對戰結果，三隊以上抽籤'],['mini','同分的隊伍之間比勝場（對戰結果）'],['none','不看對戰結果，直接抽籤']];
function rankDefault(){return {pts:'fivb',keys:[{k:'w',on:true},{k:'p',on:true},{k:'s',on:true},{k:'r',on:true},{k:'pd',on:false}],tie:'two'}}
function rankRule(c){var r=c.rank&&c.rank.rule,d=rankDefault();if(!r)return d;var ks=(Array.isArray(r.keys)?r.keys:[]).filter(function(q){return q&&RANK_KEYS.some(function(x){return x[0]===q.k})});
  RANK_KEYS.forEach(function(x){if(!ks.some(function(q){return q.k===x[0]}))ks.push({k:x[0],on:false})});
  return {pts:RANK_PTS.some(function(x){return x[0]===r.pts})?r.pts:d.pts,keys:ks,tie:RANK_TIE.some(function(x){return x[0]===r.tie})?r.tie:d.tie}}
function rankSet(c,f){if(!c.rank||typeof c.rank!=='object')c.rank={};f(c.rank);c.rank.at=Date.now();save()}
/* 一場打完的結果：局數、分數（棄權照 0:2、每局 0:25） */
function rankRes(it,s){var w=setsWon(s),r={t1:{s:w.t1,p:0},t2:{s:w.t2,p:0}};
  if(s.forfeit){var fw=other(s.forfeit);r[fw]={s:2,p:50};r[s.forfeit]={s:0,p:0};return r}
  [1,2,3,4,5].forEach(function(n){var q=s.sets[n];if(q&&q.ended){r.t1.p+=q.score.t1;r.t2.p+=q.score.t2}});return r}
/* 這個男女組打完的循環賽場次（同兩隊只算第一次碰面） */
function rankGames(c,div){var seen={},out=[];
  liveSched(c).filter(function(it){return it.division===div&&it.t1&&it.t2&&it.t1!==it.t2}).sort(schedSort).forEach(function(it){
    var key=[it.t1,it.t2].sort().join('|');if(seen[key])return;seen[key]=1;
    var m=schedMatch(it),s=m?safeReduce(m):null;out.push({it:it,a:it.t1,b:it.t2,done:!!(s&&matchOver(s)),res:s&&matchOver(s)?rankRes(it,s):null})});
  return out}
/* 照賽程分組：誰跟誰排過（只看第一次碰面），連在一起的是同一組；存過的分組優先 */
function rankPools(c,div){var ts=liveTeams(c).filter(function(t){return t.division===div}),gs=rankGames(c,div),saved=c.rank&&c.rank.pools&&c.rank.pools[div];
  var inSched={};gs.forEach(function(g){inSched[g.a]=1;inSched[g.b]=1});ts=ts.filter(function(t){return inSched[t.id]});
  if(saved&&typeof saved==='object'){var by={},names=[];ts.forEach(function(t){var g=saved[t.id]||'';if(!by[g]){by[g]=[];names.push(g)}by[g].push(t.id)});
    names.sort(function(a,b){return (a===''?1:0)-(b===''?1:0)||a.localeCompare(b,'zh-Hant',{numeric:true})});
    return {saved:true,list:names.map(function(n){return {name:n,ids:by[n]}})}}
  var par={};function f(x){while(par[x]!==x)x=par[x]=par[par[x]];return x}
  ts.forEach(function(t){par[t.id]=t.id});gs.forEach(function(g){if(par[g.a]&&par[g.b])par[f(g.a)]=f(g.b)});
  var comp={},order=[];gs.forEach(function(g){[g.a,g.b].forEach(function(id){if(!par[id])return;var r=f(id);if(!comp[r]){comp[r]=[];order.push(r)}if(comp[r].indexOf(id)<0)comp[r].push(id)})});
  var L='ABCDEFGH';return {saved:false,list:order.map(function(r,i){return {name:order.length>1?L.charAt(i)+' 組':'',ids:comp[r]}})}}
function rankRatio(a,b){return b===0?(a>0?Infinity:(a===0?-1:0)):a/b}
function rankVal(st,k){return k==='w'?st.W:k==='p'?st.P:k==='s'?rankRatio(st.SW,st.SL):k==='r'?rankRatio(st.PW,st.PL):st.PW-st.PL}
/* 一組的名次：回傳排好的 [{id,st,rank,draw}] */
function rankPool(c,div,ids,rule){var gs=rankGames(c,div).filter(function(g){return ids.indexOf(g.a)>=0&&ids.indexOf(g.b)>=0}),S={};
  ids.forEach(function(id){S[id]={G:0,N:0,W:0,L:0,P:0,SW:0,SL:0,PW:0,PL:0}});
  gs.forEach(function(g){S[g.a].N++;S[g.b].N++;if(!g.done)return;var A=g.res.t1,B=g.res.t2,aw=A.s>B.s;
    [[g.a,A,B,aw],[g.b,B,A,!aw]].forEach(function(q){var t=S[q[0]],me=q[1],op=q[2],win=q[3];t.G++;if(win)t.W++;else t.L++;t.SW+=me.s;t.SL+=op.s;t.PW+=me.p;t.PL+=op.p;
      var full=Math.abs(me.s-op.s)===1&&Math.max(me.s,op.s)>=2;t.P+=rule.pts==='w21'?(win?2:1):rule.pts==='w10'?(win?1:0):win?(full?2:3):(full?1:0)})});
  var ks=rule.keys.filter(function(q){return q.on}).map(function(q){return q.k});
  function cmp(a,b){for(var i=0;i<ks.length;i++){var x=rankVal(S[a],ks[i]),y=rankVal(S[b],ks[i]);if(x!==y)return y>x?1:-1}return 0}
  function h2h(a,b){var g=gs.filter(function(q){return q.done&&(q.a===a&&q.b===b||q.a===b&&q.b===a)})[0];if(!g)return 0;var aw=(g.a===a)===(g.res.t1.s>g.res.t2.s);return aw?-1:1}
  var arr=ids.slice().sort(function(a,b){return cmp(a,b)||(S[b].G-S[a].G)}),out=[],i=0;
  while(i<arr.length){var j=i+1;while(j<arr.length&&cmp(arr[i],arr[j])===0)j++;var grp=arr.slice(i,j),draw=false;
    if(grp.length>1&&grp.some(function(id){return S[id].G})){
      if(grp.length===2&&rule.tie!=='none'){var h=h2h(grp[0],grp[1]);if(h>0)grp.reverse();else if(!h)draw=true}
      else if(grp.length>2&&rule.tie==='mini'){var mw={};grp.forEach(function(a){mw[a]=0;grp.forEach(function(b){if(a!==b&&h2h(a,b)<0)mw[a]++})});grp.sort(function(a,b){return mw[b]-mw[a]});
        var vals=grp.map(function(a){return mw[a]});draw=vals.some(function(v,k){return vals.indexOf(v)!==k})}
      else draw=true}
    grp.forEach(function(id,k){out.push({id:id,st:S[id],rank:draw?i+1:i+k+1,draw:draw&&grp.length>1})});i=j}
  return {rows:out,games:gs}}
function rankFmt(v){return v===Infinity?'最大':v<0?'–':v.toFixed(3)}
function rankTables(c,div){var P=rankPools(c,div),rule=rankRule(c);if(!P.list.length)return '';
  return P.list.map(function(g){var R=rankPool(c,div,g.ids,rule),done=R.games.filter(function(q){return q.done}).length;
    return '<section class="rksec"><div class="shead"><h2>'+esc(g.name?g.name:(P.list.length>1?'還沒分組':div))+'</h2><span class="muted">打完 '+done+'／'+R.games.length+' 場</span></div><div class="rkwrap"><table class="rktable"><thead><tr><th>名次</th><th class="rkn">隊名</th><th>勝敗</th><th>積分</th><th>局數</th><th>分數</th></tr></thead><tbody>'+
      R.rows.map(function(q){var t=schedTeam(c,q.id),st=q.st,pl=st.G>0;return '<tr'+(q.draw?' class="rkdraw"':'')+'><td class="rkr">'+(pl?q.rank:'–')+'</td><td class="rkn"><strong>'+esc(t?t.team.name:'')+'</strong>'+(q.draw?'<small>同分，需抽籤</small>':'')+'</td><td>'+st.W+'-'+st.L+'</td><td><b>'+st.P+'</b></td><td>'+st.SW+':'+st.SL+(pl?'<small>'+rankFmt(rankRatio(st.SW,st.SL))+'</small>':'')+'</td><td>'+st.PW+':'+st.PL+(pl?'<small>'+rankFmt(rankRatio(st.PW,st.PL))+'</small>':'')+'</td></tr>'}).join('')+'</tbody></table></div></section>'}).join('')}
function rankSecHtml(c){var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],P=rankPools(c,div),rule=rankRule(c);
  var seg='<div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="cupdiv" data-v="'+d+'" aria-pressed="'+(div===d)+'">'+d+'</button>'}).join('')+'</div>';
  var ks=rule.keys.filter(function(q){return q.on}).map(function(q){return RANK_KEYS.filter(function(x){return x[0]===q.k})[0][1]}),tie=RANK_TIE.filter(function(x){return x[0]===rule.tie})[0][1];
  var head='<div class="rkrule"><p class="muted">名次：'+esc(ks.join(' → '))+'。'+esc(tie)+'。</p><div class="row"><button data-act="rkrule">名次規則</button>'+(P.list.length?'<button data-act="rkgrp">分組</button>':'')+'</div></div>';
  if(!P.list.length)return seg+'<p class="muted">'+esc(div)+'賽程裡還沒有排好兩隊的比賽。排好賽程、打完比賽，這裡就會算名次。</p>'+head;
  var ask=!P.saved&&P.list.length>1?'<div class="note rkask">照賽程分成 '+P.list.length+' 組，組名是照賽程先後取的，請確認一下。<button data-act="rkgrp">確認分組</button></div>':'';
  return seg+ask+rankTables(c,div)+head+'<p class="muted rkfoot">只算賽程裡打完的比賽；同兩隊第二次碰面（複賽、名次賽）不算。棄權照 0:2（每局 0:25）算。</p>'}
function rankSheetHtml(x,c){var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0];
  if(x.type==='rkrule'){var r=rankRule(c);
    return '<h2>名次規則（整個資料夾）</h2><h3>積分</h3><div class="rlist">'+RANK_PTS.map(function(p){return '<button class="imp rkopt" data-act="rkpts" data-v="'+p[0]+'" aria-pressed="'+(r.pts===p[0])+'"><span>'+esc(p[1])+'</span>'+(p[2]?'<small>'+esc(p[2])+'</small>':'')+'</button>'}).join('')+'</div>'+
      '<h3>比較順序</h3><p class="muted">勾的項目由上往下比，用箭頭調先後。</p><div class="rklist">'+r.keys.map(function(q,i){var lb=RANK_KEYS.filter(function(x){return x[0]===q.k})[0][1];
        return '<div class="rkkey"><button class="rkon" data-act="rkkey" data-v="'+q.k+'" aria-pressed="'+q.on+'"><span class="bkbox" aria-hidden="true"></span>'+lb+'</button><button data-act="rkmove" data-v="'+q.k+'" data-d="-1" aria-label="'+lb+'往上"'+(i?'':' disabled')+'>↑</button><button data-act="rkmove" data-v="'+q.k+'" data-d="1" aria-label="'+lb+'往下"'+(i<r.keys.length-1?'':' disabled')+'>↓</button></div>'}).join('')+'</div>'+
      '<h3>還是同分</h3><div class="rlist">'+RANK_TIE.map(function(p){return '<button class="imp rkopt" data-act="rktie" data-v="'+p[0]+'" aria-pressed="'+(r.tie===p[0])+'"><span>'+esc(p[1])+'</span></button>'}).join('')+'</div>'+
      '<p class="muted">局數比是勝局÷負局，分數比是得分÷失分，用整個循環賽的總數；負的是 0 時算最大。</p><button data-act="rkreset">恢復預設（南社盃秩序冊）</button><button class="primary" data-act="close">完成</button>'}
  if(x.type==='rkgrp'){var P=rankPools(c,div),names=P.list.map(function(g){return g.name}).filter(Boolean),L='ABCDEFGH';
    if(!names.length)names=['A 組'];if(names.length<8)names=names.concat([L.charAt(names.length)+' 組']);
    var cur={};P.list.forEach(function(g){g.ids.forEach(function(id){cur[id]=g.name})});if(x.pick)Object.keys(x.pick).forEach(function(id){cur[id]=x.pick[id]});
    var ids=[];P.list.forEach(function(g){g.ids.slice().sort(function(a,b){return teamSort(schedTeam(c,a),schedTeam(c,b))}).forEach(function(id){ids.push(id)})});
    return '<h2>'+esc(div)+'分組</h2><p class="muted">點隊伍旁邊的組別換組。全部同一組就是一張積分表。</p><div class="rlist rkglist">'+ids.map(function(id){var t=schedTeam(c,id);
      return '<div class="rkgrow"><strong>'+esc(t?t.team.name:'')+'</strong><div class="seg">'+names.map(function(n){return '<button data-act="rkgset" data-id="'+esc(id)+'" data-v="'+esc(n)+'" aria-pressed="'+(cur[id]===n)+'">'+esc(n.replace(' 組',''))+'</button>'}).join('')+'</div></div>'}).join('')+'</div>'+
      '<div class="row scpbtns"><button class="ghost" data-act="close">取消</button><button class="primary" data-act="rkgsave">確定分組</button></div>'+(P.saved?'<button class="linkbtn" data-act="rkgauto">改回照賽程自動分</button>':'')}
  return ''}
function rankAct(act,b){var c=theCup(),x=ui.cupSheet;if(!c)return false;var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0];
  switch(act){
    case 'rkrule': ui.cupSheet={type:'rkrule'}; return true;
    case 'rkgrp': ui.cupSheet={type:'rkgrp',pick:{}}; return true;
    case 'rkpts': rankSet(c,function(r){var q=rankRule(c);q.pts=b.getAttribute('data-v');r.rule=q}); return true;
    case 'rktie': rankSet(c,function(r){var q=rankRule(c);q.tie=b.getAttribute('data-v');r.rule=q}); return true;
    case 'rkkey': rankSet(c,function(r){var q=rankRule(c);q.keys.forEach(function(k){if(k.k===b.getAttribute('data-v'))k.on=!k.on});r.rule=q}); return true;
    case 'rkmove': rankSet(c,function(r){var q=rankRule(c),i=-1;q.keys.forEach(function(k,j){if(k.k===b.getAttribute('data-v'))i=j});var j2=i+Number(b.getAttribute('data-d'));
      if(i>=0&&j2>=0&&j2<q.keys.length){var t=q.keys[i];q.keys[i]=q.keys[j2];q.keys[j2]=t}r.rule=q}); return true;
    case 'rkreset': rankSet(c,function(r){r.rule=rankDefault()}); return true;
    case 'rkgset': if(x&&x.type==='rkgrp'){x.pick=x.pick||{};x.pick[b.getAttribute('data-id')]=b.getAttribute('data-v')} return true;
    case 'rkgsave': if(x&&x.type==='rkgrp'){var P=rankPools(c,div),m={};P.list.forEach(function(g){g.ids.forEach(function(id){m[id]=g.name||'A 組'})});Object.keys(x.pick||{}).forEach(function(id){m[id]=x.pick[id]});
      var used=[];Object.keys(m).forEach(function(id){if(used.indexOf(m[id])<0)used.push(m[id])});if(used.length===1)Object.keys(m).forEach(function(id){m[id]=''});
      rankSet(c,function(r){r.pools=r.pools||{};r.pools[div]=m});ui.cupSheet=null} return true;
    case 'rkgauto': rankSet(c,function(r){if(r.pools)delete r.pools[div]});ui.cupSheet=null; return true;
  }
  return false}
function schedSec(c){"""
one("function schedSec(c){",JS)
# 分頁
one("""  var tabs=[['sched','賽程',liveSched(c).length],['teams','隊伍',liveTeams(c).length]].concat(XP_ON?[['refs','裁判',cts.length]]:[]);""",
"""  var rkDone=CUP_DIVS.reduce(function(n,d){return n+rankGames(c,d).filter(function(g){return g.done}).length},0);
  var tabs=[['sched','賽程',liveSched(c).length],['rank','積分',rkDone],['teams','隊伍',liveTeams(c).length]].concat(XP_ON?[['refs','裁判',cts.length]]:[]);""")
one("""  var body=tab==='refs'?refSec:tab==='teams'?seg+teamSec:""","""  var body=tab==='refs'?refSec:tab==='rank'?rankSecHtml(c):tab==='teams'?seg+teamSec:""")
one("""  else if(/^sc/.test(x.type)){h=schedSheetHtml(x,c,err);""","""  else if(/^rk/.test(x.type))h=rankSheetHtml(x,c);
  else if(/^sc/.test(x.type)){h=schedSheetHtml(x,c,err);""")
one("""    case 'scpgo': regMake(); return;""","""    case 'rkrule': case 'rkgrp': case 'rkpts': case 'rktie': case 'rkkey': case 'rkmove': case 'rkreset': case 'rkgset': case 'rkgsave': case 'rkgauto': rankAct(act,b); break;
    case 'scpgo': regMake(); return;""")
# 匯入：名次規則、分組跟著資料夾走，新的為主
one("""    var p={merged:!!al,id:c.id,name:c.name,at:c.at||0,createdAt:c.createdAt||'',isNew:!h,teams:teams,refs:refs,addT:0,updT:0,delT:0,addR:{},delR:{},ren:false};""",
"""    var p={merged:!!al,id:c.id,name:c.name,at:c.at||0,createdAt:c.createdAt||'',isNew:!h,teams:teams,refs:refs,addT:0,updT:0,delT:0,addR:{},delR:{},ren:false};
    p.rank=c.rank&&typeof c.rank==='object'&&!Array.isArray(c.rank)?c.rank:null;p.rankNew=!!(p.rank&&(!h||!h.rank||(p.rank.at||0)>(h.rank.at||0)));""")
one("""    if(!h){db.cups.push({id:p.id,name:p.name,createdAt:p.createdAt,at:p.at,teams:p.teams,refs:p.refs,sched:p.sched});return}""",
"""    if(!h){var nc={id:p.id,name:p.name,createdAt:p.createdAt,at:p.at,teams:p.teams,refs:p.refs,sched:p.sched};if(p.rank)nc.rank=p.rank;db.cups.push(nc);return}
    if(p.rankNew)h.rank=p.rank;""")
one("function cupChanged(c){return c.merged||c.isNew||c.ren||","function cupChanged(c){return c.merged||c.isNew||c.ren||c.rankNew||")
one("""if(c.updT)a.push('更新 '+c.updT+' 隊名單');""","""if(c.updT)a.push('更新 '+c.updT+' 隊名單');if(c.rankNew&&!c.isNew)a.push('積分的分組、名次規則');""")
# 樣式
one(".scpbtns>button{flex:1 1 0}",""".scpbtns>button{flex:1 1 0}
.rksec{margin-bottom:16px}
.rkwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.rktable{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:15px}
.rktable th{font-size:13px;font-weight:600;color:var(--muted);text-align:center;padding:6px 4px;border-bottom:1px solid var(--line2);white-space:nowrap}
.rktable td{text-align:center;padding:8px 4px;border-bottom:1px solid var(--line);vertical-align:middle;white-space:nowrap}
.rktable td small{display:block;font-size:12px;color:var(--muted)}
.rktable .rkn{text-align:left;white-space:normal;min-width:6em}
.rktable .rkn small{color:var(--warn-ink,var(--ink));font-weight:600}
.rktable .rkr{font-size:18px;font-weight:800;width:2.4em}
.rkdraw td{background:var(--soft)}
.rkrule{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.rkask{display:flex;flex-direction:column;gap:8px}
.rkfoot{font-size:13px}
.rklist{display:flex;flex-direction:column;gap:6px}
.sheet .rkglist,.sheet .rklist,.sheet .rlist:has(.rkopt){flex-shrink:0}
.rkkey{display:grid;grid-template-columns:minmax(0,1fr) 48px 48px;gap:6px}
.rkkey>button{min-height:44px}
.rkon{display:flex;align-items:center;gap:10px;justify-content:flex-start;text-align:left}
.rkon .bkbox{flex:none}
.rkon[aria-pressed="true"] .bkbox{background:var(--ink);border-color:var(--ink)}
.rkon[aria-pressed="true"] .bkbox::after{content:"\\2713"}
.rkgrow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)}
.rkgrow strong{min-width:0;overflow-wrap:anywhere}
.rkgrow .seg{flex:none;display:flex;flex-wrap:nowrap}
.sheet .imp.rkopt{flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;height:auto;min-height:52px;padding-block:8px;flex-shrink:0}
.sheet .imp.rkopt+.imp.rkopt{margin-top:6px}
.sheet .imp.rkopt>span,.sheet .imp.rkopt>small{white-space:normal;text-align:left}
.rkgrow .seg button{min-width:48px;min-height:44px}""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v124')

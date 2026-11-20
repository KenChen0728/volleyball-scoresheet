#!/usr/bin/env python3
"""11/21 凌晨使用者測積分分頁（語音）後的改版。先跑 patch_v97～v126。取代 patch_v124 的積分程式。
積分表
- 「勝敗」改成「勝」（粗體）和「場」（打了幾場，看得出誰少打）兩欄
- 表頭寫清楚：「勝局:敗局」下面「局數比」、「得分:失分」下面「得失分比」
- 每一隊右邊「明細」：每一場的對手、各局比分、這場拿幾分，最下面寫每一項怎麼加的
- 分組多一排「A 組｜B 組」，一次看一組；有要抽籤的組在按鈕上加橘點
- 抽籤：組名旁邊橘色「需抽籤」；名次格寫「1–2 抽籤」這種範圍，點了填大會抽出來的順序（程式不抽），填了寫「抽籤決定」
- 每組取前幾名（預設：分兩組以上取 2 名、一組不取）：整組打完時標「晉級」並畫線；要抽籤的跨過晉級線就寫「抽籤決定晉級」
分組
- 分組就是隊伍的「組別」：「隊伍」分頁「男子組｜女子組」旁邊多一顆「分組」，視窗裡男女組可以切換、隊伍順序固定不跳、組名可以改、設取幾名
- 隊伍分頁照組別分段；都沒填組別時照預賽賽程自動分，積分頁提醒到「分組」確認
賽程
- 新增比賽多「賽別」：預賽（預設）、複賽、冠亞賽、季殿賽；只有預賽算積分（同兩隊第二次碰面不算的規則拿掉）
- 隊伍還沒確定時可以點「A 組第 1 名」「第 7 場勝隊」這類，名次確定、比賽打完就自動帶入（開始記錄時寫進賽程）
- 賽程列每局贏的那一邊比分變綠色粗體
捷徑
- 主畫面今天的賽程上面有「賽程｜積分｜隊伍」三顆，直接進資料夾那一頁
- 打完的比賽結果頁「看積分」，直接到那一組的積分表"""
import sys,re
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function rankDetHtml' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

A=s.index('/* ===== 積分（11/20） ===== */');B=s.index('function schedSec(c){',A)
JS=r"""/* ===== 積分（11/20 起，11/21 改版） ===== */
var RANK_KEYS=[['w','勝場'],['p','積分'],['s','局數比'],['r','得失分比'],['pd','得失分差']];
var RANK_PTS=[['fivb','直落勝 3 分、打滿局數勝 2 分、敗 1 分、直落敗 0 分','2:0 勝 3 分、2:1 勝 2 分、1:2 敗 1 分、0:2 敗 0 分'],['w21','勝 2 分、敗 1 分',''],['w10','勝 1 分、敗 0 分','']];
var RANK_TIE=[['two','只有兩隊同分看對戰結果，三隊以上抽籤'],['mini','同分的隊伍之間比勝場（對戰結果）'],['none','不看對戰結果，直接抽籤']];
var STAGES=['預賽','複賽','冠亞賽','季殿賽'];
function stageOf(it){return it&&STAGES.indexOf(it.stage)>0?it.stage:'預賽'}
function rankDefault(){return {pts:'fivb',keys:[{k:'w',on:true},{k:'p',on:true},{k:'s',on:true},{k:'r',on:true},{k:'pd',on:false}],tie:'two'}}
function rankRule(c){var r=c.rank&&c.rank.rule,d=rankDefault();if(!r)return d;var ks=(Array.isArray(r.keys)?r.keys:[]).filter(function(q){return q&&RANK_KEYS.some(function(x){return x[0]===q.k})});
  RANK_KEYS.forEach(function(x){if(!ks.some(function(q){return q.k===x[0]}))ks.push({k:x[0],on:false})});
  return {pts:RANK_PTS.some(function(x){return x[0]===r.pts})?r.pts:d.pts,keys:ks,tie:RANK_TIE.some(function(x){return x[0]===r.tie})?r.tie:d.tie}}
function rankSet(c,f){if(!c.rank||typeof c.rank!=='object')c.rank={};f(c.rank);c.rank.at=Date.now();save()}
/* 一場的結果（棄權照 0:2、每局 0:25），sets 是每局 [左, 右] */
function rankRes(it,s){var w=setsWon(s),r={t1:{s:w.t1,p:0},t2:{s:w.t2,p:0},sets:[],ff:''};
  if(s.forfeit){var fw=other(s.forfeit);r[fw]={s:2,p:50};r[s.forfeit]={s:0,p:0};r.ff=s.forfeit;r.sets=[[fw==='t1'?25:0,fw==='t1'?0:25],[fw==='t1'?25:0,fw==='t1'?0:25]];return r}
  [1,2,3,4,5].forEach(function(n){var q=s.sets[n];if(q&&q.ended){r.t1.p+=q.score.t1;r.t2.p+=q.score.t2;r.sets.push([q.score.t1,q.score.t2])}});return r}
function rankPts(rule,me,op){var win=me.s>op.s,full=Math.abs(me.s-op.s)===1&&Math.max(me.s,op.s)>=2;return rule.pts==='w21'?(win?2:1):rule.pts==='w10'?(win?1:0):win?(full?2:3):(full?1:0)}
/* 這個男女組的預賽（賽別是預賽、兩隊都定了） */
function rankGames(c,div){return liveSched(c).filter(function(it){return it.division===div&&stageOf(it)==='預賽'&&it.t1&&it.t2&&it.t1!==it.t2}).sort(schedSort).map(function(it){
  var m=schedMatch(it),s=m?safeReduce(m):null,dn=!!(s&&matchOver(s));return {it:it,a:it.t1,b:it.t2,done:dn,res:dn?rankRes(it,s):null}})}
function poolLabel(n){n=String(n||'');return !n?'':/組$/.test(n)?n:/^[A-Za-z0-9]+$/.test(n)?n+' 組':n+'組'}
function poolStore(n){n=String(n||'').trim();return !n?'':/組$/.test(n)?n:n+'組'}
/* 分組：隊伍有填組別就照組別；都沒填就照預賽誰跟誰打，連在一起的是一組（還沒確認） */
function rankPools(c,div){var ts=liveTeams(c).filter(function(t){return t.division===div}),gs=rankGames(c,div),play={};gs.forEach(function(g){play[g.a]=1;play[g.b]=1});
  if(ts.some(function(t){return groupName(t.group)})){var by={},names=[];ts.forEach(function(t){var g=groupName(t.group);if(!g&&!play[t.id])return;if(!by[g]){by[g]=[];names.push(g)}by[g].push(t.id)});
    names.sort(function(a,b){var la=/^[A-Za-z0-9]/.test(a)?0:1,lb=/^[A-Za-z0-9]/.test(b)?0:1;return (a===''?1:0)-(b===''?1:0)||la-lb||a.localeCompare(b,'zh-Hant',{numeric:true})});
    return {saved:true,list:names.map(function(n){return {name:n,ids:by[n]}})}}
  var par={};function f(x){while(par[x]!==x)x=par[x]=par[par[x]];return x}
  ts.forEach(function(t){if(play[t.id])par[t.id]=t.id});gs.forEach(function(g){if(par[g.a]&&par[g.b])par[f(g.a)]=f(g.b)});
  var comp={},order=[];gs.forEach(function(g){[g.a,g.b].forEach(function(id){if(!par[id])return;var r=f(id);if(!comp[r]){comp[r]=[];order.push(r)}if(comp[r].indexOf(id)<0)comp[r].push(id)})});
  var L='ABCDEFGH';return {saved:false,list:order.map(function(r,i){return {name:order.length>1?L.charAt(i):'',ids:comp[r]}})}}
function rankAdv(c,div,n){var a=c.rank&&c.rank.adv&&c.rank.adv[div];return typeof a==='number'?a:(n>1?2:0)}
function rankRatio(a,b){return b===0?(a>0?Infinity:(a===0?-1:0)):a/b}
function rankVal(st,k){return k==='w'?st.W:k==='p'?st.P:k==='s'?rankRatio(st.SW,st.SL):k==='r'?rankRatio(st.PW,st.PL):st.PW-st.PL}
function rankDrawKey(div,from,ids){return div+'|'+from+'|'+ids.slice().sort().join(',')} // 不含組名：改組名後抽籤結果還在
/* 一組的名次：rows=[{id,st,rank,draw,from,to,key,drawn}] */
function rankPool(c,div,pool){var ids=pool.ids,rule=rankRule(c),gs=rankGames(c,div).filter(function(g){return ids.indexOf(g.a)>=0&&ids.indexOf(g.b)>=0}),S={};
  ids.forEach(function(id){S[id]={G:0,W:0,L:0,P:0,SW:0,SL:0,PW:0,PL:0}});
  gs.forEach(function(g){if(!g.done)return;[[g.a,g.res.t1,g.res.t2],[g.b,g.res.t2,g.res.t1]].forEach(function(q){var t=S[q[0]],me=q[1],op=q[2];t.G++;if(me.s>op.s)t.W++;else t.L++;t.SW+=me.s;t.SL+=op.s;t.PW+=me.p;t.PL+=op.p;t.P+=rankPts(rule,me,op)})});
  var ks=rule.keys.filter(function(q){return q.on}).map(function(q){return q.k});
  function cmp(a,b){for(var i=0;i<ks.length;i++){var x=rankVal(S[a],ks[i]),y=rankVal(S[b],ks[i]);if(x!==y)return y>x?1:-1}return 0}
  function h2h(a,b){var g=gs.filter(function(q){return q.done&&(q.a===a&&q.b===b||q.a===b&&q.b===a)})[0];if(!g)return 0;var aw=(g.a===a)===(g.res.t1.s>g.res.t2.s);return aw?-1:1}
  var arr=ids.slice().sort(function(a,b){return cmp(a,b)||(S[b].G-S[a].G)}),out=[],i=0,draws=c.rank&&c.rank.draws||{};
  while(i<arr.length){var j=i+1;while(j<arr.length&&cmp(arr[i],arr[j])===0)j++;var grp=arr.slice(i,j),draw=false;
    if(grp.length>1&&grp.some(function(id){return S[id].G})){
      if(grp.length===2&&rule.tie!=='none'){var h=h2h(grp[0],grp[1]);if(h>0)grp.reverse();else if(!h)draw=true}
      else if(grp.length>2&&rule.tie==='mini'){var mw={};grp.forEach(function(a){mw[a]=0;grp.forEach(function(b){if(a!==b&&h2h(a,b)<0)mw[a]++})});grp.sort(function(a,b){return mw[b]-mw[a]});
        var vals=grp.map(function(a){return mw[a]});draw=vals.some(function(v,k){return vals.indexOf(v)!==k})}
      else draw=true}
    var key=draw?rankDrawKey(div,i+1,grp):'',dr=key&&draws[key],drawn=false;
    if(dr&&dr.length===grp.length&&grp.every(function(id){return dr.indexOf(id)>=0})){grp=dr.slice();draw=false;drawn=true}
    grp.forEach(function(id,k){out.push({id:id,st:S[id],rank:draw?i+1:i+k+1,draw:draw,from:i+1,to:j,key:key,drawn:drawn})});i=j}
  return {rows:out,games:gs,done:gs.length>0&&gs.every(function(g){return g.done})}}
function rankFmt(v){return v===Infinity?'最大':v<0?'–':v.toFixed(3)}
function rankNeedDraw(R){return R.rows.some(function(q){return q.draw})}
function rankTable(c,div,P,pool){var R=rankPool(c,div,pool),adv=rankAdv(c,div,P.list.length),done=R.games.filter(function(q){return q.done}).length;
  var head='<div class="rkhead"><h2>'+esc(pool.name?poolLabel(pool.name):(P.list.length>1?'未分組':div))+'</h2>'+(rankNeedDraw(R)?'<span class="rktag">需抽籤</span>':'')+'<span class="muted">打完 '+done+'／'+R.games.length+' 場</span></div>';
  var rows=R.rows.map(function(q,ix){var t=schedTeam(c,q.id),st=q.st,pl=st.G>0,cut=adv>0&&ix===adv-1&&ix<R.rows.length-1,note='';
    var rc=!pl?'–':q.draw?'<button class="rkdrawbtn" data-act="rkdraw" data-key="'+esc(q.key)+'" aria-label="第 '+q.from+(q.to>q.from?' 到 '+q.to:'')+' 名抽籤，點了填抽籤結果"><b>'+q.from+(q.to>q.from?'–'+q.to:'')+'</b><small>抽籤</small></button>':q.rank+(q.drawn?'<small class="rkdrawn">抽籤</small>':'');
    if(q.draw&&adv>0)note=q.from<=adv&&q.to>adv?'<small class="rkwarn">抽籤決定晉級</small>':q.to<=adv?'<small class="rkok">都晉級，抽籤排名次</small>':'';
    else if(R.done&&adv>0&&pl&&q.rank<=adv)note='<small class="rkok">晉級</small>';
    return '<tr class="'+(q.draw?'rkdraw':'')+(cut?' rkcut':'')+'"><td class="rkr">'+rc+'</td><td class="rkn"><strong>'+esc(t?t.team.name:'')+'</strong>'+note+'<button class="rkdet rkdet2" data-act="rkdet" data-id="'+esc(q.id)+'" aria-label="'+esc(t?t.team.name:'')+' 明細">明細 ›</button></td><td><b>'+st.W+'</b></td><td>'+st.G+'</td><td><b>'+st.P+'</b></td><td>'+st.SW+':'+st.SL+(pl?'<small>'+rankFmt(rankRatio(st.SW,st.SL))+'</small>':'')+'</td><td>'+st.PW+':'+st.PL+(pl?'<small>'+rankFmt(rankRatio(st.PW,st.PL))+'</small>':'')+'</td><td class="rkdc"><button class="rkdet" data-act="rkdet" data-id="'+esc(q.id)+'" aria-label="'+esc(t?t.team.name:'')+' 明細">明細</button></td></tr>'}).join('');
  return '<section class="rksec">'+head+'<div class="rkwrap"><table class="rktable"><thead><tr><th>名次</th><th class="rkn">隊名</th><th>勝</th><th>場</th><th>積分</th><th>勝局:敗局<small>局數比</small></th><th>得分:失分<small>得失分比</small></th><th class="rkdc"><span class="vh">明細</span></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+(adv>0?'<p class="muted rkfoot">每組取前 '+adv+' 名'+(R.done?'':'，整組打完才標晉級')+'。</p>':'')+'</section>'}
function rankSecHtml(c){var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],P=rankPools(c,div),rule=rankRule(c);
  var seg='<div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="cupdiv" data-v="'+d+'" aria-pressed="'+(div===d)+'">'+d+'</button>'}).join('')+'</div>';
  var ks=rule.keys.filter(function(q){return q.on}).map(function(q){return RANK_KEYS.filter(function(x){return x[0]===q.k})[0][1]}),tie=RANK_TIE.filter(function(x){return x[0]===rule.tie})[0][1];
  var foot='<div class="rkrule"><p class="muted">名次：'+esc(ks.join(' → '))+'。'+esc(tie)+'。只算預賽打完的比賽。</p><div class="row"><button data-act="rkrule">名次規則</button><button data-act="rkgrp">分組</button></div></div>';
  if(!P.list.length)return seg+'<p class="muted">'+esc(div)+'還沒有預賽的賽程。排好賽程、打完比賽，這裡就會算名次。</p>'+foot;
  var pn=P.list.map(function(g){return g.name});if(pn.indexOf(cupView.pool)<0)cupView.pool=pn[0];
  var pool=P.list.filter(function(g){return g.name===cupView.pool})[0];
  var ptabs=P.list.length>1?'<div class="seg rkpools">'+P.list.map(function(g){var nd=rankNeedDraw(rankPool(c,div,g));return '<button data-act="rkpool" data-v="'+esc(g.name)+'" aria-pressed="'+(g.name===cupView.pool)+'">'+esc(g.name?poolLabel(g.name):'未分組')+(nd?'<i class="rkdot" aria-label="需抽籤"></i>':'')+'</button>'}).join('')+'</div>':'';
  var ask=!P.saved&&P.list.length>1?'<div class="note rkask"><span>照賽程分成 '+P.list.length+' 組，組名請確認。</span><button data-act="rkgrp">分組</button></div>':'';
  return seg+ptabs+ask+rankTable(c,div,P,pool)+foot}
/* 明細：這一隊每一場怎麼算 */
function rankDetHtml(c,x){var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],P=rankPools(c,div),pool=P.list.filter(function(g){return g.ids.indexOf(x.id)>=0})[0],t=schedTeam(c,x.id),rule=rankRule(c);
  if(!pool||!t)return '<h2>明細</h2><p class="muted">找不到這一隊。</p><button data-act="close">關閉</button>';
  var R=rankPool(c,div,pool),me=R.rows.filter(function(q){return q.id===x.id})[0],st=me.st,nos=schedNos(c),pts=[];
  var gl=R.games.filter(function(g){return g.a===x.id||g.b===x.id}).map(function(g){var k=g.a===x.id?'t1':'t2',o=k==='t1'?g.b:g.a,ot=schedTeam(c,o),line;
    if(!g.done)line='<span class="muted">還沒打</span>';
    else{var my=g.res[k],op=g.res[k==='t1'?'t2':'t1'],p=rankPts(rule,my,op);pts.push(p);
      line='<div class="rkds"><b class="'+(my.s>op.s?'win':'lose')+'">'+my.s+':'+op.s+'</b><small>'+(g.res.ff?(g.res.ff===k?'本隊棄權':'對方棄權')+'（每局 0:25）':g.res.sets.map(function(q){return k==='t1'?q[0]+':'+q[1]:q[1]+':'+q[0]}).join('、'))+'</small></div>';line='<em>積分 '+p+'</em>'+line}
    return '<div class="rkdg"><span class="rkdo">第 '+nos[g.it.id]+' 場　對 '+esc(ot?ot.team.name:'')+'</span>'+line+'</div>'}).join('');
  return '<h2>'+esc(t.team.name)+'　明細</h2><p class="muted">'+esc((pool.name?poolLabel(pool.name)+'・':'')+div)+'預賽</p><div class="rkdlist">'+gl+'</div>'+
    '<dl class="rkdsum"><dt>勝場</dt><dd>'+st.W+' 勝 '+st.L+' 敗（打了 '+st.G+' 場）</dd><dt>積分</dt><dd>'+(pts.length?pts.join(' + ')+' = '+st.P:'0')+'</dd>'+
    '<dt>局數比</dt><dd>勝 '+st.SW+' 局 ÷ 敗 '+st.SL+' 局 = '+rankFmt(rankRatio(st.SW,st.SL))+'</dd><dt>得失分比</dt><dd>得 '+st.PW+' 分 ÷ 失 '+st.PL+' 分 = '+rankFmt(rankRatio(st.PW,st.PL))+'</dd></dl><button class="primary" data-act="close">關閉</button>'}
function rankSheetHtml(x,c){var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0];
  if(x.type==='rkdet')return rankDetHtml(c,x);
  if(x.type==='rkrule'){var r=rankRule(c);
    return '<h2>名次規則（整個資料夾）</h2><h3>積分</h3><div class="rlist">'+RANK_PTS.map(function(p){return '<button class="imp rkopt" data-act="rkpts" data-v="'+p[0]+'" aria-pressed="'+(r.pts===p[0])+'"><span>'+esc(p[1])+'</span>'+(p[2]?'<small>'+esc(p[2])+'</small>':'')+'</button>'}).join('')+'</div>'+
      '<h3>比較順序</h3><p class="muted">勾的項目由上往下比，用箭頭調先後。</p><div class="rklist">'+r.keys.map(function(q,i){var lb=RANK_KEYS.filter(function(x){return x[0]===q.k})[0][1];
        return '<div class="rkkey"><button class="rkon" data-act="rkkey" data-v="'+q.k+'" aria-pressed="'+q.on+'"><span class="bkbox" aria-hidden="true"></span>'+lb+'</button><button data-act="rkmove" data-v="'+q.k+'" data-d="-1" aria-label="'+lb+'往上"'+(i?'':' disabled')+'>↑</button><button data-act="rkmove" data-v="'+q.k+'" data-d="1" aria-label="'+lb+'往下"'+(i<r.keys.length-1?'':' disabled')+'>↓</button></div>'}).join('')+'</div>'+
      '<h3>還是同分</h3><div class="rlist">'+RANK_TIE.map(function(p){return '<button class="imp rkopt" data-act="rktie" data-v="'+p[0]+'" aria-pressed="'+(r.tie===p[0])+'"><span>'+esc(p[1])+'</span></button>'}).join('')+'</div>'+
      '<p class="muted">局數比＝勝局÷敗局，得失分比＝得分÷失分，用整個預賽的總數；除數是 0 時算最大。</p><button data-act="rkreset">恢復預設（南社盃秩序冊）</button><button class="primary" data-act="close">完成</button>'}
  if(x.type==='rkdraw'){var ids=x.ids||[],ord=x.order||[];
    return '<h2>抽籤結果</h2><p class="muted">'+esc(x.label)+'。照大會抽出來的順序點隊伍。</p><div class="rlist">'+ids.map(function(id){var t=schedTeam(c,id),k=ord.indexOf(id);return '<button class="imp" data-act="rkdpick" data-id="'+esc(id)+'" aria-pressed="'+(k>=0)+'"><span>'+esc(t?t.team.name:'')+'</span><small>'+(k>=0?'第 '+(x.from+k)+' 名':'')+'</small></button>'}).join('')+'</div>'+
      '<div class="row scpbtns"><button data-act="rkdclear">'+(x.had?'清除抽籤結果':'重選')+'</button><button class="primary" data-act="rkdsave"'+(ord.length===ids.length?'':' disabled')+'>確定</button></div><button class="ghost" data-act="close">取消</button>'}
  if(x.type==='rkgrp'){var gd=x.div||div,cols=x.cols,ts=liveTeams(c).filter(function(t){return t.division===gd}).sort(teamSort);
    var dseg='<div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="rkgdiv" data-v="'+d+'" aria-pressed="'+(gd===d)+'">'+d+'</button>'}).join('')+'</div>';
    var nm='<div class="rkgnames">'+cols.map(function(n,i){return '<label><span>第 '+(i+1)+' 組</span><input data-rkg="'+i+'" type="text" maxlength="8" value="'+esc(n)+'" aria-label="第 '+(i+1)+' 組組名"></label>'}).join('')+'</div>';
    var rows=ts.length?ts.map(function(t){var p=x.pick[t.id];return '<div class="rkgrow"><strong>'+esc(t.team.name)+'</strong><div class="seg">'+cols.map(function(n,i){return '<button data-act="rkgset" data-id="'+esc(t.id)+'" data-v="'+i+'" aria-pressed="'+(p===i)+'" aria-label="'+esc(t.team.name)+' 分到'+esc(poolLabel(n)||('第 '+(i+1)+' 組'))+'">'+esc(n||String(i+1))+'</button>'}).join('')+'</div></div>'}).join(''):'<p class="muted">'+esc(gd)+'還沒有隊伍。</p>';
    var adv=typeof x.adv==='number'?x.adv:rankAdv(c,gd,cols.length);
    return '<h2>分組</h2>'+dseg+nm+'<div class="rlist rkglist">'+rows+'</div><div class="rkadvrow"><span>每組取前</span><button data-act="rkgadv" data-d="-1" aria-label="少一名"'+(adv>0?'':' disabled')+'>−</button><b>'+adv+'</b><button data-act="rkgadv" data-d="1" aria-label="多一名"'+(adv<8?'':' disabled')+'>＋</button><span>名晉級</span></div>'+
      '<div class="row scpbtns"><button class="ghost" data-act="close">取消</button><button class="primary" data-act="rkgsave">確定分組</button></div><button class="linkbtn" data-act="rkgnone">不分組（全部一張表）</button>'}
  return ''}
/* 打開分組視窗：從現在的組別（或照賽程自動分的）帶入，後面多一組空的 */
function rankGrpOpen(c,div){var P=rankPools(c,div),cols=P.list.map(function(g){return g.name}).filter(Boolean),pick={},L='ABCDEFGH';
  if(!cols.length)cols=['A'];if(cols.length<8)cols.push(L.split('').filter(function(ch){return cols.indexOf(ch)<0})[0]||String(cols.length+1));
  P.list.forEach(function(g){var i=cols.indexOf(g.name);g.ids.forEach(function(id){pick[id]=i>=0?i:0})});
  liveTeams(c).filter(function(t){return t.division===div&&pick[t.id]==null&&groupName(t.group)}).forEach(function(t){var i=cols.indexOf(groupName(t.group));if(i<0){cols.splice(cols.length-1,0,groupName(t.group));i=cols.length-2}pick[t.id]=i});
  return {type:'rkgrp',div:div,cols:cols,pick:pick,adv:null}}
function rankAct(act,b){var c=theCup(),x=ui.cupSheet;if(!c)return false;var div=CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0];
  switch(act){
    case 'rkrule': ui.cupSheet={type:'rkrule'}; return true;
    case 'rkgrp': ui.cupSheet=rankGrpOpen(c,div); return true;
    case 'rkgdiv': if(x&&x.type==='rkgrp'){var nd=b.getAttribute('data-v');ui.cupSheet=rankGrpOpen(c,nd)} return true;
    case 'rkpool': cupView.pool=b.getAttribute('data-v'); return true;
    case 'rkdet': ui.cupSheet={type:'rkdet',id:b.getAttribute('data-id')}; return true;
    case 'rkdraw': var key=b.getAttribute('data-key'),P=rankPools(c,div),rw=null;P.list.forEach(function(g){rankPool(c,div,g).rows.forEach(function(q){if(q.key===key&&!rw)rw=q})});if(!rw)return true;
      var ids=[];P.list.forEach(function(g){rankPool(c,div,g).rows.forEach(function(q){if(q.key===key)ids.push(q.id)})});
      ui.cupSheet={type:'rkdraw',key:key,ids:ids,order:[],from:rw.from,label:'第 '+rw.from+'–'+rw.to+' 名同分',had:!!(c.rank&&c.rank.draws&&c.rank.draws[key])}; return true;
    case 'rkdpick': if(x&&x.type==='rkdraw'){var pid=b.getAttribute('data-id'),k=x.order.indexOf(pid);if(k>=0)x.order.splice(k,1);else x.order.push(pid)} return true;
    case 'rkdclear': if(x&&x.type==='rkdraw'){if(x.had){rankSet(c,function(r){if(r.draws)delete r.draws[x.key]});ui.cupSheet=null}else x.order=[]} return true;
    case 'rkdsave': if(x&&x.type==='rkdraw'&&x.order.length===x.ids.length){rankSet(c,function(r){r.draws=r.draws||{};r.draws[x.key]=x.order.slice()});ui.cupSheet=null} return true;
    case 'rkpts': rankSet(c,function(r){var q=rankRule(c);q.pts=b.getAttribute('data-v');r.rule=q}); return true;
    case 'rktie': rankSet(c,function(r){var q=rankRule(c);q.tie=b.getAttribute('data-v');r.rule=q}); return true;
    case 'rkkey': rankSet(c,function(r){var q=rankRule(c);q.keys.forEach(function(k){if(k.k===b.getAttribute('data-v'))k.on=!k.on});r.rule=q}); return true;
    case 'rkmove': rankSet(c,function(r){var q=rankRule(c),i=-1;q.keys.forEach(function(k,j){if(k.k===b.getAttribute('data-v'))i=j});var j2=i+Number(b.getAttribute('data-d'));
      if(i>=0&&j2>=0&&j2<q.keys.length){var t=q.keys[i];q.keys[i]=q.keys[j2];q.keys[j2]=t}r.rule=q}); return true;
    case 'rkreset': rankSet(c,function(r){r.rule=rankDefault()}); return true;
    case 'rkgset': if(x&&x.type==='rkgrp')x.pick[b.getAttribute('data-id')]=Number(b.getAttribute('data-v')); return true;
    case 'rkgadv': if(x&&x.type==='rkgrp'){var a0=typeof x.adv==='number'?x.adv:rankAdv(c,x.div,x.cols.length);x.adv=Math.max(0,Math.min(8,a0+Number(b.getAttribute('data-d'))))} return true;
    case 'rkgsave': if(x&&x.type==='rkgrp'){var now=Date.now();liveTeams(c).filter(function(t){return t.division===x.div}).forEach(function(t){var i=x.pick[t.id],ng=i!=null&&i>=0?poolStore(x.cols[i]||String(i+1)):'';if(ng!==String(t.group||'')){t.group=ng;t.at=now}});
      if(typeof x.adv==='number')rankSet(c,function(r){r.adv=r.adv||{};r.adv[x.div]=x.adv});else save();cupView.div=x.div;cupView.pool='';ui.cupSheet=null} return true;
    case 'rkgnone': if(x&&x.type==='rkgrp'){var now2=Date.now();liveTeams(c).filter(function(t){return t.division===x.div}).forEach(function(t){if(t.group){t.group='';t.at=now2}});save();ui.cupSheet=null} return true;
  }
  return false}
document.addEventListener('input',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-rkg'),x=ui.cupSheet;if(k!=null&&x&&x.type==='rkgrp'){x.cols[Number(k)]=t.value.replace(/\s+/g,'').slice(0,8)}});
/* 待定隊伍：A 組第 1 名、第 N 場勝隊／敗隊；r1、r2 存 'g|組名|名次'、'w|賽程id'、'l|賽程id' */
function refLabel(c,r){var p=String(r||'').split('|');if(p[0]==='g')return (p[1]?poolLabel(p[1]):'')+'第 '+p[2]+' 名';var it=schedById(c,p[1]);return it?'第 '+(schedNos(c)[it.id]||'?')+' 場'+(p[0]==='w'?'勝隊':'敗隊'):''}
function schedRef(c,it,k,depth){var r=it[k==='t1'?'r1':'r2'];if(!r||(depth||0)>4)return '';var p=String(r).split('|');
  if(p[0]==='g'){var P=rankPools(c,it.division),pool=P.list.filter(function(g){return g.name===p[1]})[0];if(!pool)return '';var R=rankPool(c,it.division,pool);if(!R.done)return '';
    var q=R.rows.filter(function(q){return q.rank===Number(p[2])&&!q.draw&&q.st.G>0})[0];return q?q.id:''}
  var o=schedById(c,p[1]),m=o&&schedMatch(o),s=m&&safeReduce(m);if(!s||!matchOver(s))return '';var w=setsWon(s),side=w.t1>w.t2?'t1':'t2';if(p[0]==='l')side=other(side);
  return o[side]||schedRef(c,o,side,(depth||0)+1)}
function refOpts(c,div,selfId){var P=rankPools(c,div),out=[];
  P.list.forEach(function(g){var n=rankAdv(c,div,P.list.length)||g.ids.length;for(var k=1;k<=Math.min(n,g.ids.length);k++)out.push('g|'+g.name+'|'+k)});
  liveSched(c).filter(function(it){return it.division===div&&stageOf(it)!=='預賽'&&it.id!==selfId}).sort(schedSort).forEach(function(it){out.push('w|'+it.id);out.push('l|'+it.id)});
  return out}
function schedSec(c){"""
s=s[:A]+JS+s[B+len('function schedSec(c){'):]

one("""    case 'rkrule': case 'rkgrp': case 'rkpts': case 'rktie': case 'rkkey': case 'rkmove': case 'rkreset': case 'rkgset': case 'rkgsave': case 'rkgauto': rankAct(act,b); break;""",
    """    case 'rkrule': case 'rkgrp': case 'rkgdiv': case 'rkpool': case 'rkdet': case 'rkdraw': case 'rkdpick': case 'rkdclear': case 'rkdsave': case 'rkpts': case 'rktie': case 'rkkey': case 'rkmove': case 'rkreset': case 'rkgset': case 'rkgadv': case 'rkgsave': case 'rkgnone': rankAct(act,b); break;""")
one("    case 'cupdiv': cupView.div=b.getAttribute('data-v'); cupView.grp=''; ui.delMatch=null; break;","    case 'cupdiv': cupView.div=b.getAttribute('data-v'); cupView.grp=''; cupView.pool=''; ui.delMatch=null; break;")

# 隊伍分頁：分組按鈕、照組別分段、組名顯示
one("""  if(gs.length)seg+='<div class="seg grpseg">'+[''].concat(gs).map(function(g){return '<button data-act="cupgrp" data-v="'+esc(g)+'" aria-pressed="'+(cupView.grp===g)+'">'+(g?esc(g):'全部')+'</button>'}).join('')+'</div>';""",
    """  var tseg='<div class="tsegrow">'+seg+'<button class="grpbtn" data-act="rkgrp">分組</button></div>';
  if(gs.length)tseg+='<div class="seg grpseg">'+[''].concat(gs).map(function(g){return '<button data-act="cupgrp" data-v="'+esc(g)+'" aria-pressed="'+(cupView.grp===g)+'">'+(g?esc(poolLabel(g)):'全部')+'</button>'}).join('')+'</div>';""")
one("""  var tr=ts.map(function(x){""","""  var trRow=function(x){""")
one("""+'</span><span class="hgo" aria-hidden="true">打開 ›</span></button>'}).join('');""","""+'</span><span class="hgo" aria-hidden="true">打開 ›</span></button>'};
  var tr=!cupView.grp&&gs.length?gs.concat(['']).map(function(g){var xs=ts.filter(function(x){return groupName(x.group)===g});return xs.length?'<h3 class="mhead">'+esc(g?poolLabel(g):'未分組')+'</h3>'+xs.map(trRow).join(''):''}).join(''):ts.map(trRow).join('');""")
one("""tab==='teams'?seg+teamSec:""","""tab==='teams'?tseg+teamSec:""")
one("""(groupName(x.group)?esc(groupName(x.group))+'・':'')+x.team.players.length""","""(groupName(x.group)?esc(poolLabel(groupName(x.group)))+'・':'')+x.team.players.length""")

# 賽程：賽別、待定隊伍、每局贏分綠色
one("""function validSched(x){return !!x&&typeof x.id==='string'&&(x.del===true||(typeof x.date==='string'&&typeof x.division==='string'&&['time','end','court','t1','t2','n1','n2','mid'].every(""",
    """function validSched(x){return !!x&&typeof x.id==='string'&&(x.del===true||(typeof x.date==='string'&&typeof x.division==='string'&&['time','end','court','t1','t2','n1','n2','mid','r1','r2','stage'].every(""")
one("""function schedSide(c,x,k){var t=schedTeam(c,x[k]);return t?{name:t.team.name,set:true}:{name:x[k==='t1'?'n1':'n2']||'',set:false}}""",
    """function schedSide(c,x,k){var t=schedTeam(c,x[k]);if(t)return {name:t.team.name,set:true};var rid=schedRef(c,x,k),rt=rid&&schedTeam(c,rid),r=x[k==='t1'?'r1':'r2'];
  return rt?{name:rt.team.name,set:true,ref:refLabel(c,r)}:{name:x[k==='t1'?'n1':'n2']||(r?refLabel(c,r):''),set:false}}""")
one("""  var sets=w?[1,2,3,4,5].filter(function(n){return s.sets[n]&&s.sets[n].ended}).map(function(n){var q=s.sets[n].score;return q.t1+':'+q.t2}):[];
  var chip=s?(w?'<span class="scsets" aria-label="各局比分 '+sets.join('、')+'">'+sets.map(function(q){return '<span>'+q+'</span>'}).join('')+'</span>'""",
    """  var sets=w?[1,2,3,4,5].filter(function(n){return s.sets[n]&&s.sets[n].ended}).map(function(n){return s.sets[n].score}):[];
  var chip=s?(w?'<span class="scsets" aria-label="各局比分 '+sets.map(function(q){return q.t1+':'+q.t2}).join('、')+'">'+sets.map(function(q){return '<span>'+(q.t1>q.t2?'<b class="sw">'+q.t1+'</b>':q.t1)+':'+(q.t2>q.t1?'<b class="sw">'+q.t2+'</b>':q.t2)+'</span>'}).join('')+'</span>'""")
one("""'<button class="hrow card scrow" '+act+'><span class="muted">'+esc(x.division)+'第 '+no+' 場・'""","""'<button class="hrow card scrow" '+act+'><span class="muted">'+esc(x.division)+'第 '+no+' 場・'+(stageOf(x)!=='預賽'?esc(stageOf(x))+'・':'')+''""")
one("""  var inf=defaultInfo(),A=schedTeam(c,it.t1),B=schedTeam(c,it.t2);""","""  ['t1','t2'].forEach(function(k){if(!it[k]){var rid=schedRef(c,it,k);if(rid){it[k]=rid;it.at=Date.now()}}}); // 待定的名次、勝隊已經確定：開始時寫進賽程
  var inf=defaultInfo(),A=schedTeam(c,it.t1),B=schedTeam(c,it.t2);""")
one("""  if(it)return {type:'scedit',id:it.id,f:{date:it.date,time:it.time,court:it.court,division:it.division,t1:it.t1||'',t2:it.t2||'',n1:it.n1||'',n2:it.n2||''}};""",
    """  if(it)return {type:'scedit',id:it.id,f:{date:it.date,time:it.time,court:it.court,division:it.division,t1:it.t1||'',t2:it.t2||'',n1:it.n1||'',n2:it.n2||'',r1:it.r1||'',r2:it.r2||'',stage:stageOf(it)}};""")
one("""  return {type:'scedit',id:null,f:{date:last?last.date:today(),time:same?schedNextTime(last.time,schedGap(c,last)):'',court:cupView.court||(same?last.court:''),division:dv,t1:'',t2:'',n1:'',n2:''}};""",
    """  return {type:'scedit',id:null,f:{date:last?last.date:today(),time:same?schedNextTime(last.time,schedGap(c,last)):'',court:cupView.court||(same?last.court:''),division:dv,t1:'',t2:'',n1:'',n2:'',r1:'',r2:'',stage:same?stageOf(last):'預賽'}};""")
one("""      ['date','time','court','division','t1','t2'].forEach(function(k){it[k]=String(g[k]||'').trim()});it.n1=g.t1?'':String(g.n1||'').trim();it.n2=g.t2?'':String(g.n2||'').trim();it.at=now;""",
    """      ['date','time','court','division','t1','t2'].forEach(function(k){it[k]=String(g[k]||'').trim()});it.n1=g.t1?'':String(g.n1||'').trim();it.n2=g.t2?'':String(g.n2||'').trim();it.r1=g.t1?'':String(g.r1||'');it.r2=g.t2?'':String(g.r2||'');it.stage=g.stage&&g.stage!=='預賽'?g.stage:'';it.at=now;""")
one("""f:{date:it.date,time:schedNextTime(it.time,schedGap(c,it)),court:it.court,division:it.division,t1:'',t2:'',n1:'',n2:''},saved:""",
    """f:{date:it.date,time:schedNextTime(it.time,schedGap(c,it)),court:it.court,division:it.division,t1:'',t2:'',n1:'',n2:'',r1:'',r2:'',stage:stageOf(it)},saved:""")
# 新增比賽視窗：賽別一排；格子顯示待定名次；待定時點選
one("""<div class="seg scdivs">'+CUP_DIVS.map(function(d){return '<button data-act="scdiv" data-v="'+d+'" aria-pressed="'+(f.division===d)+'">'+d+'</button>'}).join('')+'</div></div>""",
    """<div class="seg scdivs">'+CUP_DIVS.map(function(d){return '<button data-act="scdiv" data-v="'+d+'" aria-pressed="'+(f.division===d)+'">'+d+'</button>'}).join('')+'</div></div><div class="scmeta"><div class="seg scstage" role="group" aria-label="賽別">'+STAGES.map(function(q){return '<button data-act="scstage" data-v="'+q+'" aria-pressed="'+((f.stage||'預賽')===q)+'">'+q+'</button>'}).join('')+'</div></div>""")
one("""(function(){function slot(k){var t=schedTeam(c,f[k]),on=tg===k;return '<button class="scslot'+(t?' on':'')+(on?' cur':'')+(x.just===k?' just':'')+'" data-act="scclr" data-v="'+k+'" aria-pressed="'+on+'" aria-label="'+(k==='t1'?'左邊隊伍':'右邊隊伍')+(t?'：'+esc(t.team.name)+(on?'，點下面的隊伍換掉':'，點一下可以換'):on?'：點下面的隊伍':'：還沒選')+'"><strong>'+(t?esc(t.team.name):on?'點下面的隊伍':'選隊伍')+'</strong></button>'}""",
    """(function(){function slot(k){var t=schedTeam(c,f[k]),on=tg===k,rr=f[k==='t1'?'r1':'r2'],rl=rr?refLabel(c,rr):'',rid=rr&&schedRef(c,{division:f.division,r1:rr,r2:rr},'t1'),rt=rid&&schedTeam(c,rid);
        return '<button class="scslot'+(t||rl?' on':'')+(on?' cur':'')+(x.just===k?' just':'')+'" data-act="scclr" data-v="'+k+'" aria-pressed="'+on+'" aria-label="'+(k==='t1'?'左邊隊伍':'右邊隊伍')+(t?'：'+esc(t.team.name):rl?'：'+esc(rl):on?'：點下面的隊伍':'：還沒選')+'"><strong>'+(t?esc(t.team.name):rl?(rt?esc(rt.team.name)+'<small>'+esc(rl)+'</small>':'<i>'+esc(rl)+'</i>'):on?'點下面的隊伍':'選隊伍')+'</strong></button>'}""")
one("""      '</div>')+(f.t1&&f.t2||x.warn?'':x.tbd||f.n1||f.n2?'<div class="scnotes">'+lab('t1')+lab('t2')+'</div>':'<button class="linkbtn sctbd" data-act="sctbd">隊伍還沒確定（例如 A組第一）</button>')+err+""",
    """      '</div>')+(f.t1&&f.t2||x.warn?'':x.tbd||f.n1||f.n2||f.r1||f.r2?(function(){var ro=refOpts(c,f.division,x.id);return (ro.length?'<p class="muted screfh">還沒確定的隊伍：點了填進綠框那一格</p><div class="screfs">'+ro.map(function(r){var rid=schedRef(c,{division:f.division,r1:r,r2:r},'t1'),rt=rid&&schedTeam(c,rid);
        return '<button data-act="scref" data-v="'+esc(r)+'" aria-pressed="'+(f.r1===r||f.r2===r)+'">'+esc(refLabel(c,r))+(rt?'<small>'+esc(rt.team.name)+'</small>':'')+'</button>'}).join('')+'</div>':'')+'<div class="scnotes">'+lab('t1')+lab('t2')+'</div>'})():'<button class="linkbtn sctbd" data-act="sctbd">隊伍還沒確定（例如 A 組第 1 名）</button>')+err+""")
one("""    case 'sctbd': if(x)x.tbd=true; return true;""","""    case 'sctbd': if(x)x.tbd=true; return true;
    case 'scstage': if(x&&x.f){x.f.stage=b.getAttribute('data-v');x.warn=null} return true;
    case 'scref': if(x&&x.f){var rv=b.getAttribute('data-v'),f3=x.f,tk3=scTarget(x)||'t2',n3=tk3==='t1'?'1':'2',ok3=tk3==='t1'?'t2':'t1';
      if(f3['r'+n3]===rv){f3['r'+n3]='';f3['n'+n3]='';return true}
      f3[tk3]='';f3['r'+n3]=rv;f3['n'+n3]=refLabel(c,rv);x.just=tk3;x.slot=f3[ok3]||f3['r'+(n3==='1'?'2':'1')]?'':ok3;x.warn=null} return true;""")
one("case 'sctbd': case 'scwarnno':","case 'sctbd': case 'scstage': case 'scref': case 'scwarnno':")
one("""      var tk=scTarget(x)||'t2',ok2=tk==='t1'?'t2':'t1';f[tk]=id;x.just=tk;x.slot=f[ok2]?'':ok2} return true; // 兩格都滿就換掉右邊""",
    """      var tk=scTarget(x)||'t2',ok2=tk==='t1'?'t2':'t1';f[tk]=id;f[tk==='t1'?'r1':'r2']='';f[tk==='t1'?'n1':'n2']='';x.just=tk;x.slot=f[ok2]?'':ok2} return true; // 兩格都滿就換掉右邊""")
one("app.addEventListener('input',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-sc'),x=ui.cupSheet;if(k&&x&&x.f)x.f[k]=t.value});",
    "app.addEventListener('input',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-sc'),x=ui.cupSheet;if(k&&x&&x.f){x.f[k]=t.value;if(k==='n1'||k==='n2')x.f['r'+k.slice(1)]=''}});")
# 主畫面：賽程｜積分｜隊伍
one("""<button class="linkbtn" data-act="cupopen" data-from="home" data-id="'+esc(c.id)+'">全部賽程</button></div>'+chips+""",
    """</div>'+cupNav(c)+chips+""")
one("""if(cupView.from==='home')cupView.tab='sched';""","""if(cupView.from==='home')cupView.tab=b.getAttribute('data-tab')||'sched';""")
one("""(td.length>lim?'<p class="muted">還有 '+(td.length-lim)+' 場，按「全部賽程」看。</p>':'')""","""(td.length>lim?'<p class="muted">還有 '+(td.length-lim)+' 場，按上面的「賽程」看。</p>':'')""")
one("""<span class="cupgo" aria-hidden="true">打開 ›</span></button>'}).join('');
  return '<section><div class="shead"><h2>賽事資料夾</h2>""","""<span class="cupgo" aria-hidden="true">打開 ›</span></button>'+(liveSched(c).length?cupNav(c):'')}).join('');
  return '<section><div class="shead"><h2>賽事資料夾</h2>""")
one("""function cupHomeHtml(){""","""function cupNav(c){return '<div class="hcupnav">'+[['sched','賽程'],['rank','積分'],['teams','隊伍']].map(function(q){return '<button data-act="cupopen" data-from="home" data-tab="'+q[0]+'" data-id="'+esc(c.id)+'">'+q[1]+'</button>'}).join('')+'</div>'}
function cupHomeHtml(){""")
# 結果頁：看積分
one("""  return head+'<div class="good">勝隊：'+esc(tName(s,win))+'　'+w[win]+' : '+w[other(win)]+'</div>'""",
    """  var rkc=current()&&current().cup?db.cups.filter(function(q){return q.id===current().cup})[0]:null,rki=rkc&&liveSched(rkc).filter(function(q){return q.mid===current().id&&stageOf(q)==='預賽'})[0];
  return head+'<div class="good rkgood"><span>勝隊：'+esc(tName(s,win))+'　'+w[win]+' : '+w[other(win)]+'</span>'+(rki?'<button data-act="rkgo">看積分</button>':'')+'</div>'""")
one("""    case 'bookfill':""","""    case 'rkgo': var gc=db.cups.filter(function(q){return q.id===m.cup})[0],gi=gc&&liveSched(gc).filter(function(q){return q.mid===m.id})[0];if(!gi)break;
      var gp=rankPools(gc,gi.division).list.filter(function(g){return g.ids.indexOf(gi.t1)>=0})[0];
      cupView={id:gc.id,div:gi.division,grp:'',from:'',tab:'rank',pool:gp?gp.name:''};ui.cupSheet=null;ui.sheet=null;view='cup'; break;
    case 'bookfill':""")
# 樣式
one(".scpbtns>button{flex:1 1 0}",""".scpbtns>button{flex:1 1 0}
.rkhead{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
.rkhead h2{margin:0}
.rkhead .muted{margin-left:auto}
.rktag{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:var(--warn-bg,#f5a524);color:var(--warn-ink,#3a2500);font-size:13px;font-weight:700}
.rkpools button{position:relative}
.rkdot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e8870e;margin-left:6px;vertical-align:middle}
.rktable th small{display:block;font-weight:500}
.rktable .rkn small{display:block;font-size:12px;font-weight:600}
.rkok{color:var(--ok)}
.rkwarn{color:#c96a00}
.rkdrawn{color:var(--muted)}
.rkcut td{border-bottom:2px solid var(--ok)}
.rkdrawbtn{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-height:44px;min-width:48px;padding:2px 6px;border:2px solid #e8870e;background:transparent;color:var(--ink);border-radius:10px}
.rkdrawbtn b{font-size:15px;font-weight:800}
.rkdrawbtn small{font-size:11px;color:#c96a00;font-weight:700}
.rkdet{min-height:36px;padding:0 10px;font-size:13px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.rkdlist{display:flex;flex-direction:column}
.rkdg{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;padding:10px 0;border-bottom:1px solid var(--line);align-items:baseline}
.rkdg .rkdo{font-weight:600}
.rkdg>.muted,.rkdg .rkds{grid-column:1/3}
.rkds{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.rkds b{font-size:18px}
.rkdg small{color:var(--muted)}
.rkdg em{font-style:normal;font-weight:700;text-align:right}
.rkdet2{display:none}
@media (max-width:599px){.rkdc{display:none}.rkdet2{display:inline-flex;align-items:center;min-height:32px;margin-top:2px;padding:0 10px;font-size:13px}}
.rkdg .win{color:var(--ok)}
.rkdsum{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 12px;margin:12px 0}
.rkdsum dt{color:var(--muted)}
.rkdsum dd{margin:0;font-weight:600}
.rkgnames{display:flex;flex-wrap:wrap;gap:8px}
.rkgnames label{display:flex;flex-direction:row;align-items:center;gap:6px;margin:0}
.rkgnames input{width:5.5em}
.rkadvrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rkadvrow button{min-width:44px;min-height:44px}
.rkadvrow b{min-width:2ch;text-align:center;font-size:18px}
.tsegrow{display:flex;gap:8px;align-items:stretch}
.tsegrow>.seg{flex:1 1 auto;min-width:0}
.tsegrow>.grpbtn{flex:none;min-height:44px}
.scstage{flex:1 1 auto;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))}
.scstage>button{min-height:44px;padding:0 4px;font-size:15px}
.screfh{margin:0;font-size:13px}
.screfs{display:flex;flex-wrap:wrap;gap:6px;max-height:132px;overflow:auto}
.screfs>button{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-height:44px;padding:2px 10px;font-size:14px}
.screfs>button small{font-size:12px;color:var(--muted)}
.scslot strong small{display:block;font-size:12px;font-weight:500;color:var(--muted)}
.scslot strong i{font-style:normal;color:var(--muted)}
.scsets .sw{color:var(--ok);font-weight:800}
.hcupnav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:8px}
.hcupnav>button{min-height:44px}
.rkgood{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.rkgood>button{flex:none;min-height:44px}""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v127')

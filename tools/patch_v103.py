#!/usr/bin/env python3
"""11/19 賽程：賽事資料夾裡先排好每一場（日期、時間、場地、男女組、左右兩隊），到時候點那一場就開始記錄，
左邊的隊伍放第一隊、右邊放第二隊，隊名和名冊自動帶入，只要輸入背號（使用者）。
- 大會的賽程表可以整份貼上（PDF、Word、LINE），表頭「室內場 A（女子組）」決定場地和男女組。
- 排名賽還不知道是哪兩隊：先排時間場地，隊伍「待定」，可以寫說明（使用者選的）。
- 場次：男女組各自照日期、時間、場地編號（使用者選的），開始時寫進比賽的「場次」。
存在 cup.sched，匯入資料夾時一筆一筆比，最後改的為主（跟隊伍一樣）。先跑 patch_v97～v102。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function cupSched' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)

JS=r"""/* ========== 11/19 賽程：資料夾裡先排好每一場，到時候點那一場就開始記錄（使用者） ==========
   cup.sched：{id,at,del,date,time,end,court,division,t1,n1,t2,n2,ord,mid}
   t1、t2 是資料夾隊伍的 id（賽程表左邊是第一隊）；還不知道是誰就空著，n1、n2 寫說明（例如：A組第一）。
   場次：男女組各自照日期、時間、場地編號。mid：開始後的那場比賽。 */
function cupSched(c){if(!Array.isArray(c.sched))c.sched=[];return c.sched}
function liveSched(c){return cupSched(c).filter(function(x){return !x.del})}
function schedSort(a,b){return String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||''))||(a.ord||0)-(b.ord||0)||String(a.court||'').localeCompare(String(b.court||''),'zh-Hant',{numeric:true})}
function schedNos(c){var n={},o={};liveSched(c).sort(schedSort).forEach(function(x){n[x.division]=(n[x.division]||0)+1;o[x.id]=n[x.division]});return o}
function schedPad(n){return ('0'+n).slice(-2)}
function schedDay(d){var m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return d||'日期未定';return (+m[2])+'/'+(+m[3])+'（'+'日一二三四五六'.charAt(new Date(+m[1],m[2]-1,+m[3]).getDay())+'）'}
function schedById(c,id){return liveSched(c).filter(function(x){return x.id===id})[0]||null}
function schedTeam(c,id){return id?liveTeams(c).filter(function(t){return t.id===id})[0]||null:null}
function schedSide(c,x,k){var t=schedTeam(c,x[k]);return t?{name:t.team.name,set:true}:{name:x[k==='t1'?'n1':'n2']||'',set:false}}
function schedSideHtml(q){return q.set?esc(q.name):'<i class="sctbd">待定'+(q.name?'・'+esc(q.name):'')+'</i>'}
function schedMatch(x){return x.mid?db.matches.filter(function(m){return m.id===x.mid})[0]||null:null}
function validSched(x){return !!x&&typeof x.id==='string'&&(x.del===true||(typeof x.date==='string'&&typeof x.division==='string'&&['time','end','court','t1','t2','n1','n2','mid'].every(function(f){return x[f]==null||typeof x[f]==='string'})))}
function schedKey(x){return [x.date,x.time,courtKey(x.court),x.division].join('|')}
/* 還沒開始的：今天的優先，今天沒有就排最近的那一天 */
function schedTodo(c){var a=liveSched(c).filter(function(x){return !schedMatch(x)}).sort(schedSort),t=today();
  var d=a.filter(function(x){return x.date===t}).length?t:(a.filter(function(x){return x.date>=t})[0]||a[0]||{}).date;return a.filter(function(x){return x.date===d})}
/* 貼上的賽程：一行一個時段，「甲隊 vs 乙隊」照表頭的場地順序；也接受一格一行。看不懂的說明文字略過 */
function parseSched(text,c,defDiv,opt){
  var single=false,hdr=false,items=[],miss=[],cols=[],date='',time='',end='',ci=0,ord=0,now=new Date(),noDate=false,noCol=false,teams=liveTeams(c);
  if(opt){date=opt.date||'';ord=opt.base||0;if(opt.court!=null){cols=[{court:opt.court,division:defDiv}];single=true}} // 一個場地一格：每一行都是這個場地
  function find(nm,div){var k=nm.replace(/\s/g,'');return teams.filter(function(x){return x.division===div&&x.team.name.replace(/\s/g,'')===k})[0]||null}
  function add(a,b){var k=single?cols[0]:cols[ci]||null;ci++;if(!k){noCol=true;k={court:'',division:defDiv}}if(!date)noDate=true;
    var it={id:uid(),date:date||today(),time:time,end:end,court:k.court,division:k.division,t1:'',n1:'',t2:'',n2:'',ord:++ord};
    [[a,'t1','n1'],[b,'t2','n2']].forEach(function(q){var t=find(q[0],k.division);if(t)it[q[1]]=t.id;else{it[q[2]]=q[0];var w=q[0]+'（'+k.division+'）';if(miss.indexOf(w)<0)miss.push(w)}});
    items.push(it)}
  String(text||'').split(/\r?\n/).forEach(function(raw){
    var l=raw;try{l=l.normalize('NFKC')}catch(e){}l=l.replace(/\s+/g,' ').trim();if(!l)return;
    var dm=l.match(/^(?:(\d{4})[\/.\-年])?(\d{1,2})[\/.\-月](\d{1,2})日?\s?(?:\(.\))?/);
    if(dm&&+dm[2]>=1&&+dm[2]<=12&&+dm[3]>=1&&+dm[3]<=31){var y=dm[1]?+dm[1]:now.getFullYear();if(!dm[1]&&+dm[2]<now.getMonth()+1-6)y++;date=y+'-'+schedPad(dm[2])+'-'+schedPad(dm[3]);time='';end='';ci=0;hdr=false;l=l.slice(dm[0].length).trim()}
    if(!/^\d{1,2}:\d{2}/.test(l)&&!/vs/i.test(l)){
      var re=/([一-鿿A-Za-z]{0,4}?場地?\s?[A-Za-z0-9一二三四五六七八九十]{0,3})\s?\(?\s?(?:為|是)?\s?(男|女)(?:子組|生組|子|排|組)?/g,h,hs=[];
      while((h=re.exec(l)))hs.push({court:h[1].replace(/\s+/g,' ').trim(),division:h[2]+'子組'});
      if(hs.length){cols=hdr?cols.concat(hs):hs;hdr=true;single=false;ci=0;return} // 表頭一格一行時接起來
    }
    var tm=l.match(/^(\d{1,2}):(\d{2})(?:\s?[-–—~～至到]\s?(\d{1,2}):(\d{2}))?/);
    if(l)hdr=false;
    if(tm){time=schedPad(tm[1])+':'+tm[2];end=tm[3]?schedPad(tm[3])+':'+tm[4]:'';ci=0;l=l.slice(tm[0].length).trim()}
    if(!time&&!date)return;
    var mr=/(\S+?)\s?(?:vs\.?|v\.s\.?)\s?(\S+)/gi,mm,last=0,any=false;
    while((mm=mr.exec(l))){if(l.slice(last,mm.index).trim())ci++;add(mm[1],mm[2]);last=mr.lastIndex;any=true}
    if(!any&&l&&time)ci++; // 空場、簽到這類也佔一格
  });
  var have={};liveSched(c).forEach(function(x){have[schedKey(x)]=x});
  return {single:single,items:items,miss:miss,noDate:noDate,noCol:noCol,upd:items.filter(function(x){return have[schedKey(x)]}).length};
}
function schedRow(c,x,no,next){
  var a=schedSide(c,x,'t1'),b=schedSide(c,x,'t2'),m=schedMatch(x),s=m?safeReduce(m):null,w=s&&matchOver(s)?setsWon(s):null;
  var act=s?'data-act="open" data-from="cup" data-id="'+esc(m.id)+'"':'data-act="scopen" data-id="'+esc(x.id)+'"';
  var chip=s?(w?'<span class="scchip done">已結束</span>':'<span class="scchip live">記錄中</span>'):'<span class="scchip'+(next?' go':'')+'">開始</span>';
  return '<button class="hrow card scrow" '+act+'><span class="muted">第 '+no+' 場・'+esc(x.time||'時間未定')+(x.court?'・場地：'+esc(x.court):'')+'</span><span class="hnames"><span'+(w&&w.t1>w.t2?' class="win"':'')+'>'+schedSideHtml(a)+'</span><b>'+(w?w.t1+' : '+w.t2:'vs')+'</b><span'+(w&&w.t2>w.t1?' class="win"':'')+'>'+schedSideHtml(b)+'</span></span><span class="hgo">'+chip+'</span></button>';
}
function schedSec(c){
  var sl=liveSched(c).filter(function(x){return x.division===cupView.div}).sort(schedSort),nos=schedNos(c),dd=null,sr='';
  var nx=sl.filter(function(x){return !schedMatch(x)})[0]; // 下一場：開始用主色，其他用一般按鈕
  sl.forEach(function(x){if(x.date!==dd){dd=x.date;sr+='<h3 class="scday">'+esc(schedDay(dd))+'</h3>'}sr+=schedRow(c,x,nos[x.id],x===nx)});
  return '<section><div class="shead"><h2>賽程 '+sl.length+' 場</h2><span class="scbtns"><button class="linkbtn" data-act="scpaste">貼上賽程</button><button class="linkbtn" data-act="scnew">加一場</button></span></div>'+(sr?'<div class="rlist">'+sr+'</div>':'<p class="muted">把大會的賽程表整份貼上。到時候點那一場就開始記錄，兩隊隊名和名冊自動帶入，只要輸入背號。</p>')+'</section>';
}
function schedSheetHtml(x,c,err){
  if(x.type==='scone'){var it=schedById(c,x.id);if(!it)return '';var A=schedSide(c,it,'t1'),B=schedSide(c,it,'t2');
    return '<h2>'+esc(it.division)+'第 '+schedNos(c)[it.id]+' 場</h2><p class="muted">'+esc(schedDay(it.date))+' '+esc(it.time||'時間未定')+(it.end?'–'+esc(it.end):'')+(it.court?'　場地：'+esc(it.court):'')+'</p>'+
      '<div class="scvs"><strong>'+schedSideHtml(A)+'</strong><b>vs</b><strong>'+schedSideHtml(B)+'</strong></div>'+
      (A.set&&B.set?'<p class="muted">開始後在名單頁輸入背號，名冊有的姓名會自動帶出。</p>':'<p class="warning">還有隊伍待定。可以先按「修改這一場」選隊伍，或開始後在名單頁載入。</p>')+
      '<button class="primary" data-act="scgo" data-id="'+esc(it.id)+'">開始記錄</button><button data-act="scedit" data-id="'+esc(it.id)+'">修改這一場</button><button class="ghost" data-act="close">關閉</button>'}
  if(x.type==='scedit'){var f=x.f,ts=liveTeams(c).filter(function(t){return t.division===f.division}),cs=[];
    liveSched(c).concat(courtList(c).map(function(q){return {court:q.label}})).forEach(function(q){if(q.court&&cs.indexOf(q.court)<0)cs.push(q.court)});
    function lab(k){var nk=k==='t1'?'n1':'n2';return f[k]?'':'<label for="sc-'+nk+'">'+(k==='t1'?'第一隊':'第二隊')+'還沒定：說明（可以不填）<input id="sc-'+nk+'" data-sc="'+nk+'" type="text" maxlength="20" placeholder="例如：A組第一" value="'+esc(f[nk]||'')+'"></label>'}
    return (x.back?'<button class="sheetback" data-act="scback">‹ 返回</button>':'')+'<h2>'+(x.id?'修改這一場':'加一場比賽')+'</h2>'+
      '<div class="scgrid"><label for="sc-date">日期<input id="sc-date" data-sc="date" type="date" max="9999-12-31" value="'+esc(f.date||'')+'"></label><label for="sc-time">時間<input id="sc-time" data-sc="time" type="time" value="'+esc(f.time||'')+'"></label></div>'+
      '<label for="sc-court">場地<input id="sc-court" data-sc="court" type="text" maxlength="20" list="sc-courts" autocomplete="off" placeholder="例如：室內場 A" value="'+esc(f.court||'')+'"></label><datalist id="sc-courts">'+cs.map(function(q){return '<option value="'+esc(q)+'">'}).join('')+'</datalist>'+
      '<div class="ctdiv"><span>男女組</span><div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="scdiv" data-v="'+d+'" aria-pressed="'+(f.division===d)+'">'+d+'</button>'}).join('')+'</div></div>'+
      '<p class="muted">點兩隊：先點的是第一隊（賽程表左邊），再點一次取消。還不知道是哪兩隊就先不選。</p>'+
      (ts.length?ts.map(function(t){var k=f.t1===t.id?'第一隊':f.t2===t.id?'第二隊':'';return '<button class="imp" data-act="scpick" data-id="'+esc(t.id)+'" aria-pressed="'+(!!k)+'"><span>'+esc(t.team.name)+'</span><small>'+(k||t.team.players.length+' 人')+'</small></button>'}).join(''):'<p class="muted">這一組還沒有隊伍名單。</p>')+
      lab('t1')+lab('t2')+err+
      '<button class="primary" data-act="scsave1">儲存</button>'+(x.id?(x.ask?'<button class="danger" data-act="scdel2">確定刪除這一場</button><button data-act="scdelno">不要刪除</button>':'<button class="ghost" data-act="scdel">刪除這一場</button>'):'')+'<button class="ghost" data-act="close">'+(x.back?'關閉':'取消')+'</button>'}
  if(x.type==='scpaste'){var pl=x.plan,pv='';
    if(pl){pv=(pl.items.length?'<p class="muted">會排出 '+pl.items.length+' 場'+(pl.upd?'（其中 '+pl.upd+' 場同一時間、場地已經有了，會改成這次的隊伍）':'')+'：</p>'+schedGrid(c,pl.items):'')+
        (pl.miss.length?'<p class="warning">資料夾裡沒有這些隊伍，先當作待定：'+esc(pl.miss.join('、'))+'。隊名要跟名單一樣；也可以之後點那一場再選隊伍。</p>':'')+
        (pl.noDate?'<p class="warning">沒有選日期，先當作今天。</p>':'')+(pl.noCol?'<p class="warning">有幾場看不出是哪個場地，請放到對的場地那一格。</p>':'')}
    var blk=x.courts.map(function(k,i){return '<div class="scblk"><div class="scbh"><label for="sc-cn-'+i+'">場地</label><input id="sc-cn-'+i+'" data-scb="'+i+'" data-k="name" type="text" maxlength="20" list="sc-courts" autocomplete="off" placeholder="例如：室內場 A" value="'+esc(k.name||'')+'">'+
        (x.courts.length>1?'<button class="scbrm" data-act="scbrm" data-i="'+i+'" aria-label="移除這個場地">移除</button>':'')+'</div>'+
        '<div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="scbdiv" data-i="'+i+'" data-v="'+d+'" aria-pressed="'+(k.div===d)+'">'+d+'</button>'}).join('')+'</div>'+
        '<textarea id="sc-ct-'+i+'" data-scb="'+i+'" data-k="text" class="cupta" rows="5" aria-label="第 '+(i+1)+' 個場地的賽程" placeholder="一行一場，例如：&#10;8:30 範例藍隊 vs 範例橘隊&#10;9:30 範例綠隊 vs 範例紅隊">'+esc(k.text||'')+'</textarea></div>'}).join('');
    var cs=[];liveSched(c).concat(courtList(c).map(function(q){return {court:q.label}})).forEach(function(q){if(q.court&&cs.indexOf(q.court)<0)cs.push(q.court)});
    return '<h2>貼上賽程</h2><p class="muted">先選日期，再一個場地一格，一行一場，例如「8:30 東海社工 vs 中正勞工」，左邊是第一隊。整張賽程表貼在任何一格也可以，會照表頭自動分場地。</p>'+
      '<label for="sc-pd">日期<input id="sc-pd" data-scp="date" type="date" max="9999-12-31" value="'+esc(x.date||'')+'"></label>'+blk+'<datalist id="sc-courts">'+cs.map(function(q){return '<option value="'+esc(q)+'">'}).join('')+'</datalist>'+
      '<button class="scbadd" data-act="scbadd">＋ 再加一個場地</button>'+pv+err+
      (pl&&pl.items.length?'<button class="primary" data-act="scadd">加入賽程（'+pl.items.length+' 場）</button><button data-act="scparse">重新整理</button>':'<button class="primary" data-act="scparse">看看會排出什麼</button>')+'<button class="ghost" data-act="close">取消</button>'}
  return '';
}
/* 預覽：場地是欄、時間是列，跟大會的賽程表一樣 */
function schedGrid(c,items){
  var cols=[],rows={},keys=[];
  items.slice().sort(schedSort).forEach(function(it){var ck=it.court+'|'+it.division,rk=it.date+'|'+it.time;if(cols.indexOf(ck)<0)cols.push(ck);if(!rows[rk]){rows[rk]={};keys.push(rk)}(rows[rk][ck]=rows[rk][ck]||[]).push(it)});
  var dd=null,body='';
  keys.forEach(function(rk){var p=rk.split('|');if(p[0]!==dd){dd=p[0];body+='<tr class="scgd"><td colspan="'+(cols.length+1)+'">'+esc(schedDay(dd))+'</td></tr>'}
    body+='<tr><th scope="row">'+esc(p[1]||'未定')+'</th>'+cols.map(function(ck){var a=rows[rk][ck];return '<td>'+(a?a.map(function(it){return '<div>'+schedSideHtml(schedSide(c,it,'t1'))+' <span class="muted">vs</span> '+schedSideHtml(schedSide(c,it,'t2'))+'</div>'}).join(''):'<span class="muted">—</span>')+'</td>'}).join('')+'</tr>'});
  return '<div class="scgw"><table class="scgt"><thead><tr><th></th>'+cols.map(function(ck){var p=ck.split('|');return '<th scope="col">'+esc(p[0]||'場地未定')+'<small>'+esc(p[1])+'</small></th>'}).join('')+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}
function schedPasteOf(c){
  /* 照已經排過的男女組先放好格子；場地名稱留空（使用者），點格子會列出用過的場地 */
  var seen={},cs=[];liveSched(c).slice().sort(schedSort).forEach(function(x){if(!seen[x.division]&&x.court){seen[x.division]=1;cs.push({name:'',div:x.division,text:''})}});
  if(!cs.length)cs=[{name:'',div:CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],text:''},{name:'',div:'',text:''}],cs[1].div=CUP_DIVS.filter(function(d){return d!==cs[0].div})[0];
  return {type:'scpaste',date:today(),courts:cs};
}
function parseBlocks(x,c){
  var all={items:[],miss:[],noDate:!x.date,noCol:false,upd:0,err:''};
  x.courts.forEach(function(k,i){if(!String(k.text||'').trim())return;var nm=String(k.name||'').trim();
    var r=parseSched(k.text,c,k.div,{date:x.date,court:nm,base:i*1000});
    if(r.single&&!nm&&r.items.length&&!all.err)all.err='第 '+(i+1)+' 個場地還沒填名稱（例如：室內場 A）';
    all.items=all.items.concat(r.items);r.miss.forEach(function(m){if(all.miss.indexOf(m)<0)all.miss.push(m)});all.noCol=all.noCol||r.noCol;all.upd+=r.upd});
  return all;
}
/* 照賽程開始：資料、場次先填好，兩隊帶入名冊（出賽名單空著），直接到名單頁 */
function schedStart(c,it,fromCup){
  var ex=schedMatch(it);if(ex){db.currentId=ex.id;save();resetUi();ui.page=firstPage(reduce(ex.events));ui.from=fromCup?'cup':null;view='setup';return}
  var inf=defaultInfo(),A=schedTeam(c,it.t1),B=schedTeam(c,it.t2);
  inf.name=c.name;inf.division=it.division;inf.game=String(schedNos(c)[it.id]||'');inf.date=it.date||today();inf.time=it.time||'';inf.court=it.court||'';
  var prev=db.matches.filter(function(q){return q.cup===c.id}).map(function(q){return safeReduce(q)}).filter(Boolean)[0];
  if(prev)['place','city'].forEach(function(f){if(prev.info[f])inf[f]=prev.info[f]});
  var g=A&&groupName(A.group)||B&&groupName(B.group)||'';if(g)inf.group=g;else if(prev&&prev.info.division===it.division&&prev.info.group)inf.group=prev.info.group;
  var cm=createMatch(inf);cm.cup=c.id;db.currentId=cm.id;it.mid=cm.id;it.at=Date.now();
  [A,B].forEach(function(x,i){if(x)dispatch('TEAM_IMPORTED',{team:i?'t2':'t1',snapshot:bookSnap(x.team),fromName:x.team.name},cm)});
  save();resetUi();ui.page='roster';ui.from=fromCup?'cup':null;view='setup';
}
function schedEditOf(c,it){return {type:'scedit',id:it?it.id:null,f:it?{date:it.date,time:it.time,court:it.court,division:it.division,t1:it.t1||'',t2:it.t2||'',n1:it.n1||'',n2:it.n2||''}:{date:today(),time:'',court:'',division:CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0],t1:'',t2:'',n1:'',n2:''}}}
function schedAct(act,b){
  var c=theCup(),x=ui.cupSheet;if(!c)return false;
  switch(act){
    case 'scpaste': ui.cupSheet=schedPasteOf(c); return true;
    case 'scbadd': if(x&&x.courts){x.courts.push({name:'',div:x.courts[x.courts.length-1].div||CUP_DIVS[0],text:''});x.plan=null} return true;
    case 'scbrm': if(x&&x.courts&&x.courts.length>1){x.courts.splice(+b.getAttribute('data-i'),1);x.plan=null} return true;
    case 'scbdiv': if(x&&x.courts){var bk=x.courts[+b.getAttribute('data-i')];if(bk)bk.div=b.getAttribute('data-v');x.plan=null} return true;
    case 'scnew': ui.cupSheet=schedEditOf(c,null); return true;
    case 'scopen': ui.cupSheet={type:'scone',id:b.getAttribute('data-id')}; return true;
    case 'scedit': var e1=schedById(c,b.getAttribute('data-id'));if(e1){ui.cupSheet=schedEditOf(c,e1);ui.cupSheet.back=true} return true;
    case 'scback': if(x)ui.cupSheet={type:'scone',id:x.id}; return true;
    case 'scdiv': if(x&&x.f){var d=b.getAttribute('data-v');if(d!==x.f.division){x.f.division=d;x.f.t1='';x.f.t2=''}x.err=''} return true;
    case 'scpick': if(x&&x.f){var id=b.getAttribute('data-id'),f=x.f;if(f.t1===id)f.t1='';else if(f.t2===id)f.t2='';else if(!f.t1)f.t1=id;else if(!f.t2)f.t2=id;x.err=''} return true;
    case 'scdel': if(x)x.ask=true; return true;
    case 'scdelno': if(x)x.ask=false; return true;
    case 'scdel2': var d2=schedById(c,x.id);if(d2){d2.del=true;d2.at=Date.now()} ui.cupSheet=null; save(); return true;
    case 'scsave1':
      var g=x.f;if(!g.date){x.err='請選日期';return true}
      if(g.t1&&g.t1===g.t2){x.err='兩邊選了同一隊';return true}
      var it=x.id?schedById(c,x.id):null,now=Date.now();
      if(!it){it={id:uid(),ord:liveSched(c).length+1};cupSched(c).push(it)}
      ['date','time','court','division','t1','t2'].forEach(function(k){it[k]=String(g[k]||'').trim()});it.n1=g.t1?'':String(g.n1||'').trim();it.n2=g.t2?'':String(g.n2||'').trim();it.at=now;
      if(CUP_DIVS.indexOf(it.division)>=0)cupView.div=it.division;
      ui.cupSheet=null; save(); return true;
    case 'scparse': case 'scadd':
      var pl=parseBlocks(x,c),typed=x.courts.some(function(k){return String(k.text||'').trim()});x.err='';
      if(pl.err){x.plan=null;x.err=pl.err;return true}
      if(!pl.items.length){x.plan=null;x.err=typed?'看不出有哪幾場。一行一場，寫成「8:30 甲隊 vs 乙隊」。':'請先貼上或輸入賽程';return true}
      if(act==='scparse'){x.plan=pl;return true}
      var have={},tn=Date.now();liveSched(c).forEach(function(q){have[schedKey(q)]=q});
      pl.items.forEach(function(q){var h=have[schedKey(q)];if(h){['t1','n1','t2','n2','end'].forEach(function(k){h[k]=q[k]});h.at=tn}else{q.at=tn;cupSched(c).push(q);have[schedKey(q)]=q}});
      var d0=pl.items[0].division;if(!pl.items.some(function(q){return q.division===cupView.div})&&CUP_DIVS.indexOf(d0)>=0)cupView.div=d0;
      ui.cupSheet=null; save(); return true;
    case 'scgo': var it2=schedById(c,b.getAttribute('data-id'));ui.cupSheet=null;if(it2)schedStart(c,it2,b.getAttribute('data-from')!=='start'); return true;
  }
  return false;
}
app.addEventListener('input',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-sc'),x=ui.cupSheet;if(!x)return;var bi=t&&t.getAttribute&&t.getAttribute('data-scb'),pk=t&&t.getAttribute&&t.getAttribute('data-scp');
  if(bi!=null&&x.courts&&x.courts[+bi]){x.courts[+bi][t.getAttribute('data-k')]=t.value;return}if(pk){x[pk]=t.value;return}
  if(!k)return;if(x.f)x.f[k]=t.value});
"""
one("function cupHomeHtml(){",JS+"function cupHomeHtml(){")
# 資料夾頁：賽程放在隊伍上面（比賽當天最常用）
one("""'+refSec+seg+'<section><div class="shead"><h2>隊伍 '""","""'+refSec+seg+schedSec(c)+'<section><div class="shead"><h2>隊伍 '""")
one("""  else if(x.type==='del')h='<h2>刪除「'""","""  else if(/^sc/.test(x.type)){h=schedSheetHtml(x,c,err);if(!h){ui.cupSheet=null;return ''}}
  else if(x.type==='del')h='<h2>刪除「'""")
# 開始新比賽：選了有賽程的資料夾，列出今天（或最近一天）還沒開始的場次
one("""'<button class="imp" data-act="newpick" data-id="" aria-pressed="'+(!x.pick)+'"><span>不屬於任何盃賽</span><small></small></button><button class="primary" data-act="newgo">開始</button>""",
"""'<button class="imp" data-act="newpick" data-id="" aria-pressed="'+(!x.pick)+'"><span>不屬於任何盃賽</span><small></small></button>'+(function(){var pc=x.pick?db.cups.filter(function(q){return q.id===x.pick})[0]:null,td=pc?schedTodo(pc):[],nos=pc?schedNos(pc):{};
    if(!td.length)return '<button class="primary" data-act="newgo">開始</button>';
    return '<h3 class="scpick">照賽程開始（'+esc(schedDay(td[0].date))+'）</h3>'+td.map(function(it){return '<button class="imp" data-act="scgo" data-from="start" data-cup="'+esc(pc.id)+'" data-id="'+esc(it.id)+'"><span>'+schedSideHtml(schedSide(pc,it,'t1'))+' vs '+schedSideHtml(schedSide(pc,it,'t2'))+'</span><small>'+esc(it.division)+'第 '+nos[it.id]+' 場・'+esc(it.time||'')+(it.court?'・場地：'+esc(it.court):'')+'</small></button>'}).join('')+'<button data-act="newgo">不照賽程，開新的一場</button>'})()+'""")
# 按鍵：資料夾頁的賽程，和開始新比賽的「照賽程開始」
one("    case 'cupnew': ui.cupSheet={type:'new',pick:[]}; break;","""    case 'cupnew': ui.cupSheet={type:'new',pick:[]}; break;
    case 'scgo': if(b.getAttribute('data-cup')){cupView.id=b.getAttribute('data-cup');var sg=theCup(),sgi=sg&&schedById(sg,b.getAttribute('data-id'));if(sgi)cupView.div=sgi.division}
      schedAct(act,b); break;
    case 'scbadd': case 'scbrm': case 'scbdiv': case 'scpaste': case 'scnew': case 'scopen': case 'scedit': case 'scback': case 'scdiv': case 'scpick': case 'scdel': case 'scdelno': case 'scdel2': case 'scsave1': case 'scparse': case 'scadd': schedAct(act,b); break;""")
# 匯入資料夾：賽程一筆一筆比（新欄位要一起加進整理，不然匯入就不見）
one("    function bump(o,r){","""    p.sched=(Array.isArray(c.sched)?c.sched:[]).filter(validSched);p.addS=0;p.updS=0;p.delS=0;
    function bump(o,r){""")
one("if(!h){p.addT=teams.filter(function(x){return !x.del}).length;","if(!h){p.addS=p.sched.filter(function(x){return !x.del}).length;p.addT=teams.filter(function(x){return !x.del}).length;")
one("    p.ren=(c.at||0)>(h.at||0)&&c.name!==h.name;","""    var hsd=cupSched(h);p.sched.forEach(function(x){var y=hsd.filter(function(q){return q.id===x.id})[0];
      if(!y){if(!x.del)p.addS++;return}
      if((x.at||0)<=(y.at||0))return;
      if(x.del&&!y.del)p.delS++;else if(!x.del&&y.del)p.addS++;else if(!x.del&&JSON.stringify(x)!==JSON.stringify(y))p.updS++});
    p.ren=(c.at||0)>(h.at||0)&&c.name!==h.name;""")
one("if(!h){db.cups.push({id:p.id,name:p.name,createdAt:p.createdAt,at:p.at,teams:p.teams,refs:p.refs});return}","if(!h){db.cups.push({id:p.id,name:p.name,createdAt:p.createdAt,at:p.at,teams:p.teams,refs:p.refs,sched:p.sched});return}")
one("    if(p.ren){h.name=p.name;h.at=p.at}","""    var hsd=cupSched(h);(p.sched||[]).forEach(function(x){var i=-1;hsd.forEach(function(q,j){if(q.id===x.id)i=j});if(i<0)hsd.push(x);else if((x.at||0)>(hsd[i].at||0))hsd[i]=x});
    if(p.ren){h.name=p.name;h.at=p.at}""")
one("function cupChanged(c){return c.isNew||c.ren||c.addT||c.updT||c.delT||","function cupChanged(c){return c.isNew||c.ren||c.addT||c.updT||c.delT||c.addS||c.updS||c.delS||")
one("if(c.addT)a.push('新增 '+c.addT+' 隊');","if(c.addT)a.push('新增 '+c.addT+' 隊');if(c.addS)a.push('賽程新增 '+c.addS+' 場');if(c.updS)a.push('賽程更新 '+c.updS+' 場');if(c.delS)a.push('賽程刪除 '+c.delS+' 場');")
# Esc、Android 返回鍵：修改這一場先退回上一層
one("'.sheet [data-act=sheetback]',","'.sheet [data-act=sheetback]','.sheet [data-act=scback]',")
one('\n</style>\n\n<div class="statusband"','''
.scbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.scday{font-size:15px;margin:14px 0 0;color:var(--muted)}
.scday:first-child{margin-top:4px}
.scrow .hnames b{font-weight:500;color:var(--muted)}
.scrow .hnames>span,.scrow .hnames>span:last-child{text-align:center}
.scrow>.hgo{align-self:stretch;display:flex;align-items:center;padding-left:12px;border-left:1px solid var(--line)}
.scchip{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border-radius:var(--rb);background:var(--btn);color:var(--btn-ink);font-size:15px;font-weight:700}
.scchip.go{background:var(--accent);color:var(--accent-ink)}
.scchip.live{background:none;box-shadow:inset 0 0 0 2px var(--ink);color:var(--ink)}
.scchip.done{background:none;color:var(--muted);padding:0 4px}
.sctbd{font-style:normal;color:var(--muted)}
.scvs{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;text-align:center;margin:4px 0 8px}
.scvs strong{font-size:20px;overflow-wrap:anywhere}
.scvs b{color:var(--muted);font-weight:500}
.scgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.scprev{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}
.scprev li{display:flex;flex-direction:column;gap:2px;padding:8px 10px;background:var(--soft);border-radius:8px}
.scprev li.scpd{background:none;padding:6px 0 0;font-weight:700}
.scprev li span{color:var(--muted);font-size:14px}
.scpick{font-size:15px;margin:12px 0 0}
.scblk{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--line);border-radius:12px}
.scbh{display:flex;gap:8px;align-items:center}
.scbh input{flex:1;min-width:0}
.scbh label{flex:none;font-weight:700}
.scbrm{flex:none;min-height:44px;padding:0 14px}
.scbadd{align-self:flex-start}
.scgw{overflow-x:auto}
.scgt{width:100%;border-collapse:collapse;font-size:15px}
.scgt th,.scgt td{border-bottom:1px solid var(--line);padding:6px;vertical-align:top;text-align:left}
.scgt thead th{font-weight:700}
.scgt thead th small{display:block;color:var(--muted);font-weight:500;font-size:13px}
.scgt tbody th{white-space:nowrap;font-weight:500;color:var(--muted)}
.scgt td div+div{margin-top:4px}
.scgt .scgd td{font-weight:700;padding-top:12px;border-bottom:0}
</style>

<div class="statusband"''')
open(SRC,'w',encoding='utf8').write(s)
print('patched v103')

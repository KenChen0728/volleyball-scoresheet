#!/usr/bin/env python3
"""11/19 名冊：賽事資料夾的隊伍是完整名冊（不限人數，例如報名 17 人），開比賽選隊伍時只帶入隊名、職員，
出賽名單先空著（使用者：統一先空著）；記錄員照球隊簽名的紙本輸入背號，名冊有的就自動帶出姓名。
名冊存在隊伍的 book（TEAM_IMPORTED 的 snapshot.book，跟著復原）；分享比賽不上傳（syncClean 清掉）。
先跑 patch_v97～v101。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function bookSnap' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
# 名冊不限人數：比賽的出賽名單才限 12＋2
one("""    if(t.players.length-t.liberos.length>MAX_PLAYERS)errors.push(t.name+' 一般球員超過 '+MAX_PLAYERS+' 人');
    if(t.liberos.length>MAX_LIBEROS)errors.push(t.name+' 自由球員超過 '+MAX_LIBEROS+' 人');
""","")
one("function parseRoster(text,div,name){","""/* 選隊伍時：名冊（全部報名的背號和姓名）留著查姓名，出賽名單、隊長、自由球員先空著 */
function bookSnap(team){var s=JSON.parse(JSON.stringify(team||emptyTeam())),by={};
  (team&&Array.isArray(team.book)?team.book:[]).concat(team&&team.players||[]).forEach(function(p){if(p&&typeof p.no==='number')by[p.no]={no:p.no,name:p.name||(by[p.no]&&by[p.no].name)||''}});
  s.book=Object.keys(by).map(function(n){return by[n]}).sort(function(a,b){return a.no-b.no});s.players=[];s.liberos=[];s.captain=null;s.locked=false;return s}
function bookName(t,n){var b=t&&Array.isArray(t.book)?t.book:[];for(var i=0;i<b.length;i++)if(b[i].no===n)return b[i].name||'';return ''}
function hasBook(t){return !!(t&&Array.isArray(t.book)&&t.book.length)}
function parseRoster(text,div,name){""")
one("dispatch('TEAM_IMPORTED',{team:i?'t2':'t1',snapshot:x.team,fromName:x.team.name},cm)","dispatch('TEAM_IMPORTED',{team:i?'t2':'t1',snapshot:bookSnap(x.team),fromName:x.team.name},cm)")
one("dispatch('TEAM_IMPORTED',{team:k,snapshot:pick.team,fromName:pick.name});","dispatch('TEAM_IMPORTED',{team:k,snapshot:bookSnap(pick.team),fromName:pick.name});")
# 輸入背號：名冊有就帶出姓名；改背號時，原本是名冊帶出的姓名跟著換
one("""  if(old!==null){
    if(n!==old)dispatch('PLAYER_NUMBER_CHANGED',{team:k,from:old,to:n});
  }else{
    dispatch('PLAYER_ADDED',{team:k,no:n});
    if(sl.kind==='lib')dispatch('LIBERO_SET',{team:k,no:n,on:true});
  }
  ui.entry[k]=''; ui.msg[k]='';""","""  var bn=bookName(t,n),bmsg=hasBook(t)&&!bn?'名冊沒有 '+n+' 號，姓名可以自己填':'';
  if(old!==null){
    if(n!==old){var curNm=(t.players.filter(function(p){return p.no===old})[0]||{}).name||'',ob=bookName(t,old);
      dispatch('PLAYER_NUMBER_CHANGED',{team:k,from:old,to:n});
      if(bn&&(!curNm||curNm===ob))dispatch('PLAYER_NAME_SET',{team:k,no:n,name:bn});
      else if(!bn&&curNm&&curNm===ob)dispatch('PLAYER_NAME_SET',{team:k,no:n,name:''});}
  }else{
    dispatch('PLAYER_ADDED',{team:k,no:n});
    if(bn)dispatch('PLAYER_NAME_SET',{team:k,no:n,name:bn});
    if(sl.kind==='lib')dispatch('LIBERO_SET',{team:k,no:n,on:true});
  }
  ui.entry[k]=''; ui.msg[k]=bmsg;""")
one("點「號碼」空格輸入背號。每隊至少 6 位，並點背號指定隊長。姓名可以不填。</p>')",
    "點「號碼」空格輸入背號。每隊至少 6 位，並點背號指定隊長。姓名可以不填。'+(hasBook(s.teams.t1)||hasBook(s.teams.t2)?'有名冊的隊伍，照球隊簽名的名單輸入背號，姓名會自動帶出。':'')+'</p>')")
# 11/19 使用者把名單 PDF 複製貼上：「林昕葦1」（姓名在前、背號黏在後面）看不懂 → 都看得懂；
# 整份貼上時，單獨一行沒有數字的是隊名，「女子組球員名單」這種行換組別；PDF 複製的部首字（⼦）用 NFKC 轉回一般字
one("""  if(name)cur=get(div,name);
  String(text||'').split(/\\r?\\n/).forEach(function(raw,i){
    var line=raw.replace(/^\\uFEFF/,'').trim();if(!line||/背號/.test(line)&&/姓名/.test(line))return;
    var c=line.split(/\\t|,|，/).map(function(x){return x.trim()});
    if(c.length<2)c=line.split(/[\\s:：]+/);""","""  if(name)cur=get(div,name);
  var made={};
  String(text||'').split(/\\r?\\n/).forEach(function(raw,i){
    var line=raw.replace(/^\\uFEFF/,'');try{line=line.normalize('NFKC')}catch(e){}line=line.trim();if(!line||/背號/.test(line)&&/姓名/.test(line))return;
    var hd=line.match(/^(男|女)(子組|生組|排)?.*名單$/);if(hd){div=hd[1]+'子組';cur=null;return}
    var c=line.split(/\\t|,|，/).map(function(x){return x.trim()});
    if(c.length<2)c=line.split(/[\\s:：]+/).filter(Boolean);
    var stf=STAFF.concat([['teacher','隨隊教師']]).some(function(x){return x[1]===c[0]});
    if(c.length===1){var g1=c[0].match(/^(\\d{1,2})(\\D.*)$/),g2=c[0].match(/^(\\D+?)(\\d{1,2})$/);if(g1)c=[g1[1],g1[2].trim()];else if(g2)c=[g2[2],g2[1].trim()]}
    else if(!/^\\d{1,2}$/.test(c[0])&&/^\\d{1,2}$/.test(c[1])&&!stf&&c[0]!=='隊名'&&!/^(男|女)(子組|排|生組)?$/.test(c[0])){var sw=c[0];c[0]=c[1];c[1]=sw}
    if(c.length===1&&!/\\d/.test(c[0])&&!stf){cur=get(div,c[0]);if(!made[div+'|'+c[0]])made[div+'|'+c[0]]=i+1;return}""")
one("""  teams.forEach(function(x){var t=x.team;
    if(!t.name.trim())errors.push('請填隊名');""","""  teams.forEach(function(x){var t=x.team;
    if(!t.name.trim())errors.push('請填隊名');
    else if(!t.players.length&&made[x.division+'|'+t.name])errors.push('第 '+made[x.division+'|'+t.name]+' 行「'+t.name+'」後面沒有球員（一行要有背號和姓名）');""")
# 11/19 使用者：隊伍放錯男女組時，在「修改隊伍名單」就能改（不用刪掉重加）
one("""<label for="ct-name">隊名<input id="ct-name" type="text" maxlength="30" value="'+esc(x.name||'')+'"></label>""",
    """<label for="ct-name">隊名<input id="ct-name" type="text" maxlength="30" value="'+esc(x.name||'')+'"></label><div class="ctdiv"><span>男女組</span><div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="ctdiv" data-v="'+d+'" aria-pressed="'+((x.div||CUP_DIVS[0])===d)+'">'+d+'</button>'}).join('')+'</div></div>""")
one("ui.cupSheet={type:'team',id:ct?ct.id:null,name:ct?ct.team.name:'',group:ct?normGroup(ct.group):cupView.grp,text:ct?teamText(ct.team):''}; break;",
    "ui.cupSheet={type:'team',id:ct?ct.id:null,name:ct?ct.team.name:'',group:ct?normGroup(ct.group):cupView.grp,text:ct?teamText(ct.team):'',div:ct&&CUP_DIVS.indexOf(ct.division)>=0?ct.division:(CUP_DIVS.indexOf(cupView.div)>=0?cupView.div:CUP_DIVS[0])}; break;\n    case 'ctdiv': if(ui.cupSheet){['name','group','text'].forEach(function(f){var el=document.getElementById(f==='text'?'ct-text':'ct-'+f);if(el)ui.cupSheet[f]=el.value});ui.cupSheet.div=b.getAttribute('data-v')} break;")
one("      var pr=parseRoster(ctxt,cupView.div==='未分組'?CUP_DIVS[0]:cupView.div,cnm2);","      var pr=parseRoster(ctxt,ui.cupSheet.div||(cupView.div==='未分組'?CUP_DIVS[0]:cupView.div),cnm2);")
one("      ui.cupSheet=null; save(); break;\n    case 'cupteamdel':","      if(pr.teams.length===1&&CUP_DIVS.indexOf(pr.teams[0].division)>=0&&pr.teams[0].division!==cupView.div)cupView.div=pr.teams[0].division; // 改到另一組：跟著切過去，看得到改好的隊伍\n      ui.cupSheet=null; save(); break;\n    case 'cupteamdel':")
one('\n</style>\n\n<div class="statusband"','\n.ctdiv{display:flex;flex-direction:column;gap:6px}\n</style>\n\n<div class="statusband"')
open(SRC,'w',encoding='utf8').write(s)
print('patched v102')

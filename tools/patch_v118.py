#!/usr/bin/env python3
"""11/20 早上使用者實測預覽版（語音）記下的待改，第一部分：名冊。先跑 patch_v97～v117。
- 名冊可以只打姓名、背號先空著（隊名有填時，一行只有名字就是球員；CSV 背號欄空著也可以）
- 名冊不是開比賽的條件；名冊上背號和姓名都有，輸入背號才帶出姓名
- 比賽名單的背號名冊沒有：那一隊下面列出來，「對照名冊」可以加進名冊，或從名冊選人（換號碼、補背號），一定要按了才改資料夾的名冊
- 打完的比賽：背號對得上、姓名空著的，可以「從名冊補姓名」，已經填的不動
- 名單說明改成範例，不寫身分（隊長、自由球員每場賽前再指定）"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function bookMiss' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

# ---- 名冊：沒有背號的球員 no:null ----
one("""function bookSnap(team){var s=JSON.parse(JSON.stringify(team||emptyTeam())),by={};
  (team&&Array.isArray(team.book)?team.book:[]).concat(team&&team.players||[]).forEach(function(p){if(p&&typeof p.no==='number')by[p.no]={no:p.no,name:p.name||(by[p.no]&&by[p.no].name)||''}});
  s.book=Object.keys(by).map(function(n){return by[n]}).sort(function(a,b){return a.no-b.no});s.players=[];s.liberos=[];s.captain=null;s.locked=false;return s}""",
"""function bookSnap(team){var s=JSON.parse(JSON.stringify(team||emptyTeam())),by={},nn=[];
  (team&&Array.isArray(team.book)?team.book:[]).concat(team&&team.players||[]).forEach(function(p){if(!p)return;if(typeof p.no==='number')by[p.no]={no:p.no,name:p.name||(by[p.no]&&by[p.no].name)||''};else if(p.name&&!nn.some(function(q){return q.name===p.name}))nn.push({no:null,name:p.name})});
  s.book=Object.keys(by).map(function(n){return by[n]}).sort(function(a,b){return a.no-b.no}).concat(nn.filter(function(q){return !Object.keys(by).some(function(n){return by[n].name===q.name})}));s.players=[];s.liberos=[];s.captain=null;s.locked=false;return s}
/* 這場比賽的隊伍在資料夾裡的那一隊（照隊名，同男女組優先）：改名冊、補姓名用 */
function cupTeamFor(m,s,k){var c=m&&m.cup?db.cups.filter(function(q){return q.id===m.cup})[0]:null,nm=String(s.teams[k].name||'').trim();if(!c||!nm)return null;
  var ts=liveTeams(c).filter(function(x){return String(x.team.name||'').trim()===nm});return ts.filter(function(x){return x.division===s.info.division})[0]||ts[0]||null}
/* 名冊沒有的背號：名冊（這場帶入的和資料夾現在的）有人才算；沒有名冊的隊伍不提醒 */
function bookMiss(m,s,k){var t=s.teams[k],ct=cupTeamFor(m,s,k),b=(t.book||[]).concat(ct?ct.team.players:[]);if(!b.length)return [];
  var nos=b.filter(function(p){return typeof p.no==='number'}).map(function(p){return p.no});return t.players.filter(function(p){return nos.indexOf(p.no)<0})}
/* 打完的比賽：背號對得上、姓名空著的，照資料夾現在的名冊補 */
function bookFill(m,s){var out=[];['t1','t2'].forEach(function(k){var ct=cupTeamFor(m,s,k);if(!ct)return;
  s.teams[k].players.forEach(function(p){if(String(p.name||'').trim())return;var q=ct.team.players.filter(function(x){return x.no===p.no&&String(x.name||'').trim()})[0];if(q)out.push({team:k,no:p.no,name:q.name})})});return out}""")
one("function bookName(t,n){var b=t&&Array.isArray(t.book)?t.book:[];for(var i=0;i<b.length;i++)if(b[i].no===n)return b[i].name||'';return ''}",
    "function bookName(t,n){var b=t&&Array.isArray(t.book)?t.book:[];for(var i=0;i<b.length;i++)if(b[i].no!=null&&b[i].no===n)return b[i].name||'';return ''}")
one("var bn=bookName(t,n),bmsg=hasBook(t)&&!bn?'名冊沒有 '+n+' 號，姓名可以自己填':'';",
    "var bn=bookName(t,n),bmsg=hasBook(t)&&!bn?'名冊沒有 '+n+' 號，姓名可以自己填；下面可以對照名冊':'';")

# 讀名單：隊名有填時，一行只有名字（或名字加身分）就是還沒有背號的球員；CSV、Excel 背號欄空著也可以
one("""    if(c.length===1&&!/\\d/.test(c[0])&&!stf){cur=get(div,c[0]);if(!made[div+'|'+c[0]])made[div+'|'+c[0]]=i+1;return}""",
"""    var one1=name&&cur&&cur.team.name===name; // 一隊一隊輸入（隊名有填）
    function nonum(tm2,nm2){nm2=String(nm2||'').replace(/[（(].*$/,'').trim();if(!nm2)return;var t2=tm2.team;
      if(t2.players.some(function(p){return p.no==null&&p.name===nm2})){errors.push('「'+nm2+'」重複');return}t2.players.push({no:null,name:nm2})}
    if(c.length===1&&!/\\d/.test(c[0])&&!stf){if(one1&&!/^(男|女)(子組|排|生組)?$/.test(c[0])){nonum(cur,c[0]);return}cur=get(div,c[0]);if(!made[div+'|'+c[0]])made[div+'|'+c[0]]=i+1;return}""")
one("""    if(!/^\\d{1,2}$/.test(c[0])){if(c.length===1&&!cur){cur=get(div,c[0]);return}errors.push('第 '+(i+1)+' 行看不懂');return}""",
"""    if(c[0]===''&&c[1]&&!/\\d/.test(c[1])){if(!tm)tm=cur=get(div,name||'');nonum(tm,c[1]);return} // 背號欄空著
    if(!/^\\d{1,2}$/.test(c[0])){if(c.length===1&&!cur){cur=get(div,c[0]);return}if(one1&&!/\\d/.test(c.join(''))){nonum(cur,c[0]);return}errors.push('第 '+(i+1)+' 行看不懂');return}""")
one("errors.push('第 '+made[x.division+'|'+t.name]+' 行「'+t.name+'」後面沒有球員（一行要有背號和姓名）');",
    "errors.push('第 '+made[x.division+'|'+t.name]+' 行「'+t.name+'」後面沒有球員（一行一位，背號在前、姓名在後）');")
one("x.team.players.every(function(p){return p&&typeof p.no==='number'})",
    "x.team.players.every(function(p){return p&&(typeof p.no==='number'||p.no===null)})")
one("t.players.forEach(function(p){a.push(p.no+' '+(p.name||'')+(t.liberos.indexOf(p.no)>=0?' L':'')+(t.captain===p.no?' 隊長':''))});",
    "t.players.forEach(function(p){a.push(p.no==null?(p.name||''):p.no+' '+(p.name||'')+(t.liberos.indexOf(p.no)>=0?' L':'')+(t.captain===p.no?' 隊長':''))});")

# 隊伍卡片：人數、缺背號（隊長、自由球員每場賽前才指定，不再寫「還沒有隊長」）
one("x.team.players.length+' 人'+(x.team.liberos.length?'・自由球員 '+x.team.liberos.length+' 人':'')+(x.team.captain===null?'・還沒有隊長':'')+'</span>",
    "x.team.players.length+' 人'+(function(){var nn=x.team.players.filter(function(p){return p.no==null}).length;return nn?'・'+nn+' 人缺背號':''})()+'</span>")

# 名單說明：範例，不寫身分
one("""placeholder="一行一人，可以從 Excel 或 LINE 貼上\\n1 王小明 隊長\\n7 陳大文\\n12 林小華 L">'+esc(x.text||'')+'</textarea></label><p class="muted">身分寫 L 是自由球員，寫隊長是隊長。可以加「教練：王教練」。Excel 整段複製貼上，或另存 CSV 再選檔案。</p>'""",
"""placeholder="1 王小明\\n7 陳大文\\n林小華\\n教練 王教練">'+esc(x.text||'')+'</textarea></label><p class="muted">一行一位：背號、空格、姓名，例如「7 陳大文」。還不知道背號就只打姓名。Excel、LINE 整段貼上也可以。</p>'""")
one("saveFile('賽事名單範本.csv','\\uFEFF男女組,隊名,背號,姓名,身分\\n男子組,範例藍隊,教練,王教練,\\n男子組,範例藍隊,1,王小明,隊長\\n男子組,範例藍隊,7,陳大文,\\n男子組,範例藍隊,12,林小華,L\\n女子組,範例橘隊,3,李小美,隊長\\n','text/csv;charset=utf-8')",
    "saveFile('賽事名單範本.csv','\\uFEFF男女組,隊名,背號,姓名\\n男子組,範例藍隊,教練,王教練\\n男子組,範例藍隊,1,王小明\\n男子組,範例藍隊,7,陳大文\\n男子組,範例藍隊,,林小華\\n女子組,範例橘隊,3,李小美\\n','text/csv;charset=utf-8')")

# ---- 比賽名單頁：名冊沒有的背號 ----
# 放在上面提示字的位置（手機上名單頁剛好一頁，下面加一行會蓋到「印紙本記錄表」）
one("""  return (a.locked?'':'<p class="stephint'+(ui.slot.t1||ui.slot.t2?' kpon':'')+'">點「號碼」空格輸入背號。""",
"""  var bmb=a.locked?'':['t1','t2'].map(function(k){var bm=bookMiss(m,s,k);return bm.length?'<button class="bookmiss" data-act="sheet" data-v="bookfix" data-team="'+k+'"><span><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 名冊沒有 '+bm.map(function(p){return p.no}).join('、')+' 號</span><b>對照名冊 ›</b></button>':''}).join('');
  return (a.locked?'':bmb?'<div class="stephint bookbar'+(ui.slot.t1||ui.slot.t2?' kpon':'')+'">'+bmb+'</div>':'<p class="stephint'+(ui.slot.t1||ui.slot.t2?' kpon':'')+'">點「號碼」空格輸入背號。""")

one("""  }else if(x.type==='staff'){""","""  }else if(x.type==='bookfix'){ // 名冊沒有的背號：問過裁判組再改名冊（11/20 使用者）
    var bfm=bookMiss(m,s,k),bct=cupTeamFor(m,s,k);
    h='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 名冊沒有的號碼</h2><p class="muted">可能是改了號碼、臨時加入或打錯，先跟裁判組確認。確認可以上場，再改名冊；之後的比賽也會用新的名冊。</p>'+
      (!bfm.length?'<p class="scsaved" role="status">名單上的號碼名冊都有了。</p>':!bct?'<p class="note">這場比賽不在賽事資料夾裡，或資料夾裡找不到這一隊，沒有名冊可以改。</p>':
      bfm.map(function(p){return '<div class="bkfix"><b>'+p.no+' 號</b><input id="bf-'+p.no+'" type="text" maxlength="20" aria-label="'+p.no+' 號姓名" placeholder="姓名" value="'+esc(p.name||'')+'"><button data-act="bookadd" data-team="'+k+'" data-no="'+p.no+'">加進名冊</button><button data-act="bookpick" data-team="'+k+'" data-no="'+p.no+'">名冊上的人 ›</button></div>'}).join(''))+
      '<button class="primary" data-act="close">完成</button>';
  }else if(x.type==='bookpick'){
    var bpt=cupTeamFor(m,s,k),bused=t.players.map(function(p){return p.no}),bps=bpt?bpt.team.players.filter(function(p){return p.no==null||bused.indexOf(p.no)<0}).sort(function(a,b){return (a.no==null?-1:a.no)-(b.no==null?-1:b.no)}):[];
    h='<h2>'+x.no+' 號是名冊上的哪一位？</h2><p class="muted">點了就把名冊上這位的背號改成 '+x.no+' 號。</p>'+(bps.length?'<div class="rlist">'+bps.map(function(p,i){return '<button class="imp" data-act="bookset" data-team="'+k+'" data-no="'+x.no+'" data-i="'+bpt.team.players.indexOf(p)+'"><span>'+esc(p.name||'（沒有姓名）')+'</span><small>'+(p.no==null?'還沒有背號':'名冊 '+p.no+' 號')+'</small></button>'}).join('')+'</div>':'<p class="muted">名冊上沒有可以選的人。</p>');
  }else if(x.type==='staff'){""")
one("""    case 'sheet': ui.sheet={type:b.getAttribute('data-v'),team:k}; ui.pending=null; break;""",
"""    case 'sheet': ui.sheet={type:b.getAttribute('data-v'),team:k}; ui.pending=null; break;
    case 'bookpick': ui.sheet={type:'bookpick',team:k,no:no,back:ui.sheet}; break;
    case 'bookadd': case 'bookset': var bkt=cupTeamFor(m,s,k);if(!bkt||no===null)break;
      if(act==='bookadd'){var bnm=((document.getElementById('bf-'+no)||{}).value||'').trim();if(!bkt.team.players.some(function(p){return p.no===no}))bkt.team.players.push({no:no,name:bnm});if(bnm)dispatch('PLAYER_NAME_SET',{team:k,no:no,name:bnm});ui.toast={t:no+' 號'+(bnm?bnm:'')+'已加進名冊',until:Date.now()+3000}}
      else{var bpp=bkt.team.players[Number(b.getAttribute('data-i'))];if(!bpp)break;var bold=bpp.no;bkt.team.players.forEach(function(p){if(p!==bpp&&p.no===no)p.no=null});bpp.no=no;if(bpp.name)dispatch('PLAYER_NAME_SET',{team:k,no:no,name:bpp.name});
        ui.toast={t:'名冊：'+(bpp.name||'')+(bold==null?' 補上 ':' 改成 ')+no+' 號',until:Date.now()+3000};ui.sheet=ui.sheet&&ui.sheet.back||null}
      bkt.at=Date.now();save();if(ui.sheet&&ui.sheet.type==='bookfix'&&!bookMiss(m,reduce(m.events),k).length)ui.sheet=null; break;
    case 'bookfill': var bfl=bookFill(m,s);bfl.forEach(function(q){dispatch('PLAYER_NAME_SET',{team:q.team,no:q.no,name:q.name})});ui.toast={t:bfl.length?'已從名冊補上 '+bfl.length+' 位的姓名':'沒有可以補的姓名',until:Date.now()+3000}; break;""")
# 打完的比賽：從名冊補姓名（有可以補的才出現）
one("""(XP_ON?ctPage(s,'res'):ppResult(s))+'<div class="muted">比賽已自動存在這台裝置""",
    """(XP_ON?ctPage(s,'res'):ppResult(s))+(function(){var bf=bookFill(current(),s);return bf.length?'<div class="note bookfill">名冊上有 '+bf.length+' 位球員的姓名，記錄表上還空著（背號對得上的才補，已經填的不動）。<button data-act="bookfill">從名冊補姓名</button></div>':''})()+'<div class="muted">比賽已自動存在這台裝置""")
one(".tools{display:grid;", """.bookmiss{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:44px;padding:6px 10px;border:1px solid var(--line2);background:var(--card);color:var(--ink);font-size:13px;text-align:left}
.bookmiss>span{min-width:0;color:var(--muted)}
.bookbar{display:flex;flex-direction:column;gap:6px}
.bookmiss b{flex:none;font-weight:700}
.bkfix{display:grid;grid-template-columns:56px minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:center;padding:10px 0;border-top:1px solid var(--line)}
.bkfix>b{font-size:18px}
.bkfix>input{grid-column:2/4}
.bkfix>button{min-height:44px}
.bkfix>button:first-of-type{grid-column:1/3}
.bookfill{display:flex;flex-direction:column;gap:8px}
.tools{display:grid;""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v118')

#!/usr/bin/env python3
"""11/28 晚 使用者語音：觀看畫面上方重排＋提醒教練。先跑 patch_v134。
- 上方：左隊名、中間局數「1 : 0」（不寫「局數」）、右隊名；下面：左比分、中間發球小色塊（箭頭＋球＋號碼）、右比分；拿掉「第 N 局」和局數框
- 提醒教練（只在二裁側）：第 2 次暫停、第 5、6 次替補時跳框，一隊一行，同時發生列在一起；點一下或下一次發球收起來。剛打開觀看時已經發生的不跳"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function wtRemind' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""  return '<div class="wview sv-'+sv+'" inert><div class="board">'+wideBar(s,L)+wideBar(s,R)+sideScore(s,L)+setBox(s,L)+'<div class="mid">第 '+n+' 局'+(sv==='a'?srvA:'')+'</div>'+setBox(s,R)+sideScore(s,R)+(sv==='b'?srvB:'')+'</div>'+ban+tm+""",
"""  var tn=function(k){return '<div class="wtn '+k+'"><span class="wab">'+(s.sets[1].left===k?'A':'B')+'</span><strong>'+esc(tName(s,k))+'</strong></div>'};
  var srvC=c.serving?'<div class="wsrvc '+c.serving+'" role="img" aria-label="'+esc(tName(s,c.serving))+' '+srv+' 號發球">'+(lf?'<i>◀</i>':'')+BALL+'<b>'+srv+'</b>'+(lf?'':'<i>▶</i>')+'</div>':'<div></div>';
  return '<div class="wview" inert><div class="wtop">'+tn(L)+'<b class="wsets" aria-label="局數 '+sw[L]+' 比 '+sw[R]+'">'+sw[L]+' : '+sw[R]+'</b>'+tn(R)+'</div>'+
    '<div class="wsc"><b class="'+L+'">'+c.score[L]+'</b>'+srvC+'<b class="'+R+'">'+c.score[R]+'</b></div>'+ban+tm+""")
# 提醒教練：觀看資料進來時比對
one("""  wt.s=s;wt.len=list.length;wt.list=list;wt.state='ok';""","""  wtRemind(s,!old);
  wt.s=s;wt.len=list.length;wt.list=list;wt.state='ok';""")
one("""function wtR1(){""","""/* 11/28 提醒教練：二裁要跟教練說「暫停用完」「替補第 5、6 次」 */
function wtRemind(s,first){
  var n=s.setNo,c=s.sets[n];if(!c||!c.started)return;
  wt.seen=wt.seen||{};var add=[];
  ['t1','t2'].forEach(function(k){
    var to=c.timeouts[k].length,sb=c.subCount[k],items=[];
    if(to>=2)items.push(['T2','暫停 2 次（用完）']);
    if(sb>=5)items.push(['S5','替補 5 次']);
    if(sb>=6)items.push(['S6','替補 6 次（用完）']);
    items.forEach(function(q){var key=(wt.mid||'')+'|'+n+'|'+k+'|'+q[0];if(wt.seen[key])return;wt.seen[key]=1;if(!first)add.push({k:k,t:q[1],key:key})});
  });
  if(wt.remind&&(c.live||c.rally!==wt.remind.rally))wt.remind=null; // 下一次發球就收起來
  if(add.length&&!wtR1()){var cur=wt.remind&&wt.remind.rally===c.rally?wt.remind.list:[];wt.remind={rally:c.rally,list:cur.concat(add)}}
}
function wtRemindHtml(s){
  if(!wt||!wt.remind||!s||wtR1())return '';
  return '<div class="wrem" role="alertdialog" aria-label="提醒教練"><h2>提醒教練</h2><ul>'+wt.remind.list.map(function(x){return '<li><span class="tpill '+x.k+'">'+esc(tName(s,x.k))+'</span><b>'+esc(x.t)+'</b></li>'}).join('')+'</ul><button class="primary" data-act="wremok">知道了</button></div>';
}
function wtR1(){""")
one("""'<main class="page wpage">'+(s?watchBoard(s):watchMsg())+'</main></div>'+wp+'</div>'+ask+tk;""","""'<main class="page wpage">'+(s?watchBoard(s):watchMsg())+'</main></div>'+wp+wtRemindHtml(s)+'</div>'+ask+tk;""")
one("""    case 'wside': prefs.wside=""","""    case 'wremok': if(wt)wt.remind=null; return true;
    case 'wside': if(b.getAttribute('data-v')==='r1'&&wt)wt.remind=null; prefs.wside=""")
one("</style>","""/* 11/28 晚 觀看畫面上方 */
.wtop{flex:none;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px}
.wtn{--c:var(--t1);--o:var(--t1-on);display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:34px;padding:0 8px;border-radius:8px;background:var(--c);color:var(--o)}
.wtn.t2{--c:var(--t2);--o:var(--t2-on)}
.wtn .wab{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:13px;font-weight:800;background:var(--o);color:var(--c);flex:none}
.wtn strong{font-size:16px;font-weight:800;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.wsets{font-family:var(--num);font-size:clamp(30px,4.6vh,44px);font-weight:800;line-height:1;padding:2px 10px;border-radius:8px;background:var(--box,#3A4048);color:#fff}
.wsc{flex:none;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:6px}
.wsc>b{text-align:center;font-family:var(--num);font-weight:800;line-height:.95;font-size:clamp(64px,min(14vh,24vw),170px)}
.wsrvc{--c:var(--t1-j);--o:var(--t1-jt);display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:10px;background:var(--c);color:var(--o);box-shadow:0 0 0 2px var(--ink);font-family:var(--num);font-weight:900;line-height:1}
.wsrvc.t2{--c:var(--t2-j);--o:var(--t2-jt)}
.wsrvc svg{width:32px;height:32px;flex:none}.wsrvc b{font-size:40px}.wsrvc i{font-style:normal;font-size:26px}
.wrem{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:31;width:340px;max-width:calc(100% - 24px);padding:16px;border:4px solid #FFD21F;border-radius:14px;background:var(--panel);box-shadow:0 10px 32px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:10px;text-align:center}
.wrem h2{margin:0;font-size:28px}
.wrem ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.wrem li{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;font-size:22px}
.wrem li .tpill{font-size:20px}
@media (max-height:700px){.wsc>b{font-size:clamp(56px,12vh,120px)}.wsrvc b{font-size:32px}.wsrvc svg{width:26px;height:26px}.wsets{font-size:28px}}
</style>""")
open(SRC,'w',encoding='utf8').write(s)
print('ok')

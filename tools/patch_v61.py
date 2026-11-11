#!/usr/bin/env python3
"""11/11 使用者：
一、判罰對象的職員照協會記錄表（和名單頁一樣）：執行教練 C、教練 AC、領隊 T、管理 M。
    按鈕寫中文加英文代號；紙本判罰格、結果表、判罰紀錄、CSV 只寫英文代號。學校版一起改。
    執行教練、教練沿用以前存的代號 C、AC（同一個人：帶隊的教練、第二位教練）；領隊、管理用中文存，
    舊版程式打開新比賽也看得懂。以前判給防護員 T、隊醫 M 的，照當時的名稱顯示。
二、號碼放大後，旁邊的字跟著放大（寬的橫畫面），跟著畫面高度變，矮的筆電不會擠不下：
    兩側暫停、替補、自由、隊長，下面三顆按鈕、發球、提示行、隊名長條。
三、上方列每一頁都一樣：比賽頁和記錄表頁同一條（左邊多「‹ 比賽」，記錄表頁沒有復原，時間靠右貼著問號），
    寬的畫面時間每一頁一樣大；一局還在打時不顯示「結束 —」。記錄表分頁的字放大。
四、比賽中跳出來的面板（判罰、其他、點球員、替補、更正）在平板、電腦上放大一級。
用法：python3 tools/patch_v61.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function whoCode(' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# ---------- 一、判罰職員 ----------
one("var STAFFWHO=[['C','教練'],['AC','助理教練'],['T','防護員'],['M','隊醫']];",
    "/* 11/11 使用者：判罰對象的職員照協會記錄表（和名單頁一樣）。[存的代號, 中文, 紙本寫的英文]。\n"
    "   執行教練、教練沿用以前的 C、AC；領隊、管理用中文存，舊版程式打開也看得懂。以前判給防護員、隊醫的照當時的名稱顯示 */\n"
    "var STAFFWHO=[['C','執行教練','C'],['AC','教練','AC'],['領隊','領隊','T'],['管理','管理','M']];\n"
    "var STAFFOLD=[['T','防護員','T'],['M','隊醫','M']];\n"
    "function staffQ(w){return typeof w==='string'?STAFFWHO.concat(STAFFOLD).filter(function(x){return x[0]===w})[0]:null}\n"
    "function whoCode(w){var q=staffQ(w);return q?q[2]:w}\n"
    "function staffBtn(q,extra){return '<span class=\"snm\">'+q[1]+' <b>'+q[2]+'</b></span>'+(extra?'<small>'+extra+'</small>':'')}")
one("function whoText(w){if(w==='隊'||w==null)return '';if(typeof w==='number')return w+' 號';var q=STAFFWHO.filter(function(x){return x[0]===w})[0];return q?q[1]:String(w)}",
    "function whoText(w){if(w==='隊'||w==null)return '';if(typeof w==='number')return w+' 號';var q=staffQ(w);return q?q[1]+' '+q[2]:String(w)}")
# 判罰確認的標題
one("okw=p.ok.who==='隊'?'':(typeof p.ok.who==='number'?p.ok.who+' 號 ':STAFFWHO.filter(function(q){return q[0]===p.ok.who})[0][1]+' ');",
    "okw=p.ok.who==='隊'?'':whoText(p.ok.who)+' ';")
# 選對象的職員按鈕
one("var st=STAFFWHO.map(function(x){var g=gone(x[0]);return '<button data-act=\"penwho\" data-team=\"'+k+'\" data-v=\"'+x[0]+'\"'+(g?' disabled':'')+'>'+x[1]+(g?' '+gtx[g]:'')+'</button>'}).join('');",
    "var st=STAFFWHO.map(function(x){var g=gone(x[0]);return '<button data-act=\"penwho\" data-team=\"'+k+'\" data-v=\"'+x[0]+'\"'+(g?' disabled':'')+'>'+staffBtn(x,g?gtx[g]:'')+'</button>'}).join('');")
# 更正：改對象
one("STAFFWHO.filter(function(q){return q[0]!==wh}).map(function(q){return '<button data-act=\"amendwho\" data-v=\"'+q[0]+'\" data-team=\"'+tk+'\">'+q[1]+'</button>'}).join('')",
    "STAFFWHO.filter(function(q){return q[0]!==wh}).map(function(q){return '<button data-act=\"amendwho\" data-v=\"'+q[0]+'\" data-team=\"'+tk+'\">'+staffBtn(q)+'</button>'}).join('')")
# 記錄好的提示
one("(who==='隊'?'':typeof who==='number'?who+' 號 ':(STAFFWHO.filter(function(q){return q[0]===who})[0]||['',''])[1]+' ')",
    "(who==='隊'?'':whoText(who)+' ')")
assert s.count('STAFFWHO') == 4, s.count('STAFFWHO')
# 紙本（協會記錄表）、結果表、判罰紀錄、CSV 只寫英文代號
one("var v=(q.kind==='DW'||q.kind==='DP')?'D':q.who,col=", "var v=(q.kind==='DW'||q.kind==='DP')?'D':whoCode(q.who),col=")
one("var v=(x.kind==='DW'||x.kind==='DP')?'D':x.who,col=", "var v=(x.kind==='DW'||x.kind==='DP')?'D':whoCode(x.who),col=")
one("var v=(x.kind==='DW'||x.kind==='DP')?'D':x.who;", "var v=(x.kind==='DW'||x.kind==='DP')?'D':whoCode(x.who);")
one("KIND[d.kind]+' '+d.who", "KIND[d.kind]+' '+whoCode(d.who)")
one('C 教練、AC 助理教練、T 防護員、M 隊醫', 'C 執行教練、AC 教練、T 領隊、M 管理', 2)

# ---------- 三、上方列：比賽頁和記錄表頁同一條 ----------
one("""  var undo=ui.page==='play'&&c.started&&!over&&!ui.liveSheet&&!setWinner(s)?'<button data-act="undo"'+(lastUndoable(current())?'':' disabled')+'>↶ 復原</button>':'';
  var cen=ui.page==='play'&&c.started&&!over&&!ui.liveSheet&&!setWinner(s)&&isWide();""",
    """  /* 11/11 使用者：記錄表頁（比賽中）和比賽頁同一條：中間比分和第幾局、右邊時間，只多左邊的「‹ 比賽」、沒有復原，時間靠右貼著問號 */
  var live=ui.page==='play'&&c.started&&!over&&!setWinner(s);
  var undo=live&&!ui.liveSheet?'<button data-act="undo"'+(lastUndoable(current())?'':' disabled')+'>↶ 復原</button>':'';
  var cen=live&&isWide();""")
one("""':ui.page==='play'&&c.started&&!over&&!ui.liveSheet&&!setWinner(s)?'<h1>'+esc(title)+'<small class="btgt">'""",
    """':live?'<h1>'+esc(title)+'<small class="btgt">'""")
# 一局還在打：「結束」永遠是一條線，先不顯示（手機的規則用最後一格，所以留著藏起來）
one("""<span>結束 <b>'+(c.endAt?setEndHM(s,s.setNo)||'—':'—')+'</b></span></div>';""",
    """<span'+(c.endAt?'':' class="pend"')+'>結束 <b>'+(c.endAt?setEndHM(s,s.setNo)||'—':'—')+'</b></span></div>';""")
# 寬的畫面：時間每一頁一樣大（以前只有比賽頁放大）
one("""/* v46 比賽中（橫的畫面）：開始、經過、結束的時間跟著畫面寬度放大 */
@media (min-width:920px){
  .bar:has(>.barmid) .bartime{font-size:clamp(12px,1.05vw,16px);gap:clamp(9px,1vw,16px);align-items:baseline}
  .bar:has(>.barmid) .bartime b{font-size:clamp(17px,1.6vw,26px)}
}""",
    """/* v46 開始、經過、結束的時間：寬的畫面每一頁一樣大（11/11 使用者：以前只有比賽頁放大，記錄表頁比較小） */
@media (min-width:920px) and (min-height:621px){
  .bar .bartime{font-size:15px;gap:14px;align-items:baseline}
  .bar .bartime b{font-size:26px}
}""")

# ---------- CSS ----------
CSS = r"""/* 11/11 一局還在打時不顯示「結束 —」 */
.bartime .pend{display:none}
/* 11/11 判罰職員按鈕：中文加英文代號，已出局、出場寫在下面 */
.stf button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.15;white-space:nowrap}
.stf .snm b{font-family:var(--num);font-weight:800}
.stf button small{font-size:11px;font-weight:600}
/* 11/11 上方列：寬的畫面每一頁同一個大小；記錄表頁的「‹ 比賽」放左邊（比分在正中間）。
   直的平板：「第幾局」後面有空位時，時間、復原、問號靠右（和其他頁一樣問號在最右邊） */
.bar:has(>.barmid)>.barback{order:-1}
.bar h1:has(>.btgt)~.bartime{margin-left:auto}
@media (min-width:920px) and (min-height:621px){
  .bar{min-height:62px}
  .bar h1{font-size:22px}
  .bar button{font-size:18px}
  .bar h1 .btgt{font-size:16px}
  .bar>.barmid{font-size:28px}
  .bar>.barmid small{font-size:18px}
  .bar>.barmid .bsets{font-size:40px}
  .sheettabs button{font-size:clamp(14px,2.2vh,18px);min-height:clamp(44px,6vh,52px)}
}
@media (orientation:landscape) and (min-width:920px) and (min-height:621px){
  .kp.bench,.kp:not(.bench){top:max(62px,calc(var(--safe-top) + 54px))}
}
/* 寬度 920～1019：時間放大後，放正中間的比分會碰到時間，改成放在左右兩邊的正中間 */
@media (min-width:920px) and (max-width:1019px) and (min-height:621px){
  .bar>.barmid{position:static;transform:none;flex:none;overflow:visible}
  .bar:has(>.barmid)::after{content:"";flex:1;order:1}
  .bar:has(>.barmid)>.bartime,.bar:has(>.barmid)>[data-act=undo],.bar:has(>.barmid)>.helpbtn{order:2}
}
/* 11/11 號碼放大後，旁邊的字跟著放大（寬的橫畫面）。跟著畫面高度變，矮的筆電維持原本大小 */
@media (orientation:landscape) and (min-width:761px) and (min-height:521px){
  .wcol .tg button{min-height:clamp(58px,8.5vh,84px);font-size:clamp(20px,3.1vh,30px)}
  .wcol .tg button b{font-size:clamp(36px,5.4vh,52px)}
  .wcol .strip::before,.wcol .strip::after{font-size:clamp(15px,2.9vh,24px);width:auto;color:var(--ink)}
  .wcol .strip .lc,.wcol .strip .capbox{width:clamp(56px,8.5vh,70px);height:clamp(56px,8.5vh,70px)}
  .wcol .strip .lc b,.wcol .strip .capbox b{font-size:clamp(26px,4.4vh,36px)}
  .wcol .strip .capbox b.circ{width:clamp(42px,6.8vh,56px);height:clamp(42px,6.8vh,56px);font-size:clamp(22px,3.65vh,30px)}
  .wmid .pbtns button{font-size:clamp(19px,3.2vh,26px)}
  .wmid .pbtns .penbtn .ic .cd{width:.47em;height:.68em}
  .wmid .pbtns .penbtn .ic .cd+.cd{margin-left:.1em}
  .wmid .sv{font-size:clamp(26px,4.15vh,34px)}
  .wmid .sb{font-size:clamp(19px,3.2vh,26px)}
  .wmid .lockline,.wmid .libhint{height:clamp(19px,2.9vh,24px);min-height:clamp(19px,2.9vh,24px);line-height:clamp(19px,2.9vh,24px);font-size:clamp(14px,2.3vh,19px)}
  .wbar{min-height:clamp(56px,7.3vh,60px)}
  .wbar strong{font-size:clamp(24px,3.65vh,30px)}
  .wbar .wab{width:clamp(30px,4.4vh,36px);height:clamp(30px,4.4vh,36px);font-size:clamp(17px,2.45vh,20px)}
}
/* 11/11 比賽中跳出來的面板（判罰、其他、點球員、更正、替補）：平板、電腦上放大一級，跟著畫面高度變 */
@media (min-width:760px){
  .shell.nonav~.sheet{width:min(clamp(460px,68vh,560px),calc(100vw - 32px))}
  .shell.nonav~.sheet h2{font-size:clamp(19px,2.8vh,23px)}
  .shell.nonav~.sheet .muted{font-size:clamp(16px,2.2vh,18px)}
  .shell.nonav~.sheet .subhint{font-size:clamp(18px,2.45vh,20px)}
  .shell.nonav~.sheet button{font-size:clamp(16px,2.3vh,19px)}
  :where(.shell.nonav~.sheet) button{min-height:clamp(44px,6.6vh,54px)}
  .shell.nonav~.sheet>.sheetback{font-size:clamp(15px,2.2vh,18px);min-height:clamp(38px,5.6vh,46px)}
  .shell.nonav~.sheet .teampick button{font-size:clamp(16px,2.45vh,20px);min-height:clamp(50px,7.3vh,60px)}
  .shell.nonav~.sheet .pk3 button{font-size:clamp(13px,2.2vh,18px);min-height:clamp(62px,9.3vh,76px)}
  .shell.nonav~.sheet .pk3 small{font-size:clamp(12px,1.7vh,14px)}
  .shell.nonav~.sheet .pk3 .ic{height:clamp(24px,3.4vh,28px)}
  .shell.nonav~.sheet .pk3 .cd{width:clamp(15px,2.2vh,18px);height:clamp(21px,3vh,25px)}
  .shell.nonav~.sheet .stf button{font-size:clamp(13px,2.2vh,18px);min-height:clamp(46px,7vh,58px)}
  .shell.nonav~.sheet .stf button small{font-size:clamp(11px,1.6vh,13px)}
  .shell.nonav~.sheet .benchrow{grid-template-columns:repeat(6,minmax(0,clamp(60px,9vh,74px)))}
  .shell.nonav~.sheet .chip b{font-size:clamp(26px,3.8vh,31px)}
  .shell.nonav~.sheet .pmb{font-size:clamp(19px,2.8vh,23px);min-height:clamp(64px,9.3vh,76px)}
  .shell.nonav~.sheet .mhead{font-size:clamp(14px,2vh,16px)}
  .shell.nonav~.sheet .mrow strong{font-size:clamp(17px,2.45vh,20px)}
  .shell.nonav~.sheet .mrow strong small{font-size:clamp(12px,1.7vh,14px)}
  .shell.nonav~.sheet .mrow .mteams button,.shell.nonav~.sheet .mbtn:not(.big){min-height:clamp(48px,6.6vh,54px)}
  .shell.nonav~.sheet .mbtn strong{font-size:clamp(16px,2.3vh,19px)}
  .shell.nonav~.sheet .mbtn small{font-size:clamp(13px,1.9vh,16px)}
  .shell.nonav~.sheet .mbtn.big{min-height:clamp(68px,9.3vh,76px)}
  .shell.nonav~.sheet .mbtn.big strong{font-size:clamp(17px,2.45vh,20px)}
  .shell.nonav~.sheet .fixpos button{min-height:clamp(64px,9vh,74px)}
  .shell.nonav~.sheet .fixpos small{font-size:clamp(12px,1.8vh,15px)}
  .shell.nonav~.sheet .fixpos b{font-size:clamp(26px,3.6vh,30px)}
  .shell.nonav~.sheet .logbox{max-height:clamp(300px,45vh,380px)}
  .shell.nonav~.sheet .logbox .res{font-size:clamp(14px,2.2vh,18px)}
  .shell.nonav~.sheet .logbox .res .sm th{font-size:clamp(11px,1.7vh,14px)}
  .shell.nonav~.sheet .irb{font-size:clamp(14px,2.1vh,17px)}
  .shell.nonav~.kp.bench .kphead{font-size:clamp(15px,2.2vh,18px)}
  .shell.nonav~.kp.bench .kphead>span:first-child{font-size:clamp(16px,2.45vh,20px)}
  .shell.nonav~.kp.bench .kphead button{font-size:clamp(14px,2.2vh,18px);min-height:clamp(44px,6.1vh,50px)}
  .shell.nonav~.kp.bench .subhint{font-size:clamp(18px,2.45vh,20px)}
  .shell.nonav~.kp.bench .row button{font-size:clamp(15px,2.2vh,18px);min-height:clamp(44px,6.1vh,50px)}
  .shell.nonav~.kp.bench .subbody button:not(.chip){font-size:clamp(16px,2.2vh,18px)}
  .shell.nonav~.kp.bench .excinj,.shell.nonav~.kp.bench .excinj button{font-size:clamp(16px,2.2vh,18px)}
  .shell.nonav~.kp.bench .excinj .muted{font-size:clamp(15px,2.1vh,17px)}
  .shell.nonav~.kp.bench .forcedmsg,.shell.nonav~.kp.bench .excnote{font-size:clamp(16px,2.2vh,18px)}
  .shell.nonav~.kp.bench .benchrow{grid-template-columns:repeat(auto-fill,minmax(44px,clamp(60px,8.8vh,72px)))}
  .shell.nonav~.kp.bench .chip b{font-size:clamp(26px,3.8vh,31px)}
}
@media (orientation:landscape) and (min-width:640px){
  .shell.nonav~.kp.bench{width:min(clamp(340px,49vh,400px),40vw)}
}
"""
one('</style>', CSS + '</style>')
open(SRC, 'w', encoding='utf8').write(s)
print('patch_v61 ok')

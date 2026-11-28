#!/usr/bin/env python3
"""11/28 南電盃實際使用後的修改（使用者 11/28 語音整理的 14 項）：
觀看畫面（二裁、一裁站遠遠看）：視角切換、比賽結束畫面、螢幕不休眠、局間倒數、暫停條放大、暫停／替補分開放大、
用掉上下空白、發球色塊、局數放大、發球格黃框加粗、斷線紅條、下方隊長格不畫圈。
記錄台：比賽中補登球員（不設開關，按的時候確認）、自由球員點錯（同一個死球再換時問「是不是換錯了？」，是就取消剛才那次）。"""
import sys,re
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function watchResult' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
NOSLEEP='data:video/mp4;base64,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AAAAGnNncGQBAAAAcm9sbAAAAAIAAAAB//8AAAAcc2JncAAAAAByb2xsAAAAAQAAABEAAAABAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY2MC4xNi4xMDAAAAAIZnJlZQAABDVtZGF0AAACugYF//+23EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTEgZGVibG9jaz0xOi0zOi0zIGFuYWx5c2U9MHgzOjB4MyBtZT1oZXggc3VibWU9MiBwc3k9MSBwc3lfcmQ9Mi4wMDowLjcwIG1peGVkX3JlZj0wIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MCA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0wIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgc3RpdGNoYWJsZT0xIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTEga2V5aW50PTI1MCBrZXlpbnRfbWluPTEwIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9MTAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4yMACAAAAAE2WIhAAXzn/o/8JVP7vA3XBP/+HeAgBMYXZjNjAuMzEuMTAyAAIwQA4AAAAJQZokGILZz/7gAAAACUGeQkIKZz+mgQEYIAcAAAAJAZ5hRBPOf6uAARggBwAAAAkBnmNEE85/q4EBGCAHAAAACkGaaDRMQWzn/uEBGCAHAAAAC0GehkURLBTOf6aBAAAACQGepUQTzn+rgQEYIAcAAAAJAZ6nRBPOf6uAARggBwAAAApBmqw0TEFs5/7gARggBwAAAAtBnspFFSwUzn+mgQEYIAcAAAAJAZ7pRBPOf6uAAAAACQGe60QTzn+rgAEYIAcAAAAKQZrwNExBXOf+4QEYIAcAAAALQZ8ORRUsFM5/poEBGCAHAAAACQGfLUQTzn+rgQAAAAkBny9EE85/q4ABGCAHAAAACkGbMzRMQTzn/uABGCAHAAAAC0GfUUUVLBPOf6uBARggBwAAAAkBn3JEE85/q4ABGCAHARggBw=='

# ---------- 3. 螢幕不休眠 ----------
one("""/* 比賽中螢幕不休眠 */
var wake=null,wantWake=false;
function syncAwake(want){
  wantWake=want;
  if(!('wakeLock' in navigator))return;
  if(want&&!wake&&document.visibilityState==='visible'){wake='pending';navigator.wakeLock.request('screen').then(function(l){wake=l;l.addEventListener('release',function(){wake=null})}).catch(function(){wake=null})}
  else if(!want&&wake&&wake!=='pending'){try{wake.release()}catch(e){}wake=null}
}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&wantWake)syncAwake(true)});""",
"""/* 比賽中螢幕不休眠
   11/28 使用者：二裁手機架著沒操作，過一陣子螢幕就關了。原本只在打開時要一次「螢幕常亮」，被系統收回（切 App、要求失敗、iPhone 主畫面 App）就沒再要。
   改成：每 10 秒、每次點畫面都檢查，沒有就再要；iPhone 另外播一段看不見的靜音小影片（舊版 iOS 主畫面 App 的常亮會失效）；不支援的瀏覽器也用影片 */
var wake=null,wantWake=false,nsv=null,NOSLEEP='"""+NOSLEEP+"""';
function nsVideo(on){
  try{
    if(on){if(!nsv){nsv=document.createElement('video');nsv.muted=true;nsv.defaultMuted=true;nsv.setAttribute('muted','');nsv.setAttribute('playsinline','');nsv.setAttribute('webkit-playsinline','');nsv.loop=true;nsv.setAttribute('aria-hidden','true');nsv.setAttribute('tabindex','-1');
        nsv.style.cssText='position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1';nsv.src=NOSLEEP;document.body.appendChild(nsv)}
      if(nsv.paused){var p=nsv.play();if(p&&p.catch)p.catch(function(){})}}
    else if(nsv&&!nsv.paused)nsv.pause();
  }catch(e){}
}
function syncAwake(want){
  wantWake=want;
  var hasWL='wakeLock' in navigator;
  if(want&&hasWL&&!wake&&document.visibilityState==='visible'){wake='pending';navigator.wakeLock.request('screen').then(function(l){if(!wantWake){try{l.release()}catch(e){}wake=null;return}wake=l;l.addEventListener('release',function(){if(wake===l)wake=null})}).catch(function(){wake=null;if(wantWake)nsVideo(true)})}
  else if(!want&&wake&&wake!=='pending'){try{wake.release()}catch(e){}wake=null}
  nsVideo(want&&(!hasWL||platform()==='ios'));
}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&wantWake)syncAwake(true)});
setInterval(function(){if(wantWake&&document.visibilityState==='visible'&&(!wake||(nsv&&nsv.paused&&platform()==='ios')))syncAwake(true)},10000);
document.addEventListener('pointerdown',function(){if(wantWake)syncAwake(true)},true); // 點一下畫面就再要一次（有些瀏覽器要點過才給）""")

# 觀看時一直保持常亮（比賽結束、等下一場也要，手機還架在柱子上）
one("app.innerHTML=watchHtml();fitNums();flipRun(wfl);syncAwake(!!wsv&&!matchOver(wsv));return}",
    "app.innerHTML=watchHtml();fitNums();flipRun(wfl);syncAwake(!!wt&&!/^(none|gone|deny|bad|offline|loadfail)$/.test(wt.state||''));return}")

# ---------- 觀看畫面 ----------
i=s.index('function watchBoard(s){');j=s.index('function watchHtml(){')
s=s[:i]+r"""/* 11/28 觀看畫面改版：二裁、一裁站遠遠看，字和格子以遠看為準 */
function wtR1(){return prefs.wside==='r1'} // 站在一裁那邊：左右對調（記錄台、二裁同一邊，看到的一樣）
function wtSetRows(s,L,R){var rows='';for(var n=1;n<=3;n++){var x=s.sets[n];if(!x.started)continue;rows+='<tr><th>第 '+n+' 局</th><td>'+x.score[L]+'</td><td>'+x.score[R]+'</td></tr>'}
  return rows?'<table class="wsett"><thead><tr><th></th><th><span class="tpill '+L+'">'+esc(tName(s,L))+'</span></th><th><span class="tpill '+R+'">'+esc(tName(s,R))+'</span></th></tr></thead><tbody>'+rows+'</tbody></table>':''}
/* 比賽結束：記錄台按確定之前（最後一分剛打完）就先顯示，標「記錄台確認中」；記錄台按復原，這裡跟著變回比賽中 */
function watchResult(s,w,pending,L){
  var sw=setsWon(s),a=sw[w]+(pending?1:0),b=sw[other(w)];
  return '<div class="wres" role="status"><p class="wres-h">比賽結束'+(pending?'<small>記錄台確認中</small>':'')+'</p><div class="wres-w '+w+'"><b>'+esc(tName(s,w))+'</b><span>以 '+a+' : '+b+' 獲勝</span></div>'+wtSetRows(s,L,other(L))+
    (pending?'':'<p class="muted">記錄台開始下一場時，會自動切換。</p>')+'</div>';
}
/* 還沒開始、局與局之間：局間休息倒數（跟記錄台一樣從上一局結束算 3 分鐘） */
function watchWait(s,L){
  var n=s.setNo,R=other(L),pv=s.sets[n-1],sw=setsWon(s);
  if(!s.sets[1].started)return '<div class="wmsg"><h2>'+esc(tName(s,L))+' 對 '+esc(tName(s,R))+'</h2><p class="muted">等第 1 局開始</p></div>';
  var dl=pv&&pv.endAt?new Date(pv.endAt).getTime()+180000:0;
  return '<div class="wwait"><div class="wwt"><span class="tpill '+L+'">'+esc(tName(s,L))+'</span><b>'+sw[L]+' : '+sw[R]+'</b><span class="tpill '+R+'">'+esc(tName(s,R))+'</span></div>'+
    (dl?'<div class="wbrk"><small>局間休息</small><b data-cd="'+dl+'">'+cdText(dl)+'</b></div>':'')+'<p class="wnext">等第 '+n+' 局開始</p>'+wtSetRows(s,L,R)+'</div>';
}
function watchBoard(s){
  var n=s.setNo,c=s.sets[n],over=matchOver(s),win=!over&&setWinner(s),sw=setsWon(s),r1=wtR1();
  var base=c.left||s.sets[1].left||'t1',L=r1?other(base):base,R=other(L);
  if(over)return watchResult(s,sw.t1>sw.t2?'t1':'t2',false,L);
  if(win&&sw[win]+1>=2)return watchResult(s,win,true,L);
  if(!s.sets[1].started||!c.started)return watchWait(s,L);
  var cells='';
  for(var i=0;i<3;i++){cells+=playCell(s,L,LEFT_CELLS[i][0])+playCell(s,L,LEFT_CELLS[i][1]);if(i===0)cells+='<div class="net" aria-hidden="true"></div>';cells+=playCell(s,R,RIGHT_CELLS[i][0])+playCell(s,R,RIGHT_CELLS[i][1])}
  var srv=courtPlayer(c,c.serving,0),lf=c.serving===L,sv=prefs.wsrv==='a'?'a':'b';
  /* 發球：底色用發球隊的球衣顏色，字自動配深淺（深色球衣放在深色底也看得清楚）。a：放在中間「第 N 局」下面；b：放在發球隊比分下面整條 */
  var srvA=c.serving?'<div class="wsrva '+c.serving+'" aria-hidden="true"><i>'+(lf?'◀':'')+'</i><b>'+srv+'</b><i>'+(lf?'':'▶')+'</i></div>':'';
  var srvB=c.serving?'<div class="wsrvb '+c.serving+' '+(lf?'lf':'rt')+'" role="img" aria-label="'+esc(tName(s,c.serving))+' '+srv+' 號發球">'+'<i>'+(lf?'◀':'')+'</i>'+BALL+'<b>'+srv+'</b><span>號發球</span><i>'+(lf?'':'▶')+'</i></div>':'';
  var cnt=function(k){var ex=c.subs[k].length-c.subCount[k];return '<div class="wcnt '+k+'"><div class="wto"><small>暫停</small><b>'+c.timeouts[k].length+'</b></div><div class="wsb"><small>替補</small><b>'+c.subCount[k]+'</b></div>'+(ex?'<p>例外替補 '+ex+'</p>':'')+'</div>'};
  var wtm=wt&&wt.timer&&Date.now()<wt.timer.end?wt.timer:null;
  var tm=wtm?'<div class="tbar '+wtm.team+'"><span>'+esc(tName(s,wtm.team))+' '+esc(wtm.label||'暫停')+'</span><b data-wtm>'+wtText(wtm)+'</b></div>':'';
  var ban=win?'<p class="wban">第 '+n+' 局結束 '+c.score[L]+' : '+c.score[R]+'<small>記錄台確認中</small></p>':'';
  return '<div class="wview sv-'+sv+'" inert><div class="board">'+wideBar(s,L)+wideBar(s,R)+sideScore(s,L)+setBox(s,L)+'<div class="mid">第 '+n+' 局'+(sv==='a'?srvA:'')+'</div>'+setBox(s,R)+sideScore(s,R)+(sv==='b'?srvB:'')+'</div>'+ban+tm+
    '<div class="pcourt" role="group" aria-label="球場，記錄台在'+(r1?'上方':'下方')+'">'+cells+'</div><div class="strips">'+libStrip(s,L,false,true)+libStrip(s,R,true,true)+'</div><div class="wcounts">'+cnt(L)+cnt(R)+'</div></div>';
}
"""+s[j:]

one("""  var head='<header class="wtbar"><button class="wleave" data-act="wleave">‹ 離開</button><span class="wcode">'+(wt&&wt.court&&s?'<b>'+esc(wt.court)+'</b><small>代碼 '+esc(wt.code)+'</small>':'代碼 '+esc(wt?wt.code:''))+'</span><span class="wst '+st[0]+'" role="status">'+esc(st[1])+'</span></header>';""",
"""  /* 11/28 上方縮小；多一個「二裁側／一裁側」；斷線時整條紅色，遠看就知道 */
  var side=s?'<div class="seg wside" role="group" aria-label="我站的位置">'+[['r2','二裁側'],['r1','一裁側']].map(function(q){return '<button data-act="wside" data-v="'+q[0]+'" aria-pressed="'+((wtR1()?'r1':'r2')===q[0])+'">'+q[1]+'</button>'}).join('')+'</div>':'';
  var down=st[0]==='bad'&&st[1]?'<div class="wdown" role="alert"><b>已斷線</b><span>'+esc(st[1])+'</span></div>':'';
  var head='<header class="wtbar"><button class="wleave" data-act="wleave">‹ 離開</button><span class="wcode">'+(wt&&wt.court&&s?'<b>'+esc(wt.court)+'</b><small>'+esc(wt.code)+'</small>':esc(wt?wt.code:''))+'</span>'+side+'<span class="wst '+st[0]+'" role="status">'+(st[0]==='bad'?'':esc(st[0]==='ok'?'● 同步中':st[1]))+'</span></header>'+down;""")

one("""    case 'wstay': if(wt)wt.ask=false; return true;""","""    case 'wstay': if(wt)wt.ask=false; return true;
    case 'wside': prefs.wside=b.getAttribute('data-v')==='r1'?'r1':'';savePrefs();lastRot=null; return true;""")

# 12. 下面的隊長格：觀看畫面不畫圈（上面站位裡的隊長照樣畫圈）
one("function libStrip(s,k,mir){","function libStrip(s,k,mir,plain){")
one("""<span class="lno">隊長</span><b'+(cap!=null?' class="circ"':'')+'>'""","""<span class="lno">隊長</span><b'+(cap!=null&&!plain?' class="circ"':'')+'>'""")

# ---------- 14. 自由球員點錯 ----------
one("""function libWait(c,k){""","""/* 11/28 自由球員點錯：同一個死球裡剛換過，可以整筆取消（不是第二次替換，規則 19.3.2.1 的隔一球不適用）。
   只找這隊這局最後一次自由球員替換；之後這隊有替補、修正陣容等會牽動站位的動作，就不提供（避免取消後對不起來） */
function libSameBall(c,k){return c.started&&!c.live&&!c.replayLock&&c.libRally[k]!==null&&c.libRally[k]>=c.rally}
function libMistake(s,m,k){
  var c=s.sets[s.setNo];if(!m||!libSameBall(c,k))return null;
  var dead={},live=[],ok=['INFO_SET','TEAM_COLOR_SET','LIBERO_COLOR_SET','STAFF_SET','PLAYER_NAME_SET','TEAM_NAME_SET','SETTER_SET','TIMEOUT','PLAYER_ADDED'],lib=['LIBERO_IN','LIBERO_OUT','LIBERO_SWAP'];
  m.events.forEach(function(e){if(e.type==='UNDO')dead[e.data.target]=1});
  m.events.forEach(function(e){if(!dead[e.id]&&e.type!=='UNDO')live.push(e)});
  for(var i=live.length-1;i>=0;i--){var e=live[i],d=e.data||{};
    if(lib.indexOf(e.type)>=0&&d.team===k)return d.set===s.setNo&&!d.grp?e:null;
    if(ok.indexOf(e.type)>=0)continue;
    if(d.team&&d.team!==k&&(e.type==='SUB'||lib.indexOf(e.type)>=0||e.type==='GAME_CAPTAIN_SET'))continue;
    return null}
  return null}
function libWait(c,k){""")
# 換下格、自由格：剛換過被鎖住時，點了問「是不是換錯了？」
one("""    else if(inC){act='libback';dis=!can;""","""    else if(inC){act='libback';dis=!can;if(dis&&libSameBall(c,k)&&!plain){act='libwrong';dis=false}""")
one("""    else if(!can){dis=true}
    return '<button'+(lj?""","""    else if(!can){if(libSameBall(c,k)&&!plain)act='libwrong';else dis=true}
    return '<button'+(lj?""")
one("""      return '<button class="lc '+k+' outp" data-act="libback" data-team""","""      return '<button class="lc '+k+' outp" data-act="'+act+'" data-team""")  # 換下格的動作照上面算的（剛換過時是「換錯了？」）
one("""      h=head+'<div class="pm3">'+big('pmlout','換回',lOk&&!!pc.libOut[k])""","""      if(!lOk&&libSameBall(pc,k))lwhy+='<button class="linkbtn libwr" data-act="libwrong" data-team="'+k+'">剛剛換錯人了？</button>';
      h=head+'<div class="pm3">'+big('pmlout','換回',lOk&&!!pc.libOut[k])""")
one("""(lwhy?'<p class="pmwhy">換自由：'+lwhy+'</p>':'')+""","""(lwhy?'<p class="pmwhy">換自由：'+lwhy+'</p>':'')+(!lAv&&back&&libSameBall(pc,k)?'<button class="linkbtn libwr" data-act="libwrong" data-team="'+k+'">剛剛換錯人了？</button>':'')+""")

# ---------- 13. 比賽中補登球員 ----------
one("""  if(t.locked)return '<div class="muted">已開局，名單不能再改</div>';""","""  /* 11/28 比賽開始後也能補登（不設開關，按的時候確認）；只能新增一般球員，原本的號碼不能改 */
  if(t.locked){if(ui.late&&ui.late[k])return '<div class="muted">補登中：點空白的號碼格輸入背號</div>';
    return regularCount(t)<MAX_PLAYERS?'<button class="lateadd" data-act="sheet" data-v="lateask" data-team="'+k+'">＋ 補登球員</button>':'<div class="muted">名單已滿 '+MAX_PLAYERS+' 位</div>'}""")
one("""  var sl=t.locked?null:ui.slot[k], e=ui.entry[k];""","""  var late=t.locked&&ui.late&&ui.late[k],sl=t.locked&&!(late&&kind==='reg')?null:ui.slot[k], e=ui.entry[k];""")
one("""data-i="'+idx+'" aria-label="'+(kind==='lib'?'自由球員':'球員')+'第 '+(idx+1)+' 列'+(p?' '+p.no+' 號':'空')+'"'+(t.locked?' disabled':'')+'>""",
    """data-i="'+idx+'" aria-label="'+(kind==='lib'?'自由球員':'球員')+'第 '+(idx+1)+' 列'+(p?' '+p.no+' 號':'空')+'"'+(t.locked&&!(late&&kind==='reg'&&!p)?' disabled':'')+'>""")
one("""data-kind="pname" data-team="'+k+'" data-no="'+(p?p.no:'')+'"'+(p&&!t.locked?'':' disabled')+'></div>';""","""data-kind="pname" data-team="'+k+'" data-no="'+(p?p.no:'')+'"'+(p&&(!t.locked||late)?'':' disabled')+'></div>';""")
one("""function goPage(p){ui.page=p;""","""function goPage(p){ui.late=null;ui.page=p;""")
one("""      ui.page=b.getAttribute('data-v'); ui.sheet=null; ui.liveSheet=false;""","""      ui.late=null; ui.page=b.getAttribute('data-v'); ui.sheet=null; ui.liveSheet=false;""")

# 兩個新的面板
one("""  }else if(x.type==='more'){""","""  }else if(x.type==='lateask'){
    h='<h2>補登 <span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 球員？</h2><p>比賽已經開始。補上的球員會加進名單，之後可以替補上場。</p><p class="muted">只能新增，原本的號碼不能改。</p>'+
      '<button class="primary" data-act="lateok" data-team="'+k+'">補登</button><button class="ghost" data-act="close">取消</button>';
  }else if(x.type==='libwrong'){
    var lwc=s.sets[s.setNo],lrs=lwc.libRows[k]||[],lr=lrs[lrs.length-1]||{};
    var ltx=lr.enter==='R'?lr.rep+' 號換回，自由球員 '+lr.lib+' 號下場':lr.rep!=null?'自由球員 '+lr.lib+' 號換下 '+lr.rep+' 號':'自由球員換成 '+lr.lib+' 號';
    h='<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 是不是換錯了？</h2><p>剛才：'+esc(ltx)+'</p><p class="muted">按「是，換錯了」會取消剛才那次，記錄表不會留下，分數不變。接著再點正確的人。</p>'+
      '<button class="primary" data-act="libundo" data-team="'+k+'" data-v="'+esc(x.id||'')+'">是，換錯了</button><button data-act="close">不是</button>'+
      '<p class="muted">真的要再換一次：規則規定兩次自由球員替換之間要打完一球（規則 19.3.2.1）。</p>';
  }else if(x.type==='more'){""")
one("""    case 'libback': ui.lib=null; ui.sub=null;""","""    case 'lateok': ui.late=ui.late||{}; ui.late[k]=true; ui.sheet=null; ui.slot={t1:null,t2:null}; ui.entry={t1:'',t2:''}; ui.msg={t1:'',t2:''}; ui.slot[k]=autoSlot(s.teams[k]); break;
    case 'libwrong': var lwe=libMistake(s,m,k); ui.lib=null; ui.sub=null; if(!lwe){ui.sheet=null;ui.toast={t:libWait(c,k),until:Date.now()+3000};break} ui.sheet={type:'libwrong',team:k,id:lwe.id}; break;
    case 'libundo': var lwu=libMistake(s,m,k); ui.sheet=null; ui.lib=null; if(lwu&&lwu.id===b.getAttribute('data-v')){dispatch('UNDO',{target:lwu.id});ui.toast={t:'已取消剛才的自由球員替換，可以重新換',until:Date.now()+3500}} break;
    case 'libback': ui.lib=null; ui.sub=null;""")

# ---------- CSS ----------
one("</style>","""/* ===== 11/28 觀看畫面：二裁、一裁站遠遠看 ===== */
.watch .wtbar{gap:6px;padding-top:max(2px,env(safe-area-inset-top,0px));padding-bottom:2px}
.watch .wtbar .wleave{min-height:40px;padding:0 10px;font-size:14px}
.watch .wtbar .wcode{font-size:12px;line-height:1.15;font-weight:700;color:var(--muted)}
.watch .wcode b{font-size:14px;color:var(--ink)}.watch .wcode small{font-size:11px}
.watch .wside{flex:none;margin-left:auto;gap:0}
.watch .wside button{min-height:40px;padding:0 9px;font-size:13px}
.watch .wtbar .wst{flex:0 1 auto;font-size:12px}
.wdown{flex:none;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:8px 14px;background:#C62828;color:#fff;font-size:15px;font-weight:700}
.wdown b{font-size:24px;font-weight:900}
.watch .wpage{padding-top:6px}
.watch .wview{gap:8px;max-width:760px}
.watch .wview .board{row-gap:6px}
.watch .wview .ss b{font-size:clamp(48px,min(12vh,16vw),140px)}
.watch .wview.sv-a .ss b{font-size:clamp(48px,min(12vh,15.5vw),140px)}
.watch .wview.sv-b .board{grid-template-columns:minmax(0,1fr) 50px 76px 50px minmax(0,1fr)}
.watch .wview.sv-a .board{grid-template-columns:minmax(0,1fr) 52px 100px 52px minmax(0,1fr)}
.watch .wview .setbox{padding:4px 0}
.watch .wview .setbox small{font-size:13px;font-weight:800}
.watch .wview .setbox b{font-size:clamp(30px,4.6vh,46px)}
.watch .wview .mid{font-size:17px}
.wsrva,.wsrvb{--c:var(--t1-j);--o:var(--t1-jt);display:flex;align-items:center;justify-content:center;background:var(--c);color:var(--o);border-radius:8px;box-shadow:0 0 0 2px var(--ink);font-weight:900;font-family:var(--num);line-height:1}
.wsrva.t2,.wsrvb.t2{--c:var(--t2-j);--o:var(--t2-jt)}
.wsrva{margin-top:4px;padding:4px 4px;gap:2px;width:100%}
.wsrva b{font-size:40px}.wsrva i{font-style:normal;font-size:26px}
.wsrvb{grid-row:3;grid-column:1/-1;justify-self:center;gap:8px;padding:4px 14px;min-height:52px}
.wsrvb svg{width:34px;height:34px;flex:none}
.wsrvb b{font-size:42px}.wsrvb span{font-size:18px;font-family:inherit}.wsrvb i{font-style:normal;font-size:30px;line-height:1}
.watch .wview .strips,.watch .wview .wcounts,.watch .wview .board,.watch .wview .tbar,.watch .wview .wban{flex:none}
.watch .wview .pc.srv{outline:8px solid #FFD21F;outline-offset:-8px;box-shadow:inset 0 0 0 12px #12324F}
.watch .wview .pcourt .pc .ball{transform:none;width:30%;height:auto;max-width:64px;right:6px;bottom:6px}
.watch .wview .tbar{padding:8px 16px;font-size:24px;border-radius:8px}
.watch .wview .tbar b{font-size:60px}
.watch .wview .tbar{box-shadow:0 0 0 2px var(--ink)} /* 黑色、深藍球衣在深色底也看得到邊 */
@media (max-height:700px){ /* 小手機：發球條、暫停條、計數縮一點，球場才放得下 */
  .watch .wview{gap:5px}
  .wsrvb{min-height:40px}.wsrvb b{font-size:32px}.wsrvb svg{width:26px;height:26px}.wsrvb span{font-size:15px}.wsrvb i{font-size:24px}
  .watch .wview .tbar{padding:4px 12px;font-size:19px}.watch .wview .tbar b{font-size:42px}
  .watch .wcnt b{font-size:28px}.watch .wcnt small{font-size:14px}
  .watch .wview .setbox small{font-size:12px}.watch .wview .setbox b{font-size:28px}
}
.watch .wview .wban{font-size:26px;padding:8px}
.wban small{display:block;font-size:14px}
.watch .wview .lc,.watch .wview .capbox{width:clamp(46px,min(8vh,12.5vw),84px);height:clamp(46px,min(8vh,12.5vw),84px)}
.watch .wview .lc b,.watch .wview .capbox b{font-size:clamp(28px,4.2vh,40px)}
.watch .wview .capbox span,.watch .wview .lc .lno{font-size:14px}
.watch .wcounts{gap:10px}
.watch .wcnt{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:3px 6px;border-width:3px;border-style:solid;border-radius:10px}
.watch .wcnt>div{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px 0}
.watch .wcnt>.wsb{border-left:2px solid var(--line)}
.watch .wcnt small{font-size:16px;font-weight:800;color:inherit;flex-basis:auto}
.watch .wcnt b{font-size:clamp(30px,4.4vh,42px);line-height:1;font-family:var(--num)}
.watch .wcnt>p{grid-column:1/-1;margin:0;text-align:center;font-size:15px}
.wres,.wwait{margin:auto;width:100%;max-width:560px;display:flex;flex-direction:column;align-items:stretch;gap:14px;text-align:center}
.wres-h{margin:0;font-size:30px;font-weight:900}
.wres-h small{display:block;margin-top:6px;font-size:18px;font-weight:800;color:#C62828}
.wres-w{--c:var(--t1-j);--o:var(--t1-jt);background:var(--c);color:var(--o);border-radius:12px;padding:14px 10px;box-shadow:0 0 0 2px var(--ink)}
.wres-w.t2{--c:var(--t2-j);--o:var(--t2-jt)}
.wres-w b{display:block;font-size:36px;font-weight:900}
.wres-w span{display:block;font-size:30px;font-weight:900;font-family:var(--num)}
.wsett{width:100%;border-collapse:collapse;font-size:22px}
.wsett th,.wsett td{padding:6px 4px;border-bottom:1px solid var(--line)}
.wsett td{font-family:var(--num);font-size:30px;font-weight:800}
.wsett thead th{font-size:16px}
.wwt{display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px;font-weight:800}
.wwt b{font-family:var(--num);font-size:40px}
.wbrk{display:flex;flex-direction:column;align-items:center;padding:10px;border:3px solid var(--line);border-radius:12px}
.wbrk small{font-size:22px;font-weight:800}
.wbrk b{font-family:var(--num);font-size:clamp(72px,16vh,140px);line-height:1}
.wnext{margin:0;font-size:20px;font-weight:700;color:var(--muted)}
/* 記錄台：補登、換錯了 */
.lateadd{min-height:44px;width:100%}
.libwr{display:block;margin-top:6px}
</style>""")
open(SRC,'w',encoding='utf8').write(s)
print('ok',len(s)//1024,'KB')

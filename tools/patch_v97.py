#!/usr/bin/env python3
"""11/14 連線顯示（第一版：觀看）。記錄台「其他」→「連線顯示」開代碼和 QR code，事件傳到 Firebase；
主畫面「觀看比賽」輸入代碼，看同一場的球場畫面（只能看）。完整事件一起傳，之後可以加「接手記錄」。
程式在 tools/v97-qr.js、v97-sync.js，這裡把它們和畫面、按鈕、樣式接進原始檔。"""
import sys,os
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function syncAct(' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
qr=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'v97-qr.js'),encoding='utf8').read().replace("if(typeof module!=='undefined')module.exports=qrSvg;\n",'')
sy=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'v97-sync.js'),encoding='utf8').read()
one('\nfunction render(){\n','\n'+qr+sy+'\nfunction render(){\n')

# 畫面：觀看模式整頁；主畫面多「觀看比賽」視窗
one("  upd.live=false;\n","  upd.live=false;\n  if(view==='watch'){var wsv=wt&&wt.state==='ok'?wt.s:null;if(wsv)applyColors(wsv);app.innerHTML=watchHtml();fitNums();syncAwake(!!wsv&&!matchOver(wsv));return}\n")
one("+(view==='home'?aboutHtml():'')+helpHtml()","+(view==='home'?aboutHtml()+watchAskHtml():'')+helpHtml()")
EYE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-5 0-9 4.6-10 7 1 2.4 5 7 10 7s9-4.6 10-7c-1-2.4-5-7-10-7zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2.3a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z" fill="currentColor"/></svg>'
one('使用教學</button></div></section><div class="homebody">','使用教學</button><button class="herowatch" data-act="watchopen">'+EYE+'觀看比賽<small>看記錄台連線的比分和站位</small></button></div></section><div class="homebody">')

# 其他：連線一區
one("      '<section class=\"msec\"><h3 class=\"mhead\">設定</h3><div class=\"mrow\"><strong>提示字</strong>",
    "      '<section class=\"msec\"><h3 class=\"mhead\">連線</h3><div class=\"mgrid one\"><button class=\"mbtn\" data-act=\"syncopen\"><strong>連線顯示</strong><small>'+(syncOf(m)?'代碼 '+esc(syncOf(m).code)+'・'+esc(syncState(m)[1]):'給二裁或其他裝置看比分和站位')+'</small></button></div></section>'+\n      '<section class=\"msec\"><h3 class=\"mhead\">設定</h3><div class=\"mrow\"><strong>提示字</strong>")
one("  }else if(x.type==='more'){\n","  }else if(x.type==='sync'){h=syncSheetHtml(s,m,x);if(x.stop)stepBack='';\n  }else if(x.type==='more'){\n")

# 比賽上方：連線出問題時才出現小標（正常時不佔位置）
one("'<h1>'+esc(title)+'</h1>')+barTime(s)+undo+","'<h1>'+esc(title)+'</h1>')+(syncOf(current())&&syncState(current())[0]==='bad'?syncTag(current()):'')+barTime(s)+undo+")

# 按鈕
one("  if(act==='reload'){location.reload();return}\n","  if(act==='reload'){location.reload();return}\n  if(syncAct(act,b)){render();return}\n")
one("    case 'close': if(document.activeElement)document.activeElement.blur(); ui.sheet=null;","    case 'close': if(document.activeElement)document.activeElement.blur(); ui.watchAsk=null; ui.sheet=null;")
# 每個動作存好後就傳（有開連線的比賽才傳）
one("  m.events.push({id:uid(),matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:DEVICE,type:type,data:data});\n  save();\n",
    "  m.events.push({id:uid(),matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:DEVICE,type:type,data:data});\n  save();\n  if(syncMap&&syncMap[m.id])syncKick(m);\n")
# Esc、Android 返回鍵：觀看中先問要不要停止，不會一按就離開
one("function escClose(){\n","function escClose(){\n  if(view==='watch'&&wt){wt.ask=!wt.ask;render();return true}\n")
one("function backNeed(){return view!=='home'||!!(ui.help||ui.sheet||ui.cupSheet||ui.delMatch)}","function backNeed(){return view!=='home'||!!(ui.help||ui.sheet||ui.cupSheet||ui.delMatch||ui.watchAsk)}")
one("  if(e.key==='Enter'&&tg.id==='ref-type')","  if(e.key==='Enter'&&tg.id==='watch-code'){e.preventDefault();var wgb=app.querySelector('[data-act=watchgo]');if(wgb)wgb.click();return}\n  if(e.key==='Enter'&&tg.id==='ref-type')")
# 開啟時：網址帶 ?watch=代碼（掃 QR code）或這個分頁原本在看，就直接進觀看；有開連線的比賽就接著傳
one("updStart();\nrender();\n})();","""(function(){
  var q=location.search.match(/[?&]watch=([^&#]*)/),code='';
  if(q){code=codeNorm(decodeURIComponent(q[1]));try{history.replaceState(history.state,'',location.pathname+location.search.replace(/([?&])watch=[^&#]*&?/,'$1').replace(/[?&]$/,'')+location.hash)}catch(e){}}
  else try{code=sessionStorage.getItem(KEY+'-watch')||''}catch(e){}
  if(code&&codeOk(code)){watchStart(code);return}
  if((Object.keys(syncMap).length>1||syncMap._del.length)&&navigator.onLine!==false)fbLoad();
})();
updStart();
render();
})();""")

CSS='''
/* 11/14 連線顯示 */
.herobtns .herowatch{grid-column:1/-1;flex-wrap:wrap;column-gap:8px;row-gap:0}
.herobtns .herowatch small{flex-basis:100%;text-align:center;font-size:12px;font-weight:500;opacity:.85;margin-top:-2px}
.synccode{display:flex;flex-direction:column;align-items:center;gap:2px}
.synccode small{font-size:12px;color:var(--muted)}
.synccode b{font-size:40px;line-height:1.1;letter-spacing:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;display:flex;gap:2px}
.synccode b i{width:6px}
.syncqr{display:flex;justify-content:center}
.syncqr .qr{width:min(220px,52vw,38vh);height:auto;border-radius:8px;border:1px solid var(--line)}
.syncst{margin:0;padding:8px 10px;border-radius:var(--r);font-weight:700;font-size:14px;text-align:center;border:1px solid var(--line);background:var(--panel)}
.syncst.ok{color:var(--ok-ink,var(--ok));border-color:currentColor}
.syncst.bad{color:var(--del-ink,#B3261E);border-color:currentColor}
.synctag{min-height:30px;padding:2px 8px;font-size:12px;font-weight:800;border-radius:999px;flex:none;color:var(--del-ink,#B3261E);border:1.5px solid currentColor;background:var(--panel)}
.wcodein{font-size:28px;text-align:center;letter-spacing:.2em;text-transform:uppercase;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;min-height:56px}
.watch{position:fixed;inset:0;display:flex;flex-direction:column;background:var(--bg)}
.wtbar{flex:none;display:flex;align-items:center;gap:8px;padding:max(6px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) 6px max(10px,env(safe-area-inset-left,0px));border-bottom:1px solid var(--line);background:var(--panel)}
.wtbar .wleave{min-height:44px;padding:0 12px;flex:none}
.wtbar .wcode{font-weight:800;font-size:14px;flex:none}
.wtbar .wst{flex:1;min-width:0;text-align:right;font-size:13px;font-weight:700;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wtbar .wst.ok{color:var(--ok-ink,var(--ok))}
.wtbar .wst.bad{color:var(--del-ink,#B3261E);white-space:normal}
.wshell{flex:1;min-height:0;display:flex;flex-direction:column}
.wpage{justify-content:center;padding-bottom:max(8px,env(safe-area-inset-bottom,0px))}
.wview{display:flex;flex-direction:column;gap:10px;width:100%;max-width:640px;align-self:center}
.wview .board{max-width:none}
.wview .ss b{font-size:clamp(42px,9vh,96px)}
.wview .setbox b{font-size:clamp(26px,4vh,40px)}
.wview .pcourt{flex:none;max-width:none;max-height:none;min-height:0;grid-template-rows:repeat(3,clamp(52px,min(12vh,24vw),150px));gap:4px}
.wview .strips{max-width:none}
.wview .lc,.wview .capbox{width:clamp(44px,min(7vh,12vw),72px);height:clamp(44px,min(7vh,12vw),72px)}
.wview .lc b,.wview .capbox b{font-size:clamp(18px,3vh,28px)}
.wcounts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.wcnt{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;padding:6px 8px;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);font-size:15px;font-weight:700}
.wcnt.t1{border-color:var(--t1)}.wcnt.t2{border-color:var(--t2)}
.wcnt b{font-size:22px;line-height:1}
.wcnt small{flex-basis:100%;text-align:center;font-size:12px;color:var(--muted)}
.wban{margin:0;text-align:center;font-size:20px;font-weight:800;padding:6px;border-radius:var(--r);background:var(--panel);border:2px solid var(--line)}
.wmsg{margin:auto;max-width:420px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:stretch}
.wmsg h2{margin:0}
.wsets{font-size:24px;font-weight:800;margin:0}
'''
one('\n</style>\n\n<div class="statusband"',CSS+'</style>\n\n<div class="statusband"')
open(SRC,'w',encoding='utf8').write(s)
print('patched',len(s)//1024,'KB')

#!/usr/bin/env python3
"""11/20 早上使用者實測（語音），第三部分。先跑 patch_v97～v119。
- 印登錄單視窗：說明字拿掉（A4 橫式一場一張、排名賽、分享選單那幾行），加印空白的縮成一行，
  「取消」和主要按鈕左右並排，場次清單盡量大
- 先預覽：按「預覽」先畫出每一張，左右滑看，確認再按「存成 PDF」（分享選單直接在按鈕裡跳出）
- 使用教學：從目錄點進去的，最後一張按「回目錄」回目錄；從各頁問號打開的，看完才關掉"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function regPrevHtml' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

one("""    return '<h2>印賽前登錄單</h2><p class="muted">A4 橫式，一場一張。名單留白給球隊寫背號、姓名和簽名；有賽程的先印隊名、日期、時間、場地、場次。</p>'+
      (all.length?'<div class="row"><button data-act="scpall">'+(ns===all.length?'全不選':'全選')+'</button></div><div class="rlist pplist">'""",
"""    if(x.prev)return regPrevHtml(x);
    return '<div class="scphead"><h2>印登錄單</h2>'+(all.length?'<button data-act="scpall">'+(ns===all.length?'全不選':'全選')+'</button>':'')+'</div>'+
      (all.length?'<div class="rlist pplist">'""")
one("""'</div>':'<p class="note">賽程裡還沒有比賽。按「新增比賽」排好賽程，就能先印隊名；也可以直接印空白的。</p>')+
      '<div class="regblank"><span>另外加印空白的<small class="muted">排名賽、賽程以外的比賽用</small></span>""",
"""'</div>':'<p class="note">賽程裡還沒有比賽，可以先印空白的。</p>')+
      '<div class="regblank"><span>加印空白的</span>""")
one("""      '<button class="primary" data-act="scpgo"'+(tot?'':' disabled')+'>存成 PDF（'+tot+' 張，A4）</button><p class="muted">'+(platform()==='pc'?'檔案會存到「下載」資料夾。':'按下去會跳出分享選單，可以存到「檔案」或傳到 LINE。')+'</p><div id="xpmsg" class="muted" role="status"></div><button class="ghost" data-act="close">取消</button>'}""",
"""      '<div id="xpmsg" class="muted" role="status"></div><div class="row scpbtns"><button class="ghost" data-act="close">取消</button><button class="primary" data-act="scpgo"'+(tot?'':' disabled')+'>預覽（'+tot+' 張）</button></div>'}""")
one("function regMake(){","""function regPrevHtml(x){var ps=x.prev.pages;
  return '<button class="sheetback" data-act="scpback">‹ 返回</button><h2>預覽（'+ps.length+' 張）</h2><div class="regprev" id="regprev">'+ps.map(function(p,i){return '<img src="'+p.url+'" alt="第 '+(i+1)+' 張登錄單" width="'+p.w+'" height="'+p.h+'">'}).join('')+'</div>'+
    (ps.length>1?'<p class="muted regpn" id="regpn">第 1／'+ps.length+' 張，左右滑看下一張</p>':'')+'<div id="xpmsg" class="muted" role="status"></div><div class="row scpbtns"><button class="ghost" data-act="close">取消</button><button class="primary" data-act="scpsave">存成 PDF</button></div>'}
function regPrevFree(x){if(x&&x.prev){x.prev.pages.forEach(function(p){try{URL.revokeObjectURL(p.url)}catch(e){}});x.prev=null}}
function regSave(){var x=ui.cupSheet,c=theCup();if(!x||!x.prev||!c)return;var nm=String(c.name||'').replace(/[\\\\\\/:*?"<>|]/g,'').trim(),ps=x.prev.pages;
  xpSaveBlob('登錄單_'+(nm?nm+'_':'')+today()+'_'+ps.length+'張.pdf',xpPdfN(ps.map(function(p){return {bytes:p.bytes,w:p.w,h:p.h}}),false))}
document.addEventListener('scroll',function(e){var t=e.target;if(!t||t.id!=='regprev')return;var n=document.getElementById('regpn'),k=t.children.length;if(!n||!k)return;var i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth))+1;n.textContent='第 '+Math.min(k,i)+'／'+k+' 張，左右滑看下一張'},true);
function regMake(){""")
one("""    if(i>=list.length){ui.xpBusy=false;xpSaveBlob('登錄單_'+(nm?nm+'_':'')+today()+'_'+list.length+'張.pdf',xpPdfN(pages,false));return}""",
"""    if(i>=list.length){ui.xpBusy=false;if(ui.cupSheet!==x)return;regPrevFree(x);x.prev={pages:pages.map(function(p){return {bytes:p.bytes,w:p.w,h:p.h,url:URL.createObjectURL(new Blob([p.bytes],{type:'image/jpeg'}))}})};render();return}""")
one("""    case 'scpgo': regMake(); return; // 跟賽前紙本一樣，不重畫，畫面上的進度字才不會被洗掉""",
"""    case 'scpgo': regMake(); return; // 跟賽前紙本一樣，不重畫，畫面上的進度字才不會被洗掉
    case 'scpsave': regSave(); return; // 分享選單要在按的當下跳出（iPhone）
    case 'scpback': regPrevFree(ui.cupSheet); break;""")
one(".regblank>span:first-child{display:flex;flex-direction:column;gap:2px;font-weight:600}",
""".regblank>span:first-child{display:flex;flex-direction:column;gap:2px;font-weight:600}
.regblank{padding:4px 4px 4px 12px}
.scphead{display:flex;align-items:center;justify-content:space-between;gap:8px}
.scphead>button{flex:none;min-height:44px}
.scpbtns>button{flex:1 1 0}
.regprev{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain}
.regprev>img{flex:0 0 100%;width:100%;height:auto;scroll-snap-align:center;border:1px solid var(--line2);background:#fff;border-radius:6px}
.regpn{text-align:center}""")
one(".pplist{max-height:min(46vh,420px);overflow:auto}",".pplist{max-height:min(46vh,420px);overflow:auto}\n.sheet.scprt .pplist{max-height:min(62vh,640px)}")
one("""<div class="sheet'+(x.type==='scedit'?' scsheet'+(x.pk?' scpkon':''):'')+'" role="dialog" aria-modal="true">""",
    """<div class="sheet'+(x.type==='scedit'?' scsheet'+(x.pk?' scpkon':''):x.type==='scprint'?' scprt':'')+'" role="dialog" aria-modal="true">""")

# 使用教學：從目錄進去的看完回目錄
one("case 'helpgroup': ui.help={group:b.getAttribute('data-v'),i:0}; break;","case 'helpgroup': ui.help={group:b.getAttribute('data-v'),i:0,menu:true}; break;")
one("""<button class="go" id="hnext" data-act="'+(last?'helpclose':'helpgo')+'" data-v="1">'+(last?'看完了':'下一張')+'</button>""",
    """<button class="go" id="hnext" data-act="'+(last?(ui.help.menu?'helpmenu':'helpclose'):'helpgo')+'" data-v="1">'+(last?(ui.help.menu?'回目錄':'看完了'):'下一張')+'</button>""")
one("""  if(x){x.setAttribute('data-act',end?'helpclose':'helpgo');x.textContent=end?'看完了':'下一張'}""",
    """  if(x){x.setAttribute('data-act',end?(ui.help.menu?'helpmenu':'helpclose'):'helpgo');x.textContent=end?(ui.help.menu?'回目錄':'看完了'):'下一張'}""")
# Esc、Android 返回鍵：預覽退回選場次、時間格子先收起來
one("'.sheet [data-act=sheetback]','.sheet [data-act=scback]'","'.sheet [data-act=scpback]','.sheet [data-act=scpkdone]','.sheet [data-act=sheetback]','.sheet [data-act=scback]'")
open(SRC,'w',encoding='utf8').write(s)
print('patched v120')

#!/usr/bin/env python3
"""11/23 早上語音實測後的四項修改（使用者說「照語音的四項修改，放測試版」）。先跑 patch_v97～v128（或 src-from-beta.py）。
1. 新增比賽的時間：點中間的數字直接打，改用自己的數字鍵（跟名單頁一樣兩排：1～5、⌫ / 6～9、0、確定），
   不跳手機鍵盤（iPad 跳出完整鍵盤蓋住半個畫面、「確定」被擠成直的兩個字）。電腦照樣可以用鍵盤打數字、Backspace、Enter
2. 「賽事與紀錄」的備份和匯入：按鈕改成「備份」「匯入」，說明字各一句
3. 賽程列打完的各局比分一局一行不拆開（iPad 上「25」和「:20」分兩行）；平板、電腦的隊名大一點
4. 手機直放各局：拖框的時候，下面放大的那塊用整局的圖移動，不會露出空白（以前要放開才畫出來）"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'data-act="sctk"' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)

# ---- 1. 時間：自己的數字鍵 ----
one("""(x.tin?'<div class="row sctin"><input id="sc-tin" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="四個數字，例如 1517" aria-label="時間（四個數字）"><button class="primary" data-act="sctok">確定</button></div>'+(x.tinErr?'<p class="cuperr" role="alert">'+esc(x.tinErr)+'</p>':''):'')+
      '<p class="muted scwhint">上下滑，或點中間的數字直接打</p>""",
"""(x.tin?scTkHtml(x):'')+
      (x.tin?'':'<p class="muted scwhint">上下滑，或點中間的數字直接打</p>')+'""")
one("""/* 時間滾輪：沒填時間就從 08:00 開始""","""/* 11/23 直接打時間：自己的數字鍵（不跳手機鍵盤），打四個數字按確定 */
function scTkFmt(b){var d=(b+'____').slice(0,4).replace(/_/g,'–');return d.slice(0,2)+':'+d.slice(2)}
function scTkHtml(x){var b=x.tbuf||'',k='',i;
  for(i=1;i<=5;i++)k+='<button data-act="sctk" data-v="'+i+'"'+(b.length>=4?' disabled':'')+'>'+i+'</button>';
  k+='<button data-act="sctkdel" aria-label="刪除"'+(b?'':' disabled')+'>⌫</button>';
  [6,7,8,9,0].forEach(function(n){k+='<button data-act="sctk" data-v="'+n+'"'+(b.length>=4?' disabled':'')+'>'+n+'</button>'});
  k+='<button class="primary" data-act="sctok"'+(b.length===4?'':' aria-disabled="true"')+'>確定</button>';
  return '<div class="sctin"><div class="sctdisp" role="status" aria-label="打的時間 '+(b||'還沒打')+'"><b>'+scTkFmt(b)+'</b><span class="muted">打四個數字，例如 1517</span></div><div class="sctkp">'+k+'</div>'+(x.tinErr?'<p class="cuperr" role="alert">'+esc(x.tinErr)+'</p>':'')+'</div>'}
/* 時間滾輪：沒填時間就從 08:00 開始""")
one("""if(pv===scWv(x)[pk2]&&x.f.time){x.tin=true;x.tinErr=''}""","""if(pv===scWv(x)[pk2]&&x.f.time){x.tin=true;x.tbuf='';x.tinErr=''}""")
one("""    case 'sctok': if(x){var tv=((document.getElementById('sc-tin')||{}).value||'').replace(/\\D/g,''),tq=tv.match(/^(\\d{1,2})(\\d{2})$/);""",
"""    case 'sctk': if(x&&x.tin){x.tbuf=((x.tbuf||'')+b.getAttribute('data-v')).slice(0,4);x.tinErr=''} return true;
    case 'sctkdel': if(x&&x.tin){x.tbuf=(x.tbuf||'').slice(0,-1);x.tinErr=''} return true;
    case 'sctok': if(x){var tv=String(x.tbuf||''),tq=tv.match(/^(\\d{2})(\\d{2})$/);""")
one("""x.f.time=scPad(+tq[1])+':'+tq[2];x.pk=null;x.tin=false;x.tinErr='';x.warn=null} return true;""","""x.f.time=scPad(+tq[1])+':'+tq[2];x.pk=null;x.tin=false;x.tbuf='';x.tinErr='';x.warn=null} return true;""")
one("""case 'sctin': case 'sctnone': case 'sctok':""","""case 'sctin': case 'sctnone': case 'sctk': case 'sctkdel': case 'sctok':""")
one("""app.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing&&e.target&&e.target.id==='sc-tin'){e.preventDefault();var bt=app.querySelector('[data-act="sctok"]');if(bt)bt.click()}});""",
"""document.addEventListener('keydown',function(e){var x=ui.cupSheet;if(!x||!x.tin||x.pk!=='time'||e.isComposing||e.metaKey||e.ctrlKey||e.altKey)return;var q=null; // 電腦：鍵盤也能打
  if(/^[0-9]$/.test(e.key))q='[data-act="sctk"][data-v="'+e.key+'"]';else if(e.key==='Backspace')q='[data-act="sctkdel"]';else if(e.key==='Enter')q='[data-act="sctok"]';
  if(q){var bt=app.querySelector(q);if(bt&&!bt.disabled){e.preventDefault();bt.click()}}});""")
one(""".sctin>input{flex:1 1 auto;min-width:0}""",""".sctin{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.sctdisp{display:flex;align-items:baseline;justify-content:center;gap:12px;flex-wrap:wrap}
.sctdisp b{font-family:var(--num);font-size:28px;font-weight:800;letter-spacing:.04em;font-variant-numeric:tabular-nums}
.sctdisp .muted{font-size:13px}
.sctkp{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.sctkp>button{min-height:48px;padding:0;font-family:var(--num);font-size:20px;font-weight:700;white-space:nowrap}
.sctkp>button.primary{font-family:inherit;font-size:16px}
.sctkp>button[aria-disabled="true"]{opacity:.5}""")

# ---- 2. 備份和匯入的字 ----
one("""<p class="note">打完的比賽會放在這裡。換手機時，可以用下面的匯入功能把備份放回來。</p>""","""<p class="note">打完的比賽會放在這裡。</p>""")
one(""">選擇要備份的比賽</button><label class="ghost-file">匯入備份或資料夾<input id="import-file\"""",""">備份</button><label class="ghost-file">匯入<input id="import-file\"""")
one("""<p class="muted">換手機或清除瀏覽器資料前，請先備份。</p></section>'+trashHtml()""","""<p class="muted">換手機前先備份。</p></section>'+trashHtml()""")
one("""到新裝置按「匯入備份或資料夾」，選備份檔。""","""到新裝置在「賽事與紀錄」按「匯入」，選備份檔。""")

# ---- 3. 賽程列比分不拆開、平板隊名大一點 ----
one(""".scsets{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:56px;""",""".scsets{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:64px;flex:none;""")
one(""".scsets .sw{color:var(--ok);font-weight:800}""",""".scsets .sw{color:var(--ok);font-weight:800} .scsets>span{white-space:nowrap} .scsets b{display:inline}
@media (min-width:760px){.scrow .hnames{font-size:19px}.scrow .hnames b{font-size:26px}.scsets{font-size:16px;min-width:72px}}""")

# ---- 4. 拖框時放大的那塊不空白 ----
one("""function ctViewHot(s,n,o){
  var m0=1.2,""","""var lpS=null; // 11/23 拖框時要用整局的圖，記住這一場
function ctViewHot(s,n,o){lpS=s;
  var m0=1.2,""")
one("""function lpShow(I,x){if(I.fr)I.fr.style.left=((x-I.box[0]+1.2)/I.cw*100).toFixed(2)+'%';var sv=I.mag&&I.mag.querySelector('svg');if(sv)sv.style.transform='translateX('+((I.x0-x)/(I.fw+2.4)*I.mag.clientWidth).toFixed(1)+'px)'}""",
"""function lpShow(I,x){if(I.fr)I.fr.style.left=((x-I.box[0]+1.2)/I.cw*100).toFixed(2)+'%';var sv=I.mag&&I.mag.querySelector('svg');if(!sv)return;
  if(I.full)sv.style.transform='translateX('+(-(x-I.box[0])*I.k).toFixed(1)+'px)';else sv.style.transform='translateX('+((I.x0-x)/(I.fw+2.4)*I.mag.clientWidth).toFixed(1)+'px)'}
/* 開始拖時，把下面那塊換成整局的圖（同樣大小），移動時才不會露出還沒畫的空白；放開照舊重畫 */
function lpFull(I){if(!I.mag||!lpS)return;var b=I.box,k=I.mag.clientWidth/(I.fw+2.4),h=b[3]-b[1]+2.4;
  var v=ctSvg(lpS,[b[0]-1.2,b[1]-1.2,b[2]-b[0]+2.4,h],false,'').replace(/ width="[\\d.]+" height="[\\d.]+">/,' aria-hidden="true" style="width:'+(I.cw*k).toFixed(1)+'px;height:'+(h*k).toFixed(1)+'px;max-width:none;display:block">');
  I.mag.innerHTML=v;I.k=k;I.full=true}""")
one("""if(!lpd.moved){if(Math.abs(dx)<8)return;lpd.moved=true;try{lpd.el.setPointerCapture(e.pointerId)}catch(err){}lpd.el.classList.add('lpdrag')}""",
"""if(!lpd.moved){if(Math.abs(dx)<8)return;lpd.moved=true;try{lpd.el.setPointerCapture(e.pointerId)}catch(err){}lpd.el.classList.add('lpdrag');lpFull(I)}""")
# 打數字時收起滾輪（手機橫放、小手機才放得下數字鍵）
one("""h+='<div class="scwheel" role="group" aria-label="時間 '+wv.h+':'+wv.m+'">'+scWcol('h',wv.h,24)+'<b class="scwsep" aria-hidden="true">:</b>'+scWcol('m',wv.m,60)+'</div>'+(x.tin?scTkHtml(x):'')+""",
"""h+=(x.tin?scTkHtml(x):'<div class="scwheel" role="group" aria-label="時間 '+wv.h+':'+wv.m+'">'+scWcol('h',wv.h,24)+'<b class="scwsep" aria-hidden="true">:</b>'+scWcol('m',wv.m,60)+'</div>')+""")
open(SRC,'w',encoding='utf8').write(s)
print('v129 ok')

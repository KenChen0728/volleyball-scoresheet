#!/usr/bin/env python3
"""11/21 凌晨語音測試的其他改進。先跑 patch_v97～v127。
- 新增比賽的時間：改成像 iPhone 鬧鐘的滾輪（24 小時制，時、分兩欄，每 1 分鐘一格）。手指上下滑；電腦有上下箭頭、鍵盤上下鍵；
  點中間的數字可以直接打四個數字；保留「時間未定」
- 日曆：今天畫圓圈外框，選到的日期實心綠色圓
- 登錄單上方兩隊：「藍隊 VS 白隊」，拿掉「隊伍」小字和「對」
- 登錄單預覽：點圖片全螢幕看，可以兩指放大、＋－按鈕；下面「‹ 第 2／8 張 ›」，按箭頭或左右滑換張
- 看整張記錄表也可以兩指放大
- 存檔視窗：沒有的部分寫「尚未建立」
- 記錄表各局（手機直放）：上面的框可以拖著移動，下面放大的那塊也可以左右拖；點一下還是一樣
- 說明字精簡：幾個很長的灰字改成一句，細節看右上角 ?"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function scWheelSync' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

# ---------- 時間滾輪 ----------
one("""  }else{var hm=String(f.time||'').match(/^(\\d{2}):(\\d{2})$/),hh=hm?hm[1]:x.hh||'',mm=hm?hm[2]:'',i2;
    h+='<div class="sctl">時</div><div class="schh">';for(i2=0;i2<24;i2++)h+='<button data-act="schh" data-v="'+scPad(i2)+'" aria-pressed="'+(hh===scPad(i2))+'">'+i2+'</button>';
    h+='</div><div class="sctl">分</div><div class="schh">';for(i2=0;i2<60;i2+=5)h+='<button data-act="scmm" data-v="'+scPad(i2)+'" aria-pressed="'+(!!hm&&mm===scPad(i2))+'">'+scPad(i2)+'</button>';
    h+='</div>'+(x.tin?""",
"""  }else{var wv=scWv(x);
    h+='<div class="scwheel" role="group" aria-label="時間 '+wv.h+':'+wv.m+'">'+scWcol('h',wv.h,24)+'<b class="scwsep" aria-hidden="true">:</b>'+scWcol('m',wv.m,60)+'</div>'+(x.tin?""")
one("""      '<div class="row"><button data-act="sctin" aria-pressed="'+!!x.tin+'">自己輸入</button><button data-act="sctnone">時間未定</button></div>';
  }
  return h+'<button class="primary" data-act="scpkdone">完成</button></div>';""",
"""      '<p class="muted scwhint">上下滑，或點中間的數字直接打</p><div class="row scpbtns"><button data-act="sctnone">時間未定</button><button class="primary" data-act="scpkdone">完成</button></div></div>';
    return h;
  }
  return h+'<button class="primary" data-act="scpkdone">完成</button></div>';""")
one("""function scWarnTitle(w){""","""/* 時間滾輪：沒填時間就從 08:00 開始（滑了、按完成才算填） */
function scWv(x){var m=String(x.f.time||'').match(/^(\\d{2}):(\\d{2})$/);return m?{h:m[1],m:m[2]}:{h:x.hh||'08',m:'00'}}
function scWcol(k,v,n){var it='',i;for(i=0;i<n;i++){var p=scPad(i);it+='<button class="scwi" id="scw-'+k+p+'" role="option" tabindex="-1" aria-selected="'+(p===v)+'" data-act="scwpick" data-k="'+k+'" data-v="'+p+'">'+p+'</button>'}
  var nm=k==='h'?'時':'分';
  return '<div class="scwcol"><button class="scwar" data-act="scwstep" data-k="'+k+'" data-d="-1" aria-label="'+nm+'減一">▲</button><div class="scwlist" data-wk="'+k+'" tabindex="0" role="listbox" aria-label="'+nm+'" aria-activedescendant="scw-'+k+v+'"><i class="scwpad"></i>'+it+'<i class="scwpad"></i></div><button class="scwar" data-act="scwstep" data-k="'+k+'" data-d="1" aria-label="'+nm+'加一">▼</button></div>'}
function scWset(x,k,v){var w=scWv(x);w[k]=v;x.f.time=w.h+':'+w.m;x.warn=null}
/* 重畫後把滾輪捲到目前的值；按箭頭時用滑的 */
function scWheelSync(){var x=ui.cupSheet;if(!x||x.pk!=='time'||!x.f)return;var w=scWv(x);
  document.querySelectorAll('.scwlist').forEach(function(el){var k=el.getAttribute('data-wk'),it=el.querySelector('.scwi');if(!it)return;var ih=it.offsetHeight,top=Number(w[k])*ih;
    if(Math.abs(el.scrollTop-top)>1){if(x.wsmooth&&el.scrollTo&&!matchMedia('(prefers-reduced-motion: reduce)').matches){el.scrollTop=top-(x.wsmooth===k?Number(x.wdir||0)*ih:0);el.scrollTo({top:top,behavior:'smooth'})}else el.scrollTop=top}});
  x.wsmooth=null}
var scWT=null;
document.addEventListener('scroll',function(e){var el=e.target;if(!el||!el.getAttribute||el.getAttribute('data-wk')==null)return;clearTimeout(scWT);
  scWT=setTimeout(function(){var x=ui.cupSheet;if(!x||x.pk!=='time'||!document.body.contains(el))return;var it=el.querySelector('.scwi');if(!it)return;var k=el.getAttribute('data-wk'),n=k==='h'?24:60,
    i=Math.max(0,Math.min(n-1,Math.round(el.scrollTop/it.offsetHeight))),v=scPad(i);if(v!==scWv(x)[k]||!x.f.time){scWset(x,k,v);render()}},140)},true);
document.addEventListener('keydown',function(e){var el=e.target;if(!el||!el.getAttribute||el.getAttribute('data-wk')==null)return;if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;e.preventDefault();e.stopPropagation();
  var b=el.parentNode.querySelector('[data-act=scwstep][data-d="'+(e.key==='ArrowUp'?-1:1)+'"]');if(b)b.click()},true);
function scWarnTitle(w){""")
one("""    case 'scpkdone': if(x)x.pk=null; return true;""","""    case 'scpkdone': if(x){if(x.pk==='time'&&x.f&&!x.f.time){var w0=scWv(x);x.f.time=w0.h+':'+w0.m;x.warn=null}x.pk=null} return true;
    case 'scwstep': if(x&&x.f){var wk=b.getAttribute('data-k'),wn=wk==='h'?24:60,wd=Number(b.getAttribute('data-d'));scWset(x,wk,scPad((Number(scWv(x)[wk])+wd+wn)%wn));x.wsmooth=wk;x.wdir=wd} return true;
    case 'scwpick': if(x&&x.f){var pk2=b.getAttribute('data-k'),pv=b.getAttribute('data-v');if(pv===scWv(x)[pk2]&&x.f.time){x.tin=true;x.tinErr=''}else{scWset(x,pk2,pv);x.wsmooth=pk2;x.wdir=0}} return true;""")
one("case 'scdate': case 'sctime': case 'scpkdone':","case 'scdate': case 'sctime': case 'scpkdone': case 'scwstep': case 'scwpick':")
one("  wlSync();wsmPaint();\n}","  wlSync();wsmPaint();scWheelSync();\n}")
# 自己輸入那一排：打開時直接聚焦
one("""    case 'sctin': if(x){x.tin=!x.tin;x.tinErr=''} return true;""","""    case 'sctin': if(x){x.tin=!x.tin;x.tinErr=''} return true; // 舊的「自己輸入」按鈕（滾輪版改成點中間的數字）""")

# ---------- 日曆 ----------
one(""".sccal>button{min-height:44px;padding:0;font-variant-numeric:tabular-nums}
.sccal>button.td{font-weight:800;text-decoration:underline;text-underline-offset:3px}""",
""".sccal>button{width:44px;height:44px;min-height:44px;margin:0 auto;padding:0;border-radius:50%;border:2px solid transparent;background:transparent;font-variant-numeric:tabular-nums;font-size:16px}
.sccal>button.td{border-color:var(--ink);font-weight:800}
.sccal>button[aria-pressed=true]{background:var(--ok);border-color:var(--ok);color:var(--bg);font-weight:800}""")

# ---------- 登錄單：藍隊 VS 白隊 ----------
one("""    o+=regRect(q[0],ty[0],q[1],ty[1])+ctT(q[0]+8,ty[0]+11,'隊伍',11,'start',K,500);""","""    o+=regRect(q[0],ty[0],q[1],ty[1]);""")
one("""  o+=ctT(595,(ty[0]+ty[1])/2,'對',16,'middle',K,600);""","""  o+=ctT(595,(ty[0]+ty[1])/2,'VS',16,'middle',K,700);""")

# ---------- 登錄單預覽：全螢幕、換張 ----------
one("""<div class="regprev" id="regprev">'+ps.map(function(p,i){return '<img src="'+p.url+'" alt="第 '+(i+1)+' 張登錄單" width="'+p.w+'" height="'+p.h+'">'}).join('')+'</div>'+
    (ps.length>1?'<p class="muted regpn" id="regpn">第 1／'+ps.length+' 張，左右滑看下一張</p>':'')+""",
"""<div class="regprev" id="regprev">'+ps.map(function(p,i){return '<button class="regimg" data-act="rgfull" data-i="'+i+'" aria-label="第 '+(i+1)+' 張登錄單，點了全螢幕看"><img src="'+p.url+'" alt="" width="'+p.w+'" height="'+p.h+'"></button>'}).join('')+'</div>'+
    regBar(x,ps.length,0,'regpn')+'<p class="muted regtip">點圖片可以放大看</p>'+""")
one("""function regPrevFree(x){""","""function regBar(x,n,i,id){return n>1?'<div class="rgpbar"><button data-act="rgpg" data-d="-1" aria-label="上一張"'+(i>0?'':' disabled')+'>‹</button><span id="'+id+'" aria-live="polite">第 '+(i+1)+'／'+n+' 張</span><button data-act="rgpg" data-d="1" aria-label="下一張"'+(i<n-1?'':' disabled')+'>›</button></div>':''}
function regFullHtml(){var x=ui.cupSheet;if(!x||!x.prev||x.full==null)return '';var ps=x.prev.pages,i=Math.max(0,Math.min(ps.length-1,x.full)),p=ps[i],z=x.fz||1;
  return '<div class="whv rgv" role="dialog" aria-label="登錄單第 '+(i+1)+' 張"><div class="whbar"><button data-act="rgz" data-v="-1" aria-label="縮小"'+(z<=1?' disabled':'')+'>－</button><span>'+Math.round(z*100)+'%</span><button data-act="rgz" data-v="1" aria-label="放大"'+(z>=4?' disabled':'')+'>＋</button><button class="whclose" data-act="wholeclose">✕ 關閉</button></div>'+
    '<div class="whsc" data-pz="rg" data-n="'+ps.length+'"><div class="whin" style="width:'+z*100+'%"><img src="'+p.url+'" alt="第 '+(i+1)+' 張登錄單" width="'+p.w+'" height="'+p.h+'"></div></div>'+regBar(x,ps.length,i,'rgfpn')+'</div>'}
function regPrevFree(x){""")
one("""document.addEventListener('scroll',function(e){var t=e.target;if(!t||t.id!=='regprev')return;var n=document.getElementById('regpn'),k=t.children.length;if(!n||!k)return;var i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth))+1;n.textContent='第 '+Math.min(k,i)+'／'+k+' 張，左右滑看下一張'},true);""",
"""function regIdx(t){return Math.max(0,Math.min(t.children.length-1,Math.round(t.scrollLeft/Math.max(1,t.clientWidth+8))))}
document.addEventListener('scroll',function(e){var t=e.target;if(!t||t.id!=='regprev')return;var n=document.getElementById('regpn'),k=t.children.length;if(!n||!k)return;var i=regIdx(t);n.textContent='第 '+(i+1)+'／'+k+' 張';
  var bs=n.parentNode.querySelectorAll('button');if(bs.length===2){bs[0].disabled=i<=0;bs[1].disabled=i>=k-1}},true);""")
one("""    case 'scpback': regPrevFree(ui.cupSheet); break;""","""    case 'scpback': regPrevFree(ui.cupSheet); break;
    case 'rgfull': if(ui.cupSheet&&ui.cupSheet.prev){ui.cupSheet.full=Number(b.getAttribute('data-i'))||0;ui.cupSheet.fz=1} break;
    case 'rgz': if(ui.cupSheet){var rz=ui.cupSheet.fz||1;ui.cupSheet.fz=Math.max(1,Math.min(4,rz+Number(b.getAttribute('data-v'))*.5))} break;
    case 'rgpg': var rx=ui.cupSheet;if(!rx||!rx.prev)return;var rn=rx.prev.pages.length,rd=Number(b.getAttribute('data-d'));
      if(rx.full!=null){rx.full=Math.max(0,Math.min(rn-1,rx.full+rd));rx.fz=1;break}
      var rp=document.getElementById('regprev');if(rp){var ri=Math.max(0,Math.min(rn-1,regIdx(rp)+rd));rp.scrollTo({left:ri*(rp.clientWidth+8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} return; // 不重畫，捲動位置才留得住""")
one("    case 'wholeclose': ui.whole=false; break;","    case 'wholeclose': ui.whole=false; if(ui.cupSheet&&ui.cupSheet.full!=null)ui.cupSheet.full=null; break;")
one("+cupSheetHtml()+importPlanHtml()+","+cupSheetHtml()+regFullHtml()+importPlanHtml()+")
one("function topLayer(){var l=app.querySelectorAll('.stale,.fsv,.help,.sheet');","function topLayer(){var l=app.querySelectorAll('.stale,.fsv,.help,.sheet,.rgv');")
one("if(app.querySelector('.scrim,.sheet,.kp,.tpop,.help,.stale,.fsv,.whv,.rv'))return true;","if(app.querySelector('.scrim,.sheet,.kp,.tpop,.help,.stale,.fsv,.whv,.rv,.rgv'))return true;")

# ---------- 兩指放大（整張記錄表、登錄單全螢幕）；登錄單沒放大時左右滑換張 ----------
one("""function regPrevFree(x){""","""var pz=null;
function pzState(el){return el.getAttribute('data-pz')==='rg'?{get:function(){return (ui.cupSheet&&ui.cupSheet.fz)||1},set:function(z){if(ui.cupSheet)ui.cupSheet.fz=z}}:{get:function(){return ui.wz||1},set:function(z){ui.wz=z}}}
function pzLabel(el,z){var v=el.closest('.whv');if(!v)return;var sp=v.querySelector('.whbar span'),bs=v.querySelectorAll('.whbar [data-v]');if(sp)sp.textContent=Math.round(z*100)+'%';if(bs.length===2){bs[0].disabled=z<=1;bs[1].disabled=z>=4}}
document.addEventListener('touchstart',function(e){var el=e.target.closest&&e.target.closest('.whsc');if(!el)return;var st=pzState(el);
  if(e.touches.length===2){var a=e.touches[0],b=e.touches[1],r=el.getBoundingClientRect(),cx=(a.clientX+b.clientX)/2-r.left,cy=(a.clientY+b.clientY)/2-r.top;
    pz={el:el,st:st,d0:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,z0:st.get(),fx:(el.scrollLeft+cx)/el.scrollWidth,fy:(el.scrollTop+cy)/el.scrollHeight,cx:cx,cy:cy,z:st.get()}}
  else if(e.touches.length===1&&el.getAttribute('data-pz')==='rg')pz={el:el,swipe:true,x0:e.touches[0].clientX,y0:e.touches[0].clientY}},{passive:true});
document.addEventListener('touchmove',function(e){if(!pz||pz.swipe||e.touches.length!==2)return;var a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  var z=Math.max(1,Math.min(4,pz.z0*d/pz.d0)),inn=pz.el.firstElementChild;if(!inn)return;e.preventDefault();pz.z=z;inn.style.width=z*100+'%';
  pz.el.scrollLeft=pz.fx*pz.el.scrollWidth-pz.cx;pz.el.scrollTop=pz.fy*pz.el.scrollHeight-pz.cy;pzLabel(pz.el,z)},{passive:false});
document.addEventListener('touchend',function(e){if(!pz)return;var p=pz;
  if(p.swipe){pz=null;var t=e.changedTouches[0],dx=t.clientX-p.x0,dy=t.clientY-p.y0;if((ui.cupSheet&&ui.cupSheet.fz||1)<=1&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){var bb=document.querySelector('.rgv [data-act=rgpg][data-d="'+(dx<0?1:-1)+'"]');if(bb&&!bb.disabled)bb.click()}return}
  if(e.touches.length<2){pz=null;p.st.set(Math.round(p.z*100)/100)}},{passive:true});
function regPrevFree(x){""")

# ---------- 存檔視窗：尚未建立 ----------
one("""<span class="muted">'+(p[3]?p[4]:'還沒有')+'</span>""","""<span class="muted">'+(p[3]?p[4]:'尚未建立')+'</span>""")

# ---------- 記錄表各局（手機直放）：拖框、拖放大的那一塊 ----------
one("""/* App 記錄表分頁：各局、結果、判罰、記事都直接從協會記錄表裁出來，和匯出一樣（11/7 使用者） */""",
"""/* 11/21 使用者：上面的框可以拖著移動，下面放大的那塊也可以左右拖（點一下照舊）。拖的時候只移框和圖，放開才重畫 */
var lpd=null;
function lpInfo(el){var ov=el.closest('.loupe'),o=ov&&ov.querySelector('.ctov'),n=o?Number(o.getAttribute('data-v')):0,box=CTG.setBox[n];if(!box)return null;var W=box[2]-box[0],fw=Math.min(LOUPE_W,W);
  return {lp:ov,ov:o,n:n,box:box,fw:fw,cw:W+2.4,mag:ov.querySelector('.lmag'),fr:o.querySelector('.lframe'),x0:loupeX(null,n)}}
function lpClamp(I,x){return Math.max(I.box[0],Math.min(I.box[2]-I.fw,x))}
function lpShow(I,x){if(I.fr)I.fr.style.left=((x-I.box[0]+1.2)/I.cw*100).toFixed(2)+'%';var sv=I.mag&&I.mag.querySelector('svg');if(sv)sv.style.transform='translateX('+((I.x0-x)/(I.fw+2.4)*I.mag.clientWidth).toFixed(1)+'px)'}
app.addEventListener('pointerdown',function(e){if(e.button>0)return;var el=e.target.closest('.loupe .ctov,.loupe .lmag');if(!el)return;var I=lpInfo(el);if(!I)return;
  lpd={I:I,top:el===I.ov,id:e.pointerId,sx:e.clientX,moved:false,x:I.x0,el:el}},true);
app.addEventListener('pointermove',function(e){if(!lpd||e.pointerId!==lpd.id)return;var dx=e.clientX-lpd.sx,I=lpd.I;
  if(!lpd.moved){if(Math.abs(dx)<8)return;lpd.moved=true;try{lpd.el.setPointerCapture(e.pointerId)}catch(err){}lpd.el.classList.add('lpdrag')}
  if(lpd.top){var r=I.ov.getBoundingClientRect();lpd.x=lpClamp(I,I.box[0]-1.2+(e.clientX-r.left)/r.width*I.cw-I.fw/2)}
  else lpd.x=lpClamp(I,I.x0-dx/I.mag.clientWidth*(I.fw+2.4));
  lpShow(I,lpd.x)},true);
function lpEnd(e){if(!lpd||e.pointerId!==lpd.id)return;var d=lpd;lpd=null;if(!d.moved)return;d.el.classList.remove('lpdrag');(ui.loupe=ui.loupe||{})[d.I.n]=d.x;
  var swallow=function(ev){ev.stopPropagation();ev.preventDefault()};app.addEventListener('click',swallow,true);setTimeout(function(){app.removeEventListener('click',swallow,true)},0); // 拖完不要算成點格子
  render()}
app.addEventListener('pointerup',lpEnd,true);app.addEventListener('pointercancel',function(e){if(lpd&&e.pointerId===lpd.id){var d=lpd;lpd=null;if(d.moved){d.el.classList.remove('lpdrag');render()}}},true);
/* App 記錄表分頁：各局、結果、判罰、記事都直接從協會記錄表裁出來，和匯出一樣（11/7 使用者） */""")
one("""'<p class="lhint">點上面的記錄表，下面就放大那一塊</p>'""","""'<p class="lhint">點或拖上面的框，下面就放大那一塊</p>'""")

# ---------- 說明字精簡 ----------
for a,b in [
 ("代碼每天更換一次，當天固定不變；本機記錄哪一場，觀看裝置就自動顯示哪一場。需要網路；球員、職員與裁判姓名不會上傳。","代碼每天換一次。需要網路，姓名不會上傳。"),
 ("這台會立刻無法觀看，也不能接手記錄。對方清除瀏覽器資料或換瀏覽器後可以重新加入；要確實擋掉，請更換代碼。","這台會立刻斷線，也不能接手記錄。要確實擋掉，請換代碼。"),
 ("所有觀看裝置都會中斷，需要重新掃描新的 QR code 或輸入新代碼。已移除的裝置也一併清除。","所有觀看裝置都會中斷，要重新掃描或輸入新代碼。"),
 ("一行一位：背號、空格、姓名，例如「7 陳大文」。還不知道背號就只打姓名。Excel、LINE 整段貼上也可以。","一行一位，例如「7 陳大文」；沒有背號就只打姓名。可以整段貼上。"),
 ("記錄時點名字就好。同一個人可以在好幾個場地；比賽結束後，那一場的裁判也會自動加進這個場地。不會再來的人，刪掉那一行就好。","比賽結束後，那一場的裁判會自動加進這個場地。"),
 ("勾要存的內容。對方匯入後會合併到同名的資料夾，沒存的那幾項不會動到。","對方匯入後會合併到同名的資料夾。"),
 ("可能是改了號碼、臨時加入或打錯，先跟裁判組確認。確認可以上場，再改名冊；之後的比賽也會用新的名冊。","先跟裁判組確認可以上場，再加進名冊。"),
]:
    one(a,b)

# ---------- 畫面出錯時：自動測試看得到（使用者照舊回主畫面） ----------
one("""function paint(){
  try{draw()}
  catch(e){""","""function paint(){
  try{draw()}
  catch(e){if(navigator.webdriver)setTimeout(function(){throw e},0); // 11/21：裁判頁壞掉時測試沒抓到，自動測試時把錯誤丟出來""")
# ---------- 樣式 ----------
one(".scpbtns>button{flex:1 1 0}",""".scpbtns>button{flex:1 1 0}
.scwheel{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;gap:4px;margin:4px 0}
.scwheel::before{content:'';position:absolute;left:0;right:0;top:50%;height:48px;transform:translateY(-50%);border-radius:12px;background:var(--ok-soft);z-index:-1;pointer-events:none}
.scwcol{display:flex;flex-direction:column;align-items:center;width:min(30vw,112px)}
.scwar{display:none;width:100%;min-height:44px;padding:0;font-size:14px;background:transparent;border-color:transparent;color:var(--muted)}
@media (hover:hover) and (pointer:fine){.scwar{display:block}.scwar:hover{color:var(--ink);background:var(--chip,rgba(0,0,0,.05))}}
.scwlist{width:100%;height:240px;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none;-webkit-mask-image:linear-gradient(transparent,#000 28%,#000 72%,transparent);mask-image:linear-gradient(transparent,#000 28%,#000 72%,transparent);touch-action:pan-y}
.scwlist::-webkit-scrollbar{display:none}
.scwlist:focus-visible{outline:2px solid var(--focus,#2e6cb7);outline-offset:2px;border-radius:12px}
.scwpad{display:block;height:96px}
.scwi{display:flex;align-items:center;justify-content:center;width:100%;height:48px;min-height:48px;padding:0;border:0;border-radius:0;background:transparent;color:var(--ink);font-size:24px;font-weight:600;font-variant-numeric:tabular-nums;scroll-snap-align:center;box-shadow:none}
.scwi[aria-selected=true]{font-weight:800;font-size:28px}
.scwsep{font-size:28px;font-weight:800}
.scwhint{margin:0;text-align:center;font-size:13px}
.regimg{display:block;flex:0 0 100%;width:100%;padding:0;border:0;background:none;scroll-snap-align:center;cursor:zoom-in;min-height:0}
.regimg>img{display:block;width:100%;height:auto;border:1px solid var(--line2);background:#fff;border-radius:6px}
.rgpbar{display:flex;align-items:center;justify-content:center;gap:12px}
.rgpbar button{min-width:52px;min-height:44px;font-size:22px;font-weight:800;padding:0}
.rgpbar span{min-width:7em;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.regtip{margin:0;text-align:center;font-size:13px}
.rgv{background:#2a2a2a}
.rgv .whsc{display:grid;align-items:center}
.rgv .whin{justify-self:start}
.rgv .whin img{display:block;width:100%;height:auto;background:#fff}
.rgv>.rgpbar{flex:none;padding:6px 8px;background:#141414;color:#fff}
.rgv>.rgpbar button{background:#2a2a2a;color:#fff;border-color:#2a2a2a}
.rgv>.rgpbar button:disabled{opacity:.35}
.whsc{touch-action:pan-x pan-y}
.loupe .ctov,.loupe .lmag{touch-action:pan-y;user-select:none;-webkit-user-select:none}
.loupe .lmag{overflow:hidden}
.ctov.lpdrag{cursor:grabbing}
.ctov.lpdrag .lframe{border-width:3px}""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v128')

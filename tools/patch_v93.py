# 11/13 使用者：「我是希望可以全部都統一，不會一下有的可以有的不行」（往下滑關掉）。
# 以前只有跳出來的視窗能往下滑關掉，而且只在寬度 760 以下（手機直放）；數字鍵盤、替補面板、使用說明、看整張、全螢幕都不行，
# 手機橫放、平板的視窗也不行。
# 改成：觸控螢幕上（直放、橫放、平板都一樣；寬度 760 以下照舊），這些跳出來的東西往下滑都能關掉，和按它的關閉鍵一樣：
#   視窗：和以前一樣（關閉、返回、取消…，SHEET_DISMISS 的順序）；一定要選一個的視窗（例如局結束）沒有關閉鍵，不能滑掉。
#   數字鍵盤：等於「完成」（打好的號碼存起來）。替補面板：等於「完成」（換好的保留，和返回鍵一樣）；被判罰一定要換人時沒有完成鍵，不能滑掉。
#   使用說明：等於「✕」。看整張：等於「關閉」。全螢幕：等於「✕ 關閉全螢幕」，記錄表轉 90 度時照記錄表的「下」滑。
# 手勢：手指先往哪個方向動就算哪個方向；橫的（說明左右換張、表格左右捲）不算；裡面捲到一半時往下滑是捲動，不會關掉。
# 往下滑能關掉的都有上面那條小橫槓。
# 用法：python3 tools/patch_v93.py（先跑過 patch_v91.py、patch_v92.py）
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert '白框剛好包住鍵盤' in t, 'v92 first'
assert 'SWIPE_LAYERS' not in t, 'already'

OLD = """function markSwipe(){if(matchMedia('(min-width:760px)').matches)return;app.querySelectorAll('.sheet').forEach(function(sh){if(sheetDismiss(sh))sh.classList.add('swipe')})}
var drag=null;
app.addEventListener('touchstart',function(e){var sh=e.target.closest('.sheet.swipe');if(!sh||e.touches.length!==1)return;if(sh.scrollTop>0&&!e.target.closest('.grab'))return;if(e.target.closest('input,textarea,select'))return;drag={sh:sh,y0:e.touches[0].clientY,t0:Date.now(),dy:0}},{passive:true});
app.addEventListener('touchmove',function(e){if(!drag)return;var dy=e.touches[0].clientY-drag.y0;if(dy<0){dy=0}drag.dy=dy;if(dy>4){drag.sh.style.transition='none';drag.sh.style.transform='translateY('+dy+'px)'}},{passive:true});
function dragEnd(){if(!drag)return;var d=drag;drag=null;var fast=d.dy>40&&d.dy/(Date.now()-d.t0)>0.5;
  if(d.dy>Math.min(120,d.sh.offsetHeight*0.3)||fast){var btn=sheetDismiss(d.sh);d.sh.style.transition='transform .18s ease-out';d.sh.style.transform='translateY(100%)';setTimeout(function(){if(btn)btn.click()},150)}
  else{d.sh.style.transition='transform .2s ease-out';d.sh.style.transform=''}}"""

NEW = """/* 往下滑關掉（11/13 統一）：跳出來的視窗、數字鍵盤、替補面板、使用說明、看整張、全螢幕，觸控螢幕直放橫放都一樣，
   和按它的關閉鍵一樣；沒有關閉鍵的（一定要選一個）不能滑掉 */
var SWIPE_LAYERS=[['.sheet',SHEET_DISMISS],['.kp:not(.bench)',['[data-act=kpclose]']],['.kp.bench',['[data-act=subclose]']],['.help',['[data-act=helpclose]']],['.whv',['[data-act=wholeclose]']],['.fsv',['[data-act=fsclose]']]];
function layerDismiss(el){for(var i=0;i<SWIPE_LAYERS.length;i++){if(el.matches(SWIPE_LAYERS[i][0])){var L=SWIPE_LAYERS[i][1];for(var j=0;j<L.length;j++){var b=el.querySelector(L[j]);if(b&&!b.disabled)return b}return null}}return null}
function markSwipe(){var on=matchMedia('(max-width:759px)').matches||matchMedia('(any-pointer:coarse)').matches;
  app.querySelectorAll(SWIPE_LAYERS.map(function(x){return x[0]}).join(',')).forEach(function(el){el.classList.toggle('swipe',!!(on&&layerDismiss(el)))})}
function swipeAngle(el){var t=el.matches('.fsv')?el.querySelector('.fsin'):el;if(!t)return 0;var m=/matrix\\(([^)]+)\\)/.exec(getComputedStyle(t).transform||'');if(!m)return 0;var a=m[1].split(',').map(parseFloat);return Math.atan2(a[1],a[0])}
var drag=null;
app.addEventListener('touchstart',function(e){var sh=e.target.closest('.swipe');if(!sh||e.touches.length!==1)return;if(e.target.closest('input,textarea,select'))return;
  if(!e.target.closest('.grab'))for(var q=e.target;q;q=q.parentElement){if(q.scrollTop>0)return;if(q===sh)break} // 裡面捲到一半：往下是捲動
  var th=swipeAngle(sh);drag={sh:sh,x0:e.touches[0].clientX,y0:e.touches[0].clientY,t0:Date.now(),dy:0,ux:-Math.sin(th),uy:Math.cos(th),lock:0}},{passive:true});
app.addEventListener('touchmove',function(e){if(!drag)return;if(e.touches.length!==1){dragReset(drag);drag=null;return}
  var mx=e.touches[0].clientX-drag.x0,my=e.touches[0].clientY-drag.y0,along=mx*drag.ux+my*drag.uy,across=Math.abs(my*drag.ux-mx*drag.uy);
  if(!drag.lock){if(Math.abs(along)<8&&across<8)return;drag.lock=along>across?1:-1} // 先往哪邊動就算哪邊；橫的、往上的不算
  if(drag.lock<0)return;var dy=Math.max(0,along-8);drag.dy=dy;drag.sh.style.transition='none';drag.sh.style.translate=(drag.ux*dy)+'px '+(drag.uy*dy)+'px'},{passive:true});
function dragReset(d){if(!d||d.lock<=0)return;d.sh.style.transition='translate .2s ease-out';d.sh.style.translate=''}
function dragEnd(){if(!drag)return;var d=drag;drag=null;if(d.lock<=0)return;var fast=d.dy>40&&d.dy/(Date.now()-d.t0)>0.5,size=Math.abs(d.uy)>0.5?d.sh.offsetHeight:d.sh.offsetWidth;
  if(d.dy>Math.min(120,size*0.3)||fast){var btn=layerDismiss(d.sh);if(!btn){dragReset(d);return}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){btn.click();return}
    var far=Math.max(innerWidth,innerHeight);d.sh.style.transition='translate .18s ease-out';d.sh.style.translate=(d.ux*far)+'px '+(d.uy*far)+'px';
    setTimeout(function(){btn.click();setTimeout(function(){if(d.sh.isConnected){d.sh.style.transition='';d.sh.style.translate=''}},60)},150)}
  else dragReset(d)}"""

t = one(t, OLD, NEW)

CSS = '''/* 11/13 往下滑能關掉的都有上面那條小橫槓（數字鍵盤、替補面板、使用說明、看整張、全螢幕；視窗本來就有） */
.kp.swipe::before,.help.swipe::before,.fsv.swipe .fsin::before,.whv.swipe .whbar::before{content:'';position:absolute;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:var(--line2);pointer-events:none;z-index:1}
.kp.swipe::before{top:2px}
.help.swipe::before{top:calc(max(10px,var(--safe-top,0px)) - 7px)}
.fsv.swipe .fsin::before{top:1px;background:#c9c9c9}
.whv.swipe .whbar{position:relative}
.whv.swipe .whbar::before{top:1px;background:#5a5a5a}
</style>'''

t = one(t, '</style>', CSS)
open(SRC, 'w', encoding='utf-8').write(t)
print('patched v93')

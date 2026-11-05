# v48：健檢修正（11/5 下午，使用者決定）：面板可往下滑關閉、隊名放進標題、按鈕顏色與用詞統一、橫向鏡像、隊長格與空 L2、面板內顯示警告、提示字放進「其他」、說明文字更新
import json,re
import sys; P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
# 1. 隊名放進標題同一行（不再是像按鈕的整條色塊）
s,c1=re.subn(r"""<div class="toask '\+(k|tk|who\.k)\+'">'\+esc\(tName\(s,\1\)\)\+'</div><h2>""",lambda m:"""<h2><span class="tpill '+%s+'">'+esc(tName(s,%s))+'</span> """%(m.group(1),m.group(1)),s)
assert c1==6,c1
# 陣容不完整、棄權的標題本來就有隊名，拿掉重複
rep("""<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 確定判 '+esc(tName(s,k))+' 輸""","""<h2>確定判 <span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 輸""")
rep("""<h2><span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 確定 '+esc(tName(s,k))+' 棄權？""","""<h2>確定 <span class="tpill '+k+'">'+esc(tName(s,k))+'</span> 棄權？""")
# 2. 替補的「取消」不用紅色（可以復原，不是不可逆）
rep("""<button class="danger" data-act="subcancel">取消</button>""","""<button data-act="subcancel">取消</button>""")
# 3. 用詞：選單類用「關閉」
rep("""(why?'<p class="muted">'+why+'</p>':'')+'<button data-act="close">取消</button>';""","""(why?'<p class="muted">'+why+'</p>':'')+'<button data-act="close">關閉</button>';""")
rep(""">稍後再選</button>""",""">關閉</button>""")
# 4. 橫向：右邊那隊也鏡像，隊長格靠球場
rep("""'</div>'+libStrip(s,k)+'</section>';""","""'</div>'+libStrip(s,k,k!==c.left)+'</section>';""")
# 5. 隊長格：隊長在場上時點了用文字說明；空 L2 寫「無」
rep("""data-act="gcappick" data-team="'+k+'"'+(capOn?' disabled':'')+'""","""data-act="gcappick" data-team="'+k+'"'+(capOn?' data-on="1"':'')+'""")
rep("""class="capbox '+k+(cap==null?' need':'')+'\"""","""class="capbox '+k+(cap==null?' need':capOn?' fixed':'')+'\"""")
rep("""<span>L'+(i+1)+'</span><b>－</b></div>';""","""<span>L'+(i+1)+'</span><b class="none">無</b></div>';""")
i=s.index("    case 'gcappick':")
rep("    case 'gcappick':","""    case 'gcappick': if(b.getAttribute('data-on')){ui.toast={t:'隊長 '+s.teams[k].captain+' 號在場上，不用指定',until:Date.now()+2500};break}""")
# 6. 替補面板打開時，重要警告也放在面板裡
rep("""  var fp=ui.sub.forced&&ui.sub.po;""","""  var fp=ui.sub.forced&&ui.sub.po,lfw=!fp&&libFront(s);""")
rep("""(fp?'<p class="forcedmsg">'""","""(lfw?'<p class="forcedmsg">'+esc(tName(s,lfw.k))+' 自由球員'+(lfw.sv?'輪到發球':'到前排')+'，點閃的 L 換回 '+lfw.no+' 號</p>':'')+(fp?'<p class="forcedmsg">'""")
# 7. 「其他」加提示字開關；球衣顏色寫明含自由球員
rep("""mt('球衣顏色','sheet',' data-v="color"',false)+""","""mt('球衣顏色<small>含自由球員</small>','sheet',' data-v="color"',false)+""")
rep("""      '<button class="linkbtn dangerlink" data-act="sheet" data-v="leave">離開這場比賽</button>';""","""      '<h3 class="mhead">設定</h3><div class="mrow"><strong>提示字</strong><div class="seg">'+[['on','顯示'],['off','隱藏']].map(function(q){return '<button data-act="hints" data-v="'+q[0]+'" aria-pressed="'+((prefs.hints===false?'off':'on')===q[0])+'">'+q[1]+'</button>'}).join('')+'</div></div>'+
      '<button class="linkbtn dangerlink" data-act="sheet" data-v="leave">離開這場比賽</button>';""")
# 8. 往下滑關閉面板（手機；只在有關閉或取消鈕的面板）
rep("""var backGuard=false,backSkip=false;""","""var SHEET_DISMISS=['[data-act=close]','[data-act=penclose]','[data-act=penno]','[data-act=penback]','[data-act=tono]','[data-act=incno]','[data-act=ffno]','[data-act=cs-no]','[data-act=nclose]','[data-act=amendback]','[data-act=fixback]','[data-act=import-cancel]','[data-act=del-no]'];
function sheetDismiss(sh){for(var i=0;i<SHEET_DISMISS.length;i++){var e=sh.querySelector(SHEET_DISMISS[i]);if(e&&!e.disabled)return e}return null}
function markSwipe(){if(matchMedia('(min-width:760px)').matches)return;app.querySelectorAll('.sheet').forEach(function(sh){if(sheetDismiss(sh))sh.classList.add('swipe')})}
var drag=null;
app.addEventListener('touchstart',function(e){var sh=e.target.closest('.sheet.swipe');if(!sh||e.touches.length!==1)return;if(sh.scrollTop>0&&!e.target.closest('.grab'))return;if(e.target.closest('input,textarea,select'))return;drag={sh:sh,y0:e.touches[0].clientY,t0:Date.now(),dy:0}},{passive:true});
app.addEventListener('touchmove',function(e){if(!drag)return;var dy=e.touches[0].clientY-drag.y0;if(dy<0){dy=0}drag.dy=dy;if(dy>4){drag.sh.style.transition='none';drag.sh.style.transform='translateY('+dy+'px)'}},{passive:true});
function dragEnd(){if(!drag)return;var d=drag;drag=null;var fast=d.dy>40&&d.dy/(Date.now()-d.t0)>0.5;
  if(d.dy>Math.min(120,d.sh.offsetHeight*0.3)||fast){var btn=sheetDismiss(d.sh);d.sh.style.transition='transform .18s ease-out';d.sh.style.transform='translateY(100%)';setTimeout(function(){if(btn)btn.click()},150)}
  else{d.sh.style.transition='transform .2s ease-out';d.sh.style.transform=''}}
app.addEventListener('touchend',dragEnd);app.addEventListener('touchcancel',dragEnd);
var backGuard=false,backSkip=false;""")
rep("""  paint();backSync();""","""  paint();markSwipe();backSync();""")
# 9. 說明文字跟上新做法
i=s.index('var HELP=')+9;j=s.index(';\n',i)
H=json.loads(s[i:j])
for g in H:
  for c in g['cards']:
    if c['img']=='lib':c['d']='點後排的人選自由球員上場，或先點下方 L 格再點後排的人。在場上的自由那格寫「換回」，點它就換回；兩位自由點一下就互換。'
    if c['img']=='libf':c['t']='自由球員到前排';c['d']='自由球員輪到前排或發球時，那一格會閃，點它就換回原本的球員；換回前不能發球。'
    if c['img']=='sub':c['d']='按「替補」或直接點場上的人，再點上場的人，最後按「完成」。'
s=s[:i]+json.dumps(H,ensure_ascii=False)+s[j:]
rep("</style>","""/* v48 */
.tpill{display:inline-block;padding:1px 8px;border-radius:6px;font-weight:800;vertical-align:1px}
.tpill.t1{background:var(--t1-j);color:var(--t1-jt)}.tpill.t2{background:var(--t2-j);color:var(--t2-jt)}
.sheet::before{display:none}
.sheet.swipe::before{display:block}
.sheet.swipe{touch-action:pan-y}
.capbox.fixed{border-width:1px;border-color:var(--line)}
.lc.empty{border-style:solid}
.lc b.none{font-size:15px;font-weight:700}
.lc span{font-size:11px}
.lc small{font-weight:800}
.capbox span{font-size:12px}
.mrow strong small{display:block;font-size:12px;font-weight:600;color:var(--muted)}
</style>""")
rep('.kp.forced .forcedmsg{','.kp .forcedmsg{')  # 一般替補面板的警告也用紅字
open(P,'w',encoding='utf8').write(s); print('ok')

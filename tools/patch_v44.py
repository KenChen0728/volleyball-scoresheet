# v44：自由球員固定格＋場上隊長格、點一下互換、提示字開關、開賽前返回回上一步、回主畫面說明、強制換人不顯示受傷（朋友 11/5 試用回饋）
import re
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
# 1. 固定格：L1、L2、隊長（隊長靠網子）
i=s.index('function libStrip(s,k){'); j=s.index('function teamTools(s,k){')
s=s[:i]+r"""function libStrip(s,k,mir){
  var c=s.sets[s.setNo],t=s.teams[k],out=c.libOut[k],can=canLib(c,k),wait=canPause(c)&&!can,lj=t.liberoColor?jersey(t.liberoColor).j:null;
  var slots=[0,1].map(function(i){
    var no=t.liberos[i];
    if(no==null)return '<div class="lc '+k+' empty" aria-hidden="true"><span>L'+(i+1)+'</span><b>－</b></div>';
    var inC=c.cur[k].indexOf(no)>=0,gone=c.expelled[k].indexOf(no)>=0||s.matchOut[k].indexOf(no)>=0,on=ui.lib&&ui.lib.team===k&&ui.lib.no===no,act='libcell',sm='',dis=false,cls='';
    if(gone){sm='不能上';dis=true;cls=' away'}
    else if(inC){act='libback';cls=' incourt';sm=can?'換回 '+out.no:wait?'下一球可換':'換 '+out.no;dis=!can}
    else if(!can){dis=true;if(wait&&out)sm='下一球可換'}
    else if(out)sm='互換';
    return '<button'+(lj?' style="--j:'+lj+';--jt:'+jerseyText(lj)+'"':'')+' class="lc '+k+cls+(on?' sel':'')+'" data-act="'+act+'" data-team="'+k+'" data-no="'+no+'"'+(dis?' disabled':'')+' aria-label="自由球員 L'+(i+1)+' '+no+' 號'+(sm?' '+sm:'')+'"><span>L'+(i+1)+'</span><b>'+no+'</b>'+(sm?'<small>'+sm+'</small>':'')+'</button>';
  });
  var cap=actingCap(c,t,k),capOn=c.cur[k].indexOf(t.captain)>=0;
  var cb='<button class="capbox '+k+(cap==null?' need':'')+'" data-act="gcappick" data-team="'+k+'"'+(capOn?' disabled':'')+' aria-label="'+esc(tName(s,k))+' 場上隊長 '+(cap==null?'未指定':cap+' 號')+'"><span>隊長</span><b'+(cap!=null?' class="circ"':'')+'>'+(cap==null?'?':cap)+'</b></button>';
  return '<div class="strip '+k+(mir?' mir':'')+'"><div class="ls">'+slots.join('')+'</div>'+cb+'</div>';
}
"""+s[j:]
rep("'<div class=\"strips\">'+libStrip(s,L)+libStrip(s,R)+'</div>'","'<div class=\"strips\">'+libStrip(s,L)+libStrip(s,R,true)+'</div>'")
rep("    case 'libcell': ui.sub=null;","""    case 'libback': ui.lib=null; ui.sub=null; dispatch('LIBERO_OUT',{set:n,team:k}); break;
    case 'libcell': if(c.libOut[k]&&canLib(c,k)){ui.lib=null;ui.sub=null;dispatch('LIBERO_SWAP',{set:n,team:k,lib:no});break}
      ui.sub=null;""")
rep("'libcell','libout','subopen'","'libcell','libback','libout','subopen'")
# 黃色隊長提醒條拿掉，改成隊長格變紅＋提示行
rep("""  [L,R].forEach(function(k){if(actingCap(c,s.teams[k],k)===null)warn+=""","""  var capMiss=[L,R].filter(function(k){return actingCap(c,s.teams[k],k)===null})[0];
  if(false)[L,R].forEach(function(k){if(actingCap(c,s.teams[k],k)===null)warn+=""")
rep("""tName(s,lfr.k)+' 自由球員'+(lfr.sv?'輪到發球':'到前排')+'，點閃的 L 換回 '+lfr.no+' 號':c.live?""","""tName(s,lfr.k)+' 自由球員'+(lfr.sv?'輪到發球':'到前排')+'，點閃的 L 換回 '+lfr.no+' 號':capMiss&&!c.live?tName(s,capMiss)+' 請點紅色「隊長」格，指定場上隊長':c.live?""")
# capMiss 要在 lockT 之前算好：把定義移到 lockT 前
s=s.replace("""  var capMiss=[L,R].filter(function(k){return actingCap(c,s.teams[k],k)===null})[0];
  if(false)""","  if(false)",1)
rep("""  var lfr=libFront(s);
  var lockT=""","""  var lfr=libFront(s),capMiss=[L,R].filter(function(k){return actingCap(c,s.teams[k],k)===null})[0];
  var lockT=""")
rep("""' toast':lfr?' toast lfr':'')+'">'""","""' toast':lfr||(capMiss&&!c.live)?' toast lfr':' hint')+'">'""")
# 2. 提示字開關（只影響說明性的提示，警告和回饋照樣顯示）
rep("""  body+=inst+'<div class="themerow"><span class="muted">外觀</span>""","""  body+=inst+'<div class="themerow"><span class="muted">提示字</span><div class="seg">'+[['on','顯示'],['off','隱藏']].map(function(x){return '<button data-act="hints" data-v="'+x[0]+'" aria-pressed="'+((prefs.hints===false?'off':'on')===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>';
  body+='<div class="themerow"><span class="muted">外觀</span>""")
rep("""    case 'theme': prefs.theme""","""    case 'hints': prefs.hints=b.getAttribute('data-v')!=='off'; savePrefs(); break;
    case 'theme': prefs.theme""")
rep("""function draw(){
""","""function draw(){
  document.documentElement.classList.toggle('nohint',prefs.hints===false);
""")
# 3. 開賽前按返回回上一步
rep("""  if(escClose())return;
  var x=app.querySelector('[data-act=sheetclose],[data-act=rpclose],.bar .barback');""","""  if(escClose())return;
  if(view==='setup'&&ui.page!=='play'){
    var bm=current(),bs=bm?safeReduce(bm):null,prev={roster:'info',toss:'roster',lineup:'toss'}[ui.page];
    if(bs&&bs.sets[1].started&&!matchOver(bs)){ui.page='play';render();return}
    if(bs&&!bs.sets[1].started&&prev){var pb=app.querySelector('.nav [data-act=page][data-v='+prev+']');if(pb&&!pb.disabled){pb.click();return}}
  }
  var x=app.querySelector('[data-act=sheetclose],[data-act=rpclose],.bar .barback');""")
# 4. 從比賽回主畫面：說明比賽還在
rep("""function libFront(s){""","""var homeNote=null;
function noteLeave(m){if(!m||m.events.length<=1)return;var r=safeReduce(m);if(r&&!matchOver(r))homeNote={t:'剛剛的比賽還在，放在「進行中」，按「繼續」就能接回',until:Date.now()+6000}}
function libFront(s){""")
rep("""    case 'home':
""","""    case 'home': noteLeave(m);
""")
rep("""    case 'cupback':
""","""    case 'cupback': noteLeave(m);
""")
rep("""    case 'history': db.currentId=null;""","""    case 'history': noteLeave(m); db.currentId=null;""")
rep("""  if(g.live.length)body+='<section><h2>進行中</h2>""","""  if(homeNote&&Date.now()<homeNote.until&&g.live.length)body+='<p class="homenote" role="status">'+esc(homeNote.t)+'</p>';
  if(g.live.length)body+='<section><h2>進行中</h2>""")
# 5. 判罰造成的強制換人：例外替補不顯示「宣告受傷」
rep("""(ui.sub.exc?'<div class="excinj">""","""(ui.sub.exc&&!ui.sub.forced?'<div class="excinj">""")
rep("</style>","""/* v44 */
.strip{align-items:center}
.strip.mir{flex-direction:row-reverse}
.strip.mir .ls{flex-direction:row-reverse}
.lcap{display:none}
.lc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:50px;height:50px;line-height:1}
.lc span{position:static;font-size:10px;font-weight:800;line-height:1;opacity:.85}\n.lc b{line-height:1}
.lc b{font-size:19px}
.lc small{font-size:10px;font-weight:700;white-space:nowrap}
.lc.empty{background:transparent;border:1px dashed var(--line);color:var(--muted);border-radius:var(--r);opacity:.6}
.lc.incourt{box-shadow:0 0 0 3px var(--ink);opacity:1}
.lc:disabled:not(.incourt):not(.away){opacity:.55}
.capbox{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:54px;height:50px;min-height:0;padding:0;line-height:1;border:2px solid var(--ink);background:var(--panel);color:var(--ink)}
.capbox span{font-size:11px;font-weight:700;color:var(--muted)}
.capbox b{font-size:19px;font-family:var(--num)}
.capbox b.circ{width:30px;height:30px;border-width:2px;font-size:16px}
.capbox:disabled{opacity:1;cursor:default}
.capbox.need{border-color:var(--bad);color:var(--bad);animation:capneed 1.2s ease-in-out infinite}
.capbox.need span{color:var(--bad)}
@keyframes capneed{50%{box-shadow:0 0 0 4px rgba(229,40,30,.35)}}
@media (prefers-reduced-motion:reduce){.capbox.need{animation:none}}
.nohint .stephint,.nohint .subhint.tip{display:none}
.nohint .lockline.hint{visibility:hidden}
.homenote{margin:0 0 4px;padding:10px 12px;border-radius:var(--r);background:var(--accent);color:var(--accent-ink);font-weight:700;line-height:1.4;animation:hnfade 6s forwards}
@keyframes hnfade{85%{opacity:1}100%{opacity:0}}
</style>""")
open(P,'w',encoding='utf8').write(s); print('ok')

#!/usr/bin/env python3
"""11/11 使用者：勾選比賽再備份、備份時選要不要帶名單、有新版時提示更新。
用法：python3 tools/patch_v60.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()


def one(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:90])
    s = s.replace(a, b)


# ---------- 紀錄與名單：選擇模式 ----------
i = s.index('function historyHtml(){')
j = s.index('\n}\n', i) + 3
s = s[:i] + r'''function historyHtml(){
  var g=splitMatches(),head='<header class="bar"><button class="barback" data-act="home">‹ 主畫面</button><h1>紀錄與名單</h1><button class="helpbtn" data-act="helpopen" aria-label="這一頁怎麼用">?</button></header>';
  if(ui.bkSel)return head+'<main class="page"><div class="narrow">'+bkPickHtml()+'</div></main>';
  var rows=g.done.map(function(x){var c=cupOf(x.m);return historyRow(x.m,x.s,true).replace('<span class="muted">','<span class="muted"><em class="ftag'+(c?'':' none')+'">'+esc(c?c.name:'未分類')+'</em>')}).join(''),can=g.live.length+g.done.length>0;
  return head+'<main class="page"><div class="narrow">'+cupHomeHtml()+'<section><div class="shead"><h2>打完的比賽</h2>'+(can?'<button class="linkbtn" data-act="bksel">選擇</button>':'')+'</div><div id="rvmsg" class="muted" role="status"></div>'+(rows?'<p class="muted">點一場比賽就能看記錄表。前面標的是放在哪個資料夾。要備份就按「選擇」。</p><div class="rlist">'+rows+'</div>':'<p class="note">打完的比賽會放在這裡。換手機時，可以用下面的匯入功能把備份放回來。</p>')+'</section><section><h2>備份和匯入</h2><div class="histtools"><button data-act="bksel"'+(can?'':' disabled')+'>選擇要備份的比賽</button><label class="ghost-file">匯入備份或資料夾<input id="import-file" type="file" accept=".json,application/json,.txt,text/plain"></label></div><div id="import-msg" class="muted" role="status">'+esc(ui.importMsg||'')+'</div><p class="muted">比賽只存在這台裝置。換手機或清除瀏覽器資料前，請先備份。資料夾的名單也可以到資料夾裡「存成檔案」。匯入前會先列出會改什麼。</p></section></div></main>';
}
/* ========== 11/11 勾選比賽再備份（使用者）：按「選擇」後單選、多選、全選，選好按「備份」，跳出視窗確定才存檔。
   每場比賽本身的兩隊名單和裁判在比賽紀錄裡，一定會帶；盃賽的全部隊伍名單、裁判名單寫出盃賽名稱和數量，讓使用者勾要不要帶。
   全部選了等於以前的「備份全部比賽」：還沒有比賽的資料夾名單也列出來 ========== */
function bkList(){var g=splitMatches();return g.live.concat(g.done)}
function bkChosen(){var ids=ui.bkSel?ui.bkSel.ids:{};return db.matches.filter(function(m){return ids[m.id]&&!!safeReduce(m)})}
function bkAll(){var l=bkList();return !!ui.bkSel&&l.length>0&&l.every(function(x){return ui.bkSel.ids[x.m.id]})}
function bkCounts(c){return {teams:liveTeams(c).length,refs:XP_ON?refNames(c,null).length:0}}
function bkCups(ms){
  var out=[];function add(c){if(c&&out.indexOf(c)<0)out.push(c)}
  ms.forEach(function(m){add(cupOf(m))});
  if(bkAll())db.cups.forEach(function(c){var n=bkCounts(c);if(n.teams||n.refs)add(c)});
  return out;
}
function bkRow(x){
  var m=x.m,s=x.s,c=cupOf(m),T=matchTitle(s),live=!matchOver(s),w=setsWon(s),aw=w[T[2]]>w[T[3]],on=!!ui.bkSel.ids[m.id];
  var meta='<em class="ftag'+(c?'':' none')+'">'+esc(c?c.name:'未分類')+'</em>'+esc(s.info.date||'')+(s.info.game?'　第 '+esc(s.info.game)+' 場':'')+(s.info.sample?'　練習':'')+(live?' <i class="pill">進行中</i>':'')+(backedUp(m)?'':' <i class="pill">還沒備份</i>');
  return '<button class="hrow bkone" data-act="bkpick" data-id="'+esc(m.id)+'" aria-pressed="'+on+'"><span class="bkbox" aria-hidden="true"></span><span class="bktx"><span class="muted">'+meta+'</span><span class="hnames"><span'+(!live&&aw?' class="win"':'')+'>'+esc(T[0])+'</span><b>'+setsText(s)+'</b><span'+(!live&&!aw?' class="win"':'')+'>'+esc(T[1])+'</span></span></span></button>';
}
function bkPickHtml(){
  var l=bkList(),n=l.filter(function(x){return ui.bkSel.ids[x.m.id]}).length,all=n===l.length&&n>0;
  return '<section class="bkpick"><h2>選要備份的比賽</h2><p class="muted">點比賽打勾，再點一次取消。選好按「備份」。</p><div class="bktools"><button data-act="bkall">'+(all?'全不選':'全選')+'</button><button data-act="bkcancel">取消</button><button class="go" data-act="bkgo"'+(n?'':' disabled')+'>備份（已選 '+n+' 場）</button></div>'+(l.length?'<div class="rlist">'+l.map(bkRow).join('')+'</div>':'<p class="note">還沒有比賽可以備份。</p>')+'</section>';
}
function bkSheetHtml(){
  if(!ui.bkOpt||!ui.bkSel)return '';
  var ms=bkChosen(),op=ui.bkOpt,items='';
  bkCups(ms).forEach(function(c){var n=bkCounts(c),o=op[c.id]||{};
    if(n.teams)items+='<button class="imp" data-act="bkopt" data-id="'+esc(c.id)+'" data-v="teams" aria-pressed="'+!!o.teams+'"><span>'+esc(c.name)+'全部隊伍名單（'+n.teams+' 隊）</span></button>';
    if(n.refs)items+='<button class="imp" data-act="bkopt" data-id="'+esc(c.id)+'" data-v="refs" aria-pressed="'+!!o.refs+'"><span>'+esc(c.name)+'裁判名單（'+n.refs+' 人）</span></button>'});
  var h='<h2>備份 '+ms.length+' 場比賽</h2><p class="muted">每場比賽的兩隊名單'+(XP_ON?'和裁判':'')+'都在比賽紀錄裡，一定會一起存。</p>'+(items?'<p class="muted">盃賽的名單要不要一起帶？打勾的會帶，點一下取消。</p>'+items:'')+'<button class="primary" data-act="bksave">存備份</button><button class="ghost" data-act="close">取消</button>';
  return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="備份">'+h+'</div>';
}
function bkSave(){
  var ms=bkChosen();if(!ms.length){ui.bkOpt=null;render();return}
  var full=bkAll(),op=ui.bkOpt||{},now=Date.now(),cups=[];
  bkCups(ms).forEach(function(c){var o=op[c.id]||{},n=bkCounts(c),has=ms.some(function(m){return m.cup===c.id});
    var tk=n.teams?!!o.teams:true,rk=XP_ON&&(n.refs?!!o.refs:true); // 沒有可勾的（只剩刪除標記）照帶，刪掉的才不會又跑回來；沒有裁判名單功能的版本不帶
    if(!has&&!(n.teams&&o.teams)&&!(n.refs&&o.refs))return;
    var x=Object.assign({},c);x.teams=tk?(c.teams||[]):[];x.refs=rk?cupRefs(c):[];cups.push(x)});
  var txt=JSON.stringify({app:'volleyball-scoresheet',version:1,matches:ms,cups:cups});
  prefs.bk=prefs.bk||{};ms.forEach(function(m){prefs.bk[m.id]=now});if(full)prefs.lastBackup=now;savePrefs();
  ui.bkOpt=null;ui.bkSel=null;render();
  var rv=document.getElementById('rvmsg');if(rv&&rv.scrollIntoView)rv.scrollIntoView({block:'nearest'});
  saveFile('排球記錄表備份_'+today()+'_'+ms.length+'場.json',txt,'application/json');
}
''' + s[j:]

one("""    app.innerHTML=(view==='home'?homeHtml():view==='cup'?cupHtml():historyHtml())+cupSheetHtml()+importPlanHtml()+helpHtml()+staleHtml();""",
    """    app.innerHTML=(view==='home'?homeHtml():view==='cup'?cupHtml():historyHtml())+cupSheetHtml()+importPlanHtml()+(view==='history'?bkSheetHtml():'')+helpHtml()+staleHtml();""")
one("""    roll.forEach(function(q,i){var e=app.querySelector(q);if(e)e.scrollTop=keep[i]});\n""",
    """    roll.forEach(function(q,i){var e=app.querySelector(q);if(e)e.scrollTop=keep[i]});\n    if(ui.toTop){ui.toTop=false;var tp=app.querySelector('.page');if(tp)tp.scrollTop=0}\n""")

# 主畫面：還有幾場沒備份（部分備份後「上次備份」的時間會誤導）
one("""  if(db.matches.length)body+='<div class="bkrow"><span class="muted">比賽只存在這台裝置。'+(prefs.lastBackup?'上次備份 '+shortTime(prefs.lastBackup):'還沒備份過')+'，備份在「紀錄與名單」。</span></div>';""",
    """  var real=g.live.concat(g.done).filter(function(x){return !x.s.info.sample}),nb=real.filter(function(x){return !backedUp(x.m)}).length,lastBk=prefs.lastBackup||0;
  real.forEach(function(x){var t=prefs.bk&&prefs.bk[x.m.id];if(t>lastBk)lastBk=t});
  if(real.length)body+='<div class="bkrow"><span class="muted">比賽只存在這台裝置。'+(nb?'有 '+nb+' 場還沒備份':'都備份過了'+(lastBk?'（上次 '+shortTime(lastBk)+'）':''))+'，備份在「紀錄與名單」。</span></div>';""")

# 點擊
one("""    case 'rpall': saveFile(""", """    case 'bksel': ui.bkSel={ids:{}}; ui.bkOpt=null; ui.delMatch=null; ui.toTop=true; break;
    case 'bkpick': var bid=b.getAttribute('data-id'); if(ui.bkSel){if(ui.bkSel.ids[bid])delete ui.bkSel.ids[bid];else ui.bkSel.ids[bid]=true} break;
    case 'bkall': if(ui.bkSel){var ball=bkAll();ui.bkSel.ids={};if(!ball)bkList().forEach(function(x){ui.bkSel.ids[x.m.id]=true})} break;
    case 'bkcancel': ui.bkSel=null; ui.bkOpt=null; break;
    case 'bkgo': if(!ui.bkSel||!bkChosen().length)break; ui.bkOpt={}; bkCups(bkChosen()).forEach(function(c){ui.bkOpt[c.id]={teams:true,refs:true}}); break;
    case 'bkopt': var bo=ui.bkOpt&&ui.bkOpt[b.getAttribute('data-id')]; if(bo){var bv=b.getAttribute('data-v');bo[bv]=!bo[bv]} break;
    case 'bksave': bkSave(); return;
    case 'updnow': updGo(); return;
    case 'rpall': saveFile(""")
one("""view='history'; ui.delMatch=null; ui.importMsg=''; ui.importAsk=null; ui.importPlan=null; ui.cupSheet=null; break;""",
    """view='history'; ui.delMatch=null; ui.importMsg=''; ui.importAsk=null; ui.importPlan=null; ui.cupSheet=null; ui.bkSel=null; ui.bkOpt=null; break;""")
one("""      db.currentId=null; save(); view='home'; ui.delMatch=null; ui.sheet=null; break;""",
    """      db.currentId=null; save(); view='home'; ui.delMatch=null; ui.sheet=null; ui.bkSel=null; ui.bkOpt=null; break;""")
one("""ui.ptErr=''; ui.cupSheet=null; break;""", """ui.ptErr=''; ui.cupSheet=null; ui.bkOpt=null; break;""")
one("""'[data-act=kpclose]','[data-act=del-no]'];""", """'[data-act=kpclose]','[data-act=del-no]','[data-act=bkcancel]'];""")

# ---------- 有新版時提示 ----------
one("""function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(prefs))}catch(e){}}\n""",
    r"""function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(prefs))}catch(e){}}
/* ========== 11/11 有新版時提示（使用者）==========
   連上網路時問網站 version.json 現在是哪一版，和這頁不一樣就在上方提示；按「更新」才重新載入，按「稍後」先收起來，主畫面最下面還能按。
   一局正在打、正在打字、面板開著時先不出現，免得打斷記錄。每按一下都已經存好，重新載入後回到同一個畫面 */
var BUILD_ID=String(BUILD).replace(/^\D+/,'');
var upd={to:'',later:false,last:0,live:false,going:false,done:'',retry:''},updEl=null;
try{var updTry=sessionStorage.getItem(KEY+'-updto');sessionStorage.removeItem(KEY+'-updto');if(updTry){if(updTry===BUILD_ID)upd.done=updTry;else upd.retry=updTry}}catch(e){}
function updCheck(force){
  if(!/^https?:$/.test(location.protocol)||!window.fetch||navigator.onLine===false)return;
  var now=Date.now();if(!force&&now-upd.last<60000)return;upd.last=now;
  fetch('version.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(v){
    var b=v&&typeof v.build==='string'&&/^\d{4}-\d{4}$/.test(v.build)?v.build:'';if(!b)return;
    var to=b===BUILD_ID?'':b;if(to===upd.to)return;
    upd.to=to;upd.later=false;updSync();if(view==='home')render();
  }).catch(function(){});
}
function updBusy(){
  var a=document.activeElement,t=a&&a.tagName;
  if(t==='TEXTAREA'||t==='SELECT'||(a&&a.isContentEditable)||(t==='INPUT'&&!/^(button|submit|reset|checkbox|radio|file|range|color|image)$/i.test(a.type||'')))return true;
  if(staleTab||ui.help||ui.timer||ui.bkOpt||ui.report)return true;
  if(app.querySelector('.scrim,.sheet,.kp,.tpop,.help,.stale,.fsv,.whv,.rv'))return true;
  return !!upd.live;
}
function updPlace(){var b=app.querySelector('.bar'),r=b&&b.getBoundingClientRect();updEl.style.top=r&&r.height?Math.round(r.bottom+8)+'px':''}
function updSync(){
  if(!updEl)return;
  var busy=updBusy(),h='';
  if(upd.going)h='<span class="updtx"><b>更新中…</b></span>';
  else if(upd.to&&!upd.later&&!busy)h='<span class="updtx">'+(upd.retry===upd.to?'<b>還沒更新成功</b>，網路順的時候再按一次「更新」。':'<b>有新版本</b>（'+esc(upd.to)+'）。比分和紀錄都存好了，方便時按「更新」。')+'</span><span class="updbtns"><button class="go" data-upd="go">更新</button><button data-upd="later">稍後</button></span>';
  else if(upd.done&&!busy){h='<span class="updtx"><b>已更新到新版本</b>（'+esc(upd.done)+'）</span>';if(!upd.doneT)upd.doneT=setTimeout(function(){upd.done='';updSync()},4000)}
  if(updEl._h!==h){updEl._h=h;updEl.innerHTML=h}
  updEl.hidden=!h;if(h)updPlace();
}
function updLink(){return upd.to&&!upd.going?'<button class="updlink" data-act="updnow"><b>有新版本 '+esc(upd.to)+'</b>　按這裡更新</button>':''}
function updGo(){
  if(!upd.to||upd.going)return;
  upd.going=true;updSync();if(view==='home')render();
  try{sessionStorage.setItem(KEY+'-updto',upd.to);sessionStorage.setItem(KEY+'-back',JSON.stringify({at:Date.now(),view:view,page:ui.page,from:ui.from||null,cup:cupView.id,div:cupView.div}))}catch(e){}
  var done=false;function go(){if(!done){done=true;location.reload()}}
  setTimeout(go,8000);
  try{
    var sw=navigator.serviceWorker;if(!sw||!sw.controller||!sw.getRegistration){go();return}
    sw.getRegistration().then(function(r){
      if(!r){go();return}
      return r.update().then(function(){var w=r.installing;if(!w){go();return}
        w.addEventListener('statechange',function(){if(w.state==='activated'||w.state==='redundant')go()})});
    }).catch(go);
  }catch(e){go()}
}
function updStart(){
  updEl=document.createElement('div');updEl.className='updbar';updEl.setAttribute('role','status');updEl.hidden=true;document.body.appendChild(updEl);
  updEl.addEventListener('click',function(e){var b=e.target.closest('[data-upd]');if(!b)return;if(b.getAttribute('data-upd')==='go')updGo();else{upd.later=true;updSync()}});
  document.addEventListener('focusin',function(){setTimeout(updSync,0)});
  document.addEventListener('focusout',function(){setTimeout(updSync,80)});
  addEventListener('resize',function(){if(!updEl.hidden)updPlace()});
  addEventListener('online',function(){updCheck(true)});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')updCheck()});
  setInterval(function(){if(document.visibilityState==='visible')updCheck()},1800000);
  setTimeout(function(){updCheck(true)},2500);
}
""")
one("""function draw(){\n  document.documentElement.classList.toggle('nohint',prefs.hints===false);\n""",
    """function draw(){\n  document.documentElement.classList.toggle('nohint',prefs.hints===false);\n  upd.live=false;\n""")
one("""  syncAwake(ui.page==='play'&&s.sets[s.setNo].started&&!matchOver(s));\n""",
    """  syncAwake(ui.page==='play'&&s.sets[s.setNo].started&&!matchOver(s));\n  upd.live=ui.page==='play'&&s.sets[s.setNo].started&&!setWinner(s)&&!matchOver(s);\n""")
one("""  if(kbd&&(had||topLayer()))restoreFocus(fk);\n}""", """  if(kbd&&(had||topLayer()))restoreFocus(fk);\n  updSync();\n}""")
one("""+(offlineReady?'<p class="offok">已可離線使用</p>':'')+'<button class="verbtn" data-act="ver">""",
    """+(offlineReady?'<p class="offok">已可離線使用</p>':'')+updLink()+'<button class="verbtn" data-act="ver">""")

# 重新載入後回到原本的畫面，再開始問新版
assert s.rstrip().endswith("render();\n})();\n</script>"), s[-60:]
k = s.rindex("\nrender();\n})();")
s = s[:k] + r"""
/* 11/11 按「更新」重新載入後回到原本的畫面（比賽中本來就會回到比賽） */
(function(){
  var b=null;try{b=JSON.parse(sessionStorage.getItem(KEY+'-back')||'null');sessionStorage.removeItem(KEY+'-back')}catch(e){}
  if(!b||!(Date.now()-(b.at||0)<120000))return;
  if(b.view==='history'){view='history';return}
  if(b.view==='cup'&&db.cups.some(function(c){return c.id===b.cup})){cupView={id:b.cup,div:CUP_DIVS.indexOf(b.div)>=0?b.div:CUP_DIVS[0],grp:''};view='cup';return}
  if(b.view==='setup'){var m=current(),st=m?safeReduce(m):null;if(!st)return;view='setup';ui.from=b.from||null;
    ui.page=(st.sets[1].started&&!matchOver(st))||['info','refs','roster','toss','lineup','play'].indexOf(b.page)<0?firstPage(st):b.page}
})();
updStart();""" + s[k:]

# ---------- CSS ----------
assert s.count('</style>') == 1
s = s.replace('</style>', r"""/* 11/11 勾選比賽再備份 */
.bkpick{display:flex;flex-direction:column;gap:8px}
.bktools{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:1fr 1fr 2fr;gap:8px;padding:6px 0 8px;background:var(--bg)}
.bktools button{min-height:50px;font-size:16px;padding:0 6px;white-space:nowrap}
@media (max-width:380px){.bktools button{font-size:14px;padding:0 3px}}
.hrow.bkone{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;column-gap:12px;padding:10px 6px;color:var(--ink)}
.hrow.bkone[aria-pressed="true"]{background:var(--panel)}
.bkbox{width:30px;height:30px;box-sizing:border-box;border:2px solid var(--muted);border-radius:7px;background:var(--panel);display:flex;align-items:center;justify-content:center;font:900 19px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--panel)}
.bkone[aria-pressed="true"] .bkbox{background:var(--ink);border-color:var(--ink)}
.bkone[aria-pressed="true"] .bkbox::after{content:"\2713"}
.bktx{display:flex;flex-direction:column;gap:2px;min-width:0}
.bktx .pill{font-style:normal}
/* 11/11 有新版時的提示：浮在上方，不推動畫面；正在打字、面板開著、一局正在打時不出現 */
.updbar{position:fixed;z-index:30;left:50%;top:calc(var(--safe-top,0px) + 10px);transform:translateX(-50%);width:min(560px,calc(100vw - 24px));box-sizing:border-box;display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px;padding:10px 12px;background:var(--panel);color:var(--ink);border:2px solid var(--accent);border-radius:14px;box-shadow:0 8px 24px rgba(8,24,40,.3);font-size:16px;line-height:1.45}
.updbar[hidden]{display:none}
.updtx{flex:1 1 220px;min-width:0}
.updbtns{display:flex;gap:8px;flex:none;margin-left:auto}
.updbtns button{min-height:48px;padding:0 18px;font-size:16px}
.updlink{align-self:center;min-height:48px;font-size:15px;background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
@media print{.updbar{display:none!important}}
</style>""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v60 ok')

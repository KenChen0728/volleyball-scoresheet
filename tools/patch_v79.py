# 11/12 晚上使用者（語音）：比賽中「其他」→「離開這場比賽」裡不要有刪除，免得點到。
# 改成跟手機的相簿一樣：「紀錄與名單」按「選擇」，勾好比賽，下面一排能做的事：備份、移到資料夾、印紙本、刪除（紅框，再確認一次）。
# 原本的「賽前紙本記錄表」那一段併進「選擇」。學校版沒有印紙本。
# 用法：python3 tools/patch_v79.py（改原始檔和學校版的 help.json）
import json
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
SCHOOL_HELP = '/home/claude/volleyball-scoresheet/tools/school/help.json'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:80])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'selSheetHtml' not in t, 'already'

# 1. 離開這場比賽：拿掉刪除
t = one(t, "<button class=\"dellink\" data-act=\"leavedel\">刪除這場比賽</button>';", "';")

# 2. 紀錄與名單：賽前紙本那一段併進「選擇」；移動、刪除後的訊息寫在清單上面
t = one(t, "+(XP_ON?'<section><h2>賽前紙本記錄表</h2><button class=\"ppone\" data-act=\"ppsel\">選擇要印的比賽</button></section>':'')", "")
t = one(t, "<div id=\"rvmsg\" class=\"muted\" role=\"status\"></div>", "<div id=\"rvmsg\" class=\"muted\" role=\"status\">'+esc(ui.selMsg||'')+'</div>")

# 3. 選擇模式：下面一排能做的事
old_pick = t[t.index('function bkPickHtml(){'):t.index('function bkSheetHtml(){')]
new_pick = r'''function bkPickHtml(){
  var l=bkList(),n=l.filter(function(x){return ui.bkSel.ids[x.m.id]}).length,all=n===l.length&&n>0,dis=n?'':' disabled';
  return '<section class="bkpick"><h2>選擇比賽</h2><p class="muted">點比賽打勾，再點一次取消。選好按下面要做的事。</p><div class="bktools"><button data-act="bkall">'+(all?'全不選':'全選')+'</button><button data-act="bkcancel">取消</button></div>'+(l.length?'<div class="rlist">'+l.map(bkRow).join('')+'</div>':'<p class="note">還沒有比賽。</p>')+'</section>'+
    '<div class="selbar"><p class="selcount" role="status">'+(n?'已選 '+n+' 場':'還沒選比賽')+'</p><div class="selacts'+(XP_ON?'':' three')+'"><button data-act="bkgo"'+dis+'>備份</button><button data-act="selmove"'+dis+'>移到資料夾</button>'+(XP_ON?'<button data-act="selpp"'+dis+'>印紙本</button>':'')+'<button class="seldel" data-act="seldel"'+dis+'>刪除</button></div></div>';
}
/* 11/12 選好的比賽：移到資料夾、刪除（刪除會列出是哪幾場、打到哪裡、有沒有備份，再確定一次） */
function selSheetHtml(){
  var x=ui.sheet;if(!x||!ui.bkSel||(x.type!=='selmove'&&x.type!=='seldel'))return '';
  var ms=bkChosen(),h='';
  if(x.type==='selmove'){
    var cur=ms.length&&ms.every(function(q){return (q.cup||'')===(ms[0].cup||'')})?(ms[0].cup||''):null;
    var opt=function(id,name){return '<button class="hrow" data-act="selmoveto" data-id="'+esc(id)+'"'+(cur===id?' aria-current="true"':'')+'><span>'+esc(name)+'</span>'+(cur===id?'<span class="muted">（現在在這裡）</span>':'')+'</button>'};
    h='<h2>移到資料夾</h2><p class="muted">已選 '+ms.length+' 場，要放進哪個資料夾？</p>'+(db.cups.length?'':'<p class="note">還沒有資料夾。到「紀錄與名單」最上面新增資料夾。</p>')+'<div class="rlist selmove">'+db.cups.map(function(c){return opt(c.id,c.name)}).join('')+opt('','不放資料夾（未分類）')+'</div><button data-act="close">取消</button>';
  }else{
    var nb=ms.filter(function(q){return !backedUp(q)}).length;
    h='<h2>刪除 '+ms.length+' 場比賽？</h2><div class="rlist dellist">'+ms.map(function(q){var s=safeReduce(q),T=matchTitle(s),st=!s.sets[1].started?'還沒開賽':matchOver(s)?'打完了':'還沒打完';
      return '<div class="hrow"><span class="hnames"><span>'+esc(T[0])+'</span><b>'+setsText(s)+'</b><span>'+esc(T[1])+'</span></span><span class="muted">'+st+(backedUp(q)?'':'・還沒備份')+'</span></div>'}).join('')+'</div>'+
      '<p class="muted">記錄表會一起消失，無法復原。'+(nb?'其中 '+nb+' 場還沒備份，要保留的話先按「備份」。':'')+'</p><div class="row"><button data-act="close">取消</button><button class="danger" data-act="seldelyes">確定刪除 '+ms.length+' 場</button></div>';
  }
  return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="'+(x.type==='selmove'?'移到資料夾':'刪除比賽')+'">'+h+'</div>';
}
'''
t = t.replace(old_pick, new_pick)

# 4. 畫面：紀錄與名單多一個彈出視窗
t = one(t, "(view==='history'?bkSheetHtml()+(XP_ON?ppSheetHtml():''):'')", "(view==='history'?bkSheetHtml()+(XP_ON?ppSheetHtml():'')+selSheetHtml():'')")

# 5. 按鈕
t = one(t, "    case 'bksel': ui.bkSel={ids:{}}; ui.bkOpt=null; ui.delMatch=null; ui.toTop=true; break;\n",
        "    case 'bksel': ui.bkSel={ids:{}}; ui.bkOpt=null; ui.delMatch=null; ui.selMsg=''; ui.toTop=true; break;\n")
t = one(t, "    case 'bksave': bkSave(); return;\n",
        "    case 'bksave': bkSave(); return;\n"
        "    case 'selmove': if(ui.bkSel&&bkChosen().length)ui.sheet={type:'selmove'}; break;\n"
        "    case 'selmoveto':\n"
        "      var mto=b.getAttribute('data-id')||'',mms=bkChosen(),mcup=mto?db.cups.filter(function(q){return q.id===mto})[0]:null;\n"
        "      mms.forEach(function(q){if(mto)q.cup=mto;else delete q.cup;var qs=safeReduce(q);if(qs)addMatchRefs(q,qs)});\n"
        "      ui.sheet=null; ui.bkSel=null; ui.selMsg='已把 '+mms.length+' 場'+(mcup?'移到「'+mcup.name+'」':'改成未分類'); save(); break;\n"
        "    case 'selpp':\n"
        "      if(!ui.bkSel)break; var spick={},sch=bkChosen(); sch.forEach(function(q){spick[q.id]=1});\n"
        "      var spl=ppList(),sok=spl.filter(function(q){return spick[q.m.id]}); ui.sheet={type:'pp',ids:{},skip:sch.length-sok.length}; sok.forEach(function(q){ui.sheet.ids[q.m.id]=1}); break;\n"
        "    case 'seldel': if(ui.bkSel&&bkChosen().length)ui.sheet={type:'seldel'}; break;\n"
        "    case 'seldelyes':\n"
        "      var dms=bkChosen(),dids={}; dms.forEach(function(q){dids[q.id]=1});\n"
        "      db.matches=db.matches.filter(function(q){return !dids[q.id]}); if(db.currentId&&dids[db.currentId])db.currentId=null;\n"
        "      ui.sheet=null; ui.bkSel=null; ui.selMsg='已刪除 '+dms.length+' 場比賽'; save(); break;\n")

# 6. 印紙本：選的比賽裡已經開打的不能印，寫出略過幾場
t = one(t, "'<p class=\"subhint\">點要印的比賽。填了什麼就印什麼，A、B 和各局留白。</p>",
        "'<p class=\"subhint\">點要印的比賽。填了什麼就印什麼，A、B 和各局留白。</p>'+(x.skip?'<p class=\"muted\">已經開打的比賽不能印賽前紙本，略過 '+x.skip+' 場。</p>':'')+'")

t = one(t, "if(!pl.length)return h+'<p class=\"note\">沒有還沒挑邊的比賽。",
        "if(!pl.length)return h+(x.skip?'<p class=\"muted\">選的比賽都已經開打了，不能印賽前紙本。</p>':'')+'<p class=\"note\">沒有還沒挑邊的比賽。")

# 7. 說明
t = one(t, '{"img": "bksel", "t": "選要備份的比賽", "d": "按「打完的比賽」旁的「選擇」，點比賽打勾，再點一次取消。要全部就按「全選」，選好按「備份」。進行中的比賽也列在這裡。"}',
        '{"img": "bksel", "t": "選擇比賽", "d": "按「打完的比賽」旁的「選擇」，點比賽打勾，再點一次取消，要全部就按「全選」。選好按下面的「備份」「移到資料夾」「印紙本」或「刪除」。進行中的比賽也列在這裡。"}')
t = one(t, '要先印紙本記錄表，在名單頁按「印紙本記錄表」，或到「紀錄與名單」一次選好幾場。',
        '要先印紙本記錄表，在名單頁按「印紙本記錄表」，或到「紀錄與名單」按「選擇」一次選好幾場。')

# 8. 樣式
CSS = ("/* 11/12 選擇比賽：下面一排能做的事，刪除是紅框 */\n"
       ".selbar{position:sticky;bottom:0;z-index:4;background:var(--bg);padding:8px 0 calc(8px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:6px;box-shadow:0 -1px 0 var(--line);margin-top:8px}\n"
       ".selcount{margin:0;font-size:14px;color:var(--muted);font-weight:700;text-align:center}\n"
       ".selacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}\n"
       ".selacts.three{grid-template-columns:repeat(3,minmax(0,1fr))}\n"
       ".selacts button{min-height:48px;padding:0 4px;font-size:15px;white-space:nowrap}\n"
       ".selacts .seldel:not(:disabled){color:var(--bad);border:2px solid var(--bad);background:transparent}\n"
       ".dellist .hrow{display:flex;flex-direction:column;align-items:flex-start;gap:2px;cursor:default}\n"
       ".selmove .hrow{justify-content:space-between}\n")
t = one(t, '</style>', CSS + '</style>')
open(SRC, 'w', encoding='utf-8').write(t)
print('patched', SRC)

# 學校版的說明（沒有印紙本）
h = open(SCHOOL_HELP, encoding='utf-8').read()
a = '"t": "選要備份的比賽",\n    "d": "按「打完的比賽」旁的「選擇」，點比賽打勾，再點一次取消。要全部就按「全選」，選好按「備份」。進行中的比賽也列在這裡。"'
h = one(h, a, '"t": "選擇比賽",\n    "d": "按「打完的比賽」旁的「選擇」，點比賽打勾，再點一次取消，要全部就按「全選」。選好按下面的「備份」「移到資料夾」或「刪除」。進行中的比賽也列在這裡。"')
json.loads(h)
open(SCHOOL_HELP, 'w', encoding='utf-8').write(h)
print('patched', SCHOOL_HELP)

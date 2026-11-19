#!/usr/bin/env python3
"""11/20 首頁精簡（使用者 00:27 手機：跟賽事與紀錄重複、太長；場地要用選單或彈出視窗切換）：
- 有賽程時首頁不放資料夾卡片（那是賽事與紀錄的事）；完全沒有賽程才放，平板右邊才不會空。
- 場地改成一顆「場地：甲 ▾」，點了跳出視窗選；只有一個場地不顯示。
- 手機列接下來 3 場、平板 6 場，其他按「全部賽程」。先跑 patch_v97～v111。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'hcourtpick' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""    var chips=cs.length>1?'<div class="hcourts" role="group" aria-label="選場地">'+[''].concat(cs).map(function(q){return '<button data-act="hcourt" data-cup="'+esc(c.id)+'" data-v="'+esc(q)+'" aria-pressed="'+(pick===q)+'">'+(q?'場地：'+esc(q):'全部')+'</button>'}).join('')+'</div>':'';""",
"""    var chips=cs.length>1?'<button class="hcourtbtn" data-act="hcourtpick" data-cup="'+esc(c.id)+'" aria-haspopup="dialog"><span>'+(pick?'場地：'+esc(pick):'全部場地')+'</span><b aria-hidden="true">▾</b></button>':'',lim=innerWidth>=760?6:3;""")
one("""'<div class="rlist">'+td.slice(0,6).map(function(it,i){""","""'<div class="rlist">'+td.slice(0,lim).map(function(it,i){""")
one("""'</div>'+(td.length>6?'<p class="muted">還有 '+(td.length-6)+' 場，按「全部賽程」看。</p>':'')+'</section>'});
  if(db.cups.length)out+=cupHomeHtml();""","""'</div>'+(td.length>lim?'<p class="muted">還有 '+(td.length-lim)+' 場，按「全部賽程」看。</p>':'')+'</section>'});
  if(db.cups.length){if(!out)out+=cupHomeHtml()} // 有賽程就不放資料夾（賽事與紀錄裡有）""")
one("""    case 'hcourt': var hcm2={};""","""    case 'hcourtpick': var hpc=db.cups.filter(function(q){return q.id===b.getAttribute('data-cup')})[0];if(hpc){cupView.id=hpc.id;ui.cupSheet={type:'hcourt',cup:hpc.id}} break;
    case 'hcourt': ui.cupSheet=null; var hcm2={};""")
one("""  else if(x.type==='more')h=""","""  else if(x.type==='hcourt'){var hcc=db.cups.filter(function(q){return q.id===x.cup})[0],hts=hcc?schedTodo(hcc):[],hcs=[],hcur='';try{hcur=(JSON.parse(localStorage.getItem(KEY+'-hcourt')||'{}')||{})[x.cup]||''}catch(e){}
    hts.forEach(function(it){if(it.court&&hcs.indexOf(it.court)<0)hcs.push(it.court)});hcs.sort(function(a,b){return a.localeCompare(b,'zh-Hant',{numeric:true})});if(hcs.indexOf(hcur)<0)hcur='';
    h='<h2>這台記錄哪個場地？</h2><p class="muted">首頁只列這個場地的比賽，這台會記住。</p>'+[''].concat(hcs).map(function(q){var n=hts.filter(function(it){return !q||it.court===q}).length;return '<button class="imp" data-act="hcourt" data-cup="'+esc(x.cup)+'" data-v="'+esc(q)+'" aria-pressed="'+(hcur===q)+'"><span>'+(q?'場地：'+esc(q):'全部場地')+'</span><small>'+n+' 場</small></button>'}).join('')+'<button class="ghost" data-act="close">取消</button>'}
  else if(x.type==='more')h=""")
one(".hcourts{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 8px}",""".sheet .dellink,.sheet .dellink:last-child{align-self:stretch} /* 刪除和其他按鈕一樣寬（使用者 00:28） */
.hcourtbtn{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:48px;margin:4px 0 8px;padding:0 14px;background:var(--field);border:1px solid var(--field-edge);font-size:16px}
.hcourtbtn b{font-weight:400;color:var(--muted)}""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v112')

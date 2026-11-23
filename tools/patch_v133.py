#!/usr/bin/env python3
"""11/23 使用者：正式版和測試版一樣時，測試版主畫面寫「目前沒有測試中的功能」，有「前往正式版」。先跑 patch_v132。
- 只在網址有 /beta/ 時：開主畫面時讀 ../version.json，正式版的 ver 和這頁一樣就顯示（之後有新的測試版，號碼不同就自己消失）
- 不整頁擋住：朋友記在測試版的比賽還要能備份；按「繼續用測試版」收起來（這次開著的時候）
- 放在主畫面標題上面，手機、平板一打開就看得到；比賽中、其他頁不出現"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function betaNoteHtml' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""<div class="heroball">'+BALL+'</div><h1>排球<br>記錄表</h1>""","""<div class="heroball">'+BALL+'</div>'+betaNoteHtml()+'<h1>排球<br>記錄表</h1>""")
one("""function importAskHtml(){""","""/* 11/23 測試版和正式版一樣時，提醒改用正式版 */
var betaNote={on:false,hide:false,asked:false};
function betaNoteCheck(){if(betaNote.asked||!/\\/beta\\//.test(location.pathname)||!window.fetch||!/^https?:$/.test(location.protocol))return;betaNote.asked=true;
  try{if(sessionStorage.getItem(KEY+'-betanote')==='hide')betaNote.hide=true}catch(e){}
  fetch('../version.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(v){if(v&&v.ver&&v.ver===BUILD_ID){betaNote.on=true;if(view==='home')render()}}).catch(function(){})}
function betaNoteHtml(){betaNoteCheck();if(!betaNote.on||betaNote.hide)return '';
  return '<div class="betanote" role="status"><b>目前沒有測試中的功能</b><p>請改用正式版。測試版的比賽不會帶過去，要的話先備份，再到正式版匯入。</p><div class="row"><a class="btn primary" href="../">前往正式版</a><button data-act="betanotehide">繼續用測試版</button></div></div>'}
function importAskHtml(){""")
# 按鈕
one("""    case 'aboutclose': ui.about=null; break;""","""    case 'aboutclose': ui.about=null; break;
    case 'betanotehide': betaNote.hide=true;try{sessionStorage.setItem(KEY+'-betanote','hide')}catch(e){} break;""")
one(""".sctkp>button.sctkdel{grid-column:span 2}""",""".sctkp>button.sctkdel{grid-column:span 2}
.betanote{position:relative;z-index:1;display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:12px;background:var(--card);color:var(--ink);border:2px solid var(--ok);box-shadow:0 4px 14px rgba(0,0,0,.12)}
.betanote b{font-size:17px}.betanote p{margin:0;font-size:14px;line-height:1.5;color:var(--muted)}
.betanote .row{display:flex;gap:8px;flex-wrap:wrap}.betanote .row>*{flex:1 1 140px;min-height:44px}
.betanote a.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:var(--r);font-weight:700}
.hero .betanote p{max-width:none}.hero:has(.betanote){justify-content:flex-start}
@media (max-height:500px){.betanote{padding:8px 10px;gap:6px}.betanote p{display:none}.betanote b{font-size:15px}}""")
open(SRC,'w',encoding='utf8').write(s)
print('v133 ok')

#!/usr/bin/env python3
"""11/21 凌晨使用者實測正式版（語音）找到的問題。先跑 patch_v97～v124。
- A6：兩隊都選好後，點上面已經填好的格子沒反應（綠框被「已選」的白框樣式蓋掉）
- A8：時間衝突、重複對戰的提醒太長，手機上「回去修改」被擠到視窗外面又捲不動：
  同一場撞到的原因合成一行；有提醒時先收起隊伍清單，視窗可以捲
- A13：打完的比賽「從名冊補姓名」只放在「結果」分頁，賽前沒收後停在別的分頁就看不到：改放在分頁上面，每個分頁都看得到
- 名冊打三位數背號：「第 3 行看不懂」改成「第 3 行看不懂：背號只能 0～99」"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function schedWhy' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

# A6
one(".scslot.on strong{font-size:16px;font-weight:700}",".scslot.on strong{font-size:16px;font-weight:700}\n.scslot.cur,.scslot.on.cur{border:2px solid var(--ok);background:var(--ok-soft);color:var(--ink)}")
# A8：一場一行
one("""function schedConflicts(c,id,g){
  var out=[],nos=schedNos(c),tm=String(g.time||'').trim(),ck=courtKey(g.court);
  if(g.t1&&g.t2)liveSched(c).forEach(function(o){if(o.id===id||!(o.t1===g.t1&&o.t2===g.t2||o.t1===g.t2&&o.t2===g.t1))return;
    out.push('「'+schedTeam(c,g.t1).team.name+'」和「'+schedTeam(c,g.t2).team.name+'」已經排過一場：'+o.division+'第 '+nos[o.id]+' 場（'+schedDay(o.date)+' '+(o.time||'時間未定')+(o.court?'，場地：'+o.court:'')+'）')});
  if(!tm)return out;
  liveSched(c).forEach(function(o){if(o.id===id||o.date!==g.date||o.time!==tm)return;var nm=o.division+'第 '+nos[o.id]+' 場（'+(schedSide(c,o,'t1').name||'待定')+' vs '+(schedSide(c,o,'t2').name||'待定')+'）';
    if(ck&&courtKey(o.court)===ck)out.push('這個時間「場地：'+o.court+'」已經有'+nm);
    ['t1','t2'].forEach(function(k){var t=g[k]&&schedTeam(c,g[k]);if(t&&(o.t1===g[k]||o.t2===g[k]))out.push('「'+t.team.name+'」這個時間在'+o.division+'第 '+nos[o.id]+' 場也有比賽')})});
  return out;
}""","""function schedConflicts(c,id,g){
  var out=[],nos=schedNos(c),tm=String(g.time||'').trim(),ck=courtKey(g.court);
  liveSched(c).forEach(function(o){if(o.id===id)return;var why=schedWhy(c,o,g,tm,ck);if(!why.length)return;
    out.push(o.division+'第 '+nos[o.id]+' 場　'+schedDay(o.date)+' '+(o.time||'時間未定')+(o.court?' '+o.court:'')+'：'+(schedSide(c,o,'t1').name||'待定')+' vs '+(schedSide(c,o,'t2').name||'待定')+'（'+why.join('、')+'）')});
  return out;
}
/* 跟另一場撞到的原因：同兩隊（不管哪天）、同時間同場地、同一隊同時間 */
function schedWhy(c,o,g,tm,ck){var w=[],pair=g.t1&&g.t2&&(o.t1===g.t1&&o.t2===g.t2||o.t1===g.t2&&o.t2===g.t1);if(pair)w.push('同兩隊');
  if(tm&&o.date===g.date&&o.time===tm){if(ck&&courtKey(o.court)===ck)w.push('同時間同場地');
    if(!pair)['t1','t2'].forEach(function(k){var t=g[k]&&schedTeam(c,g[k]);if(t&&(o.t1===g[k]||o.t2===g[k]))w.push('「'+t.team.name+'」同時間有比賽')})}
  return w}""")
one("function scWarnTitle(w){var d=w.some(function(q){return /已經排過/.test(q)}),t=w.some(function(q){return !/已經排過/.test(q)});",
    "function scWarnTitle(w){var d=w.some(function(q){return /同兩隊/.test(q)}),t=w.some(function(q){return /同時間/.test(q)});")
one("""      '<div class="scteams">'+(ts.length?""","""      (x.warn?'':'<div class="scteams">'+(ts.length?""")
one("""      '</div>'+(f.t1&&f.t2?'':x.tbd""","""      '</div>')+(f.t1&&f.t2||x.warn?'':x.tbd""")
one("""x.type==='scedit'?' scsheet'+(x.pk?' scpkon':'')""","""x.type==='scedit'?' scsheet'+(x.pk||x.warn?' scpkon':'')""")
# A13：補姓名放到分頁上面
one("""(XP_ON?ctPage(s,'res'):ppResult(s))+(function(){var bf=bookFill(current(),s);return bf.length?'<div class="note bookfill">名冊上有 '+bf.length+' 位球員的姓名，記錄表上還空著（背號對得上的才補，已經填的不動）。<button data-act="bookfill">從名冊補姓名</button></div>':''})()+""",
    """(XP_ON?ctPage(s,'res'):ppResult(s))+""")
import re
k=s.index("\n  var wide=tab==='r6'||tab.charAt(0)==='s'?")+1
s=s[:k]+"""  if(over){var bfl=bookFill(current(),s);if(bfl.length)head+='<div class="note bookfill"><span>名冊上有 '+bfl.length+' 位的姓名可以補上</span><button data-act="bookfill">從名冊補姓名</button></div>'}\n"""+s[k:]
one(".bookfill{display:flex;flex-direction:column;gap:8px}",".bookfill{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.bookfill>button{flex:none;min-height:44px}")
# 三位數背號
one("""if(one1&&!/\\d/.test(c.join(''))){nonum(cur,c[0]);return}errors.push('第 '+(i+1)+' 行看不懂');return}""",
    """if(one1&&!/\\d/.test(c.join(''))){nonum(cur,c[0]);return}errors.push('第 '+(i+1)+' 行看不懂'+(/\\d{3,}/.test(c.join(' '))?'：背號只能 0～99':''));return}""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v125')

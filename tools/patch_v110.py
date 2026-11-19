#!/usr/bin/env python3
"""11/19 匯入資料夾：兩台各自建了同名的資料夾（編號不同），匯入時併進這台同名的，不再多一個（使用者 23:57 平板傳手機）。
隊伍照男女組＋隊名對上、賽程照日期＋時間＋場地＋男女組對上，比賽的資料夾也跟著換。匯入前的確認寫「併入這台同名的資料夾」。
先跑 patch_v97～v109。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'cupAlias' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("""function planCups(list){
  var out=[];""","""/* 同名的資料夾：把檔案裡的編號換成這台的，隊伍、賽程也照名稱和時間對上，之後照一般的一筆一筆比 */
function cupAlias(c){
  if(db.cups.some(function(q){return q.id===c.id}))return null;
  var nm=String(c.name||'').trim(),hs=db.cups.filter(function(q){return String(q.name||'').trim()===nm});if(!nm||!hs.length)return null;
  var h=hs.slice().sort(function(a,b){return (liveTeams(b).length+liveSched(b).length)-(liveTeams(a).length+liveSched(a).length)})[0];
  c=JSON.parse(JSON.stringify(c));var tm={},from=c.id;c.id=h.id;c.at=Math.min(c.at||0,h.at||0);
  (c.teams||[]).forEach(function(x){if(!x||!x.team||h.teams.some(function(q){return q.id===x.id}))return;
    var y=h.teams.filter(function(q){return q.team&&q.division===x.division&&q.team.name.trim()===String(x.team.name||'').trim()})[0];if(y){tm[x.id]=y.id;x.id=y.id}});
  (Array.isArray(c.sched)?c.sched:[]).forEach(function(x){if(!x)return;['t1','t2'].forEach(function(k){if(tm[x[k]])x[k]=tm[x[k]]});
    if(cupSched(h).some(function(q){return q.id===x.id}))return;
    var key=[x.date,x.time,courtKey(x.court),x.division].join('|'),y=liveSched(h).filter(function(q){return [q.date,q.time,courtKey(q.court),q.division].join('|')===key})[0];if(y){x.id=y.id;if(!x.mid&&y.mid)x.mid=y.mid}});
  return {c:c,from:from};
}
function planCups(list){
  var out=[];out.alias={};""")
one("""    if(!c||typeof c.id!=='string'||typeof c.name!=='string'||!Array.isArray(c.teams))return;""","""    if(!c||typeof c.id!=='string'||typeof c.name!=='string'||!Array.isArray(c.teams))return;
    var al=cupAlias(c);if(al){out.alias[al.from]=al.c.id;c=al.c}""")
one("""    var p={id:c.id,name:c.name,at:c.at||0,createdAt:c.createdAt||'',isNew:!h,""","""    var p={merged:!!al,id:c.id,name:c.name,at:c.at||0,createdAt:c.createdAt||'',isNew:!h,""")
one("if(c.isNew)a.push('新的資料夾');","if(c.isNew)a.push('新的資料夾');if(c.merged)a.push('併入這台同名的資料夾');")
one("function cupChanged(c){return c.isNew||","function cupChanged(c){return c.merged||c.isNew||")
# 比賽的資料夾跟著換
one("""      var valid=list.filter(validMatch),badN=list.length-valid.length,cups=planCups(o&&o.cups);""","""      var valid=list.filter(validMatch),badN=list.length-valid.length,cups=planCups(o&&o.cups);
      valid.forEach(function(im){if(im.cup&&cups.alias[im.cup])im.cup=cups.alias[im.cup]});""")
open(SRC,'w',encoding='utf8').write(s)
print('patched v110')

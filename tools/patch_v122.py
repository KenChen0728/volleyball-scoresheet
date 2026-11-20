#!/usr/bin/env python3
"""11/20 使用者和朋友聊：每次都存整個資料夾，檔案長得都一樣，不知道哪個存了什麼。
「存成檔案」先跳視窗列出隊伍名冊、賽程、裁判名單、比賽紀錄（幾隊、幾場…），可以勾掉；檔名寫存了什麼。
對方匯入時只合併檔案裡有的，沒存的那幾項不會被刪掉（匯入本來就是一筆一筆比）。先跑 patch_v97～v121。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function cupSaveParts' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

one("function cupSheetHtml(){","""/* 存成檔案可以選的內容：[代號, 名稱, 檔名用的短名, 數量文字] */
function cupSaveParts(c){var nr=courtList(c).length,ms=db.matches.filter(function(x){return x.cup===c.id}).length;
  return [['t','隊伍名冊','隊伍',liveTeams(c).length,liveTeams(c).length+' 隊'],['s','賽程','賽程',liveSched(c).length,liveSched(c).length+' 場'],['r','裁判名單','裁判',nr,nr+' 個場地'],['m','比賽紀錄','比賽',ms,ms+' 場']]}
function cupSaveName(c,sel){var ps=cupSaveParts(c),on=ps.filter(function(p){return sel[p[0]]});
  return String(c.name||'資料夾').replace(/[\\\\\\/:*?"<>|]/g,'').trim()+'_'+(on.length===ps.filter(function(p){return p[3]}).length?'資料夾':on.map(function(p){return p[2]}).join(''))+'_'+today()+'.json'}
function cupSheetHtml(){""")
one("""  else if(x.type==='more')h=""","""  else if(x.type==='save'){var ps=cupSaveParts(c),n=ps.filter(function(p){return x.sel[p[0]]}).length;
    h='<h2>存成檔案</h2><p class="muted">勾要存的內容。對方匯入後會合併到同名的資料夾，沒存的那幾項不會動到。</p><div class="rlist">'+ps.map(function(p){var on=!!x.sel[p[0]];
      return '<button class="hrow bkone" data-act="cupsvtog" data-v="'+p[0]+'" aria-pressed="'+on+'"'+(p[3]?'':' disabled')+'><span class="bkbox" aria-hidden="true"></span><span class="bktx"><strong>'+p[1]+'</strong><span class="muted">'+(p[3]?p[4]:'還沒有')+'</span></span></button>'}).join('')+'</div>'+
      (n?'<p class="muted cupsvname">檔名：'+esc(cupSaveName(c,x.sel))+'</p>':'')+'<div id="savemsg" class="muted" role="status"></div><div class="row scpbtns"><button class="ghost" data-act="close">取消</button><button class="primary" data-act="cupsvgo"'+(n?'':' disabled')+'>存成檔案</button></div>'}
  else if(x.type==='more')h=""")
one("""    case 'cupsave':
      var cf=theCup(),cl=db.matches.filter(function(x){return x.cup===cf.id});
      saveFile(cf.name+'_資料夾_'+today()+'.json',JSON.stringify({app:'volleyball-scoresheet',version:1,matches:cl,cups:[cf]}),'application/json'); return;""",
"""    case 'cupsave': var csl={};cupSaveParts(theCup()).forEach(function(q){if(q[3])csl[q[0]]=1});ui.cupSheet={type:'save',sel:csl}; break;
    case 'cupsvtog': if(ui.cupSheet&&ui.cupSheet.sel){var csv=b.getAttribute('data-v');if(ui.cupSheet.sel[csv])delete ui.cupSheet.sel[csv];else ui.cupSheet.sel[csv]=1} break;
    case 'cupsvgo':
      var cf=theCup(),sv=ui.cupSheet&&ui.cupSheet.sel||{},cl=sv.m?db.matches.filter(function(x){return x.cup===cf.id}):[],cc=JSON.parse(JSON.stringify(cf));
      if(!sv.t)cc.teams=[];if(!sv.s)cc.sched=[];if(!sv.r)cc.refs=[];
      saveFile(cupSaveName(cf,sv),JSON.stringify({app:'volleyball-scoresheet',version:1,matches:cl,cups:[cc]}),'application/json'); return;""")
one(".scpbtns>button{flex:1 1 0}",".scpbtns>button{flex:1 1 0}\n.cupsvname{overflow-wrap:anywhere}")
open(SRC,'w',encoding='utf8').write(s)
print('patched v122')

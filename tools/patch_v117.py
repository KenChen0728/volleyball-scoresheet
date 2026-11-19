#!/usr/bin/env python3
"""11/20 場地排序：甲、乙、丙…照天干排（原本照筆畫，乙跑到甲前面）；數字照大小、英文照字母。先跑 patch_v97～v116。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function courtSort' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
one("function cupSched(c){","""var TIANGAN='甲乙丙丁戊己庚辛壬癸';
function courtSort(a,b){a=String(a||'');b=String(b||'');var ka=a.replace(/[^甲乙丙丁戊己庚辛壬癸]/g,''),kb=b.replace(/[^甲乙丙丁戊己庚辛壬癸]/g,'');
  if(ka&&kb&&ka!==kb&&a.replace(ka,'')===b.replace(kb,''))return TIANGAN.indexOf(ka)-TIANGAN.indexOf(kb); // 甲、乙、丙…照天干
  return a.localeCompare(b,'zh-Hant',{numeric:true})}
function cupSched(c){""")
one("||(a.ord||0)-(b.ord||0)||String(a.court||'').localeCompare(String(b.court||''),'zh-Hant',{numeric:true})}","||(a.ord||0)-(b.ord||0)||courtSort(a.court,b.court)}")
one("function schedCourts(c){var cs=[];liveSched(c).forEach(function(x){if(x.court&&cs.indexOf(x.court)<0)cs.push(x.court)});return cs.sort(function(a,b){return a.localeCompare(b,'zh-Hant',{numeric:true})})}",
    "function schedCourts(c){var cs=[];liveSched(c).forEach(function(x){if(x.court&&cs.indexOf(x.court)<0)cs.push(x.court)});return cs.sort(courtSort)}")
one("var cs=[];td.forEach(function(it){if(it.court&&cs.indexOf(it.court)<0)cs.push(it.court)});cs.sort(function(a,b){return a.localeCompare(b,'zh-Hant',{numeric:true})});",
    "var cs=[];td.forEach(function(it){if(it.court&&cs.indexOf(it.court)<0)cs.push(it.court)});cs.sort(courtSort);")
one("hts.forEach(function(it){if(it.court&&hcs.indexOf(it.court)<0)hcs.push(it.court)});hcs.sort(function(a,b){return a.localeCompare(b,'zh-Hant',{numeric:true})});",
    "hts.forEach(function(it){if(it.court&&hcs.indexOf(it.court)<0)hcs.push(it.court)});hcs.sort(courtSort);")
open(SRC,'w',encoding='utf8').write(s)
print('patched v117')

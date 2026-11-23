#!/usr/bin/env python3
"""11/23 使用者 iPad 實測時間數字鍵（先跑 patch_v130）：
- 亂打（67:23、14:80）只寫「請打四個數字，例如 1517」看不懂 → 打不出不存在的時間：會變成錯的鍵變灰
  （第 1 位 0～2；第 1 位是 2 時第 2 位 0～3；第 3 位 0～5），萬一還是錯就寫「時間有誤：時 00～23、分 00～59」
- 打好四個數字沒按「確定」直接按「完成」，時間沒改 → 「完成」也套用打的時間；只打一半按「完成」提示還差幾個數字"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function scTkOk' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("""function scTkHtml(x){var b=x.tbuf||'',k='',i;
  for(i=1;i<=5;i++)k+='<button data-act="sctk" data-v="'+i+'"'+(b.length>=4?' disabled':'')+'>'+i+'</button>';""",
"""/* 下一位可以打哪些數字：時 00～23、分 00～59 */
function scTkOk(b,d){var n=b.length;if(n>=4)return false;if(n===0)return d<=2;if(n===1)return b[0]==='2'?d<=3:true;if(n===2)return d<=5;return true}
function scTkCheck(b){if(!b)return '請打四個數字';if(b.length<4)return '還差 '+(4-b.length)+' 個數字，例如 1517 是 15:17';var h=+b.slice(0,2),m=+b.slice(2);return h>23||m>59?'時間有誤：時 00～23、分 00～59':''}
function scTkHtml(x){var b=x.tbuf||'',k='',i;
  for(i=1;i<=5;i++)k+='<button data-act="sctk" data-v="'+i+'"'+(scTkOk(b,i)?'':' disabled')+'>'+i+'</button>';""")
one("""  [6,7,8,9,0].forEach(function(n){k+='<button data-act="sctk" data-v="'+n+'"'+(b.length>=4?' disabled':'')+'>'+n+'</button>'});""",
"""  [6,7,8,9,0].forEach(function(n){k+='<button data-act="sctk" data-v="'+n+'"'+(scTkOk(b,n)?'':' disabled')+'>'+n+'</button>'});""")
one("""    case 'sctk': if(x&&x.tin){x.tbuf=((x.tbuf||'')+b.getAttribute('data-v')).slice(0,4);x.tinErr=''} return true;""",
"""    case 'sctk': if(x&&x.tin&&scTkOk(x.tbuf||'',+b.getAttribute('data-v'))){x.tbuf=((x.tbuf||'')+b.getAttribute('data-v')).slice(0,4);x.tinErr=''} return true;""")
one("""      if(!tq||+tq[1]>23||+tq[2]>59){x.tinErr='請打四個數字，例如 1517 是 15:17';return true}""",
"""      if(!tq||+tq[1]>23||+tq[2]>59){x.tinErr=scTkCheck(tv)||'時間有誤：時 00～23、分 00～59';return true}""")
# 完成：正在打數字時，打好的時間也算數；打一半不關，說還差幾個
one("""    case 'scpkdone': if(x){if(x.pk==='time'&&x.f&&!x.f.time){""",
"""    case 'scpkdone': if(x){if(x.pk==='time'&&x.tin&&x.tbuf){var te=scTkCheck(x.tbuf);if(te){x.tinErr=te;return true}x.f.time=x.tbuf.slice(0,2)+':'+x.tbuf.slice(2);x.tin=false;x.tbuf='';x.tinErr='';x.warn=null}
      x.tin=false;if(x.pk==='time'&&x.f&&!x.f.time){""")
open(SRC,'w',encoding='utf8').write(s)
print('v131 ok')

#!/usr/bin/env python3
"""11/20 朋友排賽程一場 50 分鐘：「儲存，再新增下一場」的時間照同一天、同場地前兩場的間隔往後加（20～180 分鐘才算），
只有一場或看不出來時照舊加一小時。先跑 patch_v97～v120。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function schedGap' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
one("function schedNextTime(t){var m=String(t||'').match(/^(\\d{2}):(\\d{2})$/);if(!m)return '';var h=+m[1]+1;return h>23?'':('0'+h).slice(-2)+':'+m[2]}",
"""function schedMin(t){var m=String(t||'').match(/^(\\d{2}):(\\d{2})$/);return m?+m[1]*60+(+m[2]):null}
/* 這一場和同一天、同場地前一場差幾分鐘（20～180 才算），看不出來就是 60 */
function schedGap(c,it){var t=schedMin(it&&it.time);if(t===null||!c)return 60;var ck=courtKey(it.court),best=null;
  liveSched(c).forEach(function(o){if(o.id===it.id||o.date!==it.date||courtKey(o.court)!==ck)return;var u=schedMin(o.time);if(u!==null&&u<t&&(best===null||u>best))best=u});
  var g=best===null?60:t-best;return g>=20&&g<=180?g:60}
function schedNextTime(t,gap){var n=schedMin(t);if(n===null)return '';n+=gap||60;return n>=24*60?'':('0'+Math.floor(n/60)).slice(-2)+':'+('0'+n%60).slice(-2)}""")
one("time:same?schedNextTime(last.time):''","time:same?schedNextTime(last.time,schedGap(c,last)):''")
one("f:{date:it.date,time:schedNextTime(it.time),","f:{date:it.date,time:schedNextTime(it.time,schedGap(c,it)),")
open(SRC,'w',encoding='utf8').write(s)
print('patched v121')

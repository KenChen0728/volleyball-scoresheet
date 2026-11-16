#!/usr/bin/env python3
"""11/16 晚：觀看比賽改成比賽清單、記錄台看得到觀看裝置（改名稱、移除、更換代碼）。程式在 tools/v101-list.js。
先跑 patch_v97～v100。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function wlSync' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)
js=open('/home/claude/volleyball-scoresheet/tools/v101-list.js',encoding='utf8').read()
one('\nfunction render(){','\n'+js+'\nfunction render(){')
one('  if(share)syncTimer();\n','  if(share)syncTimer();\n  wlSync();wsmPaint();\n')
one('function escClose(){\n',"function escClose(){\n  var vq=app.querySelector('.sheet [data-act=vwno],.sheet [data-act=vwback]');if(vq){vq.click();return true} // 觀看裝置清單：先退一層\n")
one('<small>輸入代碼或掃描 QR code，觀看其他記錄台</small>','<small data-wsm>輸入代碼或掃描 QR code，觀看其他記錄台</small>',2)
CSS='''
/* 11/16 比賽清單、觀看裝置 */
.wlist,.wadd,.wname{display:flex;flex-direction:column;gap:8px}
.wrow{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
.wri{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.wri b{font-size:16px}.wri span{font-size:14px;font-weight:700}
.wri small{font-size:13px;color:var(--muted);font-weight:600}.wri small.bad{color:var(--del-ink,#B3261E)}
.wrb{flex:none;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.wrgo{min-height:44px;min-width:76px;font-weight:800;border:2px solid var(--ink);border-radius:10px;background:var(--panel);color:var(--ink)}
.wrgo[aria-disabled="true"]{border-style:dashed;color:var(--muted);border-color:var(--line)}
.wrx{min-height:44px;font-size:13px;font-weight:700;background:transparent;border:1px solid var(--line);border-radius:10px;color:var(--muted)}
.waddrow{display:flex;gap:8px;align-items:stretch}.waddrow .wcodein{flex:1;min-width:0}.waddrow .wgo{flex:none;min-width:84px}
.wnamein{width:100%;box-sizing:border-box;min-height:48px;font-size:17px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)}
.vwbtn{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--ink);font-weight:700}
.vwbtn span{flex:1;text-align:left}.vwbtn b{font-size:16px}.vwbtn i{font-style:normal;font-weight:800}
.vwrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
.vwrow.off{opacity:.92}.vwrow.off .vwi b{color:var(--muted)}
.vwi{flex:1;min-width:140px;display:flex;flex-direction:column;gap:2px}.vwi b{font-size:16px}.vwi small{font-size:13px;color:var(--muted);font-weight:600}.vwi small.ok{color:var(--ok-ink,var(--ok))}
.vwb{display:flex;gap:6px}.vwb button{min-height:44px;padding:0 12px;font-size:14px;font-weight:700}
.vwed{display:flex;gap:6px;width:100%}.vwed input{flex:1;min-width:0;min-height:44px;font-size:16px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)}
.vwed button{min-height:44px;padding:0 12px}
.shd .backbtn{min-height:44px;padding:0 10px;font-weight:700;flex:none}.shd .backbtn+h2{flex:1;min-width:0}
'''
one('\n</style>\n\n<div class="statusband"',CSS+'</style>\n\n<div class="statusband"')
open(SRC,'w',encoding='utf8').write(s)
print('patched v101')

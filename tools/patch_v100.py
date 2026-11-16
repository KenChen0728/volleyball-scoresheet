#!/usr/bin/env python3
"""11/16 觀看比賽可以在 App 裡掃描 QR code（程式在 tools/v100-qrscan.js，按鈕在 tools/v97-sync.js 的 watchAskHtml）。
先跑 patch_v97、v98、v99。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function qrDecode' in s or 'var qrDecode' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
js=open('/home/claude/volleyball-scoresheet/tools/v100-qrscan.js',encoding='utf8').read()
one('\nfunction render(){','\n'+js+'\nfunction render(){')
one('function escClose(){\n','function escClose(){\n  if(qs){qsClose();render();return true} // 掃描畫面開著：Esc、Android 返回鍵先關掃描\n')
CSS='''
/* 11/16 掃描 QR code */
.qsbtn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:56px;font-size:17px;font-weight:800;border:2px solid var(--ink);border-radius:12px;background:var(--panel);color:var(--ink)}
.qsbtn svg{width:24px;height:24px;flex:none}
.wcodein::placeholder{font-size:16px;letter-spacing:0;font-weight:600;color:var(--muted)}
.qscan{position:fixed;inset:0;z-index:2000;background:#000;color:#fff;overflow:hidden}
.qscan video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.qsframe{position:absolute;left:50%;top:50%;width:min(72vw,calc(100vh - 230px),340px);aspect-ratio:1;transform:translate(-50%,-50%);border:3px solid #fff;border-radius:18px;box-shadow:0 0 0 200vmax rgba(0,0,0,.45)}
.qsfail .qsframe{display:none}
.qstip{position:absolute;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));top:calc(env(safe-area-inset-top,0px) + 20px);margin:0 auto;max-width:520px;padding:10px 16px;border-radius:12px;background:rgba(0,0,0,.65);text-align:center;font-size:17px;font-weight:800;line-height:1.45}
.qstip.bad{background:#B3261E}
.qsfail .qstip{top:40%;transform:translateY(-50%)}
.qsbar{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:12px;padding:16px max(16px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 20px) max(16px,env(safe-area-inset-left,0px))}
.qsx{min-height:52px;min-width:120px;padding:0 22px;border:0;border-radius:26px;background:#fff;color:#111;font:inherit;font-size:17px;font-weight:800}
'''
one('\n</style>\n\n<div class="statusband"',CSS+'</style>\n\n<div class="statusband"')
open(SRC,'w',encoding='utf8').write(s)
print('patched v100')

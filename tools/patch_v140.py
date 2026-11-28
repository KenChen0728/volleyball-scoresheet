#!/usr/bin/env python3
"""11/28 晚 使用者：比賽中補登也可以補自由球員（測試版）。先跑 patch_v139。
名單頁補登模式時，空的自由球員格也能點；名單滿了（一般 12、自由 2）才不出現補登按鈕"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if "late&&!p?' disabled'" in s or '11/28 補登自由' in s:sys.exit('already patched')
def one(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
one("sl=t.locked&&!(late&&kind==='reg')?null:ui.slot[k]","sl=t.locked&&!late?null:ui.slot[k]")
one("(t.locked&&!(late&&kind==='reg'&&!p)?' disabled':'')","(t.locked&&!(late&&!p)?' disabled':'')/* 11/28 補登自由：自由格也能補 */")
one("return regularCount(t)<MAX_PLAYERS?'<button class=\"lateadd\"","return regularCount(t)<MAX_PLAYERS||t.liberos.length<MAX_LIBEROS?'<button class=\"lateadd\"")
one("<p>比賽已經開始。補上的球員會加進名單，之後可以替補上場。</p><p class=\"muted\">只能新增，原本的號碼不能改。</p>","<p>比賽已經開始。補上的球員會加進名單，之後可以替補上場；自由球員就點下面自由球員的空格。</p><p class=\"muted\">只能新增，原本的號碼不能改。</p>")
open(SRC,'w',encoding='utf8').write(s);print('ok')

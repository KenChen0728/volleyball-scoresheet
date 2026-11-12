#!/usr/bin/env python3
"""11/12 凌晨語音決定的小修（使用者說「小修直接改」，先放測試版）：
- 點球員選單的「換自由」灰掉時，下面寫一行原因（前排、I 號位要發球、自由球員已經在場上、沒有登錄或沒有可上的自由球員、
  剛換過要打完一球、判公正後要先發球）。自由球員自己的選單（換回、換自由）也一樣。
- 打完的比賽上方「全場 6 分」改成「全場 6 分鐘」（超過一小時寫「1 小時 5 分鐘」），排球裡「6 分」容易看成得分。
- 還寫「歷史紀錄」的兩個地方改成「紀錄與名單」（按鈕早就改名了）。
- 比賽資料頁下面的「回主畫面」（或回紀錄與名單、回資料夾）拿掉：左上角的「‹」去同一個地方，同一件事不放兩顆。
  比賽進行中下面的「離開這場比賽」照舊。
- 面板左上的「‹ 返回」加高到 44px（平板 44～48px），和其他按鈕一樣好按。
用法：python3 tools/patch_v69.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'class="pmwhy"' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 換自由灰掉的原因
one("""function canLib(c,k){return canPause(c)&&!c.replayLock&&(c.libRally[k]===null||c.libRally[k]<c.rally)}""",
    """function canLib(c,k){return canPause(c)&&!c.replayLock&&(c.libRally[k]===null||c.libRally[k]<c.rally)}
/* 自由球員現在不能換的原因（點球員選單裡灰掉的「換自由」「換回」下面寫出來） */
function libWait(c,k){return c.replayLock?'判公正後要先發球，發完才能換':c.libRally[k]!==null&&c.libRally[k]>=c.rally?'剛換過自由球員，要打完一球才能再換':'現在不能換自由球員'}""")
one("""      h=head+'<div class="pm3">'+big('pmlout','換回',lOk&&!!pc.libOut[k])+big(free.length===1?'pmlswap':'pmstep','換自由',lOk&&free.length>0,free.length===1?' data-no="'+free[0]+'"':' data-v="swap"')+big('pmpen','判罰',penOk,' data-no="'+pno+'"')+'</div>'+""",
    """      var lwhy=!lOk?'換回、換自由：'+libWait(pc,k):!free.length?'換自由：沒有另一位自由球員可以換':'';
      h=head+'<div class="pm3">'+big('pmlout','換回',lOk&&!!pc.libOut[k])+big(free.length===1?'pmlswap':'pmstep','換自由',lOk&&free.length>0,free.length===1?' data-no="'+free[0]+'"':' data-v="swap"')+big('pmpen','判罰',penOk,' data-no="'+pno+'"')+'</div>'+(lwhy?'<p class="pmwhy">'+lwhy+'</p>':'')+""")
one("""      var lAv=!pc.libOut[k]&&back&&free.length>0&&lOk;
      h=head+'<div class="pm3">'+big(free.length===1?'pmlin':'pmstep','換自由',lAv,free.length===1?' data-no="'+free[0]+'"':' data-v="lib"')+
        big('pmstep',!sOk&&eOk?'例外替補':'替補',sOk||eOk,' data-v="'+(sOk?'sub':'exc')+'"')+big('pmpen','判罰',penOk,' data-no="'+pno+'"')+'</div>'+""",
    """      var lAv=!pc.libOut[k]&&back&&free.length>0&&lOk;
      var lwhy=lAv?'':!back?(x.pos===0?'I 號位要發球，不能換自由球員':'前排的人不能換自由球員'):pc.libOut[k]?'自由球員已經在場上，一次只能一位':!t.liberos.length?'這隊沒有登錄自由球員':!free.length?'沒有可以上場的自由球員':libWait(pc,k);
      h=head+'<div class="pm3">'+big(free.length===1?'pmlin':'pmstep','換自由',lAv,free.length===1?' data-no="'+free[0]+'"':' data-v="lib"')+
        big('pmstep',!sOk&&eOk?'例外替補':'替補',sOk||eOk,' data-v="'+(sOk?'sub':'exc')+'"')+big('pmpen','判罰',penOk,' data-no="'+pno+'"')+'</div>'+(lwhy?'<p class="pmwhy">換自由：'+lwhy+'</p>':'')+""")
one(""".pmb:disabled{opacity:.4}""",
    """.pmb:disabled{opacity:.4}
.pmwhy{margin:-2px 0 0;font-size:15px;line-height:1.4;color:var(--muted)}""")

# 全場幾分鐘
one("""(md>=60?Math.floor(md/60)+' 時 ':'')+(md%60)+' 分')""",
    """(md>=60?Math.floor(md/60)+' 小時 ':'')+(md%60)+' 分鐘')""")

# 歷史紀錄 → 紀錄與名單
one("""比賽紀錄不會刪除，還在歷史紀錄裡。""", """比賽紀錄不會刪除，還在「紀錄與名單」裡。""")
one("""之後到主畫面的「歷史紀錄」可以再打開。""", """之後到主畫面的「紀錄與名單」可以再打開。""")

# 比賽資料頁下面重複的「回主畫面」
one("""(going?'<button class="danger full" data-act="sheet" data-v="leave">離開這場比賽</button>':'<button class="ghost full" data-act="'+(ui.from==='history'?'history':ui.from==='cup'?'cupback':'home')+'">回'+(ui.from==='history'?'紀錄與名單':ui.from==='cup'?'資料夾':'主畫面')+'</button>');""",
    """(going?'<button class="danger full" data-act="sheet" data-v="leave">離開這場比賽</button>':'');""")

# 面板的「‹ 返回」加高
one(""".sheet>.sheetback{align-self:flex-start;flex:none;width:auto;min-height:38px;""",
    """.sheet>.sheetback{align-self:flex-start;flex:none;width:auto;min-height:44px;""")
one("""  .shell.nonav~.sheet>.sheetback{font-size:clamp(15px,2.2vh,18px);min-height:clamp(38px,5.6vh,46px)}""",
    """  .shell.nonav~.sheet>.sheetback{font-size:clamp(15px,2.2vh,18px);min-height:clamp(44px,5.6vh,48px)}""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v69 ok')

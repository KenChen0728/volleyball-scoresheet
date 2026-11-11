#!/usr/bin/env python3
"""11/11 晚上 22:29 使用者：「其他」太擠，換人、比賽狀況、修正分得不明顯。
- 例外替補、重新指定自由球員、陣容、球衣顏色：原本每列兩隊按鈕，改成一顆按鈕，按了跳出「選哪一隊」。
  選完直接進原本的下一步，「‹ 返回」回到「其他」（選隊那一層不算，不會越疊越深）。
- 換人、比賽狀況、修正、設定每區用分隔線和間距分開。球在進行中時換人那區寫為什麼不能按。
- 修正那區：修正比分、陣容、挑邊一排，球衣顏色、查看名單一排。
用法：python3 tools/patch_v66.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import json, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'var MTEAM=' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 要先選隊的功能：[其他裡的按鈕, 選隊時的標題, 選完要做的動作, 動作要帶的屬性]
one("var BACK_BTN=",
    """var MTEAM={exc:['例外替補','例外替補','subopen',' data-m="exc"'],red:['重新指定自由球員','重新指定自由球員','redopen',''],fix:['陣容','修正陣容','fixopen',''],color:['球衣顏色','球衣顏色','sheet',' data-v="color"']};
var BACK_BTN=""")

one("""    var mt=function(ti,act,extra,dis){return '<div class="mrow"><strong>'+ti+'</strong><div class="mteams">'+[mL,mR].map(function(q){return '<button class="'+q+'" data-act="'+act+'" data-team="'+q+'"'+extra+(dis?' disabled':'')+'>'+esc(tName(s,q))+'</button>'}).join('')+'</div></div>'};
    h='<div class="shd"><h2>其他</h2><button data-act="close">關閉</button></div>'+
      '<h3 class="mhead">換人</h3>'+mt('例外替補','subopen',' data-m="exc"',mc.live)+mt('重新指定自由球員','redopen','',mc.live)+
      '<h3 class="mhead">比賽狀況</h3><div class="mgrid">'+mb('injopen','INJ','傷停')+mb('injopen','INC','陣容不完整')+mb('injopen','FF','棄權')+'</div>'+
      '<h3 class="mhead">修正</h3>'+mt('陣容','fixopen','',false)+mt('球衣顏色<small>含自由球員</small>','sheet',' data-v="color"',false)+
      '<div class="mgrid">'+mb('scfixpick','','修正比分')+mb('tossfix','','挑邊',mc.live||s.setNo===2)+mb('page','roster','查看名單')+'</div>'+
      '<h3 class="mhead">設定</h3><div class="mrow"><strong>提示字</strong><div class="seg">'+[['on','顯示'],['off','隱藏']].map(function(q){return '<button data-act="hints" data-v="'+q[0]+'" aria-pressed="'+((prefs.hints===false?'off':'on')===q[0])+'">'+q[1]+'</button>'}).join('')+'</div></div>'+
      '<button class="linkbtn dangerlink" data-act="sheet" data-v="leave">離開這場比賽</button>';""",
    """    var mp=function(key,dis,sub){return '<button class="mbtn" data-act="mteam" data-v="'+key+'"'+(dis?' disabled':'')+'><strong>'+MTEAM[key][0]+'</strong>'+(sub?'<small>'+sub+'</small>':'')+'</button>'};
    h='<div class="shd"><h2>其他</h2><button data-act="close">關閉</button></div>'+
      '<section class="msec"><h3 class="mhead">換人</h3><div class="mgrid two">'+mp('exc',mc.live)+mp('red',mc.live)+'</div>'+(mc.live?'<p class="muted mnote">球在進行中，得分後才能換人</p>':'')+'</section>'+
      '<section class="msec"><h3 class="mhead">比賽狀況</h3><div class="mgrid">'+mb('injopen','INJ','傷停')+mb('injopen','INC','陣容不完整')+mb('injopen','FF','棄權')+'</div></section>'+
      '<section class="msec"><h3 class="mhead">修正</h3><div class="mgrid">'+mb('scfixpick','','修正比分')+mp('fix',false)+mb('tossfix','','挑邊',mc.live||s.setNo===2)+'</div><div class="mgrid two">'+mp('color',false,'含自由球員')+mb('page','roster','查看名單')+'</div></section>'+
      '<section class="msec"><h3 class="mhead">設定</h3><div class="mrow"><strong>提示字</strong><div class="seg">'+[['on','顯示'],['off','隱藏']].map(function(q){return '<button data-act="hints" data-v="'+q[0]+'" aria-pressed="'+((prefs.hints===false?'off':'on')===q[0])+'">'+q[1]+'</button>'}).join('')+'</div></div></section>'+
      '<button class="linkbtn dangerlink" data-act="sheet" data-v="leave">離開這場比賽</button>';""")

# 選隊：兩隊大按鈕，照場上左右；按了直接做原本的動作
one("""  }else if(x.type==='scfix'){""",
    """  }else if(x.type==='mteam'){
    var mq=MTEAM[x.key],tl=s.sets[s.setNo].left||s.sets[1].left;
    h='<h2>'+mq[1]+'</h2><p class="subhint">選哪一隊</p><div class="teampick mtpick">'+[tl,other(tl)].map(function(q){return '<button class="'+q+'" data-act="'+mq[2]+'" data-team="'+q+'"'+mq[3]+'>'+esc(tName(s,q))+'</button>'}).join('')+'</div><button data-act="close">取消</button>';
  }else if(x.type==='scfix'){""")
one("""    case 'scfix': var sfn=scNote(s);""",
    """    case 'mteam': ui.sheet={type:'mteam',key:b.getAttribute('data-v')}; break;
    case 'scfix': var sfn=scNote(s);""")
# 從選隊那層打開的視窗，「‹ 返回」直接回到「其他」
one("""  var fromMenu=ui.sheet&&ui.sheet.type==='more'?ui.sheet:null;""",
    """  var fromMenu=ui.sheet&&ui.sheet.type==='more'?ui.sheet:ui.sheet&&ui.sheet.type==='mteam'?ui.sheet.back||null:null;""")

CSS = """/* 11/11 晚上：「其他」每區分開，要選隊的先選功能再選隊 */
.msec{display:flex;flex-direction:column;gap:8px;flex:none;padding-top:12px;border-top:1px solid var(--line)}
.shd+.msec{padding-top:2px;border-top:0}
.msec>.mhead{margin:0;font-size:15px}
.msec>.mnote{margin:0;font-size:14px}
.mgrid.one{grid-template-columns:minmax(0,1fr)}
.mtpick button{min-height:64px;font-size:18px}
"""
one('</style>', CSS + '</style>')

# 說明：「修正陣容」改成新的按法
i = s.index('var HELP=[') + 9
j = s.index('];', i) + 1
H = json.loads(s[i:j])
n = 0
for g in H:
    for c in g['cards']:
        if c.get('img') == 'fixlu':
            c['d'] = '按「其他」→「陣容」，選隊伍、位置和正確背號，比分和輪轉不變。'
            n += 1
assert n == 1
s = s[:i] + json.dumps(H, ensure_ascii=False) + s[j:]

open(SRC, 'w', encoding='utf8').write(s)
print('ok')

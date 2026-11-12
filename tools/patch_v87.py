# 11/13 第 18 項：手機直放時記錄表的放大（使用者 11/12 第二輪選 A：上面整局縮小，下面放大框起來的那一塊，點上面哪裡就放大哪裡，紙本的樣子不拆開）
# - 取代 v83 先做的「兩隊上下分開」。「本局」「各局」在手機直放都用這個做法；平板、電腦整局一張照舊。
# - 下面放大的那一塊才有可以點的格子（暫停、替補、先發背號、發球格）；上面整局只用來選要放大哪裡。
# 用法：python3 tools/patch_v87.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'LOUPE_W' not in t, 'already'

i = t.index("/* 手機寬度：兩隊（決勝局是換場前後和另一隊）分開裁，上下排，格子放大才點得到 */")
j = t.index("/* App 記錄表分頁：各局、結果、判罰、記事都直接從協會記錄表裁出來")
assert 0 < j - i < 3000
t = t[:i] + (
    "/* 11/13 手機直放（使用者 11/12 選 A）：上面整局縮小，框起來的那一塊在下面放大；點上面哪裡就放大哪裡，紙本的樣子不拆開。\n"
    "   放大的寬度固定（記錄表的 242 單位，第 1 局大約四成），下面那塊才有可以點的格子 */\n"
    "var LOUPE_W=242;\n"
    "function loupeX(s,n){var b=CTG.setBox[n],W=b[2]-b[0],fw=Math.min(LOUPE_W,W),g=CTG.sets[n],blk=n<3?g.L:g.B1,x=ui.loupe&&ui.loupe[n]!=null?ui.loupe[n]:blk.cols[0]-6;return Math.max(b[0],Math.min(b[2]-fw,x))}\n"
    "function ctViewHot(s,n,o){\n"
    "  var m0=1.2,ed=o&&(o.pt||o.sv),box=CTG.setBox[n];\n"
    "  function one(b,cls,hot){var v=ctSvg(s,[b[0]-m0,b[1]-m0,b[2]-b[0]+m0*2,b[3]-b[1]+m0*2],false,hot?ctHot(s,n,b,o):'').replace(/ width=\"[\\d.]+\" height=\"[\\d.]+\">/,' role=\"img\" aria-label=\"第 '+n+' 局記錄表'+(hot?'，點格子可以修改':'')+'\">');return '<div class=\"ctv ctv-set'+(hot?' hot':'')+(cls?' '+cls:'')+'\">'+v+'</div>'}\n"
    "  if(innerWidth>=600)return one(box,'',ed);\n"
    "  var W=box[2]-box[0],fw=Math.min(LOUPE_W,W),x=loupeX(s,n),cw=W+m0*2;\n"
    "  var ov=one(box,'',false).replace('<div class=\"ctv ctv-set\">','<div class=\"ctv ctv-set ctov\" data-act=\"loupe\" data-v=\"'+n+'\">').replace('</svg></div>','</svg><i class=\"lframe\" style=\"left:'+((x-box[0]+m0)/cw*100).toFixed(2)+'%;width:'+(fw/cw*100).toFixed(2)+'%\"></i></div>');\n"
    "  return '<div class=\"loupe\">'+ov+'<p class=\"lhint\">點上面的記錄表，下面就放大那一塊</p>'+one([x,box[1],x+fw,box[3]],'lmag',ed)+'</div>';\n"
    "}\n") + t[j:]
t = one(t, "    case 'rtab': ui.rtab=b.getAttribute('data-v'); break;",
        "    case 'rtab': ui.rtab=b.getAttribute('data-v'); break;\n"
        "    case 'loupe': // 手機直放：點上面的整局，下面放大那一塊（點的地方放在中間）\n"
        "      var lpn=Number(b.getAttribute('data-v')),lpb=CTG.setBox[lpn],lpr=b.getBoundingClientRect(),lpw=lpb[2]-lpb[0]+2.4,lpx=lpb[0]-1.2+(e.clientX-lpr.left)/lpr.width*lpw;\n"
        "      (ui.loupe=ui.loupe||{})[lpn]=lpx-Math.min(LOUPE_W,lpb[2]-lpb[0])/2; ui.loupe[lpn]=loupeX(s,lpn); break;")
t = one(t, ".ctparts{display:grid;gap:8px}\n",
        "/* 手機直放的放大鏡 */\n"
        ".loupe{display:flex;flex-direction:column;gap:6px}\n"
        ".ctov{position:relative;cursor:pointer}\n"
        ".ctov .lframe{position:absolute;top:0;bottom:0;border:2px solid var(--focus,#2e6cb7);border-radius:4px;box-shadow:0 0 0 999px rgba(0,0,0,.10);pointer-events:none}\n"
        ".lhint{margin:0;text-align:center;font-size:14px;color:var(--muted)}\n")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

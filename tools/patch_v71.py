#!/usr/bin/env python3
"""11/12 新風格第 1 批（使用者兩輪比較選的）：霧灰配色、中圓角，照示意的樣子。
- 配色：暖灰底、淺色版頭和主畫面、蜂蜜黃只給主要按鈕；深色模式是暖的深灰。圓角：按鈕 9px、卡片 12px、面板 16px、球場格子 5px。
- 選中（分段按鈕、記錄表分頁）改成深色加 ✓，不再和主要按鈕一樣是黃色；一般按鈕實心低飽和，不靠細框；
  暫時不能按的（換自由、挑邊、替補）是實色灰底加虛線框。
- 判罰的「關閉」改成一般按鈕；紅色只留給救不回來的：「離開這場比賽」改成一般的小按鈕，確認視窗的「確定離開」是主要按鈕。
- 主畫面：「提示字」「外觀」收進「設定」（和「關於這個程式」並排）；有進行中的比賽時，只有「繼續記錄」是黃色，
  「開始新比賽」改成一般按鈕；備份提醒做成提示框，字只留「有 N 場還沒備份」。
- 刪除（使用者 07:41 同意）：主畫面「進行中」和「紀錄與名單」的比賽不放刪除。打完的比賽打開後照舊有「刪除這場比賽」；
  進行中的比賽在「其他」→「離開這場比賽」裡加紅色的「刪除這場比賽」，再確認一次才刪（左上「‹ 返回」回到離開）。
- 「紀錄與名單」的比賽、資料夾頁的隊伍和場地改成卡片，右邊寫「打開 ›」；說明字只留一句備份提醒。
- 記錄表分頁：第 1～3 局合成一顆「各局」，下面再選第幾局（只列打過的局，只有一局時不顯示）。
- 空的 L 格不顯示（沒登錄或只登錄一位時，那一格留白）；整隊沒有自由球員時，平板上的「自由」兩個字也不顯示。
- 判罰的「出局」「出場」底下的小字拿掉（使用者：圖示就看得懂）。
- 手機直放的比賽頁，球場拉高一點用掉中間的空白；平板的主畫面和記錄表放在中間。
用法：python3 tools/patch_v71.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert '11/12 霧灰' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# ---------- 顏色和形狀的變數 ----------
one("""  --bg:#EDF1F6; --panel:#FFFFFF; --ink:#0F2438; --muted:#4F6377; --line:#C4D0DC; --soft:#DFE7F0;""",
    """  --bg:#ECE8E1; --panel:#F7F5F1; --ink:#2C2925; --muted:#5E584F; --line:#D5CFC5; --soft:#E2DDD5; --line2:#CBC4B8;""")
one("""  --on-accent:#12324F; --scrim:rgba(8,24,40,.5); --del:#A3211A; --del-on:#FFFFFF;""",
    """  --on-accent:#2C2925; --scrim:rgba(44,38,32,.42); --del:#9E4A3F; --del-on:#FFFFFF;""")
one("""  --brand:#12324F; --box:#12324F; --accent:#FFD21F; --accent-ink:#12324F; --sel:#12324F; --sel-on:#FFFFFF;""",
    """  --brand:#F4F1EC; --box:#56616B; --accent:#F2C14B; --accent-ink:#2C2925; --sel:#3B3833; --sel-on:#F7F5F1;
  /* 11/12 霧灰：一般按鈕、不能按、版頭、主畫面、面板、卡片 */
  --btn:#E2DDD4; --btn-edge:transparent; --btn-ink:#2C2925; --off:#EFEBE5; --off-edge:#C4BCB0; --off-ink:#8A8378;
  --field:#FBFAF7; --field-edge:#D5CFC5; --accent-shadow:0 1px 0 rgba(90,70,20,.12); --track:#E2DDD4;
  --hdr-ink:#2C2925; --hdr-sub:#5E584F; --hdr-btn:rgba(44,41,37,.07); --hdr-mute:rgba(44,41,37,.3);
  --hero:#E2DCD2; --hero-ink:#2C2925; --hero-sub:#5F594F; --hero-btn:rgba(44,41,37,.08); --hero-line:rgba(44,41,37,.09);
  --sheet:#F7F5F1; --sheet-shadow:0 -12px 40px rgba(44,38,32,.22); --card:#F7F5F1; --card-shadow:0 1px 2px rgba(60,50,40,.07);
  --net:#3B3833; --faint:#A39B8F; --paper-shadow:0 1px 3px rgba(60,50,40,.14); --note:#E4DDCF; --note-ink:#5A4F3E;""")
one("""  --r:10px;""", """  --r:9px; --rb:9px; --rc:12px; --rs:16px;""")
one("""  --bg:#0C1E30; --panel:#15304A; --ink:#EEF3F9; --muted:#A3B8CB; --line:#2B4B69; --soft:#1D3D5B;""",
    """  --bg:#1D1C1A; --panel:#262523; --ink:#ECE8E1; --muted:#ADA69B; --line:#413E39; --soft:#302E2B; --line2:#4C4842;""", 2)
one("""  --on-accent:#12324F; --scrim:rgba(0,0,0,.6); --del:#8E2A24; --del-on:#FFE3E0; --brand:#0F2A44; --box:#1D3D5B; --sel:#FFD21F; --sel-on:#12324F; --sheet-dim:.9; --cs:dark; color-scheme:dark;""",
    """  --on-accent:#2A2723; --scrim:rgba(0,0,0,.55); --del:#B4594D; --del-on:#FFFFFF; --brand:#272624; --box:#3D444B; --sel:#E8E3DB; --sel-on:#1D1C1A; --sheet-dim:.9; --cs:dark; color-scheme:dark;
  --accent:#F0C24E; --accent-ink:#2A2723; --accent-shadow:none;
  --btn:#3A3733; --btn-ink:#ECE8E1; --off:#232220; --off-edge:#4C4842; --off-ink:#7C766C; --field:#232220; --field-edge:#45423C; --track:#2D2B28;
  --hdr-ink:#ECE8E1; --hdr-sub:#ADA69B; --hdr-btn:rgba(255,255,255,.08); --hdr-mute:rgba(255,255,255,.28);
  --hero:#2A2826; --hero-ink:#ECE8E1; --hero-sub:#BDB6AB; --hero-btn:rgba(255,255,255,.09); --hero-line:rgba(255,255,255,.06);
  --sheet:#2A2926; --sheet-shadow:0 -12px 40px rgba(0,0,0,.5); --card:#272624; --card-shadow:none;
  --net:#D8D2C8; --faint:#6F695F; --paper-shadow:none; --note:#34302A; --note-ink:#D9CFBE;""", 2)
one("""@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--focus:#FFD21F}}""",
    """@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--focus:#F0C24E}}""")

# ---------- 元件 ----------
CSS = r"""
/* ===== 11/12 霧灰：使用者兩輪比較選的（A 霧灰配色、中圓角）。顏色都用上面的變數，學校版在 extra.css 換回深藍和金色 ===== */
/* 一般按鈕：實心、低飽和，不靠細框；:where 讓有自己樣式的按鈕（球場格子、號碼）照舊 */
:where(:root) button{background:var(--btn);border-color:var(--btn-edge);color:var(--btn-ink);border-radius:var(--rb)}
input{background:var(--field);border-color:var(--field-edge);border-radius:var(--rb)}
/* 暫時不能按：實色灰底加虛線框，字看得清楚 */
.pmb:disabled,.mbtn:disabled,.tg button:disabled,.pbtns button:disabled,.histtools button:disabled,.homefoot button:disabled,.sheet .row>button:disabled{opacity:1;background:var(--off);border:1px dashed var(--off-edge);color:var(--off-ink)}
/* 主要按鈕：只有它是鮮明的顏色 */
.primary,.go,.sv{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);box-shadow:var(--accent-shadow)}
.primary:disabled,.go:disabled,.sv:disabled{box-shadow:none}
.danger{background:var(--del);border-color:var(--del);color:var(--del-on)}
/* 選中：深色（深色模式用亮色）加 ✓，黃色只留給主要按鈕 */
.seg,.rtabs{border:0;background:var(--track);border-radius:var(--rb);padding:3px;gap:3px}
.seg button,.rtabs button{background:transparent;border:0;color:var(--muted);border-radius:calc(var(--rb) - 3px)}
.seg button+button{border-left:0}
.seg button[aria-pressed="true"],.rtabs button[aria-pressed="true"],.setpick button[aria-pressed="true"]{background:var(--sel);color:var(--sel-on);border-color:var(--sel)}
.seg button[aria-pressed="true"]::before,.rtabs button[aria-pressed="true"]::before,.setpick button[aria-pressed="true"]::before{content:"✓";margin-right:4px;font-weight:900}
.sheettabs{display:flex;gap:3px}
.sheettabs button{flex:1 1 0;min-height:44px;font-size:15px;font-weight:700;padding:0 2px}
@media (min-width:920px) and (min-height:621px){.sheettabs button{font-size:clamp(15px,2.2vh,18px);min-height:clamp(44px,6vh,52px)}}
/* 窄手機：記錄表 7 顆分頁放不下勾，選中的靠深色底分辨 */
@media (max-width:389px){.sheettabs button[aria-pressed="true"]::before{content:none}}
/* 記錄表「各局」裡選第幾局 */
.setpick{display:flex;gap:8px;justify-content:center;flex:none}
.setpick button{min-height:44px;padding:0 16px;font-size:15px;font-weight:700;background:transparent;border:1px solid var(--line2);color:var(--muted)}
.setpick button[aria-pressed="true"]{border-color:var(--sel)}
/* 版頭 */
.bar{background:var(--brand);color:var(--hdr-ink)}
.bar h1{color:var(--hdr-ink)}
.bartime{color:var(--hdr-sub)}
.bartime b{color:var(--hdr-ink)}
.bar>.barmid small{color:var(--hdr-sub)}
.bar button,.barback{background:var(--hdr-btn);border:0!important;color:var(--hdr-ink);border-radius:var(--rb)}
.bar .helpbtn{border-radius:50%}
.bar button:disabled{opacity:1;background:transparent;color:var(--hdr-mute);border:1px dashed var(--hdr-mute)!important}
.bar h1 .btgt{background:var(--hdr-btn);color:var(--hdr-ink)}
/* 浮動面板：圓角、陰影，用留白分組 */
.scrim{background:var(--scrim)}
.sheet{background:var(--sheet);border:0;box-shadow:var(--sheet-shadow);border-radius:var(--rs) var(--rs) 0 0;gap:12px}
@media (min-width:760px){.sheet{border-radius:var(--rs)}}
.sheet::before{background:var(--line2)}
.sheet .msec{border-top:0;padding-top:6px}
.sheet .mbtn{border:0;background:var(--btn);color:var(--btn-ink);border-radius:var(--rb)}
.sheet .pk3 button{border:0;background:var(--btn);color:var(--btn-ink);border-radius:var(--rb)}
@media (orientation:landscape) and (max-height:520px){
 .sheet>.row:last-child{background-color:var(--sheet);box-shadow:0 -8px 8px var(--sheet)}
 .sheet>button:last-child:not(.primary):not(.danger):not(.dellink):not(.linkbtn){background-color:var(--btn);box-shadow:0 -8px 8px var(--sheet)}
}
.sheet>.sheetback{background:var(--btn);border:0}
.sheet button:is([data-act=close],[data-act=penclose],[data-act=pmback]):not(.primary):not(.linkbtn):not(.go){background:var(--btn);border-color:var(--btn);color:var(--btn-ink)}
.teampick button{border:0;border-radius:var(--rb)}
/* 離開這場比賽：比賽會保留，不是紅色；刪除才是紅色 */
/* 底線字改成有框的小按鈕：刪除這場比賽、賽前沒收是紅框（救不回來），其他照一般按鈕 */
.linkbtn.dangerlink{text-decoration:none;align-self:center;min-height:44px;padding:0 18px;border:1.5px solid var(--del);border-radius:var(--rb);background:transparent;color:var(--del);font-weight:700}
/* 例外替補「宣告受傷」選中：和其他選中一樣用深色 */
.excinj button[aria-pressed="true"]{background:var(--sel);border-color:var(--sel);color:var(--sel-on)}
/* 主畫面 App：版頭和狀態列色帶是淺色時，狀態列的字要用深色（以前深藍色帶配白字） */
@media (display-mode:standalone){html{color-scheme:light}}
@media (display-mode:standalone) and (prefers-color-scheme:dark){html:not([data-theme="light"]){color-scheme:dark}}
@media (display-mode:standalone){html[data-theme="dark"]{color-scheme:dark}}
/* 下方步驟列：完成的步驟用一般按鈕的底色和深色勾（淺色版頭的白勾會看不見） */
.stepn.done{background:var(--btn);border-color:var(--btn);color:var(--btn-ink)}
/* 挑邊頁「賽前沒收」入口：紅框小按鈕，不是底線字 */
.foot .pfbtn.ghost.full{width:auto;align-self:center;min-height:44px;padding:0 18px;background:transparent;border:1.5px solid var(--del);border-radius:var(--rb);color:var(--del);text-decoration:none;font-size:15px;font-weight:700}
/* 退格、清空、移除、刪掉還沒確定的一組替補：可以再補回來，不用紅色 */
.pad button.back,.chip.blank.clear,.bench .chip.blank.clear{background:var(--btn);border-color:var(--btn);color:var(--btn-ink)}
.sheet .linkbtn.dangerlink,.sheet .linkbtn.dangerlink:last-child{text-decoration:none;color:var(--btn-ink);background:var(--btn);border:0;min-height:44px;padding:0 18px;border-radius:var(--rb);align-self:center;font-weight:700}
.sheet .dellink,.sheet .dellink:last-child{align-self:center;min-height:44px;padding:0 18px;background:transparent;border:1.5px solid var(--del);color:var(--del);font-weight:700;box-shadow:none;margin-top:4px}
/* 主畫面 */
.hero{background:var(--hero);color:var(--hero-ink)}
.hero h1{color:var(--hero-ink)}
.hero p{color:var(--hero-sub)}
.herocourt g{stroke:var(--hero-line);stroke-opacity:1}
.herobtns button{background:var(--hero-btn);border:0;color:var(--hero-ink);border-radius:var(--rb)}
.herocta{border-radius:var(--rb)}
.herocta.second{background:var(--hero-btn);border:0;color:var(--hero-ink);box-shadow:none}
.homebody h2{font-size:14px;letter-spacing:.04em;color:var(--muted);font-weight:600;border:0}
.homebody section>h2{border-bottom:0;padding-bottom:0}
.rlist{border-top:0}
.rlist>*{border-bottom:0}
.homebody .rrow{background:var(--card);border-radius:var(--rc);padding:4px 14px 14px;box-shadow:var(--card-shadow);border:0}
.rmain{border:0}
.rmain em{background:var(--accent);color:var(--accent-ink);border-radius:var(--rb);box-shadow:var(--accent-shadow)}
.bkrow{border:0;padding:10px 14px;background:var(--note);border-radius:var(--rb)}
.bkrow .muted{color:var(--note-ink);font-size:15px}
.homefoot{display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:4px}
.homefoot button,.homefoot .aboutbtn{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border:0;border-radius:var(--rb);background:var(--btn);color:var(--btn-ink);font-size:15px;font-weight:700;margin:0}
.homefoot svg{width:18px;height:18px}
.verbtn{background:none!important;border:0!important}
@media (orientation:landscape) and (min-width:640px){.homebody{justify-content:center}}
/* 卡片加「打開 ›」：比賽、資料夾、隊伍、場地 */
.shead .linkbtn{text-decoration:none;background:var(--btn);border:0;min-height:44px;padding:0 14px;border-radius:var(--rb);font-size:15px;color:var(--btn-ink)}
.hrow.cupcard,.hrow.card{background:var(--card);border:0;border-radius:var(--rc);box-shadow:var(--card-shadow);margin:8px 0;padding:12px 14px}
.hrow.card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:12px}
.hrow.card>:not(.hgo){grid-column:1}
.hrow.card>.hgo{grid-column:2;grid-row:1/span 2;font-weight:700;font-size:15px;color:var(--muted);white-space:nowrap}
.cupcard .cupgo,.cupcard .cupic{color:var(--muted)}
.rrow{border:0}
.ftag{background:var(--track);color:var(--muted);border:0}
.histtools button,.histtools .ghost-file{background:var(--btn);border:0;color:var(--btn-ink)}
section>h2{border-color:transparent}
/* 比賽頁 */
.tg button,.pbtns button{background:var(--btn);border:0;color:var(--btn-ink)}
.tg button b{color:var(--ink)}
.setbox{background:var(--box);border-color:var(--box)!important;border-radius:6px}
.net{background:var(--net)}
.pcourt .pc{border-radius:5px}
.board>.wbar{border-radius:8px}
.capbox{background:var(--btn);border:0!important;border-radius:8px}
.lc{border-radius:8px}
.capbox span,.lc .lno{color:var(--muted)}
.lc:not(.empty) .lno{color:inherit;opacity:.85}
/* 空的 L 格不顯示（那一格留白）；整隊沒有自由球員時「自由」兩個字也不顯示 */
.lc.empty{visibility:hidden}
.wcol .strip.nolib::before{visibility:hidden}
@media (orientation:portrait) and (max-width:759px){.pcourt{max-height:352px}}
/* 記錄表頁 */
.fsbtn,.xpbtn{background:var(--btn);border:0;color:var(--btn-ink)}
.sheetfoot{background:var(--bg)}
.ctv{border-radius:6px;box-shadow:var(--paper-shadow)}
@media (min-width:760px){
 .page:has(>.sheettabs)>.ctv{margin-top:auto}
 .page:has(>.sheettabs)>.fsbtn{margin-bottom:auto}
}
"""
assert s.count('</style>') == 1
s = s.replace('</style>', CSS + '</style>')

# ---------- 主畫面：設定、進行中只有繼續記錄是黃色、不放刪除 ----------
one("""<em>'+(started?'繼續記錄':'繼續準備')+'</em></button><button class="rdel" data-act="del-ask" data-id="'+esc(m.id)+'" aria-label="刪除這場比賽">刪除</button></div>';""",
    """<em>'+(started?'繼續記錄':'繼續準備')+'</em></button></div>';""")
one("""  if(real.length)body+='<div class="bkrow"><span class="muted">比賽只存在這台裝置。'+(nb?'有 '+nb+' 場還沒備份':'都備份過了'+(lastBk?'（上次 '+shortTime(lastBk)+'）':''))+'，備份在「紀錄與名單」。</span></div>';""",
    """  if(real.length)body+='<div class="bkrow"><span class="muted">'+(nb?'有 '+nb+' 場還沒備份，備份在「紀錄與名單」。':'都備份過了'+(lastBk?'（上次 '+shortTime(lastBk)+'）':'')+'。')+'</span></div>';""")
one("""  var th=prefs.theme||'auto';
  body+=inst+'<div class="themerow"><span class="muted">提示字</span><div class="seg">'+[['on','顯示'],['off','隱藏']].map(function(x){return '<button data-act="hints" data-v="'+x[0]+'" aria-pressed="'+((prefs.hints===false?'off':'on')===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>';
  body+='<div class="themerow"><span class="muted">外觀</span><div class="seg three">'+[['auto','跟著裝置'],['light','淺色'],['dark','深色']].map(function(x){return '<button data-act="theme" data-v="'+x[0]+'" aria-pressed="'+(th===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'+(offlineReady?'<p class="offok">已可離線使用</p>':'')+updLink()+'<button class="aboutbtn" data-act="about">""",
    """  body+=inst+(offlineReady?'<p class="offok">已可離線使用</p>':'')+updLink()+'<div class="homefoot"><button data-act="settings">'+GEAR+'設定</button><button class="aboutbtn" data-act="about">""")
one("""fill="currentColor"/></svg>關於這個程式</button><button class="verbtn\"""",
    """fill="currentColor"/></svg>關於這個程式</button></div><button class="verbtn\"""")
one("""<button class="primary herocta" data-act="new">開始新比賽</button>""",
    """<button class="primary herocta'+(g.live.length?' second':'')+'" data-act="new">開始新比賽</button>""")
one("""function homeHtml(){""",
    """var GEAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.3-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z"/></svg>';
function homeHtml(){""")
# 設定：提示字、外觀
one("""function aboutHtml(){
  if(!ui.about)return '';""",
    """function aboutHtml(){
  if(!ui.about)return '';
  if(ui.about==='settings'){var th=prefs.theme||'auto';
    return '<div class="scrim" data-act="aboutclose"></div><div class="sheet about" role="dialog" aria-modal="true" aria-labelledby="sett"><h2 id="sett">設定</h2>'+
      '<div class="themerow"><span class="muted">提示字</span><div class="seg">'+[['on','顯示'],['off','隱藏']].map(function(x){return '<button data-act="hints" data-v="'+x[0]+'" aria-pressed="'+((prefs.hints===false?'off':'on')===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'+
      '<div class="themerow"><span class="muted">外觀</span><div class="seg three">'+[['auto','跟著裝置'],['light','淺色'],['dark','深色']].map(function(x){return '<button data-act="theme" data-v="'+x[0]+'" aria-pressed="'+(th===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'+
      '<button data-act="aboutclose">關閉</button></div>';}""")
one("""    case 'about': ui.about='about'; break;""",
    """    case 'about': ui.about='about'; break;
    case 'settings': ui.about='settings'; break;""")

# ---------- 紀錄與名單、資料夾：卡片加「打開 ›」，不放刪除 ----------
one("""  if(del)return '<div class="rrow">'+historyRow(m,s)+'<button class="rdel" data-act="del-ask" data-id="'+esc(m.id)+'" aria-label="刪除這場比賽">刪除</button></div>';
  return '<button class="hrow" data-act="open\"""",
    """  if(del)return historyRow(m,s);
  return '<button class="hrow card" data-act="open\"""")
one("""<span'+(aw?'':' class="win"')+'>'+esc(T[1])+'</span></span></button>';""",
    """<span'+(aw?'':' class="win"')+'>'+esc(T[1])+'</span></span><span class="hgo" aria-hidden="true">打開 ›</span></button>';""")
one("""'<p class="muted">點一場比賽就能看記錄表。前面標的是放在哪個資料夾。要備份就按「選擇」。</p><div class="rlist">'""",
    """'<div class="rlist">'""")
one("""<p class="muted">比賽只存在這台裝置。換手機或清除瀏覽器資料前，請先備份。資料夾的名單也可以到資料夾裡「存成檔案」。匯入前會先列出會改什麼。</p>""",
    """<p class="muted">換手機或清除瀏覽器資料前，請先備份。</p>""")
one("""  var tr=ts.map(function(x){return '<button class="hrow" data-act="cupteam" data-id="'+esc(x.id)+'"><strong>'+esc(x.team.name)+'</strong><span class="muted">'+(groupName(x.group)?esc(groupName(x.group))+'・':'')+x.team.players.length+' 人'+(x.team.liberos.length?'・自由球員 '+x.team.liberos.length+' 人':'')+(x.team.captain===null?'・還沒有隊長':'')+'</span></button>'}).join('');""",
    """  var tr=ts.map(function(x){return '<button class="hrow card" data-act="cupteam" data-id="'+esc(x.id)+'"><strong>'+esc(x.team.name)+'</strong><span class="muted">'+(groupName(x.group)?esc(groupName(x.group))+'・':'')+x.team.players.length+' 人'+(x.team.liberos.length?'・自由球員 '+x.team.liberos.length+' 人':'')+(x.team.captain===null?'・還沒有隊長':'')+'</span><span class="hgo" aria-hidden="true">打開 ›</span></button>'}).join('');""")
one("""'<button class="hrow" data-act="cupcourt" data-v="'+esc(q.key)+'"><strong>'+esc(q.label)+'</strong><span class="muted">'+q.n+' 位裁判</span></button>'""",
    """'<button class="hrow card" data-act="cupcourt" data-v="'+esc(q.key)+'"><strong>'+esc(q.label)+'</strong><span class="muted">'+q.n+' 位裁判</span><span class="hgo" aria-hidden="true">打開 ›</span></button>'""")

# ---------- 離開這場比賽：不是紅色；刪除放這裡 ----------
one("""    h='<h2>離開這場比賽？</h2><p class="muted">比賽還沒打完。紀錄會保留，之後在主畫面按「繼續記錄」。</p><div class="row"><button data-act="close">取消</button><button class="danger" data-act="home">確定離開</button></div>';""",
    """    h='<h2>離開這場比賽？</h2><p class="muted">紀錄會保留，之後在主畫面按「繼續記錄」。</p><div class="row"><button data-act="close">取消</button><button class="primary" data-act="home">確定離開</button></div><button class="dellink" data-act="leavedel">刪除這場比賽</button>';""")
one("""  }else if(x.type==='delmatch'){
    h='<h2>刪除這場比賽？</h2>""",
    """  }else if(x.type==='delmatch'){
    if(x.back)stepBack=BACK_BTN;
    h='<h2>刪除這場比賽？</h2>""")
one("""    case 'settings': ui.about='settings'; break;""",
    """    case 'settings': ui.about='settings'; break;
    case 'leavedel': ui.sheet={type:'delmatch',back:ui.sheet}; break;""")

# ---------- 判罰：關閉不是黃色、出局出場不寫小字 ----------
one("""<button class="primary" data-act="penclose">關閉</button></div>';""", """<button data-act="penclose">關閉</button></div>';""")
one("""出局<small>一手舉兩張</small>""", """出局""", 2)
one("""出場<small>兩手各一張</small>""", """出場""", 2)

# ---------- 記錄表：第 1～3 局合成「各局」 ----------
one("""  var tabs=[['s1','第1局'],['s2','第2局'],['s3','第3局'],['res','結果'],['pen','判罰'],['r6','<span class="lg">R6 </span>自由'],['note','記事<span class="lg">欄</span>'],['fix','更正']];""",
    """  var tabs=[['set','各局'],['res','結果'],['pen','判罰'],['r6','<span class="lg">R6 </span>自由'],['note','記事<span class="lg">欄</span>'],['fix','更正']];""")
one("""'<div class="rtabs sheettabs">'+tabs.map(function(x){return '<button data-act="rtab" data-v="'+x[0]+'" aria-pressed="'+(tab===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'+'';""",
    """'<div class="rtabs sheettabs">'+tabs.map(function(x){
      if(x[0]==='set'){var onSet=/^s[123]$/.test(tab);return '<button data-act="rtab" data-v="'+(onSet?tab:'s'+setTabNo(s))+'" aria-pressed="'+onSet+'">'+x[1]+'</button>'}
      return '<button data-act="rtab" data-v="'+x[0]+'" aria-pressed="'+(tab===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'+setPick(s,tab);""")
one("""function resultHtml(s,pv){""",
    """/* 記錄表「各局」：預設是現在這一局；下面只列打過的局，只有一局時不顯示 */
function setTabNo(s){var n=s.setNo;while(n>1&&!(s.sets[n]&&s.sets[n].started))n--;return n}
function setPick(s,tab){
  if(!/^s[123]$/.test(tab))return '';
  var ns=[1,2,3].filter(function(n){return s.sets[n]&&s.sets[n].started});
  return ns.length>1?'<div class="setpick" role="group" aria-label="第幾局">'+ns.map(function(n){return '<button data-act="rtab" data-v="s'+n+'" aria-pressed="'+(tab==='s'+n)+'">第 '+n+' 局</button>'}).join('')+'</div>':'';
}
function resultHtml(s,pv){""")

# 不是救不回來的，不用紅色：比賽資料頁的離開、名單的移除、替補面板刪掉還沒確定的一組
one("""(going?'<button class="danger full" data-act="sheet" data-v="leave">離開這場比賽</button>':'')""",
    """(going?'<button class="full" data-act="sheet" data-v="leave">離開這場比賽</button>':'')""")
one('<button class="danger" data-act="rm" data-team="', '<button data-act="rm" data-team="')
one('<button class="danger" data-act="subdel" data-id="', '<button data-act="subdel" data-id="')

# 整隊沒有自由球員：strip 加 nolib，平板上「自由」兩個字不顯示
one("""  return '<div class="strip '+k+(mir?' mir':'')+'"><div class="ls">'+slots.join('')+'</div>'+cb+'</div>';""",
    """  return '<div class="strip '+k+(mir?' mir':'')+(t.liberos.length?'':' nolib')+'"><div class="ls">'+slots.join('')+'</div>'+cb+'</div>';""")

# 說明：賽前沒收的入口不再是紅字（提示不寫顏色，寫按鈕上的字）
one('按最下面的紅字。', '按最下面的「隊伍沒到或人數不足」。')

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v71 ok')

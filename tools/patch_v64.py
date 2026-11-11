#!/usr/bin/env python3
"""11/11 晚上（語音討論）：說明頁和授權、換人比分一樣也擋。
- 說明頁：每天第一次打開（停在主畫面時）跳一次，寫系統說明、著作權、使用授權、注意事項，按「開始使用」關掉。
  主畫面最下面多「關於這個程式」，隨時能再看（多寫版本、授權全文和原始碼、問題回報）。
  記在偏好設定 prefs.introDay（日期），不寫進比賽資料；從比賽中直接回到比賽畫面時不跳，不擋記錄。
- 授權：PolyForm Noncommercial 1.0.0（使用者選 A：免費提供非商業用途使用，散布或修改要保留作者標示和授權條款）。
- 匯出的記錄表右下角小字加「© 2026 Ken Chen」。
- 改比分：同一個位置換下和換回填一樣的比分也擋下來（例外替補不算）。
用法：python3 tools/patch_v64.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function aboutHtml(' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# 改比分：一樣的比分也擋（例外替補可能同一個暫停裡發生，不擋）
one("""      if(j<i&&n<qt)return '換回來的比分不能比換下去的（'+row[j].score+'）還早。';
      if(j>i&&n>qt)return '換下去的比分不能比換回來的（'+row[j].score+'）還晚。'}}""",
    """      var same=n===qt&&!row[j].exc&&!e.exc;
      if(j<i&&n<qt)return '換回來的比分不能比換下去的（'+row[j].score+'）還早。';
      if(j<i&&same)return '換回來的比分不能和換下去的（'+row[j].score+'）一樣，要在之後。';
      if(j>i&&n>qt)return '換下去的比分不能比換回來的（'+row[j].score+'）還晚。';
      if(j>i&&same)return '換下去的比分不能和換回來的（'+row[j].score+'）一樣，要在之前。'}}""")

# 說明頁和「關於」
one("function homeHtml(){",
    """/* 11/11 說明頁（每天第一次打開跳一次）和「關於這個程式」：系統說明、著作權、使用授權、注意事項 */
var REPO_URL='https://github.com/KenChen0728/volleyball-scoresheet',introChecked=false;
function aboutHtml(){
  if(!ui.about)return '';
  var intro=ui.about==='intro',desc=XP_ON?'本系統為排球比賽電子記錄表，依中華民國排球協會記錄表格式產生紀錄，可離線使用。':'本系統為排球比賽電子記錄表，記錄比賽過程與結果，可離線使用。';
  return '<div class="scrim" data-act="aboutclose"></div><div class="sheet about" role="dialog" aria-modal="true" aria-labelledby="abt"><h2 id="abt">'+esc(document.title)+'</h2><dl class="abl">'+
    '<dt>系統說明</dt><dd>'+desc+'</dd>'+
    '<dt>著作權</dt><dd>© 2026 Ken Chen</dd>'+
    '<dt>使用授權</dt><dd>本系統免費提供非商業用途使用。散布或修改時，須保留原作者標示及本授權條款（PolyForm Noncommercial 1.0.0）。</dd>'+
    '<dt>注意事項</dt><dd>比賽資料僅儲存於本裝置，請於賽後自行備份。</dd>'+
    (intro?'':'<dt>版本</dt><dd>'+esc(BUILD)+'</dd><dt>授權全文與原始碼</dt><dd><a href="'+REPO_URL+'" target="_blank" rel="noopener">GitHub：KenChen0728/volleyball-scoresheet</a></dd><dt>問題回報</dt><dd>有問題請截圖傳給 Ken Chen。</dd>')+
    '</dl><button class="primary" data-act="aboutclose">'+(intro?'開始使用':'關閉')+'</button></div>';
}
function homeHtml(){""")
one("updLink()+'<button class=\"verbtn\" data-act=\"ver\">版本 '+BUILD+'　© 2026 Ken Chen</button>'",
    "updLink()+'<button class=\"aboutbtn\" data-act=\"about\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 14h-2v-6h2v6zm0-8h-2V7h2v2z\" fill=\"currentColor\"/></svg>關於這個程式</button><button class=\"verbtn\" data-act=\"ver\">版本 '+BUILD+'　© 2026 Ken Chen</button>'")
one("  if(view==='home'||view==='history'||view==='cup'){",
    "  if(view==='home'&&!introChecked){introChecked=true;if(prefs.introDay!==today()&&!(navigator.webdriver&&!/[?&]intro\\b/.test(location.search))){prefs.introDay=today();savePrefs();ui.about='intro'}} // 每天第一次打開（停在主畫面時）跳說明頁；自動測試不跳（網址加 ?intro 才跳）\n"
    "  if(view==='home'||view==='history'||view==='cup'){")
one("app.innerHTML=(view==='home'?homeHtml():view==='cup'?cupHtml():historyHtml())+cupSheetHtml()+importPlanHtml()+(view==='history'?bkSheetHtml():'')+helpHtml()+staleHtml();",
    "app.innerHTML=(view==='home'?homeHtml():view==='cup'?cupHtml():historyHtml())+cupSheetHtml()+importPlanHtml()+(view==='history'?bkSheetHtml():'')+(view==='home'?aboutHtml():'')+helpHtml()+staleHtml();")
one("    case 'helpopen': ui.help={group:helpGroup(s),i:0}; break;",
    "    case 'about': ui.about='about'; break;\n    case 'aboutclose': ui.about=null; break;\n    case 'helpopen': ui.help={group:helpGroup(s),i:0}; break;")
one("'.sheet [data-act=import-cancel]','.sheet [data-act=close]',",
    "'.sheet [data-act=import-cancel]','.sheet [data-act=aboutclose]','.sheet [data-act=close]',")

# 匯出的記錄表右下角小字
one("font-family=\"'+XP_FONT.replace(/'/g,'&apos;')+'\">排球電子記錄表　'+esc(new Date().toLocaleString('zh-TW',{hour12:false}))+'</text>';",
    "font-family=\"'+XP_FONT.replace(/'/g,'&apos;')+'\">排球電子記錄表 © 2026 Ken Chen　'+esc(new Date().toLocaleString('zh-TW',{hour12:false}))+'</text>';")

CSS = r"""/* 11/11 說明頁、關於這個程式 */
.about .abl{margin:0;display:flex;flex-direction:column;gap:2px}
.about .abl dt{font-size:13px;font-weight:700;color:var(--muted);margin-top:10px}
.about .abl dt:first-child{margin-top:0}
.about .abl dd{margin:0;font-size:16px;line-height:1.6}
.about .abl a{color:var(--link,var(--ink));text-decoration:underline;overflow-wrap:anywhere}
.about>.primary{margin-top:6px}
.aboutbtn{align-self:center;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;margin-top:6px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);font-size:14px;font-weight:600}
.aboutbtn svg{width:18px;height:18px;flex:none}
@media (min-width:760px){.about .abl dd{font-size:clamp(16px,2.3vh,18px)}.about .abl dt{font-size:clamp(13px,1.8vh,15px)}}
"""
one('</style>', CSS + '</style>')
open(SRC, 'w', encoding='utf8').write(s)
print('patch_v64 ok')

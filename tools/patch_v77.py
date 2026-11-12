# 11/12 下午使用者實際用：
# 1. 裁判頁打了名字沒按「填入」，直接點別的角色或離開，打的字就不見了 → 先替他按「填入」；
#    還沒選角色、或按的是「清空」「其他場地」時，字留在框裡。點名單裡的名字則以點的為準。
# 2. 名單頁數字鍵盤還開著，「下一步」就出現並蓋住格子 → 鍵盤開著時不顯示，按「完成」才出現。
# 用法：python3 tools/patch_v77.py [檔案 ...]（預設改原始檔；也能直接套在正式版 index.html、school/index.html）
import sys
files = sys.argv[1:] or ['/home/claude/nanshe/nanshe-scoresheet.html']


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:80])
    return t.replace(a, b)


for f in files:
    t = open(f, encoding='utf-8').read()
    if 'ui.refTyped' in t:
        print('skip (already)', f)
        continue
    has_ref = 'id="ref-type"' in t
    if has_ref:
        t = one(t, "  if(staleTab)return;\n  ui.fixDone=null;\n",
                "  if(staleTab)return;\n  ui.fixDone=null;\n"
                "  /* 11/12 使用者：裁判名字打了沒按「填入」就點別的角色或離開，字會不見：先替他按「填入」 */\n"
                "  var rfIn=document.getElementById('ref-type'),rfV=rfIn?rfIn.value.trim():'';\n"
                "  if(rfV&&act!=='reftype'&&act!=='refname'){\n"
                "    if(act==='refclear'||act==='refother')ui.refTyped=rfV;\n"
                "    else{var rfAt=ui.refRole,rfB=app.querySelector('[data-act=reftype]');if(rfB)rfB.click();\n"
                "      var rfM=current(),rfS=rfM?reduce(rfM.events):null;\n"
                "      if(!rfS||!REFS.some(function(x){return String(rfS.info[x[0]]||'').trim()===rfV}))ui.refTyped=rfV; // 沒填進去（還沒選角色）：字留在框裡\n"
                "      else if(act==='refrole')ui.refRole=rfAt}\n"
                "  }\n")
        t = one(t, "var typ='<div class=\"reftype\"><input id=\"ref-type\" type=\"text\" maxlength=\"20\" autocomplete=\"off\" placeholder=\"'",
                "var rfT=ui.refTyped||'';ui.refTyped=null;\n  var typ='<div class=\"reftype\"><input id=\"ref-type\" type=\"text\" maxlength=\"20\" autocomplete=\"off\" value=\"'+esc(rfT)+'\" placeholder=\"'")
    t = one(t, "function rosterNext(s){\n  if(s.sets[1].started)return '';\n",
            "function rosterNext(s){\n  if(s.sets[1].started)return '';\n"
            "  if(ui.page==='roster'&&(ui.slot.t1||ui.slot.t2))return ''; // 11/12 使用者：數字鍵盤開著時先不出現，免得蓋住格子\n")
    open(f, 'w', encoding='utf-8').write(t)
    print('patched', f, 'ref' if has_ref else 'no-ref')

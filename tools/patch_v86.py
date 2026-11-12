# 11/13 第 11 項：手機轉橫看記錄表（使用者授權直接做完上線）
# - 比賽中手機轉成橫的，整個畫面變成這一局的記錄表，只能看；上面一條寫比分和「轉回直的就能繼續記錄」。
# - 想橫著記錄的，按「橫的也要記錄」關掉；「其他」→「設定」→「手機轉橫」可以再打開。
# - 「各局」的「橫向全螢幕」按鈕照舊（手機鎖定直向時用）。
# - 只有手機（觸控、橫放時高度 500px 以下）；平板、電腦不變。學校版沒有記錄表，不會出現。
# 用法：python3 tools/patch_v86.py
SRC = '/home/claude/nanshe/nanshe-scoresheet.html'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'function landHtml' not in t, 'already'

t = one(t, "function pendingHtml(s,win){",
        "/* 11/13 手機轉橫：比賽中整個畫面變成這一局的記錄表，只能看；轉回直的繼續記錄。按「橫的也要記錄」關掉，「其他」→「設定」可以再打開 */\n"
        "var mqLand=window.matchMedia?matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)'):null;\n"
        "function landOn(s){return !!(XP_ON&&mqLand&&mqLand.matches&&prefs.landSheet!==false&&view==='setup'&&ui.page==='play'&&!ui.liveSheet&&s.sets[s.setNo].started&&!matchOver(s))}\n"
        "function landHtml(s){if(!landOn(s))return '';\n"
        "  var n=s.setNo,v=setWinner(s)?seCopy(s):s,c=v.sets[n],L=c.left||sheetTeams(v,n).L,R=other(L);\n"
        "  return '<div class=\"land\" role=\"dialog\" aria-label=\"第 '+n+' 局記錄表\"><div class=\"landbar\"><b>第 '+n+' 局</b><span class=\"tpill '+L+'\">'+esc(tName(s,L))+'</span><b class=\"landsc\">'+c.score[L]+' : '+c.score[R]+'</b><span class=\"tpill '+R+'\">'+esc(tName(s,R))+'</span>'+\n"
        "    '<span class=\"landhint\">轉回直的就能繼續記錄</span><button data-act=\"landoff\">橫的也要記錄</button></div><div class=\"landsheet\">'+ctView(v,CTG.setBox[n],'ctv-set',1.2)+'</div></div>';\n"
        "}\n"
        "function pendingHtml(s,win){")
t = one(t, "kp+sheetHtml(s,m)+setEndWin(s,m)+modalHtml(s)+penHtml(s)", "kp+sheetHtml(s,m)+setEndWin(s,m)+modalHtml(s)+penHtml(s)+landHtml(s)")
t = one(t, "app.addEventListener('input',seDur);app.addEventListener('change',seDur);",
        "app.addEventListener('input',seDur);app.addEventListener('change',seDur);\n"
        "if(mqLand&&mqLand.addEventListener)mqLand.addEventListener('change',function(){if(view==='setup')render()}); // 手機轉橫、轉直馬上換")
t = one(t, "    case 'hints': prefs.hints=b.getAttribute('data-v')!=='off'; savePrefs(); break;",
        "    case 'hints': prefs.hints=b.getAttribute('data-v')!=='off'; savePrefs(); break;\n"
        "    case 'landoff': prefs.landSheet=false; savePrefs(); ui.toast={t:'轉橫也會照常記錄。要改回來：「其他」→「設定」→「手機轉橫」',until:Date.now()+4000}; break;\n"
        "    case 'landpref': prefs.landSheet=b.getAttribute('data-v')!=='off'; savePrefs(); break;")
t = one(t, "'<section class=\"msec\"><h3 class=\"mhead\">設定</h3><div class=\"mrow\"><strong>提示字</strong><div class=\"seg\">'+[['on','顯示'],['off','隱藏']].map(function(q){return '<button data-act=\"hints\" data-v=\"'+q[0]+'\" aria-pressed=\"'+((prefs.hints===false?'off':'on')===q[0])+'\">'+q[1]+'</button>'}).join('')+'</div></div></section>'+",
        "'<section class=\"msec\"><h3 class=\"mhead\">設定</h3><div class=\"mrow\"><strong>提示字</strong><div class=\"seg\">'+[['on','顯示'],['off','隱藏']].map(function(q){return '<button data-act=\"hints\" data-v=\"'+q[0]+'\" aria-pressed=\"'+((prefs.hints===false?'off':'on')===q[0])+'\">'+q[1]+'</button>'}).join('')+'</div></div>'+\n"
        "      (XP_ON?'<div class=\"mrow\"><strong>手機轉橫</strong><div class=\"seg\">'+[['on','顯示記錄表'],['off','照常記錄']].map(function(q){return '<button data-act=\"landpref\" data-v=\"'+q[0]+'\" aria-pressed=\"'+((prefs.landSheet===false?'off':'on')===q[0])+'\">'+q[1]+'</button>'}).join('')+'</div></div>':'')+'</section>'+")
t = one(t, ".bxchg{margin:0;padding-left:1.2em;font-size:16px;line-height:1.55}\n",
        ".bxchg{margin:0;padding-left:1.2em;font-size:16px;line-height:1.55}\n"
        "/* 11/13 手機轉橫時的記錄表 */\n"
        ".land{position:fixed;inset:0;z-index:90;background:var(--bg);display:flex;flex-direction:column;gap:4px;padding:max(4px,env(safe-area-inset-top,0px)) max(8px,env(safe-area-inset-right,0px)) max(4px,env(safe-area-inset-bottom,0px)) max(8px,env(safe-area-inset-left,0px))}\n"
        ".landbar{display:flex;align-items:center;gap:8px;flex:none;min-height:40px;white-space:nowrap}\n"
        ".landbar .landsc{font-family:var(--num);font-size:22px}\n"
        ".landbar .landhint{flex:1;text-align:right;font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis}\n"
        ".landbar button{min-height:36px;padding:0 12px;font-size:14px;flex:none}\n"
        ".landsheet{flex:1;min-height:0;display:flex}\n"
        ".landsheet .ctv{width:100%;height:100%;background:none;box-shadow:none;border-radius:0}\n"
        ".landsheet .ctv svg{width:100%;height:100%}\n")

# 裁切的記錄表：裁切範圍外的東西一律不畫（轉橫時記錄表撐滿畫面，上下才不會露出表頭和別局）
t = one(t, "  return '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 '+w+' '+h+'\" width=\"'+w+'\" height=\"'+h+'\"><rect width=\"'+w+'\" height=\"'+h+'\" fill=\"#fff\"/>'+(cr?'<g transform=\"translate('+(-cr[0])+' '+(-cr[1])+')\">'+body+'</g>':body)+'</svg>';",
        "  var ci=cr?'ctc'+(++CT_CLIP):'';\n"
        "  return '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 '+w+' '+h+'\" width=\"'+w+'\" height=\"'+h+'\"><rect width=\"'+w+'\" height=\"'+h+'\" fill=\"#fff\"/>'+(cr?'<clipPath id=\"'+ci+'\"><rect width=\"'+w+'\" height=\"'+h+'\"/></clipPath><g clip-path=\"url(#'+ci+')\"><g transform=\"translate('+(-cr[0])+' '+(-cr[1])+')\">'+body+'</g></g>':body)+'</svg>';")
t = one(t, "function ctSvg(s,cr,blank,extra){", "var CT_CLIP=0; // 每張裁切的記錄表各用一個 clipPath id\nfunction ctSvg(s,cr,blank,extra){")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

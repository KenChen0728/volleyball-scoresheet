# 11/13 第 7、8 項：局結束的流程（使用者授權直接做完上線）
# 7. 按完最後一分跳出視窗：這局比分、開始和結束時間（點了就能改）、經過幾分鐘；「復原上一步」或「確定」。
#    確定後是「本局」：上面這局的記錄表、下面結果，跟紙本核對完按「下一局」（最後一局是「確定比賽結束」）。
# 8. 「本局」的記錄表上點暫停、替補（含先發背號）的格子，就能修改或補記（用原本的更正、補記、修正陣容）。
#    手機寬度兩隊分開上下排，格子才點得到；平板、電腦整局一張。
# 學校版沒有記錄表：視窗一樣有，結果頁照舊。
# 用法：python3 tools/patch_v83.py
import json

SRC = '/home/claude/nanshe/nanshe-scoresheet.html'
SCH = '/home/claude/volleyball-scoresheet/tools/school/'


def one(t, a, b, n=1):
    c = t.count(a)
    assert c == n, (c, a[:90])
    return t.replace(a, b)


t = open(SRC, encoding='utf-8').read()
assert 'function setEndWin' not in t, 'already'

# ---------- 記錄表 SVG：可以多畫一層（點得到的格子） ----------
t = one(t, "function ctSvg(s,cr,blank){", "function ctSvg(s,cr,blank,extra){")
t = one(t, "+(blank?'':ctRes(s))+ctRoster(s,blank)+'</g>';",
        "+(blank?'':ctRes(s))+ctRoster(s,blank)+'</g>'+(extra||'');")
t = one(t, "/* App 記錄表分頁：各局、結果、判罰、記事都直接從協會記錄表裁出來",
        "/* 11/13 局結束的「本局」：記錄表上每個位置（先發背號和替補）、暫停的格子點了就能改。格子是透明的 rect，帶 data-act=\"cellfix\" */\n"
        "function ctHot(s,n,box){ // box：只畫這一塊裡面的格子（手機分兩塊裁）\n"
        "  var c=s.sets[n],T=sheetTeams(s,n),g=CTG.sets[n],h='';\n"
        "  function rect(x0,y0,x1,y1,k,v,lab){if(box&&(x1<box[0]+.5||x0>box[2]-.5))return '';return '<rect class=\"hot\" x=\"'+x0+'\" y=\"'+y0+'\" width=\"'+(x1-x0).toFixed(1)+'\" height=\"'+(y1-y0).toFixed(1)+'\" data-act=\"cellfix\" data-team=\"'+k+'\" data-v=\"'+v+'\"><title>'+lab+'</title></rect>'}\n"
        "  function blk(k,b,p){var R=b.rows,C=b.cols,i;\n"
        "    for(i=0;i<6;i++)h+=rect(C[i],R[2],C[i+1],R[6],k,n+':P:'+i,ROMAN[i]+' 位的先發和替補');\n"
        "    if(p&&p.to&&p.cols)h+=rect(p.cols[0],p.to[0][1]-9.6,p.cols[p.cols.length-1],p.to[1][1]+9.6,k,n+':T','暫停')}\n"
        "  if(n<3){blk(T.L,g.L,g.PL);blk(T.R,g.R,g.PR)}\n"
        "  else{blk(T.L,g.B1,g.P1);blk(T.R,g.B2,g.P2);if(c.swapSnap)blk(T.L,g.B3,g.P3)}\n"
        "  return h;\n"
        "}\n"
        "/* 手機寬度：兩隊（決勝局是換場前後和另一隊）分開裁，上下排，格子放大才點得到 */\n"
        "var CT_PARTS={1:[[32.9,112.6,391.9,310.2],[391.9,112.6,637.6,310.2]],2:[[639.4,109.8,913.7,311.4],[913.7,109.8,1161.7,311.4]],3:[[33.2,324.1,396.3,531.2],[396.3,324.1,641.2,531.2],[641.2,324.1,927.1,531.2]]};\n"
        "function ctViewHot(s,n){\n"
        "  var m0=1.2,lab=' role=\"img\" aria-label=\"第 '+n+' 局記錄表，點格子可以修改\">';\n"
        "  function mask(b){var y=b[1]-m0,hh=b[3]-b[1]+m0*2,ww=m0-.5;return '<rect x=\"'+(b[0]-m0)+'\" y=\"'+y+'\" width=\"'+ww+'\" height=\"'+hh+'\" fill=\"#fff\"/><rect x=\"'+(b[2]+.5)+'\" y=\"'+y+'\" width=\"'+ww+'\" height=\"'+hh+'\" fill=\"#fff\"/>'} // 分開裁時，旁邊那一隊露出來的一點點邊蓋掉\n"
        "  function one(b,w){var v=ctSvg(s,[b[0]-m0,b[1]-m0,b[2]-b[0]+m0*2,b[3]-b[1]+m0*2],false,(w?mask(b):'')+ctHot(s,n,b)).replace(/ width=\"[\\d.]+\" height=\"[\\d.]+\">/,lab);return '<div class=\"ctv ctv-set hot\"'+(w?' style=\"width:'+w+'%\"':'')+'>'+v+'</div>'}\n"
        "  if(innerWidth>=600)return one(CTG.setBox[n]);\n"
        "  var ps=CT_PARTS[n].filter(function(b,i){return n<3||i<2||s.sets[3].swapSnap}),mw=Math.max.apply(null,ps.map(function(b){return b[2]-b[0]}));\n"
        "  return '<div class=\"ctparts\">'+ps.map(function(b){return one(b,((b[2]-b[0])/mw*100).toFixed(1))}).join('')+'</div>';\n"
        "}\n"
        "/* App 記錄表分頁：各局、結果、判罰、記事都直接從協會記錄表裁出來")

# ---------- 局結束：「本局」分頁和按鈕 ----------
t = one(t, "  if(XP_ON)tabs.splice(tabs.length-1,0,['ref','裁判']);\n  var tab=ui.rtab||'res';",
        "  if(XP_ON)tabs.splice(tabs.length-1,0,['ref','裁判']);\n  if(pv&&XP_ON)tabs.unshift(['end','本局']);\n  var tab=ui.rtab||(pv&&XP_ON?'end':'res');")
t = one(t, "'>確定'+(matchOver(s)?'比賽':'本局')+'結束</button></div></div>':'';",
        "'>'+(matchOver(s)?'確定比賽結束':'下一局')+'</button></div></div>':'';")
t = one(t, "' 贏下第 '+s.setNo+' 局，請先和紙本核對</div>'", "' 贏下第 '+s.setNo+' 局</div>'")
t = one(t, "  if(XP_ON&&(tab==='pen'||tab==='note'||tab==='res'&&!over||/^s[123]$/.test(tab)))return",
        "  if(pv&&XP_ON&&tab==='end')return head+endView(s)+back;\n"
        "  if(XP_ON&&(tab==='pen'||tab==='note'||tab==='res'&&!over||/^s[123]$/.test(tab)))return")
t = one(t, "function pendingHtml(s,win){",
        "/* 11/13 局結束的「本局」：上面這局的記錄表（點格子改），下面結果 */\n"
        "function endView(s){\n"
        "  return '<div class=\"endview\"><p class=\"muted endhint\">跟紙本核對。暫停、替補、先發背號的格子點一下，就能修改或補記。</p>'+(ui.fixDone?'<p class=\"good fixdone\" role=\"status\">'+esc(ui.fixDone.t)+'</p>':'')+\n"
        "    ctViewHot(s,s.setNo)+'<div class=\"endres\">'+ctPage(s,'res')+'</div></div>';\n"
        "}\n"
        "/* 11/13 按完最後一分先跳視窗：比分、開始和結束時間（點了就能改）、經過幾分鐘。\n"
        "   時間按「確定」才存，按「復原上一步」就不算。確定過的那一分記在 ui.endOk，復原後再得分會重新跳 */\n"
        "function winPointId(m,n){var dead={},id='';m.events.forEach(function(e){if(e.type==='UNDO')dead[e.data.target]=1});\n"
        "  m.events.forEach(function(e){if(dead[e.id]||!e.data||e.data.set!==n)return;if(e.type==='POINT'||(e.type==='SANCTION'&&(e.data.kind==='P'||e.data.kind==='DP')))id=e.id});return id}\n"
        "function durText(a,b){if(!a||!b)return '填好開始和結束時間，就會算出經過幾分鐘';var d=hmDiff(a,b);return d==null||d>720?'時間看起來不對，請檢查':'經過 <b>'+d+'</b> 分鐘'+(d>180?'（超過 3 小時，請檢查時間）':'')}\n"
        "function endOkSaved(){try{return sessionStorage.getItem(KEY+'-endok')||null}catch(e){return null}}\n"
        "function seCopy(s){var v=JSON.parse(JSON.stringify(s)),c=v.sets[v.setNo];c.ended=true;c.winner=setWinner(s);if(!c.endAt)c.endAt=new Date().toISOString();return v}\n"
        "function setEndWin(s,m){\n"
        "  if(ui.page!=='play'||ui.pen||matchOver(s)||!setWinner(s))return '';\n"
        "  var n=s.setNo,wp=winPointId(m,n);if(!wp||ui.endOk===wp)return '';\n"
        "  var v=seCopy(s),c=v.sets[n],L=c.left||sheetTeams(v,n).L,R=other(L),st=setStartHM(v,n),en=setEndHM(v,n),g=Date.now()<(ui.noEnd||0);\n"
        "  var auto=v.info['en'+n]||!c.firstServeAt?'':' data-auto=\"'+Math.max(0,Math.round((new Date(c.lastPointAt||c.endAt)-new Date(c.firstServeAt))/60000))+'\"'; // 結束時間沒改過：開始時間改了，結束時間跟著移\n"
        "  return '<div class=\"scrim\"></div><div class=\"sheet setend\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"se-h\"><h2 id=\"se-h\">第 '+n+' 局結束</h2>'+\n"
        "    '<div class=\"sescore\"><span class=\"tpill '+L+'\">'+esc(tName(s,L))+'</span><b>'+c.score[L]+'</b><i>:</i><b>'+c.score[R]+'</b><span class=\"tpill '+R+'\">'+esc(tName(s,R))+'</span></div>'+\n"
        "    '<div class=\"setimes\"><label>開始<input id=\"se-st\" type=\"time\" value=\"'+esc(st)+'\" data-field=\"'+(n===1?'actual':'st'+n)+'\"></label><label>結束<input id=\"se-en\" type=\"time\" value=\"'+esc(en)+'\" data-field=\"en'+n+'\"'+auto+'></label></div>'+\n"
        "    '<p class=\"sedur\" id=\"sedur\" role=\"status\">'+durText(st,en)+'</p><p class=\"muted sehint\">'+(XP_ON?'時間跟紙本不同就點時間改。確定後核對這局的記錄表。':'時間不對就點時間改。確定後核對這局的結果。')+'</p>'+\n"
        "    '<div class=\"row\"><button class=\"guarded\" data-act=\"undo\"'+(g?' disabled':'')+'>↶ 復原上一步</button><button class=\"go guarded\" data-act=\"endok\" data-v=\"'+esc(wp)+'\"'+(g?' disabled':'')+'>確定</button></div></div>';\n"
        "}\n"
        "function pendingHtml(s,win){")
t = one(t, "kp+sheetHtml(s,m)+modalHtml(s)+penHtml(s)", "kp+sheetHtml(s,m)+setEndWin(s,m)+modalHtml(s)+penHtml(s)")
# 時間改了，經過分鐘馬上跟著變（不重畫整頁，免得按「確定」時按鈕被換掉）
t = one(t, "app.addEventListener('input',function(e){",
        "function seDur(e){var id=e.target.id;if(id!=='se-st'&&id!=='se-en')return;var a=document.getElementById('se-st'),b=document.getElementById('se-en'),d=document.getElementById('sedur');if(!a||!b||!d)return;\n"
        "  if(id==='se-en')b.removeAttribute('data-auto');else if(b.hasAttribute('data-auto')&&a.value)b.value=hmAdd(a.value,Number(b.getAttribute('data-auto')));\n"
        "  d.innerHTML=durText(a.value,b.value)}\n"
        "app.addEventListener('input',seDur);app.addEventListener('change',seDur);\n"
        "app.addEventListener('input',function(e){")
# 確定：時間跟算出來的不一樣才存（先存開始，結束時間會跟著開始重算，所以再比一次）
t = one(t, "    case 'endset':\n      if(Date.now()<(ui.noEnd||0))return;\n",
        "    case 'endok':\n      if(Date.now()<(ui.noEnd||0))return;\n"
        "      var seA=document.getElementById('se-st'),seB=document.getElementById('se-en');\n"
        "      if(seA&&seA.value&&seA.value!==setStartHM(seCopy(reduce(m.events)),n))dispatch('INFO_SET',{field:seA.getAttribute('data-field'),value:seA.value});\n"
        "      if(seB&&seB.value&&seB.value!==setEndHM(seCopy(reduce(m.events)),n))dispatch('INFO_SET',{field:seB.getAttribute('data-field'),value:seB.value});\n"
        "      ui.endOk=b.getAttribute('data-v'); ui.rtab=null; try{sessionStorage.setItem(KEY+'-endok',ui.endOk)}catch(e2){} break;\n"
        "    case 'endset':\n      if(Date.now()<(ui.noEnd||0))return;\n")
# 重新整理後，已經確定過的那一分不用再跳視窗
t = one(t, "pen:null,report:false,ackL:{t1:null,t2:null}}}", "pen:null,report:false,ackL:{t1:null,t2:null},endOk:endOkSaved()}}")
# 復原到這局還沒打完：局末才填的結束時間要清掉，不然真的打完時會沿用舊的
t = one(t, "if(last.type==='SET_STARTED'){ui.page='lineup';ui.sel=null;ui.luTeam=null}} break;",
        "if(last.type==='SET_STARTED'){ui.page='lineup';ui.sel=null;ui.luTeam=null}\n"
        "      var uaf=reduce(m.events),uan=uaf.setNo;if(!uaf.sets[uan].ended&&!setWinner(uaf)&&uaf.info['en'+uan])dispatch('INFO_SET',{field:'en'+uan,value:''})} break;")

# ---------- 8. 點格子：列出那一格的紀錄，點了用原本的更正；空的就補記 ----------
t = one(t, "  }else if(x.type==='samereq'){",
        "  }else if(x.type==='cellfix'){ // 11/13 「本局」記錄表上點的那一格\n"
        "    var cfT=x.kind==='T',cl=s.log.filter(function(q){return q.set===x.set&&q.team===k&&(cfT?q.kind==='T':q.kind==='S'&&q.idx===x.idx)}),clu=cfT?null:s.sets[x.set].lineups[k][x.idx];\n"
        "    var crow=function(q,i){return '<button class=\"fixrow '+q.team+'\" data-act=\"amendopen\" data-v=\"'+esc(q.id)+'\"><span>'+(cfT?'第 '+(i+1)+' 次':q.exc?'例外替補':'替補')+'</span><b>'+(cfT?'暫停':q.out+' 換 '+q.in)+'</b><em>'+q.score+'</em></button>'};\n"
        "    h='<h2><span class=\"tpill '+k+'\">'+esc(tName(s,k))+'</span> 第 '+x.set+' 局'+(cfT?'暫停':' '+ROMAN[x.idx]+' 位')+'</h2>';\n"
        "    if(!cfT)h+='<p class=\"subhint\">先發 <b>'+clu+'</b> 號</p><button data-act=\"cellfix\" data-team=\"'+k+'\" data-v=\"'+x.set+':L:'+x.idx+'\">先發背號打錯，改號碼</button><p class=\"subhint\">替補</p>';\n"
        "    h+=(cl.length?'<div class=\"fixlist\">'+cl.map(crow).join('')+'</div>':'<p class=\"note\">'+(cfT?'這局還沒有暫停。':'這個位置沒有替補。')+'</p>')+\n"
        "      (cl.length>=2?'':'<button data-act=\"insopen\" data-v=\"'+x.set+'\">＋ 補記'+(cfT?'暫停':'替補')+'</button>')+'<button data-act=\"close\">關閉</button>';\n"
        "  }else if(x.type==='samereq'){")
t = one(t, "    case 'insopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，不能再補記',until:Date.now()+2500};break} ui.sheet={type:'ins',set:Number(b.getAttribute('data-v'))||s.setNo}; break;",
        "    case 'insopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，不能再補記',until:Date.now()+2500};break} var ipr=ui.sheet&&ui.sheet.type==='cellfix'?ui.sheet:null; ui.sheet={type:'ins',set:Number(b.getAttribute('data-v'))||s.setNo};\n"
        "      if(ipr){ui.sheet.team=ipr.team;ui.sheet.kind=ipr.kind==='T'?'T':'S';if(ipr.kind==='P')ui.sheet.preIdx=ipr.idx;ui.sheet.back=ipr} break;\n"
        "    case 'cellfix':\n"
        "      if(matchOver(s)){ui.toast={t:'比賽已經確定結束，紀錄不能再改',until:Date.now()+2500};break}\n"
        "      var cfv=String(b.getAttribute('data-v')).split(':'),cfn=Number(cfv[0]),cfi=cfv[2]!=null?Number(cfv[2]):null,cfp=ui.sheet&&ui.sheet.type==='cellfix'?ui.sheet:null;\n"
        "      if(cfv[1]==='L'){ui.sheet={type:'fix',team:k,set:cfn,pos:cfi,pre:true,back:cfp};break}\n"
        "      ui.sheet={type:'cellfix',team:k,set:cfn,kind:cfv[1],idx:cfi}; break;")
t = one(t, "    case 'amendopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，紀錄不能再改',until:Date.now()+2500};break} ui.sheet={type:'amend',id:b.getAttribute('data-v')}; break;",
        "    case 'amendopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，紀錄不能再改',until:Date.now()+2500};break} var apr=ui.sheet&&ui.sheet.type==='cellfix'?ui.sheet:null; ui.sheet={type:'amend',id:b.getAttribute('data-v')}; if(apr)ui.sheet.back=apr; break;")
t = one(t, "      if(ix.kind==='S'){ix.anc=ia;break}\n",
        "      if(ix.kind==='S'){ix.anc=ia;if(ix.preIdx!=null){var ps0=insState(m,ix),pq=ps0.sets[ix.set].cur[ix.team][ix.preIdx];if(ps0.teams[ix.team].liberos.indexOf(pq)<0)ix.idx=ix.preIdx}break}\n")
t = one(t, "      ui.sheet.anc=null; ui.sheet.idx=null; ui.sheet.inNo=null; ui.sheet.err=null; break;",
        "      ui.sheet.anc=null; ui.sheet.idx=null; ui.sheet.inNo=null; ui.sheet.err=null; ui.sheet.preIdx=null; break;")
# 從格子直接打開「改先發背號」：返回回到那一格
t = one(t, "    case 'fixback': if(ui.sheet.no!=null)ui.sheet.no=null; else ui.sheet.pos=null; break;",
        "    case 'fixback': if(ui.sheet.no!=null)ui.sheet.no=null; else if(ui.sheet.pre)ui.sheet=ui.sheet.back||null; else ui.sheet.pos=null; break;")
# 確定刪除這一步只留「返回、確定刪除」，左上不再多一個返回
t = one(t, "      if(x.del){\n", "      if(x.del){stepBack='';\n")

# ---------- 使用說明 ----------
t = one(t, "一局打完會自動開結果頁，先和紙本核對，再按上方的「確定本局結束」。",
        "打完最後一分會跳出比分和時間，不對就點時間改，再按「確定」。接著跟紙本核對這局的記錄表，格子點一下就能改，核對完按上方的「下一局」。")
t = one(t, "確定之前都能按「復原上一步」。確定之後就不能改比分，所以要先核對。",
        "按「下一局」之前都能「復原上一步」，之後比分就不能改。暫停、替補和時間，在比賽確定結束前都還能到「更正」改。")
t = one(t, "打完一樣先核對，再按上方的「確定比賽結束」。", "最後一局一樣先確認時間、核對記錄表，再按上方的「確定比賽結束」。")

# ---------- 樣式 ----------
t = one(t, ".quicknote .qn{flex:1 1 40%}\n</style>",
        ".quicknote .qn{flex:1 1 40%}\n"
        "/* 11/13 局結束的視窗和「本局」 */\n"
        ".sheet.setend h2{text-align:center}\n"
        ".sescore{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:2px 0 6px}\n"
        ".sescore b{font-family:var(--num);font-size:44px;line-height:1}\n"
        ".sescore i{font-style:normal;font-size:30px;font-weight:700}\n"
        ".setimes{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n"
        ".setimes label{display:grid;gap:4px;font-weight:700;color:var(--muted);font-size:14px}\n"
        ".setimes input{min-height:48px;font-size:20px;font-weight:700;text-align:center;width:100%}\n"
        ".sedur{text-align:center;font-size:16px;margin:4px 0 0}\n"
        ".sedur b{font-family:var(--num);font-size:22px}\n"
        ".sehint{text-align:center;margin:0}\n"
        ".endview{display:flex;flex-direction:column;gap:10px;margin-block:auto}\n"
        ".endview>.ctv-set{max-width:1100px}\n"
        ".endhint{margin:0 2px}\n"
        ".ctparts{display:grid;gap:8px}\n"
        ".ctv.hot rect.hot{fill:transparent;cursor:pointer}\n"
        ".ctv.hot rect.hot:active{fill:rgba(46,108,183,.18)}\n"
        "@media (hover:hover){.ctv.hot rect.hot:hover{fill:rgba(46,108,183,.10)}}\n"
        "</style>")

open(SRC, 'w', encoding='utf-8').write(t)
print('source ok')

# ---------- 學校版：「贏下第 N 局」後面的字照舊；說明 ----------
p = open(SCH + 'patches.txt', encoding='utf-8').read()
p = one(p, "<<<<\n' 贏下第 '+s.setNo+' 局，請先和紙本核對</div>'\n====\n",
        "<<<<\n' 贏下第 '+s.setNo+' 局</div>'\n====\n")
open(SCH + 'patches.txt', 'w', encoding='utf-8').write(p)
fixes = {('sets', 'end'): ('一局打完會自動開結果頁，先核對比分，再按上方的「確定本局結束」。',
                           '打完最後一分會跳出比分和時間，不對就點時間改，再按「確定」。接著核對這局的結果，核對完按上方的「下一局」。'),
         ('sets', 'endback'): ('確定之前都能按「復原上一步」。確定之後就不能改比分，所以要先核對。',
                               '按「下一局」之前都能「復原上一步」，之後比分就不能改。暫停、替補和時間，在比賽確定結束前都還能到「更正」改。'),
         ('set3', 'final'): ('打完一樣先核對，再按上方的「確定比賽結束」。', '最後一局一樣先確認時間、核對結果，再按上方的「確定比賽結束」。')}
for fn, ind in (('help.json', 1), ('help-sheet.json', 0)):
    H = json.load(open(SCH + fn, encoding='utf-8'))
    done = 0
    for g in H:
        for c in g['cards']:
            key = (g['id'], c.get('img'))
            if key in fixes:
                a, b = fixes[key]
                assert c['d'] == a, (fn, key, c['d'])
                c['d'] = b
                done += 1
    assert done == 3, (fn, done)
    open(SCH + fn, 'w', encoding='utf-8').write(json.dumps(H, ensure_ascii=False, indent=ind, separators=(',', ': ')))
print('school ok')

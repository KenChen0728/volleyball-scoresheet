#!/usr/bin/env python3
"""11/12 朋友提議、使用者決定：賽前先輸入比賽資料，存成 A3 PDF 印出來當紙本記錄表。
- 印之前填了什麼就印什麼：表頭（比賽名稱、承辦城市、地點、場地、組別、場次、男女組、兩隊隊名、日期、時間）、右邊的球隊區（名單、隊長、自由球員、職員）、裁判（證明那格和司線員）、記事欄。
- 兩隊照賽程的左右：隊伍一在左、隊伍二在右；A、B 的圈不填。各局、判罰、比賽成績都留白。
- 可以印單張、選幾張或全選：名單頁「印紙本記錄表（A3）」（先勾好這一場），或「紀錄與名單」→「選擇要印的比賽」；列出還沒挑邊的比賽，多場存成一份 PDF，一場一頁 A3。
- 使用者 14:27「好」：打完比賽匯出的記錄表，表頭和名單也照賽程的左右（隊伍一在左），A、B 照挑邊結果圈（早上的紙本是這樣寫）。各局和比賽成績照舊（第 1 局 A 隊在左）。
- 學校版沒有匯出（XP_ON），不會出現。
用法：python3 tools/patch_v76.py [檔案]（預設改 /home/claude/nanshe/nanshe-scoresheet.html）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function ppList(' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# ── 表頭：照賽程（隊伍一在左），A、B 照挑邊；賽前空白記錄表不圈 ──
one("""function ctHead(s){
  var I=s.info,g=CTG.head,A=sheetTeams(s,1).A,B=other(A),o='';""",
    """function ctHead(s,blank){
  var I=s.info,g=CTG.head,A=sheetTeams(s,1).A,o=''; // 11/12 兩隊照賽程（隊伍一在左），A、B 照挑邊結果圈""")
one("""  o+=ctT(g.ca[0],g.ca[1]+.8,'A',13,'middle',INK,600)+ctT(g.cb[0],g.cb[1]+.8,'B',13,'middle',INK,600);
  o+=ctFit(g.ta[0],g.ta[1],g.ta[2],s.teams[A].name,15,'middle',600)+ctFit(g.tb[0],g.tb[1],g.tb[2],s.teams[B].name,15,'middle',600);""",
    """  if(!blank)o+=ctT(g.ca[0],g.ca[1]+.8,A==='t1'?'A':'B',13,'middle',INK,600)+ctT(g.cb[0],g.cb[1]+.8,A==='t1'?'B':'A',13,'middle',INK,600);
  o+=ctFit(g.ta[0],g.ta[1],g.ta[2],s.teams.t1.name,15,'middle',600)+ctFit(g.tb[0],g.tb[1],g.tb[2],s.teams.t2.name,15,'middle',600);""")
# ── 名單：一樣照賽程 ──
one("""function ctRoster(s){
  var g=CTG.roster,T=sheetTeams(s,1),A=T.A,B=T.B,R=g.rows,C=g.cols,o='';
  o+=ctT(g.ca[0],g.ca[1]+.8,'A',12.5,'middle',INK,600)+ctT(g.cb[0],g.cb[1]+.8,'B',12.5,'middle',INK,600);
  o+=ctFit(g.ta[0],g.ta[1],g.ty,s.teams[A].name,11,'middle',600)+ctFit(g.tb[0],g.tb[1],g.ty,s.teams[B].name,11,'middle',600);
  [A,B].forEach(function(k,j){""",
    """function ctRoster(s,blank){
  var g=CTG.roster,A=sheetTeams(s,1).A,R=g.rows,C=g.cols,o='';
  if(!blank)o+=ctT(g.ca[0],g.ca[1]+.8,A==='t1'?'A':'B',12.5,'middle',INK,600)+ctT(g.cb[0],g.cb[1]+.8,A==='t1'?'B':'A',12.5,'middle',INK,600);
  o+=ctFit(g.ta[0],g.ta[1],g.ty,s.teams.t1.name,11,'middle',600)+ctFit(g.tb[0],g.tb[1],g.ty,s.teams.t2.name,11,'middle',600);
  ['t1','t2'].forEach(function(k,j){""")
# ── 整張：賽前空白（blank）只畫填好的資料 ──
one("""function ctSvg(s,cr){
  var W=CT3.W,H=CT3.H,body=ctTpl()+'<g font-family="'+XP_FONT.replace(/'/g,'&apos;')+'">'+ctHead(s)+ctSets(s)+ctSan(s)+ctNotes(s)+ctProof(s)+ctRes(s)+ctRoster(s)+'</g>';""",
    """function ctSvg(s,cr,blank){
  var W=CT3.W,H=CT3.H,body=ctTpl()+'<g font-family="'+XP_FONT.replace(/'/g,'&apos;')+'">'+ctHead(s,blank)+(blank?'':ctSets(s)+ctSan(s))+ctNotes(s)+ctProof(s)+(blank?'':ctRes(s))+ctRoster(s,blank)+'</g>';""")

# ── 多頁 PDF、賽前紙本記錄表的清單和製作 ──
one("""function xpMsg(t,html){""", """/* 11/12 多頁 PDF（賽前紙本記錄表一次印好幾場，一場一頁） */
function xpPdfN(list,a3){
  var enc=new TextEncoder(),parts=[],len=0,off=[],PW=a3?1191:842,PH=a3?842:595,M=14,n=list.length;
  function add(x){var b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length}
  function obj(i,head,stream){off[i]=len;add(i+' 0 obj\\n'+head+'\\n');if(stream){add('stream\\n');add(stream);add('\\nendstream\\n')}add('endobj\\n')}
  add('%PDF-1.4\\n');obj(1,'<</Type/Catalog/Pages 2 0 R>>');obj(2,'<</Type/Pages/Count '+n+'/Kids['+list.map(function(p,j){return (3+j*3)+' 0 R'}).join(' ')+']>>');
  list.forEach(function(p,j){var b=3+j*3,w=PW-M*2,h=w*p.h/p.w;if(h>PH-M*2){h=PH-M*2;w=h*p.w/p.h}
    var x=(PW-w)/2,y=(PH-h)/2,cs=enc.encode('q '+w.toFixed(2)+' 0 0 '+h.toFixed(2)+' '+x.toFixed(2)+' '+y.toFixed(2)+' cm /Im Do Q');
    obj(b,'<</Type/Page/Parent 2 0 R/MediaBox[0 0 '+PW+' '+PH+']/Resources<</XObject<</Im '+(b+2)+' 0 R>>>>/Contents '+(b+1)+' 0 R>>');
    obj(b+1,'<</Length '+cs.length+'>>',cs);
    obj(b+2,'<</Type/XObject/Subtype/Image/Width '+p.w+'/Height '+p.h+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+p.bytes.length+'>>',p.bytes)});
  var N=3+n*3,xref=len,t='xref\\n0 '+N+'\\n0000000000 65535 f \\n';for(var i=1;i<N;i++)t+=('0000000000'+off[i]).slice(-10)+' 00000 n \\n';
  add(t+'trailer\\n<</Size '+N+'/Root 1 0 R>>\\nstartxref\\n'+xref+'\\n%%EOF\\n');
  return new Blob(parts,{type:'application/pdf'});
}
/* 還沒挑邊的比賽（可以印賽前紙本記錄表），照日期、時間、場次排 */
function ppList(){
  return db.matches.map(function(m){return {m:m,s:safeReduce(m)}}).filter(function(q){return q.s&&!q.s.sets[1].started&&!q.s.forfeit&&!q.s.preForfeit})
    .sort(function(a,b){var x=a.s.info,y=b.s.info;return String(x.date||'').localeCompare(String(y.date||''))||String(x.time||'').localeCompare(String(y.time||''))||(Number(x.game)||0)-(Number(y.game)||0)});
}
function ppInner(x){
  var pl=ppList(),sel=x.ids||{},ns=pl.filter(function(q){return sel[q.m.id]}).length,h='<h2>賽前紙本記錄表</h2>';
  if(!pl.length)return h+'<p class="note">沒有還沒挑邊的比賽。在主畫面「開始新比賽」填好資料、裁判和名單，還沒挑邊的比賽會列在這裡。</p><button data-act="close">關閉</button>';
  h+='<p class="subhint">點要印的比賽。填了什麼就印什麼，A、B 和各局留白。</p><div class="row"><button data-act="ppall">'+(ns===pl.length?'全不選':'全選')+'</button></div><div class="rlist pplist">'+pl.map(function(q){
    var I=q.s.info,c=cupOf(q.m),meta=[xpROC(I.date),I.time,I.game?'第 '+I.game+' 場':'',courtLabel(I.court),c?c.name:''].filter(Boolean).join('　');
    return '<button class="hrow bkone" data-act="pptoggle" data-id="'+esc(q.m.id)+'" aria-pressed="'+!!sel[q.m.id]+'"><span class="bkbox" aria-hidden="true"></span><span class="bktx"><span class="muted">'+esc(meta)+'</span><span class="hnames"><span>'+esc(tName(q.s,'t1'))+'</span><b>對</b><span>'+esc(tName(q.s,'t2'))+'</span></span></span></button>'}).join('')+'</div>';
  return h+'<button class="primary" data-act="ppgo"'+(ns?'':' disabled')+'>存成 PDF（'+ns+' 場，A3）</button><p class="muted">'+(platform()==='pc'?'檔案會存到「下載」資料夾。':'按下去會跳出分享選單，可以存到「檔案」或傳到 LINE。')+'</p><div id="xpmsg" class="muted" role="status"></div><button data-act="close">取消</button>';
}
function ppSheetHtml(){return ui.sheet&&ui.sheet.type==='pp'?'<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="賽前紙本記錄表">'+ppInner(ui.sheet)+'</div>':''}
function ppMake(){
  var x=ui.sheet;if(!x||x.type!=='pp'||ui.xpBusy)return;
  var list=ppList().filter(function(q){return x.ids&&x.ids[q.m.id]});if(!list.length)return;
  ui.xpBusy=true;var pages=[],i=0;
  function next(){
    if(i>=list.length){ui.xpBusy=false;xpSaveBlob(list.length===1?fname(list[0].s,'pdf').replace(/^排球記錄表_/,'紙本記錄表_'):'紙本記錄表_'+today()+'_'+list.length+'場.pdf',xpPdfN(pages,true));return}
    var q=list[i++];xpMsg(list.length===1?'正在製作…':'正在製作第 '+i+' 張，共 '+list.length+' 張…');
    xpCanvas(ctSvg(q.s,null,true),8e6).then(function(cv){return xpBlob(cv,'image/jpeg',.92).then(function(b){return b.arrayBuffer()}).then(function(buf){pages.push({bytes:new Uint8Array(buf),w:cv.width,h:cv.height});next()})})
      .catch(function(){ui.xpBusy=false;xpMsg('做不出來，請再按一次；還是不行就少選幾場')});
  }
  next();
}
function xpMsg(t,html){""")

# 比賽頁（名單頁）用 sheetHtml，紀錄與名單用 ppSheetHtml
one("""  }else if(x.type==='ins'){""", """  }else if(x.type==='pp'){
    h=ppInner(x);
  }else if(x.type==='ins'){""")
one("""+(view==='history'?bkSheetHtml():'')""", """+(view==='history'?bkSheetHtml()+(XP_ON?ppSheetHtml():''):'')""")  # 學校版沒有匯出，這些函式會被拿掉，不能呼叫

# ── 入口 ──
one("""  return ok?'<button class="primary full" data-act="rnext">下一步：挑邊</button>':'';""",
    """  return (ok?'<button class="primary full" data-act="rnext">下一步：挑邊</button>':'')+(XP_ON?'<button class="ppone" data-act="ppsel" data-v="cur">印紙本記錄表（A3）</button>':'');""")
one("""'</section><section><h2>備份和匯入</h2>""",
    """'</section>'+(XP_ON?'<section><h2>賽前紙本記錄表</h2><button class="ppone" data-act="ppsel">選擇要印的比賽</button></section>':'')+'<section><h2>備份和匯入</h2>""")
one("""    case 'insopen':""", """    case 'ppsel': ui.sheet={type:'pp',ids:{}}; if(b.getAttribute('data-v')==='cur'&&m)ui.sheet.ids[m.id]=1; break;
    case 'pptoggle': var pid=b.getAttribute('data-id'),pids=ui.sheet&&ui.sheet.ids; if(pids){if(pids[pid])delete pids[pid];else pids[pid]=1} break;
    case 'ppall': var pall=ppList(),pis=ui.sheet&&ui.sheet.ids; if(pis){var allOn=pall.every(function(q){return pis[q.m.id]});ui.sheet.ids={};if(!allOn)pall.forEach(function(q){ui.sheet.ids[q.m.id]=1})} break;
    case 'ppgo': ppMake(); return;
    case 'insopen':""")

# ── 說明 ──
one("""還沒開賽可以回主畫面，資料會留著。到「進行中」按「繼續準備」接著填。""",
    """還沒開賽可以回主畫面，資料會留著。到「進行中」按「繼續準備」接著填。要先印紙本記錄表，在名單頁按「印紙本記錄表」，或到「紀錄與名單」一次選好幾場。""")

# ── 樣式 ──
assert s.count('</style>') == 1
s = s.replace('</style>', """/* 11/12 賽前紙本記錄表 */
.ppone{flex:none;width:100%;min-height:48px;margin-top:8px}
.pplist{max-height:min(46vh,420px);overflow:auto}
</style>""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v76 ok')

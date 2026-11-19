#!/usr/bin/env python3
"""11/19 賽前登錄單（A4 橫式 PDF，一場一張）：沒有紙本記錄表的比賽，賽前讓球隊寫出賽球員背號、姓名，隊長、執行教練簽名；
賽後記錄員寫比賽成績、裁判簽名，交競賽組（使用者 11/19）。
- 名單、職員、簽名、證明、比賽成績、記事欄、簽章直接從協會記錄表裁出來，和紙本一樣；上面換成比賽資料。
- 名單預設空白（使用者 22:3x「預設可以印成空白的」）。有賽程的場次先印隊名、日期、時間、場地、場次、男女組；
  排名賽隊伍待定就留空（寫上說明，例如 A組第一）；也可以加印完全空白的。
- 南社盃現場沒有印表機，賽前印好帶去。資料夾「賽程」的「印登錄單」。先跑 patch_v97～v105。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function regSvg' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:80]); s=s.replace(a,b)

JS=r"""/* ===== 11/19 賽前登錄單（A4 橫式）：協會記錄表右下角那一塊（記事、證明、比賽成績、名單、簽名）裁出來，上面換成比賽資料 ===== */
var REG_BOX=[262,262,1170,832];
function regT(x0,x1,y,t,max,anc,col,wt){t=String(t==null?'':t).trim();if(!t)return '';var fs=Math.min(max,(x1-x0)/Math.max(xpUnits(t),.5));return ctT(anc==='start'?x0:anc==='end'?x1:(x0+x1)/2,y+(max-fs)*.25,t,fs,anc||'middle',col||INK,wt)}
function regRect(x0,y0,x1,y1,fill,w){return '<rect x="'+x0+'" y="'+y0+'" width="'+(x1-x0)+'" height="'+(y1-y0)+'" fill="'+(fill||'none')+'"'+(fill?'':' stroke="#000" stroke-width="'+(w||.9)+'"')+'/>'}
function regLn(a,b,c,d,w){return '<line x1="'+a+'" y1="'+b+'" x2="'+c+'" y2="'+d+'" stroke="#000" stroke-width="'+(w||.6)+'"/>'}
/* 一張登錄單要用的比賽狀態：用事件算出來，和真的比賽一樣，記錄表那幾塊才畫得出來 */
function regState(c,it){
  var inf={name:c?c.name:'',division:'',group:'',game:'',date:'',time:'',city:'',place:'',court:''},hint=['',''];
  var prev=c?db.matches.filter(function(q){return q.cup===c.id}).map(function(q){return safeReduce(q)}).filter(function(q){return q&&!q.info.sample})[0]:null;
  if(prev){inf.place=prev.info.place||'';inf.city=prev.info.city||''} // 地點照這個資料夾上一場
  if(it){inf.division=it.division||'';inf.game=String(schedNos(c)[it.id]||'');inf.date=it.date||'';inf.time=it.time||'';inf.court=it.court||''}
  var ev=[{type:'MATCH_CREATED',data:{info:inf}}];
  if(it)[['t1','n1'],['t2','n2']].forEach(function(q,i){var t=schedTeam(c,it[q[0]]);if(t)ev.push({type:'TEAM_NAME_SET',data:{team:q[0],value:t.team.name}});else hint[i]=it[q[1]]||''});
  ev.forEach(function(e,i){e.id='reg'+i;e.seq=i+1;e.at=new Date().toISOString();e.device='reg'});
  return {s:reduce(ev),hint:hint};
}
function regHead(s,hint){
  var I=s.info,K='#000',o='',L=272,R=918,y=[324,354,384,414],c=[L,336,594,658,R],v=c[1],w=c[3];
  o+=regT(L,1162,291,(I.name?I.name+'　':'')+'排球比賽登錄單',26,'start',K,700);
  o+=regRect(L,y[0],R,y[3]);[1,2].forEach(function(i){o+=regLn(L,y[i],R,y[i])});[1,2,3].forEach(function(j){o+=regLn(c[j],y[0],c[j],y[3])});
  [['日期','時間'],['場地','場次'],['組別','地點']].forEach(function(r,ri){var cy=(y[ri]+y[ri+1])/2;o+=ctT((c[0]+c[1])/2,cy,r[0],14,'middle',K,500)+ctT((c[2]+c[3])/2,cy,r[1],14,'middle',K,500)});
  var cy=(y[0]+y[1])/2,d=ctROC(I.date),m=String(I.date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  [[d[0],v+12,v+62,'年',v+72],[d[1]?String(+d[1]):'',v+86,v+124,'月',v+134],[d[2]?String(+d[2]):'',v+148,v+186,'日',v+196]].forEach(function(q){o+=regT(q[1],q[2],cy,q[0],16,'middle',INK,600)+ctT(q[4],cy,q[3],14,'middle',K,500)});
  if(m)o+=ctT(v+210,cy,'（'+'日一二三四五六'.charAt(new Date(+m[1],m[2]-1,+m[3]).getDay())+'）',14,'start',INK,600);
  var hm=ctHM(I.time);o+=regT(w+40,w+92,cy,hm[0],16,'middle',INK,600)+ctT(w+104,cy,'時',14,'middle',K,500)+regT(w+118,w+170,cy,hm[1],16,'middle',INK,600)+ctT(w+182,cy,'分',14,'middle',K,500);
  cy=(y[1]+y[2])/2;o+=regT(v+10,c[2]-10,cy,I.court,16,'start',INK,600)+regT(w+10,R-10,cy,I.game,16,'start',INK,600);
  cy=(y[2]+y[3])/2;[['男子組',v+12],['女子組',v+104]].forEach(function(q){o+=regRect(q[1],cy-7,q[1]+14,cy+7)+ctT(q[1]+20,cy,q[0],14,'start',K,500);if(I.division===q[0])o+=ctL(q[1],cy-7,q[1]+14,cy+7,1.2)+ctL(q[1]+14,cy-7,q[1],cy+7,1.2)}); // 台灣是打 X
  o+=regT(v+196,c[2]-10,cy,I.group,15,'start',INK,600)+regT(w+10,R-10,cy,I.place,15,'start',INK,600);
  /* 兩隊：賽程左邊的是第一隊；A、B 賽前挑邊才知道，留給記錄員寫 */
  var ty=[428,484];[[L,580,'t1',0],[610,R,'t2',1]].forEach(function(q){var nm=s.teams[q[2]].name,mid=(ty[0]+ty[1])/2+5;
    o+=regRect(q[0],ty[0],q[1],ty[1])+ctT(q[0]+8,ty[0]+11,'隊伍',11,'start',K,500);
    if(nm)o+=regT(q[0]+40,q[1]-40,mid,nm,26,'middle',INK,700);else if(hint[q[3]])o+=ctT((q[0]+q[1])/2,mid,'待定（'+hint[q[3]]+'）',14,'middle','#777',500)});
  o+=ctT(595,(ty[0]+ty[1])/2,'對',16,'middle',K,600);
  ['賽前請兩隊在右邊名單寫上出賽球員的背號、姓名（自由球員寫在「自由防守球員」），隊長、執行教練簽名。','A、B 由挑邊決定，記錄員填寫。賽後記錄員填寫比賽成績，裁判員簽名後交競賽組。'].forEach(function(t,i){o+=regT(L,R,502+i*18,t,12.5,'start',K,500)});
  return o;
}
function regSvg(s,hint){
  var B=REG_BOX,W=B[2]-B[0],H=B[3]-B[1],F=XP_FONT.replace(/'/g,'&apos;');
  var mask=regRect(B[0],B[1],B[2],319.9,'#fff')+regRect(B[0],B[1],927.6,540.2,'#fff')+regRect(B[0],789,475.0,826,'#fff')+regRect(B[0],778,271.4,789,'#fff'); // 第 3 局、判罰、裁判委員那一格不要
  var foot=regLn(271.7,791,475.2,791,.48)+regLn(271.7,824.3,475.2,824.3,.48)+regLn(271.7,790.8,271.7,824.5,.48)+ctT(373.5,807.6,'裁判委員簽章',16,'middle','#000',500);
  var body=ctTpl()+mask+'<g font-family="'+F+'">'+foot+regHead(s,hint)+ctRoster(s,true)+'<text x="1162" y="829" font-size="5.5" fill="#888" text-anchor="end" dominant-baseline="central">排球電子記錄表 © 2026 Ken Chen</text></g>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'"><rect width="'+W+'" height="'+H+'" fill="#fff"/><clipPath id="regc"><rect width="'+W+'" height="'+H+'"/></clipPath><g clip-path="url(#regc)"><g transform="translate('+(-B[0])+' '+(-B[1])+')">'+body+'</g></g></svg>';
}
function regMake(){
  var x=ui.cupSheet,c=theCup();if(!x||x.type!=='scprint'||ui.xpBusy||!c)return;
  var list=liveSched(c).sort(schedSort).filter(function(it){return x.ids[it.id]}).map(function(it){return regState(c,it)});
  for(var k=0;k<(x.blank||0);k++)list.push(regState(c,null));
  if(!list.length)return;
  ui.xpBusy=true;var pages=[],i=0,nm=String(c.name||'').replace(/[\\\/:*?"<>|]/g,'').trim();
  function next(){
    if(i>=list.length){ui.xpBusy=false;xpSaveBlob('登錄單_'+(nm?nm+'_':'')+today()+'_'+list.length+'張.pdf',xpPdfN(pages,false));return}
    var q=list[i++];xpMsg(list.length===1?'正在製作…':'正在製作第 '+i+' 張，共 '+list.length+' 張…');
    xpCanvas(regSvg(q.s,q.hint),6e6).then(function(cv){return xpBlob(cv,'image/jpeg',.92).then(function(b){return b.arrayBuffer()}).then(function(buf){pages.push({bytes:new Uint8Array(buf),w:cv.width,h:cv.height});next()})})
      .catch(function(){ui.xpBusy=false;xpMsg('做不出來，請再按一次；還是不行就少選幾張')});
  }
  next();
}
"""
one("function xpMsg(t,html){",JS+"function xpMsg(t,html){")

# 資料夾「賽程」：印登錄單（協會表那段只有完整版有，學校版沒有這顆）
one("""'<section><div class="shead"><h2>賽程 '+sl.length+' 場</h2><button class="linkbtn" data-act="scnew">新增比賽</button></div>'""",
    """'<section><div class="shead"><h2>賽程 '+sl.length+' 場</h2><span class="scbtns">'+(XP_ON&&typeof regMake==='function'?'<button class="linkbtn" data-act="scprint">印登錄單</button>':'')+'<button class="linkbtn" data-act="scnew">新增比賽</button></span></div>'""")
one("""  if(x.type==='scedit'){""","""  if(x.type==='scprint'){var all=liveSched(c).sort(schedSort),nos=schedNos(c),sel=x.ids||{},ns=all.filter(function(it){return sel[it.id]}).length,tot=ns+(x.blank||0);
    return '<h2>印賽前登錄單</h2><p class="muted">A4 橫式，一場一張。名單留白給球隊寫背號、姓名和簽名；有賽程的先印隊名、日期、時間、場地、場次。</p>'+
      (all.length?'<div class="row"><button data-act="scpall">'+(ns===all.length?'全不選':'全選')+'</button></div><div class="rlist pplist">'+all.map(function(it){var A=schedSide(c,it,'t1'),B=schedSide(c,it,'t2'),st=schedMatch(it);
        return '<button class="hrow bkone" data-act="scptog" data-id="'+esc(it.id)+'" aria-pressed="'+!!sel[it.id]+'"><span class="bkbox" aria-hidden="true"></span><span class="bktx"><span class="muted">'+esc(it.division)+'第 '+nos[it.id]+' 場　'+esc(schedDay(it.date))+' '+esc(it.time||'')+(it.court?'　場地：'+esc(it.court):'')+(st?'　已開始':'')+'</span><span class="hnames"><span>'+schedSideHtml(A)+'</span><b>對</b><span>'+schedSideHtml(B)+'</span></span></span></button>'}).join('')+'</div>':'<p class="note">賽程裡還沒有比賽。按「新增比賽」排好賽程，就能先印隊名；也可以直接印空白的。</p>')+
      '<div class="regblank"><span>另外加印空白的<small class="muted">排名賽、賽程以外的比賽用</small></span><span class="regstep"><button data-act="scpb" data-v="-1" aria-label="少一張"'+((x.blank||0)<=0?' disabled':'')+'>－</button><b>'+(x.blank||0)+' 張</b><button data-act="scpb" data-v="1" aria-label="多一張"'+((x.blank||0)>=20?' disabled':'')+'>＋</button></span></div>'+
      '<button class="primary" data-act="scpgo"'+(tot?'':' disabled')+'>存成 PDF（'+tot+' 張，A4）</button><p class="muted">'+(platform()==='pc'?'檔案會存到「下載」資料夾。':'按下去會跳出分享選單，可以存到「檔案」或傳到 LINE。')+'</p><div id="xpmsg" class="muted" role="status"></div><button class="ghost" data-act="close">取消</button>'}
  if(x.type==='scedit'){""")
one("""    case 'scnew': ui.cupSheet=schedEditOf(c,null); return true;""","""    case 'scnew': ui.cupSheet=schedEditOf(c,null); return true;
    case 'scprint': var pids={},pall=liveSched(c);pall.forEach(function(it){if(!schedMatch(it))pids[it.id]=1});ui.cupSheet={type:'scprint',ids:pids,blank:pall.length?0:1}; return true; // 還沒開始的先全選
    case 'scptog': if(x&&x.ids){var tid=b.getAttribute('data-id');if(x.ids[tid])delete x.ids[tid];else x.ids[tid]=1} return true;
    case 'scpall': if(x&&x.ids){var pa=liveSched(c),on=pa.every(function(it){return x.ids[it.id]});x.ids={};if(!on)pa.forEach(function(it){x.ids[it.id]=1})} return true;
    case 'scpb': if(x)x.blank=Math.max(0,Math.min(20,(x.blank||0)+Number(b.getAttribute('data-v')))); return true;""")
one("    case 'scnew': case 'scopen':","    case 'scpgo': regMake(); return; // 跟賽前紙本一樣，不重畫，畫面上的進度字才不會被洗掉\n    case 'scprint': case 'scptog': case 'scpall': case 'scpb': case 'scnew': case 'scopen':")
one('\n</style>\n\n<div class="statusband"','''
.scbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.regblank{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r)}
.regblank>span:first-child{display:flex;flex-direction:column;gap:2px;font-weight:600}
.regblank small{font-weight:500}
.regstep{display:flex;align-items:center;gap:8px;flex:none}
.regstep button{width:44px;min-height:44px;padding:0;font-size:20px}
.regstep b{min-width:44px;text-align:center}
</style>

<div class="statusband"''')
open(SRC,'w',encoding='utf8').write(s)
print('patched v106')

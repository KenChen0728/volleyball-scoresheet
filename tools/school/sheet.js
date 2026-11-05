/* ========== SCORE SHEET：照美國學校的空白表畫，每局一張，一律白底黑框藍字，由事件推算 ==========
   座標直接取自空白表（1206×917 的圖），改版面時對照原圖最快。
   填法：所有動作都寫在「目前發球員」那一列，每個動作一格。
   發球方得分寫分數；失分寫 ⊣，對方下一位發球員那列寫方框分數。T／S 是發球方，Tx／Sx 是接發方。 */
var SHEET_VB={x:52,y:56,w:1102,h:776};
function usOrder(c,k){return c.serve===k?[0,1,2,3,4,5]:[1,2,3,4,5,0]}
function usLine(x1,y,x2){return svL(x1,y,x2,y,1,'#000')}
function usDash(x1,y,x2){return '<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" stroke="#000" stroke-width=".7" stroke-dasharray="3 2.2"/>'}
function usW(t,fs){var u=0;String(t).split('').forEach(function(ch){u+=ch.charCodeAt(0)>255?1:.56});return u*fs}
function usEntries(c){
  var R={t1:[[],[],[],[],[],[]],t2:[[],[],[],[],[],[]]},run={t1:{},t2:{}};
  c.tape.forEach(function(e){
    var mine=e.st,row=R[mine][e.si];
    if(e.k==='T')row.push({t:e.team===mine?'T':'Tx'});
    else if(e.k==='S')row.push({t:(e.team===mine?'S':'Sx')+e.in+'/'+e.out});
    else if(e.team===mine){
      run[e.team][e.sc]=1;
      if(e.pen){row.push({t:'Px'});row.push({t:'P-'+e.sc})}
      else row.push({t:String(e.sc)});
    }else{
      run[e.team][e.sc]=2;
      row.push(e.pen?{t:'P'}:{lost:1});
      R[e.team][e.ni].push({t:(e.pen?'P-':'')+e.sc,box:1});
    }
  });
  return {rows:R,run:run};
}
/* 一列 20 格（10 欄 2 行）。超過 20 個動作就把欄數加多，不會寫出格子外 */
function usCells(x,y,w,h,list){
  var cols=Math.max(10,Math.ceil(list.length/2)),cw=w/cols,ch=h/2,o='',i;
  for(i=1;i<cols;i++)o+=svL(x+cw*i,y,x+cw*i,y+h,.6,'#333');
  list.forEach(function(e,i){
    var r=Math.floor(i/cols),q=i%cols,cx=x+cw*(q+.5),cy=y+ch*(r+.5);
    if(e.lost){var a=Math.min(cw,ch)*.3;o+=svL(cx-a,cy,cx+a,cy,1.6,INK)+svL(cx+a,cy-a*1.1,cx+a,cy+a*1.1,1.6,INK);return}
    var len=String(e.t).length,fs=Math.min(15.5,(cw-(e.box?7:3))/(len*.56)),tw=usW(e.t,fs);
    o+=svT(cx,cy+.5,e.t,fs,INK,600);
    if(e.box)o+='<rect x="'+(cx-tw/2-3).toFixed(1)+'" y="'+(cy-ch/2+2)+'" width="'+(tw+6).toFixed(1)+'" height="'+(ch-4)+'" fill="none" stroke="'+INK+'" stroke-width="1.3"/>';
  });
  return o;
}
function usComments(s,n,k){
  var c=s.sets[n],a=[],NM={IR:'IR',DW:'Delay W',DP:'Delay P',W:'Y',P:'R',E:'EXP',D:'DQ'},ST={C:'Coach',AC:'Asst',T:'Trainer',M:'Doctor'},o=other(k);
  function sc(r){return r[k]+'-'+r[o]}
  s.sanctions.forEach(function(x){if(x.set!==n||x.team!==k)return;var w=typeof x.who==='number'?' #'+x.who:ST[x.who]?' '+ST[x.who]:'';a.push(NM[x.kind]+w+' ('+x.score.replace(':','-')+')')});
  c.subs[k].forEach(function(x){if(!x.exc)return;var p=x.score.split(':');a.push('Exc S'+x.in+'/'+x.out+(x.injury?' INJ':'')+' ('+sc({t1:p[0],t2:p[1]})+')')});
  s.injuries.forEach(function(x){if(x.set===n&&x.team===k)a.push('INJ #'+x.no+' ('+sc(x.raw)+')')});
  (s.redes||[]).forEach(function(x){if(x.set===n&&x.team===k)a.push('L #'+x.old+(x.no!==null?' > #'+x.no:' out')+' ('+sc(x.raw)+')')});
  (s.acc||[]).forEach(function(x){if(x.set===n&&x.team===k)a.push((x.back?'C for AC':'AC for C')+' ('+sc(x.raw)+')')});
  if(s.incomplete&&s.incomplete.set===n&&s.incomplete.team===k)a.push('Incomplete team');
  if(s.forfeit===k)a.push('Forfeit');
  if(s.preForfeit&&other(s.preForfeit.winner)===k)a.push('Forfeit: '+s.preForfeit.reason);
  if(n===1&&k==='t1'&&s.info.remarks)a.push(s.info.remarks);
  return a;
}
/* 寫不下兩行就縮字，再寫不下就一條線寫兩行 */
function usWrap(items,w1,w2,y1,y2,x1,x2){
  function fill(fs,cap){
    var lines=[],cur='',lim=w1;
    function next(){lines.push(cur);cur='';lim=lines.length>=(cap>2?2:1)?w2:w1}
    items.forEach(function(q,n){
      var t=q+(n<items.length-1?';  ':'');
      if(cur&&usW(cur+t,fs)>lim)next();
      while(usW(t,fs)>lim&&t.length>1){var i=t.length;while(i>1&&usW(t.slice(0,i),fs)>lim)i--;cur=t.slice(0,i);t=t.slice(i);next()}
      cur+=t;
    });
    if(cur)lines.push(cur);
    return lines;
  }
  var opt=[[13.5,2],[11.5,2],[9.5,4]],fs=9.5,L=[];
  for(var i=0;i<opt.length;i++){fs=opt[i][0];L=fill(fs,opt[i][1]);if(L.length<=opt[i][1])break}
  var ys=fs>9.5?[[x1,y1-8],[x2,y2-8]]:[[x1,y1-14],[x1,y1-4],[x2,y2-14],[x2,y2-4]],o='';
  L.slice(0,ys.length).forEach(function(t,i){o+=svT(ys[i][0]+2,ys[i][1],t.replace(/;\s*$/,''),fs,INK,500,'start')});
  return o;
}
function usBlock(s,n,k,B,E){
  var c=s.sets[n],t=s.teams[k],o='',ord=usOrder(c,k),on=c.started,cap=t.captain;
  var capUse=on&&c.lineups[k].indexOf(cap)<0&&c.subRows[k].every(function(r){return !r.some(function(x){return x.in===cap})})?c.gameCaptain[k]:cap;
  /* 暫停 */
  o+=svR(B.x0,140,B.tw,16,1.4)+svT(B.x0+B.tw/2,148,'Time-Outs',11.5);
  [0,1].forEach(function(i){var w=B.tw/2,x=B.x0+w*i;o+=svR(x,156,w,16,1.4);var v=c.toRows[k][i];if(v)o+=svT(x+w/2,164.5,v.replace(':','-'),13,INK,600)});
  o+=svR(B.x0+B.tw,140,B.x9-B.x0-B.tw,32,1.4);
  /* 表頭 */
  o+=svT(B.so,185,'Serve',9.5)+svT(B.so,195,'Order',9.5)+svT(B.pn0+7,183,'Player',15,'#000',400,'start')+svT(B.pn0+7,199,'No.',15,'#000',400,'start');
  o+=svT(B.c0+8,199,B.team,14.5,'#000',400,'start')+svT(B.l1,199,'L1:',14.5,'#000',400,'start')+svT(B.l2,199,'L2:',14.5,'#000',400,'start');
  var nm=t.name||'',nx=B.c0+(B.team==='Team'?52:54);
  if(nm)o+=svT(nx,197,nm,Math.min(16,(B.l1-nx-8)/Math.max(usW(nm,1),1)),INK,600,'start');
  var libs=sheetLibs(t);
  if(libs[0]!=null)o+=svT(B.l1+28,197,libs[0],16,INK,600,'start');
  if(libs[1]!=null)o+=svT(B.l2+28,197,libs[1],16,INK,600,'start');
  /* 六列 */
  var en=on?E.rows[k]:null;
  for(var r=0;r<6;r++){
    var y=207+48.2*r,yM=y+24.1,idx=ord[r];
    o+=svT(B.so0+6,y+21,r+1,18,'#000',700,'start');
    o+=usDash(B.pn0,yM,B.x9);
    if(on){
      var st=c.lineups[k][idx],tags=function(q){return (q===capUse?'c ':'')+q};
      if(st!=null)o+=svT((B.pn0+B.c0)/2,y+12.5,tags(st),17,INK,600);
      var ins=[];c.subRows[k][idx].forEach(function(x){if(x.in!==st&&ins.indexOf(x.in)<0)ins.push(x.in)});
      if(ins.length){var tx=ins.map(tags).join(',');o+=svT((B.pn0+B.c0)/2,y+36.5,tx,Math.min(17,(B.c0-B.pn0-6)/(tx.length*.56)),INK,600)}
    }
    o+=usCells(B.c0,y,B.x9-B.c0,48.2,on?en[idx]:[]);
    o+=svL(B.x0,y+48.2,B.x9,y+48.2,1.5);
  }
  /* 框線 */
  [B.x0,B.pn0,B.c0].forEach(function(x,i){o+=svL(x,172,x,496,i===2?2:1.5)});
  o+=svL(B.x0,207,B.x9,207,1.5);
  /* 替補次數：每上場一人畫一格 */
  var used=c.subs[k].length;
  o+=svT(B.sub,544,'Subs:',15,'#000',700,'start');
  for(var i=1;i<=18;i++){
    var sx=(B.sub===76?0:553)+(i<10?185+17.8*(i-1):351+27*(i-10));
    o+=svT(sx,544,i,14.5,'#000',700);
    if(i<=used)o+=svL(sx-7,551,sx+7,537,1.6,INK);
  }
  if(used>18)o+=svT((B.sub===76?566:1119)+13,544,'+'+(used-18),13,INK,700,'start');
  /* 備註 */
  o+=svT(B.cm,580,'Comments:',14,'#000',400,'start')+usLine(B.cm+78,587,B.cm+494)+usLine(B.cm-1,613,B.cm+496);
  o+=usWrap(usComments(s,n,k),416,496,587,613,B.cm+78,B.cm-1);
  return o;
}
/* 兩欄 1–30。打超過 30 分時列數加多，不會寫出框外 */
function usRunning(run,x,on,top){
  var o='',a=x+21,b=x+43,rows=Math.max(15,Math.ceil(top/2)),st=270/rows,fs=Math.min(12,st*.72);
  for(var r=0;r<rows;r++){
    var y=220+st*r+(rows>15?-(18-st)/2:0);
    [[r+1,a],[r+rows+1,b]].forEach(function(q){
      var v=q[0],m=q[1],h=Math.min(8,st*.45);o+=svT(m,y,v,fs,'#000',700);
      if(on&&run[v]){o+=svL(m-8,y+h-1.5,m+8,y-h+1.5,1.5,INK);if(run[v]===2)o+='<rect x="'+(m-10)+'" y="'+(y-h)+'" width="20" height="'+h*2+'" fill="none" stroke="'+INK+'" stroke-width="1.3"/>'}
    });
  }
  return o;
}
function usSvg(s,n,W){
  var c=s.sets[n],i=s.info,E=c.started?usEntries(c):null,V=SHEET_VB,o='';
  var attr=W?' width="'+W+'" height="'+Math.round(W*V.h/V.w)+'"':'';
  /* 標題 */
  o+=svT(603,78,'VOLLEYBALL SCORE SHEET',20.5,'#000',700);
  [['Date:',76,110,208,usDate(i.date)],['Home:',221,264,590,tName2(s,'t1')],['Visitor:',603,647,957,tName2(s,'t2')],['Set #:',973,1010,1092,n]].forEach(function(q){
    o+=svT(q[1],111,q[0],14.5,'#000',400,'start')+usLine(q[2],118,q[3]);
    if(q[4]!=='')o+=svT((q[2]+q[3])/2,109.5,q[4],Math.min(15.5,(q[3]-q[2]-6)/Math.max(usW(q[4],1),1)),INK,600);
  });
  /* 兩隊：左 Home，右 Visitor */
  o+=usBlock(s,n,'t1',{x0:68,x9:537,tw:165,so:88.5,so0:70,pn0:110,c0:182,l1:385,l2:470,team:'Team',sub:76,cm:78},E);
  o+=usBlock(s,n,'t2',{x0:649,x9:1138,tw:153,so:668.5,so0:651,pn0:689,c0:768,l1:975,l2:1060,team:'Team:',sub:623,cm:624},E);
  /* 中間 */
  o+=svR(538,140,110,32,1.4)+svT(593,148,'First Serve',10.5)+svT(593,160,'(check box below)',10);
  o+=svR(538,172,58,35,1.5)+svR(596,172,52,35,1.5);
  if(c.serve)o+=svT(c.serve==='t1'?567:622,190,'X',22,INK,700);
  o+=svR(538,207,58,289,1.5)+svR(596,207,52,289,1.5);
  var top=Math.max(c.score.t1,c.score.t2);
  o+=usRunning(E?E.run.t1:{},538,!!E,top)+usRunning(E?E.run.t2:{},594,!!E,top);
  /* 最下列 */
  o+=svR(68,496,470,21,1.8)+svT(521,506.5,'Final Score:',14.5,'#000',700,'end');
  o+=svR(538,496,58,21,1.8)+svR(596,496,52,21,1.8)+svR(648,496,490,21,1.8)+svR(1085,496,53,21,1.8);
  o+=svT(1076,506.5,'Official Verification',14.5,'#000',700,'end');
  if(c.ended){o+=svT(567,506.5,c.score.t1,16,INK,700)+svT(622,506.5,c.score.t2,16,INK,700)}
  o+=svR(68,140,1070,377,2.4);
  /* 裁判 */
  [['Referee',78,135,575,643,i.referee],['Umpire',620,678,1125,643,i.umpire],['Scorekeeper',78,170,568,681,i.scorer]].forEach(function(q){
    o+=svT(q[1],q[4],q[0],14.5,'#000',700,'start')+usLine(q[2],q[4]+7,q[3]);
    if(q[5])o+=svT((q[2]+q[3])/2,q[4]-2,q[5],Math.min(15.5,(q[3]-q[2]-8)/Math.max(usW(q[5],1),1)),INK,600);
  });
  /* 說明 */
  function key(x,y,t,w){return svT(x,y,t,14,'#000',w||700,'start')}
  o+=key(76,725,'Key:')+key(129,725,'c = Playing Captain')+key(353,725,'1 = Point');
  o+=svL(484,725,498,725,1.6)+svL(498,718,498,732,1.6)+key(506,725,'=  Loss of Rally');
  o+='<rect x="663.5" y="718" width="14" height="14" fill="none" stroke="#000" stroke-width="1.3"/>'+key(682,725,'= Point Scored Off Loss of Rally');
  o+='<path d="M979.5 717.5 972 732h15z" fill="none" stroke="#000" stroke-width="1.3"/>'+key(990,725,'= Libero Point');
  [[129,'P-1 = Penalty Point'],[339,'P = Penalty'],[471,'Px = Penalty Opponent'],[728,'R = Replay'],[919,'RS = Re-Serve']].forEach(function(q){o+=key(q[0],746,q[1])});
  [[129,'T = Time-out'],[307,'Tx = Time-out Opponent'],[544,'S = Substitution Serving Team'],[814,'Sx = Opponent Substitution']].forEach(function(q){o+=key(q[0],767,q[1])});
  o+='<text x="76" y="795" font-size="13.7" dominant-baseline="central">If the receiving team wins the rally, it receives a point which is recorded on the line of the <tspan font-weight="700">NEXT</tspan> server’s number and a square is drawn around it. <tspan font-weight="700">Also</tspan> draw a</text>';
  o+='<text x="76" y="812" font-size="13.7" dominant-baseline="central">square around the same point on the team’s running score.</text>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+V.x+' '+V.y+' '+V.w+' '+V.h+'"'+attr+' role="img" aria-label="第 '+n+' 局記錄表" font-family="Arial,Helvetica,\'PingFang TC\',\'Noto Sans TC\',\'Microsoft JhengHei\',sans-serif"><rect x="'+V.x+'" y="'+V.y+'" width="'+V.w+'" height="'+V.h+'" fill="#fff"/>'+o+'</svg>';
}
function tName2(s,k){return s.teams[k].name||''}
function usDate(d){var p=String(d||'').split('-');return p.length===3?Number(p[1])+'/'+Number(p[2])+'/'+p[0]:String(d||'')}
function setSvg(s,n,tap){return '<div class="sv-wrap ussheet"'+(tap?' data-act="fsopen"':'')+'>'+usSvg(s,n)+'</div>'}
/* 存檔：記錄表畫成圖。不靠外部套件，沒有網路也能做 */
function usCanvas(s,n,W){
  return new Promise(function(ok,no){
    var img=new Image(),H=Math.round(W*SHEET_VB.h/SHEET_VB.w);
    img.onload=function(){var cv=document.createElement('canvas');cv.width=W;cv.height=H;var g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,W,H);g.drawImage(img,0,0,W,H);ok(cv)};
    img.onerror=function(){no(new Error('svg'))};
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(usSvg(s,n,W));
  });
}
function usBlob(cv,type,q){return new Promise(function(ok,no){cv.toBlob(function(b){b?ok(b):no(new Error('blob'))},type,q)})}
/* 最小的 PDF：每頁一張 JPEG，A4 橫向 */
function pdfBytes(pages){
  var enc=new TextEncoder(),parts=[],len=0,off=[],PW=842,PH=595,M=14;
  function add(x){var b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length}
  function obj(i,head,stream){off[i]=len;add(i+' 0 obj\n'+head+'\n');if(stream){add('stream\n');add(stream);add('\nendstream\n')}add('endobj\n')}
  var kids=pages.map(function(_,i){return (3+i*3)+' 0 R'}).join(' ');
  add('%PDF-1.4\n');
  obj(1,'<</Type/Catalog/Pages 2 0 R>>');
  obj(2,'<</Type/Pages/Count '+pages.length+'/Kids['+kids+']>>');
  pages.forEach(function(p,i){
    var w=PW-M*2,h=w*p.h/p.w;if(h>PH-M*2){h=PH-M*2;w=h*p.w/p.h}
    var x=(PW-w)/2,y=(PH-h)/2,cs=enc.encode('q '+w.toFixed(2)+' 0 0 '+h.toFixed(2)+' '+x.toFixed(2)+' '+y.toFixed(2)+' cm /Im Do Q');
    obj(3+i*3,'<</Type/Page/Parent 2 0 R/MediaBox[0 0 '+PW+' '+PH+']/Resources<</XObject<</Im '+(5+i*3)+' 0 R>>>>/Contents '+(4+i*3)+' 0 R>>');
    obj(4+i*3,'<</Length '+cs.length+'>>',cs);
    obj(5+i*3,'<</Type/XObject/Subtype/Image/Width '+p.w+'/Height '+p.h+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+p.bytes.length+'>>',p.bytes);
  });
  var n=3+pages.length*3,xref=len,t='xref\n0 '+n+'\n0000000000 65535 f \n';
  for(var i=1;i<n;i++)t+=('0000000000'+off[i]).slice(-10)+' 00000 n \n';
  add(t+'trailer\n<</Size '+n+'/Root 1 0 R>>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
}
function saveBlob(name,blob){
  var msg=document.getElementById('rvmsg'),file=null;
  try{file=new File([blob],name,{type:blob.type})}catch(e){}
  ui.ready={name:name,blob:blob};
  function again(t){if(msg)msg.innerHTML=t+'<button class="linkbtn" data-act="rpready">按這裡存下來</button>'}
  if(file&&platform()!=='pc'&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:name}).then(function(){if(msg)msg.textContent='已分享，請確認檔案有存到'}).catch(function(e){if(e&&e.name==='AbortError'){if(msg)msg.textContent='';return}again('做好了，')});
    return;
  }
  try{
    var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(u)},60000);
    if(msg)msg.textContent=inAppName()?'這裡可能下載不了，請改用 Safari 或 Chrome 再存一次':'已送出下載，請到下載資料夾確認有「'+name+'」';
  }catch(e){again('這裡不能直接下載，')}
}
function usBusy(t){var m=document.getElementById('rvmsg');if(m)m.textContent=t}
function usSavePdf(s){
  var list=setList(s).filter(function(n){return s.sets[n].started}),pages=[],W=2200;
  usBusy('正在製作記錄表…');
  list.reduce(function(p,n){
    return p.then(function(){return usCanvas(s,n,W)}).then(function(cv){return usBlob(cv,'image/jpeg',.9).then(function(b){return b.arrayBuffer()}).then(function(buf){pages.push({bytes:new Uint8Array(buf),w:cv.width,h:cv.height})})});
  },Promise.resolve()).then(function(){saveBlob(fname(s,'pdf'),pdfBytes(pages))}).catch(function(){usBusy('做不出來，請改用「存成圖片」')});
}
function usSavePng(s,n){
  usBusy('正在製作圖片…');
  usCanvas(s,n,2200).then(function(cv){return usBlob(cv,'image/png')}).then(function(b){saveBlob(fname(s,'png').replace('.png','_Set'+n+'.png'),b)}).catch(function(){usBusy('做不出來，請改用畫面截圖')});
}

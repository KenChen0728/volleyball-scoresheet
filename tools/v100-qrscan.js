/* 11/16 觀看比賽的「掃描 QR code」：在 App 裡開相機，掃到記錄台的 QR code 就開始觀看。
   為什麼不用手機內建相機：iPhone 內建相機掃到網址會用 Safari 打開，不是主畫面上的 App（兩邊資料分開）。
   解碼不用外部套件、不用網路：有 BarcodeDetector（Android Chrome）就用內建的，沒有（iPhone）用下面的 qrDecode。
   qrDecode 照 ISO/IEC 18004 和 ZXing 的做法：灰階→區塊門檻二值化→找三個定位角（1:1:3:1:1）→估版本、找對位點→
   透視轉換取樣→格式資訊→去遮罩→讀碼字→Reed-Solomon 更正→解出文字。支援版本 1～10、四種更正等級、數字／英數／位元組模式。 */
var qrDecode=(function(){
  var EXP=new Array(512),LOG=new Array(256),i,x;
  for(i=0,x=1;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}
  for(i=255;i<512;i++)EXP[i]=EXP[i-255];
  function mul(a,b){return a&&b?EXP[LOG[a]+LOG[b]]:0}
  function div(a,b){return a?EXP[(LOG[a]+255-LOG[b])%255]:0}
  /* 每個版本、每種更正等級（L、M、Q、H）：[每塊更正字數, [[塊數, 每塊資料字數], …]] */
  var ECB=[null,
    [[7,[[1,19]]],[10,[[1,16]]],[13,[[1,13]]],[17,[[1,9]]]],
    [[10,[[1,34]]],[16,[[1,28]]],[22,[[1,22]]],[28,[[1,16]]]],
    [[15,[[1,55]]],[26,[[1,44]]],[18,[[2,17]]],[22,[[2,13]]]],
    [[20,[[1,80]]],[18,[[2,32]]],[26,[[2,24]]],[16,[[4,9]]]],
    [[26,[[1,108]]],[24,[[2,43]]],[18,[[2,15],[2,16]]],[22,[[2,11],[2,12]]]],
    [[18,[[2,68]]],[16,[[4,27]]],[24,[[4,19]]],[28,[[4,15]]]],
    [[20,[[2,78]]],[18,[[4,31]]],[18,[[2,14],[4,15]]],[26,[[4,13],[1,14]]]],
    [[24,[[2,97]]],[22,[[2,38],[2,39]]],[22,[[4,18],[2,19]]],[26,[[4,14],[2,15]]]],
    [[30,[[2,116]]],[22,[[3,36],[2,37]]],[20,[[4,16],[4,17]]],[24,[[4,12],[4,13]]]],
    [[18,[[2,68],[2,69]]],[26,[[4,43],[1,44]]],[24,[[6,19],[2,20]]],[28,[[6,15],[2,16]]]]];
  var AP=[[],[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  /* 格式資訊：5 位元（更正等級 2 位＋遮罩 3 位）加 BCH，再和 0x5412 互斥 */
  var FMT=[];for(i=0;i<32;i++){var r=i<<10;for(var k=14;k>=10;k--)if((r>>>k)&1)r^=0x537<<(k-10);FMT.push(((i<<10)|r)^0x5412)}
  var LEVEL_IDX={1:0,0:1,3:2,2:3}; // 格式裡的等級碼 → ECB 的位置（L、M、Q、H）
  var MASKS=[function(r,c){return (r+c)%2===0},function(r){return r%2===0},function(r,c){return c%3===0},function(r,c){return (r+c)%3===0},
    function(r,c){return (Math.floor(r/2)+Math.floor(c/3))%2===0},function(r,c){return r*c%2+r*c%3===0},function(r,c){return (r*c%2+r*c%3)%2===0},function(r,c){return ((r+c)%2+r*c%3)%2===0}];
  function popcnt(v){var n=0;while(v){n+=v&1;v>>>=1}return n}

  /* 二值化：8×8 區塊算平均，再用周圍 5×5 個區塊的平均當門檻（ZXing HybridBinarizer）。1＝深色 */
  function binarize(lum,w,h){
    var B=8,bw=Math.ceil(w/B),bh=Math.ceil(h/B),avg=new Float32Array(bw*bh),thr=new Float32Array(bw*bh),bx,by,x,y,x0,x1,y0,y1;
    for(by=0;by<bh;by++){y0=by*B;y1=Math.min(h,y0+B);
      for(bx=0;bx<bw;bx++){x0=bx*B;x1=Math.min(w,x0+B);
        var sum=0,mn=255,mx=0;
        for(y=y0;y<y1;y++){var o=y*w;for(x=x0;x<x1;x++){var v=lum[o+x];sum+=v;if(v<mn)mn=v;if(v>mx)mx=v}}
        var a=sum/((y1-y0)*(x1-x0));
        if(mx-mn<=24){a=mn/2;if(by>0&&bx>0){var nb=(avg[(by-1)*bw+bx]+2*avg[by*bw+bx-1]+avg[(by-1)*bw+bx-1])/4;if(mn<nb)a=nb}}
        avg[by*bw+bx]=a}}
    for(by=0;by<bh;by++)for(bx=0;bx<bw;bx++){var s=0,cy,cx;
      for(cy=by-2;cy<=by+2;cy++){var ry=(cy<0?0:cy>=bh?bh-1:cy)*bw;for(cx=bx-2;cx<=bx+2;cx++)s+=avg[ry+(cx<0?0:cx>=bw?bw-1:cx)]}
      thr[by*bw+bx]=s/25}
    var bits=new Uint8Array(w*h);
    for(y=0;y<h;y++){var o2=y*w,tr=(y>>3)*bw;for(x=0;x<w;x++)bits[o2+x]=lum[o2+x]<=thr[tr+(x>>3)]?1:0}
    return bits;
  }

  /* 找定位角：一列一列找「深 淺 深深深 淺 深」1:1:3:1:1，再直的、橫的各確認一次 */
  function ratioOk(sc){var tot=sc[0]+sc[1]+sc[2]+sc[3]+sc[4];if(tot<7)return false;var m=tot/7,v=m/1.6;
    return Math.abs(m-sc[0])<v&&Math.abs(m-sc[1])<v&&Math.abs(3*m-sc[2])<3*v&&Math.abs(m-sc[3])<v&&Math.abs(m-sc[4])<v}
  function finders(bits,w,h){
    var found=[];
    function dark(x,y){return bits[y*w+x]===1}
    function cross(cx,cy,dx,dy,maxC,origTot){
      var sc=[0,0,0,0,0],x=cx,y=cy,inb=function(){return x>=0&&y>=0&&x<w&&y<h};
      while(inb()&&dark(x,y)){sc[2]++;x-=dx;y-=dy}if(!inb())return null;
      while(inb()&&!dark(x,y)&&sc[1]<=maxC){sc[1]++;x-=dx;y-=dy}if(!inb()||sc[1]>maxC)return null;
      while(inb()&&dark(x,y)&&sc[0]<=maxC){sc[0]++;x-=dx;y-=dy}if(sc[0]>maxC)return null;
      x=cx+dx;y=cy+dy;
      while(inb()&&dark(x,y)){sc[2]++;x+=dx;y+=dy}if(!inb())return null;
      while(inb()&&!dark(x,y)&&sc[3]<maxC){sc[3]++;x+=dx;y+=dy}if(!inb()||sc[3]>=maxC)return null;
      while(inb()&&dark(x,y)&&sc[4]<maxC){sc[4]++;x+=dx;y+=dy}if(sc[4]>=maxC)return null;
      var tot=sc[0]+sc[1]+sc[2]+sc[3]+sc[4];if(5*Math.abs(tot-origTot)>=2*origTot)return null;
      if(!ratioOk(sc))return null;
      var end=dx?x:y;return {c:end-sc[4]-sc[3]-sc[2]/2,tot:tot};
    }
    function possible(sc,row,endX){
      var tot=sc[0]+sc[1]+sc[2]+sc[3]+sc[4],cx=endX-sc[4]-sc[3]-sc[2]/2;
      var v=cross(Math.floor(cx),row,0,1,sc[2]*2,tot);if(!v)return false;
      var hz=cross(Math.floor(cx),Math.floor(v.c),1,0,sc[2]*2,tot);if(!hz)return false;
      var X=hz.c,Y=v.c,ms=(tot+v.tot+hz.tot)/21;
      for(var k=0;k<found.length;k++){var f=found[k];
        if(Math.abs(Y-f.y)<=ms&&Math.abs(X-f.x)<=ms&&Math.abs(ms-f.ms)<=Math.max(1,f.ms)){var n=f.n+1;f.x=(f.x*f.n+X)/n;f.y=(f.y*f.n+Y)/n;f.ms=(f.ms*f.n+ms)/n;f.n=n;return true}}
      found.push({x:X,y:Y,ms:ms,n:1});return true;
    }
    for(var y=0;y<h;y++){
      var sc=[0,0,0,0,0],st=0,row=y*w;
      for(var x=0;x<w;x++){
        if(bits[row+x]){if(st&1)st++;sc[st]++}
        else if(st&1){sc[st]++}
        else if(st===4){
          if(ratioOk(sc)&&possible(sc,y,x)){sc=[0,0,0,0,0];st=0}
          else{sc=[sc[2],sc[3],sc[4],1,0];st=3}
        }else{st++;sc[st]++}
      }
      if(st===4&&ratioOk(sc))possible(sc,y,w);
    }
    return found;
  }
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  /* 從找到的定位角挑三個：大小差不多、排成直角等腰三角形的那組；回傳多組，第一組最像 */
  function pickThree(fs){
    fs=fs.slice().sort(function(a,b){return b.n-a.n}).slice(0,10);
    var best=[];
    for(var a=0;a<fs.length;a++)for(var b=a+1;b<fs.length;b++)for(var c=b+1;c<fs.length;c++){
      var P=[fs[a],fs[b],fs[c]],ms=(P[0].ms+P[1].ms+P[2].ms)/3;
      if(Math.max(P[0].ms,P[1].ms,P[2].ms)>1.6*Math.min(P[0].ms,P[1].ms,P[2].ms))continue;
      var d=[dist(P[1],P[2]),dist(P[0],P[2]),dist(P[0],P[1])],hi=d.indexOf(Math.max(d[0],d[1],d[2]));
      var s1=d[(hi+1)%3],s2=d[(hi+2)%3],hyp=d[hi];
      if(Math.min(s1,s2)<10*ms)continue;
      var score=Math.abs(s1-s2)/Math.max(s1,s2)+Math.abs(hyp*hyp-(s1*s1+s2*s2))/(hyp*hyp)-0.02*Math.min(P[0].n+P[1].n+P[2].n,30)/3;
      if(score>0.8)continue;
      var B=P[hi],A=P[(hi+1)%3],C=P[(hi+2)%3];
      if((C.x-B.x)*(A.y-B.y)-(C.y-B.y)*(A.x-B.x)<0){var t=A;A=C;C=t}
      best.push({tl:B,tr:C,bl:A,ms:ms,score:score});
    }
    return best.sort(function(p,q){return p.score-q.score}).slice(0,3);
  }
  /* 透視轉換：模組座標 → 影像座標。點多於 4 個時用最小平方法（正規方程＋高斯消去） */
  function fitH(src,dst){
    var n=src.length,M=[],k,j,r;if(n<4)return null;
    for(r=0;r<8;r++){M.push(new Float64Array(9))}
    function addRow(row,rhs){for(var a=0;a<8;a++){if(!row[a])continue;for(var b=0;b<8;b++)M[a][b]+=row[a]*row[b];M[a][8]+=row[a]*rhs}}
    for(k=0;k<n;k++){var u=src[k][0],v=src[k][1],X=dst[k][0],Y=dst[k][1];addRow([u,v,1,0,0,0,-u*X,-v*X],X);addRow([0,0,0,u,v,1,-u*Y,-v*Y],Y)}
    for(j=0;j<8;j++){var p=j;for(r=j+1;r<8;r++)if(Math.abs(M[r][j])>Math.abs(M[p][j]))p=r;
      if(Math.abs(M[p][j])<1e-9)return null;var t=M[j];M[j]=M[p];M[p]=t;
      for(r=0;r<8;r++)if(r!==j){var f=M[r][j]/M[j][j];if(f)for(k=j;k<9;k++)M[r][k]-=f*M[j][k]}}
    var h=[];for(j=0;j<8;j++)h.push(M[j][8]/M[j][j]);
    return function(u,v){var z=h[6]*u+h[7]*v+1;return [(h[0]*u+h[1]*v+h[2])/z,(h[3]*u+h[4]*v+h[5])/z]};
  }
  /* 定位角四邊的外緣：從中心往 ±u、±v 走，數到「深→淺→深→淺」的第三次變化，就是 7×7 外框的邊（離中心 3.5 格） */
  function edgePts(bits,w,h,f,dirs,mc,src,dst,ms){
    for(var q=0;q<4;q++){var dx=dirs[q][0],dy=dirs[q][1],L=Math.hypot(dx,dy);if(!L)continue;dx/=L;dy/=L;
      var ch=0,prev=1,lastDark=0,maxT=ms*6;
      for(var t=0;t<=maxT;t+=0.5){var px=Math.round(f.x+dx*t),py=Math.round(f.y+dy*t);if(px<0||py<0||px>=w||py>=h)break;
        var b=bits[py*w+px];if(b!==prev){ch++;prev=b;if(ch===3){var e=(lastDark+t)/2;src.push([mc[0]+dirs[q][2]*3.5,mc[1]+dirs[q][3]*3.5]);dst.push([f.x+dx*e,f.y+dy*e]);break}}
        if(b)lastDark=t}
    }
  }
  /* 對位點：照目前的轉換猜位置，在附近用 5×5 模組的樣子比對（中心深、一圈淺、外圈深） */
  function findAlignAt(bits,w,h,H,ac,ar){
    var p=H(ac+0.5,ar+0.5),pu=H(ac+1.5,ar+0.5),pv=H(ac+0.5,ar+1.5),ux=pu[0]-p[0],uy=pu[1]-p[1],vx=pv[0]-p[0],vy=pv[1]-p[1];
    var ms=Math.max(1,(Math.hypot(ux,uy)+Math.hypot(vx,vy))/2),R=Math.max(3,ms*2.5),step=Math.max(0.75,ms/4);
    var best=-1,bxs=0,bys=0,bn=0;
    for(var yy=p[1]-R;yy<=p[1]+R;yy+=step)for(var xx=p[0]-R;xx<=p[0]+R;xx+=step){
      var sc=0,ok=true;
      for(var dy=-2;dy<=2&&ok;dy++)for(var dx=-2;dx<=2;dx++){
        var px=Math.round(xx+dx*ux+dy*vx),py=Math.round(yy+dx*uy+dy*vy);if(px<0||py<0||px>=w||py>=h){ok=false;break}
        if(bits[py*w+px]===(Math.max(Math.abs(dx),Math.abs(dy))!==1?1:0))sc++}
      if(!ok)continue;
      if(sc>best){best=sc;bxs=xx;bys=yy;bn=1}else if(sc===best){bxs+=xx;bys+=yy;bn++}
    }
    return best>=22?[bxs/bn,bys/bn]:null;
  }
  function funcMask(N,ver){
    var F=[],r,c;for(r=0;r<N;r++)F.push(new Uint8Array(N));
    function reg(x0,y0,ww,hh){for(var y=y0;y<y0+hh;y++)for(var x=x0;x<x0+ww;x++)if(y>=0&&x>=0&&y<N&&x<N)F[y][x]=1}
    reg(0,0,9,9);reg(N-8,0,8,9);reg(0,N-8,9,8);reg(6,9,1,N-17);reg(9,6,N-17,1);
    var ap=AP[ver],L=ap.length-1;
    for(r=0;r<ap.length;r++)for(c=0;c<ap.length;c++){if((r===0&&(c===0||c===L))||(r===L&&c===0))continue;reg(ap[c]-2,ap[r]-2,5,5)}
    if(ver>=7){reg(N-11,0,3,6);reg(0,N-11,6,3)}
    return F;
  }
  /* Reed-Solomon 更正（Berlekamp-Massey＋Chien＋Forney）；更正不了回傳 false */
  function rsFix(cw,ec){
    var n=cw.length,S=[],j,k,any=false;
    for(j=0;j<ec;j++){var s=0;for(k=0;k<n;k++)s=mul(s,EXP[j])^cw[k];S.push(s);if(s)any=true}
    if(!any)return true;
    var C=[1],Bp=[1],L=0,m=1,b=1;
    for(var r=0;r<ec;r++){
      var d=S[r];for(k=1;k<=L;k++)d^=mul(C[k]||0,S[r-k]);
      if(!d){m++;continue}
      var coef=div(d,b),T=C.slice(),need=Bp.length+m;
      while(C.length<need)C.push(0);
      for(k=0;k<Bp.length;k++)C[k+m]^=mul(coef,Bp[k]);
      if(2*L<=r){L=r+1-L;Bp=T;b=d;m=1}else m++;
    }
    if(L>ec/2)return false;
    var pos=[];
    for(k=0;k<n;k++){var p=n-1-k,inv=(255-p%255)%255,val=0;for(j=0;j<C.length;j++)if(C[j])val^=mul(C[j],EXP[(inv*j)%255]);if(!val)pos.push(k)}
    if(pos.length!==L)return false;
    var Om=[];for(j=0;j<ec;j++){var o=0;for(k=0;k<=j;k++)o^=mul(S[k],C[j-k]||0);Om.push(o)}
    for(var e=0;e<pos.length;e++){
      var pp=n-1-pos[e],Xi=EXP[pp%255],Xinv=EXP[(255-pp%255)%255],num=0,den=0;
      for(j=0;j<Om.length;j++)num^=mul(Om[j],EXP[(LOG[Xinv]*j)%255]);
      for(j=1;j<C.length;j+=2)den^=mul(C[j]||0,EXP[(LOG[Xinv]*(j-1))%255]);
      if(!den)return false;
      cw[pos[e]]^=mul(Xi,div(num,den));
    }
    for(j=0;j<ec;j++){var s2=0;for(k=0;k<n;k++)s2=mul(s2,EXP[j])^cw[k];if(s2)return false}
    return true;
  }
  function readText(data,ver){
    var bi=0,total=data.length*8,out=[],str='';
    function rd(n){if(bi+n>total)throw 0;var v=0;for(var q=0;q<n;q++){v=v<<1|((data[(bi>>3)]>>>(7-(bi&7)))&1);bi++}return v}
    var AN='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
    function flush(){if(out.length){var t;try{t=decodeURIComponent(escape(String.fromCharCode.apply(null,out)))}catch(e){t=String.fromCharCode.apply(null,out)}str+=t;out=[]}}
    try{while(total-bi>=4){var mode=rd(4),n,q;
      if(mode===0)break;
      if(mode===4){n=rd(ver<10?8:16);for(q=0;q<n;q++)out.push(rd(8))}
      else if(mode===2){flush();n=rd(ver<10?9:11);for(q=0;q+1<n;q+=2){var v=rd(11);str+=AN[Math.floor(v/45)]+AN[v%45]}if(n%2)str+=AN[rd(6)]}
      else if(mode===1){flush();n=rd(ver<10?10:12);while(n>=3){str+=('00'+rd(10)).slice(-3);n-=3}if(n===2)str+=('0'+rd(7)).slice(-2);else if(n===1)str+=rd(4)}
      else if(mode===7){rd(8)}
      else break}}catch(e){}
    flush();return str;
  }
  /* 從三個角和版本試著解一次。plain：不用定位角外緣（螢幕反光、摩爾紋讓外緣量歪時的備案） */
  function tryGrid(bits,w,h,tri,N,plain){
    var ver=(N-17)/4;if(ver<1||ver>10||ver%1)return null;
    var tl=tri.tl,tr=tri.tr,bl=tri.bl,ux=tr.x-tl.x,uy=tr.y-tl.y,vx=bl.x-tl.x,vy=bl.y-tl.y;
    var src=[[3.5,3.5],[N-3.5,3.5],[3.5,N-3.5]],dst=[[tl.x,tl.y],[tr.x,tr.y],[bl.x,bl.y]];
    var dirs=[[ux,uy,1,0],[-ux,-uy,-1,0],[vx,vy,0,1],[-vx,-vy,0,-1]];
    if(!plain){edgePts(bits,w,h,tl,dirs,[3.5,3.5],src,dst,tri.ms);edgePts(bits,w,h,tr,dirs,[N-3.5,3.5],src,dst,tri.ms);edgePts(bits,w,h,bl,dirs,[3.5,N-3.5],src,dst,tri.ms)}
    var H=src.length>=6?fitH(src,dst):null;
    if(!H){src.push([N-3.5,N-3.5]);dst.push([tr.x+bl.x-tl.x,tr.y+bl.y-tl.y]);H=fitH(src,dst)}
    if(!H)return null;
    if(ver>=2){var ap=AP[ver],La=ap.length-1;
      for(var ai=La;ai>=0;ai--)for(var aj=La;aj>=0;aj--){if((ai===0&&(aj===0||aj===La))||(ai===La&&aj===0))continue;
        var fa=findAlignAt(bits,w,h,H,ap[aj],ap[ai]);if(fa){src.push([ap[aj]+0.5,ap[ai]+0.5]);dst.push(fa);H=fitH(src,dst)||H}}}
    var G=[],r,c;
    for(r=0;r<N;r++){var row=new Uint8Array(N);for(c=0;c<N;c++){var p=H(c+0.5,r+0.5),px=Math.floor(p[0]),py=Math.floor(p[1]);if(px<0||py<0||px>=w||py>=h)return null;row[c]=bits[py*w+px]}G.push(row)}
    var f1=0,f2=0,k;
    for(k=0;k<=5;k++)f1|=G[k][8]<<k;f1|=G[7][8]<<6;f1|=G[8][8]<<7;f1|=G[8][7]<<8;for(k=9;k<15;k++)f1|=G[8][14-k]<<k;
    for(k=0;k<8;k++)f2|=G[8][N-1-k]<<k;for(k=8;k<15;k++)f2|=G[N-15+k][8]<<k;
    var bd=99,fi=-1;for(k=0;k<32;k++){var dd=Math.min(popcnt(f1^FMT[k]),popcnt(f2^FMT[k]));if(dd<bd){bd=dd;fi=k}}
    if(bd>3)return null;
    var lvl=LEVEL_IDX[fi>>3],mask=MASKS[fi&7],F=funcMask(N,ver),raw=[],cur=0,nb=0;
    for(var right=N-1;right>=1;right-=2){if(right===6)right=5;
      for(var vert=0;vert<N;vert++)for(var jj=0;jj<2;jj++){var cc=right-jj,up=((right+1)&2)===0,rr=up?N-1-vert:vert;
        if(!F[rr][cc]){cur=cur<<1|(G[rr][cc]^(mask(rr,cc)?1:0));if(++nb===8){raw.push(cur);cur=0;nb=0}}}}
    var spec=ECB[ver][lvl],ec=spec[0],blocks=[];
    spec[1].forEach(function(g){for(var q=0;q<g[0];q++)blocks.push({d:g[1],cw:[]})});
    var maxD=blocks[blocks.length-1].d,ix=0,b2;
    for(k=0;k<maxD;k++)for(b2=0;b2<blocks.length;b2++)if(k<blocks[b2].d)blocks[b2].cw.push(raw[ix++]);
    for(k=0;k<ec;k++)for(b2=0;b2<blocks.length;b2++)blocks[b2].cw.push(raw[ix++]);
    if(ix>raw.length)return null;
    var data=[];
    for(b2=0;b2<blocks.length;b2++){var cw=blocks[b2].cw;if(!rsFix(cw,ec))return null;for(k=0;k<blocks[b2].d;k++)data.push(cw[k])}
    var t=readText(data,ver);return t||null;
  }
  function attempt(bits,w,h){
    var tris=pickThree(finders(bits,w,h));
    for(var t=0;t<tris.length;t++){var tri=tris[t];
      var est=(dist(tri.tl,tri.tr)+dist(tri.tl,tri.bl))/2/tri.ms+7,N=Math.round(est);
      switch(N&3){case 0:N++;break;case 2:N--;break;case 3:N+=2;break}
      var tried={},cand=[N,N-4,N+4,N-8,N+8];
      for(var q=0;q<cand.length;q++){if(cand[q]<21||tried[cand[q]])continue;tried[cand[q]]=1;var r=tryGrid(bits,w,h,tri,cand[q])||tryGrid(bits,w,h,tri,cand[q],true);if(r)return r}
    }
    return null;
  }
  /* img：{data（RGBA）,width,height}。回傳解出的文字，找不到回傳 null */
  return function(img){
    var w=img.width,h=img.height,d=img.data,lum=new Uint8Array(w*h);
    for(var p=0,q=0,n=w*h;p<n;p++,q+=4)lum[p]=(d[q]*77+d[q+1]*150+d[q+2]*29)>>8;
    var bits=binarize(lum,w,h),r=attempt(bits,w,h);if(r)return r;
    for(var k=0;k<bits.length;k++)bits[k]^=1; // 淺色 QR code 印在深底上
    return attempt(bits,w,h);
  };
})();

/* ---------- 掃描畫面：蓋在最上層（不跟著 render 重畫，相機畫面才不會斷） ---------- */
var QS_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V5a2 2 0 0 1 2-2h4v2H5v4zm12-6h4a2 2 0 0 1 2 2v4h-2V5h-4zM3 15h2v4h4v2H5a2 2 0 0 1-2-2zm16 0h2v4a2 2 0 0 1-2 2h-4v-2h4zM7 11h10v2H7z" fill="currentColor"/></svg>';
var qs=null; // {el,stream,raf,last,busy,det,cv,tipT}
function qsCan(){return !!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)}
/* 掃到的文字 → 代碼：記錄台的 QR code 是「網址?watch=代碼」，也接受只有 6 碼代碼的 */
function qsCode(txt){txt=String(txt||'').trim();var m=/[?&]watch=([0-9A-Za-z]+)/.exec(txt);var c=m?codeNorm(m[1]):txt.length<=8?codeNorm(txt):'';return codeOk(c)?c:''}
function qsTip(t,kind){if(!qs)return;var p=qs.el.querySelector('.qstip');p.textContent=t;p.className='qstip'+(kind?' '+kind:'')}
function qsOpen(){
  if(qs)return;
  var el=document.createElement('div');el.className='qscan';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','掃描 QR code');
  el.innerHTML='<video playsinline muted autoplay></video><div class="qsframe" aria-hidden="true"></div><p class="qstip" role="status">開啟相機中…</p>'+
    '<div class="qsbar"><button class="qsx" data-qs="type" hidden>改為輸入代碼</button><button class="qsx" data-qs="cancel">取消</button></div>';
  document.body.appendChild(el);
  qs={el:el,stream:null,raf:0,last:0,busy:false,det:null,cv:null,tipT:0};
  el.addEventListener('click',function(e){var b=e.target.closest('[data-qs]');if(b){qsClose();render()}});
  try{if('BarcodeDetector' in window)qs.det=new BarcodeDetector({formats:['qr_code']})}catch(e){qs.det=null}
  var me=qs;
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false}).then(function(st){
    if(qs!==me){st.getTracks().forEach(function(t){t.stop()});return}
    qs.stream=st;var v=el.querySelector('video');v.srcObject=st;var pp=v.play();if(pp&&pp.catch)pp.catch(function(){});
    qsTip('將記錄台的 QR code 對準框內');qs.raf=requestAnimationFrame(qsTick);
  },function(err){
    if(qs!==me)return;var n=err&&err.name;
    qsTip(n==='NotAllowedError'||n==='SecurityError'?'無法使用相機：請在手機的設定中允許本系統使用相機，或改為輸入代碼。':n==='NotFoundError'||n==='OverconstrainedError'?'找不到相機，請改為輸入代碼。':'無法開啟相機，請改為輸入代碼。','bad');
    el.classList.add('qsfail');el.querySelector('[data-qs=type]').hidden=false;
  });
}
function qsClose(){if(!qs)return;var q=qs;qs=null;cancelAnimationFrame(q.raf);clearTimeout(q.tipT);
  if(q.stream)q.stream.getTracks().forEach(function(t){t.stop()});if(q.el.parentNode)q.el.parentNode.removeChild(q.el)}
function qsTick(t){
  if(!qs)return;qs.raf=requestAnimationFrame(qsTick);
  var v=qs.el.querySelector('video');if(qs.busy||t-qs.last<120||v.readyState<2||!v.videoWidth)return;qs.last=t;
  if(qs.det){var me=qs;me.busy=true;
    me.det.detect(v).then(function(r){me.busy=false;if(qs===me&&r&&r.length)qsGot(r[0].rawValue)},function(){me.busy=false;me.det=null});return}
  var sc=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight)),w=Math.round(v.videoWidth*sc),h=Math.round(v.videoHeight*sc);
  if(!qs.cv){qs.cv=document.createElement('canvas');qs.cx=qs.cv.getContext('2d',{willReadFrequently:true})}
  if(qs.cv.width!==w||qs.cv.height!==h){qs.cv.width=w;qs.cv.height=h}
  qs.cx.drawImage(v,0,0,w,h);var txt=null;try{txt=qrDecode(qs.cx.getImageData(0,0,w,h))}catch(e){}
  if(txt)qsGot(txt);
}
function qsGot(txt){
  var code=qsCode(txt);
  if(!code){qsTip('這不是記錄台「分享比賽」的 QR code','bad');clearTimeout(qs.tipT);qs.tipT=setTimeout(function(){qsTip('將記錄台的 QR code 對準框內')},2500);return}
  qsClose();
  if(ui.watchAsk){ui.watchAsk.v=code;ui.watchAsk.err='';ui.watchAsk.scanned=code}else ui.watchAsk={v:code,scanned:code};
  render();var go=document.querySelector('[data-act=watchgo]');if(go)try{go.focus({preventScroll:true})}catch(e){}
}
document.addEventListener('visibilitychange',function(){if(document.hidden&&qs){qsClose();render()}});

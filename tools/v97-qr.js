/* 11/14 連線顯示的 QR code：不用網路、不用外部套件。只做位元組模式、錯誤更正 M 級、版本 1～10（網址 100 字以內綽綽有餘）。
   照 ISO/IEC 18004 的步驟：資料→分塊加 Reed-Solomon→擺放→八種遮罩挑扣分最少的。回傳 SVG 字串。 */
function qrSvg(text){
  var bytes=[],i,j;
  var u=unescape(encodeURIComponent(text));for(i=0;i<u.length;i++)bytes.push(u.charCodeAt(i));
  // M 級：每個版本的 [每塊更正字數, 塊數]，總字數
  var ECM=[0,[10,1],[16,1],[26,1],[18,2],[24,2],[16,4],[18,4],[22,4],[22,5],[26,5]];
  var TOT=[0,26,44,70,100,134,172,196,242,292,346];
  var ver=0,cap;
  for(var v=1;v<=10;v++){cap=TOT[v]-ECM[v][0]*ECM[v][1];if(4+(v<10?8:16)+bytes.length*8<=cap*8){ver=v;break}}
  if(!ver)return '';
  var bits=[];function put(val,n){for(var k=n-1;k>=0;k--)bits.push((val>>>k)&1)}
  put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(function(b){put(b,8)});
  var dataCap=TOT[ver]-ECM[ver][0]*ECM[ver][1];
  put(0,Math.min(4,dataCap*8-bits.length));while(bits.length%8)bits.push(0);
  for(var pad=0xEC;bits.length<dataCap*8;pad^=0xEC^0x11)put(pad,8);
  var data=[];for(i=0;i<bits.length;i+=8){var x=0;for(j=0;j<8;j++)x=x<<1|bits[i+j];data.push(x)}
  // GF(256) 和 Reed-Solomon
  var EXP=[],LOG=[];for(i=0,x=1;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}
  function mul(a,b){return a&&b?EXP[(LOG[a]+LOG[b])%255]:0}
  var ecn=ECM[ver][0],nb=ECM[ver][1];
  var gen=[1];for(i=0;i<ecn;i++){var g=[];for(j=0;j<=gen.length;j++)g[j]=(j<gen.length?gen[j]:0)^(j>0?mul(gen[j-1],EXP[i]):0);gen=g}
  function rs(d){var r=new Array(ecn).fill(0);d.forEach(function(b){var f=b^r[0];r.shift();r.push(0);for(var k=0;k<ecn;k++)r[k]^=mul(gen[k+1],f)});return r}
  var shortLen=Math.floor(TOT[ver]/nb)-ecn,longCount=TOT[ver]%nb,blocks=[],ecs=[],p=0;
  for(i=0;i<nb;i++){var len=shortLen+(i>=nb-longCount?1:0);var blk=data.slice(p,p+len);p+=len;blocks.push(blk);ecs.push(rs(blk))}
  var out=[];for(i=0;i<=shortLen;i++)blocks.forEach(function(blk){if(i<blk.length)out.push(blk[i])});
  for(i=0;i<ecn;i++)ecs.forEach(function(e){out.push(e[i])});
  // 擺放
  var N=ver*4+17,M=[],F=[];for(i=0;i<N;i++){M.push(new Array(N).fill(0));F.push(new Array(N).fill(false))}
  function set(r,c,v){M[r][c]=v?1:0;F[r][c]=true}
  function finder(r,c){for(var a=-1;a<=7;a++)for(var b=-1;b<=7;b++){var y=r+a,x=c+b;if(y<0||x<0||y>=N||x>=N)continue;var on=a>=0&&a<=6&&b>=0&&b<=6&&(a===0||a===6||b===0||b===6||(a>=2&&a<=4&&b>=2&&b<=4));set(y,x,on)}}
  finder(0,0);finder(0,N-7);finder(N-7,0);
  for(i=8;i<N-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  var AP=[[],[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]][ver],AL=AP.length-1;
  AP.forEach(function(r,ai){AP.forEach(function(c,aj){if((ai===0&&aj===0)||(ai===0&&aj===AL)||(ai===AL&&aj===0))return;for(var a=-2;a<=2;a++)for(var b=-2;b<=2;b++)set(r+a,c+b,Math.max(Math.abs(a),Math.abs(b))!==1)})});
  // 保留格式和版本資訊的位置
  for(i=0;i<9;i++){if(!F[8][i])set(8,i,0);if(!F[i][8])set(i,8,0)}
  for(i=0;i<8;i++){set(8,N-1-i,0);set(N-1-i,8,0)}
  set(N-8,8,1);
  if(ver>=7){var vr=ver;for(i=0;i<12;i++)vr=(vr<<1)^((vr>>>11)&1?0x1F25:0);var vb=ver<<12|vr;
    for(i=0;i<18;i++){var bit=(vb>>>i)&1,a2=Math.floor(i/3),b2=N-11+i%3;set(a2,b2,bit);set(b2,a2,bit)}}
  var allBits=[];out.forEach(function(b){for(var k=7;k>=0;k--)allBits.push((b>>>k)&1)});
  var bi=0,cells=[];
  for(var right=N-1;right>=1;right-=2){if(right===6)right=5;
    for(var vert=0;vert<N;vert++)for(j=0;j<2;j++){var cc=right-j,up=((right+1)&2)===0,rr=up?N-1-vert:vert;
      if(!F[rr][cc]){M[rr][cc]=bi<allBits.length?allBits[bi]:0;bi++;cells.push([rr,cc])}}}
  var MASK=[function(r,c){return (r+c)%2===0},function(r){return r%2===0},function(r,c){return c%3===0},function(r,c){return (r+c)%3===0},
    function(r,c){return (Math.floor(r/2)+Math.floor(c/3))%2===0},function(r,c){return r*c%2+r*c%3===0},function(r,c){return (r*c%2+r*c%3)%2===0},function(r,c){return ((r+c)%2+r*c%3)%2===0}];
  function fmt(mask){var d=(0<<3|mask),r=d<<10;for(i=14;i>=10;i--)if((r>>>i)&1)r^=0x537<<(i-10);return ((d<<10|r)^0x5412)}
  function apply(G,mask){var f=fmt(mask),b=function(n){return (f>>>n)&1};
    for(i=0;i<=5;i++)G[i][8]=b(i);G[7][8]=b(6);G[8][8]=b(7);G[8][7]=b(8);
    for(i=9;i<15;i++)G[8][14-i]=b(i);
    for(i=0;i<8;i++)G[8][N-1-i]=b(i);
    for(i=8;i<15;i++)G[N-15+i][8]=b(i);
    G[N-8][8]=1}
  function score(G){var s=0,r,c,run,k;
    for(var pass=0;pass<2;pass++)for(r=0;r<N;r++){run=1;for(c=1;c<=N;c++){var a=pass?G[c-1]&&G[c-1][r]:G[r][c-1],b=c<N?(pass?G[c][r]:G[r][c]):-1;if(b===a)run++;else{if(run>=5)s+=run-2;run=1}}}
    for(r=0;r<N-1;r++)for(c=0;c<N-1;c++){k=G[r][c];if(k===G[r][c+1]&&k===G[r+1][c]&&k===G[r+1][c+1])s+=3}
    var pat=[1,0,1,1,1,0,1,0,0,0,0],pat2=[0,0,0,0,1,0,1,1,1,0,1];
    for(r=0;r<N;r++)for(c=0;c+11<=N;c++){var h1=true,h2=true,v1=true,v2=true;for(k=0;k<11;k++){if(G[r][c+k]!==pat[k])h1=false;if(G[r][c+k]!==pat2[k])h2=false;if(G[c+k][r]!==pat[k])v1=false;if(G[c+k][r]!==pat2[k])v2=false}s+=40*(h1+h2+v1+v2)}
    var dark=0;for(r=0;r<N;r++)for(c=0;c<N;c++)dark+=G[r][c];s+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10;return s}
  var best=null,bestS=1e9;
  for(var mk=0;mk<8;mk++){var G=M.map(function(row){return row.slice()});cells.forEach(function(q){if(MASK[mk](q[0],q[1]))G[q[0]][q[1]]^=1});apply(G,mk);var sc=score(G);if(sc<bestS){bestS=sc;best=G}}
  var path='';for(var r=0;r<N;r++)for(var c=0;c<N;c++)if(best[r][c])path+='M'+(c+4)+' '+(r+4)+'h1v1h-1z';
  return '<svg class="qr" viewBox="0 0 '+(N+8)+' '+(N+8)+'" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="'+(N+8)+'" height="'+(N+8)+'" fill="#fff"/><path d="'+path+'" fill="#000"/></svg>';
}
if(typeof module!=='undefined')module.exports=qrSvg;

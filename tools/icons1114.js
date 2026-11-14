// 11/14 使用者：正式版圖示改得比較有質感、測試版和正式版的圖示要看得出不一樣。
// 這支產生三種正式版樣式（A 深色球場、B 記錄紙、C 淺色球場）和測試版的兩種標示（下緣色帶寫「測試」、整個換成橘底），
// 都是 1024×1024 的 SVG；node tools/icons1114.js 輸出資料夾  → 存 SVG 和各尺寸 PNG（用 Playwright 畫）。
// 排球用的是程式裡同一顆（BALL），從 index.html 抓，不另外畫。
const fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'..','index.html');
function ballInner(){const s=fs.readFileSync(SRC,'utf8');const m=s.match(/var BALL='(<svg[\s\S]*?<\/svg>)'/);return m[1].replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}
const BI=ballInner();
const ball=(id,cx,cy,r)=>`<g filter="url(#sh${id})" transform="translate(${cx},${cy}) scale(${r/100})">${BI.replace(/id="vb"/g,`id="vb${id}"`).replace(/id="vbs"/g,`id="vbs${id}"`).replace(/url\(#vb\)/g,`url(#vb${id})`).replace(/url\(#vbs\)/g,`url(#vbs${id})`)}</g>`;
const shadow=(id,o)=>`<filter id="sh${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${o.dy||14}" stdDeviation="${o.sd||16}" flood-color="${o.c||'#000'}" flood-opacity="${o.op||.35}"/></filter>`;
const bg=(id,a,b)=>`<linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
// 俯看的球場：網子橫在中間，兩條攻擊線
function court(o){const x=212,y=150,w=600,h=724,mid=y+h/2,att=h/2/3;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${o.fill||'none'}" stroke="${o.line}" stroke-width="26"/>`+
    `<line x1="${x+13}" y1="${mid-att}" x2="${x+w-13}" y2="${mid-att}" stroke="${o.line}" stroke-width="13" opacity=".6"/>`+
    `<line x1="${x+13}" y1="${mid+att}" x2="${x+w-13}" y2="${mid+att}" stroke="${o.line}" stroke-width="13" opacity=".6"/>`+
    `<line x1="${x-40}" y1="${mid}" x2="${x+w+40}" y2="${mid}" stroke="${o.net}" stroke-width="34" stroke-linecap="round"/>`+
    `<circle cx="${x-40}" cy="${mid}" r="22" fill="${o.net}"/><circle cx="${x+w+40}" cy="${mid}" r="22" fill="${o.net}"/>`}
const OPT={
  A:{name:'深色球場',note:'深藍底、白色球場線、黃色網子，排球飛在對面場上',svg:k=>`<defs>${bg(k,'#1D4A78','#0E2740')}${shadow(k,{op:.45,dy:22,sd:20})}</defs><rect width="1024" height="1024" fill="url(#bg${k})"/>${court({line:'#FFFFFF',net:'#FFD21F'})}${ball(k,632,318,150)}`},
  B:{name:'記錄紙',note:'深藍底上一張記錄紙，跑分欄畫斜線、最後一分圈起來，排球壓在右下角',svg:k=>{
    let g='';const cx=220,cy=190,cw=110,ch=86;
    for(let c=0;c<4;c++)for(let r=0;r<6;r++){const X=cx+c*cw+40,Y=cy+120+r*ch;
      g+=`<rect x="${X}" y="${Y}" width="${cw}" height="${ch}" fill="none" stroke="#B6C4D3" stroke-width="5"/>`;
      const n=c*6+r;if(n<15)g+=`<line x1="${X+30}" y1="${Y+ch-20}" x2="${X+cw-30}" y2="${Y+20}" stroke="#12324F" stroke-width="15" stroke-linecap="round"/>`;
      if(n===15)g+=`<circle cx="${X+cw/2}" cy="${Y+ch/2}" r="30" fill="none" stroke="#C8302A" stroke-width="12"/>`}
    return `<defs>${bg(k,'#1D4A78','#0E2740')}${shadow(k,{op:.5,dy:24,sd:22})}${shadow(k+'p',{op:.35,dy:18,sd:18})}</defs><rect width="1024" height="1024" fill="url(#bg${k})"/>`+
      `<g filter="url(#sh${k}p)" transform="rotate(-6 470 512)"><rect x="${cx}" y="${cy}" width="520" height="660" rx="34" fill="#F7F3EA"/><rect x="${cx}" y="${cy}" width="520" height="92" rx="34" fill="#12324F"/><rect x="${cx}" y="${cy+58}" width="520" height="34" fill="#12324F"/>`+
      `<rect x="${cx+40}" y="${cy+30}" width="150" height="30" rx="15" fill="#FFD21F"/><rect x="${cx+210}" y="${cy+30}" width="90" height="30" rx="15" fill="#5E7FA3"/>${g}</g>${ball(k,724,736,176)}`}},
  // 11/14 第二輪：使用者選了 B，問還有沒有別的。以 B 為基礎再做兩種，加兩個新方向
  B2:{name:'記錄紙・淺底',note:'米白底配白紙，紙的上緣深藍',svg:k=>OPT.B.svg(k).replace(bg(k,'#1D4A78','#0E2740'),bg(k,'#EFE8DC','#D9CDB9')).replace('fill="#F7F3EA"','fill="#FFFFFF"')},
  B3:{name:'記錄紙・正放',note:'紙擺正、放大，排球縮小放右下，看起來比較整齊',svg:k=>{
    let g='';const cx=192,cy=150,cw=128,ch=92;
    for(let c=0;c<4;c++)for(let r=0;r<6;r++){const X=cx+c*cw+64,Y=cy+140+r*ch;
      g+=`<rect x="${X}" y="${Y}" width="${cw}" height="${ch}" fill="none" stroke="#B6C4D3" stroke-width="5"/>`;
      const n=c*6+r;if(n<15)g+=`<line x1="${X+36}" y1="${Y+ch-22}" x2="${X+cw-36}" y2="${Y+22}" stroke="#12324F" stroke-width="16" stroke-linecap="round"/>`;
      if(n===15)g+=`<circle cx="${X+cw/2}" cy="${Y+ch/2}" r="32" fill="none" stroke="#C8302A" stroke-width="12"/>`}
    return `<defs>${bg(k,'#1D4A78','#0E2740')}${shadow(k,{op:.5,dy:20,sd:20})}${shadow(k+'p',{op:.35,dy:16,sd:18})}</defs><rect width="1024" height="1024" fill="url(#bg${k})"/>`+
      `<g filter="url(#sh${k}p)"><rect x="${cx}" y="${cy}" width="640" height="724" rx="40" fill="#F7F3EA"/><path d="M${cx} ${cy+40}a40 40 0 0 1 40 -40h560a40 40 0 0 1 40 40v64h-640z" fill="#12324F"/>`+
      `<rect x="${cx+64}" y="${cy+36}" width="170" height="34" rx="17" fill="#FFD21F"/><rect x="${cx+254}" y="${cy+36}" width="100" height="34" rx="17" fill="#5E7FA3"/>${g}</g>${ball(k,770,780,128)}`}},
  D:{name:'計分牌',note:'翻牌式計分牌兩塊數字，中間一顆排球；像比賽場邊的計分牌',svg:k=>{
    const card=(x,t)=>`<rect x="${x}" y="300" width="340" height="400" rx="36" fill="#F7F3EA"/><rect x="${x}" y="300" width="340" height="200" rx="36" fill="#FFFFFF"/><rect x="${x}" y="470" width="340" height="30" fill="#FFFFFF"/>`+
      `<text x="${x+170}" y="582" text-anchor="middle" font-family="'Noto Sans CJK TC','PingFang TC',sans-serif" font-weight="900" font-size="230" fill="#12324F">${t}</text><line x1="${x}" y1="500" x2="${x+340}" y2="500" stroke="#0E2740" stroke-width="10"/>`;
    return `<defs>${bg(k,'#1D4A78','#0E2740')}${shadow(k,{op:.5,dy:18,sd:18})}${shadow(k+'p',{op:.35,dy:16,sd:14})}</defs><rect width="1024" height="1024" fill="url(#bg${k})"/>`+
      `<g filter="url(#sh${k}p)">${card(122,'25')}${card(562,'23')}</g>${ball(k,512,232,100)}`}},
  E:{name:'記錄板',note:'木色夾板夾著記錄紙，上面有金屬夾子，排球在右下；比較有手作感',svg:k=>{
    let g='';const cx=262,cy=258,cw=100,ch=80;
    for(let c=0;c<4;c++)for(let r=0;r<6;r++){const X=cx+c*cw,Y=cy+40+r*ch;
      g+=`<rect x="${X}" y="${Y}" width="${cw}" height="${ch}" fill="none" stroke="#B6C4D3" stroke-width="5"/>`;
      const n=c*6+r;if(n<15)g+=`<line x1="${X+28}" y1="${Y+ch-18}" x2="${X+cw-28}" y2="${Y+18}" stroke="#12324F" stroke-width="14" stroke-linecap="round"/>`;
      if(n===15)g+=`<circle cx="${X+cw/2}" cy="${Y+ch/2}" r="28" fill="none" stroke="#C8302A" stroke-width="11"/>`}
    return `<defs>${bg(k,'#1D4A78','#0E2740')}<linearGradient id="wd${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C98F57"/><stop offset="1" stop-color="#9C6537"/></linearGradient><linearGradient id="mt${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7EBEF"/><stop offset="1" stop-color="#9AA6B2"/></linearGradient>${shadow(k,{op:.5,dy:20,sd:20})}${shadow(k+'p',{op:.4,dy:18,sd:18})}</defs><rect width="1024" height="1024" fill="url(#bg${k})"/>`+
      `<g filter="url(#sh${k}p)"><rect x="200" y="150" width="520" height="740" rx="44" fill="url(#wd${k})"/><rect x="236" y="230" width="448" height="620" rx="14" fill="#F7F3EA"/>${g}`+
      `<rect x="330" y="120" width="260" height="110" rx="30" fill="url(#mt${k})" stroke="#6E7B88" stroke-width="6"/><rect x="410" y="140" width="100" height="34" rx="17" fill="#6E7B88"/></g>${ball(k,736,760,170)}`}},
  C:{name:'淺色球場',note:'米白底、深藍球場線，和程式裡的底色一樣；放在深色桌布上比較跳',svg:k=>`<defs>${bg(k,'#F4EFE6','#E3DACA')}${shadow(k,{op:.28,dy:20,sd:18,c:'#3A2E1E'})}</defs><rect width="1024" height="1024" fill="url(#bg${k})"/>${court({line:'#12324F',net:'#12324F'})}${ball(k,632,318,150)}`}
};
// 測試版的標示：下緣色帶寫「測試」或整個換成橘底
const BETA={
  band:{name:'下緣寫「測試」',svg:(inner)=>`${inner}<rect y="800" width="1024" height="224" fill="#E8742A"/><text x="512" y="955" text-anchor="middle" font-family="'Noto Sans CJK TC','PingFang TC','Heiti TC',sans-serif" font-weight="900" font-size="150" fill="#FFFFFF" letter-spacing="20">測試</text>`},
  tint:{name:'底色換成橘色',svg:(inner)=>inner.replace('stop-color="#1D4A78"','stop-color="#F28C3A"').replace('stop-color="#0E2740"','stop-color="#B9480F"').replace('stop-color="#F4EFE6"','stop-color="#FFE2C4"').replace('stop-color="#E3DACA"','stop-color="#F6B57C"')}
};
const wrap=(body,size)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size||1024}" height="${size||1024}">${body}</svg>`;
// 安卓圓形裁切用：內容縮到中間 80%，底色照舊鋪滿
const maskable=(k,body)=>body.replace(/(<rect width="1024" height="1024" fill="url\(#bg[^"]*\)"\/>)([\s\S]*)$/,(m,a,b)=>a+`<g transform="translate(102.4 102.4) scale(.8)">${b}</g>`);
function icon(opt,beta,size){const k=opt+(beta||'')+(size||'');let body=OPT[opt].svg(k);if(beta)body=BETA[beta].svg(body,k);return wrap(body,size)}
module.exports={OPT,BETA,icon,maskable,wrap};

if(require.main===module&&process.argv[2]!=='--final'){(async()=>{
  const out=process.argv[2]||'/tmp/icons1114';fs.mkdirSync(out,{recursive:true});
  const {chromium}=require('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1024,height:1024}});
  const shot=async(svg,file,sz)=>{await p.setViewportSize({width:sz,height:sz});await p.setContent(`<html><body style="margin:0">${svg.replace('width="1024" height="1024"',`width="${sz}" height="${sz}"`)}</body></html>`);await p.waitForTimeout(80);await p.screenshot({path:file,clip:{x:0,y:0,width:sz,height:sz}})};
  const list=process.argv[3]?process.argv[3].split(','):['A','B','C','B2','B3','D','E','A:band','A:tint','B:band','B:tint','C:band','C:tint','B2:band','B3:band','D:band','E:band'];
  for(const it of list){const [o,be]=it.split(':');const svg=icon(o,be);const name=o+(be?'-'+be:'');fs.writeFileSync(path.join(out,name+'.svg'),svg);
    for(const sz of (process.env.SIZES||'512').split(',').map(Number))await shot(svg,path.join(out,name+'-'+sz+'.png'),sz)}
  await b.close();console.log('icons in',out)})()}

// 11/14 使用者選定：正式版 B2（記錄紙・淺底），測試版 B2 下緣寫「測試」。
// node tools/icons1114.js --final：測試版圖示寫進 icons/beta-*.png；正式版的先放 tools/icon-next/（比賽完再換，換圖示要刪掉主畫面重加）
if(require.main===module&&process.argv[2]==='--final'){(async()=>{
  const {chromium}=require('playwright');const b=await chromium.launch();const p=await b.newPage();
  const shot=async(svg,file,sz)=>{await p.setViewportSize({width:sz,height:sz});await p.setContent(`<html><body style="margin:0">${svg.replace('width="1024" height="1024"',`width="${sz}" height="${sz}"`)}</body></html>`);await p.waitForTimeout(80);await p.screenshot({path:file,clip:{x:0,y:0,width:sz,height:sz}})};
  const R=path.join(__dirname,'..'),next=path.join(__dirname,'icon-next');fs.mkdirSync(next,{recursive:true});
  for(const sz of [180,192,512])await shot(icon('B2','band'),path.join(R,'icons','beta-'+sz+'.png'),sz);
  for(const sz of [180,192,512])await shot(icon('B2'),path.join(next,'icon-'+sz+'.png'),sz);
  await shot(wrap(maskable('B2m',OPT.B2.svg('B2m'))),path.join(next,'icon-maskable-512.png'),512);
  await b.close();console.log('done')})()}

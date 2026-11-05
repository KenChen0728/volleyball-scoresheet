// 圖示：深藍底、球場六格，發球位黃框加排球。node tools/school/icon.js
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'../..'),src=fs.readFileSync(R+'/index.html','utf8');
const ball=src.match(/var BALL='(.*?)';\n/)[1].replace('width="76" height="76"','');
const html=(size,scale)=>`<body style="margin:0;background:#12324F;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center"><div style="position:relative;width:${size*scale}px;height:${size*scale*.78}px;display:grid;grid-template-columns:1fr 1fr ${size*.02}px 1fr 1fr;grid-template-rows:repeat(3,1fr);gap:${size*.014}px">${[0,1,'n',2,3,4,5,'',6,7,8,9,'',10,11].map(x=>x==='n'?`<div style="grid-row:1/4;grid-column:3;background:#fff;border-radius:${size*.005}px"></div>`:x===''?'':`<div style="background:${x===8?'#FFD21F':(typeof x==='number'&&(x<2||(x>=4&&x<6)||(x>=8&&x<10))?'#2F7BD6':'#F07A1A')};border-radius:${size*.015}px"></div>`).join('')}<div style="position:absolute;left:${size*scale*.0}px;bottom:${-size*.02}px;width:${size*.34}px;height:${size*.34}px;transform:translate(-14%,6%)">${ball.replace('<svg','<svg style="width:100%;height:100%"')}</div></div></body>`;
(async()=>{const b=await chromium.launch();
for(const [n,sz,sc] of [['icon-180',180,.8],['icon-192',192,.8],['icon-512',512,.8],['icon-maskable-512',512,.62]]){const p=await b.newPage({viewport:{width:sz,height:sz}});await p.setContent(html(sz,sc));await p.screenshot({path:`${R}/school/icons/${n}.png`});await p.close()}
await b.close()})();

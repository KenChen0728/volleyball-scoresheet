// 圖示：深藍底、金色校徽盾牌、白金排球（球的形狀和完整版相同，換成校隊配色）。node tools/school/icon.js
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'../..');
const NAVY='#12324F',GOLD='#FFD21F';
const m=fs.readFileSync(R+'/index.html','utf8').match(/var BALL='(.*?)';\n/)[1].replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const ball=(cx,cy,r)=>`<g transform="translate(${cx} ${cy}) scale(${r/100})">${m.replace(/#1F5FC4/g,'#FFFFFF')}</g>`;
const SHIELD='M256 52 C322 86 380 96 440 96 V254 C440 368 354 432 256 472 C158 432 72 368 72 254 V96 C132 96 190 86 256 52Z';
const art=sc=>`<rect width="512" height="512" fill="${NAVY}"/><g transform="translate(256 262) scale(${sc}) translate(-256 -262)"><path d="${SHIELD}" fill="none" stroke="${GOLD}" stroke-width="17" stroke-linejoin="miter"/>${ball(256,254,134)}</g>`;
const svg=(sz,sc)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${sz}" height="${sz}" style="display:block">${art(sc)}</svg>`;
(async()=>{const b=await chromium.launch();
for(const [n,sz,sc] of [['icon-180',180,1],['icon-192',192,1],['icon-512',512,1],['icon-maskable-512',512,.76]]){
  const p=await b.newPage({viewport:{width:sz,height:sz}});await p.setContent(`<body style="margin:0">${svg(sz,sc)}`);await p.screenshot({path:`${R}/school/icons/${n}.png`});await p.close()}
await b.close()})();

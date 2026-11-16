// 用本系統的編碼器產生 QR 矩陣（JSON），交給 Python 加變形
const qrSvg=require('../v97-qr.js');
const texts=['https://kenchen0728.github.io/volleyball-scoresheet/beta/?watch=QMVJTD','https://kenchen0728.github.io/volleyball-scoresheet/?watch=ABC234','WJEXE8','https://example.com/'+'x'.repeat(150)];
const out=texts.map(t=>{const s=qrSvg(t),N=+/viewBox="0 0 (\d+)/.exec(s)[1]-8,G=[...Array(N)].map(()=>Array(N).fill(0));for(const m of s.matchAll(/M(\d+) (\d+)h1/g))G[+m[2]-4][+m[1]-4]=1;return {t,G}});
require('fs').writeFileSync('ours.json',JSON.stringify(out));console.log(out.map(o=>o.G.length));

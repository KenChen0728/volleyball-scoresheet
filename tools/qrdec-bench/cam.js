const qrSvg=require('../v97-qr.js');
const out={};for(const [k,t] of [['ours','https://kenchen0728.github.io/volleyball-scoresheet/beta/?watch=QMVJTD'],['other','https://example.com/menu']]){
 const s=qrSvg(t),N=+/viewBox="0 0 (\d+)/.exec(s)[1]-8,G=[...Array(N)].map(()=>Array(N).fill(0));for(const m of s.matchAll(/M(\d+) (\d+)h1/g))G[+m[2]-4][+m[1]-4]=1;out[k]=G}
require('fs').writeFileSync('cam.json',JSON.stringify(out));

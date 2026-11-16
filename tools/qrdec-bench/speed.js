const fs=require('fs'),vm=require('vm');const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('../v100-qrscan.js','utf8')+';this.qrDecode=qrDecode',ctx);
const items=JSON.parse(fs.readFileSync('items.json'));
let t=Date.now(),n=0;for(let i=0;i<10;i++){ctx.qrDecode({data:new Uint8ClampedArray(fs.readFileSync('img/noqr'+i+'.rgba')),width:640,height:480});n++}
console.log('no-QR frame ms',((Date.now()-t)/n).toFixed(1));
const good=items.filter(x=>x.k==='plain'||x.k==='screen');t=Date.now();for(const it of good)ctx.qrDecode({data:new Uint8ClampedArray(fs.readFileSync(it.f)),width:640,height:480});
console.log('QR frame ms',((Date.now()-t)/good.length).toFixed(1));

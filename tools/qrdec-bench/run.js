const fs=require('fs'),vm=require('vm');const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('../v100-qrscan.js','utf8')+';this.qrDecode=qrDecode',ctx);
const items=JSON.parse(fs.readFileSync('items.json'));const by={};let ok=0,cvok=0,t0=Date.now(),wrong=0;const fails=[];
for(const it of items){const d=new Uint8ClampedArray(fs.readFileSync(it.f));let r=null;try{r=ctx.qrDecode({data:d,width:it.w,height:it.h})}catch(e){r='ERR '+e.message}
  const g=r===it.t;if(r&&!g)wrong++;by[it.k]=by[it.k]||[0,0,0];by[it.k][0]+=g;by[it.k][1]++;by[it.k][2]+=it.cv;ok+=g;cvok+=it.cv;if(!g)fails.push(it.f+' '+it.k+' '+(r||'').slice(0,40))}
console.log('ours',ok,'/',items.length,' opencv',cvok,' wrong',wrong,' ms/img',((Date.now()-t0)/items.length).toFixed(1));console.log(by);console.log(fails.slice(0,12).join('\n'))

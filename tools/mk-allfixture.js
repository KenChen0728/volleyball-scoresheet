// 11/23 做自動測試用的 tools/all.json（git 不收）：從 mk-ranktest.js 的積分測試盃拿「飛鷹 2:1 雪豹」那場，
// 左隊改名「範例藍隊」並多登錄 1、3 號（沒有姓名），給 t1120-fix 的「從名冊補姓名」用。名字都是虛構的
// 用法：node tools/mk-allfixture.js
const {execFileSync}=require('child_process'),fs=require('fs'),os=require('os'),path=require('path');
const tmp=path.join(os.tmpdir(),'rank-fixture.json');execFileSync('node',[path.join(__dirname,'mk-ranktest.js'),tmp]);
const d=JSON.parse(fs.readFileSync(tmp,'utf8'));
const m=d.matches.find(x=>x.events.filter(e=>e.type==='SET_ENDED').length===3);
const out=[];let last=-1;m.events.forEach((e,i)=>{if(e.type==='PLAYER_ADDED'&&e.data.team==='t1')last=i});
m.events.forEach((e,i)=>{if(e.type==='TEAM_NAME_SET'&&e.data.team==='t1')e.data.value='範例藍隊';out.push(e);
  if(i===last)[1,3].forEach(no=>out.push({...JSON.parse(JSON.stringify(e)),id:e.id+'x'+no,data:{team:'t1',no}}))});
out.forEach((e,k)=>e.seq=k+1);m.events=out;
fs.writeFileSync(path.join(__dirname,'all.json'),JSON.stringify({matches:[m]}));console.log('wrote tools/all.json',m.id,out.length,'events');

// 用事件直接做一場比賽，存成 demo.json，範例記錄表和版面檢查都用這份。隊名和人名都是虛構的。
// node tools/school/demo.js 輸出檔 [mid]   mid 表示停在第 2 局中途
const fs=require('fs');const out=process.argv[2]||'demo.json',mid=process.argv[3]==='mid';
let seq=0,T=new Date('2026-11-06T16:05:00+08:00').getTime();
const ev=[];const add=(type,data)=>{T+=20000;seq++;ev.push({id:'e'+seq,matchId:'demo',seq,at:new Date(T).toISOString(),device:'demo',type,data})};
let rnd=12345;const R=n=>{rnd=(rnd*1103515245+12345)&0x7fffffff;return (rnd>>8)%n};
add('MATCH_CREATED',{info:{name:'範例賽事',division:'男子組',game:'3',date:'2026-11-06',time:'16:00',place:'',court:'A',fmt:3,referee:'Mr. Lee',umpire:'Ms. Wu',scorer:'Amy Wang'}});
const teams={t1:{name:'Eagles',nos:[2,4,7,9,10,12,15,18,21,23,30],cap:7},t2:{name:'Tigers',nos:[1,3,5,6,8,11,13,14,16,20],cap:11}};
for(const k of ['t1','t2']){add('TEAM_NAME_SET',{team:k,value:teams[k].name});teams[k].nos.forEach(n=>add('PLAYER_ADDED',{team:k,no:n}));add('CAPTAIN_SET',{team:k,no:teams[k].cap})}
add('INFO_SET',{field:'actual',value:'16:05'});
const lus={t1:[7,2,9,4,12,10],t2:[11,3,6,8,1,5]};
function playSet(n,left,serve,winner,winTo,loseTo,plan,stop){
  add('TOSS_SET',{set:n,left,serve});
  for(const k of ['t1','t2']){lus[k].forEach((no,pos)=>add('LINEUP_SET',{set:n,team:k,pos,no}));add('LINEUP_LOCKED',{set:n,team:k})}
  add('SET_STARTED',{set:n});
  const cur={t1:lus.t1.slice(),t2:lus.t2.slice()},pair={t1:{},t2:{}},loser=winner==='t1'?'t2':'t1';
  const seqs=[];let w=winTo,l=loseTo;while(w||l){if(!l||(w&&R(w+l)<w)){seqs.push(winner);w--}else{seqs.push(loser);l--}}
  if(seqs[seqs.length-1]!==winner){const i=seqs.lastIndexOf(winner);seqs[i]=loser;seqs[seqs.length-1]=winner}
  for(let i=0;i<seqs.length;i++){
    if(stop&&i>=stop)return;
    (plan[i]||[]).forEach(a=>{
      if(a[0]==='T')add('TIMEOUT',{set:n,team:a[1]});
      if(a[0]==='S'){const t=a[1],idx=a[2],now=cur[t][idx],inn=pair[t][idx]!=null?(now===lus[t][idx]?pair[t][idx]:lus[t][idx]):a[3];if(pair[t][idx]==null)pair[t][idx]=inn;add('SUB',{set:n,team:t,idx,out:now,in:inn,exc:false,injury:false});cur[t][idx]=inn}
      if(a[0]==='Y')add('SANCTION',{set:n,team:a[1],kind:'W',who:a[2]});
    });
    add('POINT',{set:n,team:seqs[i]});
  }
  add('SET_ENDED',{set:n,winner});
}
playSet(1,'t1','t1','t1',25,21,{8:[['T','t2']],12:[['S','t2',3,13]],15:[['T','t1']],18:[['S','t1',1,15],['S','t1',4,18]],24:[['S','t2',3]],27:[['Y','t2',6]],33:[['S','t1',1]],38:[['T','t2'],['S','t2',5,14]]});
add('SET_ADVANCED',{blank:true});
playSet(2,'t2','t2','t2',25,23,{6:[['S','t1',2,21]],10:[['T','t1']],20:[['S','t2',0,16],['S','t2',4,20]],26:[['T','t2']],30:[['S','t2',0]],36:[['S','t1',2]],40:[['S','t1',5,23]],44:[['T','t1']]},mid?22:0);
if(!mid){add('SET_ADVANCED',{blank:true});
playSet(3,'t1','t2','t1',15,12,{4:[['S','t1',3,15]],9:[['T','t2']],14:[['S','t2',2,13]],17:[['T','t1']],20:[['S','t1',3]]})}
fs.writeFileSync(out,JSON.stringify({matches:[{id:'demo',createdAt:new Date().toISOString(),events:ev}],currentId:mid?'demo':null,cups:[]}));
console.log(ev.length,'events ->',out);

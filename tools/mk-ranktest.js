// 11/20 做「積分測試盃」資料夾檔案（預覽版匯入就能看積分分頁）。隊名都是虛構的鳥名、動物名。
// 用法：node tools/mk-ranktest.js [輸出檔]，預設 /home/claude/out/積分測試盃.json
const fs=require('fs'),path=require('path');
const OUT=process.argv[2]||'/home/claude/out/積分測試盃.json';
const T0=Date.parse('2026-11-20T05:00:00Z');let tick=0;const at=()=>new Date(T0+(tick++)*1000).toISOString();
let uidn=0;const uid=p=>p+(++uidn).toString(36).padStart(4,'0');
const CUP='rkcup0001';
const teams={},teamList=[];
function team(div,name,nos){const id=uid('rkt');teams[name]={id,div,name,nos};teamList.push({id,division:div,group:'',at:T0,team:{name,players:nos.map(n=>({no:n,name:''})),liberos:[],captain:null,staff:{},locked:false,color:null,liberoColor:null}});return id}
// 一場比賽的事件：sets 是 [[左隊分, 右隊分], …]；ff 是棄權的隊（'t1'/'t2'）
function match(info,A,B,sets,ff){const id=uid('rkm'),ev=[];let seq=0;
  const E=(type,data)=>ev.push({id:uid('e'),matchId:id,seq:++seq,at:at(),device:'rank-test',type,data});
  E('MATCH_CREATED',{info:Object.assign({name:'積分測試盃',division:'',group:'',game:'',date:'',time:'',city:'',place:'',court:''},info)});
  E('TEAM_NAME_SET',{team:'t1',value:A.name});E('TEAM_NAME_SET',{team:'t2',value:B.name});
  [['t1',A],['t2',B]].forEach(([k,t])=>t.nos.forEach(n=>E('PLAYER_ADDED',{team:k,no:n})));
  E('CAPTAIN_SET',{team:'t1',no:A.nos[0]});E('CAPTAIN_SET',{team:'t2',no:B.nos[0]});
  if(ff){E('FORFEIT',{team:ff});return {id,createdAt:at(),cup:CUP,events:ev}}
  E('TOSS_SET',{set:1,left:'t1',serve:'t1'});
  [['t1',A],['t2',B]].forEach(([k,t])=>{t.nos.slice(0,6).forEach((n,i)=>E('LINEUP_SET',{set:1,team:k,pos:i,no:n}));E('LINEUP_LOCKED',{set:1,team:k})});
  E('INFO_SET',{field:'actual',value:info.time||'09:00'});
  sets.forEach((sc,i)=>{const n=i+1;
    if(n>1){E('SET_ADVANCED',{blank:true});
      if(n===3)E('TOSS_SET',{set:3,left:'t1',serve:'t1'});
      ['t2','t1'].forEach(k=>{E('LINEUP_COPIED',{set:n,team:k});E('LINEUP_LOCKED',{set:n,team:k})})}
    E('SET_STARTED',{set:n});
    const w=sc[0]>sc[1]?'t1':'t2',wp=Math.max(...sc),lp=Math.min(...sc),l=w==='t1'?'t2':'t1';
    // 輸的隊和贏的隊交錯得分，最後一分給贏的隊
    const seqp=[];let a=0,b=0;while(a<wp-1||b<lp){if(b<lp&&(b*(wp-1)<=a*lp||a>=wp-1)){seqp.push(l);b++}else{seqp.push(w);a++}}seqp.push(w);
    let s1=0,s2=0,swapped=false;
    seqp.forEach(k=>{E('SERVE',{set:n});E('POINT',{set:n,team:k});if(k==='t1')s1++;else s2++;if(n===3&&!swapped&&(s1===8||s2===8)){E('SIDES_SWAPPED',{set:3});swapped=true}});
    E('SET_ENDED',{set:n,winner:w})});
  return {id,createdAt:at(),cup:CUP,events:ev}}
// 隊伍
const M=['山貓隊','海豚隊','飛鷹隊','雪豹隊'],WA=['白鷺隊','黑鳶隊','藍鵲隊','綠繡眼隊'],WB=['紅隼隊','黃鸝隊','灰鶴隊'];
M.forEach((n,i)=>team('男子組',n,[1,2,3,4,5,6,7,8].map(x=>x+i*10)));
WA.concat(WB).forEach((n,i)=>team('女子組',n,[1,2,3,4,5,6,7,8].map(x=>x+i*10)));
const sched=[],matches=[];let ord=0;
function game(div,date,time,court,a,b,sets,ff){const A=teams[a],B=teams[b],it={id:uid('rks'),at:T0,date,time,court,division:div,t1:A.id,t2:B.id,n1:'',n2:'',ord:++ord};
  if(sets||ff){const m=match({division:div,date,time,court},A,B,sets,ff);matches.push(m);it.mid=m.id}sched.push(it)}
function tbd(div,date,time,court,r1,r2,stage){sched.push({id:uid('rks'),at:T0,date,time,court,division:div,t1:'',t2:'',n1:'',n2:'',r1,r2,stage,ord:++ord})}
// 男子組：四隊單循環，六場都打完。山貓、海豚同勝場同積分同局數比同分數比，看對戰（山貓贏）
game('男子組','2026-12-05','08:00','甲','山貓隊','海豚隊',[[25,20],[25,20]]);
game('男子組','2026-12-05','09:00','甲','飛鷹隊','雪豹隊',[[25,20],[18,25],[15,12]]);
game('男子組','2026-12-05','10:00','甲','山貓隊','飛鷹隊',[[25,20],[25,20]]);
game('男子組','2026-12-05','11:00','甲','海豚隊','雪豹隊',[[25,20],[25,20]]);
game('男子組','2026-12-05','13:00','甲','雪豹隊','山貓隊',[[25,20],[25,20]]);
game('男子組','2026-12-05','14:00','甲','海豚隊','飛鷹隊',[[25,20],[25,20]]);
// 女子組 A 組：四邊形、對角不打；綠繡眼對藍鵲棄權；綠繡眼對白鷺還沒打
game('女子組','2026-12-05','08:00','乙','白鷺隊','黑鳶隊',[[25,21],[22,25],[15,11]]);
game('女子組','2026-12-05','09:00','乙','黑鳶隊','藍鵲隊',[[25,17],[25,19]]);
game('女子組','2026-12-05','10:00','乙','藍鵲隊','綠繡眼隊',null,'t2');
game('女子組','2026-12-06','09:00','乙','綠繡眼隊','白鷺隊',null,null);
// 女子組 B 組：三角循環，三隊各贏一場、比分一樣 → 三隊同分，需抽籤
game('女子組','2026-12-05','11:00','乙','紅隼隊','黃鸝隊',[[25,20],[25,20]]);
game('女子組','2026-12-05','13:00','乙','黃鸝隊','灰鶴隊',[[25,20],[25,20]]);
game('女子組','2026-12-05','14:00','乙','灰鶴隊','紅隼隊',[[25,20],[25,20]]);
// 複賽：隊伍待定，存成「A 組第 1 名」這種參照（不算進預賽積分）
tbd('女子組','2026-12-06','10:00','乙','g|A|1','g|B|2','複賽');tbd('女子組','2026-12-06','11:00','乙','g|B|1','g|A|2','複賽');
// 冠亞賽：上面兩場的勝隊（還沒打，所以顯示「第 N 場勝隊」）
const s14=sched[sched.length-2].id,s15=sched[sched.length-1].id;tbd('女子組','2026-12-06','14:00','乙','w|'+s14,'w|'+s15,'冠亞賽');
const cup={id:CUP,name:'積分測試盃',createdAt:new Date(T0).toISOString(),at:T0,teams:teamList,refs:[],sched};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify({app:'volleyball-scoresheet',version:1,matches,cups:[cup]}));
console.log('wrote',OUT,matches.length,'matches',sched.length,'schedule',Math.round(fs.statSync(OUT).size/1024),'KB');

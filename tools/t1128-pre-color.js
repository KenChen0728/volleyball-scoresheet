module.exports=async({R,W,KEY,ab})=>{await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);
    const add=(type,data)=>m.events.push({id:'c'+m.events.length+type,matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'t',type,data});
    add('TEAM_COLOR_SET',{team:'t1',color:'navy'});add('TEAM_COLOR_SET',{team:'t2',color:'black'});localStorage.setItem(K,JSON.stringify(d))},KEY);
  await R.reload();await W(600);await ab(R);};

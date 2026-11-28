// 11/28 測試用：藍隊只有一位自由（範例原本就是），橘隊拿掉全部自由球員
module.exports=async({R,W,KEY,ab})=>{await R.evaluate(K=>{const d=JSON.parse(localStorage.getItem(K)),m=d.matches.find(x=>x.id===d.currentId);
    const add=(type,data)=>m.events.push({id:'n'+m.events.length+type,matchId:m.id,seq:m.events.length+1,at:new Date().toISOString(),device:'t',type,data});
    add('LIBERO_SET',{team:'t2',no:15,on:false});add('LIBERO_SET',{team:'t2',no:20,on:false});localStorage.setItem(K,JSON.stringify(d))},KEY);
  await R.reload();await W(600);await ab(R);};

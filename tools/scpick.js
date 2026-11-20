// 新增比賽視窗的日期、時間（11/20 改成自己做的選擇器）：測試和截圖用
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function scDate(p,ymd){
  await p.click('#sc-date');await W(120);
  for(let n=0;n<36;n++){const t=await p.textContent('.sccalh b');const m=t.match(/(\d+) 年 (\d+) 月/);const cur=+m[1]*12+(+m[2]),want=+ymd.slice(0,4)*12+(+ymd.slice(5,7));if(cur===want)break;await p.click('.sccalh [data-act=sccal][data-v="'+(want>cur?1:-1)+'"]');await W(80)}
  await p.click('.sheet [data-act=scday][data-v="'+ymd+'"]');await W(120);
}
async function scTime(p,hm){ // 11/21 滾輪：點中間的數字（已經有時間時）直接打四個數字；沒時間時先按「完成」帶入 08:00 再打
  await p.click('#sc-time');await W(150);const [h,m]=hm.split(':');
  if(!(await scGet(p,'#sc-time'))){await p.click('.sheet [data-act=scpkdone]');await W(120);await p.click('#sc-time');await W(150)}
  await p.click('.sheet .scwlist[data-wk=h] .scwi[aria-selected=true]');await W(120);
  await p.fill('#sc-tin',h+m);await p.click('.sheet [data-act=sctok]');await W(150);
}
async function scTbd(p){if(await p.locator('.sheet [data-act=sctbd]').count()){await p.click('.sheet [data-act=sctbd]');await W(120)}}
async function scGet(p,sel){return (await p.getAttribute(sel,'data-v'))||''}
module.exports={scDate,scTime,scGet,scTbd};

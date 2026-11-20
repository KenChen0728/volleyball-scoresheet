#!/usr/bin/env python3
"""11/21 凌晨使用者用平板＋iPhone 實測連線（語音）的五項。先跑 patch_v97～v125。
1. 開局確認後，觀看端就要顯示（二裁可以先對站位），不用等到第一次發球：清單摘要「尚未開始」只在第 1 局還沒開始時
2. 觀看裝置改名稱打不了中文：選字時畫面被重畫，注音、拼音選字被打斷 → 選字中先不重畫，選完再補畫
3. 記錄台「取消移除」後，觀看端停在「無法觀看」要重新輸入代碼 → 觀看畫面被擋時每 8 秒自己重試，恢復權限就自動回來
4. 記錄台斷線要等一兩分鐘才出現「接手記錄」→ 記錄台每 5 秒回報一次（寫 u、t），觀看端超過 15 秒沒收到就當離線
   （Firebase 免費額度：一場一個半小時約 1 MB 以內，不用擔心）
5. 被接手的原記錄台按「觀看接手內容」後，畫面上只有「離開」：改成上面一直有「收回記錄」；
   「離開」回到這場比賽「收回記錄／觀看接手內容」的選擇，不會跑到觀看比賽清單"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function wtAlive' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

# 1
one("st=matchOver(q)?'over':c.ended?'break':(n===1&&!c.firstServeAt&&!c.score.t1&&!c.score.t2)?'none':'play';",
    "st=matchOver(q)?'over':c.ended?'break':(n===1&&!c.started)?'none':'play';")
# 2 選字中不重畫
one("function render(){syncLockCheck();","""var imeOn=false,imeDirty=false;
document.addEventListener('compositionstart',function(){imeOn=true},true);
document.addEventListener('compositionend',function(){imeOn=false;if(imeDirty){imeDirty=false;setTimeout(function(){if(!imeOn)render()},0)}},true);
function render(){if(imeOn){imeDirty=true;return}syncLockCheck();""")
# 3 被擋時自己重試
one("""    wt.off=fb.on('m/'+code,function(v){watchData(code,v)},function(){if(wt&&wt.code===code){wt.state='deny';render()}})},""",
    """    wt.off=fb.on('m/'+code,function(v){watchData(code,v)},function(){if(wt&&wt.code===code){wt.state='deny';wt.denyAt=Date.now();render()}})},""")
one("function watchData(code,v){","""/* 被記錄台移除：每 8 秒重新試一次，記錄台取消移除就自動回來 */
setInterval(function(){if(view!=='watch'||!wt||wt.state!=='deny'||!fb||Date.now()-(wt.denyAt||0)<8000)return;var code=wt.code;wt.denyAt=Date.now();
  if(wt.off)try{wt.off()}catch(e){}
  wt.off=fb.on('m/'+code,function(v){watchData(code,v)},function(){if(wt&&wt.code===code){wt.state='deny';wt.denyAt=Date.now()}})},2000);
function watchData(code,v){""")
one("deny:['無法觀看','記錄台已停止本機的觀看權限。']","deny:['無法觀看','記錄台已停止本機的觀看權限。記錄台取消移除後會自動恢復。']")
# 4 心跳
one("function syncKick(m){","""/* 記錄台每 5 秒回報一次還在（u；計時器剩下的時間 t 一起重算），觀看端超過 15 秒沒收到就當離線 */
setInterval(function(){if(!share||!share.made||share.lost||!fb||!sy.conn||view==='watch'||document.visibilityState==='hidden')return;
  var up=sy.tBad?{u:fb.ts(),on:true}:{t:timerJson(),u:fb.ts(),on:true};fb.update('m/'+share.code,up).catch(function(){})},5000);
function syncKick(m){""")
one("function watchLeave(){","""function wtAlive(){if(!wt||!wt.on)return false;return !(wt.u&&Date.now()-(wt.u-(sy.off||0))>15000)}
setInterval(function(){if(view!=='watch'||!wt||wt.state!=='ok')return;var a=wtAlive();if(a!==wt.alive){wt.alive=a;render()}},2000);
function watchLeave(){""")
one("  if(wt.state==='ok'&&!wt.on)return ['bad','記錄台離線，'+t];","  if(wt.state==='ok'&&!wtAlive())return ['bad','記錄台離線，'+t];")
# 計時器：心跳重算的剩餘時間差一點點不要當成新的計時器
one("    if(!wt.timer||wt.timer.key!==key)wt.timer={team:tj.k,end:end,label:String(tj.label||'').slice(0,20),key:key,pop:false}}",
    "    if(!wt.timer||wt.timer.key!==key&&!(wt.timer.team===tj.k&&(wt.timer.label||'')===String(tj.label||'').slice(0,20)&&Math.abs(wt.timer.end-end)<1500))wt.timer={team:tj.k,end:end,label:String(tj.label||'').slice(0,20),key:key,pop:false}}")
# 5 原記錄台看接手內容：一直有收回；離開回到選擇
one("""  var trow=s&&wt.state==='ok'&&!wt.on&&sy.conn&&fb&&!wt.take?""","""  var trow=s&&wt.state==='ok'&&(mine||!wtAlive())&&sy.conn&&fb&&!wt.take?""")
one("""    case 'wleave': if(wt)wt.ask=true; return true;""","""    case 'wleave': if(share&&share.lost&&wt&&share.code===wt.code){var lm=db.matches.filter(function(q){return q.id===share.mid})[0];watchLeave();if(lm){db.currentId=lm.id;ui.page=firstPage(reduce(lm.events));view='setup';syncLockCheck()}return true}
      if(wt)wt.ask=true; return true;""")
one("function syncPaint(){var bad=!!(share&&view==='setup'&&syncState()[0]==='bad');",
    "function syncPaint(){var bad=!!(share&&view==='setup'&&syncState()[0]==='bad');if(typingNow()){wlDirty=true;return} // 打字中（觀看裝置改名稱）先不重畫，離開輸入框再畫")
open(SRC,'w',encoding='utf8').write(s)
print('patched v126')

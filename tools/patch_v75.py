#!/usr/bin/env python3
"""11/12 使用者實際比賽後：漏按的替補（第 2 局中庄 8 換 3、21:6）比賽中、局結束後都補不回去。
使用者決定（11/12 早上、12:2x 語音、13:44「好」「補記上線」）：
- 記錄表 →「更正」→ 選局 →「補記漏按的暫停或替補」→ 選隊 → 暫停或替補 → 當時的比分（這局打過的）→（替補：點那時候場上要換下的人、再點換上的人）→ 確定。
- 補的那一筆放進時間軸：那個比分之後、下一次發球之前，排在那時候已經有的紀錄後面。替補會照時間影響之後場上的人。
- 要合規則：那時候的暫停次數、替補規則（同一個 subOptions），補進去後這隊這局後面的替補也要照樣合規則，不合就說是哪一筆、不補。
- 比賽確定結束前都能補（已經結束的局也可以）；按了「確定比賽結束」之後，補記和更正都不能用（只能看）。
- 事件：AMEND {ins:{after, at, type, data}, note}；reduce 把它放在 after 那一筆後面，id 就是這個 AMEND 的 id，之後可以照樣在「更正」改或刪，也能復原。
用法：python3 tools/patch_v75.py [檔案]（預設改 /home/claude/nanshe/nanshe-scoresheet.html；正式版的 index.html、school/index.html 也能直接套）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function insAnchor(' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


# ── reduce：補記放進時間軸；stopId 可以算到某一筆之前的狀態 ──
one("""function reduce(events){""", """function reduce(events,stopId){""")
one("""    s.amends.push(ev.data.note);
""", """    s.amends.push(ev.data.note);
    if(ev.data.ins)return; // 補記：下面照時間軸放進去
""")
one("""  events.filter(function(ev){return !dead[ev.id]&&ev.type!=='UNDO'&&ev.type!=='AMEND'}).forEach(function(ev){
""", """  /* 11/12 補記：AMEND 帶 ins 的，照時間軸放在 after 那一筆後面；這筆的 id 就是 AMEND 的 id，之後可以照樣更正、刪除、復原 */
  var insAt={},seq=[],stopped=false;
  events.forEach(function(ev){if(ev.type==='AMEND'&&!dead[ev.id]&&ev.data.ins){var q=ev.data.ins;(insAt[q.after]=insAt[q.after]||[]).push({id:ev.id,type:q.type,at:q.at||ev.at,data:q.data})}});
  events.forEach(function(ev){if(!dead[ev.id]&&ev.type!=='UNDO'&&ev.type!=='AMEND')seq.push(ev);if(insAt[ev.id])seq=seq.concat(insAt[ev.id])});
  seq.forEach(function(ev){
    if(stopped||(stopId&&ev.id===stopId)){stopped=true;return}
""")

# ── 找補的位置、檢查規則、存檔 ──
one("""function fixList(s){""", """/* 11/12 補記：第 n 局 own:opp（k 隊在前）那個比分之後、下一次發球之前，最後一筆原本的紀錄；補的放在它後面 */
function insAnchor(m,s,n,k,own,opp){
  if(!(own>=0&&opp>=0))return {err:'比分要填數字。'};
  var c=s.sets[n],tot=own+opp,path=c.path||[],t1=k==='t1'?own:opp;
  if(tot>path.length||path.slice(0,tot).filter(function(q){return q==='t1'}).length!==t1)return {err:'這局沒有出現過 '+own+':'+opp+' 這個比分，只能補在這局打過的比分。'};
  if(tot===path.length&&(c.ended||(s.setNo===n&&setWinner(s))))return {err:own+':'+opp+' 是這局最後一分，局已經打完，不能補在這裡。'};
  var dead={},patch={};
  m.events.forEach(function(e){if(e.type==='UNDO')dead[e.data.target]=1});
  m.events.forEach(function(e){if(e.type!=='AMEND'||dead[e.id])return;if(e.data.del)dead[e.data.target]=1;else if(e.data.target)patch[e.data.target]=Object.assign(patch[e.data.target]||{},e.data.patch)});
  var cnt=0,inSet=false,served=false,cand=null;
  m.events.forEach(function(e){
    if(dead[e.id]||e.type==='UNDO'||e.type==='AMEND')return;
    var d=patch[e.id]?Object.assign({},e.data,patch[e.id]):(e.data||{});
    if(d.set!==n)return;
    if(e.type==='SET_STARTED'){inSet=true;if(cnt===tot)cand=e;return}
    if(!inSet||e.type==='SET_ENDED')return;
    if(e.type==='SERVE'){served=true;return}
    if(e.type==='REPLAY'){served=false;if(cnt===tot)cand=e;return}
    if(e.type==='POINT'||(e.type==='SANCTION'&&(d.kind==='P'||d.kind==='DP'))){cnt++;served=false;if(cnt===tot)cand=e;return}
    if(cnt===tot&&!served)cand=e;
  });
  return cand?{after:cand.id,at:cand.at}:{err:'找不到 '+own+':'+opp+' 這個時間點。'};
}
/* 補的那個時間點的狀態（還沒補之前） */
function insState(m,x){var id='__inspt';return reduce(m.events.concat([{id:id,type:'AMEND',at:'',data:{ins:{after:x.anc.after,at:x.anc.at,type:'MARK',data:{set:x.set}}}}]),id)}
/* 補進去合不合規則：那時候可以、補了之後這隊這局後面的替補也還可以 */
function insCheck(m,n,k,type,data,anc){
  var ins={after:anc.after,at:anc.at,type:type,data:data},id='__ins',evs=m.events.concat([{id:id,type:'AMEND',at:new Date().toISOString(),data:{ins:ins,note:''}}]);
  var s0=reduce(evs,id),c0=s0.sets[n],nm=tName(s0,k);
  if(type==='TIMEOUT'){
    if(c0.timeouts[k].length>=2)return {err:'那時候'+nm+'這局已經 2 次暫停，不能再補。'};
    var t1=reduce(evs).sets[n].timeouts[k].length;
    if(t1>2)return {err:'補了之後'+nm+'這局會有 '+t1+' 次暫停，一局最多 2 次。先刪掉多的那一筆再補。'};
    return {ins:ins};
  }
  if(c0.cur[k][data.idx]!==data.out)return {err:'那時候這個位置不是 '+data.out+' 號。'};
  var o=subOptions(s0,k,data.idx,false);
  if(o.err)return {err:'那時候不能換：'+o.err+'。'};
  if((o.nos||[]).indexOf(data.in)<0)return {err:data.in+' 號那時候不能換上。'};
  var s1=reduce(evs),pos=-1;s1.log.forEach(function(q,i){if(q.id===id)pos=i});
  var later=s1.log.filter(function(q,i){return i>pos&&q.set===n&&q.team===k&&q.kind==='S'});
  for(var i=0;i<later.length;i++){
    var q=later[i],sb=reduce(evs,q.id),cb=sb.sets[n],why='';
    if(cb.cur[k][q.idx]!==q.out)why=q.out+' 號那時候已經不在場上';
    else{var ob=subOptions(sb,k,q.idx,q.exc);if(ob.err)why=ob.err;else if((ob.nos||[]).indexOf(q.in)<0)why=q.in+' 號那時候不能換上'}
    if(why)return {err:'補了之後，'+q.score+' 那次 '+q.out+' 換 '+q.in+' 會不合規則（'+why+'）。要先更正那一筆，或檢查比分。'};
  }
  return {ins:ins};
}
function insSave(m,s,x,chk,what){
  var sc=x.scv.join(':'),t='第 '+x.set+' 局 '+tName(s,x.team)+' 補記'+what+'（'+sc+'）';
  dispatch('AMEND',{ins:chk.ins,note:t});
  var id=m.events[m.events.length-1].id;
  ui.fixSet=x.set; ui.fixDone={ids:[id],t:'已補記：'+tName(s,x.team)+' '+what+'（'+sc+'）'}; ui.toast={t:ui.fixDone.t,until:Date.now()+3500}; ui.sheet=null;
}
function fixList(s,pv){
  var lock=matchOver(s)&&!pv; // 按了「確定比賽結束」之後只能看""")

# ── 更正頁：補記按鈕；確定比賽結束後只能看 ──
one("""data-field="'+(n===1?'actual':'st'+n)+'"></label><label>結束時間<input type="time" value="'+esc(setEndHM(s,n))+'" data-kind="info" data-field="en'+n+'"'+(c.ended?'':' disabled')+'></label></div>':'';""",
    """data-field="'+(n===1?'actual':'st'+n)+'"'+(lock?' disabled':'')+'></label><label>結束時間<input type="time" value="'+esc(setEndHM(s,n))+'" data-kind="info" data-field="en'+n+'"'+(c.ended&&!lock?'':' disabled')+'></label></div>':'';""")
one("""    return '<button class="fixrow '+x.team+(ui.fixDone&&ui.fixDone.ids.indexOf(x.id)>=0?' just':'')+'" data-act="amendopen" data-v="'+x.id+'"><span>'+esc(tName(s,x.team))+'</span><b>'+(x.kind==='T'?'暫停':x.kind==='J'?esc(sanText(x)):(x.exc?'例外替補 ':'替補 ')+x.out+' 換 '+x.in)+'</b><em>'+x.score+'</em></button>'});""",
    """    var tg=lock?'div':'button';
    return '<'+tg+' class="fixrow '+x.team+(ui.fixDone&&ui.fixDone.ids.indexOf(x.id)>=0?' just':'')+'"'+(lock?'':' data-act="amendopen" data-v="'+x.id+'"')+'><span>'+esc(tName(s,x.team))+'</span><b>'+(x.kind==='T'?'暫停':x.kind==='J'?esc(sanText(x)):(x.exc?'例外替補 ':'替補 ')+x.out+' 換 '+x.in)+'</b><em>'+x.score+'</em></'+tg+'>'});""")
one("""  return '<div class="narrow">'+seg+times+'<p class="subhint">暫停、替補或判罰按錯，點那一筆</p>'+(ui.fixDone?'<p class="good fixdone" role="status">'+esc(ui.fixDone.t)+'</p>':'')+(rows.length?'<div class="fixlist">'+rows.join('')+'</div>':'<p class="note">這局沒有暫停、替補或判罰。</p>')+lufix+'<p class="muted">更正暫停、替補和先發後，分數和輪轉不變。</p></div>';""",
    """  var none='<p class="note">這局沒有暫停、替補或判罰。</p>';
  if(lock)return '<div class="narrow">'+seg+times+'<p class="note">比賽已經確定結束，紀錄不能再改。</p>'+(rows.length?'<div class="fixlist locked">'+rows.join('')+'</div>':none)+'</div>';
  var add=c.started?'<button class="fixadd" data-act="insopen" data-v="'+n+'">＋ 補記漏按的暫停或替補</button>':'';
  return '<div class="narrow">'+seg+times+'<p class="subhint">暫停、替補或判罰按錯，點那一筆；漏按的按「補記」</p>'+(ui.fixDone?'<p class="good fixdone" role="status">'+esc(ui.fixDone.t)+'</p>':'')+(rows.length?'<div class="fixlist">'+rows.join('')+'</div>':none)+add+lufix+'<p class="muted">更正暫停、替補和先發後，分數和輪轉不變。</p></div>';""")
one("""  if(tab==='fix')return head+fixList(s)+back;""", """  if(tab==='fix')return head+fixList(s,pv)+back;""")

# ── 補記的視窗 ──
one("""  }else if(x.type==='amend'){""", """  }else if(x.type==='ins'){
    var iz=x.set,ic=s.sets[iz],iL=ic.left||s.sets[1].left||'t1',ik=x.team,SV='一二三四五六';
    h='<h2>補記第 '+iz+' 局</h2><p class="subhint">哪一隊漏按了</p><div class="teampick picked">'+[iL,other(iL)].map(function(q){return '<button class="'+q+'" data-act="insteam" data-team="'+q+'" aria-pressed="'+(ik===q)+'">'+esc(tName(s,q))+'</button>'}).join('')+'</div>';
    if(ik)h+='<p class="subhint">漏了什麼</p><div class="seg" style="flex:none">'+[['T','暫停'],['S','替補']].map(function(q){return '<button data-act="inskind" data-v="'+q[0]+'" aria-pressed="'+(x.kind===q[0])+'">'+q[1]+'</button>'}).join('')+'</div>';
    if(ik&&x.kind){
      var iv=x.scv||['',''],ibox=function(i,q){return '<label><span class="tpill '+q+'">'+esc(tName(s,q))+'</span><input id="ins'+i+'" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" value="'+esc(iv[i])+'" aria-label="'+esc(tName(s,q))+' 的分數"></label>'};
      h+='<div class="scedit"><p class="subhint">當時的比分</p><div class="scrow">'+ibox(0,ik)+'<b>:</b>'+ibox(1,other(ik))+'<button data-act="insgo">'+(x.kind==='T'?'補記暫停':'下一步')+'</button></div></div>';
    }
    if(x.err)h+='<p class="warning" role="alert">'+esc(x.err)+'</p>';
    if(ik&&x.kind==='S'&&x.anc){
      var s0=insState(m,x),c0=s0.sets[iz],tk0=s0.teams[ik];
      h+='<p class="subhint">'+esc(x.scv.join(':'))+' 那時候場上，點換下的人</p><div class="insgrid">'+c0.cur[ik].map(function(q,i){var lb=tk0.liberos.indexOf(q)>=0;return '<button data-act="insout" data-v="'+i+'" aria-pressed="'+(x.idx===i)+'"'+(lb?' disabled':'')+'><small>'+SV.charAt(i)+'</small><b>'+q+'</b>'+(lb?'<small>自由</small>':'')+'</button>'}).join('')+'</div>';
      if(x.idx!=null){
        var i2=subOptions(s0,ik,x.idx,false);
        h+=i2.err?'<p class="warning">'+esc(i2.err)+'</p>':(i2.nos||[]).length?'<p class="subhint">點換上的人</p><div class="bench"><div class="benchrow">'+i2.nos.map(function(q){return '<button class="chip '+ik+'" data-act="insin" data-no="'+q+'" aria-pressed="'+(x.inNo===q)+'"><b>'+q+'</b></button>'}).join('')+'</div></div>':'<p class="warning">那時候沒有可以換上的人。</p>';
        if(x.inNo!=null)h+='<button class="primary" data-act="insdo">補記替補：'+c0.cur[ik][x.idx]+' 換 '+x.inNo+'</button>';
      }
    }
    h+='<button data-act="close">取消</button>';
  }else if(x.type==='amend'){""")

# ── 按鈕 ──
one("""    case 'amendopen': ui.sheet={type:'amend',id:b.getAttribute('data-v')}; break;""",
    """    case 'amendopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，紀錄不能再改',until:Date.now()+2500};break} ui.sheet={type:'amend',id:b.getAttribute('data-v')}; break;
    case 'insopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，不能再補記',until:Date.now()+2500};break} ui.sheet={type:'ins',set:Number(b.getAttribute('data-v'))||s.setNo}; break;
    case 'insteam': case 'inskind':
      if(act==='insteam')ui.sheet.team=k;else ui.sheet.kind=b.getAttribute('data-v');
      ui.sheet.anc=null; ui.sheet.idx=null; ui.sheet.inNo=null; ui.sheet.err=null; break;
    case 'insgo':
      var ix=ui.sheet,iv=['ins0','ins1'].map(function(id){var el=document.getElementById(id);return el?el.value.trim():''}),inn=iv.map(function(v){return /^\\d{1,2}$/.test(v)?Number(v):NaN});
      ix.scv=iv; ix.anc=null; ix.idx=null; ix.inNo=null; ix.err=null;
      var ia=insAnchor(m,s,ix.set,ix.team,inn[0],inn[1]);
      if(ia.err){ix.err=ia.err;break}
      if(ix.kind==='S'){ix.anc=ia;break}
      var ich=insCheck(m,ix.set,ix.team,'TIMEOUT',{set:ix.set,team:ix.team},ia);
      if(ich.err){ix.err=ich.err;break}
      insSave(m,s,ix,ich,'暫停'); break;
    case 'insout': ui.sheet.idx=Number(b.getAttribute('data-v')); ui.sheet.inNo=null; ui.sheet.err=null; break;
    case 'insin': ui.sheet.inNo=no; ui.sheet.err=null; break;
    case 'insdo':
      var iy=ui.sheet,iout=insState(m,iy).sets[iy.set].cur[iy.team][iy.idx];
      var ich2=insCheck(m,iy.set,iy.team,'SUB',{set:iy.set,team:iy.team,idx:iy.idx,out:iout,in:iy.inNo,exc:false,injury:false},iy.anc);
      if(ich2.err){iy.err=ich2.err;break}
      insSave(m,s,iy,ich2,'替補 '+iout+' 換 '+iy.inNo); break;""")
one("""    case 'fixopen': ui.sheet={type:'fix',team:k,set:Number(b.getAttribute('data-v'))||s.setNo}; break;""",
    """    case 'fixopen': if(matchOver(s)){ui.toast={t:'比賽已經確定結束，紀錄不能再改',until:Date.now()+2500};break} ui.sheet={type:'fix',team:k,set:Number(b.getAttribute('data-v'))||s.setNo}; break;""")
one("""  if(e.key==='Enter'&&(tg.id==='amsc0'||tg.id==='amsc1')){""",
    """  if(e.key==='Enter'&&(tg.id==='ins0'||tg.id==='ins1')){e.preventDefault();var isb=app.querySelector('[data-act=insgo]');if(isb)isb.click();return}
  if(e.key==='Enter'&&(tg.id==='amsc0'||tg.id==='amsc1')){""")

# ── 說明 ──
one("""暫停、替補或判罰按錯，到「更正」點那一筆。各局開始和結束時間也在這裡改。""",
    """暫停、替補或判罰按錯，到「更正」點那一筆；漏按的按「補記」，選當時的比分。各局時間也在這裡改。按了「確定比賽結束」就不能再改。""")

# ── 樣式 ──
assert s.count('</style>') == 1
s = s.replace('</style>', """/* 11/12 補記 */
.fixadd{flex:none;width:100%;min-height:48px;margin-top:8px}
.fixlist.locked .fixrow{cursor:default}
.insgrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;flex:none}
.insgrid button{min-height:60px;padding:4px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.insgrid small{font-size:12px;font-weight:700;opacity:.8}
.insgrid b{font-size:22px;line-height:1;font-family:var(--num)}
.insgrid button[aria-pressed="true"],.sheet .bench .chip[aria-pressed="true"]{outline:3px solid var(--ink);outline-offset:-3px}
</style>""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v75 ok')

#!/usr/bin/env python3
"""11/20 早上使用者實測（語音），第二部分：新增比賽視窗。先跑 patch_v97～v118。
- 日期、時間不用 iPhone 內建的（每支手機長得不一樣）：點了在視窗裡出現月曆、時（0～23）分（每 5 分）格子，
  特別的時間按「自己輸入」打四個數字（1517 就是 15:17）；一樣先帶入預設值
- 上半部變矮：標題放在框框左邊；第一排日期、時間，第二排場地、男子組／女子組
- 兩隊的格子只寫隊名、變矮；空的寫「選隊伍」，正在選的那格綠框淡綠底寫「點下面的隊伍」，點填好的格子可以換隊
- 待定說明收起來，要用再打開
- 兩隊已經排過一場：跟時間衝突一樣提醒，可以照存（預賽碰過，排名賽可能再碰）"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if 'function scPicker' in s:sys.exit('already patched')
def one(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)

one("""    function lab(k){var nk=k==='t1'?'n1':'n2';return f[k]?'':'<label for="sc-'+nk+'">'+(k==='t1'?'第一隊':'第二隊')+'待定說明<input id="sc-'+nk+'" data-sc="'+nk+'" type="text" maxlength="20" placeholder="例如：A組第一" value="'+esc(f[nk]||'')+'"></label>'}""",
"""    function lab(k){var nk=k==='t1'?'n1':'n2';return f[k]?'':'<label for="sc-'+nk+'">'+(k==='t1'?'左邊':'右邊')+'待定<input id="sc-'+nk+'" data-sc="'+nk+'" type="text" maxlength="20" placeholder="例如：A組第一" value="'+esc(f[nk]||'')+'"></label>'}
    var tg=scTarget(x);""")
one("""      '<div class="scgrid"><label for="sc-date">日期<input id="sc-date" data-sc="date" type="date" max="9999-12-31" value="'+esc(f.date||'')+'"></label><label for="sc-time">時間<input id="sc-time" data-sc="time" type="time" value="'+esc(f.time||'')+'"></label></div>'+
      '<label for="sc-court">場地<input id="sc-court" data-sc="court" type="text" maxlength="20" list="sc-courts" autocomplete="off" placeholder="例如：室內場 A" value="'+esc(f.court||'')+'"></label><datalist id="sc-courts">'+cs.map(function(q){return '<option value="'+esc(q)+'">'}).join('')+'</datalist>'+
      '<div class="ctdiv"><span>男女組</span><div class="seg">'+CUP_DIVS.map(function(d){return '<button data-act="scdiv" data-v="'+d+'" aria-pressed="'+(f.division===d)+'">'+d+'</button>'}).join('')+'</div></div>'+""",
"""      '<div class="scmeta"><div class="scf"><span>日期</span><button class="scpkbtn" id="sc-date" data-act="scdate" data-v="'+esc(f.date||'')+'" aria-expanded="'+(x.pk==='date')+'" aria-label="日期：'+esc(schedDay(f.date))+'">'+esc(f.date?schedDay(f.date):'選日期')+'</button></div><div class="scf"><span>時間</span><button class="scpkbtn" id="sc-time" data-act="sctime" data-v="'+esc(f.time||'')+'" aria-expanded="'+(x.pk==='time')+'" aria-label="時間：'+esc(f.time||'未定')+'">'+esc(f.time||'未定')+'</button></div></div>'+
      (x.pk?scPicker(x):
      '<div class="scmeta"><label class="scf" for="sc-court"><span>場地</span><input id="sc-court" data-sc="court" type="text" maxlength="20" list="sc-courts" autocomplete="off" placeholder="例如：甲" value="'+esc(f.court||'')+'"></label><div class="seg scdivs">'+CUP_DIVS.map(function(d){return '<button data-act="scdiv" data-v="'+d+'" aria-pressed="'+(f.division===d)+'">'+d+'</button>'}).join('')+'</div></div><datalist id="sc-courts">'+cs.map(function(q){return '<option value="'+esc(q)+'">'}).join('')+'</datalist>'+""")
one("""      (function(){function slot(k){var t=schedTeam(c,f[k]),nx=!t&&(k==='t1'||f.t1);return '<button class="scslot'+(t?' on':'')+(nx?' next':'')+(x.just===k?' just':'')+'" data-act="scclr" data-v="'+k+'" aria-label="'+(k==='t1'?'第一隊':'第二隊')+(t?'：'+esc(t.team.name)+'，點一下取消':'：還沒選')+'"><small>'+(k==='t1'?'第一隊':'第二隊')+'</small><strong>'+(t?esc(t.team.name):'點下面的隊伍')+'</strong>'+(t?'<i aria-hidden="true">✕</i>':'')+'</button>'}""",
"""      (function(){function slot(k){var t=schedTeam(c,f[k]),on=tg===k;return '<button class="scslot'+(t?' on':'')+(on?' cur':'')+(x.just===k?' just':'')+'" data-act="scclr" data-v="'+k+'" aria-pressed="'+on+'" aria-label="'+(k==='t1'?'左邊隊伍':'右邊隊伍')+(t?'：'+esc(t.team.name)+(on?'，點下面的隊伍換掉':'，點一下可以換'):on?'：點下面的隊伍':'：還沒選')+'"><strong>'+(t?esc(t.team.name):on?'點下面的隊伍':'選隊伍')+'</strong></button>'}""")
one("""var k=f.t1===t.id?'第一隊':f.t2===t.id?'第二隊':'';return '<button class="imp" data-act="scpick" data-id="'+esc(t.id)+'" aria-pressed="'+(!!k)+'"><span>'+esc(t.team.name)+'</span><small>'+(k||t.team.players.length+' 人')+'</small></button>'}).join(''):'<p class="muted">這一組還沒有隊伍名單。</p>')+
      '</div>'+(f.t1&&f.t2?'':'<div class="scnotes">'+lab('t1')+lab('t2')+'</div>')+err+""",
"""var k=f.t1===t.id||f.t2===t.id;return '<button class="imp" data-act="scpick" data-id="'+esc(t.id)+'" aria-pressed="'+k+'"><span>'+esc(t.team.name)+'</span><small>'+(k?'已選，再點取消':t.team.players.length+' 人')+'</small></button>'}).join(''):'<p class="muted">這一組還沒有隊伍名單。</p>')+
      '</div>'+(f.t1&&f.t2?'':x.tbd||f.n1||f.n2?'<div class="scnotes">'+lab('t1')+lab('t2')+'</div>':'<button class="linkbtn sctbd" data-act="sctbd">隊伍還沒確定（例如 A組第一）</button>')+err+""")
one("""(x.warn?'<div class="warning" role="alert"><b>時間衝突</b>""","""(x.warn?'<div class="warning" role="alert"><b>'+esc(scWarnTitle(x.warn))+'</b>""")
# 選日期、時間時，下面的隊伍和按鈕先收起來，選好再出現
one("""'<button class="primary" data-act="scsave1">儲存</button>'+(x.id?'':'<button data-act="scsave1" data-v="next">儲存，再新增下一場</button>'))+(x.id?(x.ask?'<button class="danger" data-act="scdel2">確定刪除這一場</button><button data-act="scdelno">不要刪除</button>':'<button class="dellink" data-act="scdel">刪除這一場</button>'):'')+'<button class="ghost" data-act="close">'+(x.back?'關閉':'取消')+'</button>'}""",
"""'<button class="primary" data-act="scsave1">儲存</button>'+(x.id?'':'<button data-act="scsave1" data-v="next">儲存，再新增下一場</button>'))+(x.id?(x.ask?'<button class="danger" data-act="scdel2">確定刪除這一場</button><button data-act="scdelno">不要刪除</button>':'<button class="dellink" data-act="scdel">刪除這一場</button>'):'')+'<button class="ghost" data-act="close">'+(x.back?'關閉':'取消')+'</button>')}""")

one("function schedNextTime(t){","""/* 現在要填哪一格：點過的那格，沒點過就是第一個空格 */
function scTarget(x){var f=x.f;if(x.slot)return x.slot;return !f.t1?'t1':!f.t2?'t2':''}
function scPad(n){return ('0'+n).slice(-2)}
function scPicker(x){var f=x.f,h='<div class="scpk">';
  if(x.pk==='date'){var ym=x.cal||String(f.date||today()).slice(0,7),y=+ym.slice(0,4),mo=+ym.slice(5,7),first=new Date(y,mo-1,1).getDay(),days=new Date(y,mo,0).getDate(),td=today(),i;
    h+='<div class="sccalh"><button data-act="sccal" data-v="-1" aria-label="上個月">‹</button><b>'+y+' 年 '+mo+' 月</b><button data-act="sccal" data-v="1" aria-label="下個月">›</button></div><div class="sccal">'+'日一二三四五六'.split('').map(function(w){return '<span>'+w+'</span>'}).join('');
    for(i=0;i<first;i++)h+='<i></i>';
    for(i=1;i<=days;i++){var ds=y+'-'+scPad(mo)+'-'+scPad(i);h+='<button data-act="scday" data-v="'+ds+'" aria-pressed="'+(f.date===ds)+'"'+(ds===td?' class="td" aria-label="今天 '+mo+'/'+i+'"':'')+'>'+i+'</button>'}
    h+='</div>';
  }else{var hm=String(f.time||'').match(/^(\\d{2}):(\\d{2})$/),hh=hm?hm[1]:x.hh||'',mm=hm?hm[2]:'',i2;
    h+='<div class="sctl">時</div><div class="schh">';for(i2=0;i2<24;i2++)h+='<button data-act="schh" data-v="'+scPad(i2)+'" aria-pressed="'+(hh===scPad(i2))+'">'+i2+'</button>';
    h+='</div><div class="sctl">分</div><div class="schh">';for(i2=0;i2<60;i2+=5)h+='<button data-act="scmm" data-v="'+scPad(i2)+'" aria-pressed="'+(!!hm&&mm===scPad(i2))+'">'+scPad(i2)+'</button>';
    h+='</div>'+(x.tin?'<div class="row sctin"><input id="sc-tin" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="四個數字，例如 1517" aria-label="時間（四個數字）"><button class="primary" data-act="sctok">確定</button></div>'+(x.tinErr?'<p class="cuperr" role="alert">'+esc(x.tinErr)+'</p>':''):'')+
      '<div class="row"><button data-act="sctin" aria-pressed="'+!!x.tin+'">自己輸入</button><button data-act="sctnone">時間未定</button></div>';
  }
  return h+'<button class="primary" data-act="scpkdone">完成</button></div>';
}
function scWarnTitle(w){var d=w.some(function(q){return /已經排過/.test(q)}),t=w.some(function(q){return !/已經排過/.test(q)});return d&&t?'時間衝突、重複對戰':d?'重複對戰':'時間衝突'}
function schedNextTime(t){""")
# 重複對戰
one("""  var out=[],nos=schedNos(c),tm=String(g.time||'').trim(),ck=courtKey(g.court);if(!tm)return out;""",
"""  var out=[],nos=schedNos(c),tm=String(g.time||'').trim(),ck=courtKey(g.court);
  if(g.t1&&g.t2)liveSched(c).forEach(function(o){if(o.id===id||!(o.t1===g.t1&&o.t2===g.t2||o.t1===g.t2&&o.t2===g.t1))return;
    out.push('「'+schedTeam(c,g.t1).team.name+'」和「'+schedTeam(c,g.t2).team.name+'」已經排過一場：'+o.division+'第 '+nos[o.id]+' 場（'+schedDay(o.date)+' '+(o.time||'時間未定')+(o.court?'，場地：'+o.court:'')+'）')});
  if(!tm)return out;""")
# 動作
one("""    case 'scpick': if(x&&x.f){x.saved='';x.warn=null;var id=b.getAttribute('data-id'),f=x.f;x.just='';if(f.t1===id)f.t1='';else if(f.t2===id)f.t2='';else if(!f.t1){f.t1=id;x.just='t1'}else{f.t2=id;x.just='t2'}x.err=''} return true; // 兩格都滿就換掉第二隊
    case 'scclr': if(x&&x.f){x.warn=null;x.f[b.getAttribute('data-v')]='';x.just='';x.saved=''} return true;""",
"""    case 'scpick': if(x&&x.f){x.saved='';x.warn=null;x.err='';var id=b.getAttribute('data-id'),f=x.f;x.just='';
      if(f.t1===id||f.t2===id){var rk=f.t1===id?'t1':'t2';f[rk]='';x.slot=rk;return true} // 再點一次取消，那格變成正在選
      var tk=scTarget(x)||'t2',ok2=tk==='t1'?'t2':'t1';f[tk]=id;x.just=tk;x.slot=f[ok2]?'':ok2} return true; // 兩格都滿就換掉右邊
    case 'scclr': if(x&&x.f){x.warn=null;x.slot=b.getAttribute('data-v');x.just='';x.saved=''} return true; // 點格子：選這一格（填好的可以換隊，不會取消）
    case 'scdate': case 'sctime': if(x&&x.f){var pk=act==='scdate'?'date':'time';x.pk=x.pk===pk?null:pk;x.cal='';x.tin=false;x.tinErr='';x.hh=''} return true;
    case 'scpkdone': if(x)x.pk=null; return true;
    case 'sccal': if(x){var ym2=x.cal||String(x.f.date||today()).slice(0,7),d3=new Date(+ym2.slice(0,4),+ym2.slice(5,7)-1+Number(b.getAttribute('data-v')),1);x.cal=d3.getFullYear()+'-'+scPad(d3.getMonth()+1)} return true;
    case 'scday': if(x){x.f.date=b.getAttribute('data-v');x.pk=null;x.warn=null} return true;
    case 'schh': if(x){var om=String(x.f.time||'').match(/:(\\d{2})$/);x.hh=b.getAttribute('data-v');x.f.time=x.hh+':'+(om?om[1]:'00');x.warn=null} return true;
    case 'scmm': if(x){var oh=String(x.f.time||'').match(/^(\\d{2}):/),hh2=oh?oh[1]:x.hh;if(!hh2){x.tinErr='先點上面的「時」';x.tin=false;return true}x.f.time=hh2+':'+b.getAttribute('data-v');x.pk=null;x.warn=null} return true;
    case 'sctin': if(x){x.tin=!x.tin;x.tinErr=''} return true;
    case 'sctnone': if(x){x.f.time='';x.pk=null;x.warn=null} return true;
    case 'sctok': if(x){var tv=((document.getElementById('sc-tin')||{}).value||'').replace(/\\D/g,''),tq=tv.match(/^(\\d{1,2})(\\d{2})$/);
      if(!tq||+tq[1]>23||+tq[2]>59){x.tinErr='請打四個數字，例如 1517 是 15:17';return true}x.f.time=scPad(+tq[1])+':'+tq[2];x.pk=null;x.tin=false;x.tinErr='';x.warn=null} return true;
    case 'sctbd': if(x)x.tbd=true; return true;""")
one("case 'scwarnno': case 'scclr':","case 'scdate': case 'sctime': case 'scpkdone': case 'sccal': case 'scday': case 'schh': case 'scmm': case 'sctin': case 'sctnone': case 'sctok': case 'sctbd': case 'scwarnno': case 'scclr':")
one("""<div class="sheet'+(x.type==='scedit'?' scsheet':'')+'" role="dialog" aria-modal="true">""","""<div class="sheet'+(x.type==='scedit'?' scsheet'+(x.pk?' scpkon':''):'')+'" role="dialog" aria-modal="true">""")
# 自己輸入：Enter 等於確定
one("app.addEventListener('input',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-sc'),x=ui.cupSheet;if(k&&x&&x.f)x.f[k]=t.value});",
    """app.addEventListener('input',function(e){var t=e.target,k=t&&t.getAttribute&&t.getAttribute('data-sc'),x=ui.cupSheet;if(k&&x&&x.f)x.f[k]=t.value});
app.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing&&e.target&&e.target.id==='sc-tin'){e.preventDefault();var bt=app.querySelector('[data-act="sctok"]');if(bt)bt.click()}});""")

# 樣式
one(".scslots{display:grid;", """.scmeta{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.scf{display:flex;flex-direction:row;align-items:center;gap:8px;flex:1 1 140px;min-width:0;margin:0;font-weight:600}
.scf>span{flex:none;color:var(--muted);font-size:14px}
.scf>input,.scf>.scpkbtn{flex:1 1 auto;min-width:0;width:auto;margin:0}
.scpkbtn{justify-content:flex-start;min-height:44px;padding:0 12px;font-size:16px;font-weight:600;font-variant-numeric:tabular-nums}
.scpkbtn[aria-expanded="true"]{border-color:var(--ok);box-shadow:inset 0 0 0 1px var(--ok)}
.scdivs{flex:0 0 auto}
.scdivs>button{min-height:44px;padding:0 12px}
.scpk{display:flex;flex-direction:column;gap:8px;padding:10px;border:1px solid var(--line2);border-radius:12px;background:var(--card)}
.sccalh{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sccalh>button{min-width:44px;min-height:44px;font-size:20px}
.sccal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
.sccal>span{font-size:12px;color:var(--muted);padding:2px 0}
.sccal>button{min-height:44px;padding:0;font-variant-numeric:tabular-nums}
.sccal>button.td{font-weight:800;text-decoration:underline;text-underline-offset:3px}
.sctl{font-size:13px;font-weight:600;color:var(--muted)}
.schh{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}
.schh>button{min-height:44px;padding:0;font-variant-numeric:tabular-nums}
.sctin>input{flex:1 1 auto;min-width:0}
.sctbd{align-self:flex-start}
.scslots{display:grid;""")
one(".scslot{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;padding:6px 26px;",
    ".scslot{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:48px;padding:4px 8px;")
one(".scslot.next{border-color:var(--ink);color:var(--ink)}",".scslot.cur{border:2px solid var(--ok);background:var(--ok-soft);color:var(--ink)}")
one(".scslot.on strong{font-size:17px;font-weight:700}",".scslot.on strong{font-size:16px;font-weight:700}")
one("  .sheet.scsheet{overflow:hidden}","  .sheet.scsheet{overflow:hidden}\n  .sheet.scsheet.scpkon{overflow:auto}")
open(SRC,'w',encoding='utf8').write(s)
print('patched v119')

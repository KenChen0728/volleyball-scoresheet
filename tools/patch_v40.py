# v40：自由球員和面板好找、提示行不跳（使用者朋友 11/5 試用回饋）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
# 1. 點場上球員：沒有在替補或換自由時，格子也能點，跳出這位球員的選單
rep("""  return '<button'+(lj?' style="--j:'+lj+';--jt:'+jerseyText(lj)+'"':'')+' class="pc '+k+(isL?' isl':'')+(srv?' srv':'')+(pick?' pk':'')+(on?' sel':'')+(bad?' bad':'')+'" data-act="pcell" data-team="'+k+'" data-v="'+idx+'" data-pos="'+pos+'"'+(pick?'':' disabled')+'>""",
"""  var tap=pick||(!ui.sub&&!ui.lib);
  return '<button'+(lj?' style="--j:'+lj+';--jt:'+jerseyText(lj)+'"':'')+' class="pc '+k+(isL?' isl':'')+(srv?' srv':'')+(pick?' pk':'')+(on?' sel':'')+(bad?' bad':'')+'" data-act="pcell" data-team="'+k+'" data-v="'+idx+'" data-pos="'+pos+'"'+(tap?'':' disabled')+' aria-label="'+esc(tName(s,k))+' '+no+' 號'+(isL?' 自由球員':'')+'">""")
rep("""      if(ui.sub){if(!ui.sub.forced)ui.sub.idx=ix;break}""",
"""      if(ui.sub){if(!ui.sub.forced)ui.sub.idx=ix;break}
      if(!ui.lib){
        if(c.live){ui.toast={t:'球在進行中，得分後才能換人',until:Date.now()+2500};break}
        ui.sheet={type:'pmenu',team:k,idx:ix,pos:Number(b.getAttribute('data-pos'))};break;
      }""")
rep("""  var k=x.team,t=s.teams[k],h='';
  if(x.type==='points'){""",
"""  var k=x.team,t=s.teams[k],h='';
  if(x.type==='pmenu'){
    var pc=s.sets[s.setNo],pno=pc.cur[k][x.idx],pL=t.liberos.indexOf(pno)>=0,pOk=canPause(pc),lOk=canLib(pc,k),opts=[],why='';
    var free=t.liberos.filter(function(q){return pc.cur[k].indexOf(q)<0&&pc.expelled[k].indexOf(q)<0&&s.matchOut[k].indexOf(q)<0});
    var back=x.pos===4||x.pos===5||(x.pos===0&&pc.serving!==k);
    if(pL){
      if(pc.libOut[k])opts.push('<button class="mbtn big" data-act="pmlout" data-team="'+k+'"'+(lOk?'':' disabled')+'><strong>換回 '+pc.libOut[k].no+' 號</strong><small>自由球員下場</small></button>');
      free.forEach(function(q){opts.push('<button class="mbtn big" data-act="pmlswap" data-team="'+k+'" data-no="'+q+'"'+(lOk?'':' disabled')+'><strong>換成自由球員 '+q+' 號</strong><small>兩位自由球員互換</small></button>')});
      if(!lOk)why='自由球員剛換過，要隔一球才能再換。';
    }else{
      if(!pc.libOut[k]&&back)free.forEach(function(q){opts.push('<button class="mbtn big" data-act="pmlin" data-team="'+k+'" data-no="'+q+'"'+(lOk?'':' disabled')+'><strong>自由球員 '+q+' 號上場</strong><small>換下 '+pno+' 號</small></button>')});
      if(t.liberos.length&&!back)why='前排球員不能換自由球員。';
      else if(free.length&&!lOk&&!pc.libOut[k])why='自由球員剛換過，要隔一球才能再換。';
      var sOk=pOk&&pc.subRally[k]!==pc.rally;
      opts.push('<button class="mbtn big" data-act="pmsub" data-team="'+k+'"'+(sOk?'':' disabled')+'><strong>替補：換下 '+pno+' 號</strong><small>'+(sOk?'接著選上場的人':'這次已替補過，打完下一球才能再替補')+'</small></button>');
    }
    h='<div class="toask '+k+'">'+esc(tName(s,k))+'</div><h2>'+pno+' 號'+(pL?'（自由球員）':'')+'</h2>'+opts.join('')+(why?'<p class="muted">'+why+'</p>':'')+'<button data-act="close">取消</button>';
  }else if(x.type==='points'){""")
rep("""    case 'close': if(document.activeElement)""",
"""    case 'pmlin': var pmx=ui.sheet;ui.sheet=null;dispatch('LIBERO_IN',{set:n,team:k,lib:no,idx:pmx.idx});break;
    case 'pmlswap': ui.sheet=null;dispatch('LIBERO_SWAP',{set:n,team:k,lib:no});break;
    case 'pmlout': ui.sheet=null;dispatch('LIBERO_OUT',{set:n,team:k});break;
    case 'pmsub': var pms=ui.sheet;ui.sheet=null;ui.lib=null;ui.sub={team:k,idx:pms.idx,exc:false,ids:[]};break;
    case 'close': if(document.activeElement)""")
# 2. 換自由時可換的格子閃一下，L 號碼加字樣
rep("""  var court='<div class="pcourt" role="group\"""","""  var court='<div class="pcourt'+(ui.lib?' libmode':'')+'" role="group\"""")
rep("""  return '<div class="strip '+k+'"><div class="ls">'+h+'</div>""","""  return '<div class="strip '+k+'"><div class="ls">'+(t.liberos.length?'<span class="lcap">自由<br>球員</span>':'')+h+'</div>""")
# 3. 自由球員到前排：加上隊名色條，背景變暗，看得出是跳出視窗
rep("""    h='<h2>'+esc(tName(s,who.k))+' 自由球員'+(who.sv?'輪到發球':'到前排')+'</h2>""","""    h='<div class="toask '+who.k+'">'+esc(tName(s,who.k))+'</div><h2>自由球員'+(who.sv?'輪到發球':'到前排')+'</h2>""")
rep(".scrim.light{background:transparent}",".scrim.light{background:var(--scrim);opacity:.55}")
# 4. 提示行固定高度，字出現或消失時版面不跳
rep("  .lockline:empty{display:none}\n","")
rep("</style>","""/* v40 */
.lockline,.libhint{height:19px;min-height:19px;line-height:19px;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}
.sheet{box-shadow:0 -10px 30px rgba(0,0,0,.32);border-top:1px solid var(--line)}
.sheet::before{content:'';display:block;flex:none;width:40px;height:5px;border-radius:3px;background:var(--line);align-self:center;margin:-6px 0 2px}
@media (min-width:760px){.sheet::before{display:none}}
.kp{box-shadow:0 -10px 30px rgba(0,0,0,.28)}
.kp.bench{border-color:var(--c);border-top-width:5px}
.kp.bench .kphead>span:first-child{color:var(--c);font-weight:800;font-size:16px}
.ls{align-items:center}
.lcap{font-size:11px;line-height:1.15;font-weight:700;color:var(--muted);text-align:center;margin-right:2px}
.libmode .pc.pk{animation:pkpulse .9s ease-in-out 3}
@keyframes pkpulse{50%{box-shadow:0 0 0 5px var(--accent,#F5C400)}}
@media (prefers-reduced-motion:reduce){.libmode .pc.pk{animation:none}}
</style>""")
open(P,'w',encoding='utf8').write(s); print('ok')

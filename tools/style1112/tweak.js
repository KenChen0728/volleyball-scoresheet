// 示意用的結構調整（已決定的項目），每次截圖前套用；畫面重畫後要再套一次
(function(){
var M=window.__mock||{};var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var root=document.documentElement;root.classList.add('mock');
root.classList.remove('mk-faint','mk-hide','mk-zoom','mk-stack','mk-benchnew');
var GEAR='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.3-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z"/></svg>';
if(M.screen==='home'){
  $$('.themerow').forEach(function(r){r.remove()});
  var ab=$('.aboutbtn');
  if(ab&&!$('.mkfoot')){var f=document.createElement('div');f.className='mkfoot';var sb=document.createElement('button');sb.className='mkset';sb.innerHTML=GEAR+'設定';ab.parentNode.insertBefore(f,ab);f.appendChild(sb);f.appendChild(ab)}
  var h=$('.home');if(h&&$('.rmain[data-act=open]'))h.classList.add('mk-live');
  var bk=$('.bkrow .muted');if(bk)bk.textContent='有 4 場還沒備份，備份在「紀錄與名單」。';
}
if(M.screen==='hist'){
  $$('.rrow .rdel').forEach(function(e){e.remove()});
  $$('.rrow .hrow').forEach(function(h){if(!$('.mkgo',h)){var s=document.createElement('span');s.className='mkgo';s.textContent='打開 ›';h.appendChild(s)}h.classList.add('mkcard')});
  var p=$('.page .narrow>section:nth-child(2)>p.muted');if(p)p.remove();
  var p2=$$('.page .narrow>section:last-child>p.muted')[0];if(p2)p2.textContent='換手機或清除瀏覽器資料前，請先備份。';
}
if(M.screen==='sheet'){
  var t=$('.sheettabs');
  if(t&&!$('.mkset2')){
    var s1=$('[data-v=s1]',t),s2=$('[data-v=s2]',t),s3=$('[data-v=s3]',t);
    var cur=s2&&s2.getAttribute('aria-pressed')==='true'?2:s3&&s3.getAttribute('aria-pressed')==='true'?3:1;
    if(s1){s1.textContent='各局';s1.setAttribute('aria-pressed','true')}
    if(s2)s2.remove();if(s3)s3.remove();
    var lg=$$('.lg',t);lg.forEach(function(e){e.remove()});
    var seg=document.createElement('div');seg.className='mkset2';
    seg.innerHTML='<button aria-pressed="'+(cur===1)+'">第 1 局</button><button aria-pressed="'+(cur===2)+'">第 2 局</button>';
    t.parentNode.insertBefore(seg,t.nextSibling);
  }
  var v=$('.ctv-set');
  if(v&&M.variant==='zoom'&&!$('.mkhint')){
    root.classList.add('mk-zoom');
    var hint=document.createElement('div');hint.className='mkhint';hint.innerHTML='<span>左右滑動看整局</span><b>→</b>';v.parentNode.insertBefore(hint,v.nextSibling);
  }
  if(v&&M.variant==='stack'&&!$('.mkstack')){
    root.classList.add('mk-stack');
    var svg=$('svg',v);var vb=svg.getAttribute('viewBox').split(/\s+/).map(Number);var Wd=vb[2],Ht=vb[3];
    var lab=111/607.1*Wd,mid=360/607.1*Wd;
    var mk=function(x,w){var c=svg.cloneNode(true);c.setAttribute('viewBox',x+' 0 '+w+' '+Ht);c.removeAttribute('width');c.removeAttribute('height');c.style.cssText='display:block;width:auto;height:100%;max-width:none';return c};
    var box=document.createElement('div');box.className='mkstack';
    var r1=document.createElement('div');r1.className='mkrow';r1.appendChild(mk(0,mid));
    var r2=document.createElement('div');r2.className='mkrow';r2.appendChild(mk(0,lab));r2.appendChild(mk(mid,Wd-mid));
    box.appendChild(r1);box.appendChild(r2);
    v.style.display='none';v.parentNode.insertBefore(box,v.nextSibling);
  }
  if(v&&M.variant==='loupe'&&!$('.mkloupe')){
    // 甲：上面整局縮小，框起來的那一塊在下面放大（點上面哪裡就放大哪裡）
    root.classList.add('mk-loupe');
    var lsvg=$('svg',v),lvb=lsvg.getAttribute('viewBox').split(/\s+/).map(Number),LW=lvb[2],LH=lvb[3],x0=0.17,fr=0.40;
    v.style.position='relative';
    var lbox=document.createElement('div');lbox.className='mklbox';lbox.style.left=(x0*100)+'%';lbox.style.width=(fr*100)+'%';v.appendChild(lbox);
    var lh=document.createElement('div');lh.className='mkhint2';lh.textContent='點上面的記錄表，下面就放大那一塊';
    var mag=document.createElement('div');mag.className='mkloupe';
    var lc=lsvg.cloneNode(true);lc.setAttribute('viewBox',(x0*LW)+' 0 '+(fr*LW)+' '+LH);lc.removeAttribute('width');lc.removeAttribute('height');lc.style.cssText='display:block;width:100%;height:auto;max-width:none';
    mag.appendChild(lc);
    v.parentNode.insertBefore(lh,v.nextSibling);v.parentNode.insertBefore(mag,lh.nextSibling);
  }
  if(v&&M.variant==='stack2'&&!$('.mkstack')){
    // 乙：兩隊上下分開，每段上面寫隊名和隊色
    root.classList.add('mk-stack');
    var ssvg=$('svg',v),svb=ssvg.getAttribute('viewBox').split(/\s+/).map(Number),SW=svb[2],SH=svb[3];
    var slab=111/607.1*SW,smid=360/607.1*SW;
    var smk=function(x,w){var c=ssvg.cloneNode(true);c.setAttribute('viewBox',x+' 0 '+w+' '+SH);c.removeAttribute('width');c.removeAttribute('height');c.style.cssText='display:block;width:auto;height:100%;max-width:none';return c};
    var sbox=document.createElement('div');sbox.className='mkstack';
    var head=function(letter,name,col){var d=document.createElement('div');d.className='mkteamh';d.innerHTML='<i style="background:'+col+'">'+letter+'</i>'+name;return d};
    var sr1=document.createElement('div');sr1.className='mkrow';sr1.appendChild(smk(0,smid));
    var sr2=document.createElement('div');sr2.className='mkrow';sr2.appendChild(smk(0,slab));sr2.appendChild(smk(smid,SW-smid));
    sbox.appendChild(head('A','白鷺隊','#1E73C9'));sbox.appendChild(sr1);sbox.appendChild(head('B','黑熊隊','#E8731D'));sbox.appendChild(sr2);
    v.style.display='none';v.parentNode.insertBefore(sbox,v.nextSibling);
  }
}
if(M.screen==='play'&&(M.variant==='nolib-faint'||M.variant==='nolib-hide')){
  root.classList.add(M.variant==='nolib-faint'?'mk-faint':'mk-hide');
  // 示意：左邊那隊（黑熊隊）沒有登錄自由球員
  var left=$('.strip:not(.mir)')||$$('.strip')[0];
  var lk=left?left.className.indexOf('t2')>=0?'t2':'t1':'t2';
  $$('.lc.'+lk).forEach(function(b,i){if(b.classList.contains('empty'))return;var d=document.createElement('div');d.className='lc '+lk+' empty';d.setAttribute('aria-hidden','true');d.innerHTML='<span class="lno">L'+(i+1)+'</span><b class="none">無</b>';b.replaceWith(d)});
  $$('.lc').forEach(function(e){var p=e.parentElement;if(p&&!p.classList.contains('ls'))return;});
  $$('.ls').forEach(function(ls){var all=$$('.lc',ls);if(all.length&&all.every(function(e){return e.classList.contains('empty')}))ls.classList.add('mknone')});
}
if(M.screen==='bench'&&M.variant==='new'){
  root.classList.add('mk-benchnew');
  var kp=$('.kp.bench');
  if(kp&&!$('.mkpoint',kp)){
    var team=kp.classList.contains('t1')?'t1':'t2';var onLeft=kp.classList.contains('onleft');
    var name=(($('.kphead span',kp)||{}).textContent||'').replace(/替補.*/,'').trim()||'這隊';
    var tip=document.createElement('div');tip.className='mkpoint';
    tip.innerHTML=onLeft?'<span><b>'+name+'</b>的場地在右邊</span><i>→</i>':'<i>←</i><span><b>'+name+'</b>的場地在左邊</span>';
    var head=$('.kphead',kp);if(head&&head.nextSibling)kp.insertBefore(tip,head.nextSibling);else kp.appendChild(tip);
  }
}
})();

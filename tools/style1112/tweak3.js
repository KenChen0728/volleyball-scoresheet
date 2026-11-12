// 第三輪示意（11/12 晚）：比賽頁判罰放哪裡、結果頁按鈕整理。shoot3.js 在截圖前執行，主程式沒有改。
// window.__mock = {screen, variant}；variant：''（現在）、A（判罰縮小留在外面）、B（判罰收進「其他」）、resnew（結果頁整理後）
(function(){
  var m=window.__mock||{},v=m.variant||'',scr=m.screen||'';
  var css='';
  if(v==='A'||v==='B'){
    // 兩種都把暫停、替補加大（用掉下面的空白），下面那排次要按鈕變矮
    css+='.zone .tt button{min-height:64px!important;font-size:19px!important}'+
         '.pbtns button{min-height:40px!important;font-size:15px!important}';
  }
  if(v==='B')css+='.pbtns [data-act=penopen]{display:none!important}.pbtns{display:grid!important;grid-template-columns:1fr 1fr!important}';
  if(v==='resnew')css+='.page>button.primary.full[data-act=sheet][data-v=export],.page>.row.savebtns:not(.mockrow){display:none!important}'+
    '.mockrow{display:grid!important;grid-template-columns:1fr 1.6fr;gap:8px}'+
    '#bkwarn .mockbk{display:block;margin-top:8px;min-height:44px;width:100%}';
  var st=document.getElementById('mock3');if(!st){st=document.createElement('style');st.id='mock3';document.head.appendChild(st)}st.textContent=css;

  // B：「其他」最上面多一段「判罰」
  if(v==='B'&&scr==='more'){
    var sh=document.querySelector('.sheet');
    if(sh&&!sh.querySelector('.mockpen')){
      var heads=[].filter.call(sh.querySelectorAll('*'),function(e){return e.children.length===0&&e.textContent.trim()==='換人'});
      var h=heads[0];
      if(h){
        var nh=h.cloneNode(true);nh.textContent='判罰';
        var btn=document.createElement('button');btn.className='mbtn mockpen';btn.style.cssText='width:100%;display:flex;align-items:center;justify-content:center;gap:10px';
        var pb=document.querySelector('.pbtns [data-act=penopen] .ic');
        btn.innerHTML=(pb?pb.outerHTML:'')+'<span><strong>判罰</strong><small class="muted" style="display:block">警告、處罰、出局、出場、延誤</small></span>';
        h.parentNode.insertBefore(nh,h);h.parentNode.insertBefore(btn,h);
        btn.style.marginBottom='4px';
      }
    }
  }
  // 結果頁整理後：只留「看整張」和「存檔／分享」，還沒備份時提醒那格裡直接有「存備份」
  if(v==='resnew'&&(scr==='res'||scr==='ressheet')){
    var pg=document.querySelector('.page');
    if(pg&&!pg.querySelector('.mockrow')){
      var anchor=pg.querySelector('.page>button.primary.full[data-act=sheet][data-v=export]');
      var row=document.createElement('div');row.className='row savebtns mockrow';
      row.innerHTML='<button>看整張</button><button class="primary">存檔／分享</button>';
      if(anchor)anchor.parentNode.insertBefore(row,anchor);
      var w=document.getElementById('bkwarn');
      if(w&&!w.querySelector('.mockbk')){
        w.innerHTML=w.innerHTML.replace('建議現在按「存備份」。','建議現在存一份備份。');
        var bk=document.createElement('button');bk.className='mockbk';bk.textContent='存備份';w.appendChild(bk);
      }
    }
  }
  if(v==='resnew'&&scr==='ressheet'){
    var s=document.querySelector('.sheet');
    if(s&&!s.querySelector('.mockmore')){
      var t=s.querySelector('.shd h2');if(t)t.textContent='存檔／分享';
      var first=s.querySelector('[data-act=xpitem][data-v=all]');
      var mk=function(txt){var e=document.createElement('p');e.className='muted mockhd';e.style.cssText='margin:6px 2px 0;font-weight:700;font-size:14px';e.textContent=txt;return e};
      if(first)first.parentNode.insertBefore(mk('圖片／PDF'),first);
      var g=document.createElement('div');g.className='mgrid two mockmore';
      g.innerHTML='<button class="mbtn"><strong>存成試算表</strong><small class="muted">CSV，可以用 Excel 打開</small></button><button class="mbtn"><strong>存備份</strong><small class="muted">換手機時可以還原</small></button>';
      s.appendChild(mk('其他'));s.appendChild(g);
    }
  }
})();

#!/usr/bin/env python3
"""11/12 中午：朋友的平板按「備份」跳不出分享畫面，顯示「分享失敗，複製備份內容」；手機（iPhone）正常。
原因：Android 的 Chrome（三星瀏覽器、Edge 也一樣）分享檔案只收圖片、PDF、.txt、.csv 這類類型，不收 .json，
canShare 說可以，真的分享時卻被擋（Permission denied）。iPhone 沒有這個限制。
- Android 上 .json 的檔案（備份、單場、資料夾、問題資料）改用 .txt 分享，內容一樣；匯入本來就收 .txt。
- Android 上檔案類型不帶 charset（CSV 是 text/csv），免得被當成不認得的類型。
- 分享還是失敗（不是自己按取消）時，自動改成下載，並說明到「下載」資料夾找；複製內容的按鈕照留。
用法：python3 tools/patch_v73.py（改 /home/claude/nanshe/nanshe-scoresheet.html，再跑 build.py）"""
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s = open(SRC, encoding='utf8').read()
assert 'function saveFile(name,text,type){\n  var msg=document.getElementById(\'rvmsg\')||document.getElementById(\'savemsg\'),file=null,pf=platform();' not in s, '已經改過了'


def one(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), n, a[:90])
    s = s.replace(a, b)


one("""function saveFile(name,text,type){
  var msg=document.getElementById('rvmsg')||document.getElementById('savemsg'),file=null;
  try{file=new File([text],name,{type:type})}catch(e){}
  ui.lastFile={name:name,text:text};
  var clip='<button class="linkbtn" data-act="rpclip">複製備份內容</button>';
  if(file&&platform()!=='pc'&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:name}).then(function(){if(msg)msg.textContent='已分享，請確認檔案有存到'}).catch(function(e){if(e&&e.name==='AbortError')return;if(msg)msg.innerHTML='分享失敗，'+clip});
    return;
  }
  try{
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;document.body.appendChild(a);a.click();a.remove();
    if(msg)msg.innerHTML=(inAppName()?'這裡可能下載不了，請改用 Safari 或 Chrome 再備份一次，或':'已送出下載，請到下載資料夾確認有「'+esc(name)+'」。沒看到時可以')+clip;
  }catch(e){if(msg)msg.innerHTML='這裡不能下載，'+clip}
}""", """function saveFile(name,text,type){
  var msg=document.getElementById('rvmsg')||document.getElementById('savemsg'),file=null,pf=platform();
  // Android 的分享只收圖片、PDF、.txt、.csv 這類檔案，不收 .json：改用 .txt（內容一樣，匯入也收 .txt）；類型不帶 charset
  if(pf==='android'){if(/\\.json$/i.test(name)){name=name.replace(/\\.json$/i,'.txt');type='text/plain'}else type=String(type).split(';')[0]}
  try{file=new File([text],name,{type:type})}catch(e){}
  ui.lastFile={name:name,text:text};
  var clip='<button class="linkbtn" data-act="rpclip">複製備份內容</button>';
  function dl(pre){
    try{
      var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;document.body.appendChild(a);a.click();a.remove();
      if(msg)msg.innerHTML=pre+(inAppName()?'這裡可能下載不了，請改用 Safari 或 Chrome 再備份一次，或':'已送出下載，請到「下載」資料夾確認有「'+esc(name)+'」。沒看到時可以')+clip;
    }catch(e){if(msg)msg.innerHTML=pre+'這裡不能下載，'+clip}
  }
  if(file&&pf!=='pc'&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:name}).then(function(){if(msg)msg.textContent='已分享，請確認檔案有存到'}).catch(function(e){if(e&&e.name==='AbortError')return;dl('這台不能用分享，改成下載。')});
    return;
  }
  dl('');
}""")

open(SRC, 'w', encoding='utf8').write(s)
print('patch_v73 ok')

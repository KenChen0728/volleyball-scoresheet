
from PIL import Image
import base64,io,json,glob,os,sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
os.chdir('/home/claude/nanshe/help')
G=[('start','第一次使用','大概流程，還有怎麼練習',[('home','從這裡開始','按「開始新比賽」，照 1 到 5 的步驟往下走。'),('steps','五個步驟','資料、名單、挑邊、陣容、比賽。完成的步驟會打勾，不確定就按右上角的問號。'),('sample','先練習','按「用範例比賽試試」，名單已經填好，可以放心亂按。範例會標示「練習」，不會混進正式名單。')]),
('info','比賽資料','填比賽名稱、每局幾分',[('info','填比賽資料','比賽名稱、場次這些都能空著。開賽後就不能改了。'),('points','每局分數','一般不用改。要打 15 分或限制搶分時，按「每局分數設定」。'),('resume','先離開也可以','還沒開賽可以回主畫面，資料會留著。到「進行中」按「繼續準備」接著填。')]),
('roster','名單','輸入背號、隊長、自由球員',[('roster1','隊名和球衣','點上方填隊名，點旁邊的球衣圖示選顏色，標 L 的是自由球員。'),('roster2','輸入背號','點「號碼」空格，用數字鍵輸入，按「下一格」繼續，打完按「完成」。電腦可以直接打鍵盤。'),('roster3','隊長和自由球員','點已輸入的背號，再按「隊長」或「自由」。打錯可以按「移除」。'),('roster4','職員','教練等職員可以不填。')]),
('toss','挑邊','選先發球和左右場區',[('toss1','選發球和左右','點先發球隊伍的排球。左邊是 A 隊，要換邊按中間按鈕。'),('toss2','隊伍沒到','逾時未出賽或陣容不完整，按最下面的紅字。'),('pf','賽前沒收','選原因和獲勝隊，確定後比賽直接結束。')]),
('lineup','陣容','填先發站位、確認開局',[('lu1','填站位','點位置，再點背號。按錯就再點一次該格重選。'),('lu2','換另一隊','兩隊各填一張，上方切換隊伍。'),('lu3','確認陣容','填完按確認。還要改時按「修改」。'),('start','開局確認','第 1 局填實際開始時間，確認後開始。')]),
('play','比賽','發球、得分、復原',[('serve','看誰發球','排球和箭頭指向發球隊，號碼是發球球員，球場上有黃框的也是他。'),('serve2','發球','裁判鳴哨發球時按「發球」。'),('point','得分','按得分的隊伍。要重打按「公正」。'),('undo','按錯了','按上方「復原」退回上一步，畫面會寫退了什麼。可以連按往回退。'),('more','少用的功能','例外替補、傷停、陣容不完整、棄權和離開比賽，都在「其他」。')]),
('subs','暫停和替補','暫停、替補、自由球員',[('to','暫停','按「暫停」會先確認，確定才開始 30 秒倒數。'),('redes','重新指定自由球員','自由球員不能上場時，到「其他」重新指定。場上時可以新自由球員直接上場，或先換回原球員。'),('sub','替補','按「替補」，點場上要換下的人，再點上場的人，最後按「完成」。'),('lib','自由球員','點 L 格，再點後排要換下的人。換回來按「換下」格。'),('libf','自由球員到前排','自由球員輪到前排或發球時會跳提醒，按「換回」讓原本的球員回場。')]),
('penalty','判罰','判罰種類和怎麼記',[('pen','記判罰','按「判罰」，先選隊伍，再照裁判的判決點選。'),('pt','球隊判罰','不當請求：不合規定的請求。延誤警告：第一次延誤，只記錄。延誤懲罰：對方得 1 分。'),('pp','個人判罰','黃牌警告：只記錄。紅牌懲罰：對方得 1 分。出局：一手舉兩張牌，本局不能再上場。出場：兩手各一張牌，本場不能再上場。'),('pen2','判罰確認','確定才生效，取消不會留下紀錄。之後發現按錯，到「更正」修改。'),('pencard','牌卡標記','被判罰的球員，球場上的背號旁會顯示牌卡。')]),
('sets','局結束和下一局','核對比分、確定、填下一局',[('end','局結束','一局打完會自動開結果頁，先和紙本核對，再按上方的「確定本局結束」。'),('endback','按錯還能退','確定之前都能按「復原上一步」。確定之後就不能改比分，所以要先核對。'),('copy','下一局陣容','第 2、3 局要沿用就按「複製」，再用旋轉鈕調整。')]),
('set3','第 3 局','重新挑邊、8 分換場',[('toss3','重新挑邊','打成 1:1 要重新挑邊。點先發球隊伍的排球，要換邊按中間按鈕。A、B 隊不變。'),('swap','8 分換場','一隊先到 8 分時會跳提醒，兩隊換場後按「確定換場」，分數和輪轉不變。'),('final','比賽結束','打完一樣先核對，再按上方的「確定比賽結束」。')]),
('sheet','記錄表和更正','核對、全螢幕、修改按錯的紀錄',[('sheet1','看記錄表','比賽中按「記錄表」，上方切換各局、結果、判罰、自由球員和記事欄。'),('sheet2','全螢幕','按「橫向全螢幕」後把手機轉橫，適合核對局表。'),('fix1','更正','暫停、替補或判罰按錯，到「更正」點那一筆。各局開始和結束時間也在這裡改。'),('fix2','修改內容','可改人、改隊或刪除。暫停和替補改了比分不變；有給分的判罰改了，分數和輪轉會重算。'),('fixlu','先發背號打錯','按「其他」的「修正陣容」，選隊伍、位置和正確背號，比分和輪轉不變。')]),
('cup','賽事資料夾','盃賽的名單和比賽放一起',[('cup1','新增資料夾','主畫面按「新增資料夾」，填賽事名稱。'),('cup2','放進各隊名單','選男子組或女子組，按「加入隊伍名單」。可以從 Excel 或 LINE 貼上。'),('cup3','開新比賽','在資料夾按「開新比賽」，點兩隊，名單會自動帶入。'),('cup4','傳到另一台','按「存成檔案」傳過去，在「歷史紀錄」按匯入。')]),
('history','回顧和備份','看打完的比賽、搬到新手機',[('hist1','看以前的比賽','主畫面的「歷史紀錄」點一場，就能看記錄表。'),('bk','賽後先備份','資料只存在這台裝置。比賽打完按「存備份」，存到檔案或傳給自己。'),('hist2','備份和匯入','換手機前按「備份全部比賽」，到新裝置再匯入。')]),
('install','加到手機主畫面','iPhone、iPad、Android',[('ins_ios1','iPhone、iPad：第 1 步','用 Safari 開網站，按網址列旁的「⋯」，再按「分享」。舊版 iOS 直接按分享按鈕。'),('ins_ios2','iPhone、iPad：第 2 步','往下滑，按「加入主畫面」。'),('ins_ios3','iPhone、iPad：第 3 步','如果有「網頁 App」的開關就保持開啟，再按右上角「加入」。'),('ins_android','Android 手機、平板','用 Chrome 開網站，按右上角「⋮」，選「加到主畫面」或「安裝應用程式」。')]),
('install2','電腦和換瀏覽器','Windows、Mac、Chromebook、LINE',[('ins_pc','Windows、Chromebook','用 Chrome 或 Edge 開網站，按網址列右邊的安裝圖示，就會變成應用程式。Mac 的 Chrome 也一樣。'),('ins_mac','Mac 的 Safari','用 Safari 開網站，按上方選單的「檔案」，再按「加入 Dock」。'),('ins_line','從 LINE 打開時','LINE 裡面可能不能離線和備份。按主畫面提醒的「用 Safari 開啟」或複製網址，改用瀏覽器。'),('ins_data','舊資料怎麼帶過去','瀏覽器和主畫面的資料是分開的。先在原本的地方「備份全部比賽」，再到新的地方匯入。')])]
used={x[0] for g in G for x in g[3]}
imgs={}
tot=0
for f in glob.glob('raw/*.png'):
    n=os.path.basename(f)[:-4]
    if n.startswith('_') or n not in used:continue
    i=Image.open(f).convert('RGB')
    if i.width>560:i=i.resize((560,int(i.height*560/i.width)),Image.LANCZOS)
    b=io.BytesIO();i.save(b,'WEBP',quality=60,method=6);d=b.getvalue();tot+=len(d)
    imgs[n]='data:image/webp;base64,'+base64.b64encode(d).decode()
js='var HELP_IMG='+json.dumps(imgs)+';\nvar HELP='+json.dumps([{'id':a,'name':b,'desc':c,'cards':[{'img':x[0],'t':x[1],'d':x[2]} for x in cs]} for a,b,c,cs in G],ensure_ascii=False)+';\n'
missing=[x[0] for g in G for x in g[3] if x[0] not in imgs]
print('images',len(imgs),tot//1024,'KB missing',missing)
js+=r"""function helpCards(){var g=HELP.filter(function(x){return x.id===ui.help.group})[0]||HELP[0];return g.cards.map(function(c){return {img:c.img,t:c.t,d:c.d,g:g.name}})}
function helpHtml(){
  if(!ui.help)return '';
  if(!ui.help.group)return '<div class="help menu" role="dialog" aria-modal="true" aria-label="使用教學"><div class="hhead"><h1>使用教學</h1><button data-act="helpclose" aria-label="關閉說明">✕</button></div><div class="hmenu">'+HELP.map(function(g){return '<button data-act="helpgroup" data-v="'+g.id+'"><strong>'+esc(g.name)+'</strong><small>'+esc(g.desc)+'</small></button>'}).join('')+'</div></div>';
  var cs=helpCards(),i=Math.min(ui.help.i,cs.length-1),c=cs[i],src=HELP_IMG[c.img];
  var dots=cs.map(function(_,n){return '<i'+(n===i?' class="on"':'')+'></i>'}).join('');
  return '<div class="help" role="dialog" aria-modal="true" aria-label="使用說明"><div class="hhead"><button class="hback" data-act="helpmenu">‹ 目錄</button><span>'+esc(c.g)+'</span><button data-act="helpclose" aria-label="關閉說明">✕</button></div><div class="himg">'+(src?'<img src="'+src+'" alt="">':'')+'</div><div class="hcol"><div class="htxt"><h2>'+esc(c.t)+'</h2><p>'+esc(c.d)+'</p></div><div class="hdots">'+dots+'</div><div class="row hnav"><button data-act="helpgo" data-v="-1"'+(i===0?' disabled':'')+'>上一張</button>'+(i===cs.length-1?'<button class="go" data-act="helpclose">看完了</button>':'<button class="go" data-act="helpgo" data-v="1">下一張</button>')+'</div></div></div>';
}
function helpGroup(s){
  if(view==='history')return 'history';
  if(view==='home'||!s)return null;
  if(ui.page==='play'&&!ui.liveSheet&&!matchOver(s)&&setWinner(s))return 'sets';
  if(ui.page==='play'&&(ui.liveSheet||matchOver(s)))return 'sheet';
  if(ui.page==='toss'&&s.setNo===3&&!s.sets[3].started)return 'set3';
  return ui.page;
}
(function(){var sx=null,sy=null;
  document.addEventListener('touchstart',function(e){if(ui.help&&ui.help.group&&e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}},{passive:true});
  document.addEventListener('touchend',function(e){
    if(!ui.help||!ui.help.group||sx===null)return;var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;
    if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy))return;
    var n=helpCards().length,i=ui.help.i+(dx<0?1:-1);if(i<0||i>=n)return;ui.help.i=i;render();
  });
})();
"""
t=open(SRC,encoding='utf8').read()
js=js[:js.index('function helpCards(){')]
i=t.index('var HELP_IMG=');j=t.index('function helpCards(){')
t=t[:i]+js+t[j:]
open(SRC,'w',encoding='utf8').write(t)

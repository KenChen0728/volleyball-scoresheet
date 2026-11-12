# 排球電子記錄表

手機、平板、電腦都能用的排球電子記錄表。按發球、按得分，記錄表自動寫好，資料只存在各自的裝置，可以離線使用。

網址：https://kenchen0728.github.io/volleyball-scoresheet/

傳到 LINE 時請用這個連結，才會用外部瀏覽器開啟：https://kenchen0728.github.io/volleyball-scoresheet/?openExternalBrowser=1

## 加到主畫面或安裝

- iPhone、iPad：用 Safari 開啟，打開分享選單，選「加入主畫面」
- Android：用 Chrome 開啟，在選單選「加到主畫面」或「安裝應用程式」
- Windows、Chromebook：用 Chrome 或 Edge 開啟，按網址列右邊的安裝圖示
- Mac：用 Chrome 開啟，或用 Safari 按「檔案」的「加入 Dock」

開過一次後，沒有網路也能使用。比賽資料不會上傳，換裝置或清除瀏覽器資料前，請到「紀錄與名單」按「選擇」，勾要備份的比賽（全部就按「全選」）再按「備份」。

有網路時如果有新版本，畫面上方會出現提示，按「更新」就換成新版，比賽紀錄不會不見；按「稍後」先收起來，主畫面最下面也能更新。一局正在打的時候不會出現。

## 版權與授權

© 2026 Ken Chen。本系統免費提供非商業用途使用。散布或修改時，須保留原作者標示及本授權條款。

授權條款是 [PolyForm Noncommercial 1.0.0](LICENSE.md)（全文在 `LICENSE.md`）：
- 可以：個人、學校、球隊、比賽記錄台等非商業用途免費使用；可以修改、轉傳。
- 一定要：轉傳或修改時保留「Required Notice: Copyright 2026 Ken Chen」這行和授權條款。
- 不可以：拿去販售或其他商業用途。商業使用請先聯絡作者。

App 裡每天第一次打開會出現說明頁，主畫面最下面的「關於這個程式」也看得到同樣的聲明；匯出的記錄表右下角會印「© 2026 Ken Chen」。
學校版的標題字形是 Graduate（Eduardo Tunni，SIL Open Font License 1.1）轉成的外框，依原字型的授權。

## 給維護者

- `index.html` 是完整的網頁，由原始檔產生，改版時不用另外編譯
- 每次更新 `index.html` 都要改 `sw.js` 的 `CACHE` 名稱，使用者才會拿到新版
- `version.json` 寫著目前網站上的版本（`tools/build.py` 會一起寫）。網頁打開後、回到前景、重新連上網路時會問這個檔案，和自己的版本不一樣就提示「有新版本」（`updCheck`、`updSync`）。一局正在打、正在打字、面板開著時先不出現；按「更新」會先請 service worker 抓新版再重新載入，用 sessionStorage 記住原本的畫面（`-back`），回來後顯示「已更新」
- `sw.js` 不快取 `version.json`，安裝新版時用 `cache:'reload'` 直接向網站拿檔案，不會拿到瀏覽器 10 分鐘快取裡的舊版
- `sw.js` 只刪 `scoresheet-` 開頭的快取，同網域的其他程式不受影響；開啟時最多等網站 1.5 秒，沒回應就先用離線版
- 瀏覽器資料的 key 是 `nanshe-scoresheet-v1`，不要更改，否則舊比賽讀不到
- `tools/` 放建置和測試腳本：`reg.js` 跑完整流程與各尺寸版面，`cap.js` 重截教學圖，`help-gen.py` 把教學圖寫進網頁，路徑寫死在 `/home/claude/nanshe`
- 原始檔：`index.html` 去掉開頭的 meta 和最後的 service worker script 就是原始檔（`/home/claude/nanshe/nanshe-scoresheet.html`），改完跑 `python3 tools/build.py`

## 美國學校版 Volleyball Score Sheet（`school/`）

美國學校比賽專用的獨立網頁：https://kenchen0728.github.io/volleyball-scoresheet/school/

傳到 LINE 時請用：https://kenchen0728.github.io/volleyball-scoresheet/school/?openExternalBrowser=1

和完整版的差別：

- 只按得分：沒有發球鍵和公正鍵，一球按一下
- 替補次數不限，局內固定一對互換，下一局解除
- 名單只輸入背號，每隊 12 格加 2 個自由球員，自由球員可以空著
- 預設三局兩勝，開賽前可改五局三勝，第 3 局限制 17 分用「每局分數設定」的搶分
- 沒有記錄表：比賽紀錄只有結果、判罰、記事和更正。學校的 VOLLEYBALL SCORE SHEET 做好了但先拿掉，等看到實際寫法再加回來

給維護者：

- `school/index.html` 是由完整版的 `index.html` 產生的，不要直接改。完整版更新後跑 `python3 tools/school/derive.py` 就會同步，對不上的地方會直接停下來
- 改動都在 `tools/school/`：`patches.txt`（逐段替換）、`extra.css`、`help.json`（使用教學文字）
- 記錄表要加回來：`derive.py` 的 `SHEET` 改成 `True`（`test.js`、`help-shots.js` 同名變數也改），會改用 `sheet.js` 和 `help-sheet.json`，不套用 `patches-nosheet.txt`；比賽事件不用動，舊比賽也看得到記錄表。名單 12 格和裁判欄位在 `sheet.js` 以外的地方不用改
- 標題字形是 Graduate（Eduardo Tunni，SIL Open Font License 1.1）轉成的外框，存在 `lettering.json`，網頁不用帶字型檔；圖示由 `icon.js` 產生
- 使用教學的圖：`node tools/school/help-shots.js 暫存資料夾`，`python3 tools/school/help-img.py 暫存資料夾`，再跑一次 `derive.py`
- 測試：`test.js`（真實點擊跑規則）、`layout.js`（各尺寸版面）、`offline.js`（離線、和完整版並存，要先在專案根目錄開 `python3 -m http.server 8765`）。測試環境要設 `LANG=C.UTF-8`，不然中文檔名會變成 download
- 資料 key 是 `vb-school-v2`，個人設定 `vb-school-prefs`，快取前綴 `vbschool-`，都不能用 `scoresheet-` 開頭，否則會被完整版的 service worker 刪掉

### 退回前一版

有記錄表的那一版留在 `backup/school-with-sheet` 分支。更早自己重寫的二裁輪轉表留在 `backup/school-rewrite` 分支。要退回時（以後者為例）：

```
git rm -r -q school
git checkout backup/school-rewrite -- school
git commit -m "退回前一版學校網頁"
git push
```

重寫版的資料 key 是 `vb-school-v1`，新版沒有動到，退回後舊資料還在。

## 測試版（`beta/`）

給朋友先試新功能用：https://kenchen0728.github.io/volleyball-scoresheet/beta/

- 由 `tools/beta.py` 從 `index.html` 產生，比賽資料另存在 `nanshe-scoresheet-beta`，不會動到正式版的比賽
- 測試版和正式版程式相同（每次上線都用 `tools/beta.py` 重產），資料另存；朋友 11/9 在測試版輸入的比賽還在測試版裡，要看的話在測試版的「紀錄與名單」備份
- 下次要先給人試：在分支改好、`python3 tools/build.py`、`python3 tools/beta.py`，只把 `beta/index.html`、`beta/version.json` 放上 main
- 學校版測試版：https://kenchen0728.github.io/volleyball-scoresheet/school/beta/ ，跑完 `derive.py` 後用 `python3 tools/school/beta.py` 產生，資料另存在 `vb-school-beta`，說明圖用 `school/help/`（新的圖要先放上 main）
- 11/11 的勾選備份和更新提示先放在兩個測試版試，同一天上線正式版
- 11/11 第二批（判罰職員改成執行教練 C、教練 AC、領隊 T、管理 M；寬畫面字級放大；上方列每頁一樣）先放在兩個測試版試，同一天 1111-1230 上線正式版。學校版的說明圖在 `school/help/`，測試版和正式版共用，換圖要等上線（這次的「修改內容」用 `tools/help1111c.js` 截、`tools/help_v61.py` 換）
- 11/11 第三批（舉球員標示、替補和暫停改比分、說明頁、授權）先放兩個測試版，使用者 18:13 說做完直接上線，同一天上線正式版
- 11/11 第四批（替補、暫停後的「修正比分」和「其他」裡的「修正比分」，更正後寫出改了什麼）使用者說兩個入口都加、直接上線，同一天上線正式版
- 11/11 第五批（「其他」改版：四區分開，例外替補、重新指定自由球員、陣容、球衣顏色先選功能再選隊；暫停的計時列拿掉修正比分；「其他」→「修正比分」改成先選再改）先放兩個測試版，使用者 11/12 選先上線，1111-2346 上線正式版
- 11/12 替補面板開著時，另一隊的格子變灰、不能點；另一隊閃的自由球員點了是換回，不會選到替補這隊的人（以前會選錯人）。測試 `tools/t1112b.js`，先放兩個測試版
- 11/12 小修（換自由灰掉寫原因、全場幾分鐘、還寫「歷史紀錄」的地方改成「紀錄與名單」、比賽資料頁拿掉重複的回主畫面、面板的「‹ 返回」加高到 44px）先放兩個測試版，等新風格選好一起看；測試 `tools/t1112a.js`
- 11/12 新風格第一批（霧灰配中圓角；選中的按鈕深色加勾、一般按鈕實心；紅色只留給刪除比賽、沒收、棄權這類救不回來的；主畫面加「設定」；比賽、資料夾、隊伍、場地改成卡片加「打開 ›」；進行中的比賽改從「其他」→「離開這場比賽」裡刪除；記錄表第 1～3 局合成「各局」；沒有自由球員的 L 格不顯示；判罰的出局、出場拿掉小字）先放兩個測試版。學校版保留深藍和金色。說明圖還是舊的顏色，風格定案後一起重截
- 11/12 裁判頁（使用者實際比賽時把司線員填進助理記錄員、找不到怎麼刪）：點到已填的角色，下面直接有「清空」；點已經排在別處的名字或打同一個名字，直接搬過來；沒選角色時點名字會請他先點角色。改動在 `tools/patch_v72.py`，測試 `tools/t1112d.js`，先放兩個測試版
- 11/12 Android 備份分享（朋友的平板按備份顯示「分享失敗」）：Android 的 Chrome 分享檔案不收 .json，備份、單場、資料夾的檔案在 Android 改用 .txt 分享（匯入本來就收 .txt）；分享還是失敗就自動改成下載。改動在 `tools/patch_v73.py`，測試 `tools/t1112e.js`。使用者說「上線」，這個修正單獨上線正式版 1112-1231（新風格還在測試版）
- 11/12 13:26 名單的號碼格：正在輸入的那格不打勾（格子窄，勾會蓋住號碼），粗框照留。改動在 `tools/patch_v74.py`，先放兩個測試版
- `old/`：暫時放的「改之前」版本（1109-2350，號碼放大前），給使用者比較用，資料另存在 `nanshe-scoresheet-old`，比完就刪

## 退回前一版（完整版和學校版一起）

每次改版前各留一個分支，新的在上面：

- `backup/before-share-fix-1112`：Android 備份分享改用 .txt（1112-1231）之前，也就是 1111-2346
- `backup/before-more-1111`：「其他」改版（四區分開、先選功能再選隊）、暫停的計時列拿掉修正比分、「其他」→「修正比分」先選再改之前，也就是 1111-2234
- `backup/before-fixentry-1111`：「修正比分」兩個新入口（替補、暫停後的提示列，「其他」裡的修正比分）和更正後的回饋之前，也就是 1111-1816
- `backup/before-setter-1111`：舉球員標示、替補和暫停改比分、說明頁和授權之前，也就是 1111-1230
- `backup/before-staff-1111`：判罰職員改成執行教練 C、教練 AC、領隊 T、管理 M，寬畫面字級放大，上方列每頁一樣（記錄表頁時間靠右）之前，也就是 1111-1037
- `backup/before-backup-select-1111`：勾選比賽再備份（拿掉「備份全部比賽」）、備份時選要不要帶名單、有新版時提示更新之前，也就是 1111-0937
- `backup/before-ball-1111`：發球的小排球、自由球員 L、牌卡跟著號碼放大之前，也就是 1111-0910
- `backup/before-bignum-1111`：橫的平板下方縮小記錄表收起來、號碼放大到 0.45 倍格子之前，也就是 1109-2350
- `backup/before-lineup-full`：陣容頁六格填滿時號碼整排不見的修正之前，也就是 1109-2025
- `backup/before-help-1109`：「紀錄與名單」頁的問號改成這頁自己的說明、自由球員說明圖重截、選中的 L 格小勾移到角落之前，也就是 1109-1953
- `backup/before-feedback-1109b`：11/9 晚語音討論那批（主畫面三個按鈕、開新比賽先選資料夾、紀錄與名單、裁判名單依場地、匯入前確認和一筆一筆合併、組別兩層比對、選取樣式加勾）之前，也就是 1109-1828
- `backup/before-feedback-1109`：11/9 朋友回饋（平板號碼放大、替補先點場下、名單照輸入順序、陣容號碼變灰、依組別選隊伍）之前，也就是 1107-1917
- `backup/before-livepreview`：裁判名字、記事打字時預覽馬上更新之前，也就是 1107-1036
- `backup/before-live`：比賽頁球進行中收起其他按鈕、手機顯示開始時間、隊名長條對齊半場、淺色隊色用深色字、裁判分頁預覽、看整張之前，也就是 1107-0831
- `backup/before-ctview`：App 記錄表的各局、結果、判罰、記事分頁改成協會記錄表裁切之前，也就是 1107-0818
- `backup/before-notes`：記事欄句子改寫（A 隊／B 隊、延誤原因、例外替補寫成受傷）、打到一半棄權照實際比分之前，也就是 1107-0412
- `backup/before-time`：記錄表時間改成「裁判決定的開始時間＋實際打的時間」之前，也就是 1107-0338
- `backup/before-paper-form-2`：協會記錄表微調（時間平均分配、勝隊置中、比賽成績和繳交成績那格分開、記事欄縮字）之前，也就是 1107-0308
- `backup/before-paper-form`：匯出改成協會記錄表格式、加「裁判」分頁、職員改成執行教練／教練／領隊／管理、資料頁加組別和承辦城市之前
- `backup/before-capreq`：球隊隊長改回一定要有、缺的話跳回名單彈出來選之前（這一版沒有隊長也能開賽）
- `backup/before-captain`：名單沒有隊長也能開賽、比賽時隊長格閃之前（之前沒有隊長會擋住「開始第 1 局」）
- `backup/before-nav`：統一「返回」和「關閉」之前
- `backup/before-export`：加入「存成圖片／PDF」之前
- `backup/before-wide-v47`：手機直式隊名長條、時間與羅馬數字放大、結果頁放大之前
- `backup/before-wide-v45`：局數移到上方色帶之前
- `backup/before-wide-v44`：隊名置中、第幾局移到上方色帶之前
- `backup/before-wide-v43`：最上面隊名改成隊色長條之前
- `backup/before-wide-v42`：依畫面高度調整之前。自由球員、隊長已經在兩側，但下方記錄表從高度 621 起就出現，記錄表頁要上下滑
- `backup/before-wide-v41`：更早，視窗返回上一層、兩側對稱、自由球員和隊長移到兩側之前

要退回時（以前者為例）：

```
git checkout backup/before-wide-v42 -- index.html sw.js school
git commit -m "退回寬版調整前"
git push
```

協會記錄表（給維護者）：「存成圖片／PDF」的整張記錄表照中華民國排球協會網站的三局制記錄表重畫，A3 橫式；各局和比賽結果從同一張裁切。格線和印好的字在 `CT3`（從協會 PDF 用 pdfplumber 抽出），比賽資料的格子座標在 `CTG`，畫圖從 `ctSvg` 開始。這段在學校版會被刪掉（學校版沒有匯出）。裁判欄位是 `REFS`，職員是 `STAFF`，舊資料的「隨隊教師」用 `staffOf()` 顯示成舊欄位。

名單順序、替補面板（給維護者，11/9）：`reduce` 最後把輸入順序存在 `t.entry`，`t.players` 照背號排。名單頁和記錄表用 `entryOf(t)`，陣容、替補等選號的地方用 `t.players`。替補面板的場下名單是 `benchPool`（任一位置能合法換上的人），先點場下時用 `subFits` 決定哪些格子亮；每一組照舊立刻記成 `SUB` 事件，面板上的「刪除」是對那一組（和同一位置後來又換的）送 `UNDO`。比賽頁號碼大小由 `fitNums` 依格子短邊 × 0.45 放大，最多 110px（11/11 從 0.4、84px 調大）；發球的小排球、自由球員 L、牌卡用同一個倍數（`--k`，最多 1.7 倍）從所在角落放大。測試：`node tools/fb1109.js`（名單順序、陣容變灰、替補兩種順序、綁定、刪除、平板號碼大小）、`node tools/fb1109b.js`（各尺寸替補面板、組別篩選和載入）。

資料夾和裁判名單（給維護者，11/9 晚）：
- 開新比賽只有主畫面一個入口，有資料夾時先選要放哪個（`newMatchIn`，預設上一場的資料夾；上一場之後才建的資料夾優先）。比賽放哪個資料夾記在比賽物件的 `m.cup`，不是事件，資料頁可以隨時改（`setcup`）。
- 主畫面只留「開始新比賽」「紀錄與名單」「使用教學」和進行中的比賽。「紀錄與名單」沿用原本的 `history` 畫面，放資料夾、打完的比賽（標資料夾或未分類）、備份和匯入。範例比賽在使用教學的目錄最上面（只在主畫面打開時出現）。
- 裁判名單存在 `cup.refs`，一位一筆：`{court, label, name, at, del}`。`court` 是 `courtKey()` 正規化過的場地（「第五場地」「第 5 場」「五」都是 `5`）。比賽結束時 `addMatchRefs` 把那場的裁判加進該場地的名單，做過的記在比賽物件的 `m.refSig`，之後在資料夾刪掉的不會被同一場加回來。
- 隊伍和裁判每筆都有 `at`（最後修改時間），刪除不真的刪，留 `del:true`。匯入時 `planCups` 一筆一筆比，`at` 比較新的留下；先用 `importPlanHtml` 列出會改什麼，按「匯入」才 `applyCups`。比賽紀錄不合併：同一場以紀錄多的為主。
- 組別用 `parseGroup` 拆成級別、細分、男女，`groupTier` 決定「載入」的順序：同一組 → 同級別或沒寫組別 → 其他組（藏在按鈕後面）。
- 選取樣式：「已選」是粗框加右上角的勾（`::after`），球場、場下號碼、陣容格、名單格、裁判角色、清單選項都一樣；發球員維持黃框和排球。
- 使用教學的圖：完整版的圖包在 `HELP_IMG` 裡，這次只重截改過的幾張（截圖腳本不在專案，做法同 `tools/cap.js`）；學校版的圖在 `school/help/`，`help-img.py` 會先刪掉全部再重產，只換幾張時不要跑它。
- 測試：`node tools/fb1109c.js`（主畫面、選資料夾、裁判名單、自動加名單、匯入合併、選取樣式）。

隊長（給維護者）：每隊一定要有球隊隊長。名單頁「下一步」或陣容頁「開始第 1 局」時缺的話，跳到名單並彈出背號讓人點（`firstNeed`、`need` 視窗）；按鈕不變灰。陣容頁不問場上隊長，隊長不在先發時，開賽後隊長格閃，在比賽頁指定。舊比賽名單沒有隊長的，比賽頁點隊長格會先選球隊隊長（`tcap`）。測試：`node tools/captain.js`。

橫的畫面怎麼排（給維護者）：高度 520 以下是手機排法；521 以上兩側隊伍欄排暫停、替補、自由、隊長，自由和隊長對齊球場下緣。原本高度 800 以上會在下方放縮小的記錄表，11/11 使用者說收起來（年紀大的裁判覺得字小），球場和號碼放大，要看按「記錄表」。

勾選備份（給維護者，11/11）：「紀錄與名單」按「選擇」進入 `ui.bkSel`，清單有進行中和打完的比賽；「全選」等於以前的「備份全部比賽」，連還沒有比賽的資料夾名單也列出來。按「備份」開 `bkSheetHtml`，每個盃賽列「全部隊伍名單（N 隊）」「裁判名單（N 人）」讓人勾，預設都勾；`bkSave` 照勾的存檔，不帶的名單存成空的（資料夾外殼還在，比賽才會回到原本的資料夾，匯入時一筆一筆比，不會刪掉對方的名單）。每場備份時間記在個人設定 `bk`，全選時記 `lastBackup`，主畫面寫還有幾場沒備份。保存失敗時的「立刻備份」還是存全部。測試：`node tools/t1111a.js`（要先 `python3 tools/fixture1111.py`）；更新提示：`node tools/t1111b.js`（要用 http://127.0.0.1 開網站，說明在檔案開頭）。說明圖：`tools/help1111.js` 截圖、`tools/help_v60.py` 寫進兩個版本。

判罰職員和字級（給維護者，11/11 第二批）：判罰對象 `STAFFWHO` 每筆是 [存的代號, 中文, 紙本英文]：執行教練存 `C`、教練存 `AC`（沿用以前的代號，同一個人），領隊存 `領隊`、管理存 `管理`（中文，舊版程式打開也看得懂）。以前判給防護員、隊醫的存 `T`、`M`，放在 `STAFFOLD` 照當時的名稱顯示。`whoText` 給 App 裡的文字（「領隊 T」），`whoCode` 給紙本、判罰紀錄、CSV（只寫「T」）。寬畫面的字級都用 `clamp(原本, vh, 上限)`，矮的筆電維持原本大小；比賽中的面板只在 `.shell.nonav~.sheet`（比賽中）放大，按鈕高度用 `:where()` 壓低權重，原本比較高的按鈕不會變矮。上方列 920～1019 寬時比分改放在兩邊中間，不然會碰到時間。改動在 `tools/patch_v61.py`，測試 `node tools/t1111c.js`（學校版加網址和 `vb-school-v2`）。

舉球員和改比分（給維護者，11/11 下午）：舉球員存成事件 `SETTER_SET {set, team, no, on}`，狀態在 `s.setters`（不放在隊伍名單裡，名單存進資料夾時不會帶走），一隊最多兩位；和球衣顏色一樣不算比賽動作，不佔用「復原」。格子右上角的「舉」是 `.stmk`，學校版的換人綁定標記 `.bindm` 有「舉」時移到下面。改比分是更正事件 `AMEND {target, patch:{sc:[本隊, 對方]}}`，比分用「這筆那一隊在前」存，挑邊更正兩隊對調時不用跟著改；暫停改隊時一起把 `sc` 對調。每局的得分順序記在 `c.path`，`scCheck` 用它判斷比分有沒有出現過。改動在 `tools/patch_v62.py`、`tools/patch_v63.py`，測試 `node tools/t1111d.js`、`node tools/t1111e.js`（學校版加網址和 `vb-school-v2`）。說明圖用 `tools/help_img.py` 換或新增。

說明頁和授權（給維護者，11/11 晚上）：說明頁和「關於這個程式」是同一個 `aboutHtml()`（`ui.about` 是 `'intro'` 或 `'about'`）。每天第一次打開、停在主畫面時跳一次，日期記在偏好設定 `prefs.introDay`，不寫進比賽資料；從比賽中直接回到比賽畫面時不跳。自動測試（`navigator.webdriver`）不跳，網址加 `?intro` 才跳，所以舊的測試不用改。改比分時同一個位置換下和換回一樣的比分也擋（例外替補不算）。改動在 `tools/patch_v64.py`，測試 `node tools/t1111f.js`（學校版加網址和 `vb-school-prefs`）。

修正比分入口（給維護者，11/11 晚上）：按完替補（點球員、替補面板按完成），`scNoteSet` 把那幾筆記在 `ui.scnote {ids, set, rally}`，`timerBar()` 在下方畫提示列 `.scnote`。暫停不放（使用者 11/11 23:42：暫停不用），暫停的比分從「其他」或更正改。`scNote()` 發現已經不是同一個死球（`c.rally` 變了、`c.live`）或那一筆被復原就收起來，所以發球、得分的地方不用清。修正比分視窗是 `ui.sheet.type==='scfix'`：`ids` 是要改的那幾筆，從「其他」打開時 `pick:true`，先列出這局的暫停和替補（`ids` 是空的），點一筆才只顯示那一筆和比分格子，左上「‹ 返回」（`scback`）回清單（使用者 11/11 23:44：上面格子、下面清單擠在一起找不到要點哪裡）。送出共用 `amendscore`，同時按的幾組替補各送一筆 `AMEND`。改完的結果寫在 `ui.toast`（比賽畫面）和 `ui.fixDone`（更正清單上方、那一筆加 `.just`），下一次點任何東西就清掉；改人、改隊、刪除也寫。手機橫放和矮的直式手機，有計時列或提示列時球場可以再縮（`:has()`），發球鍵不會被擠出畫面。改動在 `tools/patch_v65.py`、`tools/patch_v67.py`（暫停不放）、`tools/patch_v68.py`（先選再改、清單加「›」），測試 `node tools/t1111g.js`（學校版加網址和 `vb-school-v2`），說明圖 `node tools/help1111g.js <網址> <png>` 再用 `tools/help_img.py fixsc` 換。

「其他」選單（給維護者，11/11 晚上）：要先選隊的功能寫在 `MTEAM`（[其他裡的按鈕, 選隊時的標題, 選完的動作, 動作要帶的屬性]），按了開 `ui.sheet.type==='mteam'`，兩隊按鈕直接帶原本的 `data-act`（`subopen`、`redopen`、`fixopen`、`sheet`）。`fromMenu` 在選隊那層會拿它的 `back`（也就是「其他」），所以下一步的「‹ 返回」直接回到「其他」，不會停在選隊。四區是 `.msec`，之間有分隔線。學校版兩隊都沒有自由球員時，換人區只有例外替補（`.mgrid.one`）。改動在 `tools/patch_v66.py`，測試 `node tools/t1111h.js`（學校版加網址和 `vb-school-v2`）、`node tools/nav.js`，說明圖 `node tools/help1111h.js <網址> <png>` 再用 `tools/help_img.py more` 換。

新風格（給維護者，11/12）：改動在 `tools/patch_v71.py`。顏色和圓角都是 CSS 變數，淺色、深色（`@media` 和 `[data-theme=dark]` 兩處）各一組：`--btn`／`--btn-ink` 一般按鈕、`--sel`／`--sel-on` 選中的按鈕（`.seg`、`.rtabs`、`.setpick` 選中時前面加勾）、`--del` 紅色、`--card` 可以點的清單卡片（`.hrow.card`，右邊 `.hgo` 寫「打開 ›」）、`--r`／`--rb`／`--rc`／`--rs` 是小、按鈕、卡片、面板的圓角。學校版在 `tools/school/extra.css` 最上面把顏色換回深藍和金色。紅色只給 `.danger`（刪除、匯入時取代名單、沒收、陣容不完整、棄權）和紅框小按鈕（`.dellink`、`.linkbtn.dangerlink`、挑邊頁的 `.pfbtn`）；退格、清空、移除、刪掉還沒確定的替補都是一般按鈕。設定（提示字、外觀）在主畫面下方的「設定」，`ui.about==='settings'` 和「關於這個程式」共用同一個面板。記錄表的「各局」按鈕帶現在這一局（`setTabNo`），打過兩局以上時下面多一排選局（`setPick`）。

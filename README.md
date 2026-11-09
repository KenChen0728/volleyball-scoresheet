# 排球電子記錄表

手機、平板、電腦都能用的排球電子記錄表。按發球、按得分，記錄表自動寫好，資料只存在各自的裝置，可以離線使用。

網址：https://kenchen0728.github.io/volleyball-scoresheet/

傳到 LINE 時請用這個連結，才會用外部瀏覽器開啟：https://kenchen0728.github.io/volleyball-scoresheet/?openExternalBrowser=1

## 加到主畫面或安裝

- iPhone、iPad：用 Safari 開啟，打開分享選單，選「加入主畫面」
- Android：用 Chrome 開啟，在選單選「加到主畫面」或「安裝應用程式」
- Windows、Chromebook：用 Chrome 或 Edge 開啟，按網址列右邊的安裝圖示
- Mac：用 Chrome 開啟，或用 Safari 按「檔案」的「加入 Dock」

開過一次後，沒有網路也能使用。比賽資料不會上傳，換裝置或清除瀏覽器資料前，請到「紀錄與名單」備份。

## 版權

© 2026 Ken Chen。歡迎免費使用，未經同意不得販售或改作販售。

## 給維護者

- `index.html` 是完整的網頁，由原始檔產生，改版時不用另外編譯
- 每次更新 `index.html` 都要改 `sw.js` 的 `CACHE` 名稱，使用者才會拿到新版
- `sw.js` 只刪 `scoresheet-` 開頭的快取，同網域的其他程式不受影響；開啟時最多等網站 1.5 秒，沒回應就先用離線版
- 瀏覽器資料的 key 是 `nanshe-scoresheet-v1`，不要更改，否則舊比賽讀不到
- `tools/` 放建置和測試腳本：`reg.js` 跑完整流程與各尺寸版面，`cap.js` 重截教學圖，`help-gen.py` 把教學圖寫進網頁，路徑寫死在 `/home/claude/nanshe`

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
- 下次要先給人試：在分支改好、`python3 tools/build.py`、`python3 tools/beta.py`，只把 `beta/index.html` 放上 main

## 退回前一版（完整版和學校版一起）

每次改版前各留一個分支，新的在上面：

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

名單順序、替補面板（給維護者，11/9）：`reduce` 最後把輸入順序存在 `t.entry`，`t.players` 照背號排。名單頁和記錄表用 `entryOf(t)`，陣容、替補等選號的地方用 `t.players`。替補面板的場下名單是 `benchPool`（任一位置能合法換上的人），先點場下時用 `subFits` 決定哪些格子亮；每一組照舊立刻記成 `SUB` 事件，面板上的「刪除」是對那一組（和同一位置後來又換的）送 `UNDO`。比賽頁號碼大小由 `fitNums` 依格子短邊 × 0.4 放大，最多 84px。測試：`node tools/fb1109.js`（名單順序、陣容變灰、替補兩種順序、綁定、刪除、平板號碼大小）、`node tools/fb1109b.js`（各尺寸替補面板、組別篩選和載入）。

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

橫的畫面怎麼排（給維護者）：高度 520 以下是手機排法；521 以上兩側隊伍欄排暫停、替補、自由、隊長，自由和隊長對齊球場下緣；高度 800 以上（或高度 690 以上且畫面不太寬）才在下方放記錄表，先讓球場維持比例，剩下的高度才給記錄表。

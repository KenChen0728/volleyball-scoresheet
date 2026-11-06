# 排球電子記錄表

手機、平板、電腦都能用的排球電子記錄表。按發球、按得分，記錄表自動寫好，資料只存在各自的裝置，可以離線使用。

網址：https://kenchen0728.github.io/volleyball-scoresheet/

傳到 LINE 時請用這個連結，才會用外部瀏覽器開啟：https://kenchen0728.github.io/volleyball-scoresheet/?openExternalBrowser=1

## 加到主畫面或安裝

- iPhone、iPad：用 Safari 開啟，打開分享選單，選「加入主畫面」
- Android：用 Chrome 開啟，在選單選「加到主畫面」或「安裝應用程式」
- Windows、Chromebook：用 Chrome 或 Edge 開啟，按網址列右邊的安裝圖示
- Mac：用 Chrome 開啟，或用 Safari 按「檔案」的「加入 Dock」

開過一次後，沒有網路也能使用。比賽資料不會上傳，換裝置或清除瀏覽器資料前，請到歷史紀錄頁備份。

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

### 退回寬版調整前

視窗返回上一層、橫向畫面兩側對稱和按鈕放大之前的版本留在 `backup/before-wide-v41` 分支。要退回：

```
git checkout backup/before-wide-v41 -- index.html sw.js school
git commit -m "退回寬版調整前"
git push
```

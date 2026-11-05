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

## 二裁輪轉表（`school/`）

美國學校比賽專用的獨立網頁：https://kenchen0728.github.io/volleyball-scoresheet/school/

- 二裁自己操作：背號名單（12＋2，無姓名）、分數、發球、輪轉、暫停、無限次綁定替補、三局或五局，不輸出記錄表
- 原始檔是 `tools/school/src.html`，改完跑 `python3 tools/school/build.py`；測試 `tools/school/test.js`、`sizes.js`，說明圖 `shots.js`
- 資料 key 是 `vb-school-v1`，快取前綴是 `vbschool-`，都不能用 `scoresheet-` 開頭，否則會被主程式的 service worker 刪掉

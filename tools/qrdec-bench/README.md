# QR code 解碼測試（tools/v100-qrscan.js 的 qrDecode）

在這個資料夾裡跑：

```
node mk.js            # 用本系統的編碼器產生 QR 矩陣 → ours.json
python3 gen.py        # 加上旋轉、透視、模糊、螢幕反光、縮小 → img/*.rgba（280 張）
node run.js           # 解碼成功率，和 OpenCV 比較；不能有解錯（wrong 0）
python3 speed.py && node speed.js   # 每張畫面花幾毫秒
```

11/16 結果：268/280（96%），OpenCV 247/280（88%），解錯 0；640×480 一張約 37 毫秒。
`cam.js` 加上 gen 的做法可以做假相機影片（ffmpeg 轉 y4m），給 `tools/t1116-scan.js` 用（CAM 環境變數指定資料夾）。
img/、cam/、*.json 是產生出來的，不進 git。

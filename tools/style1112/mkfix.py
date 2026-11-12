#!/usr/bin/env python3
"""風格示意用的資料：把 tools/fixture1111.py 產生的資料換成虛構的隊名和裁判名（說明和示意不放學校或私人的名稱）。
用法：python3 tools/fixture1111.py && python3 tools/style1112/mkfix.py && node tools/style1112/mkfix2.js"""
import os
here = os.path.dirname(os.path.abspath(__file__))
s = open('/tmp/fix1111.json', encoding='utf-8').read()
REP = {'恆春國中': '白鷺隊', '來義國中': '黑熊隊', '潮州國中': '飛魚隊', '東港國中': '藍鵲隊', '屏東國中': '山羌隊', '萬丹國中': '石虎隊', '枋寮國中': '海豚隊', '崁頂國中': '穿山甲隊', '佳冬國中': '雲豹隊', '林邊國中': '水鹿隊', '新園國中': '梅花鹿隊', '內埔國中': '帝雉隊', '中正國小': '小白鷺隊', '仁愛國小': '小飛魚隊', '光華國小': '小雲豹隊', '南社盃': '秋季盃', '校際盃': '友誼盃', '劉怡君': '裁判甲', '吳建宏': '裁判乙', '張家豪': '裁判丙', '李小華': '裁判丁', '林美玲': '裁判戊', '王大明': '裁判己', '陳志強': '裁判庚', '黃雅婷': '裁判辛'}
for a, b in REP.items():
    s = s.replace(a, b)
open(os.path.join(here, 'fix.json'), 'w', encoding='utf-8').write(s)
print('ok')

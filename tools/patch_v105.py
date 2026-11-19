#!/usr/bin/env python3
"""11/19 首頁「紀錄與名單」改名「賽事與紀錄」（使用者 22:20：裡面現在主要是賽事資料夾〔賽程、名冊、裁判〕，再來才是打完的比賽）。
畫面、提示、使用說明的文字一起換；說明截圖裡的舊名稱等正式上線前重截說明時一起換。先跑 patch_v97～v104。"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if s.count('紀錄與名單')==0:sys.exit('already patched')
n=s.count('紀錄與名單');s=s.replace('紀錄與名單','賽事與紀錄')
open(SRC,'w',encoding='utf8').write(s)
print('patched v105',n)

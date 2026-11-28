#!/usr/bin/env python3
"""11/28 晚 使用者：「甲隊 對 乙隊」統一改成「甲隊 VS 乙隊」（觀看手機開賽前、記錄台比賽結束標題、清單、賽程、觀看清單、刪除和救回的提示）。先跑 patch_v136。
只換兩隊名稱中間的「 對 」；積分明細的「第 N 場　對 某隊」是「和某隊打」的意思，不換"""
import sys
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
n=s.count("' 對 '")
if n==0:sys.exit('already patched')
assert n==12,n
s=s.replace("' 對 '","' VS '")
open(SRC,'w',encoding='utf8').write(s);print('ok',n)

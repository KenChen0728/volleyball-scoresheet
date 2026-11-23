#!/usr/bin/env python3
"""11/23 原始檔不見時，從測試版 beta/index.html 倒推原始檔 /home/claude/nanshe/nanshe-scoresheet.html（beta.py 的反向）。
正式版 index.html 比測試版舊，所以要從測試版倒推。"""
import os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(R,'beta','index.html'),encoding='utf8').read()
i=s.index('<title>');s=s[i:]
def one(a,b):
    global s
    assert s.count(a)==1,a;s=s.replace(a,b)
one('<title>排球電子記錄表（測試版）</title>','<title>排球電子記錄表</title>')
one("'nanshe-scoresheet-beta'","'nanshe-scoresheet-v1'")
s=re.sub(r"var BUILD='測試版 ([^']*)';",r"var BUILD='\1';",s,count=1)
os.makedirs('/home/claude/nanshe',exist_ok=True)
open('/home/claude/nanshe/nanshe-scoresheet.html','w',encoding='utf8').write(s)
print('src ok',len(s)//1024,'KB')

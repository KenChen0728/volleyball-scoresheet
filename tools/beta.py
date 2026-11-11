#!/usr/bin/env python3
"""由 index.html 產生測試版 beta/index.html：資料另外存（不碰正式版的比賽），不安裝、不離線。
正式上線時不用這個檔，直接合併分支。"""
import re,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(R,'index.html'),encoding='utf8').read()
def one(a,b):
    global s
    assert s.count(a)==1,a; s=s.replace(a,b)
one("'nanshe-scoresheet-v1'","'nanshe-scoresheet-beta'")
s=re.sub(r"<script>if\('serviceWorker'.*?</script>\n?","",s,flags=re.S)
one('<link rel="manifest" href="manifest.webmanifest">\n','')
s=s.replace('href="icons/','href="../icons/')
one('<title>排球電子記錄表</title>','<title>排球電子記錄表（測試版）</title>')
s=re.sub(r"var BUILD='([^']*)';",lambda m:"var BUILD='測試版 "+m.group(1)+"';",s,count=1)
os.makedirs(os.path.join(R,'beta'),exist_ok=True)
open(os.path.join(R,'beta','index.html'),'w',encoding='utf8').write(s)
open(os.path.join(R,'beta','version.json'),'w',encoding='utf8').write('{"build":"'+re.search(r"var BUILD='[^0-9']*([0-9]{4}-[0-9]{4})';",s).group(1)+'"}\n')
print('beta ok',len(s)//1024,'KB')

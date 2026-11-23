#!/usr/bin/env python3
"""11/23 只更新測試版：原始檔 → beta/index.html（跟 build.py＋beta.py 產生的一樣），不動正式版 index.html、sw.js、version.json。
用法：python3 tools/beta-from-src.py（版本號用現在時間）"""
import os,re,time,subprocess,sys
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
os.environ.setdefault('TZ','Asia/Taipei');time.tzset()
BUILD=time.strftime('%m%d-%H%M')
s=re.sub(r"var BUILD='[^']*';","var BUILD='"+BUILD+"';",s,count=1)
open(SRC,'w',encoding='utf8').write(s)
src=open(os.path.join(R,'tools','build.py'),encoding='utf8').read()
base=eval(re.search(r"base=('.*?')\n",src).group(1));pwa=re.search(r"pwa='''(.*?)'''",src,re.S).group(1)
reg=eval(re.search(r'reg=(".*?")\n',src).group(1))
tmp='/tmp/web-index.html';open(tmp,'w',encoding='utf8').write(base+pwa+s.rstrip()+'\n'+reg)
b=open(os.path.join(R,'tools','beta.py'),encoding='utf8').read().replace("os.path.join(R,'index.html')","'"+tmp+"'")
exec(compile(b,'beta.py','exec'),{'__file__':os.path.join(R,'tools','beta.py')})
print('BUILD',BUILD)

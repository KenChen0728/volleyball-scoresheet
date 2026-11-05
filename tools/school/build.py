#!/usr/bin/env python3
"""由 tools/school/src.html 產生 school/index.html，並更新 sw.js 的快取名稱和檔案清單。"""
import hashlib,json,os,re,time
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
s=open(R+'/tools/school/src.html',encoding='utf8').read()
m=re.search(r"var BALL='(.*?)';\n",open(R+'/index.html',encoding='utf8').read())
ball=re.sub(r'id="(\w+)"',r'id="sb\1"',m.group(1)); ball=re.sub(r'url\(#(\w+)\)',r'url(#sb\1)',ball)
s=s.replace('__BALL__',json.dumps(ball,ensure_ascii=False)).replace('__BUILD__',time.strftime('%m%d-%H%M'))
open(R+'/school/index.html','w',encoding='utf8').write(s)
imgs=sorted('help/'+f for f in os.listdir(R+'/school/help') if f.endswith('.webp'))
files=['./','index.html','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png']+imgs
ver=hashlib.sha1((s+''.join(imgs)).encode()).hexdigest()[:8]
w=open(R+'/tools/school/sw.template.js',encoding='utf8').read().replace('__VER__',ver).replace('__FILES__',json.dumps(files))
open(R+'/school/sw.js','w',encoding='utf8').write(w)
print('built',ver,len(s)//1024,'KB',len(imgs),'imgs')

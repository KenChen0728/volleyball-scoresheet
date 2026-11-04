#!/usr/bin/env python3
"""由 nanshe-scoresheet.html（唯一原始檔）產生離線版與網站版。"""
import hashlib,re
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
OFF='/home/claude/nanshe/排球電子記錄表.html'
WEB='/home/claude/volleyball-scoresheet/index.html'
SW='/home/claude/volleyball-scoresheet/sw.js'
s=open(SRC,encoding='utf8').read()
base='<!doctype html>\n<html lang="zh-Hant">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
open(OFF,'w',encoding='utf8').write(base+s)
pwa='''<meta name="theme-color" content="#12324F">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="排球記錄表">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" href="icons/icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
'''
reg="<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}</script>\n"
open(WEB,'w',encoding='utf8').write(base+pwa+s.rstrip()+'\n'+reg)
ver=hashlib.sha1(s.encode()).hexdigest()[:8]
w=open(SW,encoding='utf8').read()
w=re.sub(r"var CACHE='[^']*';","var CACHE='scoresheet-"+ver+"';",w)
open(SW,'w',encoding='utf8').write(w)
print('built',ver,len(s)//1024,'KB')

#!/usr/bin/env python3
"""由 nanshe-scoresheet.html（唯一原始檔）產生離線版與網站版。"""
import hashlib,re,time
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
OFF='/home/claude/nanshe/排球電子記錄表.html'
WEB='/home/claude/volleyball-scoresheet/index.html'
SW='/home/claude/volleyball-scoresheet/sw.js'
s=open(SRC,encoding='utf8').read()
s=re.sub(r"var BUILD='[^']*';","var BUILD='"+time.strftime('%m%d-%H%M')+"';",s,count=1)
open(SRC,'w',encoding='utf8').write(s)
base='<!doctype html>\n<html lang="zh-Hant">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
open(OFF,'w',encoding='utf8').write(base+s)
pwa='''<meta name="theme-color" content="#12324F">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="排球記錄表">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" href="icons/icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="description" content="手機、平板、電腦都能用的排球電子記錄表。按發球、按得分，記錄表自動寫好，可以離線使用。">
<meta property="og:type" content="website">
<meta property="og:title" content="排球電子記錄表">
<meta property="og:description" content="按發球、按得分，記錄表自動寫好。資料只存在自己的裝置，可以離線使用。">
<meta property="og:url" content="https://kenchen0728.github.io/volleyball-scoresheet/">
<meta property="og:image" content="https://kenchen0728.github.io/volleyball-scoresheet/icons/icon-512.png">
'''
reg="<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}</script>\n"
open(WEB,'w',encoding='utf8').write(base+pwa+s.rstrip()+'\n'+reg)
ver=hashlib.sha1(s.encode()).hexdigest()[:8]
w=open(SW,encoding='utf8').read()
w=re.sub(r"var CACHE='[^']*';","var CACHE='scoresheet-"+ver+"';",w)
open(SW,'w',encoding='utf8').write(w)
print('built',ver,len(s)//1024,'KB')

"""11/23 版本號統一寫成「年.月.日.當天第幾版」（例如 2026.11.23.1），測試版和正式版共用一套號碼。
version.json 同時寫兩個欄位：ver＝新寫法（新程式看這個）、build＝舊寫法 MMDD-HHMM（11/23 以前的舊手機只認這個，要一直跟著變，舊手機才會收到更新）。"""
import os,json,time
os.environ['TZ']='Asia/Taipei';time.tzset()
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _vers():
    out=[]
    for p in ('version.json','beta/version.json'):
        try:out.append(json.load(open(os.path.join(R,p),encoding='utf8')).get('ver',''))
        except Exception:pass
    return out
def next_ver():
    d=time.strftime('%Y.%m.%d');n=0
    for v in _vers():
        if v.startswith(d+'.'):n=max(n,int(v.split('.')[-1]))
    return d+'.'+str(n+1)
def old_build():return time.strftime('%m%d-%H%M')
def version_json(ver):return json.dumps({'build':old_build(),'ver':ver},ensure_ascii=False)+'\n'

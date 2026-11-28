#!/usr/bin/env python3
"""11/28 使用教學換新截圖（Gemini 第 10 條）：陣容 lu1、lu3（轉一格按鈕）、比賽 serve、serve2、point（公正虛線框）、暫停 to、觀看比賽 watch1（VS）。
圖在 tools/help1128/，深色主題，紅框標重點；照 help_img.py 的做法包成 560 寬 webp。先跑 patch_v141。"""
import base64,io,json,os,sys
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(SRC,encoding='utf8').read()
if '/*help1128*/' in s:sys.exit('already patched')
def webp(path,width=560,q=60):
    i=Image.open(path).convert('RGB')
    if i.width>width:i=i.resize((width,int(i.height*width/i.width)),Image.LANCZOS)
    b=io.BytesIO();i.save(b,'WEBP',quality=q,method=6);return b.getvalue()
i=s.index('var HELP_IMG=');j=s.index(';\n',i)
imgs=json.loads(s[i+len('var HELP_IMG='):j])
for k in ['lu1','lu3','serve','serve2','point','to','watch1']:
    assert k in imgs,k
    imgs[k]='data:image/webp;base64,'+base64.b64encode(webp(os.path.join(R,'tools','help1128',k+'.png'))).decode()
s=s[:i]+'var HELP_IMG='+json.dumps(imgs)+';/*help1128*/'+s[j+1:]
# 說明文字跟著新按鈕
H0=s.index('var HELP=');H1=s.index(';\n',H0);H=json.loads(s[H0+9:H1])
for g in H:
    for c in g['cards']:
        if c.get('img')=='lu3' and '轉' not in c['d']:c['d']+='六格填好後，上面可以整隊轉一格，按鈕直接寫「改成幾號發球」。'
        if c.get('img')=='point' and '公正' in c['d']:c['d']=c['d']
s=s[:H0]+'var HELP='+json.dumps(H,ensure_ascii=False)+s[H1:]
open(SRC,'w',encoding='utf8').write(s);print('ok')

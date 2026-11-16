import json, numpy as np, cv2, random, os
random.seed(7); np.random.seed(7)
items=[]
ours=json.load(open('ours.json'))
def mat_img(G, px=10, quiet=4):
    N=len(G); a=np.ones((N+2*quiet,N+2*quiet),np.uint8)*255
    for r in range(N):
        for c in range(N):
            if G[r][c]: a[r+quiet,c+quiet]=0
    return cv2.resize(a,None,fx=px,fy=px,interpolation=cv2.INTER_NEAREST)
srcs=[]
for o in ours: srcs.append((o['t'], mat_img(o['G'])))
enc_texts=['https://kenchen0728.github.io/volleyball-scoresheet/beta/?watch=HJK234','HELLO WORLD 123','12345678901234567890','測試中文 UTF-8']
for t in enc_texts:
    for lvl in [0,1,2,3]:
        p=cv2.QRCodeEncoder_Params(); p.correction_level=lvl
        e=cv2.QRCodeEncoder.create(p); q=e.encode(t)
        if q is None or q.size==0: continue
        q=cv2.resize(q,None,fx=10,fy=10,interpolation=cv2.INTER_NEAREST)
        srcs.append((t,q))
def scene(qr, kind):
    H,W=480,640
    bg=np.full((H,W),random.randint(150,235),np.uint8)
    # 背景雜物
    for _ in range(6):
        x,y=random.randint(0,W),random.randint(0,H);cv2.rectangle(bg,(x,y),(x+random.randint(10,120),y+random.randint(10,80)),random.randint(30,220),-1)
    s=qr.shape[0]
    size=random.uniform(170,330) if kind!='small' else random.uniform(110,150)
    cx,cy=W/2+random.uniform(-80,80),H/2+random.uniform(-50,50)
    ang=np.deg2rad(random.uniform(-180,180) if kind in ('rot','all') else random.uniform(-8,8))
    pts=np.array([[-1,-1],[1,-1],[1,1],[-1,1]],np.float32)*size/2
    R=np.array([[np.cos(ang),-np.sin(ang)],[np.sin(ang),np.cos(ang)]])
    pts=pts@R.T
    if kind in ('persp','all'):
        pts+=np.random.uniform(-size*0.12,size*0.12,pts.shape)
    pts+=[cx,cy]
    M=cv2.getPerspectiveTransform(np.array([[0,0],[s,0],[s,s],[0,s]],np.float32),pts.astype(np.float32))
    warped=cv2.warpPerspective(qr,M,(W,H),flags=cv2.INTER_LINEAR,borderValue=255)
    mask=cv2.warpPerspective(np.full_like(qr,255),M,(W,H),flags=cv2.INTER_NEAREST,borderValue=0)
    img=np.where(mask>0,warped,bg).astype(np.float32)
    if kind in ('screen','all'):  # 螢幕：發亮、對比低、摩爾紋
        img=img*0.55+90
        yy,xx=np.mgrid[0:H,0:W]; img+=12*np.sin(xx*0.9+yy*0.31)
    # 光線不均
    yy,xx=np.mgrid[0:H,0:W]; img*=0.7+0.5*(xx/W)*random.uniform(0.5,1)
    if kind in ('blur','all'): img=cv2.GaussianBlur(img,(0,0),random.uniform(1.0,1.8))
    else: img=cv2.GaussianBlur(img,(0,0),0.6)
    img+=np.random.normal(0,random.uniform(3,9),img.shape)
    return np.clip(img,0,255).astype(np.uint8)
kinds=['plain','rot','persp','blur','screen','small','all']
n=0
for t,q in srcs:
    for k in kinds:
        for rep in range(2):
            im=scene(q,k); g=cv2.cvtColor(im,cv2.COLOR_GRAY2RGBA)
            fn='img/%03d.rgba'%n; g.tofile(fn)
            cv_ok=False
            try:
                v,_,_=cv2.QRCodeDetector().detectAndDecode(im); cv_ok=(v==t)
            except Exception: pass
            items.append({'f':fn,'w':640,'h':480,'t':t,'k':k,'cv':cv_ok}); n+=1
            if n<=14: cv2.imwrite('img/%03d.png'%(n-1),im)
json.dump(items,open('items.json','w'),ensure_ascii=False)
print(n)

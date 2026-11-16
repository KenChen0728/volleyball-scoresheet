import numpy as np, cv2, random
random.seed(3)
for i in range(10):
    H,W=480,640; img=np.full((H,W),random.randint(120,220),np.uint8)
    for _ in range(40):
        x,y=random.randint(0,W),random.randint(0,H);cv2.rectangle(img,(x,y),(x+random.randint(5,80),y+random.randint(5,80)),random.randint(0,255),-1)
    for _ in range(30): cv2.putText(img,'ABC 123',(random.randint(0,W),random.randint(0,H)),0,random.uniform(0.4,1.5),random.randint(0,80),2)
    img=np.clip(img+np.random.normal(0,6,img.shape),0,255).astype(np.uint8)
    cv2.cvtColor(img,cv2.COLOR_GRAY2RGBA).tofile('img/noqr%d.rgba'%i)

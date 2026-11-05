# v50：公正重發後不鎖暫停和替補（使用者 11/5：規則上要打完一球，但有些裁判仍會給，鎖死記錄會沒辦法做事）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
rep("function canPause(c){return !c.live&&!c.replayLock}\nfunction canLib(c,k){return canPause(c)&&","function canPause(c){return !c.live}\nfunction canLib(c,k){return canPause(c)&&!c.replayLock&&")
rep("c.replayLock?'公正重發，得分後才能暫停和替補'","c.replayLock?'公正重發。裁判仍給暫停或替補時照常記錄'")
open(P,'w',encoding='utf8').write(s);print('ok')

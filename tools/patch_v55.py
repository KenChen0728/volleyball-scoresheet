# v55：自由格不寫「互換」，點號碼就互換；格子只留小標和號碼（使用者 11/5：寫字太擠）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
a="    else if(out)sm='互換';\n"
assert s.count(a)==1
s=s.replace(a,"")
open(P,'w',encoding='utf8').write(s);print('ok')

# v56：球場上的牌卡加深色外框和白邊，黃球衣配黃牌、紅球衣配紅牌也看得清楚（使用者 11/5）
import sys
P=sys.argv[1] if len(sys.argv)>1 else '/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
assert s.count('</style>')==1
s=s.replace('</style>',""".pc .cdm .cd{box-shadow:0 0 0 1.5px #111,0 0 0 3px #fff}
.pc .cdm .cd+.cd{margin-left:4px}
.pc .cdm{left:7px;bottom:7px}
</style>""")
open(P,'w',encoding='utf8').write(s);print('ok')

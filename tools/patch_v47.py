# v47：記事欄自動記事每一列下面一條橫線，跟手寫格線一樣（使用者 11/5）
P='/home/claude/nanshe/nanshe-scoresheet.html'
s=open(P,encoding='utf8').read()
a=".prem ul{margin:0;padding:6px 12px 6px 28px;color:var(--pi);font-size:15px;line-height:1.7;border-bottom:1px solid #000}"
assert s.count(a)==1
s=s.replace(a,".prem ul{margin:0;padding:0;list-style:none;color:var(--pi);font-size:15px;line-height:1.45;border-bottom:1px solid #000}\n.prem ul li{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px;padding:4px 10px;border-bottom:1px solid #888}\n.prem ul li:last-child{border-bottom:0}\n.prem ul li .accx{flex:none}")
open(P,'w',encoding='utf8').write(s);print('ok')

#!/usr/bin/env python3
"""11/11 測試和說明圖用的資料：三場打完（兩場在南社盃、一場未分類）、一場進行中、兩個資料夾（校際盃還沒有比賽）。
用 reg.js 存下的 one.json（打完）和 sim.json（第 1 局打完）改隊名、日期、編號。
用法：python3 tools/fixture1111.py [輸出檔]，預設 /tmp/fix1111.json（就是 localStorage 的內容）"""
import copy, json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
done = json.load(open(D + '/one.json', encoding='utf8'))['match']
live = json.load(open(D + '/sim.json', encoding='utf8'))['match']
T0 = 1762800000000  # 2025-11-10 之前，比所有事件早


def clone(m, mid, t1, t2, date, game, name, court='', cup=None):
    m = copy.deepcopy(m)
    m['id'] = mid
    for e in m['events']:
        e['matchId'] = mid
        d = e.get('data') or {}
        if e['type'] == 'MATCH_CREATED':
            d['info'].update({'name': name, 'date': date, 'game': game, 'court': court, 'division': '男子組'})
        if e['type'] == 'TEAM_NAME_SET':
            d['value'] = t1 if d['team'] == 't1' else t2
        if e['type'] == 'INFO_SET' and d.get('field') == 'name':
            d['value'] = name
    if cup:
        m['cup'] = cup
    return m


def team(i, name, nos, cap, lib):
    return {'id': 'tm%d' % i, 'division': '男子組', 'group': '國中甲組', 'at': T0,
            'team': {'name': name, 'players': [{'no': n, 'name': ''} for n in nos], 'captain': cap, 'liberos': lib,
                     'staff': {'coach': '', 'execCoach': '', 'teacher': '', 'leader': ''}, 'locked': False, 'color': None, 'liberoColor': None}}


names = ['潮州國中', '東港國中', '屏東國中', '萬丹國中', '內埔國中', '枋寮國中', '恆春國中', '來義國中', '崁頂國中', '新園國中', '林邊國中', '佳冬國中']
teams = [team(i, n, [1, 3, 5, 7, 9, 11, 12, 18], 3, [12]) for i, n in enumerate(names)]
refs = [{'court': '5', 'label': '第五場地', 'name': n, 'at': T0} for n in ['王大明', '李小華', '陳志強', '林美玲']] + \
       [{'court': '6', 'label': '第六場地', 'name': n, 'at': T0} for n in ['張家豪', '黃雅婷', '吳建宏', '劉怡君']]
cups = [{'id': 'cupnanshe', 'name': '南社盃', 'createdAt': '2026-11-01T00:00:00.000Z', 'at': T0, 'teams': teams, 'refs': refs},
        {'id': 'cupschool', 'name': '校際盃', 'createdAt': '2026-11-02T00:00:00.000Z', 'at': T0,
         'teams': [team(20 + i, n, [2, 4, 6, 8, 10, 14], 2, []) for i, n in enumerate(['光華國小', '仁愛國小', '中正國小'])], 'refs': []}]
matches = [
    clone(live, 'mlive1', '恆春國中', '來義國中', '2026-11-11', '7', '南社盃', '第五場地', 'cupnanshe'),
    clone(done, 'mdone1', '潮州國中', '東港國中', '2026-11-10', '1', '南社盃', '第五場地', 'cupnanshe'),
    clone(done, 'mdone2', '屏東國中', '萬丹國中', '2026-11-10', '2', '南社盃', '第六場地', 'cupnanshe'),
    clone(done, 'mdone3', '練習甲', '練習乙', '2026-11-09', '', '練習賽'),
]
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/fix1111.json'
json.dump({'matches': matches, 'currentId': None, 'cups': cups}, open(out, 'w', encoding='utf8'), ensure_ascii=False)
print('fixture', out, len(matches), 'matches', len(cups), 'cups')

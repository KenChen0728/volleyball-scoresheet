#!/usr/bin/env python3
"""11/13 使用說明截圖用的資料（help1113.js 的 C 段）：名字一律用範例，不放學校或真實的名字。
三場打完（兩場在範例盃、一場未分類）、一場進行中、兩個資料夾（練習盃還沒有比賽）。
用 reg.js 存下的 one.json（打完）和 sim.json（第 1 局打完）改隊名、日期、編號。
用法：python3 tools/fixture1113.py [輸出檔]，預設 /tmp/fix1113.json（就是 localStorage 的內容）"""
import copy, json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
done = json.load(open(D + '/one.json', encoding='utf8'))['match']
live = json.load(open(D + '/sim.json', encoding='utf8'))['match']
T0 = 1762800000000  # 比所有事件早


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


def team(i, name, nos, cap, lib, group='甲組'):
    return {'id': 'tm%d' % i, 'division': '男子組', 'group': group, 'at': T0,
            'team': {'name': name, 'players': [{'no': n, 'name': ''} for n in nos], 'captain': cap, 'liberos': lib,
                     'staff': {'coach': '', 'execCoach': '', 'teacher': '', 'leader': ''}, 'locked': False, 'color': None, 'liberoColor': None}}


names = ['範例藍隊', '範例橘隊', '範例綠隊', '範例紅隊', '範例白隊', '範例黑隊', '範例黃隊', '範例紫隊']
teams = [team(i, n, [1, 3, 5, 7, 9, 11, 12, 18], 3, [12]) for i, n in enumerate(names)]
refs = [{'court': '1', 'label': '第一場地', 'name': n, 'at': T0} for n in ['王大明', '李小華', '陳志強', '林美玲']] + \
       [{'court': '2', 'label': '第二場地', 'name': n, 'at': T0} for n in ['張家豪', '黃雅婷', '吳建宏', '劉怡君']]
cups = [{'id': 'cupsample', 'name': '範例盃', 'createdAt': '2026-11-01T00:00:00.000Z', 'at': T0, 'teams': teams, 'refs': refs},
        {'id': 'cuppractice', 'name': '練習盃', 'createdAt': '2026-11-02T00:00:00.000Z', 'at': T0,
         'teams': [team(20 + i, n, [2, 4, 6, 8, 10, 14], 2, [], '乙組') for i, n in enumerate(['練習甲', '練習乙', '練習丙'])], 'refs': []}]
matches = [
    clone(live, 'mlive1', '範例綠隊', '範例紅隊', '2026-11-14', '7', '範例盃', '第一場地', 'cupsample'),
    clone(done, 'mdone1', '範例藍隊', '範例橘隊', '2026-11-13', '1', '範例盃', '第一場地', 'cupsample'),
    clone(done, 'mdone2', '範例白隊', '範例黑隊', '2026-11-13', '2', '範例盃', '第二場地', 'cupsample'),
    clone(done, 'mdone3', '練習甲', '練習乙', '2026-11-12', '', '練習賽'),
]
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/fix1113.json'
json.dump({'matches': matches, 'currentId': None, 'cups': cups}, open(out, 'w', encoding='utf8'), ensure_ascii=False)
print('fixture', out, len(matches), 'matches', len(cups), 'cups')

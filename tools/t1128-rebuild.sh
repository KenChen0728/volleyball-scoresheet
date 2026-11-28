#!/bin/sh
# 11/28 重做：從 git 的測試版倒推原始檔，套 patch_v134，再產生測試版
set -e
cd "$(dirname "$0")/.."
git checkout -q 6a26c7d -- beta/index.html; git checkout -q HEAD -- beta/version.json # 從改之前的版本重做；版本號接著現在的
python3 tools/src-from-beta.py >/dev/null
python3 tools/patch_v134.py
python3 tools/patch_v135.py
python3 tools/patch_v136.py
python3 tools/patch_v137.py
python3 tools/patch_v138.py
python3 tools/patch_v139.py
python3 tools/patch_v140.py
python3 tools/patch_v141.py
python3 tools/patch_v142.py
python3 tools/beta-from-src.py

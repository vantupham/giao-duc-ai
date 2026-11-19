#!/usr/bin/env bash
# Đăng website lên nhánh gh-pages thủ công (dùng khi chưa bật GitHub Actions).
# Chạy từ thư mục dự án: bash scripts/deploy-gh-pages.sh
set -euo pipefail

REPO_URL="$(git remote get-url origin)"
REV="$(git rev-parse --short HEAD)"

npm test
npm run build
touch dist/.nojekyll

TMP="$(mktemp -d)"
cp -r dist/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -q -m "deploy: bản build $(date +%Y-%m-%d) từ ${REV}"
git push -f "$REPO_URL" gh-pages
cd - >/dev/null
rm -rf "$TMP"
echo "Đã đăng. Website cập nhật sau khoảng 1 phút: https://vantupham.github.io/giao-duc-ai/"

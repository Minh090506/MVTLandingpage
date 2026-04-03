#!/bin/bash
# Script: Tạo repo GitHub và push LandingPageMVT
# Chạy script này trong Terminal từ folder LandingPageMVT

set -e

echo "=== Bước 1: Xóa .git cũ (nếu có) và khởi tạo lại ==="
rm -rf .git
git init
git branch -m main

echo ""
echo "=== Bước 2: Cấu hình git ==="
git config user.email "nguyenducminh85bk@gmail.com"
git config user.name "Minhnd"

echo ""
echo "=== Bước 3: Add files ==="
git add -A
echo "Staged $(git status --short | wc -l | tr -d ' ') files"

echo ""
echo "=== Bước 4: Commit ==="
git commit -m "Initial commit: MyVivaTour landing pages

Landing pages, assets, Cloudflare Worker, and campaign configs for myvivatour.com

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

echo ""
echo "=== Bước 5: Tạo repo trên GitHub ==="
gh repo create LandingPageMVT --private --source=. --remote=origin

echo ""
echo "=== Bước 6: Push lên GitHub ==="
git push -u origin main

echo ""
echo "✅ Hoàn tất! Repo: https://github.com/$(gh api user --jq .login)/LandingPageMVT"

#!/bin/bash
# ============================================================
# 腾讯云 COS + CDN 部署脚本
# ============================================================
# 使用前请配置以下环境变量：
#   COS_BUCKET     COS Bucket 名称
#   COS_REGION     COS 地域（如 ap-beijing）
#   COS_SECRET_ID  SecretId
#   COS_SECRET_KEY SecretKey
# ============================================================

set -e

BUCKET=${COS_BUCKET:-""}
REGION=${COS_REGION:-""}
SECRET_ID=${COS_SECRET_ID:-""}
SECRET_KEY=${COS_SECRET_KEY:-""}

if [ -z "$BUCKET" ] || [ -z "$REGION" ] || [ -z "$SECRET_ID" ] || [ -z "$SECRET_KEY" ]; then
  echo "[错误] 请配置以下环境变量："
  echo "  COS_BUCKET, COS_REGION, COS_SECRET_ID, COS_SECRET_KEY"
  exit 1
fi

echo "[1/4] 开始构建生产包..."
npm run build:prod

echo "[2/4] 检查并安装 coscli..."
COSCLI_CMD="coscli"
if ! command -v coscli &> /dev/null; then
  if [ "$(uname -s)" = "Darwin" ]; then
    curl -sL -o /tmp/coscli "https://github.com/tencentyun/coscli/releases/download/v0.13.0-beta/coscli-mac"
    chmod +x /tmp/coscli
    COSCLI_CMD="/tmp/coscli"
  else
    curl -sL -o /tmp/coscli "https://github.com/tencentyun/coscli/releases/download/v0.13.0-beta/coscli-linux"
    chmod +x /tmp/coscli
    COSCLI_CMD="/tmp/coscli"
  fi
fi

echo "[3/4] 配置 coscli 并上传..."
$COSCLI_CMD config add -b "$BUCKET" -r "$REGION" -a default -s "$SECRET_ID" -k "$SECRET_KEY"
# 清空并上传
$COSCLI_CMD rm -r -f "cos://$BUCKET/" || true
$COSCLI_CMD cp -r "./dist/" "cos://$BUCKET/"

echo "[4/4] 设置缓存策略..."
# 通过腾讯云 CLI 或控制台设置：
# HTML/SW/manifest 不缓存
# JS/CSS/图片 1 年缓存

echo ""
echo "[完成] 腾讯云 COS 上传成功！"
echo "访问地址: https://$BUCKET.cos.$REGION.myqcloud.com/"
echo ""
echo "后续步骤："
echo "  1. 在腾讯云控制台开启 Bucket 的静态网站功能"
echo "  2. 绑定自定义域名并配置 CDN 加速"
echo "  3. 确保 HTTPS 已启用（PWA 安装必需）"
echo "  4. 在 CDN 控制台配置缓存规则："
echo "     - *.html, sw.js, *.webmanifest → 不缓存"
echo "     - *.js, *.css, *.png, *.svg   → 缓存 365 天"

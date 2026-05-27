#!/bin/bash
# ============================================================
# 阿里云 OSS + CDN 部署脚本
# ============================================================
# 使用前请配置以下环境变量：
#   OSS_BUCKET            OSS Bucket 名称
#   OSS_ENDPOINT          OSS Endpoint（如 oss-cn-beijing.aliyuncs.com）
#   OSS_ACCESS_KEY_ID     AccessKey ID
#   OSS_ACCESS_KEY_SECRET AccessKey Secret
# ============================================================

set -e

BUCKET=${OSS_BUCKET:-""}
ENDPOINT=${OSS_ENDPOINT:-""}
AK_ID=${OSS_ACCESS_KEY_ID:-""}
AK_SECRET=${OSS_ACCESS_KEY_SECRET:-""}

if [ -z "$BUCKET" ] || [ -z "$ENDPOINT" ] || [ -z "$AK_ID" ] || [ -z "$AK_SECRET" ]; then
  echo "[错误] 请配置以下环境变量："
  echo "  OSS_BUCKET, OSS_ENDPOINT, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET"
  exit 1
fi

echo "[1/5] 开始构建生产包..."
npm run build:prod

echo "[2/5] 检查并安装 ossutil..."
OSSUTIL_CMD="ossutil"
if ! command -v ossutil &> /dev/null; then
  if [ "$(uname -s)" = "Darwin" ]; then
    curl -sL -o /tmp/ossutil.zip "https://gosspublic.alicdn.com/ossutil/1.7.19/ossutilmac64.zip"
    unzip -o /tmp/ossutil.zip -d /tmp/
    chmod +x /tmp/ossutilmac64
    OSSUTIL_CMD="/tmp/ossutilmac64"
  else
    curl -sL -o /tmp/ossutil.zip "https://gosspublic.alicdn.com/ossutil/1.7.19/ossutil64.zip"
    unzip -o /tmp/ossutil.zip -d /tmp/
    chmod +x /tmp/ossutil64
    OSSUTIL_CMD="/tmp/ossutil64"
  fi
fi

echo "[3/5] 配置 ossutil..."
$OSSUTIL_CMD config -e "$ENDPOINT" -i "$AK_ID" -k "$AK_SECRET" --language CH

echo "[4/5] 同步构建产物到 OSS..."
# 先清空旧文件（可选，如需保留历史版本请注释）
$OSSUTIL_CMD rm "oss://$BUCKET/" -r -f || true
$OSSUTIL_CMD cp -r "./dist/" "oss://$BUCKET/" -f

echo "[5/5] 设置缓存策略..."
# HTML / SW / manifest 不缓存，确保 PWA 更新及时生效
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:no-cache" --include "*.html" -r
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:no-cache" --include "sw.js" -r
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:no-cache" --include "*.webmanifest" -r
# 静态资源长期缓存
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:public,max-age=31536000,immutable" --include "*.js" -r
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:public,max-age=31536000,immutable" --include "*.css" -r
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:public,max-age=31536000,immutable" --include "*.png" -r
$OSSUTIL_CMD set-meta "oss://$BUCKET/" "Cache-Control:public,max-age=31536000,immutable" --include "*.svg" -r

echo ""
echo "[完成] 阿里云 OSS 部署成功！"
echo "访问地址: https://$BUCKET.$ENDPOINT/"
echo ""
echo "后续步骤："
echo "  1. 在阿里云控制台开启 Bucket 的静态网站托管"
echo "  2. 绑定自定义域名（推荐）"
echo "  3. 配置 CDN 加速并开启 HTTPS（PWA 安装必需）"
echo "  4. 配置 CDN 回源地址为 OSS 静态网站域名"

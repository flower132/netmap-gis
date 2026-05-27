# NetMap GIS 部署指南

## 前置准备

构建项目前确保已安装依赖：

```bash
npm install
```

## 1. 阿里云 OSS + CDN（优先推荐）

### 1.1 配置环境变量

```bash
export OSS_BUCKET=your-bucket-name
export OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
export OSS_ACCESS_KEY_ID=your-access-key-id
export OSS_ACCESS_KEY_SECRET=your-access-key-secret
```

### 1.2 一键部署

```bash
npm run deploy:oss
```

### 1.3 部署后配置

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 进入 Bucket → **基础设置** → **静态页面**：
   - 默认首页：`index.html`
   - 默认 404 页：`index.html`（支持前端路由）
3. 进入 **传输管理** → **域名管理**：
   - 绑定自定义域名（如 `gis.yourdomain.com`）
   - 开启 **CDN 加速**
4. 进入 [阿里云 CDN 控制台](https://cdn.console.aliyun.com/)：
   - 确保 HTTPS 证书已配置（PWA 安装必需 HTTPS）
   - 配置缓存规则：
     - `*.html`, `sw.js`, `*.webmanifest` → **不缓存**
     - `*.js`, `*.css`, `*.png`, `*.svg` → **缓存 365 天**

## 2. 腾讯云 COS + CDN

### 2.1 配置环境变量

```bash
export COS_BUCKET=your-bucket-name
export COS_REGION=ap-beijing
export COS_SECRET_ID=your-secret-id
export COS_SECRET_KEY=your-secret-key
```

### 2.2 一键部署

```bash
npm run deploy:cos
```

### 2.3 部署后配置

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 进入 Bucket → **基础配置** → **静态网站**：
   - 索引文档：`index.html`
   - 错误文档：`index.html`
3. 绑定自定义域名并开启 CDN 加速
4. 确保 HTTPS 已启用

## 3. Nginx 静态部署（自有服务器）

### 3.1 构建

```bash
npm run build:prod
```

### 3.2 部署到服务器

```bash
# 复制构建产物到 Nginx 目录
sudo cp -r dist/* /usr/share/nginx/html/

# 覆盖 Nginx 配置
sudo cp deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 测试配置并 reload
sudo nginx -t && sudo nginx -s reload
```

### 3.3 启用 HTTPS（必需）

推荐使用 [Certbot](https://certbot.eff.org/) 自动配置 Let's Encrypt 证书：

```bash
sudo certbot --nginx -d your-domain.com
```

## PWA 安装与更新说明

### 安装到桌面/手机

- **Chrome / Edge（桌面）**：地址栏右侧点击「安装」图标
- **Chrome（Android）**：菜单 → 添加到主屏幕
- **Safari（iOS）**：分享按钮 → 添加到主屏幕
- **微信浏览器**：点击右上角菜单 → 在浏览器打开后安装（微信内置浏览器限制 PWA 功能）

### 自动更新机制

本项目使用 `vite-plugin-pwa` 的 `autoUpdate` 策略：

- 每次构建会生成新的 `sw.js` 和资产哈希
- 用户下次打开应用时，Service Worker 会在后台检测更新
- 新内容下载完成后，刷新页面即可使用最新版本

### 强制刷新缓存

如遇到更新不生效：

1. 在浏览器 DevTools → Application → Service Workers → 点击「Unregister」
2. 刷新页面重新注册 SW
3. 或清除浏览器缓存后重试

## 中国访问优化说明

- **地图瓦片**：默认使用高德地图（国内节点）和天地图，无需翻墙
- **字体资源**：已移除 Google Fonts 依赖，使用系统字体栈
- **Leaflet CSS**：改为 npm 包内联打包，不依赖 unpkg CDN
- **外部资源**：构建产物中无其他境外 CDN 依赖

## 自定义 Base Path

如需部署到子目录（如 `https://yourdomain.com/gis/`）：

```bash
VITE_BASE_PATH=/gis/ npm run build:prod
```

构建输出中的资源路径会自动适配。

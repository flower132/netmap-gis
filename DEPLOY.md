# NetMap GIS 部署指南

## GitHub + 腾讯云 EdgeOne Pages

### 第一步：推送到 GitHub

```bash
cd /Users/temp/Vibe_Project/GIS_APP

# 1. 在 GitHub 上创建新仓库（如 netmap-gis）

# 2. 关联远程仓库
git remote add origin https://github.com/<你的用户名>/netmap-gis.git

# 3. 提交所有文件
git add .
git commit -m "feat: PWA 就绪，支持 EdgeOne Pages 部署"
git push -u origin main
```

### 第二步：EdgeOne Pages 部署

1. 打开 [EdgeOne Pages 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 点击 **「导入 Git 仓库」** → 授权 GitHub → 选择 `netmap-gis`
3. 平台自动识别 Vite 项目，默认配置已 OK：

| 配置项 | 值 |
|--------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 生产分支 | `main` |
| Node 版本 | 20.x（自动） |

4. **加速区域**：选择「中国大陆」+「全球」
5. 点击 **「开始部署」**

> 项目根目录已包含 `edgeone.json`，EdgeOne Pages 会自动读取。

### 第三步：手机安装 PWA

部署完成后得到域名（如 `netmap-gis.edgeone.app`）：

**Android Chrome**
1. 打开域名 → 地址栏自动弹出「添加到主屏幕」
2. 或点右上角 ⋮ → 添加到主屏幕

**iOS Safari**
1. 打开域名 → 点底部分享按钮（↑）
2. 滑动找到「添加到主屏幕」→ 确认

安装后即可像原生 App 一样使用：全屏、离线可用、桌面图标。

### 项目配置清单

| 文件 | 作用 |
|------|------|
| `edgeone.json` | EdgeOne Pages 构建配置 |
| `vite.config.ts` | PWA 插件 + Workbox 缓存 + 代码分割 |
| `index.html` | PWA meta 标签（iOS/Android 全屏、图标） |
| `public/pwa-192x192.png` | PWA 小图标 |
| `public/pwa-512x512.png` | PWA 大图标 |
| `public/apple-touch-icon.png` | iOS 桌面图标 |
| `public/sw.js` | Service Worker（构建时自动生成） |

### 后续自动部署

每次 `git push` 到 `main` 分支，EdgeOne Pages 会自动重新构建和部署。零操作。

### 自定义域名（可选）

在 EdgeOne Pages 控制台 → 域名管理 → 绑定自己的域名。中国大陆需 ICP 备案。

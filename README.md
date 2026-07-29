# Yuque Batch Export / 语雀批量导出助手

> 一键批量导出语雀知识库全部文档，自动保留目录结构。支持 Markdown / PDF / Word / JPG 格式。

## 功能特性

- **批量导出** — 勾选知识库，一键下载全部文档
- **保留目录结构** — 自动还原语雀中的文件夹层级，下载为 `知识库/子目录/文档.md`
- **多格式支持** — Markdown（含附件）、Lake 原生格式、PDF、Word、JPG
- **导出选项** — LaTeX 公式、锚点保留、原样换行、PlantUML 卡片
- **并发控制** — 可调并发数（1–8），批次间自动停顿以稳定下载
- **实时进度** — 进度条显示当前知识库、文档名、完成数
- **零配置** — 打开语雀页面即用，自动获取登录态

## 安装

### 方式一：Edge / Chrome 扩展（推荐，含子目录支持）

1. 打开 `edge://extensions/` 或 `chrome://extensions/`
2. 开启右上角「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择本项目根目录（包含 `manifest.json` 的文件夹）
5. 打开任意语雀页面，右侧即可看到导出面板

### 方式二：篡改猴 (Tampermonkey)

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 打开 `yuque-export.user.js`，点击安装

> 篡改猴版本在页面上下文运行，`fetch()` 自动带全部 Cookie，但**不支持子目录下载**（文件全部落在浏览器下载根目录）。

## 使用

1. 打开任意 [语雀](https://www.yuque.com) 页面
2. 页面右侧出现导出面板，点击「🔀 加载知识库」
3. 勾选要导出的知识库（可多选）
4. 选择导出格式（Markdown / Lake / PDF / Word / JPG）
5. 按需调整导出选项和并发数
6. 点击「批量导出」，等待下载完成

## 架构

```
┌─ ui.js (content script) ──────────────────────────┐
│  注入在语雀页面右侧的浮动面板                          │
│  用户交互：选知识库、设格式、点导出                      │
└───────────────┬───────────────────────────────────┘
                │ chrome.runtime.sendMessage
                ▼
┌─ background.js (Service Worker) ──────────────────┐
│  协调器                                              │
│  · getAllCookies() → chrome.cookies / doc.cookie   │
│  · 调用知识库 API → 获取文档清单                      │
│  · chrome.downloads 按子目录路径保存文件               │
└───────────────┬───────────────────────────────────┘
                │ chrome.tabs.sendMessage
                ▼
┌─ content.js (content script) ─────────────────────┐
│  运行在语雀页面上下文中                                │
│  · fetch() POST /api/docs/{id}/export（含 HttpOnly）│
│  · fetch() 下载导出文件 → Blob → data URL           │
│  · 将 data URL 返回 background                     │
└───────────────────────────────────────────────────┘
```

**为什么必须 content script 调导出 API？**

语雀的导出 API 返回 403 除非请求携带 **HttpOnly Cookie**。这类 Cookie 既不能通过 `document.cookie` 读取，在 Edge 上也无法通过 `chrome.cookies` API 获取。只有页面上下文的 `fetch()` 能自动携带全部 Cookie。

## 权限说明

| 权限 | 用途 |
|---|---|
| `activeTab` | 基础权限，允许扩展在当前活跃标签页上运行 |
| `tabs` | 获取活跃标签页 ID，用于 background ↔ content 消息路由 |
| `cookies` | 尝试获取全量 Cookie（含 HttpOnly）；Chrome 可用，Edge 回退到 document.cookie |
| `downloads` | 按子目录路径静默保存文件 |
| `host: *.yuque.com` | 扩展仅对语雀域名生效，不访问其他网站 |

## 支持的格式

| 格式 | 扩展名 | 说明 |
|---|---|---|
| Markdown | `.md` | 支持 LaTeX 公式、锚点、换行、PlantUML 卡片等导出选项 |
| Lake | `.lake` | 语雀原生格式 |
| PDF | `.pdf` | 支持导出大纲 |
| Word | `.docx` | — |
| JPG | `.jpg` | — |

## 已知限制

- **Edge 兼容**：`chrome.cookies` API 在 Edge 上可能返回空结果，此时回退到 `document.cookie`。导出功能不受影响（content script 的 `fetch()` 自动携带全部 Cookie），但知识库列表查询可能缺少部分鉴权信息。
- **大文件**：单个文档超过 ~50 MB 时，data URL 序列化可能触及 Chrome 消息大小上限。建议将并发数设为 1。
- **导出速率**：建议并发数 ≤ 3，避免触发语雀服务端限流。

## 开发

纯原生 JavaScript，Manifest V3。无构建工具、无外部依赖。

```bash
# 直接加载解压缩的扩展即可开发

# 调试入口：
# · edge://extensions/ → 点击 "Service Worker" → background.js 日志
# · 语雀页面 F12 控制台 → [cs] 前缀 = content script 日志
# · 语雀页面 F12 控制台 → [bg] 前缀 = 后台日志（通过 sendProgress 广播）
```

## License

MIT

# Yuque Batch Export / 语雀批量导出助手

> 在浏览器一键批量导出自己知识库的全部文档，自动保留目录结构。支持 Markdown / PDF / Word / JPG 格式。

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
4. 选择 `edge-extension/` 文件夹（包含 `manifest.json`）
5. 打开任意语雀页面，右侧即可看到导出面板

### 方式二：篡改猴 (Tampermonkey)

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 打开 `tampermonkey/yuque-export.user.js`，点击安装

> 篡改猴版本在页面上下文运行，`fetch()` 自动带全部 Cookie，但**不支持子目录下载**（文件全部落在浏览器下载根目录）。

## 使用

1. 打开任意 [语雀](https://www.yuque.com) 页面
2. 页面右侧出现导出面板，点击「加载知识库」
3. 勾选要导出的知识库（可多选）
4. 选择导出格式（Markdown / Lake / PDF / Word / JPG）
5. 按需调整导出选项和并发数
6. 点击「批量导出」，等待下载完成

下载的文件统一保存在浏览器的默认下载目录下，结构如下：

```
下载目录/
└── yuque-export/           # 统一父目录
    ├── 知识库A/
    │   ├── 子目录/
    │   │   └── 文档.md
    │   └── 文档.md
    └── 知识库B/
        └── 文档.md
```

## 项目结构

```
yuque-export-extension/
├── edge-extension/          # Edge / Chrome 扩展
│   ├── manifest.json
│   ├── background.js       # Service Worker（协调器）
│   ├── content.js          # 页面上下文（调用导出 API）
│   ├── ui.js               # 浮动面板 UI
│   ├── popup.html          # 扩展图标弹窗
│   └── icons/              # 扩展图标
├── tampermonkey/            # 篡改猴用户脚本
│   └── yuque-export.user.js
├── README.md
└── .gitignore
```

## 架构

```
┌─ ui.js (content script) ─────────────────────────────────────────────────┐
│  注入在语雀页面右侧的浮动面板                         │
│  用户交互：选知识库、设格式、点导出                     │
└───────────────────├──────────────────────────────────────────┘
                │ chrome.runtime.sendMessage
                ▼
┌─ background.js (Service Worker) ───────────────────────────────────────┐
│  协调器                                             │
│  · getAllCookies() → chrome.cookies / doc.cookie   │
│  · 调用知识库 API → 获取文档清单                     │
│  · chrome.downloads 按子目录路径保存文件              │
└───────────────────├──────────────────────────────────────────┘
                │ chrome.tabs.sendMessage
                ▼
┌─ content.js (content script) ─────────────────────────────────────────┐
│  运行在语雀页面上下文中                               │
│  · fetch() POST /api/docs/{id}/export（含 HttpOnly）│
│  · 获取导出 URL → background 直接下载                │
│  · 不再通过 Blob/DataURL 中转，避免 .crdownload 后缀  │
└────────────────────────────────────────────────────────────┘
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
- **大文件**：单个文档超过 ~50 MB 时建议将并发数设为 1 以确保下载稳定。
- **导出速率**：建议并发数 ≤ 3，避免触发语雀服务端限流。


## 下载后清理 .crdownload 后缀

由于语雀导出的下载链接需要 HttpOnly Cookie 鉴权，而 chrome.downloads API 在 Service Worker 中无法携带这些 Cookie，部分文件下载后会保留 .crdownload 临时后缀。文件内容本身是完整的，只需去掉这个后缀即可正常使用。

项目提供了 cleanup_crdownload.py 脚本一键处理：

```bash
# 清理指定目录下所有 .crdownload 文件
python cleanup_crdownload.py D:\你的下载目录

# 不指定目录则扫描当前目录
python cleanup_crdownload.py
```

脚本会递归遍历目录，把所有 xxx.md.crdownload 重命名为 xxx.md。如果目标文件已存在会自动跳过，不会覆盖。

**为什么不在插件里直接处理？** .crdownload 是浏览器下载管理器层面的行为，浏览器扩展没有文件系统写入权限，无法重命名已下载的文件。独立 Python 脚本是处理这个问题的正确方式。

## 开发

纯原生 JavaScript，Manifest V3。无构建工具、无外部依赖。

```bash
# 加载 edge-extension/ 文件夹即可开发调试

# 调试入口：
# · edge://extensions/ → 点击 "Service Worker" → background.js 日志
# · 语雀页面 F12 控制台 → [cs] 前缀 = content script 日志
# · 语雀页面 F12 控制台 → [bg] 前缀 = 后台日志（通过 sendProgress 广播）
```

## License

MIT

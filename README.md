# 🎨 ZZZ Poster Studio

<p align="center">
  <strong>专为《绝区零》打造的潮流海报设计工坊与表情二创视觉套件</strong><br>
  <em>A stylish poster design studio and emoji sticker creator for Zenless Zone Zero.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20PWA-38bdf8?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Schema-v2.0.0-6366f1?style=flat-square" alt="Schema">
  <img src="https://img.shields.io/badge/Assets-230%2B%20HD%20Stickers-f43f5e?style=flat-square" alt="Assets">
</p>

---

## 📖 概览 (Overview)

**ZZZ Poster Studio** 是一套专为《绝区零》(Zenless Zone Zero) 创作者、二创设计同好及社区打造的纯前端海报排版与贴纸创作工坊。

项目以 **海报工坊 (Canvas Editor)** 为核心，深度整合全套官方高清表情图鉴、常用规格画布预设、图层混合模式、高斯模糊与二创滤镜，支持以标准 `.zzzposter` 工程格式实现跨端无缝继续编辑与 4K 超清渲染导出。

---

## ✨ 核心特性 (Key Features)

- 🎨 **专业级海报创作工坊 (Studio Editor)**
  - **多规格画布预设**：一键切换 16:9 横版封面、9:16 手机壁纸、1:1 正方形头像、横版 Banner 等比例。
  - **全能图层系统**：支持表情贴纸、富文本、几何装饰图层的拖拽定位、等比缩放、自由旋转与层级编排。
  - **视觉特效滤镜**：内置高斯模糊、色调调节、黑白漫画网点、半色调及故障风二创滤镜。
- 🖼️ **全套官方高清图鉴 (HD Emoji Gallery)**
  - 内置 230+ 官方高清透明底表情与贴纸，支持按角色、所属阵营、版本与特别企划实时筛选与搜索。
  - 支持一键将图鉴表情快速投送至工坊画布进行二次设计排版。
- 💾 **工程文件规范 (.zzzposter)**
  - 基于确定性渲染设计，支持以 `.zzzposter` (JSON) 格式保存与导入完整工程，工程文件自包含且跨端兼容。
- ⚡ **渐进式 Web 应用 (PWA)**
  - 支持直接离线安装至 Windows、macOS 及移动端桌面，断网环境下依然可流畅创作。

---

## 🚀 快速开始 (Quick Start)

### 步骤 1：克隆仓库 (Clone Repository)
```bash
git clone https://github.com/your-username/zzz-poster-studio.git
cd zzz-poster-studio
```

### 步骤 2：拉取高清素材包 (Fetch Asset Packs)
> 为保证仓库轻量化，高清贴纸素材不直接纳入 Git 跟踪。首次使用前请运行同步脚本拉取官方高清素材：

```bash
cd gallery/scripts
python sync_emojis.py
cd ../..
```

### 步骤 3：启动本地服务 (Launch)

#### 选项 A：使用 PowerShell 脚本一键启动（推荐）
```powershell
# 启动创作中枢门户入口 (Hub Portal)
.\start-suite.ps1

# 或直接启动海报工坊 (Poster Studio)
.\start-studio.ps1

# 或直接启动表情包图鉴 (Emoji Gallery)
.\start-gallery.ps1
```

#### 选项 B：使用原生 Python 命令
```bash
python -m http.server 8080
```
启动后在浏览器中访问：`http://localhost:8080`

---

## 📁 目录结构 (Directory Structure)

```text
zzz-poster-studio/
├── .gitignore                   # Git 忽略配置 (已配置素材与临时文件规则)
├── README.md                    # 项目全景与使用文档
├── index.html                   # 创作中枢门户导航入口 (Portal)
│
├── poster_studio/               # 【核心系统】海报创作工坊
│   ├── index.html               # 画布编辑器主界面
│   ├── sw.js                    # PWA Service Worker 离线缓存
│   ├── manifest.webmanifest     # PWA 应用配置清单
│   ├── css/
│   │   └── editor.css           # 潮流朋克风格设计系统
│   └── js/
│       ├── editor.js            # 画布渲染引擎、图层控制器与事件调度
│       ├── emoji_data.js        # 贴纸数据适配层
│       └── templates.js         # 官方精选海报预设模板
│
├── gallery/                     # 【子系统】表情包图鉴与检索中心
│   ├── index.html               # 表情包瀑布流与检索界面
│   └── scripts/
│       ├── sync_emojis.py       # 官方表情包增量抓取与同步脚本
│       └── generate_gallery.py  # 图鉴生成与分类索引构建器
│
├── assets/                      # 全局静态资源库
│   ├── emoji_index.json         # 表情元数据全量索引
│   ├── emojis_hd/               # (由脚本拉取) 230+ 官方高清 PNG 贴纸素材
│   └── icons/                   # 应用图标与 PWA 资产
│
├── docs/                        # 技术规范文档
│   └── project_format_spec.md   # .zzzposter 工程文件格式规范 (v2.0)
│
├── start-suite.ps1              # 门户一键启动脚本 (PowerShell)
├── start-studio.ps1             # 海报工坊一键启动脚本 (PowerShell)
└── start-gallery.ps1            # 表情图鉴一键启动脚本 (PowerShell)
```

---

## 📐 工程文件格式规范 (Project Format Spec)

本项目使用统一的 `.zzzposter` 工程标准：
* 完整规范定义请参考：[docs/project_format_spec.md](docs/project_format_spec.md)
* 规范涵盖画布属性、背景渐变与特效参数、图层变换矩阵（X/Y/Scale/Rotate）及资源路径引用。

---

## 📌 免责与版权声明 (Disclaimer)

1. 本项目中包含的《绝区零》(Zenless Zone Zero) 相关角色美术、官方表情、图标等知识产权均归属于 **上海米哈游网络科技股份有限公司 (miHoYo)**。
2. 本项目为非商业性同人创作工具，仅供绝区零玩家交流与个人二创学习使用。

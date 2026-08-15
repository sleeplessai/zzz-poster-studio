# 🎨 ZZZ Poster Studio

<p align="center">
  <strong>基于《绝区零》官方贴画素材与美术风格的海报、黑板报、拼贴剪报轻量创作工具</strong><br>
  <em>A lightweight poster, scrapbook, and sticker collage creator inspired by Zenless Zone Zero.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.0.0-6366f1?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/License-Apache%202.0-10b981?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Stickers-Official%20HD%20Emojis-f43f5e?style=flat-square" alt="Stickers">
  <img src="https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20Canvas-38bdf8?style=flat-square" alt="Tech">
</p>

---

## 📖 项目简介

**ZZZ Poster Studio** 是一款面向《绝区零》(Zenless Zone Zero) 玩家与设计爱好者的轻量级排版与拼贴创作小工具。

应用内置了官方全套高清透明底贴画素材，并参考《绝区零》独特的美漫波普、街头机能与复古胶片美术风格，让你可以自由拼贴、设计并导出属于自己的游戏海报、黑板报简报、手帐贴画与视觉卡片。

---

## ✨ 主要功能

- 🖼️ **官方高清贴画图鉴**
  - 收录自公测以来的全版本角色表情、萌系邦布以及茶百道、雷蛇 Razer 等联动特辑贴图。
  - 支持按角色与企划分类快速检索，点击或拖拽即可直接置入画布。

- 🎨 **绝区零风格化背景与装饰**
  - **漫画半色调与波普网点**：复古美漫微网点、空洞暗影放射半色调、渐变阴影点阵与狡兔屋炭黑街头网屏。
  - **复古画框与分镜**：35mm 电影胶卷、竖轨录像带胶片、四格漫画分镜与复古拍立得相框。
  - **特色纹理叠加**：美漫速度线、街头警戒斜纹、赛博方格网与电视扫描线。

- 📝 **文字与潮流排版**
  - 预设波普网点大标题、赛博霓虹发光字、胶囊标签徽章与台词金句样式。
  - 支持多行文本、自定义描边、网点投影、高斯发光与对齐调节。

- 📐 **常用画幅一键切换**
  - 内置 16:9 横版海报、9:16 手机壁纸、4:3 经典比例、1:1 正方贴画与 3:4 竖版封面。
  - 支持辅助像素标尺、三分法/黄金分割构图网格与安全线参考。

- 💾 **轻量保存与导出**
  - 支持一键导出高清 PNG 图片与透明底成品。
  - 支持以 `.zzzposter` 工程文件保存/载入完整草稿，纯前端本地运行，支持 PWA 安装离线使用。

---

## 🚀 快速启动

### 🌟 推荐：使用 Python 脚本一键启动（全平台通用 · 自动打开浏览器）

本项目内置了轻量级 Python 启动脚本（无任何第三方依赖，仅使用 Python 原生标准库），支持自动查找可用端口并自动拉起默认浏览器：

```bash
# 启动创作中枢门户 (Creative Hub)
python start.py

# 或直接直达海报拼贴工坊 (Poster Studio)
python start.py --studio

# 或直接直达官方贴画图鉴 (Emoji Gallery)
python start.py --gallery

# 自定义端口（若默认 8080 被占用会自动切换）
python start.py --port 3000
```

---

### 💻 方式二：使用 Python 原生内置模块启动

如果您习惯直接使用 Python 内置的 `http.server` 模块：

```bash
python -m http.server 8080
```
启动后在浏览器中访问：
- 导航门户：`http://localhost:8080/index.html`
- 海报工坊：`http://localhost:8080/poster_studio/index.html`
- 表情图鉴：`http://localhost:8080/gallery/index.html`

---

### ⚠️ 方式三：无需服务器 · 本地直接打开（不推荐）

虽然支持直接双击网页文件打开，但受现代浏览器 `file://` 协议的安全限制，**不推荐**此方式：
- ⚠️ **功能受限提示**：直接双击打开时，受浏览器同源与 Canvas 安全策略限制，**部分工程保存、高清图片导出与离线缓存功能可能会出现异常或受阻**。
- 建议优先使用 **方式一 (`python start.py`)** 启动本地轻量服务以获得完整、稳定的创作与导出体验。

---

## 📁 项目结构

```text
zzz-poster-studio/
├── start.py                     # Python 本地轻量服务器与一键启动脚本
├── index.html                   # 创作中枢导航门户
├── poster_studio/               # 【核心系统】海报与拼贴工坊
│   ├── index.html               # 编辑器主界面
│   ├── css/editor.css           # 街头美漫设计系统
│   ├── js/
│   │   ├── editor.js            # 画布渲染引擎与图层交互
│   │   ├── emoji_data.js        # 贴纸素材数据索引
│   │   └── templates.js         # 精选海报模板预设
│   └── sw.js                    # PWA 离线缓存支持
│
├── gallery/                     # 【子系统】官方表情贴画图鉴
│   ├── index.html               # 全量官方表情贴画分类瀑布流
│   └── scripts/                 # 素材同步与图鉴生成脚本
│
└── assets/                      # 静态资源池与官方高清透明底贴图
```

---

## 📌 版权与免责声明

1. 本项目包含的《绝区零》(Zenless Zone Zero) 相关角色美术、官方表情、图标等知识产权均归属于 **上海米哈游网络科技股份有限公司 (miHoYo)**。
2. 本项目为非商业性衍生创作工具，仅供绝区零玩家交流与个人二创学习使用。


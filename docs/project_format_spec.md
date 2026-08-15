# ZZZ Poster Studio 工程文件格式规范 (Project Specification v2.0)

本文档定义了 **ZZZ Poster Studio** 用于保存、载入与跨设备共享海报/封面编辑状态的工程文件标准格式（`.zzzposter` / `.json`）。

---

## 1. 规范概述 (Overview)

- **文件扩展名**：`.zzzposter`（标准工程格式） / `.json`（通用备份格式）
- **MIME 类型**：`application/vnd.zzz.poster+json` 或 `application/json`
- **字符编码**：UTF-8
- **设计目标**：
  1. **完全无损与确定性渲染**：精确记录画布尺寸、背景多层特效（高斯模糊、线性/径向渐变、图片铺满方式）、图层几何变换（X/Y/旋转/缩放/翻转）。
  2. **跨平台与自包含性**：内置缩略图 DataURL，支持相对路径表情索引与嵌入式 Base64 资源，方便文件在移动端/桌面端无缝共享。
  3. **版本向后兼容**：通过 `version` 与 `schema` 实现平滑迭代与自动数据迁移。

---

## 2. 完整 JSON 结构示例 (Schema Example)

```json
{
  "$schema": "https://zzz-poster-studio.app/schemas/project-v2.json",
  "version": "2.0.0",
  "app": "ZZZ Poster Studio",
  "generator": "ZZZ Poster Studio Web/PWA",
  "id": "proj_1723700000000_abc12",
  "metadata": {
    "title": "新艾利都冒险指南海报",
    "author": "Mika",
    "description": "16:9 标准横版高清海报设计工程",
    "createdAt": "2026-08-15T05:25:00.000Z",
    "updatedAt": "2026-08-15T05:25:00.000Z",
    "tags": ["绝区零", "安比", "封面", "攻略"]
  },
  "canvas": {
    "width": 1920,
    "height": 1080,
    "unit": "px",
    "presetName": "16:9 标准横版",
    "colorSpace": "srgb",
    "dpi": 72
  },
  "background": {
    "type": "gradient",
    "color": "#0f172a",
    "gradient": {
      "type": "linear",
      "angle": 135,
      "color1": "#0f172a",
      "color2": "#1e293b",
      "stops": [
        { "offset": 0, "color": "#0f172a" },
        { "offset": 1, "color": "#1e293b" }
      ]
    },
    "image": {
      "src": "emojis_hd/Zenless Zone Zero Version 1.5 Character Avatars Announcements.png",
      "fit": "cover",
      "embeddedDataUri": null
    },
    "effects": {
      "blur": 0,
      "overlayColor": "#000000",
      "overlayOpacity": 0.2
    }
  },
  "layers": [
    {
      "id": "layer_sticker_1",
      "name": "安比 疑惑",
      "type": "sticker",
      "visible": true,
      "locked": false,
      "transform": {
        "x": 1420,
        "y": 540,
        "width": 520,
        "height": 520,
        "rotation": 6,
        "scaleX": 1,
        "scaleY": 1
      },
      "appearance": {
        "opacity": 1,
        "blendMode": "normal"
      },
      "resource": {
        "src": "emojis_hd/Sticker Set 1 Anby doubt.png",
        "isOfficialEmoji": true,
        "emojiId": "emoji_1",
        "embeddedDataUri": null
      }
    },
    {
      "id": "layer_text_1",
      "name": "主标题",
      "type": "text",
      "visible": true,
      "locked": false,
      "transform": {
        "x": 580,
        "y": 440,
        "width": 800,
        "height": 140,
        "rotation": -2,
        "scaleX": 1,
        "scaleY": 1
      },
      "appearance": {
        "opacity": 1,
        "blendMode": "normal"
      },
      "textProps": {
        "content": "新艾利都冒险指南",
        "fontFamily": "'Noto Sans SC', sans-serif",
        "fontSize": 92,
        "fontWeight": "900",
        "fontStyle": "normal",
        "align": "left",
        "lineHeight": 1.3,
        "letterSpacing": 0,
        "fillColor": "#ffffff",
        "stroke": {
          "color": "#0f172a",
          "width": 8
        },
        "shadow": {
          "color": "rgba(56, 189, 248, 0.6)",
          "blur": 24,
          "offsetX": 0,
          "offsetY": 4
        },
        "badge": {
          "fill": "transparent",
          "radius": 0
        }
      }
    },
    {
      "id": "layer_shape_1",
      "name": "圆角底卡",
      "type": "shape",
      "visible": true,
      "locked": false,
      "transform": {
        "x": 960,
        "y": 540,
        "width": 1800,
        "height": 960,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1
      },
      "appearance": {
        "opacity": 0.8,
        "blendMode": "normal"
      },
      "shapeProps": {
        "shapeType": "roundedRect",
        "fillColor": "#1e293b",
        "stroke": {
          "color": "#38bdf8",
          "width": 4
        },
        "borderRadius": 32
      }
    }
  ],
  "previewThumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## 3. 字段说明 (Data Dictionary)

| 节点 / 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `version` | `string` | 工程版本号，当前为 `"2.0.0"` |
| `metadata.title` | `string` | 作品工程标题 |
| `canvas.width` / `height` | `number` | 画布物理像素尺寸 (如 1920 × 1080) |
| `background.type` | `string` | 背景模式：`'color'` (纯色), `'gradient'` (渐变), `'image'` (图片) |
| `background.gradient` | `object` | 渐变参数：`type` ('linear'/'radial'), `angle` (角度 0-360), `color1`, `color2` |
| `background.effects.blur` | `number` | 高斯模糊强度 (0 ~ 50px) |
| `layers[].type` | `string` | 图层类型：`'sticker'` (贴纸), `'text'` (文字), `'shape'` (形状), `'image'` (自上传图片) |
| `layers[].transform` | `object` | 几何参数：`x`, `y` (中心坐标), `width`, `height`, `rotation` (0~360°), `scaleX`, `scaleY` (镜像) |
| `layers[].textProps` | `object` | 文字排版参数（字号、粗细、字体、描边颜色/粗细、阴影、胶囊背景填充） |
| `previewThumbnail` | `string` | 导出时自动生成的低开销 Base64 PNG 缩略图，供文件管理器和云端预览 |

import os
import sys
import re
import html

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

def categorize_filename(filename):
    """对文件名进行细化精准分类（按版本号 / 联动项目 / 企划 / 丽都漫步）"""
    f_lower = filename.lower()
    
    # 1. 跨界联动项目 (Collaborations)
    if 'chapanda' in f_lower:
        return "茶百道 联动项目 (ChaPanda)"
    elif 'razer' in f_lower:
        return "雷蛇 Razer 联动项目 (Miyabi x Razer)"
        
    # 2. 官方特别企划 / 派生系列 (Special Projects)
    elif 'angels of delusion' in f_lower:
        return "妄想天使 训练企划 (Angels of Delusion)"
    elif 'sugar rush' in f_lower:
        return "甜蜜冲刺 特别企划 (Sugar Rush)"
        
    # 3. 邦布系列 (Bangboo Special)
    elif 'en-nah stroll' in f_lower:
        return "邦布在途 特辑 (En-Nah Stroll)"
        
    # 4. 丽都漫步系列 (Ridu Stroll Series 1~5)
    elif 'ridu stroll sticker pack 1' in f_lower:
        return "丽都漫步 第一弹 (Ridu Stroll Pack 1)"
    elif 'ridu stroll sticker pack 2' in f_lower:
        return "丽都漫步 第二弹 (Ridu Stroll Pack 2)"
    elif 'ridu stroll sticker pack 3' in f_lower:
        return "丽都漫步 第三弹 (Ridu Stroll Pack 3)"
    elif 'ridu stroll sticker pack 4' in f_lower:
        return "丽都漫步 第四弹 (Ridu Stroll Pack 4)"
    elif 'ridu stroll sticker pack 5' in f_lower:
        return "丽都漫步 第五弹 (Ridu Stroll Pack 5)"
        
    # 5. 早期官方表情包 (Official Sticker Sets)
    elif 'sticker set 1' in f_lower:
        return "官方表情包 第一弹 (Sticker Set 1)"
    elif 'sticker set 2' in f_lower:
        return "官方表情包 第二弹 (Sticker Set 2)"
    
    # 6. 各版本角色表情 (Version Character Avatars)
    ver_match = re.search(r'version\s*(\d+\.\d+)', f_lower)
    if ver_match:
        ver = ver_match.group(1)
        return f"Version {ver} 版本角色表情"
    
    return "官方其他特别表情企划"

def sort_category_key(cat_name):
    """确保分类按清晰、专业的次序排列"""
    if "官方表情包 第一弹" in cat_name: return "01_1"
    if "官方表情包 第二弹" in cat_name: return "01_2"
    if "丽都漫步 第一弹" in cat_name: return "02_1"
    if "丽都漫步 第二弹" in cat_name: return "02_2"
    if "丽都漫步 第三弹" in cat_name: return "02_3"
    if "丽都漫步 第四弹" in cat_name: return "02_4"
    if "丽都漫步 第五弹" in cat_name: return "02_5"
    if "邦布在途" in cat_name: return "03"
    if "Version" in cat_name:
        ver = re.search(r'Version\s*(\d+\.\d+)', cat_name)
        if ver:
            parts = [int(p) for p in ver.group(1).split('.')]
            return f"04_{parts[0]:02d}_{parts[1]:02d}"
    if "妄想天使" in cat_name: return "05_1"
    if "甜蜜冲刺" in cat_name: return "05_2"
    if "茶百道" in cat_name: return "06_1"
    if "雷蛇" in cat_name: return "06_2"
    return "99_" + cat_name

def build_gallery():
    script_dir = os.path.dirname(__file__)
    gallery_dir = os.path.abspath(os.path.join(script_dir, ".."))
    root_dir = os.path.abspath(os.path.join(gallery_dir, ".."))
    emojis_dir = os.path.join(root_dir, "assets", "emojis_hd")
    gallery_html_path = os.path.join(gallery_dir, "index.html")

    if not os.path.exists(emojis_dir):
        print(f"[错误] 找不到表情包目录: {emojis_dir}")
        return

    files = [f for f in os.listdir(emojis_dir) if f.lower().endswith(('.png', '.gif', '.jpg', '.jpeg'))]
    files.sort()

    print(f"--> [离线生成] 读取本地 {len(files)} 张表情包构建深度细化分类画廊...")

    # 分类聚类
    cat_groups = {}
    for f in files:
        cat_name = categorize_filename(f)
        cat_groups.setdefault(cat_name, []).append(f)

    # 排序各分类内的图片：包含 announcement 的文件永远排在第一位！
    for cat_name in cat_groups:
        cat_groups[cat_name] = sorted(
            cat_groups[cat_name],
            key=lambda x: (0 if 'announc' in x.lower() else 1, x.lower())
        )

    sections_html = ""
    category_nav_html = ""
    global_card_index = 0

    sorted_cat_keys = sorted(cat_groups.keys(), key=sort_category_key)

    for cat_idx, cat_name in enumerate(sorted_cat_keys, 1):
        group_files = cat_groups[cat_name]
        sec_id = f"category-{cat_idx}"
        
        category_nav_html += f'<button class="nav-chip" onclick="scrollToSection(\'{sec_id}\')">{html.escape(cat_name)} ({len(group_files)})</button>'
        
        cards_in_sec = ""
        for filename in group_files:
            clean_title = os.path.splitext(filename)[0]
            rel_path = f"../assets/emojis_hd/{html.escape(filename)}"
            is_announcement = 'announc' in filename.lower()
            badge_html = '<span class="announcement-badge">官方发布封面</span>' if is_announcement else ''
            
            cards_in_sec += f"""
            <div class="emoji-card {'announcement-card' if is_announcement else ''}" data-title="{html.escape(clean_title.lower())}" onclick="openLightbox('{global_card_index}')">
                {badge_html}
                <div class="img-wrapper">
                    <img src="{rel_path}" alt="{html.escape(clean_title)}" loading="lazy">
                </div>
                <div class="card-footer">
                    <span class="emoji-name" title="{html.escape(clean_title)}">{html.escape(clean_title)}</span>
                    <button class="btn-preview" onclick="event.stopPropagation(); openLightbox('{global_card_index}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px; vertical-align: -2px;">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>浏览大图
                    </button>
                </div>
            </div>
            """
            global_card_index += 1

        sections_html += f"""
        <section class="category-section" id="{sec_id}">
            <div class="category-header">
                <h2 class="category-title">{html.escape(cat_name)}</h2>
                <span class="category-count">共 {len(group_files)} 张贴图</span>
            </div>
            <div class="gallery-grid">
                {cards_in_sec}
            </div>
        </section>
        """

    full_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>《绝区零》官方表情图鉴</title>
    <style>
        :root {{
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            --glass-bg: rgba(30, 41, 59, 0.7);
            --glass-border: rgba(255, 255, 255, 0.12);
            --accent-color: #38bdf8;
            --accent-hover: #0284c7;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: var(--bg-gradient);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 2rem 1rem;
        }}
        .container {{ max-width: 1440px; margin: 0 auto; }}
        header {{
            text-align: center;
            margin-bottom: 1.5rem;
            backdrop-filter: blur(16px);
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            padding: 2rem;
            border-radius: 20px;
        }}
        h1 {{ font-size: 2.2rem; color: #fff; margin-bottom: 0.5rem; letter-spacing: -0.5px; }}
        p.subtitle {{ color: var(--text-secondary); font-size: 1rem; margin-bottom: 1.5rem; }}
        
        .search-box {{
            position: relative;
            max-width: 600px;
            margin: 0 auto 1.5rem auto;
            display: flex;
            align-items: center;
        }}
        .search-icon {{
            position: absolute;
            left: 1.2rem;
            color: var(--text-secondary);
            pointer-events: none;
            display: flex;
            align-items: center;
        }}
        .search-input {{
            width: 100%;
            padding: 0.85rem 1.3rem 0.85rem 3rem;
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            background: rgba(15, 23, 42, 0.6);
            color: #fff;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
        }}
        .search-input:focus {{ border-color: var(--accent-color); box-shadow: 0 0 16px rgba(56, 189, 248, 0.3); }}
        
        /* 导航标签 */
        .nav-chips-wrapper {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            justify-content: center;
            margin-top: 1rem;
            padding: 0.5rem;
        }}
        .nav-chip {{
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            padding: 0.4rem 0.9rem;
            border-radius: 20px;
            font-size: 0.82rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }}
        .nav-chip:hover {{
            background: var(--accent-color);
            color: #0f172a;
            font-weight: 600;
            border-color: var(--accent-color);
        }}
        
        /* 分类区块 */
        .category-section {{
            margin-bottom: 3rem;
            background: rgba(15, 23, 42, 0.3);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 1.5rem;
        }}
        .category-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.2rem;
            padding-bottom: 0.8rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }}
        .category-title {{
            font-size: 1.35rem;
            color: var(--accent-color);
            font-weight: 600;
        }}
        .category-count {{
            font-size: 0.85rem;
            color: var(--text-secondary);
            background: rgba(255, 255, 255, 0.08);
            padding: 0.3rem 0.8rem;
            border-radius: 12px;
        }}
        
        .gallery-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
            gap: 1.2rem;
        }}
        .emoji-card {{
            position: relative;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            backdrop-filter: blur(12px);
        }}
        .emoji-card.announcement-card {{
            border-color: rgba(56, 189, 248, 0.5);
            background: rgba(14, 116, 144, 0.2);
        }}
        .announcement-badge {{
            position: absolute;
            top: 8px;
            left: 8px;
            background: var(--accent-color);
            color: #0f172a;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 6px;
            letter-spacing: 0.3px;
        }}
        .emoji-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45);
            border-color: rgba(56, 189, 248, 0.4);
        }}
        .img-wrapper {{
            width: 120px;
            height: 120px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 0.8rem;
        }}
        .img-wrapper img {{
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }}
        .card-footer {{
            width: 100%;
            text-align: center;
        }}
        .emoji-name {{
            display: block;
            font-size: 0.8rem;
            color: var(--text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-bottom: 0.5rem;
        }}
        .btn-preview {{
            background: rgba(56, 189, 248, 0.15);
            color: var(--accent-color);
            border: 1px solid rgba(56, 189, 248, 0.3);
            padding: 0.4rem 0.8rem;
            font-size: 0.78rem;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }}
        .btn-preview:hover {{
            background: var(--accent-color);
            color: #0f172a;
            font-weight: 600;
        }}
        
        /* 回到顶部按钮 (Back-to-Top Button) */
        .back-to-top {{
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 48px;
            height: 48px;
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid var(--glass-border);
            color: var(--accent-color);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transform: translateY(12px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }}
        .back-to-top.show {{
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }}
        .back-to-top:hover {{
            background: var(--accent-color);
            color: #0f172a;
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(56, 189, 248, 0.45);
        }}
        
        /* 大图浏览 Lightbox Modal */
        .lightbox-modal {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(11, 17, 32, 0.94);
            backdrop-filter: blur(20px);
            z-index: 9999;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }}
        .lightbox-modal.active {{ display: flex; }}
        .lightbox-content {{
            position: relative;
            max-width: 90vw;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }}
        .lightbox-img {{
            max-width: 85vw;
            max-height: 65vh;
            object-fit: contain;
            filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
        }}
        .lightbox-title {{
            margin-top: 1.2rem;
            font-size: 1.1rem;
            color: var(--text-primary);
            text-align: center;
            background: rgba(30, 41, 59, 0.85);
            padding: 0.5rem 1.5rem;
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            max-width: 80vw;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }}
        .lightbox-close {{
            position: absolute;
            top: 2rem;
            right: 2rem;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid var(--glass-border);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }}
        .lightbox-close:hover {{
            background: #ef4444;
            border-color: #ef4444;
            transform: rotate(90deg);
        }}
        .lightbox-nav {{
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid var(--glass-border);
            width: 52px;
            height: 52px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }}
        .lightbox-nav:hover {{
            background: var(--accent-color);
            color: #0f172a;
            border-color: var(--accent-color);
            transform: translateY(-50%) scale(1.08);
        }}
        .lightbox-prev {{ left: 2rem; }}
        .lightbox-next {{ right: 2rem; }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>《绝区零》官方表情图鉴</h1>
            <p class="subtitle">收录官方高清透明底贴画素材</p>
            <div style="margin-bottom: 1.5rem; display: flex; justify-content: center; gap: 12px;">
                <a href="../poster_studio/index.html" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%); color: #fff; text-decoration: none; padding: 0.75rem 1.6rem; border-radius: 9999px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); transition: transform 0.2s, box-shadow 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                    打开ZZZ Poster Studio应用
                </a>
            </div>
            <div class="search-box">
                <div class="search-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <input type="text" class="search-input" id="searchInput" placeholder="搜索表情包名称或分类 (如: Anby, Billy, ChaPanda, Razer, 妄想天使, Version 2.0...)" oninput="filterEmojis()">
            </div>
            <div class="nav-chips-wrapper">
                {category_nav_html}
            </div>
        </header>

        <div id="sectionsWrapper">
            {sections_html}
        </div>
    </div>
    
    <!-- 回到顶部悬浮按钮 -->
    <button class="back-to-top" id="backToTopBtn" onclick="scrollToTop()" title="回到顶部">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
    </button>

    <!-- 大图浏览 Lightbox Modal -->
    <div class="lightbox-modal" id="lightboxModal" onclick="closeLightbox()">
        <button class="lightbox-close" onclick="closeLightbox()" title="关闭 (Esc)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <button class="lightbox-nav lightbox-prev" onclick="event.stopPropagation(); navigateLightbox(-1)" title="上一张 (←)">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>
        <button class="lightbox-nav lightbox-next" onclick="event.stopPropagation(); navigateLightbox(1)" title="下一张 (→)">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
        <div class="lightbox-content" onclick="event.stopPropagation()">
            <img class="lightbox-img" id="lightboxImg" src="" alt="大图预览">
            <div class="lightbox-title" id="lightboxTitle"></div>
        </div>
    </div>

    <script>
        const allEmojiCards = Array.from(document.querySelectorAll('.emoji-card'));
        let currentCardIndex = 0;

        function scrollToSection(secId) {{
            const el = document.getElementById(secId);
            if (el) {{
                el.scrollIntoView({{ behavior: 'smooth' }});
            }}
        }}

        function scrollToTop() {{
            window.scrollTo({{ top: 0, behavior: 'smooth' }});
        }}

        window.addEventListener('scroll', () => {{
            const backToTopBtn = document.getElementById('backToTopBtn');
            if (window.scrollY > 300) {{
                backToTopBtn.classList.add('show');
            }} else {{
                backToTopBtn.classList.remove('show');
            }}
        }});

        function filterEmojis() {{
            const query = document.getElementById('searchInput').value.toLowerCase().trim();
            const sections = document.querySelectorAll('.category-section');
            
            sections.forEach(section => {{
                let hasVisible = false;
                const cards = section.querySelectorAll('.emoji-card');
                cards.forEach(card => {{
                    const title = card.getAttribute('data-title');
                    if (!query || title.includes(query)) {{
                        card.style.display = 'flex';
                        hasVisible = true;
                    }} else {{
                        card.style.display = 'none';
                    }}
                }});
                section.style.display = hasVisible ? 'block' : 'none';
            }});
        }}

        function openLightbox(index) {{
            currentCardIndex = parseInt(index);
            updateLightboxContent();
            document.getElementById('lightboxModal').classList.add('active');
        }}

        function closeLightbox() {{
            document.getElementById('lightboxModal').classList.remove('active');
        }}

        function navigateLightbox(direction) {{
            currentCardIndex += direction;
            if (currentCardIndex < 0) currentCardIndex = allEmojiCards.length - 1;
            if (currentCardIndex >= allEmojiCards.length) currentCardIndex = 0;
            updateLightboxContent();
        }}

        function updateLightboxContent() {{
            const card = allEmojiCards[currentCardIndex];
            if (!card) return;
            const img = card.querySelector('img');
            
            document.getElementById('lightboxImg').src = img.src;
            document.getElementById('lightboxTitle').textContent = card.querySelector('.emoji-name').title;
        }}

        document.addEventListener('keydown', (e) => {{
            const modal = document.getElementById('lightboxModal');
            if (modal.classList.contains('active')) {{
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') navigateLightbox(-1);
                if (e.key === 'ArrowRight') navigateLightbox(1);
            }}
        }});
    </script>
</body>
</html>
"""
    with open(gallery_html_path, "w", encoding="utf-8") as f:
        f.write(full_html)
    
    print(f"--> [离线生成成功] HTML 画廊已快速构建: {gallery_html_path}")

if __name__ == '__main__':
    build_gallery()

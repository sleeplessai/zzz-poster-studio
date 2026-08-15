import os
import sys
import json
import subprocess
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from generate_gallery import build_gallery

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

class ZZZEmojiIncrementalSyncer:
    def __init__(self):
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.gallery_dir = os.path.abspath(os.path.join(self.script_dir, ".."))
        self.root_dir = os.path.abspath(os.path.join(self.gallery_dir, ".."))
        self.assets_dir = os.path.join(self.root_dir, "assets")
        self.emojis_dir = os.path.join(self.assets_dir, "emojis_hd")
        self.index_json_path = os.path.join(self.assets_dir, "emoji_index.json")
        self.gallery_html_path = os.path.join(self.gallery_dir, "index.html")
        self.api_url = "https://zenless-zone-zero.fandom.com/api.php?action=parse&page=Stickers&format=json&prop=images"
        
        # 温和爬取配置：控制并发与请求间隔，避免触发服务器频控/风控
        self.max_workers = 3          # 限制并发线程为 3 个，平缓拉取
        self.request_delay = 0.25     # 每个请求微延时 250ms，温和友好
        os.makedirs(self.emojis_dir, exist_ok=True)

    def _http_get_json(self, url):
        """使用原生 curl 检索 JSON，支持重试与温和退避"""
        for attempt in range(3):
            try:
                res = subprocess.run(
                    ['curl.exe', '-s', '-L', '--retry', '2', '--retry-delay', '2', '--compressed',
                     '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                     url],
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    timeout=20
                )
                if res.returncode == 0 and res.stdout.strip():
                    return json.loads(res.stdout)
            except Exception:
                time.sleep(1.5 * (attempt + 1))
        return None

    def fetch_online_image_names(self):
        """第 1 步：仅发送 1 次极轻量 API 请求获取线上全部图片文件名清单 (~5KB 载荷)"""
        data = self._http_get_json(self.api_url)
        if data:
            return data.get('parse', {}).get('images', [])
        return []

    def fetch_imageinfo_for_files(self, missing_filenames):
        """第 2 步：仅对真正缺失/新增的文件名按需查询下载直链与尺寸 (50个/批)"""
        import urllib.parse
        items = []
        for i in range(0, len(missing_filenames), 50):
            batch = missing_filenames[i : i + 50]
            titles_param = "|".join([f"File:{fn}" for fn in batch])
            info_api = f"https://zenless-zone-zero.fandom.com/api.php?action=query&titles={urllib.parse.quote(titles_param)}&prop=imageinfo&iiprop=url|size&format=json"
            
            info_data = self._http_get_json(info_api)
            if not info_data:
                continue
                
            pages = info_data.get('query', {}).get('pages', {})
            for page_id, p_info in pages.items():
                title = p_info.get('title', '')
                imageinfo = p_info.get('imageinfo', [])
                if imageinfo:
                    img_url = imageinfo[0].get('url')
                    width = imageinfo[0].get('width')
                    height = imageinfo[0].get('height')
                    
                    raw_hd_url = re.sub(r'/revision/latest/scale-to-width-down/\d+.*', '/revision/latest', img_url)
                    raw_hd_url = re.sub(r'/revision/latest/cb/\d+.*', '/revision/latest', raw_hd_url)
                    
                    clean_title = title.replace("File:", "").replace("_", " ").strip()
                    safe_filename = re.sub(r'[\/:*?"<>|]', '_', clean_title)
                    if not safe_filename.lower().endswith(('.png', '.gif', '.jpg', '.jpeg')):
                        safe_filename += '.png'

                    items.append({
                        'title': clean_title,
                        'filename': safe_filename,
                        'url': raw_hd_url,
                        'width': width,
                        'height': height
                    })
            time.sleep(self.request_delay)
        return items

    def _download_single(self, item):
        """单个文件温和下载（带微延时与指数退避）"""
        save_path = os.path.join(self.emojis_dir, item['filename'])
        time.sleep(self.request_delay)
        
        for attempt in range(3):
            try:
                res = subprocess.run(
                    ['curl.exe', '-s', '-L', '--retry', '2', '--retry-delay', '1',
                     '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                     '-o', save_path, item['url']],
                    timeout=25
                )
                if res.returncode == 0 and os.path.exists(save_path) and os.path.getsize(save_path) > 0:
                    return True, item['filename']
            except Exception:
                time.sleep(1 * (attempt + 1))
        return False, item['filename']

    def sync(self):
        start_time = time.time()
        print("==================================================================", flush=True)
        print("    绝区零 (ZZZ) 官方表情包 温和友好型增量检查与同步工具    ", flush=True)
        print("==================================================================\n", flush=True)

        # 1. 极速获取线上清单 (单次轻量请求)
        print("--> [1/3] 正在发送单次轻量请求检索线上清单 (Payload ~5KB)...", flush=True)
        online_image_names = self.fetch_online_image_names()
        if not online_image_names:
            print("[错误] 未能获取线上清单，同步退出。", flush=True)
            return

        print(f"    - 线上最新表情总数: {len(online_image_names)} 张", flush=True)

        # 2. 本地快速比对文件名 (规范化空格与下划线)
        local_files = os.listdir(self.emojis_dir)
        local_set_lower = {f.lower(): f for f in local_files if os.path.getsize(os.path.join(self.emojis_dir, f)) > 0}
        print(f"    - 本地已有有效表情: {len(local_set_lower)} 张", flush=True)

        missing_online_names = []
        for name in online_image_names:
            clean_name = name.replace("File:", "").replace("_", " ").strip()
            safe_name = re.sub(r'[\/:*?"<>|]', '_', clean_name)
            if not safe_name.lower().endswith(('.png', '.gif', '.jpg', '.jpeg')):
                safe_name += '.png'
            
            if safe_name.lower() not in local_set_lower:
                missing_online_names.append(name)

        check_time = time.time() - start_time
        print(f"--> [2/3] 本地与线上比对完成 (耗时 {check_time:.2f} 秒): 发现需下载表情 {len(missing_online_names)} 张\n", flush=True)

        # 3. 按需并发下载
        if not missing_online_names:
            print("⚡【极速检查通过】本地表情包库已是最新状态，无新增图片，0 冗余网络开销！", flush=True)
        else:
            print(f"--> [3/3] 发现 {len(missing_online_names)} 张新表情，启动 {self.max_workers} 线程温和并发下载 (间隔 {int(self.request_delay*1000)}ms)...", flush=True)
            new_items = self.fetch_imageinfo_for_files(missing_online_names)
            success_count = 0
            
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                futures = {executor.submit(self._download_single, item): item for item in new_items}
                for idx, future in enumerate(as_completed(futures), 1):
                    try:
                        ok, fname = future.result()
                        if ok:
                            print(f"    + [{idx}/{len(new_items)}] 增量下载成功: {fname}", flush=True)
                            success_count += 1
                        else:
                            print(f"    x [{idx}/{len(new_items)}] 下载失败: {fname}", flush=True)
                    except Exception as err:
                        print(f"    x [{idx}/{len(new_items)}] 线程异常: {err}", flush=True)

            print(f"\n--> 增量下载完成！成功新增入库 {success_count} 张。", flush=True)
            print("--> 正在自动刷新重构画廊...", flush=True)
            build_gallery()

        total_time = time.time() - start_time
        print("\n==================================================================", flush=True)
        print(f"全流程运行结束 (总耗时: {total_time:.2f} 秒) | 本地表情库: {len(os.listdir(self.emojis_dir))} 张", flush=True)
        print(f"离线画廊地址: {self.gallery_html_path}")
        print("==================================================================", flush=True)

if __name__ == '__main__':
    syncer = ZZZEmojiIncrementalSyncer()
    syncer.sync()

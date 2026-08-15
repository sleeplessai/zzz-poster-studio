#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZZZ Poster Studio - Local Development & Preview Server
启动脚本：自动寻找可用端口、启动本地 HTTP 服务并在浏览器中打开应用。
"""

import os
import sys
import socket
import argparse
import webbrowser
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Windows 终端 UTF-8 编码兼容
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

DEFAULT_PORT = 8080
MAX_PORT_SEARCH = 20

def is_port_in_use(port: int) -> bool:
    """检查指定端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def find_available_port(start_port: int = DEFAULT_PORT) -> int:
    """自动查找可用端口"""
    for port in range(start_port, start_port + MAX_PORT_SEARCH):
        if not is_port_in_use(port):
            return port
    # 如果范围内都被占用，由操作系统自动分配一个
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

class CustomHTTPHandler(SimpleHTTPRequestHandler):
    """自定义 HTTP 请求处理器，扩展 MIME 类型与日志格式"""
    
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
    }

    def end_headers(self):
        # 允许跨域（方便本地二创开发与素材调用）与关闭强缓存以便即时生效
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        # 过滤掉高频静态资源的繁杂日志，仅输出非 200/304 或主要访问
        code = str(args[1]) if len(args) > 1 else ''
        if code in ('200', '304') and any(self.path.endswith(ext) for ext in ('.png', '.svg', '.jpg', '.css', '.js', '.json')):
            return
        super().log_message(format, *args)

def main():
    parser = argparse.ArgumentParser(
        description="启动 ZZZ Poster Studio 本地创作服务器",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=None,
        help="指定本地服务监听端口（默认优先使用 8080）"
    )
    parser.add_argument(
        "--studio", "-s",
        action="store_true",
        help="启动后直接打开海报拼贴工坊 (Poster Studio)"
    )
    parser.add_argument(
        "--gallery", "-g",
        action="store_true",
        help="启动后直接打开官方贴画图鉴 (Emoji Gallery)"
    )
    parser.add_argument(
        "--no-browser", "-n",
        action="store_true",
        help="不自动打开浏览器"
    )

    args = parser.parse_args()

    # 确保运行目录为项目根目录
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)

    # 确定端口
    if args.port:
        if is_port_in_use(args.port):
            print(f"[警告] 端口 {args.port} 已被占用，尝试启动可能会失败。")
        port = args.port
    else:
        port = find_available_port(DEFAULT_PORT)

    # 确定启动目标 URL
    base_url = f"http://localhost:{port}"
    if args.studio:
        target_path = "/poster_studio/index.html"
        mode_name = "海报拼贴工坊 (Poster Studio)"
    elif args.gallery:
        target_path = "/gallery/index.html"
        mode_name = "官方贴画图鉴 (Emoji Gallery)"
    else:
        target_path = "/index.html"
        mode_name = "导航中枢门户 (Creative Hub)"

    target_url = f"{base_url}{target_path}"

    print("=" * 64)
    print("   🎮 ZZZ Poster Studio · 本地创作与预览服务")
    print("=" * 64)
    print(f" [模式] {mode_name}")
    print(f" [根目录] {project_root}")
    print(f" [访问地址] {target_url}")
    print(f" [其他入口]")
    print(f"   - 导航门户:   {base_url}/index.html")
    print(f"   - 海报工坊:   {base_url}/poster_studio/index.html")
    print(f"   - 表情图鉴:   {base_url}/gallery/index.html")
    print("=" * 64)
    print(" [提示] 按 Ctrl + C 可随时停止服务\n")

    # 异步在浏览器中打开目标地址
    if not args.no_browser:
        def open_browser():
            time.sleep(0.6)
            try:
                webbrowser.open(target_url)
            except Exception as e:
                print(f"[提示] 无法自动拉起浏览器: {e}，请手动在浏览器中访问 {target_url}")

        threading.Thread(target=open_browser, daemon=True).start()

    # 启动多线程 HTTP 服务
    try:
        with ThreadingHTTPServer(("", port), CustomHTTPHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[退出] 本地服务已安全停止，感谢使用！")
        sys.exit(0)
    except Exception as e:
        print(f"\n[错误] 启动服务失败: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

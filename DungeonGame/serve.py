"""本地预览服务：在本文件所在文件夹运行 python serve.py。"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

class PreviewHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.css': 'text/css'}

    def end_headers(self):
        # 本地开发时每次刷新都读取最新文件。
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='微光地牢本地预览')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    handler = partial(PreviewHandler, directory=str(Path(__file__).resolve().parent))
    try:
        with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
            print(f'打开 http://127.0.0.1:{args.port}/index.html', flush=True)
            print('保持这个终端开启；按 Ctrl+C 停止服务。', flush=True)
            server.serve_forever()
    except KeyboardInterrupt:
        print('\n预览服务已停止。')
    except OSError as error:
        print(f'服务启动失败：{error}\n如果端口已占用，请运行 python serve.py --port 8001')
        raise SystemExit(1)

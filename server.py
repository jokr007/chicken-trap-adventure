import http.server
import socketserver
import webbrowser
import os
import sys
import subprocess
import time

PORT = 8080

# التوجه إلى مجلد اللعبة
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = http.server.SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
    })

    def end_headers(self):
        # ترويسات الأمان وجدار الحماية وسد الثغرات (Security & Anti-Exploit Headers)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
        super().end_headers()

def try_open_app_mode(url):
    """فتح اللعبة في نافذة تطبيق مستقلة بدون شريط عنوان أو روابط محلية"""
    # مسارات المتصفحات الشائعة في ويندوز
    edge_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
    ]
    chrome_paths = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe")
    ]

    for p in edge_paths + chrome_paths:
        if os.path.exists(p):
            try:
                subprocess.Popen([p, f"--app={url}", "--window-size=960,750"])
                return True
            except Exception:
                pass
    return False

def find_free_port(start_port=8080):
    import socket
    port = start_port
    while port < start_port + 20:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
        port += 1
    return start_port

def run():
    global PORT
    PORT = find_free_port(8080)
    url = f"http://localhost:{PORT}/"

    print("=" * 60)
    print("  🐔 تم تشغيل خادم لعبة الدجاجة والأفخاخ بنجاح!")
    print(f"  🌐 رابط اللعبة المحلي: {url}")
    print("  ⭐ جاهز لربط الإعلانات الحقيقية وشحن القسائم!")
    print("=" * 60)

    # محاولة الفتح كنافذة تطبيق نظيفة، وإن لم ينجح نفتح في المتصفح الافتراضي
    if not try_open_app_mode(url):
        webbrowser.open(url)

    handler = CustomHTTPHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nتم إيقاف الخادم.")

if __name__ == "__main__":
    run()

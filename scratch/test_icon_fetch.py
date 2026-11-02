import sys
import os
sys.path.insert(0, r"C:\Users\no\Downloads\gemes")
os.chdir(r"C:\Users\no\Downloads\gemes")

import socketserver
import threading
import urllib.request
from server import CustomHTTPHandler

PORT = 8999
httpd = socketserver.TCPServer(("", PORT), CustomHTTPHandler)
server_thread = threading.Thread(target=httpd.serve_forever)
server_thread.daemon = True
server_thread.start()

print(f"Test server started on port {PORT}")

test_urls = [
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable-192.png",
    "/icon-maskable-512.png",
    "/icon.svg"
]

all_ok = True
for path in test_urls:
    url = f"http://localhost:{PORT}{path}"
    try:
        req = urllib.request.urlopen(url)
        content_type = req.headers.get("Content-Type")
        print(f"URL: {path} -> Status: {req.status}, Content-Type: {content_type}")
        if path.endswith(".png") and not content_type.startswith("image/png"):
            all_ok = False
        if path.endswith(".svg") and not content_type.startswith("image/svg+xml"):
            all_ok = False
    except Exception as e:
        print(f"URL: {path} -> FAILED: {e}")
        all_ok = False

httpd.shutdown()
if all_ok:
    print("\nALL ICONS ARE 100% FETCHABLE WITH VALID IMAGE CONTENT-TYPE!")
else:
    print("\nSome tests failed!")

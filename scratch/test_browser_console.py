import subprocess
import time
import json
import urllib.request
import os

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
proc = subprocess.Popen([
    edge_path,
    "--headless",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "http://127.0.0.1:8080/index.html"
])

time.sleep(2)
try:
    req = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(req.read().decode())
    print("Tabs found:", len(tabs))
    for t in tabs:
        print("Tab:", t.get("title"), t.get("url"))
except Exception as e:
    print("Error connecting to CDP:", e)
finally:
    proc.terminate()

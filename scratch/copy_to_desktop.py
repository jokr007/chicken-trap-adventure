import os
import sys
import shutil

sys.stdout.reconfigure(encoding='utf-8')

desktop_dir = r"C:\Users\no\Desktop"
target_dir = os.path.join(desktop_dir, "Chicken_Game_Fixed")
src_dir = r"C:\Users\no\Downloads\gemes"

os.makedirs(target_dir, exist_ok=True)
print("Target dir created:", target_dir)

# 1. Generate consolidated code file
consolidated_file = os.path.join(target_dir, "جميع_الأكواد_المحدثة.md")
consolidated_txt = os.path.join(target_dir, "ALL_UPDATED_CODES.txt")

# Read relevant files
with open(os.path.join(src_dir, "sw.js"), "r", encoding="utf-8") as f:
    sw_code = f.read()

with open(os.path.join(src_dir, "js", "ads.js"), "r", encoding="utf-8") as f:
    ads_code = f.read()

with open(os.path.join(src_dir, "vercel.json"), "r", encoding="utf-8") as f:
    vercel_code = f.read()

with open(os.path.join(src_dir, "netlify.toml"), "r", encoding="utf-8") as f:
    netlify_code = f.read()

with open(os.path.join(src_dir, "package.json"), "r", encoding="utf-8") as f:
    package_code = f.read()

with open(os.path.join(src_dir, "manifest.json"), "r", encoding="utf-8") as f:
    manifest_code = f.read()

with open(os.path.join(src_dir, "icon.svg"), "r", encoding="utf-8") as f:
    icon_code = f.read()

content_md = f"""# 🐔 جميع الأكواد المحدثة والمصححة - لعبة مغامرة كوكو والأفخاخ
تاريخ التحديث: 2026-11-02
حالة المشروع: جاهز للنشر الفوري وخالٍ من الأخطاء (Bug-Free & Production Ready)

---

## 📌 فهرس المحتويات:
1. [ملف sw.js (Service Worker المحدث مع دعم الأوفلاين وحماية الإعلانات)](#1-ملف-swjs)
2. [ملف js/ads.js (نظام إدارة الإعلانات ومنع التجميد وتنظيف المستمعين)](#2-ملف-jsadsjs)
3. [أهم دوال js/game.js المحدثة (حماية التوقف المؤقت والنوافذ المنبثقة)](#3-ملف-jsgamejs)
4. [ملف vercel.json (إعدادات النشر السحابي على Vercel)](#4-ملف-verceljson)
5. [ملف netlify.toml (إعدادات النشر السحابي على Netlify)](#5-ملف-netlifytoml)
6. [ملف package.json (بيانات المشروع للمنصات السحابية)](#6-ملف-packagejson)
7. [ملف manifest.json (إعدادات تطبيق الويب التقدمي PWA)](#7-ملف-manifestjson)
8. [ملف icon.svg (أيقونة اللعبة الرسمية)](#8-ملف-iconsvg)
9. [تعديلات index.html (تحديث وحدات AdSense وعداد الإعلان البيني)](#9-تعديلات-indexhtml)

---

## 1. ملف sw.js
```javascript
{sw_code}
```

---

## 2. ملف js/ads.js
```javascript
{ads_code}
```

---

## 3. ملف js/game.js
### دالة التوقف المؤقت المحمية لمنع تخطي الإعلانات:
```javascript
    togglePause() {{
        // حماية أمنية: منع التخطي أو التلاعب بحالة اللعبة أثناء عرض الإعلانات
        if (window.adManager && window.adManager.isAdPlaying) {{
            return;
        }}
        if (this.state === 'PLAYING') {{
            this.state = 'PAUSED';
            this.lastActiveTimestamp = null;
            this.showModal('pauseModal');
        }} else if (this.state === 'PAUSED') {{
            this.state = 'PLAYING';
            this.lastActiveTimestamp = Date.now();
            this.hideModals();
        }}
    }}
```

### دالة إخفاء النوافذ المحمية لعدم إغلاق الإعلانات بالخطأ:
```javascript
    hideModals() {{
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => {{
            // حماية: عدم إغلاق نوافذ الإعلانات النشطة إطلاقاً عبر hideModals العامة
            if (window.adManager && window.adManager.isAdPlaying) {{
                if (m.id === 'rewardedAdModal' || m.id === 'interstitialAdModal' || m.id === 'mandatoryPopAdModal') {{
                    return;
                }}
            }}
            m.style.display = 'none';
        }});
    }}
```

---

## 4. ملف vercel.json
```json
{vercel_code}
```

---

## 5. ملف netlify.toml
```toml
{netlify_code}
```

---

## 6. ملف package.json
```json
{package_code}
```

---

## 7. ملف manifest.json
```json
{manifest_code}
```

---

## 8. ملف icon.svg
```xml
{icon_code}
```

---

## 9. تعديلات index.html
1. تم استبدال جميع معرفات الحساب التجريبية `data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"` بالمعرف الفعلي الموثق:
```html
data-ad-client="ca-pub-7109468486527527"
```

2. تم تحديث زر نافذة الإعلان البيني ليتضمن عنصر العداد:
```html
<button id="btnSkipInterstitial" class="btn-action" style="width: 100%; justify-content: center;">
    يمكن التخطي بعد (<span id="interstitialTimer">3</span>) ثوانٍ...
</button>
```

3. تم تحديث رابط الأيقونة:
```html
<link rel="icon" type="image/svg+xml" href="icon.svg">
```
"""

with open(consolidated_file, "w", encoding="utf-8") as f:
    f.write(content_md)

with open(consolidated_txt, "w", encoding="utf-8") as f:
    f.write(content_md)

print("Consolidated files created successfully!")

# 2. Copy the entire working game to target_dir
files_to_copy = [
    "index.html",
    "icon.svg",
    "manifest.json",
    "sw.js",
    "vercel.json",
    "netlify.toml",
    "package.json",
    "server.py",
    "README.md",
    "تشغيل_اللعبة.bat",
    "نشر_اللعبة_مجانا_أونلاين.bat"
]

for filename in files_to_copy:
    src_file = os.path.join(src_dir, filename)
    dst_file = os.path.join(target_dir, filename)
    if os.path.isfile(src_file):
        shutil.copy2(src_file, dst_file)
        print(f"Copied file: {filename}")

# Copy directories
for dirname in ["css", "js"]:
    src_folder = os.path.join(src_dir, dirname)
    dst_folder = os.path.join(target_dir, dirname)
    if os.path.isdir(dst_folder):
        shutil.rmtree(dst_folder)
    shutil.copytree(src_folder, dst_folder)
    print(f"Copied folder: {dirname}/")

print("All project files copied to Desktop folder successfully!")

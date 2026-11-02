with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace placeholder ca-pub-XXXXXXXXXXXXXXXX with the real publisher ID
count_pubid = html.count("ca-pub-XXXXXXXXXXXXXXXX")
print(f"Found {count_pubid} instances of ca-pub-XXXXXXXXXXXXXXXX in index.html")
html = html.replace("ca-pub-XXXXXXXXXXXXXXXX", "ca-pub-7109468486527527")

# Check interstitialTimer
if 'id="interstitialTimer"' not in html:
    old_btn = '<button id="btnSkipInterstitial" class="btn-action" style="width: 100%; justify-content: center;">\n                    يمكن التخطي بعد 3...\n                </button>'
    new_btn = '<button id="btnSkipInterstitial" class="btn-action" style="width: 100%; justify-content: center;">\n                    يمكن التخطي بعد (<span id="interstitialTimer">3</span>) ثوانٍ...\n                </button>'
    if old_btn in html:
        html = html.replace(old_btn, new_btn, 1)
        print("Updated btnSkipInterstitial to include interstitialTimer span!")
    else:
        # try CRLF version
        old_btn_crlf = '<button id="btnSkipInterstitial" class="btn-action" style="width: 100%; justify-content: center;">\r\n                    يمكن التخطي بعد 3...\r\n                </button>'
        new_btn_crlf = '<button id="btnSkipInterstitial" class="btn-action" style="width: 100%; justify-content: center;">\r\n                    يمكن التخطي بعد (<span id="interstitialTimer">3</span>) ثوانٍ...\r\n                </button>'
        if old_btn_crlf in html:
            html = html.replace(old_btn_crlf, new_btn_crlf, 1)
            print("Updated btnSkipInterstitial (CRLF) to include interstitialTimer span!")
        else:
            print("Warning: old_btn pattern not found directly, checking regex")
            import re
            html, n = re.subn(r'(<button id="btnSkipInterstitial"[^>]*>)[^<]*(</button>)', r'\1يمكن التخطي بعد (<span id="interstitialTimer">3</span>) ثوانٍ...\2', html)
            print(f"Regex replaced {n} instances of btnSkipInterstitial")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Saved updated index.html")

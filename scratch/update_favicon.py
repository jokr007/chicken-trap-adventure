with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

old_fav = '<link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🐔</text></svg>">'
new_fav = '<link rel="icon" type="image/svg+xml" href="icon.svg">'

if old_fav in html:
    html = html.replace(old_fav, new_fav, 1)
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Favicon replaced successfully!")
else:
    print("Old favicon string not found exactly.")

#!/usr/bin/env python3
"""Bundle src/ into a single self-contained page.

Outputs:
  index.html          full HTML document (GitHub Pages / open locally / "Add to Home Screen")
  dist/artifact.html  the same page without the document skeleton (for the Claude artifact)
"""
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
JS_ORDER = ["util.js", "gen-series.js", "gen-matrix.js", "gen-instr.js", "engine.js", "lessons.js", "app.js"]

TITLE = "מסלול דפ״ר למשטרה"
FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500'
    '&family=IBM+Plex+Sans+Hebrew:wght@400;500;600;700&family=Secular+One&display=swap">'
)


def body() -> str:
    css = (SRC / "styles.css").read_text(encoding="utf-8")
    js = "\n".join((SRC / f).read_text(encoding="utf-8") for f in JS_ORDER)
    js = js.replace("</script", "<\\/script")
    return (
        f'<style>\n{css}\n</style>\n'
        '<div id="app" dir="rtl" lang="he"><main><p style="padding:24px">טוען…</p></main></div>\n'
        '<noscript><p style="padding:24px">האפליקציה דורשת JavaScript.</p></noscript>\n'
        f'<script>\n"use strict";\n{js}\n</script>\n'
    )


def main() -> None:
    b = body()
    full = (
        '<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f'<title>{TITLE}</title>\n'
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        '<meta name="description" content="תוכנית הכנה של 14 יום למבחן המיון הממוחשב של משטרת ישראל: סדרות חשבוניות, סדרות צורניות ומילוי הוראות.">\n'
        '<meta name="theme-color" content="#1c3d8c">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-title" content="מסלול דפ״ר">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
        '<link rel="apple-touch-icon" href="icon-180.png">\n'
        '<link rel="icon" href="icon-180.png">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n'
        f'{FONTS}\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'html,body{margin:0}[hidden]{display:none!important}</style>\n'
        '</head>\n<body>\n' + b + '</body>\n</html>\n'
    )
    (ROOT / "index.html").write_text(full, encoding="utf-8")
    art = (
        f'<title>{TITLE}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n{FONTS}\n' + b
    )
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "artifact.html").write_text(art, encoding="utf-8")
    print(f"index.html {len(full)//1024} KB, dist/artifact.html {len(art)//1024} KB")


if __name__ == "__main__":
    main()

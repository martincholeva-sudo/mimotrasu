#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, shutil, stat, re, datetime, json
from PIL import Image
from bs4 import BeautifulSoup
import rcssmin, rjsmin

# ========== PŘEDNASTAVENÍ CEST ==========
BASE_DIR     = os.path.abspath(os.path.dirname(__file__))
SOURCE_ITEMS = [d for d in os.listdir(BASE_DIR) if d not in ("dist", "scripts")]
DIST_DIR     = os.path.join(BASE_DIR, "dist")
SCRIPTS_DIR  = os.path.join(BASE_DIR, "scripts")

# ========== WEBOVÉ KONSTANTY ==========
SITE_URL       = "https://mimotrasu.cz"
SITE_NAME      = "Mimo Trasu"
AUTHOR         = "Martin"
OG_IMAGE       = f"{SITE_URL}/img/mimo-trasu-og.jpg"
TWITTER_HANDLE = "@mimotrasu"

# Monitoring snippet
MONITORING_SNIPPET = """
<!-- Monitoring: Sentry & Web Vitals -->
<script src="https://browser.sentry-cdn.com/7.0.0/bundle.min.js" crossorigin="anonymous"></script>
<script>
  Sentry.init({ dsn: 'https://YOUR_DSN@sentry.io/YOUR_PROJECT_ID' });
  (function(){
    function sendMetric({ name, delta, id }) {
      Sentry.captureMessage(name + ' ' + delta, { level: 'info', tags: { id } });
    }
    import('https://unpkg.com/web-vitals?module').then(({ getCLS, getFID, getLCP }) => {
      getCLS(sendMetric);
      getFID(sendMetric);
      getLCP(sendMetric);
    });
  })();
</script>
"""

MINIFY = False   # True = minifikovat CSS/JS, False = kopírovat beze změny

def _rm_on_error(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    func(path)

def prepare_dist():
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR, onerror=_rm_on_error)
    os.makedirs(DIST_DIR)
    for item in SOURCE_ITEMS:
        src, dst = os.path.join(BASE_DIR,item), os.path.join(DIST_DIR,item)
        if os.path.isdir(src): shutil.copytree(src, dst)
        else:                shutil.copy2(src, dst)
    print(f"[✓] Zkopírováno {len(SOURCE_ITEMS)} položek → {DIST_DIR}")

def ensure_font_display():
    css = os.path.join(DIST_DIR,"css","styl.css")
    if not os.path.exists(css): return
    lines, out, in_face = open(css,encoding="utf-8").read().splitlines(), [], False
    for l in lines:
        out.append(l)
        if l.strip().startswith("@font-face"): in_face=True
        elif in_face and l.strip().startswith("}"):
            if not any("font-display" in x for x in out[-10:]):
                out.insert(-1,"  font-display: swap;")
            in_face=False
    open(css,"w",encoding="utf-8").write("\n".join(out))
    print("[✓] font-display přidán")

def inject_mobile_css():
    css = os.path.join(DIST_DIR,"css","styl.css")
    if not os.path.exists(css): return
    rules = """
@media (max-width:600px){
  .categories{display:flex!important;flex-direction:column!important;
    align-items:center!important;text-align:center!important}
  .categories .cat{width:90%!important;max-width:300px!important;
    margin:0 auto 1.5rem!important;text-align:center!important}
}
"""
    with open(css,"a",encoding="utf-8") as f:
        f.write(rules)
    print("[inject] mobile-centering CSS appended")

def fix_email_links():
    pat = re.compile(r'^[^/:]+@[^/]+\.[^/]+$')
    for root,_,files in os.walk(DIST_DIR):
        for fn in files:
            if not fn.lower().endswith(".html"): continue
            p = os.path.join(root,fn)
            soup = BeautifulSoup(open(p,encoding="utf-8"),"html.parser")
            changed=False
            for a in soup.find_all("a",href=True):
                h = a["href"].strip()
                if pat.match(h) and not h.startswith("mailto:"):
                    a["href"] = "mailto:" + h
                    changed = True
            if changed:
                open(p,"w",encoding="utf-8").write(str(soup))
                print(f"[email] mailto fix → {fn}")

def convert_images_to_webp():
    d = os.path.join(DIST_DIR,"img")
    if not os.path.isdir(d): return
    for fn in os.listdir(d):
        if fn.lower().endswith((".jpg",".jpeg")):
            src = os.path.join(d,fn)
            dst = os.path.splitext(src)[0] + ".webp"
            if os.path.exists(dst): continue
            try:
                img = Image.open(src).convert("RGB")
                img.save(dst,"webp",quality=85)
                print(f"[WEBP] {fn} → {os.path.basename(dst)}")
            except Exception as e:
                print(f"[ERROR konv] {fn}: {e}")

def replace_imgs_with_picture():
    for root,_,files in os.walk(DIST_DIR):
        for fn in files:
            if not fn.lower().endswith(".html"): continue
            path = os.path.join(root,fn)
            soup = BeautifulSoup(open(path,encoding="utf-8"),"html.parser")
            ch = False
            for img in soup.find_all("img"):
                src = img.get("src","")
                if src.lower().endswith((".jpg",".jpeg")):
                    webp = src.rsplit(".",1)[0]+".webp"
                    if os.path.exists(os.path.join(DIST_DIR,webp.lstrip("/"))):
                        pic = soup.new_tag("picture")
                        pic.append(soup.new_tag("source", srcset=webp, type="image/webp"))
                        pic.append(soup.new_tag("img", **img.attrs))
                        img.replace_with(pic)
                        ch = True
            if ch:
                open(path,"w",encoding="utf-8").write(str(soup))
                print(f"[HTML] WebP ↑ {fn}")

def process_html():
    today = datetime.date.today().isoformat()
    for root,_,files in os.walk(DIST_DIR):
        for fn in files:
            if not fn.lower().endswith(".html"): continue
            path = os.path.join(root,fn)
            soup = BeautifulSoup(open(path,encoding="utf-8"),"html.parser")

            # lazy-load + alt
            for img in soup.find_all("img"):
                img.attrs.setdefault("loading","lazy")
                img.attrs.setdefault("alt","")

            # HEAD: OG/meta/schema/canonical/twitter/PWA
            if soup.head:
                # remove old
                for old in soup.head.select('meta[property^="og:"],script[type="application/ld+json"]'):
                    old.decompose()
                # title & desc
                title = soup.title.text.strip() if soup.title else fn.replace(".html","")
                p1    = soup.find("p")
                desc  = (p1.text.strip()[:147]+"...") if p1 and len(p1.text.strip())>147 else (p1.text.strip() if p1 else title)
                first = soup.find("img")
                imgurl= OG_IMAGE
                if first and first.get("src"):
                    s = first["src"]
                    imgurl = s if s.startswith("http") else SITE_URL + "/" + s.lstrip("/")
                # OG
                for prop,val in {
                    "og:title":title,
                    "og:description":desc,
                    "og:image":imgurl,
                    "og:url":SITE_URL+"/"+fn,
                    "og:type":"article"
                }.items():
                    soup.head.append(soup.new_tag("meta",property=prop,content=val))
                # JSON-LD
                schema = {
                    "@context":"https://schema.org",
                    "@type":"Article",
                    "headline":title,
                    "description":desc,
                    "image":imgurl,
                    "author":{"@type":"Person","name":AUTHOR},
                    "publisher":{"@type":"Organization","name":SITE_NAME,"logo":{"@type":"ImageObject","url":OG_IMAGE}},
                    "datePublished":today
                }
                tag = soup.new_tag("script",type="application/ld+json")
                tag.string = json.dumps(schema,ensure_ascii=False,indent=2)
                soup.head.append(tag)
                # canonical **s .html**
                soup.head.append(soup.new_tag("link",rel="canonical",href=SITE_URL+"/"+fn))
                # twitter
                for nm,ct in [
                    ("twitter:card","summary_large_image"),
                    ("twitter:site",TWITTER_HANDLE),
                    ("twitter:title",title),
                    ("twitter:description",desc),
                    ("twitter:image",imgurl),
                ]:
                    soup.head.append(soup.new_tag("meta",attrs={"name":nm,"content":ct}))
                # PWA
                if not soup.head.find("link",rel="manifest"):
                    soup.head.append(soup.new_tag("link",rel="manifest",href="/manifest.json"))
                if not soup.head.find("link",rel="apple-touch-icon"):
                    soup.head.append(soup.new_tag("link",rel="apple-touch-icon",href="/img/apple-touch-icon.png"))

            # HTML/BODY background logic
            if soup.html and soup.body:
                # index.html → vlastní tapeta
                if fn.lower()=="index.html":
                    soup.html["style"] = (
                      "min-height:100vh;"
                      "background:#000 url('img/hory-usvit.webp') center/cover no-repeat fixed;"
                    )
                    soup.body["style"] = "background:transparent;"
                # rozcestníky → textura
                elif "rozcestnik" in fn.lower():
                    soup.html["style"] = (
                      "min-height:100vh;"
                      "background:#000 url('img/bg-textura-big.webp') center/cover no-repeat fixed;"
                    )
                    soup.body["style"] = "background:transparent;"
                # ostatní → černá
                else:
                    soup.html["style"] = "background:#000;"
                    soup.body["style"] = "background:transparent;"

            open(path,"w",encoding="utf-8").write(str(soup))
            print(f"[HTML] zpracováno → {fn}")

def inline_critical_css():
    crit = os.path.join(DIST_DIR,"css","critical.css")
    main = os.path.join(DIST_DIR,"css","styl.css")
    css_txt = ""
    if os.path.exists(crit): css_txt = open(crit,encoding="utf-8").read()
    elif os.path.exists(main): css_txt = open(main,encoding="utf-8").read()
    else:
        print("[critical] přeskočeno"); return
    for root,_,files in os.walk(DIST_DIR):
        for fn in files:
            if not fn.lower().endswith(".html"): continue
            path = os.path.join(root,fn)
            soup = BeautifulSoup(open(path,encoding="utf-8"),"html.parser")
            if soup.head:
                tag=soup.new_tag("style"); tag.string=css_txt
                soup.head.insert(0,tag)
                open(path,"w",encoding="utf-8").write(str(soup))
                print(f"[critical] inline → {fn}")

def inject_monitoring_snippet():
    for root,_,files in os.walk(DIST_DIR):
        for fn in files:
            if not fn.lower().endswith(".html"): continue
            path = os.path.join(root,fn)
            soup = BeautifulSoup(open(path,encoding="utf-8"),"html.parser")
            if soup.body:
                soup.body.append(BeautifulSoup(MONITORING_SNIPPET,"html.parser"))
                with open(path,"w",encoding="utf-8") as f:
                    f.write(str(soup))
                print(f"[monitor] vložen → {fn}")

def minify_assets():
    for fld,fnc in (("css","cssmin"),("js","jsmin")):
        d = os.path.join(DIST_DIR,fld)
        if not os.path.isdir(d): continue
        for fn in os.listdir(d):
            if not fn.lower().endswith(f".{fld}"): continue
            pth = os.path.join(d,fn)
            data = open(pth,encoding="utf-8").read()
            out  = getattr(rcssmin if fld=="css" else rjsmin,fnc)(data) if MINIFY else data
            open(pth,"w",encoding="utf-8").write(out)
            print(f"[{fld.upper()}] {'minify' if MINIFY else 'copy'} → {fn}")

def generate_sitemap():
    today = datetime.date.today().isoformat()
    urls = []
    for root,_,files in os.walk(DIST_DIR):
        for fn in files:
            if fn.lower().endswith(".html"):
                rel = os.path.relpath(os.path.join(root,fn),DIST_DIR).replace(os.sep,"/")
                urls.append(rel)
    with open(os.path.join(DIST_DIR,"sitemap.xml"),"w",encoding="utf-8") as s:
        s.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in sorted(urls):
            s.write(f'  <url><loc>{SITE_URL}/{u}</loc><lastmod>{today}</lastmod></url>\n')
        s.write('</urlset>')
    print(f"[✓] sitemap ({len(urls)} URLs)")

def deploy_misc():
    # robots.txt
    r = os.path.join(SCRIPTS_DIR,"robots.txt")
    if os.path.exists(r):
        shutil.copy2(r,os.path.join(DIST_DIR,"robots.txt"))
        print("[COPY] robots.txt")
    # .htaccess
    ht = os.path.join(DIST_DIR,".htaccess")
    with open(ht,"w",encoding="utf-8") as f:
        f.write(r"""
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css               "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/webp             "access plus 1 year"
  ExpiresByType image/jpeg             "access plus 1 year"
  ExpiresByType image/png              "access plus 1 year"
  ExpiresDefault                       "access plus 1 month"
</IfModule>
Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
""")
    print("[✓] .htaccess vygenerováno")

def main():
    print("=== START OPTIMIZE SITE ===")
    prepare_dist()
    ensure_font_display()
    inject_mobile_css()
    fix_email_links()
    convert_images_to_webp()
    replace_imgs_with_picture()
    process_html()
    inline_critical_css()
    inject_monitoring_snippet()
    minify_assets()
    generate_sitemap()
    deploy_misc()
    print("=== HOTOVO! Výstup v dist/ ===")

if __name__=="__main__":
    main()


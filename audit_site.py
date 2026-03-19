#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import json
import urllib.parse

BASE_URL = "https://mimotrasu.cz"

def fetch(path=""):
    url = urllib.parse.urljoin(BASE_URL, path)
    try:
        r = requests.get(url, timeout=10)
        return r
    except requests.RequestException as e:
        return None

def check_meta(soup):
    issues = []
    # canonical
    if not soup.find("link", rel="canonical"):
        issues.append("Chybí <link rel='canonical'>")
    # description
    if not soup.find("meta", attrs={"name": "description"}):
        issues.append("Chybí <meta name='description'>")
    # Open Graph
    og_props = {"og:title", "og:description", "og:image", "og:url"}
    missing_og = [og for og in og_props if not soup.find("meta", property=og)]
    if missing_og:
        issues.append(f"Chybí OG tagy: {', '.join(missing_og)}")
    # Twitter Cards
    tw_props = {"twitter:card", "twitter:title", "twitter:description"}
    missing_tw = [tw for tw in tw_props if not soup.find("meta", attrs={"name": tw})]
    if missing_tw:
        issues.append(f"Chybí Twitter Cards: {', '.join(missing_tw)}")
    return issues

def check_manifest(soup):
    link = soup.find("link", rel="manifest")
    if not link:
        return ["Chybí <link rel='manifest' href='manifest.json'>"]
    url = urllib.parse.urljoin(BASE_URL, link["href"])
    r = fetch(link["href"])
    if not r or r.status_code != 200:
        return [f"Nedaří se stáhnout manifest.json ({url})"]
    try:
        data = r.json()
    except ValueError:
        return ["manifest.json není validní JSON"]
    issues = []
    if "name" not in data:
        issues.append("V manifest.json chybí klíč 'name'")
    if "icons" not in data:
        issues.append("V manifest.json chybí klíč 'icons'")
    return issues

def check_robots():
    r = fetch("robots.txt")
    if not r or r.status_code != 200:
        return ["Chybí robots.txt"]
    return []

def check_sitemap():
    r = fetch("sitemap.xml")
    if not r or r.status_code != 200:
        return ["Chybí sitemap.xml"]
    return []

def check_icons(soup):
    issues = []
    # favicon
    if not soup.find("link", rel="icon"):
        issues.append("Chybí <link rel='icon'>")
    # apple-touch-icon
    if not soup.find("link", rel="apple-touch-icon"):
        issues.append("Chybí <link rel='apple-touch-icon'>")
    return issues

def main():
    print(f"Aktuální URL: {BASE_URL}\n")
    r = fetch("")
    if not r:
        print("Nepodařilo se načíst domovskou stránku.")
        return
    soup = BeautifulSoup(r.text, "html.parser")

    issues = []
    issues += check_meta(soup)
    issues += check_manifest(soup)
    issues += check_robots()
    issues += check_sitemap()
    issues += check_icons(soup)

    if issues:
        print("🛠 Našel jsem tyto nedostatky:")
        for i in issues:
            print(f" - {i}")
    else:
        print("✅ Všechny základní položky jsou přítomné.")

if __name__ == "__main__":
    main()

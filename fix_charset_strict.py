import os
import re
import shutil

# Pracuj v aktuální složce (tam, kde leží skript)
ROOT = os.path.dirname(os.path.abspath(__file__))

# Regexy (case-insensitive)
RE_HEAD = re.compile(r"<head\b[^>]*>", re.IGNORECASE)
# Jakákoli meta s "charset=" (včetně http-equiv content-type apod.)
RE_META_ANY_CHARSET = re.compile(r"<meta\b[^>]*charset\s*=\s*[^>]*>\s*", re.IGNORECASE)
# Bezpečnější odstranění i "Content-Type" met s charsetem v contentu
RE_META_HTTP_EQUIV_CT = re.compile(
    r"<meta\b[^>]*http-equiv\s*=\s*['\"]?\s*content-type\s*['\"]?[^>]*>\s*", re.IGNORECASE
)

def detect_newline(s: str) -> str:
    # zachovej původní konce řádků
    return "\r\n" if "\r\n" in s and s.count("\r\n") >= s.count("\n") else "\n"

def process_html(path: str) -> str | None:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
    except Exception as e:
        print(f"[!] Nelze číst: {path} ({e})")
        return None

    nl = detect_newline(html)

    m_head = RE_HEAD.search(html)
    if not m_head:
        return "NO_HEAD"

    # Existuje nějaký charset?
    had_charset = bool(RE_META_ANY_CHARSET.search(html) or RE_META_HTTP_EQUIV_CT.search(html))

    # Odstraň VŠECHNY existující meta charset varianty (ať nezůstanou duplicity)
    html_clean = RE_META_ANY_CHARSET.sub("", html)
    html_clean = RE_META_HTTP_EQUIV_CT.sub("", html_clean)

    # Pozice <head> se mohla po odstranění pohnout → najdi znovu
    m_head2 = RE_HEAD.search(html_clean)
    if not m_head2:
        # extrémně nepravděpodobné – fallback
        m_head2 = m_head

    insert_pos = m_head2.end()
    snippet = f"{nl}    <meta charset=\"utf-8\">"

    # Pokud po vyčištění je meta charset už náhodou hned za <head> (teoreticky ne),
    # stejně jej explicitně vložíme – je to náš jediný kanonický kus.
    new_html = html_clean[:insert_pos] + snippet + html_clean[insert_pos:]

    # Bez dalších úprav – nic jiného se nemění
    return ("MOVED" if had_charset else "ADDED", new_html)

def main():
    processed = added = moved = skipped_no_head = 0

    for root, _, files in os.walk(ROOT):
        for name in files:
            if not name.lower().endswith(".html"):
                continue
            path = os.path.join(root, name)
            processed += 1

            result = process_html(path)
            if result is None:
                continue
            if result == "NO_HEAD":
                skipped_no_head += 1
                continue

            status, new_html = result

            # Záloha .bak (jen jednou)
            bak = path + ".bak"
            if not os.path.exists(bak):
                try:
                    shutil.copy2(path, bak)
                except Exception as e:
                    print(f"[!] Nelze zálohovat: {path} ({e})")
                    continue

            try:
                with open(path, "w", encoding="utf-8", newline="") as f:
                    f.write(new_html)
            except Exception as e:
                print(f"[!] Nelze zapsat: {path} ({e})")
                continue

            if status == "ADDED":
                added += 1
                print(f"[OK] Přidáno:  {path}")
            else:
                moved += 1
                print(f"[OK] Přesunuto: {path}")

    print("\n===== REKAPITULACE =====")
    print(f"Zpracováno HTML:         {processed}")
    print(f"Přidáno <meta charset>:  {added}")
    print(f"Přesunuto <meta charset>: {moved}")
    print(f"Přeskočeno (bez <head>): {skipped_no_head}")
    input("\nHotovo. Stiskni Enter pro ukončení...")

if __name__ == "__main__":
    main()

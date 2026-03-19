// ===== Nastavení cílových stránek =====
const LOGO_TARGETS = {
  foto: "na-trase-s-objektivem-rozcestnik.html",
  oCeste: "o-ceste-rozcestnik.html",
  home: "index.html",
};

function resolveLogoTarget(pathname) {
  const p = (pathname || location.pathname).toLowerCase();

  // Rozcestníky "o cestě"
  if (p.includes("kodex-chlapa") || p.includes("moje-cesta") || p.includes("cesta-muze")) {
    return LOGO_TARGETS.oCeste;
  }

  // Fotopříběhy (Mlčení hor, Po dešti, Svítání u řeky, ... )
  if (
    p.includes("mlceni-hor") ||
    p.includes("po-desti") ||
    p.includes("svitani-u-reky") ||
    p.includes("na-trase-s-objektivem") ||
    p.includes("fotopribeh")
  ) {
    return LOGO_TARGETS.foto;
  }

  // Default
  return LOGO_TARGETS.home;
}

const DESIRED_LOGO_HREF = resolveLogoTarget(location.pathname);

// ===== Načtení headeru =====
const VERSION = "v1"; // klidně zvyš, když měníš header.html
fetch(`header.html?${VERSION}`)
  .then(res => res.text())
  .then(html => {
    // vlož header úplně na začátek body
    document.body.insertAdjacentHTML("afterbegin", html);

    // doplň favicony (pokud nejsou)
    const ico = document.querySelector('link[rel="icon"]') || document.createElement("link");
    ico.rel = "icon"; ico.type = "image/png"; ico.href = "/img/favicon.png";
    if (!ico.parentNode) document.head.appendChild(ico);

    const apple = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement("link");
    apple.rel = "apple-touch-icon"; apple.sizes = "180x180"; apple.href = "/img/favicon.png";
    if (!apple.parentNode) document.head.appendChild(apple);

    // tlačítko zpět nahoru
    if (!document.getElementById("back-to-top")) {
      document.body.insertAdjacentHTML("beforeend", '<button id="back-to-top" title="Zpět nahoru">↑</button>');
    }
    const btn = document.getElementById("back-to-top");
    window.addEventListener("scroll", () => {
      if (window.scrollY > window.innerHeight) btn.classList.add("visible");
      else btn.classList.remove("visible");
    });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // ===== Logo: nastav href + pojistka na klik =====
    const logoLink = document.getElementById("logo-link");
    if (logoLink) {
      logoLink.setAttribute("href", DESIRED_LOGO_HREF);
      logoLink.setAttribute("aria-label", "Zpět na rozcestník");

      // vynucení cíle i kdyby jiný skript přepsal href
      logoLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.assign(DESIRED_LOGO_HREF);
      }, { capture: true });
    }
  })
  .catch(console.error);

// ===== Záložní "zpět nahoru", kdyby se načtení přerušilo =====
if (!document.getElementById("back-to-top")) {
  const backToTopBtn = document.createElement("button");
  backToTopBtn.id = "back-to-top";
  backToTopBtn.setAttribute("aria-label", "Zpět nahoru");
  document.body.appendChild(backToTopBtn);

  window.addEventListener("scroll", () => {
    backToTopBtn.style.display = window.scrollY > 300 ? "flex" : "none";
  });
  backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}


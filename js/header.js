// Načtení jednoduchého headeru (jen logo)
fetch("/header.html")
  .then(res => res.text())
  .then(html => {
    document.body.insertAdjacentHTML("afterbegin", html);

    // Přidání favicon
    const ico = document.createElement("link");
    ico.rel = "icon";
    ico.type = "image/png";
    ico.href = "/img/favicon.png";
    document.head.appendChild(ico);

    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.sizes = "180x180";
    apple.href = "/img/favicon.png";
    document.head.appendChild(apple);

    // Tlačítko zpět nahoru
    document.body.insertAdjacentHTML("beforeend", '<button id="back-to-top" title="Zpět nahoru">↑</button>');
    const btn = document.getElementById("back-to-top");

    window.addEventListener("scroll", () => {
      if (window.scrollY > window.innerHeight) btn.classList.add("visible");
      else btn.classList.remove("visible");
    });

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Nastavení odkazu loga podle aktuální stránky
    const logoCheck = setInterval(() => {
      const logo = document.getElementById("logo-link");
      if (logo) {
        const path = window.location.pathname.split("/").pop();

        const groups = [
          { pages: [
            "kodex-chlapa.html",
            "moje-cesta.html",
            "cesta-muze-mimo-trasu.html"
          ], target: "o-ceste-rozcestnik.html" },

          { pages: [
            "zapisy.html",
            "muzska-zmena.html",
            "umeni-nechat-byt.html",
            "samota-neni-slabost.html",
            "do-nepohodli.html",
            "studena-sprcha.html",
            "zivot-bez-vymluv.html",
            "vlastni-cesta.html",
            "digitalni-dieta.html",
            "ranni-chuze.html",
            "tvrdost-chlapa.html",
            "charisma-chlapa.html",
            "eskapismus.html",
            "48-zakonu-moci.html",
            "tezke-obdobi.html",
            "chlap-a-selhani.html",
            "chlap-do-50.html",
            "ticho-chlapa.html",
            "proc-potrebujes-pravidla.html"
          ], target: "zapisy-rozcestnik.html" },

          { pages: [
            "na-trase-s-objektivem.html",
            "svitani-u-reky.html",
            "cas-plyne.html",
            "po-desti.html",
            "letistni-moment.html"
          ], target: "na-trase-s-objektivem-rozcestnik.html" },

          { pages: [
            "stoicismus.html",
            "stoicky-zacatek-dne.html",
            "stoicke-zamysleni.html",
            "stoicke-otazky.html",
            "stoicky-denik.html",
            "stoicky-denik-ke-stazeni.html",
            "vdecnost-chlapa.html"
          ], target: "stoicismus-rozcestnik.html" },

          { pages: [
            "red-pill.html",
            "red-pill-prvni-lekce.html",
            "red-pill-druha-lekce.html",
            "red-pill-treti-lekce.html"
          ], target: "red-pill-rozcestnik.html" },

          { pages: [
            "cviceni-jako-cesta.html",
            "cviceni-jako-cesta-zasada.html",
            "cviceni-doma-pondeli.html",
            "cviceni-doma-streda.html",
            "cviceni-doma-patek.html"
          ], target: "cviceni-jako-cesta-rozcestnik.html" },

          { pages: [
            "strava-pro-chlapa.html",
            "jidlo-jako-disciplina.html",
            "fit-tunakova-pomazanka.html",
            "fit-cina.html"
          ], target: "strava-pro-chlapa-rozcestnik.html" },

          { pages: [
            "memento-mori.html",
            "memento-mori-kalendar.html"
          ], target: "memento-mori-rozcestnik.html" }
        ];

        let found = false;
        for (const group of groups) {
          if (group.pages.includes(path)) {
            logo.href = group.target;
            found = true;
            break;
          }
        }

        if (!found) {
          logo.href = "index.html";
        }

        clearInterval(logoCheck);
      }
    }, 50);
  })
  .catch(console.error);

// Záložní vytvoření tlačítka zpět nahoru (pro jistotu)
const backToTopBtn = document.createElement("button");
backToTopBtn.id = "back-to-top";
backToTopBtn.setAttribute("aria-label", "Zpět nahoru");
document.body.appendChild(backToTopBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.style.display = "flex";
  } else {
    backToTopBtn.style.display = "none";
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

(function loadReadingEta(){
  if (document.querySelector('script[src*="reading-eta.js"]')) return;
  var s = document.createElement('script');
  s.src = 'js/reading-eta.js?v=250922'; // verze kvůli cache
  s.defer = true;
  document.head.appendChild(s);
})();


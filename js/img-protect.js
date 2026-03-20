// /js/img-protect.js
(function () {
  // Vybereme všechny IMG kromě těch, které explicitně povolíš
  const imgs = Array.from(document.querySelectorAll('img'))
    .filter(img => img.dataset.allowSave !== 'true');

  imgs.forEach(img => {
    // Nepůjde přetáhnout, vybrat ani vyvolat kontextové menu
    img.classList.add('no-save');
    img.setAttribute('draggable', 'false');
    img.setAttribute('tabindex', '-1'); // ztíží focus + klávesové akce
    // Bezpečný inline oncontextmenu (pro jistotu i kdyby globální listener selhal)
    if (!img.getAttribute('oncontextmenu')) {
      img.setAttribute('oncontextmenu', 'return false;');
    }
  });

  // Blokace context menu jen na obrázcích (a volitelně na .protect-media kontejnerech)
  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest('img:not([data-allow-save="true"]), .protect-media')) {
      e.preventDefault();
    }
  }, { capture: true });

  // Blokace drag&drop na obrázcích
  document.addEventListener('dragstart', function (e) {
    if (e.target.closest('img:not([data-allow-save="true"]), .protect-media')) {
      e.preventDefault();
    }
  }, { capture: true });

  // Mobile: potlačení dlouhého podržení (iOS/Android)
  ['touchstart', 'pointerdown'].forEach(ev => {
    document.addEventListener(ev, function (e) {
      const target = e.target.closest('img:not([data-allow-save="true"]), .protect-media');
      if (!target) return;
      // na jistotu: vypnout callout a výběr i runtime
      target.style.webkitUserSelect = 'none';
      target.style.userSelect = 'none';
      target.style.webkitTouchCallout = 'none';
    }, { passive: true, capture: true });
  });

  // Pokud máš někde obrázky uvnitř odkazů a chceš, aby ZŮSTALY klikací,
  // přidej jim data-clickable="true" (viz CSS komentář výše).
})();

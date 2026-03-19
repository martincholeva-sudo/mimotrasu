// js/reading-eta.js
(function(){
  // Pojistka proti duplicitnímu spuštění
  if (window.readingEtaInitialized) return;
  window.readingEtaInitialized = true;

  function setAccentAuto(){
    const b = document.body;
    // Pokud máš sekční třídu na <body>, necháme to na CSS
    const hasKnownClass =
      b.classList.contains('redpill') ||
      b.classList.contains('vlastnicesta') ||
      b.classList.contains('stoicismus') ||
      b.classList.contains('fitness');

    if (hasKnownClass) return;

    // Jinak zkus meta:section
    const section = (document.querySelector('meta[property="article:section"]')?.content || '').toLowerCase();
    let color = null;
    if (section.includes('red pill')) color = '#ff2b2b';
    else if (section.includes('stoic')) color = '#B8860B';
    else if (section.includes('cvi') || section.includes('fit')) color = '#66cc66';
    else if (section.includes('vlast')) color = '#ff7e00';

    // Poslední šance – podle URL
    if (!color) {
      const url = location.href.toLowerCase();
      if (url.includes('red-pill')) color = '#ff2b2b';
      else if (url.includes('stoic')) color = '#B8860B';
      else if (url.includes('cvic') || url.includes('fitness')) color = '#66cc66';
    }
    if (color) b.style.setProperty('--accent', color);
  }

  function init(){
    setAccentAuto();

    // Najdi hlavní obsah
    const article =
      document.querySelector('#blog-rozcesnik') ||
      document.querySelector('main article') ||
      document.querySelector('main');

    if (!article) return; // na čistých rozcestnících klidně nic nedělej

    // UI prvky – vytvoř, pokud chybí (s fallback styly, kdyby CSS nebylo načtené)
    let bar = document.getElementById('read-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'read-progress';
      // Fallback styly (nepřepíšou tvoje CSS var(--accent))
      bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;'
        + 'background:var(--accent,#ff7e00);z-index:9999;';
      document.body.appendChild(bar);
    }

    let eta = document.getElementById('read-eta');
    if (!eta) {
      eta = document.createElement('div');
      eta.id = 'read-eta';
      eta.style.cssText = 'position:fixed;top:6px;right:10px;font-size:.85rem;'
        + 'color:#9e9e9e;z-index:9999;padding:2px 8px;border-radius:6px;'
        + 'background:transparent;';
      document.body.appendChild(eta);
    }

    const etaInline = document.getElementById('eta-inline');
    const doc = document.documentElement;
    const WPM = 220;

    const text = (article.innerText || '').replace(/\s+/g,' ').trim();
    const totalWords = text ? text.split(' ').length : 0;

    function update(){
      const h = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const p = Math.min(1, Math.max(0, doc.scrollTop / h));
      bar.style.width = (p * 100) + '%';

      const leftWords = Math.max(0, Math.round(totalWords * (1 - p)));
      const min = Math.max(1, Math.round(leftWords / WPM));
      eta.innerHTML = '<span class="eta-num" style="color:var(--accent,#ff7e00);font-weight:800;">'
        + min + '</span> min do konce';
    }

    const initialMin = Math.max(1, Math.round(totalWords / WPM));
    if (etaInline) etaInline.textContent = initialMin;

    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update, {passive:true});
    // první vykreslení
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();

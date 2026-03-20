// footer.js
(function () {
  if (window.__FOOTER_ATTACHED__) return; // idempotence
  window.__FOOTER_ATTACHED__ = true;

  function insertFooter(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;

    const placeholder = document.getElementById('footer-placeholder');
    (placeholder || document.body).appendChild(wrap);

    initFooter();
  }

  function initFooter() {
    // Rok
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Tlačítko zpět nahoru
    if (!document.getElementById('back-to-top')) {
      const btn = document.createElement('button');
      btn.id = 'back-to-top';
      btn.setAttribute('aria-label', 'Zpět nahoru');
      btn.textContent = '↑';
      btn.style.cssText = `
        position: fixed; bottom: 40px; right: 40px; width: 48px; height: 48px;
        background: rgba(0,0,0,0.6); border: 2px solid #ff7e00; color: #ff7e00;
        font-size: 1.5rem; border-radius: 50%; display: none; align-items: center;
        justify-content: center; cursor: pointer; z-index: 9999;
      `;
      document.body.appendChild(btn);

      const toggleBtn = () => {
        btn.style.display = (window.innerWidth >= 800 && window.scrollY > 300) ? 'flex' : 'none';
      };
      window.addEventListener('scroll', toggleBtn, { passive: true });
      window.addEventListener('resize', toggleBtn);
      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      toggleBtn();
    }

    // Klik na logo = scroll nahoru
    const logoLink = document.querySelector('.footer-logo');
    if (logoLink && !logoLink.__bound) {
      logoLink.__bound = true;
      logoLink.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // E-mail: jen zkopíruje adresu, otevření necháme na <a target="_blank"> (1 nové okno)
    const copyEmailLink = document.getElementById('copy-email-link');
    if (copyEmailLink && !copyEmailLink.__bound) {
      copyEmailLink.__bound = true;
      const email = (copyEmailLink.getAttribute('data-copy') || copyEmailLink.textContent || '').trim();
      // href + target už jsou v HTML; nic neotevíráme v JS, aby se nevznikla 2 okna

      copyEmailLink.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(email);
            toast('E-mail zkopírovaný 👍');
          }
        } catch (_) {}
        // bez preventDefault -> prohlížeč otevře mailto v novém tabu/okně jen jednou
      });
    }
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#f5f5f5;padding:10px 14px;border:1px solid #333;border-radius:8px;font:14px system-ui,sans-serif;z-index:9999;opacity:0;transition:opacity .2s';
    document.body.appendChild(t);
    requestAnimationFrame(() => t.style.opacity = '1');
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 200); }, 1600);
  }

  function loadFooter() {
    fetch('footer.html', { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('Footer load failed: ' + r.status);
        return r.text();
      })
      .then(insertFooter)
      .catch(err => {
        console.error(err);
        const fallback = document.getElementById('footer-placeholder') || document.body;
        const errBox = document.createElement('footer');
        errBox.style.cssText = 'text-align:center;color:#777;padding:2rem 1rem;border-top:1px solid #222';
        errBox.textContent = 'Patička se nepodařila načíst.';
        fallback.appendChild(errBox);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();

// Načti ochranu obrázků po vložení patičky
const protectScript = document.createElement('script');
protectScript.src = '/js/img-protect.js';
protectScript.defer = true;
document.body.appendChild(protectScript);



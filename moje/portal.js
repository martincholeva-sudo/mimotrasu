'use strict';
(() => {
  const frame = document.getElementById('portal-frame');
  const status = document.getElementById('status');
  const text = document.getElementById('status-text');
  const section = new URLSearchParams(location.search).get('sekce');
  const path = location.pathname.startsWith('/moje/disk/') || section === 'disk' ? '/moje/disk' : section === 'fitness' ? '/moje/trenink' : section === 'garmin' ? '/moje/garmin' : null;
  if (path) {
    const target = new URL(path, 'https://moje.mimotrasu.cz');
    const folder = new URLSearchParams(location.search).get('slozka');
    if (path === '/moje/disk' && folder && /^[A-Za-z0-9_-]{1,200}$/.test(folder)) target.searchParams.set('slozka', folder);
    frame.src = target.toString();
  }
  let ready = false;
  window.addEventListener('message', event => {
    if (event.origin !== 'https://moje.mimotrasu.cz' || event.source !== frame.contentWindow) return;
    if (event.data?.channel !== 'mimo-portal-v1' || event.data?.type !== 'ready') return;
    ready = true;
    status.hidden = true;
    frame.hidden = false;
  });
  setTimeout(() => {
    if (!ready) text.textContent = 'Pro otevření soukromého prostoru se přihlas svým účtem.';
  }, 10000);
})();

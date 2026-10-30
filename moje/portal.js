'use strict';
(() => {
  const frame = document.getElementById('portal-frame');
  const status = document.getElementById('status');
  const text = document.getElementById('status-text');
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

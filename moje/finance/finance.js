'use strict';
(() => {
  const original = 'https://script.google.com/macros/s/AKfycbyuiXhFt26zmvlYh3MYGQAuYkXymW_P_tEDQCly02-3gjum3fd7qHq27Qt3uyLhREu_/exec';
  const frame = document.getElementById('finance-frame');
  const status = document.getElementById('status');
  const title = document.getElementById('status-title');
  const text = document.getElementById('status-text');
  const actions = document.getElementById('finance-actions');
  document.getElementById('google-link').href = original;
  let nonce, timeout, ready = false;
  function showSignIn() {
    if (ready) return;
    title.textContent = 'Přihlášení do financí';
    text.textContent = 'Otevři finance u Googlu a přihlas se svým účtem. Potom se sem vrať a zvol Načíst znovu.';
    actions.hidden = false;
  }
  function open() {
    clearTimeout(timeout);
    ready = false;
    nonce = crypto.randomUUID();
    status.hidden = false;
    actions.hidden = true;
    frame.classList.add('pending');
    title.textContent = 'Otevírám tvoje finance…';
    text.textContent = 'Čekám na soukromou aplikaci Google.';
    const url = new URL(original);
    url.searchParams.set('portal', 'mimo');
    url.searchParams.set('parentOrigin', location.origin);
    url.searchParams.set('nonce', nonce);
    frame.src = url.toString();
    timeout = setTimeout(showSignIn, 25000);
  }
  window.addEventListener('message', event => {
    let origin;
    try { origin = new URL(event.origin); } catch { return; }
    // HtmlService has nested frames; the fresh nonce and the server's exact
    // top-parent origin/source check bind its child to this load.
    if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.googleusercontent.com')) return;
    if (event.data?.channel !== 'mimo-finance-v1' || event.data?.nonce !== nonce) return;
    if (event.data.type === 'ready' && event.source) event.source.postMessage({channel:'mimo-finance-v1',type:'open',nonce}, event.origin);
    if (event.data.type === 'loaded') {
      ready = true;
      clearTimeout(timeout);
      status.hidden = true;
      frame.classList.remove('pending');
    }
    if (event.data.type === 'error') showSignIn();
  });
  document.getElementById('retry').addEventListener('click', open);
  open();
})();

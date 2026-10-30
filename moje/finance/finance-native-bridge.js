'use strict';
(() => {
  const original = 'https://script.google.com/macros/s/AKfycbyuiXhFt26zmvlYh3MYGQAuYkXymW_P_tEDQCly02-3gjum3fd7qHq27Qt3uyLhREu_/exec';
  const channel = 'mimo-finance-rpc-v2';
  const readMethods = new Set(['FIN_getDashboard', 'FIN_getSetupStatus']);
  const methods = new Set([...readMethods, 'FIN_createEntry', 'FIN_updateEntry', 'FIN_setPaid', 'FIN_deleteEntry', 'FIN_saveBrigadeShift']);
  const frame = document.getElementById('finance-backend');
  const panel = document.getElementById('finance-connection');
  const message = document.getElementById('finance-connection-message');
  const login = document.getElementById('finance-login');
  const retry = document.getElementById('finance-retry');
  const pending = new Map();
  let nonce, source, sourceOrigin, ready = false, connecting = null, resolveConnection;
  let connectionTimer, lastAttempt = 0, popup = null, authTimer, authStarted = 0;
  function notice(text, actions = true) {
    panel.hidden = false; message.textContent = text;
    login.hidden = !actions; retry.hidden = !actions;
  }
  function failure(code, text, uncertain = false) {
    return {ok:false, error:{code, message:text, uncertain}};
  }
  function settleConnection(ok) {
    clearTimeout(connectionTimer);
    const resolve = resolveConnection; resolveConnection = null; connecting = null;
    if (resolve) resolve(ok);
  }
  function connect(force = false) {
    if (ready) return Promise.resolve(true);
    if (connecting) return connecting;
    if (!force && Date.now() - lastAttempt < 55000) return Promise.resolve(false);
    lastAttempt = Date.now(); nonce = crypto.randomUUID(); source = null; sourceOrigin = null;
    connecting = new Promise(resolve => { resolveConnection = resolve; });
    notice('Načítám tvoje soukromé finanční údaje…', false);
    const url = new URL(original);
    url.searchParams.set('portal','mimo-rpc');
    url.searchParams.set('parentOrigin',location.origin); url.searchParams.set('nonce',nonce);
    frame.src = url.toString();
    connectionTimer = setTimeout(() => {
      notice('Finanční údaje zatím nejsou připojené. Pokud už máš propojení nastavené, přihlas se svým Google účtem a zkus načtení znovu.');
      settleConnection(false);
    },25000);
    return connecting;
  }
  window.addEventListener('message', event => {
    const data = event.data;
    let origin; try { origin = new URL(event.origin); } catch { return; }
    if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.googleusercontent.com') ||
        !data || data.channel !== channel || data.nonce !== nonce || !event.source ||
        source && source !== event.source) return;
    if (data.type === 'ready' && !ready) {
      source = event.source; sourceOrigin = event.origin;
      source.postMessage({channel, nonce, type:'open'}, sourceOrigin);
    } else if (data.type === 'connected' && source === event.source && data.version === 2) {
      ready = true; panel.hidden = true; settleConnection(true); clearInterval(authTimer);
      if (popup && !popup.closed) { popup.close(); window.focus(); }
      popup = null; window.dispatchEvent(new Event('mimo-finance-connected'));
    } else if (data.type === 'error' && !ready) {
      notice('Google nepotvrdil přístup k financím. Přihlas se svým účtem a obnov připojení.');
      settleConnection(false);
    } else if (data.type === 'response' && source === event.source) {
      const call = pending.get(data.id); if (!call) return;
      clearTimeout(call.timer); pending.delete(data.id); call.resolve(data.result);
    }
  });
  async function request(method, args = {}) {
    if (!methods.has(method) || !args || typeof args !== 'object' || Array.isArray(args) || JSON.stringify(args).length > 65536) {
      return failure('INVALID_INPUT','Nepovolený požadavek.');
    }
    const reading = readMethods.has(method);
    if (!reading && !ready) return failure('NOT_CONNECTED','Nejdřív připoj finanční údaje. Změna nebyla odeslána.');
    if (!ready && !await connect()) return failure('NOT_CONNECTED','Finanční údaje se zatím nepodařilo načíst.');
    if (pending.size >= 4 || !reading && [...pending.values()].some(call => call.writing)) {
      return failure('BUSY','Počkej na dokončení předchozího požadavku.');
    }
    const id = crypto.randomUUID();
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve(failure(reading?'TIMEOUT':'SAVE_UNCERTAIN',reading?'Načtení trvá příliš dlouho. Zkus obnovit přehled.':'Výsledek změny není potvrzený. Obnov přehled a ověř stav; změnu neposílej znovu.',!reading));
      },reading?45000:90000);
      pending.set(id,{resolve,timer,writing:!reading});
      source.postMessage({channel, nonce, type:'request', id, method, args},sourceOrigin);
    });
  }
  retry.addEventListener('click', () => { void connect(true); });
  login.addEventListener('click', () => {
    if (popup && !popup.closed) { popup.focus(); return; }
    // A real click opens the existing owner-only Google login. No cookies or
    // credentials are copied; all finance controls remain in this document.
    popup = window.open(original,'mimo-finance-google-signin','popup,width=600,height=760');
    if (!popup) { notice('Pro přihlášení povol vyskakovací okno pro tento web a zkus to znovu.'); return; }
    try { popup.opener = null; } catch { /* Browser may already isolate it. */ }
    authStarted = Date.now();
    notice('Dokonči přihlášení v okně Googlu. Finanční přehled zůstává tady.');
    clearInterval(authTimer);
    authTimer = setInterval(() => {
      if (ready || Date.now()-authStarted > 120000) { clearInterval(authTimer); return; }
      if (popup?.closed) { popup = null; clearInterval(authTimer); void connect(true); return; }
      if (Date.now()-lastAttempt > 15000 && !connecting) void connect(true);
    },1000);
    void connect(true);
  });
  function onReturn() {
    if (!ready && document.visibilityState === 'visible' && !connecting) void connect(true);
  }
  window.addEventListener('focus',onReturn);
  document.addEventListener('visibilitychange',onReturn);
  window.MimoFinance = Object.freeze({request});
})();

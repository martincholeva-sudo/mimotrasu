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
  let nonce, source, sourceOrigin, ready = false, active = false, transport = 'frame';
  let connecting = null, resolveConnection, connectionTimer, lastAttempt = 0;
  let popup = null, popupTimer;
  login.textContent = 'Připojit Google';

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
  function disconnect(text) {
    ready = false; active = false; source = null; sourceOrigin = null;
    settleConnection(false); clearInterval(popupTimer);
    for (const call of pending.values()) {
      clearTimeout(call.timer);
      call.resolve(failure(call.writing?'SAVE_UNCERTAIN':'CONNECTION',call.writing?
        'Výsledek změny není potvrzený. Po připojení obnov přehled a ověř stav; změnu neposílej znovu.':
        'Spojení s Googlem se přerušilo. Připoj ho znovu.',call.writing));
    }
    pending.clear(); notice(text);
    window.dispatchEvent(new Event('mimo-finance-disconnected'));
  }
  function relayUrl(mode) {
    const url = new URL(original);
    url.searchParams.set('portal','mimo-rpc');
    url.searchParams.set('parentOrigin',location.origin);
    url.searchParams.set('nonce',nonce);
    url.searchParams.set('transport',mode);
    return url.toString();
  }
  function begin(mode) {
    settleConnection(false);
    transport = mode; ready = false; active = true;
    nonce = crypto.randomUUID(); source = null; sourceOrigin = null;
    lastAttempt = Date.now();
    connecting = new Promise(resolve => { resolveConnection = resolve; });
    connectionTimer = setTimeout(() => {
      active = false;
      notice(mode === 'popup'?
        'Google nepotvrdil propojení. Pokud v malém okně vidíš celý finanční přehled, není nasazená nová verze propojení. Pokud ses právě přihlásil, zavři malé okno a zvol Připojit Google znovu.':
        'Připojení uvnitř stránky se nepodařilo. Zvol Připojit Google; otevře se malé připojovací okno.');
      settleConnection(false);
    },mode === 'popup'?45000:25000);
    return connecting;
  }
  function connect(force = false) {
    if (ready) return Promise.resolve(true);
    if (connecting) return connecting;
    if (transport === 'popup' && !force) return Promise.resolve(false);
    if (!force && Date.now() - lastAttempt < 55000) return Promise.resolve(false);
    const connection = begin('frame');
    notice('Načítám tvoje soukromé finanční údaje…', false);
    frame.src = relayUrl('frame');
    return connection;
  }
  window.addEventListener('message', event => {
    const data = event.data;
    let origin; try { origin = new URL(event.origin); } catch { return; }
    if (!active || origin.protocol !== 'https:' || !origin.hostname.endsWith('.googleusercontent.com') ||
        !data || data.channel !== channel || data.nonce !== nonce || !event.source ||
        source && source !== event.source || transport === 'popup' && data.transport !== 'popup') return;
    if (data.type === 'ready' && !ready) {
      source = event.source; sourceOrigin = event.origin;
      source.postMessage({channel, nonce, type:'open'}, sourceOrigin);
    } else if (data.type === 'connected' && source === event.source && data.version === 2) {
      ready = true; settleConnection(true);
      if (transport === 'popup') notice('Google je připojený. Malé okno nech otevřené; finance ovládáš tady.',false);
      else panel.hidden = true;
      window.dispatchEvent(new Event('mimo-finance-connected'));
    } else if (data.type === 'error' && !ready) {
      active = false;
      notice('Google nepotvrdil přístup k financím. Ověř přihlášený účet a nasazení nové verze propojení.');
      settleConnection(false);
    } else if (data.type === 'response' && source === event.source) {
      const call = pending.get(data.id); if (!call) return;
      clearTimeout(call.timer); pending.delete(data.id); call.resolve(data.result);
      if (data.result?.error?.code === 'OWNER_REQUIRED') disconnect('Přihlášení ke Googlu skončilo. Připoj Google znovu.');
    }
  });
  async function request(method, args = {}) {
    if (!methods.has(method) || !args || typeof args !== 'object' || Array.isArray(args) || JSON.stringify(args).length > 65536) {
      return failure('INVALID_INPUT','Nepovolený požadavek.');
    }
    const reading = readMethods.has(method);
    if (!reading && !ready) return failure('NOT_CONNECTED','Nejdřív připoj finanční údaje. Změna nebyla odeslána.');
    if (!ready && !await connect()) return failure('NOT_CONNECTED','Finanční údaje se zatím nepodařilo načíst.');
    if (!ready || !source) return failure('NOT_CONNECTED','Spojení s Googlem se přerušilo.');
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
      try { source.postMessage({channel, nonce, type:'request', id, method, args},sourceOrigin); }
      catch { disconnect('Spojení s Googlem se přerušilo. Připoj ho znovu.'); }
    });
  }
  retry.addEventListener('click', () => { if (transport === 'popup' && popup && !popup.closed) popup.focus(); else void connect(true); });
  login.addEventListener('click', () => {
    if (ready || pending.size) return;
    if (popup && !popup.closed && connecting && transport === 'popup') { popup.focus(); return; }
    clearInterval(popupTimer);
    begin('popup');
    // This explicit click opens only the owner's Google Web App. The opener is
    // needed for the nonce/origin-checked relay; no credentials are forwarded.
    popup = window.open(relayUrl('popup'),'mimo-finance-google-connection','popup,width=480,height=380');
    if (!popup) { active = false; settleConnection(false); notice('Povol pro tento web vyskakovací okno a zvol Připojit Google znovu.'); return; }
    notice('Dokonči připojení v malém okně Googlu. Až se připojí, nech ho otevřené.',false);
    popupTimer = setInterval(() => {
      if (popup && popup.closed) { popup = null; disconnect('Připojovací okno Googlu je zavřené. Pro práci s financemi zvol Připojit Google.'); }
    },1000);
  });
  function onReturn() {
    if (!ready && transport === 'frame' && document.visibilityState === 'visible' && !connecting) void connect();
  }
  window.addEventListener('focus',onReturn);
  document.addEventListener('visibilitychange',onReturn);
  window.MimoFinance = Object.freeze({request});
})();

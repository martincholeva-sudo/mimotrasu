/* Prague-local seasons, a calm daily photo rotation, and non-blocking image swaps. */
(function (root) {
  'use strict';
  const seasons = ['winter', 'spring', 'summer', 'autumn'];
  const labels = { spring: 'Jaro', summer: 'Léto', autumn: 'Podzim', winter: 'Zima', morning: 'ráno', day: 'den', evening: 'večer', night: 'noc' };
  const duskHours = [16, 17, 18, 20, 21, 21, 21, 20, 19, 18, 16, 16];
  function context(date = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(p => [p.type, p.value]));
    const month = Number(parts.month), hour = Number(parts.hour);
    const dawn = month >= 4 && month <= 9 ? 5 : 6;
    const period = hour < dawn || hour >= 22 ? 'night' : hour < 10 ? 'morning' : hour < duskHours[month - 1] ? 'day' : 'evening';
    return { season: seasons[Math.floor(month % 12 / 3)], period, hour, dayNumber: Math.floor(Date.UTC(Number(parts.year), month - 1, Number(parts.day)) / 86400000), date: `${parts.year}-${parts.month}-${parts.day}` };
  }
  function choose(photos, state, preference = 'auto', mobile = false) {
    const season = seasons.includes(preference) ? preference : state.season;
    const available = photos.filter(p => p.seasons.includes(season) && (mobile || !p.mobileOnly));
    const exact = available.filter(p => p.periods.includes(state.period));
    const evening = state.period === 'night' ? available.filter(p => p.periods.includes('evening')) : [];
    const pool = exact.length ? exact : evening.length ? evening : available.length ? available : photos.filter(p => mobile || !p.mobileOnly);
    if (!pool.length) return null;
    const offset = ['morning', 'day', 'evening', 'night'].indexOf(state.period);
    return pool[((state.dayNumber + offset) % pool.length + pool.length) % pool.length];
  }
  function greeting(state) {
    return state.period === 'night' ? 'Hezkou klidnou noc.' : state.period === 'morning' ? 'Dobré ráno.' : state.period === 'evening' ? 'Příjemný večer.' : 'Hezký den.';
  }
  function fallbackPalette(state) {
    const rgb = state.period === 'night' ? [18, 24, 26] : state.period === 'evening' ? [61, 49, 42] : state.period === 'morning' ? [69, 71, 60] : [52, 65, 61];
    return { rgb, luma: state.period === 'night' ? .12 : .28, glass: state.period === 'night' ? .64 : .7 };
  }
  function paletteFrom(image, state) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 28; canvas.height = 18;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, weight = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const alpha = pixels[index + 3] / 255;
        if (alpha < .15) continue;
        r += pixels[index] * alpha; g += pixels[index + 1] * alpha; b += pixels[index + 2] * alpha; weight += alpha;
      }
      if (!weight) return fallbackPalette(state);
      r /= weight; g /= weight; b /= weight;
      const luma = Math.max(0, Math.min(1, (.2126 * r + .7152 * g + .0722 * b) / 255));
      const neutral = state.period === 'night' ? [18, 22, 23] : [37, 34, 30];
      const rgb = [r, g, b].map((value, index) => Math.round(value * .62 + neutral[index] * .38));
      return { rgb, luma: Number(luma.toFixed(3)), glass: Number((.6 + luma * .2).toFixed(3)) };
    } catch {
      return fallbackPalette(state);
    }
  }
  function publishPalette(palette) {
    const safe = palette && Array.isArray(palette.rgb) ? palette : fallbackPalette(context());
    document.documentElement.style.setProperty('--photo-rgb', safe.rgb.join(','));
    document.documentElement.style.setProperty('--photo-luma', String(safe.luma));
    root.mimoPhotoPalette = safe;
    document.dispatchEvent(new CustomEvent('mimo:photo-theme', { detail: safe }));
  }
  function create(photos, initialImage) {
    let preference = 'auto', active = initialImage, serial = 0, requested = '', timer;
    const standby = initialImage.cloneNode(false);
    standby.removeAttribute('id'); standby.removeAttribute('src'); standby.removeAttribute('fetchpriority');
    standby.alt = ''; standby.setAttribute('aria-hidden', 'true'); standby.style.opacity = '0';
    initialImage.after(standby);
    const layers = [initialImage, standby];
    publishPalette(fallbackPalette(context()));
    function report(photo, state, custom = false) {
      const caption = document.getElementById('photoCredit'), description = document.getElementById('themeCurrent');
      const season = seasons.includes(preference) ? preference : state.season;
      if (caption) {
        caption.hidden = !photo;
        if (photo) { caption.href = photo.source; caption.textContent = 'Foto: MarAvel · ' + photo.title; caption.title = photo.title + ' — otevřít na Zoneramě'; }
      }
      if (description) description.textContent = custom ? 'Vybraná fotografie. Uloženo jen v tomto prohlížeči.' : `${labels[season]} · ${labels[state.period]}${photo ? ' — ' + photo.title : ''}`;
    }
    function paint(url, photo, state) {
      const targetKey = url + '|' + state.period;
      if (targetKey === requested) return;
      requested = targetKey;
      const request = ++serial, probe = new Image();
      probe.onload = () => {
        if (request !== serial) return;
        const next = active === layers[0] ? layers[1] : layers[0];
        next.src = url;
        next.style.objectPosition = photo ? (innerWidth <= 700 ? photo.mobilePosition || photo.position || '50% 50%' : photo.position || '50% 50%') : '50% 50%';
        next.hidden = false;
        document.body.dataset.daypart = state.period;
        document.body.dataset.season = seasons.includes(preference) ? preference : state.season;
        publishPalette(paletteFrom(probe, state));
        next.style.opacity = '1'; active.style.opacity = '0'; active = next;
        report(photo, state, !photo);
      };
      probe.onerror = () => {
        if (request !== serial) return;
        requested = '';
        const description = document.getElementById('themeCurrent');
        if (description) description.textContent = 'Fotku se nepodařilo načíst. Zůstává poslední dostupné pozadí.';
      };
      probe.src = url;
    }
    function refresh() {
      const state = context();
      const photo = choose(photos, state, preference, innerWidth <= 700);
      document.getElementById('greeting').textContent = greeting(state);
      if (/^data:image\/(jpeg|png|webp);base64,/.test(preference)) paint(preference, null, state);
      else if (['ranni_klid.jpg', 'vychod_slunce.jpg', 'klid_na_hladine.jpg'].includes(preference)) paint('/start/' + preference.replace('.jpg', '.webp'), null, state);
      else if (photo) paint(photo.src, photo, state);
    }
    function set(value) { preference = value; requested = ''; refresh(); }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    window.addEventListener('focus', refresh);
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { requested = ''; refresh(); }, 150); });
    setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000);
    return { set, refresh };
  }
  const api = { context, choose, greeting, create, labels };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MimoSeasonal = api;
})(typeof window !== 'undefined' ? window : globalThis);

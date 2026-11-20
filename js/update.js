// Neue Version erkennen: Die Xbox hält den Browser-Tab oft tagelang offen, dann läuft dort noch ein alter Stand (alte Grafik, alte
// Fehler). Alle zehn Minuten und beim Zurückkehren in den Tab wird index.html ohne Zwischenspeicher gelesen. Steht dort ein anderer
// Build, lädt das Spiel im Titelmenü sofort neu; mitten im Spiel kommt ein Hinweis, und neu geladen wird beim nächsten Titelmenü.
'use strict';
const Update = (() => {
  let ready = false, told = false, busy = false, lastCheck = 0;
  const mine = String(window.BUILD || '');
  const inMenu = () => typeof Game !== 'undefined' && (Game.state === 'title' || Game.state === 'options');
  const reload = () => { try { if (typeof Game !== 'undefined' && Game.saveResume) Game.saveResume(); } catch (e) { /* weiter */ } location.reload(); };
  async function check() {
    if (busy || !mine || /[?&]noupdate\b/.test(location.search)) return;
    if (!/^https?:/.test(location.protocol)) return;
    busy = true; lastCheck = Date.now();
    try {
      const r = await fetch('index.html?nc=' + Date.now(), { cache: 'no-store' });
      const m = r.ok && (await r.text()).match(/window\.BUILD = '([0-9-]+)'/);
      if (m && m[1] !== mine && m[1] > mine) ready = true;
    } catch (e) { /* offline: später nochmal */ }
    busy = false;
  }
  function tick() {
    if (!ready) { if (Date.now() - lastCheck > 600000) check(); return; }
    if (inMenu()) return reload();
    if (!told && typeof Game !== 'undefined' && Game.state === 'play' && Game.note) { told = true; Game.note('updateReady'); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastCheck > 60000) check(); });
  setTimeout(check, 20000);
  setInterval(tick, 2000);
  return { check, get ready() { return ready; } };
})();

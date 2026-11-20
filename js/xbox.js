// Grafikkarten-Neustart abfangen (gemeldet auf der Xbox): Unter Speicherdruck setzt der Browser seinen Grafikprozess zurück. Die
// sichtbare Leinwand zeichnet das Spiel ohnehin jedes Bild neu – aber einmal gebaute Puffer auf der Grafikkarte (Kulissen,
// Hintergründe, Schriftbilder) sind danach leer, der Hintergrund bliebe schwarz. Merkt eine Nebenleinwand den Verlust, sichert das
// Spiel den Fortsetzungspunkt und lädt sich neu (höchstens einmal pro Minute).
// Build 20261120-0233 hielt auf der Xbox stattdessen alle Nebenleinwände im Arbeitsspeicher. Danach schloss sich Edge beim Betreten
// des Kolosseums (auf der Xbox teilen sich Grafik und Arbeitsspeicher einen knappen Topf) – darum gibt es das nur noch zum Testen
// mit ?cpu2d.
'use strict';
const XboxSafe = (() => {
  const on = /[?&]cpu2d\b/.test(location.search);
  try { localStorage.removeItem('nachtmahr_cpu2d'); } catch (e) { /* privat */ } // alte Merkstelle von Build 0233
  let lost = 0, reloading = false; const lostList = [];
  const recover = () => {
    if (on || reloading) return;
    try { const last = +sessionStorage.getItem('nachtmahr.gpuReload') || 0; if (Date.now() - last < 60000) return; sessionStorage.setItem('nachtmahr.gpuReload', String(Date.now())); } catch (e) { return; }
    reloading = true;
    setTimeout(() => { try { if (typeof Game !== 'undefined' && Game.saveResume) Game.saveResume(); } catch (e) { /* weiter */ } location.reload(); }, 300);
  };
  if (typeof HTMLCanvasElement !== 'undefined') {
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, opts) {
      const side = type === '2d' && this.id !== 'screen';
      if (side && on && !(opts && opts.willReadFrequently)) opts = Object.assign({}, opts || {}, { willReadFrequently: true });
      const ctx = gc.call(this, type, opts);
      if (side && ctx && !this.__xb) {
        this.__xb = 1;
        this.addEventListener('contextlost', () => { lost++; if (lostList.length < 24) lostList.push(this.width + 'x' + this.height); recover(); });
      }
      return ctx;
    };
  }
  return { on, lostList, get lost() { return lost; }, get reloading() { return reloading; } };
})();

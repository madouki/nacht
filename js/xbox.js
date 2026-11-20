// Grafikkarten-Absturz abfangen (gemeldet auf der Xbox): Unter Speicherdruck setzt der Browser seinen Grafikprozess zurück. Die sichtbare
// Leinwand zeichnet das Spiel ohnehin jedes Bild neu – aber einmal gebaute Puffer auf der Grafikkarte (Kulissen, Hintergründe, 3D-Bilder
// der Bosse) sind danach leer, der Hintergrund bleibt schwarz. Abhilfe: auf der Xbox (zum Testen auch mit ?cpu2d) rechnen alle
// Nebenleinwände im Arbeitsspeicher, der bleibt bei einem Grafik-Neustart erhalten. Passiert es woanders, merkt sich das Spiel das
// und nutzt beim nächsten Start ebenfalls den Arbeitsspeicher.
'use strict';
const XboxSafe = (() => {
  const KEY = 'nachtmahr_cpu2d';
  let mem = false; try { mem = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const on = /xbox/i.test(navigator.userAgent) || /[?&]cpu2d\b/.test(location.search) || mem;
  let lost = 0; const lostList = [];
  if (typeof HTMLCanvasElement !== 'undefined') {
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, opts) {
      const side = type === '2d' && this.id !== 'screen';
      if (side && on && !(opts && opts.willReadFrequently)) opts = Object.assign({}, opts || {}, { willReadFrequently: true });
      const ctx = gc.call(this, type, opts);
      if (side && ctx && !this.__xb) {
        this.__xb = 1;
        this.addEventListener('contextlost', () => { lost++; if (lostList.length < 24) lostList.push(this.width + 'x' + this.height + (opts && opts.willReadFrequently ? ' wrf' : '')); try { localStorage.setItem(KEY, '1'); } catch (e) {} });
      }
      return ctx;
    };
  }
  return { on, lostList, get lost() { return lost; } };
})();

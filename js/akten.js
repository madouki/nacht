// HD-3D für die Aktenordner im Behördentrakt (Ordner in trakt.js) aus Blender (tools/blender/akten_bl.py, pack_akten.py): vier Farben,
// je zugeklappt (Rücken mit Etikett und Griffloch), halb und ganz aufgeklappt (Ringe als Zähne, rotes Auge). Ordner.draw nimmt diese
// Bilder, sobald Akten.S geladen ist; sonst bleibt die Pixelzeichnung.
'use strict';
const Akten = (() => {
  const MAP = {"akte0_closed":[0,0,28,36],"akte0_half":[29,0,28,36],"akte0_open":[58,0,28,36],"akte1_closed":[87,0,28,36],"akte1_half":[116,0,28,36],"akte1_open":[145,0,28,36],"akte2_closed":[174,0,28,36],"akte2_half":[203,0,28,36],"akte2_open":[232,0,28,36],"akte3_closed":[261,0,28,36],"akte3_half":[290,0,28,36],"akte3_open":[319,0,28,36]};
  const img = new Image(); let S = null;
  img.onload = () => {
    try {
      const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
      S = [0, 1, 2, 3].map(c => ({ closed: fr('akte' + c + '_closed'), half: fr('akte' + c + '_half'), open: fr('akte' + c + '_open') }));
    } catch (e) { console.error('akten3d', e); }
  };
  img.src = 'img/akten3d.png?v=' + (window.BUILD || '');
  return { MAP, get S() { return S; } };
})();

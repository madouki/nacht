// HD-3D für Holzpuppe (Gepäckträger am Bahnhof Krat, Puppe in castle.js) und Schaufensterpuppe (Mannequin in passage.js) aus
// Blender (tools/blender/puppen_bl.py, pack_puppen.py). Die Holzpuppe zeichnet ihre Bilder selbst, sobald Puppen.S da ist; bei der
// Schaufensterpuppe ersetzt der Atlas die im Code gemalten Posen (vier Kleider × sechs Posen). Lädt der Atlas nicht, bleibt alles
// beim Alten.
'use strict';
const Puppen = (() => {
  const MAP = {"holz_walk0":[0,0,30,38],"holz_walk1":[31,0,30,38],"holz_wind":[62,0,30,38],"holz_lunge":[93,0,30,38],"puppe0show":[124,0,32,42],"puppe0point":[157,0,32,42],"puppe0wave":[190,0,32,42],"puppe0shy":[223,0,32,42],"puppe0hip":[256,0,32,42],"puppe0reach":[289,0,32,42],"puppe1show":[322,0,32,42],"puppe1point":[355,0,32,42],"puppe1wave":[388,0,32,42],"puppe1shy":[421,0,32,42],"puppe1hip":[0,43,32,42],"puppe1reach":[33,43,32,42],"puppe2show":[66,43,32,42],"puppe2point":[99,43,32,42],"puppe2wave":[132,43,32,42],"puppe2shy":[165,43,32,42],"puppe2hip":[198,43,32,42],"puppe2reach":[231,43,32,42],"puppe3show":[264,43,32,42],"puppe3point":[297,43,32,42],"puppe3wave":[330,43,32,42],"puppe3shy":[363,43,32,42],"puppe3hip":[396,43,32,42],"puppe3reach":[429,43,32,42]};
  const img = new Image(); let S = null;
  const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
  img.onload = () => {
    try {
      const M = {}; for (let d = 0; d < 4; d++) for (const p of ['show', 'point', 'wave', 'shy', 'hip', 'reach']) M[d + p] = fr('puppe' + d + p);
      if (typeof Mannequin !== 'undefined') Mannequin.S = M;
      S = { walk: [fr('holz_walk0'), fr('holz_walk1')], wind: fr('holz_wind'), lunge: fr('holz_lunge'), mannequin: M };
    } catch (e) { console.error('puppen3d', e); }
  };
  img.src = 'img/puppen3d.png?v=' + (window.BUILD || '');
  return { MAP, get S() { return S; }, get ready() { return !!S; } };
})();

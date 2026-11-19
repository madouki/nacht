// HD-3D für die häufigsten Schlossgegner: Skelett, Eisskelett und Ritter aus Blender (tools/blender/knochen_bl.py, pack_knochen.py).
// Die bisherigen Figuren aus dem Rig (hero.js, Sprites.S.skel/skelThrow/knight sind dort Getter) werden nach dem Laden des Atlas
// ersetzt; der Ritter bekommt dazu eigene Bilder fürs Ausholen und den Ausfall, das Eisskelett eigene bereifte Knochen. Lädt der
// Atlas nicht, bleibt alles beim Alten.
'use strict';
const Knochen = (() => {
  const MAP = {"skel_walk0":[0,0,32,36],"skel_walk1":[33,0,32,36],"skel_throw":[66,0,32,36],"ice_walk0":[99,0,32,36],"ice_walk1":[132,0,32,36],"ice_throw":[165,0,32,36],"knight_walk0":[198,0,48,40],"knight_walk1":[247,0,48,40],"knight_wind":[296,0,48,40],"knight_thrust":[345,0,48,40]};
  const img = new Image(); let ok = false;
  const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
  const set = (k, v) => Object.defineProperty(Sprites.S, k, { configurable: true, enumerable: true, get: () => v, set() {} });
  img.onload = () => {
    try {
      set('skel', [fr('skel_walk0'), fr('skel_walk1')]); set('skelThrow', fr('skel_throw'));
      set('skelIce', [fr('ice_walk0'), fr('ice_walk1')]); set('skelIceThrow', fr('ice_throw'));
      set('knight', [fr('knight_walk0'), fr('knight_walk1'), fr('knight_wind'), fr('knight_thrust')]);
      ok = true;
    } catch (e) { console.error('knochen3d', e); }
  };
  img.src = 'img/knochen3d.png?v=' + (window.BUILD || '');
  return { MAP, get ready() { return ok; } };
})();

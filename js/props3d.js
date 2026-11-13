// Vorgerenderte Requisiten (Blender, tools/blender/props_bl.py) – ersetzen beim Laden die gezeichneten Kerzen und Fackeln;
// Standleuchter und Feuerschale nehmen ihre Bilder aus Sprites.S.props3d (bis zum Laden bleibt die alte Zeichnung).
// Lage im Spiel: Kerze 8×16 und Fackel 12×20 wie bisher; Standleuchter 28×58, der Kasten 24×48 liegt darin bei 2/10;
// Feuerschale 32×68, der Kasten 16×52 liegt darin bei 8/16. Dazu die Sammelgegenstände: Herzen, Geldsäcke, Braten, Kristallkugel.
'use strict';
(() => {
  const MAP = {"bagBig_0":[0,0,12,15],"bag_0":[13,0,12,15],"brazier_0":[26,0,32,68],"brazier_1":[59,0,32,68],"brazier_2":[92,0,32,68],"candelabra_0":[125,0,28,58],"candelabra_1":[154,0,28,58],"candle_0":[183,0,8,16],"candle_1":[192,0,8,16],"heartB_0":[201,0,14,12],"heartS_0":[216,0,8,8],"orb_0":[225,0,16,15],"orb_1":[242,0,16,15],"roast_0":[259,0,16,13],"torch_0":[276,0,12,20],"torch_1":[289,0,12,20]};
  const img = new Image();
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, false); };
    const seq = (p, n) => Array.from({ length: n }, (_, i) => fr(p + i));
    const S = Sprites.S;
    S.candle = seq('candle_', 2); S.torch = seq('torch_', 2);
    S.props3d = { candelabra: seq('candelabra_', 2), brazier: seq('brazier_', 3) };
    // Sammelgegenstände (tools/blender/items_bl.py), mit Kontur wie die gezeichneten
    const it = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S.heartS = it('heartS_0'); S.heartB = it('heartB_0'); S.bag = it('bag_0'); S.bagBig = it('bagBig_0'); S.roast = it('roast_0'); S.orb = [it('orb_0'), it('orb_1')];
  };
  img.src = 'img/props3d.png';
})();

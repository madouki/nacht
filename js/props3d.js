// Vorgerenderte Requisiten (Blender, tools/blender/props_bl.py) – ersetzen beim Laden die gezeichneten Kerzen und Fackeln;
// Standleuchter und Feuerschale nehmen ihre Bilder aus Sprites.S.props3d (bis zum Laden bleibt die alte Zeichnung).
// Lage im Spiel: Kerze 8×16 und Fackel 12×20 wie bisher; Standleuchter 28×58, der Kasten 24×48 liegt darin bei 2/10;
// Feuerschale 32×68, der Kasten 16×52 liegt darin bei 8/16.
'use strict';
(() => {
  const MAP = {"brazier_0":[0,0,32,68],"brazier_1":[33,0,32,68],"brazier_2":[66,0,32,68],"candelabra_0":[99,0,28,58],"candelabra_1":[128,0,28,58],"candle_0":[157,0,8,16],"candle_1":[166,0,8,16],"torch_0":[175,0,12,20],"torch_1":[188,0,12,20]};
  const img = new Image();
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, false); };
    const seq = (p, n) => Array.from({ length: n }, (_, i) => fr(p + i));
    const S = Sprites.S;
    S.candle = seq('candle_', 2); S.torch = seq('torch_', 2);
    S.props3d = { candelabra: seq('candelabra_', 2), brazier: seq('brazier_', 3) };
  };
  img.src = 'img/props3d.png';
})();

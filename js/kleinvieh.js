// HD-3D aus Blender (tools/blender/kleinvieh_bl.py, pack_kleinvieh.py) für kleines Getier, das bisher nur aus Rechtecken bestand:
// Hauptpoststelle – fliegender Brief (Papierflügel, Klappe, Kulleraugen), Nachnahme-Paket (schläft, wacht, schnappt mit den
// Deckeln nach außen auf), Schiebepaket in vier Markenfarben; versunkene Kapelle – Qualle (zwei Schwimmbilder, ein Pulsbild);
// Mond – Mondkalb (steht, duckt sich, springt); Kerzen-Mimik (Maul zu, zwei Bilder mit Maul auf und tippelnden Beinchen).
// Die Gegner in post.js, castle.js, mond.js und kunst.js nehmen diese Bilder, sobald Kleinvieh.S geladen ist; sonst bleibt die Pixelzeichnung.
'use strict';
const Kleinvieh = (() => {
  const MAP = {"brief_up":[0,0,24,18],"brief_down":[25,0,24,18],"nach_sleep":[50,0,36,36],"nach_wake":[87,0,36,36],"nach_open":[124,0,36,36],"paket0":[161,0,32,32],"paket1":[194,0,32,32],"paket2":[227,0,32,32],"paket3":[260,0,32,32],"qualle_a":[293,0,20,24],"qualle_b":[314,0,20,24],"qualle_sq":[335,0,20,24],"kalb_idle":[356,0,24,22],"kalb_squash":[381,0,24,22],"kalb_air":[406,0,24,22],"mimik_shut":[431,0,20,30],"mimik_open_a":[452,0,20,30],"mimik_open_b":[473,0,20,30]};
  const img = new Image(); let S = null;
  img.onload = () => {
    try {
      const fr = (n, ol = true) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, ol); };
      S = {
        brief: { up: fr('brief_up'), down: fr('brief_down') },
        nach: { sleep: fr('nach_sleep'), wake: fr('nach_wake'), open: fr('nach_open') },
        paket: [0, 1, 2, 3].map(c => fr('paket' + c, false)),
        qualle: { a: fr('qualle_a'), b: fr('qualle_b'), sq: fr('qualle_sq') },
        kalb: { idle: fr('kalb_idle'), squash: fr('kalb_squash'), air: fr('kalb_air') },
        mimik: { shut: fr('mimik_shut'), open_a: fr('mimik_open_a'), open_b: fr('mimik_open_b') },
      };
    } catch (e) { console.error('kleinvieh', e); }
  };
  img.src = 'img/kleinvieh3d.png?v=' + (window.BUILD || '');
  return { MAP, get S() { return S; } };
})();

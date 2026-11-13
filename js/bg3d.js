// Vorgerenderte Hintergrundebenen aus Blender (tools/blender/crypt_bg_bl.py, pack_bg.py). Der Hintergrundbau in tiles.js meldet
// sich mit BG3D.on(thema, fn) an; fn bekommt die Bilder als Canvas, sobald alle geladen sind – auch nachträglich. Bis dahin
// (und falls ein Bild fehlt) bleibt der gezeichnete Hintergrund stehen.
'use strict';

const BG3D = (() => {
  const SRC = { crypt: { wall: 'img/bg/crypt_wall.png', far: 'img/bg/crypt_far.png' } }; // je 512×208, nahtlos kachelbar
  const got = {}, subs = {};
  const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; };
  for (const theme in SRC) {
    const names = Object.keys(SRC[theme]), set = {};
    let left = names.length;
    for (const n of names) {
      const img = new Image();
      img.onload = () => { set[n] = canvasOf(img); if (--left === 0) { got[theme] = set; (subs[theme] || []).forEach(fn => fn(set)); subs[theme] = null; } };
      img.src = SRC[theme][n];
    }
  }
  return {
    on(theme, fn) { if (got[theme]) fn(got[theme]); else if (SRC[theme]) (subs[theme] || (subs[theme] = [])).push(fn); },
    ready: (theme) => !!got[theme],
  };
})();

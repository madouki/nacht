// Dasselbe gegossene Wappen hängt an der Fockrah und erscheint im Namensband des Kraken.
'use strict';
const Tiefenauge = (() => {
  const frames = {};
  function draw(ctx, cx, cy, size, awake) {
    if (!frames.zu) {
      for (const state of ['zu', 'offen']) {
        const image = new Image();
        frames[state] = { image, sizes: new Map() };
        image.src = 'img/tiefenauge_' + state + '.png?v=' + window.BUILD;
      }
    }
    const {image, sizes} = frames[awake ? 'offen' : 'zu'];
    if (!image.complete || !image.naturalWidth) return false;
    if (!sizes.has(size)) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(image, 0, 0, size, size);
      sizes.set(size, c);
    }
    ctx.drawImage(sizes.get(size), Math.round(cx - size / 2), Math.round(cy - size / 2));
    return true;
  }
  return { draw };
})();

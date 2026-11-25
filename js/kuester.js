// Küster Ruprecht (Figur auf dem Vorplatz der Sonnenkathedrale): ihm sind die Klingelbeutel ausgeflogen (js/beutel.js). Auftrag:
// drei Klingelbeutel auf der Flucht erwischen (Castle.flags.beutel_n), Lohn: der Sammelteller und Gold (Szenen in castle.js, BEATS).
// Bild: tools/blender/kuester_bl.py (zwei Bilder: ruhig, klagend erhobene Hand), 40×48, Füße bei (20, 48).
'use strict';
const KUESTER3D = (() => {
  const MAP = {"kuester0":[0,0,40,48],"kuester1":[41,0,40,48]};
  const C = {}, img = new Image();
  img.onload = () => { for (const [n, r] of Object.entries(MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  img.src = 'img/kuester3d.png?v=' + (window.BUILD || '');
  return {
    MAP, get ready() { return !!C.kuester0; },
    draw(ctx, n, x, feet, flip) { const c = C[n]; if (!c) return false; ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); if (flip) ctx.scale(-1, 1); ctx.drawImage(c, -20, -48); ctx.restore(); return true; },
  };
})();
function drawKuester(ctx, cx, feet, t, flip) { // ab und zu hebt er klagend die Hand
  if (KUESTER3D.draw(ctx, 'kuester' + ((t % 220) < 44 ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-6, -30, 12, 30, '#1c1c24'); R(-4, -38, 8, 8, '#e8b088'); R(-1, -29, 3, 3, '#f4f4f0'); R(5, -40, 1, 34, '#6c4424'); // Ersatzbild, bis das Blender-Bild geladen ist
}

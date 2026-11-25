// Wahrsageautomat „Madame Mystika“ (Hotel-Lobby, unter der Galerie): davor ↑ drücken, 300 Gold einwerfen. Großansicht: die
// Automatenfrau hebt die Hände über die Kristallkugel, die Kugel glüht, eine Karte fährt aus dem Schlitz. Sie verrät, wo noch
// etwas wartet (Lebensgefäß, unbesiegter Nebenboss, nie betretener Zusatzraum – Castle.prophecy), und der Ort leuchtet auf der
// Karte violett, bis er gefunden ist. Dazu eine Weissagung mit Augenzwinkern. Ist alles gefunden: Geld zurück.
// Bilder: tools/blender/orakel_bl.py → pack_orakel.py (Raum 40×64, Füße unten; Nahaufnahme 160×120). Spielzustand 'orakel' (game.js)
'use strict';
const ORAKEL3D = (() => {
  const MAP = {"orakel0":[0,0,40,64],"orakel1":[41,0,40,64],"orakelNah0":[82,0,160,120],"orakelNah1":[243,0,160,120]};
  const C = {}, img = new Image();
  img.onload = () => { for (const [n, r] of Object.entries(MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  img.src = 'img/orakel3d.png?v=' + (window.BUILD || '');
  return { MAP, get ready() { return !!C.orakel0; }, get(n) { return C[n]; } };
})();
const Orakel = (() => {
  const COST = 300, JOKES = 6;
  let G = null;
  function start() {
    const p = Castle.prophecy(), f = Castle.flags;
    W.score -= COST;
    G = { t: 0, p, joke: 1 + Math.floor(Math.random() * JOKES), refund: !p };
    if (p) Castle.orakelSet(p); else W.score += COST;                       // nichts mehr zu finden: Geld zurück
    f.orakel_n = (f.orakel_n || 0) + 1; Castle.setFlag('orakel_seen');      // setFlag speichert mit
    Audio8.sfx('ding'); Audio8.sfx('orb'); Game.go('orakel');
  }
  function input(P) {
    if (!G) return true;
    G.t++;
    if (G.t === 50) Audio8.sfx('holy');
    if (G.t === 96) { Audio8.sfx('latch'); Audio8.sfx('chest'); }
    if (G.t > 130 && (P.jump || P.attack || P.start)) { G = null; Audio8.sfx('select'); return true; }
    return false;
  }
  const what = (p) => tr('orakel_' + p.kind, p.kind === 'mini' ? tr(p.name) : '');
  function draw(ctx, t) {
    if (!G) return;
    const w = View.w, cx = View.cx, k = G.t;
    ctx.fillStyle = '#0c0410'; ctx.fillRect(0, 0, w, 240);
    const bg = ctx.createRadialGradient(cx, 90, 10, cx, 90, 220); bg.addColorStop(0, 'rgba(92,28,108,0.55)'); bg.addColorStop(1, 'rgba(12,4,16,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, 240);
    // die Automatenfrau in der Vitrine (ab Bild 40 in Trance: Hände über der Kugel, Augen leuchten)
    const trance = k > 40 && (k < 100 || (t >> 4) % 6 !== 0), im = ORAKEL3D.get(trance ? 'orakelNah1' : 'orakelNah0');
    const sc = Math.min(1.5, (w - 16) / 160), iw = Math.round(160 * sc), ih = Math.round(120 * sc), ix = Math.round(cx - iw / 2), iy = 4;
    if (im) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, ix, iy, iw, ih); ctx.imageSmoothingEnabled = false; }
    const bx = cx, by = iy + 88.4 * sc, pulse = trance ? 0.32 + 0.14 * Math.sin(t * 0.21) : 0.1 + 0.04 * Math.sin(t * 0.08);
    const gl = ctx.createRadialGradient(bx, by, 2, bx, by, 21 * sc); gl.addColorStop(0, 'rgba(200,160,255,' + pulse.toFixed(2) + ')'); gl.addColorStop(1, 'rgba(120,60,200,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bx, by, 21 * sc, 0, Math.PI * 2); ctx.fill();
    if (trance) for (let i = 0; i < 5; i++) { const a = t * 0.05 + i * 1.256, r = 20 * sc + Math.sin(t * 0.1 + i) * 4; ctx.fillStyle = 'rgba(220,190,255,0.7)'; ctx.fillRect(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r * 0.5), 2, 2); } // Funken um die Kugel
    ctx.restore();
    Font.draw(ctx, tr('orakelTitel'), cx, iy + ih + 3 > 200 ? 196 : iy + ih + 3, '#e0b8f8', { align: 'center', shadow: '#000' });
    if (k < 96) { if (k > 20) Font.draw(ctx, tr('orakelSieht'), cx, 212, (t >> 3) & 1 ? '#c8a0e8' : '#a880c8', { align: 'center', shadow: '#000' }); return; }
    // die Karte fährt aus dem Schlitz
    const cw = Math.min(w - 12, 300), tw = cw - 16, rows = [];
    if (G.p) {
      Duell.wrap(what(G.p), tw).forEach(l => rows.push([l, '#5c1c08']));
      Duell.wrap(tr('orakelWo', G.p.where), tw).forEach(l => rows.push([l, '#1c1410']));
      Duell.wrap(tr('orakelKarte'), tw).forEach(l => rows.push([l, '#5c2c84']));
    } else Duell.wrap(tr('orakelLeer'), tw).forEach(l => rows.push([l, '#1c1410']));
    Duell.wrap(tr('orakelJ' + G.joke), tw).forEach(l => rows.push([l, '#6c5c48']));
    const ch = rows.length * 10 + 12, slide = Math.min(1, (k - 96) / 24), cy = Math.round(240 - 4 - ch * slide), x0 = Math.round(cx - cw / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x0 + 3, cy + 3, cw, ch);
    ctx.fillStyle = '#efe0c0'; ctx.fillRect(x0, cy, cw, ch); ctx.fillStyle = '#c8a870'; ctx.fillRect(x0, cy, cw, 1); ctx.fillRect(x0, cy + ch - 1, cw, 1); ctx.fillRect(x0, cy, 1, ch); ctx.fillRect(x0 + cw - 1, cy, 1, ch);
    ctx.fillStyle = '#b08850'; for (let x = x0 + 4; x < x0 + cw - 4; x += 6) { ctx.fillRect(x, cy + 3, 3, 1); ctx.fillRect(x, cy + ch - 4, 3, 1); } // Zierkante
    rows.forEach(([l, c], i) => Font.draw(ctx, l, cx, cy + 7 + i * 10, c, { align: 'center' }));
    if (k > 130 && cy + ch < 238) Font.draw(ctx, tr('budeWeiter'), cx, Math.max(4, cy - 11), (t >> 4) & 1 ? '#fcfcfc' : '#8c8c9c', { align: 'center', shadow: '#000' });
  }
  // ---------------- der Automat im Raum ----------------
  class Machine extends Ent {
    constructor(d) { super(d.x * T, (d.y + 1) * T - 64, 40, 64); this.kind = 'prop'; this.d = d; }
    update() {
      this.t++; const p = W.player;
      if (!p.alive || p.state !== 'normal' || !p.onGround || Math.abs(p.cx - this.cx) > 22 || Math.abs(p.feet - (this.y + this.h)) > 4 || Game.state !== 'play') return;
      if (W.score < COST) { pzSay('orakelArm'); return; }
      pzSay('orakelIn', COST);
      if (Input.pressed.up) start();
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), t = this.t;
      if (sx < -48 || sx > View.w + 8) return;
      const glow = (t % 300) > 250, im = ORAKEL3D.get(glow ? 'orakel1' : 'orakel0');
      if (im) ctx.drawImage(im, sx, sy);
      else { ctx.fillStyle = '#4a2414'; ctx.fillRect(sx + 4, sy + 34, 32, 30); ctx.fillStyle = '#4c1040'; ctx.fillRect(sx + 5, sy + 8, 30, 26); ctx.fillStyle = '#9c70ff'; ctx.fillRect(sx + 17, sy + 24, 6, 6); } // Ersatzbild
      const a = glow ? 0.5 : 0.18 + 0.08 * Math.sin(t * 0.06); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = '#9c70ff'; ctx.beginPath(); ctx.arc(sx + 20, sy + 27.5, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    lightUp(L, cx, cy) { L.push({ x: this.x + 20 - cx, y: this.y + 27 - cy, r: 34, c: [180, 120, 255], a: 0.3 }); }
  }
  return { start, input, draw, Machine, make: (d) => new Machine(d), get game() { return G; }, COST };
})();

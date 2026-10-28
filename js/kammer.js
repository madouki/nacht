// Speicher- und Warpkammern (Schloss-Modus): kleine Kapellen unter einem filigranen Kreuzrippengewölbe – die Kappen ein
// Sternenhimmel, die Rippen mit Goldfilet und Nasenbesatz, goldene Schlusssteine, Dienstbündel mit Blattkapitellen, in der
// Schildwand ein großes Rosenfenster, durch das ein Lichtschacht senkrecht auf die Mitte fällt. Dort steht in der Speicherkammer
// der Brunnen als Ort der Rast (drei Schalen, Kaskaden, leuchtendes Wasser, Kerzenständer, aufsteigende Lichter – wer ankommt,
// speichert, und das Wasser flammt auf; ein Bronzefrosch spuckt aus Prinzip ins Becken), in der Warpkammer schwebt das Portal:
// eine wabernde Kugel in PS2-3D über einem Runenkreis, von Ringen umkreist. Steinfarben nach Region; das Gewölbe wird einmal gemalt.
'use strict';

class ChamberHall extends Ent {
  constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; this.cache = null; this.nb = d.bays || 0; } // bays: 1 = ein großes Mitteljoch
  // Steinfarben je Region (dunkel, mittel, hell, Licht), Kappen (Nachtblau), Gold
  static pal(theme) {
    const S = {
      cave: ['#201a16', '#3a2f28', '#5a4a3e', '#7c6a58'], library: ['#2a1e14', '#4c3824', '#705638', '#98784c'],
      tower: ['#1c1e26', '#343844', '#545a6a', '#767e90'], cathedral: ['#3c3430', '#6c625a', '#a09484', '#d0c4b0'],
      expo: ['#1c2a24', '#3a5248', '#5e7c6e', '#8cac9c'], throne: ['#24101a', '#42202e', '#643448', '#8c4c64'],
      crypt: ['#181c24', '#2c3240', '#48505e', '#6a7282'], hall: ['#2a2014', '#4a3a24', '#6c5638', '#94784c'],
    }[theme] || ['#1c1e26', '#343844', '#545a6a', '#767e90'];
    const cell = theme === 'throne' ? ['#14081e', '#2a1446'] : theme === 'cathedral' ? ['#141c48', '#26347a'] : theme === 'expo' ? ['#0a1c24', '#163a48'] : ['#0c1030', '#1a2256'];
    return { s: S, cell, gold: ['#a87818', '#e8b848', '#fce0a8'] };
  }
  static pc(theme) { const s = ChamberHall.pal(theme).s; return { deep: s[0], mid: s[1], light: s[3], joint: s[0] }; } // Farben für die Nische (castle.js)
  update() { this.t++; }
  draw() { }
  bays() { const Wr = W.room.w * T, n = this.nb || Math.max(1, Math.round(Wr / 128)), w = Wr / n; return [...Array(n)].map((_, i) => ({ x0: i * w, x1: (i + 1) * w, cx: (i + 0.5) * w })); }
  lightUp(L, cx, cy) { const F = (W.room.h - 2) * T; for (const b of this.bays()) L.push({ x: b.cx - cx, y: F - 106 - cy, r: 30, c: [150, 170, 255], a: 0.22 }); }
  drawBack(ctx) {
    const R = W.room, key = R.theme + R.w + 'x' + R.h + '/' + this.nb;
    if (!this.cache || this.cache.key !== key) this.cache = { key, c: ChamberHall.paint(R, this.nb) };
    const ox = -Math.round(W.cam.x), oy = -Math.round(W.cam.y), F = (R.h - 2) * T, t = this.t;
    ctx.drawImage(this.cache.c, ox, oy);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of this.bays()) { // Mondlicht durch die Rosenfenster: Glut im Glas und ein schräger Lichtschacht bis zum Boden
      const rx = ox + b.cx, ry = oy + F - 106, a = 0.16 + 0.05 * Math.sin(t * 0.021 + b.cx);
      const g = ctx.createRadialGradient(rx, ry, 2, rx, ry, 22); g.addColorStop(0, `rgba(170,190,255,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(120,140,255,0)');
      ctx.fillStyle = g; ctx.fillRect(rx - 22, ry - 22, 44, 44);
      const sh = ctx.createLinearGradient(0, ry, 0, oy + F); sh.addColorStop(0, `rgba(150,160,255,${(a * 0.5).toFixed(3)})`); sh.addColorStop(1, 'rgba(150,160,255,0)');
      ctx.fillStyle = sh; ctx.beginPath();
      if (this.nb === 1) { ctx.moveTo(rx - 14, ry + 10); ctx.lineTo(rx + 14, ry + 10); ctx.lineTo(rx + 46, oy + F); ctx.lineTo(rx - 46, oy + F); } // senkrecht auf die Mitte (Brunnen, Portal)
      else { ctx.moveTo(rx - 9, ry + 6); ctx.lineTo(rx + 9, ry + 6); ctx.lineTo(rx + 34, oy + F); ctx.lineTo(rx + 2, oy + F); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // ---------------- einmal malen: Mauer, Blendarkade, Dienste, Gewölbe, Rosenfenster ----------------
  static paint(R, nb) {
    const Wr = R.w * T, F = (R.h - 2) * T, P = ChamberHall.pal(R.theme), S = P.s, G = P.gold, SPR = F - 80; // Kämpferlinie
    const c = document.createElement('canvas'); c.width = Wr; c.height = F; const x = c.getContext('2d');
    const hash = (i) => { let h = (i * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h >>> 8) / 16777216; };
    // Quadermauerwerk
    x.fillStyle = S[1]; x.fillRect(0, 0, Wr, F);
    for (let y = 0, row = 0; y < F; y += 12, row++) for (let bx = (row % 2) ? -12 : 0; bx < Wr; bx += 24) {
      x.fillStyle = S[0]; x.fillRect(bx, y, 24, 1); x.fillRect(bx, y, 1, 12);
      x.fillStyle = S[2]; x.fillRect(bx + 1, y + 1, 22, 1);
      if (hash(row * 31 + bx) < 0.25) { x.fillStyle = S[0]; x.fillRect(bx + 4 + Math.floor(hash(bx + row) * 14), y + 4 + Math.floor(hash(row + bx * 3) * 5), 2, 1); }
    }
    // Sockelzone mit Blendarkade aus Kleeblattbögen
    const DY = F - 34;
    x.fillStyle = S[0]; x.fillRect(0, DY, Wr, F - DY); x.fillStyle = S[1]; x.fillRect(0, DY + 3, Wr, F - DY - 3);
    x.fillStyle = S[3]; x.fillRect(0, DY, Wr, 1); x.fillStyle = S[2]; x.fillRect(0, DY + 1, Wr, 1);
    for (let ax = 2; ax < Wr; ax += 14) {
      x.fillStyle = S[0]; x.beginPath(); x.arc(ax + 6, DY + 11, 5, Math.PI, 0); x.lineTo(ax + 11, F - 3); x.lineTo(ax + 1, F - 3); x.closePath(); x.fill();
      x.fillStyle = S[1]; for (const dx of [-3, 3]) { x.beginPath(); x.arc(ax + 6 + dx, DY + 11, 2, Math.PI, 0); x.fill(); } // Nasen des Kleeblatts
      x.strokeStyle = S[2]; x.lineWidth = 1; x.beginPath(); x.arc(ax + 6.5, DY + 11.5, 5.5, Math.PI, 0); x.stroke();
      x.fillStyle = S[3]; x.fillRect(ax + 13, DY + 4, 1, F - DY - 7); // Säulchen
    }
    // Gewölbe je Joch
    const rib = (pts, w, col, hi, gold) => { // Rippe: Schatten, Körper, Lichtkante, Goldfilet aus Punkten
      const path = () => { x.beginPath(); x.moveTo(pts[0], pts[1]); if (pts.length === 4) x.lineTo(pts[2], pts[3]); else x.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); };
      x.lineCap = 'round';
      x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = w + 2; path(); x.stroke();
      x.strokeStyle = col; x.lineWidth = w; path(); x.stroke();
      x.save(); x.translate(-0.6, -0.6); x.strokeStyle = hi; x.lineWidth = 1; path(); x.stroke(); x.restore();
      if (gold) { x.setLineDash([1, 3]); x.strokeStyle = G[1]; x.lineWidth = 1; path(); x.stroke(); x.setLineDash([]); }
    };
    const quad = (p0, p1, p2, u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]];
    const n = nb || Math.max(1, Math.round(Wr / 128)), bw = Wr / n, AP = SPR - 52; // Scheitel der Schildbögen
    for (let b = 0; b < n; b++) {
      const x0 = b * bw, x1 = x0 + bw, cx = x0 + bw / 2, a = 9;
      const shield = () => { x.moveTo(x0 + a, SPR); x.quadraticCurveTo(x0 + a, AP + (SPR - AP) * 0.3, cx, AP); x.quadraticCurveTo(x1 - a, AP + (SPR - AP) * 0.3, x1 - a, SPR); };
      // Kappen: Sternenhimmel über dem Schildbogen (die Schildwand darunter bleibt Mauer)
      x.save(); x.beginPath(); x.rect(x0, 0, bw, SPR); shield(); x.closePath(); x.clip('evenodd');
      const g = x.createRadialGradient(cx, 22, 4, cx, 40, bw * 0.75); g.addColorStop(0, P.cell[1]); g.addColorStop(1, P.cell[0]);
      x.fillStyle = g; x.fillRect(x0, 0, bw, SPR);
      for (let i = 0; i < 46; i++) { // goldene Sterne
        const sx = Math.floor(x0 + 4 + hash(b * 97 + i) * (bw - 8)), sy = Math.floor(2 + hash(b * 131 + i * 7) * (SPR - 6)), big = hash(i * 17 + b) < 0.18;
        x.fillStyle = big ? G[2] : G[1]; x.fillRect(sx, sy, 1, 1);
        if (big) { x.fillStyle = G[0]; x.fillRect(sx - 1, sy, 1, 1); x.fillRect(sx + 1, sy, 1, 1); x.fillRect(sx, sy - 1, 1, 1); x.fillRect(sx, sy + 1, 1, 1); }
      }
      x.restore();
      // Kreuzrippen: von den Kapitellen hinten steil hinauf, über dem Joch gekreuzt, oben zum Betrachter hin aus dem Bild
      const A0 = [x0 + 8, SPR - 1], A1 = [x0 + 20, 26], A2 = [x1 - 2, -10], B0 = [x1 - 8, SPR - 1], B1 = [x1 - 20, 26], B2 = [x0 + 2, -10];
      let boss = [cx, 30], best = 1e9;
      for (let u = 0; u <= 1; u += 0.002) { const p = quad(A0, A1, A2, u); if (Math.abs(p[0] - cx) < best) { best = Math.abs(p[0] - cx); boss = p; } }
      rib([x0 + 12, boss[1] + 2, cx, boss[1] - 3, x1 - 12, boss[1] + 2], 2, S[2], S[3], false); // Scheitelrippe
      rib([...A0, ...A1, ...A2], 3, S[3], '#ffffff', true); rib([...B0, ...B1, ...B2], 3, S[3], '#ffffff', true);
      // Schildbogen mit Nasenbesatz (kleine Dreipässe an der Innenseite)
      x.save(); x.beginPath(); shield(); x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 6; x.stroke(); x.strokeStyle = S[2]; x.lineWidth = 4; x.stroke(); x.strokeStyle = S[3]; x.lineWidth = 1; x.stroke(); x.restore();
      for (let k = 1; k < 12; k++) {
        const u = k / 12, L = u < 0.5, v = L ? u * 2 : (u - 0.5) * 2;
        const p = L ? quad([x0 + a, SPR], [x0 + a, AP + (SPR - AP) * 0.3], [cx, AP], v) : quad([cx, AP], [x1 - a, AP + (SPR - AP) * 0.3], [x1 - a, SPR], v);
        const dx = cx - p[0], dy = (SPR - 20) - p[1], l = Math.hypot(dx, dy) || 1;
        x.fillStyle = S[2]; x.beginPath(); x.arc(p[0] + dx / l * 3.5, p[1] + dy / l * 3.5, 1.8, 0, Math.PI * 2); x.fill();
        x.fillStyle = G[1]; x.fillRect(Math.round(p[0] + dx / l * 3.5), Math.round(p[1] + dy / l * 3.5), 1, 1);
      }
      // Rosenfenster in der Schildwand: Steinring, acht Glasblätter, Maßwerkspeichen, Vierpass in der Mitte
      const rr = n === 1 ? 21 : 13, k = rr / 13, rx = cx, ry = F - 106 - (n === 1 ? 4 : 0), GL = ['#2c3c9c', '#9c2c4c', '#2c3c9c', '#c8901c'];
      x.fillStyle = S[0]; x.beginPath(); x.arc(rx, ry, rr + 3, 0, Math.PI * 2); x.fill();
      x.fillStyle = S[3]; x.beginPath(); x.arc(rx, ry, rr + 2, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#0c0a18'; x.beginPath(); x.arc(rx, ry, rr, 0, Math.PI * 2); x.fill();
      for (let i = 0; i < 8; i++) {
        const an = i / 8 * Math.PI * 2;
        x.fillStyle = GL[i % 4]; x.beginPath(); x.arc(rx + Math.cos(an) * 8 * k, ry + Math.sin(an) * 8 * k, 4.2 * k, 0, Math.PI * 2); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(Math.round(rx + Math.cos(an) * 8 * k - 1), Math.round(ry + Math.sin(an) * 8 * k - 2), 1, 1);
      }
      x.strokeStyle = S[3]; x.lineWidth = 1;
      for (let i = 0; i < 8; i++) { const an = (i + 0.5) / 8 * Math.PI * 2; x.beginPath(); x.moveTo(rx + Math.cos(an) * 4 * k, ry + Math.sin(an) * 4 * k); x.lineTo(rx + Math.cos(an) * rr, ry + Math.sin(an) * rr); x.stroke(); }
      x.fillStyle = '#e8c048'; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) { x.beginPath(); x.arc(rx + dx * k, ry + dy * k, 1.8 * k, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = '#fff4d0'; x.fillRect(rx, ry, 1, 1);
      // Schlussstein: goldene Rosette mit acht Blättern und rotem Kern, darunter ein kleiner Zapfen
      const [bx, by] = boss;
      x.fillStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.arc(bx + 1, by + 1, 6.5, 0, Math.PI * 2); x.fill();
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; x.fillStyle = i % 2 ? G[0] : G[1]; x.beginPath(); x.arc(bx + Math.cos(an) * 3.6, by + Math.sin(an) * 3.6, 2.4, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = G[2]; x.beginPath(); x.arc(bx, by, 2.2, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c8203c'; x.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 2, 2);
      x.fillStyle = G[0]; x.fillRect(Math.round(bx), Math.round(by) + 6, 1, 3); x.fillStyle = G[2]; x.fillRect(Math.round(bx), Math.round(by) + 9, 1, 1);
    }
    // Gurtbögen und Dienstbündel an jedem Pfeiler (die äußeren halb im Bild)
    for (let i = 0; i <= n; i++) {
      const px = Math.round(i * bw);
      // Gurtbogen: kommt von hinten auf den Betrachter zu, wird nach oben breiter
      x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.moveTo(px - 6, SPR); x.lineTo(px + 6, SPR); x.lineTo(px + 10, 0); x.lineTo(px - 10, 0); x.closePath(); x.fill();
      x.fillStyle = S[2]; x.beginPath(); x.moveTo(px - 5, SPR); x.lineTo(px + 5, SPR); x.lineTo(px + 9, 0); x.lineTo(px - 9, 0); x.closePath(); x.fill();
      x.fillStyle = S[3]; x.beginPath(); x.moveTo(px - 5, SPR); x.lineTo(px - 3, SPR); x.lineTo(px - 6, 0); x.lineTo(px - 9, 0); x.closePath(); x.fill();
      x.setLineDash([1, 3]); x.strokeStyle = G[1]; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 0.5, SPR); x.lineTo(px + 0.5, 0); x.stroke(); x.setLineDash([]);
      // Dienstbündel: Mittelschaft, zwei Säulchen, Schaftringe, Sockel
      x.fillStyle = S[0]; x.fillRect(px - 9, SPR, 18, F - SPR);
      x.fillStyle = S[2]; x.fillRect(px - 4, SPR, 8, F - SPR); x.fillStyle = S[3]; x.fillRect(px - 4, SPR, 2, F - SPR); x.fillStyle = S[1]; x.fillRect(px + 3, SPR, 1, F - SPR);
      for (const s of [-1, 1]) { x.fillStyle = S[3]; x.fillRect(px + s * 6 - 1, SPR, 3, F - SPR); x.fillStyle = S[2]; x.fillRect(px + s * 6 + (s > 0 ? 1 : -1), SPR, 1, F - SPR); }
      for (const ry of [SPR + 34, F - 40]) { x.fillStyle = G[0]; x.fillRect(px - 8, ry, 16, 2); x.fillStyle = G[2]; x.fillRect(px - 8, ry, 16, 1); }
      x.fillStyle = S[0]; x.fillRect(px - 11, F - 10, 22, 10); x.fillStyle = S[2]; x.fillRect(px - 10, F - 9, 20, 8); x.fillStyle = S[3]; x.fillRect(px - 10, F - 9, 20, 1);
      // Kapitell mit goldenen Blattknospen und Deckplatte
      x.fillStyle = S[0]; x.fillRect(px - 12, SPR - 3, 24, 4); x.fillStyle = S[3]; x.fillRect(px - 12, SPR - 3, 24, 1);
      x.fillStyle = S[2]; x.beginPath(); x.moveTo(px - 11, SPR + 1); x.lineTo(px + 11, SPR + 1); x.lineTo(px + 6, SPR + 10); x.lineTo(px - 6, SPR + 10); x.closePath(); x.fill();
      for (const lx of [-8, -3, 2, 7]) { x.fillStyle = G[0]; x.fillRect(px + lx, SPR + 2, 2, 3); x.fillStyle = G[2]; x.fillRect(px + lx, SPR + 2, 1, 1); x.fillStyle = G[1]; x.fillRect(px + lx + 1, SPR + 5, 1, 2); }
    }
    return c;
  }
}

class ChamberFountain extends Ent { // d: { x (Mitte, Kacheln, auch halbe), big: Ort der Rast in der Speicherkammer }
  constructor(d) { super(d.x * T - 36, 0, 72, 1); this.kind = 'prop'; this.fx = Math.round(d.x * T); this.spit = 0; this.blink = 0; this.big = !!d.big; this.motes = []; }
  update() {
    this.t++;
    const near = Math.abs(W.player.cx - this.fx) < View.w;
    if (near && this.t % 23 === 0) Audio8.drip(this.fx, 0.28 + 0.12 * Math.random()); // Plätschern
    if (this.spit > 0) this.spit--; else if (Math.random() < 0.005) { this.spit = 54; if (near) Audio8.drip(this.fx + 22, 0.6); } // der Frosch spuckt
    if (this.blink > 0) this.blink--; else if (Math.random() < 0.01) this.blink = 8;
  }
  flare() { const c = W.ents.find(e => e.c && e.c.kind === 'save' && e.pulse !== undefined); return c ? c.pulse : 0; } // gerade gespeichert: das Wasser flammt auf
  lightUp(L, cx, cy) {
    const F = (W.room.h - 2) * T;
    if (this.big) { const f = this.flare(); L.push({ x: this.fx - cx, y: F - 46 - cy, r: 84 + f, c: [140, 220, 255], a: 0.42 + f / 80 }); for (const s of [-1, 1]) L.push({ x: this.fx + s * 66 - cx, y: F - 58 - cy, r: 34, c: [252, 200, 130], a: 0.4 }); return; }
    L.push({ x: this.fx - cx, y: F - 40 - cy, r: 58, c: [120, 200, 255], a: 0.3 });
  }
  draw() { }
  drawBack(ctx) {
    if (this.big) return this.drawBig(ctx);
    const P = ChamberHall.pal(W.room.theme), S = P.s, G = P.gold, t = this.t;
    const cx = this.fx - Math.round(W.cam.x), F = (W.room.h - 2) * T - Math.round(W.cam.y);
    if (cx < -60 || cx > View.w + 60) return;
    // Lichtspiel des Wassers auf der Wand dahinter
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const wx = cx + Math.sin(t * 0.017 + i * 1.7) * 30, wy = F - 70 + Math.sin(t * 0.023 + i * 2.3) * 22, r = 6 + (i % 3) * 3;
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, r); g.addColorStop(0, 'rgba(120,210,255,0.10)'); g.addColorStop(1, 'rgba(120,210,255,0)');
      ctx.fillStyle = g; ctx.fillRect(wx - r, wy - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, F - 1, 38, 3, 0, 0, Math.PI * 2); ctx.fill(); // Schatten
    // Becken: Vorderseite mit drei Maßwerkfeldern, Seitenflächen, Rand
    const bl = cx - 32, br = cx + 32, bt = F - 15;
    ctx.fillStyle = S[1]; ctx.beginPath(); ctx.moveTo(bl - 4, bt + 2); ctx.lineTo(bl, bt + 3); ctx.lineTo(bl, F); ctx.lineTo(bl - 4, F - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = S[1]; ctx.beginPath(); ctx.moveTo(br + 4, bt + 2); ctx.lineTo(br, bt + 3); ctx.lineTo(br, F); ctx.lineTo(br + 4, F - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = S[2]; ctx.fillRect(bl, bt + 3, br - bl, F - bt - 3);
    for (let k = 0; k < 3; k++) {
      const px = bl + 3 + k * 20;
      ctx.fillStyle = S[1]; ctx.fillRect(px, bt + 6, 18, F - bt - 9); ctx.fillStyle = S[0]; ctx.fillRect(px, bt + 6, 18, 1); ctx.fillRect(px, bt + 6, 1, F - bt - 9);
      ctx.fillStyle = S[3]; for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) { ctx.beginPath(); ctx.arc(px + 9 + dx, bt + 11 + dy, 2, 0, Math.PI * 2); ctx.fill(); } // Vierpass
      ctx.fillStyle = S[1]; ctx.fillRect(px + 8, bt + 10, 2, 2);
    }
    ctx.fillStyle = S[0]; ctx.fillRect(bl - 2, F - 3, br - bl + 4, 3); // Sockelleiste
    // Wasserfläche (Ellipse hinter dem vorderen Rand), Wellenringe
    ctx.fillStyle = '#0c3c58'; ctx.beginPath(); ctx.ellipse(cx, bt, 31, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c6c94'; ctx.beginPath(); ctx.ellipse(cx, bt + 0.5, 29, 3.6, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(190,240,255,0.55)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const ph = ((t * 0.6 + i * 20) % 60) / 60; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(cx + (i - 1) * 15, bt, 2 + ph * 9, 0.6 + ph * 1.6, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = S[3]; ctx.fillRect(bl - 4, bt + 2, br - bl + 8, 2); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.35; ctx.fillRect(bl - 4, bt + 2, br - bl + 8, 1); ctx.globalAlpha = 1; // vorderer Rand
    // Schaft mit Knauf, obere Schale
    ctx.fillStyle = S[0]; ctx.fillRect(cx - 4, F - 46, 8, 31); ctx.fillStyle = S[2]; ctx.fillRect(cx - 3, F - 46, 6, 31); ctx.fillStyle = S[3]; ctx.fillRect(cx - 3, F - 46, 1, 31);
    ctx.fillStyle = S[2]; ctx.fillRect(cx - 6, F - 31, 12, 4); ctx.fillStyle = G[1]; ctx.fillRect(cx - 6, F - 31, 12, 1);
    ctx.fillStyle = S[2]; ctx.beginPath(); ctx.ellipse(cx, F - 48, 17, 7, 0, 0, Math.PI); ctx.fill(); // Schale (Unterseite)
    ctx.fillStyle = S[1]; ctx.beginPath(); ctx.ellipse(cx, F - 46, 12, 4, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#1c6c94'; ctx.beginPath(); ctx.ellipse(cx, F - 48, 16, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = S[3]; ctx.fillRect(cx - 17, F - 48, 34, 1);
    // Zapfen und Fontäne: Strahl steigt, fächert oben auf und fällt in die Schale
    ctx.fillStyle = G[0]; ctx.fillRect(cx - 2, F - 56, 4, 7); ctx.fillStyle = G[2]; ctx.fillRect(cx - 1, F - 57, 2, 2); ctx.fillStyle = G[1]; ctx.fillRect(cx - 2, F - 53, 4, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(170,230,255,0.75)'; ctx.fillRect(cx, F - 74, 1, 18);
    for (let i = 0; i < 10; i++) { // Tropfen fallen im Bogen von der Spitze
      const ph = ((t * 0.035 + i / 10) % 1), s = i % 2 ? 1 : -1, sx = cx + s * (2 + ph * 13), sy = F - 75 + (ph * ph * 30) - ph * 6;
      ctx.fillStyle = `rgba(190,240,255,${(0.8 - ph * 0.5).toFixed(2)})`; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 2);
    }
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { // Wasserschleier von der Schale ins Becken
      const ph = ((t * 0.05 + i / 9) % 1), sx = cx + s * (16 + ph * 7), sy = F - 48 + ph * 32;
      ctx.fillStyle = `rgba(150,220,255,${(0.55 - ph * 0.25).toFixed(2)})`; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 3);
    }
    ctx.restore();
    // Bronzefrosch auf dem Beckenrand: blinzelt, spuckt ab und zu einen Strahl quer ins Becken
    const fx = cx + 24, fy = bt;
    ctx.fillStyle = '#2c4c24'; ctx.fillRect(fx - 4, fy - 4, 8, 4); ctx.fillRect(fx - 5, fy - 2, 10, 2);
    ctx.fillStyle = '#5c8c3c'; ctx.fillRect(fx - 3, fy - 5, 6, 3); ctx.fillStyle = '#8cbc5c'; ctx.fillRect(fx - 3, fy - 5, 2, 1);
    ctx.fillStyle = this.blink ? '#5c8c3c' : '#fce0a8'; ctx.fillRect(fx - 3, fy - 6, 2, 1); ctx.fillRect(fx + 1, fy - 6, 2, 1);
    if (!this.blink) { ctx.fillStyle = '#141008'; ctx.fillRect(fx - 2, fy - 6, 1, 1); ctx.fillRect(fx + 1, fy - 6, 1, 1); }
    if (this.spit > 8) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) { const u = ((i / 12) + t * 0.05) % 1, sx = fx - 4 - u * 20, sy = fy - 4 - Math.sin(u * Math.PI) * 9; ctx.fillStyle = 'rgba(170,230,255,0.7)'; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1); }
      ctx.restore();
    }
  }

  // Ort der Rast: Plattform aus Marmor mit Goldring, achteckiges Becken mit Maßwerkfeldern, drei Schalen mit Kaskaden, vergoldeter
  // Zapfen mit Fontäne; das Wasser leuchtet und lässt Lichter aufsteigen, zwei Kerzenständer flankieren; nach dem Speichern flammt es auf
  drawBig(ctx) {
    const P = ChamberHall.pal(W.room.theme), S = P.s, G = P.gold, t = this.t, f = this.flare();
    const cx = this.fx - Math.round(W.cam.x), F = (W.room.h - 2) * T - Math.round(W.cam.y);
    if (cx < -90 || cx > View.w + 90) return;
    const glowA = 0.16 + 0.05 * Math.sin(t * 0.04) + f / 90;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // Lichtspiel des Wassers auf der Wand
    for (let i = 0; i < 9; i++) {
      const wx = cx + Math.sin(t * 0.015 + i * 1.7) * 52, wy = F - 86 + Math.sin(t * 0.021 + i * 2.3) * 30, r = 8 + (i % 3) * 4;
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, r); g.addColorStop(0, 'rgba(120,220,255,0.11)'); g.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = g; ctx.fillRect(wx - r, wy - r, r * 2, r * 2);
    }
    const halo = ctx.createRadialGradient(cx, F - 30, 4, cx, F - 30, 70 + f); halo.addColorStop(0, `rgba(150,230,255,${glowA.toFixed(3)})`); halo.addColorStop(1, 'rgba(150,230,255,0)');
    ctx.fillStyle = halo; ctx.fillRect(cx - 80 - f, F - 110 - f, 160 + f * 2, 110 + f);
    ctx.restore();
    // Plattform
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, F - 1, 66, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = S[2]; ctx.fillRect(cx - 62, F - 4, 124, 4); ctx.fillStyle = S[3]; ctx.fillRect(cx - 62, F - 4, 124, 1); ctx.fillStyle = G[1]; ctx.fillRect(cx - 58, F - 2, 116, 1);
    // Kerzenständer links und rechts (fünf Kerzen)
    for (const s of [-1, 1]) {
      const kx = cx + s * 66;
      ctx.fillStyle = G[0]; ctx.fillRect(kx - 1, F - 54, 2, 50); ctx.fillRect(kx - 5, F - 6, 10, 2); ctx.fillRect(kx - 3, F - 8, 6, 2);
      ctx.fillStyle = G[1]; ctx.fillRect(kx - 9, F - 56, 18, 2); ctx.fillRect(kx - 9, F - 60, 1, 4); ctx.fillRect(kx + 8, F - 60, 1, 4); ctx.fillRect(kx - 5, F - 62, 1, 6); ctx.fillRect(kx + 4, F - 62, 1, 6);
      for (const [ox, oy] of [[-9, -4], [-5, -6], [0, -8], [4, -6], [8, -4]]) {
        ctx.fillStyle = '#f0e8d8'; ctx.fillRect(kx + ox, F - 60 + oy, 2, 5); const fl = ((t >> 2) + ox) & 1;
        ctx.fillStyle = fl ? '#fce0a8' : '#fcc860'; ctx.fillRect(kx + ox, F - 63 + oy - fl, 2, 3);
      }
    }
    // unteres Becken: Seitenflächen, Vorderseite mit vier Maßwerkfeldern
    const bl = cx - 46, br = cx + 46, bt = F - 22;
    ctx.fillStyle = S[1]; ctx.beginPath(); ctx.moveTo(bl - 6, bt + 2); ctx.lineTo(bl, bt + 4); ctx.lineTo(bl, F - 4); ctx.lineTo(bl - 6, F - 5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(br + 6, bt + 2); ctx.lineTo(br, bt + 4); ctx.lineTo(br, F - 4); ctx.lineTo(br + 6, F - 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = S[2]; ctx.fillRect(bl, bt + 4, br - bl, F - 4 - bt - 4);
    for (let k = 0; k < 4; k++) {
      const px = bl + 4 + k * 22;
      ctx.fillStyle = S[1]; ctx.fillRect(px, bt + 7, 20, 10); ctx.fillStyle = S[0]; ctx.fillRect(px, bt + 7, 20, 1); ctx.fillRect(px, bt + 7, 1, 10);
      ctx.fillStyle = G[1]; for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) { ctx.beginPath(); ctx.arc(px + 10 + dx, bt + 12 + dy, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = S[1]; ctx.fillRect(px + 9, bt + 11, 2, 2);
    }
    // leuchtendes Wasser im Becken, Wellenringe
    ctx.fillStyle = '#0c4464'; ctx.beginPath(); ctx.ellipse(cx, bt + 1, 45, 6, 0, 0, Math.PI * 2); ctx.fill();
    const wg = ctx.createRadialGradient(cx, bt, 2, cx, bt, 44); wg.addColorStop(0, f ? '#e8fcff' : '#7cdcfc'); wg.addColorStop(1, '#1c7ca8');
    ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(cx, bt + 1.5, 43, 4.5, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(220,250,255,0.6)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const ph = ((t * 0.5 + i * 15) % 60) / 60; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(cx + (i - 1.5) * 18, bt + 1, 2 + ph * 10, 0.6 + ph * 1.8, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = S[3]; ctx.fillRect(bl - 6, bt + 2, br - bl + 12, 3); ctx.fillStyle = G[1]; ctx.fillRect(bl - 6, bt + 2, br - bl + 12, 1);
    // Schaft, mittlere Schale, oberer Schaft, obere Schale
    const bowl = (y, rw, rh) => {
      ctx.fillStyle = S[2]; ctx.beginPath(); ctx.ellipse(cx, y, rw, rh, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = S[1]; ctx.beginPath(); ctx.ellipse(cx, y + 2, rw * 0.7, rh * 0.6, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#5cc8f0'; ctx.beginPath(); ctx.ellipse(cx, y, rw - 1, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = G[1]; ctx.fillRect(cx - rw, y, rw * 2, 1);
    };
    ctx.fillStyle = S[0]; ctx.fillRect(cx - 5, F - 52, 10, 32); ctx.fillStyle = S[2]; ctx.fillRect(cx - 4, F - 52, 8, 32); ctx.fillStyle = S[3]; ctx.fillRect(cx - 4, F - 52, 2, 32);
    ctx.fillStyle = G[0]; ctx.fillRect(cx - 7, F - 36, 14, 3); ctx.fillStyle = G[2]; ctx.fillRect(cx - 7, F - 36, 14, 1);
    bowl(F - 52, 26, 9);
    ctx.fillStyle = S[0]; ctx.fillRect(cx - 3, F - 74, 6, 22); ctx.fillStyle = S[2]; ctx.fillRect(cx - 2, F - 74, 4, 22); ctx.fillStyle = S[3]; ctx.fillRect(cx - 2, F - 74, 1, 22);
    bowl(F - 74, 14, 6);
    ctx.fillStyle = G[0]; ctx.fillRect(cx - 3, F - 84, 6, 10); ctx.fillStyle = G[2]; ctx.fillRect(cx - 2, F - 86, 4, 3); ctx.fillStyle = G[1]; for (let k = 0; k < 3; k++) ctx.fillRect(cx - 3, F - 82 + k * 3, 6, 1); // Zapfen
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(180,240,255,0.8)'; ctx.fillRect(cx, F - 108, 1, 22); // Fontäne
    for (let i = 0; i < 14; i++) { const ph = (t * 0.03 + i / 14) % 1, s = i % 2 ? 1 : -1, sx = cx + s * (2 + ph * 16), sy = F - 109 + ph * ph * 36 - ph * 8; ctx.fillStyle = `rgba(200,245,255,${(0.85 - ph * 0.5).toFixed(2)})`; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 2); }
    for (const [y0, y1, rw] of [[F - 74, F - 52, 14], [F - 52, bt, 26]]) for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { // Kaskaden von Schale zu Schale
      const ph = (t * 0.05 + i / 10) % 1, sx = cx + s * (rw + ph * 6), sy = y0 + ph * (y1 - y0);
      ctx.fillStyle = `rgba(160,230,255,${(0.6 - ph * 0.25).toFixed(2)})`; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 3);
    }
    if (this.t % 6 === 0 || (f && this.t % 2 === 0)) this.motes.push({ x: rnd(-38, 38), y: 0, v: rnd(0.2, 0.5) + f / 60, l: 0 }); // Lichter steigen aus dem Wasser
    for (const m of this.motes) { m.l++; m.y -= m.v; m.x += Math.sin((m.l + m.x) * 0.06) * 0.2; const a = Math.max(0, 1 - m.l / 120); ctx.fillStyle = `rgba(200,250,255,${(a * 0.8).toFixed(2)})`; ctx.fillRect(Math.round(cx + m.x), Math.round(bt + m.y), 1, 1); }
    this.motes = this.motes.filter(m => m.l < 120);
    ctx.restore();
    // Bronzefrosch auf dem Beckenrand: blinzelt, spuckt ab und zu quer ins Becken
    const fx = cx + 36, fy = bt + 2;
    ctx.fillStyle = '#2c4c24'; ctx.fillRect(fx - 4, fy - 4, 8, 4); ctx.fillRect(fx - 5, fy - 2, 10, 2);
    ctx.fillStyle = '#5c8c3c'; ctx.fillRect(fx - 3, fy - 5, 6, 3); ctx.fillStyle = '#8cbc5c'; ctx.fillRect(fx - 3, fy - 5, 2, 1);
    ctx.fillStyle = this.blink ? '#5c8c3c' : '#fce0a8'; ctx.fillRect(fx - 3, fy - 6, 2, 1); ctx.fillRect(fx + 1, fy - 6, 2, 1);
    if (!this.blink) { ctx.fillStyle = '#141008'; ctx.fillRect(fx - 2, fy - 6, 1, 1); ctx.fillRect(fx + 1, fy - 6, 1, 1); }
    if (this.spit > 8) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const u = ((i / 14) + t * 0.05) % 1; ctx.fillStyle = 'rgba(170,230,255,0.7)'; ctx.fillRect(Math.round(fx - 4 - u * 26), Math.round(fy - 4 - Math.sin(u * Math.PI) * 10), 1, 1); } ctx.restore(); }
  }
}

// ---------------- Portal der Warpkammer: wabernde Kugel in PS2-3D ----------------
// Eine Ikosaederkugel (320 Flächen), deren Ecken jedes Bild nach überlagerten Sinuswellen pulsieren, selbstleuchtend in Cyan
// und Violett, mit der Software-3D gerastert; dahinter ein Lichthof, darunter ein Runenkreis, um sie kreisen zwei Ringe (die
// hintere Hälfte hinter, die vordere vor der Kugel), Funken werden hineingesogen. Gesperrt: matt, grau, träge.
const ChamberPortal = (() => {
  let ico = null, buf = null;
  function sphere() { // Ikosaeder, zweimal unterteilt, auf die Einheitskugel projiziert
    if (ico) return ico;
    const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const l = Math.hypot(...v); return v.map(c => c / l); });
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < 2; s++) {
      const mid = new Map(), m = (a, b) => { const k = a < b ? a + ',' + b : b + ',' + a; if (mid.has(k)) return mid.get(k); const v = V[a].map((c, i) => c + V[b][i]), l = Math.hypot(...v); V.push(v.map(c => c / l)); mid.set(k, V.length - 1); return V.length - 1; };
      F = F.flatMap(([a, b, c]) => { const ab = m(a, b), bc = m(b, c), ca = m(c, a); return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]; });
    }
    return (ico = { V, F });
  }
  const ENV = (() => { const v = [-0.45, 0.6, -0.65], l = Math.hypot(...v); return { sun: v.map(c => c / l), sunC: [0.55, 0.65, 0.95], amb: [0.14, 0.14, 0.3], sky: [0.2, 0.22, 0.42], fog: [0, 0, 0], fogD: 0 }; })();
  function draw(ctx, cx, cy, on, t, pulse) {
    const { V, F } = sphere(), R = 22, S = 84, sp = on ? 1 : 0.35, amp = on ? 1 : 0.45;
    if (!buf) { const c = document.createElement('canvas'); c.width = S; c.height = S; buf = { c, x: c.getContext('2d', { willReadFrequently: true }) }; }
    const m = PS2.mesh(), tt = t * 0.05 * sp, ca = Math.cos(tt * 0.6), sa = Math.sin(tt * 0.6);
    for (const [x, y, z] of V) { // Oberfläche wabert: drei überlagerte Wellen; die Kugel dreht sich langsam um sich selbst
      const w = 0.12 * Math.sin(3 * x + 2.1 * tt) * Math.cos(2 * y - 1.7 * tt) + 0.07 * Math.sin(5 * z + 3.3 * tt + 2 * x) + 0.05 * Math.sin(7 * y + 4.1 * tt);
      const r = R * (1 + w * amp + pulse / 200);
      PS2.vtx(m, (x * ca - z * sa) * r, y * r, (x * sa + z * ca) * r);
    }
    const ON = [[80, 220, 255], [150, 110, 255], [210, 250, 255]], OFF = [[70, 84, 110], [90, 90, 120], [120, 130, 150]];
    F.forEach(([a, b, c], i) => {
      const yy = (V[a][1] + V[b][1] + V[c][1]) / 3, band = Math.floor((yy + 1) * 3 + Math.sin(tt * 2 + i * 0.01) * 0.6) % 3;
      PS2.face(m, [a, b, c], (on ? ON : OFF)[(band + 3) % 3], [0, 0, 0], { e: on ? 0.42 + 0.18 * Math.sin(tt * 3 + yy * 4) : 0.05 });
    });
    buf.x.clearRect(0, 0, S, S);
    PS2.render(buf.x, S, S, [m], { x: 0, y: 0, z: -120, yaw: 0, pitch: 0, f: 120, near: 10, cx: S / 2, cy: S / 2 }, ENV);
    // Lichthof, hintere Ringhälfte, Kugel, vordere Ringhälfte, Funken
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hr = 44 + 4 * Math.sin(t * 0.06) + pulse / 2, g = ctx.createRadialGradient(cx, cy, 4, cx, cy, hr);
    g.addColorStop(0, on ? 'rgba(140,220,255,0.5)' : 'rgba(110,120,160,0.18)'); g.addColorStop(1, 'rgba(110,140,255,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - hr, cy - hr, hr * 2, hr * 2);
    ctx.restore();
    const ring = (front, rx, ry, rot, col) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); ctx.stroke(); ctx.restore();
    };
    const c1 = on ? 'rgba(170,240,255,0.85)' : 'rgba(120,130,160,0.5)', c2 = on ? 'rgba(200,160,255,0.75)' : 'rgba(110,110,140,0.4)';
    ring(false, 36, 9, 0.25 + Math.sin(t * 0.02) * 0.15, c1); ring(false, 31, 7, -0.5 + Math.cos(t * 0.017) * 0.2, c2);
    ctx.drawImage(buf.c, Math.round(cx - S / 2), Math.round(cy - S / 2));
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const k = ctx.createRadialGradient(cx - 4, cy - 5, 0, cx, cy, R + 4); k.addColorStop(0, 'rgba(230,250,255,0.55)'); k.addColorStop(0.5, 'rgba(120,200,255,0.18)'); k.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = k; ctx.fillRect(cx - R - 4, cy - R - 4, R * 2 + 8, R * 2 + 8); ctx.restore(); } // Kern leuchtet durch
    ring(true, 36, 9, 0.25 + Math.sin(t * 0.02) * 0.15, c1); ring(true, 31, 7, -0.5 + Math.cos(t * 0.017) * 0.2, c2);
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#c8f4ff';
      for (let i = 0; i < 14; i++) { const ph = ((t * 0.012 + i / 14) % 1), a = i * 2.4 + t * 0.03, d = 46 * (1 - ph); ctx.globalAlpha = ph; ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.6), 1, 1); }
      ctx.restore(); }
  }
  function floor(ctx, cx, fy, on, t) { // Runenkreis auf dem Boden
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = on ? 'rgba(120,220,255,0.6)' : 'rgba(110,120,150,0.35)'; ctx.lineWidth = 1;
    for (const r of [26, 20]) { ctx.beginPath(); ctx.ellipse(cx, fy - 2, r, r * 0.16, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = on ? '#bfeeff' : '#7c88a0';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * 0.01; if (((t >> 3) + i) % 3 === 0 || !on) ctx.fillRect(Math.round(cx + Math.cos(a) * 23), Math.round(fy - 2 + Math.sin(a) * 3.7), 1, 1); }
    ctx.restore();
  }
  return { draw, floor };
})();

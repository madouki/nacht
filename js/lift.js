// Aufzug als Abkürzung (Schloss-Modus): ein Schachtraum mit einer Kabine, die man mit ↑/↓ fährt, und Haltestellen mit
// Seitenausgängen in jedem Stockwerk. Steht der Held an einer Haltestelle neben dem leeren Schacht, holt ↑ die Kabine her.
// Wie eine Abkürzung in SotN: von der verriegelten Seite aus (lock: 'top' | 'bottom') rührt sie sich erst, wenn man sie
// einmal von der anderen Seite aus benutzt hat (Castle-Flag lift_<id>, bleibt im Spielstand).
// Bau: .lift(x, [Standreihen der Haltestellen von oben nach unten], { id, start, lock }) – die Kabine ist 3 Kacheln breit
// (x .. x+2); an jeder Haltestelle braucht der Raum Boden in Reihe+1 links und/oder rechts neben dem Schacht.
'use strict';

class ShortcutLift extends Ent {
  constructor(d) {
    const stops = d.stops.map(r => (r + 1) * T); // Kabinenboden je Haltestelle (px) = Füße des Helden
    const i0 = clamp(d.start ?? (d.lock === 'bottom' ? 0 : stops.length - 1), 0, stops.length - 1);
    super(d.x * T, stops[i0], 48, 8);
    this.kind = 'platform'; this.d = d; this.stops = stops; this.at = i0; this.to = i0; this.dx = 0; this.dy = 0; this.v = 0; this.hum = 0; this.lockT = 0;
  }
  get unlocked() { return !this.d.lock || typeof Castle === 'undefined' || !Castle.on || !!Castle.flags['lift_' + this.d.id]; }
  riding() { const p = W.player; return p && p.alive && p.onGround && Math.abs(p.feet - this.y) < 3 && p.cx > this.x - 2 && p.cx < this.x + this.w + 2; }
  lockedSide(i) { return !this.unlocked && (this.d.lock === 'top' ? i === 0 : i === this.stops.length - 1); } // Haltestelle auf der verriegelten Seite
  go(j) {
    if (j < 0 || j >= this.stops.length || j === this.at || this.to !== this.at) return;
    this.to = j; Audio8.sfx('chain'); Input.rumble(0.25, 0.2, 120);
    if (!this.unlocked && typeof Castle !== 'undefined' && Castle.on) { Castle.setFlag('lift_' + this.d.id); Game.note('liftOpen'); } // einmal gefahren: die Abkürzung ist offen
  }
  update() {
    this.t++; this.dy = 0;
    const p = W.player, P = Input.pressed;
    if (this.lockT > 0) this.lockT--;
    if (this.to === this.at) {
      if (this.riding() && p.state === 'normal') { // auf der Kabine: ↑ hinauf, ↓ hinab zur nächsten Haltestelle
        if (P.up) this.go(this.at - 1); else if (P.down && Input.held.down) this.go(this.at + 1);
      } else if (p && p.alive && p.onGround && P.up) { // an einer Haltestelle neben dem Schacht: Kabine rufen
        const i = this.stops.findIndex(y => Math.abs(p.feet - y) < 4);
        if (i >= 0 && i !== this.at && Math.abs(p.cx - (this.x + this.w / 2)) < this.w / 2 + 5 * T) {
          if (this.lockedSide(i)) { if (!this.lockT) { this.lockT = 90; Game.note('liftLocked'); Audio8.sfx('wall'); } }
          else this.go(i);
        }
      }
      return;
    }
    const goal = this.stops[this.to], dist = goal - this.y, dir = Math.sign(dist);
    this.v = Math.min(2.4, this.v + 0.08, Math.max(0.5, Math.abs(dist) * 0.06)); // anfahren, gleiten, sanft halten
    const ny = Math.abs(dist) <= this.v ? goal : this.y + dir * this.v;
    this.dy = ny - this.y; this.y = ny; this.hum++;
    if (this.hum % 24 === 0) Audio8.sfx('cog');
    if (ny === goal) { this.at = this.to; this.v = 0; Audio8.sfx('latch'); W.shake = Math.max(W.shake, 2); }
  }
  lightUp(L, cx, cy) { L.push({ x: this.x + this.w / 2 - cx, y: this.y - 34 - cy, r: 40, c: [252, 200, 120], a: 0.42 }); }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), w = this.w, t = this.t;
    // Führungsschienen und Seile über die ganze Schachthöhe, dazu das Gegengewicht, das sich gegenläufig bewegt
    const top = Math.round(-W.cam.y), bot = Math.round(W.room.h * T - W.cam.y);
    ctx.fillStyle = '#24202c'; ctx.fillRect(x - 3, top, 2, bot - top); ctx.fillRect(x + w + 1, top, 2, bot - top);
    ctx.fillStyle = '#4c4658'; ctx.fillRect(x - 3, top, 1, bot - top); ctx.fillRect(x + w + 1, top, 1, bot - top);
    ctx.fillStyle = '#3c3c3c'; for (const ax of [10, w - 11]) ctx.fillRect(x + ax, top, 1, y - 40 - top);
    const cwY = Math.round(top + (bot - top) - (y - top) * 0.9) - 24; // Gegengewicht
    ctx.fillStyle = '#2c2834'; ctx.fillRect(x + w / 2 - 4, cwY, 8, 20); ctx.fillStyle = '#5c5468'; ctx.fillRect(x + w / 2 - 4, cwY, 8, 2);
    ctx.fillStyle = '#3c3c3c'; ctx.fillRect(x + w / 2, top, 1, cwY - top);
    // Kabine: schmiedeeiserner Käfig mit Messingrahmen, Dach mit Laterne, Scherengitter vorn, Riffelblechboden
    const H = 40, cy0 = y - H;
    ctx.fillStyle = 'rgba(10,6,16,0.55)'; ctx.fillRect(x + 2, cy0 + 4, w - 4, H - 4); // Innenraum (dunkel, der Held steht davor)
    ctx.fillStyle = '#7c5a24'; ctx.fillRect(x, cy0, w, 3); ctx.fillRect(x, y - 2, w, 2); ctx.fillRect(x, cy0, 2, H); ctx.fillRect(x + w - 2, cy0, 2, H);
    ctx.fillStyle = '#d8a848'; ctx.fillRect(x, cy0, w, 1); ctx.fillRect(x, cy0, 1, H);
    ctx.fillStyle = '#2c2430'; for (let k = 6; k < w - 4; k += 5) ctx.fillRect(x + k, cy0 + 3, 1, H - 5); // Gitterstäbe
    ctx.fillStyle = '#5c4c64'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 2, cy0 + 12 + k * 9, w - 4, 1); // Querstreben
    ctx.fillStyle = '#7c5a24'; ctx.beginPath(); ctx.moveTo(x - 2, cy0); ctx.lineTo(x + w / 2, cy0 - 8); ctx.lineTo(x + w + 2, cy0); ctx.closePath(); ctx.fill(); // Dach
    ctx.fillStyle = '#d8a848'; ctx.fillRect(x + w / 2 - 1, cy0 - 12, 2, 4);
    const fl = 0.75 + 0.25 * Math.sin(t * 0.21) * Math.sin(t * 0.07);
    ctx.globalAlpha = fl; ctx.fillStyle = '#fce0a8'; ctx.fillRect(x + w / 2 - 2, cy0 + 4, 4, 4); ctx.globalAlpha = 1; // Lampe
    ctx.fillStyle = '#5c5c6c'; ctx.fillRect(x, y, w, 6); ctx.fillStyle = '#9c9cac'; ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = '#7c7c8c'; for (let k = 3; k < w; k += 5) ctx.fillRect(x + k, y + 2, 2, 1); // Riffelblech
    ctx.fillStyle = '#f8b800'; for (let k = 0; k < w; k += 8) ctx.fillRect(x + k, y + 5, 4, 1); // Warnleiste
    // Stockwerksanzeige über der Kabine und ↑/↓-Hinweis, wenn der Held darauf steht
    if (this.riding() && this.to === this.at) {
      const bob = Math.round(Math.sin(t * 0.12) * 2);
      if (this.at > 0) Font.draw(ctx, '↑', x + w / 2 - 2, cy0 - 26 + bob, '#fcfcfc', { shadow: '#000' });
      if (this.at < this.stops.length - 1) Font.draw(ctx, '↓', x + w / 2 - 2, y + 10 - bob, '#fcfcfc', { shadow: '#000' });
    }
    // Rufknöpfe an den Haltestellen: Messingschild mit Lampe (grün = Kabine hier, rot = verriegelt)
    this.stops.forEach((sy, i) => {
      const py = Math.round(sy - W.cam.y) - 22;
      for (const px of [x - 10, x + w + 4]) {
        ctx.fillStyle = '#5c4418'; ctx.fillRect(px, py, 6, 9); ctx.fillStyle = '#c89838'; ctx.fillRect(px, py, 6, 1);
        ctx.fillStyle = this.lockedSide(i) ? '#d82800' : i === this.at && this.to === this.at ? '#58f898' : (t >> 4) & 1 ? '#f8b800' : '#7c5c18';
        ctx.fillRect(px + 2, py + 3, 2, 2);
      }
    });
  }
}

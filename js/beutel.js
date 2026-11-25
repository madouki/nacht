// Klingelbeutel (Gegner in der Sonnenkathedrale und im Sonnenturm): ein besessener Kollektenbeutel am langen Stab. Er schwebt heran,
// bimmelt („EINE KLEINE SPENDE?“) und stößt zu. Statt zu verletzen, klaut er Gold und flieht prall gefüllt nach oben. Wer ihn auf
// der Flucht erwischt, bekommt die Spende mit 50 % Zinsen zurück (Urkunde „Spendenquittung“). Ohne Gold gibt es nur einen Stups.
// Bilder: tools/blender/beutel_bl.py
'use strict';
const BEUTEL_ART = (() => {
  const MAP = {"beutel_hover0":[0,0,48,40],"beutel_hover1":[49,0,48,40],"beutel_lunge":[98,0,48,40],"beutel_full":[147,0,48,40]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { hover: [fr('beutel_hover0'), fr('beutel_hover1')], lunge: fr('beutel_lunge'), full: fr('beutel_full') };
  };
  img.src = 'img/beutel3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Klingelbeutel extends Enemy {
  constructor(tx, ty) {
    super(tx * T, ty * T, 16, 18, 4, 1, 250);
    this.hx = this.x; this.hy = this.y; this.st = 'hover'; this.tm = 0; this.cd = 60; this.loot = 0; this.vx = 0; this.vy = 0;
  }
  move(dx, dy) { const nx = this.x + dx, ny = this.y + dy; if (!Phys.rectSolid(nx, this.y, this.w, this.h)) this.x = nx; else this.vx = 0; if (!Phys.rectSolid(this.x, ny, this.w, this.h)) this.y = ny; else this.vy = 0; }
  update() {
    this.t++; this.tm++;
    if (this.kbT > 0 && this.wuchtStep()) return;
    if (this.flashT > 0) this.flashT--;
    const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy);
    if (this.st === 'hover') { // schwebt dem Helden schräg voraus, das Glöckchen bimmelt ab und zu
      const near = p.alive && d < 200; if (near && Math.abs(dx) > 4) this.face = dx > 0 ? 1 : -1;
      const tx = near ? p.cx - this.face * 58 : this.hx + 8, ty = (near ? p.y - 6 : this.hy) + Math.sin(this.t * 0.06) * 6;
      const ex = tx - this.cx, ey = ty - this.cy, L = Math.hypot(ex, ey); if (L > 1) { const sp = Math.min(0.9, L * 0.05); this.move(ex / L * sp, ey / L * sp); }
      if (near && this.tm % 50 === 0) Audio8.sfx('ding', this.cx);
      if (near && --this.cd <= 0 && d < 96) {
        this.st = 'wind'; this.tm = 0; Audio8.sfx('ding', this.cx);
        if (!this.asked) { this.asked = true; W.popup(this.cx, this.y - 10, tr('beutelBitte'), '#f8d878'); }
      }
    } else if (this.st === 'wind') { // holt aus und zittert
      if (Math.abs(dx) > 4) this.face = dx > 0 ? 1 : -1;
      if (this.tm >= 24) { this.st = 'lunge'; this.tm = 0; const L = Math.max(1, d); this.vx = dx / L * 3.4; this.vy = dy / L * 3.4; Audio8.sfx('whoosh', this.cx); }
    } else if (this.st === 'lunge') {
      this.move(this.vx, this.vy);
      if (this.tm > 28) { this.st = 'hover'; this.tm = 0; this.cd = 70 + Math.floor(Math.random() * 50); }
    } else if (this.st === 'flee') { // prall voll Münzen: weg vom Helden, nach oben, immer schneller
      const ax = dx > 0 ? -1 : 1; this.vx = clamp(this.vx + ax * 0.05, -2.6, 2.6); this.vy = Math.max(-1.8, this.vy - 0.04); this.x += this.vx; this.y += this.vy;
      this.face = this.vx > 0 ? 1 : -1;
      if (this.tm % 6 === 0) W.spawn(new Particle(this.cx + rnd(-4, 4), this.y, rnd(-0.3, 0.3), -0.4, '#f8d048', 16, 1, 0));
      if (this.tm % 20 === 0) Audio8.sfx('ding', this.cx);
      if (this.tm > 40 && !this.onScreen(30)) this.dead = true; // mit der Spende über alle Berge
      return;
    }
    if (p.alive && !p.hidden && !(p.inv > 0) && Phys.overlap(this, p)) this.grab(p);
  }
  grab(p) { // statt Schaden: Gold in den Beutel – dann nichts wie weg
    const g = W.score >= 20 ? clamp(Math.round(W.score * 0.04), 20, 300) : 0;
    if (!g) { p.hurt(this.dmg, this.cx); this.st = 'hover'; this.tm = 0; this.cd = 90; return; }
    W.score -= g; this.loot = g; p.inv = Math.max(p.inv || 0, 45);
    W.popup(p.cx, p.y - 14, '-' + g + ' G', '#fc7460'); W.popup(this.cx, this.y - 12, tr('beutelDanke'), '#f8d878'); Audio8.sfx('money', this.cx); Audio8.sfx('ding', this.cx);
    for (let i = 0; i < 8; i++) W.spawn(new Particle(p.cx, p.cy, (this.cx - p.cx) * 0.04 + rnd(-0.6, 0.6), rnd(-2, -0.6), '#f8d048', 24, 1, 0.08));
    this.st = 'flee'; this.tm = 0; this.vx = (this.cx > p.cx ? 1 : -1) * 0.8; this.vy = -1.4;
  }
  kill(silent) {
    const loot = this.loot, fleeing = this.st === 'flee';
    super.kill(silent);
    if (silent || !loot) return;
    const back = Math.round(loot * 1.5); W.score += back; Audio8.sfx('money', this.cx);
    W.popup(this.cx, this.y - 20, '+' + back + ' G', '#f8d048'); W.popup(this.cx, this.y - 30, tr('beutelZurueck'), '#7cf0a0');
    for (let i = 0; i < 14; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2, 2), rnd(-2.6, -0.4), i % 2 ? '#f8d048' : '#fce0a8', 30, 2, 0.12));
    if (fleeing && typeof Castle !== 'undefined' && Castle.setFlag) Castle.setFlag('beutel_back');
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - 3 - cy, r: 14, c: [255, 220, 110], a: this.st === 'wind' || this.st === 'lunge' ? 0.32 : 0.18 }); }
  draw(ctx) {
    const S = BEUTEL_ART.get(); if (!S) return;
    const s = this.st === 'flee' ? S.full : this.st === 'lunge' ? S.lunge : S.hover[(this.t >> 3) & 1];
    const jit = this.st === 'wind' ? ((this.t >> 1) & 1) * 2 - 1 : 0, ox = this.face > 0 ? -31 : -17; // Beutelmitte im Bild bei x 31 (gespiegelt 17)
    this.ds(ctx, s, Math.round(this.cx - W.cam.x) + ox + jit, Math.round(this.cy - W.cam.y) - 21, this.face < 0, this.flashT > 0 && (this.flashT & 2));
  }
}

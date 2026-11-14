// Glockenstuhl (Schloss-Modus, Bergfried): Hängeprüfungen am Ankerring. Die Seillänge entscheidet – ↑ kürzt, ↓ lässt nach.
//  SwingBell: große Bronzeglocke im Gebälk. Fest wie eine Mauer (unsichtbare 'G'-Kacheln im Raster), die Glocke wird darüber
//             gezeichnet. Wer am Seil oder im Flug dagegen prallt, läutet sie: BONG – sie schwingt nach, der Held fällt.
//  FlameJet:  Feuerdüse in der Wand; der Strahl schießt waagerecht durch den Schacht. Erst züngelt es (Warnung), dann brennt
//             die ganze Bahn. Mehrere Düsen wechseln sich ab: am Ring ruhig hängen und mit der Seillänge ausweichen.
'use strict';

class SwingBell extends Ent {
  constructor(d) { // d: x, y (linke obere Kachel des festen Glockenkörpers), w, h (Kacheln)
    super(d.x * T, d.y * T, d.w * T, d.h * T); this.kind = 'prop'; this.d = d; this.sw = 0; this.swV = 0; this.cd = 0; this.n = 0;
  }
  ring(by) { // angestoßen: läuten (Abklingzeit, damit ein Abprall nicht zehnmal schlägt)
    if (this.cd > 0) return;
    this.cd = 26; this.n++;
    const dir = by && by.cx < this.cx ? 1 : -1;
    this.swV += 0.035 * dir; W.shake = Math.max(W.shake || 0, 6);
    Audio8.sfx('bell', this.cx); Input.rumble(0.5, 0.3, 160);
    W.popup(this.cx, this.y + this.h + 4, this.n % 5 === 0 ? 'BOOONG!' : 'BONG!', '#f8d878');
    for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx + rnd(-this.w / 2, this.w / 2), this.y + this.h - 2, rnd(-0.6, 0.6), rnd(-1.2, -0.2), i % 2 ? '#f8d878' : '#bc8c3c', 30, 1, 0.08));
  }
  update() {
    this.t++; if (this.cd > 0) this.cd--;
    this.swV += -this.sw * 0.012; this.swV *= 0.985; this.sw += this.swV; // schwingt nach und kommt zur Ruhe
    const p = W.player; // im Flug dagegen (nicht nur am Seil): Kanten um 2 px weiter, damit der Anprall zählt
    if (p && p.alive && p.state === 'normal' && !p.onGround && p.x < this.x + this.w + 2 && p.x + p.w > this.x - 2 && p.y < this.y + this.h + 2 && p.y + p.h > this.y - 2) this.ring(p);
  }
  draw(ctx) {
    const x0 = Math.round(this.x - W.cam.x), y0 = Math.round(this.y - W.cam.y), w = this.w, h = this.h;
    if (x0 > View.w + 20 || x0 + w < -20 || y0 > 240 || y0 + h < -60) return;
    const cx = x0 + w / 2, top = y0 - 10, ceil = Math.round(16 - W.cam.y);
    ctx.fillStyle = '#1c1c24'; // zwei Ketten vom Gebälk unter der Decke herab
    for (const kx of [x0 - 2, x0 + w + 1]) for (let y = Math.max(ceil, top - 200); y < top - 6; y += 4) { ctx.fillRect(kx, y, 2, 3); ctx.fillStyle = (y >> 2) & 1 ? '#4c4c5c' : '#1c1c24'; }
    // Joch: Eichenbalken mit Eisenband, die Glocke hängt darunter und schwingt um die Achse
    ctx.fillStyle = '#3c2414'; ctx.fillRect(x0 - 6, top - 6, w + 12, 7);
    ctx.fillStyle = '#5c3c20'; ctx.fillRect(x0 - 6, top - 6, w + 12, 2);
    ctx.fillStyle = '#24242c'; ctx.fillRect(cx - 7, top - 6, 2, 7); ctx.fillRect(cx + 5, top - 6, 2, 7);
    ctx.save(); ctx.translate(cx, top); ctx.rotate(this.sw);
    const bw = w, bh = h + 10; // Glockenform: Krone, schmale Schulter, leicht gebauchte Flanke, weit ausgestellter Schlagring
    const prof = (k) => k < 0.08 ? 0.18 + 0.12 * (k / 0.08) : k < 0.75 ? 0.30 + 0.05 * (k - 0.08) / 0.67 : 0.35 + 0.15 * Math.pow((k - 0.75) / 0.25, 1.6);
    for (let v = 0; v < bh; v++) {
      const hw = Math.min(0.5, prof(v / bh)) * bw;
      const g = ctx.createLinearGradient(-hw, 0, hw, 0);
      g.addColorStop(0, '#4c3010'); g.addColorStop(0.2, '#d8a448'); g.addColorStop(0.36, '#fce8a8'); g.addColorStop(0.6, '#a87428'); g.addColorStop(1, '#2c1c06');
      ctx.fillStyle = g; ctx.fillRect(Math.round(-hw), v, Math.round(hw * 2), 1);
    }
    const lip = (k) => Math.min(0.5, prof(k)) * bw;
    ctx.fillStyle = '#6c4410'; for (const k of [0.3, 0.34, 0.8]) { const hw = lip(k); ctx.fillRect(Math.round(-hw), Math.round(bh * k), Math.round(hw * 2), 1); } // Zierbänder
    ctx.fillStyle = '#fce0a0'; ctx.fillRect(Math.round(-lip(0.97)), bh - 4, Math.round(lip(0.97) * 0.6), 1); // Glanz am Schlagring
    ctx.fillStyle = '#2c1c08'; ctx.fillRect(Math.round(-lip(1) + 3), bh - 2, Math.round(lip(1) * 2 - 6), 2); // Mündung (dunkel)
    const kl = Math.sin(this.t * 0.05) * 2 + this.sw * 40; // Klöppel
    ctx.fillStyle = '#3c3c44'; ctx.fillRect(-1 + Math.round(kl * 0.3), bh - 10, 2, 9); ctx.fillStyle = '#1c1c24'; ctx.fillRect(-2 + Math.round(kl * 0.4), bh - 2, 4, 3);
    ctx.fillStyle = '#4c3410'; ctx.fillRect(-5, -4, 10, 5); ctx.fillStyle = '#a87428'; ctx.fillRect(-4, -4, 4, 2); // Krone
    ctx.restore();
  }
  lightUp(L, cx, cy) { if (this.cd > 10) L.push({ x: this.cx - cx, y: this.y + this.h - cy, r: 34, c: [252, 210, 120], a: 0.35 * (this.cd - 10) / 16 }); }
}

class FlameJet extends Ent {
  constructor(d) { // d: x0, x1 (Kacheln, Strahl), y (Reihe), from: 'L' | 'R' (Düse), period, on (Bilder), phase
    super(d.x0 * T, d.y * T + 3, (d.x1 - d.x0 + 1) * T, 10); this.kind = 'prop'; this.d = d;
    this.P = d.period || 200; this.ON = d.on || 70; this.WARN = 40; this.ph = d.phase || 0; this.lit = false;
  }
  phase() { return (this.t + this.ph) % this.P; } // 0..P: zuerst brennt der Strahl (0..ON), dann Pause; die letzten WARN Bilder züngelt es
  on() { return this.phase() < this.ON; }
  warn() { return this.phase() >= this.P - this.WARN; }
  update() {
    this.t++;
    const on = this.on(), d = this.d, nx = d.from === 'R' ? this.x + this.w : this.x;
    if (on && !this.lit && Math.abs(nx - W.player.cx) < View.w) Audio8.sfx('fire', nx);
    this.lit = on;
    const p = W.player;
    if (on && p.alive && p.inv <= 0 && p.x < this.x + this.w && p.x + p.w > this.x && p.y + 3 < this.y + this.h && p.y + p.h - 3 > this.y) { p.hurt(2, nx); W.sparks(p.cx, p.cy, 5); } // Kopf- und Fußspitze dürfen die Flamme streifen
    if (this.warn() && this.t % 4 === 0) W.spawn(new Particle(nx + (d.from === 'R' ? -4 : 4), this.y + 5, (d.from === 'R' ? -1 : 1) * rnd(0.3, 1.2), rnd(-0.4, 0.4), this.t % 8 ? '#f87800' : '#fce0a8', 18, 1, 0));
  }
  draw(ctx) {
    const d = this.d, sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), w = this.w;
    if (sx > View.w + 20 || sx + w < -20 || sy < -20 || sy > 240) return;
    const nX = d.from === 'R' ? sx + w : sx, dir = d.from === 'R' ? -1 : 1;
    // Düse: Löwenkopf aus Eisen in der Wand (Maul offen, glüht vor dem Stoß)
    const hx = d.from === 'R' ? nX - 2 : nX - 8;
    ctx.fillStyle = '#1c1c24'; ctx.fillRect(hx, sy - 4, 10, 18); ctx.fillStyle = '#4c4c5c'; ctx.fillRect(hx + 1, sy - 3, 8, 3); ctx.fillStyle = '#2c2c38'; ctx.fillRect(hx + 1, sy + 10, 8, 3);
    const hot = this.on() ? 1 : this.warn() ? 0.5 + 0.5 * Math.sin(this.t * 0.6) : 0.15;
    ctx.fillStyle = `rgba(252,${Math.round(90 + 120 * hot)},40,${(0.4 + 0.6 * hot).toFixed(2)})`; ctx.fillRect(hx + 3, sy + 2, 4, 6);
    if (this.on()) { // Strahl: drei Lagen, zum Ende hin schmaler und flackernd
      const t = this.t, ph = this.phase(), grow = Math.min(1, ph / 6), len = Math.round(w * grow);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < len; i += 2) {
        const k = i / w, X = nX + dir * i, fl = Math.sin(t * 0.7 + i * 0.37) * (1.5 + k * 2), th = 9 - k * 3 + Math.sin(t * 0.9 + i * 0.21);
        ctx.fillStyle = 'rgba(200,40,0,0.55)'; ctx.fillRect(X, Math.round(sy + 5 - th / 2 + fl), 2, Math.max(2, Math.round(th)));
        ctx.fillStyle = 'rgba(252,150,30,0.7)'; ctx.fillRect(X, Math.round(sy + 5 - th / 3 + fl * 0.7), 2, Math.max(1, Math.round(th * 0.66)));
        ctx.fillStyle = 'rgba(252,240,180,0.85)'; ctx.fillRect(X, Math.round(sy + 5 - th / 6 + fl * 0.4), 2, Math.max(1, Math.round(th * 0.3)));
      }
      ctx.restore();
    } else if (this.warn()) { ctx.fillStyle = 'rgba(252,120,0,0.6)'; ctx.fillRect(d.from === 'R' ? nX - 6 : nX, sy + 3, 6, 4); }
  }
  lightUp(L, cx, cy) {
    if (!this.on()) return;
    for (let k = 0; k <= 3; k++) L.push({ x: this.x + this.w * k / 3 - cx, y: this.cy - cy, r: 44, c: [252, 130, 40], a: 0.35 });
  }
}

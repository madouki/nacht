// Glockenstuhl (Bergfried) und Tropfsteinklamm (Katakomben): Hängeprüfungen am Ankerring. Die Seillänge entscheidet – ↑ kürzt,
// ↓ lässt nach.
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

// ---------------- Seilbahn (Tropfsteinklamm): Laufkatze mit Ankerring an einer Schiene ----------------
// Hakt der Held ein, rollt die Katze los (sanft anfahrend) bis ans Ende der Schiene und trägt ihn mit; die Seillänge bleibt
// in seiner Hand (↑↓). Ohne Fahrgast rollt sie nach kurzer Pause leer zurück an den Anfang. d: x, y (Ring, Kacheln), x0/x1 (Schiene).
class TrolleyRing extends Ring {
  constructor(d) { super(d); this.d = d; this.home = this.x; this.end = d.x1 * T + 3; this.sp = d.speed || 1.2; this.v = 0; this.idle = 0; }
  update() {
    super.update();
    const p = W.player, on = p && p.alive && p.state === 'swing' && p.ring === this;
    if (on && this.x < this.end) {
      this.idle = 0; this.v = Math.min(this.sp, this.v + 0.03); this.x = Math.min(this.end, this.x + this.v);
      if (this.t % 14 === 0) Audio8.sfx('creak', this.cx);
      if (this.x >= this.end) { Audio8.sfx('klack', this.cx); W.sparks(this.cx, this.y - 6, 4); }
    } else if (!on) { this.v = 0; if (++this.idle > 90 && this.x > this.home) this.x = Math.max(this.home, this.x - 2.5); }
  }
  draw(ctx) {
    const d = this.d, ry = d.y * T - 6 - W.cam.y, x0 = d.x0 * T - W.cam.x, x1 = (d.x1 + 1) * T - W.cam.x;
    if (x1 > -20 && x0 < View.w + 20 && ry > -20 && ry < 250) { // Schiene: Eichenbalken mit Eisenband und Nieten, an Ketten unter der Decke
      ctx.fillStyle = '#3c2814'; ctx.fillRect(Math.round(x0), Math.round(ry - 5), Math.round(x1 - x0), 6);   // Eichenbalken
      ctx.fillStyle = '#8c6438'; ctx.fillRect(Math.round(x0), Math.round(ry - 5), Math.round(x1 - x0), 1);   // Lichtkante
      ctx.fillStyle = '#a8a8b8'; ctx.fillRect(Math.round(x0), Math.round(ry), Math.round(x1 - x0), 2);       // Laufschiene aus Eisen
      ctx.fillStyle = '#e8e8f0'; ctx.fillRect(Math.round(x0), Math.round(ry), Math.round(x1 - x0), 1);       // Glanz auf der Schiene
      for (let x = Math.ceil(x0 / 32) * 32; x < x1; x += 32) { ctx.fillStyle = '#7c7c8c'; ctx.fillRect(Math.round(x), Math.round(ry - 3), 1, 1); ctx.fillStyle = '#1c1c24'; for (let y = ry - 6; y > -W.cam.y + 16 && y > ry - 70; y -= 4) ctx.fillRect(Math.round(x) + 8, Math.round(y), 1, 3); }
      const cx = Math.round(this.cx - W.cam.x), turn = (this.x - this.home) * 0.4; // Laufkatze: zwei Räder auf der Schiene, Gehänge zum Ring
      ctx.fillStyle = '#c89020'; ctx.fillRect(cx - 8, Math.round(ry + 2), 16, 4); ctx.fillStyle = '#fce0a0'; ctx.fillRect(cx - 8, Math.round(ry + 2), 16, 1); // Messinggehäuse unter der Schiene
      for (const wx of [cx - 5, cx + 5]) { ctx.fillStyle = '#24242c'; ctx.fillRect(wx - 2, Math.round(ry - 2), 4, 4); ctx.fillStyle = '#e8e8f0'; ctx.fillRect(wx - 1 + (Math.floor(turn) & 1), Math.round(ry - 1), 1, 1); } // Räder
      ctx.fillStyle = '#7c7c8c'; ctx.fillRect(cx - 1, Math.round(ry + 6), 2, 3);
    }
    super.draw(ctx);
  }
}

// Fledermausschwarm: fliegt in einem festen Höhenband quer durch die Klamm (nicht auf den Helden zu) – am Seil weicht man
// mit der Länge aus. Ausgelöst, wenn die Laufkatze die Stelle at (Kachel) erreicht; die Tiere kommen von vorn ins Bild.
class StreamBat extends Bat {
  constructor(x, y, dir, k) { super(0, 0); this.x = x; this.y = y; this.baseY = y; this.state = 'fly'; this.dir = dir; this.face = dir; this.t = k * 7; }
  update() {
    Enemy.prototype.update.call(this); // Treffer-Blinken, Rückstoß usw. wie bei jedem Gegner
    this.x += this.dir * 1.15; this.y = this.baseY + Math.sin(this.t * 0.16) * 3;
    this.touch();
    if (this.x < W.cam.x - 60 || this.x > W.cam.x + View.w + 260) this.dead = true;
  }
}
class BatWave extends Ent {
  constructor(d) { super(0, 0, 1, 1); this.kind = 'fx'; this.d = d; this.done = false; } // d: at (Kachel der Laufkatze), y0/y1 (Reihen des Bands), n, ring (Ring-x in Kacheln, Startplatz)
  update() {
    const d = this.d, k = W.rings.find(r => r instanceof TrolleyRing && r.d.x === d.ring);
    if (!k) return;
    if (k.x <= k.home + 1) this.done = false; // Katze wieder am Anfang: der Schwarm kommt beim nächsten Mal wieder
    if (this.done || k.cx < d.at * T) return;
    this.done = true; Audio8.sfx('bat', k.cx + 200);
    const x0 = W.cam.x + View.w + 12, y0 = d.y0 * T, h = (d.y1 - d.y0 + 1) * T;
    for (let i = 0; i < (d.n || 6); i++) W.spawn(new StreamBat(x0 + (i % 3) * 22 + (i >> 1) * 6, y0 + 4 + (i * 11) % Math.max(4, h - 12), -1, i));
  }
}

// ---------------- Zeigerkammer (Bergfried): Ankerring an der Spitze eines riesigen Uhrzeigers ----------------
// Der Zeiger dreht sich stetig um die Achse (d.dir 1 = im Uhrzeigersinn, -1 = gegen); wer am Ring hängt, wird im Kreis getragen –
// unten warten Zahnräder mit Stacheln (Seil kürzen), in der Mitte sitzt eine Stachelnabe: wer oben über die Achse fährt, hält
// das Seil ganz kurz oder lässt es ganz lang (darunter hindurch). Zum Nachbarzeiger springt man bei neun bzw. drei Uhr.
// d: x, y (Achse, Kacheln), r (Zeigerlänge px), period (Schritte je Umdrehung), dir, phase (rad, 0 = zwölf Uhr), hub (Nabe px, 18)
class HandRing extends Ring {
  constructor(d) { super(d); this.d = d; this.px = d.x * T + 8; this.py = d.y * T + 8; this.place(); }
  ang() { return (this.d.phase || 0) + (this.d.dir || 1) * Math.PI * 2 * (this.t || 0) / (this.d.period || 540); }
  place() { const a = this.ang(); this.x = this.px + Math.sin(a) * this.d.r - 5; this.y = this.py - Math.cos(a) * this.d.r - 5; }
  update() {
    super.update(); this.place(); const p = W.player; if (!p) return;
    if (p.state === 'swing' && p.ring === this && this.t % 30 === 0) Audio8.sfx('tick', this.cx);
    const H = this.d.hub ?? 18, nx = clamp(this.px, p.x + 1, p.x + p.w - 1), ny = clamp(this.py, p.y + 2, p.y + p.h - 2); // Stachelnabe: Kreis gegen Helden-Rechteck (Ränder verzeihen etwas)
    if (H > 0 && p.alive && p.inv <= 0 && Math.hypot(nx - this.px, ny - this.py) < H) { p.hurt(2, this.px); W.sparks(nx, ny, 6); Audio8.sfx('clank', this.px); }
  }
  draw(ctx) {
    const cx = Math.round(this.px - W.cam.x), cy = Math.round(this.py - W.cam.y), R = this.d.r, a = this.ang();
    if (cx + R + 30 < 0 || cx - R - 30 > View.w || cy + R + 30 < 0 || cy - R - 30 > 260) return;
    const F = R + 18; // Zifferblatt: Messingring, cremefarbenes Blatt, zwölf Striche, römische Drei, Sechs, Neun und Zwölf als Kerben
    ctx.save();
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#5c3c14'; ctx.beginPath(); ctx.arc(cx, cy, F + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c89020'; ctx.beginPath(); ctx.arc(cx, cy, F + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8dcb8'; ctx.beginPath(); ctx.arc(cx, cy, F, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#3c2c1c';
    for (let k = 0; k < 60; k++) { const b = k * Math.PI / 30, big = k % 5 === 0, r0 = F - (big ? 9 : 4); ctx.fillRect(Math.round(cx + Math.sin(b) * r0) - (big ? 1 : 0), Math.round(cy - Math.cos(b) * r0) - (big ? 1 : 0), big ? 3 : 1, big ? 3 : 1); }
    ctx.strokeStyle = '#2c2418'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, F - 12, 0, Math.PI * 2); ctx.stroke();
    const H = this.d.hub ?? 18, b0 = -a * 1.5; // Stachelnabe: Zahnrad aus Eisen, dreht gegenläufig, Spitzen ragen bis an den Gefahrenkreis
    ctx.fillStyle = '#2c2c34';
    for (let k = 0; k < 10; k++) { const b = b0 + k * Math.PI / 5, s1 = Math.sin(b), c1 = Math.cos(b), s2 = Math.sin(b + 0.2), c2 = Math.cos(b + 0.2), s3 = Math.sin(b - 0.2), c3 = Math.cos(b - 0.2);
      ctx.beginPath(); ctx.moveTo(cx + s1 * (H + 1), cy - c1 * (H + 1)); ctx.lineTo(cx + s2 * (H - 7), cy - c2 * (H - 7)); ctx.lineTo(cx + s3 * (H - 7), cy - c3 * (H - 7)); ctx.fill(); }
    ctx.fillStyle = '#4c4c5c'; ctx.beginPath(); ctx.arc(cx, cy, H - 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a8a8b8'; for (let k = 0; k < 10; k++) { const b = b0 + k * Math.PI / 5; ctx.fillRect(Math.round(cx + Math.sin(b) * (H - 1)), Math.round(cy - Math.cos(b) * (H - 1)), 1, 1); } // blanke Spitzen
    ctx.strokeStyle = '#2c2c34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, H - 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c89020'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5c3c14'; ctx.fillRect(cx - 1, cy - 1, 2, 2); // Nabe
    // der Zeiger: geschmiedet, mit Gegengewicht, die Spitze trägt den Ring
    const ex = cx + Math.sin(a) * R, ey = cy - Math.cos(a) * R, bx = cx - Math.sin(a) * 18, by = cy + Math.cos(a) * 18;
    ctx.strokeStyle = '#1c1c24'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = '#5c5c6c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    const mx = cx + Math.sin(a) * R * 0.62, my = cy - Math.cos(a) * R * 0.62; ctx.fillStyle = '#1c1c24'; ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill(); // Zierknoten
    ctx.restore();
    // Ring an der Spitze (wie die Ankerringe: golden, glimmt in Reichweite)
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), p = W.player;
    if (p.alive && !p.onGround && p.state === 'normal' && p.nearRing && p.nearRing() === this) {
      const k = 0.5 + 0.5 * Math.sin(this.t * 0.35);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(252,224,140,${(0.25 + 0.3 * k).toFixed(2)})`;
      for (let b = 0; b < Math.PI * 2; b += 0.15) ctx.fillRect(x + Math.round(Math.cos(b) * (7 + k * 2)), y + Math.round(Math.sin(b) * (7 + k * 2)), 1, 1);
      ctx.restore();
    }
    for (let b = 0; b < Math.PI * 2; b += 0.2) { ctx.fillStyle = (b > 3.4 && b < 5.2) ? '#fce0a8' : (b > 0.2 && b < 2.2) ? '#9c6400' : '#f8b800'; ctx.fillRect(x + Math.round(Math.cos(b) * 4), y + Math.round(Math.sin(b) * 4), 1, 1); }
  }
}

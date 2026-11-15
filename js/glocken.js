// Glockenstuhl (Bergfried) und Tropfsteinklamm (Katakomben): Hängeprüfungen am Ankerring. Die Seillänge entscheidet – ↑ kürzt,
// ↓ lässt nach.
//  SwingBell: große Bronzeglocke im Gebälk. Fest wie eine Mauer (unsichtbare 'G'-Kacheln im Raster), die Glocke wird darüber
//             gezeichnet. Wer am Seil oder im Flug dagegen prallt, läutet sie: BONG – sie schwingt nach, der Held fällt.
//  FlameJet:  Feuerdüse in der Wand; der Strahl schießt waagerecht durch den Schacht. Erst züngelt es (Warnung), dann brennt
//             die ganze Bahn. Mehrere Düsen wechseln sich ab: am Ring ruhig hängen und mit der Seillänge ausweichen.
'use strict';

// Vorgerenderte Uhrwerk-Teile (Blender, tools/blender/uhr_bl.py → pack_uhr.py → img/uhr3d.png): Kuckucksuhr-Gehäuse, Kuckuck,
// Pendelgewicht, Tannenzapfen, Zifferblatt, Zeiger, Stachelnabe, Zahnräder. Bis das Bild geladen ist, malen die Klassen selbst.
const UHR3D = (() => {
  const UHR_MAP = {"dial":[0,0,188,188],"gearB":[189,0,112,112],"house":[302,0,128,96],"bell":[431,0,64,96],"gearS":[0,189,64,64],"n_bell0":[65,189,28,44],"n_bell1":[94,189,28,44],"n_guide0":[123,189,28,44],"n_guide1":[152,189,28,44],"n_clock0":[181,189,28,44],"n_clock1":[210,189,28,44],"hub":[239,189,40,40],"bob":[280,189,28,28],"bird0":[309,189,32,24],"bird1":[342,189,32,24],"lion":[375,189,14,20],"cone":[390,189,10,16],"hand":[401,189,96,14],"trolley0":[0,254,24,14],"trolley1":[25,254,24,14],"rail":[50,254,32,9]};
  const C = {}, img = new Image();
  img.onload = () => { for (const [n, r] of Object.entries(UHR_MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  img.src = 'img/uhr3d.png';
  return {
    get: (n) => C[n] || null,
    // Bild n mit Ankerpunkt (ax, ay) an (x, y); a = Drehung (dann geglättet), flip = waagerecht gespiegelt
    draw(ctx, n, x, y, ax = 0, ay = 0, a = 0, flip = false) {
      const c = C[n]; if (!c) return false;
      ctx.save(); ctx.translate(a ? x : Math.round(x), a ? y : Math.round(y)); if (a) { ctx.rotate(a); ctx.imageSmoothingEnabled = true; } if (flip) ctx.scale(-1, 1);
      ctx.drawImage(c, -ax, -ay); ctx.restore(); return true;
    },
  };
})();

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
    if (UHR3D.get('bell')) { // Blender-Glocke: Krone, Zierbänder, Inschrift, Medaillon; darunter Klöppel gezeichnet
      UHR3D.draw(ctx, 'bell', cx, top, 32, 6, this.sw || 1e-4);
      ctx.save(); ctx.translate(cx, top); ctx.rotate(this.sw);
      const bh = h + 10, kl = Math.sin(this.t * 0.05) * 2 + this.sw * 40;
      ctx.fillStyle = '#3c3c44'; ctx.fillRect(-1 + Math.round(kl * 0.3), bh - 6, 2, 5); ctx.fillStyle = '#1c1c24'; ctx.fillRect(-2 + Math.round(kl * 0.4), bh - 1, 4, 3);
      ctx.restore(); return;
    }
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
    if (!UHR3D.draw(ctx, 'lion', d.from === 'R' ? hx + 12 : hx - 2, sy - 5, 0, 0, 0, d.from === 'R')) { ctx.fillStyle = '#1c1c24'; ctx.fillRect(hx, sy - 4, 10, 18); ctx.fillStyle = '#4c4c5c'; ctx.fillRect(hx + 1, sy - 3, 8, 3); ctx.fillStyle = '#2c2c38'; ctx.fillRect(hx + 1, sy + 10, 8, 3); }
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
      const RS = UHR3D.get('rail');
      if (RS) { // Blender-Schiene, gekachelt (32 px), am Ende abgeschnitten
        ctx.save(); ctx.beginPath(); ctx.rect(Math.round(x0), Math.round(ry - 6), Math.round(x1 - x0), 12); ctx.clip();
        for (let x = Math.round(x0); x < x1; x += 32) ctx.drawImage(RS, x, Math.round(ry - 5));
        ctx.restore();
      } else {
      ctx.fillStyle = '#3c2814'; ctx.fillRect(Math.round(x0), Math.round(ry - 5), Math.round(x1 - x0), 6);   // Eichenbalken
      ctx.fillStyle = '#8c6438'; ctx.fillRect(Math.round(x0), Math.round(ry - 5), Math.round(x1 - x0), 1);   // Lichtkante
      ctx.fillStyle = '#a8a8b8'; ctx.fillRect(Math.round(x0), Math.round(ry), Math.round(x1 - x0), 2);       // Laufschiene aus Eisen
      ctx.fillStyle = '#e8e8f0'; ctx.fillRect(Math.round(x0), Math.round(ry), Math.round(x1 - x0), 1);       // Glanz auf der Schiene
      }
      for (let x = Math.ceil(x0 / 32) * 32; x < x1; x += 32) { ctx.fillStyle = '#7c7c8c'; ctx.fillRect(Math.round(x), Math.round(ry - 3), 1, 1); ctx.fillStyle = '#1c1c24'; for (let y = ry - 6; y > -W.cam.y + 16 && y > ry - 70; y -= 4) ctx.fillRect(Math.round(x) + 8, Math.round(y), 1, 3); }
      const cx = Math.round(this.cx - W.cam.x), turn = (this.x - this.home) * 0.4; // Laufkatze: zwei Räder auf der Schiene, Gehänge zum Ring
      if (!UHR3D.draw(ctx, (Math.floor(turn / 2) & 1) ? 'trolley1' : 'trolley0', cx - 12, Math.round(ry) - 4)) { // Blender-Laufkatze, die Räder drehen sich mit
      ctx.fillStyle = '#c89020'; ctx.fillRect(cx - 8, Math.round(ry + 2), 16, 4); ctx.fillStyle = '#fce0a0'; ctx.fillRect(cx - 8, Math.round(ry + 2), 16, 1); // Messinggehäuse unter der Schiene
      for (const wx of [cx - 5, cx + 5]) { ctx.fillStyle = '#24242c'; ctx.fillRect(wx - 2, Math.round(ry - 2), 4, 4); ctx.fillStyle = '#e8e8f0'; ctx.fillRect(wx - 1 + (Math.floor(turn) & 1), Math.round(ry - 1), 1, 1); } // Räder
      ctx.fillStyle = '#7c7c8c'; ctx.fillRect(cx - 1, Math.round(ry + 6), 2, 3);
      }
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
    if (UHR3D.get('dial') && R === 72) { // Blender-Bilder: Zifferblatt, gegenläufige Stachelnabe, geschmiedeter Zeiger
      UHR3D.draw(ctx, 'dial', cx, cy, 94, 94);
      UHR3D.draw(ctx, 'hub', cx, cy, 20, 20, -a * 1.5 + 0.0001);
      UHR3D.draw(ctx, 'hand', cx, cy, 22, 7, a - Math.PI / 2);
    } else {
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
    }
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

// ---------------- Kuckucksuhr (Nebenboss links an der Zeigerkammer): der Kuckuck kommt nur zur vollen Stunde heraus ----------------
// Unten Stachelboden, links und rechts ein Sims, darüber zwei Ankerringe. Zur vollen Stunde schlägt die Uhr, das Türchen springt
// auf und der Kuckuck fährt auf einem Scherengitter bis neben den Ring, an dem der Held hängt – in wechselnder Höhe und meist zur
// Mitte hin (vom Sims aus nicht zu erreichen). Treffen: mit dem Seil hineinschwingen (Rammstoß, die Seillänge bestimmt die Höhe)
// oder mit der Peitsche. Er ruft „KUCKUCK!“ – Noten fliegen auf den Helden zu (↑↓ ausweichen, zurückschlagen). Das Pendel fegt
// durch die Mitte. Ab halber Kraft: viertelstündlich (öfter, Noten-Fächer, weiteres Pendel).
class KuckuckNote extends EProj {
  constructor(x, y, vx, vy) { super('note', x, y, vx, vy, 0, 2); this.w = 8; this.h = 8; this.x = x - 4; this.y = y - 4; this.ph = rnd(0, 6); }
  update() { super.update(); this.y += Math.sin(this.t * 0.18 + this.ph) * 0.35; }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), c = this.reflected ? '#a4e4fc' : (this.t >> 3) % 2 ? '#fcfcfc' : '#f8d878';
    ctx.fillStyle = '#1c1028'; ctx.fillRect(x, y + 4, 5, 4); ctx.fillRect(x + 4, y - 3, 2, 8); // Schatten-Rand
    ctx.fillStyle = c; ctx.fillRect(x + 1, y + 4, 3, 3); ctx.fillRect(x + 4, y - 2, 1, 7); ctx.fillRect(x + 5, y - 2, 2, 1); ctx.fillRect(x + 6, y - 1, 1, 1); // Achtelnote
  }
}
class Kuckucksuhr extends Boss {
  constructor(ax, aw) {
    const cx = ax + aw / 2;
    super(cx - 44, 88, 88, 62, 48, 2);
    this.ax = ax; this.aw = aw; this.cxC = cx; this.mini = true; this.score = 14000; this.nameKey = 'bossKuckuck'; this.music = 'kuckuck'; this.keepMusic = true;
    this.door = { x: cx, y: 102 }; this.piv = { x: cx, y: 150 }; this.len = 70; this.lootY = 200; // sichtbar: Welt-y 64 bis 272
    this.state = 'intro'; this.timer = 0; this.ph2 = false; this.ext = 0; this.open = 0; this.hx = cx; this.hy = 102; this.tx = cx; this.ty = 160;
    this.popN = 0; this.popHits = 0; this.hour = 9; this.handA = 0; this.bonkT = 0; this.limp = 0;
  }
  rings() { return (W.rings || []).filter(r => !(r instanceof HandRing) && !(r instanceof TrolleyRing)); }
  pend() { // Pendel: Winkel und Lage des Gewichts
    const per = this.ph2 ? 170 : 220, amp = this.ph2 ? 0.95 : 0.75, a = this.dying ? 0 : amp * Math.sin(this.t * Math.PI * 2 / per);
    return { a, x: this.piv.x + Math.sin(a) * this.len, y: this.piv.y + Math.cos(a) * this.len };
  }
  headBox() { return { x: this.hx - 12, y: this.hy - 10, w: 24, h: 20 }; }
  out() { return (this.state === 'out' || this.state === 'shout') && this.ext > 0.6 && !this.dying; }
  hurtBoxes() { return this.out() ? [this.headBox()] : []; }
  vulnerable() { return this.out(); }
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.hx, W.cam.x + 80, W.cam.x + View.w - 80), Math.max(this.hy - 26, W.cam.y + 46), tr(k), col); }
  hit(dmg, id) {
    const r = super.hit(dmg, id);
    if (r && !this.dying) { this.popHits++; if (this.popHits >= 2) this.go('in'); }
    return r;
  }
  pickTarget() {
    const p = W.player, rs = this.rings(); if (!rs.length) { this.tx = this.cxC; this.ty = 170; return; }
    const r = p.state === 'swing' && rs.includes(p.ring) ? p.ring : rs.reduce((a, b) => Math.abs(b.cx - p.cx) < Math.abs(a.cx - p.cx) ? b : a);
    const inward = Math.random() < (this.ph2 ? 0.85 : 0.7), side = (Math.sign(this.cxC - r.cx) || 1) * (inward ? 1 : -1);
    const high = Math.random() < 0.5, a = side * (high ? rnd(0.5, 1.2) : rnd(0.8, 1.1)), d = high ? rnd(26, 40) : rnd(104, 116); // ganz nah (Seil kurz) oder weit unten (Seil lang) – mittellang trifft nie
    this.tx = clamp(r.cx + Math.sin(a) * d, this.ax + 20, this.ax + this.aw - 20); this.ty = clamp(r.cy + Math.cos(a) * d, 116, 212);
  }
  shoot() {
    const p = W.player, n = this.ph2 ? 3 : 1, sp = this.ph2 ? 1.45 : 1.2, a0 = Math.atan2(p.cy - this.hy, p.cx - this.hx);
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.32; W.spawn(new KuckuckNote(this.hx, this.hy - 4, Math.cos(a) * sp, Math.sin(a) * sp)); }
    this.say('bossKuckuckShout', '#f8d878'); Audio8.sfx('cuckoo', this.hx);
  }
  update() {
    this.tick();
    const p = W.player, P = this.pend();
    if (this.bonkT > 0) this.bonkT--;
    this.handA += this.ph2 ? 0.05 : 0.012; // Zeiger auf dem Zifferblatt: ab halber Kraft rasen sie
    if (this.dying) { // Feder springt: Zahnräder fliegen heraus, der Kuckuck hängt schlaff am Gitter
      this.limp = Math.min(1, this.limp + 0.02); this.ext = Math.max(this.ext, 0.7); this.open = 1;
      this.hx = this.door.x + (this.tx - this.door.x) * this.ext; this.hy = this.door.y + (this.ty - this.door.y) * this.ext + this.limp * 10;
      if (this.dying === 1) { Audio8.sfx('cuckoo', this.hx); this.say('bossKuckuckDie', '#f8d878'); }
      if (this.dying % 6 === 0) W.spawn(new Particle(this.cxC + rnd(-40, 40), rnd(96, 150), rnd(-2.4, 2.4), rnd(-3.2, -0.8), ['#c89020', '#8c8ca0', '#f8d878'][this.dying % 3], 60, 2, 0.14));
      if (this.dying % 11 === 0) Audio8.sfx('cog', this.cxC);
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; this.say('bossKuckuckRage', '#fc7c5c'); W.flash = 6; Audio8.tempo(1.1); Audio8.sfx('bell', this.cxC); }
    // Pendel trifft (Kreis gegen Helden-Rechteck)
    if (p.alive && p.inv <= 0) { const nx = clamp(P.x, p.x, p.x + p.w), ny = clamp(P.y, p.y, p.y + p.h); if (Math.hypot(nx - P.x, ny - P.y) < 12) { p.hurt(this.dmg, P.x); Audio8.sfx('clank', P.x); } }
    if (this.t % 26 === 0 && Math.abs(P.a) > 0.6) Audio8.sfx('tick', this.cxC); // Tick am Umkehrpunkt
    const lerp = (v, to, k) => v + (to - v) * k;
    if (this.state === 'intro') { // Uhr schlägt, Türchen klappt einmal auf und zu
      if (this.timer === 20 || this.timer === 60) Audio8.sfx('bell', this.cxC);
      this.open = this.timer > 70 && this.timer < 130 ? 1 : 0; this.ext = this.open ? 0.15 : 0;
      if (this.timer === 80) { this.hx = this.door.x; this.hy = this.door.y; this.say('bossKuckuckShout', '#f8d878'); Audio8.sfx('cuckoo', this.cxC); }
      if (this.timer > 140) this.go('wait');
    } else if (this.state === 'wait') { // Türchen zu, die Uhr tickt
      this.open = 0; this.ext = lerp(this.ext, 0, 0.3);
      if (this.timer > (this.ph2 ? 95 : 150)) { this.pickTarget(); this.popN++; this.popHits = 0; this.go('out'); Audio8.sfx('bell', this.cxC); this.hour = this.hour % 12 + 1; }
    } else if (this.state === 'out') { // Scherengitter fährt aus
      this.open = 1; this.ext = Math.min(1, this.ext + (this.ph2 ? 0.06 : 0.045));
      if (this.ext >= 1) this.go('shout');
    } else if (this.state === 'shout') { // Kuckuck ruft – zwei- bzw. dreimal
      const at = this.ph2 ? [20, 60, 100] : [34, 96];
      if (at.includes(this.timer)) this.shoot();
      if (this.timer > (this.ph2 ? 125 : 150)) this.go('in');
    } else if (this.state === 'in') { // zurück ins Türchen
      this.ext = Math.max(0, this.ext - 0.07);
      if (this.ext <= 0) { this.open = 0; this.go('wait'); }
    }
    this.hx = this.door.x + (this.tx - this.door.x) * this.ext; this.hy = this.door.y + (this.ty - this.door.y) * this.ext;
    // Rammstoß: wer am Seil hängt und in den Kuckuck schwingt, trifft (einmal je Auftritt)
    if (this.out() && p.alive && p.state === 'swing' && this.ramN !== this.popN && Phys.overlap(p, this.headBox())) {
      this.ramN = this.popN;
      if (super.hit(6 * Options.dmgMul, 'kram' + this.popN)) { this.bonkT = 40; this.say('bossKuckuckBonk', '#fcfcfc'); Audio8.sfx('clank', this.hx); W.shake = Math.max(W.shake, 8); p.swW = -p.swW * 0.6; if (!this.dying) this.go('in'); }
    }
  }
  draw(ctx) {
    const cx = Math.round(this.cxC - W.cam.x), cy = -Math.round(W.cam.y), fl = this.flashT > 0 && (this.flashT & 2);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    ctx.save();
    const HD = !!UHR3D.get('house'); // Blender-Gehäuse (Bildfeld 128×96, oben bei Welt-y 60); Türflügel, Zeiger, Pendel, Kuckuck kommen darüber
    // Gehäuse: geschnitztes Holz, Giebeldach mit Blattwerk, darunter das Türchen; ein Hirschgeweih über dem Zifferblatt (natürlich)
    const top = cy + 88, bot = cy + 150;
    if (HD) UHR3D.draw(ctx, 'house', cx - 64, cy + 60); else {
    R(cx - 46, top, 92, bot - top, '#3c2410'); R(cx - 44, top + 2, 88, bot - top - 4, '#6c4420'); R(cx - 40, top + 6, 80, bot - top - 12, '#5c3818');
    for (let k = 0; k < 6; k++) R(cx - 44 + k * 16, bot - 6, 10, 4, '#8c5c2c'); // Zierleiste
    ctx.fillStyle = '#2c1808'; ctx.beginPath(); ctx.moveTo(cx - 60, top + 6); ctx.lineTo(cx, top - 18); ctx.lineTo(cx + 60, top + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7c4c20'; ctx.beginPath(); ctx.moveTo(cx - 54, top + 4); ctx.lineTo(cx, top - 14); ctx.lineTo(cx + 54, top + 4); ctx.closePath(); ctx.fill();
    for (let k = -3; k <= 3; k++) { const ly = top + 2 - (3 - Math.abs(k)) * 5; R(cx + k * 15 - 3, ly, 6, 4, '#3c6c2c'); R(cx + k * 15 - 1, ly - 1, 2, 2, '#5c9c3c'); } // Blattwerk am Giebel
    }
    // Türchen (zwei Flügel)
    const dx = cx, dy = cy + this.door.y, op = this.open;
    if (!HD) R(dx - 11, dy - 9, 22, 18, '#1c0c04');
    const wing = (x, w) => { if (w < 1) return; R(x, dy - 8, w, 16, '#8c5c2c'); R(x, dy - 8, w, 1, '#c8945c'); R(x + (w > 3 ? 1 : 0), dy - 5, Math.max(1, w - 2), 1, '#5c3818'); R(x + (w > 3 ? 1 : 0), dy + 3, Math.max(1, w - 2), 1, '#5c3818'); };
    wing(dx - 10 - op * 6, 10 - op * 6); wing(dx + op * 6, 10 - op * 6); // Türflügel mit Kassetten
    if (!HD) R(dx - 12, dy + 9, 24, 2, '#a87444'); // Sitzstange
    // Zifferblatt mit Geweih darüber
    const fx = cx, fy = cy + 130;
    if (!HD) for (const s2 of [-1, 1]) { R(fx + s2 * 22 - (s2 < 0 ? 2 : 0), fy - 20, 2, 8, '#d8c8a0'); R(fx + s2 * 24 - (s2 < 0 ? 2 : 0), fy - 22, 2, 4, '#d8c8a0'); R(fx + s2 * 20 - (s2 < 0 ? 2 : 0), fy - 23, 2, 3, '#d8c8a0'); }
    if (!HD) {
      ctx.fillStyle = '#c89020'; ctx.beginPath(); ctx.arc(fx, fy, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#efe4c4'; ctx.beginPath(); ctx.arc(fx, fy, 16, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 12; k++) { const b = k * Math.PI / 6; R(fx + Math.sin(b) * 13 - 1, fy - Math.cos(b) * 13 - 1, 2, 2, '#3c2c1c'); }
    }
    const hA = (this.hour / 12) * Math.PI * 2 + this.handA * 0.08, mA = this.handA;
    ctx.strokeStyle = '#1c1c24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.sin(hA) * 8, fy - Math.cos(hA) * 8); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.sin(mA) * 13, fy - Math.cos(mA) * 13); ctx.stroke();
    R(fx - 1, fy - 1, 3, 3, '#a83c2c');
    // Tannenzapfen-Gewichte an Ketten
    for (const s of [-1, 1]) { const wx = cx + s * 30, wy = cy + 150 + 22 + s * Math.sin(this.t * 0.01) * 5; for (let y = cy + 150; y < wy; y += 4) R(wx, y, 1, 2, '#8c8ca0'); if (!UHR3D.draw(ctx, 'cone', wx - 4.5, wy - 1)) { R(wx - 4, wy, 9, 14, '#6c4420'); for (let k = 0; k < 3; k++) R(wx - 3, wy + 2 + k * 4, 7, 2, '#a87444'); } }
    // Pendel
    const P = this.pend(), px = Math.round(P.x - W.cam.x), py = Math.round(P.y - W.cam.y), qx = cx, qy = cy + this.piv.y;
    ctx.strokeStyle = '#a8801c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
    if (!UHR3D.draw(ctx, 'bob', px, py, 14, 14)) {
      ctx.fillStyle = '#5c3c14'; ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fce890'; ctx.beginPath(); ctx.arc(px - 3, py - 3, 4, 0, Math.PI * 2); ctx.fill();
      R(px - 1, py - 6, 2, 12, '#a8801c'); R(px - 6, py - 1, 12, 2, '#a8801c'); // Blattrosette
    }
    // Scherengitter und Kuckuck
    if (this.ext > 0.02) {
      const hx = Math.round(this.hx - W.cam.x), hy = Math.round(this.hy - W.cam.y), L = Math.hypot(hx - dx, hy - dy), n = Math.max(2, Math.round(L / 12)), ux = (hx - dx) / L || 0, uy = (hy - dy) / L || 0, w = 5 + (1 - this.ext) * 5;
      ctx.strokeStyle = '#3c2410'; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= n; k++) { const t = k / n, x = dx + (hx - dx) * t, y = dy + (hy - dy) * t, s = k % 2 ? w : -w; ctx.lineTo(x - uy * s, y + ux * s); } ctx.stroke();
      ctx.strokeStyle = '#a87444'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k <= n; k++) { const t = k / n, x = dx + (hx - dx) * t, y = dy + (hy - dy) * t, s = k % 2 ? -w : w; ctx.lineTo(x - uy * s, y + ux * s); } ctx.stroke();
      const f = hx < cx ? -1 : 1, beak = this.state === 'shout' && (this.timer % 62) < 26 ? 3 : 0, wb = Math.round(Math.sin(this.t * 0.3) * (this.out() ? 1 : 0));
      const B = (x, y, w2, h, c) => R(f > 0 ? hx + x : hx - x - w2, hy + y + this.limp * 0, w2, h, fl ? '#fcfcfc' : c);
      const bs = UHR3D.get(beak ? 'bird1' : 'bird0');
      if (bs && !fl) UHR3D.draw(ctx, beak ? 'bird1' : 'bird0', hx, hy + wb, 16, 12, this.limp * 0.7 * f, f < 0); else {
      B(-10, -6 + wb, 16, 12, '#8c4c1c'); B(-12, -3 + wb, 6, 8, '#6c3410'); B(-10, 4 + wb, 14, 3, '#c87c3c'); // Leib, Flügel, Bauch
      B(2, -10 + wb, 10, 9, '#9c5c24'); B(8, -8 + wb, 2, 2, this.limp > 0.5 ? '#3c2c1c' : '#fcfcfc'); B(9, -7 + wb, 1, 1, '#1c1c24'); // Kopf, Auge
      B(12, -6 + wb - beak, 6, 2, '#f8b800'); B(12, -4 + wb + beak, 5, 2, '#d89000'); // Schnabel (offen beim Rufen)
      B(-14, -2 + wb, 4, 2, '#5c2c0c'); B(-15, 0 + wb, 3, 2, '#5c2c0c'); // Schwanz
      }
      if (this.bonkT > 0) for (let k = 0; k < 3; k++) { const a = this.t * 0.2 + k * 2.1; R(hx + Math.cos(a) * 10, hy - 14 + Math.sin(a) * 3, 2, 2, '#f8d878'); } // Sternchen nach dem Rammstoß
      if (this.out() && !this.dying && (this.t >> 3) % 2) { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fce890'; ctx.lineWidth = 1; ctx.strokeRect(hx - 14, hy - 12, 28, 24); ctx.globalAlpha = 1; } // verwundbar: Rahmen blinkt
    }
    ctx.restore();
  }
}
// Die Uhr ohne Kampf: vor dem Kampf steht sie still (das Pendel ruht, bis der Held die Arena betritt), nach dem Sieg bleibt sie als
// Wrack – Türchen offen, der Kuckuck hängt schlaff am halb ausgefahrenen Gitter. Zeichnet mit Kuckucksuhr.prototype.draw.
class KuckuckWrack extends Ent {
  constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.d = d; this.noWrap = true; this.k = null; }
  update() { this.t++; }
  draw(ctx) {
    if (W.boss && W.boss instanceof Kuckucksuhr) return;
    const done = !!(W.miniDone && W.miniDone[W.stage + ':' + W.roomIdx]);
    if (!this.k || this.k.done !== done) {
      const ax = this.d.x0 * T, aw = (this.d.x1 - this.d.x0) * T, cx = ax + aw / 2, k = Object.create(Kuckucksuhr.prototype);
      Object.assign(k, { cxC: cx, door: { x: cx, y: 102 }, piv: { x: cx, y: 150 }, len: 70, t: 0, hour: done ? 1 : 9, handA: done ? 0.42 : 0, open: done ? 1 : 0, ext: done ? 0.45 : 0, tx: cx + 46, ty: 186, limp: 1, dying: 1, state: 'dead', flashT: 0, bonkT: 0, ph2: false, done });
      k.hx = k.door.x + (k.tx - k.door.x) * k.ext; k.hy = k.door.y + (k.ty - k.door.y) * k.ext + 10; this.k = k;
    }
    this.k.t = this.t; this.k.draw(ctx);
  }
}
// Zahnrad-Wand (Uhrwerk-Räume): hinter den Kacheln greift eine Kette großer Messing- und kleiner Eisenräder ineinander und dreht
// sich langsam (Übersetzung nach Zähnezahl 24:14), mit Parallaxe 0,7. Nur mit den Blender-Bildern; sonst bleibt die Wand leer.
// d: y (Kachelreihe der Kette), y2 (optional zweite Kette), sp (Grundgeschwindigkeit)
class GearWall extends Ent {
  constructor(d) {
    super(0, 0, 1, 1); this.kind = 'prop'; this.d = d; this.noWrap = true; this.g = [];
    const k = 0.7, span = W.room.w * T * k + 640;
    for (const row of [d.y, d.y2].filter(v => v !== undefined)) {
      let x = -40 + (row * 37) % 60, y = row * T * k, big = true, dir = 1, i = 0;
      while (x < span) {
        this.g.push({ x, y, big, dir, ph: i * 0.37 });
        const r0 = big ? 54 : 30, r1 = big ? 30 : 54, dist = r0 + r1 - 7, th = (i % 2 ? -0.55 : 0.55) + Math.sin(i * 1.7) * 0.25;
        x += Math.cos(th) * dist; y += Math.sin(th) * dist; big = !big; dir = -dir; i++;
      }
    }
  }
  update() { this.t++; }
  drawBack(ctx) {
    if (!UHR3D.get('gearB')) return;
    const k = 0.7, ox = W.cam.x * k, oy = W.cam.y * k, w0 = (this.d.sp || 0.004) * this.t;
    ctx.save(); ctx.globalAlpha = 0.5;
    for (const g of this.g) {
      const x = g.x - ox, y = g.y - oy, r = g.big ? 56 : 32;
      if (x + r < 0 || x - r > View.w || y + r < 0 || y - r > 208) continue;
      UHR3D.draw(ctx, g.big ? 'gearB' : 'gearS', x, y, g.big ? 56 : 32, g.big ? 56 : 32, g.dir * w0 * (g.big ? 1 : 24 / 14) + g.ph);
    }
    ctx.restore();
  }
}

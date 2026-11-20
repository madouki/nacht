// Angler Anselm (Zwischengegner in der versunkenen Kapelle, nur mit dem Taucherhelm erreichbar): ein Tiefsee-Anglerfisch, der das
// Ewige Licht der Kapelle als Köder an seiner Angel trägt – im dunklen Becken das hellste Licht. Kampf unter Wasser:
//   treiben  – hält seitlich Abstand zum Helden, wiegt sich auf und ab
//   ködern   – das Licht flackert hell auf (Ansage), dann schießt er mit offenem Maul auf die Stelle, an der der Held war
//   zuschnappen → erschöpft: gekippt, X-Augen, Angel hängt – jetzt sitzen Treffer besser (×1,5)
//   pusten   – Backen voll, dann ein Fächer aus Luftblasen, die langsam steigen
// Ab halber Energie schnappt er zweimal hintereinander, und das Licht flackert (Stromausfall unter Wasser). Bilder: tools/blender/
// angler_bl.py, pack_angler.py
'use strict';
const ANGLER_ART = (() => {
  const MAP = {"angler_swim0":[0,0,96,72],"angler_swim1":[97,0,96,72],"angler_open":[194,0,96,72],"angler_chomp":[291,0,96,72],"angler_tired":[388,0,96,72]};
  const LAMP = { swim0: [80, 16], swim1: [80, 16], open: [80, 16], chomp: [80, 16], tired: [73.1, 50.8] }; // Lampe im 96×72-Bild, Blick nach rechts
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of Object.keys(LAMP)) S[k] = fr('angler_' + k);
  };
  img.src = 'img/angler3d.png?v=' + (window.BUILD || '');
  return { MAP, LAMP, get: () => S };
})();

class Blase extends Ent { // Luftblase des Anglers: treibt langsam, steigt, platzt am Helden oder an der Wasseroberfläche
  constructor(x, y, vx, vy, dmg) { super(x - 5, y - 5, 10, 10); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.dmg = dmg; this.ph = rnd(0, 6); }
  update() {
    this.t++; this.x += this.vx + Math.sin(this.t * 0.11 + this.ph) * 0.35; this.y += this.vy; this.vx *= 0.995; this.vy = Math.max(-0.9, this.vy - 0.006);
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.pop(); return; }
    const top = ((W.room.waterLine || 0) + 0.5) * T;
    if (this.t > 260 || this.y < top || this.x < W.arenaX - 20 || this.x > W.arenaX + W.arenaW + 20) this.pop();
  }
  pop() { this.dead = true; Audio8.sfx('splash', this.cx); for (let i = 0; i < 5; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-0.8, 0.8), rnd(-0.9, 0.2), '#c8f0fc', 18, 1, -0.02)); }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 12, c: [160, 230, 255], a: 0.18 }); }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), r = 5 + Math.sin(this.t * 0.2 + this.ph) * 0.6;
    ctx.strokeStyle = 'rgba(200,240,255,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(160,220,255,0.22)'; ctx.beginPath(); ctx.arc(x, y, r - 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 3, 2, 1); ctx.fillRect(x - 3, y - 2, 1, 1);
  }
}

class AnglerFisch extends Boss {
  constructor(ax, aw) {
    const floor = (W.room.h - 2) * T, top = ((W.room.waterLine || 0) + 1) * T;
    super(ax + aw - 90, floor - 64, 52, 30, 40, 2);
    this.ax = ax; this.aw = aw; this.floor = floor; this.top = top; this.mini = true; this.score = 14000; this.nameKey = 'bossAngler'; this.music = 'kraken';
    this.face = -1; this.state = 'intro'; this.timer = 0; this.vx = 0; this.vy = 0; this.ph2 = false; this.lootY = floor - 40; this.swim = 0; this.lunges = 0; this.glow = 0; this.flick = 0;
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { return super.hit(this.state === 'tired' ? dmg * 1.5 : dmg, id); } // erschöpft: Treffer sitzen besser
  pose() { const s = this.state; return s === 'tired' ? 'tired' : s === 'lunge' ? 'open' : s === 'chomp' || s === 'puff' ? 'chomp' : ((this.swim >> 4) & 1) ? 'swim1' : 'swim0'; }
  frame() { const fl = this.face < 0; return { fl, x0: Math.round(this.cx - (fl ? 52 : 44)), y0: Math.round(this.cy - 40) }; } // Leibmitte im Bild bei (44, 40)
  lamp() { const L = ANGLER_ART.LAMP[this.pose()], f = this.frame(); return [f.fl ? f.x0 + 96 - L[0] : f.x0 + L[0], f.y0 + L[1]]; }
  mouth() { const f = this.frame(); return [f.fl ? f.x0 + 96 - 68 : f.x0 + 68, f.y0 + 47]; }
  update() {
    if (this.dying) { this.updateDeath(); return; }
    this.tick(); const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy, sp = this.ph2 ? 1.25 : 1;
    this.swim++; if (this.flick > 0) this.flick--;
    if (!this.ph2 && this.hp < this.maxHp / 2) { // Stromausfall unter Wasser: das Licht flackert, er schnappt zweimal
      this.ph2 = true; W.shake = Math.max(W.shake, 10); Audio8.sfx('roar', this.cx); this.flick = 60;
      W.spawn(new Shock(this.cx, this.cy, 46, '#fc6c4c', 3));
    }
    if (this.ph2 && this.state === 'drift' && Math.random() < 0.01) this.flick = 14 + Math.floor(rnd(0, 18));
    switch (this.state) {
      case 'intro': // steigt aus der Tiefe, das Licht glimmt auf
        this.face = dx > 0 ? 1 : -1; this.y -= 0.3; this.glow = Math.min(1, this.timer / 60);
        if (this.timer === 36) Audio8.sfx('bell', this.cx);
        if (this.timer > 90) this.go('drift');
        break;
      case 'drift': {
        this.face = dx > 0 ? 1 : -1;
        const tx = p.cx - this.face * 100 - this.w / 2, ty = p.cy - this.h / 2 + Math.sin(this.t * 0.04) * 14;
        this.vx = (this.vx + clamp((tx - this.x) * 0.004, -0.06, 0.06)) * 0.94; this.vy = (this.vy + clamp((ty - this.y) * 0.004, -0.05, 0.05)) * 0.94;
        this.x += this.vx; this.y += this.vy;
        if (this.timer > (this.ph2 ? 52 : 74)) { this.vx = this.vy = 0; this.go(Math.random() < 0.58 ? 'tell' : 'puff'); Audio8.sfx(this.state === 'tell' ? 'tell' : 'splash', this.cx); }
        break;
      }
      case 'tell': // Ansage: das Ewige Licht flackert grell, er nimmt Maß
        this.face = dx > 0 ? 1 : -1; this.x -= this.face * 0.3;
        if (this.timer > 34 / sp) {
          const d = Math.hypot(dx, dy) || 1, v = this.ph2 ? 3.9 : 3.3; this.vx = dx / d * v; this.vy = dy / d * v; this.go('lunge'); Audio8.sfx('whoosh', this.cx);
        }
        break;
      case 'lunge': {
        this.x += this.vx; this.y += this.vy;
        const edge = this.x <= this.ax + 5 || this.x >= this.ax + this.aw - this.w - 5 || this.y <= this.top + 7 || this.y >= this.floor - this.h - 3;
        if (this.timer > 46 || edge) { this.go('chomp'); Audio8.sfx('chomp', this.cx); W.shake = Math.max(W.shake, 6); Input.rumble(0.4, 0.3, 140); }
        break;
      }
      case 'chomp':
        this.vx *= 0.8; this.vy *= 0.8; this.x += this.vx; this.y += this.vy;
        if (this.timer > 12) {
          if (this.ph2 && ++this.lunges % 2 === 1) this.go('tell');
          else {
            this.go('tired'); Audio8.sfx('latch', this.cx);
            if (typeof Castle !== 'undefined' && Castle.flags && !Castle.flags.angler_tip) { Castle.setFlag('angler_tip'); Game.note('bossAnglerTip'); }
          }
        }
        break;
      case 'tired': // gekippt, X-Augen, sinkt ein wenig: jetzt zuschlagen
        this.y += 0.22; if (this.timer % 16 === 0) W.spawn(new Particle(this.cx + rnd(-10, 10), this.y, rnd(-0.2, 0.2), -0.6, '#a4e4fc', 40, 1, -0.01));
        if (this.timer > (this.ph2 ? 56 : 78)) this.go('drift');
        break;
      case 'puff': // Backen voll Luft, dann ein Fächer aus Blasen
        this.face = dx > 0 ? 1 : -1;
        if (this.timer === 24) {
          const [mx, my] = this.mouth(), n = this.ph2 ? 5 : 3, a = Math.atan2(p.cy - my, p.cx - mx);
          for (let i = 0; i < n; i++) { const b = a + (i - (n - 1) / 2) * 0.32; W.spawn(new Blase(mx, my, Math.cos(b) * 1.35, Math.sin(b) * 1.35, Math.max(1, this.dmg - 1))); }
          Audio8.sfx('splash', this.cx);
        }
        if (this.timer > 44) this.go('drift');
        break;
    }
    this.x = clamp(this.x, this.ax + 4, this.ax + this.aw - this.w - 4); this.y = clamp(this.y, this.top + 6, this.floor - this.h - 2);
    if (this.state !== 'tired' && this.state !== 'intro') this.touch();
  }
  lightUp(L, cx, cy) {
    if (!ANGLER_ART.get()) return;
    const [lx, ly] = this.lamp(), tell = this.state === 'tell' ? 0.25 + 0.25 * ((this.timer >> 1) & 1) : 0, off = this.flick > 0 && (this.flick & 4);
    const a = this.state === 'tired' || this.dying ? 0.16 : off ? 0.06 : 0.42 * this.glow + tell;
    L.push({ x: lx - cx, y: ly - cy, r: 64, c: [255, 96, 64], a });
  }
  draw(ctx) {
    const S = ANGLER_ART.get(); if (!S) return;
    const f = this.frame(), wob = this.state === 'tell' ? ((this.t >> 1) & 1) : 0;
    this.ds(ctx, S[this.pose()], f.x0 + wob - Math.round(W.cam.x), f.y0 - Math.round(W.cam.y), f.fl, this.flashT > 0 && (this.flashT & 2));
    if (this.state === 'tired' || this.dying) return;
    const [lx, ly] = this.lamp(), off = this.flick > 0 && (this.flick & 4), k = (this.state === 'tell' ? 1.6 : 1) * this.glow * (off ? 0.2 : 1), x = lx - W.cam.x, y = ly - W.cam.y;
    if (k <= 0.02) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16 * k + 4); g.addColorStop(0, `rgba(255,190,140,${(0.55 * Math.min(1, k)).toFixed(2)})`); g.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - 24, y - 24, 48, 48); ctx.restore();
  }
}

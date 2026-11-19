// Leben im Schloss: harmlose Kleintiere, die auf den Helden reagieren (Ratten flitzen davon, Krähen und Tauben fliegen auf, Motten
// umkreisen die Kerzen, Spinnen ziehen sich am Faden hoch, Pinguine rutschen auf dem Bauch davon), dazu leuchtende Pilze, Glühwürmchen
// und Wurzelvorhänge in den Höhlen. Alles nur Bild: keine Treffer, keine Kollision mit dem Helden; im Bosskampf verschwinden sie.
'use strict';
const Leben = (() => {
  const BY_THEME = {
    hall: ['rat', 'moth', 'moth'], crypt: ['rat', 'rat', 'spider', 'moth'], cave: ['rat', 'spider', 'frog', 'fly', 'fly'], library: ['mouse', 'moth', 'moth', 'spider'],
    tower: ['pigeon', 'pigeon', 'spider'], courtyard: ['crow', 'crow', 'moth'], forest: ['crow', 'frog', 'fly', 'fly', 'fly'], hotel: ['mouse', 'moth', 'moth'],
    station: ['pigeon', 'pigeon', 'rat'], gallery: ['moth', 'moth', 'mouse'], cathedral: ['pigeon', 'moth'], sun: ['pigeon', 'pigeon'], spire: ['pigeon'],
    expo: ['butterfly', 'butterfly', 'butterfly', 'frog'], werk: ['rat', 'moth'], lab: ['rat', 'spider'], passage: ['pigeon', 'moth'], theater: ['mouse', 'moth', 'moth'],
    ice: ['penguin', 'penguin'], bridge: ['crow', 'crow'], throne: ['rat', 'spider', 'moth'], ship: ['rat', 'crow'], mirror: ['moth'],
  };
  const rngOf = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed & 0xffff) / 0x10000; };
  const free = (c, r) => Phys.tile(c, r) === '.';
  // Standfläche: die unterste begehbare Kante dieser Spalte
  function floorRow(c) { const h = W.room.h; for (let r = h - 1; r > 1; r--) if (Phys.solidTile(c, r) && free(c, r - 1)) return r; return -1; }
  function ceilRow(c) { const h = W.room.h; for (let r = 0; r < h - 4; r++) if (Phys.solidTile(c, r) && free(c, r + 1)) return r + 1; return 0; }
  let cry = 0; // höchstens ein Tierlaut alle paar Sekunden

  class Tier extends Ent {
    constructor(art, x, y, rnd) {
      super(x, y, 8, 5); this.kind = 'prop'; this.art = art; this.noWrap = true; this.ph = rnd() * 6.28; this.dir = rnd() < 0.5 ? -1 : 1; this.mode = 'calm'; this.wait = 30 + rnd() * 120; this.rnd = rnd;
      this.x0 = x; this.y0 = y; this.vx = 0; this.vy = 0; this.len = 14 + rnd() * 36; this.pal = Math.floor(rnd() * 3);
    }
    say(n, p) { if (cry <= 0 && this.onScreen(0)) { cry = 260; if (this.rnd() < p) Audio8.sfx(n, this.cx); } }
    scared() { const p = W.player; return p.alive && !p.hidden && Math.abs(p.cx - this.cx) < 58 && Math.abs(p.cy - this.cy) < 44; }
    away() { return W.player.cx < this.cx ? 1 : -1; }
    update() {
      this.t++; if (cry > 0) cry--;
      const a = this.art, f = this['u_' + (a === 'mouse' ? 'rat' : a === 'pigeon' ? 'crow' : a)]; if (f) f.call(this);
    }
    u_rat() {
      const fast = this.mode === 'flee', sp = fast ? 2.3 : 0.42;
      if (!fast && this.scared()) { this.mode = 'flee'; this.dir = this.away(); this.say('squeak', 0.5); }
      if (!fast && --this.wait < 0) { this.wait = 40 + this.rnd() * 160; this.go = !this.go; if (this.rnd() < 0.4) this.dir = -this.dir; }
      if (fast || this.go) {
        const nx = this.x + this.dir * sp, col = Math.floor((nx + (this.dir > 0 ? this.w : 0)) / T), row = Math.floor((this.y + this.h + 2) / T);
        if (Phys.solidTile(col, row) && !Phys.solidTile(col, row - 1)) this.x = nx; else if (fast) { W.puff && W.puff(this.cx, this.y + this.h); this.dead = true; } else this.dir = -this.dir;
      }
    }
    u_crow() {
      if (this.mode === 'calm') {
        if (this.scared()) { this.mode = 'fly'; this.dir = this.away(); this.vx = this.dir * 1.5; this.vy = -1.7; this.say(this.art === 'crow' ? 'raven' : 'flap', 0.6); }
        else if (--this.wait < 0) { this.wait = 50 + this.rnd() * 140; if (this.rnd() < 0.3) this.dir = -this.dir; }
      } else { this.x += this.vx; this.y += this.vy; this.vy = Math.max(-2.3, this.vy - 0.02); if (!this.onScreen(30)) this.dead = true; }
    }
    u_moth() {
      if (this.lamp === undefined) { let best = null, bd = 150; for (const e of W.ents) if (e.kind === 'candle') { const d = Math.hypot(e.cx - this.x0, e.cy - this.y0); if (d < bd) { bd = d; best = e; } } this.lamp = best; }
      const c = this.lamp && !this.lamp.dead ? this.lamp : null, ox = c ? c.cx : this.x0, oy = c ? c.cy - 4 : this.y0 - 30;
      this.x = ox + Math.cos(this.t * 0.09 + this.ph) * (11 + 6 * Math.sin(this.t * 0.023 + this.ph)); this.y = oy + Math.sin(this.t * 0.13 + this.ph * 2) * 9;
    }
    u_butterfly() {
      const up = this.scared() ? -0.6 : 0; this.y0 = clamp(this.y0 + up + Math.sin(this.t * 0.011 + this.ph) * 0.12, 24, W.room.h * T - 44);
      this.x0 += Math.sin(this.t * 0.007 + this.ph) * 0.34; this.x = this.x0 + Math.sin(this.t * 0.04 + this.ph) * 10; this.y = this.y0 + Math.sin(this.t * 0.17 + this.ph) * 5;
    }
    u_fly() { this.x = this.x0 + Math.sin(this.t * 0.013 + this.ph) * 42; this.y = this.y0 + Math.sin(this.t * 0.019 + this.ph * 2) * 22; }
    u_frog() {
      if (this.onGround === false) { this.x += this.vx; this.vy += 0.17; this.y += this.vy; const row = Math.floor((this.y + this.h) / T); if (this.vy > 0 && Phys.solidTile(Math.floor(this.cx / T), row)) { this.y = row * T - this.h; this.onGround = true; this.hops = (this.hops || 0) + 1; } if (this.y > W.room.h * T) this.dead = true; return; }
      if (this.scared() || (this.hops > 0 && this.hops < 3)) { this.dir = this.away(); this.vx = this.dir * 1.25; this.vy = -2.5; this.onGround = false; }
      else if (this.hops >= 3 && !this.onScreen(16)) this.dead = true;
    }
    u_spider() {
      const want = this.scared() ? 0 : this.len + Math.sin(this.t * 0.02 + this.ph) * 6; this.drop = (this.drop === undefined ? want : this.drop); this.drop += clamp(want - this.drop, -2.2, 0.5); this.y = this.y0 + this.drop;
    }
    u_penguin() {
      if (this.mode === 'calm' && this.scared()) { this.mode = 'slide'; this.dir = this.away(); }
      const sp = this.mode === 'slide' ? 2.6 : 0.26;
      if (this.mode === 'calm' && --this.wait < 0) { this.wait = 80 + this.rnd() * 160; this.dir = -this.dir; }
      const nx = this.x + this.dir * sp, col = Math.floor((nx + (this.dir > 0 ? this.w : 0)) / T), row = Math.floor((this.y + this.h + 2) / T);
      if (Phys.solidTile(col, row) && !Phys.solidTile(col, row - 1)) this.x = nx; else if (this.mode === 'slide') { this.mode = 'calm'; this.dir = -this.dir; this.wait = 200; } else this.dir = -this.dir;
    }
    lightUp(L, cx, cy) { if (this.art === 'fly' && !W.boss) L.push({ x: this.cx - cx, y: this.cy - cy, r: 12 + 4 * Math.sin(this.t * 0.1 + this.ph), c: [170, 250, 110], a: 0.3 }); }
    draw(ctx) {
      if (W.boss || !this.onScreen(12)) return;
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), t = this.t, d = this.dir, R = (px, py, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(d > 0 ? x + 8 - px - w : x + px, y + py, w, h); };
      switch (this.art) {
        case 'rat': case 'mouse': {
          const m = this.art === 'mouse', fur = m ? '#a09488' : '#7c6858', hi = m ? '#d0c4b8' : '#b09c88', leg = (this.go || this.mode === 'flee') && (t >> 2) & 1;
          R(2, 2, 5, 3, fur); R(3, 1, 3, 1, hi); R(0, 3, 3, 2, fur); R(0, 2, 1, 1, '#d89888'); R(0, 4, 1, 1, '#100c0c'); R(1, 3, 1, 1, '#100810'); R(7, 3, 3, 1, '#a07868');
          ctx.fillStyle = '#2c2420'; R(leg ? 2 : 3, 5, 1, 1, '#2c2420'); R(leg ? 6 : 5, 5, 1, 1, '#2c2420'); break;
        }
        case 'crow': case 'pigeon': {
          const c = this.art === 'crow', b = c ? '#34324a' : '#8c94a8', w = c ? '#6c6a90' : '#c0c8d8', beak = c ? '#c8a040' : '#d8a060';
          if (this.mode === 'calm') { const peck = !c && (t + this.ph * 40) % 90 < 16; R(2, 2, 5, 3, b); R(3, 2, 3, 1, w); R(peck ? 0 : 1, peck ? 3 : 0, 3, 3, b); R(peck ? -1 : 0, peck ? 4 : 1, 1, 1, beak); R(peck ? 1 : 2, peck ? 4 : 1, 1, 1, '#f0e8d0'); R(7, 3, 2, 1, b); R(3, 5, 1, 1, '#c86848'); R(5, 5, 1, 1, '#c86848'); }
          else { const up = (t >> 2) & 1; R(1, 2, 7, 2, b); R(0, 2, 2, 1, beak); R(2, up ? -2 : 4, 2, 2, w); R(5, up ? -2 : 4, 2, 2, w); } break;
        }
        case 'moth': ctx.fillStyle = (t >> 1) & 1 ? '#e8dcc0' : '#a89c80'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillStyle = '#5c5040'; ctx.fillRect(x, y, 1, 1); break;
        case 'butterfly': { const open = (t >> 2) & 1, c = ['#f8a838', '#e860a0', '#68b8f8'][this.pal]; ctx.fillStyle = c; ctx.fillRect(x - (open ? 3 : 1), y - 1, open ? 3 : 1, 3); ctx.fillRect(x + 1, y - 1, open ? 3 : 1, 3); ctx.fillStyle = '#20140c'; ctx.fillRect(x, y - 1, 1, 3); break; }
        case 'fly': { const g = 0.45 + 0.55 * Math.sin(t * 0.1 + this.ph); ctx.globalAlpha = Math.max(0.2, g); ctx.fillStyle = '#d8fc88'; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = Math.max(0.05, g * 0.35); ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); ctx.globalAlpha = 1; break; }
        case 'frog': { const c = '#3c8c44', h = '#74c464'; R(1, 2, 6, 3, c); R(2, 1, 1, 1, h); R(5, 1, 1, 1, h); R(2, 0, 1, 1, '#f8f0a0'); R(5, 0, 1, 1, '#f8f0a0'); R(2, 4, 4, 1, '#d8e8a0'); R(0, 4, 1, 1, c); R(7, 4, 1, 1, c); break; }
        case 'spider': { const ty = Math.round(this.y0 - W.cam.y); ctx.fillStyle = 'rgba(214,220,235,0.34)'; ctx.fillRect(x + 1, ty, 1, Math.max(0, y - ty)); ctx.fillStyle = '#17121c'; ctx.fillRect(x, y, 3, 3); ctx.fillStyle = '#c02838'; ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillStyle = '#2c2430'; const k = (t >> 4) & 1; for (const s of [-2, 3]) { ctx.fillRect(x + s, y + k, 2, 1); ctx.fillRect(x + s, y + 2 - k, 2, 1); } break; }
        case 'penguin': {
          if (this.mode === 'slide') { R(0, 3, 9, 3, '#1c2030'); R(1, 5, 7, 1, '#f0f0f8'); R(-1, 3, 2, 1, '#e8a030'); R(0, 2, 2, 2, '#1c2030'); R(1, 2, 1, 1, '#f8f8f8'); break; }
          const w = Math.sin(t * 0.22) > 0 ? 0 : 1; R(2, -4 + w, 5, 9 - w, '#1c2030'); R(3, -1 + w, 3, 5 - w, '#f0f0f8'); R(1, -1 + w, 1, 4, '#1c2030'); R(7, -1 + w, 1, 4, '#1c2030'); R(1, -3 + w, 2, 1, '#e8a030'); R(3, -3 + w, 1, 1, '#f8f8f8'); R(2, 5, 2, 1, '#e8a030'); R(5, 5, 2, 1, '#e8a030'); break;
        }
      }
    }
  }

  // Leuchtpilze und Wurzeln: nur in echten Höhlen (nicht auf dem Mond)
  class Pilze extends Ent {
    constructor(x, y, rnd) { super(x, y, 16, 12); this.kind = 'prop'; this.noWrap = true; this.c = ['#3cc8c0', '#b060f0', '#60d870'][Math.floor(rnd() * 3)]; this.ph = rnd() * 6.28; this.n = 2 + Math.floor(rnd() * 3); this.s = [...Array(this.n)].map(() => [Math.round(rnd() * 13), 4 + Math.round(rnd() * 6), 3 + Math.round(rnd() * 2)]); }
    update() { this.t++; }
    lightUp(L, cx, cy) { const v = parseInt(this.c.slice(1), 16); L.push({ x: this.cx - cx, y: this.y + 2 - cy, r: 28 + 3 * Math.sin(this.t * 0.05 + this.ph), c: [v >> 16, (v >> 8) & 255, v & 255], a: 0.3 }); }
    draw(ctx) {
      if (!this.onScreen(12)) return;
      const X = Math.round(this.x - W.cam.x), B = Math.round(this.y + this.h - W.cam.y), g = 0.72 + 0.28 * Math.sin(this.t * 0.05 + this.ph);
      for (const [dx, h, r] of this.s) { const x = X + dx; ctx.fillStyle = '#c8c4a8'; ctx.fillRect(x, B - h, 2, h); ctx.globalAlpha = g; ctx.fillStyle = this.c; ctx.fillRect(x - r + 1, B - h - 2, r * 2, 2); ctx.fillRect(x - r + 2, B - h - 3, r * 2 - 2, 1); ctx.fillStyle = '#f4fce8'; ctx.fillRect(x - 1, B - h - 3, 1, 1); ctx.fillRect(x + r - 1, B - h - 2, 1, 1); ctx.globalAlpha = 1; }
    }
  }
  class Wurzeln extends Ent {
    constructor(x, y, rnd) { super(x, y, 30, 40); this.kind = 'prop'; this.noWrap = true; this.ph = rnd() * 6.28; this.st = [...Array(6)].map(() => [Math.round(rnd() * 30), 12 + Math.round(rnd() * 42), rnd() * 6.28]); }
    update() { this.t++; }
    draw(ctx) {
      if (!this.onScreen(40)) return;
      const X = Math.round(this.x - W.cam.x), Y = Math.round(this.y - W.cam.y);
      for (const [dx, len, p] of this.st) for (let i = 0; i < len; i += 2) { const k = i / len, sw = Math.round(Math.sin(this.t * 0.018 + p + i * 0.09) * 2.4 * k); ctx.fillStyle = i % 8 === 0 ? '#4c3c28' : '#30261c'; ctx.fillRect(X + dx + sw, Y + i, k > 0.82 ? 1 : 2, 2); if (i % 14 === 6) { ctx.fillStyle = '#3c6c3c'; ctx.fillRect(X + dx + sw + 2, Y + i, 2, 1); } }
    }
  }

  function populate(w) {
    if (typeof Castle === 'undefined' || !Castle.on) return;
    const R = w.room, st = Levels.STAGES[w.stage], moon = !!R.grav; if (R.wrap || moon || R.arena) return;
    let seed = 7; for (const ch of String(R.side || st.id + ':' + w.roomIdx)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
    const rnd = rngOf(seed || 11), list = R.hall ? ['moth'] : BY_THEME[R.theme] || [], n = R.hall ? 2 : Math.min(7, 2 + Math.floor(R.w / 22));
    for (let i = 0; i < n && list.length; i++) {
      const art = list[Math.floor(rnd() * list.length)], c = 3 + Math.floor(rnd() * Math.max(1, R.w - 6));
      if (art === 'moth') { const fr = floorRow(c); if (fr > 0) w.spawn(new Tier(art, c * T, (fr - 3) * T, rnd)); continue; }
      if (art === 'butterfly' || art === 'fly') { const fr = floorRow(c); if (fr > 0) w.spawn(new Tier(art, c * T, (fr - 3 - rnd() * 3) * T, rnd)); continue; }
      if (art === 'spider') { const cr = ceilRow(c); if (cr > 0) w.spawn(new Tier(art, c * T + 7, cr * T, rnd)); continue; }
      const fr = floorRow(c); if (fr <= 0 || Math.abs(c * T - w.player.x) < 70) continue;
      const h = art === 'penguin' ? 5 : 5; w.spawn(new Tier(art, c * T + 3, fr * T - h, rnd));
    }
    if (R.theme === 'cave' && !R.hall) {
      const m = Math.floor(R.w / 9);
      for (let i = 0; i < m; i++) { const c = 2 + Math.floor(rnd() * (R.w - 4)), fr = floorRow(c); if (fr > 0 && Phys.solidTile(c + 1, fr)) w.spawn(new Pilze(c * T, fr * T - 12, rnd)); }
      for (let i = 0; i < Math.floor(R.w / 12); i++) { const c = 2 + Math.floor(rnd() * (R.w - 6)); w.spawn(new Wurzeln(c * T, ceilRow(c) * T, rnd)); }
    }
  }
  return { populate, BY_THEME };
})();

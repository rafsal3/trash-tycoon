/* Trash Tycoon — main game logic, input, UI and YouTube Playables lifecycle. */
(function () {
  'use strict';

  const D = window.GameData;
  const RD = window.Render;
  const AU = window.AudioSys;
  const $ = id => document.getElementById(id);

  const canvas = $('game');
  const ctx = canvas.getContext('2d');

  const WORLD = 1400;
  const CENTER = WORLD / 2;
  const DEPOT_R = 90;
  const VIEW = 620;            // world units visible along the shorter screen side
  const JOY_R = 55;            // CSS px joystick radius
  const OFFLINE_CAP = 4 * 3600;

  let cw = 0, ch = 0, dpr = 1, scale = 1;

  // ---------------------------------------------------------------- State
  function defaultState() {
    return {
      v: 1,
      coins: 0,
      score: 0,            // lifetime trash recycled (sent to YouTube via sendScore)
      earned: 0,           // lifetime coins earned
      up: { speed: 0, capacity: 0, magnet: 0, value: 0, spawn: 0, bots: 0, botlvl: 0 },
      zones: ['park'],
      zone: 'park',
      tut: 0,
      last: Date.now(),
      sfx: true,
      music: true,
    };
  }
  let S = defaultState();

  const R = {
    player: { x: CENTER, y: CENTER + 140, vx: 0, vy: 0, face: 1, walk: 0, moving: false, bag: 0, bagValue: 0 },
    cam: { x: CENTER, y: CENTER },
    trash: [],
    bots: [],
    decor: [], decorFlat: [], decorTall: [],
    particles: [],
    floats: [],
    spawnTimer: 0,
    combo: 0, comboTimer: 0,
    fullMsgT: 0,
    shake: 0,
    time: 0,
    lastTs: 0,
    playing: false,
    paused: false,
    panel: null,
    dirty: false,
    saveTimer: 5,
    scoreDirty: false,
    scoreTimer: 0,
    hudTimer: 0,
    tutMove: 0,
    pendingOffline: 0,
    keys: {},
    joy: null,
  };

  // ---------------------------------------------------------------- Helpers
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);
  const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

  function fmt(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
    let i = -1;
    let x = n;
    while (x >= 1000 && i < units.length - 1) { x /= 1000; i++; }
    let s = x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x).toString();
    if (s.includes('.')) s = s.replace(/\.?0+$/, '');
    return s + units[i];
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  const zone = () => D.zones.find(z => z.id === S.zone) || D.zones[0];
  const lvl = id => S.up[id] || 0;
  const upDef = id => D.upgrades.find(u => u.id === id);

  // ---------------------------------------------------------------- Stats
  const ST = {
    speed: l => 210 * (1 + 0.07 * l),
    capacity: l => 10 + 5 * l,
    magnet: l => 44 + 9 * l,
    value: l => 1 + 0.25 * l,
    spawnMax: l => 20 + 3 * l,
    spawnInt: l => 1.1 * Math.pow(0.91, l),
    botCap: l => 3 + l,
    botSpeed: l => 115 * (1 + 0.06 * l),
  };
  const FX = {
    speed: l => Math.round(100 * (1 + 0.07 * l)) + '%',
    capacity: l => ST.capacity(l) + ' items',
    magnet: l => ST.magnet(l) + ' range',
    value: l => 'x' + ST.value(l).toFixed(2),
    spawn: l => ST.spawnMax(l) + ' max',
    bots: l => l + (l === 1 ? ' bot' : ' bots'),
    botlvl: l => 'carry ' + ST.botCap(l),
  };

  function upCost(id) {
    const u = upDef(id);
    return Math.ceil(u.base * Math.pow(u.growth, lvl(id)));
  }

  function avgTrashValue(z) {
    let tw = 0, tv = 0;
    for (const [type, w] of z.trash) { tw += w; tv += w * D.trash[type].value; }
    return tv / tw;
  }

  function trashValue(t) {
    const z = zone();
    return D.trash[t.type].value * z.mult * ST.value(lvl('value')) * (t.golden ? 10 : 1);
  }

  function botIncomePerSec() {
    const n = lvl('bots');
    if (!n) return 0;
    const cap = ST.botCap(lvl('botlvl'));
    const trip = (2 * 420) / ST.botSpeed(lvl('botlvl')) + cap * 1.2;
    return n * cap * avgTrashValue(zone()) * zone().mult * ST.value(lvl('value')) / trip;
  }

  // ---------------------------------------------------------------- World setup
  function buildDecor() {
    const z = zone();
    const rnd = mulberry32(hashStr(z.id));
    R.decor = [];
    for (const [type, count] of Object.entries(z.decor)) {
      for (let i = 0; i < count; i++) {
        let x, y, tries = 0;
        do {
          x = 40 + rnd() * (WORLD - 80);
          y = 40 + rnd() * (WORLD - 80);
          tries++;
        } while (d2(x, y, CENTER, CENTER) < (DEPOT_R + 90) ** 2 && tries < 30);
        R.decor.push({ type, x, y, v: Math.floor(rnd() * 1000) });
      }
    }
    R.decorFlat = R.decor.filter(d => RD.DECOR_FLAT[d.type]);
    R.decorTall = R.decor.filter(d => !RD.DECOR_FLAT[d.type]);
  }

  function pickTrashType(z) {
    let total = 0;
    for (const [, w] of z.trash) total += w;
    let r = Math.random() * total;
    for (const [type, w] of z.trash) { r -= w; if (r <= 0) return type; }
    return z.trash[0][0];
  }

  function spawnTrash() {
    const z = zone();
    let x, y, tries = 0;
    do {
      x = rand(50, WORLD - 50);
      y = rand(50, WORLD - 50);
      tries++;
    } while ((d2(x, y, CENTER, CENTER) < (DEPOT_R + 50) ** 2 || d2(x, y, R.player.x, R.player.y) < 70 * 70) && tries < 25);
    R.trash.push({
      x, y, type: pickTrashType(z), golden: Math.random() < 0.03,
      rot: rand(-0.6, 0.6), age: 0, pulled: false, pullT: 0, dead: false, claimed: null,
    });
  }

  function makeBot(i) {
    const a = (i / Math.max(1, lvl('bots'))) * Math.PI * 2;
    return { x: CENTER + Math.cos(a) * 40, y: CENTER + Math.sin(a) * 40, vx: 0, vy: 0, carry: 0, value: 0, state: 'seek', target: null, wx: 0, wy: 0, wt: 0, seed: Math.random() * 10 };
  }

  function syncBots() {
    while (R.bots.length < lvl('bots')) R.bots.push(makeBot(R.bots.length));
  }

  function setupZone() {
    buildDecor();
    R.trash = [];
    R.particles = [];
    R.floats = [];
    R.bots = [];
    syncBots();
    const p = R.player;
    p.x = CENTER; p.y = CENTER + DEPOT_R + 40;
    R.cam.x = p.x; R.cam.y = p.y;
    const n = Math.min(ST.spawnMax(lvl('spawn')), 18);
    for (let i = 0; i < n; i++) { spawnTrash(); R.trash[R.trash.length - 1].age = 1; }
    $('zoneName').textContent = zone().name;
  }

  // ---------------------------------------------------------------- Save / load
  function serialize() {
    S.last = Date.now();
    return JSON.stringify(S);
  }

  function deserialize(raw) {
    if (!raw) return defaultState();
    try {
      const o = JSON.parse(raw);
      const s = Object.assign(defaultState(), o);
      s.up = Object.assign(defaultState().up, o.up || {});
      for (const k of Object.keys(s.up)) {
        const u = upDef(k);
        s.up[k] = clamp(Math.floor(Number(s.up[k]) || 0), 0, u ? u.max : 0);
      }
      s.zones = Array.isArray(s.zones) ? s.zones.filter(id => D.zones.some(z => z.id === id)) : ['park'];
      if (!s.zones.includes('park')) s.zones.unshift('park');
      if (!s.zones.includes(s.zone)) s.zone = 'park';
      s.coins = Math.max(0, Number(s.coins) || 0);
      s.score = Math.max(0, Math.floor(Number(s.score) || 0));
      s.earned = Math.max(0, Number(s.earned) || 0);
      return s;
    } catch (e) {
      console.warn('Bad save data, starting fresh', e);
      SDK.logWarning();
      return defaultState();
    }
  }

  async function save() {
    R.dirty = false;
    R.saveTimer = 6;
    await SDK.save(serialize());
  }

  function markDirty(soon) {
    R.dirty = true;
    if (soon) R.saveTimer = Math.min(R.saveTimer, 0.6);
  }

  function addScore(n) {
    S.score += n;
    R.scoreDirty = true;
  }

  function flushScore() {
    if (!R.scoreDirty) return;
    R.scoreDirty = false;
    SDK.sendScore(S.score);
  }

  // ---------------------------------------------------------------- Effects
  function burst(x, y, color, n, speed = 160, size = 4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      R.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.5 + Math.random() * 0.4, max: 0.9, color, size: size * (0.6 + Math.random() * 0.8), g: 300 });
    }
  }

  function floatText(x, y, text, color = '#fff', size = 22) {
    R.floats.push({ x, y, text, color, size, life: 1.1, max: 1.1 });
  }

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  // ---------------------------------------------------------------- Gameplay
  function collect(t) {
    const p = R.player;
    t.dead = true;
    p.bag++;
    R.combo = R.comboTimer > 0 ? R.combo + 1 : 0;
    R.comboTimer = 1.1;
    const comboMult = 1 + Math.min(R.combo, 20) * 0.03;
    const v = trashValue(t) * comboMult;
    p.bagValue += v;
    if (t.golden) {
      AU.play('golden');
      burst(t.x, t.y, '#ffd23f', 16, 200, 5);
      floatText(t.x, t.y - 20, 'GOLDEN!', '#ffd23f', 24);
    } else {
      AU.play('pick', R.combo);
      burst(t.x, t.y, '#ffffff', 5, 110, 3);
    }
    if (R.combo >= 4 && R.combo % 5 === 4) floatText(p.x, p.y - 50, 'Combo x' + (R.combo + 1) + '!', '#7ee081', 22);
    if (S.tut === 1 && p.bag >= 3) setTut(2);
  }

  function deposit() {
    const p = R.player;
    const value = p.bagValue;
    const n = p.bag;
    S.coins += value;
    S.earned += value;
    addScore(n);
    p.bag = 0;
    p.bagValue = 0;
    floatText(CENTER, CENTER - 80, '+' + fmt(value), '#ffd23f', 34);
    burst(CENTER, CENTER - 30, '#ffd23f', 18, 240, 6);
    burst(CENTER, CENTER - 30, '#7ee081', 10, 200, 4);
    AU.play('deposit');
    R.shake = 0.15;
    bumpCoins();
    markDirty(true);
    if (S.tut === 2) setTut(3);
  }

  function updateBots(dt) {
    const cap = ST.botCap(lvl('botlvl'));
    const spd = ST.botSpeed(lvl('botlvl'));
    for (const b of R.bots) {
      let tx, ty;
      if (b.state === 'seek') {
        if (b.target && (b.target.dead || b.target.pulled)) { b.target.claimed = null; b.target = null; }
        if (!b.target) {
          let best = null, bd = Infinity;
          for (const t of R.trash) {
            if (t.dead || t.pulled || (t.claimed && t.claimed !== b)) continue;
            const dd = d2(b.x, b.y, t.x, t.y);
            if (dd < bd) { bd = dd; best = t; }
          }
          if (best) { b.target = best; best.claimed = b; }
        }
        if (b.target) {
          tx = b.target.x; ty = b.target.y;
          if (d2(b.x, b.y, tx, ty) < 16 * 16) {
            const t = b.target;
            t.dead = true;
            b.carry++;
            b.value += trashValue(t);
            b.target = null;
            burst(t.x, t.y, '#5ff0ff', 4, 90, 3);
            if (b.carry >= cap) b.state = 'return';
          }
        } else {
          // Idle wander near the depot.
          b.wt -= dt;
          if (b.wt <= 0) { b.wx = CENTER + rand(-200, 200); b.wy = CENTER + rand(-200, 200); b.wt = rand(1.5, 3); }
          tx = b.wx; ty = b.wy;
          if (b.carry > 0 && b.wt < 0.3) b.state = 'return';
        }
      } else {
        tx = CENTER; ty = CENTER;
        if (d2(b.x, b.y, tx, ty) < (DEPOT_R * 0.55) ** 2) {
          S.coins += b.value;
          S.earned += b.value;
          addScore(b.carry);
          floatText(b.x, b.y - 30, '+' + fmt(b.value), '#bff7ff', 18);
          AU.play('botcoin');
          bumpCoins();
          markDirty(false);
          b.carry = 0; b.value = 0; b.state = 'seek';
        }
      }
      const dx = tx - b.x, dy = ty - b.y;
      const dist = Math.hypot(dx, dy);
      const tvx = dist > 2 ? dx / dist * spd : 0;
      const tvy = dist > 2 ? dy / dist * spd : 0;
      b.vx += (tvx - b.vx) * Math.min(1, dt * 6);
      b.vy += (tvy - b.vy) * Math.min(1, dt * 6);
      b.x = clamp(b.x + b.vx * dt, 20, WORLD - 20);
      b.y = clamp(b.y + b.vy * dt, 20, WORLD - 20);
    }
  }

  function readInput() {
    let ix = 0, iy = 0;
    const k = R.keys;
    if (k.ArrowLeft || k.KeyA) ix -= 1;
    if (k.ArrowRight || k.KeyD) ix += 1;
    if (k.ArrowUp || k.KeyW) iy -= 1;
    if (k.ArrowDown || k.KeyS) iy += 1;
    if (R.joy) {
      const dx = R.joy.x - R.joy.ox, dy = R.joy.y - R.joy.oy;
      const len = Math.hypot(dx, dy);
      if (len > 6) { const m = Math.min(1, len / JOY_R); ix += dx / len * m; iy += dy / len * m; }
    }
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }
    return [ix, iy];
  }

  function update(dt) {
    R.time += dt;
    const p = R.player;
    const canMove = R.playing && !R.panel;
    const [ix, iy] = canMove ? readInput() : [0, 0];
    const spd = ST.speed(lvl('speed'));
    p.vx += (ix * spd - p.vx) * Math.min(1, dt * 14);
    p.vy += (iy * spd - p.vy) * Math.min(1, dt * 14);
    const ox = p.x, oy = p.y;
    p.x = clamp(p.x + p.vx * dt, 22, WORLD - 22);
    p.y = clamp(p.y + p.vy * dt, 22, WORLD - 22);
    const sp = Math.hypot(p.vx, p.vy);
    p.moving = sp > 20;
    if (p.moving) p.walk += dt * (8 + sp / 30);
    if (Math.abs(p.vx) > 15) p.face = p.vx > 0 ? 1 : -1;
    if (S.tut === 0 && R.playing) {
      R.tutMove += Math.hypot(p.x - ox, p.y - oy);
      if (R.tutMove > 120) setTut(1);
    }

    // Spawning
    R.spawnTimer -= dt;
    if (R.spawnTimer <= 0) {
      R.spawnTimer = ST.spawnInt(lvl('spawn'));
      if (R.trash.length < ST.spawnMax(lvl('spawn'))) spawnTrash();
    }

    // Magnet + pickup
    const cap = ST.capacity(lvl('capacity'));
    const mag = ST.magnet(lvl('magnet'));
    const full = p.bag >= cap;
    let nearFull = false;
    for (const t of R.trash) {
      t.age += dt;
      if (t.dead) continue;
      const dd = d2(t.x, t.y, p.x, p.y);
      if (!t.pulled && !full && R.playing && dd < mag * mag) t.pulled = true;
      if (t.pulled) {
        if (p.bag >= cap) { t.pulled = false; t.pullT = 0; continue; }
        t.pullT += dt;
        const dist = Math.sqrt(dd);
        if (dist < 16) { collect(t); continue; }
        const v = 160 + t.pullT * 900;
        const step = Math.min(dist, v * dt);
        t.x += (p.x - t.x) / dist * step;
        t.y += (p.y - t.y) / dist * step;
        t.rot += dt * 8;
      } else if (full && dd < mag * mag) {
        nearFull = true;
      }
    }
    if (R.comboTimer > 0) R.comboTimer -= dt;
    R.fullMsgT -= dt;
    if (nearFull && R.fullMsgT <= 0) {
      floatText(p.x, p.y - 55, 'BAG FULL!', '#ff8a7a', 22);
      AU.play('full');
      R.fullMsgT = 2.5;
    }

    // Deposit
    if (p.bag > 0 && d2(p.x, p.y, CENTER, CENTER) < DEPOT_R * DEPOT_R) deposit();

    updateBots(dt);

    if (R.trash.some(t => t.dead)) R.trash = R.trash.filter(t => !t.dead);

    // Particles & floats
    for (const q of R.particles) { q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    if (R.particles.length) R.particles = R.particles.filter(q => q.life > 0);
    for (const f of R.floats) { f.life -= dt; f.y -= 40 * dt; }
    if (R.floats.length) R.floats = R.floats.filter(f => f.life > 0);
    if (R.shake > 0) R.shake -= dt;

    // Camera
    const k = Math.min(1, dt * 8);
    R.cam.x += (p.x - R.cam.x) * k;
    R.cam.y += (p.y - R.cam.y) * k;

    // Persistence & score reporting
    R.saveTimer -= dt;
    if (R.dirty && R.saveTimer <= 0) save();
    R.scoreTimer -= dt;
    if (R.scoreTimer <= 0) { R.scoreTimer = 3; flushScore(); }

    R.hudTimer -= dt;
    if (R.hudTimer <= 0) { R.hudTimer = 0.1; updateHUD(); }
  }

  // ---------------------------------------------------------------- Rendering
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    cw = Math.max(1, Math.floor(w * dpr));
    ch = Math.max(1, Math.floor(h * dpr));
    canvas.width = cw;
    canvas.height = ch;
    scale = Math.min(cw, ch) / VIEW;
  }

  function cameraPos() {
    const halfW = cw / 2 / scale, halfH = ch / 2 / scale;
    const pad = 60;
    let x = R.cam.x, y = R.cam.y;
    x = halfW * 2 > WORLD + pad * 2 ? CENTER : clamp(x, halfW - pad, WORLD - halfW + pad);
    y = halfH * 2 > WORLD + pad * 2 ? CENTER : clamp(y, halfH - pad, WORLD - halfH + pad);
    return [x, y, halfW, halfH];
  }

  function render() {
    const z = zone();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = z.edge;
    ctx.fillRect(0, 0, cw, ch);

    const [cx, cy, halfW, halfH] = cameraPos();
    let sx = 0, sy = 0;
    if (R.shake > 0) { sx = rand(-4, 4) * dpr; sy = rand(-4, 4) * dpr; }
    ctx.setTransform(scale, 0, 0, scale, cw / 2 - cx * scale + sx, ch / 2 - cy * scale + sy);
    const vx0 = cx - halfW - 80, vx1 = cx + halfW + 80, vy0 = cy - halfH - 100, vy1 = cy + halfH + 100;
    const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;

    // Outer edge pattern (water on the beach, void in space)
    if (z.id === 'beach') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4;
      for (let i = -3; i < 3; i++) {
        const o = ((R.time * 20) % 60) + i * 60;
        ctx.strokeRect(-o - 20, -o - 20, WORLD + (o + 20) * 2, WORLD + (o + 20) * 2);
      }
    }

    // Ground
    ctx.fillStyle = z.ground[0];
    ctx.fillRect(0, 0, WORLD, WORLD);
    ctx.fillStyle = z.ground[1];
    const T = 100;
    for (let tx = Math.max(0, Math.floor(vx0 / T)); tx < Math.min(WORLD / T, Math.ceil(vx1 / T)); tx++) {
      for (let ty = Math.max(0, Math.floor(vy0 / T)); ty < Math.min(WORLD / T, Math.ceil(vy1 / T)); ty++) {
        if ((tx + ty) % 2) ctx.fillRect(tx * T, ty * T, T, T);
      }
    }
    ctx.strokeStyle = z.line;
    ctx.lineWidth = 10;
    ctx.strokeRect(-5, -5, WORLD + 10, WORLD + 10);

    for (const d of R.decorFlat) if (vis(d.x, d.y)) RD.drawDecor(ctx, d, R.time);

    const p = R.player;
    RD.drawDepotPad(ctx, CENTER, CENTER, DEPOT_R, R.time, z.depot, p.bag > 0);

    for (const t of R.trash) if (vis(t.x, t.y)) RD.drawTrash(ctx, t, R.time);

    // Magnet range indicator
    const mag = ST.magnet(lvl('magnet'));
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(p.x, p.y + 4, mag, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Y-sorted tall objects
    const list = [];
    for (const d of R.decorTall) if (vis(d.x, d.y)) list.push({ y: d.y, k: 0, o: d });
    for (const b of R.bots) list.push({ y: b.y, k: 1, o: b });
    list.push({ y: p.y, k: 2, o: p });
    list.push({ y: CENTER + 20, k: 3 });
    list.sort((a, b) => a.y - b.y);
    const fill = Math.min(1, p.bag / ST.capacity(lvl('capacity')));
    for (const e of list) {
      if (e.k === 0) RD.drawDecor(ctx, e.o, R.time);
      else if (e.k === 1) RD.drawBot(ctx, e.o, R.time);
      else if (e.k === 2) RD.drawPlayer(ctx, e.o, R.time, fill, z.id);
      else RD.drawDepot(ctx, CENTER, CENTER, R.time, z.depot);
    }

    // Particles
    for (const q of R.particles) {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    ctx.globalAlpha = 1;

    // Direction arrow to depot when the bag is full (or during the tutorial)
    const cap = ST.capacity(lvl('capacity'));
    if (R.playing && (p.bag >= cap || S.tut === 2) && d2(p.x, p.y, CENTER, CENTER) > (DEPOT_R + 60) ** 2) {
      const a = Math.atan2(CENTER - p.y, CENTER - p.x);
      const r = 46 + Math.sin(R.time * 8) * 5;
      ctx.save();
      ctx.translate(p.x + Math.cos(a) * r, p.y - 6 + Math.sin(a) * r);
      ctx.rotate(a);
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#3a2e1f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -11); ctx.lineTo(-3, 0); ctx.lineTo(-8, 11); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // Floating text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const f of R.floats) {
      const a = Math.min(1, f.life / f.max * 2);
      const pop = 1 + Math.max(0, (f.life - f.max + 0.15)) * 3;
      ctx.globalAlpha = a;
      ctx.font = `900 ${Math.round(f.size * pop)}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,20,10,0.85)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // Screen-space: virtual joystick
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (R.joy && R.playing && !R.panel) {
      const j = R.joy;
      let dx = j.x - j.ox, dy = j.y - j.oy;
      const len = Math.hypot(dx, dy);
      if (len > JOY_R) { dx = dx / len * JOY_R; dy = dy / len * JOY_R; }
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(j.ox, j.oy, JOY_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(j.ox + dx, j.oy + dy, 22, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawSplash() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d2b22';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#7ee081';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(Math.min(cw, ch) / 12)}px system-ui, Arial, sans-serif`;
    ctx.fillText('Loading...', cw / 2, ch / 2);
  }

  // ---------------------------------------------------------------- HUD & panels
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }

  function bumpCoins() {
    const el = document.querySelector('.coins');
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  function affordableUpgrades() {
    let n = 0;
    for (const u of D.upgrades) {
      if (u.requires && !lvl(u.requires)) continue;
      if (lvl(u.id) < u.max && S.coins >= upCost(u.id)) n++;
    }
    return n;
  }

  function nextZone() { return D.zones.find(z => !S.zones.includes(z.id)); }

  function updateHUD() {
    const p = R.player;
    const cap = ST.capacity(lvl('capacity'));
    setText('coins', fmt(S.coins));
    setText('bagText', `${p.bag} / ${cap}`);
    $('bagFill').style.width = (Math.min(1, p.bag / cap) * 100) + '%';
    $('bagbar').classList.toggle('full', p.bag >= cap);
    const n = affordableUpgrades();
    const badge = $('upBadge');
    badge.classList.toggle('hidden', n === 0);
    setText('upBadge', String(n));
    const nz = nextZone();
    $('mapBadge').classList.toggle('hidden', !(nz && S.coins >= nz.cost));
    $('btnUpgrades').classList.toggle('glow', S.tut === 3);
    if (R.panel && R.panel.refresh) R.panel.refresh();
  }

  const TUT = [
    'Drag anywhere (or use WASD / arrow keys) to move',
    'Walk near trash to scoop it into your bag',
    'Bring your bag to the Recycling Center to earn coins',
    'Tap Upgrades to spend your coins!',
  ];
  function setTut(step) {
    S.tut = step;
    showHint();
    markDirty(false);
  }
  function showHint() {
    const h = $('hint');
    if (R.playing && S.tut < TUT.length) {
      h.textContent = TUT[S.tut];
      h.classList.remove('hidden');
      h.style.animation = 'none'; void h.offsetWidth; h.style.animation = '';
    } else {
      h.classList.add('hidden');
    }
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function openPanel(kind) {
    AU.play('open');
    R.joy = null;
    const body = $('panelBody');
    body.innerHTML = '';
    $('panel').classList.remove('hidden');
    $('panelClose').classList.remove('hidden');
    const panel = { kind, refresh: null };
    R.panel = panel;

    if (kind === 'upgrades') buildUpgrades(body, panel);
    else if (kind === 'map') buildMap(body, panel);
    else if (kind === 'settings') buildSettings(body, panel);
    else if (kind === 'offline') buildOffline(body, panel);
    if (panel.refresh) panel.refresh();
  }

  function closePanel() {
    if (!R.panel) return;
    if (R.panel.kind === 'offline') claimOffline();
    R.panel = null;
    $('panel').classList.add('hidden');
    AU.play('click');
  }

  function coinPill() {
    const c = el('div', 'pill modal-coins', '<span class="coin-ico"></span><span></span>');
    return [c, c.lastChild];
  }

  function buildUpgrades(body, panel) {
    $('panelTitle').textContent = 'Upgrades';
    const [pill, coinsEl] = coinPill();
    body.appendChild(pill);
    const cards = [];
    for (const u of D.upgrades) {
      const card = el('div', 'card');
      card.innerHTML = `<div class="card-ico">${u.icon}</div>
        <div class="card-info"><div class="card-name">${u.name} <span class="lvl"></span></div>
        <div class="card-desc">${u.desc}</div><div class="card-fx"></div></div>`;
      const btn = el('button', 'buy');
      card.appendChild(btn);
      btn.addEventListener('click', () => buyUpgrade(u.id));
      body.appendChild(card);
      cards.push({ u, card, btn, lvlEl: card.querySelector('.lvl'), fxEl: card.querySelector('.card-fx') });
    }
    panel.refresh = () => {
      coinsEl.textContent = fmt(S.coins);
      for (const c of cards) {
        const l = lvl(c.u.id);
        const locked = c.u.requires && !lvl(c.u.requires);
        const maxed = l >= c.u.max;
        c.card.classList.toggle('locked', !!locked);
        c.lvlEl.textContent = maxed ? 'MAX' : 'Lv ' + l;
        c.fxEl.textContent = locked ? 'Requires a Helper Bot' : maxed ? FX[c.u.id](l) : `${FX[c.u.id](l)} \u2192 ${FX[c.u.id](l + 1)}`;
        const cost = upCost(c.u.id);
        const html = maxed ? 'MAX' : `<span class="coin-ico"></span>${fmt(cost)}`;
        if (c.btn._html !== html) { c.btn.innerHTML = html; c.btn._html = html; }
        c.btn.disabled = maxed || locked || S.coins < cost;
      }
    };
    if (S.tut === 3) setTut(4);
  }

  function buyUpgrade(id) {
    const u = upDef(id);
    if (u.requires && !lvl(u.requires)) return;
    const cost = upCost(id);
    if (lvl(id) >= u.max || S.coins < cost) { AU.play('deny'); return; }
    S.coins -= cost;
    S.up[id] = lvl(id) + 1;
    if (id === 'bots') syncBots();
    AU.play('buy');
    burst(R.player.x, R.player.y - 20, '#7ee081', 14, 200, 5);
    floatText(R.player.x, R.player.y - 60, u.name + ' Lv ' + S.up[id], '#7ee081', 20);
    markDirty(true);
    updateHUD();
  }

  function buildMap(body, panel) {
    $('panelTitle').textContent = 'Areas';
    const [pill, coinsEl] = coinPill();
    body.appendChild(pill);
    const cards = [];
    for (const z of D.zones) {
      const card = el('div', 'card');
      card.innerHTML = `<div class="card-ico" style="background:${z.ground[0]}">${z.icon}</div>
        <div class="card-info"><div class="card-name">${z.name}</div>
        <div class="card-desc">Trash worth x${fmt(z.mult)}</div><div class="card-fx"></div></div>`;
      const btn = el('button', 'buy');
      card.appendChild(btn);
      btn.addEventListener('click', () => zoneAction(z));
      body.appendChild(card);
      cards.push({ z, card, btn, fxEl: card.querySelector('.card-fx') });
    }
    panel.refresh = () => {
      coinsEl.textContent = fmt(S.coins);
      for (const c of cards) {
        const owned = S.zones.includes(c.z.id);
        const here = S.zone === c.z.id;
        c.card.classList.toggle('current', here);
        c.card.classList.toggle('locked', !owned);
        let html, cls;
        if (here) { html = 'HERE'; cls = 'buy green'; c.btn.disabled = true; c.fxEl.textContent = 'You are here'; }
        else if (owned) { html = 'GO'; cls = 'buy blue'; c.btn.disabled = false; c.fxEl.textContent = 'Unlocked'; }
        else { html = `<span class="coin-ico"></span>${fmt(c.z.cost)}`; cls = 'buy'; c.btn.disabled = S.coins < c.z.cost; c.fxEl.textContent = 'Locked'; }
        if (c.btn._html !== html) { c.btn.innerHTML = html; c.btn._html = html; }
        if (c.btn.className !== cls) c.btn.className = cls;
      }
    };
  }

  function zoneAction(z) {
    if (S.zone === z.id) return;
    if (!S.zones.includes(z.id)) {
      if (S.coins < z.cost) { AU.play('deny'); return; }
      S.coins -= z.cost;
      S.zones.push(z.id);
      AU.play('unlock');
      toast('New area unlocked: ' + z.name + '!');
    } else {
      AU.play('click');
    }
    S.zone = z.id;
    // Bag contents keep their already-computed value.
    setupZone();
    markDirty(true);
    closePanel();
    burst(R.player.x, R.player.y, '#ffd23f', 24, 260, 6);
  }

  function toggleRow(label, get, set) {
    const row = el('div', 'row', `<span>${label}</span>`);
    const btn = el('button', 'buy');
    const paint = () => { btn.textContent = get() ? 'ON' : 'OFF'; btn.className = 'buy ' + (get() ? 'green' : ''); };
    btn.addEventListener('click', () => { set(!get()); paint(); AU.play('click'); markDirty(true); });
    paint();
    row.appendChild(btn);
    return row;
  }

  function buildSettings(body) {
    $('panelTitle').textContent = 'Settings';
    body.appendChild(toggleRow('Sound effects', () => S.sfx, v => { S.sfx = v; AU.setSfx(v); }));
    body.appendChild(toggleRow('Music', () => S.music, v => { S.music = v; AU.setMusic(v); }));
    const grid = el('div', 'stat-grid');
    const upTotal = Object.values(S.up).reduce((a, b) => a + b, 0);
    grid.innerHTML = `
      <div class="stat"><b>${fmt(S.score)}</b><span>Trash recycled</span></div>
      <div class="stat"><b>${fmt(S.earned)}</b><span>Coins earned</span></div>
      <div class="stat"><b>${S.zones.length} / ${D.zones.length}</b><span>Areas unlocked</span></div>
      <div class="stat"><b>${upTotal}</b><span>Upgrades bought</span></div>`;
    body.appendChild(grid);
    const row = el('div', 'row', '<span>Reset all progress</span>');
    const btn = el('button', 'buy red', 'RESET');
    let armed = false;
    btn.addEventListener('click', () => {
      if (!armed) { armed = true; btn.textContent = 'SURE?'; AU.play('deny'); setTimeout(() => { armed = false; btn.textContent = 'RESET'; }, 3000); return; }
      resetProgress();
    });
    row.appendChild(btn);
    body.appendChild(row);
    body.appendChild(el('div', 'credits', 'Trash Tycoon \u2014 keep the planet clean! \u267B'));
  }

  function resetProgress() {
    const keepSfx = S.sfx, keepMusic = S.music;
    const keepScore = S.score; // The best score reported to YouTube must keep matching the save.
    S = defaultState();
    S.sfx = keepSfx; S.music = keepMusic; S.score = keepScore;
    R.player.bag = 0; R.player.bagValue = 0; R.tutMove = 0;
    setupZone();
    closePanel();
    save();
    showHint();
    toast('Progress reset. Fresh start!');
  }

  function buildOffline(body) {
    $('panelTitle').textContent = 'Welcome back!';
    body.appendChild(el('div', 'center-text', 'Your Helper Bots kept cleaning while you were away and earned:'));
    body.appendChild(el('div', 'big-reward', `<span class="coin-ico"></span>${fmt(R.pendingOffline)}`));
    const btn = el('button', 'buy green', 'COLLECT');
    btn.style.alignSelf = 'center';
    btn.style.minWidth = '160px';
    btn.addEventListener('click', closePanel);
    body.appendChild(btn);
  }

  function claimOffline() {
    if (R.pendingOffline <= 0) return;
    S.coins += R.pendingOffline;
    S.earned += R.pendingOffline;
    R.pendingOffline = 0;
    AU.play('deposit');
    bumpCoins();
    markDirty(true);
  }

  // ---------------------------------------------------------------- Input
  function bindInput() {
    window.addEventListener('keydown', e => {
      R.keys[e.code] = true;
      if (e.code === 'Escape') closePanel();
      if (!$('title').classList.contains('hidden') && (e.code === 'Enter' || e.code === 'Space')) startGame();
      else if (R.playing && !R.panel) {
        if (e.code === 'KeyU') openPanel('upgrades');
        if (e.code === 'KeyM') openPanel('map');
      }
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => { R.keys[e.code] = false; });
    window.addEventListener('blur', () => { R.keys = {}; R.joy = null; });

    canvas.addEventListener('pointerdown', e => {
      if (!R.playing || R.panel) return;
      AU.init();
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      R.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', e => {
      if (!R.joy || R.joy.id !== e.pointerId) return;
      R.joy.x = e.clientX; R.joy.y = e.clientY;
      // Let the joystick base follow when dragging far away.
      const dx = R.joy.x - R.joy.ox, dy = R.joy.y - R.joy.oy, len = Math.hypot(dx, dy);
      if (len > JOY_R * 1.6) { const k = (len - JOY_R * 1.6) / len; R.joy.ox += dx * k; R.joy.oy += dy * k; }
    });
    const end = e => { if (R.joy && R.joy.id === e.pointerId) R.joy = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    document.addEventListener('contextmenu', e => e.preventDefault());

    $('btnUpgrades').addEventListener('click', () => openPanel('upgrades'));
    $('btnMap').addEventListener('click', () => openPanel('map'));
    $('btnSettings').addEventListener('click', () => openPanel('settings'));
    $('panelClose').addEventListener('click', closePanel);
    $('panel').addEventListener('pointerdown', e => { if (e.target === $('panel')) closePanel(); });
    $('btnPlay').addEventListener('click', startGame);

    window.addEventListener('resize', resize);
  }

  // ---------------------------------------------------------------- Lifecycle
  function startGame() {
    if (R.playing) return;
    AU.init();
    AU.play('buy');
    $('title').classList.add('hidden');
    $('hud').classList.remove('hidden');
    R.playing = true;
    showHint();
    updateHUD();
    if (R.pendingOffline > 0) openPanel('offline');
  }

  function pause() {
    if (R.paused) return;
    R.paused = true;
    R.keys = {}; R.joy = null;
    AU.setPaused(true);
    flushScore();
    save();
  }

  function resume() {
    if (!R.paused) return;
    R.paused = false;
    R.lastTs = 0;
    AU.setPaused(false);
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (R.paused) return;
    const now = ts / 1000;
    const dt = R.lastTs ? Math.min(0.05, Math.max(0, now - R.lastTs)) : 0;
    R.lastTs = now;
    update(dt);
    render();
  }

  async function boot() {
    resize();
    drawSplash();
    SDK.firstFrameReady();

    // Audio: respect YouTube's audio setting and pause/resume events.
    AU.setSystemEnabled(SDK.isAudioEnabled());
    SDK.onAudioEnabledChange(enabled => AU.setSystemEnabled(enabled));
    SDK.onPause(pause);
    SDK.onResume(resume);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); });

    // Load progress (must complete before any saveData call).
    const raw = await SDK.load();
    S = deserialize(raw);
    AU.sfxOn = S.sfx;
    AU.musicOn = S.music;

    // Offline earnings from helper bots.
    const away = clamp((Date.now() - (S.last || Date.now())) / 1000, 0, OFFLINE_CAP);
    if (raw && away > 60 && lvl('bots') > 0) {
      R.pendingOffline = Math.floor(botIncomePerSec() * away * 0.5);
    }

    setupZone();
    bindInput();
    $('title').classList.remove('hidden');
    requestAnimationFrame(frame);
    // Title screen is now interactive.
    SDK.gameReady();
    if (S.score > 0) SDK.sendScore(S.score);
  }

  boot().catch(e => {
    console.error(e);
    SDK.logError();
  });
})();

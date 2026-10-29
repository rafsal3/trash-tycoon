/* Procedural canvas drawing for all game art (no image assets). All coordinates are world units. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function shadow(c, w, y, a) {
    c.fillStyle = `rgba(0,0,0,${a == null ? 0.2 : a})`;
    c.beginPath();
    c.ellipse(0, y, w, w * 0.38, 0, 0, TAU);
    c.fill();
  }
  const OUT = 'rgba(40,30,20,0.85)';

  // ---------------- Trash ----------------
  const TRASH = {
    paper(c) {
      c.fillStyle = '#f5f3ea'; c.strokeStyle = OUT; c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU, r = i % 2 ? 7 : 10;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-5, -2); c.lineTo(2, 1); c.lineTo(4, -4); c.moveTo(-3, 4); c.lineTo(3, 3); c.stroke();
    },
    banana(c) {
      c.lineCap = 'round';
      c.strokeStyle = OUT; c.lineWidth = 9;
      c.beginPath(); c.arc(0, -6, 11, 0.35, Math.PI - 0.35); c.stroke();
      c.strokeStyle = '#ffd94a'; c.lineWidth = 6;
      c.beginPath(); c.arc(0, -6, 11, 0.35, Math.PI - 0.35); c.stroke();
      c.fillStyle = '#6b4a1f';
      circle(c, 10, -1, 2.2); c.fill(); circle(c, -10, -1, 2.2); c.fill();
    },
    can(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#e8443a'; rr(c, -6, -11, 12, 22, 3); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.fillRect(-6, -3, 12, 5);
      c.fillStyle = '#c9ced4'; rr(c, -5, -12, 10, 3, 1.5); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-4, -9, 2, 18);
    },
    bottle(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = 'rgba(120,210,150,0.9)';
      c.beginPath();
      c.moveTo(-6, 12); c.lineTo(-6, -2); c.lineTo(-3, -7); c.lineTo(-3, -11); c.lineTo(3, -11); c.lineTo(3, -7); c.lineTo(6, -2); c.lineTo(6, 12);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#2b7de0'; c.fillRect(-3.5, -14, 7, 4);
      c.fillStyle = '#fff'; c.fillRect(-6, 2, 12, 5);
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-4, -1, 2, 12);
    },
    cup(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(-8, -9); c.lineTo(8, -9); c.lineTo(5, 11); c.lineTo(-5, 11); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e8443a'; c.fillRect(-6.8, -2, 13.6, 5);
      c.fillStyle = '#ddd'; rr(c, -9, -12, 18, 4, 2); c.fill(); c.stroke();
      c.strokeStyle = '#ff5fa2'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(2, -11); c.lineTo(6, -18); c.stroke();
    },
    bag(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = 'rgba(235,240,245,0.92)';
      c.beginPath();
      c.moveTo(-10, -4); c.quadraticCurveTo(-13, 12, 0, 12); c.quadraticCurveTo(13, 12, 10, -4);
      c.lineTo(5, -4); c.lineTo(6, -12); c.lineTo(2, -12); c.lineTo(1, -4);
      c.lineTo(-1, -4); c.lineTo(-2, -12); c.lineTo(-6, -12); c.lineTo(-5, -4);
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.moveTo(-5, 2); c.lineTo(-2, 9); c.moveTo(4, 1); c.lineTo(5, 8); c.stroke();
    },
    net(c) {
      c.strokeStyle = '#2f8f6f'; c.lineWidth = 2;
      circle(c, 0, 0, 12); c.stroke();
      c.save(); circle(c, 0, 0, 12); c.clip();
      c.lineWidth = 1.5;
      for (let i = -12; i <= 12; i += 5) {
        c.beginPath(); c.moveTo(i - 12, -12); c.lineTo(i + 12, 12); c.stroke();
        c.beginPath(); c.moveTo(i + 12, -12); c.lineTo(i - 12, 12); c.stroke();
      }
      c.restore();
      c.fillStyle = '#ff8a3d'; circle(c, 9, -8, 3.5); c.fill(); circle(c, -10, 6, 3); c.fill();
    },
    box(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#c98e4f'; rr(c, -12, -10, 24, 20, 2); c.fill(); c.stroke();
      c.fillStyle = '#e0b277'; c.fillRect(-3, -10, 6, 20);
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-12, -3); c.lineTo(-6, -3); c.stroke();
    },
    tire(c) {
      c.fillStyle = '#2a2a2e'; circle(c, 0, 0, 13); c.fill();
      c.strokeStyle = '#444'; c.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * TAU;
        c.beginPath(); c.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); c.stroke();
      }
      c.fillStyle = '#9aa0a6'; circle(c, 0, 0, 6); c.fill();
      c.fillStyle = '#555'; circle(c, 0, 0, 2.5); c.fill();
    },
    barrel(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#e7c21f'; rr(c, -10, -13, 20, 26, 4); c.fill(); c.stroke();
      c.strokeStyle = '#a88b10'; c.beginPath(); c.moveTo(-10, -5); c.lineTo(10, -5); c.moveTo(-10, 5); c.lineTo(10, 5); c.stroke();
      c.fillStyle = '#222'; circle(c, 0, 0, 4.5); c.fill();
      c.fillStyle = '#e7c21f'; circle(c, 0, 0, 1.6); c.fill();
      c.fillStyle = '#6fe04a'; c.beginPath(); c.ellipse(4, 13, 7, 3, 0, 0, TAU); c.fill();
    },
    scrap(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#9ba3ab';
      c.beginPath(); c.moveTo(-12, -4); c.lineTo(-4, -11); c.lineTo(9, -8); c.lineTo(12, 3); c.lineTo(3, 10); c.lineTo(-9, 8); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#b5673a'; circle(c, -3, 1, 3); c.fill(); circle(c, 5, -3, 2); c.fill();
      c.fillStyle = '#5d646c'; circle(c, 6, 4, 1.6); c.fill(); circle(c, -6, -5, 1.6); c.fill();
    },
    bolt(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#c3cad1'; c.fillRect(-2.5, -2, 5, 14); c.strokeRect(-2.5, -2, 5, 14);
      c.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(Math.cos(a) * 8, -6 + Math.sin(a) * 6); }
      c.closePath(); c.fillStyle = '#dde3e8'; c.fill(); c.stroke();
    },
    panel(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#2d5fd6'; c.fillRect(-13, -8, 26, 16); c.strokeRect(-13, -8, 26, 16);
      c.strokeStyle = 'rgba(180,210,255,0.6)'; c.lineWidth = 1;
      c.beginPath();
      for (let x = -13; x <= 13; x += 6.5) { c.moveTo(x, -8); c.lineTo(x, 8); }
      c.moveTo(-13, 0); c.lineTo(13, 0); c.stroke();
    },
    satellite(c) {
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#2d5fd6'; c.fillRect(-20, -5, 10, 10); c.strokeRect(-20, -5, 10, 10);
      c.fillRect(10, -5, 10, 10); c.strokeRect(10, -5, 10, 10);
      c.fillStyle = '#e0e4e8'; rr(c, -8, -8, 16, 16, 3); c.fill(); c.stroke();
      c.fillStyle = '#f2b632'; circle(c, 0, -12, 4); c.fill(); c.stroke();
      c.fillStyle = '#e8443a'; circle(c, 0, 0, 2.5); c.fill();
    },
  };

  function drawTrash(c, t, time) {
    c.save();
    c.translate(t.x, t.y);
    const pop = Math.min(1, t.age / 0.25);
    const s = pop < 1 ? 0.3 + 0.7 * (1 - Math.pow(1 - pop, 3)) * 1.1 : 1;
    if (t.golden) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 6 + t.rot);
      c.fillStyle = `rgba(255,215,64,${0.25 + pulse * 0.25})`;
      circle(c, 0, 0, 20 + pulse * 4); c.fill();
    }
    shadow(c, 14 * s, 13, 0.18);
    c.scale(s * 1.35, s * 1.35);
    c.rotate(t.rot);
    (TRASH[t.type] || TRASH.paper)(c);
    if (t.golden) {
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = 'rgba(255,200,30,0.55)';
      c.fillRect(-22, -22, 44, 44);
      c.globalCompositeOperation = 'source-over';
      const sp = (time * 3 + t.rot) % 1;
      c.fillStyle = '#fff';
      c.globalAlpha = 1 - sp;
      star4(c, 10, -10, 4 * (1 - sp) + 1);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  function star4(c, x, y, r) {
    c.beginPath();
    c.moveTo(x, y - r); c.lineTo(x + r * 0.3, y - r * 0.3); c.lineTo(x + r, y); c.lineTo(x + r * 0.3, y + r * 0.3);
    c.lineTo(x, y + r); c.lineTo(x - r * 0.3, y + r * 0.3); c.lineTo(x - r, y); c.lineTo(x - r * 0.3, y - r * 0.3);
    c.closePath(); c.fill();
  }

  // ---------------- Characters ----------------
  function drawPlayer(c, p, time, fill, zoneId) {
    c.save();
    c.translate(p.x, p.y);
    const moving = p.moving;
    shadow(c, 17, 16, 0.22);
    const bob = moving ? Math.abs(Math.sin(p.walk)) * 3 : Math.sin(time * 2) * 0.8;
    const f = p.face;
    // feet
    const step = moving ? Math.sin(p.walk) * 4 : 0;
    c.fillStyle = '#3a2e1f';
    rr(c, -9 + step, 10, 8, 6, 3); c.fill();
    rr(c, 1 - step, 10, 8, 6, 3); c.fill();
    c.translate(0, -bob);
    // bag on back
    const br = 8 + fill * 9;
    c.save();
    c.translate(-f * (10 + fill * 3), -2 - fill * 2);
    c.strokeStyle = OUT; c.lineWidth = 2;
    c.fillStyle = fill >= 1 ? '#5a6b3a' : '#4d5a33';
    circle(c, 0, 0, br); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.15)'; circle(c, -br * 0.3, -br * 0.35, br * 0.35); c.fill();
    c.fillStyle = '#c9a24a'; c.fillRect(-3, -br - 3, 6, 5);
    c.restore();
    // body
    c.strokeStyle = OUT; c.lineWidth = 2.2;
    c.fillStyle = '#2f9a47';
    rr(c, -12, -10, 24, 22, 8); c.fill(); c.stroke();
    c.fillStyle = '#ff8c1a'; c.fillRect(-11, -2, 22, 4);
    c.fillStyle = '#fff4a0'; c.fillRect(-11, -1, 22, 1.5);
    // arm
    c.fillStyle = '#2f9a47';
    c.save(); c.translate(f * 11, -3); c.rotate(moving ? Math.sin(p.walk) * 0.6 : 0.2);
    rr(c, -3, 0, 6, 11, 3); c.fill(); c.stroke();
    c.fillStyle = '#f6c99a'; circle(c, 0, 12, 3); c.fill();
    c.restore();
    // head
    c.fillStyle = '#f6c99a';
    circle(c, 0, -19, 11); c.fill(); c.stroke();
    c.fillStyle = '#2a1d10';
    circle(c, f * 4 + 2, -19, 1.8); c.fill();
    circle(c, f * 4 - 4, -19, 1.8); c.fill();
    c.strokeStyle = '#2a1d10'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(f * 3 - 1, -16, 3, 0.2, Math.PI - 0.2); c.stroke();
    // cap
    c.fillStyle = '#e8443a'; c.strokeStyle = OUT; c.lineWidth = 2;
    c.beginPath(); c.arc(0, -21, 11, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(f * 9, -21, 7, 2.5, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#fff'; circle(c, 0, -27, 2.2); c.fill();
    if (zoneId === 'space') {
      c.strokeStyle = 'rgba(200,240,255,0.9)'; c.lineWidth = 2;
      c.fillStyle = 'rgba(170,220,255,0.18)';
      circle(c, 0, -20, 16); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.beginPath(); c.ellipse(-6, -27, 4, 2, -0.6, 0, TAU); c.fill();
    }
    c.restore();
  }

  function drawBot(c, b, time) {
    c.save();
    c.translate(b.x, b.y);
    shadow(c, 12, 12, 0.2);
    const hover = Math.sin(time * 5 + b.seed) * 2;
    c.translate(0, -4 + hover);
    c.strokeStyle = OUT; c.lineWidth = 2;
    // antenna
    c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -19); c.stroke();
    c.fillStyle = (Math.floor(time * 3 + b.seed) % 2) ? '#ff5a4a' : '#ffd23f';
    circle(c, 0, -20, 2.8); c.fill();
    // body
    c.fillStyle = '#d6dde3';
    rr(c, -12, -12, 24, 21, 7); c.fill(); c.stroke();
    c.fillStyle = '#26323a';
    rr(c, -9, -8, 18, 9, 4); c.fill();
    c.fillStyle = '#5ff0ff';
    const look = Math.max(-3, Math.min(3, b.vx / 40));
    circle(c, -3 + look, -3.5, 2.2); c.fill();
    circle(c, 3 + look, -3.5, 2.2); c.fill();
    // carry stack
    for (let i = 0; i < Math.min(b.carry, 6); i++) {
      c.fillStyle = ['#e8443a', '#7ee081', '#ffd23f', '#5fc3ff'][i % 4];
      rr(c, -6 + (i % 2) * 6, 3 - Math.floor(i / 2) * 0 , 5, 4, 1); c.fill();
    }
    c.restore();
  }

  // ---------------- Depot ----------------
  function drawDepotPad(c, x, y, r, time, color, active) {
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    circle(c, 0, 0, r); c.fill();
    c.strokeStyle = active ? '#fff' : 'rgba(255,255,255,0.8)';
    c.lineWidth = 5;
    c.setLineDash([16, 12]);
    c.lineDashOffset = -time * 30;
    circle(c, 0, 0, r - 3); c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function drawDepot(c, x, y, time, color) {
    c.save();
    c.translate(x, y);
    shadow(c, 58, 22, 0.22);
    c.strokeStyle = OUT; c.lineWidth = 3;
    // building
    c.fillStyle = color;
    rr(c, -50, -50, 100, 70, 10); c.fill(); c.stroke();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    rr(c, -50, -50, 100, 16, 10); c.fill();
    // door
    c.fillStyle = '#2b2b2b';
    rr(c, -16, -6, 32, 26, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 4; i++) c.fillRect(-16, -4 + i * 6, 32, 2);
    // recycle sign
    c.save();
    c.translate(0, -30);
    c.fillStyle = '#fff'; circle(c, 0, 0, 14); c.fill(); c.stroke();
    c.rotate(time * 0.8);
    c.strokeStyle = color; c.lineWidth = 3.5; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.rotate(TAU / 3);
      c.beginPath(); c.arc(0, 0, 8, -0.2, 1.4); c.stroke();
      c.fillStyle = color;
      c.beginPath();
      const ax = Math.cos(1.6) * 8, ay = Math.sin(1.6) * 8;
      c.moveTo(ax - 4, ay - 2); c.lineTo(ax + 3, ay - 4); c.lineTo(ax + 1, ay + 4); c.closePath(); c.fill();
    }
    c.restore();
    // bins
    const bins = [['#2b8fe0', -64, 2], ['#ffd23f', 64, 2], ['#3fb54a', 64, -26]];
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(bins[i][1], bins[i][2]);
      c.fillStyle = bins[i][0];
      rr(c, -10, -12, 20, 24, 3); c.fill(); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(-11, -14, 22, 5);
      c.restore();
    }
    c.restore();
  }

  // ---------------- Decor ----------------
  const DECOR_FLAT = { flower: 1, shell: 1, starfish: 1, crack: 1, manhole: 1, puddle: 1, star: 1, crater: 1 };
  const DECOR = {
    flower(c, d) {
      const cols = ['#ff7eb6', '#fff', '#ffd23f', '#b98cff'];
      c.fillStyle = cols[d.v % cols.length];
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; circle(c, Math.cos(a) * 3.5, Math.sin(a) * 3.5, 2.6); c.fill(); }
      c.fillStyle = '#f2a516'; circle(c, 0, 0, 2); c.fill();
    },
    bush(c, d) {
      shadow(c, 20, 8, 0.18);
      c.fillStyle = '#3f8f3a';
      circle(c, -9, 0, 11); c.fill(); circle(c, 9, 0, 11); c.fill(); circle(c, 0, -7, 13); c.fill();
      c.fillStyle = '#58a84e'; circle(c, -3, -10, 6); c.fill();
      if (d.v % 2) { c.fillStyle = '#e8443a'; circle(c, 6, -4, 2); c.fill(); circle(c, -6, 2, 2); c.fill(); }
    },
    tree(c, d) {
      const s = 0.9 + (d.v % 4) * 0.1;
      c.scale(s, s);
      shadow(c, 34, 6, 0.22);
      c.fillStyle = '#7a4a26'; rr(c, -6, -20, 12, 26, 4); c.fill();
      c.fillStyle = '#2f7a34';
      circle(c, 0, -40, 28); c.fill(); circle(c, -18, -28, 18); c.fill(); circle(c, 18, -28, 18); c.fill();
      c.fillStyle = '#3f9442';
      circle(c, -6, -48, 14); c.fill(); circle(c, 10, -36, 10); c.fill();
    },
    bench(c) {
      shadow(c, 26, 8, 0.18);
      c.fillStyle = '#5d4a3a'; c.fillRect(-22, -2, 4, 10); c.fillRect(18, -2, 4, 10);
      c.fillStyle = '#b5713a'; rr(c, -26, -14, 52, 6, 2); c.fill(); rr(c, -26, -5, 52, 6, 2); c.fill();
    },
    palm(c, d) {
      shadow(c, 30, 6, 0.2);
      c.strokeStyle = '#9c6b3c'; c.lineWidth = 9; c.lineCap = 'round';
      const lean = (d.v % 2 ? 1 : -1) * 10;
      c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(lean * 0.2, -30, lean, -60); c.stroke();
      c.fillStyle = '#3d9b3d';
      for (let i = 0; i < 6; i++) {
        c.save(); c.translate(lean, -60); c.rotate(i / 6 * TAU + 0.3);
        c.beginPath(); c.ellipse(18, 0, 20, 6, 0.2, 0, TAU); c.fill();
        c.restore();
      }
      c.fillStyle = '#6b4a1f'; circle(c, lean - 4, -56, 4); c.fill(); circle(c, lean + 4, -55, 4); c.fill();
    },
    umbrella(c, d) {
      shadow(c, 34, 4, 0.18);
      c.strokeStyle = '#eee'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 4); c.lineTo(0, -34); c.stroke();
      const cols = d.v % 2 ? ['#e8443a', '#fff'] : ['#2b8fe0', '#ffd23f'];
      for (let i = 0; i < 8; i++) {
        c.fillStyle = cols[i % 2];
        c.beginPath(); c.moveTo(0, -38);
        c.ellipse(0, -38, 34, 16, 0, i / 8 * TAU, (i + 1) / 8 * TAU); c.closePath(); c.fill();
      }
      c.fillStyle = '#5fc3ff'; rr(c, 14, -2, 26, 12, 3); c.fill();
    },
    shell(c, d) {
      c.fillStyle = d.v % 2 ? '#ffd1dc' : '#fff1d6';
      c.beginPath(); c.moveTo(0, 4); c.arc(0, 0, 6, Math.PI * 1.1, Math.PI * 1.9); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, 4); c.lineTo(-3, -4); c.moveTo(0, 4); c.lineTo(3, -4); c.stroke();
    },
    starfish(c, d) {
      c.fillStyle = '#ff8a5c';
      c.beginPath();
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 3 : 8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill();
    },
    crack(c, d) {
      c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-14, -4); c.lineTo(-5, 1); c.lineTo(2, -3); c.lineTo(10, 4); c.moveTo(-5, 1); c.lineTo(-3, 8); c.stroke();
    },
    manhole(c) {
      c.fillStyle = '#6b7178'; circle(c, 0, 0, 15); c.fill();
      c.strokeStyle = '#555b61'; c.lineWidth = 2;
      circle(c, 0, 0, 11); c.stroke();
      c.beginPath(); for (let i = -8; i <= 8; i += 4) { c.moveTo(i, -9); c.lineTo(i, 9); } c.stroke();
    },
    cone(c) {
      shadow(c, 10, 4, 0.2);
      c.fillStyle = '#ff7b1a';
      c.beginPath(); c.moveTo(-8, 4); c.lineTo(0, -20); c.lineTo(8, 4); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-5, -5); c.lineTo(5, -5); c.lineTo(3.5, -10); c.lineTo(-3.5, -10); c.closePath(); c.fill();
      c.fillStyle = '#e06010'; c.fillRect(-11, 2, 22, 4);
    },
    hydrant(c) {
      shadow(c, 10, 4, 0.2);
      c.fillStyle = '#e8443a';
      rr(c, -6, -18, 12, 22, 3); c.fill();
      circle(c, 0, -18, 6); c.fill();
      c.fillRect(-10, -12, 20, 5);
      c.fillStyle = '#ffd23f'; circle(c, 0, -21, 2); c.fill();
    },
    lamp(c) {
      shadow(c, 10, 4, 0.2);
      c.fillStyle = '#3d4248'; c.fillRect(-2.5, -70, 5, 74);
      c.fillRect(-6, -4, 12, 6);
      c.fillRect(-2, -72, 18, 4);
      c.fillStyle = '#fff3a8'; circle(c, 14, -66, 5); c.fill();
    },
    puddle(c, d) {
      c.fillStyle = d.v % 3 === 0 ? 'rgba(90,200,80,0.45)' : 'rgba(40,40,50,0.35)';
      c.beginPath(); c.ellipse(0, 0, 22 + d.v % 10, 10 + d.v % 5, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.ellipse(-6, -3, 6, 2, 0, 0, TAU); c.fill();
    },
    crate(c) {
      shadow(c, 20, 6, 0.2);
      c.strokeStyle = OUT; c.lineWidth = 2;
      c.fillStyle = '#a5743f'; rr(c, -18, -26, 36, 32, 3); c.fill(); c.stroke();
      c.strokeStyle = '#7a5129'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-18, -26); c.lineTo(18, 6); c.moveTo(18, -26); c.lineTo(-18, 6); c.stroke();
    },
    pipe(c) {
      shadow(c, 30, 6, 0.2);
      c.fillStyle = '#6d7880'; rr(c, -30, -16, 60, 20, 10); c.fill();
      c.fillStyle = '#56616a'; c.fillRect(-20, -16, 6, 20); c.fillRect(14, -16, 6, 20);
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(-28, -12, 56, 4);
    },
    star(c, d) {
      c.fillStyle = `rgba(255,255,255,${0.3 + (d.v % 5) * 0.12})`;
      circle(c, 0, 0, 1 + (d.v % 3) * 0.7); c.fill();
    },
    crater(c, d) {
      const r = 14 + d.v % 12;
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 1, r, r * 0.6, 0, 0.2, Math.PI - 0.2); c.stroke();
    },
    light(c, d, time) {
      shadow(c, 8, 4, 0.2);
      c.fillStyle = '#9aa3c9'; c.fillRect(-2, -26, 4, 30);
      const on = (Math.floor(time * 2 + d.v) % 2) === 0;
      c.fillStyle = on ? '#5ff0ff' : '#2a6c80'; circle(c, 0, -28, 5); c.fill();
      if (on) { c.fillStyle = 'rgba(95,240,255,0.2)'; circle(c, 0, -28, 12); c.fill(); }
    },
  };

  function drawDecor(c, d, time) {
    c.save();
    c.translate(d.x, d.y);
    (DECOR[d.type])(c, d, time);
    c.restore();
  }

  window.Render = { rr, circle, star4, drawTrash, drawPlayer, drawBot, drawDepot, drawDepotPad, drawDecor, DECOR_FLAT };
})();

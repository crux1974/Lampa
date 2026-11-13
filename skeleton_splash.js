/*
 * Skeleton Splash — анімована заставка запуску для Lampa
 * Скелет пробиває цегляну стіну і вилазить назовні, потім з'являється логотип.
 *
 * Підключення: Lampa → Налаштування → Розширення → Додати плагін → URL цього файлу.
 *
 * Налаштування (необов'язково) — до підключення плагіна можна задати:
 *   window.SKELETON_SPLASH_CONFIG = { title:'LAMPA', subtitle:'TV', speed:1.15, sound:true };
 *
 * Будь-яка клавіша / клік / дотик — пропустити заставку.
 */
(function () {
  'use strict';
  if (window.__skeleton_splash__) return;
  window.__skeleton_splash__ = true;

  var CFG = {
    title: 'LAMPA',     // великий напис
    subtitle: 'TV',     // малий напис під ним
    speed: 1.15,        // 1 = ~8 c, 1.5 = ~5.5 c
    sound: true,        // синтезований звук ударів і обвалу
    skippable: true,    // пропуск по будь-якій клавіші
    renderScale: 0.6667,// роздільність малювання (менше = швидше на слабких приставках)
    autoplay: true
  };
  var user = window.SKELETON_SPLASH_CONFIG;
  if (user) for (var key in user) if (user.hasOwnProperty(key)) CFG[key] = user[key];

  var W = 1920, H = 1080, CX = 960, CY = 510, RX = 320, RY = 330;
  var LOGO_X = 1370, LOGO_Y = 500;
  var PI = Math.PI;
  var BONE = '#e9e3cf', OUT = '#16110c';
  // Часова шкала (секунди при speed = 1)
  var T = { k1: 0.6, k2: 1.1, crack: 1.0, brk: 2.4, hands: 2.7, pull: 3.0, out: 4.4,
            walk: 5.3, logo: 5.1, wave: 5.6, fade: 7.7, end: 8.3 };

  var box, cv, g, rs, raf, running = false, startMs = 0, fadeStart = 0, fired = {};
  var bricks, cracks, dust, P1, P2, P3, edgeL, edgeR, Y0, Y1, AC = null;

  /* ---------- утиліти ---------- */
  function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ---------- форма пролому ---------- */
  function lim(th) {
    return 1 + 0.10 * Math.sin(5 * th + P1) + 0.07 * Math.sin(9 * th + P2) + 0.04 * Math.sin(15 * th + P3);
  }
  function holeInfo(x, y) {
    var ex = (x - CX) / RX, ey = (y - CY) / RY;
    return Math.sqrt(ex * ex + ey * ey) / lim(Math.atan2(ey, ex));
  }
  function edgeAt(x) {
    for (var y = H; y > CY; y -= 4) if (holeInfo(x, y) < 1) return y;
    return CY + RY * 0.6;
  }

  /* ---------- підготовка сцени ---------- */
  function build() {
    var r = seeded(11), i, j;
    P1 = r() * 6.28; P2 = r() * 6.28; P3 = r() * 6.28;
    bricks = [];
    var bw = 128, bh = 64;
    for (var row = -1; row < Math.ceil(H / bh) + 1; row++) {
      var off = (Math.abs(row) % 2) ? -bw / 2 : 0;
      for (var col = -1; col < Math.ceil(W / bw) + 2; col++) {
        var x = col * bw + off, y = row * bh, mx = x + bw / 2, my = y + bh / 2;
        var inside = holeInfo(mx, my) < 0.92;
        var b = { x: x, y: y, mx: mx, my: my, hole: inside,
                  c: 'hsl(' + Math.round(14 + r() * 14) + ',' + Math.round(26 + r() * 18) + '%,' + Math.round(22 + r() * 11) + '%)' };
        if (inside) {
          var f = 1 + r() * 1.2;
          b.vx = (mx - CX) * f * 1.4;
          b.vy = (my - CY) * f * 1.1 - 180 - r() * 200;
          b.vz = 0.6 + r() * 1.8;
          b.vr = (r() - 0.5) * 8;
        }
        bricks.push(b);
      }
    }
    cracks = [];
    for (i = 0; i < 10; i++) {
      var a = i / 10 * 2 * PI + (r() - 0.5) * 0.5;
      var px = CX + (r() - 0.5) * 40, py = CY + (r() - 0.5) * 40, pts = [[px, py]];
      for (j = 0; j < 14; j++) {
        a += (r() - 0.5) * 0.9;
        var st = 28 + r() * 34;
        px += Math.cos(a) * st; py += Math.sin(a) * st;
        pts.push([px, py]);
      }
      cracks.push(pts);
    }
    dust = [];
    for (i = 0; i < 80; i++) {
      var an = r() * 2 * PI, sp = 120 + r() * 520;
      dust.push({ x: CX + (r() - 0.5) * RX * 1.2, y: CY + (r() - 0.5) * RY * 1.2,
                  vx: Math.cos(an) * sp, vy: Math.sin(an) * sp * 0.7 - 40,
                  r: 28 + r() * 60, life: 1.2 + r() * 1.2 });
    }
    edgeL = edgeAt(CX - 170); edgeR = edgeAt(CX + 170);
    Y0 = Math.max(edgeL, edgeR) + 300;
    Y1 = CY + 175;
  }

  /* ---------- звук (синтез WebAudio) ---------- */
  function audioInit() {
    if (!CFG.sound) return;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) { AC = new C(); if (AC.resume) AC.resume(); }
    } catch (e) { AC = null; }
  }
  function thud(vol, freq) {
    if (!AC) return;
    try {
      var n = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, n);
      o.frequency.exponentialRampToValueAtTime(30, n + 0.25);
      gn.gain.setValueAtTime(vol, n);
      gn.gain.exponentialRampToValueAtTime(0.001, n + 0.3);
      o.connect(gn); gn.connect(AC.destination);
      o.start(n); o.stop(n + 0.35);
    } catch (e) {}
  }
  function noise(dur, vol, cut) {
    if (!AC) return;
    try {
      var len = Math.floor(AC.sampleRate * dur), buf = AC.createBuffer(1, len, AC.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      var s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
      s.buffer = buf; f.type = 'lowpass'; f.frequency.value = cut; gn.gain.value = vol;
      s.connect(f); f.connect(gn); gn.connect(AC.destination); s.start();
    } catch (e) {}
  }
  function fire(t) {
    if (!fired.k1 && t >= T.k1) { fired.k1 = 1; thud(0.7, 110); }
    if (!fired.k2 && t >= T.k2) { fired.k2 = 1; thud(0.9, 95); }
    if (!fired.rm && t >= 1.6) { fired.rm = 1; noise(0.8, 0.25, 300); }
    if (!fired.b && t >= T.brk) { fired.b = 1; noise(1.4, 0.9, 1400); thud(1, 70); }
    if (!fired.h && t >= T.hands) { fired.h = 1; thud(0.35, 180); }
    if (!fired.o && t >= T.out) { fired.o = 1; thud(0.5, 120); }
  }

  /* ---------- тряска ---------- */
  function bump(t, t0, amp, dur) { var d = t - t0; return (d >= 0 && d < dur) ? amp * (1 - d / dur) : 0; }
  function shakeAmp(t) {
    var a = bump(t, T.k1, 4, 0.25) + bump(t, T.k2, 6, 0.3);
    if (t > 1.5 && t < T.brk) a += 2 + (t - 1.5) / 0.9 * 9;
    if (t >= T.brk) a += 22 * Math.exp(-(t - T.brk) * 5);
    return a;
  }

  /* ---------- скелет ---------- */
  function ik(sx, sy, tx, ty, l1, l2, out) {
    var dx = tx - sx, dy = ty - sy, d = Math.sqrt(dx * dx + dy * dy), mx = l1 + l2 - 0.5;
    if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
    if (d < 25) { if (d === 0) { dx = 0; dy = 25; } else { dx *= 25 / d; dy *= 25 / d; } d = 25; }
    var a = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    var base = Math.atan2(dy, dx);
    var e1x = sx + l1 * Math.cos(base + a), e1y = sy + l1 * Math.sin(base + a);
    var e2x = sx + l1 * Math.cos(base - a), e2y = sy + l1 * Math.sin(base - a);
    var one = out * e1x >= out * e2x;
    return { ex: one ? e1x : e2x, ey: one ? e1y : e2y, hx: sx + dx, hy: sy + dy };
  }
  function bone(x1, y1, x2, y2, w) {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
    g.strokeStyle = OUT; g.lineWidth = w + 6; g.stroke();
    g.strokeStyle = BONE; g.lineWidth = w; g.stroke();
  }
  function dot(x, y, r) {
    g.beginPath(); g.arc(x, y, r, 0, PI * 2);
    g.fillStyle = BONE; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  }
  function hand(x, y, ang) {
    for (var f = -1.5; f <= 1.5; f += 1) {
      var a = ang + f * 0.32;
      bone(x, y, x + Math.cos(a) * 22, y + Math.sin(a) * 22, 5);
    }
    dot(x, y, 8);
  }

  function skelState(t) {
    var S = { vis: false, front: false, t: t };
    if (t < T.hands) return S;
    S.vis = true;
    var pullP = ease(cl((t - T.pull) / (T.out - T.pull), 0, 1));
    var base0 = Y0 - 25 * ease(cl((t - T.hands) / 0.5, 0, 1));
    var y = lerp(base0, Y1, pullP);
    var x = CX + (t < T.out ? Math.sin(t * 34) * 2.5 * (1 - pullP * 0.6) : 0);
    var q = ease(cl((t - T.out) / (T.walk - T.out), 0, 1));
    x = lerp(x, CX - 330, q); y += 14 * q;
    var sc = 1 + 0.15 * q;
    S.front = t >= T.out; S.x = x; S.y = y; S.sc = sc;
    S.tilt = 0.07 * Math.sin(t * 3.1);
    var mv = Math.sin(PI * q), ph = (t - T.out) * 11;
    S.jaw = t >= T.wave ? 8 * (0.5 + 0.5 * Math.sin(t * 14))
          : (t >= T.pull && t < T.out ? 4 * (0.5 + 0.5 * Math.sin(t * 25)) : 0);
    var k = smooth(cl((pullP - 0.75) / 0.25, 0, 1));
    var tuck = lerp(190, 255, q);
    S.arms = []; S.legs = [];
    for (var i = 0; i < 2; i++) {
      var s = i ? 1 : -1;
      var fx = s < 0 ? CX - 170 : CX + 170, fy = (s < 0 ? edgeL : edgeR) - 8;
      var fixed = { x: (fx - x) / sc, y: (fy - y) / sc };
      var free = { x: s * 92 + s * 7 * Math.sin(ph + i * PI) * mv,
                   y: 12 + 14 * Math.sin(ph + i * PI) * mv + 2 * Math.sin(t * 2) };
      if (s > 0) {
        var wv = smooth(cl((t - T.wave) / 0.4, 0, 1));
        free = { x: lerp(free.x, 120 + 48 * Math.sin(t * 10), wv),
                 y: lerp(free.y, -295 + 8 * Math.sin(t * 5), wv) };
      }
      S.arms.push({ x: lerp(fixed.x, free.x, k), y: lerp(fixed.y, free.y, k) });
      var lift = 36 * mv * Math.max(0, Math.sin(ph + i * PI));
      var dang = t < T.out ? 10 * Math.sin(t * 7 + i * 2) : 0;
      S.legs.push({ x: s * (36 + dang * 0.6), y: tuck - lift + (t < T.out ? 6 * Math.sin(t * 6 + i) : 0) });
    }
    return S;
  }

  function drawSk(S) {
    var i, j, s, k;
    g.save();
    g.translate(S.x, S.y); g.scale(S.sc, S.sc);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // ноги
    for (i = 0; i < 2; i++) {
      s = i ? 1 : -1;
      var f = S.legs[i], hx = s * 30, hy = 12;
      k = ik(hx, hy, f.x, f.y, 130, 130, s);
      bone(hx, hy, k.ex, k.ey, 16); bone(k.ex, k.ey, k.hx, k.hy, 14);
      dot(hx, hy, 11); dot(k.ex, k.ey, 10);
      bone(k.hx, k.hy, k.hx + s * 22, k.hy + 5, 11);
    }
    // таз
    g.beginPath(); g.ellipse(0, 8, 60, 30, 0, 0, PI * 2);
    g.fillStyle = BONE; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); g.ellipse(0, 10, 22, 13, 0, 0, PI * 2); g.fillStyle = OUT; g.fill();
    // хребет
    bone(0, -168, 0, 0, 7);
    for (j = 0; j < 9; j++) {
      var vy = -158 + j * 17;
      g.fillStyle = BONE; g.strokeStyle = OUT; g.lineWidth = 3;
      g.fillRect(-9, vy - 6, 18, 12); g.strokeRect(-9, vy - 6, 18, 12);
    }
    // ребра
    for (j = 0; j < 6; j++) {
      var ry = -150 + j * 17, wd = 36 + Math.sin(j / 5 * PI * 0.9 + 0.2) * 24;
      g.beginPath();
      g.moveTo(-wd, ry + 14); g.quadraticCurveTo(-wd - 14, ry - 6, 0, ry);
      g.quadraticCurveTo(wd + 14, ry - 6, wd, ry + 14);
      g.strokeStyle = OUT; g.lineWidth = 11; g.stroke();
      g.strokeStyle = BONE; g.lineWidth = 6; g.stroke();
    }
    bone(0, -160, 0, -92, 8);
    // ключиці й руки
    bone(0, -163, -72, -158, 8); bone(0, -163, 72, -158, 8);
    for (i = 0; i < 2; i++) {
      s = i ? 1 : -1;
      var a = S.arms[i], sx = s * 72, sy = -158;
      k = ik(sx, sy, a.x, a.y, 100, 95, s);
      bone(sx, sy, k.ex, k.ey, 13); bone(k.ex, k.ey, k.hx, k.hy, 11);
      dot(sx, sy, 12); dot(k.ex, k.ey, 9);
      hand(k.hx, k.hy, Math.atan2(k.hy - k.ey, k.hx - k.ex));
    }
    // череп
    g.save();
    g.translate(0, -176); g.rotate(S.tilt); g.translate(0, 176);
    bone(0, -165, 0, -196, 10);
    var jd = S.jaw || 0;
    g.fillStyle = BONE; g.strokeStyle = OUT; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-32, -207 + jd); g.lineTo(-28, -188 + jd);
    g.quadraticCurveTo(0, -174 + jd, 28, -188 + jd); g.lineTo(32, -207 + jd);
    g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 2;
    for (j = -3; j <= 3; j++) { g.beginPath(); g.moveTo(j * 8, -206 + jd); g.lineTo(j * 8, -196 + jd); g.stroke(); }
    g.beginPath(); g.ellipse(0, -246, 50, 52, 0, 0, PI * 2);
    g.fillStyle = BONE; g.fill(); g.lineWidth = 4; g.stroke();
    g.beginPath(); g.moveTo(-34, -226); g.lineTo(-30, -207); g.lineTo(30, -207); g.lineTo(34, -226);
    g.closePath(); g.fillStyle = BONE; g.fill();
    g.lineWidth = 2; g.strokeStyle = OUT;
    for (j = -3; j <= 3; j++) { g.beginPath(); g.moveTo(j * 8, -216); g.lineTo(j * 8, -207); g.stroke(); }
    g.fillStyle = '#0d0907';
    g.beginPath(); g.ellipse(-20, -250, 13, 16, 0.15, 0, PI * 2); g.fill();
    g.beginPath(); g.ellipse(20, -250, 13, 16, -0.15, 0, PI * 2); g.fill();
    g.fillStyle = 'rgba(255,130,30,' + (0.75 + 0.25 * Math.sin(S.t * 20)) + ')';
    g.beginPath(); g.arc(-20, -248, 4, 0, PI * 2); g.fill();
    g.beginPath(); g.arc(20, -248, 4, 0, PI * 2); g.fill();
    g.fillStyle = '#0d0907';
    g.beginPath(); g.moveTo(0, -236); g.lineTo(-6, -222); g.lineTo(6, -222); g.closePath(); g.fill();
    g.restore();
    g.restore();
  }

  /* ---------- стіна, світло, уламки ---------- */
  function holePath() {
    g.beginPath();
    for (var i = 0; i <= 64; i++) {
      var th = i / 64 * 2 * PI, l = lim(th);
      var x = CX + RX * l * Math.cos(th), y = CY + RY * l * Math.sin(th);
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath();
  }
  function drawLight(t) {
    var tt = t - T.brk;
    g.save();
    holePath(); g.clip();
    var gr = g.createRadialGradient(CX, CY + 80, 20, CX, CY + 80, 560);
    gr.addColorStop(0, 'rgba(255,196,96,1)');
    gr.addColorStop(0.5, 'rgba(200,84,22,1)');
    gr.addColorStop(1, 'rgba(40,10,5,1)');
    g.globalAlpha = Math.min(1, tt / 0.15);
    g.fillStyle = gr;
    g.fillRect(CX - RX * 1.5, CY - RY * 1.5, RX * 3, RY * 3);
    g.restore();
  }
  function drawWall(t) {
    var broken = t >= T.brk, a = shakeAmp(t) * 0.7;
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (b.hole && broken) continue;
      var ox = 0, oy = 0;
      if (b.hole && a > 0.5) { ox = (Math.random() - 0.5) * a; oy = (Math.random() - 0.5) * a; }
      g.fillStyle = b.c;
      g.fillRect(b.x + 2 + ox, b.y + 2 + oy, 124, 60);
      g.fillStyle = 'rgba(255,200,150,0.07)';
      g.fillRect(b.x + 2 + ox, b.y + 2 + oy, 124, 6);
    }
  }
  function drawCracks(t) {
    var p = cl((t - T.crack) / (T.brk - T.crack - 0.1), 0, 1);
    if (p <= 0) return;
    for (var pass = 0; pass < 2; pass++) {
      g.beginPath();
      for (var i = 0; i < cracks.length; i++) {
        var pts = cracks[i], n = pts.length, kk = p * (n - 1);
        g.moveTo(pts[0][0], pts[0][1]);
        for (var j = 1; j < n; j++) {
          if (j - 1 >= kk) break;
          var fr = Math.min(1, kk - (j - 1));
          g.lineTo(lerp(pts[j - 1][0], pts[j][0], fr), lerp(pts[j - 1][1], pts[j][1], fr));
        }
      }
      if (!pass) { g.strokeStyle = '#050302'; g.lineWidth = 6; }
      else { g.strokeStyle = 'rgba(255,150,60,' + (0.25 + 0.6 * p) + ')'; g.lineWidth = 2; }
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.stroke();
    }
  }
  function drawDebris(t) {
    var tt = t - T.brk;
    if (tt > 1.3) return;
    var al = cl((1.3 - tt) / 0.6, 0, 1);
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.hole) continue;
      g.save();
      g.globalAlpha = al;
      g.translate(b.mx + b.vx * tt, b.my + b.vy * tt + 1100 * tt * tt);
      g.rotate(b.vr * tt);
      var sc = 1 + b.vz * tt;
      g.scale(sc, sc);
      g.fillStyle = b.c;
      g.fillRect(-62, -30, 124, 60);
      g.restore();
    }
  }
  function drawDust(t) {
    var tt = t - T.brk;
    if (tt < 0) return;
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      if (tt > d.life) continue;
      g.globalAlpha = 0.32 * (1 - tt / d.life);
      g.fillStyle = 'rgb(140,112,90)';
      g.beginPath(); g.arc(d.x + d.vx * tt, d.y + d.vy * tt, d.r * (1 + tt * 1.5), 0, PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  /* ---------- логотип ---------- */
  function drawLogo(t) {
    if (t < T.logo) return;
    var title = String(CFG.title || ''), gap = 14, fs = 170, i;
    var fam = '"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';
    g.save();
    g.textBaseline = 'middle'; g.textAlign = 'left';
    var ws, tot;
    for (var pass = 0; pass < 2; pass++) {
      g.font = '900 ' + fs + 'px ' + fam;
      ws = []; tot = 0;
      for (i = 0; i < title.length; i++) { var w = g.measureText(title.charAt(i)).width; ws.push(w); tot += w + gap; }
      tot -= gap;
      if (tot > 820 && pass === 0) fs = Math.max(40, Math.floor(fs * 820 / tot)); else break;
    }
    var x = LOGO_X - tot / 2;
    for (i = 0; i < title.length; i++) {
      var k = ease(cl((t - T.logo - i * 0.09) / 0.4, 0, 1));
      if (k > 0) {
        g.globalAlpha = k;
        var y = LOGO_Y + (1 - k) * -60;
        g.shadowColor = 'rgba(255,120,30,' + (0.85 * k) + ')'; g.shadowBlur = 30;
        g.fillStyle = '#f6f0df';
        g.fillText(title.charAt(i), x, y);
        g.shadowBlur = 0;
      }
      x += ws[i] + gap;
    }
    var k2 = ease(cl((t - T.logo - 0.7) / 0.5, 0, 1));
    if (k2 > 0) {
      g.globalAlpha = k2;
      g.fillStyle = 'rgba(255,150,60,0.9)';
      g.fillRect(LOGO_X - tot / 2 * k2, LOGO_Y + fs * 0.62, tot * k2, 4);
      g.font = '700 56px ' + fam;
      g.textAlign = 'center';
      g.fillStyle = '#d9d2bd';
      var sub = String(CFG.subtitle || '').split('').join(' ');
      g.fillText(sub, LOGO_X, LOGO_Y + fs * 0.62 + 60);
    }
    g.restore();
  }

  /* ---------- кадр ---------- */
  function render(t) {
    g.setTransform(rs, 0, 0, rs, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = '#0e0a08'; g.fillRect(0, 0, W, H);
    var amp = shakeAmp(t), broken = t >= T.brk;
    g.save();
    if (amp > 0.2) g.translate((Math.random() - 0.5) * 2 * amp, (Math.random() - 0.5) * 2 * amp);
    if (broken) drawLight(t);
    var S = skelState(t);
    if (S.vis && !S.front) drawSk(S);
    drawWall(t);
    if (broken) {
      drawDebris(t);
      var sp = g.createRadialGradient(CX, CY, 100, CX, CY, 900);
      sp.addColorStop(0, 'rgba(255,150,50,0.28)'); sp.addColorStop(1, 'rgba(255,150,50,0)');
      g.fillStyle = sp; g.fillRect(-60, -60, W + 120, H + 120);
    } else {
      drawCracks(t);
    }
    if (S.vis && S.front) drawSk(S);
    if (broken) drawDust(t);
    g.restore();
    drawLogo(t);
    var vg = g.createRadialGradient(CX, 540, 420, CX, 540, 1250);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    var fl = t - T.brk;
    if (fl >= 0 && fl < 0.35) { g.fillStyle = 'rgba(255,216,160,' + (0.9 * (1 - fl / 0.35)) + ')'; g.fillRect(0, 0, W, H); }
    if (t < 0.5) { g.fillStyle = 'rgba(0,0,0,' + (1 - t / 0.5) + ')'; g.fillRect(0, 0, W, H); }
  }

  /* ---------- життєвий цикл ---------- */
  function loop() {
    if (!running) return;
    var now = Date.now(), t = (now - startMs) / 1000 * CFG.speed, f;
    if (fadeStart) {
      f = (now - fadeStart) / 300;
      if (f >= 1) { stop(); return; }
      box.style.opacity = String(1 - f);
    } else if (t >= T.fade) {
      f = (t - T.fade) / (T.end - T.fade);
      if (f >= 1) { stop(); return; }
      box.style.opacity = String(1 - f);
    }
    fire(t);
    render(Math.min(t, T.end));
    raf = requestAnimationFrame(loop);
  }
  function skip() { if (running && !fadeStart) fadeStart = Date.now(); }
  function onKey(e) {
    if (!CFG.skippable) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    skip();
  }
  function stop() {
    running = false;
    try { cancelAnimationFrame(raf); } catch (e) {}
    document.removeEventListener('keydown', onKey, true);
    if (box && box.parentNode) box.parentNode.removeChild(box);
    try { if (AC && AC.close) AC.close(); } catch (e2) {}
    AC = null;
  }
  function play() {
    if (running) return;
    build();
    fired = {}; fadeStart = 0;
    rs = CFG.renderScale;
    box = document.createElement('div');
    box.id = 'skeleton-splash';
    box.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:#000;z-index:2147483647;opacity:1;';
    cv = document.createElement('canvas');
    cv.width = Math.round(W * rs); cv.height = Math.round(H * rs);
    cv.style.cssText = 'width:100%;height:100%;display:block;object-fit:contain;';
    box.appendChild(cv);
    document.body.appendChild(box);
    g = cv.getContext('2d');
    audioInit();
    if (CFG.skippable) {
      document.addEventListener('keydown', onKey, true);
      box.addEventListener('click', skip);
      box.addEventListener('touchstart', skip);
    }
    running = true;
    startMs = Date.now();
    raf = requestAnimationFrame(loop);
  }

  window.SkeletonSplash = { play: play, skip: skip, config: CFG };

  if (CFG.autoplay) {
    if (document.body) play();
    else document.addEventListener('DOMContentLoaded', play);
  }
})();

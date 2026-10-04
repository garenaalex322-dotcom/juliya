// Анимации упражнений: схематичная фигура сбоку или спереди, обратная кинематика для рук и ног,
// снаряды и тренажёры. Рисуется на canvas, цвета берутся из CSS-переменных темы.
const ANIM = (() => {
  'use strict';
  const L = { th: 42, sh: 40, to: 50, ua: 28, fa: 26, nk: 6, hr: 10, ft: 15, hp: 9, sp: 17 };
  const G = 170, AY = 165;
  const RAD = Math.PI / 180;
  const pt = (p, a, l) => [p[0] + l * Math.cos(a * RAD), p[1] + l * Math.sin(a * RAD)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function ik(root, target, l1, l2, pref) {
    let dx = target[0] - root[0], dy = target[1] - root[1], d = Math.hypot(dx, dy) || 0.001;
    const max = l1 + l2 - 0.05, min = Math.abs(l1 - l2) + 0.05;
    let t = target;
    if (d > max || d < min) { const nd = clamp(d, min, max); t = [root[0] + dx / d * nd, root[1] + dy / d * nd]; d = nd; }
    const base = Math.atan2(t[1] - root[1], t[0] - root[0]);
    const c = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const j1 = [root[0] + l1 * Math.cos(base + c), root[1] + l1 * Math.sin(base + c)];
    const j2 = [root[0] + l1 * Math.cos(base - c), root[1] + l1 * Math.sin(base - c)];
    const mid = [(root[0] + t[0]) / 2, (root[1] + t[1]) / 2];
    const sc = j => (j[0] - mid[0]) * pref[0] + (j[1] - mid[1]) * pref[1];
    return { j: sc(j1) >= sc(j2) ? j1 : j2, e: t };
  }

  // ---------- решение позы ----------
  function solve(p) {
    const front = p.v === 'f', t = p.t ?? -90, hip = p.h;
    const sh = pt(hip, t, L.to + (p.sl || 0));
    const n = pt([0, 0], t + 90, 1), u = pt([0, 0], t, 1);
    const tf = (a, b) => [sh[0] + n[0] * a - u[0] * b, sh[1] + n[1] * a - u[1] * b];
    const hf = (a, b) => [hip[0] + n[0] * a + u[0] * b, hip[1] + n[1] * a + u[1] * b];
    const head = pt(sh, t + (p.hd || 0), L.nk + L.hr);
    let hips, shs;
    if (front) { hips = [pt(hip, t + 90, L.hp), pt(hip, t + 90, -L.hp)]; shs = [pt(sh, t + 90, L.sp), pt(sh, t + 90, -L.sp)]; }
    else { hips = [hip, hip]; shs = [sh, sh]; }
    const limb = (spec, root, l1, l2, defPref, isLeg, i) => {
      const s = spec || {};
      let j, e;
      const tgt = s.a || s.w || (s.r ? tf(s.r[0], s.r[1]) : null) || (s.rh ? hf(s.rh[0], s.rh[1]) : null);
      if (tgt) { const r = ik(root, tgt, l1, l2, s.k || defPref); j = r.j; e = r.e; }
      else { const sc = s.s ?? 1; j = pt(root, s.u ?? 90, l1 * sc); e = pt(j, s.f ?? 90, l2 * (s.s2 ?? sc)); }
      const out = { root, j, e };
      if (isLeg) out.toe = front ? [e[0] + (i ? -3 : 3), e[1] + 3] : pt(e, s.ft ?? 0, L.ft);
      return out;
    };
    const legSpec = i => (p.L && (p.L[i] || p.L[0])) || null;
    const armSpec = i => (p.A && (p.A[i] || p.A[0])) || null;
    const legs = [0, 1].map(i => limb(legSpec(i), hips[i], L.th, L.sh, front ? [i ? -1 : 1, -0.2] : [1, 0], true, i));
    const arms = [0, 1].map(i => limb(armSpec(i), shs[i], L.ua, L.fa, front ? [i ? -1 : 1, 0.4] : [-0.4, 1], false, i));
    return { front, t, hip, sh, head, hips, shs, legs, arms, n, u, tb: p.tb || 0, hd: p.hd || 0, x: p.x || {} };
  }

  // ---------- интерполяция поз ----------
  function mix(a, b, t) {
    if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => b[i] === undefined ? v : mix(v, b[i], t));
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const o = {}; new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => { o[k] = a[k] === undefined ? b[k] : b[k] === undefined ? a[k] : mix(a[k], b[k], t); }); return o;
    }
    return t < 0.5 ? a : b;
  }
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function poseAt(spec, time) {
    const K = spec.k; if (K.length === 1) return K[0];
    const d = spec.d || 0.9, hold = spec.hold ?? (spec.loop ? 0 : 0.28), seg = d + hold;
    const order = spec.loop ? K.map((_, i) => i) : K.map((_, i) => i).concat(K.slice(1, -1).map((_, i) => K.length - 2 - i));
    const n = order.length, cyc = seg * n, tt = time % cyc, i = Math.floor(tt / seg), f = tt - i * seg;
    const a = K[order[i]], b = K[order[(i + 1) % n]];
    if (f < hold) return a;
    const x = (f - hold) / d;
    return mix(a, b, spec.lin ? x : ease(x));
  }

  // ---------- цвета ----------
  function colors(el) {
    const cs = getComputedStyle(el || document.documentElement), g = v => (cs.getPropertyValue(v) || '').trim();
    return { fg: g('--fg') || '#241C21', far: g('--muted') || '#888', acc: g('--accent') || '#A32F58', eq: g('--sunken') || '#ECE6E9',
      eqs: g('--muted') || '#888', line: g('--line') || '#ddd', cable: g('--prot') || '#2F6C97', band: g('--carb') || '#53843F', bg: g('--surface') || '#fff' };
  }

  // ---------- рисование ----------
  function seg(ctx, a, b, w, c) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function circ(ctx, p, r, c, stroke) { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); if (stroke) { ctx.strokeStyle = c; ctx.lineWidth = stroke; ctx.stroke(); } else { ctx.fillStyle = c; ctx.fill(); } }
  function rrect(ctx, x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }
  function drawLimb(ctx, lb, w1, w2, c, isLeg) {
    seg(ctx, lb.root, lb.j, w1, c); seg(ctx, lb.j, lb.e, w2, c);
    if (isLeg) seg(ctx, lb.e, lb.toe, 6, c); else circ(ctx, lb.e, 4, c);
  }
  function drawFigure(ctx, sk, C) {
    const off = sk.front ? [0, 0] : [-3, -2];
    const shift = lb => ({ root: [lb.root[0] + off[0], lb.root[1] + off[1]], j: [lb.j[0] + off[0], lb.j[1] + off[1]], e: [lb.e[0] + off[0], lb.e[1] + off[1]], toe: lb.toe && [lb.toe[0] + off[0], lb.toe[1] + off[1]] });
    if (!sk.front) {
      drawLimb(ctx, shift(sk.arms[1]), 8, 7, C.far, false);
      drawLimb(ctx, shift(sk.legs[1]), 11, 9, C.far, true);
      // туловище: прямое или с изгибом спины
      ctx.strokeStyle = C.fg; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(sk.hip[0], sk.hip[1]);
      if (sk.tb) { const m = [(sk.hip[0] + sk.sh[0]) / 2 + sk.n[0] * sk.tb, (sk.hip[1] + sk.sh[1]) / 2 + sk.n[1] * sk.tb]; ctx.quadraticCurveTo(m[0], m[1], sk.sh[0], sk.sh[1]); }
      else ctx.lineTo(sk.sh[0], sk.sh[1]);
      ctx.stroke();
      seg(ctx, sk.sh, pt(sk.sh, sk.t + (sk.hd || 0), L.nk), 7, C.fg);
      drawLimb(ctx, sk.legs[0], 12, 10, C.fg, true);
      circ(ctx, sk.head, L.hr, C.fg);
      drawLimb(ctx, sk.arms[0], 9, 8, C.fg, false);
    } else {
      sk.legs.forEach(lb => drawLimb(ctx, lb, 11, 9, C.fg, true));
      ctx.fillStyle = C.fg; ctx.strokeStyle = C.fg; ctx.lineWidth = 8; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(sk.shs[0][0], sk.shs[0][1]); ctx.lineTo(sk.shs[1][0], sk.shs[1][1]); ctx.lineTo(sk.hips[1][0], sk.hips[1][1]); ctx.lineTo(sk.hips[0][0], sk.hips[0][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      seg(ctx, sk.sh, pt(sk.sh, sk.t, L.nk), 7, C.fg);
      sk.arms.forEach(lb => drawLimb(ctx, lb, 8, 7, C.fg, false));
      circ(ctx, sk.head, L.hr, C.fg);
    }
  }
  const J = (sk, j, i) => { const k = { ankle: ['legs', 'e'], knee: ['legs', 'j'], toe: ['legs', 'toe'], wrist: ['arms', 'e'], elbow: ['arms', 'j'] }[j]; if (k) return sk[k[0]][i || 0][k[1]]; if (j === 'hip') return sk.hip; if (j === 'sh') return sk.sh; if (j === 'head') return sk.head; return sk.hip; };
  const hands = (sk, h) => h === 'f' ? [sk.arms[1].e] : h === 'b' ? [sk.arms[0].e, sk.arms[1].e] : h === 'm' ? [[(sk.arms[0].e[0] + sk.arms[1].e[0]) / 2, (sk.arms[0].e[1] + sk.arms[1].e[1]) / 2]] : [sk.arms[0].e];
  function drawProp(ctx, pr, sk, C) {
    const t = pr.t;
    if (t === 'bench') {
      const a = pr.a || 0, p1 = [pr.x, pr.y], p2 = pt(p1, a, pr.w);
      if (pr.leg !== false) { [p1, p2].forEach(p => seg(ctx, [p[0], p[1] + 4], [p[0], G], 3, C.eqs)); }
      seg(ctx, p1, p2, 9, C.eqs); seg(ctx, p1, p2, 6, C.eq);
    } else if (t === 'pad') rrect(ctx, pr.x, pr.y, pr.w, pr.h, Math.min(5, pr.w / 2, pr.h / 2), C.eq, C.eqs, 1.5);
    else if (t === 'box') rrect(ctx, pr.x, pr.y, pr.w, pr.h, 3, C.eq, C.eqs, 1.5);
    else if (t === 'line') seg(ctx, pr.p[0], pr.p[1], pr.w || 3, C.eqs);
    else if (t === 'rails') { [pr.x1, pr.x2].forEach(x => x != null && seg(ctx, [x, pr.y1 ?? 0], [x, G], 3, C.line)); }
    else if (t === 'wall') { ctx.fillStyle = C.line; ctx.fillRect(pr.x, pr.y ?? 0, pr.w || 6, G - (pr.y ?? 0)); }
    else if (t === 'mat') rrect(ctx, pr.x1, G - 4, pr.x2 - pr.x1, 4, 2, C.eq, null);
    else if (t === 'bar') { if (pr.x1 != null) seg(ctx, [pr.x1, pr.y], [pr.x2, pr.y], 4, C.eqs); else circ(ctx, [pr.x, pr.y], 4, C.eqs); }
    else if (t === 'db') {
      hands(sk, pr.h).forEach(w => {
        if (sk.front && !pr.bar) { circ(ctx, w, 6.5, C.acc); circ(ctx, w, 2.5, C.bg); return; }
        if (pr.end) { circ(ctx, w, 6.5, C.acc); circ(ctx, w, 2.5, C.bg); return; }
        const fa = sk.arms[pr.h === 'f' ? 1 : 0], fang = Math.atan2(fa.e[1] - fa.j[1], fa.e[0] - fa.j[0]) / RAD;
        const o = pr.perp ? fang + 90 : (pr.o ?? 0), a = pt(w, o, 10), b = pt(w, o + 180, 10);
        seg(ctx, a, b, 3, C.acc); [a, b].forEach(q => seg(ctx, pt(q, o + 90, 6), pt(q, o - 90, 6), 6, C.acc));
      });
    } else if (t === 'dbv') {
      const w = hands(sk, 'm')[0], a = [w[0], w[1] - 11], b = [w[0], w[1] + 11];
      seg(ctx, a, b, 3, C.acc); [a, b].forEach(q => seg(ctx, [q[0] - 8, q[1]], [q[0] + 8, q[1]], 6, C.acc));
    } else if (t === 'bb') {
      let c;
      if (pr.at === 'hip') c = [sk.hip[0] + sk.n[0] * 13, sk.hip[1] + sk.n[1] * 13];
      else if (pr.at === 'back') c = [sk.sh[0] - sk.n[0] * 7 - sk.u[0] * 2, sk.sh[1] - sk.n[1] * 7 - sk.u[1] * 2];
      else if (pr.at === 'front') c = [sk.sh[0] + sk.n[0] * 9 - sk.u[0] * 1, sk.sh[1] + sk.n[1] * 9 - sk.u[1] * 1];
      else c = hands(sk, sk.front ? 'm' : 'n')[0];
      if (sk.front) {
        const half = pr.half || 62; seg(ctx, [c[0] - half, c[1]], [c[0] + half, c[1]], 3.5, C.eqs);
        [-1, 1].forEach(s => rrect(ctx, c[0] + s * (half - 4) - 4, c[1] - 16, 8, 32, 3, C.acc, null));
      } else { circ(ctx, c, pr.r || 15, C.acc); circ(ctx, c, 3, C.bg); }
    } else if (t === 'kb') {
      hands(sk, pr.h || 'n').forEach(w => { const c = [w[0], w[1] + 11]; circ(ctx, c, 8.5, C.acc); ctx.strokeStyle = C.acc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(w[0], w[1] + 4, 5, Math.PI, 0); ctx.stroke(); });
    } else if (t === 'cable' || t === 'band') {
      const col = t === 'band' ? C.band : C.cable;
      (pr.leg ? [sk.legs[0].e] : hands(sk, pr.h || 'n')).forEach(w => {
        ctx.setLineDash(t === 'band' ? [5, 3] : []); seg(ctx, pr.from, w, t === 'band' ? 3 : 2, col); ctx.setLineDash([]);
        if (t === 'cable') { circ(ctx, pr.from, 5, C.eqs); circ(ctx, pr.from, 2, C.bg); }
      });
      if (pr.grip) { const hs = hands(sk, 'b'); seg(ctx, [hs[0][0] - (sk.front ? 0 : 6), hs[0][1]], [hs[sk.front ? 1 : 0][0] + (sk.front ? 0 : 6), hs[sk.front ? 1 : 0][1]], 4, C.eqs); }
    } else if (t === 'grip') {
      const hs = hands(sk, 'b');
      if (sk.front) { const half = pr.half || 40, m = [(hs[0][0] + hs[1][0]) / 2, (hs[0][1] + hs[1][1]) / 2]; seg(ctx, [m[0] - half, m[1]], [m[0] + half, m[1]], 4, C.eqs); }
      else circ(ctx, hs[0], 4.5, C.eqs);
    } else if (t === 'roller') {
      const c = J(sk, pr.j, pr.i); const p = [c[0] + (pr.off ? pr.off[0] : 0), c[1] + (pr.off ? pr.off[1] : 0)];
      if (pr.piv) seg(ctx, pr.piv, p, 4, C.eqs);
      circ(ctx, p, pr.r || 6.5, C.eq); circ(ctx, p, pr.r || 6.5, C.eqs, 1.5);
    } else if (t === 'sled') {
      const a = J(sk, 'ankle'), toe = J(sk, 'toe'), c = [(a[0] + toe[0]) / 2 + (pr.off ? pr.off[0] : 0), (a[1] + toe[1]) / 2 + (pr.off ? pr.off[1] : 0)];
      const ang = pr.a ?? -45, p1 = pt(c, ang, (pr.w || 46) / 2), p2 = pt(c, ang + 180, (pr.w || 46) / 2);
      seg(ctx, p1, p2, 7, C.eqs);
      if (pr.rail) seg(ctx, pt(c, ang + 90, 4), pt(c, ang + 90, 60), 3, C.line);
    } else if (t === 'backpad') {
      const side = pr.side || -1, off = pr.off || 13, a = [sk.hip[0] + sk.n[0] * off * side, sk.hip[1] + sk.n[1] * off * side], b = [sk.sh[0] + sk.n[0] * off * side, sk.sh[1] + sk.n[1] * off * side];
      const e1 = pt(a, sk.t + 180, pr.ext1 ?? 4), e2 = pt(b, sk.t, pr.ext2 ?? 6);
      seg(ctx, e1, e2, 10, C.eqs); seg(ctx, e1, e2, 7, C.eq);
    } else if (t === 'kband') {
      const a = sk.legs[0].j, b = sk.legs[1].j; ctx.setLineDash([4, 3]); seg(ctx, a, b, 3, C.band); ctx.setLineDash([]);
    } else if (t === 'seat') {
      const h = J(sk, 'hip'); rrect(ctx, h[0] - (pr.w || 30) / 2 + (pr.dx || 0), h[1] + 6, pr.w || 30, 6, 3, C.eq, C.eqs, 1.5);
    } else if (t === 'rope') {
      const w = sk.arms[0].e, ph = sk.x.rope ?? 1, cx = sk.hip[0] + 4;
      const y1 = ph > 0 ? w[1] : sk.head[1] - 24, y2 = ph > 0 ? G + 3 : w[1];
      ctx.strokeStyle = C.cable; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, (y1 + y2) / 2, 17, (y2 - y1) / 2, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (t === 'tread') {
      rrect(ctx, pr.x1, G - 7, pr.x2 - pr.x1, 7, 3, C.eq, C.eqs, 1.5); seg(ctx, [pr.x2 - 6, G - 7], [pr.x2 + 6, 70], 4, C.eqs); seg(ctx, [pr.x2 + 6, 70], [pr.x2 - 14, 74], 4, C.eqs);
    } else if (t === 'bike') {
      seg(ctx, [pr.cx, pr.cy], [pr.sx, pr.sy + 6], 4, C.eqs); seg(ctx, [pr.cx, pr.cy], [pr.cx + 30, G], 4, C.eqs); seg(ctx, [pr.cx - 30, G], [pr.cx, pr.cy], 4, C.eqs);
      seg(ctx, [pr.cx + 10, pr.cy - 6], [pr.hx, pr.hy], 4, C.eqs); rrect(ctx, pr.sx - 12, pr.sy + 4, 24, 5, 2, C.eqs, null);
      circ(ctx, [pr.cx, pr.cy], 8, C.eqs, 2.5);
      if (pr.wheel) circ(ctx, [pr.cx + 34, G - 18], 16, C.eqs, 3);
    } else if (t === 'crank') {
      const a = J(sk, 'ankle', 0), b = J(sk, 'ankle', 1); seg(ctx, [pr.cx, pr.cy], a, 3, C.eqs); seg(ctx, [pr.cx, pr.cy], b, 3, C.line);
    }
  }
  const BACK = new Set(['bench', 'pad', 'box', 'line', 'rails', 'wall', 'mat', 'tread', 'bike', 'backpad', 'seat']);
  function drawProps(ctx, props, sk, C, back) { (props || []).forEach(pr => { const isBack = pr.z != null ? pr.z < 0 : BACK.has(pr.t); if (isBack === back) drawProp(ctx, pr, sk, C); }); }

  // ---------- рамка ----------
  function bounds(spec) {
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    const addp = p => { if (!p) return; x1 = Math.min(x1, p[0]); y1 = Math.min(y1, p[1]); x2 = Math.max(x2, p[0]); y2 = Math.max(y2, p[1]); };
    const samples = [];
    spec.k.forEach((k, i) => { samples.push(k); const nx = spec.k[i + 1]; if (nx) samples.push(mix(k, nx, 0.5)); });
    samples.forEach(k => {
      const sk = solve(k);
      [sk.head, sk.sh, sk.hip].forEach(addp); sk.legs.concat(sk.arms).forEach(l => { addp(l.j); addp(l.e); addp(l.toe); });
      addp([sk.head[0] - L.hr, sk.head[1] - L.hr]); addp([sk.head[0] + L.hr, sk.head[1] + L.hr]);
    });
    (spec.p || []).forEach(pr => {
      if (pr.t === 'bench') { addp([pr.x, pr.y]); addp(pt([pr.x, pr.y], pr.a || 0, pr.w)); }
      else if (pr.t === 'pad' || pr.t === 'box') { addp([pr.x, pr.y]); addp([pr.x + pr.w, pr.y + pr.h]); }
      else if (pr.t === 'line') pr.p.forEach(addp);
      else if (pr.t === 'bar') { addp([pr.x ?? pr.x1, pr.y]); if (pr.x2 != null) addp([pr.x2, pr.y]); }
      else if (pr.t === 'cable' || pr.t === 'band') addp(pr.from);
      else if (pr.t === 'rails') { addp([pr.x1, pr.y1 ?? 20]); if (pr.x2 != null) addp([pr.x2, pr.y1 ?? 20]); }
      else if (pr.t === 'tread') { addp([pr.x1, G]); addp([pr.x2 + 8, 70]); }
      else if (pr.t === 'bike') { addp([pr.cx - 30, G]); addp([pr.cx + (pr.wheel ? 52 : 30), G]); addp([pr.hx, pr.hy]); }
      else if (pr.t === 'mat') { addp([pr.x1, G]); addp([pr.x2, G]); }
      else if (pr.t === 'wall') { addp([pr.x, pr.y ?? 40]); addp([pr.x + (pr.w || 6), G]); }
    });
    addp([x1, G + 2]);
    return { x1: x1 - 8, y1: y1 - 8, x2: x2 + 8, y2: Math.max(y2, G) + 4 };
  }

  function render(canvas, spec, pose, C, bb) {
    const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth || canvas.width, H = canvas.clientHeight || canvas.height;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bw = bb.x2 - bb.x1, bh = bb.y2 - bb.y1, s = Math.min(W / bw, H / bh) * dpr;
    const ox = (W * dpr - bw * s) / 2 - bb.x1 * s, oy = (H * dpr - bh * s) / 2 - bb.y1 * s;
    ctx.setTransform(s, 0, 0, s, ox, oy); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    seg(ctx, [bb.x1 + 2, G + 1.5], [bb.x2 - 2, G + 1.5], 2, C.line);
    const sk = solve(pose);
    drawProps(ctx, spec.p, sk, C, true);
    drawFigure(ctx, sk, C);
    drawProps(ctx, spec.p, sk, C, false);
  }

  const SPECS = {};
  const cache = {};
  function get(id) { if (!SPECS[id]) return null; if (!cache[id]) { const s = SPECS[id](); cache[id] = { s, bb: bounds(s) }; } return cache[id]; }
  function play(canvas, id) {
    const g = get(id); if (!g) return () => { };
    const C = colors(canvas); let raf = 0, t0 = performance.now(), alive = true;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = now => { if (!alive) return; render(canvas, g.s, poseAt(g.s, reduce ? 0 : (now - t0) / 1000), C, g.bb); if (!reduce) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }
  function thumb(canvas, id) {
    const g = get(id); if (!g) return false;
    const k = g.s.k, pose = k.length > 1 ? (g.s.th != null ? k[g.s.th] : k[1]) : k[0];
    render(canvas, g.s, pose, colors(canvas), g.bb); return true;
  }
  function frame(canvas, id, idx) { const g = get(id); if (!g) return false; render(canvas, g.s, g.s.k[Math.min(idx, g.s.k.length - 1)], colors(canvas), g.bb); return true; }
  return { SPECS, play, thumb, frame, has: id => !!SPECS[id], L, G, AY, pt };
})();

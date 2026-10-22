// Анимации для дополнительных упражнений, часть c
(() => {
  'use strict';
  const X = ANIM.SPECS, AY = ANIM.AY, G = ANIM.G, pt = ANIM.pt;
  const { HANG, copy, ST, STF, shift, hold, line, SIT, SITF, SUP, PRO, QUAD, benchFlat, seatPads, seatF, squat, hinge, FRONTL, BACKL, splitSq } = ANIM.H;
  // точка пересечения двух окружностей (центр a, радиус ra) и (центр b, радиус rb); s выбирает одну из двух
  const meet = (a, ra, b, rb, s) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), m = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - m * m));
    const c = [a[0] + dx / d * m, a[1] + dy / d * m]; return [c[0] - s * dy / d * h, c[1] + s * dx / d * h];
  };

  /* ================= Плечи ================= */
  X.db_press_standing = () => ({ k: [
    STF({ A: [{ u: 28, f: -88 }, { u: 152, f: -92 }] }),
    STF({ A: [{ u: -78, f: -84 }, { u: -102, f: -96 }] })],
    p: [{ t: 'db', h: 'b', bar: true, o: 0 }] });
  X.smith_ohp = () => ({ k: [
    SIT({ t: -92, A: [{ w: [116, 72], k: [0.3, 1] }] }),
    SIT({ t: -92, A: [{ w: [114, 25], k: [0.3, 1] }] })],
    p: seatPads(true).concat([{ t: 'rails', x1: 115, y1: 0 }, { t: 'bb', r: 11 }]) });
  X.landmine_press = () => {
    const A = [236, 167], P0 = [116, 43], R = Math.hypot(P0[0] - A[0], P0[1] - A[1]);
    const base = { h: [100, 86], t: -80, hd: 4, L: [{ a: [82, AY], ft: 10 }, { a: [122, AY], k: [1, -0.2] }] };
    const sh = pt(base.h, base.t, 50), P1 = meet(A, R, sh, 52, 1);
    return { k: [
      Object.assign(copy(base), { A: [{ w: P0, k: [0.2, 1] }, { u: 96, f: 92 }] }),
      Object.assign(copy(base), { A: [{ w: P1, k: [0.2, 1] }, { u: 96, f: 92 }] })],
      p: [{ t: 'lever', from: A, ext: 5, pr: 12 }] };
  };
  X.cable_front_raise = () => ({ k: [
    ST({ L: [{ a: [106, AY] }, { a: [94, AY] }], A: [{ u: 84, f: 84 }, { u: 94, f: 92 }] }),
    ST({ L: [{ a: [106, AY] }, { a: [94, AY] }], A: [{ u: -4, f: -6 }, { u: 94, f: 92 }] })],
    p: [{ t: 'line', p: [[52, 10], [52, G]], w: 5 }, { t: 'cable', from: [56, 158], h: 'n' }] });
  X.plate_front_raise = () => ({ k: [
    ST({ A: [{ u: 84, f: 80 }] }),
    ST({ A: [{ u: -8, f: -12 }] })],
    p: [{ t: 'bb', r: 16 }] });
  X.seated_lateral = () => ({ k: [
    SITF({ A: [{ u: 76, f: 80 }, { u: 104, f: 100 }] }),
    SITF({ A: [{ u: -4, f: -6 }, { u: 184, f: 186 }] })],
    p: seatF(false).concat([{ t: 'line', p: [[100, 129], [100, G]], w: 4 }, { t: 'db', h: 'b' }]) });
  X.cable_rear_delt = () => ({ k: [
    STF({ A: [{ u: 0, s: 0.2, f: 0, s2: 0.2 }, { u: 180, s: 0.2, f: 180, s2: 0.2 }] }),
    STF({ A: [{ u: -2, f: 2 }, { u: 182, f: 178 }] })],
    p: [{ t: 'line', p: [[6, 0], [6, G]], w: 5 }, { t: 'line', p: [[194, 0], [194, G]], w: 5 },
      { t: 'cable', from: [10, 58], h: 'n' }, { t: 'cable', from: [190, 58], h: 'f' }] });
  X.chest_supported_rear_delt = () => {
    const P = o => Object.assign({ h: [76, 116], t: -38, hd: -12, L: [{ a: [12, AY], k: [1, 0], ft: 0 }] }, o);
    return { k: [P({ A: [{ u: 90, f: 92 }] }), P({ A: [{ u: 80, s: 0.25, f: 70, s2: 0.25 }] })],
      p: [{ t: 'backpad', side: 1, off: 13, ext1: 8, ext2: 2 }, { t: 'line', p: [[84, 134], [84, G]], w: 4 }, { t: 'db', h: 'n', end: true }] };
  };
  X.band_external_rotation = () => ({ k: [
    STF({ A: [{ u: 88, f: 0, s2: -0.5 }, { u: 94, f: 92 }] }),
    STF({ A: [{ u: 88, f: 0, s2: 0.95 }, { u: 94, f: 92 }] })],
    p: [{ t: 'line', p: [[10, 20], [10, G]], w: 5 }, { t: 'band', from: [14, 64], h: 'n' }] });
  X.side_lying_rotation = () => {
    const P = s2 => ({ v: 'f', h: [96, 152], t: 180, L: [{ u: -2, f: 0 }, { u: 2, f: 0 }], A: [{ u: 8, f: -90, s2 }, { u: 180, f: -66 }] });
    return { d: 1.1, k: [P(-0.8), P(0.95)], p: [{ t: 'mat', x1: 12, x2: 186 }, { t: 'db', h: 'n' }] };
  };
  X.band_ohp = () => ({ k: [
    STF({ A: [{ u: 28, f: -88 }, { u: 152, f: -92 }] }),
    STF({ A: [{ u: -78, f: -84 }, { u: -102, f: -96 }] })],
    p: [{ t: 'band', from: [110, 167], h: 'n' }, { t: 'band', from: [90, 167], h: 'f' }] });
  X.wall_slide = () => ({ d: 1.2, k: [
    STF({ A: [{ u: 14, f: -90 }, { u: 166, f: -90 }] }),
    STF({ A: [{ u: -56, f: -64 }, { u: -124, f: -116 }] })],
    p: [{ t: 'wall', x: 28, y: -18, w: 144 }] });

  /* ================= Руки ================= */
  X.incline_db_curl = () => {
    const P = a => ({ h: [98, 126], t: -122, L: [{ a: [140, AY], k: [0, -1] }], A: a });
    return { k: [P([{ u: 90, f: 90 }]), P([{ u: 90, f: -62 }])],
      p: [{ t: 'backpad', ext1: 2, ext2: 16 }, { t: 'pad', x: 80, y: 132, w: 40, h: 8 }, { t: 'line', p: [[98, 140], [98, G]], w: 4 }, { t: 'db', h: 'n', end: true }] };
  };
  X.spider_curl = () => {
    const P = a => ({ h: [72, 118], t: -45, hd: -10, L: [{ a: [10, AY], k: [1, 0], ft: 0 }], A: a });
    return { k: [P([{ u: 90, f: 90 }]), P([{ u: 92, f: -78 }])],
      p: [{ t: 'backpad', side: 1, off: 13, ext1: 8, ext2: -18 }, { t: 'line', p: [[88, 124], [88, G]], w: 4 }, { t: 'db', h: 'n', end: true }] };
  };
  X.ez_curl = () => ({ k: [ST({ A: [{ u: 92, f: 90 }] }), ST({ A: [{ u: 86, f: -72 }] })], p: [{ t: 'bb', r: 11 }] });
  X.zottman_curl = () => ({ loop: true, d: 0.8, hold: 0.15, k: [
    ST({ A: [{ u: 92, f: 90 }] }),
    ST({ A: [{ u: 86, f: -72 }] }),
    ST({ A: [{ u: 86, f: -66 }] }),
    ST({ A: [{ u: 90, f: 20 }] }),
    ST({ A: [{ u: 92, f: 88 }] })],
    p: [{ t: 'db', h: 'n', end: true }] });
  X.rope_hammer_curl = () => ({ k: [ST({ A: [{ u: 92, f: 84 }] }), ST({ A: [{ u: 88, f: -70 }] })],
    p: [{ t: 'cable', from: [150, 162] }, { t: 'line', p: [[154, 20], [154, G]], w: 5 }] });
  X.machine_curl = () => {
    const el = pt(pt([98, 126], -80, 50), 52, 28);
    return { k: [SIT({ t: -80, A: [{ u: 52, f: 44 }] }), SIT({ t: -80, A: [{ u: 52, f: -96 }] })],
      p: seatPads(false).concat([{ t: 'line', p: [[108, 88], [132, 112]], w: 9 }, { t: 'line', p: [[134, 114], [134, G]], w: 4 },
        { t: 'line', p: [[160, 20], [160, G]], w: 5 }, { t: 'roller', j: 'wrist', piv: el, r: 5 }]) };
  };
  X.band_curl = () => ({ k: [ST({ A: [{ u: 92, f: 90 }] }), ST({ A: [{ u: 86, f: -72 }] })], p: [{ t: 'band', from: [104, 167], h: 'n' }] });
  X.wrist_curl = () => {
    const P = f => SIT({ t: -50, hd: 24, A: [{ u: 95, f }] });
    return { d: 0.7, k: [P(16), P(-14)], p: seatPads(false).concat([{ t: 'db', h: 'n', end: true }]) };
  };
  X.single_arm_pushdown = () => ({ k: [
    ST({ t: -84, A: [{ u: 96, f: -14 }, { w: [124, 70], k: [0, 1] }] }),
    ST({ t: -84, A: [{ u: 96, f: 90 }, { w: [124, 70], k: [0, 1] }] })],
    p: [{ t: 'cable', from: [124, -20] }, { t: 'line', p: [[128, -30], [128, G]], w: 5 }] });
  X.machine_triceps_ext = () => {
    const sh = pt([98, 126], -88, 50), el = pt(sh, 30, 28);
    const pad1 = pt(pt(sh, 30, 8), 120, 8), pad2 = pt(pt(el, 30, 6), 120, 8);
    return { k: [SIT({ t: -88, A: [{ u: 30, f: -108 }] }), SIT({ t: -88, A: [{ u: 30, f: 36 }] })],
      p: seatPads(true).concat([{ t: 'line', p: [pad1, pad2], w: 9 }, { t: 'line', p: [[pad2[0] - 2, pad2[1] + 4], [pad2[0] - 2, G]], w: 4 },
        { t: 'roller', j: 'wrist', piv: el, r: 5 }]) };
  };
  X.diamond_pushup = () => ({ k: [
    line([40, 156], -30, { A: [{ w: [148, 164], k: [-1, -0.3] }] }),
    line([40, 156], -15, { A: [{ w: [148, 164], k: [-1, -0.3] }] })] });
  X.band_pushdown = () => ({ k: [ST({ t: -84, A: [{ u: 96, f: -14 }] }), ST({ t: -84, A: [{ u: 96, f: 90 }] })],
    p: [{ t: 'line', p: [[132, -30], [132, G]], w: 5 }, { t: 'band', from: [128, -16], h: 'n' }] });
  X.seated_dip_machine = () => ({ k: [
    SIT({ t: -96, A: [{ w: [114, 98], k: [-1, -0.2] }] }),
    SIT({ t: -96, A: [{ w: [114, 122], k: [-1, -0.2] }] })],
    p: seatPads(false).concat([{ t: 'backpad', ext1: 2, ext2: 8 }]).concat([{ t: 'roller', j: 'wrist', piv: [150, 104], r: 4.5, z: -1 }, { t: 'line', p: [[156, 30], [156, G]], w: 5 }]) });
  X.cable_kickback = () => {
    const P = (f) => ({ h: [74, 92], t: -18, hd: -10, L: [{ a: [104, AY] }, { a: [66, AY] }], A: [{ u: 186, f }, { w: [158, 100], k: [0, 1] }] });
    return { k: [P(72), P(184)], p: [{ t: 'line', p: [[164, 20], [164, G]], w: 5 }, { t: 'cable', from: [160, 158], h: 'n' }] };
  };
})();

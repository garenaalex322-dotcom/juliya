// Анимации для дополнительных упражнений, часть g
(() => {
  'use strict';
  const X = ANIM.SPECS, AY = ANIM.AY, G = ANIM.G, pt = ANIM.pt;
  const { HANG, copy, ST, STF, shift, hold, line, SIT, SITF, SUP, PRO, QUAD, benchFlat, seatPads, seatF, squat, hinge, FRONTL, BACKL, splitSq } = ANIM.H;
  // точка на прямой от плеча к точке крепления петель на длине почти прямой руки
  const toward = (sh, tgt, len) => { const a = Math.atan2(tgt[1] - sh[1], tgt[0] - sh[0]) * 180 / Math.PI; return pt(sh, a, len ?? 53.5); };
  // тело прямой линией от лодыжек под углом al (отклонение назад в петлях TRX)
  const trxBody = (ank, al) => { const h = pt(ank, al, 82); return { h, t: al, sh: pt(h, al, 50), L: [{ a: ank, k: [0, -1], ft: -62 }] }; };

  /* ================= Спина ================= */
  X.meadows_row = () => {
    const base = { h: [78, 104], t: -24, hd: -8, L: [{ a: [138, AY], k: [1, -0.2] }, { a: [42, AY], ft: 0 }] };
    const free = { w: [120, 116], k: [-0.2, 1] };
    return { k: [
      Object.assign(copy(base), { A: [{ u: 90, f: 90 }, free] }),
      Object.assign(copy(base), { A: [{ r: [12, 32], k: [-0.4, -1] }, free] })],
      p: [{ t: 'lever', from: [204, 167], ext: 6, pr: 12 }] };
  };
  X.pendlay_row = () => ({ d: 0.7, k: [
    { h: [64, 106], t: -6, hd: -8, L: [{ a: [100, AY] }], A: [{ u: 90, f: 90 }] },
    { h: [64, 106], t: -6, hd: -8, L: [{ a: [100, AY] }], A: [{ r: [12, 30], k: [-0.4, -1] }] }], p: [{ t: 'bb' }] });
  X.underhand_bb_row = () => ({ k: [
    { h: [74, 94], t: -38, hd: -8, L: [{ a: [104, AY] }], A: [{ u: 90, f: 90 }] },
    { h: [74, 94], t: -38, hd: -8, L: [{ a: [104, AY] }], A: [{ r: [14, 40], k: [-0.4, -1] }] }], p: [{ t: 'bb', r: 13 }] });
  X.wide_cable_row = () => ({ k: [
    { h: [80, 146], t: -78, L: [{ a: [146, 150], ft: -80, k: [0, -1] }], A: [{ w: [150, 112], k: [0, 1] }] },
    { h: [80, 146], t: -94, L: [{ a: [146, 150], ft: -80, k: [0, -1] }], A: [{ r: [16, 20], k: [-1, -0.4] }] }],
    p: [{ t: 'pad', x: 56, y: 152, w: 48, h: 8 }, { t: 'pad', x: 152, y: 128, w: 7, h: 32 }, { t: 'cable', from: [184, 118], grip: true }] });
  X.machine_pullover = () => ({ d: 1, k: [
    SIT({ t: -92, A: [{ u: -100, f: -24 }] }),
    SIT({ t: -92, A: [{ u: 72, f: 24 }] })],
    p: seatPads(true).concat([{ t: 'line', p: [[72, 0], [72, G]], w: 5 }, { t: 'roller', j: 'elbow', off: [-3, 0], r: 6 }, { t: 'grip' }]) });
  X.machine_lat_pulldown = () => ({ k: [
    SIT({ t: -92, A: [{ w: [110, 22], k: [-0.4, 1] }] }),
    SIT({ t: -97, A: [{ w: [108, 84], k: [-1, 0.6] }] })],
    p: seatPads(false).concat([{ t: 'pad', x: 116, y: 112, w: 26, h: 7 }, { t: 'line', p: [[30, 40], [30, G]], w: 5 },
      { t: 'lever', from: [34, 51], ext: 5, plate: false, z: -1 }, { t: 'grip' }]) });
  X.neutral_pullup = () => ({ k: [
    { v: 'f', h: [100, 120], t: -90, L: [{ u: 88, f: 92 }, { u: 92, f: 88 }], A: [{ w: [112, 18], k: [1, 0.8] }, { w: [88, 18], k: [-1, 0.8] }] },
    { v: 'f', h: [100, 77], t: -90, L: [{ u: 88, f: 92 }, { u: 92, f: 88 }], A: [{ w: [112, 18], k: [1, 0.8] }, { w: [88, 18], k: [-1, 0.8] }] }],
    p: [{ t: 'bar', x1: 50, x2: 150, y: 4 }, { t: 'line', p: [[112, 4], [112, 16]], w: 3 }, { t: 'line', p: [[88, 4], [88, 16]], w: 3 },
      { t: 'bar', x: 112, y: 18 }, { t: 'bar', x: 88, y: 18 }] });
  X.trx_row = () => {
    const ank = [128, AY], anc = [170, -20], a = trxBody(ank, -125), b = trxBody(ank, -105);
    return { k: [
      { h: a.h, t: a.t, L: a.L, A: [{ w: toward(a.sh, anc), k: [-1, 0.3] }] },
      { h: b.h, t: b.t, L: b.L, A: [{ r: [12, 10], k: [-1, 0.3] }] }],
      p: [{ t: 'line', p: [[anc[0], anc[1] - 12], anc], w: 3 }, { t: 'cable', from: anc, h: 'n' }] };
  };
  X.prone_iyt = () => {
    const P = A => PRO({ t: -3, hd: -6, A });
    return { d: 0.8, k: [
      P([{ u: 1, f: 1 }]),
      P([{ u: -18, f: -18 }]),
      P([{ u: -20, s: 0.7, f: -20, s2: 0.7 }]),
      P([{ u: -90, s: 0.4, f: -90, s2: 0.4 }])], p: [{ t: 'mat', x1: 0, x2: 200 }] };
  };
  X.swimmer = () => ({ d: 0.4, hold: 0.05, k: [
    PRO({ t: -4, hd: -4, L: [{ u: 184, f: 184, ft: 270 }, { u: 194, f: 194, ft: 280 }], A: [{ u: -16, f: -16 }, { u: -2, f: -2 }] }),
    PRO({ t: -4, hd: -4, L: [{ u: 194, f: 194, ft: 280 }, { u: 184, f: 184, ft: 270 }], A: [{ u: -2, f: -2 }, { u: -16, f: -16 }] })],
    p: [{ t: 'mat', x1: 0, x2: 200 }] });
  X.ball_back_ext = () => {
    const L = [{ a: [36, 156], k: [0, 1], ft: 80 }];
    return { d: 1.1, k: [
      { h: [96, 108], t: 40, hd: 10, L, A: [{ r: [8, 14], k: [-0.5, 1] }] },
      { h: [96, 108], t: -28, L, A: [{ r: [8, 14], k: [0.3, 1] }] }],
      p: [{ t: 'ball', x: 96, y: 143, r: 26 }] };
  };
  X.smith_shrug = () => ({ k: [
    STF({ A: [{ u: 84, f: 86 }, { u: 96, f: 94 }] }),
    STF({ sl: 7, A: [{ u: 84, f: 86 }, { u: 96, f: 94 }] })],
    p: [{ t: 'rails', x1: 28, x2: 172, y1: 0 }, { t: 'bb', half: 62 }] });
  X.scap_pullup = () => {
    const legs = [{ u: 88, f: 92 }, { u: 92, f: 88 }], arms = [{ w: [126, -18], k: [1, 0.5] }, { w: [74, -18], k: [-1, 0.5] }];
    return { d: 0.8, k: [
      { v: 'f', h: [100, 90], t: -90, sl: 4, L: legs, A: arms },
      { v: 'f', h: [100, 79], t: -90, sl: -7, L: legs, A: arms }],
      p: [{ t: 'bar', x1: 40, x2: 160, y: -18 }] };
  };
  X.chest_supported_tbar = () => {
    const P = A => ({ h: [76, 116], t: -36, hd: -12, L: [{ a: [24, AY], k: [1, 0], ft: 0 }], A });
    return { k: [P([{ u: 90, f: 90 }]), P([{ r: [14, 30], k: [-0.4, -1] }])],
      p: [{ t: 'backpad', side: 1, off: 13, ext1: 8 }, { t: 'line', p: [[80, 136], [80, G]], w: 4 }, { t: 'lever', from: [46, 168], ext: 16, pr: 12 }] };
  };

  /* ================= Плечи ================= */
  X.rear_delt_row = () => {
    const P = A => ({ h: [72, 92], t: -16, hd: -10, L: [{ a: [104, AY] }], A });
    return { k: [P([{ u: 90, f: 90 }]), P([{ u: 100, s: 0.3, f: 90 }])], p: [{ t: 'db', h: 'n', end: true }] };
  };
  X.cuban_press = () => ({ d: 0.8, k: [
    STF({ A: [{ u: 84, f: 86 }, { u: 96, f: 94 }] }),
    STF({ A: [{ u: 6, f: 90 }, { u: 174, f: 90 }] }),
    STF({ A: [{ u: 6, f: 90, s2: -1 }, { u: 174, f: 90, s2: -1 }] }),
    STF({ A: [{ u: -78, f: 96, s2: -1 }, { u: -102, f: 84, s2: -1 }] })],
    p: [{ t: 'db', h: 'b', bar: true, o: 0 }] });
  X.lying_lateral_raise = () => {
    const P = a => ({ v: 'f', h: [118, 120], t: 180, L: [{ u: -2, f: 3 }, { u: 3, f: 6 }], A: [a, { u: 180, f: -90 }] });
    return { k: [P({ u: 12, f: 10 }), P({ u: -84, f: -80 })],
      p: [{ t: 'bench', x: 26, y: 146, w: 178 }, { t: 'db', h: 'n' }] };
  };
  X.lean_away_lateral = () => {
    const P = a => ({ v: 'f', h: [94, 88], t: -104, L: [{ a: [120, AY], k: [1, -0.3] }, { a: [104, AY], k: [-1, -0.3] }], A: [{ w: [148, 56], k: [1, 1] }, a] });
    return { k: [P({ u: 93, f: 91 }), P({ u: 170, f: 172 })],
      p: [{ t: 'line', p: [[153, 0], [153, G]], w: 5 }, { t: 'db', h: 'f' }] };
  };
  X.db_press_neutral = () => ({ k: [
    SIT({ t: -90, A: [{ w: [117, 83], k: [0.3, 1] }] }),
    SIT({ t: -90, A: [{ w: [102, 24], k: [1, 0] }] })],
    p: seatPads(true).concat([{ t: 'db', h: 'n' }]) });
  X.single_arm_db_press = () => {
    const far = { w: [84, 84], k: [-1, 0] };
    return { k: [STF({ A: [{ u: 28, f: -88 }, far] }), STF({ A: [{ u: -78, f: -84 }, far] })],
      p: [{ t: 'db', h: 'n', bar: true, o: 0 }] };
  };
  X.z_press = () => {
    const P = a => ({ h: [70, 158], t: -90, L: [{ u: 0, f: 0, ft: -80 }], A: [a] });
    return { k: [P({ w: [93, 109], k: [0.3, 1] }), P({ w: [74, 56], k: [1, 0] })],
      p: [{ t: 'mat', x1: 40, x2: 176 }, { t: 'bb', r: 12 }] };
  };
  X.band_face_pull = () => ({ k: [
    ST({ L: [{ a: [104, AY] }], A: [{ u: -6, f: -6 }] }),
    ST({ L: [{ a: [104, AY] }], A: [{ r: [12, -12], k: [-1, -0.3] }] })],
    p: [{ t: 'line', p: [[190, 0], [190, G]], w: 5 }, { t: 'band', from: [186, 28] }] });
  X.bb_front_raise = () => ({ k: [ST({ A: [{ u: 86, f: 84 }] }), ST({ A: [{ u: -4, f: -6 }] })], p: [{ t: 'bb', r: 13 }] });
  X.seated_rear_delt_fly = () => {
    const P = A => ({ h: [84, 128], t: -30, hd: -14, L: [{ a: [146, AY], k: [0, -1] }], A });
    return { k: [P([{ u: 92, f: 92 }]), P([{ u: 84, s: 0.22, f: 78, s2: 0.22 }])],
      p: [{ t: 'pad', x: 62, y: 134, w: 42, h: 8 }, { t: 'line', p: [[84, 142], [84, G]], w: 4 }, { t: 'db', h: 'n', end: true }] };
  };
  X.trx_y_raise = () => {
    const ank = [128, AY], anc = [160, -36], a = trxBody(ank, -125), b = trxBody(ank, -100);
    return { k: [
      { h: a.h, t: a.t, L: a.L, A: [{ w: toward(a.sh, anc), k: [-1, 0.3] }] },
      { h: b.h, t: b.t, L: b.L, A: [{ w: toward(b.sh, anc), k: [-1, 0.3] }] }],
      p: [{ t: 'line', p: [[anc[0], anc[1] - 12], anc], w: 3 }, { t: 'cable', from: anc, h: 'n' }] };
  };
})();

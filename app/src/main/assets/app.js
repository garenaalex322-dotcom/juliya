(function () {
'use strict';

/* ================= Утилиты ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const f0 = n => nf0.format(Math.round(n || 0));
const f1 = n => nf1.format(Math.round((n || 0) * 10) / 10);
const sgn = n => (n > 0.04 ? '+' : n < -0.04 ? '−' : '') + f1(Math.abs(n));
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const toNum = v => { const s = String(v ?? '').replace(',', '.').trim(); return s === '' ? NaN : Number(s); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const plural = (n, one, few, many) => { const a = Math.abs(Math.round(n)) % 100, b = a % 10; if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many; };

/* ================= Даты ================= */
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dkey(new Date());
const pk = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = pk(k); d.setDate(d.getDate() + n); return dkey(d); };
const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WDS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WDF = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const fmtD = k => { const d = pk(k); return `${d.getDate()} ${MON[d.getMonth()]}`; };
const fmtDM = k => { const d = pk(k); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`; };
const fmtS = k => `${WDS[pk(k).getDay()]} ${fmtDM(k)}`;
const relD = k => { const t = todayKey(); if (k === t) return 'Сегодня'; if (k === addDays(t, -1)) return 'Вчера'; return fmtD(k); };
const weekStart = k => { const d = pk(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dkey(d); };

/* ================= Иконки ================= */
const sv = (p, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  plate: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>'),
  dumbbell: sv('<path d="M2.5 10v4M5.5 7.5v9M18.5 7.5v9M21.5 10v4M5.5 12h13"/>'),
  chart: sv('<path d="M4 19.5h16"/><path d="M5 15l4.5-5 4 3.5L19 6.5"/>'),
  book: sv('<path d="M4.5 19.5V5.5a2 2 0 0 1 2-2h13v13.5h-13a2 2 0 0 0-2 2.5z"/><path d="M9 8h6.5M9 11.5h4"/>'),
  user: sv('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.2-3.8 4-5.7 7.5-5.7s6.3 1.9 7.5 5.7"/>'),
  left: sv('<path d="M14.5 6l-6 6 6 6"/>', 20), right: sv('<path d="M9.5 6l6 6-6 6"/>', 20),
  x: sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 18), plus: sv('<path d="M12 5.5v13M5.5 12h13"/>', 18),
  up: sv('<path d="M6.5 14.5L12 9l5.5 5.5"/>', 18), down: sv('<path d="M6.5 9.5L12 15l5.5-5.5"/>', 18),
  check: sv('<path d="M5.5 12.5l4.2 4.2 8.8-9.4"/>', 20), minus: sv('<path d="M5.5 12h13"/>', 18),
  barcode: sv('<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8 8.5v7M11 8.5v7M13.5 8.5v7M16 8.5v7"/>', 18),
  edit: sv('<path d="M5 19l1-4.2L15.6 5.2a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L9.2 18 5 19z"/><path d="M13.8 7l3.2 3.2"/>', 16), chev: sv('<path d="M9.5 6l6 6-6 6"/>', 18),
  pause: sv('<path d="M9 6v12M15 6v12"/>', 18), resume: sv('<path d="M8 5.5l11 6.5-11 6.5z"/>', 18),
  play: sv('<path d="M10 4.5h5.5M12.75 4.5v2.2"/><circle cx="12.75" cy="13.5" r="6.8"/><path d="M12.75 10v3.5l2.3 1.6"/>', 18)
};
function glassSvg(fr) {
  // fr — доля наполнения стакана от 0 до 1
  let lvl = '';
  if (fr > 0 && fr < 1) { const y = 35.5 - Math.max(0.12, fr) * 32.5, xl = 4 + (y - 3) * 0.086, xr = 26 - (y - 3) * 0.086; lvl = `<path d="M${xl.toFixed(2)} ${y.toFixed(2)}H${xr.toFixed(2)}L23.4 33.2a2.5 2.5 0 0 1-2.5 2.3H9.1a2.5 2.5 0 0 1-2.5-2.3z" fill="currentColor" fill-opacity=".55"/>`; }
  return `<svg viewBox="0 0 30 38" width="26" height="34" aria-hidden="true">${lvl}<path d="M4 3h22l-2.6 30.2a2.5 2.5 0 0 1-2.5 2.3H9.1a2.5 2.5 0 0 1-2.5-2.3z" fill="${fr >= 1 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

/* ================= Мост к Android ================= */
const NB = window.AndroidBridge || null;
const nb = (m, ...a) => { try { return NB && typeof NB[m] === 'function' ? NB[m](...a) : undefined; } catch (e) { return undefined; } };

/* ================= Хранение ================= */
const KEY = 'tarelka-shtanga-v1';
let storageOk = true;
try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch (e) { storageOk = false; }
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const lsJson = k => { try { return JSON.parse(lsGet(k) || 'null'); } catch (e) { return null; } };
let MODE = lsGet('tarelka-mode') === 'coach' ? 'coach' : 'client';
const CO = { user: null, authChecked: false, ready: false, clients: [], cur: null, unsub: null, err: '', info: '', busy: false, confirm: null, autoOpened: false };
function storeKey() { return MODE === 'coach' && CO.cur ? KEY + '-c-' + CO.cur : KEY; }
function loadState() { if (MODE === 'coach' && !CO.cur) return null; return lsJson(storeKey()); }
function save(full) { if (S.demo) return; if (Sync.cid) Sync.touch(full); storageOk = lsSet(storeKey(), JSON.stringify(S)); }

/* ================= Справочники ================= */
const MEALS = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];
const ACTS = [['1.2', 'Мало движения, без тренировок'], ['1.375', 'Тренировки 1–3 раза в неделю'], ['1.55', 'Тренировки 3–5 раз в неделю'], ['1.725', 'Почти каждый день или физический труд']];
const GOALS = [['lose', 'Снизить вес'], ['keep', 'Поддерживать вес'], ['gain', 'Набрать мышцы']];
const MEAS = [['waist', 'Талия'], ['hips', 'Бёдра'], ['chest', 'Грудь'], ['thigh', 'Бедро'], ['arm', 'Рука (бицепс)']];
const PERIODS = [[7, 'Неделя'], [30, 'Месяц'], [91, '3 месяца'], [365, 'Год']];
const EXM = new Map(EXERCISES.map(e => [e.id, e]));
const GROUP = Object.fromEntries(EX_GROUPS);
const NET_MET = 3.5;          // ккал на кг в час сверх обмена для силовой тренировки
const STEP_K = 0.0005;        // ккал на кг на шаг
const BASE_K = 1.15;          // обмен + переваривание еды и быт

const exInfo = id => (id && (EXM.get(id) || (S.customEx || []).find(e => e.id === id))) || null;
const exIdByName = name => { const n = normTxt(name).trim(); const e = EXERCISES.find(x => normTxt(x.n) === n); return e ? e.id : null; };
const kindOf = id => (exInfo(id) && exInfo(id).kind) || 'w';
function schemeText(pe) {
  const k = kindOf(pe.exId), r = String(pe.reps || '').trim().replace(/\s*(сек|мин)\.?$/, '');
  if (k === 'c') return (r || '20') + ' мин';
  if (k === 't') return `${pe.sets} × ${r || '30'} сек`;
  return `${pe.sets} × ${r || '10–12'}`;
}

/* ================= Модель ================= */
function progFromTemplate(t) {
  return { title: t.title, note: t.s, days: t.days.map(([name, list]) => ({ id: uid(), name,
    ex: list.map(([id, sets, reps]) => ({ id: uid(), exId: id, name: EXM.get(id).n, sets, reps })) })) };
}
function blankProfile() { return { name: '', sex: 'f', age: '', height: '', weight: '', act: '1.375', goal: 'lose', manual: false, mk: '', mp: '', mf: '', mc: '', water: '', stepGoal: '8000', rest: '90' }; }
function blankState() {
  return { v: 2, demo: false, profile: blankProfile(), days: {}, weights: [], measures: [], program: progFromTemplate(PROGRAM_TEMPLATES[0]),
    workouts: [], session: null, custom: [], recent: [], customEx: [], notes: {} };
}
function entryFrom(food, grams, meal) { return { id: uid(), meal, name: food.name, key: food.id, grams: Math.round(grams), k100: food.kcal, p100: food.p, f100: food.f, c100: food.c }; }
function itemVals(it) {
  if (it.manual) return { kcal: +it.kcal || 0, p: +it.p || 0, f: +it.f || 0, c: +it.c || 0 };
  const m = (+it.grams || 0) / 100; return { kcal: it.k100 * m, p: it.p100 * m, f: it.f100 * m, c: it.c100 * m };
}
function dayTotals(d) { const t = { kcal: 0, p: 0, f: 0, c: 0 }; (d && d.items || []).forEach(it => { const v = itemVals(it); t.kcal += v.kcal; t.p += v.p; t.f += v.f; t.c += v.c; }); return t; }
function getDay(k, create) { if (S.days[k]) return S.days[k]; const d = { items: [], water: 0 }; if (create) S.days[k] = d; return d; }

function convProgEx(e) {
  if (e && e.sets != null && e.reps != null) return Object.assign({ id: uid() }, e);
  const m = String(e && e.scheme || '').match(/^\s*(\d+)\s*[×xх*]\s*(.+)$/i);
  return { id: (e && e.id) || uid(), exId: (e && e.exId) || exIdByName(e && e.name || ''), name: (e && e.name) || '', sets: m ? +m[1] : 3, reps: m ? m[2].trim() : String(e && e.scheme || '') };
}
function migrate(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.demo) return null;
  const out = Object.assign(blankState(), s);
  delete out.ai; // ключ распознавания еды из старых версий больше не нужен
  out.profile = Object.assign(blankProfile(), s.profile || {});
  if (!s.v || s.v < 2) {
    if (s.program && Array.isArray(s.program.days)) {
      if (s.program.title === 'Стартовая программа, 3 раза в неделю') out.program = progFromTemplate(PROGRAM_TEMPLATES[0]);
      else out.program = { title: s.program.title || 'Моя программа', note: s.program.note || '', days: s.program.days.map(d => ({ id: d.id || uid(), name: d.name || 'День', ex: (d.ex || []).map(convProgEx) })) };
    }
    out.workouts = (s.workouts || []).map(w => ({ id: w.id || uid(), date: w.date, dayId: w.dayId, dayName: w.dayName || 'Тренировка', note: w.note || '', minutes: 60,
      ex: (w.rows || []).filter(r => r.done).map(r => ({ exId: exIdByName(r.name), name: r.name, target: '', sets: [{ w: r.w || '', r: '', done: true }] })) }));
    out.session = null;
    out.v = 2;
  }
  ['weights', 'measures', 'workouts', 'custom', 'recent', 'customEx'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  if (!out.days || typeof out.days !== 'object') out.days = {};
  if (!out.notes || typeof out.notes !== 'object' || Array.isArray(out.notes)) out.notes = {};
  if (!out.program || !Array.isArray(out.program.days)) out.program = progFromTemplate(PROGRAM_TEMPLATES[0]);
  out.weights.sort((a, b) => a.date.localeCompare(b.date));
  out.measures.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

function demoState() {
  const s = blankState(); s.demo = true;
  Object.assign(s.profile, { name: 'Анна', age: '40', height: '165', weight: '67.2' });
  const t = todayKey();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const menus = [
    [['Завтрак', 'Овсянка на молоке', 250], ['Завтрак', 'Банан', 120], ['Завтрак', 'Кофе с молоком', 250], ['Обед', 'Борщ', 300], ['Обед', 'Хлеб чёрный', 30], ['Обед', 'Гречка варёная', 150], ['Обед', 'Котлета куриная', 80], ['Перекус', 'Греческий йогурт', 150], ['Ужин', 'Творог 5%', 150], ['Ужин', 'Ягоды', 100]],
    [['Завтрак', 'Яйцо', 110], ['Завтрак', 'Хлеб цельнозерновой', 35], ['Завтрак', 'Сыр твёрдый', 20], ['Завтрак', 'Чай', 250], ['Обед', 'Суп куриный с лапшой', 300], ['Обед', 'Рис варёный', 150], ['Обед', 'Куриная грудка', 120], ['Обед', 'Огурец', 100], ['Перекус', 'Яблоко', 180], ['Ужин', 'Лосось, сёмга, форель', 150], ['Ужин', 'Брокколи', 150]],
    [['Завтрак', 'Сырники', 150], ['Завтрак', 'Сметана 15%', 20], ['Завтрак', 'Кофе с молоком', 250], ['Обед', 'Плов', 250], ['Обед', 'Салат из овощей с маслом', 150], ['Перекус', 'Орехи', 30], ['Ужин', 'Омлет', 150], ['Ужин', 'Помидор', 120]],
    [['Завтрак', 'Гречка варёная', 150], ['Завтрак', 'Яйцо', 55], ['Завтрак', 'Кофе чёрный', 200], ['Обед', 'Щи', 300], ['Обед', 'Индейка', 150], ['Обед', 'Картофельное пюре', 150], ['Перекус', 'Кефир 2,5%', 250], ['Перекус', 'Печенье', 24], ['Ужин', 'Рыба белая (треска, минтай)', 150], ['Ужин', 'Овощи тушёные', 200]]
  ];
  for (let i = 27; i >= 0; i--) {
    const k = addDays(t, -i), d = { items: [], water: 0 };
    let menu = menus[i % menus.length];
    if (i === 0) menu = menus[0].filter(x => x[0] !== 'Ужин');
    menu.forEach(([meal, name, g]) => { const f = foodByName(name); if (f) d.items.push(entryFrom(f, g, meal)); });
    d.water = i === 0 ? 1250 : 1250 + Math.round(rnd() * 4) * 250;
    d.steps = i === 0 ? 5640 : Math.round(5200 + rnd() * 5200);
    s.days[k] = d;
  }
  const wk = [[-42, 69.4], [-35, 69.0], [-28, 68.7], [-21, 68.4], [-14, 68.1], [-10, 67.9], [-7, 67.7], [-3, 67.4], [-1, 67.2]];
  s.weights = wk.map(([d, kg]) => ({ date: addDays(t, d), kg }));
  s.measures = [{ date: addDays(t, -42), waist: 85, hips: 104, chest: 96, thigh: 59.5, arm: 29.5 }, { date: addDays(t, -21), waist: 83.5, hips: 103, chest: 95, thigh: 59, arm: 29 }, { date: addDays(t, -1), waist: 82, hips: 102, chest: 94.5, thigh: 58, arm: 28.5 }];
  const base = { goblet_squat: 8, lat_pulldown: 20, db_press_incline: 6, rdl: 10, leg_press: 40, db_row: 6, db_shoulder_press: 4, step_up: 4, seated_row: 20, abduction: 25 };
  const reps = { glute_bridge: '15', plank: '30', dead_bug: '8', pushup_bench: '10', side_plank: '20' };
  const plan = [[-19, 0], [-17, 1], [-15, 2], [-12, 0], [-10, 1], [-8, 2], [-5, 0], [-3, 1], [-1, 2]];
  plan.forEach(([d, di], n) => {
    const day = s.program.days[di], lvl = Math.floor(n / 3);
    s.workouts.push({ id: uid(), date: addDays(t, d), dayId: day.id, dayName: day.name, note: '', minutes: 55 + (n % 3) * 5,
      ex: day.ex.map(pe => {
        const w = base[pe.exId] != null ? String(base[pe.exId] + lvl * (pe.exId === 'leg_press' || pe.exId === 'lat_pulldown' || pe.exId === 'seated_row' || pe.exId === 'abduction' ? 2.5 : 1)) : '';
        const r = reps[pe.exId] ? String(+reps[pe.exId] + lvl * (pe.exId.includes('plank') ? 5 : 1)) : (n % 2 ? '12' : '10');
        return { exId: pe.exId, name: pe.name, target: schemeText(pe), sets: [0, 1, 2].map(j => ({ w, r: j === 2 && !reps[pe.exId] ? '10' : r, done: true })) };
      }) });
  });
  return s;
}

let S = migrate(loadState()) || demoState();
customProvider = () => S.custom;

const ui = { tab: 'today', date: todayKey(), sheet: null, meal: 'Обед', text: '', q: '', over: {}, hidden: new Set(), extra: [], manual: [], manualFor: null, pv: [], unk: [],
  editId: null, editMeal: null, confirm: null, editProg: false, progCode: '', report: '', repDays: 7, repDetail: false, backup: '', undo: null,
  pendingImport: null, pendingRestore: null, per: 30, meas: 'waist', exSel: null, kbTab: 'ex', kbQ: '', kbG: '', kbE: '', exId: null, exFrom: null, artId: null,
  pickFor: null, pickQ: '', pickG: '', pickE: '', pickNew: false, woId: null, tplId: null, finishMin: '' };

function mutate(fn) {
  if (S.demo) { const keep = S.program; S = blankState(); S.program = keep; ui.date = todayKey(); toast('Пример очищен. Теперь это ваш дневник.'); }
  fn(); save();
}

/* ================= Нормы и расход ================= */
function bmrOf(w) { const p = S.profile, a = toNum(p.age), h = toNum(p.height); if (!(a > 0 && h > 0 && w > 0)) return null; return 10 * w + 6.25 * h - 5 * a + (p.sex === 'm' ? 5 : -161); }
function autoTargets(p) {
  const w = toNum(p.weight), bmr = bmrOf(w);
  if (!bmr) return null;
  const tdee = bmr * (toNum(p.act) || 1.375), mult = p.goal === 'lose' ? 0.85 : p.goal === 'gain' ? 1.1 : 1;
  let kcal = Math.round(tdee * mult / 10) * 10;
  const floor = p.sex === 'm' ? 1500 : 1200, floored = kcal < floor; kcal = Math.max(kcal, floor);
  const pr = Math.round(w * (p.goal === 'gain' ? 1.8 : 1.6)), fa = Math.round(Math.max(w * 0.9, kcal * 0.25 / 9));
  const ca = Math.max(0, Math.round((kcal - pr * 4 - fa * 9) / 4));
  return { kcal, p: pr, f: fa, c: ca, bmr: Math.round(bmr), tdee: Math.round(tdee), floored };
}
function targets() {
  const p = S.profile;
  if (p.manual && toNum(p.mk) > 0) {
    const kcal = toNum(p.mk), w = toNum(p.weight);
    const pr = toNum(p.mp) > 0 ? toNum(p.mp) : (w > 0 ? Math.round(w * 1.6) : Math.round(kcal * 0.3 / 4));
    const fa = toNum(p.mf) > 0 ? toNum(p.mf) : Math.round(kcal * 0.3 / 9);
    const ca = toNum(p.mc) > 0 ? toNum(p.mc) : Math.max(0, Math.round((kcal - pr * 4 - fa * 9) / 4));
    return { kcal, p: pr, f: fa, c: ca, manual: true };
  }
  return autoTargets(p);
}
function waterTarget() { const v = toNum(S.profile.water); if (v > 0) return v; const w = toNum(S.profile.weight); if (w > 0) return Math.min(3000, Math.max(1500, Math.round(w * 30 / 250) * 250)); return 2000; }
const GLASSES = [150, 200, 250, 300, 330, 400, 500];
const glassMl = () => { const v = toNum(S.profile.glass); return v >= 50 && v <= 1000 ? Math.round(v) : 250; };
const stepGoal = () => toNum(S.profile.stepGoal) > 0 ? toNum(S.profile.stepGoal) : 8000;
const restSec = () => toNum(S.profile.rest) > 0 ? toNum(S.profile.rest) : 90;
function weightOn(k) { let w = null; for (const x of S.weights) { if (x.date <= k) w = x.kg; else break; } return w || toNum(S.profile.weight) || null; }

let nativeSteps = {};
let stepsStatus = NB ? 'none' : 'web';
function refreshSteps() {
  if (!NB) return;
  try { nativeSteps = JSON.parse(nb('stepsJson') || '{}') || {}; } catch (e) { nativeSteps = {}; }
  stepsStatus = nb('stepsStatus') || 'none';
}
function stepsFor(k) {
  const d = S.days[k];
  if (d && d.steps != null && d.steps !== '') return { n: +d.steps || 0, src: 'manual' };
  if (MODE !== 'coach' && nativeSteps[k] != null) return { n: +nativeSteps[k] || 0, src: 'phone' };
  if (d && d.ps != null) return { n: +d.ps || 0, src: 'phone' };
  return { n: 0, src: null };
}
function syncPhoneSteps() {
  if (MODE === 'coach' || S.demo || !NB) return;
  const from = addDays(todayKey(), -7); let ch = false;
  for (const k in nativeSteps) {
    const n = +nativeSteps[k] || 0; if (k < from || !n) continue;
    const d = S.days[k];
    if (!d) { S.days[k] = { items: [], water: 0, ps: n }; Sync.touchDays.push(k); ch = true; }
    else if (d.ps == null || Math.abs(d.ps - n) >= 50) { d.ps = n; Sync.touchDays.push(k); ch = true; }
  }
  if (ch) save();
}
const woKcal = (wo, w) => NET_MET * w * (wo.minutes || 60) / 60;
function burnFor(k) {
  const w = weightOn(k), bmr = bmrOf(w);
  if (!bmr) return null;
  const st = stepsFor(k), base = bmr * BASE_K, steps = st.n * STEP_K * w;
  const workout = S.workouts.filter(x => x.date === k).reduce((s, x) => s + woKcal(x, w), 0);
  return { base, steps, workout, total: base + steps + workout, n: st.n };
}

/* ================= Тост и копирование ================= */
let toastT;
function toast(msg, action) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" data-a="${action.a}">${esc(action.label)}</button>` : ''}`;
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, action ? 6000 : 2800);
}
async function copyText(text, ta) {
  if (NB) { try { NB.copy(text); toast('Скопировано'); return; } catch (e) { /* дальше обычным способом */ } }
  try { await navigator.clipboard.writeText(text); toast('Скопировано'); }
  catch (e) { if (ta) { ta.focus(); ta.select(); } toast('Текст выделен — скопируйте его вручную'); }
}

/* ================= Общие элементы ================= */
function demoBanner() {
  if (MODE === 'coach') return coachBar();
  if (S.demo) return `<div class="banner"><p>Это пример заполненного дневника, чтобы было видно, как всё работает. Ваши записи начнутся с чистого листа.</p><div class="row"><button class="btn btn-primary btn-sm" data-a="startFresh">Начать свой дневник</button><button class="btn btn-ghost btn-sm" data-a="tab" data-tab="profile">У меня есть код тренера</button></div></div>`;
  if (!S.link && window.firebase && ui.tab === 'today' && !lsGet('tarelka-hide-link')) return `<div class="banner"><p>Есть код от тренера? Подключитесь, и тренер будет видеть ваш дневник.</p><div class="row"><button class="btn btn-primary btn-sm" data-a="tab" data-tab="profile">Ввести код</button><button class="btn-link" data-a="hideLink">Позже</button></div></div>`;
  if (S.link && Sync.status === 'lost' && ui.tab === 'today') return `<div class="banner plain"><p>${esc(syncText())}</p><button class="btn btn-ghost btn-sm" data-a="tab" data-tab="profile">Открыть «Профиль»</button></div>`;
  if (!storageOk) return `<div class="banner plain"><p>Записи сейчас не сохраняются: память приложения недоступна. Сделайте резервную копию в «Профиле».</p></div>`;
  return '';
}
function tabsHtml() {
  const T = [['today', 'Сегодня', IC.plate], ['train', 'Тренировки', IC.dumbbell], ['progress', 'Прогресс', IC.chart], ['kb', 'База знаний', IC.book], ['profile', 'Профиль', IC.user]];
  return T.map(([id, l, ic]) => `<button class="tab" data-a="tab" data-tab="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></button>`).join('');
}
const segm = (act, cur, list, label) => `<div class="segm" role="group" aria-label="${esc(label)}">${list.map(([v, l]) => `<button data-a="${act}" data-v="${esc(v)}" aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join('')}</div>`;

/* ================= СЕГОДНЯ ================= */
function plateSvg(tot, tg) {
  const R = 80, C = 2 * Math.PI * R;
  const frac = tg ? Math.min(1, tot.kcal / tg.kcal) : (tot.kcal > 0 ? 1 : 0);
  const parts = [['p', tot.p * 4], ['f', tot.f * 9], ['c', tot.c * 4]];
  const sum = parts.reduce((s, x) => s + x[1], 0) || 1;
  const fill = frac * C; let off = 0, segs = '';
  for (const [k, v] of parts) {
    const len = fill * v / sum; if (len < 0.6) continue; const L = len > 4 ? len - 2 : len;
    segs += `<circle class="seg seg-${k}" cx="100" cy="100" r="${R}" stroke-dasharray="${L.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`; off += len;
  }
  let big, small, over = false;
  if (tg) { const rem = tg.kcal - tot.kcal; if (rem >= 0) { big = f0(rem); small = 'осталось ккал'; } else { big = '+' + f0(-rem); small = 'сверх нормы'; over = true; } }
  else { big = f0(tot.kcal); small = 'ккал за день'; }
  const label = tg ? `Съедено ${f0(tot.kcal)} из ${f0(tg.kcal)} ккал` : `Съедено ${f0(tot.kcal)} ккал`;
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${label}"><circle class="rim" cx="100" cy="100" r="${R}"/><circle class="plate-in" cx="100" cy="100" r="64"/><g transform="rotate(-90 100 100)">${segs}</g><text class="ring-big${over ? ' over' : ''}" x="100" y="104" text-anchor="middle">${big}</text><text class="ring-small" x="100" y="126" text-anchor="middle">${small}</text></svg>`;
}
function macroRow(label, val, goal, cls) {
  const pct = goal ? Math.min(100, val / goal * 100) : 0;
  return `<div class="mrow"><div class="mtop"><span><i class="dot" style="background:var(--${cls})"></i>${label}</span><span class="num"><b>${f0(val)}</b>${goal ? ` / ${f0(goal)}` : ''} г</span></div><div class="bar"><i style="width:${pct}%;background:var(--${cls})"></i></div></div>`;
}
function activityCard() {
  const k = ui.date, st = stepsFor(k), goal = stepGoal(), b = burnFor(k), eaten = dayTotals(S.days[k]).kcal;
  const pct = Math.min(100, st.n / goal * 100);
  const isToday = k === todayKey();
  let ctrl = '';
  if (!S.demo && MODE !== 'coach' && isToday && st.src !== 'manual') {
    if (stepsStatus === 'need') ctrl = `<div class="banner"><p>Разрешите приложению доступ к датчику шагов — тогда шаги будут считаться сами.</p><button class="btn btn-primary btn-sm" data-a="stepsAllow">Разрешить</button></div>`;
    else if (stepsStatus === 'denied') ctrl = `<div class="banner plain"><p>Доступ к шагам запрещён. Включите «Физическая активность» в настройках приложения или вводите шаги вручную.</p><button class="btn btn-ghost btn-sm" data-a="stepsSettings">Открыть настройки</button></div>`;
  }
  const src = st.src === 'manual' ? 'введено вручную' : st.src === 'phone' ? 'считает телефон' : (MODE !== 'coach' && stepsStatus === 'ok' && isToday ? 'считает телефон' : '');
  const woToday = S.workouts.filter(x => x.date === k);
  let burnHtml;
  if (b) {
    const diff = eaten - b.total;
    let pill = '';
    if (eaten > 0) {
      if (diff <= -50) pill = `<span class="pill ${S.profile.goal === 'gain' ? 'warn' : 'good'}">Дефицит ${f0(-diff)} ккал</span>`;
      else if (diff >= 50) pill = `<span class="pill ${S.profile.goal === 'lose' ? 'warn' : 'good'}">Профицит ${f0(diff)} ккал</span>`;
      else pill = `<span class="pill">Баланс около нуля</span>`;
    }
    burnHtml = `<div class="burn"><div><b>${f0(b.base)}</b><span>обмен и быт</span></div><div><b>${f0(b.steps)}</b><span>шаги</span></div><div><b>${f0(b.workout)}</b><span>тренировка</span></div></div>
      <div class="balance"><span>Расход за день ≈ <b class="num">${f0(b.total)}</b> ккал</span>${pill}</div>`;
  } else burnHtml = `<p class="hint">Укажите возраст, рост и вес в профиле, чтобы считать расход калорий.</p>`;
  return `<section class="card" id="actCard"><div class="sec-head"><h2>Активность</h2><span class="muted small">${src}</span></div>
    <div class="act-top"><div><span class="big-num">${f0(st.n)}</span> <span class="muted">${plural(st.n, 'шаг', 'шага', 'шагов')}</span></div><button class="btn-link" data-a="openSteps">${st.src === 'manual' ? 'Изменить' : 'Ввести вручную'}</button></div>
    <div class="bar"><i style="width:${pct}%;background:var(--carb)"></i></div>
    <p class="small muted num">Цель ${f0(goal)} шагов${woToday.length ? ` · тренировка: ${woToday.map(w => esc(w.dayName) + ', ' + f0(w.minutes) + ' мин').join('; ')}` : ''}</p>
    ${ctrl}${burnHtml}</section>`;
}
function renderToday() {
  const k = ui.date, t = todayKey(), day = getDay(k), tot = dayTotals(day), tg = targets(), d = pk(k);
  const wt = waterTarget(), water = day.water || 0, gl = glassMl(), filled = Math.floor(water / gl), part = (water - filled * gl) / gl;
  const n = Math.min(16, Math.max(Math.ceil(wt / gl), filled + 1));
  let glasses = ''; for (let i = 0; i < n; i++) { const fr = i < filled ? 1 : i === filled ? part : 0; glasses += `<button class="glass${fr >= 1 ? ' on' : fr > 0 ? ' part' : ''}" data-a="water" data-i="${i}" aria-label="${(i + 1) * gl} мл">${glassSvg(fr)}</button>`; }
  const meals = MEALS.map(m => {
    const its = day.items.filter(x => x.meal === m), mk = its.reduce((s, x) => s + itemVals(x).kcal, 0);
    return `<section class="meal"><div class="meal-hd"><h3>${m}</h3>${its.length ? `<span class="meal-kcal">${f0(mk)} ккал</span>` : ''}<button class="add-mini" data-a="openAdd" data-meal="${m}" aria-label="Добавить: ${m.toLowerCase()}">${IC.plus}</button></div>
    ${its.length ? its.map(x => { const v = itemVals(x); return `<button class="item" data-a="openEdit" data-id="${x.id}"><span class="item-name">${esc(x.name)}<small>${x.manual ? 'введено вручную' : f0(x.grams) + ' г'} · Б ${f0(v.p)} · Ж ${f0(v.f)} · У ${f0(v.c)}</small></span><span class="item-kcal">${f0(v.kcal)}</span></button>`; }).join('') : `<p class="empty">Пока пусто</p>`}</section>`;
  }).join('');
  return `<header class="hd"><button class="icon-btn" data-a="dayPrev" aria-label="Предыдущий день">${IC.left}</button>
    <div class="hd-date"><span class="eyebrow">${WDF[d.getDay()]}</span><strong>${relD(k)}</strong></div>
    <button class="icon-btn" data-a="dayNext" aria-label="Следующий день" ${k >= t ? 'disabled' : ''}>${IC.right}</button></header>
  ${demoBanner()}
  ${tg ? '' : `<div class="banner"><p>Укажите возраст, рост и вес, чтобы рассчитать дневную норму.</p><button class="btn btn-ghost btn-sm" data-a="tab" data-tab="profile">Указать</button></div>`}
  ${notesBanner()}${noteCard()}
  <section class="card"><div class="plate">${plateSvg(tot, tg)}<div class="macros">
    ${macroRow('Белки', tot.p, tg && tg.p, 'prot')}${macroRow('Жиры', tot.f, tg && tg.f, 'fat')}${macroRow('Углеводы', tot.c, tg && tg.c, 'carb')}
  </div></div><p class="eaten-line">Съедено <b class="num">${f0(tot.kcal)}</b>${tg ? ` из <span class="num">${f0(tg.kcal)}</span>` : ''} ккал</p></section>
  ${activityCard()}
  <section class="card"><div class="sec-head"><h2>Вода</h2><span class="muted num">${f1(water / 1000)} из ${f1(wt / 1000)} л</span></div><div class="glasses">${glasses}</div>
    <div class="water-ctl"><button class="chip glass-chip" data-a="openWater" data-f="glass" aria-label="Размер стакана: ${gl} мл. Изменить">Стакан ${gl} мл</button><span class="grow"></span>
      <button class="icon-btn" data-a="waterUndo" aria-label="Убрать последнее добавление воды" ${water > 0 ? '' : 'disabled'}>${IC.minus}</button><button class="btn btn-ghost btn-sm" data-a="openWater" data-f="add">+ ещё</button></div></section>
  <button class="btn btn-primary btn-block add-main" data-a="openAdd">${IC.plus} Добавить еду</button>
  ${meals}`;
}
function updateActivityCard() { const el = $('#actCard'); if (el && ui.tab === 'today') el.outerHTML = activityCard(); }

/* ---------- Добавление еды ---------- */
function previewData() {
  const parsed = parseText(ui.text), items = [], cnt = {};
  parsed.items.forEach(it => {
    const base = 't|' + it.src + '|' + it.food.id; cnt[base] = (cnt[base] || 0) + 1; const key = base + '|' + cnt[base];
    if (ui.hidden.has(key)) return; const g = ui.over[key];
    items.push({ key, food: it.food, grams: g != null ? g : it.grams, def: it.def && g == null });
  });
  ui.extra.forEach(x => items.push({ key: x.key, food: x.food, grams: ui.over[x.key] != null ? ui.over[x.key] : x.grams }));
  ui.manual.forEach(m => items.push({ key: m.key, manual: m }));
  return { items, unknown: parsed.unknown.filter(u => !ui.hidden.has('u|' + u)) };
}
const pvKcal = x => x.manual ? (+x.manual.kcal || 0) : (x.food.kcal * (+x.grams || 0) / 100);
function renderPreview() {
  const box = $('#pv'); if (!box) return;
  const { items, unknown } = previewData(); ui.pv = items; ui.unk = unknown;
  let h = '';
  if (items.length) h += '<div class="pv">' + items.map((x, i) => {
    if (x.manual) return `<div class="pv-item"><div class="pv-name">${esc(x.manual.name)}<small>введено вручную</small></div><span></span><span class="pv-kcal">${f0(x.manual.kcal)} ккал</span><button class="x-btn" data-a="pvRemove" data-i="${i}" aria-label="Убрать">${IC.x}</button></div>`;
    const w = x.food.water;
    return `<div class="pv-item"><div class="pv-name">${esc(x.food.name)}${w ? '<small>пойдёт в счётчик воды</small>' : x.def ? '<small>обычная порция, поправьте при желании</small>' : ''}</div>
      <label class="pv-g"><input class="input input-sm num" type="text" inputmode="decimal" value="${esc(x.grams)}" data-in="pvGrams" data-i="${i}" aria-label="${w ? 'Миллилитры' : 'Граммы'}: ${esc(x.food.name)}">${w || x.food.liq ? 'мл' : 'г'}</label>
      <span class="pv-kcal" id="pvk${i}">${w ? '' : f0(pvKcal(x)) + ' ккал'}</span>
      <button class="x-btn" data-a="pvRemove" data-i="${i}" aria-label="Убрать">${IC.x}</button></div>`;
  }).join('') + '</div>';
  unknown.forEach((u, i) => {
    const open = ui.manualFor === u;
    h += `<div class="unknown"><p class="small"><b>«${esc(u)}»</b> — такого нет в базе.</p>
      ${open ? `<div class="grid2"><div class="field span2"><label for="mName">Название</label><input id="mName" class="input" value="${esc(u)}"></div>
        <div class="field"><label for="mKcal">Калории, всего</label><input id="mKcal" class="input num" inputmode="decimal" placeholder="например, 250"></div>
        <div class="field"><label for="mP">Белки, г</label><input id="mP" class="input num" inputmode="decimal" placeholder="необязательно"></div>
        <div class="field"><label for="mF">Жиры, г</label><input id="mF" class="input num" inputmode="decimal" placeholder="необязательно"></div>
        <div class="field"><label for="mC">Углеводы, г</label><input id="mC" class="input num" inputmode="decimal" placeholder="необязательно"></div></div>
        <div class="row"><button class="btn btn-primary btn-sm" data-a="manualAdd" data-u="${i}">Добавить</button><button class="btn-link" data-a="manualCancel">Отмена</button></div>`
      : `<div class="row"><button class="btn btn-ghost btn-sm" data-a="unkSearch" data-u="${i}">Найти похожее</button><button class="btn btn-ghost btn-sm" data-a="unkManual" data-u="${i}">Ввести калории</button><button class="btn-link" data-a="unkHide" data-u="${i}">Пропустить</button></div>`}</div>`;
  });
  box.innerHTML = h; updateCommit();
}
function updateCommit() {
  const b = $('#commitBtn'); if (!b) return;
  const food = ui.pv.filter(x => x.manual || !x.food.water), kc = food.reduce((s, x) => s + pvKcal(x), 0);
  const water = ui.pv.filter(x => !x.manual && x.food.water).reduce((s, x) => s + (+x.grams || 0), 0);
  b.disabled = !ui.pv.length;
  b.textContent = ui.pv.length ? `Добавить${food.length ? ` · ${f0(kc)} ккал` : ''}${water ? ` · вода ${f0(water)} мл` : ''}` : 'Добавить';
}
function renderSearch() {
  const box = $('#sr'); if (!box) return;
  const res = ui.q.trim().length >= 2 ? searchFoods(ui.q) : [];
  box.innerHTML = res.length ? `<div class="results">${res.map(f => `<button class="res" data-a="pickFood" data-id="${f.id}"><span>${esc(f.name)}</span><span>${f0(f.kcal)} ккал / 100 ${f.liq ? 'мл' : 'г'}</span></button>`).join('')}</div>`
    : (ui.q.trim().length >= 2 ? `<p class="hint">Ничего не нашлось. Добавьте свой продукт в «Профиле» или введите калории вручную.</p>` : '');
}
function sheetHead(title, act) { return `<div class="grabber"></div><div class="sheet-hd"><h2 id="sheetTitle">${esc(title)}</h2><button class="icon-btn" data-a="${act || 'closeSheet'}" aria-label="Закрыть">${IC.x}</button></div>`; }
function sheetAdd() {
  const rec = S.recent.map((r, i) => foodById(r.id) ? `<button class="chip" data-a="pickRecent" data-i="${i}">${esc(r.name)} · ${f0(r.grams)}</button>` : '').join('');
  const canScan = !!(NB && typeof NB.scanBarcode === 'function'), ds = dishList();
  const bcRow = `<div class="row">${canScan ? `<button class="btn btn-ghost btn-sm grow" data-a="bcScan">${IC.barcode} Сканировать штрихкод</button><button class="btn btn-ghost btn-sm" data-a="bcOpen">Ввести код</button>`
    : `<button class="btn btn-ghost btn-sm grow" data-a="bcOpen">${IC.barcode} Штрихкод с упаковки</button>`}</div>`;
  const dishHtml = `<div class="field"><div class="lbl-row"><span class="lbl">Мои блюда</span><button class="btn-link" data-a="dishNew">+ Создать блюдо</button></div>
    ${ds.length ? `<div class="chips">${ds.map(c => `<span class="dish-chip"><button data-a="dishAdd" data-id="${esc(c.id)}">${esc(c.name)} · ${f0(c.portion || 300)} г</button><button class="dish-ed" data-a="dishEdit" data-id="${esc(c.id)}" aria-label="Изменить блюдо: ${esc(c.name)}">${IC.edit}</button></span>`).join('')}</div>`
      : `<p class="hint">Домашнее блюдо можно один раз собрать из продуктов — потом оно добавляется в одно касание.</p>`}</div>`;
  return `${sheetHead('Добавить еду')}
  ${segm('pickMeal', ui.meal, MEALS.map(m => [m, m]), 'Приём пищи')}
  <div class="field"><label for="foodText">Что вы съели или выпили?</label>
    <textarea id="foodText" class="input" rows="2" data-in="foodText" placeholder="Например: гречка 150 г, котлета, огурец" autocomplete="off">${esc(ui.text)}</textarea>
    <p class="hint">Через запятую. Понимаю граммы, штуки, ложки, стаканы и тарелки: «2 яйца», «стакан кефира 1%», «чай с сахаром».</p></div>
  ${bcRow}
  <div id="pv"></div>
  ${rec ? `<div class="field"><span class="lbl">Недавнее</span><div class="chips">${rec}</div></div>` : ''}
  ${dishHtml}
  <div class="field"><label for="foodSearch">Найти в базе</label><input id="foodSearch" class="input" type="search" data-in="foodSearch" placeholder="Название продукта" autocomplete="off" value="${esc(ui.q)}"><div id="sr"></div></div>
  <button class="btn btn-primary btn-block" id="commitBtn" data-a="commitAdd" disabled>Добавить</button>`;
}
function editInfo(it, g) { const m = (toNum(g) || 0) / 100; return `${f0(it.k100 * m)} ккал · Б ${f0(it.p100 * m)} · Ж ${f0(it.f100 * m)} · У ${f0(it.c100 * m)}`; }
function sheetEdit() {
  const it = getDay(ui.date).items.find(x => x.id === ui.editId); if (!it) return sheetHead('Запись не найдена');
  return `${sheetHead(it.name)}
  ${segm('editMeal', ui.editMeal, MEALS.map(m => [m, m]), 'Приём пищи')}
  ${it.manual ? `<div class="grid2"><div class="field"><label for="eKcal">Калории</label><input id="eKcal" class="input num" inputmode="decimal" value="${esc(it.kcal)}"></div>
     <div class="field"><label for="eP">Белки, г</label><input id="eP" class="input num" inputmode="decimal" value="${esc(it.p || '')}"></div>
     <div class="field"><label for="eF">Жиры, г</label><input id="eF" class="input num" inputmode="decimal" value="${esc(it.f || '')}"></div>
     <div class="field"><label for="eC">Углеводы, г</label><input id="eC" class="input num" inputmode="decimal" value="${esc(it.c || '')}"></div></div>`
    : `<div class="field"><label for="eGrams">Количество, г</label><input id="eGrams" class="input num" inputmode="decimal" data-in="editGrams" value="${esc(it.grams)}"></div>
     <p class="muted" id="eInfo">${editInfo(it, it.grams)}</p>`}
  <div class="row"><button class="btn btn-primary grow" data-a="saveEdit">Сохранить</button><button class="btn btn-warn" data-a="deleteItem">Удалить</button></div>`;
}
function resetAdd(meal) {
  ui.text = ''; ui.q = ''; ui.over = {}; ui.hidden = new Set(); ui.extra = []; ui.manual = []; ui.manualFor = null; ui.pv = [];
  if (meal) ui.meal = meal;
  else if (ui.date === todayKey()) { const h = new Date().getHours(); ui.meal = h < 11 ? 'Завтрак' : h < 15 ? 'Обед' : h < 18 ? 'Перекус' : h < 22 ? 'Ужин' : 'Перекус'; }
}
function pushRecent(food, grams) { S.recent = [{ id: food.id, name: food.name, grams: Math.round(grams) }].concat(S.recent.filter(r => r.id !== food.id)).slice(0, 10); }

function sheetSteps() {
  const st = stepsFor(ui.date);
  return `${sheetHead('Шаги за ' + relD(ui.date).toLowerCase())}
  <div class="field"><label for="stepsIn">Количество шагов</label><input id="stepsIn" class="input num" inputmode="numeric" value="${st.src === 'manual' ? esc(st.n) : ''}" placeholder="${st.n ? esc(st.n) : 'например, 8000'}"></div>
  <p class="hint">Пригодится, если шаги считает браслет или часы. Введённое число заменит подсчёт телефона за этот день.</p>
  <div class="row"><button class="btn btn-primary grow" data-a="saveSteps">Сохранить</button>${st.src === 'manual' && NB ? `<button class="btn btn-ghost" data-a="clearSteps">Считать телефоном</button>` : ''}</div>`;
}
function sheetWater() {
  const gl = glassMl(), water = getDay(ui.date).water || 0, own = !!ui.glassOwn || !GLASSES.includes(gl);
  return `${sheetHead('Вода · ' + relD(ui.date).toLowerCase())}
  <p class="muted num">Выпито ${f0(water)} мл из ${f0(waterTarget())} мл</p>
  <div class="field"><label for="wAdd">Добавить, мл</label><div class="row"><input id="wAdd" class="input num grow" inputmode="numeric" enterkeyhint="done" placeholder="например, 120" autocomplete="off"><button class="btn btn-primary" data-a="waterAdd">Добавить</button></div>
    <div class="chips">${[100, 200, 330, 500].map(v => `<button class="chip" data-a="waterAdd" data-v="${v}">+${v} мл</button>`).join('')}</div></div>
  <div class="field"><span class="lbl">Размер стакана</span>
    <div class="chips">${GLASSES.map(v => `<button class="chip" data-a="glassSet" data-v="${v}" aria-pressed="${!own && gl === v}">${v} мл</button>`).join('')}<button class="chip" data-a="glassOwn" aria-pressed="${own}">своё</button></div>
    ${own ? `<div class="row"><input id="glassIn" class="input num grow" inputmode="numeric" enterkeyhint="done" value="${GLASSES.includes(gl) ? '' : gl}" placeholder="от 50 до 1000 мл" aria-label="Свой объём стакана, мл" autocomplete="off"><button class="btn btn-ghost" data-a="glassSave">Сохранить</button></div>` : ''}
    <p class="hint">Стаканы на главном экране — такого объёма. Обычный стакан — 250 мл, кружка — около 300, бутылка — 500.</p></div>`;
}
const waterHist = k => { ui.wHist = ui.wHist || {}; return ui.wHist[k] || (ui.wHist[k] = []); };
const nn = v => Math.max(0, r1(toNum(v) || 0));

/* ================= ТРЕНИРОВКИ ================= */
function lastFor(exId, name, beforeId, until) {
  const list = S.workouts.slice().sort((a, b) => b.date.localeCompare(a.date));
  for (const w of list) {
    if (w.id === beforeId || (until && w.date > until)) continue;
    const e = w.ex.find(x => (exId && x.exId === exId) || ((!exId || !x.exId) && x.name === name));
    if (e && e.sets.some(s => s.done)) return { date: w.date, sets: e.sets.filter(s => s.done) };
  }
  return null;
}
const fw = w => { const n = toNum(w); return isNaN(n) ? String(w || '') : f1(n); };
function setsText(sets, kind) {
  const d = sets.filter(s => s.done !== false);
  if (!d.length) return '';
  if (kind === 'c') return d.map(s => (s.r || '?') + ' мин').join(', ');
  if (kind === 't') return d.map(s => s.r || '?').join(', ') + ' сек';
  const ws = d.map(s => fw(s.w));
  if (ws.every(w => w === ws[0])) return (ws[0] ? ws[0] + ' кг × ' : '') + d.map(s => s.r || '?').join(', ');
  return d.map((s, i) => (ws[i] ? ws[i] + '×' : '') + (s.r || '?')).join(', ');
}
function weekCard() {
  const t = todayKey(), ws = weekStart(t), dates = new Set(S.workouts.map(w => w.date));
  let week = ''; for (let i = 0; i < 7; i++) { const k = addDays(ws, i); week += `<div class="wd${k === t ? ' today' : ''}"><b>${WDS[pk(k).getDay()]}</b><i class="${dates.has(k) ? 'on' : ''}">${dates.has(k) ? '✓' : ''}</i></div>`; }
  const n = S.workouts.filter(w => w.date >= ws && w.date <= addDays(ws, 6)).length, goal = S.program.days.length;
  return `<section class="card"><div class="sec-head"><h2>Эта неделя</h2><span class="pill${n >= goal ? ' ok' : ''}">${n} из ${goal}</span></div><div class="week">${week}</div></section>`;
}
function setRow(i, j, s, kind, pe) {
  const done = !!s.done;
  const btn = `<button class="done-btn" data-a="setDone" data-i="${i}" data-j="${j}" aria-pressed="${done}" aria-label="Подход ${j + 1} выполнен">${IC.check}</button>`;
  if (kind === 't' || kind === 'c') {
    const u = kind === 't' ? 'сек' : 'мин';
    return `<div class="set${done ? ' is-done' : ''}"><span class="no">${j + 1}</span><input class="input input-sm" style="grid-column:span 3" inputmode="numeric" data-in="setR" data-i="${i}" data-j="${j}" value="${esc(s.r)}" placeholder="${esc(String(pe.reps || '').replace(/\D+$/, '') || (kind === 't' ? '30' : '20'))}" aria-label="${u}, подход ${j + 1}"><span class="u">${u}</span>${btn}</div>`;
  }
  const rp = String(pe.reps || '').split(/[–\-]/)[0].replace(/\D/g, '') || '10';
  return `<div class="set${done ? ' is-done' : ''}"><span class="no">${j + 1}</span>
    <input class="input input-sm" inputmode="decimal" data-in="setW" data-i="${i}" data-j="${j}" value="${esc(s.w)}" placeholder="${kind === 'bw' ? '+кг' : 'кг'}" aria-label="Вес, подход ${j + 1}">
    <span class="u">×</span>
    <input class="input input-sm" inputmode="numeric" data-in="setR" data-i="${i}" data-j="${j}" value="${esc(s.r)}" placeholder="${esc(rp)}" aria-label="Повторы, подход ${j + 1}">
    <span class="u">повт</span>${btn}</div>`;
}
function sessionCard() {
  const s = S.session, el = Math.max(0, Math.round((Date.now() - (s.start || Date.now())) / 60000));
  const ex = s.ex.map((e, i) => {
    const kind = kindOf(e.exId), pe = { reps: e.reps || '' };
    return `<div class="sx"><div class="sx-hd"><button class="ex-name" data-a="exInfo" data-id="${esc(e.exId || '')}" data-from="session">${esc(e.name)}<small>${esc(e.target || '')}</small></button><button class="x-btn" data-a="sxRemove" data-i="${i}" aria-label="Убрать упражнение из тренировки">${IC.x}</button></div>
      ${progHint(e, kind, s.date)}
      ${e.sets.map((st, j) => setRow(i, j, st, kind, pe)).join('')}
      <div class="row"><button class="btn-link" data-a="setAdd" data-i="${i}">+ подход</button>${e.sets.length > 1 ? `<button class="btn-link" data-a="setDel" data-i="${i}">− подход</button>` : ''}</div></div>`;
  }).join('');
  let foot;
  if (ui.confirm === 'cancelSession') foot = `<div class="confirm"><p>Отменить тренировку? Отметки не сохранятся.</p><div class="row"><button class="btn btn-warn btn-sm" data-a="cancelSessionYes">Да, отменить</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Продолжить тренировку</button></div></div>`;
  else if (ui.confirm === 'finish') foot = `<div class="confirm"><div class="field"><label for="finMin">Длительность, минут</label><input id="finMin" class="input num" inputmode="numeric" value="${esc(ui.finishMin)}"></div><div class="row"><button class="btn btn-primary btn-sm grow" data-a="finishYes">Сохранить тренировку</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Назад</button></div></div>`;
  else foot = `<div class="row"><button class="btn btn-primary grow" data-a="finishSession">Завершить тренировку</button><button class="btn btn-ghost" data-a="cancelSession">Отменить</button></div>`;
  return `<section class="card"><div class="sec-head"><h2>${esc(s.dayName)}</h2><span class="pill ok">идёт · ${el} мин</span></div>
    <div class="field"><label for="sessDate">Дата</label><input id="sessDate" class="input" type="date" data-in="sessDate" value="${esc(s.date)}" max="${todayKey()}"></div>
    ${ex}
    <button class="btn btn-ghost btn-sm" data-a="pickOpen" data-mode="session">${IC.plus} Упражнение</button>
    <div class="field"><label for="sessNote">Заметка для тренера</label><textarea id="sessNote" class="input" rows="2" data-in="sessNote" placeholder="Самочувствие, что было тяжело или легко">${esc(s.note)}</textarea></div>
    ${foot}</section>`;
}
function progEditor() {
  const P = S.program;
  let h = `<section class="card"><div class="field"><label for="progTitle">Название программы</label><input id="progTitle" class="input" data-in="progTitle" value="${esc(P.title)}"></div>
    <div class="field"><label for="progNote">Пояснение</label><input id="progNote" class="input" data-in="progNote" value="${esc(P.note || '')}"></div></section>`;
  P.days.forEach((d, di) => {
    h += `<section class="card"><div class="field"><label for="dn${di}">Название дня</label><input id="dn${di}" class="input" data-in="dayName" data-d="${di}" value="${esc(d.name)}"></div>
      <div class="row small muted" style="justify-content:flex-end;gap:0"><span style="width:58px;text-align:center">подходы</span><span style="width:82px;text-align:center">повторы</span></div>
      <div>${d.ex.map((e, ei) => `<div class="pe"><button class="ex-name" data-a="exInfo" data-id="${esc(e.exId || '')}">${esc(e.name)}<small>${esc(GROUP[(exInfo(e.exId) || {}).g] || 'своё упражнение')}</small></button>
        <input class="input input-sm" inputmode="numeric" data-in="exSets" data-d="${di}" data-e="${ei}" value="${esc(e.sets)}" aria-label="Подходы: ${esc(e.name)}">
        <input class="input input-sm" data-in="exReps" data-d="${di}" data-e="${ei}" value="${esc(e.reps)}" placeholder="10–12" aria-label="Повторы: ${esc(e.name)}">
        <div class="row"><button class="x-btn" data-a="exUp" data-d="${di}" data-e="${ei}" aria-label="Выше">${IC.up}</button><button class="x-btn" data-a="exDown" data-d="${di}" data-e="${ei}" aria-label="Ниже">${IC.down}</button><button class="x-btn" data-a="exDel" data-d="${di}" data-e="${ei}" aria-label="Удалить упражнение">${IC.x}</button></div></div>`).join('')}</div>
      <div class="row"><button class="btn btn-ghost btn-sm" data-a="pickOpen" data-mode="prog" data-d="${di}">${IC.plus} Упражнение</button>
      ${ui.confirm === 'delDay' + di ? `<span class="small">Удалить день?</span><button class="btn btn-warn btn-sm" data-a="dayDelYes" data-d="${di}">Удалить</button><button class="btn-link" data-a="confirmNo">Нет</button>` : `<button class="btn-link" data-a="dayDel" data-d="${di}">Удалить день</button>`}</div></section>`;
  });
  h += `<div class="row"><button class="btn btn-ghost" data-a="dayAdd">${IC.plus} День</button><button class="btn btn-primary grow" data-a="progDone">Готово</button></div>
    <section class="card"><h2>Отправить программу</h2><p class="small muted">Код содержит всю программу. В другом телефоне: «Тренировки» → «Код программы».</p>
      ${ui.progCode ? `<textarea id="progCodeTa" class="input code" rows="4" readonly>${esc(ui.progCode)}</textarea><button class="btn btn-ghost" data-a="copyProg">Скопировать код</button>` : `<button class="btn btn-ghost" data-a="progExport">Получить код программы</button>`}</section>`;
  return h;
}
function renderTrain() {
  const P = S.program;
  let h = `<header class="hd"><h1>Тренировки</h1></header>${demoBanner()}${weekCard()}`;
  if (S.session) h += sessionCard();
  if (ui.editProg) h += progEditor();
  else {
    h += `<section class="card"><div><h2>${esc(P.title)}</h2>${P.note ? `<p class="small muted">${esc(P.note)}</p>` : ''}</div>
      <div class="row"><button class="btn btn-ghost btn-sm" data-a="progEdit">Изменить</button><button class="btn btn-ghost btn-sm" data-a="openTemplates">Шаблоны</button><button class="btn btn-ghost btn-sm" data-a="openImport">Код программы</button></div></section>`;
    P.days.forEach(d => {
      h += `<section class="card"><div class="sec-head"><h2>${esc(d.name)}</h2><span class="muted small">${d.ex.length} ${plural(d.ex.length, 'упражнение', 'упражнения', 'упражнений')}</span></div>
        <div>${d.ex.map(e => `<div class="ex"><button class="ex-name" data-a="exInfo" data-id="${esc(e.exId || '')}">${esc(e.name)}</button><span class="scheme">${esc(schemeText(e))}</span></div>`).join('')}</div>
        ${S.session ? '' : `<button class="btn btn-primary" data-a="startDay" data-id="${esc(d.id)}">Начать «${esc(d.name)}»</button>`}</section>`;
    });
    if (!S.session) h += `<button class="btn btn-ghost" data-a="startFree">Записать другую тренировку</button>`;
  }
  const hist = S.workouts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  h += `<section class="card"><div class="sec-head"><h2>История</h2>${S.workouts.length ? `<span class="muted small">всего ${S.workouts.length}</span>` : ''}</div>${hist.length ? `<div>${hist.map(w => {
    const dn = w.ex.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0);
    return `<button class="hist" data-a="openWorkout" data-id="${w.id}"><span><b>${esc(w.dayName)}</b><span class="small muted" style="display:block">${fmtS(w.date)} · ${f0(w.minutes || 60)} мин${w.author === 'coach' ? ' · записал тренер' : ''}${w.note ? ' · ' + esc(w.note) : ''}${noteOf('w:' + w.id) ? ` · <span class="note-mark">${IC.msg}комментарий тренера</span>` : ''}</span></span><span class="pill">${dn} ${plural(dn, 'подход', 'подхода', 'подходов')}</span></button>`;
  }).join('')}</div>` : `<p class="muted small">Здесь появятся завершённые тренировки.</p>`}</section>`;
  return h;
}
function sheetWorkout() {
  const w = S.workouts.find(x => x.id === ui.woId); if (!w) return sheetHead('Тренировка не найдена');
  const kg = weightOn(w.date) || 65;
  return `${sheetHead(w.dayName + ', ' + fmtD(w.date))}
    <div class="stats three"><div class="stat"><b>${f0(w.minutes || 60)}</b><span>минут</span></div><div class="stat"><b>${w.ex.length}</b><span>${plural(w.ex.length, 'упражнение', 'упражнения', 'упражнений')}</span></div><div class="stat"><b>≈${f0(woKcal(w, kg))}</b><span>ккал</span></div></div>
    <div>${w.ex.map(e => `<div class="ex"><button class="ex-name" data-a="exInfo" data-id="${esc(e.exId || '')}">${esc(e.name)}</button><span class="scheme">${esc(setsText(e.sets, kindOf(e.exId)))}</span></div>`).join('')}</div>
    ${w.note ? `<p class="tipbox"><b>Заметка:</b> ${esc(w.note)}</p>` : ''}
    ${woNoteHtml(w)}
    <div class="field"><label for="woMin">Длительность, минут</label><input id="woMin" class="input num" inputmode="numeric" value="${esc(w.minutes || 60)}"></div>
    <div class="row"><button class="btn btn-primary grow" data-a="woSave">Сохранить</button><button class="btn btn-warn" data-a="woDelete">Удалить</button></div>`;
}
function sheetPick() {
  const list = filterEx(EXERCISES.concat(S.customEx || []), ui.pickQ, ui.pickG, ui.pickE);
  return `${sheetHead('Выберите упражнение')}
    <input class="input" type="search" data-in="pickQ" placeholder="Поиск: присед, спина, гантели…" value="${esc(ui.pickQ)}" aria-label="Поиск упражнения">
    <div class="chips scroll">${[['', 'Все']].concat(EX_GROUPS).map(([g, l]) => `<button class="chip" data-a="pickG" data-g="${g}" aria-pressed="${ui.pickG === g}">${esc(l)}</button>`).join('')}</div>
    ${eqChips('pickE', ui.pickE)}
    <div class="results" id="pickList">${pickListHtml(list)}</div>
    ${ui.pickNew ? `<div class="confirm"><div class="field"><label for="cxName">Название</label><input id="cxName" class="input" value="${esc(ui.pickQ)}"></div>
      <div class="grid2"><div class="field"><label for="cxGroup">Группа</label><select id="cxGroup" class="input">${EX_GROUPS.map(([g, l]) => `<option value="${g}">${esc(l)}</option>`).join('')}</select></div>
      <div class="field"><label for="cxKind">Как записывать</label><select id="cxKind" class="input"><option value="w">Вес × повторы</option><option value="bw">Повторы</option><option value="t">Время, сек</option><option value="c">Кардио, мин</option></select></div></div>
      <div class="row"><button class="btn btn-primary btn-sm" data-a="cxSave">Добавить</button><button class="btn-link" data-a="cxCancel">Отмена</button></div></div>`
    : `<button class="btn btn-ghost" data-a="cxNew">Своё упражнение</button>`}`;
}
function matchQ(q, hay) {
  const ws = normTxt(q).split(/[^а-яa-z0-9]+/).filter(Boolean); if (!ws.length) return true;
  const h = normTxt(hay); return ws.every(w => h.includes(w.length > 4 ? w.slice(0, Math.max(4, w.length - 2)) : w));
}
const EQ_TYPES = [['', 'Любой инвентарь'], ['bw', 'Свой вес'], ['free', 'Гантели, штанга'], ['machine', 'Тренажёры и блоки'], ['band', 'Резинка']];
const EQ_RX = { bw: /свой вес|перекладин|брусья|стена|скакалк|тумба|ролик|^скамья$|ступеньк|опора/i, free: /гантел|штанг|гир|гриф|блин/i, machine: /тренаж|блок|кроссовер|гравитрон|смит|дорожк|скотта/i, band: /резинк/i };
const EQ_WORDS = { bw: 'собственный вес без снаряжения дома', free: 'свободные веса', machine: 'тренажер тренажерный зал', band: 'эспандер лента' };
const eqTypes = e => Object.keys(EQ_RX).filter(k => EQ_RX[k].test(e.eq || ''));
function filterEx(list, q, g, t) { return list.filter(e => (!g || e.g === g) && (!t || eqTypes(e).includes(t)) && matchQ(q, [e.n, e.m || '', e.eq || '', GROUP[e.g] || ''].concat(eqTypes(e).map(k => EQ_WORDS[k])).join(' '))); }
const eqChips = (act, cur) => `<div class="chips scroll">${EQ_TYPES.map(([t, l]) => `<button class="chip" data-a="${act}" data-t="${t}" aria-pressed="${cur === t}">${esc(l)}</button>`).join('')}</div>`;
function pickListHtml(list) {
  if (!list.length) return `<p class="hint">Ничего не нашлось. Добавьте своё упражнение.</p>`;
  return list.map(e => `<button class="res" data-a="pickEx" data-id="${esc(e.id)}">${thumbHtml(e.id)}<span class="res-main"><span>${esc(e.n)}</span><small>${esc(GROUP[e.g] || '')}${e.eq ? ' · ' + esc(e.eq) : ''}</small></span><span>${IC.plus}</span></button>`).join('');
}
function sheetTemplates() {
  return `${sheetHead('Шаблоны программ')}
    ${PROGRAM_TEMPLATES.map(t => `<section class="card"><div><h3>${esc(t.title)}</h3><p class="small muted">${esc(t.s)}</p></div>
      <p class="small">${t.days.map(([n, l]) => `<b>${esc(n)}:</b> ${l.map(x => esc(EXM.get(x[0]).n)).join(', ')}`).join('<br>')}</p>
      ${ui.tplId === t.id ? `<div class="confirm"><p>Заменить текущую программу? История тренировок сохранится.</p><div class="row"><button class="btn btn-primary btn-sm" data-a="tplYes" data-id="${t.id}">Заменить</button><button class="btn-link" data-a="tplNo">Отмена</button></div></div>` : `<button class="btn btn-ghost btn-sm" data-a="tplPick" data-id="${t.id}">Выбрать</button>`}</section>`).join('')}`;
}
function sheetImport() {
  return `${sheetHead('Код программы')}
    <div class="field"><label for="progImport">Вставьте код программы от тренера</label><textarea id="progImport" class="input code" rows="5" placeholder="PRG2:…"></textarea></div>
    ${ui.confirm === 'progImport' ? `<div class="confirm"><p>Заменить текущую программу на «${esc(ui.pendingImport && ui.pendingImport.title || 'новую')}»? История тренировок сохранится.</p><div class="row"><button class="btn btn-primary btn-sm" data-a="progImportYes">Заменить</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>`
      : `<button class="btn btn-primary" data-a="progImport">Загрузить</button>`}`;
}

/* ================= БАЗА ЗНАНИЙ ================= */
const hasAnim = id => !!(id && typeof ANIM !== 'undefined' && ANIM.has(id));
const thumbHtml = id => hasAnim(id) ? `<canvas class="ex-thumb" data-ex="${esc(id)}" width="56" height="56" aria-hidden="true"></canvas>` : `<span class="ex-thumb none" aria-hidden="true">${IC.dumbbell}</span>`;
let thumbObs = null;
function drawThumbs(root) {
  if (typeof ANIM === 'undefined' || !root) return;
  const cs = root.querySelectorAll('canvas.ex-thumb:not([data-done])'); if (!cs.length) return;
  if (!('IntersectionObserver' in window)) { cs.forEach(c => { c.dataset.done = 1; ANIM.thumb(c, c.dataset.ex); }); return; }
  if (!thumbObs) thumbObs = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; const c = en.target; thumbObs.unobserve(c); if (!c.dataset.done) { c.dataset.done = 1; ANIM.thumb(c, c.dataset.ex); } }), { rootMargin: '200px 0px' });
  thumbObs.disconnect(); document.querySelectorAll('canvas.ex-thumb:not([data-done])').forEach(c => thumbObs.observe(c));
}
let animStop = null, animPaused = false;
function stopAnim() { if (animStop) { animStop(); animStop = null; } }
function startAnim() {
  stopAnim(); const c = $('#exAnim'); if (!c || typeof ANIM === 'undefined') return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animPaused || reduce) { ANIM.thumb(c, c.dataset.ex); animPaused = true; } else animStop = ANIM.play(c, c.dataset.ex);
  const b = $('#animBtn'); if (b) { b.innerHTML = animPaused ? IC.resume : IC.pause; b.setAttribute('aria-label', animPaused ? 'Запустить анимацию' : 'Пауза'); }
}
function kbCount() { const n = filterEx(EXERCISES, ui.kbQ, ui.kbG, ui.kbE).length; return `${n} ${plural(n, 'упражнение', 'упражнения', 'упражнений')} · нажмите, чтобы увидеть технику`; }
function kbList() {
  const list = filterEx(EXERCISES, ui.kbQ, ui.kbG, ui.kbE);
  if (!list.length) return `<p class="hint">Ничего не нашлось.</p>`;
  return list.map(e => `<button class="kb-row" data-a="exInfo" data-id="${e.id}">${thumbHtml(e.id)}<span class="grow"><span>${esc(e.n)}</span><small>${esc(e.m)}</small></span><span class="chev">${IC.chev}</span></button>`).join('');
}
function renderKb() {
  let h = `<header class="hd"><h1>База знаний</h1></header>${segm('kbTab', ui.kbTab, [['ex', 'Упражнения'], ['art', 'Статьи']], 'Раздел')}`;
  if (ui.kbTab === 'ex') {
    h += `<input class="input" type="search" data-in="kbQ" placeholder="Поиск: ягодицы, гантели, спина…" value="${esc(ui.kbQ)}" aria-label="Поиск упражнения">
      <div class="chips scroll">${[['', 'Все']].concat(EX_GROUPS).map(([g, l]) => `<button class="chip" data-a="kbG" data-g="${g}" aria-pressed="${ui.kbG === g}">${esc(l)}</button>`).join('')}</div>
      ${eqChips('kbE', ui.kbE)}
      <p class="hint" id="kbCount">${kbCount()}</p>
      <section class="card" style="padding-block:4px"><div id="kbList">${kbList()}</div></section>`;
  } else {
    h += `<section class="card" style="padding-block:4px">${ARTICLES.map(a => `<button class="kb-row" data-a="openArt" data-id="${a.id}"><span class="grow"><span>${esc(a.t)}</span><small>${esc(a.s)}</small></span><span class="chev">${IC.chev}</span></button>`).join('')}</section>`;
  }
  return h;
}
function sheetEx() {
  const e = exInfo(ui.exId);
  if (!e) return `${sheetHead('Своё упражнение')}<p class="muted">Это упражнение добавлено вручную, описания для него нет.</p>`;
  const q = encodeURIComponent(e.n + ' техника выполнения');
  const addPart = ui.exFrom === 'session' || e.custom ? '' : `<div class="field"><span class="lbl">Добавить в программу</span><div class="chips">${S.program.days.map((d, di) => `<button class="chip" data-a="exToDay" data-d="${di}">${esc(d.name)}</button>`).join('')}</div></div>`;
  if (e.custom) return `${sheetHead(e.n)}<p class="muted">Своё упражнение · ${esc(GROUP[e.g] || '')}</p>`;
  const anim = hasAnim(e.id) ? `<div class="ex-anim-box"><canvas class="ex-anim" id="exAnim" data-ex="${esc(e.id)}" role="img" aria-label="Анимация: как выполнять «${esc(e.n)}»"></canvas>
      <button class="anim-btn" id="animBtn" data-a="animToggle" aria-label="Пауза">${IC.pause}</button></div>` : '';
  return `${sheetHead(e.n)}${anim}
    <div class="row"><span class="tag">${esc(GROUP[e.g])}</span><span class="tag">${esc(e.eq)}</span><span class="tag">${esc(e.lvl)}</span></div>
    <div class="doc">
      <p><b>Мышцы:</b> ${esc(e.m)}</p>
      <h3>Что даёт</h3><p>${esc(e.why)}</p>
      <h3>Как выполнять</h3><ol>${e.how.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <h3>Частые ошибки</h3><ul>${e.err.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="tipbox">${esc(e.tip)}</p>
      <h3>Видео</h3>
      <div class="links"><a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">YouTube</a><a href="https://rutube.ru/search/?query=${q}" target="_blank" rel="noopener">Rutube</a></div>
      <p class="hint">Откроется поиск видео по названию упражнения. Сверяйте технику с описанием выше.</p>
    </div>${addPart}`;
}
function sheetArt() {
  const a = ARTICLES.find(x => x.id === ui.artId); if (!a) return sheetHead('Статья не найдена');
  return `${sheetHead(a.t)}<div class="doc">${a.body.map(b => typeof b === 'string' ? `<p>${esc(b)}</p>` : b.h ? `<h3>${esc(b.h)}</h3>` : b.ul ? `<ul>${b.ul.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '').join('')}</div>`;
}

/* ================= ПРОГРЕСС ================= */
function periodKeys(n) { const t = todayKey(), out = []; for (let i = n - 1; i >= 0; i--) out.push(addDays(t, -i)); return out; }
const CW = 340;
function lineChart(id, pts, o) {
  if (pts.length < 2) return `<p class="muted small">${o.empty || 'График появится после второй записи.'}</p>`;
  const H = 170, L = 38, R = 12, T = 12, B = 24, W = CW;
  const all = pts.map(p => p.v).concat(o.pts2 ? o.pts2.map(p => p.v) : []).concat(o.goal ? [o.goal] : []);
  let lo = Math.min(...all), hi = Math.max(...all);
  const padv = (hi - lo) * 0.12 || Math.max(1, Math.abs(hi) * 0.05); lo -= padv; hi += padv;
  if (o.zero) lo = Math.min(0, lo);
  const t0 = pk(o.from || pts[0].k).getTime(), t1 = Math.max(pk(o.to || pts[pts.length - 1].k).getTime(), t0 + 864e5);
  const X = k => L + (pk(k).getTime() - t0) / (t1 - t0) * (W - L - R), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const fmt = o.fmt || f1;
  const ticks = [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1];
  let g = ticks.map(v => `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="ax" x="${L - 5}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`).join('');
  if (o.goal) g += `<line x1="${L}" x2="${W - R}" y1="${Y(o.goal).toFixed(1)}" y2="${Y(o.goal).toFixed(1)}" stroke="var(--fg)" stroke-opacity=".45" stroke-dasharray="4 4"/>`;
  const path = (ps) => ps.map((p, i) => (i ? 'L' : 'M') + X(p.k).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
  const c = o.color || 'var(--accent)';
  let s = '';
  if (!o.pts2) { const ln = path(pts); s += `<path d="${ln} L${X(pts[pts.length - 1].k).toFixed(1)} ${H - B} L${X(pts[0].k).toFixed(1)} ${H - B} Z" fill="${c}" fill-opacity=".12"/>`; }
  s += `<path d="${path(pts)}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (o.pts2 && o.pts2.length > 1) s += `<path d="${path(o.pts2)}" fill="none" stroke="${o.color2}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="5 3"/>`;
  if (pts.length <= 40) s += pts.map(p => `<circle cx="${X(p.k).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.6" fill="var(--surface)" stroke="${c}" stroke-width="1.6"/>`).join('');
  const lp = pts[pts.length - 1]; s += `<circle cx="${X(lp.k).toFixed(1)}" cy="${Y(lp.v).toFixed(1)}" r="4.6" fill="${c}"/>`;
  // зоны касания
  const xs = pts.map(p => X(p.k));
  let hits = '';
  pts.forEach((p, i) => {
    const a = i ? (xs[i - 1] + xs[i]) / 2 : L, b = i < pts.length - 1 ? (xs[i] + xs[i + 1]) / 2 : W - R;
    hits += `<rect class="hit" x="${a.toFixed(1)}" y="${T}" width="${Math.max(1, b - a).toFixed(1)}" height="${H - T - B}" data-a="tip" data-c="${id}" data-d="${esc(p.lab || fmtS(p.k))}" data-v="${esc(p.txt)}"/>`;
  });
  const fk = o.from || pts[0].k, lk = o.to || lp.k;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'График')}">${g}${s}${hits}
    <text class="ax" x="${L}" y="${H - 7}">${fmtDM(fk)}</text><text class="ax" x="${W - R}" y="${H - 7}" text-anchor="end">${fmtDM(lk)}</text></svg></div>
    <p class="chart-cap" id="cap-${id}">${esc(lp.lab || fmtS(lp.k))}: <b>${esc(lp.txt)}</b></p>`;
}
function bucketize(rows, per) {
  if (per <= 62) return rows.map(r => Object.assign({ lab: fmtS(r.k) }, r));
  const map = new Map();
  rows.forEach(r => { const w = weekStart(r.k); if (!map.has(w)) map.set(w, []); map.get(w).push(r); });
  return [...map.entries()].map(([w, list]) => { const has = list.filter(x => x.v > 0); return { k: w, v: has.length ? has.reduce((s, x) => s + x.v, 0) / has.length : 0, lab: 'неделя с ' + fmtDM(w), avg: true }; });
}
function barChart(id, rows, o) {
  const H = 150, L = 8, R = 8, T = 14, B = 22, W = CW;
  const max = Math.max(o.goal ? o.goal * 1.15 : 0, ...rows.map(r => r.v), o.min || 1);
  const n = rows.length, bw = (W - L - R) / n, Y = v => T + (1 - v / max) * (H - T - B);
  const c = o.color || 'var(--accent)', fmt = o.fmt || f0;
  let s = '';
  rows.forEach((r, i) => {
    const x = L + i * bw + bw * 0.18, w = Math.max(1, bw * 0.64), last = i === n - 1;
    if (r.v > 0) { const y = Y(r.v); s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(H - B - y).toFixed(1)}" rx="${Math.min(4, w / 2).toFixed(1)}" fill="${c}" fill-opacity="${last ? 1 : 0.6}"/>`; }
    else s += `<rect x="${x.toFixed(1)}" y="${(H - B - 2).toFixed(1)}" width="${w.toFixed(1)}" height="2" fill="var(--line)"/>`;
    s += `<rect class="hit" x="${(L + i * bw).toFixed(1)}" y="${T}" width="${bw.toFixed(1)}" height="${H - T - B}" data-a="tip" data-c="${id}" data-d="${esc(r.lab)}" data-v="${esc(r.v > 0 ? fmt(r.v) + (o.unit ? ' ' + o.unit : '') + (r.avg ? ' в среднем' : '') : 'нет записей')}"/>`;
  });
  if (o.goal) { const y = Y(o.goal).toFixed(1); s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--fg)" stroke-dasharray="4 4" stroke-opacity=".5"/><text class="ax" x="${W - R}" y="${(+y - 4).toFixed(1)}" text-anchor="end">${esc(o.goalLab || fmt(o.goal))}</text>`; }
  let labs = '';
  if (n <= 8) labs = rows.map((r, i) => `<text class="ax" x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - 7}" text-anchor="middle">${o.weekly ? fmtDM(r.k) : WDS[pk(r.k).getDay()]}</text>`).join('');
  else labs = `<text class="ax" x="${L}" y="${H - 7}">${fmtDM(rows[0].k)}</text><text class="ax" x="${W - R}" y="${H - 7}" text-anchor="end">${fmtDM(rows[n - 1].k)}</text>`;
  const lr = rows[n - 1];
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'Диаграмма')}">${s}${labs}</svg></div>
    <p class="chart-cap" id="cap-${id}">${esc(lr.lab)}: <b>${esc(lr.v > 0 ? fmt(lr.v) + (o.unit ? ' ' + o.unit : '') : 'нет записей')}</b></p>`;
}
function exProgress(per) {
  const counts = new Map();
  S.workouts.forEach(w => w.ex.forEach(e => { if (!e.sets.some(s => s.done)) return; const key = e.exId || ('n:' + e.name); const c = counts.get(key) || { n: 0, name: e.name, exId: e.exId }; c.n++; counts.set(key, c); }));
  if (!counts.size) return `<p class="muted small">Здесь появятся рабочие веса по каждому упражнению.</p>`;
  const opts = [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
  if (!ui.exSel || !counts.has(ui.exSel)) ui.exSel = opts[0][0];
  const sel = counts.get(ui.exSel), kind = kindOf(sel.exId), from = addDays(todayKey(), -(per - 1));
  const rows = [];
  S.workouts.filter(w => w.date >= from).sort((a, b) => a.date.localeCompare(b.date)).forEach(w => {
    const e = w.ex.find(x => (sel.exId && x.exId === sel.exId) || (!sel.exId && x.name === sel.name)); if (!e) return;
    const d = e.sets.filter(s => s.done); if (!d.length) return;
    let v, txt;
    const maxW = Math.max(...d.map(s => toNum(s.w) || 0)), maxR = Math.max(...d.map(s => toNum(s.r) || 0));
    if ((kind === 'w' || kind === 'bw') && maxW > 0) { v = maxW; txt = f1(maxW) + ' кг'; }
    else if (kind === 'c') { v = d.reduce((s, x) => s + (toNum(x.r) || 0), 0); txt = f0(v) + ' мин'; }
    else { v = maxR; txt = f0(maxR) + (kind === 't' ? ' сек' : ' повт'); }
    rows.push({ k: w.date, v, txt, sets: setsText(d, kind) });
  });
  const metric = (kind === 'w' || kind === 'bw') && rows.some(r => /кг/.test(r.txt)) ? 'Лучший вес в подходе' : kind === 'c' ? 'Минуты' : kind === 't' ? 'Лучшее время' : 'Лучший результат';
  return `<div class="field"><label for="exSel">Упражнение</label><select id="exSel" class="input" data-ch="exSel">${opts.map(([k, c]) => `<option value="${esc(k)}" ${k === ui.exSel ? 'selected' : ''}>${esc(c.name)} (${c.n})</option>`).join('')}</select></div>
    <p class="small muted">${metric}</p>
    ${rows.length ? lineChart('ex', rows, { fmt: f1, aria: 'Прогресс в упражнении', empty: 'За период одна тренировка — график появится после второй.' }) : `<p class="muted small">За выбранный период записей нет.</p>`}
    ${rows.length ? `<div>${rows.slice(-6).reverse().map(r => `<div class="list-row"><span class="num">${fmtS(r.k)}</span><span class="num muted small" style="text-align:right">${esc(r.sets)}</span></div>`).join('')}</div>` : ''}`;
}
function renderProgress() {
  const per = ui.per, keys = periodKeys(per), from = keys[0], t = todayKey(), tg = targets();
  const ws = S.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const wsP = ws.filter(w => w.date >= from);
  const ms = S.measures.slice().sort((a, b) => a.date.localeCompare(b.date));
  // сводка
  const eatRows = keys.map(k => ({ k, v: dayTotals(S.days[k]).kcal }));
  const logged = eatRows.filter(r => r.v > 0);
  const avgK = logged.length ? logged.reduce((s, r) => s + r.v, 0) / logged.length : 0;
  const stepRows = keys.map(k => ({ k, v: stepsFor(k).n }));
  const stepDays = stepRows.filter(r => r.v > 0), avgSt = stepDays.length ? stepDays.reduce((s, r) => s + r.v, 0) / stepDays.length : 0;
  const woP = S.workouts.filter(w => w.date >= from && w.date <= t);
  let wChange = null; if (wsP.length) { const before = ws.filter(w => w.date < from).pop() || wsP[0]; wChange = wsP[wsP.length - 1].kg - before.kg; }
  let h = `<header class="hd"><h1>Прогресс</h1></header>${demoBanner()}${segm('per', per, PERIODS, 'Период')}
  <section class="card"><h2>Сводка за ${per === 7 ? 'неделю' : per === 30 ? 'месяц' : per === 91 ? '3 месяца' : 'год'}</h2>
    <div class="stats"><div class="stat"><b class="${wChange == null ? '' : wChange < 0 ? 'down' : wChange > 0 ? 'up' : ''}">${wChange == null ? '—' : sgn(wChange) + ' кг'}</b><span>вес</span></div>
    <div class="stat"><b>${logged.length ? f0(avgK) : '—'}</b><span>ккал в день в среднем</span></div>
    <div class="stat"><b>${stepDays.length ? f0(avgSt) : '—'}</b><span>шагов в день в среднем</span></div>
    <div class="stat"><b>${woP.length}</b><span>${plural(woP.length, 'тренировка', 'тренировки', 'тренировок')}, ${f0(woP.reduce((s, w) => s + (w.minutes || 60), 0))} мин</span></div></div></section>`;
  // вес
  const cur = ws[ws.length - 1];
  h += `<section class="card"><div class="sec-head"><h2>Вес</h2><button class="btn btn-ghost btn-sm" data-a="openWeight">Записать вес</button></div>
    ${cur ? `<div class="stats three"><div class="stat"><b>${f1(cur.kg)}</b><span>сейчас, кг</span></div><div class="stat"><b>${f1(ws[0].kg)}</b><span>в начале, кг</span></div><div class="stat"><b class="${cur.kg < ws[0].kg ? 'down' : cur.kg > ws[0].kg ? 'up' : ''}">${sgn(cur.kg - ws[0].kg)}</b><span>за всё время</span></div></div>` : ''}
    ${lineChart('w', wsP.map(w => ({ k: w.date, v: w.kg, txt: f1(w.kg) + ' кг' })), { from, to: t, aria: 'График веса', empty: wsP.length ? 'За период одна запись — график появится после второй.' : 'За этот период записей веса нет.' })}
    ${ws.length ? `<div>${ws.slice(-4).reverse().map(w => `<div class="list-row"><span class="num">${fmtS(w.date)}</span><span class="row"><b class="num">${f1(w.kg)} кг</b><button class="x-btn" data-a="delWeight" data-d="${w.date}" aria-label="Удалить запись">${IC.x}</button></span></div>`).join('')}</div>` : ''}</section>`;
  // замеры
  const mLab = (MEAS.find(x => x[0] === ui.meas) || MEAS[0])[1];
  const mPts = ms.filter(m => m.date >= from && m[ui.meas] != null && m[ui.meas] !== '').map(m => ({ k: m.date, v: +m[ui.meas], txt: f1(m[ui.meas]) + ' см' }));
  const m0 = ms[0], m1 = ms[ms.length - 1];
  h += `<section class="card"><div class="sec-head"><h2>Замеры, см</h2><button class="btn btn-ghost btn-sm" data-a="openMeasures">Записать замеры</button></div>
    ${m1 ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Старт</th><th>Сейчас</th><th>Разница</th></tr></thead><tbody>${MEAS.map(([k, l]) => { const a = m0[k], b = m1[k]; const ok = a != null && a !== '' && b != null && b !== ''; const dv = ok ? b - a : 0; return `<tr><td>${l}</td><td>${a != null && a !== '' ? f1(a) : '—'}</td><td>${b != null && b !== '' ? f1(b) : '—'}</td><td class="${dv < 0 ? 'down' : dv > 0 ? 'up' : ''}">${ok && ms.length > 1 ? sgn(dv) : '—'}</td></tr>`; }).join('')}</tbody></table></div>
    <div class="chips scroll">${MEAS.map(([k, l]) => `<button class="chip" data-a="meas" data-v="${k}" aria-pressed="${ui.meas === k}">${esc(l.replace(' (бицепс)', ''))}</button>`).join('')}</div>
    ${lineChart('m', mPts, { from, to: t, aria: 'График замера: ' + mLab, empty: 'За этот период меньше двух замеров.' })}` : `<p class="muted small">Замеры показывают прогресс, даже когда вес стоит на месте. Делайте их раз в 2–4 недели.</p>`}</section>`;
  // фото прогресса
  h += photoSection();
  // питание
  const pAvg = k => logged.length ? logged.reduce((s, r) => s + dayTotals(S.days[r.k])[k], 0) / logged.length : 0;
  h += `<section class="card"><div class="sec-head"><h2>Питание</h2><span class="muted small">${logged.length} ${plural(logged.length, 'день', 'дня', 'дней')} с записями</span></div>
    ${barChart('k', bucketize(eatRows, per), { goal: tg && tg.kcal, goalLab: tg ? 'норма ' + f0(tg.kcal) : '', unit: 'ккал', aria: 'Калории по дням' })}
    <div class="stats three"><div class="stat"><b>${logged.length ? f0(pAvg('p')) : '—'}</b><span>белки, г${tg ? ' из ' + f0(tg.p) : ''}</span></div><div class="stat"><b>${logged.length ? f0(pAvg('f')) : '—'}</b><span>жиры, г${tg ? ' из ' + f0(tg.f) : ''}</span></div><div class="stat"><b>${logged.length ? f0(pAvg('c')) : '—'}</b><span>углеводы, г${tg ? ' из ' + f0(tg.c) : ''}</span></div></div></section>`;
  // расход и баланс
  const balRows = logged.map(r => { const b = burnFor(r.k); return b ? { k: r.k, eat: r.v, burn: b.total } : null; }).filter(Boolean);
  if (balRows.length) {
    const avgBal = balRows.reduce((s, r) => s + r.eat - r.burn, 0) / balRows.length;
    const ptsE = balRows.map(r => ({ k: r.k, v: r.eat, txt: `съедено ${f0(r.eat)}, расход ${f0(r.burn)} ккал` }));
    const ptsB = balRows.map(r => ({ k: r.k, v: r.burn }));
    h += `<section class="card"><div class="sec-head"><h2>Съедено и потрачено</h2><span class="pill ${avgBal < -50 ? (S.profile.goal === 'gain' ? 'warn' : 'good') : avgBal > 50 ? (S.profile.goal === 'lose' ? 'warn' : 'good') : ''}">${avgBal < -50 ? 'дефицит' : avgBal > 50 ? 'профицит' : 'баланс'} ${f0(Math.abs(avgBal))} ккал/день</span></div>
      <div class="legend"><span><i class="dot" style="background:var(--accent)"></i>съедено</span><span><i class="dot" style="background:var(--prot)"></i>расход (пунктир)</span></div>
      ${lineChart('b', ptsE, { pts2: ptsB, color2: 'var(--prot)', from, to: t, fmt: f0, aria: 'Съедено и потрачено по дням', empty: 'Нужно хотя бы два дня с записями еды.' })}
      <p class="hint">Расход — оценка: обмен веществ, шаги и тренировки. Подробнее — в статье «Как считаются калории».</p></section>`;
  }
  // шаги
  h += `<section class="card"><div class="sec-head"><h2>Шаги</h2><span class="muted small">цель ${f0(stepGoal())}</span></div>
    ${barChart('s', bucketize(stepRows, per), { goal: stepGoal(), goalLab: 'цель', color: 'var(--carb)', unit: 'шагов', aria: 'Шаги по дням' })}
    <div class="stats three"><div class="stat"><b>${stepDays.length ? f0(avgSt) : '—'}</b><span>в среднем</span></div><div class="stat"><b>${stepDays.length ? f0(Math.max(...stepDays.map(r => r.v))) : '—'}</b><span>лучший день</span></div><div class="stat"><b>${stepRows.filter(r => r.v >= stepGoal()).length}</b><span>${plural(stepRows.filter(r => r.v >= stepGoal()).length, 'день', 'дня', 'дней')} с целью</span></div></div></section>`;
  // вода
  const wRows = keys.map(k => ({ k, v: (S.days[k] && S.days[k].water || 0) / 1000 }));
  h += `<section class="card"><div class="sec-head"><h2>Вода</h2><span class="muted small">цель ${f1(waterTarget() / 1000)} л</span></div>
    ${barChart('wa', bucketize(wRows, per), { goal: waterTarget() / 1000, goalLab: 'цель', color: 'var(--water)', fmt: f1, unit: 'л', min: 0.5, aria: 'Вода по дням' })}</section>`;
  // тренировки по неделям
  const nW = Math.max(4, Math.ceil(per / 7)), wk0 = weekStart(t), wkRows = [];
  for (let i = nW - 1; i >= 0; i--) { const s = addDays(wk0, -7 * i), e = addDays(s, 6); wkRows.push({ k: s, v: S.workouts.filter(w => w.date >= s && w.date <= e).length, lab: 'неделя с ' + fmtDM(s) }); }
  h += `<section class="card"><div class="sec-head"><h2>Тренировки по неделям</h2><span class="muted small">план ${S.program.days.length} в неделю</span></div>
    ${barChart('wk', wkRows, { goal: S.program.days.length, goalLab: 'план', color: 'var(--accent)', unit: 'трен.', min: 3, weekly: true, aria: 'Тренировки по неделям' })}</section>`;
  // упражнения
  h += `<section class="card"><h2>Рабочие веса</h2>${exProgress(per)}</section>`;
  // дневник по дням
  const jr = keys.slice().reverse().map(k => {
    const d = S.days[k], eat = dayTotals(d).kcal, st = stepsFor(k).n, wo = S.workouts.filter(w => w.date === k), wt = ws.find(w => w.date === k);
    const parts = [];
    if (eat > 0) parts.push(f0(eat) + ' ккал');
    if (st > 0) parts.push(f0(st) + ' шагов');
    if (d && d.water) parts.push('вода ' + f1(d.water / 1000) + ' л');
    wo.forEach(w => parts.push(w.dayName + ', ' + f0(w.minutes || 60) + ' мин'));
    if (wt) parts.push('вес ' + f1(wt.kg) + ' кг');
    if (noteOf(k)) parts.push('комментарий тренера');
    return parts.length ? `<button class="jr" data-a="gotoDay" data-k="${k}"><b class="num">${fmtS(k)}</b><span>${esc(parts.join(' · '))}</span></button>` : '';
  }).filter(Boolean).slice(0, 60);
  h += `<section class="card"><h2>Дневник по дням</h2>${jr.length ? `<div>${jr.join('')}</div>` : `<p class="muted small">За этот период записей нет.</p>`}</section>`;
  return h;
}
function sheetWeight() {
  const t = todayKey(), cur = S.weights[S.weights.length - 1];
  return `${sheetHead('Записать вес')}
    <div class="grid2"><div class="field"><label for="wDate">Дата</label><input id="wDate" class="input" type="date" value="${t}" max="${t}"></div><div class="field"><label for="wKg">Вес, кг</label><input id="wKg" class="input num" inputmode="decimal" placeholder="${cur ? esc(f1(cur.kg)) : '67,5'}"></div></div>
    <p class="hint">Утром натощак, 1–2 раза в неделю. Вес колеблется на 0,5–1 кг день ото дня — смотрите на тенденцию.</p>
    <button class="btn btn-primary" data-a="saveWeight">Записать</button>`;
}
function sheetMeasures() {
  const t = todayKey(), m1 = S.measures[S.measures.length - 1];
  return `${sheetHead('Записать замеры')}
    <div class="field"><label for="mDate">Дата</label><input id="mDate" class="input" type="date" value="${t}" max="${t}"></div>
    <div class="grid2">${MEAS.map(([k, l]) => `<div class="field"><label for="m_${k}">${l}, см</label><input id="m_${k}" class="input num" inputmode="decimal" placeholder="${m1 && m1[k] ? esc(f1(m1[k])) : ''}"></div>`).join('')}</div>
    <p class="hint">Талия — на уровне пупка на выдохе. Бёдра — по самым выступающим точкам. Бедро и рука — правые; рука — середина между плечом и локтем, рука расслаблена.</p>
    <button class="btn btn-primary" data-a="saveMeasures">Сохранить</button>`;
}

/* ================= ПРОФИЛЬ ================= */
function normHtml() {
  const tg = targets(), a = autoTargets(S.profile);
  if (!tg) return `<div class="norm"><p class="muted small">Заполните возраст, рост и вес — норма рассчитается автоматически.</p></div>`;
  return `<div class="norm"><span class="eyebrow">Дневная норма${tg.manual ? ' от тренера' : ''}</span><b class="big">${f0(tg.kcal)} ккал</b>
    <p class="num"><i class="dot" style="background:var(--prot)"></i>Белки ${f0(tg.p)} г · <i class="dot" style="background:var(--fat)"></i>Жиры ${f0(tg.f)} г · <i class="dot" style="background:var(--carb)"></i>Углеводы ${f0(tg.c)} г</p>
    ${!tg.manual && a ? `<p class="small muted">Базовый обмен ${f0(a.bmr)} ккал, с учётом активности ${f0(a.tdee)} ккал${S.profile.goal === 'lose' ? ', минус 15% для снижения веса' : S.profile.goal === 'gain' ? ', плюс 10% для набора' : ''}.${a.floored ? ' Норма не опускается ниже ' + (S.profile.sex === 'm' ? '1 500' : '1 200') + ' ккал.' : ''}</p>` : ''}</div>`;
}
function buildReport(n, detail) {
  const t = todayKey(), from = addDays(t, -(n - 1)), tg = targets(), p = S.profile, L = [];
  L.push(`Отчёт${p.name ? ': ' + p.name : ''} · ${fmtD(from)} — ${fmtD(t)}`);
  if (tg) L.push(`Норма: ${f0(tg.kcal)} ккал · Б ${f0(tg.p)} · Ж ${f0(tg.f)} · У ${f0(tg.c)}`);
  L.push('', 'ПИТАНИЕ И АКТИВНОСТЬ (съедено / расход ккал · Б/Ж/У · шаги · вода)');
  let lg = 0, sk = 0, sp = 0, bal = 0, nb2 = 0, stS = 0, stN = 0;
  for (let i = 0; i < n; i++) {
    const k = addDays(from, i), d = S.days[k], has = d && d.items.length, tt = dayTotals(d), b = burnFor(k), st = stepsFor(k).n;
    if (has) { lg++; sk += tt.kcal; sp += tt.p; if (b) { bal += tt.kcal - b.total; nb2++; } }
    if (st > 0) { stS += st; stN++; }
    const parts = [has ? `${f0(tt.kcal)}${b ? ' / ' + f0(b.total) : ''} · ${f0(tt.p)}/${f0(tt.f)}/${f0(tt.c)}` : 'еда не записана'];
    if (st > 0) parts.push(f0(st) + ' шагов');
    if (d && d.water) parts.push('вода ' + f1(d.water / 1000) + ' л');
    L.push(`${fmtS(k)} — ${parts.join(' · ')}`);
  }
  if (lg) L.push(`Среднее за ${lg} дн. с записями: ${f0(sk / lg)} ккал, белок ${f0(sp / lg)} г${nb2 ? `, ${bal / nb2 < 0 ? 'дефицит' : 'профицит'} ${f0(Math.abs(bal / nb2))} ккал` : ''}`);
  if (stN) L.push(`Шаги в среднем: ${f0(stS / stN)} в день`);
  const wo = S.workouts.filter(w => w.date >= from && w.date <= t).sort((a, b) => a.date.localeCompare(b.date));
  L.push('', `ТРЕНИРОВКИ: ${wo.length}`);
  wo.forEach(w => {
    L.push(`• ${fmtS(w.date)} — ${w.dayName}, ${f0(w.minutes || 60)} мин`);
    w.ex.forEach(e => { const tx = setsText(e.sets.filter(s => s.done), kindOf(e.exId)); if (tx) L.push(`  ${e.name}: ${tx}`); });
    if (w.note) L.push('  Заметка: ' + w.note);
  });
  const ws = S.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (ws.length) { const last = ws[ws.length - 1], inP = ws.filter(x => x.date >= from);
    L.push('', `ВЕС: ${f1(last.kg)} кг (${fmtS(last.date)})${inP.length > 1 ? `, за период ${sgn(last.kg - inP[0].kg)} кг` : ''}${ws.length > 1 ? `, с начала ${sgn(last.kg - ws[0].kg)} кг` : ''}`); }
  const ms = S.measures.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (ms.length) { const m1 = ms[ms.length - 1], m0 = ms[0];
    L.push(`ЗАМЕРЫ (${fmtS(m1.date)}): ` + MEAS.filter(([k]) => m1[k] != null && m1[k] !== '').map(([k, l]) => `${l.toLowerCase()} ${f1(m1[k])}${ms.length > 1 && m0[k] != null && m0[k] !== '' ? ` (${sgn(m1[k] - m0[k])})` : ''}`).join(', ')); }
  if (detail) { L.push('', 'СПИСОК ПРОДУКТОВ');
    for (let i = 0; i < n; i++) { const k = addDays(from, i), d = S.days[k]; if (!d || !d.items.length) continue; L.push(fmtS(k));
      MEALS.forEach(m => { const its = d.items.filter(x => x.meal === m); if (its.length) L.push(`  ${m}: ` + its.map(x => x.manual ? `${x.name} (${f0(x.kcal)} ккал)` : `${x.name} ${f0(x.grams)} г`).join(', ')); }); } }
  return L.join('\n');
}
function renderProfile() {
  const p = S.profile, opt = (arr, v) => arr.map(([k, l]) => `<option value="${k}" ${String(v) === k ? 'selected' : ''}>${l}</option>`).join('');
  const coachMode = MODE === 'coach';
  return `<header class="hd"><h1>Профиль</h1></header>${demoBanner()}
  ${linkCard()}
  <section class="card"><h2>Данные и норма</h2>
    <div class="grid2">
      <div class="field span2"><label for="pf_name">Имя</label><input id="pf_name" class="input" data-in="pf" data-f="name" value="${esc(p.name)}"></div>
      <div class="field"><label for="pf_sex">Пол</label><select id="pf_sex" class="input" data-ch="pf" data-f="sex">${opt([['f', 'Женский'], ['m', 'Мужской']], p.sex)}</select></div>
      <div class="field"><label for="pf_age">Возраст</label><input id="pf_age" class="input num" inputmode="numeric" data-in="pf" data-f="age" value="${esc(p.age)}"></div>
      <div class="field"><label for="pf_height">Рост, см</label><input id="pf_height" class="input num" inputmode="decimal" data-in="pf" data-f="height" value="${esc(p.height)}"></div>
      <div class="field"><label for="pf_weight">Вес, кг</label><input id="pf_weight" class="input num" inputmode="decimal" data-in="pf" data-f="weight" value="${esc(p.weight)}"></div>
      <div class="field span2"><label for="pf_act">Активность</label><select id="pf_act" class="input" data-ch="pf" data-f="act">${opt(ACTS, p.act)}</select></div>
      <div class="field span2"><label for="pf_goal">Цель</label><select id="pf_goal" class="input" data-ch="pf" data-f="goal">${opt(GOALS, p.goal)}</select></div>
    </div>
    <div id="normBox">${normHtml()}</div>
    <label class="check"><input type="checkbox" data-ch="pfManual" ${p.manual ? 'checked' : ''}><span>Норму задаёт тренер<br><span class="small muted">Тогда расчёт выше заменяется цифрами тренера</span></span></label>
    ${p.manual ? `<div class="grid2"><div class="field"><label for="pf_mk">Калории</label><input id="pf_mk" class="input num" inputmode="numeric" data-in="pf" data-f="mk" value="${esc(p.mk)}"></div>
      <div class="field"><label for="pf_mp">Белки, г</label><input id="pf_mp" class="input num" inputmode="numeric" data-in="pf" data-f="mp" value="${esc(p.mp)}"></div>
      <div class="field"><label for="pf_mf">Жиры, г</label><input id="pf_mf" class="input num" inputmode="numeric" data-in="pf" data-f="mf" value="${esc(p.mf)}"></div>
      <div class="field"><label for="pf_mc">Углеводы, г</label><input id="pf_mc" class="input num" inputmode="numeric" data-in="pf" data-f="mc" value="${esc(p.mc)}"></div></div>` : ''}
  </section>
  <section class="card"><h2>Цели и тренировки</h2>
    <div class="grid2">
      <div class="field"><label for="pf_water">Вода в день, мл</label><input id="pf_water" class="input num" inputmode="numeric" data-in="pf" data-f="water" value="${esc(p.water)}" placeholder="${waterTarget()}"></div>
      <div class="field"><label for="pf_steps">Шаги в день</label><input id="pf_steps" class="input num" inputmode="numeric" data-in="pf" data-f="stepGoal" value="${esc(p.stepGoal)}"></div>
      <div class="field span2"><label for="pf_rest">Отдых между подходами</label><select id="pf_rest" class="input" data-ch="pf" data-f="rest">${opt([['0', 'Без таймера'], ['60', '1 минута'], ['90', '1,5 минуты'], ['120', '2 минуты'], ['180', '3 минуты']], p.rest)}</select></div>
    </div>
    ${NB && !coachMode ? `<p class="small muted">Подсчёт шагов: ${stepsStatus === 'ok' ? 'включён, телефон считает шаги сам.' : stepsStatus === 'none' ? 'в телефоне нет датчика шагов — вводите шаги вручную.' : 'нужно разрешение.'}</p>${stepsStatus === 'need' ? `<button class="btn btn-ghost" data-a="stepsAllow">Разрешить подсчёт шагов</button>` : stepsStatus === 'denied' ? `<button class="btn btn-ghost" data-a="stepsSettings">Открыть настройки приложения</button>` : ''}` : ''}
  </section>
  ${coachMode ? '' : remCard()}
  <section class="card"><h2>Отчёт тренеру</h2><p class="small muted">Питание, расход, шаги, вода, тренировки с весами, вес и замеры.</p>
    ${segm('repDays', ui.repDays, [[7, '7 дней'], [14, '14 дней'], [30, '30 дней']], 'Период')}
    <label class="check"><input type="checkbox" data-ch="repDetail" ${ui.repDetail ? 'checked' : ''}><span>Добавить список всех продуктов</span></label>
    <button class="btn btn-primary" data-a="makeReport">Сформировать отчёт</button>
    ${ui.report ? `<textarea id="reportTa" class="input" rows="10" readonly>${esc(ui.report)}</textarea><div class="row">${NB ? `<button class="btn btn-primary grow" data-a="shareReport">Отправить</button>` : ''}<button class="btn btn-ghost grow" data-a="copyReport">Скопировать</button></div>` : ''}
  </section>
  <section class="card"><div class="sec-head"><h2>Мои блюда</h2><button class="btn btn-ghost btn-sm" data-a="dishNew">${IC.plus} Создать</button></div>
    <p class="small muted">Домашнее блюдо собирается из продуктов один раз — потом его можно добавить одним касанием или вписать текстом, как обычный продукт.</p>
    ${dishList().length ? `<div>${dishList().map(c => `<div class="list-row"><span>${esc(c.name)}<br><span class="small muted num">${f0(c.kcal)} ккал на 100 г · порция ${f0(c.portion)} г · ${c.recipe.items.length} ${plural(c.recipe.items.length, 'продукт', 'продукта', 'продуктов')}</span></span><span class="row nowrap"><button class="x-btn" data-a="dishEdit" data-id="${esc(c.id)}" aria-label="Изменить блюдо">${IC.edit}</button><button class="x-btn" data-a="delCustom" data-id="${esc(c.id)}" aria-label="Удалить блюдо">${IC.x}</button></span></div>`).join('')}</div>` : ''}
  </section>
  <section class="card"><h2>Мои продукты</h2><p class="small muted">Если чего-то нет в базе, добавьте с упаковки или по штрихкоду в окне «Добавить еду». Потом этот продукт можно вписывать текстом, как обычный.</p>
    ${S.custom.some(c => !c.recipe) ? `<div>${S.custom.filter(c => !c.recipe).map(c => `<div class="list-row"><span>${esc(c.name)}<br><span class="small muted num">${f0(c.kcal)} ккал · Б ${f1(c.p)} · Ж ${f1(c.f)} · У ${f1(c.c)} на 100 г${c.piece ? ` · 1 шт ${f0(c.piece)} г` : ''}${c.barcode ? ` · штрихкод ${esc(c.barcode)}` : ''}</span></span><button class="x-btn" data-a="delCustom" data-id="${esc(c.id)}" aria-label="Удалить продукт">${IC.x}</button></div>`).join('')}</div>` : ''}
    <div class="grid2"><div class="field span2"><label for="cName">Название</label><input id="cName" class="input" placeholder="Например: батончик Bombbar"></div>
      <div class="field"><label for="cKcal">Ккал на 100 г</label><input id="cKcal" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="cPiece">Вес 1 шт, г</label><input id="cPiece" class="input num" inputmode="decimal" placeholder="если штучный"></div>
      <div class="field"><label for="cP">Белки на 100 г</label><input id="cP" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="cF">Жиры на 100 г</label><input id="cF" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="cC">Углеводы на 100 г</label><input id="cC" class="input num" inputmode="decimal"></div></div>
    <button class="btn btn-ghost" data-a="addCustom">Добавить продукт</button>
  </section>
  ${coachMode ? '' : `<section class="card"><h2>Резервная копия</h2><p class="small muted">Записи хранятся на этом телефоне. Если удалить приложение или сменить телефон, они пропадут. Раз в неделю копируйте код и сохраняйте его, например, в «Избранном» Telegram — по нему всё восстановится.</p>
    ${ui.backup ? `<textarea id="backupTa" class="input code" rows="4" readonly>${esc(ui.backup)}</textarea><button class="btn btn-ghost" data-a="copyBackup">Скопировать код</button>` : `<button class="btn btn-ghost" data-a="makeBackup">Получить код копии</button>`}
    <div class="field"><label for="restoreTa">Восстановить из кода</label><textarea id="restoreTa" class="input code" rows="3" placeholder="BAK1:…"></textarea></div>
    ${ui.confirm === 'restore' ? `<div class="confirm"><p>Все текущие записи заменятся записями из копии. Продолжить?</p><div class="row"><button class="btn btn-warn btn-sm" data-a="restoreYes">Да, восстановить</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>` : `<button class="btn btn-ghost" data-a="restore">Восстановить</button>`}
  </section>`}
  <section class="card"><h2>О приложении</h2>
    <p class="small muted">В базе ${FOODS.length} продуктов и блюд и ${EXERCISES.length} упражнений. Для готовых блюд калорийность средняя: домашний борщ или котлета могут отличаться на 10–20%. Продукты, которые едите часто, лучше добавить с упаковки в «Мои продукты».</p>
    ${coachMode ? '' : ui.confirm === 'wipe' ? `<div class="confirm"><p>Удалить все записи с этого телефона? Это нельзя отменить.${S.link ? ' Связь с тренером тоже отключится, у тренера записи останутся.' : ''}</p><div class="row"><button class="btn btn-warn btn-sm" data-a="wipeYes">Удалить всё</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>` : `<button class="btn btn-warn" data-a="wipe">Удалить все данные</button>`}
  </section>`;
}

/* ================= Коды ================= */
function b64e(str) { const bytes = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
function b64d(b) { const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
function decodeCode(text, prefixes) {
  const t = String(text || '').replace(/\s+/g, '');
  for (const pf of prefixes) { const i = t.indexOf(pf); if (i >= 0) { try { return { pf, data: JSON.parse(b64d(t.slice(i + pf.length))) }; } catch (e) { return null; } } }
  return null;
}

/* ================= Облако: Firebase ================= */
const FB_CONFIG = {
  apiKey: 'AIzaSyDWKPIAy0Stj1qGM-0lthgus33mJKTByGs',
  authDomain: 'trener-bca36.firebaseapp.com',
  projectId: 'trener-bca36',
  storageBucket: 'trener-bca36.firebasestorage.app',
  messagingSenderId: '509917504553',
  appId: '1:509917504553:web:858b7728f34cc861a86838'
};
const FB = {
  ok: false, auth: null, db: null,
  init() {
    if (this.ok) return true;
    if (!window.firebase || !firebase.initializeApp) return false;
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FB_CONFIG);
      this.auth = firebase.auth(); this.db = firebase.firestore();
      try { const p = this.db.enablePersistence({ synchronizeTabs: false }); if (p && p.catch) p.catch(() => { }); } catch (e) { /* без офлайн-кэша */ }
      this.ok = true;
    } catch (e) { this.ok = false; }
    return this.ok;
  }
};
function fbErr(e) {
  const c = String((e && e.code) || '');
  if (c.includes('permission-denied')) return 'Нет доступа. Возможно, код уже использован или тренер выдал новый.';
  if (c.includes('not-found')) return 'Карточка не найдена. Попросите у тренера новый код.';
  if (c.includes('unavailable') || c.includes('network')) return 'Нет связи с сервером. Проверьте интернет.';
  if (c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('invalid-login')) return 'Неверная почта или пароль.';
  if (c.includes('user-not-found')) return 'Такого аккаунта нет. Нажмите «Создать аккаунт».';
  if (c.includes('email-already-in-use')) return 'Аккаунт с этой почтой уже есть — нажмите «Войти».';
  if (c.includes('weak-password')) return 'Пароль слишком короткий: нужно минимум 6 символов.';
  if (c.includes('invalid-email')) return 'Почта указана с ошибкой.';
  if (c.includes('too-many-requests')) return 'Слишком много попыток. Подождите пару минут.';
  if (c.includes('operation-not-allowed') || c.includes('admin-restricted')) return 'В Firebase не включён этот способ входа: Authentication → Sign-in method.';
  return (e && e.message) ? String(e.message) : String(e);
}

/* ---------- Синхронизация дневника ---------- */
const ROOT = ['profile', 'program', 'weights', 'measures', 'custom', 'customEx', 'notes'];   // notes пишет только тренер
function cj(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(cj).join(',') + ']';
  return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + cj(v[k])).join(',') + '}';
}
const strip = (o, keys) => { const r = {}; for (const k in o) if (!keys.includes(k)) r[k] = o[k]; return r; };
const jroot = f => cj(S[f]);
const jday = d => cj(strip(d, ['u']));
const jwo = w => cj(strip(w, ['u']));
let pendingRender = false;
const typing = () => { const ae = document.activeElement; return !!(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && $('#view').contains(ae)); };
function refreshAfterSync() { if (ui.sheet || typing()) { pendingRender = true; refreshSyncLine(); return; } render(); }
function syncText() {
  switch (Sync.status) {
    case 'ok': return 'Синхронизировано';
    case 'pending': return 'Отправляю изменения… Если нет интернета, отправлю позже.';
    case 'connecting': return 'Подключаюсь…';
    case 'lost': return 'Связь с тренером потеряна. ' + (Sync.err || '');
    case 'error': return 'Нет связи: ' + (Sync.err || 'проверьте интернет') + ' Повторю попытку.';
    default: return 'Не подключено';
  }
}
function refreshSyncLine() { const el = $('#syncLine'); if (el) el.textContent = syncText(); }

const Sync = {
  cid: null, role: null, unsubs: [], shadow: {}, last: {}, inflight: {}, got: {}, ready: false, timer: null, retry: null, status: 'off', err: '', touchDays: [],
  shKey() { return KEY + '-sh-' + this.role + '-' + this.cid; },
  ref() { return FB.db.collection('clients').doc(this.cid); },
  start(cid, role) {
    this.stop();
    if (!FB.init()) { this.status = 'error'; this.err = 'Нет связи с сервером.'; return; }
    this.cid = cid; this.role = role; this.shadow = lsJson(this.shKey()) || {}; this.inflight = {}; this.got = {}; this.ready = false;
    this.status = 'connecting'; this.err = '';
    this.initLast();
    const ref = this.ref();
    const onErr = e => { this.status = String((e && e.code) || '').includes('permission') ? 'lost' : 'error'; this.err = fbErr(e); refreshAfterSync(); };
    this.unsubs.push(ref.onSnapshot(s => this.onRoot(s), onErr));
    this.unsubs.push(ref.collection('days').where('date', '>=', addDays(todayKey(), -400)).onSnapshot(s => this.onDays(s), onErr));
    this.unsubs.push(ref.collection('workouts').onSnapshot(s => this.onWorkouts(s), onErr));
    const phs = this.phScope = phScope();
    this.unsubs.push(ref.collection('photos').onSnapshot(s => PH.onSnap(s, cid, phs), () => { }));
  },
  stop() {
    this.unsubs.forEach(u => { try { u(); } catch (e) { /* уже отписано */ } });
    this.unsubs = []; this.cid = null; this.ready = false; this.status = 'off'; this.err = '';
    clearTimeout(this.timer); clearTimeout(this.retry);
  },
  initLast() {
    this.last = {};
    ROOT.forEach(f => { this.last['r:' + f] = jroot(f); });
    for (const k in S.days) this.last['d:' + k] = jday(S.days[k]);
    S.workouts.forEach(w => { this.last['w:' + w.id] = jwo(w); });
  },
  // помечает изменённые части временем изменения; вызывается при каждом сохранении
  touch(full) {
    if (!this.cid) return;
    const now = Date.now(); S.u = S.u || {};
    const chk = (key, j, fn) => { if (this.last[key] !== j) { this.last[key] = j; fn(); } };
    ROOT.forEach(f => chk('r:' + f, jroot(f), () => { S.u[f] = now; }));
    const keys = full ? Object.keys(S.days) : [ui.date, todayKey(), addDays(todayKey(), -1)].concat(this.touchDays);
    this.touchDays = [];
    new Set(keys).forEach(k => { const d = S.days[k]; if (d) chk('d:' + k, jday(d), () => { d.u = now; }); });
    S.workouts.forEach(w => chk('w:' + w.id, jwo(w), () => { w.u = now; }));
    this.schedule(1200);
  },
  schedule(ms) { clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), ms); },
  async push() {
    if (!this.cid || !this.ready || this.status === 'lost') return;
    const ref = this.ref(), jobs = [], by = this.role, now = Date.now(), coach = this.role === 'coach';
    const track = (keys, p) => {
      keys.forEach(([k, j]) => { this.inflight[k] = j; });
      jobs.push(p.then(() => { keys.forEach(([k, j]) => { this.shadow[k] = j; }); })
        .finally(() => { keys.forEach(([k, j]) => { if (this.inflight[k] === j) delete this.inflight[k]; }); }));
    };
    const dirty = (key, j) => j !== this.shadow[key] && this.inflight[key] !== j;
    // общие поля: профиль, программа, вес, замеры, свои продукты и упражнения
    const upd = {}, rk = [];
    ROOT.forEach(f => {
      const key = 'r:' + f, j = jroot(f), lu = S.u && S.u[f];
      if (!dirty(key, j) || (coach && !lu) || (!coach && f === 'notes')) return;
      upd['d.' + f] = JSON.parse(j); upd['u.' + f] = lu || now; rk.push([key, j]);
    });
    if (rk.length) { upd.seen = now; track(rk, ref.update(upd)); }
    // дни
    for (const k in S.days) {
      const d = S.days[k], key = 'd:' + k, j = jday(d);
      if (!dirty(key, j) || (coach && !d.u)) continue;
      const data = JSON.parse(j); data.date = k; data.u = d.u || now; data.sb = by;
      track([[key, j]], ref.collection('days').doc(k).set(data));
    }
    // тренировки и удалённые тренировки
    const ids = new Set();
    S.workouts.forEach(w => {
      ids.add(w.id); const key = 'w:' + w.id, j = jwo(w);
      if (!dirty(key, j) || (coach && !w.u)) return;
      const data = JSON.parse(j); data.u = w.u || now; data.sb = by;
      track([[key, j]], ref.collection('workouts').doc(w.id).set(data));
    });
    Object.keys(this.shadow).forEach(key => {
      if (!key.startsWith('w:') || this.shadow[key] === 'DEL' || ids.has(key.slice(2)) || this.inflight[key] === 'DEL') return;
      track([[key, 'DEL']], ref.collection('workouts').doc(key.slice(2)).set({ del: true, u: now, sb: by }));
    });
    if (!jobs.length) { this.status = 'ok'; refreshSyncLine(); return; }
    this.status = 'pending'; refreshSyncLine();
    const res = await Promise.allSettled(jobs);
    if (!this.cid) return;
    lsSet(this.shKey(), JSON.stringify(this.shadow));
    const bad = res.find(r => r.status === 'rejected');
    if (bad) {
      this.status = String((bad.reason && bad.reason.code) || '').includes('permission') ? 'lost' : 'error';
      this.err = fbErr(bad.reason);
      clearTimeout(this.retry); if (this.status === 'error') this.retry = setTimeout(() => this.push(), 20000);
    } else this.status = 'ok';
    refreshSyncLine();
  },
  onRoot(snap) {
    if (!snap.exists) { this.status = 'lost'; this.err = 'Карточка удалена тренером.'; refreshAfterSync(); return; }
    const doc = snap.data() || {}, data = doc.d || {}, us = doc.u || {};
    let ch = false;
    if (this.role === 'client') {
      const me = FB.auth && FB.auth.currentUser;
      if (doc.ownerUid && me && doc.ownerUid !== me.uid) { this.status = 'lost'; this.err = 'Тренер выдал новый код — введите его в «Профиле».'; }
      if (S.link && doc.name && S.link.name !== doc.name) { S.link.name = doc.name; ch = true; }
    }
    ROOT.forEach(f => {
      if (!(f in data)) return;
      const key = 'r:' + f, j = cj(data[f]), ru = us[f] || 0, lu = (S.u && S.u[f]) || 0;
      if (j === jroot(f)) { this.shadow[key] = j; return; }
      if (ru > lu || (f === 'notes' && this.role === 'client')) {
        S[f] = f === 'profile' ? Object.assign(blankProfile(), data[f] || {}) : (data[f] == null ? (f === 'program' ? S[f] : f === 'notes' ? {} : []) : data[f]);
        S.u = S.u || {}; S.u[f] = ru; this.shadow[key] = j; this.last[key] = jroot(f); ch = true;
      }
    });
    this.got.root = true; this.after(ch);
  },
  onDays(snap) {
    let ch = false;
    snap.docChanges().forEach(c => {
      if (c.type === 'removed' || (c.doc.metadata && c.doc.metadata.hasPendingWrites)) return;
      const k = c.doc.id, r = c.doc.data() || {}, ru = r.u || 0, local = S.days[k], key = 'd:' + k;
      const body = strip(r, ['u', 'date', 'sb']), j = cj(body);
      if (local && j === jday(local)) { this.shadow[key] = j; if (ru > (local.u || 0)) local.u = ru; return; }
      if (!local || ru > (local.u || 0)) {
        if (!Array.isArray(body.items)) body.items = [];
        S.days[k] = Object.assign(body, { u: ru }); this.shadow[key] = j; this.last[key] = jday(S.days[k]); ch = true;
      }
    });
    this.got.days = true; this.after(ch);
  },
  onWorkouts(snap) {
    let ch = false;
    snap.docChanges().forEach(c => {
      if (c.type === 'removed' || (c.doc.metadata && c.doc.metadata.hasPendingWrites)) return;
      const id = c.doc.id, r = c.doc.data() || {}, ru = r.u || 0, key = 'w:' + id;
      const i = S.workouts.findIndex(w => w.id === id), local = i >= 0 ? S.workouts[i] : null;
      if (r.del) {
        if (!local || (local.u || 0) <= ru) { if (local) { S.workouts.splice(i, 1); ch = true; } this.shadow[key] = 'DEL'; delete this.last[key]; }
        return;
      }
      const body = strip(r, ['u', 'sb', 'del']); body.id = id; const j = cj(body);
      if (local && j === jwo(local)) { this.shadow[key] = j; if (ru > (local.u || 0)) local.u = ru; return; }
      if (!local || ru > (local.u || 0)) {
        if (!Array.isArray(body.ex)) body.ex = [];
        const w = Object.assign(body, { u: ru });
        if (local) S.workouts[i] = w; else S.workouts.push(w);
        this.shadow[key] = j; this.last[key] = jwo(w); ch = true;
      }
    });
    this.got.wo = true; this.after(ch);
  },
  after(ch) {
    if (!this.cid) return;
    if (ch) lsSet(storeKey(), JSON.stringify(S));
    lsSet(this.shKey(), JSON.stringify(this.shadow));
    const wasReady = this.ready;
    if (!wasReady && this.got.root && this.got.days && this.got.wo) {
      this.ready = true; if (this.status !== 'lost') this.status = 'ok';
      if (this.role === 'client') this.ref().update({ seen: Date.now() }).catch(() => { });
      PH.flush();
    }
    if (this.ready) this.schedule(wasReady ? 1500 : 300);
    if (ch || !wasReady) refreshAfterSync(); else refreshSyncLine();
  }
};

/* ---------- Тренер ---------- */
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() { const a = new Uint32Array(6); crypto.getRandomValues(a); let s = ''; a.forEach(x => { s += CODE_ABC[x % CODE_ABC.length]; }); return s; }
function ago(ts) {
  if (!ts) return 'ещё не заходила';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 2) return 'только что'; if (m < 60) return m + ' мин назад';
  const h = Math.round(m / 60); if (h < 24) return h + ' ч назад';
  const d = Math.round(h / 24); if (d === 1) return 'вчера'; return d + ' ' + plural(d, 'день', 'дня', 'дней') + ' назад';
}
const Coach = {
  async login(email, pass, create) {
    if (!FB.init()) throw new Error('Нет связи с сервером. Проверьте интернет.');
    if (FB.auth.currentUser) await FB.auth.signOut();
    const cred = create ? await FB.auth.createUserWithEmailAndPassword(email, pass) : await FB.auth.signInWithEmailAndPassword(email, pass);
    if (create) await FB.db.collection('coaches').doc(cred.user.uid).set({ email, createdAt: Date.now() }, { merge: true });
  },
  load() {
    const uid = CO.user.uid;
    if (CO.unsub) CO.unsub();
    CO.unsub = FB.db.collection('clients').where('coachUid', '==', uid).onSnapshot(s => {
      CO.clients = s.docs.map(d => {
        const x = d.data() || {}, ws = (x.d && x.d.weights) || [];
        return { id: d.id, name: x.name || 'Без имени', linked: !!x.ownerUid, invite: x.invite || '', seen: x.seen || 0, createdAt: x.createdAt || 0, weight: ws.length ? ws[ws.length - 1].kg : null };
      }).sort((a, b) => a.createdAt - b.createdAt);
      CO.ready = true; CO.err = '';
      const want = lsGet('tarelka-coach-cur');
      if (!CO.cur && !CO.autoOpened && want && CO.clients.some(c => c.id === want)) { CO.autoOpened = true; Coach.open(want); return; }
      CO.autoOpened = true;
      if (!CO.cur) render(); else refreshSyncLine();
    }, e => { CO.err = fbErr(e); CO.ready = true; if (!CO.cur) render(); });
  },
  async newInvite(cid) {
    let code = genCode();
    for (let i = 0; i < 5; i++) { const ex = await FB.db.collection('invites').doc(code).get(); if (!ex.exists) break; code = genCode(); }
    await FB.db.collection('invites').doc(code).set({ clientId: cid, coachUid: CO.user.uid, createdAt: Date.now() });
    return code;
  },
  async addClient(name) {
    const ref = FB.db.collection('clients').doc();
    await ref.set({ coachUid: CO.user.uid, ownerUid: null, name, invite: '', createdAt: Date.now(), seen: 0, d: {}, u: {} });
    const code = await Coach.newInvite(ref.id);
    await ref.update({ invite: code });
    return code;
  },
  async resetCode(cid) {
    const c = CO.clients.find(x => x.id === cid);
    const code = await Coach.newInvite(cid);
    await FB.db.collection('clients').doc(cid).update({ invite: code, ownerUid: null });
    if (c && c.invite) FB.db.collection('invites').doc(c.invite).delete().catch(() => { });
    return code;
  },
  async remove(cid) {
    const c = CO.clients.find(x => x.id === cid);
    await FB.db.collection('clients').doc(cid).delete();
    if (c && c.invite) FB.db.collection('invites').doc(c.invite).delete().catch(() => { });
    lsSet(KEY + '-c-' + cid, null); PH.clear('c-' + cid);
  },
  open(cid) {
    Sync.stop(); CO.cur = cid; lsSet('tarelka-coach-cur', cid);
    S = migrate(loadState()) || blankState(); S.demo = false;
    Object.assign(ui, { tab: 'today', date: todayKey(), sheet: null, confirm: null, editProg: false, report: '', backup: '' });
    Sync.start(cid, 'coach'); render(); window.scrollTo(0, 0);
  },
  close() { Sync.stop(); stopRest(); CO.cur = null; lsSet('tarelka-coach-cur', null); S = blankState(); ui.sheet = null; renderSheet(); render(); window.scrollTo(0, 0); },
  async logout() {
    Sync.stop(); if (CO.unsub) CO.unsub();
    Object.assign(CO, { unsub: null, cur: null, clients: [], user: null, ready: false, autoOpened: false });
    lsSet('tarelka-coach-cur', null);
    try { await FB.auth.signOut(); } catch (e) { /* уже вышли */ }
    render();
  }
};
function coachBar() {
  const c = CO.clients.find(x => x.id === CO.cur);
  return `<div class="coachbar"><span class="grow"><b>${esc(c ? c.name : 'Подопечная')}</b><span class="small muted" id="syncLine" style="display:block">${esc(syncText())}</span></span><button class="btn btn-ghost btn-sm" data-a="coachBack">Все подопечные</button></div>`;
}
function renderCoach() {
  const back = `<button class="btn-link" data-a="toClient">Перейти в режим дневника</button>`;
  if (!FB.init()) return `<header class="hd"><h1>Режим тренера</h1></header><div class="banner plain"><p>Нет связи с сервером. Проверьте интернет и откройте приложение снова.</p></div>${back}`;
  if (!CO.authChecked) return `<header class="hd"><h1>Режим тренера</h1></header><p class="muted">Загрузка…</p>`;
  if (!CO.user) {
    return `<header class="hd"><h1>Режим тренера</h1></header>
    <section class="card"><h2>Вход для тренера</h2>
      <div class="field"><label for="coEmail">Почта</label><input id="coEmail" class="input" type="email" autocomplete="username" value="${esc(ui.coEmail || '')}"></div>
      <div class="field"><label for="coPass">Пароль</label><input id="coPass" class="input" type="password" autocomplete="current-password"></div>
      ${CO.err ? `<p class="small warn-text">${esc(CO.err)}</p>` : ''}${CO.info ? `<p class="small">${esc(CO.info)}</p>` : ''}
      <div class="row"><button class="btn btn-primary grow" data-a="coLogin" ${CO.busy ? 'disabled' : ''}>Войти</button><button class="btn btn-ghost grow" data-a="coSignup" ${CO.busy ? 'disabled' : ''}>Создать аккаунт</button></div>
      <button class="btn-link" data-a="coForgot" ${CO.busy ? 'disabled' : ''}>Забыли пароль?</button>
      <p class="hint">Аккаунт создаётся один раз. Пароль — не короче 6 символов.</p></section>${back}`;
  }
  const list = CO.clients.map(c => `<section class="card"><div class="sec-head"><h2>${esc(c.name)}</h2><span class="pill ${c.linked ? 'ok' : ''}">${c.linked ? 'подключена' : 'ждёт код'}</span></div>
    ${c.linked ? `<p class="small muted">В приложении: ${ago(c.seen)}${c.weight ? ' · вес ' + f1(c.weight) + ' кг' : ''}</p>` : `<p class="small muted">Код для подключения:</p><p class="code-big">${esc(c.invite || '…')}</p><p class="hint">Подопечная вводит его в «Профиле» → «Тренер».</p>`}
    <div class="row"><button class="btn btn-primary btn-sm grow" data-a="coOpen" data-id="${c.id}">Открыть дневник</button>${!c.linked && c.invite ? `<button class="btn btn-ghost btn-sm" data-a="coCopy" data-code="${esc(c.invite)}">Скопировать код</button>` : ''}</div>
    ${CO.confirm === 'del:' + c.id ? `<div class="confirm"><p>Удалить карточку «${esc(c.name)}»? У тренера пропадёт доступ к её дневнику, у неё на телефоне записи останутся.</p><div class="row"><button class="btn btn-warn btn-sm" data-a="coDelYes" data-id="${c.id}">Удалить</button><button class="btn-link" data-a="coNo">Отмена</button></div></div>`
      : CO.confirm === 'code:' + c.id ? `<div class="confirm"><p>Выдать новый код? Старый перестанет работать, а телефон подопечной отключится, пока она не введёт новый.</p><div class="row"><button class="btn btn-primary btn-sm" data-a="coNewCodeYes" data-id="${c.id}">Выдать код</button><button class="btn-link" data-a="coNo">Отмена</button></div></div>`
      : `<div class="row"><button class="btn-link" data-a="coNewCode" data-id="${c.id}">Новый код</button><button class="btn-link warn-text" data-a="coDel" data-id="${c.id}">Удалить</button></div>`}</section>`).join('');
  return `<header class="hd"><h1>Мои подопечные</h1></header>
    ${CO.err ? `<div class="banner plain"><p>${esc(CO.err)}</p></div>` : ''}
    ${!CO.ready ? '<p class="muted">Загружаю список…</p>' : list || '<p class="muted">Пока никого нет. Добавьте первую подопечную.</p>'}
    <section class="card"><h2>Новая подопечная</h2><div class="row"><input id="coNewName" class="input grow" placeholder="Имя" autocomplete="off"><button class="btn btn-primary" data-a="coAdd" ${CO.busy ? 'disabled' : ''}>Добавить</button></div>
      <p class="hint">Появится код из 6 символов. Отправьте его подопечной.</p></section>
    <button class="btn btn-ghost" data-a="coLogout">Выйти из аккаунта тренера</button>
    <p class="small muted">Вы вошли как ${esc(CO.user.email || '')}</p>${back}`;
}
function linkCard() {
  if (MODE === 'coach') return '';
  if (!S.link) {
    return `<section class="card"><h2>Тренер</h2><p class="small muted">Введите код, который прислал тренер. Тренер будет видеть ваш дневник, а программа тренировок будет обновляться сама.</p>
      <div class="row"><input id="linkCode" class="input grow code-in" placeholder="Например, K7M2QX" autocomplete="off" autocapitalize="characters" maxlength="12"><button class="btn btn-primary" data-a="linkCode" ${ui.linkBusy ? 'disabled' : ''}>${ui.linkBusy ? 'Подключаю…' : 'Подключиться'}</button></div>
      <button class="btn-link" data-a="toCoach">Я тренер — войти</button></section>`;
  }
  return `<section class="card"><div class="sec-head"><h2>Тренер</h2><span class="pill ${Sync.status === 'ok' ? 'ok' : Sync.status === 'lost' ? 'warn' : ''}">${Sync.status === 'lost' ? 'нет связи' : 'подключено'}</span></div>
    <p class="small muted" id="syncLine">${esc(syncText())}</p>
    ${Sync.status === 'lost' ? `<div class="row"><input id="linkCode" class="input grow code-in" placeholder="Новый код" autocomplete="off" maxlength="12"><button class="btn btn-primary" data-a="linkCode" ${ui.linkBusy ? 'disabled' : ''}>Подключиться</button></div>` : ''}
    ${ui.confirm === 'unlink' ? `<div class="confirm"><p>Отключиться от тренера? Записи на телефоне останутся, но тренер перестанет их видеть.</p><div class="row"><button class="btn btn-warn btn-sm" data-a="unlinkYes">Отключиться</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>` : `<button class="btn-link" data-a="unlink">Отключиться от тренера</button>`}</section>`;
}

/* ---------- Запросы в интернет ---------- */
const httpCbs = {};
window.__httpDone = (id, code, text) => { const cb = httpCbs[id]; if (cb) { delete httpCbs[id]; cb({ code, text }); } };
function httpGet(url, headers, ms = 20000) {
  if (NB && typeof NB.httpGet === 'function') {
    return new Promise(res => {
      const id = uid(); httpCbs[id] = res;
      try { NB.httpGet(id, url, JSON.stringify(headers || {})); } catch (e) { delete httpCbs[id]; res({ code: -1, text: String(e) }); }
      setTimeout(() => { if (httpCbs[id]) { delete httpCbs[id]; res({ code: -1, text: 'timeout' }); } }, ms);
    });
  }
  // в браузере: заголовок User-Agent задать нельзя, поэтому запрос без заголовков
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, t = ctl ? setTimeout(() => ctl.abort(), ms) : 0;
  return fetch(url, ctl ? { signal: ctl.signal } : undefined).then(async r => ({ code: r.status, text: await r.text() }))
    .catch(e => ({ code: -1, text: String(e) })).finally(() => clearTimeout(t));
}

/* ---------- Продукт по штрихкоду: свои продукты, потом Open Food Facts ---------- */
const OFF_UA = 'TarelkaShtanga/1.0 (Android)';
const offUrl = code => `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,product_name_ru,generic_name_ru,brands,quantity,serving_quantity,nutriments`;
const bcDigits = s => String(s || '').replace(/\D/g, '');
const r1 = v => Math.round(v * 10) / 10;
const numIn = v => (v === '' || v == null || isNaN(v)) ? '' : String(r1(v)).replace('.', ',');
function bcValid(code) {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  if (code.length === 8) return true; // EAN-8 и UPC-E проверяются по-разному — принимаем как есть
  let sum = 0; const n = code.length;
  for (let i = 0; i < n - 1; i++) sum += +code[n - 2 - i] * (i % 2 ? 1 : 3);
  return (10 - sum % 10) % 10 === +code[n - 1];
}
function offParse(r) {
  if (r.code === 404) return { found: false };
  if (r.code < 0) return { err: 'net' };
  if (r.code < 200 || r.code >= 300) return { err: 'http', code: r.code };
  let j = null; try { j = JSON.parse(r.text); } catch (e) { return { err: 'bad' }; }
  if (!j || j.status !== 1 || !j.product) return { found: false };
  const p = j.product, n = p.nutriments || {}, num = v => { const x = toNum(v); return x >= 0 ? x : NaN; };
  let kcal = num(n['energy-kcal_100g']);
  if (isNaN(kcal) && num(n.energy_100g) >= 0) kcal = num(n.energy_100g) / 4.184;
  const nm = String(p.product_name_ru || p.product_name || p.generic_name_ru || '').replace(/\s+/g, ' ').trim();
  const brand = String(p.brands || '').split(',')[0].trim();
  const name = nm && brand && !normTxt(nm).includes(normTxt(brand)) ? `${nm}, ${brand}` : (nm || brand);
  const sq = num(p.serving_quantity);
  return { found: true, f: { name: name.slice(0, 80), kcal: isNaN(kcal) ? '' : String(Math.round(kcal)), p: numIn(num(n.proteins_100g)), f: numIn(num(n.fat_100g)), c: numIn(num(n.carbohydrates_100g)), portion: sq > 0 && sq <= 2000 ? String(Math.round(sq)) : '100' },
    qty: String(p.quantity || '').slice(0, 30) };
}
function showBc(bc) { ui.bc = bc; ui.sheet = 'barcode'; renderSheet(); }
function toAddSheet(food, grams) {
  if (food) ui.extra.push({ key: 'x|' + uid(), food, grams });
  ui.sheet = 'add'; renderSheet(); $('#sheet').scrollTop = 0;
}
async function bcLookup(raw, scanned) {
  const code = bcDigits(raw);
  if (!/^\d{8,14}$/.test(code)) { showBc({ step: 'enter', code: String(raw || '').slice(0, 20), msg: scanned ? 'Это не похоже на штрихкод продукта. Введите цифры под штрихкодом вручную.' : 'В штрихкоде 8 или 13 цифр — проверьте, всё ли введено.' }); return; }
  if (!scanned && !bcValid(code)) { showBc({ step: 'enter', code, msg: 'Похоже, одна цифра введена с ошибкой: контрольная цифра не сходится. Сверьте код с упаковкой.' }); return; }
  const own = S.custom.find(c => c.barcode === code), f = own && foodById(own.id);
  if (f) { toAddSheet(f, +own.portion || f.portion); toast('Нашлось в ваших продуктах: ' + own.name); return; }
  showBc({ step: 'load', code });
  const res = offParse(await httpGet(offUrl(code), { 'User-Agent': OFF_UA }));
  if (ui.sheet !== 'barcode' || !ui.bc || ui.bc.code !== code || ui.bc.step !== 'load') return; // окно закрыли, пока шёл поиск
  const tail = ' Перепишите калорийность и БЖУ с упаковки — продукт сохранится, и в следующий раз найдётся по штрихкоду сразу, даже без интернета.';
  let msg, found = false;
  if (res.found && res.f.kcal !== '') { found = true; msg = 'Нашлось в базе Open Food Facts. Сверьте цифры с упаковкой и поправьте, если нужно.'; }
  else if (res.found) msg = 'Продукт нашёлся, но без калорийности.' + tail;
  else if (res.err === 'net') msg = 'Нет связи с интернетом, базу продуктов не проверить.' + tail;
  else if (res.err) msg = `База Open Food Facts не ответила${res.code ? ' (ошибка ' + res.code + ')' : ''}.` + tail;
  else msg = 'Такого продукта нет в базе Open Food Facts.' + tail;
  showBc({ step: 'form', code, found, msg, qty: res.qty || '', f: res.f || { name: '', kcal: '', p: '', f: '', c: '', portion: '100' } });
}
window.__onBarcode = (code, err) => {
  if (!ui.sheet) resetAdd();
  if (code) { bcLookup(code, true); return; }
  if (!err || err === 'canceled') return;
  if (err === 'installing') { toast('Модуль сканера загружается, попробуйте через минуту'); return; }
  showBc({ step: 'enter', code: '', noScan: err === 'unavailable', msg: err === 'unavailable' ? 'Сканер штрихкодов на этом телефоне недоступен. Введите цифры под штрихкодом — они напечатаны на упаковке.' : 'Не получилось отсканировать штрихкод. Введите цифры под ним вручную.' });
};
function sheetBarcode() {
  const bc = ui.bc || { step: 'enter', code: '' }, canScan = !!(NB && typeof NB.scanBarcode === 'function');
  const head = sheetHead('Продукт по штрихкоду', 'bcBack');
  if (bc.step === 'load') return `${head}<p class="bc-wait"><span class="spin" aria-hidden="true"></span>Ищу продукт ${esc(bc.code)} в базе Open Food Facts…</p><button class="btn btn-ghost" data-a="bcBack">Отмена</button>`;
  if (bc.step === 'form') {
    const f = bc.f || {};
    const fld = (id, label, v, extra) => `<div class="field${extra || ''}"><label for="${id}">${label}</label><input id="${id}" class="input${id === 'bName' ? '' : ' num'}"${id === 'bName' ? '' : ' inputmode="decimal"'} value="${esc(v)}" autocomplete="off"></div>`;
    return `${head}<div class="${bc.found ? 'tipbox' : 'banner plain'}"><p>${esc(bc.msg)}</p></div>
      <p class="small muted num">Штрихкод ${esc(bc.code)}${bc.qty ? ' · упаковка ' + esc(bc.qty) : ''}</p>
      <div class="grid2">${fld('bName', 'Название', f.name, ' span2')}${fld('bKcal', 'Ккал на 100 г', f.kcal)}${fld('bPortion', 'Порция, г', f.portion)}</div>
      <div class="field"><span class="lbl">Белки, жиры и углеводы на 100 г</span><div class="grid3 bju">${fld('bP', 'Белки, г', f.p)}${fld('bF', 'Жиры, г', f.f)}${fld('bC', 'Углеводы, г', f.c)}</div></div>
      <p class="hint">Порция добавится в «${esc(ui.meal)}» сейчас и будет предлагаться в следующий раз. Продукт сохранится в «Профиль» → «Мои продукты».</p>
      <div class="row"><button class="btn btn-primary grow" data-a="bcSave">Сохранить и добавить</button><button class="btn btn-ghost" data-a="bcBack">Отмена</button></div>`;
  }
  return `${head}${bc.msg ? `<div class="banner plain"><p>${esc(bc.msg)}</p></div>` : ''}
    ${canScan && !bc.noScan ? `<button class="btn btn-primary" data-a="bcScan">${IC.barcode} Сканировать камерой</button>` : ''}
    <div class="field"><label for="bcCode">Цифры под штрихкодом</label><div class="row"><input id="bcCode" class="input grow num" inputmode="numeric" enterkeyhint="search" maxlength="20" autocomplete="off" placeholder="4601234567890" value="${esc(bc.code)}"><button class="btn btn-ghost" data-a="bcFind">Найти</button></div>
      <p class="hint">Обычно 13 цифр. Сначала ищу среди ваших продуктов, потом в открытой базе Open Food Facts — в ней много продуктов из российских магазинов.</p></div>`;
}

/* ---------- Мои блюда: рецепт из продуктов ---------- */
const dishList = () => S.custom.filter(c => c.recipe);
function dishTotals(d) {
  const t = { kcal: 0, p: 0, f: 0, c: 0, raw: 0 };
  d.items.forEach(it => { const g = toNum(it.grams) || 0, m = g / 100; t.raw += g; t.kcal += it.kcal * m; t.p += it.p * m; t.f += it.f * m; t.c += it.c * m; });
  const out = toNum(d.out); t.w = out > 0 ? out : t.raw;
  return t;
}
function dishTotHtml(d) {
  if (!d.items.length) return `<p class="hint">Добавьте продукты — здесь появятся калории блюда и порции.</p>`;
  const t = dishTotals(d), per = v => t.w > 0 ? v / t.w * 100 : 0, pg = toNum(d.portion);
  return `<div class="norm"><span class="eyebrow">Всё блюдо</span><b class="big">${f0(t.kcal)} ккал</b>
    <p class="small num">${f0(t.w)} г${toNum(d.out) > 0 ? ' готового' : ''} · Б ${f0(t.p)} · Ж ${f0(t.f)} · У ${f0(t.c)} г</p>
    <p class="small num"><b>На 100 г:</b> ${f0(per(t.kcal))} ккал · Б ${f1(per(t.p))} · Ж ${f1(per(t.f))} · У ${f1(per(t.c))}</p>
    ${pg > 0 ? `<p class="small num"><b>Порция ${f0(pg)} г:</b> ${f0(per(t.kcal) * pg / 100)} ккал · Б ${f0(per(t.p) * pg / 100)} · Ж ${f0(per(t.f) * pg / 100)} · У ${f0(per(t.c) * pg / 100)}</p>` : ''}</div>`;
}
function dishRow(it, i) {
  return `<div class="pv-item dish-row"><div class="pv-name">${esc(it.name)}<small>${f0(it.kcal)} ккал на 100 г</small></div>
    <label class="pv-g"><input class="input input-sm num" type="text" inputmode="decimal" data-in="dishG" data-i="${i}" value="${esc(it.grams)}" aria-label="Граммы: ${esc(it.name)}">г</label>
    <span class="pv-kcal" id="dk${i}">${f0(it.kcal * (toNum(it.grams) || 0) / 100)} ккал</span>
    <button class="x-btn" data-a="dishDel" data-i="${i}" aria-label="Убрать: ${esc(it.name)}">${IC.x}</button></div>`;
}
function sheetDish() {
  const d = ui.dish; if (!d) return sheetHead('Блюдо не найдено');
  const t = dishTotals(d), back = d.from === 'add' ? 'dishBack' : 'closeSheet';
  return `${sheetHead(d.id ? 'Изменить блюдо' : 'Новое блюдо', back)}
  <div class="field"><label for="dName">Название</label><input id="dName" class="input" data-in="dishName" value="${esc(d.name)}" placeholder="Например: борщ домашний" autocomplete="off"></div>
  <div class="field"><span class="lbl">Продукты и сколько граммов положили</span>
    ${d.items.length ? `<div class="pv">${d.items.map(dishRow).join('')}</div>` : `<p class="hint">Пока пусто. Найдите продукты ниже — по одному, с сырым весом.</p>`}</div>
  <div class="field"><label for="dQ">Добавить продукт</label><input id="dQ" class="input" type="search" data-in="dishQ" placeholder="Свёкла, говядина, масло…" autocomplete="off" value="${esc(d.q)}"><div id="dishSr"></div></div>
  <details class="howto"><summary>Продукта нет в базе</summary>
    <div class="grid2"><div class="field span2"><label for="diName">Название</label><input id="diName" class="input" autocomplete="off"></div>
      <div class="field"><label for="diKcal">Ккал на 100 г</label><input id="diKcal" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="diG">Сколько граммов</label><input id="diG" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="diP">Белки на 100 г</label><input id="diP" class="input num" inputmode="decimal" placeholder="необязательно"></div>
      <div class="field"><label for="diF">Жиры на 100 г</label><input id="diF" class="input num" inputmode="decimal" placeholder="необязательно"></div>
      <div class="field"><label for="diC">Углеводы на 100 г</label><input id="diC" class="input num" inputmode="decimal" placeholder="необязательно"></div></div>
    <button class="btn btn-ghost btn-sm" data-a="dishMan">Добавить в блюдо</button></details>
  <div class="grid2"><div class="field"><label for="dOut">Вес готового блюда, г</label><input id="dOut" class="input num" inputmode="decimal" data-in="dishOut" value="${esc(d.out)}" placeholder="${t.raw > 0 ? esc('≈ ' + f0(t.raw)) : 'если взвешивали'}"></div>
    <div class="field"><label for="dPortion">Обычная порция, г</label><input id="dPortion" class="input num" inputmode="decimal" data-in="dishPortion" value="${esc(d.portion)}"></div></div>
  <p class="hint">Крупы и макароны при варке набирают воду, мясо и овощи при жарке теряют. Взвесьте кастрюлю с готовым блюдом и вычтите вес пустой — калории на 100 г будут точнее. Если поле пустое, считаю по сумме продуктов.</p>
  <div id="dishTot">${dishTotHtml(d)}</div>
  ${d.del ? `<div class="confirm"><p>Удалить блюдо «${esc(d.name)}»? Записи в дневнике останутся.</p><div class="row"><button class="btn btn-warn btn-sm" data-a="dishRemoveYes">Удалить</button><button class="btn btn-ghost btn-sm" data-a="dishRemoveNo">Отмена</button></div></div>`
    : `<div class="row"><button class="btn btn-primary grow" data-a="dishSave">${d.from === 'add' && !d.id ? 'Сохранить и добавить' : 'Сохранить блюдо'}</button>${d.id ? `<button class="btn btn-warn" data-a="dishRemove">Удалить</button>` : ''}</div>`}`;
}
function renderDishSearch() {
  const box = $('#dishSr'), d = ui.dish; if (!box || !d) return;
  const q = d.q.trim(), res = q.length >= 2 ? searchFoods(q).filter(f => f.id !== d.id && !f.water) : [];
  box.innerHTML = res.length ? `<div class="results">${res.map(f => `<button class="res" data-a="dishPick" data-id="${esc(f.id)}"><span>${esc(f.name)}</span><span>${f0(f.kcal)} ккал / 100 ${f.liq ? 'мл' : 'г'}</span></button>`).join('')}</div>`
    : (q.length >= 2 ? `<p class="hint">Ничего не нашлось. Впишите продукт вручную — «Продукта нет в базе».</p>` : '');
}
function updateDishTot() {
  const d = ui.dish; if (!d) return;
  const box = $('#dishTot'); if (box) box.innerHTML = dishTotHtml(d);
  const o = $('#dOut'), raw = dishTotals(d).raw; if (o) o.placeholder = raw > 0 ? '≈ ' + f0(raw) : 'если взвешивали';
}
function openDish(c, from) {
  ui.dish = c ? { id: c.id, name: c.name, items: c.recipe.items.map(x => ({ name: x.name, grams: numIn(x.grams), kcal: +x.kcal || 0, p: +x.p || 0, f: +x.f || 0, c: +x.c || 0 })), out: c.recipe.out ? numIn(c.recipe.out) : '', portion: String(c.portion || 300), q: '', from }
    : { id: null, name: '', items: [], out: '', portion: '300', q: '', from };
  ui.sheet = 'dish'; renderSheet(); $('#sheet').scrollTop = 0;
  if (!c) setTimeout(() => { const n = $('#dName'); if (n) n.focus(); }, 60);
}
function dishDone(d) { ui.dish = null; if (d.from === 'add') toAddSheet(null); else { ui.sheet = null; renderSheet(); } render(); }

/* ================= Таймер отдыха ================= */
let rest = null, restT = null;
function startRest() {
  const sec = restSec(); if (!sec) return;
  rest = { end: Date.now() + sec * 1000, total: sec }; renderRest();
  clearInterval(restT); restT = setInterval(tickRest, 500);
}
function tickRest() {
  if (!rest) { clearInterval(restT); return; }
  const left = Math.ceil((rest.end - Date.now()) / 1000);
  if (left <= 0) { stopRest(); nb('vibrate', 500); toast('Отдых окончен — следующий подход'); return; }
  const b = $('#restNum'), bar = $('#restFill');
  if (b) b.textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
  if (bar) bar.style.width = (left / rest.total * 100) + '%';
}
function stopRest() { rest = null; clearInterval(restT); renderRest(); }
function renderRest() {
  const el = $('#rest');
  document.body.classList.toggle('resting', !!rest);
  if (!rest) { el.hidden = true; el.innerHTML = ''; $('#app').classList.remove('with-rest'); return; }
  const left = Math.max(0, Math.ceil((rest.end - Date.now()) / 1000));
  el.hidden = false; $('#app').classList.add('with-rest');
  el.innerHTML = `<div class="rest-in"><b id="restNum">${Math.floor(left / 60)}:${pad(left % 60)}</b><span>Отдых</span><button data-a="restAdd">+30 с</button><button data-a="restSkip">Пропустить</button><div class="rest-bar"><i id="restFill" style="width:${left / rest.total * 100}%"></i></div></div>`;
}

/* ================= Отрисовка ================= */
let keepOn = false, renderedDay = todayKey();
function render() {
  const v = $('#view'), nav = $('.tabs');
  renderedDay = todayKey(); pendingRender = false;
  if (MODE === 'coach' && !CO.cur) { nav.hidden = true; v.innerHTML = renderCoach(); }
  else {
    nav.hidden = false;
    v.innerHTML = ui.tab === 'today' ? renderToday() : ui.tab === 'train' ? renderTrain() : ui.tab === 'progress' ? renderProgress() : ui.tab === 'kb' ? renderKb() : renderProfile();
    $('#tabs').innerHTML = tabsHtml();
    if (ui.tab === 'kb') drawThumbs(v);
  }
  const want = !!S.session;
  if (want !== keepOn) { keepOn = want; nb('keepScreenOn', want); }
}
const SHEETS = { add: sheetAdd, edit: sheetEdit, steps: sheetSteps, weight: sheetWeight, measures: sheetMeasures, pick: sheetPick, ex: sheetEx, art: sheetArt, templates: sheetTemplates, import: sheetImport, workout: sheetWorkout, water: sheetWater, dish: sheetDish, barcode: sheetBarcode };
function openSheet(kind) { ui.sheet = kind; renderSheet(); const sh = $('#sheet'); sh.scrollTop = 0; if (kind === 'add') setTimeout(() => { const ta = $('#foodText'); if (ta) ta.focus(); }, 60); }
function renderSheet() {
  const back = $('#sheetBack'), sh = $('#sheet');
  stopAnim();
  sh.classList.toggle('full', ui.sheet === 'photo' || ui.sheet === 'phCmp');
  if (!ui.sheet) { back.hidden = true; sh.innerHTML = ''; document.body.style.overflow = ''; return; }
  back.hidden = false; document.body.style.overflow = 'hidden';
  sh.innerHTML = (SHEETS[ui.sheet] || (() => ''))();
  if (ui.sheet === 'photo' || ui.sheet === 'phCmp') phFill(sh);
  if (ui.sheet === 'add') { renderPreview(); renderSearch(); }
  if (ui.sheet === 'dish') renderDishSearch();
  if (ui.sheet === 'ex') { animPaused = false; startAnim(); }
  if (ui.sheet === 'pick') drawThumbs(sh);
}
function closeSheet() { const was = ui.sheet; ui.sheet = null; ui.confirm = ui.confirm === 'progImport' || ui.confirm === 'phDel' ? null : ui.confirm; ui.tplId = null; ui.pickNew = false; if (was === 'phCmp') ui.phSel = null; if (was === 'phNew') ui.phNew = null; renderSheet(); if (pendingRender || was === 'pick' || was === 'ex' || was === 'workout' || was === 'templates' || was === 'import' || was === 'phCmp') render(); }

/* ================= Действия ================= */
const A = {
  tab(b) { ui.tab = b.dataset.tab; ui.confirm = null; render(); window.scrollTo(0, 0); },
  startFresh() { mutate(() => { }); render(); },
  dayPrev() { ui.date = addDays(ui.date, -1); render(); },
  dayNext() { if (ui.date < todayKey()) { ui.date = addDays(ui.date, 1); render(); } },
  gotoDay(b) { ui.date = b.dataset.k; ui.tab = 'today'; render(); window.scrollTo(0, 0); },
  water(b) {
    const i = +b.dataset.i, k = ui.date, gl = glassMl(); let delta = 0;
    mutate(() => { const d = getDay(k, true), old = d.water || 0, filled = Math.floor(old / gl); d.water = filled === i + 1 ? i * gl : (i + 1) * gl; delta = d.water - old; });
    if (delta > 0) waterHist(k).push(delta); else waterHist(k).length = 0;
    render();
  },
  waterUndo() {
    const k = ui.date, cur = getDay(k).water || 0; if (!(cur > 0)) return;
    const h = waterHist(k), amt = Math.min(cur, h.length ? h.pop() : glassMl());
    mutate(() => { const d = getDay(k, true); d.water = Math.max(0, (d.water || 0) - amt); });
    render(); toast(`Вода: −${f0(amt)} мл`);
  },
  openWater(b) { ui.glassOwn = false; openSheet('water'); if (b.dataset.f === 'add') setTimeout(() => { const i = $('#wAdd'); if (i) i.focus(); }, 60); },
  waterAdd(b) {
    const v = b.dataset.v ? +b.dataset.v : Math.round(toNum(($('#wAdd') || {}).value));
    if (!(v > 0 && v <= 5000)) { toast('Впишите, сколько миллилитров выпили, например 120'); const i = $('#wAdd'); if (i) i.focus(); return; }
    const k = ui.date; mutate(() => { const d = getDay(k, true); d.water = (d.water || 0) + v; }); waterHist(k).push(v);
    ui.sheet = null; renderSheet(); render(); toast(`Вода: +${f0(v)} мл`);
  },
  glassSet(b) { const v = +b.dataset.v; ui.glassOwn = false; mutate(() => { S.profile.glass = String(v); }); renderSheet(); render(); },
  glassOwn() { ui.glassOwn = true; renderSheet(); setTimeout(() => { const i = $('#glassIn'); if (i) i.focus(); }, 30); },
  glassSave() {
    const v = Math.round(toNum(($('#glassIn') || {}).value));
    if (!(v >= 50 && v <= 1000)) { toast('Впишите объём стакана от 50 до 1000 мл'); const i = $('#glassIn'); if (i) i.focus(); return; }
    ui.glassOwn = false; mutate(() => { S.profile.glass = String(v); }); renderSheet(); render(); toast(`Стакан: ${v} мл`);
  },
  openAdd(b) { resetAdd(b.dataset.meal); openSheet('add'); },
  closeSheet() { closeSheet(); },
  pickMeal(b) { ui.meal = b.dataset.v; $('#sheet').querySelectorAll('[data-a="pickMeal"]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === ui.meal))); updateCommit(); },
  pvRemove(b) { const x = ui.pv[+b.dataset.i]; if (!x) return; if (x.manual) ui.manual = ui.manual.filter(m => m.key !== x.key); else if (x.key.startsWith('x|')) ui.extra = ui.extra.filter(e => e.key !== x.key); else ui.hidden.add(x.key); renderPreview(); },
  unkHide(b) { const u = ui.unk[+b.dataset.u]; if (u != null) { ui.hidden.add('u|' + u); renderPreview(); } },
  unkSearch(b) { const u = ui.unk[+b.dataset.u]; if (u == null) return; ui.q = u.split(/\s+/).find(w => w.length > 2) || u; const s = $('#foodSearch'); if (s) { s.value = ui.q; s.focus(); } renderSearch(); },
  unkManual(b) { ui.manualFor = ui.unk[+b.dataset.u]; renderPreview(); setTimeout(() => { const m = $('#mKcal'); if (m) m.focus(); }, 30); },
  manualCancel() { ui.manualFor = null; renderPreview(); },
  manualAdd(b) {
    const u = ui.unk[+b.dataset.u], kc = toNum($('#mKcal') && $('#mKcal').value);
    if (!(kc >= 0)) { toast('Укажите калории числом'); const m = $('#mKcal'); if (m) m.focus(); return; }
    ui.manual.push({ key: 'm|' + uid(), name: (($('#mName') || {}).value || u).trim() || u, kcal: kc, p: toNum($('#mP').value) || 0, f: toNum($('#mF').value) || 0, c: toNum($('#mC').value) || 0 });
    ui.hidden.add('u|' + u); ui.manualFor = null; renderPreview();
  },
  pickFood(b) { const f = foodById(b.dataset.id); if (!f) return; ui.extra.push({ key: 'x|' + uid(), food: f, grams: f.portion }); ui.q = ''; const s = $('#foodSearch'); if (s) s.value = ''; renderSearch(); renderPreview(); },
  pickRecent(b) { const r = S.recent[+b.dataset.i], f = r && foodById(r.id); if (!f) return; ui.extra.push({ key: 'x|' + uid(), food: f, grams: r.grams }); renderPreview(); },
  /* штрихкод */
  bcScan() {
    if (!(NB && typeof NB.scanBarcode === 'function')) { A.bcOpen(); return; }
    try { NB.scanBarcode(); } catch (e) { showBc({ step: 'enter', code: '', msg: 'Сканер не запустился. Введите цифры под штрихкодом вручную.' }); }
  },
  bcOpen() { showBc({ step: 'enter', code: '' }); setTimeout(() => { const i = $('#bcCode'); if (i) i.focus(); }, 60); },
  bcFind() { const i = $('#bcCode'), v = ((i || {}).value || '').trim(); if (!v) { toast('Введите цифры под штрихкодом'); if (i) i.focus(); return; } bcLookup(v, false); },
  bcBack() { ui.bc = null; toAddSheet(null); },
  bcSave() {
    const bc = ui.bc; if (!bc || bc.step !== 'form') return;
    const val = id => (($('#' + id) || {}).value || '').trim(), foc = id => { const e = $('#' + id); if (e) e.focus(); };
    const name = val('bName').replace(/\s+/g, ' '), kc = toNum(val('bKcal')), g = toNum(val('bPortion'));
    if (!name) { toast('Впишите название продукта'); foc('bName'); return; }
    if (!(kc >= 0 && kc <= 950)) { toast('Впишите калорийность на 100 г — она есть на упаковке'); foc('bKcal'); return; }
    if (!(g > 0 && g <= 5000)) { toast('Впишите порцию в граммах, например 100'); foc('bPortion'); return; }
    const rec = { id: 'c' + uid(), name, kcal: r1(kc), p: nn(val('bP')), f: nn(val('bF')), c: nn(val('bC')), piece: 0, portion: Math.round(g), barcode: bc.code };
    mutate(() => { S.custom = S.custom.filter(c => c.barcode !== rec.barcode); S.custom.push(rec); });
    ui.bc = null; toAddSheet(foodById(rec.id), rec.portion); toast('Продукт сохранён в «Мои продукты»');
  },
  /* мои блюда */
  dishNew() { openDish(null, ui.sheet === 'add' ? 'add' : 'profile'); },
  dishEdit(b) { const c = S.custom.find(x => x.id === b.dataset.id && x.recipe); if (c) openDish(c, ui.sheet === 'add' ? 'add' : 'profile'); },
  dishAdd(b) { const f = foodById(b.dataset.id); if (!f) return; ui.extra.push({ key: 'x|' + uid(), food: f, grams: f.portion }); renderPreview(); },
  dishBack() { ui.dish = null; toAddSheet(null); },
  dishPick(b) {
    const d = ui.dish, f = foodById(b.dataset.id); if (!d || !f) return;
    d.items.push({ name: f.name, grams: String(f.portion || 100), kcal: +f.kcal || 0, p: +f.p || 0, f: +f.f || 0, c: +f.c || 0 }); d.q = '';
    renderSheet(); const i = $(`[data-in="dishG"][data-i="${d.items.length - 1}"]`); if (i) { i.focus(); i.select(); }
  },
  dishDel(b) { const d = ui.dish; if (!d) return; d.items.splice(+b.dataset.i, 1); renderSheet(); },
  dishMan() {
    const d = ui.dish; if (!d) return;
    const val = id => (($('#' + id) || {}).value || '').trim(), foc = id => { const e = $('#' + id); if (e) e.focus(); };
    const name = val('diName').replace(/\s+/g, ' '), kc = toNum(val('diKcal')), g = toNum(val('diG'));
    if (!name) { toast('Впишите название продукта'); foc('diName'); return; }
    if (!(kc >= 0 && kc <= 950)) { toast('Впишите калорийность на 100 г'); foc('diKcal'); return; }
    if (!(g > 0 && g <= 50000)) { toast('Впишите, сколько граммов положили'); foc('diG'); return; }
    d.items.push({ name, grams: numIn(g), kcal: r1(kc), p: nn(val('diP')), f: nn(val('diF')), c: nn(val('diC')) }); renderSheet();
  },
  dishSave() {
    const d = ui.dish; if (!d) return;
    const foc = id => { const e = $('#' + id); if (e) e.focus(); }, name = d.name.trim().replace(/\s+/g, ' ');
    if (!name) { toast('Впишите название блюда'); foc('dName'); return; }
    const items = d.items.map(it => ({ name: it.name, grams: r1(toNum(it.grams) || 0), kcal: r1(it.kcal), p: r1(it.p), f: r1(it.f), c: r1(it.c) })).filter(it => it.grams > 0);
    if (!items.length) { toast('Добавьте хотя бы один продукт с граммами'); foc('dQ'); return; }
    const out = toNum(d.out), portion = toNum(d.portion);
    if (String(d.out).trim() !== '' && !(out > 0 && out <= 50000)) { toast('Вес готового блюда — в граммах, например 1800'); foc('dOut'); return; }
    if (!(portion > 0 && portion <= 5000)) { toast('Впишите обычную порцию в граммах, например 300'); foc('dPortion'); return; }
    const dup = S.custom.find(c => c.id !== d.id && normTxt(c.name).trim() === normTxt(name));
    if (dup) { toast(`«${dup.name}» уже есть в ваших продуктах — назовите блюдо по-другому`); foc('dName'); return; }
    const t = dishTotals({ items, out: out > 0 ? out : '' }), per = v => r1(v / t.w * 100);
    const rec = { id: d.id || 'c' + uid(), name, kcal: per(t.kcal), p: per(t.p), f: per(t.f), c: per(t.c), piece: 0, portion: Math.round(portion), recipe: { items, out: out > 0 ? Math.round(out) : null } };
    mutate(() => { const i = S.custom.findIndex(c => c.id === rec.id); if (i >= 0) S.custom[i] = rec; else S.custom.push(rec); });
    if (d.from === 'add' && !d.id) { ui.dish = null; toAddSheet(foodById(rec.id), rec.portion); render(); toast('Блюдо сохранено и добавлено'); return; }
    dishDone(d); toast('Блюдо сохранено');
  },
  dishRemove() { if (ui.dish) { ui.dish.del = true; renderSheet(); } },
  dishRemoveNo() { if (ui.dish) { ui.dish.del = false; renderSheet(); } },
  dishRemoveYes() {
    const d = ui.dish; if (!d) return; let rem = null, idx = -1;
    mutate(() => { idx = S.custom.findIndex(c => c.id === d.id); if (idx >= 0) rem = S.custom.splice(idx, 1)[0]; });
    if (d.from === 'add') ui.extra = ui.extra.filter(x => x.food.id !== d.id);
    dishDone(d); if (rem) { ui.undo = { custom: rem, idx }; toast(`Удалено: ${rem.name}`, { a: 'undoCustom', label: 'Вернуть' }); }
  },
  undoCustom() { const u = ui.undo; if (!u || !u.custom) return; mutate(() => { if (!S.custom.some(c => c.id === u.custom.id)) S.custom.splice(Math.min(u.idx, S.custom.length), 0, u.custom); }); ui.undo = null; $('#toast').hidden = true; if (ui.sheet === 'add') renderSheet(); render(); },
  commitAdd() {
    const items = ui.pv.slice(); if (!items.length) return; const k = ui.date, meal = ui.meal; let n = 0, kc = 0, water = 0;
    mutate(() => {
      const d = getDay(k, true);
      items.forEach(x => {
        if (x.manual) { d.items.push({ id: uid(), meal, name: x.manual.name, manual: true, kcal: x.manual.kcal, p: x.manual.p, f: x.manual.f, c: x.manual.c }); n++; kc += x.manual.kcal; return; }
        const g = toNum(x.grams); if (!(g > 0)) return;
        if (x.food.water) { water += g; return; }
        const e = entryFrom(x.food, g, meal); d.items.push(e); n++; kc += itemVals(e).kcal; pushRecent(x.food, g);
      });
      d.water = (d.water || 0) + water;
    });
    ui.sheet = null; renderSheet(); render();
    toast(n ? `Добавлено: ${f0(kc)} ккал${water ? `, вода ${f0(water)} мл` : ''}` : `Вода: +${f0(water)} мл`);
  },
  openEdit(b) { const it = getDay(ui.date).items.find(x => x.id === b.dataset.id); if (!it) return; ui.editId = it.id; ui.editMeal = it.meal; openSheet('edit'); },
  editMeal(b) { ui.editMeal = b.dataset.v; $('#sheet').querySelectorAll('[data-a="editMeal"]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === ui.editMeal))); },
  saveEdit() {
    const k = ui.date, id = ui.editId, val = s => toNum(($(s) || {}).value), meal = ui.editMeal;
    const v = { g: val('#eGrams'), kc: val('#eKcal'), p: val('#eP'), f: val('#eF'), c: val('#eC') };
    mutate(() => { const it = getDay(k).items.find(x => x.id === id); if (!it) return; it.meal = meal;
      if (it.manual) { if (v.kc >= 0) it.kcal = v.kc; it.p = v.p || 0; it.f = v.f || 0; it.c = v.c || 0; } else if (v.g > 0) it.grams = Math.round(v.g); });
    ui.sheet = null; renderSheet(); render();
  },
  deleteItem() {
    const k = ui.date, id = ui.editId; let rem = null, idx = -1;
    mutate(() => { const d = getDay(k); idx = d.items.findIndex(x => x.id === id); if (idx >= 0) rem = d.items.splice(idx, 1)[0]; });
    ui.sheet = null; renderSheet(); render(); if (rem) { ui.undo = { k, item: rem, idx }; toast(`Удалено: ${rem.name}`, { a: 'undoItem', label: 'Вернуть' }); }
  },
  undoItem() { const u = ui.undo; if (!u || !u.item) return; mutate(() => { const d = getDay(u.k, true); d.items.splice(Math.min(u.idx, d.items.length), 0, u.item); }); ui.undo = null; $('#toast').hidden = true; render(); },
  confirmNo() { ui.confirm = null; if (ui.sheet) renderSheet(); render(); },
  /* шаги */
  openSteps() { openSheet('steps'); setTimeout(() => { const i = $('#stepsIn'); if (i) i.focus(); }, 60); },
  saveSteps() { const v = toNum($('#stepsIn').value); if (!(v >= 0) || v > 100000) { toast('Введите количество шагов числом'); return; } const k = ui.date; mutate(() => { getDay(k, true).steps = Math.round(v); }); ui.sheet = null; renderSheet(); render(); },
  clearSteps() { const k = ui.date; mutate(() => { const d = getDay(k, true); delete d.steps; }); refreshSteps(); ui.sheet = null; renderSheet(); render(); },
  stepsAllow() { nb('requestSteps'); },
  stepsSettings() { nb('openAppSettings'); },
  /* тренировки */
  startDay(b) {
    const day = S.program.days.find(d => d.id === b.dataset.id); if (!day) return;
    mutate(() => {
      S.session = { id: uid(), dayId: day.id, dayName: day.name, date: todayKey(), start: Date.now(), note: '',
        ex: day.ex.map(pe => sessionEx(pe.exId, pe.name, pe.sets, pe.reps, schemeText(pe))) };
    });
    ui.confirm = null; render(); window.scrollTo(0, 0);
  },
  startFree() { mutate(() => { S.session = { id: uid(), dayId: null, dayName: 'Тренировка', date: todayKey(), start: Date.now(), note: '', ex: [] }; }); render(); window.scrollTo(0, 0); },
  setDone(b) {
    const s = S.session; if (!s) return; const st = s.ex[+b.dataset.i].sets[+b.dataset.j];
    st.done = !st.done; save();
    const row = b.closest('.set'); if (row) row.classList.toggle('is-done', st.done); b.setAttribute('aria-pressed', String(st.done));
    if (st.done) startRest();
  },
  setAdd(b) { const e = S.session.ex[+b.dataset.i], l = e.sets[e.sets.length - 1] || {}; e.sets.push({ w: l.w || '', r: l.r || '', done: false }); save(); render(); },
  setDel(b) { const e = S.session.ex[+b.dataset.i]; if (e.sets.length > 1) e.sets.pop(); save(); render(); },
  sxRemove(b) { S.session.ex.splice(+b.dataset.i, 1); save(); render(); },
  finishSession() {
    const s = S.session; if (!s) return;
    if (!s.ex.some(e => e.sets.some(x => x.done))) { toast('Отметьте хотя бы один выполненный подход'); return; }
    const m = Math.round((Date.now() - (s.start || Date.now())) / 60000);
    ui.finishMin = String(m >= 10 && m <= 180 ? m : 60); ui.confirm = 'finish'; render();
  },
  finishYes() {
    const s = S.session; if (!s) return; const min = clamp(Math.round(toNum($('#finMin').value) || 60), 1, 600);
    mutate(() => {
      S.workouts.push({ id: s.id || uid(), date: s.date || todayKey(), dayId: s.dayId, dayName: s.dayName, note: (s.note || '').trim(), minutes: min, author: MODE === 'coach' ? 'coach' : 'client',
        ex: s.ex.map(e => ({ exId: e.exId, name: e.name, target: e.target, sets: e.sets.filter(x => x.done).map(x => ({ w: x.w || '', r: x.r || '', done: true })) })).filter(e => e.sets.length) });
      S.session = null;
    });
    stopRest(); ui.confirm = null; render(); window.scrollTo(0, 0); toast('Тренировка записана'); remApply();
  },
  cancelSession() { ui.confirm = 'cancelSession'; render(); },
  cancelSessionYes() { mutate(() => { S.session = null; }); stopRest(); ui.confirm = null; render(); },
  restAdd() { if (rest) { rest.end += 30000; rest.total += 30; tickRest(); } },
  restSkip() { stopRest(); },
  openWorkout(b) { ui.woId = b.dataset.id; openSheet('workout'); },
  woSave() { const id = ui.woId, m = toNum($('#woMin').value), nt = $('#woNote'); mutate(() => { const w = S.workouts.find(x => x.id === id); if (w && m > 0) w.minutes = Math.round(m); if (w && nt && MODE === 'coach') putNote('w:' + id, nt.value); }); ui.sheet = null; renderSheet(); render(); },
  woDelete() {
    const id = ui.woId; let rem = null, idx = -1;
    mutate(() => { idx = S.workouts.findIndex(w => w.id === id); if (idx >= 0) rem = S.workouts.splice(idx, 1)[0]; });
    ui.sheet = null; renderSheet(); render(); if (rem) { ui.undo = { w: rem, idx }; toast('Тренировка удалена', { a: 'undoWorkout', label: 'Вернуть' }); }
  },
  undoWorkout() { const u = ui.undo; if (!u || !u.w) return; mutate(() => { S.workouts.splice(Math.min(u.idx, S.workouts.length), 0, u.w); }); ui.undo = null; $('#toast').hidden = true; render(); },
  progEdit() { ui.editProg = true; ui.progCode = ''; ui.confirm = null; render(); window.scrollTo(0, 0); },
  progDone() { ui.editProg = false; ui.confirm = null; mutate(() => { S.program.days.forEach(d => { d.ex = d.ex.filter(e => String(e.name).trim()); d.ex.forEach(e => { e.sets = clamp(Math.round(toNum(e.sets) || 3), 1, 10); }); }); }); render(); },
  exDel(b) { const di = +b.dataset.d, ei = +b.dataset.e; mutate(() => { S.program.days[di].ex.splice(ei, 1); }); render(); },
  exUp(b) { const di = +b.dataset.d, ei = +b.dataset.e; if (ei < 1) return; mutate(() => { const a = S.program.days[di].ex; [a[ei - 1], a[ei]] = [a[ei], a[ei - 1]]; }); render(); },
  exDown(b) { const di = +b.dataset.d, ei = +b.dataset.e, a = S.program.days[di].ex; if (ei >= a.length - 1) return; mutate(() => { const x = S.program.days[di].ex; [x[ei + 1], x[ei]] = [x[ei], x[ei + 1]]; }); render(); },
  dayAdd() { mutate(() => { const used = new Set(S.program.days.map(d => d.name)); let nm = 'Новый день'; for (const c of 'АБВГДЕЖЗ') { if (!used.has('День ' + c)) { nm = 'День ' + c; break; } } S.program.days.push({ id: uid(), name: nm, ex: [] }); }); render(); },
  dayDel(b) { ui.confirm = 'delDay' + b.dataset.d; render(); },
  dayDelYes(b) { const di = +b.dataset.d; mutate(() => { S.program.days.splice(di, 1); }); ui.confirm = null; render(); },
  progExport() { ui.progCode = 'PRG2:' + b64e(JSON.stringify({ title: S.program.title, note: S.program.note, days: S.program.days, customEx: (S.customEx || []) })); render(); },
  copyProg() { copyText(ui.progCode, $('#progCodeTa')); },
  openTemplates() { ui.tplId = null; openSheet('templates'); },
  tplPick(b) { ui.tplId = b.dataset.id; renderSheet(); },
  tplNo() { ui.tplId = null; renderSheet(); },
  tplYes(b) { const t = PROGRAM_TEMPLATES.find(x => x.id === b.dataset.id); if (!t) return; mutate(() => { S.program = progFromTemplate(t); }); ui.tplId = null; ui.sheet = null; renderSheet(); render(); toast('Программа заменена'); },
  openImport() { ui.confirm = null; openSheet('import'); },
  progImport() {
    const r = decodeCode($('#progImport').value, ['PRG2:', 'PRG1:']);
    const p = r && r.data;
    if (!p || !Array.isArray(p.days)) { toast('Код не подходит. Скопируйте его целиком, начиная с PRG'); return; }
    p.days = p.days.map(d => ({ id: d.id || uid(), name: String(d.name || 'День'), ex: (d.ex || []).map(convProgEx) }));
    ui.pendingImport = p; ui.confirm = 'progImport'; renderSheet();
  },
  progImportYes() {
    const p = ui.pendingImport; if (!p) return;
    mutate(() => { S.program = { title: String(p.title || 'Программа от тренера'), note: String(p.note || ''), days: p.days };
      (p.customEx || []).forEach(c => { if (c && c.id && !S.customEx.some(x => x.id === c.id)) S.customEx.push(c); }); });
    ui.pendingImport = null; ui.confirm = null; ui.sheet = null; renderSheet(); render(); toast('Программа загружена');
  },
  pickOpen(b) { ui.pickFor = { mode: b.dataset.mode, di: +b.dataset.d }; ui.pickQ = ''; ui.pickG = ''; ui.pickE = ''; ui.pickNew = false; openSheet('pick'); },
  pickG(b) { ui.pickG = b.dataset.g; renderSheet(); },
  pickE(b) { ui.pickE = b.dataset.t; renderSheet(); },
  pickEx(b) { const e = exInfo(b.dataset.id); if (e) addExercise(e); },
  cxNew() { ui.pickNew = true; renderSheet(); setTimeout(() => { const n = $('#cxName'); if (n) n.focus(); }, 30); },
  cxCancel() { ui.pickNew = false; renderSheet(); },
  cxSave() {
    const n = ($('#cxName').value || '').trim(); if (!n) { toast('Впишите название упражнения'); return; }
    const e = { id: 'cx' + uid(), n, g: $('#cxGroup').value, kind: $('#cxKind').value, custom: true };
    mutate(() => { S.customEx.push(e); }); ui.pickNew = false; addExercise(e);
  },
  exInfo(b) { if (!b.dataset.id) { toast('Это своё упражнение — описания нет'); return; } ui.exId = b.dataset.id; ui.exFrom = b.dataset.from || null; openSheet('ex'); },
  animToggle() { animPaused = !animPaused; startAnim(); },
  exToDay(b) { const e = exInfo(ui.exId), di = +b.dataset.d; if (!e) return; mutate(() => { S.program.days[di].ex.push(newProgEx(e)); }); toast(`Добавлено в «${S.program.days[di].name}»`); },
  /* база знаний */
  kbTab(b) { ui.kbTab = b.dataset.v; render(); },
  kbG(b) { ui.kbG = b.dataset.g; render(); },
  kbE(b) { ui.kbE = b.dataset.t; render(); },
  openArt(b) { ui.artId = b.dataset.id; openSheet('art'); },
  /* прогресс */
  per(b) { ui.per = +b.dataset.v; render(); },
  meas(b) { ui.meas = b.dataset.v; render(); },
  tip(b) { const c = $('#cap-' + b.dataset.c); if (c) c.innerHTML = `${esc(b.dataset.d)}: <b>${esc(b.dataset.v)}</b>`; },
  openWeight() { openSheet('weight'); setTimeout(() => { const i = $('#wKg'); if (i) i.focus(); }, 60); },
  openMeasures() { openSheet('measures'); },
  saveWeight() {
    const kg = toNum($('#wKg').value), date = $('#wDate').value || todayKey();
    if (!(kg > 20 && kg < 400)) { toast('Введите вес в килограммах, например 67,5'); $('#wKg').focus(); return; }
    mutate(() => { S.weights = S.weights.filter(w => w.date !== date); S.weights.push({ date, kg: Math.round(kg * 10) / 10 }); S.weights.sort((a, b) => a.date.localeCompare(b.date));
      if (S.weights[S.weights.length - 1].date === date) S.profile.weight = String(Math.round(kg * 10) / 10); });
    ui.sheet = null; renderSheet(); render(); toast('Вес записан');
  },
  delWeight(b) { const date = b.dataset.d; let rem = null; mutate(() => { rem = S.weights.find(w => w.date === date); S.weights = S.weights.filter(w => w.date !== date); }); render(); if (rem) { ui.undo = { wt: rem }; toast('Запись веса удалена', { a: 'undoWeight', label: 'Вернуть' }); } },
  undoWeight() { const u = ui.undo; if (!u || !u.wt) return; mutate(() => { S.weights.push(u.wt); S.weights.sort((a, b) => a.date.localeCompare(b.date)); }); ui.undo = null; $('#toast').hidden = true; render(); },
  saveMeasures() {
    const date = $('#mDate').value || todayKey(), rec = { date }; let any = false;
    MEAS.forEach(([k]) => { const v = toNum($('#m_' + k).value); if (v > 0) { rec[k] = Math.round(v * 10) / 10; any = true; } });
    if (!any) { toast('Впишите хотя бы один замер в сантиметрах'); return; }
    mutate(() => { const ex = S.measures.find(m => m.date === date); if (ex) Object.assign(ex, rec); else S.measures.push(rec); S.measures.sort((a, b) => a.date.localeCompare(b.date)); });
    ui.sheet = null; renderSheet(); render(); toast('Замеры сохранены');
  },
  /* профиль */
  repDays(b) { ui.repDays = +b.dataset.v; ui.report = ''; render(); },
  makeReport() { ui.report = buildReport(ui.repDays, ui.repDetail); render(); setTimeout(() => { const r = $('#reportTa'); if (r) r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30); },
  copyReport() { copyText(ui.report, $('#reportTa')); },
  shareReport() { if (nb('share', ui.report) === undefined && !NB) copyText(ui.report, $('#reportTa')); },
  addCustom() {
    const name = ($('#cName').value || '').trim(), kc = toNum($('#cKcal').value);
    if (!name) { toast('Впишите название продукта'); $('#cName').focus(); return; }
    if (!(kc >= 0)) { toast('Впишите калорийность на 100 г'); $('#cKcal').focus(); return; }
    mutate(() => { S.custom.push({ id: 'c' + uid(), name, kcal: kc, p: toNum($('#cP').value) || 0, f: toNum($('#cF').value) || 0, c: toNum($('#cC').value) || 0, piece: toNum($('#cPiece').value) || 0 }); });
    render(); toast('Продукт добавлен');
  },
  delCustom(b) {
    let rem = null, idx = -1;
    mutate(() => { idx = S.custom.findIndex(c => c.id === b.dataset.id); if (idx >= 0) rem = S.custom.splice(idx, 1)[0]; });
    render(); if (rem) { ui.undo = { custom: rem, idx }; toast(`Удалено: ${rem.name}`, { a: 'undoCustom', label: 'Вернуть' }); }
  },
  makeBackup() { ui.backup = 'BAK1:' + b64e(JSON.stringify(S)); render(); },
  copyBackup() { copyText(ui.backup, $('#backupTa')); },
  restore() { const r = decodeCode($('#restoreTa').value, ['BAK1:']); if (!r || !r.data || typeof r.data !== 'object' || !r.data.days) { toast('Код не подходит. Скопируйте его целиком, начиная с BAK1:'); return; } ui.pendingRestore = r.data; ui.confirm = 'restore'; render(); },
  restoreYes() { const d = ui.pendingRestore; if (!d) return; d.demo = false; const link = S.link; S = migrate(d) || blankState(); S.link = link; Sync.last = {}; save(true); ui.pendingRestore = null; ui.confirm = null; ui.date = todayKey(); render(); toast('Записи восстановлены'); },
  wipe() { ui.confirm = 'wipe'; render(); },
  wipeYes() { const linked = !!S.link; Sync.stop(); S = blankState(); save(); PH.clear('me'); if (linked && FB.ok) FB.auth.signOut().catch(() => { }); ui.confirm = null; ui.report = ''; ui.backup = ''; ui.date = todayKey(); render(); toast('Все данные удалены'); },
  hideLink() { lsSet('tarelka-hide-link', '1'); render(); },
  async linkCode() {
    const code = (($('#linkCode') || {}).value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { toast('Введите код от тренера'); return; }
    if (!FB.init()) { toast('Нет связи с сервером. Проверьте интернет.'); return; }
    ui.linkBusy = true; render();
    try {
      let user = FB.auth.currentUser;
      if (!user || !user.isAnonymous) { if (user) await FB.auth.signOut(); user = (await FB.auth.signInAnonymously()).user; }
      const inv = await FB.db.collection('invites').doc(code).get();
      if (!inv.exists) throw new Error('Код не найден. Проверьте буквы или попросите у тренера новый.');
      const { clientId, coachUid } = inv.data();
      await FB.db.collection('clients').doc(clientId).update({ ownerUid: user.uid, linkedAt: Date.now() });
      if (S.demo) S = blankState();
      S.link = { clientId, coachUid, at: Date.now() };
      Sync.stop(); save(); Sync.start(clientId, 'client');
      lsSet('tarelka-hide-link', '1');
      toast('Подключено к тренеру');
    } catch (e) { toast(e && e.code ? fbErr(e) : (e.message || String(e))); }
    ui.linkBusy = false; render();
  },
  unlink() { ui.confirm = 'unlink'; render(); },
  unlinkYes() { Sync.stop(); lsSet(KEY + '-sh-client-' + (S.link && S.link.clientId), null); delete S.link; save(); if (FB.ok) FB.auth.signOut().catch(() => { }); ui.confirm = null; render(); toast('Связь с тренером отключена'); },
  toCoach() {
    if (S.link) { toast('Этот телефон подключён к тренеру как телефон подопечной. Сначала отключитесь в «Профиле».'); return; }
    MODE = 'coach'; lsSet('tarelka-mode', 'coach'); S = blankState(); CO.err = ''; stopRest(); ui.sheet = null; renderSheet();
    if (FB.init()) { const u = FB.auth.currentUser; if (u && u.isAnonymous) FB.auth.signOut().catch(() => { }); else if (u && !CO.user) { CO.user = u; Coach.load(); } }
    render(); window.scrollTo(0, 0);
  },
  toClient() { Sync.stop(); stopRest(); if (CO.unsub) { CO.unsub(); CO.unsub = null; } CO.cur = null; CO.user = null; CO.ready = false; MODE = 'client'; lsSet('tarelka-mode', 'client'); S = migrate(loadState()) || demoState(); Object.assign(ui, { tab: 'today', date: todayKey(), confirm: null }); if (FB.ok && FB.auth.currentUser && !FB.auth.currentUser.isAnonymous) FB.auth.signOut().catch(() => { }); render(); window.scrollTo(0, 0); },
  async coLogin(b, e, create) {
    const email = ($('#coEmail').value || '').trim(), pass = $('#coPass').value || '';
    ui.coEmail = email;
    if (!email || !pass) { CO.err = 'Введите почту и пароль.'; CO.info = ''; render(); return; }
    CO.busy = true; CO.err = ''; CO.info = ''; render();
    try { await Coach.login(email, pass, !!create); } catch (err) { CO.err = fbErr(err); }
    CO.busy = false; render();
  },
  coSignup(b, e) { return A.coLogin(b, e, true); },
  async coForgot() {
    const email = ($('#coEmail').value || '').trim(); ui.coEmail = email;
    if (!email) { CO.err = 'Впишите почту, на которую создан аккаунт тренера, и нажмите «Забыли пароль?» ещё раз.'; CO.info = ''; render(); return; }
    if (!FB.init()) { CO.err = 'Нет связи с сервером. Проверьте интернет.'; render(); return; }
    CO.busy = true; CO.err = ''; CO.info = ''; render();
    try { FB.auth.languageCode = 'ru'; await FB.auth.sendPasswordResetEmail(email); CO.info = `Письмо со ссылкой для нового пароля отправлено на ${email}. Если его нет во «Входящих» через пару минут, загляните в «Спам». Откройте ссылку, задайте новый пароль и войдите с ним здесь.`; }
    catch (err) { CO.err = fbErr(err); }
    CO.busy = false; render();
  },
  async coAdd() {
    const name = ($('#coNewName').value || '').trim(); if (!name) { toast('Впишите имя подопечной'); return; }
    CO.busy = true; render();
    try { const code = await Coach.addClient(name); toast('Добавлено. Код: ' + code); } catch (e) { toast(fbErr(e)); }
    CO.busy = false; render();
  },
  coOpen(b) { Coach.open(b.dataset.id); },
  coCopy(b) { copyText(b.dataset.code); },
  coNewCode(b) { CO.confirm = 'code:' + b.dataset.id; render(); },
  async coNewCodeYes(b) { CO.confirm = null; try { const code = await Coach.resetCode(b.dataset.id); toast('Новый код: ' + code); } catch (e) { toast(fbErr(e)); } render(); },
  coDel(b) { CO.confirm = 'del:' + b.dataset.id; render(); },
  async coDelYes(b) { CO.confirm = null; try { await Coach.remove(b.dataset.id); toast('Карточка удалена'); } catch (e) { toast(fbErr(e)); } render(); },
  coNo() { CO.confirm = null; render(); },
  coLogout() { Coach.logout(); },
  coachBack() { Coach.close(); }
};
function newProgEx(e) { const k = e.kind || 'w'; return { id: uid(), exId: e.id, name: e.n, sets: k === 'c' ? 1 : 3, reps: k === 't' ? '30' : k === 'c' ? '20' : '10–12' }; }
function sessionEx(exId, name, sets, reps, target) {
  const last = lastFor(exId, name, null), k = kindOf(exId), n = k === 'c' ? 1 : clamp(Math.round(toNum(sets) || 3), 1, 10), out = [];
  for (let j = 0; j < n; j++) { const ls = last ? (last.sets[j] || last.sets[last.sets.length - 1]) : null; out.push({ w: ls ? ls.w || '' : '', r: ls ? ls.r || '' : '', done: false }); }
  return { exId, name, target, reps, sets: out };
}
function addExercise(e) {
  const f = ui.pickFor || {};
  if (f.mode === 'session' && S.session) {
    const pe = newProgEx(e); mutate(() => { S.session.ex.push(sessionEx(e.id, e.n, pe.sets, pe.reps, schemeText(pe))); });
  } else if (f.mode === 'prog' && S.program.days[f.di]) {
    mutate(() => { S.program.days[f.di].ex.push(newProgEx(e)); });
  }
  ui.sheet = null; renderSheet(); render(); toast('Добавлено: ' + e.n);
}

const IN = {
  foodText(el) { ui.text = el.value; clearTimeout(IN._t); IN._t = setTimeout(renderPreview, 140); },
  foodSearch(el) { ui.q = el.value; renderSearch(); },
  pvGrams(el) { const i = +el.dataset.i, x = ui.pv[i]; if (!x) return; const v = toNum(el.value); ui.over[x.key] = isNaN(v) ? '' : v; x.grams = isNaN(v) ? 0 : v; const c = $('#pvk' + i); if (c && !x.food.water) c.textContent = f0(pvKcal(x)) + ' ккал'; updateCommit(); },
  editGrams(el) { const it = getDay(ui.date).items.find(x => x.id === ui.editId); if (it) $('#eInfo').textContent = editInfo(it, el.value); },
  dishName(el) { if (ui.dish) ui.dish.name = el.value; },
  dishQ(el) { if (ui.dish) { ui.dish.q = el.value; renderDishSearch(); } },
  dishG(el) { const d = ui.dish, it = d && d.items[+el.dataset.i]; if (!it) return; it.grams = el.value; const c = $('#dk' + el.dataset.i); if (c) c.textContent = f0(it.kcal * (toNum(it.grams) || 0) / 100) + ' ккал'; updateDishTot(); },
  dishOut(el) { if (ui.dish) { ui.dish.out = el.value; updateDishTot(); } },
  dishPortion(el) { if (ui.dish) { ui.dish.portion = el.value; updateDishTot(); } },
  setW(el) { if (!S.session) return; S.session.ex[+el.dataset.i].sets[+el.dataset.j].w = el.value.trim().replace(',', '.'); save(); },
  setR(el) { if (!S.session) return; S.session.ex[+el.dataset.i].sets[+el.dataset.j].r = el.value.trim(); save(); },
  sessNote(el) { if (!S.session) return; S.session.note = el.value; save(); },
  sessDate(el) { if (!S.session || !el.value) return; S.session.date = el.value; save(); },
  progTitle(el) { mutate(() => { S.program.title = el.value; }); },
  progNote(el) { mutate(() => { S.program.note = el.value; }); },
  dayName(el) { mutate(() => { S.program.days[+el.dataset.d].name = el.value; }); },
  exSets(el) { mutate(() => { S.program.days[+el.dataset.d].ex[+el.dataset.e].sets = el.value.replace(/\D/g, ''); }); },
  exReps(el) { mutate(() => { S.program.days[+el.dataset.d].ex[+el.dataset.e].reps = el.value; }); },
  pickQ(el) { ui.pickQ = el.value; const l = $('#pickList'); l.innerHTML = pickListHtml(filterEx(EXERCISES.concat(S.customEx || []), ui.pickQ, ui.pickG, ui.pickE)); drawThumbs(l); },
  kbQ(el) { ui.kbQ = el.value; const l = $('#kbList'); if (l) { l.innerHTML = kbList(); drawThumbs(l); } const c = $('#kbCount'); if (c) c.textContent = kbCount(); },
  pf(el) {
    const f = el.dataset.f, v = el.value, wasDemo = S.demo; mutate(() => { S.profile[f] = v; });
    if (wasDemo) { render(); const n = document.querySelector(`[data-f="${f}"]`); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) { /* поле без курсора */ } } }
    else { const nbx = $('#normBox'); if (nbx) nbx.innerHTML = normHtml(); }
  }
};
const CH = {
  pf(el) { mutate(() => { S.profile[el.dataset.f] = el.value; }); const nbx = $('#normBox'); if (nbx) nbx.innerHTML = normHtml(); },
  pfManual(el) { mutate(() => { S.profile.manual = el.checked; }); render(); },
  repDetail(el) { ui.repDetail = el.checked; ui.report = ''; },
  exSel(el) { ui.exSel = el.value; render(); }
};

/* ================= Подсказка прогрессии, комментарии тренера, фото прогресса, напоминания ================= */
IC.camera = IC.camera || sv('<path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.4"/>', 18);
IC.msg = sv('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5z"/>', 18);

/* ---------- Подсказка прогрессии в тренировке ---------- */
const repNums = reps => (String(reps || '').match(/\d+/g) || []).map(Number).filter(n => n > 0);
function nextWeight(w) {
  if (w >= 20) return (Math.floor(w / 2.5 + 1e-6) + 1) * 2.5;   // штанга и тренажёры: +2,5 кг
  if (w >= 10) return (Math.floor(w / 2 + 1e-6) + 1) * 2;       // гантели 10–20 кг идут через 2 кг
  return Math.floor(w + 1e-6) + 1;                               // лёгкие гантели — через 1 кг
}
function progHint(e, kind, until) {
  const last = lastFor(e.exId, e.name, null, until);
  if (!last) {
    const t = kind === 'w' ? 'Первый раз — подберите вес, при котором последние 2 повтора даются с трудом'
      : kind === 'bw' ? 'Первый раз — сделайте столько повторов, сколько получается с хорошей техникой'
      : kind === 't' ? 'Первый раз — держите, пока получается сохранять правильное положение' : '';
    return t ? `<div class="sx-hint"><p class="sx-tip">${t}</p></div>` : '';
  }
  const sets = last.sets, rs = sets.map(s => toNum(s.r)).filter(n => n > 0);
  let tip = '';
  if (kind === 'w') {
    const nums = repNums(e.reps), top = nums.length ? Math.max(...nums) : 12, lo = nums.length ? Math.min(...nums) : 10;
    const w0 = Math.max(0, ...sets.map(s => toNum(s.w) || 0));
    const wr = (w0 > 0 ? sets.filter(s => (toNum(s.w) || 0) === w0) : sets).map(s => toNum(s.r) || 0);
    if (wr.some(r => r > 0)) {
      const mn = Math.min(...wr), wt = f1(w0) + ' кг';
      if (w0 <= 0) tip = mn >= top ? 'Все повторы сделаны — можно взять вес' : 'Добавьте повтор в подходе';
      else if (mn >= top) tip = `Все повторы сделаны — попробуйте ${f1(nextWeight(w0))} кг`;
      else if (mn < lo - 2 || wr[0] - mn >= Math.max(3, Math.round(top * 0.3))) tip = `Оставьте ${wt}: к концу повторы заметно падали`;
      else tip = `Оставьте ${wt} и добавьте повтор`;
    }
  } else if (kind === 'bw') { if (rs.length) tip = 'Попробуйте добавить 1–2 повтора в подходе'; }
  else if (kind === 't') { if (rs.length) { const b = Math.max(...rs); tip = `Попробуйте ${f0(b + 5)}–${f0(b + 10)} сек`; } }
  else if (kind === 'c') { if (rs.length) tip = `Добавьте 2–5 минут или оставьте ${f0(rs.reduce((s, x) => s + x, 0))} мин`; }
  return `<div class="sx-hint"><p class="sx-prev">В прошлый раз (${fmtDM(last.date)}): ${esc(setsText(sets, kind))}</p>${tip ? `<p class="sx-tip">${esc(tip)}</p>` : ''}</div>`;
}

/* ---------- Комментарии тренера: S.notes = { 'ГГГГ-ММ-ДД' | 'w:<id тренировки>': { t, ts } }, пишет только тренер ---------- */
const NSEEN = 'tarelka-notes-seen';
const noteOf = key => { const n = S.notes && S.notes[key]; return n && n.t ? n : null; };
function putNote(key, text) {   // только внутри mutate()
  const t = String(text || '').trim().slice(0, 2000);
  S.notes = Object.assign({}, S.notes);
  if (t) { if (!S.notes[key] || S.notes[key].t !== t) S.notes[key] = { t, ts: Date.now() }; } else delete S.notes[key];
  if (ui.noteDraft) delete ui.noteDraft[key];
}
function noteWhen(ts) {
  if (!ts) return ''; const d = new Date(ts), k = dkey(d), t = todayKey();
  return (k === t ? 'сегодня' : k === addDays(t, -1) ? 'вчера' : fmtD(k)) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function noteSeen(key, ts) { if (MODE === 'coach') return; const s = lsJson(NSEEN) || {}; if (s[key] !== ts) { s[key] = ts; lsSet(NSEEN, JSON.stringify(s)); } }
const noteBox = (n, extra) => `<section class="card note-card"><div class="note-hd">${IC.msg}<h2>Комментарий тренера</h2><span class="small muted">${esc(noteWhen(n.ts))}</span></div><p class="note-text">${esc(n.t)}</p>${extra || ''}</section>`;
function noteCard() {
  const k = ui.date, n = noteOf(k);
  if (MODE !== 'coach') { if (!n || S.demo) return ''; noteSeen(k, n.ts); return noteBox(n); }
  if (n && ui.noteEdit !== k) return noteBox(n, `<div class="row"><button class="btn btn-ghost btn-sm" data-a="noteEdit">Изменить</button><button class="btn btn-warn btn-sm" data-a="noteDel">Удалить</button></div>`);
  const d = ui.noteDraft && ui.noteDraft[k] != null ? ui.noteDraft[k] : (n ? n.t : '');
  return `<section class="card"><div class="note-hd">${IC.msg}<h2 id="noteH">Комментарий тренера</h2></div>
    <textarea id="noteTa" class="input" rows="2" data-in="noteDraft" data-k="${esc(k)}" maxlength="2000" aria-labelledby="noteH" placeholder="Подопечная увидит его в этот день: похвала, совет, задача">${esc(d)}</textarea>
    <div class="row"><button class="btn btn-primary btn-sm" data-a="noteSave">Сохранить</button>${n ? `<button class="btn btn-ghost btn-sm" data-a="noteCancel">Отмена</button>` : ''}</div></section>`;
}
function notesBanner() {
  if (MODE === 'coach' || S.demo || !S.notes) return '';
  const seen = lsJson(NSEEN) || {}, since = Date.now() - 14 * 864e5;
  const fresh = Object.keys(S.notes).filter(k => {
    const n = noteOf(k); if (!n || n.ts < since || seen[k] === n.ts || k === ui.date) return false;
    return k.startsWith('w:') ? S.workouts.some(w => w.id === k.slice(2)) : /^\d{4}-\d\d-\d\d$/.test(k);
  }).sort((a, b) => S.notes[b].ts - S.notes[a].ts);
  if (!fresh.length) return '';
  const k = fresh[0], w = k.startsWith('w:') ? S.workouts.find(x => x.id === k.slice(2)) : null;
  const what = w ? `к тренировке «${esc(w.dayName)}», ${fmtD(w.date)}` : k === addDays(todayKey(), -1) ? 'ко вчерашнему дню' : k === todayKey() ? 'к сегодняшнему дню' : 'к ' + fmtD(k);
  return `<div class="banner plain note-banner"><p>Новый комментарий тренера ${what}${fresh.length > 1 ? ` и ещё ${fresh.length - 1}` : ''}.</p><button class="btn btn-primary btn-sm" data-a="noteGo" data-k="${esc(k)}">Открыть</button></div>`;
}
function woNoteHtml(w) {
  const k = 'w:' + w.id, n = noteOf(k);
  if (MODE === 'coach') {
    const v = ui.noteDraft && ui.noteDraft[k] != null ? ui.noteDraft[k] : (n ? n.t : '');
    return `<div class="field"><label for="woNote">Комментарий тренера</label><textarea id="woNote" class="input" rows="2" data-in="noteDraft" data-k="${esc(k)}" maxlength="2000" placeholder="Подопечная увидит его в истории тренировок">${esc(v)}</textarea><p class="hint">Сохранится кнопкой «Сохранить» ниже.</p></div>`;
  }
  if (!n) return '';
  noteSeen(k, n.ts);
  return `<div class="note-card note-in"><div class="note-hd">${IC.msg}<b>Комментарий тренера</b><span class="small muted">${esc(noteWhen(n.ts))}</span></div><p class="note-text">${esc(n.t)}</p></div>`;
}

/* ---------- Фото прогресса: IndexedDB 'tarelka-photos' (meta + img), облако clients/{cid}/photos/{id} ---------- */
const PH_VIEWS = [['front', 'Спереди'], ['side', 'Сбоку'], ['back', 'Сзади']];
const PH_MAX = 900, PH_Q = 0.72, PH_LIMIT = 250000;
const phViewName = v => (PH_VIEWS.find(x => x[0] === v) || [0, ''])[1];
const phOrder = m => { const i = PH_VIEWS.findIndex(x => x[0] === m.view); return i < 0 ? 9 : i; };
const phScope = () => MODE === 'coach' ? (CO.cur ? 'c-' + CO.cur : null) : 'me';
const phDateLong = k => fmtD(k) + (pk(k).getFullYear() !== new Date().getFullYear() ? ' ' + pk(k).getFullYear() : '');
const phMem = { meta: new Map(), img: new Map() };   // если IndexedDB недоступна
let phDbP = null;
function phDb() {
  if (!phDbP) phDbP = new Promise(res => {
    try {
      const rq = indexedDB.open('tarelka-photos', 1);
      rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'k' }).createIndex('scope', 'scope'); if (!db.objectStoreNames.contains('img')) db.createObjectStore('img', { keyPath: 'k' }); };
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
  return phDbP;
}
const phReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const phDone = tx => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
async function phAll(scope) { const db = await phDb(); if (!db) return [...phMem.meta.values()].filter(m => m.scope === scope).map(m => Object.assign({}, m)); return phReq(db.transaction('meta').objectStore('meta').index('scope').getAll(scope)); }
async function phGet(k) { const db = await phDb(); if (!db) { const m = phMem.meta.get(k); return m ? Object.assign({}, m) : null; } return (await phReq(db.transaction('meta').objectStore('meta').get(k))) || null; }
async function phImg(k) { const db = await phDb(); if (!db) return (phMem.img.get(k) || {}).data || null; const r = await phReq(db.transaction('img').objectStore('img').get(k)); return r ? r.data : null; }
async function phPut(m, data) {   // data: строка — записать, false — удалить картинку, undefined — не трогать
  const db = await phDb();
  if (!db) { phMem.meta.set(m.k, Object.assign({}, m)); if (typeof data === 'string') phMem.img.set(m.k, { k: m.k, data }); else if (data === false) phMem.img.delete(m.k); return; }
  const tx = db.transaction(['meta', 'img'], 'readwrite'); tx.objectStore('meta').put(m);
  if (typeof data === 'string') tx.objectStore('img').put({ k: m.k, data }); else if (data === false) tx.objectStore('img').delete(m.k);
  return phDone(tx);
}
async function phDelRec(k) { const db = await phDb(); if (!db) { phMem.meta.delete(k); phMem.img.delete(k); return; } const tx = db.transaction(['meta', 'img'], 'readwrite'); tx.objectStore('meta').delete(k); tx.objectStore('img').delete(k); return phDone(tx); }
const phLoadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('img')); im.src = src; });
async function phDecode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { const u = URL.createObjectURL(file); try { return await phLoadImg(u); } finally { setTimeout(() => URL.revokeObjectURL(u), 1000); } }
}
function phJpeg(src, max, q, limit) {   // уменьшает до max px по длинной стороне; если не влезает в limit — снижает качество и размер
  const W = src.naturalWidth || src.width, H = src.naturalHeight || src.height;
  if (!W || !H) throw new Error('img');
  let m = max, qq = q, out = '';
  for (let i = 0; i < 8; i++) {
    const sc = Math.min(1, m / Math.max(W, H)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(W * sc)); c.height = Math.max(1, Math.round(H * sc));
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
    out = c.toDataURL('image/jpeg', qq);
    if (!limit || out.length <= limit) break;
    if (qq > 0.56) qq = Math.round((qq - 0.08) * 100) / 100; else m = Math.round(m * 0.85);
  }
  return out;
}
async function phThumb(dataUrl) { try { return phJpeg(await phLoadImg(dataUrl), 260, 0.66, 0); } catch (e) { return ''; } }
function weightNear(k, maxDays) {
  let best = null, bd = Infinity; const t = pk(k).getTime();
  for (const w of S.weights) { const d = Math.abs(pk(w.date).getTime() - t) / 864e5; if (d < bd) { bd = d; best = w; } }
  return best && bd <= (maxDays || 14) ? best : null;
}
function phRefresh() { if (ui.tab !== 'progress' || (MODE === 'coach' && !CO.cur)) return; if (ui.sheet || typing()) { pendingRender = true; return; } render(); }
function phCardRefresh() { const el = $('#phCard'); if (el) el.outerHTML = photoSection(); }
const PH = {
  scope: null, list: [], loading: false, cache: new Map(), q: Promise.resolve(), busy: false, again: false,
  load(scope) {
    this.scope = scope; this.loading = true; this.list = [];
    phAll(scope).then(ms => { if (this.scope === scope) this.set(ms); }).catch(() => { if (this.scope === scope) this.set([]); });
  },
  set(ms) {
    this.list = ms.filter(m => !m.del).sort((a, b) => b.date.localeCompare(a.date) || phOrder(a) - phOrder(b) || a.ts - b.ts);
    this.loading = false; phRefresh();
  },
  async reload(scope) { if (this.scope === scope) this.set(await phAll(scope)); },
  async add(p) {
    const scope = phScope(); if (!scope) return;
    const id = uid(), m = { k: scope + '|' + id, scope, id, date: p.date, view: p.view || '', note: p.note || '', ts: Date.now(), by: MODE === 'coach' ? 'coach' : 'client', up: '', del: false, thumb: await phThumb(p.data) };
    await phPut(m, p.data); this.cache.set(m.k, p.data);
    if (this.scope === scope) this.set(this.list.concat([m]));
    this.flush();
  },
  async remove(id) {
    const scope = phScope(), m = this.list.find(x => x.id === id); if (!m || !scope) return;
    this.list = this.list.filter(x => x !== m); this.cache.delete(m.k);
    if (Sync.cid && Sync.phScope === scope) { await phPut(Object.assign({}, m, { del: true, ts: Date.now(), thumb: '' }), false); this.flush(); }   // надгробие уйдёт в облако
    else await phDelRec(m.k);
  },
  async clear(scope) {
    const ms = await phAll(scope).catch(() => []);
    for (const m of ms) await phDelRec(m.k).catch(() => { });
    if (this.scope === scope) this.set([]);
  },
  // изменения из облака (тренер ↔ подопечная): кешируем картинки у себя
  onSnap(snap, cid, scope) {
    const chs = snap.docChanges().filter(c => c.type !== 'removed' && !(c.doc.metadata && c.doc.metadata.hasPendingWrites)).map(c => ({ id: c.doc.id, r: c.doc.data() || {} }));
    if (!chs.length) return;
    this.q = this.q.then(async () => {
      const loc = new Map((await phAll(scope)).map(m => [m.id, m])); let ch = false;
      for (const { id, r } of chs) {
        const m = loc.get(id), ts = +r.ts || 0;
        if (r.del) { if (m && (m.ts || 0) <= ts) { await phDelRec(m.k); ch = true; } continue; }
        if (typeof r.data !== 'string' || !/^data:image\//.test(r.data)) continue;
        if (m && (m.ts || 0) >= ts) { if (!m.del && m.up !== cid && m.ts === ts) { m.up = cid; await phPut(m); } continue; }
        const nm = { k: scope + '|' + id, scope, id, date: /^\d{4}-\d\d-\d\d$/.test(r.date) ? r.date : todayKey(), view: PH_VIEWS.some(x => x[0] === r.view) ? r.view : '', note: String(r.note || '').slice(0, 200), ts, by: r.by === 'coach' ? 'coach' : 'client', up: cid, del: false, thumb: await phThumb(r.data) };
        await phPut(nm, r.data); ch = true;
      }
      if (ch) await this.reload(scope);
    }).catch(() => { });
  },
  // отправка в облако: новые фото (в т.ч. снятые до подключения к тренеру) и удаления
  async flush() {
    if (this.busy) { this.again = true; return; }
    const cid = Sync.cid, scope = Sync.phScope;
    if (!cid || !Sync.ready || !scope || Sync.status === 'lost') return;
    this.busy = true;
    try {
      do {
        this.again = false;
        for (const m of await phAll(scope)) {
          if (Sync.cid !== cid) break;
          const doc = Sync.ref().collection('photos').doc(m.id);
          if (m.del) { await doc.set({ del: true, ts: m.ts }); await phDelRec(m.k); }
          else if (m.up !== cid) {
            const data = await phImg(m.k); if (!data) continue;
            await doc.set({ date: m.date, view: m.view, note: m.note, data, ts: m.ts, by: m.by });
            const cur = await phGet(m.k); if (cur && !cur.del) { cur.up = cid; await phPut(cur); }
          }
        }
      } while (this.again && Sync.cid === cid);
    } catch (e) { /* повторю при следующем подключении */ }
    this.busy = false;
  }
};
function phFill(root) {   // подставляет полноразмерные фото вместо миниатюр
  root.querySelectorAll('img[data-ph]').forEach(img => {
    const k = img.dataset.ph, c = PH.cache.get(k);
    if (c) { img.src = c; return; }
    phImg(k).then(d => { if (!d) return; PH.cache.set(k, d); if (PH.cache.size > 8) PH.cache.delete(PH.cache.keys().next().value); if (img.isConnected) img.src = d; }).catch(() => { });
  });
}
function photoSection() {
  const sc = phScope(); if (sc && PH.scope !== sc) PH.load(sc);
  const list = PH.list, sel = ui.phSel, n = list.length;
  let body;
  if (PH.loading) body = `<p class="muted small">Загружаю фото…</p>`;
  else if (!n) body = `<p class="muted small">Фото показывают изменения, которые не видно на весах. Снимайтесь раз в 2–4 недели: одна поза, тот же свет и похожая одежда.</p>`;
  else {   // сетка по датам, новые сверху; подпись — дата съёмки
    const shown = ui.phAll || sel || n <= 9 ? list : list.slice(0, 6);
    body = `<div class="ph-grid">${shown.map(m => {
      const si = sel ? sel.indexOf(m.id) : -1;
      return `<div class="ph-it"><button class="ph-th${si >= 0 ? ' sel' : ''}" data-a="phTap" data-id="${esc(m.id)}"${sel ? ` aria-pressed="${si >= 0}"` : ''} aria-label="Фото за ${fmtD(m.date)}${m.view ? ', ' + phViewName(m.view).toLowerCase() : ''}">${m.thumb ? `<img src="${esc(m.thumb)}" alt="">` : ''}${m.view ? `<span class="ph-cap">${phViewName(m.view)}</span>` : ''}${si >= 0 ? `<i class="ph-num">${si + 1}</i>` : ''}</button><span class="ph-d">${phDateLong(m.date)}</span></div>`;
    }).join('')}</div>` + (shown.length < n ? `<button class="btn-link" data-a="phMore">Показать все фото (${n})</button>` : '');
  }
  const ctrl = sel ? `<div class="banner plain"><p>${sel.length ? 'Выберите второе фото' : 'Выберите два фото для сравнения'}</p><button class="btn btn-ghost btn-sm" data-a="phCmpCancel">Отмена</button></div>`
    : `<div class="row"><button class="btn btn-ghost btn-sm" data-a="phAdd">${IC.camera} Добавить фото</button>${n >= 2 ? `<button class="btn btn-ghost btn-sm" data-a="phCmpStart">Сравнить</button>` : ''}</div>`;
  return `<section class="card" id="phCard"><div class="sec-head"><h2>Фото прогресса</h2>${n ? `<span class="muted small">${n} фото</span>` : ''}</div>${sel ? ctrl : ''}${body}${sel ? '' : ctrl}<input type="file" id="phIn" accept="image/*" hidden data-ch="phFile"></section>`;
}
function sheetPhNew() {
  const p = ui.phNew; if (!p) return sheetHead('Новое фото');
  return `${sheetHead('Новое фото')}
    <div class="ph-stage small"><img src="${esc(p.data)}" alt="Выбранное фото"></div>
    <div class="grid2"><div class="field"><label for="phDate">Дата</label><input id="phDate" class="input" type="date" value="${esc(p.date)}" max="${todayKey()}"></div></div>
    <div class="field"><span class="lbl">Ракурс</span><div class="chips">${PH_VIEWS.map(([v, l]) => `<button class="chip" data-a="phView" data-v="${v}" aria-pressed="${p.view === v}">${l}</button>`).join('')}</div></div>
    <div class="field"><label for="phNote">Заметка</label><input id="phNote" class="input" maxlength="200" placeholder="Необязательно" autocomplete="off"></div>
    <p class="hint">Снимайтесь в одной позе, при одном свете и в похожей одежде — так изменения заметнее. ${MODE === 'coach' ? 'Подопечная тоже увидит это фото.' : S.link ? 'Фото увидит тренер.' : 'Фото хранится только на этом телефоне.'}</p>
    <button class="btn btn-primary" data-a="phSave">Сохранить фото</button>`;
}
function sheetPhoto() {
  const m = PH.list.find(x => x.id === ui.phId); if (!m) return sheetHead('Фото удалено');
  const w = weightNear(m.date, 14);
  const info = [phViewName(m.view), w ? `вес ${f1(w.kg)} кг${w.date !== m.date ? ' (' + fmtDM(w.date) + ')' : ''}` : '', m.by === 'coach' ? 'добавил тренер' : MODE === 'coach' ? 'добавила подопечная' : ''].filter(Boolean).join(' · ');
  const other = Sync.cid ? (MODE === 'coach' ? ' Оно пропадёт и у подопечной.' : ' Оно пропадёт и у тренера.') : '';
  return `${sheetHead(phDateLong(m.date))}
    <div class="ph-stage"><img data-ph="${esc(m.k)}" src="${esc(m.thumb)}" alt="Фото прогресса за ${fmtD(m.date)}"></div>
    ${info ? `<p class="small muted">${esc(info)}</p>` : ''}${m.note ? `<p class="note-text">${esc(m.note)}</p>` : ''}
    ${ui.confirm === 'phDel' ? `<div class="confirm"><p>Удалить это фото?${other}</p><div class="row"><button class="btn btn-warn btn-sm" data-a="phDelYes">Удалить</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>`
      : `<button class="btn btn-warn" data-a="phDel">Удалить фото</button>`}`;
}
function sheetPhCmp() {
  const ms = (ui.phSel || []).map(id => PH.list.find(x => x.id === id)).filter(Boolean).sort((x, y) => x.date.localeCompare(y.date) || x.ts - y.ts);
  if (ms.length < 2) return sheetHead('Сравнение');
  const [a, b] = ms, wa = weightNear(a.date, 14), wb = weightNear(b.date, 14), days = Math.round((pk(b.date) - pk(a.date)) / 864e5);
  const col = (m, w) => `<figure class="ph-col"><div class="ph-cbox"><img data-ph="${esc(m.k)}" src="${esc(m.thumb)}" alt="Фото за ${fmtD(m.date)}"></div>
    <figcaption><b>${phDateLong(m.date)}</b><span>${[phViewName(m.view), w ? f1(w.kg) + ' кг' : 'вес не записан'].filter(Boolean).join(' · ')}</span></figcaption></figure>`;
  return `${sheetHead('Сравнение')}<div class="ph-cmp">${col(a, wa)}${col(b, wb)}</div>
    <p class="small muted">${days ? `Между снимками ${days} ${plural(days, 'день', 'дня', 'дней')}` : 'Снимки одного дня'}${wa && wb && wa.date !== wb.date ? ` · вес ${sgn(wb.kg - wa.kg)} кг` : ''}</p>
    <button class="btn btn-ghost" data-a="closeSheet">Готово</button>`;
}

/* ---------- Напоминания: только для владельца телефона, хранятся в localStorage, не синхронизируются ---------- */
const RKEY = 'tarelka-reminders', RSENT = 'tarelka-reminders-sent';
const WD_ISO = [[1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт'], [6, 'Сб'], [7, 'Вс']];
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7], REM_KEYS = ['water', 'train', 'weigh', 'measure'];
const remOk = () => !!(NB && typeof NB.setReminders === 'function');
let notifSt = null;
const remDefDays = () => [[1], [1, 4], [1, 3, 5], [1, 2, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6], ALL_DAYS][clamp(S.program.days.length || 3, 1, 7) - 1].slice();
function remCfg() {
  const r = lsJson(RKEY) || {}, o = (d, x) => Object.assign(d, x && typeof x === 'object' ? x : {});
  const c = { water: o({ on: false, every: 2, from: '10:00', to: '20:00' }, r.water), train: o({ on: false, days: null, time: '18:00' }, r.train),
    weigh: o({ on: false, day: 1, time: '08:00' }, r.weigh), measure: o({ on: false, day: 7, time: '10:00' }, r.measure) };
  if (!Array.isArray(c.train.days) || !c.train.days.length) c.train.days = remDefDays();
  return c;
}
const hmOf = (t, d) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); return m ? [clamp(+m[1], 0, 23), clamp(+m[2], 0, 59)] : d; };
function nextProgDay() {
  const P = S.program.days; if (!P.length) return null;
  const last = S.workouts.filter(w => P.some(d => d.id === w.dayId)).sort((a, b) => b.date.localeCompare(a.date))[0];
  return last ? P[(P.findIndex(d => d.id === last.dayId) + 1) % P.length] : P[0];
}
function remList(c) {
  const out = [];
  if (c.water.on) {
    const a = hmOf(c.water.from, [10, 0]), b = hmOf(c.water.to, [20, 0]), step = clamp(Math.round(+c.water.every || 2), 1, 4) * 60;
    for (let t = a[0] * 60 + a[1]; t <= b[0] * 60 + b[1] && out.length < 24; t += step) {
      const h = Math.floor(t / 60), m = t % 60;
      out.push({ id: 'water-' + h + (m ? '-' + pad(m) : ''), h, m, days: ALL_DAYS.slice(), title: 'Вода', text: 'Время выпить стакан воды' });
    }
  }
  if (c.train.on) { const [h, m] = hmOf(c.train.time, [18, 0]), d = nextProgDay(); out.push({ id: 'train', h, m, days: c.train.days.slice().sort((x, y) => x - y), title: 'Тренировка', text: d ? 'Сегодня тренировка: ' + d.name : 'Сегодня по плану тренировка' }); }
  if (c.weigh.on) { const [h, m] = hmOf(c.weigh.time, [8, 0]); out.push({ id: 'weigh', h, m, days: [clamp(+c.weigh.day || 1, 1, 7)], title: 'Взвешивание', text: 'Утро взвешивания: встаньте на весы натощак' }); }
  if (c.measure.on) { const [h, m] = hmOf(c.measure.time, [10, 0]); out.push({ id: 'measure', h, m, days: [clamp(+c.measure.day || 7, 1, 7)], title: 'Замеры', text: 'Пора сделать замеры' }); }
  return out;
}
function remApply(force) {
  if (!remOk() || MODE === 'coach') return;
  const json = JSON.stringify(remList(remCfg()));
  if (!force && json === lsGet(RSENT)) return;
  try { NB.setReminders(json); lsSet(RSENT, json); } catch (e) { /* мост без напоминаний */ }
}
function remSet(c, focusKey) { lsSet(RKEY, JSON.stringify(c)); remApply(); remCardRefresh(focusKey); }
function remCardRefresh(focusKey) {
  const el = $('#remCard'); if (!el) return;
  el.outerHTML = remCard();
  if (focusKey) { const f = $(`[data-ch="remOn"][data-k="${focusKey}"]`); if (f) f.focus(); }
}
function remOpts(k, c) {
  const x = c[k];
  const time = (f, v, lab) => `<div class="field"><label for="rem_${k}_${f}">${lab}</label><input id="rem_${k}_${f}" class="input input-sm" type="time" data-ch="remTime" data-k="${k}" data-f="${f}" value="${esc(v)}"></div>`;
  const wdays = sel => `<div class="wdays" role="group" aria-label="Дни недели">${WD_ISO.map(([n, l]) => `<button type="button" data-a="remDay" data-k="${k}" data-d="${n}" aria-pressed="${sel.includes(n)}">${l}</button>`).join('')}</div>`;
  if (k === 'water') {
    const n = remList({ water: x, train: {}, weigh: {}, measure: {} }).length;
    return `<div class="rem-opts"><div class="grid2"><div class="field"><label for="rem_water_every">Каждые</label><select id="rem_water_every" class="input input-sm" data-ch="remEvery">${[1, 2, 3, 4].map(v => `<option value="${v}" ${+x.every === v ? 'selected' : ''}>${v} ч</option>`).join('')}</select></div><span></span>${time('from', x.from, 'С')}${time('to', x.to, 'До')}</div>
      <p class="hint">${n ? `${n} ${plural(n, 'напоминание', 'напоминания', 'напоминаний')} в день` : 'Время «до» должно быть позже, чем «с».'}</p></div>`;
  }
  return `<div class="rem-opts">${wdays(k === 'train' ? x.days : [+x.day])}<div class="grid2">${time('time', x.time, 'Время')}</div></div>`;
}
function remCard() {
  const ok = remOk(), c = remCfg(), any = ok && REM_KEYS.some(k => c[k].on);
  if (ok) notifSt = nb('notifStatus') || notifSt;
  const wd = n => (WD_ISO.find(x => x[0] === +n) || [0, ''])[1];
  const rows = [['water', 'Вода', `каждые ${c.water.every} ч, ${c.water.from}–${c.water.to}`], ['train', 'Тренировка', `${c.train.days.slice().sort((a, b) => a - b).map(wd).join(', ')} в ${c.train.time}`],
    ['weigh', 'Взвешивание', `${wd(c.weigh.day)} в ${c.weigh.time}, натощак`], ['measure', 'Замеры', `${wd(c.measure.day)} в ${c.measure.time}`]];
  let h = `<section class="card" id="remCard"><div class="sec-head"><h2>Напоминания</h2>${any ? `<span class="pill ok">включены</span>` : ''}</div>`;
  if (!ok) h += `<p class="small muted">Напоминания работают в приложении на телефоне.</p>`;
  else if (any && notifSt === 'denied') h += `<div class="banner plain"><p>Уведомления для приложения выключены — напоминания не придут. Включите их в настройках.</p><button class="btn btn-ghost btn-sm" data-a="notifSettings">Открыть настройки</button></div>`;
  else if (any && notifSt === 'need') h += `<div class="banner"><p>Разрешите уведомления, иначе напоминания не придут.</p><button class="btn btn-primary btn-sm" data-a="notifAllow">Разрешить</button></div>`;
  h += rows.map(([k, title, sub]) => {
    const on = ok && c[k].on;
    return `<div class="rem${ok ? '' : ' off'}"><label class="rem-hd"><span class="grow"><b>${title}</b><small>${esc(sub)}</small></span><span class="sw"><input type="checkbox" role="switch" data-ch="remOn" data-k="${k}" aria-label="${title}" ${on ? 'checked' : ''} ${ok ? '' : 'disabled'}><i></i></span></label>${on ? remOpts(k, c) : ''}</div>`;
  }).join('');
  return h + `</section>`;
}
window.__onNotifPerm = st => { notifSt = st; remCardRefresh(); };

Object.assign(SHEETS, { phNew: sheetPhNew, photo: sheetPhoto, phCmp: sheetPhCmp });
Object.assign(A, {
  /* комментарии тренера */
  noteSave() {
    if (MODE !== 'coach') return;
    const k = ui.date, ta = $('#noteTa'), t = (ta ? ta.value : '').trim();
    if (!t) { toast('Напишите комментарий'); if (ta) ta.focus(); return; }
    mutate(() => { putNote(k, t); }); ui.noteEdit = null; render(); toast('Комментарий сохранён');
  },
  noteEdit() { ui.noteEdit = ui.date; render(); setTimeout(() => { const t = $('#noteTa'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 30); },
  noteCancel() { if (ui.noteDraft) delete ui.noteDraft[ui.date]; ui.noteEdit = null; render(); },
  noteDel() {
    const k = ui.date, n = noteOf(k); if (!n || MODE !== 'coach') return;
    mutate(() => { putNote(k, ''); }); ui.noteEdit = null; ui.undo = { note: { k, n } }; render();
    toast('Комментарий удалён', { a: 'undoNote', label: 'Вернуть' });
  },
  undoNote() { const u = ui.undo; if (!u || !u.note) return; mutate(() => { S.notes = Object.assign({}, S.notes, { [u.note.k]: u.note.n }); }); ui.undo = null; $('#toast').hidden = true; render(); },
  noteGo(b) { const k = b.dataset.k; if (k.startsWith('w:')) { ui.woId = k.slice(2); openSheet('workout'); } else { ui.date = k; render(); window.scrollTo(0, 0); } },
  /* фото прогресса */
  phAdd() { const i = $('#phIn'); if (i) i.click(); },
  phMore() { ui.phAll = true; phCardRefresh(); },
  phCmpStart() { ui.phSel = []; phCardRefresh(); },
  phCmpCancel() { ui.phSel = null; phCardRefresh(); },
  phTap(b) {
    const id = b.dataset.id;
    if (ui.phSel) {
      const i = ui.phSel.indexOf(id); if (i >= 0) ui.phSel.splice(i, 1); else if (ui.phSel.length < 2) ui.phSel.push(id);
      if (ui.phSel.length === 2) openSheet('phCmp'); else phCardRefresh();
      return;
    }
    ui.phId = id; ui.confirm = null; openSheet('photo');
  },
  phView(b) { const p = ui.phNew; if (!p) return; p.view = p.view === b.dataset.v ? '' : b.dataset.v; $('#sheet').querySelectorAll('[data-a="phView"]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === p.view))); },
  async phSave() {
    const p = ui.phNew; if (!p) return;
    const date = ($('#phDate') || {}).value || todayKey(), note = (($('#phNote') || {}).value || '').trim().slice(0, 200);
    if (date > todayKey()) { toast('Дата не может быть в будущем'); return; }
    if (S.demo) mutate(() => { });
    ui.phNew = null; ui.sheet = null; renderSheet();
    try { await PH.add({ data: p.data, date, view: p.view, note }); toast('Фото сохранено'); }
    catch (e) { toast('Не получилось сохранить фото: память телефона недоступна'); }
    render();
  },
  phDel() { ui.confirm = 'phDel'; renderSheet(); },
  async phDelYes() { const id = ui.phId; ui.confirm = null; ui.sheet = null; renderSheet(); await PH.remove(id).catch(() => { }); render(); toast('Фото удалено'); },
  /* напоминания */
  remDay(b) {
    const c = remCfg(), k = b.dataset.k, d = +b.dataset.d;
    if (k === 'train') {
      const s = new Set(c.train.days);
      if (s.has(d)) { if (s.size === 1) { toast('Оставьте хотя бы один день'); return; } s.delete(d); } else s.add(d);
      c.train.days = [...s].sort((x, y) => x - y);
    } else c[k].day = d;
    remSet(c);
  },
  notifAllow() { nb('requestNotif'); },
  notifSettings() { nb('openAppSettings'); }
});
Object.assign(IN, { noteDraft(el) { (ui.noteDraft = ui.noteDraft || {})[el.dataset.k] = el.value; } });
Object.assign(CH, {
  async phFile(el) {
    const f = el.files && el.files[0]; el.value = ''; if (!f) return;
    toast('Готовлю фото…');
    try {
      const src = await phDecode(f), data = phJpeg(src, PH_MAX, PH_Q, PH_LIMIT); if (src.close) src.close();
      $('#toast').hidden = true; ui.phNew = { data, date: todayKey(), view: '' }; openSheet('phNew');
    } catch (e) { toast('Не получилось открыть фото. Выберите снимок в формате JPG или PNG.'); }
  },
  remOn(el) {
    const c = remCfg(), k = el.dataset.k, was = REM_KEYS.some(x => c[x].on);
    c[k].on = el.checked;
    if (el.checked && !was) { notifSt = nb('notifStatus') || notifSt; if (notifSt === 'need') nb('requestNotif'); }
    remSet(c, k);
  },
  remEvery(el) { const c = remCfg(); c.water.every = clamp(+el.value || 2, 1, 4); remSet(c); },
  remTime(el) { if (!/^\d{1,2}:\d{2}/.test(el.value)) return; const c = remCfg(); c[el.dataset.k][el.dataset.f] = el.value.slice(0, 5); remSet(c); }
});

document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const fn = A[b.dataset.a]; if (fn) { e.preventDefault(); fn(b, e); } });
document.addEventListener('input', e => { const el = e.target, h = el.dataset && el.dataset.in; if (h && IN[h]) IN[h](el, e); });
document.addEventListener('change', e => { const el = e.target, h = el.dataset && el.dataset.ch; if (h && CH[h]) CH[h](el, e); });
$('#sheetBack').addEventListener('click', e => { if (e.target.id === 'sheetBack') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.sheet) closeSheet(); });
document.addEventListener('keydown', e => { const a = e.key === 'Enter' && e.target && { bcCode: 'bcFind', wAdd: 'waterAdd', glassIn: 'glassSave' }[e.target.id]; if (a) { e.preventDefault(); A[a](e.target, e); } });

/* ================= Связь с Android ================= */
window.appBack = () => {
  if (ui.sheet) { if (ui.sheet === 'barcode') A.bcBack(); else if (ui.sheet === 'dish' && ui.dish && ui.dish.from === 'add') A.dishBack(); else closeSheet(); return true; }
  if (ui.confirm) { ui.confirm = null; render(); return true; }
  if (ui.editProg) { A.progDone(); return true; }
  if (MODE === 'coach' && !CO.cur) return false;
  if (ui.tab !== 'today') { ui.tab = 'today'; render(); window.scrollTo(0, 0); return true; }
  if (ui.date !== todayKey()) { ui.date = todayKey(); render(); return true; }
  if (MODE === 'coach' && CO.cur) { Coach.close(); return true; }
  return false;
};
window.onSteps = json => { try { nativeSteps = JSON.parse(json) || {}; } catch (e) { return; } syncPhoneSteps(); if (!ui.sheet && !typing()) updateActivityCard(); };
window.onStepsStatus = st => { stepsStatus = st; refreshSteps(); if (!ui.sheet) render(); };
window.onAppResume = () => {
  refreshSteps(); syncPhoneSteps();
  if (renderedDay !== todayKey() && ui.date === renderedDay) ui.date = todayKey();
  if (rest) tickRest();
  if (!ui.sheet) render();
};

const h0 = location.hash.replace('#', '');
if (['today', 'train', 'progress', 'kb', 'profile'].includes(h0)) ui.tab = h0;
refreshSteps(); syncPhoneSteps();
render();
remApply(true);
if (S.session) nb('keepScreenOn', true);
document.addEventListener('focusout', () => { setTimeout(() => { if (pendingRender && !ui.sheet && !typing()) render(); }, 60); });
if (FB.init()) {
  FB.auth.onAuthStateChanged(user => {
    CO.authChecked = true;
    if (MODE === 'coach') {
      const u = user && !user.isAnonymous ? user : null;
      if (u && (!CO.user || CO.user.uid !== u.uid)) { CO.user = u; CO.err = ''; Coach.load(); }
      else if (!u && CO.user) { CO.user = null; }
      if (!CO.cur) render();
    } else if (S.link && !Sync.cid) {
      if (user && user.isAnonymous) Sync.start(S.link.clientId, 'client');
      else { Sync.status = 'lost'; Sync.err = 'Попросите у тренера новый код и введите его в «Профиле».'; }
      render();
    }
  });
} else CO.authChecked = true;
window.__app = { get S() { return S; }, Sync, CO };
})();

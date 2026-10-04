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
  check: sv('<path d="M5.5 12.5l4.2 4.2 8.8-9.4"/>', 20), chev: sv('<path d="M9.5 6l6 6-6 6"/>', 18),
  play: sv('<path d="M10 4.5h5.5M12.75 4.5v2.2"/><circle cx="12.75" cy="13.5" r="6.8"/><path d="M12.75 10v3.5l2.3 1.6"/>', 18)
};
const glassSvg = on => `<svg viewBox="0 0 30 38" width="26" height="34" aria-hidden="true"><path d="M4 3h22l-2.6 30.2a2.5 2.5 0 0 1-2.5 2.3H9.1a2.5 2.5 0 0 1-2.5-2.3z" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

/* ================= Мост к Android ================= */
const NB = window.AndroidBridge || null;
const nb = (m, ...a) => { try { return NB && typeof NB[m] === 'function' ? NB[m](...a) : undefined; } catch (e) { return undefined; } };

/* ================= Хранение ================= */
const KEY = 'tarelka-shtanga-v1';
let storageOk = true;
try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch (e) { storageOk = false; }
function loadState() { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch (e) { storageOk = false; return null; } }
function save() { if (S.demo) return; try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; } catch (e) { storageOk = false; } }

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
    workouts: [], session: null, custom: [], recent: [], customEx: [] };
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
  pendingImport: null, pendingRestore: null, per: 30, meas: 'waist', exSel: null, kbTab: 'ex', kbQ: '', kbG: '', exId: null, exFrom: null, artId: null,
  pickFor: null, pickQ: '', pickG: '', pickNew: false, woId: null, tplId: null, finishMin: '' };

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
  if (nativeSteps[k] != null) return { n: +nativeSteps[k] || 0, src: 'phone' };
  return { n: 0, src: null };
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
  if (S.demo) return `<div class="banner"><p>Это пример заполненного дневника, чтобы было видно, как всё работает. Ваши записи начнутся с чистого листа.</p><button class="btn btn-primary btn-sm" data-a="startFresh">Начать свой дневник</button></div>`;
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
  if (!S.demo && isToday && st.src !== 'manual') {
    if (stepsStatus === 'need') ctrl = `<div class="banner"><p>Разрешите приложению доступ к датчику шагов — тогда шаги будут считаться сами.</p><button class="btn btn-primary btn-sm" data-a="stepsAllow">Разрешить</button></div>`;
    else if (stepsStatus === 'denied') ctrl = `<div class="banner plain"><p>Доступ к шагам запрещён. Включите «Физическая активность» в настройках приложения или вводите шаги вручную.</p><button class="btn btn-ghost btn-sm" data-a="stepsSettings">Открыть настройки</button></div>`;
  }
  const src = st.src === 'manual' ? 'введено вручную' : st.src === 'phone' ? 'считает телефон' : (stepsStatus === 'ok' && isToday ? 'считает телефон' : '');
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
  const wt = waterTarget(), water = day.water || 0, filled = Math.floor(water / 250);
  const n = Math.min(16, Math.max(Math.ceil(wt / 250), filled + 1));
  let glasses = ''; for (let i = 0; i < n; i++) glasses += `<button class="glass${i < filled ? ' on' : ''}" data-a="water" data-i="${i}" aria-label="${(i + 1) * 250} мл">${glassSvg(i < filled)}</button>`;
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
  <section class="card"><div class="plate">${plateSvg(tot, tg)}<div class="macros">
    ${macroRow('Белки', tot.p, tg && tg.p, 'prot')}${macroRow('Жиры', tot.f, tg && tg.f, 'fat')}${macroRow('Углеводы', tot.c, tg && tg.c, 'carb')}
  </div></div><p class="eaten-line">Съедено <b class="num">${f0(tot.kcal)}</b>${tg ? ` из <span class="num">${f0(tg.kcal)}</span>` : ''} ккал</p></section>
  ${activityCard()}
  <section class="card"><div class="sec-head"><h2>Вода</h2><span class="muted num">${f1(water / 1000)} из ${f1(wt / 1000)} л</span></div><div class="glasses">${glasses}</div></section>
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
function sheetHead(title) { return `<div class="grabber"></div><div class="sheet-hd"><h2 id="sheetTitle">${esc(title)}</h2><button class="icon-btn" data-a="closeSheet" aria-label="Закрыть">${IC.x}</button></div>`; }
function sheetAdd() {
  const rec = S.recent.map((r, i) => foodById(r.id) ? `<button class="chip" data-a="pickRecent" data-i="${i}">${esc(r.name)} · ${f0(r.grams)}</button>` : '').join('');
  return `${sheetHead('Добавить еду')}
  ${segm('pickMeal', ui.meal, MEALS.map(m => [m, m]), 'Приём пищи')}
  <div class="field"><label for="foodText">Что вы съели или выпили?</label>
    <textarea id="foodText" class="input" rows="2" data-in="foodText" placeholder="Например: гречка 150 г, котлета, огурец" autocomplete="off">${esc(ui.text)}</textarea>
    <p class="hint">Через запятую. Понимаю граммы, штуки, ложки, стаканы и тарелки: «2 яйца», «стакан кефира 1%», «чай с сахаром».</p></div>
  <div id="pv"></div>
  ${rec ? `<div class="field"><span class="lbl">Недавнее</span><div class="chips">${rec}</div></div>` : ''}
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

/* ================= ТРЕНИРОВКИ ================= */
function lastFor(exId, name, beforeId) {
  const list = S.workouts.slice().sort((a, b) => b.date.localeCompare(a.date));
  for (const w of list) {
    if (w.id === beforeId) continue;
    const e = w.ex.find(x => (exId && x.exId === exId) || (!exId && x.name === name));
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
    const kind = kindOf(e.exId), last = lastFor(e.exId, e.name, null), pe = { reps: e.reps || '' };
    return `<div class="sx"><div class="sx-hd"><button class="ex-name" data-a="exInfo" data-id="${esc(e.exId || '')}" data-from="session">${esc(e.name)}<small>${esc(e.target || '')}</small></button><button class="x-btn" data-a="sxRemove" data-i="${i}" aria-label="Убрать упражнение из тренировки">${IC.x}</button></div>
      ${last ? `<p class="sx-prev">В прошлый раз, ${fmtDM(last.date)}: ${esc(setsText(last.sets, kind))}</p>` : ''}
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
    return `<button class="hist" data-a="openWorkout" data-id="${w.id}"><span><b>${esc(w.dayName)}</b><span class="small muted" style="display:block">${fmtS(w.date)} · ${f0(w.minutes || 60)} мин${w.note ? ' · ' + esc(w.note) : ''}</span></span><span class="pill">${dn} ${plural(dn, 'подход', 'подхода', 'подходов')}</span></button>`;
  }).join('')}</div>` : `<p class="muted small">Здесь появятся завершённые тренировки.</p>`}</section>`;
  return h;
}
function sheetWorkout() {
  const w = S.workouts.find(x => x.id === ui.woId); if (!w) return sheetHead('Тренировка не найдена');
  const kg = weightOn(w.date) || 65;
  return `${sheetHead(w.dayName + ', ' + fmtD(w.date))}
    <div class="stats three"><div class="stat"><b>${f0(w.minutes || 60)}</b><span>минут</span></div><div class="stat"><b>${w.ex.length}</b><span>${plural(w.ex.length, 'упражнение', 'упражнения', 'упражнений')}</span></div><div class="stat"><b>≈${f0(woKcal(w, kg))}</b><span>ккал</span></div></div>
    <div>${w.ex.map(e => `<div class="ex"><button class="ex-name" data-a="exInfo" data-id="${esc(e.exId || '')}">${esc(e.name)}</button><span class="scheme">${esc(setsText(e.sets, kindOf(e.exId)))}</span></div>`).join('')}</div>
    ${w.note ? `<p class="tipbox">${esc(w.note)}</p>` : ''}
    <div class="field"><label for="woMin">Длительность, минут</label><input id="woMin" class="input num" inputmode="numeric" value="${esc(w.minutes || 60)}"></div>
    <div class="row"><button class="btn btn-primary grow" data-a="woSave">Сохранить</button><button class="btn btn-warn" data-a="woDelete">Удалить</button></div>`;
}
function sheetPick() {
  const list = filterEx(EXERCISES.concat(S.customEx || []), ui.pickQ, ui.pickG);
  return `${sheetHead('Выберите упражнение')}
    <input class="input" type="search" data-in="pickQ" placeholder="Поиск: присед, спина, гантели…" value="${esc(ui.pickQ)}" aria-label="Поиск упражнения">
    <div class="chips scroll">${[['', 'Все']].concat(EX_GROUPS).map(([g, l]) => `<button class="chip" data-a="pickG" data-g="${g}" aria-pressed="${ui.pickG === g}">${esc(l)}</button>`).join('')}</div>
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
function filterEx(list, q, g) { return list.filter(e => (!g || e.g === g) && matchQ(q, [e.n, e.m || '', e.eq || '', GROUP[e.g] || ''].join(' '))); }
function pickListHtml(list) {
  if (!list.length) return `<p class="hint">Ничего не нашлось. Добавьте своё упражнение.</p>`;
  return list.map(e => `<button class="res" data-a="pickEx" data-id="${esc(e.id)}"><span class="res-main"><span>${esc(e.n)}</span><small>${esc(GROUP[e.g] || '')}${e.eq ? ' · ' + esc(e.eq) : ''}</small></span><span>${IC.plus}</span></button>`).join('');
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
function kbList() {
  const list = filterEx(EXERCISES, ui.kbQ, ui.kbG);
  if (!list.length) return `<p class="hint">Ничего не нашлось.</p>`;
  return list.map(e => `<button class="kb-row" data-a="exInfo" data-id="${e.id}"><span class="grow"><span>${esc(e.n)}</span><small>${esc(e.m)}</small></span><span class="chev">${IC.chev}</span></button>`).join('');
}
function renderKb() {
  let h = `<header class="hd"><h1>База знаний</h1></header>${segm('kbTab', ui.kbTab, [['ex', 'Упражнения'], ['art', 'Статьи']], 'Раздел')}`;
  if (ui.kbTab === 'ex') {
    h += `<input class="input" type="search" data-in="kbQ" placeholder="Поиск: ягодицы, гантели, спина…" value="${esc(ui.kbQ)}" aria-label="Поиск упражнения">
      <div class="chips scroll">${[['', 'Все']].concat(EX_GROUPS).map(([g, l]) => `<button class="chip" data-a="kbG" data-g="${g}" aria-pressed="${ui.kbG === g}">${esc(l)}</button>`).join('')}</div>
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
  return `${sheetHead(e.n)}
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
  return `<header class="hd"><h1>Профиль</h1></header>${demoBanner()}
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
    ${NB ? `<p class="small muted">Подсчёт шагов: ${stepsStatus === 'ok' ? 'включён, телефон считает шаги сам.' : stepsStatus === 'none' ? 'в телефоне нет датчика шагов — вводите шаги вручную.' : 'нужно разрешение.'}</p>${stepsStatus === 'need' ? `<button class="btn btn-ghost" data-a="stepsAllow">Разрешить подсчёт шагов</button>` : stepsStatus === 'denied' ? `<button class="btn btn-ghost" data-a="stepsSettings">Открыть настройки приложения</button>` : ''}` : ''}
  </section>
  <section class="card"><h2>Отчёт тренеру</h2><p class="small muted">Питание, расход, шаги, вода, тренировки с весами, вес и замеры.</p>
    ${segm('repDays', ui.repDays, [[7, '7 дней'], [14, '14 дней'], [30, '30 дней']], 'Период')}
    <label class="check"><input type="checkbox" data-ch="repDetail" ${ui.repDetail ? 'checked' : ''}><span>Добавить список всех продуктов</span></label>
    <button class="btn btn-primary" data-a="makeReport">Сформировать отчёт</button>
    ${ui.report ? `<textarea id="reportTa" class="input" rows="10" readonly>${esc(ui.report)}</textarea><div class="row">${NB ? `<button class="btn btn-primary grow" data-a="shareReport">Отправить</button>` : ''}<button class="btn btn-ghost grow" data-a="copyReport">Скопировать</button></div>` : ''}
  </section>
  <section class="card"><h2>Мои продукты</h2><p class="small muted">Если чего-то нет в базе, добавьте с упаковки. Потом этот продукт можно вписывать текстом, как обычный.</p>
    ${S.custom.length ? `<div>${S.custom.map(c => `<div class="list-row"><span>${esc(c.name)}<br><span class="small muted num">${f0(c.kcal)} ккал · Б ${f1(c.p)} · Ж ${f1(c.f)} · У ${f1(c.c)} на 100 г${c.piece ? ` · 1 шт ${f0(c.piece)} г` : ''}</span></span><button class="x-btn" data-a="delCustom" data-id="${c.id}" aria-label="Удалить продукт">${IC.x}</button></div>`).join('')}</div>` : ''}
    <div class="grid2"><div class="field span2"><label for="cName">Название</label><input id="cName" class="input" placeholder="Например: батончик Bombbar"></div>
      <div class="field"><label for="cKcal">Ккал на 100 г</label><input id="cKcal" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="cPiece">Вес 1 шт, г</label><input id="cPiece" class="input num" inputmode="decimal" placeholder="если штучный"></div>
      <div class="field"><label for="cP">Белки на 100 г</label><input id="cP" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="cF">Жиры на 100 г</label><input id="cF" class="input num" inputmode="decimal"></div>
      <div class="field"><label for="cC">Углеводы на 100 г</label><input id="cC" class="input num" inputmode="decimal"></div></div>
    <button class="btn btn-ghost" data-a="addCustom">Добавить продукт</button>
  </section>
  <section class="card"><h2>Резервная копия</h2><p class="small muted">Записи хранятся на этом телефоне. Если удалить приложение или сменить телефон, они пропадут. Раз в неделю копируйте код и сохраняйте его, например, в «Избранном» Telegram — по нему всё восстановится.</p>
    ${ui.backup ? `<textarea id="backupTa" class="input code" rows="4" readonly>${esc(ui.backup)}</textarea><button class="btn btn-ghost" data-a="copyBackup">Скопировать код</button>` : `<button class="btn btn-ghost" data-a="makeBackup">Получить код копии</button>`}
    <div class="field"><label for="restoreTa">Восстановить из кода</label><textarea id="restoreTa" class="input code" rows="3" placeholder="BAK1:…"></textarea></div>
    ${ui.confirm === 'restore' ? `<div class="confirm"><p>Все текущие записи заменятся записями из копии. Продолжить?</p><div class="row"><button class="btn btn-warn btn-sm" data-a="restoreYes">Да, восстановить</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>` : `<button class="btn btn-ghost" data-a="restore">Восстановить</button>`}
  </section>
  <section class="card"><h2>О приложении</h2>
    <p class="small muted">В базе ${FOODS.length} продуктов и блюд и ${EXERCISES.length} упражнений. Для готовых блюд калорийность средняя: домашний борщ или котлета могут отличаться на 10–20%. Продукты, которые едите часто, лучше добавить с упаковки в «Мои продукты».</p>
    ${ui.confirm === 'wipe' ? `<div class="confirm"><p>Удалить все записи с этого телефона? Это нельзя отменить.</p><div class="row"><button class="btn btn-warn btn-sm" data-a="wipeYes">Удалить всё</button><button class="btn btn-ghost btn-sm" data-a="confirmNo">Отмена</button></div></div>` : `<button class="btn btn-warn" data-a="wipe">Удалить все данные</button>`}
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
  const v = $('#view');
  renderedDay = todayKey();
  v.innerHTML = ui.tab === 'today' ? renderToday() : ui.tab === 'train' ? renderTrain() : ui.tab === 'progress' ? renderProgress() : ui.tab === 'kb' ? renderKb() : renderProfile();
  $('#tabs').innerHTML = tabsHtml();
  const want = !!S.session;
  if (want !== keepOn) { keepOn = want; nb('keepScreenOn', want); }
}
const SHEETS = { add: sheetAdd, edit: sheetEdit, steps: sheetSteps, weight: sheetWeight, measures: sheetMeasures, pick: sheetPick, ex: sheetEx, art: sheetArt, templates: sheetTemplates, import: sheetImport, workout: sheetWorkout };
function openSheet(kind) { ui.sheet = kind; renderSheet(); const sh = $('#sheet'); sh.scrollTop = 0; if (kind === 'add') setTimeout(() => { const ta = $('#foodText'); if (ta) ta.focus(); }, 60); }
function renderSheet() {
  const back = $('#sheetBack'), sh = $('#sheet');
  if (!ui.sheet) { back.hidden = true; sh.innerHTML = ''; document.body.style.overflow = ''; return; }
  back.hidden = false; document.body.style.overflow = 'hidden';
  sh.innerHTML = (SHEETS[ui.sheet] || (() => ''))();
  if (ui.sheet === 'add') { renderPreview(); renderSearch(); }
}
function closeSheet() { const was = ui.sheet; ui.sheet = null; ui.confirm = ui.confirm === 'progImport' ? null : ui.confirm; ui.tplId = null; ui.pickNew = false; renderSheet(); if (was === 'pick' || was === 'ex' || was === 'workout' || was === 'templates' || was === 'import') render(); }

/* ================= Действия ================= */
const A = {
  tab(b) { ui.tab = b.dataset.tab; ui.confirm = null; render(); window.scrollTo(0, 0); },
  startFresh() { mutate(() => { }); render(); },
  dayPrev() { ui.date = addDays(ui.date, -1); render(); },
  dayNext() { if (ui.date < todayKey()) { ui.date = addDays(ui.date, 1); render(); } },
  gotoDay(b) { ui.date = b.dataset.k; ui.tab = 'today'; render(); window.scrollTo(0, 0); },
  water(b) { const i = +b.dataset.i, k = ui.date; mutate(() => { const d = getDay(k, true); const filled = Math.floor((d.water || 0) / 250); d.water = filled === i + 1 ? i * 250 : (i + 1) * 250; }); render(); },
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
      S.workouts.push({ id: s.id || uid(), date: s.date || todayKey(), dayId: s.dayId, dayName: s.dayName, note: (s.note || '').trim(), minutes: min,
        ex: s.ex.map(e => ({ exId: e.exId, name: e.name, target: e.target, sets: e.sets.filter(x => x.done).map(x => ({ w: x.w || '', r: x.r || '', done: true })) })).filter(e => e.sets.length) });
      S.session = null;
    });
    stopRest(); ui.confirm = null; render(); window.scrollTo(0, 0); toast('Тренировка записана');
  },
  cancelSession() { ui.confirm = 'cancelSession'; render(); },
  cancelSessionYes() { mutate(() => { S.session = null; }); stopRest(); ui.confirm = null; render(); },
  restAdd() { if (rest) { rest.end += 30000; rest.total += 30; tickRest(); } },
  restSkip() { stopRest(); },
  openWorkout(b) { ui.woId = b.dataset.id; openSheet('workout'); },
  woSave() { const id = ui.woId, m = toNum($('#woMin').value); mutate(() => { const w = S.workouts.find(x => x.id === id); if (w && m > 0) w.minutes = Math.round(m); }); ui.sheet = null; renderSheet(); render(); },
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
  pickOpen(b) { ui.pickFor = { mode: b.dataset.mode, di: +b.dataset.d }; ui.pickQ = ''; ui.pickG = ''; ui.pickNew = false; openSheet('pick'); },
  pickG(b) { ui.pickG = b.dataset.g; renderSheet(); },
  pickEx(b) { const e = exInfo(b.dataset.id); if (e) addExercise(e); },
  cxNew() { ui.pickNew = true; renderSheet(); setTimeout(() => { const n = $('#cxName'); if (n) n.focus(); }, 30); },
  cxCancel() { ui.pickNew = false; renderSheet(); },
  cxSave() {
    const n = ($('#cxName').value || '').trim(); if (!n) { toast('Впишите название упражнения'); return; }
    const e = { id: 'cx' + uid(), n, g: $('#cxGroup').value, kind: $('#cxKind').value, custom: true };
    mutate(() => { S.customEx.push(e); }); ui.pickNew = false; addExercise(e);
  },
  exInfo(b) { if (!b.dataset.id) { toast('Это своё упражнение — описания нет'); return; } ui.exId = b.dataset.id; ui.exFrom = b.dataset.from || null; openSheet('ex'); },
  exToDay(b) { const e = exInfo(ui.exId), di = +b.dataset.d; if (!e) return; mutate(() => { S.program.days[di].ex.push(newProgEx(e)); }); toast(`Добавлено в «${S.program.days[di].name}»`); },
  /* база знаний */
  kbTab(b) { ui.kbTab = b.dataset.v; render(); },
  kbG(b) { ui.kbG = b.dataset.g; render(); },
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
  delCustom(b) { mutate(() => { S.custom = S.custom.filter(c => c.id !== b.dataset.id); }); render(); },
  makeBackup() { ui.backup = 'BAK1:' + b64e(JSON.stringify(S)); render(); },
  copyBackup() { copyText(ui.backup, $('#backupTa')); },
  restore() { const r = decodeCode($('#restoreTa').value, ['BAK1:']); if (!r || !r.data || typeof r.data !== 'object' || !r.data.days) { toast('Код не подходит. Скопируйте его целиком, начиная с BAK1:'); return; } ui.pendingRestore = r.data; ui.confirm = 'restore'; render(); },
  restoreYes() { const d = ui.pendingRestore; if (!d) return; d.demo = false; S = migrate(d) || blankState(); save(); ui.pendingRestore = null; ui.confirm = null; ui.date = todayKey(); render(); toast('Записи восстановлены'); },
  wipe() { ui.confirm = 'wipe'; render(); },
  wipeYes() { S = blankState(); save(); ui.confirm = null; ui.report = ''; ui.backup = ''; ui.date = todayKey(); render(); toast('Все данные удалены'); }
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
  setW(el) { if (!S.session) return; S.session.ex[+el.dataset.i].sets[+el.dataset.j].w = el.value.trim().replace(',', '.'); save(); },
  setR(el) { if (!S.session) return; S.session.ex[+el.dataset.i].sets[+el.dataset.j].r = el.value.trim(); save(); },
  sessNote(el) { if (!S.session) return; S.session.note = el.value; save(); },
  sessDate(el) { if (!S.session || !el.value) return; S.session.date = el.value; save(); },
  progTitle(el) { mutate(() => { S.program.title = el.value; }); },
  progNote(el) { mutate(() => { S.program.note = el.value; }); },
  dayName(el) { mutate(() => { S.program.days[+el.dataset.d].name = el.value; }); },
  exSets(el) { mutate(() => { S.program.days[+el.dataset.d].ex[+el.dataset.e].sets = el.value.replace(/\D/g, ''); }); },
  exReps(el) { mutate(() => { S.program.days[+el.dataset.d].ex[+el.dataset.e].reps = el.value; }); },
  pickQ(el) { ui.pickQ = el.value; $('#pickList').innerHTML = pickListHtml(filterEx(EXERCISES.concat(S.customEx || []), ui.pickQ, ui.pickG)); },
  kbQ(el) { ui.kbQ = el.value; const l = $('#kbList'); if (l) l.innerHTML = kbList(); },
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

document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const fn = A[b.dataset.a]; if (fn) { e.preventDefault(); fn(b, e); } });
document.addEventListener('input', e => { const el = e.target, h = el.dataset && el.dataset.in; if (h && IN[h]) IN[h](el, e); });
document.addEventListener('change', e => { const el = e.target, h = el.dataset && el.dataset.ch; if (h && CH[h]) CH[h](el, e); });
$('#sheetBack').addEventListener('click', e => { if (e.target.id === 'sheetBack') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.sheet) closeSheet(); });

/* ================= Связь с Android ================= */
window.appBack = () => {
  if (ui.sheet) { closeSheet(); return true; }
  if (ui.confirm) { ui.confirm = null; render(); return true; }
  if (ui.editProg) { A.progDone(); return true; }
  if (ui.tab !== 'today') { ui.tab = 'today'; render(); window.scrollTo(0, 0); return true; }
  if (ui.date !== todayKey()) { ui.date = todayKey(); render(); return true; }
  return false;
};
window.onSteps = json => { try { nativeSteps = JSON.parse(json) || {}; } catch (e) { return; } if (!ui.sheet) updateActivityCard(); };
window.onStepsStatus = st => { stepsStatus = st; refreshSteps(); if (!ui.sheet) render(); };
window.onAppResume = () => {
  refreshSteps();
  if (renderedDay !== todayKey() && ui.date === renderedDay) ui.date = todayKey();
  if (rest) tickRest();
  if (!ui.sheet) render();
};

const h0 = location.hash.replace('#', '');
if (['today', 'train', 'progress', 'kb', 'profile'].includes(h0)) ui.tab = h0;
refreshSteps();
render();
if (S.session) nb('keepScreenOn', true);
})();

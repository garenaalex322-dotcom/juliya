// Разбор текста «гречка 150 г, 2 яйца, чай с сахаром» в продукты с граммовкой
const normTxt = s => String(s || '').toLowerCase().replace(/ё/g, 'е');
const FOODS = RAW.map((r, i) => Object.assign({
  id: 'f' + i, name: r[0],
  aliases: r[1].split('|').map(a => normTxt(a).split(' ').filter(Boolean)),
  kcal: r[2], p: r[3], f: r[4], c: r[5], portion: r[6], piece: r[7] || 0
}, r[8] || {}));
const foodByName = n => FOODS.find(f => f.name === n);

let customProvider = () => [];
function stemsOf(name) {
  return normTxt(name).split(/[^а-яa-z0-9]+/).filter(w => w.length >= 3)
    .map(w => (w.length > 5 ? w.slice(0, w.length - 2) : w));
}
function customFoods() {
  return customProvider().map(c => {
    const st = stemsOf(c.name);
    const al = [];
    if (st.length) al.push(st);
    if (st.length > 1) al.push([st[0]]);
    const piece = +c.piece || 0;
    return { id: c.id, name: c.name, aliases: al, kcal: +c.kcal || 0, p: +c.p || 0, f: +c.f || 0, c: +c.c || 0,
      portion: +c.portion || piece || 100, piece, custom: true };
  });
}
const allFoods = () => customFoods().concat(FOODS);
const foodById = id => allFoods().find(f => f.id === id);

const STOP = new Set(['с','со','на','в','во','из','для','от','по','к','и','или','а','еще','немного','чуть','мой','моя','свой']);
const NUMW = new Map(Object.entries({ 'один':1,'одна':1,'одно':1,'одну':1,'два':2,'две':2,'три':3,'четыре':4,'пять':5,
  'шесть':6,'семь':7,'восемь':8,'десять':10,'пол':0.5,'половина':0.5,'половину':0.5,'половинка':0.5,'половинку':0.5,
  'полтора':1.5,'полторы':1.5,'пара':2,'пару':2 }));

function unitOf(t) {
  if (/^(г|гр|грам|грамм|грамма|граммов|грамов)$/.test(t)) return 'g';
  if (/^(кг|кило|килограмм[а-я]*)$/.test(t)) return 'kg';
  if (/^(мл|миллилитр[а-я]*)$/.test(t)) return 'ml';
  if (/^(л|литр[а-я]*)$/.test(t)) return 'l';
  if (/^(шт|штук[а-я]*|штуч[а-я]*)$/.test(t)) return 'pc';
  if (t === 'стл' || /^столов/.test(t)) return 'tbsp';
  if (t === 'чл' || /^чайн/.test(t) || /^ложечк/.test(t)) return 'tsp';
  if (/^(ложк|ложек)/.test(t)) return 'tbsp';
  if (/^стакан/.test(t)) return 'glass';
  if (/^(чашк|чашек|чашеч)/.test(t)) return 'cup';
  if (/^(кружк|кружек)/.test(t)) return 'mug';
  if (/^(тарелк|тарелоч|тарелок)/.test(t)) return 'plate';
  if (!/^кускус/.test(t) && /^(кус|ломт|дольк|долек)/.test(t)) return 'pc';
  if (/^порци/.test(t)) return 'portion';
  if (/^горст/.test(t)) return 'handful';
  if (/^бокал/.test(t)) return 'wineglass';
  if (/^плитк/.test(t)) return 'bar';
  if (/^(упаковк|пачк)/.test(t)) return 'pack';
  return null;
}

const POL = /пол(?=(тарелк|стакан|чашк|кружк|порци|банан|яблок|плитк|батон|булк|литр|кило|ложк|пачк|упаковк|авокад|огурц|помидор|апельсин|пицц|шоколадк|лаваш|кусочк|куска))/g;
function prep(s) {
  return normTxt(s)
    .replace(/(^|[^а-я])ст\.?\s*л\.?(?![а-я])/g, '$1 стл ')
    .replace(/(^|[^а-я])ч\.?\s*л\.?(?![а-я])/g, '$1 чл ')
    .replace(POL, 'пол ')
    .replace(/(^|[^0-9])3\s*в\s*1(?![0-9])/g, '$1 трипакет ')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d+(?:\.\d+)?)\s*%/g, ' pct$1 ')
    .replace(/(\d)([а-яa-z])/g, '$1 $2');
}
const tokenize = chunk => chunk.split(/[^а-яa-z0-9.]+/).map(t => t.replace(/^\.+|\.+$/g, '')).filter(Boolean);

function analyze(toks) {
  let num = null, unit = null, pct = null, skip = 0;
  const words = [];
  for (const t of toks) {
    if (/^pct\d/.test(t)) { pct = parseFloat(t.slice(3)); continue; }
    if (/^\d+(\.\d+)?$/.test(t)) { if (num === null) num = parseFloat(t); continue; }
    if (NUMW.has(t) && num === null) { num = NUMW.get(t); continue; }
    const u = unitOf(t);
    if (u) { if (!unit) unit = u; continue; }
    if (t === 'без') { skip = 1; words.push(t); continue; }
    if (skip && !STOP.has(t)) { skip--; continue; }
    words.push(t);
  }
  return { num, unit, pct, words };
}

function matchAlias(alias, words) {
  const idx = [];
  let from = 0;
  for (const st of alias) {
    let found = -1;
    for (let j = from; j < words.length; j++) {
      const w = words[j];
      if (STOP.has(w)) continue;
      if (idx.length && j - idx[idx.length - 1] > 3) break;
      if (w.startsWith(st)) { found = j; break; }
    }
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  let score = alias.reduce((s, st) => s + st.length, 0) + 2 * (alias.length - 1);
  if (alias.length === 1 && words[idx[0]] === alias[0]) score += 1;
  return { idx, score };
}
// Индекс синонимов по первым буквам первой основы: в базе тысячи продуктов,
// поэтому проверяем только те синонимы, чья первая основа может совпасть с каким-то словом.
// Порядок перебора тот же, что и при полном переборе (сначала свои продукты, потом база).
let aliasIdx = null;
function buildIdx(list, ord) {
  const m = new Map();
  for (const food of list) for (const al of food.aliases) {
    const k = String(al[0] || '').slice(0, 3);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push({ food, al, ord: ord++ });
  }
  return m;
}
function candidates(words) {
  if (!aliasIdx) aliasIdx = buildIdx(FOODS, 1e7);
  const idx = [buildIdx(customFoods(), 0), aliasIdx], keys = new Set(), out = [];
  for (const w of words) for (let n = 1; n <= 3 && n <= w.length; n++) keys.add(w.slice(0, n));
  for (const m of idx) for (const k of keys) { const l = m.get(k); if (l) for (const e of l) out.push(e); }
  return out.sort((a, b) => a.ord - b.ord);
}
function bestMatch(words) {
  let best = null;
  for (const { food, al } of candidates(words)) {
    const m = matchAlias(al, words);
    if (!m) continue;
    const sc = m.score + (food.custom && al.length > 1 ? 3 : 0);
    if (!best || sc > best.score || (sc === best.score && m.idx[0] < best.idx[0])) best = { food, score: sc, idx: m.idx };
  }
  return best;
}

function gramsFor(food, num, unit) {
  const n = num == null ? 1 : num;
  const piece = food.piece || food.portion;
  switch (unit) {
    case 'g': case 'ml': return n;
    case 'kg': case 'l': return n * 1000;
    case 'pc': return n * piece;
    case 'tbsp': return n * (food.tbsp || 15);
    case 'tsp': return n * (food.tsp || 5);
    case 'glass': return n * 250;
    case 'cup': return n * 200;
    case 'mug': return n * 300;
    case 'plate': return n * food.portion;
    case 'portion': return n * food.portion;
    case 'handful': return n * 30;
    case 'wineglass': return n * (food.glass || 150);
    case 'bar': return n * 100;
    case 'pack': return n * food.portion;
    default:
      if (num == null) return food.portion;
      if (food.liq && num <= 3 && num % 1 !== 0) return num * 1000;
      if (food.piece && num <= 20) return num * food.piece;
      if (num <= 10) return num * food.portion;
      return num;
  }
}

function mkItem(food, a, src) {
  if (a.pct != null && food.pcts) {
    const t = food.pcts.find(x => a.pct <= x[0]);
    const pf = t && foodByName(t[1]);
    if (pf) food = pf;
  }
  const grams = Math.max(1, Math.round(gramsFor(food, a.num, a.unit)));
  return { food, grams, src, def: a.num == null && a.unit == null };
}
function spansWith(idx, words) {
  const a = Math.min(...idx), b = Math.max(...idx);
  for (let j = a + 1; j < b; j++) if (words[j] === 'с' || words[j] === 'со') return true;
  return false;
}
function parseChunk(raw) {
  const src = raw.trim();
  const toks = tokenize(src);
  if (!toks.length) return [];
  const whole = analyze(toks);
  if (!whole.words.some(w => !STOP.has(w))) return [];
  const best = bestMatch(whole.words);
  const hasWith = whole.words.some(w => w === 'с' || w === 'со');
  if (best && (!hasWith || spansWith(best.idx, whole.words))) return [mkItem(best.food, whole, src)];
  if (!hasWith) return [{ unknown: true, text: src }];
  const segs = [[]];
  for (const t of toks) { if (t === 'с' || t === 'со') segs.push([]); else segs[segs.length - 1].push(t); }
  const out = [];
  segs.forEach((seg, i) => {
    if (!seg.length) return;
    const a = analyze(seg);
    const m = bestMatch(a.words);
    if (m) out.push(mkItem(m.food, a, src));
    else if (i === 0) out.push({ unknown: true, text: seg.join(' ') });
  });
  return out.length ? out : [{ unknown: true, text: src }];
}
function parseText(text) {
  const items = [], unknown = [];
  prep(text).split(/[,;\n+]|\s+и\s+|\s+плюс\s+|\s+а\s+также\s+/).forEach(ch => {
    if (!ch || !ch.trim()) return;
    parseChunk(ch).forEach(r => (r.unknown ? unknown.push(r.text) : items.push(r)));
  });
  return { items, unknown };
}

const wordsOf = s => ' ' + s.replace(/[^а-яa-z0-9]+/g, ' ');
function searchFoods(q) {
  const words = tokenize(prep(q));
  if (!words.length) return [];
  const qn = normTxt(q).trim();
  const scored = [];
  for (const food of allFoods()) {
    let sc = 0;
    const nm = normTxt(food.name);
    // совпадение с началом названия или с началом слова в нём («кола» не должна находить «шоколад»)
    if (nm.startsWith(qn)) sc = 100; else if (wordsOf(nm).includes(' ' + wordsOf(qn).trim())) sc = 60;
    for (const al of food.aliases) {
      const hit = (w, st) => w.startsWith(st) || (w.length >= 3 && st.startsWith(w));
      const ok = al.every(st => words.some(w => hit(w, st)));
      // синоним покрывает весь запрос («сникерс» → батончик Snickers) — выше, чем просто вхождение в название
      if (!ok) continue;
      const cover = f => words.every(w => STOP.has(w) || al.some(st => f(w, st)));
      sc = Math.max(sc, (cover((w, st) => w.startsWith(st)) ? 80 : cover(hit) ? 70 : 40) + al.length);
      // запрос из одного слова — это и есть основной синоним продукта («сыр», «кефир», «молоко»): общий продукт первым
      if (words.length === 1 && al.length === 1 && (words[0] === al[0] || (al[0].length >= 4 && words[0].startsWith(al[0]) && words[0].length - al[0].length <= 2))) sc = Math.max(sc, 101);
    }
    if (sc) scored.push([sc, food]);
  }
  // при равенстве: сначала общие продукты, потом марки; короче название — выше
  const brand = f => (/[«a-z]/i.test(f.name) ? 1 : 0);
  return scored.sort((a, b) => b[0] - a[0] || brand(a[1]) - brand(b[1]) || a[1].name.length - b[1].name.length || a[1].name.localeCompare(b[1].name, 'ru')).slice(0, 8).map(x => x[1]);
}

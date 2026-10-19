/* ===== util.js — shared helpers: seeded RNG, Hebrew text helpers ===== */

// Deterministic PRNG (mulberry32). Every question is rebuilt from {skill, level, seed},
// so generators must only use this, never Math.random.
function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), // inclusive
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    sample: (arr, n) => r.shuffle(arr).slice(0, n),
  };
  return r;
}

function newSeed() {
  return Math.floor(Math.random() * 2147483646) + 1;
}

const range = (n, start = 0) => Array.from({ length: n }, (_, i) => i + start);
const sum = (arr) => arr.reduce((s, x) => s + x, 0);
const uniq = (arr) => Array.from(new Set(arr));
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Number formatting that never shows float noise (0.30000000000000004).
function fmtNum(x) {
  const r = Math.round(x * 1000) / 1000;
  return String(r);
}

// Shuffle the options and return {options, answer} with the correct index tracked.
function shuffleOptions(rng, correct, distractors) {
  const all = rng.shuffle([correct, ...distractors]);
  return { options: all, answer: all.indexOf(correct) };
}

/* ---------- Hebrew ---------- */
const HEB = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const FINAL_TO_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const BASE_TO_FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
const GEMATRIA = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };

const baseLetter = (ch) => FINAL_TO_BASE[ch] || ch;
const normWord = (w) => w.split('').map(baseLetter).join('');
const letterIndex = (ch) => HEB.indexOf(baseLetter(ch)); // 0-based
const gematria = (w) => sum(w.split('').map((c) => GEMATRIA[baseLetter(c)] || 0));
const lettersOf = (w) => w.split('');

// Write a word with correct final forms (used when we assemble words from letters).
function withFinal(w) {
  if (!w) return w;
  const last = w[w.length - 1];
  return BASE_TO_FINAL[last] ? w.slice(0, -1) + BASE_TO_FINAL[last] : w;
}

// Dictionary order: final letters sort as their regular form; a prefix comes first.
function dictCompare(a, b) {
  const x = normWord(a), y = normWord(b);
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const d = letterIndex(x[i]) - letterIndex(y[i]);
    if (d !== 0) return d;
  }
  return x.length - y.length;
}

const ORD_F = ['', 'ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית', 'שמינית', 'תשיעית', 'עשירית'];
const ORD_M = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני', 'תשיעי', 'עשירי'];
const HEB_OPT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'];

// "האות ג'" style label
const L = (ch) => `${ch}'`;

function timesWord(n) {
  if (n === 0) return 'אף פעם';
  if (n === 1) return 'פעם אחת';
  if (n === 2) return 'פעמיים';
  return `${n} פעמים`;
}

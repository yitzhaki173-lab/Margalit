/* ===== gen-series.js — numeric series (סדרות חשבוניות) ===== */
// Each builder returns {seq, arcs, rule, hint}. seq items are numbers or {n,d} fractions.
// arcs: {f, t, lab, expr, pos}  — f/t are indices, lab is the short label over the arc,
// expr is the full calculation shown in the explanation.

const fracVal = (x) => (typeof x === 'object' ? x.n / x.d : x);
const fmtItem = (x) => (typeof x === 'object' ? `${x.n}/${x.d}` : fmtNum(x));
const itemKey = (x) => (typeof x === 'object' ? `${x.n}/${x.d}` : fmtNum(x));

function opArc(seq, f, t, op, k, pos = 'top') {
  const sym = { '+': '+', '-': '−', '*': '×', '/': ':' }[op];
  const kk = fmtNum(k);
  return { f, t, lab: `${sym}${kk}`, expr: `${fmtItem(seq[f])} ${sym} ${kk} = ${fmtItem(seq[t])}`, pos };
}
function applyOp(x, op, k) {
  if (op === '+') return x + k;
  if (op === '-') return x - k;
  if (op === '*') return x * k;
  return x / k;
}
// Build a chain a0 -> a1 ... where step i uses ops[i] = [op, k]
function chain(a0, steps, pos = 'top') {
  const seq = [a0];
  steps.forEach(([op, k]) => seq.push(Math.round(applyOp(seq[seq.length - 1], op, k) * 1000) / 1000));
  const arcs = steps.map(([op, k], i) => opArc(seq, i, i + 1, op, k, pos));
  return { seq, arcs };
}

const SERIES_BUILDERS = {
  s_add(rng, lv) {
    const n = lv >= 4 ? 7 : 6;
    const d = lv === 1 ? rng.int(2, 5) : lv === 2 ? rng.int(3, 9) : lv === 3 ? rng.int(6, 15) : rng.int(11, 27);
    const down = lv >= 2 && rng.chance(0.45);
    const a0 = down ? d * n + rng.int(1, lv * 15) : rng.int(1, lv * 12);
    const { seq, arcs } = chain(a0, range(n - 1).map(() => [down ? '-' : '+', d]));
    return {
      seq, arcs,
      rule: `${down ? 'מחסירים' : 'מוסיפים'} מספר קבוע: <b>${down ? '−' : '+'}${d}</b> בכל צעד.`,
      hint: 'חשב את ההפרש בין כל שני מספרים סמוכים. האם הוא קבוע?',
    };
  },

  s_diff2(rng, lv) {
    // differences change by a constant step (גדל/קטן מפעם לפעם)
    const n = lv >= 4 ? 8 : 7;
    const step = lv <= 2 ? rng.pick([1, 2]) : rng.pick([1, 2, 3, 4]);
    const shrinking = lv >= 2 && rng.chance(0.4);
    let d0 = shrinking ? step * (n - 1) + rng.int(0, 4) : rng.int(1, 3 + lv * 2);
    const steps = range(n - 1).map((i) => {
      const d = shrinking ? d0 - i * step : d0 + i * step;
      return [d >= 0 ? '+' : '-', Math.abs(d)];
    });
    const a0 = rng.int(1, 10 + lv * 10);
    const down = lv >= 3 && rng.chance(0.4); // the whole series goes down
    let built;
    if (down) {
      const total = sum(steps.map(([, k]) => k));
      built = chain(total + rng.int(5, 40), steps.map(([, k]) => ['-', k]));
    } else built = chain(a0, steps);
    const diffs = steps.map(([, k]) => k);
    return {
      ...built,
      rule: `ההפרשים ${down ? '(בחיסור) ' : ''}${shrinking ? 'קטנים' : 'גדלים'} ב-${step} בכל צעד: ${diffs.slice(0, 4).join(', ')}…`,
      hint: 'רשום את ההפרשים בין המספרים. הם לא קבועים — אבל האם יש חוקיות בהפרשים עצמם?',
    };
  },

  s_alt(rng, lv) {
    const n = lv >= 3 ? 8 : 7;
    let pattern, rule;
    if (lv <= 2) {
      const a = rng.int(2, 3 + lv * 2), b = rng.int(1, a - 1);
      pattern = [['+', a], ['-', b]];
      rule = `סירוגין של שתי פעולות: <b>+${a}</b> ואז <b>−${b}</b>, שוב ושוב.`;
    } else if (lv === 3) {
      if (rng.chance(0.5)) {
        const a = rng.int(5, 12), b = rng.int(2, a - 2);
        pattern = rng.chance(0.5) ? [['+', a], ['-', b]] : [['-', b], ['+', a]];
        rule = `סירוגין: ${pattern.map(([o, k]) => (o === '+' ? '+' : '−') + k).join(' ואז ')}.`;
      } else {
        const c = rng.int(1, 4);
        pattern = [['*', 2], ['+', c]];
        rule = `סירוגין: <b>×2</b> ואז <b>+${c}</b>.`;
      }
    } else if (lv === 4) {
      const k = rng.pick([2, 3]), c = rng.int(1, 6);
      pattern = rng.chance(0.5) ? [['*', k], ['-', c]] : [['+', c], ['*', k]];
      rule = `סירוגין של כפל וחיבור/חיסור: ${pattern.map(([o, x]) => ({ '+': '+', '-': '−', '*': '×' }[o]) + x).join(' ואז ')}.`;
    } else {
      const a = rng.int(3, 9), b = rng.int(1, 4);
      pattern = [['+', a], ['-', b], ['*', 2]];
      rule = `מחזור של שלוש פעולות: <b>+${a}</b>, <b>−${b}</b>, <b>×2</b> — וחוזר חלילה.`;
    }
    const steps = range(n - 1).map((i) => pattern[i % pattern.length]);
    const a0 = rng.int(1, 8 + lv * 3);
    const built = chain(a0, steps);
    if (built.seq.some((x) => x <= 0) || Math.max(...built.seq) > 2000) return SERIES_BUILDERS.s_alt(rng, lv);
    return { ...built, rule, hint: 'הפעולות מתחלפות. נסה לבדוק אם יש שתי פעולות שחוזרות לסירוגין.' };
  },

  s_mult(rng, lv) {
    const n = lv >= 3 ? 6 : 5;
    const k = lv === 1 ? rng.pick([2, 3]) : lv === 2 ? rng.pick([2, 3, 4]) : rng.pick([2, 3, 4, 5]);
    const div = lv >= 2 && rng.chance(0.45);
    let a0 = rng.int(1, lv <= 2 ? 5 : 9);
    if (Math.pow(k, n - 1) * a0 > 50000) a0 = 1;
    let built;
    if (div) built = chain(a0 * Math.pow(k, n - 1), range(n - 1).map(() => ['/', k]));
    else built = chain(a0, range(n - 1).map(() => ['*', k]));
    return {
      ...built,
      rule: div ? `מחלקים במספר קבוע: <b>:${k}</b> בכל צעד.` : `כופלים במספר קבוע: <b>×${k}</b> בכל צעד.`,
      hint: 'המספרים גדלים (או קטנים) מהר מאוד — כנראה שזו לא תוספת אלא כפל או חילוק.',
    };
  },

  s_inter(rng, lv) {
    // two interleaved series (סדרות משולבות)
    const n = lv >= 3 ? 10 : 9;
    const half = Math.ceil(n / 2);
    const mk = (kind) => {
      if (kind === 'up') { const d = rng.int(1, 3 + lv * 2); return chain(rng.int(1, 15), range(half).map(() => ['+', d]), 'top'); }
      if (kind === 'down') { const d = rng.int(1, 2 + lv * 2); return chain(d * half + rng.int(5, 30), range(half).map(() => ['-', d]), 'bot'); }
      if (kind === 'mul') return chain(rng.int(1, 3), range(half).map(() => ['*', 2]), 'bot');
      const d0 = rng.int(1, 3); return chain(rng.int(1, 9), range(half).map((i) => ['+', d0 + i]), 'bot');
    };
    const kinds = lv <= 2 ? ['up', 'down'] : lv === 3 ? rng.pick([['up', 'down'], ['up', 'up'], ['down', 'grow']]) : rng.pick([['up', 'mul'], ['down', 'mul'], ['up', 'grow']]);
    const A = mk(kinds[0]), B = mk(kinds[1]);
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(i % 2 === 0 ? A.seq[i / 2] : B.seq[(i - 1) / 2]);
    const arcs = [];
    for (let i = 0; i + 2 < n; i++) {
      const src = i % 2 === 0 ? A : B, j = Math.floor(i / 2);
      const a = src.arcs[j];
      arcs.push({ f: i, t: i + 2, lab: a.lab, expr: a.expr, pos: i % 2 === 0 ? 'top' : 'bot' });
    }
    const desc = (S) => {
      const labs = uniq(S.arcs.slice(0, 3).map((x) => x.lab));
      return labs.length === 1 ? labs[0] : labs.join(', ') + '…';
    };
    return {
      seq, arcs,
      rule: `שתי סדרות משולבות: במקומות האי-זוגיים (1,3,5…) הפעולה ${desc(A)}, ובמקומות הזוגיים (2,4,6…) הפעולה ${desc(B)}.`,
      hint: 'המספרים קופצים למעלה ולמטה? הסתכל רק על כל מספר שני — יש כאן שתי סדרות שזורות זו בזו.',
    };
  },

  s_fib(rng, lv) {
    const n = lv >= 4 ? 7 : 8;
    let seq = [], arcs = [], rule;
    if (lv <= 3 || rng.chance(0.4)) {
      const a = rng.int(lv <= 2 ? 0 : 2, lv <= 2 ? 4 : 12), b = rng.int(1, lv <= 2 ? 5 : 15);
      seq = [a, b];
      for (let i = 2; i < n; i++) {
        seq.push(seq[i - 1] + seq[i - 2]);
        arcs.push({ f: i - 1, t: i, lab: `${seq[i - 2]}+${seq[i - 1]}`, expr: `${seq[i - 2]} + ${seq[i - 1]} = ${seq[i]}`, pos: 'top' });
      }
      rule = 'פיבונאצ׳י בחיבור: כל מספר הוא <b>סכום שני המספרים שלפניו</b>.';
    } else if (lv === 4) {
      seq = [rng.pick([1, 2]), 2];
      for (let i = 2; i < 6; i++) {
        seq.push(seq[i - 1] * seq[i - 2]);
        arcs.push({ f: i - 1, t: i, lab: `${seq[i - 2]}×${seq[i - 1]}`, expr: `${seq[i - 2]} × ${seq[i - 1]} = ${seq[i]}`, pos: 'top' });
      }
      rule = 'פיבונאצ׳י בכפל: כל מספר הוא <b>מכפלת שני המספרים שלפניו</b>.';
    } else {
      seq = [rng.int(0, 2), rng.int(1, 3), rng.int(1, 4)];
      for (let i = 3; i < 8; i++) {
        seq.push(seq[i - 1] + seq[i - 2] + seq[i - 3]);
        arcs.push({ f: i - 1, t: i, lab: `3 קודמים`, expr: `${seq[i - 3]} + ${seq[i - 2]} + ${seq[i - 1]} = ${seq[i]}`, pos: 'top' });
      }
      rule = 'כל מספר הוא <b>סכום שלושת המספרים שלפניו</b>.';
    }
    return { seq, arcs, rule, hint: 'בדוק אם מספר מתקבל משני (או שלושה) המספרים שלפניו — בחיבור או בכפל.', minBlank: lv >= 5 ? 3 : 2 };
  },

  s_prog(rng, lv) {
    // progressive multiply / divide (הכפלה/חילוק הדרגתי)
    let steps, rule, a0;
    const mode = lv <= 2 ? rng.pick(['mul', 'div']) : lv <= 4 ? rng.pick(['mul', 'div', 'mul2']) : rng.pick(['mulAdd', 'mul2']);
    if (mode === 'mul') {
      a0 = rng.int(1, 3);
      steps = range(5).map((i) => ['*', i + 1]);
      rule = 'הכפלה הדרגתית: <b>×1, ×2, ×3, ×4…</b> — המכפיל גדל ב-1 בכל צעד.';
    } else if (mode === 'div') {
      const m = rng.int(1, 3);
      const top = rng.pick([5, 6]);
      a0 = (top === 5 ? 120 : 720) * m;
      steps = range(top - 1).map((i) => ['/', top - i]);
      rule = `חילוק הדרגתי: <b>${steps.map(([, k]) => ':' + k).join(', ')}</b> — המחלק קטן ב-1 בכל צעד.`;
    } else if (mode === 'mul2') {
      a0 = rng.int(1, 4);
      const s0 = rng.pick([2, 3]);
      steps = range(4).map((i) => ['*', s0 + i]);
      rule = `הכפלה הדרגתית שמתחילה ב-×${s0}: המכפיל גדל ב-1 בכל צעד.`;
    } else {
      a0 = rng.int(1, 3);
      steps = [['*', 2], ['+', 2], ['*', 3], ['+', 3], ['*', 4], ['+', 4]];
      rule = 'סירוגין הדרגתי: <b>×2, +2, ×3, +3, ×4, +4</b>.';
    }
    const built = chain(a0, steps);
    return { ...built, rule, hint: 'בדוק פי כמה גדל (או קטן) כל מספר. האם המכפיל עצמו משתנה?' };
  },

  s_pow(rng, lv) {
    const kinds = lv <= 2 ? ['sq', 'sqEven'] : lv === 3 ? ['sq', 'cube', 'pair', 'pow2'] : ['sqPlus', 'cube', 'pair', 'nn1', 'prime'];
    const kind = rng.pick(kinds);
    let seq = [], labs = [], rule;
    if (kind === 'sq' || kind === 'sqPlus') {
      const s = rng.int(1, lv <= 2 ? 4 : 8), c = kind === 'sqPlus' ? rng.pick([-1, 1, 2, 3, -2]) : 0;
      for (let i = 0; i < 6; i++) { const b = s + i; seq.push(b * b + c); labs.push(`${b}²${c ? (c > 0 ? '+' + c : '−' + -c) : ''}`); }
      rule = c ? `ריבועים ${c > 0 ? 'ועוד' : 'פחות'} ${Math.abs(c)}: n² ${c > 0 ? '+' : '−'} ${Math.abs(c)}.` : 'סדרת ריבועים: כל מספר הוא מספר שלם בריבוע.';
    } else if (kind === 'sqEven') {
      const odd = rng.chance(0.5);
      for (let i = 0; i < 6; i++) { const b = odd ? 2 * i + 1 : 2 * i + 2; seq.push(b * b); labs.push(`${b}²`); }
      rule = `ריבועים של מספרים ${odd ? 'אי-זוגיים' : 'זוגיים'}: ${odd ? '1², 3², 5²…' : '2², 4², 6²…'}`;
    } else if (kind === 'cube') {
      const s = rng.int(1, 3);
      for (let i = 0; i < 6; i++) { const b = s + i; seq.push(b * b * b); labs.push(`${b}³`); }
      rule = 'סדרת חזקות שלישיות (מספר × עצמו × עצמו).';
    } else if (kind === 'pow2') {
      const s = rng.int(0, 3);
      for (let i = 0; i < 7; i++) { seq.push(Math.pow(2, s + i)); labs.push(`2^${s + i}`); }
      rule = 'חזקות של 2 (כל מספר כפול הקודם).';
    } else if (kind === 'pair') {
      const s = rng.int(2, 5);
      for (let i = 0; i < 4; i++) { const b = s + i; seq.push(b, b * b); labs.push(`n=${b}`, `${b}²`); }
      rule = 'זוגות: מספר ואחריו הריבוע שלו (2, 4, 3, 9, 4, 16…).';
    } else if (kind === 'nn1') {
      const s = rng.int(1, 4);
      for (let i = 0; i < 6; i++) { const b = s + i; seq.push(b * (b + 1)); labs.push(`${b}×${b + 1}`); }
      rule = 'מכפלת שני מספרים עוקבים: n×(n+1).';
    } else {
      const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
      const s = rng.int(0, 4);
      seq = P.slice(s, s + 7); labs = seq.map(() => 'ראשוני');
      rule = 'מספרים ראשוניים — מתחלקים רק ב-1 ובעצמם (2, 3, 5, 7, 11, 13…).';
    }
    const arcs = seq.map((v, i) => ({ f: i, t: i, lab: labs[i], expr: labs[i].startsWith('n=') ? `המספר ${v}, ואחריו ${v}² = ${v * v}` : `${labs[i]} = ${v}`, pos: 'top', self: true }));
    return { seq, arcs, rule, hint: 'נסה לזהות מספרים מוכרים: ריבועים (1,4,9,16,25…), חזקות (8,27,64…) או מספרים ראשוניים.' };
  },

  s_frac(rng, lv) {
    // fraction / decimal series
    if (lv <= 3) {
      const step = rng.pick([0.5, 0.2, 0.25, 1.5]);
      const n = 7;
      const down = rng.chance(0.4);
      const a0 = down ? step * n + rng.int(1, 5) : rng.int(0, 4) + rng.pick([0, 0.5]);
      const built = chain(a0, range(n - 1).map(() => [down ? '-' : '+', step]));
      return { ...built, rule: `סדרה עשרונית: ${down ? '−' : '+'}${step} בכל צעד.`, hint: 'עבוד עם השברים העשרוניים כמו עם מספרים שלמים — מה ההפרש הקבוע?' };
    }
    // numerators and denominators follow separate rules
    const nk = rng.pick(['mul', 'add']);
    let num = rng.int(1, 3), den = lv >= 5 ? rng.pick([64, 32]) : 32;
    const seq = [], arcs = [];
    const addN = rng.int(1, 3);
    for (let i = 0; i < 5; i++) {
      seq.push({ n: num, d: den });
      num = nk === 'mul' ? num * 2 : num + addN;
      den = den / 2;
    }
    for (let i = 0; i < 4; i++) {
      arcs.push({ f: i, t: i + 1, lab: nk === 'mul' ? 'מונה ×2' : `מונה +${addN}`, expr: `מונה: ${seq[i].n} → ${seq[i + 1].n}`, pos: 'top' });
      arcs.push({ f: i, t: i + 1, lab: 'מכנה :2', expr: `מכנה: ${seq[i].d} → ${seq[i + 1].d}`, pos: 'bot' });
    }
    return {
      seq, arcs,
      rule: `סדרת שברים: מסתכלים על המונה ועל המכנה בנפרד. המונה ${nk === 'mul' ? 'מוכפל ב-2' : `גדל ב-${addN}`}, המכנה מתחלק ב-2.`,
      hint: 'בשברים — הסתכל על סדרת המונים (למעלה) ועל סדרת המכנים (למטה) כל אחת בנפרד.',
    };
  },

  s_mix(rng, lv) {
    const kinds = lv <= 3 ? ['dbl1', 'diffDbl', 'tri'] : ['dbl1', 'diffDbl', 'diffSq', 'tri', 'diffFib', 'mulIdx', 'diffAlt'];
    const kind = rng.pick(kinds);
    let built, rule;
    if (kind === 'dbl1') {
      const k = rng.pick([2, 3]), c = rng.pick([1, -1, 2]);
      const a0 = c < 0 ? rng.int(2, 4) : rng.int(1, 4);
      const seq = [a0];
      for (let i = 0; i < 5; i++) seq.push(seq[i] * k + c);
      if (seq.some((x) => x <= 0)) return SERIES_BUILDERS.s_mix(rng, lv);
      const arcs = range(5).map((i) => ({ f: i, t: i + 1, lab: `×${k}${c > 0 ? '+' : '−'}${Math.abs(c)}`, expr: `${seq[i]} × ${k} ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${seq[i + 1]}`, pos: 'top' }));
      built = { seq, arcs };
      rule = `פעולה כפולה בכל צעד: <b>×${k} ואז ${c > 0 ? '+' : '−'}${Math.abs(c)}</b>.`;
    } else if (kind === 'diffDbl') {
      const d0 = rng.int(1, 3), a0 = rng.int(1, 9);
      built = chain(a0, range(6).map((i) => ['+', d0 * Math.pow(2, i)]));
      rule = `ההפרשים מוכפלים ב-2: +${d0}, +${d0 * 2}, +${d0 * 4}, +${d0 * 8}…`;
    } else if (kind === 'diffSq') {
      const a0 = rng.int(1, 9), s = rng.int(1, 2);
      built = chain(a0, range(6).map((i) => ['+', (s + i) * (s + i)]));
      rule = `ההפרשים הם ריבועים: +${s * s}, +${(s + 1) ** 2}, +${(s + 2) ** 2}…`;
    } else if (kind === 'tri') {
      const a0 = rng.int(1, 9);
      built = chain(a0, range(6).map((i) => ['+', ((i + 1) * (i + 2)) / 2]));
      rule = 'ההפרשים עצמם גדלים בהדרגה: +1, +3, +6, +10, +15 (כל הפרש גדל ב-2, 3, 4…).';
    } else if (kind === 'diffFib') {
      const a0 = rng.int(1, 9), f = [1, 1, 2, 3, 5, 8, 13];
      built = chain(a0, range(6).map((i) => ['+', f[i]]));
      rule = 'ההפרשים יוצרים סדרת פיבונאצ׳י: +1, +1, +2, +3, +5, +8…';
    } else if (kind === 'mulIdx') {
      const a0 = rng.int(1, 3);
      const seq = [a0];
      for (let i = 1; i <= 5; i++) seq.push(seq[i - 1] * 2 + i);
      const arcs = range(5).map((i) => ({ f: i, t: i + 1, lab: `×2+${i + 1}`, expr: `${seq[i]} × 2 + ${i + 1} = ${seq[i + 1]}`, pos: 'top' }));
      built = { seq, arcs };
      rule = 'בכל צעד: <b>×2 ועוד מספר שגדל</b> (+1, +2, +3…).';
    } else {
      const a0 = rng.int(1, 9), c = rng.int(1, 3);
      const steps = [];
      for (let i = 0; i < 7; i++) steps.push(['+', i % 2 === 0 ? c : Math.floor(i / 2) + 2]);
      built = chain(a0, steps);
      rule = `הפרשים לסירוגין: +${c} קבוע, ובאמצע הפרש שגדל (+2, +3, +4…).`;
    }
    return { ...built, rule, hint: 'כתוב את ההפרשים. אם הם לא קבועים — חפש חוקיות בהפרשים עצמם (כפל ב-2? ריבועים? פיבונאצ׳י?).' };
  },
};

const SERIES_SKILLS = {
  s_add: { name: 'חיבור / חיסור קבוע', min: 1 },
  s_diff2: { name: 'הוספה / הפחתה הדרגתית', min: 1 },
  s_mult: { name: 'כפל / חילוק קבוע', min: 1 },
  s_alt: { name: 'סדרות לסירוגין', min: 1 },
  s_inter: { name: 'סדרות משולבות', min: 2 },
  s_fib: { name: 'פיבונאצ׳י', min: 2 },
  s_prog: { name: 'כפל / חילוק הדרגתי', min: 2 },
  s_pow: { name: 'ריבועים, חזקות וראשוניים', min: 2 },
  s_frac: { name: 'עשרוניים ושברים', min: 2 },
  s_mix: { name: 'חוקיות מורכבת', min: 3 },
};

// Plausible wrong answers for a single missing number.
function seriesDistractors(rng, seq, idx, v) {
  const isInt = seq.every((x) => Number.isInteger(fracVal(x)));
  const prev = idx > 0 ? fracVal(seq[idx - 1]) : null;
  const prev2 = idx > 1 ? fracVal(seq[idx - 2]) : null;
  const next = idx < seq.length - 1 ? fracVal(seq[idx + 1]) : null;
  const cands = [];
  if (prev !== null && prev2 !== null) cands.push(prev + (prev - prev2)); // naive constant-difference guess
  const d = prev !== null ? Math.abs(v - prev) : 2;
  const small = isInt ? [1, 2, -1, -2] : [0.1, -0.1, 0.5, -0.5];
  cands.push(v + d, v - d, ...small.map((s) => v + s));
  if (next !== null) cands.push(next - (v - (prev ?? v)));
  cands.push(v * 2, Math.round(v * 1.5), v + 10, v - 10, v + 3, v - 3);
  const minV = Math.min(...seq.map(fracVal));
  const out = [];
  for (const c0 of cands) {
    const c = Math.round(c0 * 1000) / 1000;
    if (c === v || out.includes(c)) continue;
    if (isInt && !Number.isInteger(c)) continue;
    if (minV >= 0 && c < 0) continue;
    out.push(c);
  }
  // keep the first one (the "naive" trap) and randomize the rest
  return [out[0], ...rng.shuffle(out.slice(1))].slice(0, 3);
}

function fracDistractors(rng, x) {
  const c = [{ n: x.n + 1, d: x.d }, { n: x.n, d: x.d * 2 }, { n: x.n * 2, d: x.d }, { n: Math.max(1, x.n - 1), d: x.d }, { n: x.n, d: Math.max(1, x.d / 2) }];
  const seen = new Set([itemKey(x)]);
  const out = [];
  for (const y of rng.shuffle(c)) { if (!seen.has(itemKey(y))) { seen.add(itemKey(y)); out.push(y); } }
  return out.slice(0, 3);
}

function makeSeriesQuestion(skill, rng, level) {
  const b = SERIES_BUILDERS[skill](rng, level);
  const n = b.seq.length;
  const minB = b.minBlank || 2;
  let blanks;
  const two = level >= 4 && n >= 7 && rng.chance(0.6);
  if (two) {
    const s = rng.int(Math.max(minB, n - 4), n - 2);
    blanks = [s, s + 1];
  } else if (level === 1 || rng.chance(0.45)) blanks = [n - 1];
  else blanks = [rng.int(Math.max(minB, 2), n - 2)];
  // For per-item rules (squares etc.) any position works; for chains a blank needs neighbours — already ensured.
  const ans = blanks.map((i) => b.seq[i]);
  let options, answer;
  const fmtAns = (arr) => arr.map(fmtItem).join(' , ');
  if (blanks.length === 1) {
    const v = ans[0];
    const dis = typeof v === 'object' ? fracDistractors(rng, v) : seriesDistractors(rng, b.seq, blanks[0], v);
    ({ options, answer } = shuffleOptions(rng, fmtItem(v), dis.map(fmtItem)));
  } else {
    const [v1, v2] = ans.map(fracVal);
    const d1 = seriesDistractors(rng, b.seq, blanks[0], v1), d2 = seriesDistractors(rng, b.seq, blanks[1], v2);
    const pairs = [[v1, d2[0]], [d1[0], v2], [d1[1] ?? v1 + 1, d2[1] ?? v2 + 1], [v2, v1], [d1[0], d2[0]]];
    const correct = fmtAns(ans);
    const out = [];
    for (const p of pairs) { const s = p.map(fmtNum).join(' , '); if (s !== correct && !out.includes(s)) out.push(s); }
    ({ options, answer } = shuffleOptions(rng, correct, out.slice(0, 3)));
  }
  // explanation: which arcs produce the blanks
  const derive = [];
  blanks.forEach((bi) => {
    const hits = b.arcs.filter((x) => x.t === bi);
    (hits.length ? hits : b.arcs.filter((x) => x.f === bi).slice(0, 1)).forEach((a) => derive.push(a.expr));
  });
  return {
    domain: 'series',
    prompt: blanks.length === 1 ? 'איזה מספר חסר בסדרה?' : 'אילו שני מספרים חסרים בסדרה (לפי הסדר)?',
    visual: { kind: 'series', seq: b.seq, blanks },
    options, answer,
    hint: b.hint,
    rule: b.rule,
    explanation: `<p><b>החוקיות:</b> ${b.rule}</p>${derive.length ? `<p><b>חישוב:</b> ${derive.map((d) => `<span class="ltr-inline">${d}</span>`).join(' &nbsp;|&nbsp; ')}</p>` : ''}<p><b>התשובה:</b> <span class="ltr-inline">${fmtAns(ans)}</span></p>`,
    demo: { kind: 'series', seq: b.seq, arcs: b.arcs, blanks },
  };
}

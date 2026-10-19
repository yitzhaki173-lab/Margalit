/* ===== gen-instr.js — following instructions (מילוי הוראות / הוראות מילוליות) ===== */

const NAMES = ['אבי', 'אביגדור', 'אריק', 'דרורה', 'יניב', 'שושנה', 'יעל', 'נטלי', 'זכריה', 'רננה', 'אבינדב', 'מימי', 'עודד', 'ציפי', 'גלית', 'מירית', 'אילן', 'איזבל', 'עמרם', 'שאול', 'גילי', 'ששון', 'אהוד', 'אביגיל', 'ויקטור', 'נועם', 'דוד', 'רחל', 'משה', 'מרים', 'יוסף', 'תמר', 'אורי', 'אריאל', 'נעמה', 'שלומי', 'חנה', 'רבקה', 'בנימין', 'אליהו', 'טל', 'עדי', 'ליאור', 'רוני', 'איתי', 'עומר', 'שירה', 'מיכל', 'יונתן', 'אסף', 'הילה', 'נתנאל', 'דניאל', 'שמואל', 'יצחק', 'אברהם', 'סיגל', 'ענבל', 'קרן', 'פנינה', 'זאב', 'חיים', 'ברק', 'גדעון', 'צביה', 'לאה', 'שמעון', 'כרמל', 'הדס', 'אלון', 'ירדן', 'שקד', 'מעיין', 'בתיה', 'אפרת', 'נחום', 'עזרא', 'פזית', 'קובי', 'רפאל'];
const WORDS = ['אבטיח', 'אגס', 'ארנב', 'אוטובוס', 'אדמה', 'בננה', 'ברווז', 'בית', 'בקבוק', 'גמל', 'גבינה', 'גשר', 'גזר', 'דולפין', 'דבש', 'דלת', 'הר', 'היכל', 'ורד', 'וילון', 'זברה', 'זית', 'חתול', 'חלון', 'חלב', 'חבל', 'טלפון', 'טבעת', 'ילקוט', 'ים', 'כדור', 'כוס', 'כלב', 'לימון', 'לחם', 'מחשב', 'מכונית', 'מגדל', 'נמלה', 'נר', 'נחש', 'סוכר', 'סוס', 'ספר', 'עפרון', 'עגבנייה', 'עיפרון', 'פרפר', 'פיל', 'פרח', 'צב', 'צלחת', 'קוף', 'קשת', 'קערה', 'רכבת', 'רגל', 'שולחן', 'שמש', 'שעון', 'תפוח', 'תיק', 'תות', 'מגבת', 'מטבח', 'סולם', 'כיסא', 'שמיכה', 'משקפיים', 'מפתח'];
// near-identical words for harder dictionary questions
const WORD_FAMILIES = [
  ['חלון', 'חלום', 'חלוק', 'חלב', 'חלבון', 'חליל'],
  ['ספר', 'ספרייה', 'ספרות', 'ספינה', 'ספוג', 'ספל'],
  ['מכונית', 'מכונה', 'מכתב', 'מכנס', 'מכשיר', 'מכסה'],
  ['שמש', 'שמשייה', 'שמיים', 'שמן', 'שמלה', 'שמחה'],
  ['חנון', 'חנוק', 'חבוק', 'חגור', 'חנוכה', 'חניה'],
  ['קלות', 'קלילות', 'קליפה', 'קלמר', 'קלף', 'קלע'],
  ['שיעור', 'שיעול', 'שיער', 'שיטה', 'שיר', 'שיקוי'],
  ['ברק', 'ברכה', 'ברז', 'ברזל', 'ברוש', 'בריכה'],
];
const WORDS3 = ['בגד', 'מגב', 'בכה', 'גלה', 'נמר', 'סוס', 'עוף', 'פיל', 'קוף', 'שיר', 'תיק', 'כוס', 'ענן', 'חול', 'יום', 'ספר', 'לחם', 'כלב', 'שמש', 'דגל', 'זהב', 'גשם', 'חלב', 'ילד', 'קשת', 'רגל', 'פרח', 'צבע', 'אור', 'גזר', 'דבר', 'תות', 'עגל', 'אבן', 'רצח', 'אצה', 'פקיד', 'אדון', 'רצון', 'צפון'];
const HEB_MONTHS = ['תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול'];
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const SHIFTS = ['בוקר', 'צהריים', 'לילה'];

const FINAL_NOTE = '<span class="note">(אותיות סופיות נחשבות כאותה אות: ם=מ, ן=נ, ץ=צ, ף=פ, ך=כ)</span>';
const letterRow = (arr) => `<div class="letter-row" dir="rtl">${arr.map((c) => `<span>${c}</span>`).join('')}</div>`;
// Options helper: removes duplicates / the correct answer from distractors and tops up to 3.
function hebOpts(rng, correct, distractors) {
  const c = String(correct);
  const dis = uniq(distractors.map(String)).filter((x) => x !== c && x !== '');
  if (dis.length < 3 && /^\d+$/.test(c)) {
    const n = Number(c);
    for (let d = 1; dis.length < 3 && d < 50; d++) {
      for (const x of [n + d, n - d]) if (x >= 0 && dis.length < 3 && !dis.includes(String(x)) && String(x) !== c) dis.push(String(x));
    }
  }
  if (dis.length < 3 && c.length === 1) {
    for (const x of rng.shuffle(HEB)) if (dis.length < 3 && baseLetter(x) !== baseLetter(c) && !dis.includes(x)) dis.push(x);
  }
  if (dis.length < 3 && /^\d+$/.test(c) === false && c.length > 1) {
    // reorder letters of the answer as a last-resort plausible distractor
    for (let t = 0; t < 30 && dis.length < 3; t++) { const x = rng.shuffle(c.split('')).join(''); if (x !== c && !dis.includes(x)) dis.push(x); }
  }
  return shuffleOptions(rng, c, dis.slice(0, Math.max(3, Math.min(dis.length, 4))));
}
const countArr = (arr, pred) => arr.filter(pred).length;

// Pick distinct distractors near a numeric answer
function numDistractors(rng, v, n = 3, spread = 2) {
  const c = [];
  for (let d = 1; c.length < 12; d++) { c.push(v + d, v - d); if (d > 20) break; }
  return rng.shuffle(c.filter((x) => x >= 0 && x !== v).slice(0, n + spread)).slice(0, n);
}
function letterDistractors(rng, correct, pool, n = 3) {
  const p = uniq(pool.filter((x) => baseLetter(x) !== baseLetter(correct)));
  const extra = rng.shuffle(HEB.filter((x) => x !== baseLetter(correct) && !p.map(baseLetter).includes(x)));
  return [...rng.shuffle(p), ...extra].slice(0, n);
}
function randomLetters(rng, n, alphabet = HEB) {
  return range(n).map(() => rng.pick(alphabet));
}

const INSTR_BUILDERS = {
  /* ---- counting letters under a condition ---- */
  i_letters(rng, lv) {
    const n = lv <= 1 ? 12 : lv <= 3 ? 16 : 20;
    const focus = rng.sample(['ח', 'ר', 'ט', 'ש', 'מ', 'נ', 'צ', 'ל', 'י', 'ס', 'ת', 'ק'], 2);
    const [X, Y] = focus;
    const alpha = [X, X, X, Y, Y, ...rng.sample(HEB.filter((c) => c !== X && c !== Y), lv <= 2 ? 3 : 5)];
    let arr = randomLetters(rng, n, alpha);
    const useFinal = lv >= 4 && BASE_TO_FINAL[X];
    if (useFinal) { const i = rng.int(1, n - 2); arr[i] = BASE_TO_FINAL[X]; }
    const kinds = lv <= 1 ? ['plain'] : lv === 2 ? ['before', 'after'] : lv === 3 ? ['before', 'after', 'beside'] : ['before', 'after', 'beside', 'between'];
    const kind = rng.pick(kinds);
    const isX = (c) => baseLetter(c) === X, isY = (c) => baseLetter(c) === Y;
    let pred, q;
    if (kind === 'plain') { pred = (i) => isX(arr[i]); q = `כמה פעמים מופיעה האות ${L(X)}?`; }
    else if (kind === 'before') { pred = (i) => isX(arr[i]) && i > 0 && isY(arr[i - 1]); q = `כמה פעמים מופיעה האות ${L(X)} כשלפניה (מימין לה) האות ${L(Y)}?`; }
    else if (kind === 'after') { pred = (i) => isX(arr[i]) && i < n - 1 && isY(arr[i + 1]); q = `כמה פעמים מופיעה האות ${L(X)} כשאחריה (משמאל לה) האות ${L(Y)}?`; }
    else if (kind === 'beside') { pred = (i) => isX(arr[i]) && ((i > 0 && isY(arr[i - 1])) || (i < n - 1 && isY(arr[i + 1]))); q = `כמה פעמים מופיעה האות ${L(X)} כשלידה (מצד ימין או שמאל) נמצאת האות ${L(Y)}?`; }
    else { pred = (i) => isX(arr[i]) && i > 0 && i < n - 1 && isY(arr[i - 1]) && isY(arr[i + 1]); q = `כמה פעמים מופיעה האות ${L(X)} כשמשני צדדיה נמצאת האות ${L(Y)}?`; }
    const hits = range(n).filter(pred);
    if (kind !== 'plain' && hits.length === 0 && rng.chance(0.8)) return INSTR_BUILDERS.i_letters(rng, lv);
    const ans = hits.length;
    const { options, answer } = hebOpts(rng, ans, numDistractors(rng, ans, lv >= 3 ? 4 : 3));
    return {
      prompt: `לפניך שורת אותיות (קוראים מימין לשמאל). ${q} ${useFinal ? FINAL_NOTE : ''}`,
      visual: { kind: 'html', html: letterRow(arr) },
      options, answer,
      hint: kind === 'plain' ? 'עבור על השורה אות-אות וסמן כל מופע.' : `מצא קודם את כל המופעים של ${L(X)}, ורק אז בדוק לכל אחד את השכנים שלו. זכור: "לפני" = מימין, "אחרי" = משמאל.`,
      explanation: `<p>המופעים שעומדים בתנאי מסומנים:</p>${`<div class="letter-row" dir="rtl">${arr.map((c, i) => `<span class="${hits.includes(i) ? 'hit' : isX(c) ? 'miss' : ''}">${c}</span>`).join('')}</div>`}<p>סה"כ: <b>${ans}</b>. ${isX('ן') || useFinal ? 'שים לב שגם האות הסופית נספרת.' : ''} מופעים מסומנים באפור הם של ${L(X)} שלא עומדים בתנאי.</p>`,
    };
  },

  /* ---- alphabet positions ---- */
  i_abc(rng, lv) {
    const kind = rng.pick(lv <= 2 ? ['nth', 'after', 'before'] : ['nth', 'shift', 'chain', 'between']);
    let ans, q, expl;
    if (kind === 'nth') {
      const k = rng.int(2, 22); ans = HEB[k - 1];
      q = `מהי האות ה-${k} באלף-בית?`;
      expl = `סופרים: ${HEB.slice(0, k).join(' ')} — האות ה-${k} היא <b>${ans}</b>. טיפ: זכור עוגנים — י=10, כ=11, ק=19, ת=22.`;
    } else if (kind === 'after' || kind === 'before') {
      const i = rng.int(1, 20); const c = HEB[i];
      ans = kind === 'after' ? HEB[i + 1] : HEB[i - 1];
      q = `מהי האות ש${kind === 'after' ? 'באה מיד אחרי' : 'באה מיד לפני'} האות ${L(c)} באלף-בית?`;
      expl = `${HEB.slice(Math.max(0, i - 2), i + 3).join(' ')} — ${kind === 'after' ? 'אחרי' : 'לפני'} ${c} באה <b>${ans}</b>.`;
    } else if (kind === 'shift') {
      const k = rng.int(2, 4), dir = rng.chance(0.5) ? 1 : -1;
      const i = dir > 0 ? rng.int(0, 21 - k) : rng.int(k, 21);
      ans = HEB[i + dir * k];
      q = `מהי האות שנמצאת ${k} מקומות ${dir > 0 ? 'אחרי' : 'לפני'} האות ${L(HEB[i])} באלף-בית?`;
      expl = `מתחילים מ-${HEB[i]} וסופרים ${k} ${dir > 0 ? 'קדימה' : 'אחורה'}: ${range(k + 1).map((j) => HEB[i + dir * j]).join(' → ')}. התשובה: <b>${ans}</b>.`;
    } else if (kind === 'between') {
      const i = rng.int(0, 17), j = i + rng.int(3, 4);
      const mid = HEB.slice(i + 1, j);
      ans = mid.length;
      q = `כמה אותיות נמצאות באלף-בית בין האות ${L(HEB[i])} לבין האות ${L(HEB[j])} (לא כולל אותן)?`;
      expl = `בין ${HEB[i]} ל-${HEB[j]} נמצאות: ${mid.join(', ')} — סה"כ <b>${ans}</b>.`;
      const { options, answer } = hebOpts(rng, ans, numDistractors(rng, ans));
      return { prompt: q, options, answer, hint: 'כתוב את האותיות ברצף וספור רק את מה שבאמצע.', explanation: `<p>${expl}</p>` };
    } else {
      // chain: build a 3-letter word with alphabet steps (booklet style)
      const w = rng.pick(WORDS3.filter((x) => x.length === 3));
      const parts = normWord(w).split('').map((c) => {
        const i = letterIndex(c);
        const t = rng.pick(i > 0 && i < 21 ? ['after', 'before', 'nth'] : ['nth']);
        if (t === 'after') return { c, text: `האות שבאה אחרי ${L(HEB[i - 1])}` };
        if (t === 'before') return { c, text: `האות שבאה לפני ${L(HEB[i + 1])}` };
        return { c, text: `האות ה-${i + 1} באלף-בית` };
      });
      ans = withFinal(parts.map((p) => p.c).join(''));
      q = `כתוב ברצף: ${parts.map((p) => p.text).join(', ואחריה ')}. איזו מילה התקבלה?`;
      const others = rng.sample(WORDS3.filter((x) => x !== w && x.length === 3), 3);
      // a "near miss": one letter off
      const p = parts.map((x) => x.c); const j = rng.int(0, 2); const li = letterIndex(p[j]);
      p[j] = HEB[li + (li < 21 ? 1 : -1)];
      const near = withFinal(p.join(''));
      const dis = uniq([near, ...others]).filter((x) => x !== ans).slice(0, 3);
      const { options, answer } = hebOpts(rng, ans, dis);
      return {
        prompt: q, options, answer,
        hint: 'פתור כל חלק בנפרד ורשום את האות בטיוטה לפני שעוברים לחלק הבא.',
        explanation: `<p>${parts.map((x) => `${x.text} = <b>${x.c}</b>`).join('<br>')}</p><p>יחד: <b>${ans}</b>.</p>`,
      };
    }
    const { options, answer } = hebOpts(rng, ans, letterDistractors(rng, ans, HEB.slice(Math.max(0, letterIndex(ans) - 2), letterIndex(ans) + 3)));
    return { prompt: q, options, answer, hint: 'כתוב בראש דף הטיוטה את הא"ב עם מספר מעל כל אות — זה חוסך זמן בכל השאלות מהסוג הזה.', explanation: `<p>${expl}</p>` };
  },

  /* ---- gematria ---- */
  i_gem(rng, lv) {
    const kind = rng.pick(lv <= 2 ? ['letter', 'word'] : ['word', 'wordPlus', 'compare']);
    if (kind === 'letter') {
      const c = rng.pick(HEB); const v = GEMATRIA[c];
      const dis = uniq([letterIndex(c) + 1, v * 10, v / 10, v + 1, v - 1, v + 10].filter((x) => Number.isInteger(x) && x > 0 && x !== v)).slice(0, 3);
      const { options, answer } = hebOpts(rng, v, dis);
      return { prompt: `מהו הערך המספרי (גימטרייה) של האות ${L(c)}?`, options, answer, hint: 'א-ט = 1-9, י-צ = 10-90 (בקפיצות של 10), ק-ת = 100-400.', explanation: `<p>${c} = <b>${v}</b>.${v !== letterIndex(c) + 1 ? ` (שים לב: הערך של ${c} הוא לא המקום שלה בא"ב, שהוא ${letterIndex(c) + 1}.)` : ''}</p>` };
    }
    if (kind === 'compare') {
      const ws = rng.sample(WORDS3, 4);
      const vals = ws.map(gematria);
      if (uniq(vals).length < 4) return INSTR_BUILDERS.i_gem(rng, lv);
      const hi = rng.chance(0.5);
      const best = ws[vals.indexOf(hi ? Math.max(...vals) : Math.min(...vals))];
      const { options, answer } = hebOpts(rng, best, ws.filter((w) => w !== best));
      return { prompt: `לאיזו מילה יש ערך מספרי (גימטרייה) ${hi ? 'גבוה' : 'נמוך'} ביותר?`, options, answer, hint: 'לא חייבים לחשב הכול — אות אחת "כבדה" (ק, ר, ש, ת) מכריעה כמעט תמיד.', explanation: `<p>${ws.map((w, i) => `${w} = ${w.split('').map((c) => GEMATRIA[baseLetter(c)]).join('+')} = <b>${vals[i]}</b>`).join('<br>')}</p>` };
    }
    const w = rng.pick(lv <= 2 ? WORDS3 : [...WORDS3, 'שמש', 'שלום', 'תפוח']);
    let v = gematria(w), q = `מהו הערך המספרי (גימטרייה) של המילה "${w}"?`, extra = '';
    if (kind === 'wordPlus') {
      const k1 = rng.int(1, 22), k2 = rng.int(1, 22);
      const add = GEMATRIA[HEB[k1 - 1]] + GEMATRIA[HEB[k2 - 1]];
      q = `חשב את הערך המספרי של המילה "${w}" והוסף לו את הערך המספרי של האות ה-${k1} ושל האות ה-${k2} בא"ב.`;
      extra = `<br>האות ה-${k1} היא ${HEB[k1 - 1]} (${GEMATRIA[HEB[k1 - 1]]}), האות ה-${k2} היא ${HEB[k2 - 1]} (${GEMATRIA[HEB[k2 - 1]]}). ${v} + ${add} = <b>${v + add}</b>`;
      v += add;
    }
    const dis = uniq([v + 10, v - 10, v + 1, v + 100, v - 1, sum(w.split('').map((c) => letterIndex(c) + 1))]).filter((x) => x > 0 && x !== v);
    const { options, answer } = hebOpts(rng, v, rng.shuffle(dis).slice(0, 3));
    return { prompt: q + ' ' + FINAL_NOTE, options, answer, hint: 'כתוב את ערך כל אות בנפרד וחבר. א-ט אחדות, י-צ עשרות, ק-ת מאות.', explanation: `<p>${w}: ${w.split('').map((c) => `${c}=${GEMATRIA[baseLetter(c)]}`).join(', ')} → <b>${gematria(w)}</b>${extra}</p>` };
  },

  /* ---- dictionary order ---- */
  i_dict(rng, lv) {
    const fam = lv >= 3 ? rng.pick(WORD_FAMILIES) : null;
    const pool = fam ? fam : WORDS;
    const kind = rng.pick(lv <= 2 ? ['first', 'last', 'cond'] : ['first', 'second', 'order', 'cond', 'cond2']);
    const sortW = (arr) => arr.slice().sort(dictCompare);
    const explainOrder = (ws) => `<p>הסדר במילון: ${sortW(ws).map((w) => `<b>${w}</b>`).join(' ← ')}</p><p class="muted">משווים אות-אות מתחילת המילה: האות הראשונה קובעת; אם היא זהה — עוברים לשנייה, וכן הלאה. מילה קצרה שהיא תחילית של מילה ארוכה — באה קודם.</p>`;
    if (kind === 'first' || kind === 'last' || kind === 'second') {
      const ws = rng.sample(pool, 4);
      const s = sortW(ws);
      const ans = kind === 'first' ? s[0] : kind === 'second' ? s[1] : s[3];
      const { options, answer } = hebOpts(rng, ans, ws.filter((w) => w !== ans));
      return { prompt: `איזו מילה תופיע ${kind === 'first' ? 'ראשונה' : kind === 'second' ? 'שנייה' : 'אחרונה'} במילון?`, options, answer, hint: 'השווה את האות הראשונה של כל המילים. רק אם היא זהה — עבור לאות השנייה.', explanation: explainOrder(ws) };
    }
    if (kind === 'order') {
      const ws = rng.sample(pool, 4);
      const s = sortW(ws);
      const correct = s.join(', ');
      const dis = [];
      for (let t = 0; t < 30 && dis.length < 3; t++) { const p = rng.shuffle(ws).join(', '); if (p !== correct && !dis.includes(p)) dis.push(p); }
      const { options, answer } = hebOpts(rng, correct, dis);
      return { prompt: `מהו הסדר שבו יופיעו המילים במילון? <div class="word-list">${ws.join(' &nbsp; ')}</div>`, options, answer, hint: 'מצא קודם רק את המילה הראשונה — ובדוק אילו אפשרויות מתחילות בה. כך נפסלות רוב התשובות מהר.', explanation: explainOrder(ws) };
    }
    // conditional instruction: "if A comes before B write A, else write ..."
    const [A, B, C] = rng.sample(pool, 3);
    const before = dictCompare(A, B) < 0;
    if (kind === 'cond') {
      const askBefore = rng.chance(0.5);
      const cond = askBefore ? before : !before;
      const ans = cond ? A : `${normWord(B).length}`;
      const q = `אם המילה "${A}" מופיעה במילון ${askBefore ? 'לפני' : 'אחרי'} המילה "${B}" — כתוב אותה. אם לא — כתוב את מספר האותיות במילה "${B}".`;
      const dis = uniq([cond ? `${B.length}` : A, B, `${A.length}`, cond ? `${B.length + 1}` : `${B.length - 1}`]).filter((x) => x !== ans).slice(0, 3);
      const { options, answer } = hebOpts(rng, ans, dis);
      return { prompt: q, options, answer, hint: 'קודם בדוק רק את התנאי (מי לפני מי), ורק אחר כך בצע את מה שנדרש.', explanation: `<p>"${A}" מופיעה <b>${before ? 'לפני' : 'אחרי'}</b> "${B}" במילון, ולכן התנאי ${cond ? '<b>מתקיים</b>' : '<b>לא מתקיים</b>'} ← התשובה: <b>${ans}</b>.</p>` + explainOrder([A, B]) };
    }
    // nested condition
    const c1 = dictCompare(A, B) < 0, c2 = dictCompare(C, B) < 0;
    const ans = c1 ? A : c2 ? C : `${normWord(C).length}`;
    const q = `אם המילה "${A}" מופיעה במילון לפני המילה "${B}" — כתוב אותה. אם לא — בדוק אם המילה "${C}" מופיעה לפני "${B}": אם כן כתוב אותה, ואם לא — כתוב את מספר האותיות במילה "${C}".`;
    const dis = uniq([A, C, B, `${C.length}`, `${C.length + 1}`]).filter((x) => x !== ans).slice(0, 3);
    const { options, answer } = hebOpts(rng, ans, dis);
    return { prompt: q, options, answer, hint: 'פרק את ההוראה לשלבים ובדוק כל תנאי לפי הסדר. ברגע שתנאי מתקיים — עוצרים.', explanation: `<p>שלב 1: "${A}" ${c1 ? 'לפני' : 'אחרי'} "${B}" → ${c1 ? 'מתקיים, כותבים אותה.' : 'לא מתקיים, ממשיכים.'}</p>${c1 ? '' : `<p>שלב 2: "${C}" ${c2 ? 'לפני' : 'אחרי'} "${B}" → ${c2 ? 'מתקיים, כותבים אותה.' : 'לא מתקיים, כותבים את מספר האותיות: ' + normWord(C).length}</p>`}<p>התשובה: <b>${ans}</b>.</p>` + explainOrder([A, B, C]) };
  },

  /* ---- names with conditions ---- */
  i_names(rng, lv) {
    const conds = [
      { t: 'בו לא מופיעות שתי אותיות זהות', f: (w) => uniq(normWord(w).split('')).length === w.length },
      { t: 'בו מופיעות שתי אותיות זהות', f: (w) => uniq(normWord(w).split('')).length < w.length },
      { t: 'הארוך ביותר', f: null, best: (ws) => ws.slice().sort((a, b) => b.length - a.length) },
      { t: 'הקצר ביותר', f: null, best: (ws) => ws.slice().sort((a, b) => a.length - b.length) },
    ];
    const letterConds = (X) => [
      { t: `בו לא מופיעה האות ${L(X)}`, f: (w) => !normWord(w).includes(X) },
      { t: `בו מופיעה האות ${L(X)}`, f: (w) => normWord(w).includes(X) },
    ];
    for (let tries = 0; tries < 200; tries++) {
      const ws = rng.sample(NAMES, 4);
      const X = rng.pick(['א', 'י', 'ר', 'ל', 'מ', 'נ', 'ו', 'ש', 'ד']);
      const all = [...conds, ...letterConds(X)];
      const cond = rng.pick(all);
      let target;
      if (cond.f) { const m = ws.filter(cond.f); if (m.length !== 1) continue; target = m[0]; }
      else { const s = cond.best(ws); if (s[0].length === s[1].length) continue; target = s[0]; }
      const fromEnd = lv >= 3 && rng.chance(0.4);
      const k = rng.int(1, Math.min(target.length, lv <= 2 ? 3 : 4));
      const idx = fromEnd ? target.length - k : k - 1;
      const ans = target[idx];
      const pool = ws.filter((w) => w !== target).map((w) => w[Math.min(w.length - 1, idx)]).concat(target.split(''));
      const dis = letterDistractors(rng, ans, pool);
      const { options, answer } = hebOpts(rng, ans, dis);
      const posText = fromEnd ? `${k === 1 ? 'האחרונה' : `ה${ORD_F[k]} מהסוף`}` : `ה${ORD_F[k]}`;
      return {
        prompt: `לפניך ארבעה שמות. מהי האות ${posText} בשם ${cond.t}? <div class="word-list">${ws.join(' , ')}</div>${cond.t.includes('זהות') ? FINAL_NOTE : ''}`,
        options, answer,
        hint: 'שלב 1: מצא את השם שעומד בתנאי (רק אחד עומד בו). שלב 2: רק עכשיו ספור את האותיות בו.',
        explanation: `<p>השם שעומד בתנאי "${cond.t}" הוא <b>${target}</b>${cond.f ? '' : ` (${target.length} אותיות)`}.</p><p>האות ${posText} בו: ${target.split('').map((c, i) => (i === idx ? `<b class="hl">${c}</b>` : c)).join(' ')} → <b>${ans}</b>.</p>`,
      };
    }
    return INSTR_BUILDERS.i_letters(rng, lv);
  },

  /* ---- build a word from letter positions ---- */
  i_build(rng, lv) {
    const target = rng.pick(WORDS3.filter((w) => w.length === (lv >= 4 ? rng.pick([3, 4]) : 3)));
    const tw = normWord(target).split('');
    const n = lv <= 2 ? 7 : 9;
    const descs = [];
    let slots;
    for (let tries = 0; tries < 100; tries++) {
      slots = rng.sample(range(n), tw.length);
      if (uniq(slots).length === tw.length) break;
    }
    const arr = randomLetters(rng, n);
    slots.forEach((s, j) => { arr[s] = tw[j]; });
    const mid = (n - 1) / 2;
    slots.forEach((s) => {
      const opts = [`ה${ORD_F[s + 1]} מימין`];
      if (n - s <= 5) opts.push(n - s === 1 ? 'האחרונה' : `ה${ORD_F[n - s]} מהסוף`);
      if (s === mid) opts.push('האמצעית');
      if (s === 0) opts.push('הראשונה');
      descs.push(lv <= 1 ? opts[0] : rng.pick(opts));
    });
    const ans = target;
    const pool = WORDS3.filter((w) => w !== target && w.length === target.length);
    const near = withFinal(slots.map((s, j) => (j === 0 ? arr[n - 1 - s] : arr[s])).join(''));
    const dis = uniq([near, ...rng.sample(pool, 4)]).filter((w) => normWord(w) !== normWord(ans)).slice(0, 3);
    const { options, answer } = hebOpts(rng, ans, dis);
    return {
      prompt: `לפניך שורת אותיות. איזו מילה תצא מחיבור האות ${descs.join(', האות ')} (לפי הסדר)?`,
      visual: { kind: 'html', html: letterRow(arr) },
      options, answer,
      hint: 'מספר את האותיות בטיוטה מ-1 מימין. "מהסוף" = סופרים משמאל. האמצעית בשורה של 9 היא ה-5.',
      explanation: `<div class="letter-row" dir="rtl">${arr.map((c, i) => `<span class="${slots.includes(i) ? 'hit' : ''}"><small>${i + 1}</small>${c}</span>`).join('')}</div><p>${descs.map((d, j) => `האות ${d} = מקום ${slots[j] + 1} = <b>${arr[slots[j]]}</b>`).join('<br>')}</p><p>יחד: <b>${ans}</b>.</p>`,
    };
  },

  /* ---- digits and numbers ---- */
  i_digits(rng, lv) {
    const kind = rng.pick(lv <= 2 ? ['build', 'countDigit', 'reverseMax'] : ['build', 'nthOfMin', 'reverseMax', 'remainder', 'zeros', 'sumCond', 'digitSum']);
    if (kind === 'build') {
      const [h, t, u] = rng.sample(range(9, 1), 3);
      const ans = h * 100 + t * 10 + u;
      const dis = uniq([u * 100 + t * 10 + h, t * 100 + h * 10 + u, h * 100 + u * 10 + t, u * 100 + h * 10 + t]).filter((x) => x !== ans).slice(0, 4);
      const order = rng.shuffle([['המאות', h], ['האחדות', u], ['העשרות', t]]);
      const { options, answer } = hebOpts(rng, ans, dis);
      return { prompt: `מהו המספר שבספרת ${order[0][0]} שלו רשום ${order[0][1]}, בספרת ${order[1][0]} רשום ${order[1][1]} ובספרת ${order[2][0]} רשום ${order[2][1]}?`, options, answer, hint: 'כתוב שלוש משבצות: מאות | עשרות | אחדות, ומלא כל אחת לפי ההוראה.', explanation: `<p>מאות=${h}, עשרות=${t}, אחדות=${u} ← <b>${ans}</b>.</p>` };
    }
    if (kind === 'countDigit') {
      const d = rng.int(0, 9);
      const arr = range(lv <= 1 ? 10 : 14).map(() => (rng.chance(0.3) ? d : rng.int(0, 9)));
      const c = countArr(arr, (x) => x === d);
      const minus = lv >= 2 && rng.chance(0.5);
      const ans = minus ? c - 1 : c;
      const { options, answer } = hebOpts(rng, ans, numDistractors(rng, ans));
      return { prompt: `כמה פעמים מופיעה הספרה ${d} בשורה הבאה?${minus ? ' החסר מהמספר שקיבלת 1 וכתוב את התוצאה.' : ''}`, visual: { kind: 'html', html: `<div class="num-row" dir="ltr">${arr.join(' , ')}</div>` }, options, answer, hint: 'סמן כל מופע באצבע/בעיפרון — לא לספור "בראש".', explanation: `<p>הספרה ${d} מופיעה ${timesWord(c)}.${minus ? ` ${c} − 1 = <b>${ans}</b>` : ''}</p>` };
    }
    const nums = uniq(range(5).map(() => rng.int(lv <= 2 ? 100 : 1000, lv <= 2 ? 999 : 9999)));
    if (kind === 'reverseMax' || kind === 'nthOfMin') {
      const max = Math.max(...nums), min = Math.min(...nums);
      if (kind === 'reverseMax') {
        const ans = String(max).split('').reverse().join('');
        const sorted = nums.slice().sort((a, b) => b - a);
        const dis = uniq([String(sorted[1]).split('').reverse().join(''), String(max), String(min).split('').reverse().join('')]).filter((x) => x !== ans);
        const { options, answer } = hebOpts(rng, ans, dis.slice(0, 3));
        return { prompt: `כתוב בסדר הפוך את המספר הגדול ביותר מבין המספרים הבאים:`, visual: { kind: 'html', html: `<div class="num-row" dir="ltr">${nums.join(' , ')}</div>` }, options, answer, hint: 'שלב 1: מצא את הגדול ביותר. שלב 2: הפוך את סדר הספרות.', explanation: `<p>הגדול ביותר: ${max}. בסדר הפוך: <b>${ans}</b>.</p>` };
      }
      const k = rng.int(1, String(min).length);
      const ans = String(min)[k - 1];
      const dis = uniq([String(min)[String(min).length - k], String(max)[k - 1], ...String(min).split('')]).filter((x) => x !== ans);
      const fill = numDistractors(rng, Number(ans)).map(String).filter((x) => x.length === 1);
      const { options, answer } = hebOpts(rng, ans, uniq([...dis, ...fill]).filter((x) => x !== ans).slice(0, 3));
      return { prompt: `רשום את הספרה ה${ORD_F[k]} משמאל של המספר הקטן ביותר:`, visual: { kind: 'html', html: `<div class="num-row" dir="ltr">${nums.join(' , ')}</div>` }, options, answer, hint: 'במספרים סופרים משמאל — כמו שקוראים אותם.', explanation: `<p>הקטן ביותר: ${min}. הספרה ה${ORD_F[k]} משמאל: <b>${ans}</b>.</p>` };
    }
    if (kind === 'remainder') {
      const k = rng.pick([3, 4, 6, 7, 8, 9]);
      const n0 = rng.int(20, 99);
      const r = n0 % k;
      const ans = r === 0 ? n0 / k : r;
      const dis = uniq([Math.floor(n0 / k), r, Math.floor(n0 / k) + 1, k - r, r + 1].filter((x) => x !== ans && x >= 0)).slice(0, 3);
      const { options, answer } = hebOpts(rng, ans, dis.length >= 3 ? dis : dis.concat(numDistractors(rng, ans)).slice(0, 3));
      return { prompt: `אם המספר ${n0} מתחלק ב-${k} ללא שארית — כתוב את התוצאה. אם לא — כתוב את השארית.`, options, answer, hint: `מצא את הכפולה הגדולה ביותר של ${k} שלא עוברת את ${n0}.`, explanation: `<p>${k} × ${Math.floor(n0 / k)} = ${k * Math.floor(n0 / k)}. ${r === 0 ? `מתחלק בדיוק ← התוצאה <b>${ans}</b>.` : `${n0} − ${k * Math.floor(n0 / k)} = ${r} ← יש שארית, כותבים <b>${r}</b>.`}</p>` };
    }
    if (kind === 'zeros') {
      const make = (z) => { const len = rng.int(7, 9); const a = range(len).map(() => rng.int(1, 9)); rng.sample(range(len - 1, 1), z).forEach((i) => { a[i] = 0; }); return a.join(''); };
      const zs = rng.shuffle([2, 3, 4, 5]);
      const arr = zs.map(make);
      const best = arr[zs.indexOf(5)];
      const ans = best[0];
      const dis = uniq(arr.filter((x) => x !== best).map((x) => x[0])).filter((x) => x !== ans);
      const fill = range(9, 1).map(String).filter((x) => x !== ans && !dis.includes(x));
      const { options, answer } = hebOpts(rng, ans, [...dis, ...rng.shuffle(fill)].slice(0, 3));
      return { prompt: 'רשום את הספרה הראשונה (משמאל) של המספר שיש בו הכי הרבה אפסים:', visual: { kind: 'html', html: `<div class="num-row" dir="ltr">${arr.join(' , ')}</div>` }, options, answer, hint: 'ספור אפסים בכל מספר, ורק אז הסתכל על הספרה הראשונה.', explanation: `<p>${arr.map((x, i) => `${x} — ${zs[i]} אפסים`).join('<br>')}</p><p>המספר ${best} ← הספרה הראשונה: <b>${ans}</b>.</p>` };
    }
    if (kind === 'digitSum') {
      const ns = rng.sample(range(899, 100), 5);
      const mx = Math.max(...ns), mn = Math.min(...ns);
      const smallestDigitOfMax = Math.min(...String(mx).split('').map(Number));
      const largestDigitOfMin = Math.max(...String(mn).split('').map(Number));
      const ans = smallestDigitOfMax + largestDigitOfMin;
      const { options, answer } = hebOpts(rng, ans, numDistractors(rng, ans));
      return { prompt: `נתונים המספרים: <span class="ltr-inline">${ns.join(' , ')}</span>. רשום את תוצאת החיבור של הספרה הקטנה ביותר במספר הגדול ביותר עם הספרה הגדולה ביותר במספר הקטן ביותר.`, options, answer, hint: 'פרק לשלושה שלבים: (1) מספר גדול ביותר ← הספרה הקטנה בו. (2) מספר קטן ביותר ← הספרה הגדולה בו. (3) חבר.', explanation: `<p>הגדול: ${mx} ← הספרה הקטנה בו ${smallestDigitOfMax}.<br>הקטן: ${mn} ← הספרה הגדולה בו ${largestDigitOfMin}.<br>${smallestDigitOfMax} + ${largestDigitOfMin} = <b>${ans}</b>.</p>` };
    }
    // sumCond
    const a = rng.int(5, 40), b = rng.int(5, 40), c = rng.int(5, 40), d = rng.int(5, 40);
    if (a + b === c + d) return INSTR_BUILDERS.i_digits(rng, lv);
    const z = rng.int(1, 9);
    const ans = a + b > c + d ? a + b - (c + d) : z;
    const dis = uniq([Math.abs(a + b - (c + d)), z, a + b, c + d, a + b + c + d].filter((x) => x !== ans)).slice(0, 3);
    const { options, answer } = hebOpts(rng, ans, dis);
    return { prompt: `אם הסכום של ${a} ו-${b} גדול מהסכום של ${c} ו-${d} — כתוב את ההפרש בין הסכומים. אם לא — כתוב את הספרה ${z}.`, options, answer, hint: 'חשב את שני הסכומים בנפרד, השווה, ורק אז החלט מה לכתוב.', explanation: `<p>${a} + ${b} = ${a + b}, ${c} + ${d} = ${c + d}. ${a + b > c + d ? `הסכום הראשון גדול ← ההפרש: ${a + b} − ${c + d} = <b>${ans}</b>.` : `הסכום הראשון לא גדול ← כותבים <b>${z}</b>.`}</p>` };
  },

  /* ---- compass ---- */
  i_compass(rng, lv) {
    const DIRS = { N: [0, 1, 'צפון', 'צפונה'], S: [0, -1, 'דרום', 'דרומה'], E: [1, 0, 'מזרח', 'מזרחה'], W: [-1, 0, 'מערב', 'מערבה'] };
    const keys = Object.keys(DIRS);
    const nMoves = lv <= 1 ? 2 : lv <= 3 ? 3 : 4;
    let moves, x, y;
    for (let t = 0; t < 100; t++) {
      moves = [];
      let prev = null;
      for (let i = 0; i < nMoves; i++) {
        const k = rng.pick(keys.filter((kk) => kk !== prev));
        moves.push([k, rng.int(1, lv <= 2 ? 3 : 5)]);
        prev = k;
      }
      x = sum(moves.map(([k, d]) => DIRS[k][0] * d)); y = sum(moves.map(([k, d]) => DIRS[k][1] * d));
      if (x !== 0 || y !== 0) break;
    }
    const back = lv >= 3 && rng.chance(0.5);
    const dirName = (dx, dy) => {
      const ns = dy > 0 ? 'צפון' : dy < 0 ? 'דרום' : '';
      const ew = dx > 0 ? 'מזרח' : dx < 0 ? 'מערב' : '';
      return ns && ew ? `${ns}-${ew}` : ns || ew;
    };
    const ans = back ? dirName(-x, -y) : dirName(x, y);
    const ALL8 = ['צפון', 'דרום', 'מזרח', 'מערב', 'צפון-מזרח', 'צפון-מערב', 'דרום-מזרח', 'דרום-מערב'];
    const opposite = back ? dirName(x, y) : dirName(-x, -y);
    const others = rng.shuffle(ALL8.filter((d) => d !== ans && d !== opposite));
    const { options, answer } = hebOpts(rng, ans, [opposite, ...others].slice(0, 3));
    const movesText = moves.map(([k, d]) => `${d} ק"מ ${DIRS[k][3]}`).join(', ');
    return {
      prompt: `אתה הולך ${movesText}. ${back ? 'לאיזה כיוון כללי עליך ללכת כדי לחזור לנקודת המוצא?' : 'מהו הכיוון הכללי בו אתה נמצא כעת ביחס לנקודת המוצא?'}`,
      options, answer,
      hint: 'קזז: צפון מול דרום, מזרח מול מערב. מה שנשאר בכל ציר קובע את הכיוון. לחזרה — הכיוון ההפוך.',
      explanation: `<p>ציר צפון-דרום: ${moves.filter(([k]) => k === 'N' || k === 'S').map(([k, d]) => (k === 'N' ? '+' : '−') + d).join(' ') || '0'} = ${y > 0 ? y + ' צפונה' : y < 0 ? -y + ' דרומה' : '0'}.<br>ציר מזרח-מערב: ${moves.filter(([k]) => k === 'E' || k === 'W').map(([k, d]) => (k === 'E' ? '+' : '−') + d).join(' ') || '0'} = ${x > 0 ? x + ' מזרחה' : x < 0 ? -x + ' מערבה' : '0'}.</p><p>אתה נמצא ב<b>${dirName(x, y)}</b> ביחס לנקודת המוצא.${back ? ` כדי לחזור הולכים לכיוון ההפוך: <b>${ans}</b>.` : ''}</p>`,
      demo: { kind: 'compass', moves: moves.map(([k, d]) => [DIRS[k][0], DIRS[k][1], d, DIRS[k][2]]), back },
    };
  },

  /* ---- letters with numbers underneath (booklet ex. 3) ---- */
  i_grid(rng, lv) {
    for (let t = 0; t < 300; t++) {
      const letters = rng.sample(HEB, 5);
      const nums = rng.sample(range(lv <= 2 ? 9 : 15, 1), 5);
      const kinds = lv <= 2 ? ['sub', 'add', 'pos'] : ['sub', 'add', 'mul', 'odd', 'posSum'];
      const kind = rng.pick(kinds);
      let val, q, expl;
      const [i, j] = rng.sample(range(5), 2);
      if (kind === 'sub') { const [a, b] = nums[i] > nums[j] ? [i, j] : [j, i]; val = nums[a] - nums[b]; q = `מהי האות הנמצאת מעל לתוצאה המתקבלת מחיסור המספר שמתחת לאות ${L(letters[b])} מהמספר שמתחת לאות ${L(letters[a])}?`; expl = `${nums[a]} − ${nums[b]} = ${val}`; }
      else if (kind === 'add') { val = nums[i] + nums[j]; q = `מהי האות הנמצאת מעל למספר המתקבל מחיבור המספרים שמתחת לאותיות ${L(letters[i])} ו-${L(letters[j])}?`; expl = `${nums[i]} + ${nums[j]} = ${val}`; }
      else if (kind === 'mul') { val = nums[i] * nums[j]; q = `מהי האות הכתובה מעל המספר המתקבל ממכפלת המספרים של האות ה${ORD_F[i + 1]} והאות ה${ORD_F[j + 1]} (מימין)?`; expl = `${nums[i]} × ${nums[j]} = ${val}`; }
      else if (kind === 'pos') { val = nums[i] + nums[j]; q = `מהי האות הכתובה מעל המספר המתקבל מחיבור המספרים שבמקום ה${ORD_M[i + 1]} ובמקום ה${ORD_M[j + 1]} (מימין)?`; expl = `${nums[i]} + ${nums[j]} = ${val}`; }
      else if (kind === 'odd') { const o = nums.filter((x) => x % 2 === 1); val = sum(o); q = 'מהי האות הכתובה מעל המספר שנוצר מחיבור כל המספרים האי-זוגיים?'; expl = `${o.join(' + ')} = ${val}`; }
      else { const lft = nums[4], rgt = nums[0]; val = lft + rgt; q = 'מהי האות הכתובה מעל המספר שנוצר מחיבור המספר הימני ביותר והמספר השמאלי ביותר?'; expl = `${rgt} + ${lft} = ${val}`; }
      const at = nums.indexOf(val);
      if (at < 0) continue;
      if (kind === 'odd' && nums.filter((x) => x % 2).length < 2) continue;
      const ans = letters[at];
      const { options, answer } = hebOpts(rng, ans, rng.shuffle(letters.filter((c) => c !== ans)).slice(0, 4));
      return {
        prompt: `לפניך שורה של אותיות ומתחת לכל אות — מספר. ${q}`,
        visual: { kind: 'html', html: `<table class="lgrid" dir="rtl"><tr>${letters.map((c) => `<td>${c}</td>`).join('')}</tr><tr>${nums.map((n) => `<td>${n}</td>`).join('')}</tr></table>` },
        options, answer,
        hint: 'חשב את המספר בטיוטה, ורק אז חפש אותו בשורה התחתונה.',
        explanation: `<p>${expl}. המספר ${val} נמצא מתחת לאות <b>${ans}</b>.</p>`,
      };
    }
    return INSTR_BUILDERS.i_abc(rng, lv);
  },

  /* ---- reading data tables ---- */
  i_table(rng, lv) {
    if (rng.chance(0.5)) {
      // monthly salary table (booklet style)
      for (let t = 0; t < 300; t++) {
        const vals = HEB_MONTHS.map(() => rng.pick([100, 200, 300, 400, 450, 500, 550, 600, 700]));
        const kind = rng.pick(lv <= 2 ? ['max', 'count', 'which'] : ['count', 'avg3', 'rise', 'which', 'drop']);
        let ans, q, dis, expl;
        if (kind === 'max' || kind === 'min') {
          const m = Math.max(...vals); if (countArr(vals, (v) => v === m) !== 1) continue;
          ans = HEB_MONTHS[vals.indexOf(m)]; q = 'באיזה חודש השתכר דוד הכי הרבה?';
          dis = rng.sample(HEB_MONTHS.filter((x) => x !== ans), 3); expl = `המשכורת הגבוהה ביותר (${m} ₪) הייתה ב<b>${ans}</b>.`;
        } else if (kind === 'count') {
          const v = rng.pick(vals); const c = countArr(vals, (x) => x === v); if (c < 2) continue;
          ans = c === 12 ? 'כל השנה' : `${c} חודשים`; q = `בכמה חודשים בשנה השתכר דוד ${v} ₪?`;
          dis = numDistractors(rng, c, 5).filter((x) => x > 1 && x <= 12).slice(0, 3).map((x) => (x === 12 ? 'כל השנה' : `${x} חודשים`)); expl = `${v} ₪ מופיע ב: ${HEB_MONTHS.filter((m, i) => vals[i] === v).join(', ')} — <b>${c}</b> חודשים.`;
        } else if (kind === 'which') {
          const v = rng.pick(vals); const ms = HEB_MONTHS.filter((m, i) => vals[i] === v); if (ms.length !== 2) continue;
          ans = ms.join(' ו'); q = `באילו חודשים השתכר דוד ${v} ₪?`;
          const wrong = [];
          for (let k = 0; k < 20 && wrong.length < 3; k++) { const p = rng.sample(HEB_MONTHS, 2); const s = p.join(' ו'); if (s !== ans && !wrong.includes(s) && !(p[0] === ms[0] && p[1] === ms[1])) wrong.push(s); }
          dis = wrong; expl = `${v} ₪ מופיע רק ב<b>${ms[0]}</b> וב<b>${ms[1]}</b>.`;
        } else if (kind === 'avg3') {
          const last = vals.slice(9); if (sum(last) % 3 !== 0) continue;
          const a = sum(last) / 3; ans = `${a} ₪`; q = 'מה היה השכר הממוצע של דוד בשלושת החודשים האחרונים של השנה?';
          dis = uniq([a + 50, a - 50, sum(last), Math.max(...last)].filter((x) => x !== a && x > 0)).slice(0, 3).map((x) => `${x} ₪`); expl = `(${last.join(' + ')}) : 3 = ${sum(last)} : 3 = <b>${a} ₪</b>.`;
        } else {
          const diffs = range(11).map((i) => vals[i + 1] - vals[i]);
          const up = kind === 'rise';
          const ext = up ? Math.max(...diffs) : Math.min(...diffs);
          if ((up && ext <= 0) || (!up && ext >= 0) || countArr(diffs, (d) => d === ext) !== 1) continue;
          const i = diffs.indexOf(ext);
          ans = `מ${HEB_MONTHS[i]} ל${HEB_MONTHS[i + 1]}`;
          q = `מאיזה חודש לאיזה חודש ${up ? 'עלתה' : 'ירדה'} משכורתו של דוד במידה הרבה ביותר?`;
          const others = range(11).filter((k) => k !== i).sort((a, b) => (up ? diffs[b] - diffs[a] : diffs[a] - diffs[b]));
          dis = others.slice(0, 3).map((k) => `מ${HEB_MONTHS[k]} ל${HEB_MONTHS[k + 1]}`);
          expl = `השינוי ${up ? 'הגדול' : 'החד'} ביותר: מ-${vals[i]} ל-${vals[i + 1]} (${up ? 'עלייה' : 'ירידה'} של ${Math.abs(ext)} ₪) — <b>${ans}</b>.`;
        }
        const { options, answer } = hebOpts(rng, ans, dis);
        return {
          prompt: `הטבלה מציגה את משכורתו של דוד (₪) בכל חודש. ${q}`,
          visual: { kind: 'html', html: `<div class="table-wrap"><table class="dtable" dir="rtl"><tr>${HEB_MONTHS.map((m) => `<th>${m}</th>`).join('')}</tr><tr>${vals.map((v) => `<td>${v}</td>`).join('')}</tr></table></div>` },
          options, answer,
          hint: 'קרא קודם את השאלה, ורק אז חפש בטבלה את מה שצריך — לא לנתח את כל הטבלה מראש.',
          explanation: `<p>${expl}</p>`,
        };
      }
    }
    // shifts table: income per hour by day & shift
    for (let t = 0; t < 300; t++) {
      const T = SHIFTS.map(() => DAYS.map(() => rng.pick([20, 30, 40, 50, 60, 70, 80, 90])));
      const kind = rng.pick(['bestDay', 'worstShift', 'bestCombo', 'equal']);
      let ans, q, dis, expl;
      const dayTot = DAYS.map((_, d) => sum(T.map((r) => r[d])));
      if (kind === 'bestDay') {
        const m = Math.max(...dayTot); if (countArr(dayTot, (x) => x === m) !== 1) continue;
        ans = DAYS[dayTot.indexOf(m)]; q = 'באיזה יום משתלם לשרון לעבוד במשמרות (סכום שלוש המשמרות הגבוה ביותר)?';
        dis = DAYS.filter((d) => d !== ans).slice(0, 3); expl = DAYS.map((d, i) => `${d}: ${dayTot[i]}`).join(', ') + ` ← <b>${ans}</b>.`;
      } else if (kind === 'worstShift') {
        const st = T.map((r) => sum(r)); const m = Math.min(...st); if (countArr(st, (x) => x === m) !== 1) continue;
        ans = SHIFTS[st.indexOf(m)]; q = 'באופן ממוצע, איזו משמרת הכי פחות רווחית?';
        dis = [...SHIFTS.filter((s) => s !== ans), 'אין לדעת מן הנתונים']; expl = SHIFTS.map((s, i) => `${s}: ${st[i]}`).join(', ') + ` ← <b>${ans}</b> (כשמספר הימים שווה, ההשוואה בסכום שקולה להשוואה בממוצע).`;
      } else if (kind === 'bestCombo') {
        const combos = range(4).map(() => { const s1 = rng.int(0, 2), d1 = rng.int(0, 4), s2 = rng.int(0, 2), d2 = rng.int(0, 4), h1 = rng.int(1, 3), h2 = rng.int(1, 3); return { txt: `${h1 === 1 ? 'שעה' : h1 === 2 ? 'שעתיים' : '3 שעות'} ביום ${DAYS[d1]} ${SHIFTS[s1]} ו${h2 === 1 ? 'שעה' : h2 === 2 ? 'שעתיים' : '3 שעות'} ביום ${DAYS[d2]} ${SHIFTS[s2]}`, v: h1 * T[s1][d1] + h2 * T[s2][d2] }; });
        const m = Math.max(...combos.map((c) => c.v)); if (countArr(combos, (c) => c.v === m) !== 1 || uniq(combos.map((c) => c.txt)).length < 4) continue;
        const best = combos.find((c) => c.v === m);
        ans = best.txt; q = 'כיצד תרוויח שרון הכי הרבה כסף?';
        dis = combos.filter((c) => c !== best).map((c) => c.txt); expl = combos.map((c) => `${c.txt} = ${c.v} ₪`).join('<br>') + `<br>← הגבוה ביותר: <b>${ans}</b>.`;
      } else {
        const ref = T[2][4], goal = ref; const hits = [];
        SHIFTS.forEach((s, si) => DAYS.forEach((d, di) => { if (T[si][di] === ref && !(si === 2 && di === 4)) hits.push(`יום ${d} משמרת ${s}`); }));
        if (hits.length !== 1) continue;
        ans = hits[0]; q = `באיזה יום ובאיזו משמרת שרון מרוויחה לשעה בדיוק כמו ביום חמישי בלילה (${goal} ₪)?`;
        const wrong = []; SHIFTS.forEach((s, si) => DAYS.forEach((d, di) => { if (T[si][di] !== ref) wrong.push(`יום ${d} משמרת ${s}`); }));
        dis = rng.sample(wrong, 3); expl = `ביום חמישי בלילה: ${ref} ₪. הערך ${ref} מופיע שוב רק ב<b>${ans}</b>.`;
      }
      const { options, answer } = hebOpts(rng, ans, dis.slice(0, 3));
      return {
        prompt: `שרון עובדת כמלצרית. בטבלה — ההכנסה שלה בש"ח לשעת עבודה, לפי יום ומשמרת. ${q}`,
        visual: { kind: 'html', html: `<div class="table-wrap"><table class="dtable" dir="rtl"><tr><th>משמרת \\ יום</th>${DAYS.map((d) => `<th>${d}</th>`).join('')}</tr>${SHIFTS.map((s, si) => `<tr><th>${s}</th>${T[si].map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</table></div>` },
        options, answer,
        hint: 'זהה מה השאלה משווה — שורות (משמרות) או עמודות (ימים) — וחבר רק את מה שצריך.',
        explanation: `<p>${expl}</p>`,
      };
    }
    return INSTR_BUILDERS.i_digits(rng, lv);
  },

  /* ---- multi-step instructions ---- */
  i_cond(rng, lv) {
    const kind = rng.pick(['longestMid', 'reverseSecond', 'firstDouble', 'chainWord', 'mostFrequent']);
    if (kind === 'longestMid') {
      for (let t = 0; t < 100; t++) {
        const ws = rng.sample(WORDS.filter((w) => w.length % 2 === 1), 4);
        const s = ws.slice().sort((a, b) => b.length - a.length);
        if (s[0].length === s[1].length) continue;
        const w = s[0], ans = w[(w.length - 1) / 2];
        const dis = letterDistractors(rng, ans, ws.map((x) => x[Math.floor(x.length / 2)]).concat(w.split('')));
        const { options, answer } = hebOpts(rng, ans, dis);
        return { prompt: `כתוב את האות האמצעית של המילה הארוכה ביותר מבין המילים: <div class="word-list">${ws.join(' , ')}</div>`, options, answer, hint: 'קודם מצא את המילה הארוכה ביותר (ספור אותיות), ואז את האמצע שלה.', explanation: `<p>הארוכה ביותר: <b>${w}</b> (${w.length} אותיות). האמצעית היא ה-${(w.length + 1) / 2}: <b>${ans}</b>.</p>` };
      }
    }
    if (kind === 'reverseSecond') {
      const ws = rng.sample(WORDS, 4);
      const w = ws[1];
      const ans = w.split('').reverse().join('');
      const dis = uniq([ws[2].split('').reverse().join(''), w, ws[0].split('').reverse().join(''), normWord(ans) !== ans ? normWord(ans) : withFinal(ans)]).filter((x) => x !== ans).slice(0, 3);
      const { options, answer } = hebOpts(rng, ans, dis);
      return { prompt: `כתוב בסדר אותיות הפוך את המילה השנייה מבין המילים הבאות (קוראים מימין): <div class="word-list">${ws.join(' , ')}</div>`, options, answer, hint: 'המילה השנייה — מימין. הפוך אותה אות-אות, בלי לתקן לאותיות סופיות.', explanation: `<p>המילה השנייה: <b>${w}</b>. בסדר הפוך: <b>${ans}</b>.</p>` };
    }
    if (kind === 'firstDouble') {
      for (let t = 0; t < 100; t++) {
        const ws = rng.sample(WORDS, 4);
        const doubles = ws.map((w) => { const n = normWord(w); return n.split('').find((c, i) => n.indexOf(c) !== i); });
        const ok = doubles.filter(Boolean);
        if (ok.length !== 1) continue;
        const fallback = rng.pick(HEB);
        const ans = ok[0];
        const dis = letterDistractors(rng, ans, [fallback, ...ws.map((w) => w[0])]);
        const { options, answer } = hebOpts(rng, ans, dis);
        const wi = doubles.findIndex(Boolean);
        return { prompt: `כתוב את האות שמופיעה פעמיים במילה אחת מבין המילים. אם אין כזו — כתוב את האות ${L(fallback)}. <div class="word-list">${ws.join(' , ')}</div>${FINAL_NOTE}`, options, answer, hint: 'עבור מילה-מילה וחפש אות שחוזרת בתוכה.', explanation: `<p>במילה <b>${ws[wi]}</b> האות <b>${ans}</b> מופיעה פעמיים.</p>` };
      }
    }
    if (kind === 'mostFrequent') {
      for (let t = 0; t < 100; t++) {
        const arr = range(lv <= 2 ? 10 : 14).map(() => rng.int(1, 9));
        const cnt = range(10).map((d) => countArr(arr, (x) => x === d));
        const m = Math.max(...cnt); if (countArr(cnt, (x) => x === m) !== 1) continue;
        const ans = cnt.indexOf(m);
        const dis = uniq(rng.shuffle(arr).filter((x) => x !== ans)).slice(0, 3);
        const { options, answer } = hebOpts(rng, ans, dis);
        return { prompt: 'כתוב את המספר המופיע הכי הרבה פעמים בשורה:', visual: { kind: 'html', html: `<div class="num-row" dir="ltr">${arr.join(' , ')}</div>` }, options, answer, hint: 'ספור כל מספר שמופיע יותר מפעם אחת.', explanation: `<p>${range(10).filter((d) => cnt[d] > 1).map((d) => `${d} — ${timesWord(cnt[d])}`).join(', ')} ← <b>${ans}</b>.</p>` };
      }
    }
    // chainWord: add a letter to a word and reverse
    const base = rng.pick(['צר', 'גל', 'דג', 'חם', 'כן', 'פה', 'קר', 'רך']);
    const k = rng.int(2, 12);
    const add = HEB[k - 1];
    const ans = (add + normWord(base)).split('').reverse().join('');
    const dis = uniq([(normWord(base) + add).split('').reverse().join(''), add + normWord(base), (HEB[k] + normWord(base)).split('').reverse().join('')]).filter((x) => x !== ans);
    const { options, answer } = hebOpts(rng, ans, dis.slice(0, 3));
    return { prompt: `הוסף למילה "${base}" בתחילתה את האות ה-${k} בא"ב, ורשום את המילה שהתקבלה בסדר אותיות הפוך.`, options, answer, hint: 'שלב 1: מצא את האות. שלב 2: הוסף בתחילת המילה (מימין). שלב 3: הפוך.', explanation: `<p>האות ה-${k}: <b>${add}</b>. ${add}+${normWord(base)} = ${add + normWord(base)}. הפוך: <b>${ans}</b>.</p>` };
  },
};

const INSTR_SKILLS = {
  i_letters: { name: 'ספירת אותיות בתנאי', min: 1 },
  i_abc: { name: 'סדר הא"ב', min: 1 },
  i_gem: { name: 'גימטרייה', min: 1 },
  i_dict: { name: 'סדר מילוני', min: 1 },
  i_names: { name: 'שמות ותנאים', min: 1 },
  i_build: { name: 'הרכבת מילה ממיקומים', min: 1 },
  i_digits: { name: 'ספרות ומספרים', min: 1 },
  i_compass: { name: 'שאלות מצפן', min: 1 },
  i_grid: { name: 'אותיות ומספרים', min: 1 },
  i_table: { name: 'קריאת נתונים מטבלה', min: 2 },
  i_cond: { name: 'הוראות מרובות שלבים', min: 2 },
};

function makeInstrQuestion(skill, rng, level) {
  const q = INSTR_BUILDERS[skill](rng, level);
  return { domain: 'instr', ...q, rule: q.hint };
}

/* ===== engine.js — question registry, adaptive difficulty, 14-day plan ===== */

const SKILLS = {};
Object.entries(SERIES_SKILLS).forEach(([k, v]) => { SKILLS[k] = { ...v, domain: 'series' }; });
Object.entries(MATRIX_SKILLS).forEach(([k, v]) => { SKILLS[k] = { ...v, domain: 'matrix' }; });
Object.entries(INSTR_SKILLS).forEach(([k, v]) => { SKILLS[k] = { ...v, domain: 'instr' }; });

const DOMAINS = {
  series: { name: 'סדרות חשבוניות', short: 'סדרות', icon: '123', color: 'var(--c-series)', time: 45 },
  matrix: { name: 'סדרות צורניות', short: 'צורות', icon: '◆', color: 'var(--c-matrix)', time: 60 },
  instr: { name: 'מילוי הוראות', short: 'הוראות', icon: 'א', color: 'var(--c-instr)', time: 40 },
};
const skillsOf = (domain) => Object.keys(SKILLS).filter((k) => SKILLS[k].domain === domain);

// Rebuild a question from its spec. Pure & deterministic.
function buildQuestion(spec) {
  const rng = makeRng(spec.seed);
  const lv = clamp(Math.max(spec.level, SKILLS[spec.skill].min), 1, 5);
  let q;
  const d = SKILLS[spec.skill].domain;
  if (d === 'series') q = makeSeriesQuestion(spec.skill, rng, lv);
  else if (d === 'matrix') q = makeMatrixQuestion(spec.skill, rng, lv);
  else q = makeInstrQuestion(spec.skill, rng, lv);
  q.skill = spec.skill;
  q.level = lv;
  q.timeSec = DOMAINS[q.domain].time + (lv - 3) * 8;
  return q;
}

/* ---------- adaptive rating ---------- */
// rating per skill in [1,5]. Correct & fast → up; wrong → down.
function updateRating(r0, { correct, level, usedHint, skipped, timeSec, expected }) {
  let r = r0 ?? 2;
  if (skipped) r -= 0.15;
  else if (correct) {
    let g = usedHint ? 0.1 : 0.32;
    if (level < r - 0.5) g *= 0.4; // easy question for you — small gain
    if (!usedHint && timeSec && expected && timeSec < expected * 0.5) g += 0.12; // quick & right
    r += g;
  } else {
    r -= level > r + 0.5 ? 0.15 : 0.38;
  }
  return clamp(Math.round(r * 100) / 100, 1, 5);
}
function levelFromRating(r, rng) {
  // small jitter so it isn't monotonous
  const j = rng ? (rng.next() - 0.5) * 0.6 : 0;
  return clamp(Math.round((r ?? 2) + j), 1, 5);
}

/* ---------- the 14-day plan ---------- */
const S = (...k) => k; // skill list helper
const PLAN = [
  { day: 1, title: 'היכרות + סדרות חשבוניות בסיס', goal: 'להכיר את המבחן וללמוד לזהות את חוקי הסדרות הבסיסיים.', lessons: ['exam', 'series1'],
    sets: [
      { t: 'חיבור וחיסור קבוע', skills: S('s_add'), n: 10, lv: 1 },
      { t: 'הוספה והפחתה הדרגתית', skills: S('s_diff2'), n: 12, lv: 1 },
      { t: 'כפל וחילוק קבוע', skills: S('s_mult'), n: 10, lv: 1 },
      { t: 'לסירוגין', skills: S('s_alt'), n: 10, lv: 1 },
      { t: 'מקבץ מסכם — יום 1', skills: S('s_add', 's_diff2', 's_mult', 's_alt'), n: 12 },
    ] },
  { day: 2, title: 'סדרות חשבוניות מתקדמות', goal: 'סדרות משולבות, פיבונאצ׳י, כפל הדרגתי וחזקות.', lessons: ['series2'],
    sets: [
      { t: 'סדרות משולבות', skills: S('s_inter'), n: 10, lv: 2 },
      { t: 'פיבונאצ׳י', skills: S('s_fib'), n: 10, lv: 2 },
      { t: 'כפל וחילוק הדרגתי', skills: S('s_prog'), n: 10, lv: 2 },
      { t: 'ריבועים וחזקות', skills: S('s_pow'), n: 10, lv: 2 },
      { t: 'מקבץ מסכם — יום 2', skills: S('s_inter', 's_fib', 's_prog', 's_pow', 's_alt', 's_diff2'), n: 12 },
    ] },
  { day: 3, title: 'סדרות צורניות — היסודות', goal: 'ללמוד לפרק מטריצה למאפיינים ולזהות חוק לכל מאפיין.', lessons: ['matrix1'],
    sets: [
      { t: 'שלושה מאותו סוג', skills: S('m_const'), n: 10, lv: 1 },
      { t: 'מספר צורות', skills: S('m_count'), n: 10, lv: 1 },
      { t: 'פיזור שלושה ערכים', skills: S('m_latin'), n: 10, lv: 1 },
      { t: 'גודל ומילוי', skills: S('m_size'), n: 10, lv: 2 },
      { t: 'מקבץ מסכם — יום 3', skills: S('m_const', 'm_count', 'm_latin', 'm_size'), n: 12 },
    ] },
  { day: 4, title: 'מילוי הוראות — אותיות וא"ב', goal: 'עבודה מדויקת ומהירה עם אותיות, מיקומים וגימטרייה.', lessons: ['instr1'],
    sets: [
      { t: 'ספירת אותיות בתנאי', skills: S('i_letters'), n: 10, lv: 1 },
      { t: 'סדר הא"ב', skills: S('i_abc'), n: 10, lv: 1 },
      { t: 'גימטרייה', skills: S('i_gem'), n: 8, lv: 1 },
      { t: 'הרכבת מילה ממיקומים', skills: S('i_build'), n: 10, lv: 1 },
      { t: 'מקבץ מסכם — יום 4', skills: S('i_letters', 'i_abc', 'i_gem', 'i_build'), n: 12 },
    ] },
  { day: 5, title: 'סדרות צורניות — סיבוב ותזוזה', goal: 'זיהוי סיבובים, תזוזות וכמה חוקים בו-זמנית.', lessons: ['matrix2'],
    sets: [
      { t: 'סיבוב ותזוזה', skills: S('m_rot'), n: 12, lv: 2 },
      { t: 'שני חוקים יחד', skills: S('m_multi', 'm_latin', 'm_count'), n: 12, lv: 3 },
      { t: 'איחוד צורות', skills: S('m_logic'), n: 10, lv: 2 },
      { t: 'מקבץ מסכם — יום 5', skills: S('m_rot', 'm_multi', 'm_logic', 'm_size'), n: 12 },
    ] },
  { day: 6, title: 'מילוי הוראות — מילון, שמות ומצפן', goal: 'סדר מילוני, תנאים על שמות ושאלות כיוונים.', lessons: ['instr2'],
    sets: [
      { t: 'סדר מילוני', skills: S('i_dict'), n: 12, lv: 1 },
      { t: 'שמות ותנאים', skills: S('i_names'), n: 10, lv: 1 },
      { t: 'שאלות מצפן', skills: S('i_compass'), n: 10, lv: 1 },
      { t: 'מקבץ מסכם — יום 6', skills: S('i_dict', 'i_names', 'i_compass', 'i_letters'), n: 12 },
    ] },
  { day: 7, title: 'חזרה ומבחן ביניים', goal: 'לחבר את כל מה שנלמד ולבדוק איפה אתה עומד.', lessons: ['strategy'],
    sets: [
      { t: 'חזרה — סדרות', skills: skillsOf('series').filter((k) => k !== 's_mix' && k !== 's_frac'), n: 12 },
      { t: 'חזרה — צורות', skills: S('m_const', 'm_count', 'm_latin', 'm_size', 'm_rot', 'm_logic'), n: 12 },
      { t: 'חזרה — הוראות', skills: S('i_letters', 'i_abc', 'i_gem', 'i_build', 'i_dict', 'i_names', 'i_compass'), n: 12 },
      { t: 'מבחן ביניים (על זמן)', skills: null, n: 18, sim: 'mini' },
    ] },
  { day: 8, title: 'סדרות — רמה גבוהה', goal: 'חוקיות מורכבת: הפרשים של הפרשים, שברים, ×2+1.', lessons: ['series3'],
    sets: [
      { t: 'חוקיות מורכבת', skills: S('s_mix'), n: 12, lv: 3 },
      { t: 'עשרוניים ושברים', skills: S('s_frac'), n: 10, lv: 3 },
      { t: 'שני מספרים חסרים', skills: S('s_inter', 's_fib', 's_alt', 's_diff2'), n: 10, lv: 4 },
      { t: 'מקבץ אדפטיבי — כל הסדרות', skills: skillsOf('series'), n: 15 },
    ] },
  { day: 9, title: 'צורות — רמה גבוהה', goal: 'קווים משותפים/לא משותפים ומטריצות עם 3-4 חוקים.', lessons: ['matrix3'],
    sets: [
      { t: 'קווים משותפים ולא משותפים', skills: S('m_logic'), n: 12, lv: 4 },
      { t: 'שלושה חוקים ומעלה', skills: S('m_multi'), n: 12, lv: 4 },
      { t: 'מקבץ אדפטיבי — כל הצורות', skills: skillsOf('matrix'), n: 15 },
    ] },
  { day: 10, title: 'הוראות — טבלאות והוראות מורכבות', goal: 'קריאת נתונים, ספרות ותנאים מרובי שלבים.', lessons: ['instr3'],
    sets: [
      { t: 'קריאת נתונים מטבלה', skills: S('i_table'), n: 10, lv: 2 },
      { t: 'אותיות ומספרים', skills: S('i_grid'), n: 10, lv: 2 },
      { t: 'ספרות ומספרים', skills: S('i_digits'), n: 10, lv: 2 },
      { t: 'הוראות מרובות שלבים', skills: S('i_cond'), n: 10, lv: 3 },
      { t: 'מקבץ אדפטיבי — כל ההוראות', skills: skillsOf('instr'), n: 15 },
    ] },
  { day: 11, title: 'יום מהירות', goal: 'לעבוד מהר בלי לאבד דיוק — כל מקבץ עם שעון.', lessons: ['speed'],
    sets: [
      { t: 'ספרינט סדרות (30 שנ׳ לשאלה)', skills: skillsOf('series'), n: 15, timer: 30 },
      { t: 'ספרינט צורות (45 שנ׳ לשאלה)', skills: skillsOf('matrix'), n: 12, timer: 45 },
      { t: 'ספרינט הוראות (20 שנ׳ לשאלה)', skills: S('i_letters', 'i_abc', 'i_build', 'i_names', 'i_compass', 'i_digits', 'i_gem'), n: 18, timer: 20 },
    ] },
  { day: 12, title: 'חיזוק נקודות חולשה', goal: 'המקבצים נבנים אוטומטית מהנושאים שבהם הצלחת הכי פחות.', lessons: ['weak'],
    sets: [
      { t: 'חולשות — מקבץ 1', skills: null, weak: true, n: 15 },
      { t: 'חולשות — מקבץ 2', skills: null, weak: true, n: 15 },
      { t: 'חולשות — מקבץ 3', skills: null, weak: true, n: 15 },
    ] },
  { day: 13, title: 'סימולציה מלאה — מבחן ממוחשב', goal: 'מבחן אדפטיבי מלא בתנאי אמת: זמן לכל שאלה, הקושי עולה כשאתה צודק.', lessons: ['sim'],
    sets: [
      { t: 'סימולציה ממוחשבת מלאה', skills: null, n: 36, sim: 'computer' },
      { t: 'תחקיר — חזרה על הנושאים החלשים', skills: null, weak: true, n: 12 },
    ] },
  { day: 14, title: 'סימולציה מסכמת — מבחן כיתה', goal: 'מבחן בסגנון לשכת הגיוס: זמן כולל לכל פרק וקנס על טעות.', lessons: ['final'],
    sets: [
      { t: 'סימולציית כיתה מלאה', skills: null, n: 45, sim: 'class' },
      { t: 'חימום אחרון — מעורב', skills: Object.keys(SKILLS), n: 12 },
    ] },
];
PLAN.forEach((d) => d.sets.forEach((s, i) => { s.id = `d${d.day}s${i + 1}`; }));
const ALL_SETS = PLAN.flatMap((d) => d.sets.map((s) => ({ ...s, day: d.day })));

// Simulation layout
const SIM_LAYOUT = {
  mini: [{ domain: 'series', n: 6, perQ: 40 }, { domain: 'matrix', n: 6, perQ: 55 }, { domain: 'instr', n: 6, perQ: 30 }],
  computer: [{ domain: 'series', n: 12, perQ: 45 }, { domain: 'matrix', n: 12, perQ: 60 }, { domain: 'instr', n: 12, perQ: 35 }],
  class: [{ domain: 'series', n: 15, total: 10 * 60 }, { domain: 'matrix', n: 15, total: 13 * 60 }, { domain: 'instr', n: 15, total: 6 * 60 }],
};

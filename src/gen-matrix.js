/* ===== gen-matrix.js — figural matrices (סדרות צורניות) ===== */
// A matrix is 3x3, read left-to-right (as in the official booklet). The bottom-right cell is missing.
// Two families:
//  1) attribute matrices: every cell = {shape, count, fill, size, rot, inner, pos}; every attribute
//     follows a rule (const / row / col / latin / prog / sum), so the answer is fully determined.
//  2) line-logic matrices: cell = bitmask of segments; col3 = col1 (OR | XOR | AND | MINUS) col2.

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star', 'cross'];
const ORIENTED = ['arrow', 'triangle', 'halfmoon', 'pac'];
const FILLS = ['none', 'solid', 'stripe', 'gray'];
const INNERS = ['none', 'dot', 'ring', 'x'];
const SHAPE_HE = { circle: 'עיגול', square: 'ריבוע', triangle: 'משולש', diamond: 'מעוין', pentagon: 'מחומש', hexagon: 'משושה', star: 'כוכב', cross: 'צלב', arrow: 'חץ', halfmoon: 'חצי עיגול', pac: 'עיגול חסר' };
const FILL_HE = { none: 'ריק', solid: 'מלא', stripe: 'מפוספס', gray: 'אפור' };
const SIZE_HE = ['קטן', 'בינוני', 'גדול'];
const INNER_HE = { none: 'ללא סימן', dot: 'נקודה', ring: 'טבעת', x: 'איקס' };
const ATTR_HE = { shape: 'סוג הצורה', count: 'מספר הצורות', fill: 'המילוי', size: 'הגודל', rot: 'הכיוון (סיבוב)', inner: 'הסימן הפנימי', pos: 'מיקום הנקודה' };

/* ---------- SVG drawing ---------- */
function polyPts(cx, cy, r, n, rot0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((rot0 + (360 / n) * i) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.sin(a)).toFixed(1)},${(cy - r * Math.cos(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function shapeSvg(shape, cx, cy, r, rot, fillAttr) {
  const st = `stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" ${fillAttr}`;
  const R = `transform="rotate(${rot} ${cx} ${cy})"`;
  switch (shape) {
    case 'circle': return `<circle cx="${cx}" cy="${cy}" r="${r}" ${st}/>`;
    case 'square': return `<rect x="${cx - r * 0.85}" y="${cy - r * 0.85}" width="${r * 1.7}" height="${r * 1.7}" ${st} ${R}/>`;
    case 'triangle': return `<polygon points="${polyPts(cx, cy + r * 0.15, r * 1.05, 3, 0)}" ${st} ${R}/>`;
    case 'diamond': return `<polygon points="${polyPts(cx, cy, r, 4, 0)}" ${st} ${R}/>`;
    case 'pentagon': return `<polygon points="${polyPts(cx, cy, r, 5, 0)}" ${st} ${R}/>`;
    case 'hexagon': return `<polygon points="${polyPts(cx, cy, r, 6, 30)}" ${st} ${R}/>`;
    case 'star': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : r * 0.45, a = (i * 36 * Math.PI) / 180;
        pts.push(`${(cx + rr * Math.sin(a)).toFixed(1)},${(cy - rr * Math.cos(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" ${st} ${R}/>`;
    }
    case 'cross': {
      const w = r * 0.38;
      const p = [[-w, -r], [w, -r], [w, -w], [r, -w], [r, w], [w, w], [w, r], [-w, r], [-w, w], [-r, w], [-r, -w], [-w, -w]];
      return `<polygon points="${p.map(([x, y]) => `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`).join(' ')}" ${st} ${R}/>`;
    }
    case 'arrow': {
      const p = [[0, -r], [r * 0.75, -r * 0.1], [r * 0.28, -r * 0.1], [r * 0.28, r], [-r * 0.28, r], [-r * 0.28, -r * 0.1], [-r * 0.75, -r * 0.1]];
      return `<polygon points="${p.map(([x, y]) => `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`).join(' ')}" ${st} ${R}/>`;
    }
    case 'halfmoon':
      return `<path d="M ${cx - r} ${cy + r * 0.3} A ${r} ${r} 0 0 1 ${cx + r} ${cy + r * 0.3} Z" ${st} ${R}/>`;
    case 'pac': {
      const a1 = (-35 * Math.PI) / 180, a2 = (35 * Math.PI) / 180; // mouth opening upward-right? keep pointing up
      const x1 = cx + r * Math.sin(a1), y1 = cy - r * Math.cos(a1), x2 = cx + r * Math.sin(a2), y2 = cy - r * Math.cos(a2);
      return `<path d="M ${cx} ${cy} L ${x2.toFixed(1)} ${y2.toFixed(1)} A ${r} ${r} 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" ${st} ${R}/>`;
    }
  }
  return '';
}

function innerSvg(inner, cx, cy, r) {
  const s = r * 0.32;
  if (inner === 'dot') return `<circle cx="${cx}" cy="${cy}" r="${s * 0.8}" fill="currentColor"/>`;
  if (inner === 'ring') return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="none" stroke="currentColor" stroke-width="2"/>`;
  if (inner === 'x') return `<path d="M ${cx - s} ${cy - s} L ${cx + s} ${cy + s} M ${cx + s} ${cy - s} L ${cx - s} ${cy + s}" stroke="currentColor" stroke-width="2.2"/>`;
  return '';
}

function countLayout(n) {
  const L = {
    1: [[50, 50]], 2: [[30, 50], [70, 50]], 3: [[50, 28], [28, 70], [72, 70]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], 6: [[25, 30], [50, 30], [75, 30], [25, 70], [50, 70], [75, 70]],
    7: [[25, 22], [50, 22], [75, 22], [25, 50], [50, 50], [75, 50], [50, 78]], 8: [[25, 22], [50, 22], [75, 22], [25, 50], [75, 50], [25, 78], [50, 78], [75, 78]],
    9: [[25, 22], [50, 22], [75, 22], [25, 50], [50, 50], [75, 50], [25, 78], [50, 78], [75, 78]],
  };
  return L[n] || L[1];
}
const BASE_R = { 1: 30, 2: 18, 3: 17, 4: 15, 5: 11, 6: 11, 7: 10, 8: 10, 9: 10 };
const SIZE_K = [0.5, 0.74, 1.0];
let _svgId = 0;

function cellSvg(cell) {
  if (cell.logic !== undefined) return logicSvg(cell.logic);
  const id = 'p' + (++_svgId);
  let fillAttr = 'fill="var(--cell-bg)"';
  if (cell.fill === 'solid') fillAttr = 'fill="currentColor"';
  if (cell.fill === 'gray') fillAttr = 'fill="currentColor" fill-opacity="0.3"';
  if (cell.fill === 'stripe') fillAttr = `fill="url(#${id})"`;
  const defs = cell.fill === 'stripe' ? `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--cell-bg)"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2.4"/></pattern></defs>` : '';
  const scale = cell.pos !== undefined && cell.pos !== null ? 0.62 : 1;
  const pts = countLayout(cell.count);
  const r = BASE_R[cell.count] * SIZE_K[cell.size] * scale;
  let body = '';
  for (const [x0, y0] of pts) {
    const x = 50 + (x0 - 50) * scale, y = 50 + (y0 - 50) * scale;
    body += shapeSvg(cell.shape, x, y, r, cell.rot || 0, fillAttr);
    if (cell.inner && cell.inner !== 'none') body += innerSvg(cell.inner, x, y, r);
  }
  if (cell.pos !== undefined && cell.pos !== null) {
    const P = [[12, 12], [50, 8], [88, 12], [92, 50], [88, 88], [50, 92], [12, 88], [8, 50]];
    const [px, py] = P[cell.pos];
    body = `<rect x="8" y="8" width="84" height="84" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="3 3"/>` + body + `<circle cx="${px}" cy="${py}" r="6" fill="currentColor"/>`;
  }
  return `<svg viewBox="0 0 100 100" class="cell-svg" aria-hidden="true">${defs}${body}</svg>`;
}

/* ---------- line logic ---------- */
const SEGS = [
  [15, 15, 85, 15], [15, 85, 85, 85], [15, 15, 15, 85], [85, 15, 85, 85],
  [15, 15, 85, 85], [85, 15, 15, 85], [50, 15, 50, 85], [15, 50, 85, 50],
  [50, 15, 15, 50], [50, 15, 85, 50], [85, 50, 50, 85], [15, 50, 50, 85],
];
const bits = (m) => range(12).filter((i) => m & (1 << i));
const popcount = (m) => bits(m).length;
function logicSvg(mask) {
  const lines = bits(mask).map((i) => { const [a, b, c, d] = SEGS[i]; return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; }).join('');
  const dots = [15, 50, 85].flatMap((x) => [15, 50, 85].map((y) => `<circle cx="${x}" cy="${y}" r="1.6"/>`)).join('');
  return `<svg viewBox="0 0 100 100" class="cell-svg" aria-hidden="true"><g fill="currentColor" opacity="0.25">${dots}</g><g stroke="currentColor" stroke-width="4" stroke-linecap="round">${lines}</g></svg>`;
}
const LOGIC_OPS = {
  or: { f: (a, b) => a | b, he: 'איחוד — הצורה השלישית היא חיבור שתי הצורות הראשונות (כל הקווים משתיהן).' },
  xor: { f: (a, b) => a ^ b, he: 'קווים לא משותפים — קו שמופיע בשתי הצורות נעלם, וקו שמופיע רק באחת נשאר.' },
  and: { f: (a, b) => a & b, he: 'קווים משותפים — נשארים רק הקווים שמופיעים גם בצורה הראשונה וגם בשנייה.' },
  sub: { f: (a, b) => a & ~b, he: 'חיסור — מהצורה הראשונה מוחקים את הקווים של הצורה השנייה.' },
};

function makeLogicQuestion(rng, level) {
  const opsByLv = { 1: ['or'], 2: ['or'], 3: ['or', 'xor'], 4: ['xor', 'and', 'sub'], 5: ['xor', 'and', 'sub'] };
  const op = rng.pick(opsByLv[level]);
  const k = level <= 2 ? 2 : level <= 3 ? 3 : level === 4 ? 4 : 5;
  const randMask = () => rng.sample(range(12), k).reduce((m, i) => m | (1 << i), 0);
  let rows;
  for (let tries = 0; tries < 400; tries++) {
    rows = range(3).map(() => {
      const a = randMask(), b = randMask();
      return [a, b, LOGIC_OPS[op].f(a, b)];
    });
    const ok = rows.every(([a, b, c]) => c !== 0 && a !== b && c !== a && c !== b && (op === 'or' || (a & b) !== 0));
    if (!ok) continue;
    // the operation must be the only one that explains the two visible rows
    const fits = Object.keys(LOGIC_OPS).filter((o) => rows.slice(0, 2).every(([a, b, c]) => LOGIC_OPS[o].f(a, b) === c));
    if (fits.length === 1) break;
  }
  const [a3, b3, c3] = rows[2];
  const cands = [];
  Object.keys(LOGIC_OPS).forEach((o) => cands.push(LOGIC_OPS[o].f(a3, b3)));
  cands.push(b3 & ~a3, a3, b3);
  bits(c3).forEach((i) => cands.push(c3 & ~(1 << i)));
  rng.shuffle(range(12)).forEach((i) => cands.push(c3 ^ (1 << i)));
  const dis = [];
  for (const m of cands) if (m !== c3 && m !== 0 && !dis.includes(m)) dis.push(m);
  const pickD = [...dis.slice(0, 4), ...rng.shuffle(dis.slice(4)).slice(0, 3)];
  const { options, answer } = shuffleOptions(rng, c3, pickD.slice(0, 7));
  const grid = rows.map((r) => r.map((m) => ({ logic: m })));
  return {
    domain: 'matrix',
    prompt: 'איזו צורה משלימה את המטריצה? (קוראים כל שורה משמאל לימין)',
    visual: { kind: 'matrix', grid },
    options: options.map((m) => ({ logic: m })), answer,
    hint: 'השווה בכל שורה את הצורה השלישית לשתי הראשונות: אילו קווים נשארו, אילו נעלמו ואילו נוספו?',
    rule: LOGIC_OPS[op].he,
    explanation: `<p><b>החוקיות:</b> ${LOGIC_OPS[op].he}</p><p>בדוק בשורה הראשונה: כל קו בצורה השלישית — מאיפה הוא הגיע? אחר כך החל את אותה פעולה על שתי הצורות של השורה השלישית.</p>`,
    demo: { kind: 'matrix', grid, answerCell: { logic: c3 }, rules: [{ attr: 'logic', text: LOGIC_OPS[op].he }] },
  };
}

/* ---------- attribute matrices ---------- */
const ATTR_DOMAIN = {
  shape: SHAPES, count: [1, 2, 3, 4], fill: FILLS, size: [0, 1, 2], rot: [0, 90, 180, 270], inner: INNERS, pos: range(8),
};

function valHe(attr, v) {
  if (attr === 'shape') return SHAPE_HE[v];
  if (attr === 'fill') return FILL_HE[v];
  if (attr === 'size') return SIZE_HE[v];
  if (attr === 'inner') return INNER_HE[v];
  if (attr === 'rot') return `${v}°`;
  if (attr === 'pos') return `מקום ${v + 1}`;
  return String(v);
}

// Build a rule for one attribute → function (r,c) => value, plus Hebrew description.
function buildRule(rng, attr, type, domainOverride) {
  const dom = domainOverride || ATTR_DOMAIN[attr];
  const name = ATTR_HE[attr];
  if (type === 'const') {
    const v = rng.pick(dom);
    return { at: () => v, type, text: `${name} זהה בכל המשבצות (${valHe(attr, v)}).` };
  }
  if (type === 'row' || type === 'col') {
    const vs = rng.sample(dom, 3);
    const at = type === 'row' ? (r) => vs[r] : (r, c) => vs[c];
    return { at, type, text: `${name} קבוע לאורך כל ${type === 'row' ? 'שורה' : 'עמודה'}: ${vs.map((v) => valHe(attr, v)).join(' / ')}.` };
  }
  if (type === 'latin') {
    const vs = rng.sample(dom, 3), s = rng.pick([1, 2]);
    return { at: (r, c) => vs[(c + r * s) % 3], type, text: `בכל שורה מופיעים שלושה ערכים של ${name} — ${vs.map((v) => valHe(attr, v)).join(', ')} — כל אחד פעם אחת בלבד (וכך גם בכל עמודה). בשורה השלישית חסר הערך שעדיין לא הופיע בה.` };
  }
  if (type === 'prog') {
    if (attr === 'count') {
      const sameStart = rng.chance(0.5);
      const starts = sameStart ? [1, 1, 1] : rng.shuffle([1, 2, 1]);
      return { at: (r, c) => starts[r] + c, type, text: `מספר הצורות גדל ב-1 בכל צעד ימינה (משמאל לימין).` };
    }
    if (attr === 'size') {
      const up = rng.chance(0.6);
      return { at: (r, c) => (up ? c : 2 - c), type, text: `הגודל ${up ? 'גדל' : 'קטן'} בכל צעד ימינה (משמאל לימין: ${up ? 'קטן, בינוני, גדול' : 'גדול, בינוני, קטן'}).` };
    }
    if (attr === 'rot') {
      const step = rng.pick([90, -90, 45]);
      const starts = rng.sample([0, 90, 180, 270], 3);
      return { at: (r, c) => (((starts[r] + c * step) % 360) + 360) % 360, type, text: `הצורה מסתובבת ${Math.abs(step)}° ${step > 0 ? 'עם' : 'נגד'} כיוון השעון בכל צעד ימינה.` };
    }
    if (attr === 'pos') {
      const step = rng.pick([1, 2, -1]);
      const starts = rng.sample(range(8), 3);
      return { at: (r, c) => (((starts[r] + c * step) % 8) + 8) % 8, type, text: `הנקודה זזה ${Math.abs(step) === 1 ? 'מקום אחד' : 'שני מקומות'} ${step > 0 ? 'עם' : 'נגד'} כיוון השעון סביב המסגרת בכל צעד ימינה.` };
    }
  }
  if (type === 'sum') {
    // count: third = first + second (פעולה חשבונית)
    const rows = range(3).map(() => { const a = rng.int(1, 4), b = rng.int(1, 4); return [a, b, a + b]; });
    return { at: (r, c) => rows[r][c], type, text: 'מספר הצורות במשבצת השלישית = סכום הצורות בשתי המשבצות הראשונות.' };
  }
  throw new Error('bad rule ' + attr + type);
}

const MATRIX_SKILLS = {
  m_const: { name: 'שלושה מאותו סוג', min: 1 },
  m_count: { name: 'מספר צורות ופעולה חשבונית', min: 1 },
  m_latin: { name: 'פיזור שלושה ערכים', min: 1 },
  m_size: { name: 'גודל ומילוי', min: 1 },
  m_rot: { name: 'סיבוב ותזוזה', min: 2 },
  m_multi: { name: 'כמה חוקים יחד', min: 3 },
  m_logic: { name: 'איחוד / קווים משותפים', min: 2 },
};

function makeMatrixQuestion(skill, rng, level) {
  if (skill === 'm_logic') return makeLogicQuestion(rng, level);
  // primary attribute rule per skill
  let primary;
  switch (skill) {
    case 'm_const': primary = [rng.pick(['shape', 'fill', 'shape']), rng.pick(['row', 'col'])]; break;
    case 'm_count': primary = ['count', level >= 3 && rng.chance(0.5) ? 'sum' : rng.pick(['prog', 'latin'])]; break;
    case 'm_latin': primary = [rng.pick(['shape', 'fill', 'inner']), 'latin']; break;
    case 'm_size': primary = rng.chance(0.55) ? ['size', rng.pick(['prog', 'latin'])] : ['fill', rng.pick(['latin', 'row'])]; break;
    case 'm_rot': primary = [rng.chance(0.55) ? 'rot' : 'pos', 'prog']; break;
    default: primary = [rng.pick(['shape', 'count', 'fill', 'size', 'rot']), null];
  }
  const extraN = level <= 1 ? 0 : level === 2 ? rng.int(0, 1) : level === 3 ? 1 : level === 4 ? 2 : 3;
  const varying = { [primary[0]]: primary[1] };
  // some attributes can't be combined (inner marks need single empty shapes, etc.)
  const conflicts = (a) => {
    if (a === 'inner') return 'fill' in varying || 'count' in varying || 'pos' in varying;
    if (a === 'fill' || a === 'count') return 'inner' in varying || (a === 'count' && 'count' in varying);
    if (a === 'size') return varying.count === 'sum';
    return false;
  };
  const want = 1 + extraN + (skill === 'm_multi' ? 1 : 0);
  for (const a of rng.shuffle(['shape', 'fill', 'count', 'size', 'rot', 'inner'])) {
    if (Object.keys(varying).length >= want) break;
    if (a in varying || conflicts(a)) continue;
    if (varying.count === 'sum' && a === 'inner') continue;
    varying[a] = null;
  }
  // choose rule types for attrs without one
  for (const a of Object.keys(varying)) {
    if (varying[a]) continue;
    const opts = { shape: ['row', 'col', 'latin'], fill: ['row', 'col', 'latin'], count: ['prog', 'latin'], size: ['prog', 'latin'], rot: ['prog'], inner: ['latin', 'row'], pos: ['prog'] }[a];
    varying[a] = level <= 2 ? opts[0] : rng.pick(opts);
  }
  const rules = {};
  const shapeDom = 'rot' in varying ? ORIENTED : SHAPES;
  for (const a of ['shape', 'count', 'fill', 'size', 'rot', 'inner', 'pos']) {
    if (a in varying) {
      let dom;
      if (a === 'shape') dom = shapeDom;
      if (a === 'fill' && 'inner' in varying) dom = ['none'];
      if (a === 'count' && varying.count === 'latin') dom = [1, 2, 3];
      if (a === 'rot' && varying.rot === 'prog') dom = undefined;
      rules[a] = buildRule(rng, a, varying[a], dom);
    } else if (a === 'pos') {
      rules[a] = null;
    } else {
      let dom;
      if (a === 'shape') dom = shapeDom;
      if (a === 'count') dom = 'inner' in varying ? [1] : [1, 1, 2];
      if (a === 'size') dom = varying.count === 'sum' ? [1] : [2, 2, 1];
      if (a === 'fill') dom = 'inner' in varying ? ['none'] : ['none', 'solid', 'gray', 'stripe'];
      if (a === 'rot') dom = [0];
      if (a === 'inner') dom = ['none'];
      rules[a] = buildRule(rng, a, 'const', dom);
    }
  }
  const cellAt = (r, c) => {
    const o = {};
    for (const a of ['shape', 'count', 'fill', 'size', 'rot', 'inner']) o[a] = rules[a].at(r, c);
    o.pos = rules.pos ? rules.pos.at(r, c) : null;
    if (o.count > 4 && o.size === 2) o.size = 1;
    return o;
  };
  const grid = range(3).map((r) => range(3).map((c) => cellAt(r, c)));
  // identical rows make the puzzle trivial — only acceptable at the easiest level
  if (level >= 2 && uniq(grid.map((r) => JSON.stringify(r))).length === 1) return makeMatrixQuestion(skill, rng, level);
  const ans = grid[2][2];
  const key = (o) => JSON.stringify(o);
  const varyingAttrs = Object.keys(varying);
  // distractors
  const cands = [];
  const mutate = (base, a, v) => ({ ...base, [a]: v });
  const domFor = (a) => {
    if (a === 'shape') return shapeDom;
    if (a === 'count') return varying.count === 'sum' ? range(8, 1) : [1, 2, 3, 4];
    if (a === 'fill' && 'inner' in varying) return FILLS;
    return ATTR_DOMAIN[a];
  };
  // copies of neighbouring cells (classic trap)
  cands.push(grid[2][1], grid[2][0], grid[1][2], grid[0][2]);
  for (const a of rng.shuffle(varyingAttrs)) {
    const seen = uniq(grid.flat().map((c) => c[a])).filter((v) => v !== ans[a] && v !== null);
    seen.forEach((v) => cands.push(mutate(ans, a, v)));
  }
  for (const a of rng.shuffle(varyingAttrs)) domFor(a).filter((v) => v !== ans[a]).forEach((v) => cands.push(mutate(ans, a, v)));
  // two-attribute mutations
  if (varyingAttrs.length >= 2) {
    for (let t = 0; t < 10; t++) {
      const [a, b] = rng.sample(varyingAttrs, 2);
      cands.push(mutate(mutate(ans, a, rng.pick(domFor(a).filter((v) => v !== ans[a]))), b, rng.pick(domFor(b).filter((v) => v !== ans[b]))));
    }
  }
  for (const a of ['shape', 'fill', 'size', 'count'].filter((x) => !(x in varying))) {
    if (a === 'count' && 'inner' in varying) continue;
    domFor(a).filter((v) => v !== ans[a]).forEach((v) => cands.push(mutate(ans, a, v)));
  }
  const seenK = new Set([key(ans)]);
  const dis = [];
  for (const c of cands) {
    if (c.count > 4 && c.size === 2) continue;
    const k = key(c);
    if (seenK.has(k)) continue;
    // triangle rotated by 120 would look identical - guard rotations of symmetric shapes
    seenK.add(k); dis.push(c);
  }
  const chosen = [...dis.slice(0, 2), ...rng.shuffle(dis.slice(2, 14))].slice(0, 7);
  const { options, answer } = shuffleOptions(rng, ans, chosen);
  const ruleList = varyingAttrs.map((a) => ({ attr: a, text: rules[a].text }));
  const constList = ['shape', 'fill', 'size', 'count'].filter((a) => !(a in varying)).map((a) => ATTR_HE[a]);
  const hints = {
    shape: 'בדוק את סוגי הצורות: האם כל שורה מורכבת מאותה צורה, או שכל צורה מופיעה פעם אחת בכל שורה?',
    count: 'ספור את הצורות בכל משבצת. האם המספר עולה? האם המשבצת השלישית היא סכום של שתי הראשונות?',
    fill: 'התמקד במילוי (ריק / מלא / מפוספס / אפור). איך הוא מתחלק בכל שורה?',
    size: 'שים לב לגודל הצורות משמאל לימין.',
    rot: 'שים לב לאן הצורה "מצביעה" — היא מסתובבת בכל צעד באותה זווית.',
    inner: 'הסתכל על הסימן הקטן שבתוך הצורה — איך הוא מתחלק בכל שורה?',
    pos: 'עקוב אחרי הנקודה הקטנה על המסגרת — היא זזה בכל צעד באותו מספר מקומות.',
  };
  return {
    domain: 'matrix',
    prompt: 'איזו צורה משלימה את המטריצה? (קוראים כל שורה משמאל לימין)',
    visual: { kind: 'matrix', grid },
    options, answer,
    hint: hints[primary[0]] + (varyingAttrs.length > 1 ? ` (יש כאן ${varyingAttrs.length} חוקים שפועלים יחד — בדוק כל מאפיין בנפרד.)` : ''),
    rule: ruleList.map((r) => r.text).join(' '),
    explanation: `<p>במטריצה הזו פועל${varyingAttrs.length > 1 ? 'ים' : ''} <b>${varyingAttrs.length > 1 ? varyingAttrs.length + ' חוקים' : 'חוק אחד'}</b>. בודקים כל מאפיין בנפרד:</p><ul>${ruleList.map((r) => `<li><b>${ATTR_HE[r.attr]}:</b> ${r.text}</li>`).join('')}</ul>${constList.length ? `<p class="muted">מאפיינים שלא משתנים: ${constList.join(', ')}.</p>` : ''}<p>התשובה היא הצורה היחידה שעומדת בכל החוקים יחד — כל אחת מהאפשרויות האחרות שוברת לפחות חוק אחד.</p>`,
    demo: { kind: 'matrix', grid, answerCell: ans, rules: ruleList },
  };
}

/* ===== app.js — screens, state, adaptive flow, simulations ===== */

const STORE_KEY = 'dapar-police-v1';
let DB = null;
let ROUTE = 'home';
let VIEW = {};
let TICK = null;
const QCACHE = new Map();
const TRY_STATE = {};

/* ---------- persistence ---------- */
function freshDB() {
  return { v: 1, settings: { mode: 'adaptive', showTimer: true, theme: 'auto' }, ratings: {}, sets: {}, log: [], sims: [], lessons: {}, created: Date.now(), lastRoute: 'home', lastSet: null, practiceForm: null };
}
function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) return { ...freshDB(), ...d, settings: { ...freshDB().settings, ...(d.settings || {}) } }; }
  } catch (e) { /* storage unavailable — run in memory */ }
  return freshDB();
}
function saveDB() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { /* ignore */ } }

/* ---------- small helpers ---------- */
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function Q(spec) {
  const k = `${spec.skill}|${spec.level}|${spec.seed}`;
  if (!QCACHE.has(k)) QCACHE.set(k, buildQuestion(spec));
  return QCACHE.get(k);
}
const lvDots = (lv) => `<span class="lvdots" title="רמת קושי ${lv} מתוך 5" aria-label="רמת קושי ${lv} מתוך 5">${range(5).map((i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span>`;
const LEVEL_NAMES = { 1: 'קל מאוד', 2: 'קל', 3: 'בינוני', 4: 'קשה', 5: 'מאתגר' };
const modeName = (m) => (m === 'adaptive' ? 'אדפטיבי' : `קבוע: ${LEVEL_NAMES[m]}`);
const domChip = (d) => `<span class="chip ${d}">${DOMAINS[d].short}</span>`;

const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21a2 2 0 012-2h13v2H6"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" transform="rotate(180 12 12)"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
  skip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l-7 7 7 7M20 5l-7 7 7 7"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 5v14L6 12z"/></svg>',
  sim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="12" cy="10.5" r="3"/><path d="M12 9v1.5l1 1"/></svg>',
  badge: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><circle cx="20" cy="20" r="18"/><path d="M20 7l4.6 8H33.8l-4.6 8 4.6 8H24.6L20 39l-4.6-8H6.2l4.6-8-4.6-8h9.2z" transform="translate(0 -3) scale(1 .86) translate(0 3)"/><circle cx="20" cy="20" r="4.5" fill="currentColor"/></svg>',
};

/* ---------- ratings, stats ---------- */
function skillStats() {
  const m = {};
  for (const l of DB.log) { const o = m[l.s] || (m[l.s] = { n: 0, ok: 0, hint: 0 }); o.n++; o.ok += l.ok; o.hint += l.h || 0; }
  return m;
}
function weakSkills(k) {
  const st = skillStats();
  return Object.keys(SKILLS)
    .map((s) => { const o = st[s]; const acc = o && o.n >= 3 ? o.ok / o.n : 0.62; return { s, v: acc + (DB.ratings[s] ?? 2) / 40 }; })
    .sort((a, b) => a.v - b.v).slice(0, k).map((x) => x.s);
}
function domainRating(d) {
  const ks = skillsOf(d).filter((k) => DB.ratings[k] !== undefined);
  return ks.length ? sum(ks.map((k) => DB.ratings[k])) / ks.length : null;
}
function streak() {
  const days = new Set(DB.log.map((l) => l.d));
  let n = 0; const d = new Date();
  if (!days.has(today())) d.setDate(d.getDate() - 1);
  for (;;) { const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (!days.has(s)) break; n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- sets ---------- */
function setDef(id) { const p = ALL_SETS.find((s) => s.id === id); if (p) return p; const e = DB.sets[id]; return e ? e.def : null; }
const freshSt = () => ({ ch: null, ok: null, hint: 0, skip: false, t: 0, elim: [], timeout: false });

function createEntry(id, def, mode) {
  const seed = newSeed();
  const rng = makeRng(seed);
  const skills = def.weak ? weakSkills(4) : (def.skills || Object.keys(SKILLS));
  const order = [];
  while (order.length < def.n) order.push(...rng.shuffle(skills));
  const e = { id, def: { ...def }, skills, order: order.slice(0, def.n), mode: def.sim ? 'sim' : (mode ?? DB.settings.mode), qs: [], created: Date.now(), seed };
  DB.sets[id] = e;
  if (def.sim) initSim(e);
  else ensureQ(e, e.mode === 'adaptive' ? 0 : def.n - 1);
  saveDB();
  return e;
}
function specFor(e, i) {
  const skill = e.order[i];
  const rng = makeRng(e.seed + i * 7919);
  const level = e.mode === 'adaptive' ? levelFromRating(DB.ratings[skill] ?? (e.def.lv ?? 2), rng) : Number(e.mode);
  return { skill, level, seed: newSeed() };
}
function ensureQ(e, i) { while (e.qs.length <= i && e.qs.length < e.def.n) e.qs.push({ spec: specFor(e, e.qs.length), st: freshSt() }); }
function entryStats(e) {
  const r = { n: e.def.n, answered: 0, correct: 0, wrong: 0, skipped: 0, hints: 0 };
  e.qs.forEach(({ st }) => {
    if (st.ok !== null) { r.answered++; if (st.ok) r.correct++; else r.wrong++; } else if (st.skip) r.skipped++;
    if (st.hint) r.hints++;
  });
  return r;
}
function setProgress(id) {
  const e = DB.sets[id];
  if (!e) return 0;
  if (e.def.sim) return e.sim.phase === 'done' ? 1 : e.qs.filter((q) => q.st.ok !== null).length / e.def.n;
  return entryStats(e).answered / e.def.n;
}
function dayProgress(day) {
  const d = PLAN.find((x) => x.day === day);
  return sum(d.sets.map((s) => setProgress(s.id) * s.n)) / sum(d.sets.map((s) => s.n));
}
function nextDay() { const d = PLAN.find((x) => dayProgress(x.day) < 0.999); return d ? d.day : 14; }

/* ---------- answering ---------- */
function recordResult(e, item, q) {
  const { spec, st } = item;
  const before = DB.ratings[spec.skill];
  const r = updateRating(before ?? spec.level, { correct: st.ok, level: q.level, usedHint: st.hint > 0, skipped: false, timeSec: st.t, expected: q.timeSec });
  DB.ratings[spec.skill] = r;
  DB.log.push({ s: spec.skill, ok: st.ok ? 1 : 0, lv: q.level, d: today(), h: st.hint ? 1 : 0, t: st.t });
  if (DB.log.length > 6000) DB.log.splice(0, DB.log.length - 6000);
  if (e && e.mode === 'adaptive') {
    const a = Math.round(before ?? spec.level), b = Math.round(r);
    if (b > a) toast(`🔥 עלית רמה! "${SKILLS[spec.skill].name}" — עכשיו ברמה ${b} (${LEVEL_NAMES[b]})`);
    else if (b < a) toast(`רמת הקושי ב"${SKILLS[spec.skill].name}" ירדה ל-${b}. נחזק את הבסיס 💪`);
  }
}
function answerCurrent(choice) {
  const e = DB.sets[VIEW.id]; const item = e.qs[VIEW.i]; const q = Q(item.spec); const st = item.st;
  if (st.ok !== null || st.elim.includes(choice)) return;
  st.ch = choice; st.ok = choice === q.answer; st.skip = false;
  st.t = Math.round((Date.now() - VIEW.qStart) / 1000);
  recordResult(e, item, q);
  saveDB();
  render();
}
function hintCurrent() {
  const e = DB.sets[VIEW.id]; const item = e.qs[VIEW.i]; const q = Q(item.spec); const st = item.st;
  if (st.ok !== null || st.hint >= 2) return;
  st.hint++;
  if (st.hint === 2) {
    const wrong = range(q.options.length).filter((k) => k !== q.answer);
    st.elim = makeRng(item.spec.seed + 99).sample(wrong, Math.floor(wrong.length / 2));
  }
  saveDB(); render();
}
function skipCurrent() {
  const e = DB.sets[VIEW.id]; const item = e.qs[VIEW.i];
  if (item.st.ok === null) {
    if (!item.st.skip) DB.ratings[item.spec.skill] = updateRating(DB.ratings[item.spec.skill] ?? item.spec.level, { skipped: true });
    item.st.skip = true;
  }
  saveDB();
  goNext();
}
function goNext() {
  const e = DB.sets[VIEW.id]; const n = e.def.n;
  if (e.def.sim) { go(VIEW.i + 1 < n ? `q:${VIEW.id}:${VIEW.i + 1}` : `set:${VIEW.id}`); return; }
  const open = (j) => j >= e.qs.length || e.qs[j].st.ok === null;
  // first: the next question that was neither answered nor skipped; then: anything still open (skipped ones too)
  for (let k = 1; k < n; k++) { const j = (VIEW.i + k) % n; if (open(j) && !(e.qs[j] && e.qs[j].st.skip)) { go(`q:${VIEW.id}:${j}`); return; } }
  for (let k = 1; k < n; k++) { const j = (VIEW.i + k) % n; if (open(j)) { go(`q:${VIEW.id}:${j}`); return; } }
  go(`set:${VIEW.id}`);
}

/* ---------- UI primitives ---------- */
function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast fade-in'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function confirmBox(text, okLabel, onOk, danger) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div>${text}</div><div class="row" style="justify-content:flex-end"><button class="btn" data-x="no">ביטול</button><button class="btn ${danger ? 'danger' : 'primary'}" data-x="ok">${okLabel}</button></div></div>`;
  bg.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-x]');
    if (ev.target === bg || (b && b.dataset.x === 'no')) bg.remove();
    else if (b && b.dataset.x === 'ok') { bg.remove(); onOk(); }
  });
  document.body.appendChild(bg);
  bg.querySelector('[data-x="ok"]').focus();
}
function applyTheme() {
  const t = DB.settings.theme;
  if (t === 'light' || t === 'dark') { document.documentElement.dataset.theme = t; VIEW.themeSet = true; }
  else if (VIEW.themeSet) { delete document.documentElement.dataset.theme; VIEW.themeSet = false; }
}

/* ---------- question rendering ---------- */
const itemHTML = (x) => (typeof x === 'object' ? `<span class="frac"><span>${x.n}</span><span>${x.d}</span></span>` : fmtNum(x));
function visualHTML(q) {
  const v = q.visual;
  if (!v) return '';
  if (v.kind === 'series') return `<div class="series-wrap"><div class="series-row ${v.seq.length >= 7 || v.seq.some((x) => fmtItem(x).length >= 4) ? 'dense' : ''}">${v.seq.map((x, i) => (v.blanks.includes(i) ? '<span class="n blank">?</span>' : `<span class="n">${itemHTML(x)}</span>`)).join('')}</div></div>`;
  if (v.kind === 'matrix') return `<div class="mgrid" role="img" aria-label="מטריצה של 3 על 3 צורות, המשבצת האחרונה חסרה">${v.grid.flat().map((c, k) => (k === 8 ? '<div class="cell missing">?</div>' : `<div class="cell">${cellSvg(c)}</div>`)).join('')}</div>`;
  return v.html;
}
function optionsHTML(q, st, { reveal, sel, disabled }) {
  const isMx = q.domain === 'matrix';
  const long = !isMx && q.options.some((o) => String(o).length > 14);
  const mono = q.domain === 'series' || q.options.every((o) => /^[\d ,./₪-]+$/.test(String(o)));
  return `<div class="options ${isMx ? 'matrix-opts' : ''} ${long ? 'long' : ''}" role="group" aria-label="תשובות">${q.options.map((o, k) => {
    let cls = 'opt';
    if (isMx) cls += ' pic'; else if (mono) cls += ' mono';
    if (reveal) { if (k === q.answer) cls += ' right'; else if (k === st.ch) cls += ' wrong'; }
    else if (sel === k) cls += ' sel';
    const el = st && st.elim && st.elim.includes(k);
    if (el) cls += ' elim';
    const key = isMx ? k + 1 : HEB_OPT[k];
    const val = isMx ? cellSvg(o) : esc(o);
    return `<button class="${cls}" data-act="opt" data-k="${k}" ${reveal || disabled || el ? 'disabled' : ''} aria-label="תשובה ${key}"><span class="key">${key}</span><span class="val">${val}</span></button>`;
  }).join('')}</div>`;
}
function answerLabel(q) { return q.domain === 'matrix' ? `צורה מספר ${q.answer + 1}` : `${HEB_OPT[q.answer]}. ${esc(q.options[q.answer])}`; }
function questionCore(q, st, opts) {
  return `<div class="prompt">${q.prompt}</div>${q.visual ? `<div class="visual">${visualHTML(q)}</div>` : ''}${optionsHTML(q, st, opts)}`;
}
function feedbackHTML(q, st, extraBtns = '') {
  const verdict = st.timeout ? ['neutral', '⏰ הזמן נגמר'] : st.ok ? ['ok', '✔ נכון!'] : st.ch === null ? ['neutral', '— לא נענתה'] : ['bad', '✘ לא נכון'];
  const praise = st.ok ? (st.hint ? 'נכון — עם רמז. בפעם הבאה נסה בלי.' : st.t && st.t < q.timeSec * 0.5 ? 'מהיר ומדויק!' : '') : '';
  return `<div class="feedback ${verdict[0]} fade-in" role="status">
    <div class="row"><span class="verdict">${verdict[1]}</span>${praise ? `<span class="muted">${praise}</span>` : ''}<span class="grow"></span>${st.t ? `<span class="chip">⏱ ${fmtTime(st.t)}</span>` : ''}</div>
    ${st.ok ? '' : `<div><b>התשובה הנכונה:</b> ${answerLabel(q)}</div>`}
    <div>${q.explanation}</div>
    ${q.demo ? '<div data-demo-slot><button class="btn" data-act="demo">▶ הצג הדגמה צעד-אחר-צעד</button></div>' : ''}
    ${extraBtns}
  </div>`;
}

/* ---------- demos (step-through simulations) ---------- */
function stepper(el, total, draw) {
  let k = 0, timer = null;
  el.innerHTML = '<div class="demo"><div class="stage"></div><div class="caption" aria-live="polite"></div><div class="ctrl"><button class="btn small" data-s="reset">↺ מההתחלה</button><button class="btn small" data-s="prev">→ הקודם</button><button class="btn small primary" data-s="play">▶ הפעל</button><button class="btn small" data-s="next">הבא ←</button></div></div>';
  const stage = el.querySelector('.stage'), cap = el.querySelector('.caption'), playB = el.querySelector('[data-s="play"]');
  const show = () => { const r = draw(k); stage.innerHTML = r.html; cap.innerHTML = r.caption || ''; };
  const stop = () => { clearInterval(timer); timer = null; playB.textContent = '▶ הפעל'; };
  el.querySelector('.ctrl').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-s]'); if (!b) return;
    const s = b.dataset.s;
    if (s === 'reset') { stop(); k = 0; }
    if (s === 'prev') { stop(); k = Math.max(0, k - 1); }
    if (s === 'next') { stop(); k = Math.min(total, k + 1); }
    if (s === 'play') {
      if (timer) stop();
      else {
        if (k >= total) k = 0;
        playB.textContent = '⏸ עצור';
        timer = setInterval(() => { if (k >= total || !el.isConnected) { stop(); return; } k++; show(); }, 1300);
      }
    }
    show();
  });
  show();
  return { start() { playB.click(); } };
}

function seriesSvg(seq, arcs, blanks, filled) {
  const n = seq.length, W = 64, bw = 54, bh = 44, top = 52;
  const hasBot = arcs.some((a) => a.pos === 'bot');
  const H = top + bh + (hasBot ? 50 : 8);
  const cx = (i) => 8 + i * W + bw / 2;
  let s = '';
  arcs.forEach((a) => {
    if (a.self) { s += `<text class="arclab" x="${cx(a.f)}" y="${top - 12}" text-anchor="middle">${esc(a.lab)}</text>`; return; }
    const x1 = cx(a.f), x2 = cx(a.t), mid = (x1 + x2) / 2, span = Math.abs(a.t - a.f);
    if (a.pos === 'bot') {
      const y = top + bh + 2;
      s += `<path class="arc bot" d="M ${x1} ${y} Q ${mid} ${y + 34} ${x2} ${y}"/><text class="arclab bot" x="${mid}" y="${y + 40}" text-anchor="middle">${esc(a.lab)}</text>`;
    } else {
      const y = top - 2;
      s += `<path class="arc" d="M ${x1} ${y} Q ${mid} ${y - (span > 1 ? 40 : 32)} ${x2} ${y}"/><text class="arclab" x="${mid}" y="${y - (span > 1 ? 24 : 18)}" text-anchor="middle">${esc(a.lab)}</text>`;
    }
  });
  seq.forEach((x, i) => {
    const isB = blanks.includes(i), got = isB && filled;
    s += `<rect class="sbox ${isB ? (got ? 'got' : 'blank') : ''}" x="${8 + i * W}" y="${top}" width="${bw}" height="${bh}" rx="8"/>`;
    const txt = isB && !got ? '?' : x;
    if (txt === '?') {
      s += `<text class="snum q" x="${cx(i)}" y="${top + 29}" text-anchor="middle">?</text>`;
    } else if (typeof txt === 'object') {
      s += `<text class="snum ${got ? 'got' : ''}" x="${cx(i)}" y="${top + 19}" text-anchor="middle" font-size="15">${txt.n}</text><line x1="${cx(i) - 14}" x2="${cx(i) + 14}" y1="${top + 23}" y2="${top + 23}" stroke="currentColor"/><text class="snum ${got ? 'got' : ''}" x="${cx(i)}" y="${top + 39}" text-anchor="middle" font-size="15">${txt.d}</text>`;
    } else {
      const str = fmtItem(txt);
      s += `<text class="snum ${isB && !got ? 'q' : got ? 'got' : ''}" x="${cx(i)}" y="${top + 29}" text-anchor="middle" ${str.length > 4 ? 'font-size="15"' : ''}>${str}</text>`;
    }
  });
  const wpx = 16 + n * W;
  return `<svg viewBox="0 0 ${wpx} ${H}" style="width:100%;max-width:${wpx}px;min-width:${Math.min(wpx, n * 38)}px" role="img" aria-label="הדגמת סדרה">${s}</svg>`;
}
function seriesDemo(el, d) {
  const arcs = d.arcs.slice().sort((a, b) => a.t - b.t || a.f - b.f);
  return stepper(el, arcs.length + 1, (k) => {
    const shown = arcs.slice(0, Math.min(k, arcs.length));
    const filled = k > arcs.length;
    const last = shown[shown.length - 1];
    let caption = k === 0 ? 'לחץ ▶ או "הבא" — נכתוב את הפעולה בין כל שני מספרים.' : last ? (last.expr ? `<span class="ltr-inline">${esc(last.expr)}</span>` : esc(last.lab)) : '';
    if (filled) caption = `✔ ממלאים את החסר לפי אותה חוקיות: <b class="ltr-inline">${d.blanks.map((b) => fmtItem(d.seq[b])).join(' , ')}</b>`;
    return { html: seriesSvg(d.seq, shown, d.blanks, filled), caption };
  });
}
function matrixDemo(el, d) {
  const rules = d.rules || [];
  const total = rules.length + 2;
  return stepper(el, total, (k) => {
    const reveal = k === total;
    const cells = d.grid.flat().map((c, i) => {
      if (i === 8) return reveal ? `<div class="cell reveal">${cellSvg(d.answerCell)}</div>` : '<div class="cell missing">?</div>';
      let cls = 'cell';
      if (k === 1 && i < 3) cls += ' hl';
      if (k >= 2 && !reveal) cls += i < 6 ? ' hl' : '';
      if (k === 1 && i >= 3) cls += ' dim';
      return `<div class="${cls}">${cellSvg(c)}</div>`;
    }).join('');
    const ruleIdx = k - 2;
    const list = `<ul class="rules-list">${rules.map((r, j) => `<li class="${j === ruleIdx ? 'on' : k >= 2 && j < ruleIdx ? '' : reveal ? '' : 'off'}">${r.attr !== 'logic' ? `<b>${ATTR_HE[r.attr]}:</b> ` : ''}${r.text}</li>`).join('')}</ul>`;
    let caption = 'נפרק את המטריצה. לחץ ▶ או "הבא".';
    if (k === 1) caption = 'קוראים את השורה הראשונה משמאל לימין ושואלים: מה משתנה ומה נשאר קבוע?';
    if (k >= 2 && !reveal) caption = `חוק ${ruleIdx + 1} מתוך ${rules.length} — בודקים אותו בשתי השורות הראשונות, ומחילים על השלישית.`;
    if (reveal) caption = '✔ זו הצורה היחידה שמקיימת את כל החוקים יחד.';
    return { html: `<div class="stack" style="align-items:center;width:100%"><div class="mgrid">${cells}</div>${list}</div>`, caption };
  });
}
function compassSvg(moves, upto, showRes, back) {
  const pts = [[0, 0]];
  moves.forEach(([dx, dy, d]) => { const [x, y] = pts[pts.length - 1]; pts.push([x + dx * d, y + dy * d]); });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs) - 1, maxX = Math.max(...xs) + 1, minY = Math.min(...ys) - 1, maxY = Math.max(...ys) + 1;
  const span = Math.max(maxX - minX, maxY - minY, 4);
  const S = 240 / span, ox = 40 - minX * S + (240 - (maxX - minX) * S) / 2, oy = 40 + maxY * S + (240 - (maxY - minY) * S) / 2;
  const P = ([x, y]) => [ox + x * S, oy - y * S];
  let g = '';
  for (let x = Math.floor(minX - 2); x <= maxX + 2; x++) { const [px] = P([x, 0]); if (px > 20 && px < 300) g += `<line class="cgrid" x1="${px}" y1="20" x2="${px}" y2="300"/>`; }
  for (let y = Math.floor(minY - 2); y <= maxY + 2; y++) { const [, py] = P([0, y]); if (py > 20 && py < 300) g += `<line class="cgrid" x1="20" y1="${py}" x2="300" y2="${py}"/>`; }
  let path = '';
  for (let i = 0; i < upto; i++) { const [a, b] = P(pts[i]), [c, d] = P(pts[i + 1]); path += `<line class="cpath" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; }
  const [sx, sy] = P(pts[0]), [ex, ey] = P(pts[Math.min(upto, pts.length - 1)]);
  let res = '';
  if (showRes) {
    const [fx, fy] = P(pts[pts.length - 1]);
    res = back ? `<line class="cres" x1="${fx}" y1="${fy}" x2="${sx}" y2="${sy}"/>` : `<line class="cres" x1="${sx}" y1="${sy}" x2="${fx}" y2="${fy}"/>`;
  }
  const lab = '<text class="clab" x="160" y="14" text-anchor="middle">צפון</text><text class="clab" x="160" y="316" text-anchor="middle">דרום</text><text class="clab" x="314" y="164" text-anchor="end">מזרח</text><text class="clab" x="6" y="164">מערב</text>';
  return `<svg class="compass-svg" viewBox="0 0 320 320" role="img" aria-label="מסלול על מפה">${g}${lab}${path}${res}<circle class="cstart" cx="${sx}" cy="${sy}" r="7"/><text class="clab" x="${sx + 10}" y="${sy - 8}">התחלה</text><circle class="cend" cx="${ex}" cy="${ey}" r="6"/></svg>`;
}
function dirName(dx, dy) {
  const ns = dy > 0 ? 'צפון' : dy < 0 ? 'דרום' : '';
  const ew = dx > 0 ? 'מזרח' : dx < 0 ? 'מערב' : '';
  return ns && ew ? `${ns}-${ew}` : ns || ew || 'בנקודת המוצא';
}
function compassDemo(el, d) {
  const x = sum(d.moves.map((m) => m[0] * m[2])), y = sum(d.moves.map((m) => m[1] * m[2]));
  return stepper(el, d.moves.length + 1, (k) => {
    const res = k > d.moves.length;
    let caption = k === 0 ? 'נצייר את המסלול על דף הטיוטה, צעד אחר צעד.' : `${d.moves[Math.min(k, d.moves.length) - 1][2]} ק"מ ל${d.moves[Math.min(k, d.moves.length) - 1][3]}`;
    if (res) caption = d.back ? `אתה ב${dirName(x, y)} לנקודת המוצא ← כדי לחזור הולכים ל<b>${dirName(-x, -y)}</b>` : `הקו המקווקו מחבר את ההתחלה לסוף: <b>${dirName(x, y)}</b>`;
    return { html: compassSvg(d.moves, Math.min(k, d.moves.length), res, d.back), caption };
  });
}
function compassPlay(el) {
  const moves = [];
  const draw = () => {
    const x = sum(moves.map((m) => m[0] * m[2])), y = sum(moves.map((m) => m[1] * m[2]));
    el.innerHTML = `<div class="demo"><div class="stage">${compassSvg(moves.length ? moves : [], moves.length, moves.length > 0, false)}</div>
      <div class="caption">${moves.length ? `צפון-דרום: ${y > 0 ? y + ' צפונה' : y < 0 ? -y + ' דרומה' : '0'} · מזרח-מערב: ${x > 0 ? x + ' מזרחה' : x < 0 ? -x + ' מערבה' : '0'} ← הכיוון הכללי: <b>${dirName(x, y)}</b>` : 'לחץ על כיוון כדי ללכת ק"מ אחד.'}</div>
      <div class="ctrl"><button class="btn small" data-m="0,1">צפונה ↑</button><button class="btn small" data-m="0,-1">דרומה ↓</button><button class="btn small" data-m="1,0">מזרחה →</button><button class="btn small" data-m="-1,0">מערבה ←</button><button class="btn small ghost" data-m="reset">↺ איפוס</button></div></div>`;
  };
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]'); if (!b) return;
    if (b.dataset.m === 'reset') moves.length = 0;
    else {
      const [dx, dy] = b.dataset.m.split(',').map(Number);
      const last = moves[moves.length - 1];
      if (last && last[0] === dx && last[1] === dy) last[2]++; else moves.push([dx, dy, 1, '']);
    }
    draw();
  });
  draw();
}
function abcTable(el) {
  const half = (a, b) => `<div class="table-wrap"><table class="abc-table"><tr>${HEB.slice(a, b).map((c) => `<td>${letterIndex(c) + 1}</td>`).join('')}</tr><tr>${HEB.slice(a, b).map((c) => `<td>${c}</td>`).join('')}</tr><tr>${HEB.slice(a, b).map((c) => `<td>${GEMATRIA[c]}</td>`).join('')}</tr></table></div>`;
  el.innerHTML = `<div class="demo"><div class="stack" style="align-items:center">${half(0, 11)}${half(11, 22)}<div class="muted" style="font-size:.85rem">שורה עליונה: המקום בא"ב · אמצע: האות · תחתונה: ערך בגימטרייה</div></div></div>`;
}
function mountDemo(el, demo) {
  if (!demo) return;
  if (demo.kind === 'series') return seriesDemo(el, demo);
  if (demo.kind === 'matrix') return matrixDemo(el, demo);
  if (demo.kind === 'matrixSpec') return matrixDemo(el, Q(demo.spec).demo);
  if (demo.kind === 'compass') return compassDemo(el, demo);
  if (demo.kind === 'compassPlay') return compassPlay(el);
  if (demo.kind === 'abc') return abcTable(el);
}

/* ---------- layout shell ---------- */
const TABS = [['home', 'בית', IC.home], ['plan', 'תוכנית', IC.plan], ['practice', 'תרגול', IC.practice], ['library', 'טכניקות', IC.book], ['stats', 'התקדמות', IC.chart]];
function shell(inner) {
  const top = ROUTE.split(':')[0];
  const active = { day: 'plan', set: 'plan', q: 'plan', lesson: 'library', sim: 'practice' }[top] || top;
  return `<header class="topbar"><div class="topbar-in">
      <button class="brand" data-go="home" aria-label="מסך הבית"><span class="badge-ic">${IC.badge}</span><span><b>מסלול דפ״ר</b><small>הכנה למבחן המשטרה</small></span></button>
      <span class="spacer"></span>
      <nav class="nav-desktop" aria-label="ניווט">${TABS.map(([r, l]) => `<button class="iconbtn" data-go="${r}" ${active === r ? 'aria-current="page" style="color:var(--accent);font-weight:600"' : ''}>${l}</button>`).join('')}</nav>
      <button class="iconbtn" data-go="settings" aria-label="הגדרות">${IC.gear}</button>
    </div></header>
    <main id="main">${inner}</main>
    <nav class="tabbar" aria-label="ניווט"><div class="tabbar-in">${TABS.map(([r, l, ic]) => `<button data-go="${r}" class="${active === r ? 'on' : ''}">${ic}<span>${l}</span></button>`).join('')}</div></nav>`;
}

/* ---------- views ---------- */
function viewHome() {
  const nd = nextDay();
  const day = PLAN.find((d) => d.day === nd);
  const total = DB.log.length, correct = sum(DB.log.map((l) => l.ok));
  const todayN = DB.log.filter((l) => l.d === today()).length;
  const last = DB.lastSet && DB.sets[DB.lastSet] && setProgress(DB.lastSet) < 1 ? DB.sets[DB.lastSet] : null;
  const lastTitle = last ? (setDef(last.id) || last.def).t : '';
  return `
  <section class="hero">
    <div class="eyebrow">תוכנית הכנה · 14 ימים · 3 פרקים</div>
    <h1>${total ? 'ממשיכים במסלול' : 'מתכוננים למבחן המיון של המשטרה'}</h1>
    <p class="lead">סדרות חשבוניות, סדרות צורניות ומילוי הוראות — עם שיעורי טכניקות, אלפי שאלות עם הסברים, הדגמות צעד-אחר-צעד וקושי שמתאים את עצמו אליך.</p>
  </section>
  <section class="panel stack" aria-label="מסלול 14 הימים">
    <div class="row"><h2 class="grow">מסלול 14 הימים</h2><span class="chip brass">יום ${nd} מתוך 14</span></div>
    <div class="track">${PLAN.map((d) => { const p = dayProgress(d.day); const cls = p >= 0.999 ? 'done' : d.day === nd ? 'next' : p > 0 ? 'part' : ''; return `<button class="station ${cls}" data-go="day:${d.day}" aria-label="יום ${d.day}: ${d.title}"><span class="dot">${p >= 0.999 ? '✓' : d.day}</span><span>${p > 0 && p < 0.999 ? pct(p, 1) + '%' : ''}</span></button>`; }).join('')}</div>
    <div class="continue">
      <div class="txt"><div class="eyebrow">היום הבא שלך</div><h3>יום ${nd}: ${day.title}</h3><p class="muted" style="margin:0">${day.goal}</p></div>
      <button class="btn primary" data-go="day:${nd}">${IC.play} ${dayProgress(nd) > 0 ? 'המשך' : 'התחל'} את יום ${nd}</button>
    </div>
    ${last ? `<div class="row" style="border-top:1px solid var(--line);padding-top:12px"><span class="grow muted">באמצע: <b style="color:var(--ink)">${lastTitle}</b> (${pct(setProgress(last.id), 1)}%)</span><button class="btn small" data-go="set:${last.id}">המשך מקבץ</button></div>` : ''}
  </section>
  <section class="tiles" aria-label="קיצורים">
    <button class="tile" data-go="practice">${IC.practice}<b>תרגול חופשי</b><span>בחר נושא, קושי ומספר שאלות</span></button>
    <button class="tile" data-go="practice:sim">${IC.sim}<b>סימולציית מבחן</b><span>ממוחשב אדפטיבי או מבחן כיתה</span></button>
    <button class="tile" data-go="library">${IC.book}<b>טכניקות</b><span>כל השיעורים וההדגמות</span></button>
    <button class="tile" data-go="stats">${IC.chart}<b>התקדמות</b><span>חולשות, רמות וגיבוי</span></button>
  </section>
  <section class="panel stack">
    <div class="row"><h2 class="grow">הרמה שלך</h2><span class="muted tnum">${todayN} שאלות היום · ${streak()} ימים ברצף · ${pct(correct, total)}% הצלחה כוללת</span></div>
    <div class="meters">${Object.keys(DOMAINS).map((d) => { const r = domainRating(d); return `<div class="meter"><div class="top"><span>${domChip(d)}</span><span class="val tnum">${r ? r.toFixed(1) : '—'}<small class="muted" style="font-size:.8rem"> / 5</small></span></div><div class="pbar"><i style="width:${r ? (r / 5) * 100 : 0}%;background:${DOMAINS[d].color}"></i></div></div>`; }).join('')}</div>
    ${total ? '' : '<p class="muted" style="margin:0">הרמות יתעדכנו אחרי השאלות הראשונות. מצב ברירת המחדל הוא אדפטיבי: ככל שתצליח, השאלות יהיו קשות יותר.</p>'}
  </section>`;
}

function viewPlan() {
  return `<h1>תוכנית 14 הימים</h1><p class="muted">כל יום: שיעור טכניקות קצר ו-3-5 מקבצי תרגול (~45-60 שאלות). מומלץ ללכת לפי הסדר, אבל כל הימים פתוחים.</p>
  <div class="list">${PLAN.map((d) => { const p = dayProgress(d.day); return `<button class="item" data-go="day:${d.day}"><span class="daynum" style="font-size:1.6rem">${d.day}</span><span class="body"><span class="title">${d.title}</span><span class="sub">${d.goal}</span><span class="pbar ${p >= 0.999 ? 'ok' : ''}"><i style="width:${p * 100}%"></i></span></span><span class="end">${p >= 0.999 ? '<span class="chip ok">הושלם</span>' : p > 0 ? `<span class="chip">${pct(p, 1)}%</span>` : ''}<span class="muted" style="font-size:.78rem">${sum(d.sets.map((s) => s.n))} שאלות</span></span></button>`; }).join('')}</div>`;
}

function setRowHTML(s) {
  const e = DB.sets[s.id];
  const p = setProgress(s.id);
  const st = e && !s.sim ? entryStats(e) : null;
  let status = '<span class="chip">לא התחיל</span>';
  if (e && s.sim) status = e.sim.phase === 'done' ? `<span class="chip ok">${e.sim.score?.pct ?? 0}%</span>` : '<span class="chip warn">בתהליך</span>';
  else if (e) status = p >= 1 ? `<span class="chip ok">${pct(st.correct, st.n)}% הצלחה</span>` : `<span class="chip">${st.answered}/${st.n}</span>`;
  const doms = uniq((s.skills || Object.keys(SKILLS)).map((k) => SKILLS[k].domain));
  const kind = s.sim ? 'סימולציה' : s.weak ? 'מותאם אישית' : s.timer ? `${s.timer} שנ׳ לשאלה` : s.skills.length > 1 ? 'מעורב' : SKILLS[s.skills[0]].name;
  return `<button class="item" data-go="set:${s.id}"><span class="ic">${s.sim ? '🖥️' : s.weak ? '🎯' : s.timer ? '⚡' : '📝'}</span><span class="body"><span class="title">${s.t}</span><span class="sub">${s.n} שאלות · ${kind} ${s.sim || s.weak ? '' : doms.map(domChip).join(' ')}</span>${e ? `<span class="pbar ${p >= 1 ? 'ok' : ''}"><i style="width:${p * 100}%"></i></span>` : ''}</span><span class="end">${status}</span></button>`;
}
function viewDay(n) {
  const d = PLAN.find((x) => x.day === Number(n)) || PLAN[0];
  return `<button class="btn ghost small back" data-go="plan">${IC.back} כל הימים</button>
  <section class="daycard"><div class="dayhead"><span class="daynum">${d.day}</span><div><div class="eyebrow">יום ${d.day} מתוך 14</div><h1>${d.title}</h1></div></div><p class="muted" style="margin:0">${d.goal}</p></section>
  <section class="stack"><h2>1. לומדים</h2><div class="list">${d.lessons.map((id) => { const L = LESSONS[id]; return `<button class="item" data-go="lesson:${id}"><span class="ic">${L.icon}</span><span class="body"><span class="title">${L.title}</span><span class="sub">${L.blocks.length} חלקים · כולל הדגמות ושאלות לדוגמה</span></span><span class="end">${DB.lessons[id] ? '<span class="chip ok">נקרא ✓</span>' : '<span class="chip brass">התחל כאן</span>'}</span></button>`; }).join('')}</div></section>
  <section class="stack"><h2>2. מתרגלים</h2><div class="list">${d.sets.map(setRowHTML).join('')}</div></section>
  <div class="row" style="justify-content:space-between">${d.day > 1 ? `<button class="btn ghost" data-go="day:${d.day - 1}">→ יום ${d.day - 1}</button>` : '<span></span>'}${d.day < 14 ? `<button class="btn ghost" data-go="day:${d.day + 1}">יום ${d.day + 1} ←</button>` : ''}</div>`;
}

function viewLesson(id) {
  const L = LESSONS[id];
  if (!L) return viewLibrary();
  if (!DB.lessons[id]) { DB.lessons[id] = true; saveDB(); }
  const day = PLAN.find((d) => d.lessons.includes(id));
  VIEW.mounts = [];
  const blocks = L.blocks.map((b, i) => {
    let h = '';
    if (b.h) h += `<h2>${b.h}</h2>`;
    if (b.html) h += `<div>${b.html}</div>`;
    if (b.demo) { h += `<div data-mount="${i}"></div>`; VIEW.mounts.push([i, b.demo]); }
    if (b.tryQ) h += `<div class="tryq" data-try="${id}-${i}" data-spec='${JSON.stringify(b.tryQ)}'></div>`;
    return `<section class="lesson-block">${h}</section>`;
  }).join('');
  return `<button class="btn ghost small back" data-go="${day ? 'day:' + day.day : 'library'}">${IC.back} ${day ? 'חזרה ליום ' + day.day : 'כל הטכניקות'}</button>
  <div><div class="eyebrow">שיעור טכניקות${day ? ` · יום ${day.day}` : ''}</div><h1>${L.icon} ${L.title}</h1></div>
  <div class="panel stack">${blocks}</div>
  ${day ? `<button class="btn primary" data-go="day:${day.day}">סיימתי — לתרגול של יום ${day.day} ←</button>` : ''}`;
}
function renderTry(el) {
  const key = el.dataset.try, spec = JSON.parse(el.dataset.spec);
  const q = Q(spec);
  const st = TRY_STATE[key] || (TRY_STATE[key] = freshSt());
  const done = st.ok !== null;
  el.innerHTML = `<div class="row"><span class="chip brass">נסה בעצמך</span>${domChip(q.domain)}<span class="muted" style="font-size:.85rem">${SKILLS[spec.skill].name}</span></div>${questionCore(q, st, { reveal: done })}${done ? feedbackHTML(q, st) : `<div class="row"><button class="btn small" data-act="tryhint">${IC.bulb} רמז</button></div>${st.hint ? `<div class="hintbox">💡 ${q.hint}</div>` : ''}`}`;
}

function viewLibrary() {
  const groups = [['על המבחן ואסטרטגיה', ['exam', 'strategy', 'speed', 'sim', 'final']], ['סדרות חשבוניות', ['series1', 'series2', 'series3']], ['סדרות צורניות', ['matrix1', 'matrix2', 'matrix3']], ['מילוי הוראות', ['instr1', 'instr2', 'instr3']]];
  return `<h1>טכניקות</h1><p class="muted">כל השיעורים במקום אחד — לחזרה לפני מקבץ או לפני המבחן.</p>
  ${groups.map(([t, ids]) => `<section class="stack"><h2>${t}</h2><div class="list">${ids.map((id) => { const L = LESSONS[id]; const day = PLAN.find((d) => d.lessons.includes(id)); return `<button class="item" data-go="lesson:${id}"><span class="ic">${L.icon}</span><span class="body"><span class="title">${L.title}</span><span class="sub">${day ? `יום ${day.day}` : ''}</span></span><span class="end">${DB.lessons[id] ? '<span class="chip ok">✓</span>' : ''}</span></button>`; }).join('')}</div></section>`).join('')}`;
}

function viewSet(id) {
  const def = setDef(id);
  if (!def) return viewHome();
  const e = DB.sets[id];
  const day = def.day || (ALL_SETS.find((s) => s.id === id) || {}).day;
  const backTo = day ? `day:${day}` : 'practice';
  const backBtn = `<button class="btn ghost small back" data-go="${backTo}">${IC.back} ${day ? 'חזרה ליום ' + day : 'חזרה לתרגול'}</button>`;
  if (def.sim) return viewSimSet(id, def, e, backBtn);
  if (!e) {
    const skills = def.weak ? weakSkills(4) : def.skills;
    return `${backBtn}<div><div class="eyebrow">מקבץ${day ? ` · יום ${day}` : ''}</div><h1>${def.t}</h1></div>
    <section class="panel stack">
      <div class="row"><span class="chip">${def.n} שאלות</span>${def.timer ? `<span class="chip warn">⏱ ${def.timer} שניות לשאלה</span>` : ''}</div>
      <div><div class="lab" style="font-weight:600;margin-bottom:6px">נושאים במקבץ${def.weak ? ' (נבחרו לפי החולשות שלך)' : ''}:</div><div class="row">${skills.map((k) => `<span class="chip ${SKILLS[k].domain}">${SKILLS[k].name}</span>`).join('')}</div></div>
      <div class="field"><span class="lab">רמת קושי</span><div class="seg" role="radiogroup">${['adaptive', 1, 2, 3, 4, 5].map((m) => `<button data-act="setmode" data-m="${m}" class="${String(VIEW.pickMode ?? DB.settings.mode) === String(m) ? 'on' : ''}" role="radio" aria-checked="${String(VIEW.pickMode ?? DB.settings.mode) === String(m)}">${m === 'adaptive' ? '📈 אדפטיבי' : LEVEL_NAMES[m]}</button>`).join('')}</div>
      <span class="muted" style="font-size:.85rem">באדפטיבי: מתחילים ברמה שלך בכל נושא, וכל תשובה נכונה מקרבת לשאלות קשות יותר.</span></div>
      <button class="btn primary" data-act="startset">${IC.play} התחל מקבץ</button>
    </section>`;
  }
  const st = entryStats(e);
  const tiles = range(def.n).map((i) => {
    const it = e.qs[i];
    let cls = 'locked', label = 'טרם נפתחה';
    if (it) {
      const s = it.st;
      if (s.ok === true) { cls = 'ok'; label = 'נכון'; } else if (s.ok === false) { cls = s.timeout ? 'skip' : 'bad'; label = s.timeout ? 'הזמן נגמר' : 'שגוי'; } else if (s.skip) { cls = 'skip'; label = 'דולג'; } else { cls = 'open'; label = 'לא נענתה'; }
    }
    return `<button class="qtile ${cls} ${VIEW.lastI === i && VIEW.lastId === id ? 'cur' : ''}" data-go="q:${id}:${i}" aria-label="שאלה ${i + 1}: ${label}">${i + 1}${it && it.st.hint ? '<span class="hintmark">💡</span>' : ''}</button>`;
  }).join('');
  const doneAll = st.answered === def.n;
  const nextI = range(def.n).find((i) => !e.qs[i] || e.qs[i].st.ok === null);
  return `${backBtn}<div><div class="eyebrow">מפת המקבץ · ${modeName(e.mode)}</div><h1>${def.t}</h1></div>
  <section class="panel stack">
    <div class="summary"><div><b class="tnum" style="color:var(--ok)">${st.correct}</b><span>נכונות</span></div><div><b class="tnum" style="color:var(--bad)">${st.wrong}</b><span>שגויות</span></div><div><b class="tnum" style="color:var(--warn)">${st.skipped}</b><span>דולגו</span></div><div><b class="tnum">${def.n - st.answered}</b><span>נותרו</span></div></div>
    <div class="pbar ${doneAll ? 'ok' : ''}"><i style="width:${(st.answered / def.n) * 100}%"></i></div>
    ${doneAll ? `<p style="margin:0"><b>סיימת את המקבץ!</b> ${pct(st.correct, def.n)}% הצלחה${st.hints ? `, ${st.hints} עם רמז` : ''}. ${pct(st.correct, def.n) >= 80 ? 'מצוין — אפשר לעבור הלאה.' : 'מומלץ לעבור על השגויות (אדומות) ולקרוא את ההסברים.'}</p>` : ''}
    <div class="qmap">${tiles}</div>
    <div class="legend"><span><i style="border-color:var(--ok);background:var(--ok-soft)"></i>נכון</span><span><i style="border-color:var(--bad);background:var(--bad-soft)"></i>שגוי</span><span><i style="border-color:var(--warn);background:var(--warn-soft)"></i>דולג / נגמר הזמן</span><span><i style="border-color:var(--accent)"></i>פתוחה</span><span><i style="border-color:var(--line);border-style:dashed"></i>טרם נפתחה</span><span>💡 עם רמז</span></div>
    <div class="row">${nextI !== undefined ? `<button class="btn primary" data-go="q:${id}:${nextI}">${IC.play} ${st.answered ? 'המשך' : 'התחל'} (שאלה ${nextI + 1})</button>` : ''}
    ${st.wrong ? `<button class="btn" data-go="q:${id}:${e.qs.findIndex((x) => x.st.ok === false)}">עבור על השגויות</button>` : ''}
    <button class="btn ghost" data-act="regen">↻ מקבץ חדש (שאלות אחרות)</button></div>
  </section>`;
}

function viewQuestion(id, iStr) {
  const def = setDef(id);
  if (!def) return viewHome();
  const e = DB.sets[id] || createEntry(id, def);
  const isSim = !!def.sim;
  if (isSim && e.sim.phase !== 'done') return viewSet(id);
  const i = clamp(Number(iStr) || 0, 0, (isSim ? e.qs.length : def.n) - 1);
  if (!isSim) { ensureQ(e, i); DB.lastSet = id; }
  saveDB();
  const item = e.qs[i], q = Q(item.spec), st = item.st, done = st.ok !== null;
  const fresh = VIEW.id !== id || VIEW.i !== i || VIEW.route !== ROUTE;
  VIEW.id = id; VIEW.i = i; VIEW.lastId = id; VIEW.lastI = i; VIEW.route = ROUTE;
  if (fresh || !VIEW.qStart) VIEW.qStart = Date.now();
  const timed = def.timer && !done;
  if (timed && (fresh || !VIEW.deadline)) VIEW.deadline = Date.now() + def.timer * 1000;
  const isLast = i === def.n - 1;
  const stats = entryStats(e);
  const head = `<div class="qhead">
      <button class="btn ghost small" data-go="set:${id}">${IC.grid} ${isSim ? 'חזרה לתוצאות' : 'מפת המקבץ'}</button>
      <span class="grow"></span>
      <span class="count tnum">${i + 1}<span class="muted" style="font-size:.9rem"> / ${def.n}</span></span>
    </div>
    <div class="pbar"><i style="width:${(stats.answered / def.n) * 100}%"></i></div>
    <div class="qhead">${domChip(q.domain)}<span class="muted" style="font-size:.88rem">${SKILLS[item.spec.skill].name}</span>${lvDots(q.level)}<span class="grow"></span>
      ${(DB.settings.showTimer || timed) && !done ? `<span class="timer" id="qtimer">${timed ? fmtTime(def.timer) : '0:00'}</span>` : ''}</div>`;
  const actions = done
    ? `<div class="actions"><div class="grp">${i > 0 ? `<button class="btn" data-go="q:${id}:${i - 1}">→ הקודמת</button>` : ''}${isSim ? '' : '<button class="btn ghost" data-act="retry">↺ נסה שוב</button>'}</div><div class="grp"><button class="btn primary" data-act="next" id="nextbtn">${isSim ? (i + 1 < e.qs.length ? 'לשאלה הבאה' : 'חזרה לתוצאות') : stats.answered === def.n ? 'לסיכום המקבץ' : 'לשאלה הבאה'} ←</button></div></div>`
    : `<div class="actions"><div class="grp"><button class="btn" data-act="hint" ${st.hint >= 2 ? 'disabled' : ''}>${IC.bulb} ${st.hint === 0 ? 'רמז' : st.hint === 1 ? 'רמז נוסף: פסילת תשובות' : 'השתמשת ברמזים'}</button><button class="btn" data-act="skip">${IC.skip} דלג</button></div>
       <div class="grp">${i > 0 ? `<button class="btn ghost" data-go="q:${id}:${i - 1}">→</button>` : ''}${!isLast ? `<button class="btn ghost" data-act="peeknext" aria-label="לשאלה הבאה בלי לענות">←</button>` : ''}</div></div>`;
  return `<section class="panel stack" aria-label="שאלה">${head}
    ${st.hint && !done ? `<div class="hintbox fade-in">💡 ${q.hint}${st.hint >= 2 ? '<br><b>פסלנו חלק מהתשובות השגויות.</b>' : ''}</div>` : ''}
    ${questionCore(q, st, { reveal: done })}
    ${done ? '' : actions}
    ${done ? feedbackHTML(q, st) : ''}
    ${done ? actions : ''}
    <div class="kbd-help">מקלדת: 1-8 לבחירה · H רמז · S דלג · חצים לניווט · Enter לשאלה הבאה</div>
  </section>`;
}

/* ---------- simulations ---------- */
function initSim(e) {
  const layout = SIM_LAYOUT[e.def.sim];
  e.layout = layout;
  e.sim = { phase: 'intro', sec: 0, cur: 0, lv: 3, sel: null, secDeadline: null, qDeadline: null, results: null };
  if (e.def.sim === 'class') {
    const rng = makeRng(e.seed);
    layout.forEach((sec, s) => {
      for (let k = 0; k < sec.n; k++) {
        const level = rng.pick([2, 2, 3, 3, 3, 4, 4, 5]);
        const skill = rng.pick(skillsOf(sec.domain).filter((x) => SKILLS[x].min <= level));
        e.qs.push({ spec: { skill, level, seed: newSeed() }, st: freshSt(), sec: s });
      }
    });
  }
}
const secRange = (e, s) => { let a = 0; for (let k = 0; k < s; k++) a += e.layout[k].n; return [a, a + e.layout[s].n]; };
function simNewQ(e) {
  const sec = e.layout[e.sim.sec];
  const rng = makeRng(e.seed + e.qs.length * 31);
  const skill = rng.pick(skillsOf(sec.domain).filter((x) => SKILLS[x].min <= e.sim.lv));
  e.qs.push({ spec: { skill, level: e.sim.lv, seed: newSeed() }, st: freshSt(), sec: e.sim.sec });
}
function simStartSection(e) {
  const sec = e.layout[e.sim.sec];
  e.sim.phase = 'run';
  if (e.def.sim === 'class') { e.sim.secDeadline = Date.now() + sec.total * 1000; e.sim.cur = secRange(e, e.sim.sec)[0]; }
  else { e.sim.lv = 3; simNewQ(e); e.sim.cur = e.qs.length - 1; e.sim.qDeadline = Date.now() + sec.perQ * 1000; e.sim.qStart = Date.now(); }
  e.sim.sel = null;
  saveDB();
}
function simCommit(e, choice, timeout) {
  // computer-mode: lock in the current question and move on
  const item = e.qs[e.sim.cur], q = Q(item.spec), st = item.st;
  st.t = Math.round((Date.now() - (e.sim.qStart || Date.now())) / 1000);
  if (choice === null) { st.ok = false; st.skip = true; st.timeout = !!timeout; }
  else { st.ch = choice; st.ok = choice === q.answer; }
  recordResult(null, item, q);
  e.sim.lv = clamp(e.sim.lv + (st.ok ? 1 : -1), 1, 5);
  e.sim.sel = null;
  const [a, b] = secRange(e, e.sim.sec);
  if (e.qs.length - a >= b - a) simEndSection(e);
  else { simNewQ(e); e.sim.cur = e.qs.length - 1; e.sim.qDeadline = Date.now() + e.layout[e.sim.sec].perQ * 1000; e.sim.qStart = Date.now(); }
  saveDB();
}
function simEndSection(e) {
  if (e.def.sim === 'class') {
    const [a, b] = secRange(e, e.sim.sec);
    for (let k = a; k < b; k++) {
      const it = e.qs[k], q = Q(it.spec);
      if (it.st.ch === null) { it.st.ok = false; it.st.skip = true; }
      else { it.st.ok = it.st.ch === q.answer; recordResult(null, it, q); }
    }
  }
  if (e.sim.sec + 1 < e.layout.length) { e.sim.sec++; e.sim.phase = 'intro'; }
  else simFinish(e);
  saveDB();
}
function simFinish(e) {
  e.sim.phase = 'done';
  const secs = e.layout.map((sec, s) => {
    const items = e.qs.filter((x) => x.sec === s);
    const correct = items.filter((x) => x.st.ok).length;
    const wrong = items.filter((x) => x.st.ok === false && x.st.ch !== null).length;
    const lvs = items.map((x) => Q(x.spec).level);
    return { domain: sec.domain, n: sec.n, correct, wrong, blank: sec.n - correct - wrong, avgLv: lvs.length ? sum(lvs) / lvs.length : 0, endLv: lvs.slice(-4).length ? sum(lvs.slice(-4)) / lvs.slice(-4).length : 0, score: correct - wrong / 4 };
  });
  const n = sum(secs.map((s) => s.n)), c = sum(secs.map((s) => s.correct));
  e.sim.score = { pct: pct(c, n), secs };
  DB.sims.push({ id: e.id, kind: e.def.sim, date: today(), pct: pct(c, n), secs: secs.map((s) => ({ d: s.domain, c: s.correct, n: s.n, lv: Math.round(s.avgLv * 10) / 10 })) });
}
function simCheckTime(e) {
  if (!e || !e.sim || e.sim.phase !== 'run') return false;
  if (e.def.sim === 'class' && Date.now() > e.sim.secDeadline) { simEndSection(e); return true; }
  if (e.def.sim !== 'class' && Date.now() > e.sim.qDeadline) { simCommit(e, null, true); return true; }
  return false;
}
const SIM_NAMES = { mini: 'מבחן ביניים', computer: 'סימולציה ממוחשבת', class: 'סימולציית כיתה' };
function viewSimSet(id, def, e, backBtn) {
  if (!e) {
    const lay = SIM_LAYOUT[def.sim];
    return `${backBtn}<section class="panel stack sim-intro"><div class="eyebrow">${SIM_NAMES[def.sim]}</div><h1>${def.t}</h1>
      <div class="list" style="width:100%">${lay.map((s) => `<div class="item"><span class="ic">${DOMAINS[s.domain].icon}</span><span class="body"><span class="title">${DOMAINS[s.domain].name}</span><span class="sub">${s.n} שאלות · ${s.perQ ? `${s.perQ} שניות לכל שאלה` : `${Math.round(s.total / 60)} דקות לכל הפרק`}</span></span></div>`).join('')}</div>
      <p class="muted" style="max-width:60ch">${def.sim === 'class' ? 'אפשר לנווט בין שאלות הפרק ולשנות תשובות עד שהזמן נגמר. ניקוד: +1 על נכונה, −¼ על שגויה.' : 'שעון לכל שאלה, אין חזרה אחורה ואין משוב במהלך המבחן. הקושי עולה אחרי תשובה נכונה ויורד אחרי טעות.'} התוצאות וההסברים — בסוף.</p>
      <p class="muted" style="font-size:.85rem">הכן דף טיוטה ועט. מומלץ לא לעצור באמצע (השעון ממשיך לרוץ).</p>
      <button class="btn primary" data-act="simcreate">${IC.play} אני מוכן — התחל</button></section>`;
  }
  simCheckTime(e);
  const sim = e.sim;
  if (sim.phase === 'intro') {
    const sec = e.layout[sim.sec];
    return `${backBtn}<section class="panel stack sim-intro"><div class="eyebrow">${SIM_NAMES[def.sim]} · פרק ${sim.sec + 1} מתוך ${e.layout.length}</div><h1>${DOMAINS[sec.domain].name}</h1>
      <p>${sec.n} שאלות · ${sec.perQ ? `${sec.perQ} שניות לכל שאלה` : `${Math.round(sec.total / 60)} דקות לכל הפרק`}</p>
      <button class="btn primary" data-act="simstart">${IC.play} התחל פרק</button></section>`;
  }
  if (sim.phase === 'run') return viewSimRun(e, def);
  // results
  const sc = sim.score;
  const msg = sc.pct >= 80 ? 'תוצאה מצוינת. שמור על הקצב ותתרגל מבחנים מלאים.' : sc.pct >= 60 ? 'תוצאה טובה. בדוק את הפרק החלש ותרגל אותו ממוקד.' : 'יש עוד עבודה — עבור על ההסברים ותרגל את הנושאים החלשים.';
  const tiles = e.qs.map((it, i) => `<button class="qtile ${it.st.ok ? 'ok' : it.st.ch === null ? 'skip' : 'bad'}" data-go="q:${id}:${i}" aria-label="שאלה ${i + 1}">${i + 1}</button>`).join('');
  return `${backBtn}<section class="panel stack"><div class="eyebrow">תוצאות · ${SIM_NAMES[def.sim]}</div>
    <div class="row"><span class="bigscore tnum">${sc.pct}%</span><span class="grow muted">${msg}</span></div>
    <div class="table-wrap"><table class="skilltable"><tr><th>פרק</th><th>נכונות</th><th>שגויות</th><th>לא נענו</th>${def.sim === 'class' ? '<th>ניקוד (−¼)</th>' : '<th>רמת קושי בסוף</th>'}</tr>
    ${sc.secs.map((s) => `<tr><td>${domChip(s.domain)}</td><td class="n">${s.correct}/${s.n}</td><td class="n">${s.wrong}</td><td class="n">${s.blank}</td><td class="n">${def.sim === 'class' ? (Math.round(s.score * 100) / 100) : `${lvDots(Math.round(s.endLv))} ${s.endLv.toFixed(1)}`}</td></tr>`).join('')}</table></div>
    <p class="muted" style="font-size:.85rem;margin:0">זו הערכה לתרגול בלבד ולא ציון רשמי. ${def.sim !== 'class' ? 'במבחן אדפטיבי — הרמה שאליה הגעת בסוף כל פרק חשובה יותר מאחוז ההצלחה.' : ''}</p>
    <h3>תחקיר — לחץ על שאלה לראות הסבר</h3><div class="qmap">${tiles}</div>
    <div class="row"><button class="btn" data-act="weakfromsim">🎯 תרגל את הנושאים החלשים</button></div></section>`;
}
function viewSimRun(e, def) {
  const sim = e.sim, sec = e.layout[sim.sec];
  const item = e.qs[sim.cur], q = Q(item.spec);
  VIEW.simId = e.id;
  const [a, b] = secRange(e, sim.sec);
  const isClass = def.sim === 'class';
  const st = item.st;
  const nav = isClass ? `<div class="qmap" style="grid-template-columns:repeat(auto-fill,minmax(38px,1fr))">${range(b - a).map((k) => `<button class="qtile ${e.qs[a + k].st.ch !== null ? 'open' : ''} ${a + k === sim.cur ? 'cur' : ''}" data-act="simgo" data-k="${a + k}" aria-label="שאלה ${k + 1}">${k + 1}</button>`).join('')}</div>` : '';
  const pos = isClass ? sim.cur - a + 1 : e.qs.length - a;
  return `<section class="panel stack"><div class="qhead"><span class="chip ${sec.domain}">${DOMAINS[sec.domain].name}</span><span class="muted">פרק ${sim.sec + 1}/${e.layout.length}</span><span class="grow"></span><span class="count tnum">${pos}<span class="muted" style="font-size:.9rem"> / ${sec.n}</span></span><span class="timer" id="simtimer">--:--</span></div>
    ${nav}
    ${questionCore(q, st, { reveal: false, sel: isClass ? st.ch : sim.sel })}
    <div class="actions">${isClass
      ? `<div class="grp">${sim.cur > a ? '<button class="btn" data-act="simprev">→ הקודמת</button>' : ''}${sim.cur < b - 1 ? '<button class="btn" data-act="simnext">הבאה ←</button>' : ''}</div><div class="grp">${st.ch !== null ? '<button class="btn ghost" data-act="simclear">נקה תשובה</button>' : ''}<button class="btn primary" data-act="simend">סיים פרק</button></div>`
      : `<div class="grp"><button class="btn ghost" data-act="simskip">דלג</button></div><div class="grp"><button class="btn primary" data-act="simok" ${sim.sel === null ? 'disabled' : ''}>אישור והמשך ←</button></div>`}</div></section>`;
}

/* ---------- practice ---------- */
function viewPractice(sub) {
  const f = DB.practiceForm || (DB.practiceForm = { dom: 'series', skills: skillsOf('series'), mode: 'adaptive', n: 15, timer: 0 });
  const doms = [['series', 'סדרות'], ['matrix', 'צורות'], ['instr', 'הוראות'], ['all', 'הכול']];
  const avail = f.dom === 'all' ? Object.keys(SKILLS) : skillsOf(f.dom);
  const mine = Object.values(DB.sets).filter((e) => e.id.startsWith('free-') || e.id.startsWith('sim-')).sort((x, y) => y.created - x.created).slice(0, 12);
  const simCard = (k, t, s) => `<button class="item" data-act="newsim" data-k="${k}"><span class="ic">🖥️</span><span class="body"><span class="title">${t}</span><span class="sub">${s}</span></span><span class="end"><span class="chip">${sum(SIM_LAYOUT[k].map((x) => x.n))} שאלות</span></span></button>`;
  return `<h1>תרגול</h1>
  <section class="panel stack" id="sims" ${sub === 'sim' ? 'style="outline:3px solid var(--brass)"' : ''}><h2>סימולציות מבחן</h2><div class="list">
    ${simCard('mini', 'מבחן ביניים קצר', '6 שאלות מכל פרק · שעון לשאלה · ~15 דקות')}
    ${simCard('computer', 'סימולציה ממוחשבת מלאה', 'אדפטיבי · 12 שאלות מכל פרק · שעון לכל שאלה')}
    ${simCard('class', 'סימולציית מבחן כיתה', '15 שאלות מכל פרק · זמן כולל לפרק · קנס ¼ על טעות')}
  </div></section>
  <section class="panel stack"><h2>תרגול חופשי</h2>
    <div class="field"><span class="lab">פרק</span><div class="seg">${doms.map(([k, t]) => `<button data-act="pf" data-f="dom" data-v="${k}" class="${f.dom === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <div class="field"><span class="lab">נושאים <span class="muted" style="font-weight:400">(לחץ לבחירה/ביטול)</span></span><div class="seg">${avail.map((k) => `<button data-act="pskill" data-v="${k}" class="${f.skills.includes(k) ? 'on' : ''}">${SKILLS[k].name}</button>`).join('')}</div></div>
    <div class="field"><span class="lab">קושי</span><div class="seg">${['adaptive', 1, 2, 3, 4, 5].map((m) => `<button data-act="pf" data-f="mode" data-v="${m}" class="${String(f.mode) === String(m) ? 'on' : ''}">${m === 'adaptive' ? '📈 אדפטיבי' : LEVEL_NAMES[m]}</button>`).join('')}</div></div>
    <div class="grid2"><div class="field"><span class="lab">מספר שאלות</span><div class="seg">${[10, 15, 20, 30].map((n) => `<button data-act="pf" data-f="n" data-v="${n}" class="${f.n === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    <div class="field"><span class="lab">שעון לשאלה</span><div class="seg">${[0, 20, 30, 45, 60].map((n) => `<button data-act="pf" data-f="timer" data-v="${n}" class="${f.timer === n ? 'on' : ''}">${n ? n + ' שנ׳' : 'ללא'}</button>`).join('')}</div></div></div>
    <button class="btn primary" data-act="newfree" ${f.skills.length ? '' : 'disabled'}>${IC.play} צור מקבץ</button>
  </section>
  ${mine.length ? `<section class="stack"><h2>המקבצים שלי</h2><div class="list">${mine.map((e) => `<div class="row" style="flex-wrap:nowrap">${setRowHTML({ ...e.def, id: e.id })}<button class="iconbtn" data-act="delset" data-id="${e.id}" aria-label="מחק">✕</button></div>`).join('')}</div></section>` : ''}`;
}

/* ---------- stats & settings ---------- */
function viewStats() {
  const ss = skillStats();
  const total = DB.log.length, correct = sum(DB.log.map((l) => l.ok));
  const weak = weakSkills(4);
  const rows = Object.keys(SKILLS).map((k) => { const o = ss[k] || { n: 0, ok: 0 }; const r = DB.ratings[k]; return `<tr><td>${domChip(SKILLS[k].domain)} ${SKILLS[k].name}</td><td class="n">${o.n}</td><td class="n">${o.n ? pct(o.ok, o.n) + '%' : '—'}</td><td class="n">${r ? lvDots(Math.round(r)) : '<span class="muted">—</span>'}</td><td><button class="btn small" data-act="quick" data-v="${k}">תרגל</button></td></tr>`; }).join('');
  return `<h1>התקדמות</h1>
  <section class="panel"><div class="summary"><div><b class="tnum">${total}</b><span>שאלות</span></div><div><b class="tnum">${pct(correct, total)}%</b><span>הצלחה</span></div><div><b class="tnum">${streak()}</b><span>ימים ברצף</span></div><div><b class="tnum">${PLAN.filter((d) => dayProgress(d.day) >= 0.999).length}/14</b><span>ימים הושלמו</span></div></div></section>
  ${total >= 10 ? `<section class="panel stack"><h2>לחזק עכשיו</h2><div class="row">${weak.map((k) => `<span class="chip ${SKILLS[k].domain}">${SKILLS[k].name}</span>`).join('')}</div><button class="btn primary" data-act="weaknow">🎯 מקבץ חולשות (15 שאלות)</button></section>` : ''}
  <section class="panel stack"><h2>לפי נושא</h2><div class="table-wrap"><table class="skilltable"><tr><th>נושא</th><th>שאלות</th><th>הצלחה</th><th>רמה</th><th></th></tr>${rows}</table></div></section>
  ${DB.sims.length ? `<section class="panel stack"><h2>סימולציות</h2><div class="table-wrap"><table class="skilltable"><tr><th>תאריך</th><th>סוג</th><th>תוצאה</th><th>לפי פרק</th></tr>${DB.sims.slice().reverse().map((s) => `<tr><td class="n">${s.date}</td><td>${SIM_NAMES[s.kind]}</td><td class="n"><b>${s.pct}%</b></td><td>${s.secs.map((x) => `${DOMAINS[x.d].short} ${x.c}/${x.n}`).join(' · ')}</td></tr>`).join('')}</table></div></section>` : ''}
  <section class="panel stack"><h2>גיבוי והעברה בין מכשירים</h2><p class="muted" style="margin:0">ההתקדמות נשמרת בדפדפן של המכשיר הזה. כדי להעביר למכשיר אחר: העתק את קוד הגיבוי, ובמכשיר השני הדבק אותו כאן ולחץ "שחזר".</p>
    <div class="row"><button class="btn" data-act="export">העתק קוד גיבוי</button></div>
    <textarea id="backup" aria-label="קוד גיבוי" placeholder="כאן יופיע קוד הגיבוי, או הדבק כאן קוד לשחזור"></textarea>
    <div class="row"><button class="btn" data-act="import">שחזר מהקוד</button><span class="grow"></span><button class="btn danger" data-act="reset">איפוס כל ההתקדמות</button></div></section>`;
}
function viewSettings() {
  const s = DB.settings;
  return `<h1>הגדרות</h1>
  <section class="panel stack">
    <div class="field"><span class="lab">רמת קושי ברירת מחדל למקבצים חדשים</span><div class="seg">${['adaptive', 1, 2, 3, 4, 5].map((m) => `<button data-act="setting" data-f="mode" data-v="${m}" class="${String(s.mode) === String(m) ? 'on' : ''}">${m === 'adaptive' ? '📈 אדפטיבי (מומלץ)' : LEVEL_NAMES[m]}</button>`).join('')}</div>
    <span class="muted" style="font-size:.85rem">אדפטיבי: לכל נושא יש רמה משלו (1-5). תשובה נכונה ומהירה מעלה אותה, טעות מורידה. השאלה הבאה נבחרת לפי הרמה.</span></div>
    <div class="field"><span class="lab">שעון בשאלות</span><div class="seg"><button data-act="setting" data-f="showTimer" data-v="1" class="${s.showTimer ? 'on' : ''}">הצג</button><button data-act="setting" data-f="showTimer" data-v="0" class="${!s.showTimer ? 'on' : ''}">הסתר</button></div></div>
    <div class="field"><span class="lab">ערכת צבעים</span><div class="seg"><button data-act="setting" data-f="theme" data-v="auto" class="${s.theme === 'auto' ? 'on' : ''}">לפי המכשיר</button><button data-act="setting" data-f="theme" data-v="light" class="${s.theme === 'light' ? 'on' : ''}">בהיר</button><button data-act="setting" data-f="theme" data-v="dark" class="${s.theme === 'dark' ? 'on' : ''}">כהה</button></div></div>
  </section>
  <section class="panel stack"><h2>על האפליקציה</h2>
    <p>האפליקציה מבוססת על חוברת התרגול של מחוז ת"א (מעודכנת ל-01.09.2025) ומרחיבה אותה: השאלות נוצרות לפי החוקים שבחוברת, כך שאפשר לתרגל ללא הגבלה, וכל תשובה נבדקת ומוסברת.</p>
    <p>מבחן לדוגמה באתר המשטרה: <a href="https://www.police.gov.il/join/GoSim/enter" target="_blank" rel="noopener" style="color:var(--accent)">police.gov.il/join/GoSim</a></p>
    <p class="muted" style="font-size:.85rem;margin:0">אפליקציית תרגול עצמאית — אינה קשורה רשמית למשטרת ישראל. הציונים בסימולציות הם הערכה לתרגול בלבד.</p></section>`;
}

/* ---------- render & routing ---------- */
function go(r) { if (r !== ROUTE) VIEW.pickMode = undefined; ROUTE = r; DB.lastRoute = r; saveDB(); render(); window.scrollTo(0, 0); }
function render() {
  clearInterval(TICK); TICK = null;
  const [name, a, b] = ROUTE.split(':');
  let html;
  VIEW.mounts = [];
  switch (name) {
    case 'plan': html = viewPlan(); break;
    case 'day': html = viewDay(a); break;
    case 'lesson': html = viewLesson(a); break;
    case 'library': html = viewLibrary(); break;
    case 'set': html = viewSet(a); break;
    case 'q': html = viewQuestion(a, b); break;
    case 'practice': html = viewPractice(a); break;
    case 'stats': html = viewStats(); break;
    case 'settings': html = viewSettings(); break;
    default: html = viewHome();
  }
  document.getElementById('app').innerHTML = shell(html);
  // after-render hooks
  VIEW.mounts.forEach(([i, demo]) => { const el = document.querySelector(`[data-mount="${i}"]`); if (el) mountDemo(el, demo); });
  document.querySelectorAll('[data-try]').forEach(renderTry);
  if (name === 'q') startQuestionTimer();
  if (name === 'set' && DB.sets[a] && DB.sets[a].def.sim && DB.sets[a].sim.phase === 'run') startSimTimer(DB.sets[a]);
  if (name === 'practice' && a === 'sim') { const el = document.getElementById('sims'); if (el) el.scrollIntoView(); }
}
function startQuestionTimer() {
  const el = document.getElementById('qtimer');
  if (!el) return;
  const def = setDef(VIEW.id);
  TICK = setInterval(() => {
    if (!el.isConnected) { clearInterval(TICK); return; }
    if (def.timer) {
      const left = (VIEW.deadline - Date.now()) / 1000;
      el.textContent = fmtTime(left);
      el.classList.toggle('low', left <= 10);
      if (left <= 0) {
        clearInterval(TICK);
        const e = DB.sets[VIEW.id], item = e.qs[VIEW.i];
        if (item.st.ok === null) { item.st.ok = false; item.st.timeout = true; item.st.t = def.timer; recordResult(e, item, Q(item.spec)); saveDB(); render(); }
      }
    } else el.textContent = fmtTime((Date.now() - VIEW.qStart) / 1000);
  }, 250);
}
function startSimTimer(e) {
  const el = document.getElementById('simtimer');
  const upd = () => {
    if (!el || !el.isConnected) { clearInterval(TICK); return; }
    const dl = e.def.sim === 'class' ? e.sim.secDeadline : e.sim.qDeadline;
    const left = (dl - Date.now()) / 1000;
    el.textContent = fmtTime(left);
    el.classList.toggle('low', left <= (e.def.sim === 'class' ? 60 : 10));
    if (left <= 0) { clearInterval(TICK); simCheckTime(e); render(); if (e.sim.phase === 'intro' || e.sim.phase === 'done') toast(e.sim.phase === 'done' ? 'הזמן נגמר — המבחן הסתיים' : 'הזמן נגמר — עוברים לפרק הבא'); }
  };
  upd();
  TICK = setInterval(upd, 250);
}

/* ---------- events ---------- */
function onClick(ev) {
  const g = ev.target.closest('[data-go]');
  if (g) { go(g.dataset.go); return; }
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  const [name, a] = ROUTE.split(':');
  const tryEl = b.closest('[data-try]');
  if (tryEl) {
    const st = TRY_STATE[tryEl.dataset.try];
    if (act === 'opt' && st.ok === null) { const q = Q(JSON.parse(tryEl.dataset.spec)); st.ch = Number(b.dataset.k); st.ok = st.ch === q.answer; renderTry(tryEl); }
    if (act === 'tryhint') { st.hint = 1; renderTry(tryEl); }
    if (act === 'demo') { const slot = b.closest('[data-demo-slot]'); mountDemo(slot, Q(JSON.parse(tryEl.dataset.spec)).demo).start(); }
    return;
  }
  // simulation in progress
  if (name === 'set' && DB.sets[a] && DB.sets[a].def.sim) {
    const e = DB.sets[a];
    if (simCheckTime(e)) { render(); return; }
    if (act === 'opt') { const k = Number(b.dataset.k); if (e.def.sim === 'class') e.qs[e.sim.cur].st.ch = k; else e.sim.sel = k; saveDB(); render(); return; }
    if (act === 'simok' && e.sim.sel !== null) { simCommit(e, e.sim.sel, false); render(); window.scrollTo(0, 0); return; }
    if (act === 'simskip') { simCommit(e, null, false); render(); window.scrollTo(0, 0); return; }
    if (act === 'simgo') { e.sim.cur = Number(b.dataset.k); saveDB(); render(); return; }
    if (act === 'simprev') { e.sim.cur--; saveDB(); render(); return; }
    if (act === 'simnext') { e.sim.cur++; saveDB(); render(); return; }
    if (act === 'simclear') { e.qs[e.sim.cur].st.ch = null; saveDB(); render(); return; }
    if (act === 'simend') {
      const [x, y] = secRange(e, e.sim.sec);
      const open = range(y - x).filter((k) => e.qs[x + k].st.ch === null).length;
      confirmBox(`לסיים את הפרק?${open ? ` <b>${open} שאלות</b> עדיין בלי תשובה.` : ''} לא תוכל לחזור אליו.`, 'סיים פרק', () => { simEndSection(e); render(); });
      return;
    }
    if (act === 'simstart') { simStartSection(e); render(); return; }
    if (act === 'weakfromsim') { quickSet(weakSkills(4), 'חולשות מהסימולציה'); return; }
  }
  switch (act) {
    case 'opt': answerCurrent(Number(b.dataset.k)); break;
    case 'hint': hintCurrent(); break;
    case 'skip': skipCurrent(); break;
    case 'peeknext': go(`q:${VIEW.id}:${VIEW.i + 1}`); break;
    case 'next': goNext(); break;
    case 'retry': { const e = DB.sets[VIEW.id]; e.qs[VIEW.i].st = freshSt(); VIEW.qStart = Date.now(); VIEW.deadline = null; saveDB(); render(); break; }
    case 'demo': { const slot = b.closest('[data-demo-slot]'); const e = DB.sets[VIEW.id]; mountDemo(slot, Q(e.qs[VIEW.i].spec).demo).start(); break; }
    case 'setmode': VIEW.pickMode = b.dataset.m === 'adaptive' ? 'adaptive' : Number(b.dataset.m); render(); break;
    case 'startset': { const def = setDef(a); createEntry(a, def, VIEW.pickMode ?? DB.settings.mode); VIEW.pickMode = undefined; go(`q:${a}:0`); break; }
    case 'regen':
      confirmBox('ליצור מקבץ חדש עם שאלות אחרות? התשובות במקבץ הנוכחי יימחקו (הסטטיסטיקה הכללית נשמרת).', 'צור מקבץ חדש', () => { const def = setDef(a); const mode = DB.sets[a].mode; delete DB.sets[a]; if (a.startsWith('free-')) createEntry(a, def, mode); saveDB(); render(); });
      break;
    case 'simcreate': { const def = setDef(a); createEntry(a, def); render(); break; }
    case 'newsim': { const k = b.dataset.k; const id = `sim-${k}-${Date.now()}`; const def = { t: SIM_NAMES[k], n: sum(SIM_LAYOUT[k].map((x) => x.n)), sim: k, skills: null }; createEntry(id, def); go(`set:${id}`); break; }
    case 'pf': {
      const f = DB.practiceForm; const k = b.dataset.f; let v = b.dataset.v;
      if (k === 'dom') { f.dom = v; f.skills = v === 'all' ? Object.keys(SKILLS) : skillsOf(v); }
      else if (k === 'mode') f.mode = v === 'adaptive' ? v : Number(v);
      else f[k] = Number(v);
      saveDB(); render(); break;
    }
    case 'pskill': { const f = DB.practiceForm; const v = b.dataset.v; f.skills = f.skills.includes(v) ? f.skills.filter((x) => x !== v) : [...f.skills, v]; saveDB(); render(); break; }
    case 'newfree': {
      const f = DB.practiceForm;
      const names = uniq(f.skills.map((k) => SKILLS[k].domain)).map((d) => DOMAINS[d].short).join(' + ');
      const id = `free-${Date.now()}`;
      createEntry(id, { t: `תרגול חופשי — ${f.skills.length === 1 ? SKILLS[f.skills[0]].name : names}`, skills: f.skills.slice(), n: f.n, timer: f.timer || null }, f.mode);
      go(`q:${id}:0`); break;
    }
    case 'delset': confirmBox('למחוק את המקבץ מהרשימה?', 'מחק', () => { delete DB.sets[b.dataset.id]; saveDB(); render(); }, true); break;
    case 'quick': quickSet([b.dataset.v], `תרגול ממוקד — ${SKILLS[b.dataset.v].name}`); break;
    case 'weaknow': quickSet(weakSkills(4), 'מקבץ חולשות'); break;
    case 'setting': {
      const k = b.dataset.f, v = b.dataset.v;
      if (k === 'mode') DB.settings.mode = v === 'adaptive' ? v : Number(v);
      if (k === 'showTimer') DB.settings.showTimer = v === '1';
      if (k === 'theme') DB.settings.theme = v;
      applyTheme(); saveDB(); render(); break;
    }
    case 'export': {
      const ta = document.getElementById('backup');
      ta.value = JSON.stringify(DB);
      ta.select();
      try { navigator.clipboard.writeText(ta.value).then(() => toast('קוד הגיבוי הועתק'), () => toast('סמן את הקוד והעתק אותו ידנית')); } catch (e) { toast('סמן את הקוד והעתק אותו ידנית'); }
      break;
    }
    case 'import': {
      try {
        const d = JSON.parse(document.getElementById('backup').value);
        if (!d || d.v !== 1 || !d.sets) throw new Error('bad');
        DB = { ...freshDB(), ...d }; saveDB(); applyTheme(); toast('ההתקדמות שוחזרה'); render();
      } catch (e) { toast('הקוד לא תקין — ודא שהעתקת את כולו'); }
      break;
    }
    case 'reset': confirmBox('<b>למחוק את כל ההתקדמות?</b> פעולה זו לא ניתנת לביטול.', 'מחק הכול', () => { DB = freshDB(); saveDB(); applyTheme(); go('home'); }, true); break;
  }
}
function quickSet(skills, title) {
  const id = `free-${Date.now()}`;
  createEntry(id, { t: title, skills, n: 15 }, DB.settings.mode);
  go(`q:${id}:0`);
}
function onKey(ev) {
  if (ev.target.closest('textarea, input') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (document.querySelector('.modal-bg')) return;
  const [name] = ROUTE.split(':');
  const isSimRun = name === 'set' && document.getElementById('simtimer');
  if (name !== 'q' && !isSimRun) return;
  const n = Number(ev.key);
  if (n >= 1 && n <= 8) { const btn = document.querySelector(`.opt[data-k="${n - 1}"]:not([disabled])`); if (btn) { btn.click(); ev.preventDefault(); } return; }
  if (isSimRun) { if (ev.key === 'Enter') { const ok = document.querySelector('[data-act="simok"]:not([disabled])'); if (ok) ok.click(); } return; }
  if (ev.code === 'KeyH') document.querySelector('[data-act="hint"]:not([disabled])')?.click();
  else if (ev.code === 'KeyS') document.querySelector('[data-act="skip"]')?.click();
  else if (ev.key === 'Enter') document.getElementById('nextbtn')?.click();
  else if (ev.key === 'ArrowLeft') { if (VIEW.i < setDef(VIEW.id).n - 1) go(`q:${VIEW.id}:${VIEW.i + 1}`); }
  else if (ev.key === 'ArrowRight') { if (VIEW.i > 0) go(`q:${VIEW.id}:${VIEW.i - 1}`); }
}

function boot() {
  DB = loadDB();
  applyTheme();
  ROUTE = DB.lastRoute || 'home';
  try { render(); } catch (e) { console.error(e); ROUTE = 'home'; render(); }
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ROUTE.startsWith('set:')) { const e = DB.sets[ROUTE.split(':')[1]]; if (e && e.def.sim && simCheckTime(e)) render(); }
  });
}
boot();

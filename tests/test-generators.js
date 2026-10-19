// Stress-test every generator: run each skill at each level with many seeds and check invariants.
// Usage: node tests/test-generators.js [seedsPerCase]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = ['util.js', 'gen-series.js', 'gen-matrix.js', 'gen-instr.js', 'engine.js'];
const code = SRC.map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const N = Number(process.argv[2] || 300);

const testCode = `
const problems = [];
const stats = {};
const optKey = (o) => (typeof o === 'string' ? o : JSON.stringify(o));
for (const skill of Object.keys(SKILLS)) {
  for (let lv = 1; lv <= 5; lv++) {
    for (let i = 0; i < ${N}; i++) {
      const seed = 1000 + i * 7919 + lv * 104729;
      const spec = { skill, level: lv, seed };
      let q, q2;
      try { q = buildQuestion(spec); q2 = buildQuestion(spec); }
      catch (e) { problems.push([skill, lv, seed, 'THROW ' + e.message]); continue; }
      const tag = [skill, lv, seed];
      if (JSON.stringify(q) !== JSON.stringify(q2)) problems.push([...tag, 'not deterministic']);
      if (!Array.isArray(q.options) || q.options.length < 4) problems.push([...tag, 'too few options ' + (q.options && q.options.length)]);
      if (!(q.answer >= 0 && q.answer < q.options.length)) problems.push([...tag, 'bad answer index']);
      const keys = q.options.map(optKey);
      if (new Set(keys).size !== keys.length) problems.push([...tag, 'duplicate options ' + keys.join(' | ')]);
      const blob = JSON.stringify(q);
      if (/undefined|NaN|Infinity|\\[object/.test(blob)) problems.push([...tag, 'bad text: ' + blob.match(/.{0,40}(undefined|NaN|Infinity|\\[object).{0,40}/)[0]]);
      if (!q.explanation || !q.hint || !q.prompt) problems.push([...tag, 'missing text']);
      if (q.domain === 'matrix' && q.options.length !== 8) problems.push([...tag, 'matrix needs 8 options']);
      // series: the correct option must equal the hidden numbers
      if (q.domain === 'series') {
        const want = q.visual.blanks.map((b) => fmtItem(q.visual.seq[b])).join(' , ');
        if (q.options[q.answer] !== want) problems.push([...tag, 'series answer mismatch']);
        // no hidden value may be visible as another option-equal ambiguity: positive ints only when seq is int
      }
      if (q.domain === 'matrix') {
        const want = JSON.stringify(q.visual.grid[2][2]);
        if (JSON.stringify(q.options[q.answer]) !== want) problems.push([...tag, 'matrix answer mismatch']);
        // every row's rule must be consistent: check that grid has no identical full rows (degenerate)
        const rows = q.visual.grid.map((r) => JSON.stringify(r));
        if (lv >= 2 && new Set(rows).size < 2) problems.push([...tag, 'degenerate matrix']);
      }
      stats[skill] = (stats[skill] || 0) + 1;
    }
  }
}
// Rendering smoke test of every matrix option
for (let i = 0; i < 200; i++) {
  const q = buildQuestion({ skill: 'm_multi', level: 5, seed: 77 + i });
  q.options.forEach((o) => { const s = cellSvg(o); if (!s.startsWith('<svg') || /NaN|undefined/.test(s)) problems.push(['m_multi', 5, 77 + i, 'svg ' + s.slice(0, 80)]); });
}
problems;
`;
const ctx = vm.createContext({ console });
const problems = vm.runInContext(code + '\n' + testCode, ctx);
const bySkill = {};
problems.forEach((p) => { const k = p[0] + ' :: ' + String(p[3]).slice(0, 40); bySkill[k] = (bySkill[k] || 0) + 1; });
console.log('problem kinds:', bySkill);
console.log(problems.slice(0, 25).map((p) => p.join(' | ')).join('\n'));
console.log(problems.length === 0 ? 'ALL GOOD' : `${problems.length} problems`);
process.exit(problems.length ? 1 : 0);

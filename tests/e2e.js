// End-to-end smoke test: drives the built index.html through every screen and the whole 14-day plan.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e.js [outDir]
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const OUT = process.argv[2] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const problems = [];

async function run(viewport, tag, full) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`[${tag}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) problems.push(`[${tag}] console: ${m.text()}`); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(URL);
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${tag}-${n}.png`), fullPage: true });
  const badText = async (where) => {
    const t = await page.evaluate(() => document.getElementById('app').innerHTML);
    const m = t.match(/>[^<]*(NaN|undefined|\[object Object\])[^<]*</);
    if (m) problems.push(`[${tag}] bad text at ${where}: ${m[0].slice(0, 80)}`);
  };
  const overflow = async (where) => {
    await badText(where);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 1) problems.push(`[${tag}] horizontal overflow ${o}px at ${where}`);
  };
  const go = (r) => page.evaluate((r) => go(r), r);

  await shot('home'); await overflow('home');
  await page.click('text=התחל את יום 1');
  await shot('day1'); await overflow('day1');
  await page.click('text=על המבחן — מה מחכה לך');
  await shot('lesson-exam'); await overflow('lesson-exam');
  for (const id of Object.keys(await page.evaluate(() => LESSONS))) {
    await go(`lesson:${id}`);
    // click every demo "next" button a few times and answer every inline question
    const nexts = await page.$$('[data-s="next"]');
    await badText(`lesson-start:${id}`);
    for (const b of nexts) { for (let k = 0; k < 6; k++) await b.click(); }
    const tries = await page.$$('[data-try]');
    for (let t = 0; t < tries.length; t++) {
      const btn = await page.$(`[data-try]:nth-of-type(1) .opt`);
      const all = await page.$$('[data-try] .opt:not([disabled])');
      if (all.length) await all[0].click();
    }
    await overflow(`lesson:${id}`);
    if (['series1', 'matrix1', 'instr2'].includes(id)) await shot(`lesson-${id}`);
  }

  // A practice set by clicking like a user: right, wrong, hint x2, skip, demo
  await go('set:d1s2');
  await shot('set-prestart');
  await page.click('[data-act="startset"]');
  const answer = (right) => page.evaluate((right) => {
    const e = DB.sets[VIEW.id]; const q = Q(e.qs[VIEW.i].spec);
    const k = right ? q.answer : (q.answer + 1) % q.options.length;
    document.querySelector(`.opt[data-k="${k}"]`).click();
  }, right);
  await answer(true); await shot('q-right');
  await page.click('[data-act="demo"]'); await page.waitForTimeout(3000); await shot('q-demo');
  await page.click('#nextbtn');
  await answer(false); await shot('q-wrong');
  await page.click('#nextbtn');
  await page.click('[data-act="hint"]'); await page.click('[data-act="hint"]'); await shot('q-hint2');
  await page.click('[data-act="skip"]');
  await go('set:d1s2'); await shot('set-map'); await overflow('set-map');

  if (full) {
    // Walk the whole plan: every set, every question, rendering each one (catches generator/render errors).
    const sets = await page.evaluate(() => ALL_SETS.map((s) => ({ id: s.id, sim: s.sim || null, n: s.n })));
    let qCount = 0;
    for (const s of sets) {
      if (s.sim) continue;
      await go(`set:${s.id}`);
      if (await page.$('[data-act="startset"]')) await page.click('[data-act="startset"]');
      for (let i = 0; i < s.n; i++) {
        await go(`q:${s.id}:${i}`);
        const ok = await page.evaluate(() => {
          const e = DB.sets[VIEW.id]; const it = e.qs[VIEW.i]; if (it.st.ok !== null) return 'done';
          const q = Q(it.spec);
          const wrongs = q.options.map((_, j) => j).filter((j) => j !== q.answer && !it.st.elim.includes(j));
          const k = Math.random() < 0.75 || !wrongs.length ? q.answer : wrongs[0];
          const b = document.querySelector(`.opt[data-k="${k}"]`); if (!b) return 'nobutton';
          b.click(); return document.querySelector('.feedback') ? 'ok' : 'nofeedback';
        });
        if (ok !== 'ok' && ok !== 'done') problems.push(`[${tag}] ${s.id} q${i}: ${ok}`);
        qCount++;
        if (qCount % 97 === 0) await overflow(`${s.id}:${i}`);
        if (i % 4 === 0) { const d = await page.$('[data-act="demo"]'); if (d) { await d.click(); await badText(`demo ${s.id}:${i}`); } }
      }
    }
    console.log(`[${tag}] answered ${qCount} plan questions`);
    await go('day:5'); await shot('day5-progress');
    await go('home'); await shot('home-progress');

    // computer simulation (mini): answer via clicks
    await go('practice'); await page.click('[data-act="newsim"][data-k="mini"]');
    await page.click('[data-act="simcreate"]').catch(() => {});
    for (let sec = 0; sec < 3; sec++) {
      await page.click('[data-act="simstart"]');
      if (sec === 0) await shot('sim-run');
      for (let k = 0; k < 6; k++) {
        await page.click('.opt[data-k="0"]');
        await page.click('[data-act="simok"]');
      }
    }
    await shot('sim-results'); await overflow('sim-results');
    const simPct = await page.evaluate(() => Object.values(DB.sets).find((e) => e.def.sim === 'mini' && e.sim.phase === 'done')?.sim.score.pct);
    if (simPct === undefined) problems.push(`[${tag}] mini sim did not finish`);
    await page.click('.qmap .qtile'); await shot('sim-review');

    // class simulation: answer a few, end sections via confirm
    await go('practice'); await page.click('[data-act="newsim"][data-k="class"]');
    for (let sec = 0; sec < 3; sec++) {
      await page.click('[data-act="simstart"]');
      for (let k = 0; k < 4; k++) { await page.click('.opt[data-k="1"]'); if (await page.$('[data-act="simnext"]')) await page.click('[data-act="simnext"]'); }
      if (sec === 0) await shot('class-run');
      await page.click('[data-act="simend"]'); await page.click('.modal [data-x="ok"]');
    }
    await shot('class-results');
    const cls = await page.evaluate(() => Object.values(DB.sets).find((e) => e.def.sim === 'class')?.sim.phase);
    if (cls !== 'done') problems.push(`[${tag}] class sim phase ${cls}`);

    // computer sim with a timeout: force the deadline to the past
    await go('practice'); await page.click('[data-act="newsim"][data-k="computer"]');
    await page.click('[data-act="simstart"]');
    await page.evaluate(() => { const e = Object.values(DB.sets).find((x) => x.def.sim === 'computer'); e.sim.qDeadline = Date.now() - 10; });
    await page.waitForTimeout(600);
    const tq = await page.evaluate(() => { const e = Object.values(DB.sets).find((x) => x.def.sim === 'computer'); return e.qs[0].st.timeout; });
    if (!tq) problems.push(`[${tag}] computer sim timeout not recorded`);

    // timed practice set: force timeout
    await go('set:d11s1'); if (await page.$('[data-act="startset"]')) await page.click('[data-act="startset"]');
    await go('q:d11s1:0');
    const before = await page.evaluate(() => DB.sets.d11s1.qs[0].st.ok);
    if (before === null) {
      await page.evaluate(() => { VIEW.deadline = Date.now() - 10; });
      await page.waitForTimeout(600);
      const after = await page.evaluate(() => DB.sets.d11s1.qs[0].st.timeout);
      if (!after) problems.push(`[${tag}] timed question did not time out`);
    }
  }

  // practice, stats, settings
  await go('practice'); await shot('practice'); await overflow('practice');
  await page.click('[data-act="pf"][data-v="matrix"]');
  await page.click('[data-act="newfree"]'); await shot('free-matrix-q'); await overflow('free-matrix-q');
  await go('stats'); await shot('stats'); await overflow('stats');
  await page.click('[data-act="export"]');
  const code = await page.inputValue('#backup');
  if (!code.startsWith('{')) problems.push(`[${tag}] export empty`);
  await page.click('[data-act="import"]');
  await go('settings'); await page.click('[data-act="setting"][data-v="dark"]'); await go('home'); await shot('home-dark');
  await go('q:d3s1:0'); await shot('matrix-dark');
  await go('settings'); await page.click('[data-act="setting"][data-v="auto"]');
  // reload keeps progress
  await page.reload();
  const kept = await page.evaluate(() => DB.log.length);
  if (!kept) problems.push(`[${tag}] progress lost after reload`);
  await browser.close();
}

(async () => {
  await run({ width: 390, height: 844 }, 'phone', true);
  await run({ width: 1280, height: 900 }, 'desktop', false);
  console.log(problems.length ? problems.join('\n') : 'E2E ALL GOOD');
  process.exit(problems.length ? 1 : 0);
})();

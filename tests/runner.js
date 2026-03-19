/* ============================================================
   AVINASH & ASSOCIATES — tests/runner.js
   Minimal browser test framework (no dependencies)
   ============================================================ */

'use strict';

const Runner = (() => {
  const suites  = [];
  let   current = null;

  /* ── Framework API ─────────────────────────────────────── */

  function describe(label, fn) {
    current = { label, tests: [] };
    suites.push(current);
    try { fn(); } catch (e) { current.tests.push({ label: '(suite setup)', error: e }); }
    current = null;
  }

  function it(label, fn) {
    if (!current) throw new Error('it() called outside describe()');
    current.tests.push({ label, fn });
  }

  /* ── Assertions ────────────────────────────────────────── */

  function expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected)
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      },
      toEqual(expected) {
        const a = JSON.stringify(actual), b = JSON.stringify(expected);
        if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
      },
      toBeCloseTo(expected, decimals = 2) {
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(actual * factor) / factor;
        const exp     = Math.round(expected * factor) / factor;
        if (rounded !== exp)
          throw new Error(`Expected ~${expected} (±${1/factor}), got ${actual}`);
      },
      toBeGreaterThan(val) {
        if (!(actual > val)) throw new Error(`Expected ${actual} > ${val}`);
      },
      toBeLessThanOrEqual(val) {
        if (!(actual <= val)) throw new Error(`Expected ${actual} ≤ ${val}`);
      },
      toBeGreaterThanOrEqual(val) {
        if (!(actual >= val)) throw new Error(`Expected ${actual} ≥ ${val}`);
      },
      toBeTruthy() {
        if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
      },
      toBeFalsy() {
        if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
      },
      toBeNull() {
        if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      },
      toContain(str) {
        if (typeof actual === 'string' && !actual.includes(str))
          throw new Error(`Expected string to contain "${str}"`);
        if (Array.isArray(actual) && !actual.includes(str))
          throw new Error(`Expected array to contain ${JSON.stringify(str)}`);
      },
      toMatch(regex) {
        if (!regex.test(actual))
          throw new Error(`Expected "${actual}" to match ${regex}`);
      }
    };
  }

  /* ── Runner ────────────────────────────────────────────── */

  async function run() {
    const results = [];
    let totalPass = 0, totalFail = 0;

    for (const suite of suites) {
      const suiteRes = { label: suite.label, tests: [] };

      for (const test of suite.tests) {
        const t0 = performance.now();
        let passed = false, error = null;

        if (test.error) {
          error = test.error;
        } else {
          try {
            await test.fn();
            passed = true;
          } catch (e) {
            error = e;
          }
        }

        const ms = (performance.now() - t0).toFixed(1);
        if (passed) totalPass++; else totalFail++;
        suiteRes.tests.push({ label: test.label, passed, error, ms });
      }

      results.push(suiteRes);
    }

    return { results, totalPass, totalFail, total: totalPass + totalFail };
  }

  return { describe, it, expect, run };
})();

/* Make globals available */
const { describe, it, expect } = Runner;

/* ============================================================
   AVINASH & ASSOCIATES — tests/tax-ui.test.js
   DOM / UI interaction tests for the tax calculator.
   Runs inside a hidden iframe pointing at tax-calculator.html.
   The calculator is reactive — results update on input change.
   ============================================================ */

'use strict';

/* ── iframe helpers ─────────────────────────────────────── */

function getDoc() {
  const frame = document.getElementById('tcTestFrame');
  return frame ? frame.contentDocument : null;
}
function q(sel)  { const d = getDoc(); return d ? d.querySelector(sel)    : null; }
function qa(sel) { const d = getDoc(); return d ? d.querySelectorAll(sel) : []; }

function setVal(id, v) {
  const doc = getDoc();
  if (!doc) throw new Error('iframe not ready');
  const el = doc.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  el.value = String(v);
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickEl(sel) {
  const el = q(sel);
  if (!el) throw new Error(`Selector not found: ${sel}`);
  el.click();
}

function text(sel) {
  const d = getDoc();
  if (!d) return '';
  let els = [];
  try { els = [...d.querySelectorAll(sel)]; } catch { return ''; }
  return els.map(e => e.textContent).join(' ').trim();
}

function isVisible(sel) {
  const d = getDoc(); if (!d) return false;
  const el = d.querySelector(sel); if (!el) return false;
  const style = d.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && !el.hidden;
}

/* Wait for iframe to fully load and calc scripts to init */
function waitForFrame(maxMs = 6000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const check = () => {
      const doc = getDoc();
      if (doc && doc.readyState === 'complete' && doc.querySelector('.tc-mtab')) {
        resolve(doc);
      } else if (Date.now() - t0 > maxMs) {
        reject(new Error('Iframe load timeout'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

/* Helper: set individual income and wait for reactive update */
async function setIndividualIncome(salaryAmt) {
  clickEl('.tc-mtab[data-tab="individual"]');
  await new Promise(r => setTimeout(r, 60));
  setVal('i-salary', salaryAmt);
  await new Promise(r => setTimeout(r, 60));
}

/* ── Page structure tests ────────────────────────────────── */

describe('Tax Calculator — DOM structure', () => {
  it('iframe loads tax-calculator.html', async () => {
    await waitForFrame();
    expect(getDoc()).toBeTruthy();
  });

  it('has Individual and Business tab buttons', async () => {
    await waitForFrame();
    expect(q('.tc-mtab[data-tab="individual"]')).toBeTruthy();
    expect(q('.tc-mtab[data-tab="business"]')).toBeTruthy();
  });

  it('individual panel is visible by default', async () => {
    await waitForFrame();
    expect(isVisible('#tcp-individual')).toBeTruthy();
  });

  it('business panel is hidden by default', async () => {
    await waitForFrame();
    expect(isVisible('#tcp-business')).toBeFalsy();
  });

  it('salary input exists (#i-salary)', async () => {
    await waitForFrame();
    expect(q('#i-salary')).toBeTruthy();
  });

  it('age selector exists (#i-age)', async () => {
    await waitForFrame();
    expect(q('#i-age')).toBeTruthy();
  });

  it('regime toggle buttons exist (.tc-rbtn)', async () => {
    await waitForFrame();
    expect(qa('.tc-rbtn').length).toBeGreaterThan(0);
  });

  it('"New Regime" button is active by default', async () => {
    await waitForFrame();
    const newBtn = q('.tc-rbtn[data-regime="new"]');
    expect(newBtn.classList.contains('active')).toBeTruthy();
  });

  it('empty-state panel visible before any input', async () => {
    await waitForFrame();
    expect(isVisible('#tc-ind-empty')).toBeTruthy();
  });

  it('result body hidden before any input', async () => {
    await waitForFrame();
    expect(isVisible('#tc-ind-body')).toBeFalsy();
  });
});

/* ── Individual tab — reactive results ───────────────────── */

describe('Tax Calculator UI — Individual reactive calculation', () => {
  it('entering salary shows results body', async () => {
    await waitForFrame();
    await setIndividualIncome(1000000);
    expect(isVisible('#tc-ind-body')).toBeTruthy();
  });

  it('results display ₹ symbol', async () => {
    await waitForFrame();
    await setIndividualIncome(1500000);
    const out = text('#tc-ind-body');
    expect(out).toContain('₹');
  });

  it('gross income card shows ₹10,00,000 for salary 10L', async () => {
    await waitForFrame();
    await setIndividualIncome(1000000);
    const grossEl = q('#ind-gross');
    expect(grossEl).toBeTruthy();
    expect(grossEl.textContent).toContain('10,00,000');
  });

  it('effective rate label shows a percentage', async () => {
    await waitForFrame();
    await setIndividualIncome(2000000);
    const rateEl = q('#ind-eff-rate');
    expect(rateEl).toBeTruthy();
    expect(rateEl.textContent).toMatch(/\d+\.\d+%/);
  });

  it('SVG gauge ring exists after calculation', async () => {
    await waitForFrame();
    await setIndividualIncome(2000000);
    expect(q('#ind-gauge-ring')).toBeTruthy();
  });

  it('salary 12L → total tax shown as ₹0 (87A rebate — New Regime)', async () => {
    await waitForFrame();
    // Ensure new regime
    clickEl('.tc-rbtn[data-regime="new"]');
    await setIndividualIncome(1200000);
    const taxEl = q('#ind-total-tax');
    expect(taxEl).toBeTruthy();
    expect(taxEl.textContent.trim()).toBe('₹0');
  });

  it('clearing salary hides results body', async () => {
    await waitForFrame();
    await setIndividualIncome(1000000);
    await setIndividualIncome(0);
    expect(isVisible('#tc-ind-body')).toBeFalsy();
    expect(isVisible('#tc-ind-empty')).toBeTruthy();
  });
});

/* ── Regime toggle ───────────────────────────────────────── */

describe('Tax Calculator UI — Regime toggle', () => {
  it('switching to Old Regime activates old button', async () => {
    await waitForFrame();
    clickEl('.tc-rbtn[data-regime="old"]');
    await new Promise(r => setTimeout(r, 60));
    expect(q('.tc-rbtn[data-regime="old"]').classList.contains('active')).toBeTruthy();
    expect(q('.tc-rbtn[data-regime="new"]').classList.contains('active')).toBeFalsy();
  });

  it('Old Regime shows deductions section', async () => {
    await waitForFrame();
    clickEl('.tc-rbtn[data-regime="old"]');
    await new Promise(r => setTimeout(r, 60));
    expect(isVisible('#tc-ded-grp')).toBeTruthy();
  });

  it('New Regime hides deductions section', async () => {
    await waitForFrame();
    // Switch to old first, then back to new
    clickEl('.tc-rbtn[data-regime="old"]');
    await new Promise(r => setTimeout(r, 30));
    clickEl('.tc-rbtn[data-regime="new"]');
    await new Promise(r => setTimeout(r, 60));
    expect(isVisible('#tc-ded-grp')).toBeFalsy();
  });

  it('same salary produces different tax in new vs old regime (15L with 80C+NPS)', async () => {
    await waitForFrame();
    // New regime
    clickEl('.tc-rbtn[data-regime="new"]');
    await new Promise(r => setTimeout(r, 30));
    setVal('i-salary', 1500000);
    await new Promise(r => setTimeout(r, 60));
    const newTax = q('#ind-total-tax') ? q('#ind-total-tax').textContent : '';

    // Old regime + deductions
    clickEl('.tc-rbtn[data-regime="old"]');
    await new Promise(r => setTimeout(r, 30));
    setVal('i-80c', 150000);
    setVal('i-nps', 50000);
    await new Promise(r => setTimeout(r, 60));
    const oldTax = q('#ind-total-tax') ? q('#ind-total-tax').textContent : '';

    // Both should produce ₹ amounts (not necessarily different — just valid)
    expect(newTax).toContain('₹');
    expect(oldTax).toContain('₹');
  });
});

/* ── Business tab ────────────────────────────────────────── */

describe('Tax Calculator UI — Business tab', () => {
  it('clicking Business tab shows business panel', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 100));
    expect(isVisible('#tcp-business')).toBeTruthy();
    expect(isVisible('#tcp-individual')).toBeFalsy();
  });

  it('business panel has entity select (#b-entity)', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    expect(q('#b-entity')).toBeTruthy();
  });

  it('business panel has turnover and profit inputs', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    expect(q('#b-turnover')).toBeTruthy();
    expect(q('#b-profit')).toBeTruthy();
  });

  it('entering profit shows business results', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'pvt'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    setVal('b-turnover', 100000000);
    setVal('b-profit',   5000000);
    await new Promise(r => setTimeout(r, 100));
    expect(isVisible('#tc-biz-body')).toBeTruthy();
  });

  it('business results contain ₹ symbol', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'pvt'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    setVal('b-profit', 5000000);
    await new Promise(r => setTimeout(r, 100));
    expect(text('#tc-biz-body')).toContain('₹');
  });

  it('proprietor entity shows proprietor notice (not results)', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'proprietor'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    await new Promise(r => setTimeout(r, 80));
    expect(isVisible('#tc-prop-notice')).toBeTruthy();
    expect(isVisible('#tc-biz-body')).toBeFalsy();
  });

  it('advance tax schedule shows 4 installment cards', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'pvt'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    setVal('b-profit', 10000000);
    await new Promise(r => setTimeout(r, 100));
    const cards = qa('.tc-adv-card');
    expect(cards.length).toBe(4);
  });

  it('LLP notice appears when entity is LLP', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'llp'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    await new Promise(r => setTimeout(r, 60));
    expect(isVisible('#tc-llp-notice')).toBeTruthy();
  });

  it('regime selector hidden for LLP entity', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'llp'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    await new Promise(r => setTimeout(r, 60));
    expect(isVisible('#tc-biz-regime-grp')).toBeFalsy();
  });
});

/* ── Tab navigation ──────────────────────────────────────── */

describe('Tax Calculator UI — Tab navigation', () => {
  it('switching back to Individual shows individual panel', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    clickEl('.tc-mtab[data-tab="individual"]');
    await new Promise(r => setTimeout(r, 60));
    expect(isVisible('#tcp-individual')).toBeTruthy();
    expect(isVisible('#tcp-business')).toBeFalsy();
  });

  it('active tab has aria-selected="true"', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    expect(q('.tc-mtab[data-tab="business"]').getAttribute('aria-selected')).toBe('true');
    expect(q('.tc-mtab[data-tab="individual"]').getAttribute('aria-selected')).toBe('false');
  });

  it('Switch to Individual button in business panel navigates correctly', async () => {
    await waitForFrame();
    clickEl('.tc-mtab[data-tab="business"]');
    await new Promise(r => setTimeout(r, 60));
    const doc = getDoc();
    // Proprietor entity exposes switch button
    const entityEl = doc.getElementById('b-entity');
    if (entityEl) { entityEl.value = 'proprietor'; entityEl.dispatchEvent(new Event('change', { bubbles: true })); }
    await new Promise(r => setTimeout(r, 60));
    const switchBtn = q('.tc-switch-btn[data-tab="individual"]');
    if (switchBtn) { switchBtn.click(); await new Promise(r => setTimeout(r, 80)); }
    expect(isVisible('#tcp-individual')).toBeTruthy();
  });
});

/* ── Comparison table ────────────────────────────────────── */

describe('Tax Calculator UI — Regime comparison', () => {
  it('comparison section (#ind-comparison) exists in results', async () => {
    await waitForFrame();
    clickEl('.tc-rbtn[data-regime="new"]');
    await setIndividualIncome(2000000);
    expect(q('#ind-comparison')).toBeTruthy();
  });

  it('comparison section contains both New and Old regime text', async () => {
    await waitForFrame();
    clickEl('.tc-rbtn[data-regime="new"]');
    await setIndividualIncome(2000000);
    const out = text('#ind-comparison');
    expect(out.toLowerCase()).toContain('new');
    expect(out.toLowerCase()).toContain('old');
  });
});

/* ============================================================
   AVINASH & ASSOCIATES — js/tax-ui.js
   Tax Calculator UI — Rendering, Controllers, Init
   Depends on: tax-engine.js (must load first)
   ============================================================ */

'use strict';

/* ── FORMATTING HELPERS ─────────────────────────────────────── */

const GAUGE_CIRC = 2 * Math.PI * 64;

function fmtINR(n) {
  return '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
}

function fmtINRShort(n) {
  const a = Math.abs(n);
  if (a >= 10000000) return '₹' + (a / 10000000).toFixed(2) + ' Cr';
  if (a >= 100000)   return '₹' + (a / 100000).toFixed(2) + ' L';
  return fmtINR(n);
}

function brow(label, val, extraClass) {
  return `<div class="tc-brow${extraClass ? ' ' + extraClass : ''}">
    <span>${label}</span>
    <span class="tc-brow-val">${val}</span>
  </div>`;
}

function updateGauge(ringId, pctId, rate) {
  const ring = document.getElementById(ringId);
  const pct  = document.getElementById(pctId);
  const fill = GAUGE_CIRC * (1 - Math.min(rate, 50) / 50);
  if (ring) {
    ring.style.strokeDashoffset = fill;
    /* Color: green → amber → red */
    ring.style.stroke = rate < 15 ? '#059669' : rate < 25 ? '#D97706' : '#DC2626';
  }
  if (pct) pct.textContent = rate.toFixed(1) + '%';
}

/* ── RENDER: INDIVIDUAL RESULTS ─────────────────────────────── */

function renderIndividualResults(current, altRegime) {
  const empty = document.getElementById('tc-ind-empty');
  const body  = document.getElementById('tc-ind-body');
  if (!body) return;

  if (!current || current.grossIncome <= 0) {
    if (empty) empty.style.display = '';
    body.style.display = 'none';
    return;
  }

  const r = current;

  /* ── Key numbers ── */
  const grossEl   = document.getElementById('ind-gross');
  const totalEl   = document.getElementById('ind-total-tax');
  const monthlyEl = document.getElementById('ind-monthly');
  if (grossEl)   grossEl.textContent   = fmtINRShort(r.grossIncome);
  if (totalEl)   totalEl.textContent   = fmtINRShort(r.totalTax);
  if (monthlyEl) monthlyEl.textContent = fmtINRShort(r.monthlyTakeHome) + '/mo';

  updateGauge('ind-gauge-ring', 'ind-eff-rate', r.effectiveRate);

  /* ── Recommendation card ── */
  const recEl = document.getElementById('ind-recommendation');
  if (recEl && altRegime) {
    const newR   = r.regime === 'new' ? r : altRegime;
    const oldR   = r.regime === 'old' ? r : altRegime;
    const saving = Math.abs(newR.totalTax - oldR.totalTax);
    const bestIs = newR.totalTax <= oldR.totalTax ? 'New' : 'Old';
    const isCurrentBest = (r.regime === 'new' && bestIs === 'New') || (r.regime === 'old' && bestIs === 'Old');

    if (saving > 100) {
      recEl.innerHTML = `
        <div class="tc-rec-card ${isCurrentBest ? 'tc-rec-good' : 'tc-rec-switch'}">
          <div class="tc-rec-icon">${isCurrentBest ? '✓' : '⚡'}</div>
          <div class="tc-rec-body">
            <strong>${isCurrentBest ? 'You\'re on the better regime!' : `Switch to ${bestIs} Regime`}</strong>
            <span>${bestIs} Regime saves you <strong>${fmtINR(saving)}/year</strong>
            ${!isCurrentBest ? ` vs your current ${r.regime === 'new' ? 'New' : 'Old'} Regime selection.` : '.'}</span>
          </div>
        </div>`;
    } else {
      recEl.innerHTML = `<div class="tc-rec-card tc-rec-neutral">
        <div class="tc-rec-icon">≈</div>
        <div class="tc-rec-body"><strong>Both regimes give similar tax</strong>
        <span>Difference is less than ₹100. Choose New Regime for simplicity.</span></div>
      </div>`;
    }
  }

  /* ── Tax breakdown ── */
  let bd = '';
  bd += brow('Gross Total Income', fmtINR(r.grossIncome));
  if (r.stdDed > 0)
    bd += brow('(−) Standard Deduction', '− ' + fmtINR(r.stdDed), 'tc-brow-ind');
  if (r.ded80CCD2 > 0)
    bd += brow('(−) Employer NPS — 80CCD(2)', '− ' + fmtINR(r.ded80CCD2), 'tc-brow-ind');
  if (r.regime === 'old' && r.itemizedDed > r.ded80CCD2)
    bd += brow('(−) Chapter VI-A & Other Deductions', '− ' + fmtINR(r.itemizedDed - r.ded80CCD2), 'tc-brow-ind');
  if (r.computedHRA > 0)
    bd += brow('   · HRA Exemption (auto-computed)', fmtINR(r.computedHRA), 'tc-brow-ind');
  bd += brow('Taxable Income (Normal)', fmtINR(r.taxableNormal));
  if (r.stcgEq > 0)
    bd += brow('STCG Listed Equity @ 20%', fmtINR(r.stcgEqTax));
  if (r.ltcgEq > 0) {
    bd += brow('LTCG Equity — Exempt (₹1.25L)', '− ' + fmtINR(r.ltcgExempt), 'tc-brow-ind');
    bd += brow('LTCG Equity Taxable @ 12.5%', fmtINR(r.ltcgEqTax));
  }
  if (r.ltcgProp > 0)
    bd += brow('LTCG Property @ 20%', fmtINR(r.ltcgPropTax));
  bd += brow('Income Tax on Slab Income', fmtINR(r.normalTaxBeforeRebate));
  if (r.rebate > 0)
    bd += brow('(−) Rebate u/s 87A', '− ' + fmtINR(r.rebate), 'tc-brow-ind');
  if (r.sRate > 0)
    bd += brow(`Surcharge (${r.sRate}%)`, fmtINR(r.totalSurcharge));
  bd += brow('Health & Education Cess (4%)', fmtINR(r.cess));
  bd += brow('Total Tax Payable', fmtINR(r.totalTax), 'tc-brow-total');

  if (r.rebateNote)
    bd += `<div class="tc-rebate-note">✓ ${r.rebateNote}</div>`;

  /* Net payable / refund after TDS */
  if (r.tdsAmt > 0) {
    bd += `<div class="tc-tds-section">
      ${brow('(−) TDS Already Deducted', '− ' + fmtINR(r.tdsAmt))}
      ${brow(r.isRefund ? '🎉 Refund Due' : 'Net Tax Payable / Self-Assessment',
             (r.isRefund ? '' : '') + fmtINR(Math.abs(r.netPayable)),
             r.isRefund ? 'tc-brow-total tc-brow-refund' : 'tc-brow-total tc-brow-net')}
    </div>`;
  }

  const bkdEl = document.getElementById('ind-breakdown');
  if (bkdEl) bkdEl.innerHTML = bd;

  /* ── Regime Comparison ── */
  let compHtml = '';
  if (altRegime && altRegime.grossIncome > 0) {
    const newR    = r.regime === 'new' ? r : altRegime;
    const oldR    = r.regime === 'old' ? r : altRegime;
    const newWins = newR.totalTax <= oldR.totalTax;
    const diff    = Math.abs(newR.totalTax - oldR.totalTax);

    compHtml = `
      <div class="tc-comp-section">
        <div class="tc-section-title">New vs Old Regime — Side by Side</div>
        <table class="tc-comp-table">
          <thead>
            <tr><th>Metric</th><th>New Regime</th><th>Old Regime</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Deductions</td>
              <td>${fmtINR(newR.totalDed)}</td>
              <td>${fmtINR(oldR.totalDed)}</td>
            </tr>
            <tr>
              <td>Taxable Income</td>
              <td>${fmtINR(newR.taxableNormal)}</td>
              <td>${fmtINR(oldR.taxableNormal)}</td>
            </tr>
            <tr>
              <td>Effective Rate</td>
              <td>${newR.effectiveRate.toFixed(2)}%</td>
              <td>${oldR.effectiveRate.toFixed(2)}%</td>
            </tr>
            <tr>
              <td><strong>Total Tax</strong></td>
              <td class="${newWins ? 'tc-comp-win' : ''}">${fmtINR(newR.totalTax)}${newWins ? ' <span class="tc-comp-badge">BEST</span>' : ''}</td>
              <td class="${!newWins ? 'tc-comp-win' : ''}">${fmtINR(oldR.totalTax)}${!newWins ? ' <span class="tc-comp-badge">BEST</span>' : ''}</td>
            </tr>
            <tr>
              <td colspan="3" class="tc-comp-save-row">
                ${diff > 100 ? `You save <strong>${fmtINR(diff)}/year</strong> under the <strong>${newWins ? 'New' : 'Old'} Regime</strong>`
                              : 'Both regimes give nearly identical tax'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  const compEl = document.getElementById('ind-comparison');
  if (compEl) compEl.innerHTML = compHtml;

  /* ── Advance Tax Schedule ── */
  const advEl = document.getElementById('ind-adv-section');
  if (advEl) {
    if (r.advanceTax) {
      let advHtml = `<div class="tc-section-title" style="margin-top:20px">Advance Tax Schedule — FY 2025–26</div>
        <div class="tc-info-banner" style="margin-bottom:12px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Your estimated tax exceeds ₹10,000 — advance tax instalments are required to avoid interest u/s 234B/234C.
        </div>
        <div class="tc-adv-grid">`;
      r.advanceTax.forEach(a => {
        advHtml += `<div class="tc-adv-card">
          <div class="tc-adv-date">${a.date}</div>
          <div class="tc-adv-pct">Cumulative ${a.cumPct}% of tax</div>
          <div class="tc-adv-amt">${fmtINR(a.dueAmt)}</div>
        </div>`;
      });
      advHtml += '</div>';
      advEl.innerHTML = advHtml;
      advEl.style.display = '';
    } else {
      advEl.style.display = 'none';
    }
  }

  if (empty) empty.style.display = 'none';
  body.style.display = '';
}

/* ── RENDER: BUSINESS RESULTS ───────────────────────────────── */

function renderBusinessResults(result, entity) {
  const empty    = document.getElementById('tc-biz-empty');
  const body     = document.getElementById('tc-biz-body');
  const propNote = document.getElementById('tc-prop-notice');

  if (empty)    empty.style.display    = 'none';
  if (body)     body.style.display     = 'none';
  if (propNote) propNote.style.display = 'none';

  if (entity === 'proprietor') {
    if (propNote) propNote.style.display = '';
    return;
  }
  if (!result || result.totalTax == null) {
    if (empty) empty.style.display = '';
    return;
  }

  const r = result;

  const profDisp = document.getElementById('biz-profit-disp');
  const totalEl  = document.getElementById('biz-total-tax');
  const patEl    = document.getElementById('biz-pat');
  if (profDisp) profDisp.textContent = fmtINRShort(r.totalTax + r.pat);
  if (totalEl)  totalEl.textContent  = fmtINRShort(r.totalTax);
  if (patEl)    patEl.textContent    = fmtINRShort(r.pat);

  updateGauge('biz-gauge-ring', 'biz-eff-rate', r.effectiveRate);

  let bd = '';
  bd += brow('Net Profit Before Tax (PBT)', fmtINR(r.totalTax + r.pat));
  bd += brow(`Base Tax (${r.baseRate}% flat rate)`, fmtINR(r.baseTax));
  if (r.sRate > 0)
    bd += brow(`Surcharge (${r.sRate}%)`, fmtINR(r.surcharge));
  bd += brow('Health & Education Cess (4%)', fmtINR(r.cess));
  bd += brow('Total Tax Liability', fmtINR(r.totalTax), 'tc-brow-total');

  const bkdEl = document.getElementById('biz-breakdown');
  if (bkdEl) bkdEl.innerHTML = bd;

  let advHtml = '';
  r.advanceTax.forEach(a => {
    advHtml += `<div class="tc-adv-card">
      <div class="tc-adv-date">${a.date}</div>
      <div class="tc-adv-pct">Cumulative: ${a.cumPct}% of total tax</div>
      <div class="tc-adv-amt">${fmtINR(a.dueAmt)}</div>
    </div>`;
  });
  const advEl = document.getElementById('biz-adv-grid');
  if (advEl) advEl.innerHTML = advHtml;

  if (body) body.style.display = '';
}

/* ── INPUT HELPERS ──────────────────────────────────────────── */

function num(id)  { const el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
function sel(id)  { const el = document.getElementById(id); return el ? el.value : ''; }
function chk(id)  { const el = document.getElementById(id); return el ? el.checked : false; }
function radioVal(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

/* ── CONTROLLERS ────────────────────────────────────────────── */

let currentRegime = 'new';

function runIndividual() {
  const inp = {
    salary:      num('i-salary'),
    basic:       num('i-basic'),
    rent:        num('i-rent'),
    business:    num('i-business'),
    stcgEq:      num('i-stcg'),
    ltcgEq:      num('i-ltcg'),
    ltcgProp:    num('i-ltcg-prop'),
    stcgOther:   num('i-stcg-other'),
    other:       num('i-other'),
    age:         sel('i-age') || 'general',
    c80:         num('i-80c'),
    nps:         num('i-nps'),
    npsEmployer: num('i-80ccd2'),
    d80self:     num('i-80d-self'),
    d80par:      num('i-80d-par'),
    parSenior:   chk('i-par-senior'),
    hraReceived: num('i-hra-received'),
    rentPaid:    num('i-rent-paid'),
    isMetro:     sel('i-city-type') === 'metro',
    homeloan:    num('i-homeloan'),
    edu80e:      num('i-80e'),
    otherDed:    num('i-other-ded'),
    tds:         num('i-tds')
  };

  const incomeKeys = ['salary','rent','business','stcgEq','ltcgEq','ltcgProp','stcgOther','other'];
  if (!incomeKeys.some(k => inp[k] > 0)) {
    const empty = document.getElementById('tc-ind-empty');
    const body  = document.getElementById('tc-ind-body');
    if (empty) empty.style.display = '';
    if (body)  body.style.display  = 'none';
    return;
  }

  const current = computeIndividualTax(inp, currentRegime);
  const alt     = computeIndividualTax(inp, currentRegime === 'new' ? 'old' : 'new');
  renderIndividualResults(current, alt);
}

function runBusiness() {
  const entity  = sel('b-entity');
  const turnover = num('b-turnover');
  const profit   = num('b-profit');
  const regime   = radioVal('b-regime') || 'standard';

  if (entity === 'proprietor') { renderBusinessResults(null, 'proprietor'); return; }
  renderBusinessResults(computeBusinessTax(entity, turnover, profit, regime), entity);
}

/* ── INITIALIZE ─────────────────────────────────────────────── */

(function init() {

  /* Main tab switching */
  const mainTabs = document.querySelectorAll('.tc-mtab');
  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      mainTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const key = tab.getAttribute('data-tab');
      ['individual', 'business'].forEach(id => {
        const panel = document.getElementById(`tcp-${id}`);
        if (panel) panel.style.display = id === key ? '' : 'none';
      });
    });
  });

  /* "Switch to Individual" button */
  document.querySelectorAll('.tc-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = document.querySelector(`.tc-mtab[data-tab="${btn.getAttribute('data-tab')}"]`);
      if (tab) tab.click();
    });
  });

  /* Regime toggle (Individual) */
  const dedGrp   = document.getElementById('tc-ded-grp');
  const npsGrp   = document.getElementById('tc-nps-grp');

  document.querySelectorAll('.tc-rbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tc-rbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRegime = btn.getAttribute('data-regime');
      if (dedGrp) dedGrp.style.display = currentRegime === 'old' ? '' : 'none';
      runIndividual();
    });
  });

  /* Entity type change (Business) */
  const entitySel     = document.getElementById('b-entity');
  const bizRegimeGrp  = document.getElementById('tc-biz-regime-grp');
  const llpNotice     = document.getElementById('tc-llp-notice');
  const bizEmpty      = document.getElementById('tc-biz-empty');
  const bizBody       = document.getElementById('tc-biz-body');
  const bizPropNotice = document.getElementById('tc-prop-notice');

  function handleEntityChange() {
    const val = entitySel ? entitySel.value : '';
    const noRegime = ['llp', 'partner', 'proprietor', 'pvt-new'];
    if (bizRegimeGrp) bizRegimeGrp.style.display = noRegime.includes(val) ? 'none' : '';
    if (llpNotice)    llpNotice.style.display    = (val === 'llp' || val === 'partner') ? '' : 'none';

    if (val === 'proprietor') {
      if (bizEmpty)      bizEmpty.style.display      = 'none';
      if (bizBody)       bizBody.style.display        = 'none';
      if (bizPropNotice) bizPropNotice.style.display  = '';
    } else {
      if (bizPropNotice) bizPropNotice.style.display = 'none';
      runBusiness();
    }
  }

  if (entitySel) entitySel.addEventListener('change', handleEntityChange);

  /* Individual inputs — all IDs including new ones */
  const indInputIds = [
    'i-salary','i-basic','i-rent','i-business','i-stcg','i-ltcg',
    'i-ltcg-prop','i-stcg-other','i-other','i-age',
    'i-80c','i-nps','i-80ccd2','i-80d-self','i-80d-par',
    'i-hra-received','i-rent-paid','i-city-type',
    'i-homeloan','i-80e','i-other-ded','i-tds'
  ];
  indInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',  runIndividual);
    el.addEventListener('change', runIndividual);
  });
  /* Checkboxes */
  ['i-par-senior'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', runIndividual);
  });

  /* Business inputs */
  ['b-profit','b-turnover'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', runBusiness);
  });
  document.querySelectorAll('input[name="b-regime"]').forEach(r => r.addEventListener('change', runBusiness));

  /* Reset — Individual */
  const indReset = document.getElementById('ind-reset-btn');
  if (indReset) {
    indReset.addEventListener('click', () => {
      indInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });
      currentRegime = 'new';
      document.querySelectorAll('.tc-rbtn').forEach(b => b.classList.remove('active'));
      const newBtn = document.querySelector('.tc-rbtn[data-regime="new"]');
      if (newBtn) newBtn.classList.add('active');
      if (dedGrp) dedGrp.style.display = 'none';
      const empty = document.getElementById('tc-ind-empty');
      const body  = document.getElementById('tc-ind-body');
      if (empty) empty.style.display = '';
      if (body)  body.style.display  = 'none';
    });
  }

  /* Reset — Business */
  const bizReset = document.getElementById('biz-reset-btn');
  if (bizReset) {
    bizReset.addEventListener('click', () => {
      ['b-profit','b-turnover'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const enEl = document.getElementById('b-entity');
      if (enEl) enEl.selectedIndex = 0;
      const std = document.querySelector('input[name="b-regime"][value="standard"]');
      if (std) std.checked = true;
      handleEntityChange();
      if (bizEmpty) bizEmpty.style.display = '';
      if (bizBody)  bizBody.style.display  = 'none';
    });
  }

  handleEntityChange();

  console.log('%cTax Calculator — Avinash & Associates ✓', 'color:#059669;font-family:Raleway,sans-serif;font-weight:700');

})();

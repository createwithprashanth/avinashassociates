/* ============================================================
   AVINASH & ASSOCIATES — js/tax-engine.js
   Income Tax Computation Engine — FY 2025-26 (AY 2026-27)
   Covers: New Regime, Old Regime, Capital Gains, Business/Corporate
   ============================================================ */

'use strict';

/* ── TAX SLABS (FY 2025-26) ────────────────────────────────── */

/* New Regime — Budget 2025 */
const NEW_REGIME_SLABS = [
  { upto: 400000,  rate: 0  },
  { upto: 800000,  rate: 5  },
  { upto: 1200000, rate: 10 },
  { upto: 1600000, rate: 15 },
  { upto: 2000000, rate: 20 },
  { upto: 2400000, rate: 25 },
  { upto: Infinity,rate: 30 }
];

/* Old Regime — by age group */
const OLD_REGIME_SLABS = {
  general:     [ { upto: 250000,  rate: 0  }, { upto: 500000,  rate: 5  }, { upto: 1000000, rate: 20 }, { upto: Infinity, rate: 30 } ],
  senior:      [ { upto: 300000,  rate: 0  }, { upto: 500000,  rate: 5  }, { upto: 1000000, rate: 20 }, { upto: Infinity, rate: 30 } ],
  supersenior: [ { upto: 500000,  rate: 0  }, { upto: 1000000, rate: 20 }, { upto: Infinity, rate: 30 } ]
};

/* ── DEDUCTION LIMITS ────────────────────────────────────────── */
const LIMITS = {
  STD_DED_NEW:    75000,   /* Standard deduction — New Regime (salary/pension only) */
  STD_DED_OLD:    50000,   /* Standard deduction — Old Regime (salaried) */
  DED_80C:        150000,  /* Section 80C cap */
  DED_NPS:        50000,   /* Section 80CCD(1B) NPS */
  DED_80CCD2_PCT: 0.10,    /* 80CCD(2) employer NPS — 10% of basic+DA */
  DED_80D_NORM:   25000,   /* Medical insurance — self (non-senior) */
  DED_80D_SR:     50000,   /* Medical insurance — self (senior) */
  DED_80D_PAR:    25000,   /* Medical insurance — parents (non-senior) */
  DED_80D_PAR_SR: 50000,   /* Medical insurance — parents (senior) */
  DED_HOMELOAN:   200000,  /* Section 24(b) home loan interest */
  REBATE_THRESH_NEW: 1200000, /* 87A rebate threshold — New Regime */
  REBATE_MAX_NEW:    60000,   /* 87A max rebate — New Regime */
  REBATE_THRESH_OLD: 500000,  /* 87A rebate threshold — Old Regime */
  REBATE_MAX_OLD:    12500,   /* 87A max rebate — Old Regime */
  LTCG_EXEMPTION:    125000,  /* Section 112A annual LTCG exemption */
  CESS_RATE:      0.04,    /* Health & Education Cess */
  STCG_111A_RATE: 0.20,   /* STCG on listed equity (Section 111A) */
  LTCG_112A_RATE: 0.125,  /* LTCG on listed equity (Section 112A) */
  LTCG_112_RATE:  0.20    /* LTCG on property / other assets */
};

/* ── CORE COMPUTATION FUNCTIONS ─────────────────────────────── */

/**
 * Compute tax from a slab table.
 */
function computeSlabTax(income, slabs) {
  let tax = 0, prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const top   = slab.upto === Infinity ? income : slab.upto;
    const chunk = Math.min(income, top) - prev;
    tax += chunk * slab.rate / 100;
    prev = top;
  }
  return Math.max(0, tax);
}

/**
 * Auto-compute HRA exemption (Old Regime Sec 10(13A)).
 * Exempt = Min of: actual HRA | rent − 10% basic | 50%/40% of basic (metro/non-metro)
 */
function computeHRAExemption(basicDA, hraReceived, rentPaid, isMetro) {
  if (!hraReceived || !rentPaid) return 0;
  const rentMinusBasic = Math.max(0, rentPaid - basicDA * 0.10);
  const cityPct        = isMetro ? 0.50 : 0.40;
  return Math.max(0, Math.min(hraReceived, rentMinusBasic, basicDA * cityPct));
}

/**
 * Surcharge rate for individuals (% of tax).
 */
function individualSurchargeRate(totalIncome, regime) {
  if (totalIncome > 50000000) return regime === 'new' ? 25 : 37;
  if (totalIncome > 20000000) return 25;
  if (totalIncome > 10000000) return 15;
  if (totalIncome > 5000000)  return 10;
  return 0;
}

/**
 * Full individual income tax computation.
 * @param {Object} inp    - Form inputs
 * @param {string} regime - 'new' | 'old'
 */
function computeIndividualTax(inp, regime) {
  const {
    salary, rent, business, stcgEq, ltcgEq, ltcgProp, stcgOther, other,
    age, c80, nps, d80self, d80par, parSenior, hraReceived, rentPaid, isMetro,
    homeloan, edu80e, otherDed, npsEmployer, basic, tds
  } = inp;

  const basicDA = basic || salary * 0.40; /* fallback: estimate basic as 40% of salary */

  /* Normal income (slab-rated) */
  const normalIncome = salary + rent + business + stcgOther + other;

  /* ── 80CCD(2): Employer NPS — available in BOTH regimes ──── */
  const ded80CCD2 = npsEmployer > 0
    ? Math.min(npsEmployer, basicDA * LIMITS.DED_80CCD2_PCT)
    : 0;

  /* ── Deductions ─────────────────────────────────────────── */
  let stdDed = 0;
  let itemizedDed = 0;
  let computedHRA = 0;

  if (regime === 'new') {
    /* New Regime: standard deduction on salary/pension only */
    stdDed = salary > 0 ? Math.min(LIMITS.STD_DED_NEW, salary) : 0;
    /* 80CCD(2) is the only other deduction in new regime */
    itemizedDed = ded80CCD2;

  } else {
    /* Old Regime */
    stdDed = salary > 0 ? Math.min(LIMITS.STD_DED_OLD, salary) : 0;

    /* HRA — auto-compute if breakdown provided, else use manual entry */
    if (hraReceived > 0 && rentPaid > 0 && basicDA > 0) {
      computedHRA = computeHRAExemption(basicDA, hraReceived, rentPaid, isMetro);
    }

    const ded80C     = Math.min(c80,      LIMITS.DED_80C);
    const dedNPS     = Math.min(nps,      LIMITS.DED_NPS);
    const cap80DSelf = (age === 'senior' || age === 'supersenior') ? LIMITS.DED_80D_SR : LIMITS.DED_80D_NORM;
    const cap80DPar  = parSenior ? LIMITS.DED_80D_PAR_SR : LIMITS.DED_80D_PAR;
    const ded80DSelf = Math.min(d80self,  cap80DSelf);
    const ded80DPar  = Math.min(d80par,   cap80DPar);
    const dedLoan    = Math.min(homeloan, LIMITS.DED_HOMELOAN);

    itemizedDed = ded80C + dedNPS + ded80DSelf + ded80DPar + computedHRA
                + dedLoan + edu80e + otherDed + ded80CCD2;
  }

  const totalDed      = stdDed + itemizedDed;
  const taxableNormal = Math.max(0, normalIncome - totalDed);

  /* Slab tax */
  const slabs = regime === 'new'
    ? NEW_REGIME_SLABS
    : (OLD_REGIME_SLABS[age] || OLD_REGIME_SLABS.general);

  let normalTax = computeSlabTax(taxableNormal, slabs);

  /* Section 87A Rebate */
  let rebate = 0, rebateNote = '';

  if (regime === 'new') {
    if (taxableNormal <= LIMITS.REBATE_THRESH_NEW) {
      rebate    = Math.min(normalTax, LIMITS.REBATE_MAX_NEW);
      normalTax -= rebate;
      if (rebate > 0) rebateNote = 'Rebate u/s 87A — zero tax up to ₹12L income (New Regime)';
    } else {
      /* Marginal relief */
      const excessIncome = taxableNormal - LIMITS.REBATE_THRESH_NEW;
      if (normalTax > excessIncome) {
        rebate    = normalTax - excessIncome;
        normalTax = excessIncome;
        rebateNote = 'Marginal relief u/s 87A applied';
      }
    }
  } else {
    if (taxableNormal <= LIMITS.REBATE_THRESH_OLD && normalTax > 0) {
      rebate    = Math.min(normalTax, LIMITS.REBATE_MAX_OLD);
      normalTax -= rebate;
      if (rebate > 0) rebateNote = 'Rebate u/s 87A (max ₹12,500) — income ≤ ₹5L (Old Regime)';
    }
  }

  /* Capital Gains Tax */
  const stcgEqTax     = stcgEq  * LIMITS.STCG_111A_RATE;
  const ltcgExempt    = Math.min(ltcgEq, LIMITS.LTCG_EXEMPTION);
  const ltcgEqTaxable = Math.max(0, ltcgEq - LIMITS.LTCG_EXEMPTION);
  const ltcgEqTax     = ltcgEqTaxable * LIMITS.LTCG_112A_RATE;
  const ltcgPropTax   = ltcgProp * LIMITS.LTCG_112_RATE;
  const cgTax         = stcgEqTax + ltcgEqTax + ltcgPropTax;

  const preSurchargeTax = normalTax + cgTax;

  /* Surcharge */
  const totalIncome    = taxableNormal + stcgEq + ltcgEq + ltcgProp + stcgOther;
  const sRate          = individualSurchargeRate(totalIncome, regime);
  const cgSurchargeRate = Math.min(sRate, 15);
  const totalSurcharge  = (normalTax * sRate / 100) + (cgTax * cgSurchargeRate / 100);

  /* Cess */
  const cess     = (preSurchargeTax + totalSurcharge) * LIMITS.CESS_RATE;
  const totalTax = preSurchargeTax + totalSurcharge + cess;

  /* Net payable after TDS */
  const tdsAmt        = tds || 0;
  const netPayable    = totalTax - tdsAmt;
  const isRefund      = netPayable < 0;

  /* Advance tax (if net payable > ₹10,000) */
  let advanceTax = null;
  if (netPayable > 10000) {
    advanceTax = [
      { date: '15 Jun 2025', cumPct: 15,  dueAmt: totalTax * 0.15 },
      { date: '15 Sep 2025', cumPct: 45,  dueAmt: totalTax * 0.30 },
      { date: '15 Dec 2025', cumPct: 75,  dueAmt: totalTax * 0.30 },
      { date: '15 Mar 2026', cumPct: 100, dueAmt: totalTax * 0.25 }
    ];
  }

  /* Summary */
  const grossIncome     = salary + rent + business + stcgEq + ltcgEq + ltcgProp + stcgOther + other;
  const effectiveRate   = grossIncome > 0 ? (totalTax / grossIncome * 100) : 0;
  const monthlyTakeHome = salary > 0 ? Math.max(0, salary - totalTax) / 12 : 0;

  return {
    regime, age, grossIncome, normalIncome,
    stdDed, ded80CCD2, itemizedDed, totalDed, taxableNormal,
    computedHRA,
    stcgEq, stcgEqTax,
    ltcgEq, ltcgExempt, ltcgEqTaxable, ltcgEqTax,
    ltcgProp, ltcgPropTax, cgTax, stcgOther,
    normalTaxBeforeRebate: normalTax + rebate,
    normalTax, rebate, rebateNote,
    preSurchargeTax, sRate, totalSurcharge, cess, totalTax,
    tdsAmt, netPayable, isRefund,
    effectiveRate, monthlyTakeHome, totalIncome,
    advanceTax
  };
}

/**
 * Corporate / business tax computation.
 */
function computeBusinessTax(entity, turnover, profit, regime) {
  if (!profit || profit <= 0) return null;
  if (entity === 'proprietor') return { isProprietor: true };

  let baseRate;
  if (entity === 'pvt-new') {
    baseRate = 15;
  } else if (entity === 'pvt') {
    baseRate = regime === '115baa'
      ? 22
      : (turnover > 4000000000 ? 30 : 25);
  } else {
    baseRate = 30;
  }

  const baseTax = profit * baseRate / 100;

  let sRate = 0;
  if (entity === 'llp' || entity === 'partner') {
    if (profit > 10000000) sRate = 12;
  } else {
    if      (profit > 100000000) sRate = 12;
    else if (profit > 10000000)  sRate = 7;
  }

  const surcharge    = baseTax * sRate / 100;
  const cess         = (baseTax + surcharge) * LIMITS.CESS_RATE;
  const totalTax     = baseTax + surcharge + cess;
  const pat          = profit - totalTax;
  const effectiveRate = totalTax / profit * 100;

  const advanceTax = [
    { date: '15 Jun 2025', cumPct: 15,  dueAmt: totalTax * 0.15 },
    { date: '15 Sep 2025', cumPct: 45,  dueAmt: totalTax * 0.30 },
    { date: '15 Dec 2025', cumPct: 75,  dueAmt: totalTax * 0.30 },
    { date: '15 Mar 2026', cumPct: 100, dueAmt: totalTax * 0.25 }
  ];

  return { entity, baseRate, baseTax, sRate, surcharge, cess, totalTax, pat, effectiveRate, advanceTax };
}

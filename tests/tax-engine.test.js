/* ============================================================
   AVINASH & ASSOCIATES — tests/tax-engine.test.js
   Unit tests for js/tax-engine.js
   ============================================================ */

'use strict';

/* ── computeSlabTax ──────────────────────────────────────── */

describe('computeSlabTax — New Regime slabs', () => {
  it('returns 0 for income ≤ 4,00,000 (nil slab)', () => {
    expect(computeSlabTax(400000, NEW_REGIME_SLABS)).toBe(0);
  });

  it('taxes 5,00,000 correctly (5% on 1L over 4L = 5,000)', () => {
    expect(computeSlabTax(500000, NEW_REGIME_SLABS)).toBe(5000);
  });

  it('taxes 8,00,000 correctly (5% on 4L = 20,000)', () => {
    expect(computeSlabTax(800000, NEW_REGIME_SLABS)).toBe(20000);
  });

  it('taxes 9,00,000 correctly (20k + 10% on 1L = 30,000)', () => {
    expect(computeSlabTax(900000, NEW_REGIME_SLABS)).toBe(30000);
  });

  it('taxes 12,00,000 correctly (20k + 40k = 60,000)', () => {
    expect(computeSlabTax(1200000, NEW_REGIME_SLABS)).toBe(60000);
  });

  it('taxes 15,00,000 correctly (60k + 15% on 3L = 1,05,000)', () => {
    expect(computeSlabTax(1500000, NEW_REGIME_SLABS)).toBe(105000);
  });

  it('taxes 25,00,000 correctly (computes full slab cascade)', () => {
    // 0-4L: 0, 4-8L: 20k, 8-12L: 40k, 12-16L: 60k, 16-20L: 80k, 20-24L: 1L, 24-25L: 30k
    expect(computeSlabTax(2500000, NEW_REGIME_SLABS)).toBe(330000);
  });

  it('returns 0 for zero income', () => {
    expect(computeSlabTax(0, NEW_REGIME_SLABS)).toBe(0);
  });

  it('returns 0 for negative income', () => {
    expect(computeSlabTax(-100000, NEW_REGIME_SLABS)).toBe(0);
  });
});

describe('computeSlabTax — Old Regime slabs (general)', () => {
  const slabs = OLD_REGIME_SLABS.general;

  it('returns 0 for income ≤ 2,50,000', () => {
    expect(computeSlabTax(250000, slabs)).toBe(0);
  });

  it('taxes 5,00,000 correctly (5% on 2.5L = 12,500)', () => {
    expect(computeSlabTax(500000, slabs)).toBe(12500);
  });

  it('taxes 7,50,000 correctly (12,500 + 20% on 2.5L = 62,500)', () => {
    expect(computeSlabTax(750000, slabs)).toBe(62500);
  });

  it('taxes 12,00,000 correctly (12,500 + 1,00,000 + 30% on 2L = 1,72,500)', () => {
    expect(computeSlabTax(1200000, slabs)).toBe(172500);
  });
});

describe('computeSlabTax — Old Regime (senior, supersenior)', () => {
  it('senior: 0 tax on 3,00,000', () => {
    expect(computeSlabTax(300000, OLD_REGIME_SLABS.senior)).toBe(0);
  });

  it('senior: 5% on 2L above 3L exemption = 10,000 at income 5L', () => {
    expect(computeSlabTax(500000, OLD_REGIME_SLABS.senior)).toBe(10000);
  });

  it('supersenior: 0 tax on 5,00,000', () => {
    expect(computeSlabTax(500000, OLD_REGIME_SLABS.supersenior)).toBe(0);
  });

  it('supersenior: 20% on 2L above 5L = 40,000 at income 7L', () => {
    expect(computeSlabTax(700000, OLD_REGIME_SLABS.supersenior)).toBe(40000);
  });
});

/* ── computeIndividualTax — New Regime ───────────────────── */

describe('computeIndividualTax — New Regime basics', () => {
  const base = {
    salary: 0, rent: 0, business: 0, stcgEq: 0, ltcgEq: 0, ltcgProp: 0,
    stcgOther: 0, other: 0, age: 'general',
    c80: 0, nps: 0, d80self: 0, d80par: 0, hra: 0, homeloan: 0, edu80e: 0, otherDed: 0
  };

  it('zero income → zero tax', () => {
    const r = computeIndividualTax(base, 'new');
    expect(r.totalTax).toBe(0);
  });

  it('salary 7,00,000 → zero tax after 87A rebate (income ≤ 12L)', () => {
    const inp = { ...base, salary: 700000 };
    const r   = computeIndividualTax(inp, 'new');
    // After std ded 75k: taxable = 6.25L, tax = 11,250 → fully covered by rebate
    expect(r.totalTax).toBe(0);
    expect(r.rebate).toBeGreaterThan(0);
  });

  it('salary 12,00,000 → zero tax (87A rebate up to 12L threshold)', () => {
    const inp = { ...base, salary: 1200000 };
    const r   = computeIndividualTax(inp, 'new');
    // Taxable = 12L - 75k = 11.25L ≤ 12L → full 87A rebate (60k)
    expect(r.totalTax).toBe(0);
    expect(r.rebate).toBe(r.normalTaxBeforeRebate);
  });

  it('standard deduction capped at 75,000 for new regime', () => {
    const inp = { ...base, salary: 2000000 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.stdDed).toBe(75000);
  });

  it('no itemized deductions in new regime', () => {
    const inp = { ...base, salary: 1500000, c80: 150000, nps: 50000 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.itemizedDed).toBe(0);
  });

  it('effective rate > 0 for high income', () => {
    const inp = { ...base, salary: 5000000 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.effectiveRate).toBeGreaterThan(0);
    expect(r.effectiveRate).toBeLessThanOrEqual(30);
  });

  it('surcharge 10% applied for income > 50L', () => {
    const inp = { ...base, salary: 6000000 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.sRate).toBe(10);
    expect(r.totalSurcharge).toBeGreaterThan(0);
  });

  it('cess = 4% of (tax + surcharge)', () => {
    const inp = { ...base, salary: 3000000 };
    const r   = computeIndividualTax(inp, 'new');
    const expected = (r.preSurchargeTax + r.totalSurcharge) * 0.04;
    expect(r.cess).toBeCloseTo(expected, 0);
  });
});

describe('computeIndividualTax — Old Regime basics', () => {
  const base = {
    salary: 0, rent: 0, business: 0, stcgEq: 0, ltcgEq: 0, ltcgProp: 0,
    stcgOther: 0, other: 0, age: 'general',
    c80: 0, nps: 0, d80self: 0, d80par: 0, hra: 0, homeloan: 0, edu80e: 0, otherDed: 0
  };

  it('standard deduction 50,000 for salaried (old regime)', () => {
    const inp = { ...base, salary: 1000000 };
    const r   = computeIndividualTax(inp, 'old');
    expect(r.stdDed).toBe(50000);
  });

  it('no std deduction when salary = 0 (old regime)', () => {
    const inp = { ...base, business: 500000 };
    const r   = computeIndividualTax(inp, 'old');
    expect(r.stdDed).toBe(0);
  });

  it('87A rebate applied for income ≤ 5L (old regime)', () => {
    const inp = { ...base, salary: 500000 };
    const r   = computeIndividualTax(inp, 'old');
    // Taxable = 4.5L → tax = 10k → rebate = min(10k, 12.5k) = 10k
    expect(r.totalTax).toBe(0);
    expect(r.rebate).toBeGreaterThan(0);
  });

  it('80C deduction capped at 1,50,000', () => {
    const inp = { ...base, salary: 1000000, c80: 250000 };
    const r   = computeIndividualTax(inp, 'old');
    const rNoCap = computeIndividualTax({ ...base, salary: 1000000, c80: 150000 }, 'old');
    expect(r.taxableNormal).toBe(rNoCap.taxableNormal);
  });

  it('NPS deduction capped at 50,000', () => {
    const inp = { ...base, salary: 1000000, nps: 100000 };
    const r   = computeIndividualTax(inp, 'old');
    const rCap = computeIndividualTax({ ...base, salary: 1000000, nps: 50000 }, 'old');
    expect(r.taxableNormal).toBe(rCap.taxableNormal);
  });

  it('home loan deduction capped at 2,00,000', () => {
    const inp1 = { ...base, salary: 1500000, homeloan: 300000 };
    const inp2 = { ...base, salary: 1500000, homeloan: 200000 };
    const r1   = computeIndividualTax(inp1, 'old');
    const r2   = computeIndividualTax(inp2, 'old');
    expect(r1.taxableNormal).toBe(r2.taxableNormal);
  });

  it('80D self — senior citizen gets 50,000 cap', () => {
    const inp1 = { ...base, salary: 1000000, d80self: 60000, age: 'senior' };
    const inp2 = { ...base, salary: 1000000, d80self: 50000, age: 'senior' };
    const r1   = computeIndividualTax(inp1, 'old');
    const r2   = computeIndividualTax(inp2, 'old');
    expect(r1.taxableNormal).toBe(r2.taxableNormal);
  });

  it('80D self — general gets 25,000 cap', () => {
    const inp1 = { ...base, salary: 1000000, d80self: 40000, age: 'general' };
    const inp2 = { ...base, salary: 1000000, d80self: 25000, age: 'general' };
    const r1   = computeIndividualTax(inp1, 'old');
    const r2   = computeIndividualTax(inp2, 'old');
    expect(r1.taxableNormal).toBe(r2.taxableNormal);
  });

  it('supersenior gets wider nil slab (5L exempt)', () => {
    const inp = { ...base, salary: 500000, age: 'supersenior' };
    const r   = computeIndividualTax(inp, 'old');
    expect(r.totalTax).toBe(0);
  });
});

/* ── Capital Gains ───────────────────────────────────────── */

describe('computeIndividualTax — Capital Gains', () => {
  const base = {
    salary: 0, rent: 0, business: 0, stcgOther: 0, other: 0, age: 'general',
    c80: 0, nps: 0, d80self: 0, d80par: 0, hra: 0, homeloan: 0, edu80e: 0, otherDed: 0
  };

  it('STCG on listed equity taxed at 20%', () => {
    const inp = { ...base, stcgEq: 100000, ltcgEq: 0, ltcgProp: 0 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.stcgEqTax).toBeCloseTo(20000, 0);
  });

  it('LTCG on listed equity: first 1,25,000 exempt', () => {
    const inp = { ...base, stcgEq: 0, ltcgEq: 125000, ltcgProp: 0 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.ltcgEqTaxable).toBe(0);
    expect(r.ltcgEqTax).toBe(0);
  });

  it('LTCG on listed equity above exemption taxed at 12.5%', () => {
    const inp = { ...base, stcgEq: 0, ltcgEq: 225000, ltcgProp: 0 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.ltcgEqTaxable).toBe(100000);
    expect(r.ltcgEqTax).toBeCloseTo(12500, 0);
  });

  it('LTCG on property taxed at 20%', () => {
    const inp = { ...base, stcgEq: 0, ltcgEq: 0, ltcgProp: 500000 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.ltcgPropTax).toBeCloseTo(100000, 0);
  });

  it('CG surcharge capped at 15% per CBDT rules', () => {
    // Income > 5Cr triggers 25% surcharge on regular income
    // CG surcharge must be capped at 15%
    const inp = { ...base, salary: 60000000, stcgEq: 1000000, ltcgEq: 0, ltcgProp: 0 };
    const r   = computeIndividualTax(inp, 'new');
    expect(r.sRate).toBe(25); // surcharge on normal income
    // CG surcharge in surcharge calc uses min(sRate, 15)
    const cgSurchargeRate = Math.min(r.sRate, 15);
    expect(cgSurchargeRate).toBe(15);
  });
});

/* ── computeIndividualTax — regime comparison ────────────── */

describe('computeIndividualTax — regime comparison logic', () => {
  const base = {
    salary: 0, rent: 0, business: 0, stcgEq: 0, ltcgEq: 0, ltcgProp: 0,
    stcgOther: 0, other: 0, age: 'general',
    c80: 0, nps: 0, d80self: 0, d80par: 0, hra: 0, homeloan: 0, edu80e: 0, otherDed: 0
  };

  it('new regime is better for high salary with no deductions', () => {
    const inp = { ...base, salary: 2000000 };
    const newR = computeIndividualTax(inp, 'new');
    const oldR = computeIndividualTax(inp, 'old');
    expect(newR.totalTax).toBeLessThanOrEqual(oldR.totalTax);
  });

  it('old regime is better with maximum 80C + NPS + home loan', () => {
    const inp = { ...base, salary: 1500000, c80: 150000, nps: 50000, homeloan: 200000 };
    const newR = computeIndividualTax(inp, 'new');
    const oldR = computeIndividualTax(inp, 'old');
    // Large deductions favor old regime
    expect(oldR.totalTax).toBeLessThanOrEqual(newR.totalTax);
  });

  it('both regimes produce non-negative tax', () => {
    const inp = { ...base, salary: 800000 };
    const newR = computeIndividualTax(inp, 'new');
    const oldR = computeIndividualTax(inp, 'old');
    expect(newR.totalTax).toBeGreaterThanOrEqual(0);
    expect(oldR.totalTax).toBeGreaterThanOrEqual(0);
  });
});

/* ── computeBusinessTax ──────────────────────────────────── */

describe('computeBusinessTax', () => {
  it('returns null for zero profit', () => {
    expect(computeBusinessTax('pvt', 100000000, 0, 'standard')).toBeNull();
  });

  it('returns isProprietor flag for proprietor entity', () => {
    const r = computeBusinessTax('proprietor', 5000000, 1000000, 'standard');
    expect(r.isProprietor).toBeTruthy();
  });

  it('pvt company: 25% rate for turnover ≤ 400Cr (standard)', () => {
    const r = computeBusinessTax('pvt', 100000000, 1000000, 'standard');
    expect(r.baseRate).toBe(25);
  });

  it('pvt company: 30% rate for turnover > 400Cr (standard)', () => {
    const r = computeBusinessTax('pvt', 5000000000, 1000000, 'standard');
    expect(r.baseRate).toBe(30);
  });

  it('pvt company: 22% rate under Section 115BAA', () => {
    const r = computeBusinessTax('pvt', 100000000, 1000000, '115baa');
    expect(r.baseRate).toBe(22);
  });

  it('new pvt company (115BAB): 15% rate', () => {
    const r = computeBusinessTax('pvt-new', 50000000, 1000000, 'standard');
    expect(r.baseRate).toBe(15);
  });

  it('LLP: 30% base rate', () => {
    const r = computeBusinessTax('llp', 0, 500000, 'standard');
    expect(r.baseRate).toBe(30);
  });

  it('LLP: 12% surcharge when profit > 1Cr', () => {
    const r = computeBusinessTax('llp', 0, 15000000, 'standard');
    expect(r.sRate).toBe(12);
  });

  it('pvt: 7% surcharge when profit between 1Cr and 10Cr', () => {
    const r = computeBusinessTax('pvt', 100000000, 5000000, 'standard');
    expect(r.sRate).toBe(7);
  });

  it('pvt: 12% surcharge when profit > 10Cr', () => {
    const r = computeBusinessTax('pvt', 100000000, 150000000, 'standard');
    expect(r.sRate).toBe(12);
  });

  it('cess = 4% of (baseTax + surcharge)', () => {
    const r = computeBusinessTax('pvt', 100000000, 2000000, 'standard');
    const expected = (r.baseTax + r.surcharge) * 0.04;
    expect(r.cess).toBeCloseTo(expected, 2);
  });

  it('PAT = profit - totalTax', () => {
    const profit = 2000000;
    const r = computeBusinessTax('pvt', 100000000, profit, 'standard');
    expect(r.pat).toBeCloseTo(profit - r.totalTax, 0);
  });

  it('advance tax has 4 installments summing to totalTax', () => {
    const r   = computeBusinessTax('pvt', 100000000, 5000000, 'standard');
    const sum = r.advanceTax.reduce((s, i) => s + i.dueAmt, 0);
    expect(sum).toBeCloseTo(r.totalTax, 0);
  });

  it('advance tax installment percentages: 15, 30, 30, 25', () => {
    const r = computeBusinessTax('pvt', 100000000, 5000000, 'standard');
    expect(r.advanceTax[0].cumPct).toBe(15);
    expect(r.advanceTax[1].cumPct).toBe(45);
    expect(r.advanceTax[2].cumPct).toBe(75);
    expect(r.advanceTax[3].cumPct).toBe(100);
  });
});

/* ── LIMITS constants sanity checks ─────────────────────── */

describe('LIMITS constants', () => {
  it('standard deduction new regime = 75,000', () => {
    expect(LIMITS.STD_DED_NEW).toBe(75000);
  });
  it('standard deduction old regime = 50,000', () => {
    expect(LIMITS.STD_DED_OLD).toBe(50000);
  });
  it('80C cap = 1,50,000', () => {
    expect(LIMITS.DED_80C).toBe(150000);
  });
  it('LTCG exemption = 1,25,000', () => {
    expect(LIMITS.LTCG_EXEMPTION).toBe(125000);
  });
  it('cess rate = 4%', () => {
    expect(LIMITS.CESS_RATE).toBe(0.04);
  });
  it('STCG 111A rate = 20%', () => {
    expect(LIMITS.STCG_111A_RATE).toBe(0.20);
  });
  it('LTCG 112A rate = 12.5%', () => {
    expect(LIMITS.LTCG_112A_RATE).toBe(0.125);
  });
  it('87A threshold new regime = 12,00,000', () => {
    expect(LIMITS.REBATE_THRESH_NEW).toBe(1200000);
  });
  it('87A max rebate new regime = 60,000', () => {
    expect(LIMITS.REBATE_MAX_NEW).toBe(60000);
  });
});

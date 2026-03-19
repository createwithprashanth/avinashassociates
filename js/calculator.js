/* ============================================================
   AVINASH & ASSOCIATES — js/calculator.js
   Service Fee Calculator — 3-step wizard
   ============================================================ */

'use strict';

(function initCalculator() {
  const panel1 = document.getElementById('calc-panel-1');
  const panel2 = document.getElementById('calc-panel-2');
  const panel3 = document.getElementById('calc-panel-3');
  if (!panel1 || !panel2 || !panel3) return;

  const steps = document.querySelectorAll('.calc-step');

  /* ── Fee data ────────────────────────────────────────────── */
  const feeData = {
    individual: {
      label: 'Individual / Salaried',
      services: [
        { name: 'ITR Filing (Salary Income)',        range: [999,  2499],  time: '2–3 days',  note: 'Form 16 based filing with e-verification' },
        { name: 'ITR Filing (Business / F&O)',       range: [2499, 5999],  time: '3–5 days',  note: 'P&L audit, capital gains computation' },
        { name: 'Capital Gains Tax Filing',          range: [1999, 4499],  time: '3–5 days',  note: 'Equity, MF, property gains covered' },
        { name: 'Tax Planning Advisory',             range: [2000, 4000],  time: '1–2 days',  note: 'Investment-linked tax saving strategies' },
        { name: 'Notice Reply / Assessment Help',    range: [3000, 8000],  time: '3–7 days',  note: 'Drafting + representation before AO' }
      ]
    },
    startup: {
      label: 'Startup / New Business',
      services: [
        { name: 'Private Limited Incorporation',     range: [5999, 9999],  time: '7–10 days', note: 'MCA filing, DSC, DIN included' },
        { name: 'LLP Registration',                  range: [4999, 7999],  time: '5–7 days',  note: 'LLP agreement drafting included' },
        { name: 'GST Registration',                  range: [1499, 2999],  time: '3–5 days',  note: 'GSTIN + ARN certificate' },
        { name: 'Startup India Recognition',         range: [3000, 6000],  time: '5–7 days',  note: 'DPIIT recognition + tax exemption filing' },
        { name: 'Bookkeeping (Monthly)',              range: [3000, 8000],  time: 'Ongoing',   note: 'Tally / cloud-based books maintenance' }
      ]
    },
    sme: {
      label: 'SME / Established Business',
      services: [
        { name: 'GST Return Filing (Monthly)',       range: [1500, 4000],  time: 'Monthly',   note: 'GSTR-1, 3B, 2A reconciliation' },
        { name: 'Annual Statutory Audit',            range: [15000, 40000],time: '2–4 weeks', note: 'As per Companies Act 2013' },
        { name: 'Tax Audit (Section 44AB)',          range: [8000, 20000], time: '1–2 weeks', note: 'Form 3CB/3CD preparation' },
        { name: 'ROC Annual Filing',                 range: [3999, 7999],  time: '5–7 days',  note: 'AOC-4, MGT-7 and DIR-3 KYC' },
        { name: 'Payroll Processing (Monthly)',      range: [2500, 6000],  time: 'Monthly',   note: 'Salary slips, PF, ESI, PT compliance' }
      ]
    },
    nri: {
      label: 'NRI / Foreign Income',
      services: [
        { name: 'NRI ITR Filing',                    range: [3999, 8999],  time: '3–5 days',  note: 'DTAA benefit, foreign income disclosure' },
        { name: 'FEMA / RBI Compliance',             range: [5000, 15000], time: '5–10 days', note: 'Inward remittance, property purchase' },
        { name: 'NRO / NRE Account Advisory',        range: [2000, 4000],  time: '1–2 days',  note: 'Repatriation limits and documentation' },
        { name: 'Property Transaction (NRI)',         range: [8000, 20000], time: '7–15 days', note: 'TDS on sale, 15CA/CB certificates' },
        { name: 'Succession / Will Planning',         range: [10000, 25000],time: '1–3 weeks', note: 'Cross-border estate planning advice' }
      ]
    },
    corporate: {
      label: 'Corporate / Large Enterprise',
      services: [
        { name: 'Transfer Pricing Study',            range: [40000, 100000],time: '3–6 weeks', note: 'Form 3CEB, benchmarking analysis' },
        { name: 'Corporate Tax Advisory',            range: [15000, 50000], time: '1–2 weeks', note: 'Advance tax, MAT, deferred tax' },
        { name: 'GST Litigation Support',            range: [10000, 40000], time: 'Case-based', note: 'Notices, orders, appellate forum' },
        { name: 'Due Diligence (M&A)',               range: [50000, 200000],time: '3–8 weeks', note: 'Financial, legal, tax DD reports' },
        { name: 'CFO / Controllership Services',     range: [25000, 60000], time: 'Monthly',   note: 'MIS, budget, board reporting support' }
      ]
    }
  };

  let selectedProfile = null;
  let selectedService = null;

  /* ── Step management ────────────────────────────────────── */
  function setStep(n) {
    steps.forEach((s, i) => {
      s.classList.toggle('active', i + 1 === n);
      s.classList.toggle('done',   i + 1 < n);
    });
    [panel1, panel2, panel3].forEach((p, i) => p.classList.toggle('hidden', i + 1 !== n));
  }

  /* ── Step 1: Profile selection ──────────────────────────── */
  panel1.querySelectorAll('.calc-profile-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedProfile = btn.getAttribute('data-profile');
      panel1.querySelectorAll('.calc-profile-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const list = document.getElementById('calc-service-list');
      if (!list) return;
      list.innerHTML = '';

      const profileData = feeData[selectedProfile];
      if (!profileData) return;

      profileData.services.forEach((svc, idx) => {
        const b = document.createElement('button');
        b.className = 'calc-service-btn';
        b.setAttribute('data-idx', idx);
        b.innerHTML =
          '<span class="csb-name">' + svc.name + '</span>' +
          '<span class="csb-range">₹' + svc.range[0].toLocaleString('en-IN') +
          ' – ₹' + svc.range[1].toLocaleString('en-IN') + '</span>';
        b.addEventListener('click', () => selectService(idx));
        list.appendChild(b);
      });

      setTimeout(() => setStep(2), 180);
    });
  });

  /* ── Step 2: Back button ────────────────────────────────── */
  const backBtn1 = document.getElementById('calc-back-1');
  if (backBtn1) {
    backBtn1.addEventListener('click', () => {
      selectedProfile = null;
      panel1.querySelectorAll('.calc-profile-btn').forEach(b => b.classList.remove('active'));
      setStep(1);
    });
  }

  /* ── Step 2 → Step 3: Service selection ─────────────────── */
  function selectService(idx) {
    const profileData = feeData[selectedProfile];
    if (!profileData) return;
    selectedService = profileData.services[idx];

    const nameEl = document.getElementById('calc-result-service');
    const fromEl = document.getElementById('calc-range-from');
    const toEl   = document.getElementById('calc-range-to');
    const timeEl = document.getElementById('calc-meta-time');
    const noteEl = document.getElementById('calc-meta-note');

    if (nameEl) nameEl.textContent = selectedService.name;
    if (timeEl) timeEl.textContent = 'Turnaround: ' + selectedService.time;
    if (noteEl) noteEl.textContent = selectedService.note;

    setStep(3);

    /* Animated count-up */
    const from  = selectedService.range[0];
    const to    = selectedService.range[1];
    const dur   = 900;
    const start = performance.now();

    function countUp(now) {
      const p    = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (fromEl) fromEl.textContent = '₹' + Math.round(ease * from).toLocaleString('en-IN');
      if (toEl)   toEl.textContent   = '₹' + Math.round(ease * to).toLocaleString('en-IN');
      if (p < 1) {
        requestAnimationFrame(countUp);
      } else {
        if (fromEl) fromEl.textContent = '₹' + from.toLocaleString('en-IN');
        if (toEl)   toEl.textContent   = '₹' + to.toLocaleString('en-IN');
      }
    }
    setTimeout(() => requestAnimationFrame(countUp), 120);
  }

  /* ── Step 3: Back button ────────────────────────────────── */
  const backBtn2 = document.getElementById('calc-back-2');
  if (backBtn2) backBtn2.addEventListener('click', () => setStep(2));

  /* ── Reset ──────────────────────────────────────────────── */
  const resetBtn = document.getElementById('calc-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedProfile = null;
      selectedService = null;
      panel1.querySelectorAll('.calc-profile-btn').forEach(b => b.classList.remove('active'));
      setStep(1);
    });
  }

  setStep(1);
})();

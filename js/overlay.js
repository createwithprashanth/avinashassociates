/* ============================================================
   AVINASH & ASSOCIATES — js/overlay.js
   Tax Calculator Overlay — iframe slide-up panel
   ============================================================ */

'use strict';

(function initTaxCalcOverlay() {
  const overlay  = document.getElementById('tcoOverlay');
  const frame    = document.getElementById('tcoFrame');
  const closeBtn = document.getElementById('tcoClose');
  if (!overlay || !frame) return;

  let loaded = false;

  /* Push iframe below the fixed navbar */
  function updateFrameTop() {
    const navbar = document.querySelector('.navbar');
    const topBar = document.querySelector('.top-bar');
    const navH   = navbar  ? navbar.getBoundingClientRect().height  : 72;
    const tbH    = topBar  ? topBar.getBoundingClientRect().height  : 0;
    frame.style.marginTop = (tbH + navH) + 'px';
  }

  function openOverlay() {
    if (!loaded) {
      frame.src = 'tax-calculator.html?embed=1';
      loaded = true;
    }
    updateFrameTop();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tco-open');   /* CSS handles scroll-lock + navbar color */
    setTimeout(() => closeBtn && closeBtn.focus(), 60);
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tco-open');
  }

  /* Open when any link pointing to tax-calculator.html is clicked */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href="tax-calculator.html"]');
    if (!link) return;
    e.preventDefault();
    openOverlay();
  });

  /* Clicking the navbar area closes the overlay */
  document.addEventListener('click', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.target.closest('a[href="tax-calculator.html"]')) return;
    if (e.target.closest('.top-bar') || e.target.closest('.navbar')) closeOverlay();
  });

  closeBtn && closeBtn.addEventListener('click', closeOverlay);

  /* ESC key */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
  });

  /* PostMessage from iframe (← Main Website button in embed mode) */
  window.addEventListener('message', e => {
    if (e.data && e.data.type === 'closeTaxCalc') closeOverlay();
  });
})();

/* ── Console branding ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  console.log('%cAvinash & Associates — Loaded ✓', 'color:#059669;font-family:Raleway,sans-serif;font-weight:700;font-size:14px;');
});

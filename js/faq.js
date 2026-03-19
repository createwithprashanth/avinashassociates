/* ============================================================
   AVINASH & ASSOCIATES — js/faq.js
   FAQ Accordion — single open at a time
   ============================================================ */

'use strict';

(function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      /* Close all others */
      faqItems.forEach(other => {
        const ob = other.querySelector('.faq-q');
        const oa = other.querySelector('.faq-a');
        if (ob && oa && other !== item) {
          ob.setAttribute('aria-expanded', 'false');
          oa.classList.remove('open');
        }
      });

      /* Toggle this one */
      btn.setAttribute('aria-expanded', String(!isOpen));
      ans.classList.toggle('open', !isOpen);
    });
  });
})();

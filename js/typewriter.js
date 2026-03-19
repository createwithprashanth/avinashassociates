/* ============================================================
   AVINASH & ASSOCIATES — js/typewriter.js
   Cycling typewriter effect for the hero heading
   ============================================================ */

'use strict';

(function initTypewriter() {
  const el = document.getElementById('tw-text');
  if (!el) return;

  const phrases = [
    'GST Filing & Returns',
    'Company Registration',
    'NRI Taxation',
    'Audit & Assurance',
    'Trademark Filing',
    'Business Advisory'
  ];

  const TYPE_SPEED   = 72;   /* ms per character typed */
  const DEL_SPEED    = 38;   /* ms per character deleted */
  const PAUSE_AFTER  = 1800; /* ms pause after full phrase */
  const PAUSE_BEFORE = 350;  /* ms pause before typing next */

  let phraseIdx = 0;
  let charIdx   = 0;
  let deleting  = false;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (!deleting) {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) {
        deleting = true;
        setTimeout(tick, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, PAUSE_BEFORE);
        return;
      }
      setTimeout(tick, DEL_SPEED);
    }
  }

  setTimeout(tick, 1400); // start after hero is settled
})();

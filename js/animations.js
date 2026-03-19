/* ============================================================
   AVINASH & ASSOCIATES — js/animations.js
   Scroll reveal, Stats counters, Process timeline,
   Image zoom, About parallax, Hero card, Hero carousel, Lazy load fallback
   ============================================================ */

'use strict';

/* ── SCROLL REVEAL ───────────────────────────────────────── */
(function initScrollReveal() {
  $$('.scroll-reveal-card').forEach(card => {
    card.style.transitionDelay = (parseInt(card.getAttribute('data-i') || 0) * 0.09) + 's';
  });
  $$('.scroll-reveal-step').forEach(step => {
    step.style.transitionDelay = (parseInt(step.getAttribute('data-step') || 0) * 0.18) + 's';
  });
  $$('.scroll-reveal-feat').forEach(feat => {
    feat.style.transitionDelay = (parseInt(feat.style.getPropertyValue('--fi') || 0) * 0.12) + 's';
  });

  const targets = $$(
    '.scroll-reveal, .scroll-reveal-card, .scroll-slide-left, ' +
    '.scroll-slide-right, .scroll-reveal-feat, .scroll-reveal-step'
  );

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ── STATS COUNTER ───────────────────────────────────────── */
(function initCounters() {
  const counters = $$('.counter');
  const statsSection = $('#stats-section');
  if (!counters.length || !statsSection) return;

  let triggered = false;

  function easeOutQuad(t) { return t * (2 - t); }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target') || 0);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const startTime = performance.now();
    // Cache wrap before animation starts — innerHTML replaces el on frame 1,
    // making el detached. Caching here keeps the reference valid every frame.
    const wrap = el.closest('.stat-num-wrap');

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.round(easeOutQuad(progress) * target);
      const html = current + '<span class="stat-suf-val">' + suffix + '</span>';
      if (wrap) wrap.innerHTML = html;
      else el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        const finalHtml = target + '<span class="stat-suf-val">' + suffix + '</span>';
        if (wrap) wrap.innerHTML = finalHtml;
        else el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      counters.forEach(animateCounter);
    }
  }, { threshold: 0.3 }).observe(statsSection);
})();

/* ── PROCESS ANIMATION ───────────────────────────────────── */
(function initProcess() {
  const processSection = $('#process');
  const line  = $('#process-line');
  const steps = $$('.process-step');
  if (!processSection) return;

  let animated = false;

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      if (line) setTimeout(() => line.classList.add('animated'), 200);
      steps.forEach((step, i) => setTimeout(() => step.classList.add('active'), i * 300 + 400));
    }
  }, { threshold: 0.2 }).observe(processSection);
})();

/* ── IMAGE HOVER ZOOM (about section) ───────────────────── */
(function initImageZoom() {
  $$('.about-img-wrapper').forEach(wrapper => {
    wrapper.style.overflow = 'hidden';
    wrapper.style.borderRadius = 'var(--r-xl)';
  });
})();

/* ── ABOUT IMAGE PARALLAX ────────────────────────────────── */
(function initAboutImageEffect() {
  const aboutImg = $('.about-img');
  if (!aboutImg) return;
  const wrapper = aboutImg.closest('.about-img-wrapper');
  if (!wrapper) return;

  wrapper.addEventListener('mouseenter', () => { aboutImg.style.transform = 'scale(1.04)'; });
  wrapper.addEventListener('mouseleave', () => { aboutImg.style.transform = 'scale(1)'; });
})();

/* ── HERO CARD ───────────────────────────────────────────── */
(function initHeroCard() {
  const card = $('.hero-card');
  if (card) card.style.willChange = 'transform, opacity';
})();

/* ── HERO SERVICE CAROUSEL ───────────────────────────────── */
(function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel');
  const track    = document.getElementById('heroCarouselTrack');
  const dotsWrap = document.getElementById('heroCarouselDots');
  if (!carousel || !track || !dotsWrap) return;

  const cards = Array.from(track.children);
  const total = cards.length;
  let current = 0;
  let timer   = null;
  let paused  = false;

  /* Build dot indicators */
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to service ${i + 1}`);
    dot.addEventListener('click', () => { goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });

  function goTo(idx) {
    cards[current].classList.remove('hsc-active');
    dotsWrap.children[current].classList.remove('active');
    current = (idx + total) % total;
    cards[current].classList.add('hsc-active');
    dotsWrap.children[current].classList.add('active');
  }

  function next() { if (!paused) goTo(current + 1); }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 2800);
  }

  /* Pause on hover */
  carousel.addEventListener('mouseenter', () => { paused = true; });
  carousel.addEventListener('mouseleave', () => { paused = false; });

  /* Swipe support */
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); resetTimer(); }
  }, { passive: true });

  goTo(0);
  resetTimer();
})();

/* ── LAZY LOADING FALLBACK ───────────────────────────────── */
(function initLazyFallback() {
  if ('loading' in HTMLImageElement.prototype) return;
  $$('img[loading="lazy"]').forEach(img => {
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const src = entry.target.getAttribute('src');
          if (src) entry.target.src = src;
        }
      });
    }).observe(img);
  });
})();

/* ============================================================
   AVINASH & ASSOCIATES — js/nav.js
   Preloader, Navbar scroll, Hamburger, Scroll-to-top, Smooth scroll
   ============================================================ */

'use strict';

/* ── PRELOADER ───────────────────────────────────────────── */
(function initPreloader() {
  const loader = $('#preloader');
  if (!loader) return;

  function exitLoader() {
    loader.classList.add('exit');
    setTimeout(() => {
      loader.style.display = 'none';
      document.body.style.overflow = '';
    }, 420);
  }

  document.body.style.overflow = 'hidden';

  const MIN_TIME = 1200;
  const startTime = Date.now();

  function tryExit() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_TIME - elapsed);
    setTimeout(exitLoader, remaining);
  }

  if (document.readyState === 'complete') {
    tryExit();
  } else {
    window.addEventListener('load', tryExit);
    setTimeout(exitLoader, 1800); // safety cap
  }
})();

/* ── NAVBAR ──────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = $('#navbar');
  const topBar = $('.top-bar');
  if (!navbar) return;

  let ticking = false;

  function updateNav() {
    const scrolled = window.scrollY > 80;
    navbar.classList.toggle('scrolled', scrolled);
    if (topBar) {
      topBar.style.transform = scrolled ? 'translateY(-100%)' : 'translateY(0)';
      topBar.style.transition = 'transform .3s ease';
    }
    navbar.style.top = scrolled ? '0' : (topBar ? topBar.offsetHeight + 'px' : '0');
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateNav); ticking = true; }
  }, { passive: true });

  updateNav();

  /* Active nav link on scroll */
  const sections = $$('section[id], div[id="home"]');
  const navLinks = $$('.nav-link');

  function setActiveLink() {
    const scrollPos = window.scrollY + 120;
    let current = '';
    sections.forEach(s => { if (s.offsetTop <= scrollPos) current = s.id; });
    navLinks.forEach(link => {
      const target = link.getAttribute('data-section') || link.getAttribute('href').slice(1);
      link.classList.toggle('active', target === current);
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();
})();

/* ── MOBILE HAMBURGER ────────────────────────────────────── */
(function initHamburger() {
  const btn = $('#hamburger');
  const menu = $('#mobile-menu');
  const mobileLinks = $$('.mobile-nav-link');
  const mobileCta = $('.mobile-cta-btn');
  if (!btn || !menu) return;

  let open = false;

  function openMenu() {
    open = true;
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    open = false;
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => open ? closeMenu() : openMenu());
  [...mobileLinks, ...(mobileCta ? [mobileCta] : [])].forEach(link => link.addEventListener('click', closeMenu));
  menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeMenu(); });
})();

/* ── SCROLL TO TOP ───────────────────────────────────────── */
(function initScrollTop() {
  const btn = $('#scrollTop');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('show', window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ── SMOOTH SCROLL FOR ANCHOR LINKS ─────────────────────── */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = link.getAttribute('href');
    if (target === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(target);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
  });
})();

/*! wow.js — Premium interaction layer
 * Scroll progress · Custom cursor · 3D tilt · Magnetic buttons · Hero particles
 */
(function () {
  'use strict';

  // Bail on reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ─────────────────────────────────────────
     1. SCROLL PROGRESS BAR
  ───────────────────────────────────────── */
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ─────────────────────────────────────────
     2. CUSTOM CURSOR (desktop / mouse only)
  ───────────────────────────────────────── */
  const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
  if (!isTouch()) {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    if (dot && ring) {
      let mx = -300, my = -300;
      let rx = -300, ry = -300;
      const lerp = (a, b, t) => a + (b - a) * t;

      document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
      });

      const trackRing = () => {
        rx = lerp(rx, mx, 0.11);
        ry = lerp(ry, my, 0.11);
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(trackRing);
      };
      trackRing();

      // Hover expansion on interactive elements
      const interactiveEls = 'a, button, .svc-card, .team-card, .faq-q, label, input, textarea, select';
      document.querySelectorAll(interactiveEls).forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('is-hovered'));
        el.addEventListener('mouseleave', () => ring.classList.remove('is-hovered'));
      });

      // Click pulse
      document.addEventListener('mousedown', () => ring.classList.add('is-clicking'));
      document.addEventListener('mouseup',   () => ring.classList.remove('is-clicking'));

      // Fade when leaving / entering window
      document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
    }
  }

  /* ─────────────────────────────────────────
     3. 3D CARD TILT
  ───────────────────────────────────────── */
  document.querySelectorAll('.svc-card, .team-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const rx  = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -7;
      const ry  = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  7;
      card.classList.add('is-tilting');
      card.style.transform  = `perspective(640px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px) scale(1.025)`;
      card.style.boxShadow  = `${-ry * 1.2}px ${rx * 1.2}px 32px rgba(0,0,0,0.16), 0 12px 32px rgba(2,44,34,0.10)`;
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });

  /* ─────────────────────────────────────────
     4. MAGNETIC BUTTONS
  ───────────────────────────────────────── */
  document.querySelectorAll('.btn-primary, .btn-hero-gold').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width  / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      btn.style.transition = 'transform 0.18s ease';
      btn.style.transform  = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
      btn.style.transform  = 'translate(0, 0)';
    });
  });

  /* ─────────────────────────────────────────
     5. HERO PARTICLE NETWORK
  ───────────────────────────────────────── */
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const COUNT = 52;
  const LINK_DIST = 95;
  const cols = ['rgba(16,185,129,', 'rgba(52,211,153,', 'rgba(6,95,70,', 'rgba(110,231,183,'];

  const particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.2 + 0.6,
    vx: (Math.random() - 0.5) * 0.30,
    vy: (Math.random() - 0.5) * 0.30,
    a: Math.random() * 0.45 + 0.15,
    col: cols[Math.floor(Math.random() * cols.length)]
  }));

  const tick = () => {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + p.a + ')';
      ctx.fill();
    });

    // Connecting lines between nearby particles
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(16,185,129,${(1 - dist / LINK_DIST) * 0.13})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  };
  tick();

})();

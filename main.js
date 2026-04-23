/* ============================================================
   PORTFOLIO — main.js
   ============================================================ */

// ── Sticky Nav ────────────────────────────────────────────────
/* ============================================================
   CIRCUIT BOARD BACKGROUND
   ============================================================ */
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── Nodes ── */
  const NODE_COUNT    = 38;
  const CONNECT_DIST  = 180;

  const nodes = Array.from({ length: NODE_COUNT }, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    vx:    (Math.random() - 0.5) * 0.22,
    vy:    (Math.random() - 0.5) * 0.22,
    pulse: Math.random() * Math.PI * 2,   // phase offset for glow
    size:  Math.random() * 1.5 + 1,
  }));

  /* ── Signal packets that travel along edges ── */
  const signals = [];
  function spawnSignal(ax, ay, bx, by) {
    signals.push({ ax, ay, bx, by, t: 0, speed: 0.012 + Math.random() * 0.01 });
  }

  /* ── Draw loop ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Move nodes */
    nodes.forEach(n => {
      n.x  += n.vx;
      n.y  += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      n.pulse += 0.022;
    });

    /* Draw edges (right-angle circuit traces) */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[j].x - nodes[i].x;
        const dy   = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > CONNECT_DIST) continue;

        const alpha = (1 - dist / CONNECT_DIST) * 0.28;
        const mid   = nodes[i].x + dx * 0.5;

        /* Main trace */
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(mid,         nodes[i].y);   // horizontal leg
        ctx.lineTo(mid,         nodes[j].y);   // vertical leg
        ctx.lineTo(nodes[j].x,  nodes[j].y);  // horizontal leg
        ctx.strokeStyle = `rgba(0,210,200,${alpha})`;
        ctx.lineWidth   = 0.9;
        ctx.stroke();

        /* Randomly spawn a signal packet on this edge */
        if (Math.random() < 0.0008) {
          spawnSignal(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        }
      }
    }

    /* Draw signal packets */
    for (let s = signals.length - 1; s >= 0; s--) {
      const sig = signals[s];
      sig.t += sig.speed;
      if (sig.t >= 1) { signals.splice(s, 1); continue; }

      const px = sig.ax + (sig.bx - sig.ax) * sig.t;
      const py = sig.ay + (sig.by - sig.ay) * sig.t;

      /* Glow trail */
      const grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
      grd.addColorStop(0,   'rgba(0,255,240,0.9)');
      grd.addColorStop(0.4, 'rgba(0,210,200,0.4)');
      grd.addColorStop(1,   'rgba(0,210,200,0)');
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* Bright core dot */
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,255,250,0.95)';
      ctx.fill();
    }

    /* Draw nodes */
    nodes.forEach(n => {
      const pulse = Math.sin(n.pulse) * 0.5 + 0.5;   // 0 → 1

      /* Outer glow ring */
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 10);
      grd.addColorStop(0,   `rgba(0,210,200,${0.15 + pulse * 0.15})`);
      grd.addColorStop(1,   'rgba(0,210,200,0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size + pulse * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,220,210,${0.55 + pulse * 0.35})`;
      ctx.fill();

      /* Square pad (PCB style) */
      const pad = 3.5 + pulse;
      ctx.strokeStyle = `rgba(0,210,200,${0.2 + pulse * 0.2})`;
      ctx.lineWidth   = 0.8;
      ctx.strokeRect(n.x - pad, n.y - pad, pad * 2, pad * 2);
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile Menu ───────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ── Fade-up Intersection Observer ────────────────────────────
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings in same parent
      const siblings = entry.target.parentElement.querySelectorAll('.fade-up:not(.visible)');
      let delay = 0;
      siblings.forEach(sib => {
        if (sib === entry.target || !sib.getBoundingClientRect().top > window.innerHeight) {
          setTimeout(() => sib.classList.add('visible'), delay);
          delay += 80;
        }
      });
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => observer.observe(el));

// ── Skill Bar Animations ──────────────────────────────────────
const skillBarObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fills = entry.target.querySelectorAll('.sbar-fill');
      fills.forEach((fill, i) => {
        const width = fill.dataset.w;
        setTimeout(() => {
          fill.style.width = width + '%';
        }, i * 120);
      });
      skillBarObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-category').forEach(el => skillBarObserver.observe(el));

// ── Typing Animation for Hero ─────────────────────────────────
const phrases = ['Building Digital', 'Developing Smart', 'Engineering Robust', 'Securing Modern'];
const typedEl = document.getElementById('typed-name');
let phraseIndex = 0;
let charIndex = 0;
let deleting = false;
let typingPaused = false;

function type() {
  if (typingPaused) return;

  const current = phrases[phraseIndex];

  if (!deleting) {
    typedEl.textContent = current.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === current.length) {
      typingPaused = true;
      setTimeout(() => { deleting = true; typingPaused = false; type(); }, 2200);
      return;
    }
  } else {
    typedEl.textContent = current.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }

  const speed = deleting ? 60 : 100;
  setTimeout(type, speed);
}

// Start typing after a short delay
setTimeout(type, 1200);

// ── Smooth active nav highlight ───────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) {
      current = sec.getAttribute('id');
    }
  });
  navLinkEls.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === '#' + current) {
      if (!link.classList.contains('nav-cta')) {
        link.style.color = 'var(--accent)';
      }
    }
  });
}, { passive: true });

// ── Card tilt micro-interaction ───────────────────────────────
document.querySelectorAll('.project-card, .skill-category, .av-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

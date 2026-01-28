// projects.js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------
   Scroll progress bar
---------------------------- */
const progressBar = document.getElementById('progressBar');
function updateProgress(){
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const p = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
  progressBar.style.width = (p * 100).toFixed(2) + '%';
}

/* ---------------------------
   Reveal on scroll
---------------------------- */
function initReveal(){
  const els = document.querySelectorAll('.reveal');
  if (prefersReduced){
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting) e.target.classList.add('is-in');
    }
  }, { threshold: 0.14 });
  els.forEach(el => io.observe(el));
}

/* ---------------------------
   Hero parallax (mouse + scroll)
---------------------------- */
function initHeroParallax(){
  const hero = document.querySelector('.hero');
  if (!hero || prefersReduced) return;

  const layers = hero.querySelectorAll('.hero__layer');
  let mx = 0, my = 0, sy = 0;
  let raf = null;

  function apply(){
    raf = null;
    layers.forEach((layer, i) => {
      const depth = (i + 1) * 0.012;
      const scrollDepth = (i + 1) * 0.06;
      layer.style.transform = `translate3d(${mx * depth}px, ${my * depth + sy * scrollDepth}px, 0)`;
    });
  }

  window.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    mx = (e.clientX - cx) * 0.6;
    my = (e.clientY - cy) * 0.5;
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });

  window.addEventListener('scroll', () => {
    sy = window.scrollY * -0.02;
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
}

/* ---------------------------
   Scene background parallax (blurred backdrop)
---------------------------- */
function initSceneParallax(){
  const scenes = document.querySelectorAll('.scene__bg');
  if (prefersReduced || scenes.length === 0) return;

  function tick(){
    const y = window.scrollY || 0;
    scenes.forEach((bg) => {
      const r = bg.parentElement.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const t = (center - window.innerHeight / 2) / window.innerHeight; // -1..+1
      bg.style.transform = `translate3d(0, ${t * 18}px, 0) scale(1.08)`;
    });
  }
  window.addEventListener('scroll', tick, { passive: true });
  tick();
}

/* ---------------------------
   Tilt effect (cards/images)
---------------------------- */
function initTilt(){
  const items = document.querySelectorAll('[data-tilt]');
  if (prefersReduced || items.length === 0) return;

  items.forEach((el) => {
    let raf = null;
    let rx = 0, ry = 0;

    function apply(){
      raf = null;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    }

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;  // 0..1
      const py = (e.clientY - r.top) / r.height;  // 0..1
      ry = (px - 0.5) * 10;   // rotateY
      rx = -(py - 0.5) * 8;   // rotateX
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      rx = 0; ry = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });
}

/* ---------------------------
   Starfield canvas (impressive but light)
---------------------------- */
function initStars(){
  const canvas = document.getElementById('stars');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0, dpr = 1;
  let stars = [];
  const N = 240;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    stars = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 1 + 0.2,           // brightness
      r: Math.random() * 1.6 + 0.2,         // radius
      vx: (Math.random() - 0.5) * 0.10,     // drift
      vy: (Math.random() - 0.5) * 0.08
    }));
  }

  function draw(){
    ctx.clearRect(0,0,w,h);

    // subtle gradient wash
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, 'rgba(183,198,255,0.06)');
    g.addColorStop(1, 'rgba(124,240,255,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    const scroll = (window.scrollY || 0) * dpr;

    for (const s of stars){
      // drift + gentle scroll parallax
      s.x += s.vx * dpr;
      s.y += s.vy * dpr + (prefersReduced ? 0 : 0.02 * dpr);

      // wrap
      if (s.x < -10) s.x = w + 10;
      if (s.x > w + 10) s.x = -10;
      if (s.y < -10) s.y = h + 10;
      if (s.y > h + 10) s.y = -10;

      const py = (s.y + (scroll * 0.02)) % h;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.10 + 0.28 * s.z})`;
      ctx.arc(s.x, py, s.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw();
}

/* ---------------------------
   Init
---------------------------- */
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();
initReveal();
initHeroParallax();
initSceneParallax();
initTilt();
initStars();
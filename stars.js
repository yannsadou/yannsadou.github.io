(function initStars(){
  const canvas = document.getElementById('stars');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let stars = [];
  const N = 4000; // number of stars (try 2000-4000 if lag)

  // Shooting stars
  const meteors = [];
  let lastMeteorAt = 0;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    stars = Array.from({ length: N }, () => {
      // 1) make a small subset "bright"
      const bright = Math.random() < 0.015; // ~1.5% bright stars

      return ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1 + 0.2,
        r: Math.random() * 1.4 + 0.2,
        vx: (Math.random() - 0.5) * 0.10,
        vy: (Math.random() - 0.5) * 0.08,

        bright,
        // 2) twinkle params
        twPhase: Math.random() * Math.PI * 2,
        twSpeed: 0.008 + Math.random() * 0.02,
        glowR: bright ? (2.5 + Math.random() * 6) : 0
      });
    });
  }

  function spawnMeteor(now){
    // limit frequency + avoid too many at once
    if (meteors.length > 2) return;
    if (now - lastMeteorAt < 1800) return; // min ~1.8s between meteors

    // small random chance each frame (tweak to taste)
    if (Math.random() > 0.015) return;

    lastMeteorAt = now;

    // spawn near top/left-ish; fly down-right
    const startX = (Math.random() * w * 0.8);
    const startY = (Math.random() * h * 0.25);

    const speed = (14 + Math.random() * 10) * dpr;
    const angle = (Math.PI / 4) + (Math.random() * 0.35); // ~45deg + jitter

    meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: (160 + Math.random() * 220) * dpr,
      life: 0,
      ttl: 22 + Math.random() * 18 // frames-ish
    });
  }

  function drawMeteor(m){
    // Draw a streak with a gradient (glowy head)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const x2 = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len;
    const y2 = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len;

    const g = ctx.createLinearGradient(m.x, m.y, x2, y2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.25, 'rgba(180,220,255,0.35)');
    g.addColorStop(1, 'rgba(180,220,255,0)');

    ctx.strokeStyle = g;
    ctx.lineWidth = 2.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Glow head
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.arc(m.x, m.y, 2.4 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function draw(){
    const now = performance.now();
    ctx.clearRect(0, 0, w, h);

    // Background gradient (night-sky, Apple-ish)
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0B1633');
    bg.addColorStop(1, '#060914');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const scroll = (window.scrollY || 0) * dpr;

    // Spawn meteors occasionally
    if (!prefersReduced) spawnMeteor(now);

    // Stars
    for (const s of stars){
      if (!prefersReduced){
        s.x += s.vx * dpr;
        s.y += s.vy * dpr + 0.08 * dpr;
        s.twPhase += s.twSpeed;
      }

      // wrap
      if (s.x < -10) s.x = w + 10;
      if (s.x > w + 10) s.x = -10;
      if (s.y < -10) s.y = h + 10;
      if (s.y > h + 10) s.y = -10;

      const py = (s.y + scroll * 0.02) % h;

      // Twinkle factor
      const tw = 0.75 + 0.25 * Math.sin(s.twPhase);

      // Base alpha
      const baseA = (0.08 + 0.26 * s.z) * tw;

      // 3) Regular stars (cheap)
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${baseA})`;
      ctx.arc(s.x, py, s.r * dpr, 0, Math.PI * 2);
      ctx.fill();

      // 4) Bright stars with glow (only a small subset => affordable)
      if (s.bright){
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const gr = ctx.createRadialGradient(s.x, py, 0, s.x, py, s.glowR * dpr);
        gr.addColorStop(0, `rgba(255,255,255,${0.55 * tw})`);
        gr.addColorStop(0.25, `rgba(170,220,255,${0.18 * tw})`);
        gr.addColorStop(1, 'rgba(170,220,255,0)');

        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(s.x, py, (s.glowR * dpr), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Meteors update + draw
    for (let i = meteors.length - 1; i >= 0; i--){
      const m = meteors[i];

      if (!prefersReduced){
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;
      }

      drawMeteor(m);

      // remove if out or expired
      if (m.life > m.ttl || m.x > w + 300 || m.y > h + 300){
        meteors.splice(i, 1);
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw();
})();
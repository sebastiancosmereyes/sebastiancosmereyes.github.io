/* ==========================================================================
   Dust concept animation — Martian Dust Mitigation page.

   Purely illustrative: dust-like particles drift down onto a panel surface.
   Toggling "cylinder" adds a simple sweeping effect near the surface so the
   idea is visible. This does NOT represent measured dust behavior, particle
   physics, or any experimental result — the research itself is still in the
   literature-review / experimental-design phase, as the page text says.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('dustCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var toggleBtn = document.getElementById('dustToggle');
  var statusEl = document.getElementById('dustStatus');
  var resetBtn = document.getElementById('dustReset');

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cylinderOn = false;
  var settled = [];
  var particles = [];
  var maxParticles = reduceMotion ? 1 : 70;

  function resize() {
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);

  function panelY() { return h * 0.72; }
  function cylinderY() { return panelY() - 16; }

  function spawn() {
    return {
      x: Math.random() * w,
      y: -10 - Math.random() * 40,
      vy: 18 + Math.random() * 14,
      vx: (Math.random() - 0.5) * 6,
      r: 1 + Math.random() * 1.6
    };
  }

  function reset() {
    settled = [];
    particles = [];
  }

  toggleBtn.addEventListener('click', function () {
    cylinderOn = !cylinderOn;
    toggleBtn.textContent = cylinderOn ? 'Cylinder: on' : 'Cylinder: off';
    statusEl.textContent = cylinderOn
      ? 'Concept: rotating cylinder sweeps near the surface before dust settles.'
      : 'Concept: no mitigation — dust settles freely on the panel.';
  });

  resetBtn.addEventListener('click', reset);

  var dt = 0.045;
  var lastSpawn = 0;

  function step(now) {
    lastSpawn += dt;
    if (lastSpawn > 0.09 && particles.length < maxParticles) {
      particles.push(spawn());
      lastSpawn = 0;
    }

    ctx.clearRect(0, 0, w, h);

    // panel
    ctx.fillStyle = '#0f2338';
    ctx.fillRect(0, panelY(), w, h - panelY());
    ctx.strokeStyle = 'rgba(79,198,221,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, panelY());
    ctx.lineTo(w, panelY());
    ctx.stroke();

    // cylinder indicator
    if (cylinderOn) {
      var cyl = (Math.sin(now * 0.0016) * 0.5 + 0.5) * w;
      ctx.beginPath();
      ctx.arc(cyl, cylinderY(), 9, 0, Math.PI * 2);
      ctx.fillStyle = '#4fc6dd';
      ctx.fill();
    }

    // settled dust
    ctx.fillStyle = 'rgba(224, 169, 79, 0.55)';
    settled.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // falling dust
    ctx.fillStyle = 'rgba(224, 169, 79, 0.8)';
    particles = particles.filter(function (p) {
      p.y += p.vy * dt * (reduceMotion ? 0 : 1);
      p.x += p.vx * dt * (reduceMotion ? 0 : 1);

      if (cylinderOn && p.y > cylinderY() - 20 && p.y < cylinderY() + 20) {
        p.vx += (Math.random() - 0.3) * 10 * dt * 8;
        p.vy *= 0.96;
      }

      if (p.y >= panelY() - p.r) {
        if (!cylinderOn || Math.random() < 0.35) {
          settled.push({ x: p.x, y: panelY() - p.r, r: p.r });
        }
        return false;
      }
      if (p.x < -10 || p.x > w + 10) return false;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    if (settled.length > 400) settled.splice(0, settled.length - 400);

    if (!reduceMotion) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
});

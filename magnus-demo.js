/* ==========================================================================
   Magnus effect demo — Water Tunnel Rotating Cylinder page.

   Renders particle streamlines using the classic idealized potential-flow
   solution for a rotating cylinder in a uniform stream (uniform flow +
   doublet + vortex). This is the same closed-form model referenced on the
   page (Kutta-Joukowski / inviscid theory) — it's a teaching visualization
   of that theory, not a plot of the actual PIV measurements.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('magnusCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var slider = document.getElementById('magnusSlider');
  var readout = document.getElementById('magnusReadout');
  var liftReadout = document.getElementById('magnusLiftNote');

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var R = 34;          // cylinder radius, px
  var U = 60;           // free-stream speed, px/sec (visual, not physical units)
  var rpm = parseFloat(slider.value);
  var particles = [];
  var particleCount = reduceMotion ? 1 : 90;

  function resize() {
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }

  function cx() { return w * 0.5; }
  function cy() { return h * 0.5; }

  function gamma() {
    // Illustrative scaling: circulation grows with RPM, capped well below
    // the theoretical value where the rear stagnation points would merge.
    return (rpm / 100) * 6 * U * R;
  }

  function velocityAt(x, y) {
    // x, y relative to cylinder center
    var r2 = x * x + y * y;
    if (r2 < R * R) return null;
    var pRe = x / r2, pIm = -y / r2;              // 1/z
    var qRe = pRe * pRe - pIm * pIm;                // 1/z^2 real
    var qIm = 2 * pRe * pIm;                        // 1/z^2 imag
    var G = gamma();

    var t1Re = U * (1 - R * R * qRe);
    var t1Im = U * (-R * R * qIm);
    var t2Re = -(G / (2 * Math.PI)) * pIm;
    var t2Im = (G / (2 * Math.PI)) * pRe;

    var wRe = t1Re + t2Re;
    var wIm = t1Im + t2Im;
    return { u: wRe, v: -wIm };
  }

  function seedParticles() {
    particles = [];
    var n = particleCount;
    for (var i = 0; i < n; i++) {
      particles.push(makeParticle(true));
    }
  }

  function makeParticle(randomX) {
    var margin = 30;
    return {
      x: randomX ? (Math.random() * (w - margin * 2) - (w / 2 - margin)) : -(w / 2) + margin,
      y: (Math.random() - 0.5) * (h - 40),
      trail: []
    };
  }

  resize();
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);

  slider.addEventListener('input', function () {
    rpm = parseFloat(slider.value);
    readout.textContent = rpm.toFixed(0);
    liftReadout.textContent = rpm === 0
      ? 'No rotation — symmetric flow, no net deflection.'
      : 'Streamlines shift asymmetrically — the idealized signature of the Magnus effect.';
  });
  readout.textContent = rpm.toFixed(0);

  var dt = 0.045;

  function step() {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx(), cy());

    // cylinder
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = '#0f2338';
    ctx.strokeStyle = 'rgba(79,198,221,0.7)';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // rotation direction indicator
    var spin = rpm / 100;
    if (spin > 0.02) {
      ctx.save();
      ctx.rotate(performance.now() * 0.002 * spin * 6);
      ctx.strokeStyle = 'rgba(244,246,248,0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-R * 0.5, 0);
      ctx.lineTo(R * 0.5, 0);
      ctx.moveTo(0, -R * 0.5);
      ctx.lineTo(0, R * 0.5);
      ctx.stroke();
      ctx.restore();
    }

    particles.forEach(function (p, idx) {
      var vel = velocityAt(p.x, p.y);
      if (!vel) {
        particles[idx] = makeParticle(false);
        return;
      }
      p.x += vel.u * dt * (reduceMotion ? 0 : 1);
      p.y += vel.v * dt * (reduceMotion ? 0 : 1);

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 14) p.trail.shift();

      if (p.x > w / 2 - 20 || p.x < -(w / 2) - 20 || Math.abs(p.y) > h / 2 + 20) {
        particles[idx] = makeParticle(false);
        return;
      }

      ctx.beginPath();
      p.trail.forEach(function (pt, i) {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = 'rgba(79, 198, 221, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.restore();

    if (!reduceMotion) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
});

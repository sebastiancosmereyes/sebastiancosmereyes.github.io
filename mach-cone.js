/* ==========================================================================
   Mach cone demo — Bell X-1 case study page.

   Draws expanding pressure-wave fronts from a moving point source, the
   textbook way of visualizing how sound waves pile up into a Mach cone as
   an object crosses Mach 1. The Mach angle drawn (mu = asin(1/M)) uses the
   standard supersonic-flow relation, but this is a teaching visualization,
   not a substitute for the MATLAB analysis described on the page.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('machCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var slider = document.getElementById('machSlider');
  var readout = document.getElementById('machReadout');
  var angleReadout = document.getElementById('machAngleReadout');
  var regimeReadout = document.getElementById('machRegime');
  var playBtn = document.getElementById('machPlay');

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduceMotion;

  function resize() {
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var mach = parseFloat(slider.value);
  var t = 0;
  var emitInterval = 0.14; // seconds between wave emissions
  var sinceEmit = 0;
  var waves = []; // { emittedAt, originX }
  var craftSpeedPxPerSec = 90; // visual speed, not physically scaled
  var lastTime = null;

  function updateReadouts() {
    readout.textContent = mach.toFixed(2);
    if (mach > 1) {
      var muRad = Math.asin(1 / mach);
      var muDeg = muRad * 180 / Math.PI;
      angleReadout.textContent = muDeg.toFixed(1) + '\u00B0';
      regimeReadout.textContent = 'Supersonic — Mach cone forms';
    } else if (mach === 1) {
      angleReadout.textContent = '90\u00B0';
      regimeReadout.textContent = 'Transonic — waves compress at the nose';
    } else {
      angleReadout.textContent = '\u2014';
      regimeReadout.textContent = 'Subsonic — waves outrun the source';
    }
  }
  updateReadouts();

  slider.addEventListener('input', function () {
    mach = parseFloat(slider.value);
    updateReadouts();
  });

  playBtn.addEventListener('click', function () {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    if (playing) { lastTime = null; requestAnimationFrame(loop); }
  });

  function reset() {
    waves = [];
    t = 0;
    sinceEmit = 0;
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { resize(); }).observe(wrap);
  }

  function craftX() {
    var margin = 40;
    var span = w - margin * 2;
    var cycle = span / (craftSpeedPxPerSec * (0.6 + mach * 0.4)) ;
    var progress = (t % cycle) / cycle;
    if (progress < 0.02 && sinceEmit > 1) reset();
    return margin + progress * span;
  }

  function loop(now) {
    if (!playing) return;
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    t += dt;
    sinceEmit += dt;

    var soundSpeed = 70; // px/sec, visual reference speed = Mach 1
    var speed = soundSpeed * mach;
    var cx = craftX();
    var cy = h * 0.55;

    if (sinceEmit >= emitInterval) {
      waves.push({ age: 0, x: cx, y: cy });
      sinceEmit = 0;
    }

    ctx.clearRect(0, 0, w, h);

    // ground / reference line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55 + 60);
    ctx.lineTo(w, h * 0.55 + 60);
    ctx.stroke();

    waves = waves.filter(function (wv) {
      wv.age += dt;
      var radius = wv.age * soundSpeed;
      if (radius > Math.max(w, h) * 0.9) return false;
      ctx.beginPath();
      ctx.arc(wv.x, wv.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(79, 198, 221, ' + Math.max(0, 0.5 - wv.age * 0.08) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
      return true;
    });

    // craft marker
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f6f8';
    ctx.fill();

    // Mach cone tangent lines, supersonic only
    if (mach > 1) {
      var mu = Math.asin(1 / mach);
      var len = 260;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - len * Math.cos(mu), cy - len * Math.sin(mu));
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - len * Math.cos(mu), cy + len * Math.sin(mu));
      ctx.strokeStyle = 'rgba(244, 246, 248, 0.55)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});

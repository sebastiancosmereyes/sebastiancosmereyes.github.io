/* ==========================================================================
   Sebastian Cosme-Reyes — shared site behavior
   Loaded on every page. Keeps the interactive bits in one place so future
   pages just include this file plus, optionally, one page-specific demo
   script (see assets/js/mach-cone.js, magnus-demo.js, dust-demo.js).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var siteNav = document.getElementById('siteNav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = siteNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Scroll reveal: elements with [data-reveal] fade/slide in the first
     time they cross into the viewport, then stay put.
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------------------------------------------------------------------
     Animated stat counters: [data-count] elements count up from 0 to the
     value in data-count once visible, e.g. <span data-count="1.45">.
     --------------------------------------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      var start = null;
      var duration = 1100;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------------------------------------------------------------------
     Project card tilt: subtle perspective tilt + glow that tracks the
     cursor. Skipped entirely on touch devices and reduced-motion.
     --------------------------------------------------------------------- */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.project-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var rx = ((y / rect.height) - 0.5) * -6;
        var ry = ((x / rect.width) - 0.5) * 6;
        card.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------------------
     Parallax layers inside the hero: elements with [data-parallax="N"]
     shift vertically at a fraction of scroll speed for a sense of depth.
     --------------------------------------------------------------------- */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    var updateParallax = function () {
      var scrollY = window.scrollY || window.pageYOffset;
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        var offset = Math.min(scrollY, 900) * speed;
        el.style.transform = 'translateY(' + offset + 'px)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ---------------------------------------------------------------------
     Flow-field canvas background: soft particles drifting along gentle
     streamlines, nudged by the cursor. Used behind the hero on every page.
     Attaches to any <canvas data-flow-field>.
     --------------------------------------------------------------------- */
  document.querySelectorAll('canvas[data-flow-field]').forEach(function (canvas) {
    initFlowField(canvas, reduceMotion);
  });

  function initFlowField(canvas, reduceMotion) {
    var ctx = canvas.getContext('2d');
    var wrap = canvas.parentElement;
    var particles = [];
    var pointer = { x: null, y: null };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particleCount = 46;

    function resize() {
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        baseY: Math.random() * h,
        speed: 0.25 + Math.random() * 0.55,
        amp: 12 + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        r: 0.6 + Math.random() * 1.1
      };
    }

    resize();
    for (var i = 0; i < particleCount; i++) particles.push(makeParticle());

    window.addEventListener('resize', resize);

    canvas.parentElement.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () {
      pointer.x = null; pointer.y = null;
    });

    var t = 0;

    function draw() {
      t += reduceMotion ? 0 : 0.012;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(function (p) {
        p.x += p.speed * (reduceMotion ? 0 : 1);
        if (p.x > w + 20) p.x = -20;
        var y = p.baseY + Math.sin(t * 1.4 + p.phase + p.x * 0.01) * p.amp;

        if (pointer.x !== null) {
          var dx = p.x - pointer.x;
          var dy = y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            var push = (140 - dist) / 140;
            y += (dy / (dist || 1)) * push * 18;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 198, 221, ' + (0.35 + p.r * 0.15) + ')';
        ctx.fill();
      });

      if (!reduceMotion) requestAnimationFrame(draw);
    }

    draw();
  }

});

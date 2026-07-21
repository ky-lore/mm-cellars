/* M&M Cellar Systems — shared site JS */
(function () {
  "use strict";

  /* reveal on scroll (also drives .wipe headings + .seal stamp) */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .seal').forEach(function (el) { io.observe(el); });

  /* M&M wax-seal — injected into every [data-seal] slot, stamps in on scroll */
  var SEAL_SVG = '<svg class="seal" viewBox="0 0 200 200" role="img" aria-label="M and M Cellar Systems seal">'
    + '<defs><radialGradient id="wax" cx="40%" cy="36%" r="72%">'
    + '<stop offset="0" stop-color="#9a2a32"/><stop offset="0.62" stop-color="#7a1e26"/><stop offset="1" stop-color="#571318"/>'
    + '</radialGradient><path id="sealTop" d="M40,100 a60,60 0 0,1 120,0"/></defs>'
    + '<circle cx="100" cy="100" r="78" fill="url(#wax)"/>'
    + '<circle cx="100" cy="100" r="70" fill="none" stroke="rgba(250,246,238,.42)" stroke-width="2.5" stroke-dasharray="0.2 6.4" stroke-linecap="round"/>'
    + '<text class="seal-mono"><textPath href="#sealTop" startOffset="50%" text-anchor="middle">WINE CELLARS · REFRIGERATION</textPath></text>'
    + '<text x="100" y="110" text-anchor="middle" class="seal-mm">M&amp;M</text>'
    + '<text x="100" y="132" text-anchor="middle" class="seal-est">EST. 2004</text></svg>';
  document.querySelectorAll('[data-seal]').forEach(function (slot) {
    slot.innerHTML = SEAL_SVG;
    io.observe(slot.querySelector('.seal'));
  });

  /* nav background on scroll */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.style.background = window.scrollY > 40 ? 'rgba(241,236,228,0.95)' : 'rgba(241,236,228,0.85)';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* mobile menu */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  /* climate gauges — sweep arc + count up when scrolled into view */
  var gauges = document.querySelectorAll('.gauge');
  if (gauges.length) {
    var C = 540.35;
    var gaugeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var g = e.target; gaugeIO.unobserve(g);
        var arc = parseFloat(g.getAttribute('data-arc')) || 0;
        var arcEl = g.querySelector('.gauge__arc');
        if (arcEl) arcEl.style.strokeDashoffset = (C * (1 - arc)).toFixed(1);
        var num = g.querySelector('.gauge__num');
        if (!num) return;
        var val = parseFloat(g.getAttribute('data-value')) || 0;
        var suf = g.getAttribute('data-suffix') || '';
        if (reduceMotion) { num.textContent = val + suf; return; }
        var dur = 1700, start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
          num.textContent = Math.round(val * eased) + suf;
          if (p < 1) requestAnimationFrame(step); else num.textContent = val + suf;
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    gauges.forEach(function (g) { gaugeIO.observe(g); });
  }

  /* subtle scroll parallax on background-image media */
  var pxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  if (pxEls.length && !reduceMotion) {
    var ticking = false;
    var applyPx = function () {
      var vh = window.innerHeight;
      pxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var prog = (r.top + r.height / 2) / vh;        /* ~1 near bottom, 0 near top */
        el.style.backgroundPositionY = (50 + (prog - 0.5) * -22).toFixed(1) + '%';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(applyPx); } }, { passive: true });
    window.addEventListener('resize', applyPx, { passive: true });
    applyPx();
  }

  /* tactile 3D tilt on the wine-label cards */
  if (!reduceMotion && !coarse) {
    document.querySelectorAll('.brand').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'translateY(-6px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 5).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* draggable horizontal filmstrip */
  document.querySelectorAll('.filmstrip').forEach(function (strip) {
    var down = false, startX = 0, startLeft = 0, moved = 0;
    strip.addEventListener('pointerdown', function (e) {
      down = true; moved = 0; startX = e.clientX; startLeft = strip.scrollLeft;
      strip.classList.add('dragging');
      try { strip.setPointerCapture(e.pointerId); } catch (err) {}
    });
    strip.addEventListener('pointermove', function (e) {
      if (!down) return;
      var d = e.clientX - startX; moved = Math.abs(d);
      strip.scrollLeft = startLeft - d;
    });
    var end = function () { down = false; strip.classList.remove('dragging'); };
    strip.addEventListener('pointerup', end);
    strip.addEventListener('pointercancel', end);
    strip.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { strip.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
  });

  /* front-end form handler (demo — wire to a real endpoint) */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name=name]');
      var contact = form.querySelector('[name=email]') || form.querySelector('[name=phone]');
      if ((name && !name.value.trim()) || (contact && !contact.value.trim())) {
        (name && !name.value.trim() ? name : contact).focus();
        return;
      }
      var body = form.querySelector('[data-form-body]');
      var success = form.querySelector('.form-success');
      if (body) body.style.display = 'none';
      if (success) success.classList.add('on');
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();

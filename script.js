// Zero G Dreams — interactions, no dependencies.

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- year in the footer ------------------------------------------------
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---- reveal on scroll --------------------------------------------------
  // The stagger delay lives in a custom property that is removed once the
  // element has arrived, so it never delays a hover or a card's tilt afterwards.
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function arrive(el, i) {
    if (typeof i === 'number') {
      el.style.setProperty('--d', Math.min(i, 6) * 55 + 'ms');
    }
    el.classList.add('in');
    window.setTimeout(function () { el.style.removeProperty('--d'); }, 1500);
  }

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        arrive(entry.target, items.indexOf(entry.target));
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  // ---- scroll progress + nav shadow --------------------------------------
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.scroll-progress i');
  var ticking = false;

  function paint() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var y = doc.scrollTop || window.pageYOffset || 0;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (nav) nav.classList.toggle('is-stuck', y > 8);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paint);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint();

  // ---- nav: which section am I in ----------------------------------------
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  if ('IntersectionObserver' in window) {
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var i = sections.indexOf(entry.target);
        links.forEach(function (a, k) { a.classList.toggle('is-here', k === i); });
      });
    }, { rootMargin: '-46% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { if (s) ioNav.observe(s); });
  }

  // ---- the project deck --------------------------------------------------
  var deck = document.getElementById('deck');
  if (deck) {
    var slides = Array.prototype.slice.call(deck.querySelectorAll('.deck-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.deck-dot'));
    var now = document.getElementById('deck-now');
    var total = document.getElementById('deck-total');
    var current = 0;

    if (total) total.textContent = String(slides.length);

    function mark(i) {
      current = i;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) {
        if (k === i) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (now) now.textContent = String(i + 1);
    }

    function goto(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var left = slides[i].offsetLeft - slides[0].offsetLeft;
      deck.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
      mark(i);
    }

    if (!('IntersectionObserver' in window)) {
      slides.forEach(function (s) { s.classList.add('is-active'); });
    } else {
      var ioDeck = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) mark(slides.indexOf(entry.target));
        });
      }, { root: deck, threshold: 0.6 });
      slides.forEach(function (s) { ioDeck.observe(s); });
    }

    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { goto(k); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.deck-btn'), function (btn) {
      btn.addEventListener('click', function () {
        goto(current + Number(btn.getAttribute('data-dir')));
      });
    });

    deck.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goto(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goto(current - 1); }
    });

    mark(0);
  }

  // ---- stats that count up when they arrive ------------------------------
  var numbers = Array.prototype.slice.call(document.querySelectorAll('.num[data-count]'));

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = Number(el.getAttribute('data-dec') || 0);
    if (reduced) { el.textContent = target.toFixed(dec); return; }

    var start = null;
    var dur = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  // A number may be revealed either by vertical scrolling or by a slide
  // turning over inside the deck, so both routes go through `count` and it
  // refuses to run twice on the same element.
  function count(el) {
    if (el.getAttribute('data-done')) return;
    el.setAttribute('data-done', '1');
    countUp(el);
  }

  if (numbers.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      numbers.forEach(count);
    } else {
      var ioNum = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          count(entry.target);
          ioNum.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      numbers.forEach(function (n) { ioNum.observe(n); });
    }

    // The deck scrolls sideways, which never fires the page-level observer, so
    // the slide that just settled asks for its own numbers.
    if (deck) {
      var settle;
      deck.addEventListener('scroll', function () {
        window.clearTimeout(settle);
        settle = window.setTimeout(function () {
          Array.prototype.forEach.call(
            deck.querySelectorAll('.deck-slide.is-active .num[data-count]'), count);
        }, 200);
      }, { passive: true });
    }
  }

  // ---- the gravity switch ------------------------------------------------
  var toggle = document.getElementById('zerog');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var on = document.body.classList.toggle('zerog-on');
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // ---- slight parallax on the postcard -----------------------------------
  var card = document.getElementById('postcard');
  if (card && !reduced && window.matchMedia('(pointer: fine)').matches) {
    var hero = card.closest('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        'perspective(900px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' +
        (-y * 5).toFixed(2) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () {
      card.style.transform = '';
    });
  }
})();

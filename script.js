// Zero G Dreams — tiny interactions, no dependencies.

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- year in the footer ------------------------------------------------
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---- reveal on scroll --------------------------------------------------
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduced) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms';
      io.observe(el);
    });
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

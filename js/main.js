/* ===================================================================
   MAIN.JS — shared across all pages
   Header scroll state, mobile nav, scroll-reveal observer, active link
   =================================================================== */

(function () {
  'use strict';

  /* ---------- Header: shrink + solid bg on scroll ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var navMain = document.querySelector('.nav-main');
  if (toggle && navMain) {
    toggle.addEventListener('click', function () {
      var open = navMain.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      
      // Fix: Prevent body scroll when mobile nav is open
      if (open) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '-' + window.scrollY + 'px';
        // Store scroll position to restore later
        document.body.dataset.scrollY = window.scrollY;
      } else {
        var scrollY = parseInt(document.body.dataset.scrollY || '0');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      }
    });
    
    navMain.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMain.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        // Restore scroll when closing nav via link click
        var scrollY = parseInt(document.body.dataset.scrollY || '0');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      });
    });
  }

  /* ---------- Sliding nav indicator (desktop pill nav) ---------- */
  var navIndicator = document.querySelector('.nav-indicator');
  if (navMain && navIndicator) {
    var navLinks = Array.prototype.slice.call(navMain.querySelectorAll('a'));
    var moveIndicatorTo = function (el) {
      if (!el) return;
      navIndicator.style.width = el.offsetWidth + 'px';
      navIndicator.style.transform = 'translateX(' + el.offsetLeft + 'px)';
    };
    var restingLink = navMain.querySelector('a.is-active') || navLinks[0];
    var placeAtRest = function () {
      if (window.innerWidth <= 880) return;
      moveIndicatorTo(restingLink);
      navMain.classList.add('is-ready');
    };
    navLinks.forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveIndicatorTo(a); });
    });
    navMain.addEventListener('mouseleave', function () { moveIndicatorTo(restingLink); });
    window.addEventListener('resize', placeAtRest);
    /* fonts/layout can shift widths after first paint */
    window.requestAnimationFrame(placeAtRest);
    setTimeout(placeAtRest, 250);
  }

  /* ---------- Mark active nav link based on current path ---------- */
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-main a[data-nav]').forEach(function (a) {
    if (a.getAttribute('data-nav') === path) {
      a.classList.add('is-active');
    }
  });

  /* ---------- Scroll reveal observer ---------- */
  var revealTargets = document.querySelectorAll(
    '.reveal-up, .reveal-left, .reveal-right, .reveal-stagger'
  );
  if ('IntersectionObserver' in window && revealTargets.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Animated stat counters ---------- */
  var counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    var animateCounter = function (el) {
      var target = parseFloat(el.getAttribute('data-counter'));
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1600;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = target * eased;
        el.textContent = val.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var counterIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { counterIO.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------- Testimonial carousel ---------- */
  var track = document.querySelector('.testi-track');
  if (track) {
    var slides = track.querySelectorAll('.testi-slide');
    var dotsWrap = document.querySelector('.testi-dots');
    var idx = 0;
    var timer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('button');

    function goTo(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === idx); });
    }
    function next() { goTo(idx + 1); }
    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 5500);
    }
    restart();

    /* swipe support */
    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (dx > 50) goTo(idx - 1);
      else if (dx < -50) goTo(idx + 1);
      startX = null;
      restart();
    }, { passive: true });
  }

  /* ---------- FAQ accordion (Contact / Services pages) ---------- */
  document.querySelectorAll('.faq-item__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var wasOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('is-open');
      });
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  /* ---------- Hero: cursor parallax on floating shapes ---------- */
  var heroSection = document.getElementById('hero');
  var parallaxWrap = heroSection ? heroSection.querySelector('[data-parallax]') : null;
  if (heroSection && parallaxWrap && window.matchMedia('(pointer: fine)').matches) {
    var floaters = parallaxWrap.querySelectorAll('.hero__float');
    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      floaters.forEach(function (f) {
        var depth = parseFloat(f.getAttribute('data-depth')) || 20;
        f.style.transform = 'translate(' + (px * depth) + 'px, ' + (py * depth) + 'px)';
      });
    }, { passive: true });
    heroSection.addEventListener('mouseleave', function () {
      floaters.forEach(function (f) { f.style.transform = ''; });
    });
  }

  /* ---------- Magnetic hero buttons ---------- */
  document.querySelectorAll('.btn--magnetic').forEach(function (btn) {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.18) + 'px, ' + (y * 0.32 - 4) + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
    });
  });

})();
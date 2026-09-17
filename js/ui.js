// ============================================================
// ui.js — control hints (device detection) + developer info
// ============================================================

// ---------- Control hints ----------
(function initControlHints() {
  const mouseIcon = document.getElementById('mouseIcon');
  const touchIcon = document.getElementById('touchIcon');
  const tabletIcon = document.getElementById('tabletIcon');
  const hybridIcon = document.getElementById('hybridIcon');
  const pcHint = document.getElementById('pcHint');
  const mobileHint = document.getElementById('mobileHint');
  const tabletHint = document.getElementById('tabletHint');
  const hybridHint = document.getElementById('hybridHint');
  const hints = document.getElementById('controlHints');

  function detect() {
    const maxTouch = navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0;
    const hasTouch = maxTouch > 0 || 'ontouchstart' in window;
    const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const w = window.innerWidth;
    const isiPadUA = /ipad|macintosh/.test((navigator.userAgent || '').toLowerCase()) && hasTouch && /Macintosh/i.test(navigator.userAgent);

    let device = 'desktop';
    if (isiPadUA) device = 'tablet';
    else if (hasTouch && !hasFinePointer) device = (w < 768) ? 'mobile' : 'tablet';
    else if (hasTouch && hasFinePointer) device = 'hybrid';
    return { device };
  }

  let lastDevice = null;
  function applyDevice(d) {
    [mouseIcon, touchIcon, tabletIcon, hybridIcon].forEach(e => e && e.classList.add('hidden'));
    [pcHint, mobileHint, tabletHint, hybridHint].forEach(e => e && e.classList.add('hidden'));

    switch (d) {
      case 'desktop':
        if (mouseIcon) mouseIcon.classList.remove('hidden');
        if (pcHint) pcHint.classList.remove('hidden');
        break;
      case 'mobile':
        if (touchIcon) touchIcon.classList.remove('hidden');
        if (mobileHint) mobileHint.classList.remove('hidden');
        break;
      case 'tablet':
        if (tabletIcon) tabletIcon.classList.remove('hidden');
        if (tabletHint) tabletHint.classList.remove('hidden');
        break;
      default: // hybrid
        if (hybridIcon) hybridIcon.classList.remove('hidden');
        if (hybridHint) hybridHint.classList.remove('hidden');
        break;
    }
    lastDevice = d;
    if (hints) {
      hints.style.display = 'flex';
      hints.classList.remove('hidden');
      hints.style.opacity = (d === 'desktop') ? '1' : '0.42';
    }
  }

  function update() { applyDevice(detect().device); }
  update();

  if (window.matchMedia) {
    const mqFine = window.matchMedia('(pointer: fine)');
    const mqHover = window.matchMedia('(hover: hover)');
    if (mqFine.addEventListener) mqFine.addEventListener('change', update); else mqFine.addListener(update);
    if (mqHover.addEventListener) mqHover.addEventListener('change', update); else mqHover.addListener(update);
  }
  window.addEventListener('resize', update);

  let interactionCount = 0;
  const hideHints = () => {
    interactionCount++;
    if (lastDevice === 'desktop' && interactionCount > 3) {
      hints.style.opacity = '0.3';
      setTimeout(() => { if (hints) hints.classList.add('hidden'); }, 1500);
    }
  };
  document.addEventListener('mousedown', hideHints);
  document.addEventListener('touchstart', hideHints);
  document.addEventListener('wheel', hideHints);
})();

// ---------- Developer info ----------
(function devInfoControl() {
  const dev = document.getElementById('devInfo');
  if (!dev) return;

  function isDesktop() {
    const maxTouch = navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0;
    const hasTouch = maxTouch > 0 || 'ontouchstart' in window;
    const hasFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const isiPadUA = /ipad|macintosh/.test((navigator.userAgent || '').toLowerCase()) && hasTouch && /Macintosh/i.test(navigator.userAgent);
    if (isiPadUA) return false;
    if (hasTouch && !hasFine) return false;
    return !hasTouch || hasFine;
  }

  let hideTimer = null;
  function showThenMaybeHide() {
    dev.style.display = 'block';
    dev.classList.remove('dev-hidden');
    if (!isDesktop()) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        dev.classList.add('dev-hidden');
        setTimeout(() => {
          if (dev.classList.contains('dev-hidden')) dev.style.display = 'none';
        }, 700);
      }, 10000);
    } else {
      clearTimeout(hideTimer);
    }
  }

  showThenMaybeHide();
  window.addEventListener('resize', showThenMaybeHide);
  if (window.matchMedia) {
    const mqFine = window.matchMedia('(pointer: fine)');
    if (mqFine.addEventListener) mqFine.addEventListener('change', showThenMaybeHide);
    else mqFine.addListener(showThenMaybeHide);
  }
})();

(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const cursor = document.createElement('div');
  cursor.className = 'glass-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  // Irregular cross-waves bend the real backdrop locally. Unlike a lens,
  // there is no inward radial field or uniform magnification of the content.
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapCanvas.height = 128;
  const mapContext = mapCanvas.getContext('2d');
  const mapPixels = mapContext.createImageData(128, 128);
  for (let py = 0; py < 128; py++) for (let px = 0; px < 128; px++) {
    const offset = (py * 128 + px) * 4;
    const nx = (px / 127 - .5) * 2, ny = (py / 127 - .5) * 2;
    const envelope = Math.pow(Math.max(0, 1 - nx * nx - ny * ny), 1.25);
    const dx = Math.sin(ny * 6.2 + nx * 2.1) * Math.cos(nx * 3.7 - ny) * .18 * envelope;
    const dy = Math.sin(nx * 5.8 - ny * 1.9) * Math.cos(ny * 4.1 + nx * .6) * .18 * envelope;
    mapPixels.data[offset] = Math.round(127.5 + dx * 255);
    mapPixels.data[offset + 1] = Math.round(127.5 + dy * 255);
    mapPixels.data[offset + 2] = 128;
    mapPixels.data[offset + 3] = 255;
  }
  mapContext.putImageData(mapPixels, 0, 0);
  const opticalMap = mapCanvas.toDataURL();
  cursor.innerHTML = `<svg class="glass-cursor-optics" xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true"><defs><filter id="glass-cursor-distort" x="0%" y="0%" width="100%" height="100%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB"><feImage href="${opticalMap}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="glass-map"/><feDisplacementMap in="SourceGraphic" in2="glass-map" scale="1" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg><span class="glass-cursor-lens"></span>`;
  document.body.append(cursor);

  let frame = 0;
  let pressTimer = 0;
  let visible = false;
  let x = 0, y = 0, previousX = 0, previousY = 0;
  let stretch = 0, angle = 0;
  let mode = '';
  const enabled = () => finePointer.matches;
  const nativeTarget = 'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), iframe, embed, object';

  function hide() {
    visible = false;
    root.classList.remove('glass-cursor-active');
    cursor.classList.remove('is-visible', 'is-pressed');
    clearTimeout(pressTimer);
    cancelAnimationFrame(frame);
    frame = 0;
    stretch = 0;
  }

  function setMode(target) {
    const element = target instanceof Element ? target : null;
    if (!element || element.closest(nativeTarget)) { hide(); return false; }
    const next = element.closest('[data-image]') ? 'image' : element.closest('a[href], button:not(:disabled), [role="button"], summary') ? 'link' : '';
    if (next !== mode) { mode = next; cursor.dataset.mode = mode; }
    return true;
  }

  function paint() {
    frame = 0;
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    cursor.style.setProperty('--glass-angle', `${angle}deg`);
    cursor.style.setProperty('--glass-stretch', (1 + stretch).toFixed(3));
    cursor.style.setProperty('--glass-squash', (1 - stretch * .5).toFixed(3));
    stretch *= .62;
    if (visible && stretch > .001) frame = requestAnimationFrame(paint);
  }

  function move(event) {
    if (!enabled() || event.pointerType === 'touch' || event.pointerType === 'pen') { hide(); return; }
    if (!setMode(event.target)) return;
    x = event.clientX;
    y = event.clientY;
    const dx = x - previousX, dy = y - previousY;
    stretch = visible && !motionPreference.matches ? Math.min(.13, Math.hypot(dx, dy) * .0025) : 0;
    angle = Math.atan2(dy, dx) * 180 / Math.PI;
    previousX = x;
    previousY = y;
    if (!visible) {
      cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
      visible = true;
      root.classList.add('glass-cursor-active');
      cursor.classList.add('is-visible');
    }
    if (!frame) frame = requestAnimationFrame(paint);
  }

  // The image viewer lives in the browser's top layer. Keep the lens there too.
  const imageDialog = document.querySelector('#image-dialog');
  if (imageDialog) new MutationObserver(() => {
    const host = imageDialog.open ? imageDialog : document.body;
    if (cursor.parentElement !== host) host.append(cursor);
    if (visible) setMode(document.elementFromPoint(x, y));
  }).observe(imageDialog, { attributes: true, attributeFilter: ['open'] });

  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', event => { if (enabled() && visible) setMode(event.target); }, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    move(event);
    clearTimeout(pressTimer);
    if (visible) cursor.classList.add('is-pressed');
  }, { passive: true });
  document.addEventListener('pointerup', () => {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => cursor.classList.remove('is-pressed'), 160);
  }, { passive: true });
  document.addEventListener('pointercancel', hide, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  document.addEventListener('keydown', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  // In-page navigation is still mouse use: keep the glass cursor at the
  // click position instead of briefly restoring the system pointer.
  window.addEventListener('hashchange', () => {
    if (visible) setMode(document.elementFromPoint(x, y));
  });
  finePointer.addEventListener('change', hide);
  motionPreference.addEventListener('change', hide);
})();

import { prepareWalkerAtlas } from './walker-atlas.js?v=20261112-walker3';

// Four-frame sheets supplied by the artist; movement never drives page scrolling.
export function createStoryWalker(section, reducedMotion) {
  const lane = section.querySelector('.story-walker-lane');
  const actor = lane.querySelector('.story-walker');
  const status = lane.querySelector('.walker-status');
  const states = ['walk', 'run', 'sprint', 'turbo', 'rest'];
  const messages = {
    es: ['Caminando tranquilo. Tocá para correr.', 'Corriendo. Tocá para ir más rápido.', '¡Más rápido! Tocá para acelerar otra vez.', '¡A toda velocidad! Tocá para descansar.', 'Un descanso y un poco de agua. Tocá para volver a caminar.'],
    en: ['Taking a walk. Tap to run.', 'Running. Tap to go faster.', 'Faster! Tap to speed up again.', 'Full speed! Tap to rest.', 'A rest and a little water. Tap to walk again.']
  };
  let state = 0, x = 0, direction = 1, limit = 0, visible = false;
  let frame = 0, previousTime = 0, ready = false;
  let language = document.documentElement.lang;
  let copy=globalThis.benLocale?.messages||{};

  function label(announce = false) {
    const text = copy[['walkerWalk','walkerRun','walkerSprint','walkerTurbo','walkerRest'][state]] || (messages[language] || messages.en)[state];
    actor.setAttribute('aria-label', text);
    actor.title = text;
    if (announce) status.textContent = text;
  }
  function paint() {
    actor.style.transform = `translate3d(${x}px,0,0)`;
    actor.querySelector('.walker-facing').style.transform = direction > 0 ? 'scaleX(-1)' : 'scaleX(1)';
  }
  function measure() {
    limit = Math.max(0, lane.clientWidth - actor.offsetWidth);
    x = Math.min(x, limit);
    paint();
  }
  function tick(time) {
    frame = 0;
    if (!visible || document.hidden || reducedMotion.matches || !ready) return;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, .1) : 0;
    previousTime = time;
    if (states[state] !== 'rest') {
      const mobileScale = Math.min(1, Math.max(.5, lane.clientWidth / 1000));
      const speed = [42 * mobileScale, Math.max(220, limit / 1.6), Math.max(440, limit / .85), Math.max(850, limit / .45)][state];
      // Reflect overshoot at either edge instead of discarding distance on turns.
      if (limit > 0) {
        const phase = ((direction > 0 ? x : 2 * limit - x) + speed * dt) % (2 * limit);
        x = phase <= limit ? phase : 2 * limit - phase;
        direction = phase < limit ? 1 : -1;
      }
      paint();
      frame = requestAnimationFrame(tick);
    }
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    const active = visible && !document.hidden && ready;
    actor.classList.toggle('walker-active', active && !reducedMotion.matches);
    if (active && !reducedMotion.matches && states[state] !== 'rest') frame = requestAnimationFrame(tick);
  }
  async function load() {
    if (ready || lane.dataset.loading) return;
    lane.dataset.loading = 'true';
    const sheets = [...actor.querySelectorAll('[data-walker-src]')];
    await Promise.all(sheets.map(async image => {
      image.src = new URL(image.dataset.walkerSrc, import.meta.url).href;
      try { await image.decode(); } catch { /* Keep the remaining poses usable. */ }
      prepareWalkerAtlas(image);
    }));
    ready = true;
    actor.hidden = false;
    measure();
    sync();
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) void load();
    sync();
  }, { rootMargin: '100px 0px' }).observe(lane);
  new ResizeObserver(measure).observe(lane);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('ben-language', event => {
    language = event.detail.language;
    copy = event.detail.messages;
    label();
  });
  actor.addEventListener('click', () => {
    state = (state + 1) % states.length;
    actor.dataset.state = states[state];
    label(true);
    sync();
  });
  label();
  return { measure };
}

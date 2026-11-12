// Keep TikTok's native cover and controls. Load visible posts automatically;
// an optional player-ready message must not keep the native preview covered.
export function setupTikTokPlayers(cards) {
  const players = new Map();
  function measure(card) {
    const width = card.querySelector('.story-player').clientWidth;
    const nativeWidth = Math.max(325, width);
    card.style.setProperty('--tiktok-width', `${nativeWidth}px`);
    card.style.setProperty('--tiktok-height', `${nativeWidth * 578 / 325}px`);
    card.style.setProperty('--tiktok-scale', String(width / nativeWidth));
  }
  function pause(card) {
    players.get(card)?.frame.contentWindow?.postMessage({ 'x-tiktok-player': true, type: 'pause' }, 'https://www.tiktok.com');
  }
  function load(card) {
    if (players.has(card)) return;
    const shell = card.querySelector('.story-player');
    const loading = card.querySelector('.story-player-loading');
    const overlay = document.createElement('div'); overlay.className = 'tiktok-recovery'; overlay.hidden = true;
    const title = document.createElement('strong'); title.textContent = 'TikTok';
    const message = document.createElement('p'); message.dataset.i18n = 'tiktokUnavailable';
    message.textContent = card.querySelector('.story-player-error').textContent;
    const retry = document.createElement('button'); retry.type = 'button'; retry.dataset.i18n = 'tiktokRetry'; retry.textContent = document.documentElement.lang === 'en' ? 'Try again' : 'Volver a intentar';
    const link = document.createElement('a'); link.href = card.querySelector('.story-post-link').href;
    link.target = '_blank'; link.rel = 'noopener'; link.dataset.i18n = 'openTiktok'; link.textContent = card.querySelector('.story-post-link span').textContent;
    overlay.append(title, message, retry, link);
    const frame = document.createElement('iframe');
    frame.className = 'tiktok-pending';
    frame.title = `BEN CARRILLO · TikTok ${cards.indexOf(card) + 1}`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';
    frame.setAttribute('allowfullscreen', '');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const player = { frame, overlay, loading, timer: 0 };
    const fail = () => {
      clearTimeout(player.timer);
      player.failed = true;
      frame.hidden = true; loading.hidden = true; overlay.hidden = false;
    };
    player.fail = fail;
    function start() {
      clearTimeout(player.timer);
      cards.forEach(other => { if (other !== card) pause(other); });
      player.failed = false;
      frame.classList.add('tiktok-pending');
      overlay.hidden = true; loading.hidden = false; frame.hidden = false;
      frame.src = `https://www.tiktok.com/player/v1/${card.dataset.tiktokId}?autoplay=0&rel=0&description=0&music_info=0`;
      player.timer = setTimeout(fail, 15000);
    }
    frame.addEventListener('error', fail);
    frame.addEventListener('load', () => {
      if (player.failed) return;
      clearTimeout(player.timer);
      loading.hidden = true;
      frame.classList.remove('tiktok-pending');
    });
    retry.addEventListener('click', start);
    players.set(card, player);
    measure(card); start();
    // Set src before insertion so an initial about:blank load cannot reveal a
    // still-empty frame or dismiss the loading state ahead of TikTok's document.
    shell.append(frame, overlay);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) load(entry.target);
      else pause(entry.target);
    }
  }, { threshold: .05 });
  cards.forEach(card => observer.observe(card));
  addEventListener('message', event => {
    if (event.origin !== 'https://www.tiktok.com' || !event.data?.['x-tiktok-player']) return;
    const player = [...players.values()].find(player => player.frame.contentWindow === event.source);
    if (!player) return;
    if (event.data.type === 'onPlayerError' || event.data.type === 'onError') player.fail();
    if (event.data.type === 'onPlayerReady' && !player.failed) {
      clearTimeout(player.timer); player.overlay.hidden = true;
      player.loading.hidden = true; player.frame.hidden = false;
      player.frame.classList.remove('tiktok-pending');
    }
  });
  return { measure: () => cards.forEach(measure) };
}

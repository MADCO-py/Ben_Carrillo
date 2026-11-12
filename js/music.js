const permissions = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';

export function createTrackRow(track, index) {
  const row = document.createElement('article');
  row.className = 'track';
  row.dataset.track = track.title;
  const number = document.createElement('span');
  number.className = 'track-number'; number.textContent = `0${index + 1}`;
  const metadata = document.createElement('div'); metadata.className = 'track-meta';
  const title = document.createElement('h3'); title.textContent = track.title.toUpperCase();
  const duration = document.createElement('small');
  const seconds = Math.floor(track.duration / 1000);
  duration.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  metadata.append(title, duration);
  const player = document.createElement('iframe');
  player.src = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;
  player.title = `${track.title} · Spotify`;
  player.width = '100%'; player.height = '80';
  player.allow = permissions;
  player.loading = 'lazy';
  player.setAttribute('allowfullscreen', '');
  row.append(number, metadata, player);
  return row;
}

export async function setupPlatforms() {
  const toggle = document.querySelector('.platform-toggle');
  const panel = document.querySelector('#platforms-panel');
  const grid = document.querySelector('#platforms-grid');
  const slot = document.querySelector('#album-player');
  let providers = [];
  const select = provider => {
    const iframe = document.createElement('iframe');
    iframe.src = provider.embed;
    iframe.title = `HIJO DE JAH · ${provider.name}`;
    iframe.allow = permissions;
    iframe.setAttribute('allowfullscreen', '');
    iframe.width = '100%'; iframe.height = String(provider.height);
    slot.style.setProperty('--player-height', `${provider.height}px`);
    slot.classList.toggle('is-video', !!provider.video);
    slot.replaceChildren(iframe);
    const fallback = document.createElement('a');
    fallback.href = provider.url; fallback.target = '_blank'; fallback.rel = 'noopener';
    fallback.className = 'player-fallback'; fallback.textContent = `${provider.name} ↗`;
    slot.append(fallback);
    grid.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.provider === provider.name)));
    slot.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  };
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  document.querySelector('[data-select-spotify]').addEventListener('click', event => {
    const spotify = providers.find(provider => provider.name === 'Spotify');
    if (spotify) { event.preventDefault(); select(spotify); }
  });
  try {
    const response = await fetch('content/platforms.json');
    if (!response.ok) throw new Error('Platforms unavailable');
    providers = await response.json();
    for (const provider of providers) {
      const item = document.createElement(provider.embed ? 'button' : 'a');
      item.className = 'platform-option';
      const name = document.createElement('span'); name.textContent = provider.name;
      const icon = document.createElement('span'); icon.textContent = provider.embed ? '▶' : '↗'; icon.setAttribute('aria-hidden', 'true');
      if (provider.embed) {
        item.type = 'button'; item.dataset.provider = provider.name;
        item.setAttribute('aria-pressed', String(provider.name === 'Spotify'));
        item.addEventListener('click', () => select(provider));
      } else {
        item.href = provider.url; item.target = '_blank'; item.rel = 'noopener';
      }
      item.append(name, icon); grid.append(item);
    }
  } catch (error) {
    console.error(error);
    const link = document.createElement('a');
    link.href = '#album-player'; link.textContent = 'Spotify ↑'; grid.append(link);
  }
}

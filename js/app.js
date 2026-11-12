import { createTrackRow, setupPlatforms } from './music.js?v=20261112-tiktok3';
import { createStoryRail } from './story-rail.js?v=20261112-tiktok3';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('#inicio');
const whiteVeil=document.querySelector('.white-veil');
const desertLayer=document.querySelector('.landscape.desert');
const coastLayer=document.querySelector('.landscape.coast');
const journeyFill=document.querySelector('.journey-meter i');
const story = document.querySelector('#historia');
const storyRail = createStoryRail(story, desertLayer, reducedMotion);
const outro = document.querySelector('#redes');
let positions = {}, scheduled = false, messages = {}, language = 'en';
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => { const x = clamp(n); return x * x * (3 - 2 * x); };
function measure() {
  storyRail.measure();
  const y = window.scrollY;
  positions = {
    hero: hero.offsetHeight,
    story: story.getBoundingClientRect().top + y,
    coast: document.querySelector('#fotografias').getBoundingClientRect().top + y,
    end: outro.getBoundingClientRect().top + y,
    total: document.documentElement.scrollHeight - innerHeight
  };
  updateWorld();
}
function updateWorld() {
  scheduled = false;
  const y = window.scrollY, h = innerHeight;
  const bookTravel = positions.hero - h;
  const reveal = smooth((y - bookTravel * .55) / (bookTravel * .2));
  const desert = smooth((y - positions.story + h * .85) / (h * .85));
  const coast = smooth((y - positions.coast + h * .25) / Math.max(h, positions.end - positions.coast));
  root.style.setProperty('--veil-opacity', (1 - reveal).toFixed(4));
  whiteVeil.style.opacity=(1-reveal).toFixed(4);
  root.style.setProperty('--desert-opacity', desert.toFixed(4));
  desertLayer.style.opacity=desert.toFixed(4);
  root.style.setProperty('--coast-opacity', coast.toFixed(4));
  coastLayer.style.opacity=coast.toFixed(4);
  storyRail.update(y);

  document.body.classList.toggle('in-los-angeles', coast>.55);
  root.style.setProperty('--progress', clamp(y / positions.total).toFixed(4));
  journeyFill.style.height=(clamp(y/positions.total)*100).toFixed(2)+'%';
  document.body.classList.toggle('scrolled', y > positions.hero * .75);
  document.querySelector('#journey-place').textContent = coast > .5 ? 'LOS ÁNGELES' : desert > .5 ? (language === 'en' ? 'THE JOURNEY' : language === 'quc' ? 'B’E' : 'EL CAMINO') : 'GUATEMALA';
}
addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateWorld); } }, { passive: true });
addEventListener('resize', measure);
reducedMotion.addEventListener('change', measure);
new ResizeObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(measure); } }).observe(document.querySelector('main'));
document.fonts.ready.then(measure);
addEventListener('load', measure);
measure();
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); mobileNav.hidden = true; }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); mobileNav.hidden = open; });
mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
const t = (key) => messages[key] || key;
let localeRequest = 0;
async function setLanguage(next) {
  const requestId = ++localeRequest;
  try {
    const response = await fetch(`content/i18n/${next}.json`);
    if (!response.ok) throw new Error('Language unavailable');
    const nextMessages = await response.json();
    if (requestId !== localeRequest) return;
    messages = nextMessages; language = next;
    root.lang = next;
    globalThis.benLocale = {language:next,messages:nextMessages};
    document.dispatchEvent(new CustomEvent('ben-language', { detail: { language: next, messages: nextMessages } }));
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = messages[el.dataset.i18n];
      if (!value) return;
      el.replaceChildren(...value.split('\n').flatMap((part, i) => i ? [document.createElement('br'), document.createTextNode(part)] : [document.createTextNode(part)]));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
      const value=messages[el.dataset.i18nAria];if(value)el.setAttribute('aria-label',value);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const value=messages[el.dataset.i18nPlaceholder];if(value)el.setAttribute('placeholder',value);
    });
    document.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === next)));
    document.querySelector('#translation-notice').hidden = next !== 'quc';
    document.querySelectorAll('[data-play]').forEach((button) => button.setAttribute('aria-label', `${t('play')}: ${button.dataset.title}`));
    document.querySelectorAll('[data-watch]').forEach((link) => { link.textContent = `${t('watchYoutube')} ↗`; });
    menuButton.setAttribute('aria-label', t('menu'));
    document.querySelector('.dialog-close').setAttribute('aria-label', t('close'));
    document.querySelectorAll('[data-track]').forEach((link) => { link.setAttribute('aria-label', `${t('listen')}: ${link.dataset.track} · Spotify`); });
    try { localStorage.setItem('ben-language-v2', next); } catch {}
    measure();
  } catch (error) { console.error(error); }
}
document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
let savedLanguage = 'en';
try { savedLanguage = localStorage.getItem('ben-language-v2') || 'en'; } catch {}
setLanguage(['en','es','quc'].includes(savedLanguage) ? savedLanguage : 'en');
setupPlatforms();
async function loadContent() {
  try {
    const [albumResponse, videosResponse] = await Promise.all([fetch('content/album.json'),fetch('content/videos.json')]);
    if (!albumResponse.ok || !videosResponse.ok) throw new Error('Content unavailable');
    const [album, videos] = await Promise.all([albumResponse.json(), videosResponse.json()]);
    const selected = ['Hakuna Matata','Marijuana','Zoom Zoom'];
    const list = document.querySelector('#track-list');
    for (const [i, title] of selected.entries()) {
      const track = album.tracks.find((item) => item.title === title);
      if (!track) continue;
      list.append(createTrackRow(track, i));
    }
    const grid = document.querySelector('#video-grid');
    for (const video of videos) {
      const card = document.createElement('article'); card.className = 'video-card';
      const frame = document.createElement('div'); frame.className = 'video-frame';
      const image = document.createElement('img'); image.src = `assets/images/videos/${video.id}.jpg`; image.alt = ''; image.width = 480;image.height = 360;image.loading = 'lazy';
      const button = document.createElement('button');button.type = 'button';button.dataset.play = video.id;button.dataset.title = video.title;button.setAttribute('aria-label',`${messages.play || 'Reproducir'}: ${video.title}`);
      const play = document.createElement('span');play.className='video-play';play.textContent='▶';play.setAttribute('aria-hidden','true');button.append(play);
      button.addEventListener('click', () => {
        document.querySelectorAll('.video-frame iframe').forEach((other) => {
          other.replaceWith(other._originalButton); // Restore another video so two players do not play together.
        });
        const iframe = document.createElement('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;iframe.title=video.title;iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';iframe.setAttribute('allowfullscreen','');iframe._originalButton=button;button.replaceWith(iframe);iframe.focus();
      });
      frame.append(image,button);
      const info = document.createElement('div');info.className='video-info';
      const heading = document.createElement('h3');heading.textContent=video.title.replace(/^Ben Carrillo - /,'').replace(' (Official Video)','');
      const link = document.createElement('a');link.dataset.watch='';link.href=`https://www.youtube.com/watch?v=${video.id}`;link.target='_blank';link.rel='noopener';link.textContent=`${messages.watchYoutube || 'Ver en YouTube'} ↗`;
      info.append(heading,link);card.append(frame,info);grid.append(card);
    }
    measure();
  } catch (error) {
    console.error(error);
    const fallback = document.createElement('a'); fallback.href='https://open.spotify.com/artist/2LaHOt5YZlFAhZ22KDI5fS';fallback.textContent='BEN CARRILLO · Spotify ↗';document.querySelector('#track-list').append(fallback);
    const videoFallback = document.createElement('a');videoFallback.href='https://www.youtube.com/channel/UCPkvHyXctZefIVJWj_UEEdA';videoFallback.textContent='BEN CARRILLO · YouTube ↗';document.querySelector('#video-grid').append(videoFallback);
  }
}
loadContent();
const dialog = document.querySelector('#credits-dialog');
document.querySelector('#credits-open').addEventListener('click', () => dialog.showModal());
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) { const box = dialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)dialog.close(); } });
document.querySelector('#year').textContent = new Date().getFullYear();

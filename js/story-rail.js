import { setupTikTokPlayers } from './tiktok-player.js?v=20261112-refine1';
import { createStoryWalker } from './story-walker.js?v=20261112-walker3';

// Native vertical scroll drives a pinned horizontal chapter; no wheel interception.
export function createStoryRail(section, desert, reducedMotion) {
  const viewport = section.querySelector('.story-window');
  const track = section.querySelector('.story-track');
  const cards = [...section.querySelectorAll('.story-post')];
  const fill = section.querySelector('.story-rail-progress span');
  const buttons = [...section.querySelectorAll('[data-story-direction]')];
  const walker = createStoryWalker(section, reducedMotion);
  let start = 0, distance = 0, lead = 0, travel = 0, enabled = false;
  let lastX = -1;
  const clamp = n => Math.max(0, Math.min(1, n));
  const tiktoks = setupTikTokPlayers(cards);

  function measure() {
    enabled = !reducedMotion.matches && innerHeight > 540;
    section.classList.toggle('story-pinned', enabled);
    section.style.setProperty('--story-window-height', `${viewport.clientHeight}px`);
    // Reset native horizontal position when returning from the reduced-motion layout.
    if (enabled) viewport.scrollLeft = 0;
    distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
    lead = innerHeight * .15;
    travel = distance + innerHeight * .4;
    section.style.height = enabled ? `${innerHeight + travel}px` : '';
    start = section.getBoundingClientRect().top + scrollY;
    walker.measure();
    tiktoks.measure();
    lastX = -1;
  }

  function update(y) {
    const progress = enabled ? clamp((y - start - lead) / Math.max(1, distance)) : 0;
    const x = progress * distance;
    if (x !== lastX) {
      track.style.transform = enabled ? `translate3d(${-x}px,0,0)` : '';
      fill.style.transform = `scaleX(${progress})`;
      // Only move the landscape bitmap; keep text and players on separate layers.
      desert.style.transform = enabled ? `translate3d(${(0.5 - progress) * 8}%,0,0) scale(1.1)` : '';
      lastX = x;
    }
    const disabled = [enabled && progress <= 0, enabled && progress >= 1];
    buttons.forEach((button, index) => {
      if (button.disabled !== disabled[index]) button.disabled = disabled[index];
    });
  }

  function move(direction) {
    const panels = [...track.children];
    const x = enabled ? clamp((scrollY - start - lead) / Math.max(1, distance)) * distance : viewport.scrollLeft;
    const stops = [...new Set([0, ...panels.slice(1).map(panel => Math.min(distance, panel.offsetLeft)), distance])];
    const target = direction > 0 ? stops.find(stop => stop > x + 3) ?? distance
      : stops.findLast(stop => stop < x - 3) ?? 0;
    if (enabled) scrollTo({ top: start + lead + target, behavior: 'smooth' });
    else viewport.scrollTo({ left: target, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  buttons.forEach(button => button.addEventListener('click', () => move(Number(button.dataset.storyDirection))));
  viewport.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  // Tabbing to an off-screen link must reveal its panel instead of clipping focus.
  viewport.addEventListener('focusin', event => {
    const panel = event.target.closest('.story-post');
    if (!enabled || !panel) return;
    viewport.scrollLeft = 0;
    scrollTo({ top: start + lead + Math.min(distance, panel.offsetLeft), behavior: 'instant' });
  });
  return { measure, update };
}

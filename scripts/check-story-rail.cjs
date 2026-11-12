const assert = require('node:assert/strict');
const { chromium, firefox } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await (process.env.BROWSER === 'firefox' ? firefox : chromium).launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Test layout independently of TikTok's availability, cookies or regional restrictions.
  await page.route('https://www.tiktok.com/player/**', route => route.fulfill({
    contentType: 'text/html', body: '<html><body style="background:#171717;color:white">TikTok player test</body></html>'
  }));
  const read = () => page.evaluate(() => {
    const section = document.querySelector('#historia');
    const stage = section.querySelector('.story-sticky');
    const viewport = section.querySelector('.story-window');
    const track = section.querySelector('.story-track');
    return {
      start: section.getBoundingClientRect().top + scrollY,
      height: section.offsetHeight, h: innerHeight, width: innerWidth,
      distance: track.scrollWidth - viewport.clientWidth,
      x: new DOMMatrixReadOnly(getComputedStyle(track).transform).m41,
      stageY: stage.getBoundingClientRect().top,
      desert: getComputedStyle(document.querySelector('.desert')).transform,
      opacity: Number(document.querySelector('.desert').style.opacity),
      last: section.querySelector('.story-post:last-child').getBoundingClientRect().right,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  const jump = async y => {
    await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(100);
  };
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.track');
    assert.equal(await page.locator('.story-post').count(), 4);
    assert.equal(await page.locator('.story-post iframe').count(), 0, 'Players must not load at entry');
    const initial = await read();
    assert(initial.distance > 500);
    assert(initial.scrollWidth <= width, 'Horizontal chapter must not widen the document');
    await jump(initial.start + initial.h * .15);
    const start = await read();
    assert(Math.abs(start.stageY) < 2 && Math.abs(start.x) < 2);
    assert(start.opacity > .99, 'Desert stays fully visible');
    assert(await page.locator('.story-controls').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'Controls must fit below the character');
    const actor = page.locator('.story-walker');
    await page.waitForFunction(() => {
      const actor = document.querySelector('.story-walker');
      return !actor.hidden && [...actor.querySelectorAll('img')].every(img => img.naturalWidth === 2172);
    });
    const gap = await page.locator('.story-track').evaluate(el => parseFloat(getComputedStyle(el).gap));
    assert(gap >= 150, 'Leave open desert between the posts');
    const actorX = () => actor.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    const moved = () => actor.evaluate(el => new Promise(resolve => {
      let frames = 0, distance = 0;
      const started = performance.now();
      let previous = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
      function sample() {
        const x = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
        distance += Math.abs(x - previous); previous = x;
        if (++frames >= 16) resolve(distance / ((performance.now() - started) / 1000)); else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }));
    const walking = await moved();
    assert(walking > 3, 'Character walks without scrolling');
    await actor.focus(); await page.keyboard.press('Enter');
    assert.equal(await actor.getAttribute('data-state'), 'run');
    const running = await moved();
    assert(running > walking * 1.7, 'First click increases travel speed');
    await page.keyboard.press('Enter');
    assert.equal(await actor.getAttribute('data-state'), 'sprint');
    const sprinting = await moved();
    assert(sprinting > running * 1.3, 'Second click increases speed again');
    await page.keyboard.press('Enter');
    assert.equal(await actor.getAttribute('data-state'), 'turbo');
    const turbo = await moved();
    assert(turbo > 20, 'Third click keeps running at the extra speed level');
    assert.equal(await actor.locator('.walker-run .walker-atlas').evaluate(el => getComputedStyle(el).animationDuration), '0.16s');
    await page.keyboard.press('Enter');
    assert.equal(await actor.getAttribute('data-state'), 'rest');
    const resting = await actorX();
    await page.waitForTimeout(250);
    assert.equal(await actorX(), resting, 'Fourth click sits down at the current position');
    assert.equal(await actor.locator('.walker-rest').evaluate(el => getComputedStyle(el).display), 'block');
    await page.screenshot({ path: `artifacts/story-rest-${process.env.BROWSER || 'chromium'}-${width}.png` });
    await page.keyboard.press('Enter');
    assert.equal(await actor.getAttribute('data-state'), 'walk');
    await jump(initial.start + initial.h * .15 + initial.distance / 2);
    const middle = await read();
    assert(Math.abs(middle.stageY) < 2, 'Chapter stays pinned');
    assert(Math.abs(middle.x + initial.distance / 2) < 3, 'Scroll drives the rail directly');
    assert.notEqual(middle.desert, start.desert, 'Landscape moves with the rail');
    const pausedX = middle.x;
    await page.waitForTimeout(200);
    assert.equal((await read()).x, pausedX, 'Rail must not drift after scrolling stops');
    await page.screenshot({ path: `artifacts/story-rail-${process.env.BROWSER || 'chromium'}-${width}.png` });
    // An HTTP 200 iframe can still report a TikTok server error. Test recovery
    // via the same origin- and source-validated messages used by the real player.
    assert(await page.locator('.story-post iframe').count()>0,'Visible posts load their native previews automatically');
    assert.equal(await page.locator('.tiktok-activate').count(),0,'No extra load button');
    const recovery = page.locator('.story-post').filter({has:page.locator('iframe')}).first();
    const signal = type => recovery.evaluate((card,type)=>dispatchEvent(new MessageEvent('message',{
      origin:'https://www.tiktok.com',source:card.querySelector('iframe').contentWindow,
      data:{'x-tiktok-player':true,type}
    })),type);
    await signal('onPlayerReady');
    await signal('onPlayerError');
    assert.equal(await recovery.locator('.tiktok-recovery').evaluate(el=>el.hidden),false);
    assert.equal(await recovery.locator('iframe').evaluate(el=>el.hidden),true);
    await recovery.locator('.tiktok-recovery button').evaluate(el=>el.click());
    assert.equal(await recovery.locator('iframe').evaluate(el=>el.hidden),false);
    await signal('onPlayerReady');
    assert.equal(await recovery.locator('.tiktok-recovery').evaluate(el=>el.hidden),true);
    await jump(initial.start + initial.h * .15 + initial.distance);
    const end = await read();
    assert(Math.abs(end.stageY) < 2 && end.last <= width + 2, 'Last post is visible before release');
    await jump(initial.start + initial.height - initial.h + 160);
    assert((await read()).stageY < -150, 'Normal vertical scroll resumes');
    await jump(initial.start + initial.h * .15);
    assert(Math.abs((await read()).x) < 2, 'Reverse scroll restores the opening');
    await page.locator('[data-story-direction="1"]').click();
    await page.waitForFunction(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.story-track')).transform).m41 < -100);
    await page.waitForTimeout(1100);
    assert(Math.abs((await read()).stageY) < 2, 'Arrow also navigates inside the pinned chapter');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#historia').evaluate(el => el.classList.contains('story-pinned')), false);
  assert.equal(await page.locator('.story-window').evaluate(el => getComputedStyle(el).overflowX), 'auto');
  await page.locator('.story-walker-lane').scrollIntoViewIfNeeded();
  const still = await page.locator('.story-walker').evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.story-walker').evaluate(el => getComputedStyle(el).transform), still);
  assert.equal(await page.locator('.walker-walk .walker-atlas').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 600 });
  await page.waitForTimeout(150);
  const short = await read();
  await jump(short.start + short.h * .15);
  assert(await page.locator('.story-controls').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'Controls fit on short phones');
  await page.screenshot({ path: `artifacts/story-short-${process.env.BROWSER || 'chromium'}.png` });
  await page.setViewportSize({ width: 900, height: 500 });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#historia').evaluate(el => el.classList.contains('story-pinned')), false);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(`PASS ${process.env.BROWSER || 'chromium'}: pinned rail, spacing, character walk/run/sprint/turbo/rest, keyboard, parallax, release, reverse, arrows, mobile and reduced motion`);
})().catch(error => { console.error(error); process.exit(1); });

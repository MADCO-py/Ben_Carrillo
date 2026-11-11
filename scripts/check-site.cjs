const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForSelector('.track');
 assert.equal(await page.locator('.track').count(),3);
 assert.equal(await page.locator('.video-card').count(),3);
 assert.equal(await page.locator('iframe').count(),0,'External players must not load on entry');
 await page.screenshot({path:'artifacts/desktop.png'});
 await page.screenshot({path:'artifacts/desktop-full.png',fullPage:true});
 for(const lang of ['en','quc','es']){
  await page.locator(`[data-lang="${lang}"]`).click();
  await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
  assert.equal(await page.locator('h1').innerText(),'¿QUIÉN\nPUTAS ES\nBEN CARRILLO?');
 }
 const dims=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert(dims.sw<=dims.w,JSON.stringify(dims));
 await page.locator('#historia').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 const desert=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--desert-opacity')));assert(desert>.7,'Desert must be visible in story');
 await page.locator('#redes').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 const coast=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--coast-opacity')));assert(coast>.8,'Beach must be visible at the end');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
 const veil=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--veil-opacity')));assert(veil>.99,'White must return on scroll up');
 await page.locator('#credits-open').click();assert(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('dialog').isVisible()));
 for(const width of [360,390,768,1024]){
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(100);
  const size=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert(size.sw<=size.w,`Overflow ${JSON.stringify(size)}`);
  if(width===390){
   await page.screenshot({path:'artifacts/mobile.png'});await page.screenshot({path:'artifacts/mobile-full.png',fullPage:true});
   await page.locator('.menu-toggle').click();assert(await page.locator('#mobile-nav').isVisible());await page.locator('#mobile-nav a[href="#album"]').click();assert(!(await page.locator('#mobile-nav').isVisible()));
  }
 }
 const images=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));assert.deepEqual(images,[]);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 // Prevent external loading during player interaction checks; inspect constructed embeds.
 await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>YouTube player test</p>'}));
 await page.route('https://open.spotify.com/embed/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>Spotify player test</p>'}));
 await page.locator('[data-play]').first().click();assert.equal(await page.locator('.video-frame iframe').count(),1);
 await page.locator('[data-play]').first().click();assert.equal(await page.locator('.video-frame iframe').count(),1,'Only one video at a time');
 await page.locator('#album .embed-activate').click();assert.equal(await page.locator('#album iframe').count(),1);
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop, 360/390/768/1024px, ES/EN/K’iche’, reverse scroll, menu, credits, reduced motion, deferred players, images, no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

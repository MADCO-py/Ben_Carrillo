const { chromium, firefox } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch({headless:true});
 const errors=[];
 const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForSelector('.track');
 assert.equal(await page.locator('.track').count(),3);
 assert.equal(await page.locator('.video-card').count(),3);
 assert.equal(await page.locator('iframe').count(),0,'External players must not load on entry');
 await page.screenshot({path:'artifacts/desktop.png'});
 await page.screenshot({path:'artifacts/desktop-full.png',fullPage:true});
 const originalBookTitle = await page.locator('h1').textContent();
 for(const lang of ['en','quc','es']){
  await page.locator(`[data-lang="${lang}"]`).click();
  await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
  assert.equal(await page.locator('h1').textContent(),originalBookTitle,'Book title stays in Spanish across languages');
 }
 const dims=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert(dims.sw<=dims.w,JSON.stringify(dims));
 const coverBounds=await page.locator('.book-cover').boundingBox();
 assert(Math.abs(coverBounds.x)<2&&Math.abs(coverBounds.width-1440)<2,'Cover must fill the viewport');
 assert.equal(await page.locator('.turning-page > .leaf-front > .paper-page').count(),1);
 assert.equal(await page.locator('.turning-page > .leaf-back > .paper-page').count(),1);
 await page.evaluate(()=>scrollTo({top:document.querySelector('#inicio').offsetHeight-innerHeight,behavior:'instant'}));
 await page.waitForFunction(()=>Number(document.querySelector('#inicio').style.getPropertyValue('--book-exit'))>.999);
 assert(Math.abs((await page.locator('#presentacion').boundingBox()).y)<3,'Continuous handoff to normal scroll');
 assert.equal(await page.locator('.book-bottomline').evaluate(el=>getComputedStyle(el).opacity),'0');
 await page.locator('#historia').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 const desert=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--desert-opacity')));assert(desert>.7,'Desert must be visible in story');
 await page.locator('#redes').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 const coast=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--coast-opacity')));assert(coast>.8,'Beach must be visible at the end');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
 const veil=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).getPropertyValue('--veil-opacity')));assert(veil>.99,'White must return on scroll up');
 await page.locator('#credits-open').click();assert(await page.locator('#credits-dialog').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('#credits-dialog').isVisible()));
 for(const width of [360,390,768,1024]){
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>Number(document.querySelector('.notebook').style.getPropertyValue('--book-open'))<.001&&Number(document.querySelector('.notebook').style.getPropertyValue('--book-turn'))<.001);
  const size=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert(size.sw<=size.w,`Overflow ${JSON.stringify(size)}`);
  if(width===390){
   await page.screenshot({path:'artifacts/mobile.png'});await page.screenshot({path:'artifacts/mobile-full.png',fullPage:true});
   await page.locator('.menu-toggle').click();assert(await page.locator('#mobile-nav').isVisible());await page.locator('#mobile-nav a[href="#album"]').click();assert(!(await page.locator('#mobile-nav').isVisible()));
  }
 }
 // Full-viewport notebook opens, turns a two-sided sheet, then leaves the landscape visible.
 await page.setViewportSize({width:1440,height:960});
 for(const [ratio,selector] of [[.31,'.index-spread'],[.64,'.bio-spread']]){
  await page.evaluate(r=>scrollTo({top:(document.querySelector('#inicio').offsetHeight-innerHeight)*r,behavior:'instant'}),ratio);
  await page.waitForFunction(selector=>!document.querySelector(selector).inert,selector);
  assert.equal(await page.locator(selector).evaluate(el=>el.inert),false);
 }
 assert.equal(await page.locator('.cover-sticker img').count(),5);
 assert.equal(await page.locator('.tour-row').count(),3);
 assert.equal(await page.locator('.product-card').count(),12);
 await page.locator('[data-merch-filter="objects"]').click();
 assert.equal(await page.locator('.product-card:visible').count(),3);
 await page.locator('.product-card:visible').first().click();assert(await page.locator('.product-dialog').isVisible());await page.keyboard.press('Escape');
 await page.locator('[data-merch-filter="all"]').click();assert.equal(await page.locator('.product-card:visible').count(),12);
 await page.locator('#email').fill('demo@example.com');await page.locator('[name="consent"]').check();await page.locator('#mailing-form button').click();
 assert(await page.locator('#mail-status').isVisible());assert.equal(await page.locator('#email').inputValue(),'');
 // At the bottom there is no automatic redirect. Deliberate extra wheel effort restarts.
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(400);
 assert(await page.evaluate(()=>scrollY>1000));
 await page.mouse.wheel(0,100);await page.waitForTimeout(50);assert(await page.evaluate(()=>scrollY>1000));
 for(let i=0;i<12;i++){await page.mouse.wheel(0,140);await page.waitForTimeout(60);}
 await page.waitForFunction(()=>scrollY<5,{timeout:5000});
 await page.waitForFunction(()=>Number(document.querySelector('.notebook').style.getPropertyValue('--book-open'))<.001&&Number(document.querySelector('.notebook').style.getPropertyValue('--book-turn'))<.001);
 await page.screenshot({path:'artifacts/desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/mobile.png'});
 await page.locator('#merch').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('.product-card img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:'artifacts/merch.png'});
 const images=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));assert.deepEqual(images,[]);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 // Prevent external loading during player interaction checks; inspect constructed embeds.
 await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>YouTube player test</p>'}));
 await page.route('https://open.spotify.com/embed/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>Spotify player test</p>'}));
 await page.locator('[data-play]').first().click();assert.equal(await page.locator('.video-frame iframe').count(),1);
 await page.locator('[data-play]').first().click();assert.equal(await page.locator('.video-frame iframe').count(),1,'Only one video at a time');
 await page.locator('#album .embed-activate').click();assert.equal(await page.locator('#album iframe').count(),1);
 assert.deepEqual(errors,[]);
 console.log('PASS: notebook, 5 stickers, tour, merch filters/dialog, demo mailing, deliberate restart, desktop, 360/390/768/1024px, ES/EN/K’iche’, reverse scroll, menu, credits, reduced motion, deferred players, images, no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

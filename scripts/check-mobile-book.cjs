const assert = require('node:assert/strict');
const {chromium, firefox} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const browser = await (process.env.BROWSER === 'firefox' ? firefox : chromium).launch();
 const page = await browser.newPage({viewport:{width:393,height:840},isMobile:process.env.BROWSER!=='firefox',hasTouch:true});
 await page.route('https://open.spotify.com/**',r=>r.fulfill({contentType:'text/html',body:'Spotify test'}));
 await page.route('https://www.tiktok.com/**',r=>r.fulfill({contentType:'text/html',body:'TikTok test'}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 async function move(p){
   await page.evaluate(p=>{dispatchEvent(new WheelEvent('wheel'));scrollTo({top:(document.querySelector('#inicio').offsetHeight-innerHeight)*p,behavior:'instant'});},p);
   await page.waitForTimeout(150);
 }
 for(const [width,height] of [[360,740],[393,840],[412,915],[393,660]]){
  await page.setViewportSize({width,height});await move(0);
  const cover=await page.locator('.book-cover').boundingBox();
  assert(Math.abs(cover.x)<2&&Math.abs(cover.width-width)<2,'Closed cover fills the phone');
  assert(Math.abs(cover.height-height)<2,'Cover fits the visible height');
  await page.screenshot({path:`artifacts/book-phone-cover-${width}-${height}.png`});
  await move(.31);
  await page.screenshot({path:`artifacts/book-phone-index-${width}-${height}.png`});
  await move(.585);
  assert.equal(await page.locator('.bio-photo-page').first().evaluate(el=>getComputedStyle(el).visibility),'visible','Photo is present while the mobile sheet reveals the biography');
  assert(!(await page.locator('.turning-page').getAttribute('class')).includes('gpu-page'),'Mobile uses native sheet composition');
  await move(.70);
  assert(await page.locator('#biografia .book-polaroid').isVisible());
  assert(!(await page.locator('.open-book').isVisible()),'Do not repeat the journey CTA');
  const footer=await page.locator('.book-bottomline').boundingBox();
  assert(footer.y>=0&&footer.y+footer.height<=height+1,'Footer fits the visible screen');
  const photo=await page.locator('#biografia .book-polaroid').boundingBox();
  assert(photo.x>=0&&photo.x+photo.width<=width,'Photo stays inside the page');
  const pageBox=await page.locator('#biografia .bio-text-page').boundingBox();
  assert(pageBox.y+pageBox.height<=footer.y+3,'Biography does not overlap the footer');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  await page.screenshot({path:`artifacts/book-phone-bio-${width}-${height}.png`});
 }
 // Simulate browser bars disappearing without changing device width.
 await page.setViewportSize({width:393,height:700});await move(.31);
 const before=await page.evaluate(()=>({p:scrollY/(document.querySelector('#inicio').offsetHeight-innerHeight),travel:document.querySelector('#inicio').offsetHeight-innerHeight}));
 await page.setViewportSize({width:393,height:820});await page.waitForTimeout(200);
 const after=await page.evaluate(()=>({p:scrollY/(document.querySelector('#inicio').offsetHeight-innerHeight),travel:document.querySelector('#inicio').offsetHeight-innerHeight}));
 assert(Math.abs(after.p-before.p)<.002,'Browser bar resize preserves the current page');
 assert(Math.abs(after.travel-before.travel)<2,'Scroll runway remains stable');
 await move(1);
 assert(Math.abs((await page.locator('#presentacion').boundingBox()).y)<3,'Continuous handoff after mobile resize');
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS mobile book: cover, portrait during turn, biography, one CTA, footer, toolbar resizing, continuous exit');
})().catch(e=>{console.error(e);process.exit(1)});

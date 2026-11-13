const assert=require('node:assert/strict');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch();
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://open.spotify.com/**',r=>r.fulfill({contentType:'text/html',body:'Spotify test'}));
 await page.route('https://www.tiktok.com/**',r=>r.fulfill({contentType:'text/html',body:'TikTok preview test'}));
 await page.route('**/js/vendor/libphonenumber-min.js',async r=>{await new Promise(resolve=>setTimeout(resolve,250));await r.continue();});
 await page.addInitScript(()=>localStorage.setItem('ben-language','es'));
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelectorAll('#phone-country option').length>240);
 await page.waitForFunction(()=>document.querySelector('.book-cover .cover-bottom').textContent.includes('songs'));
 assert.equal(await page.locator('html').getAttribute('lang'),'en','English is the new default even with the previous default preference');
 await page.locator('#email').fill('early@example.com');await page.locator('[name="consent"]').check();
 await page.locator('#mailing-form button[type="submit"]').click();
 assert((await page.locator('#mail-status').textContent()).includes('not saved or sent'),'A late-loading book module still receives the initial English locale');
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
 assert.deepEqual(await page.locator('[data-lang]').evaluateAll(els=>els.map(el=>el.dataset.lang)),['en','es','ar','cak','pt','ru']);
 assert.equal(await page.locator('.cover-sticker img').count(),3);
 assert.equal(await page.locator('.sticker-quetzal img').count(),1);
 assert.equal(await page.locator('.sticker-bus-ben img').count(),1);
 assert.equal(await page.locator('.sticker-bolsa-ben img').count(),1);
 assert((await page.locator('link[rel="icon"]').getAttribute('href')).includes('icono-64.png'));
 assert.equal(await page.locator('#biografia .book-polaroid').count(),2);
 assert.equal(await page.locator('#biografia .book-signature img').count(),1);
 assert.equal(await page.locator('.photo-archive-grid img').count(),6);
 assert.deepEqual(await page.locator('.story-post').evaluateAll(els=>els.map(el=>el.dataset.tiktokId)),[
  '7602424549593910542','7498185231090896170','7554576595160173879','7550853818729106701','7707047650616446222'
 ]);
 async function move(r){await page.evaluate(r=>scrollTo({top:(document.querySelector('#inicio').offsetHeight-document.querySelector('.book-stage').clientHeight)*r,behavior:'instant'}),r);await page.waitForTimeout(200);}
 await page.screenshot({path:`artifacts/artist-cover-${process.env.BROWSER||'chromium'}.png`});
 await move(.31);await page.screenshot({path:`artifacts/artist-index-${process.env.BROWSER||'chromium'}.png`});
 await move(.7);await page.screenshot({path:`artifacts/artist-bio-${process.env.BROWSER||'chromium'}.png`});
 assert((await page.locator('#biografia').textContent()).includes('crossed the border on foot'));
 await page.locator('#language-menu').evaluate(el=>el.open=true);
 await page.locator('[data-lang="es"]').click();
 await page.waitForFunction(()=>document.documentElement.lang==='es');
 assert((await page.locator('#biografia').textContent()).includes('cruzó la frontera a pie'));
 assert((await page.locator('h1').textContent()).includes('PUTAS'));
 assert((await page.locator('.ben-phrases').first().textContent()).includes('mis baddiez!!'));
 assert((await page.locator('#phone-country option[value="JP"]').textContent()).includes('Japón'));
 await page.reload({waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.documentElement.lang==='es');
 await page.locator('#language-menu').evaluate(el=>el.open=true);
 await page.locator('[data-lang="en"]').click();await page.waitForFunction(()=>document.documentElement.lang==='en');
 await page.locator('#mailing').scrollIntoViewIfNeeded();
 const input=page.locator('#phone'),country=page.locator('#phone-country');
 assert(!(await input.getAttribute('required')));
 assert(await page.locator('#email').evaluate(el=>el.required));
 for(const [region,value,expected] of [
  ['GT','5555 5555','+50255555555'],['GT','+1 213 373 4253','+12133734253'],
  ['GB','020 7946 0958','+442079460958'],['IN','+91 98765 43210','+919876543210'],['JP','+81 90 1234 5678','+819012345678']
 ]){
  await input.fill('');await country.selectOption(region);await input.fill(value);await input.blur();
  assert(await input.evaluate(el=>el.checkValidity()),`Valid ${region} number accepted`);
  assert.equal(await input.getAttribute('data-e164'),expected);
 }
 await input.fill('123');await input.blur();assert(!(await input.evaluate(el=>el.checkValidity())));
 await input.fill('');await input.blur();assert(await input.evaluate(el=>el.checkValidity()),'Empty phone is allowed');
 await page.locator('#email').fill('fan@example.com');await page.locator('[name="consent"]').check();
 await page.locator('#mailing-form button[type="submit"]').click();
 assert(await page.locator('#mail-status').isVisible());
 assert((await page.locator('#mail-status').textContent()).includes('not saved or sent'));
 await page.screenshot({path:`artifacts/artist-phone-${process.env.BROWSER||'chromium'}.png`});
 await page.locator('#fotografias').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/artist-gallery-${process.env.BROWSER||'chromium'}.png`});
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: English default, Spanish preference, fixed phrases, 3 stickers, signature, child/adult portraits, logo, 5 TikToks, worldwide optional phone validation and demo form');
})().catch(error=>{console.error(error);process.exit(1)});

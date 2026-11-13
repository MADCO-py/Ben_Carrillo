const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const codes=['en','es','ar','cak','pt','ru'];
 const dictionaries=Object.fromEntries(codes.map(code=>[code,JSON.parse(fs.readFileSync(`content/i18n/${code}.json`,'utf8'))]));
 const keys=Object.keys(dictionaries.en).sort();
 for(const code of codes)assert.deepEqual(Object.keys(dictionaries[code]).filter(k=>!k.startsWith('_')).sort(),keys);
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch();
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://open.spotify.com/**',r=>r.fulfill({contentType:'text/html',body:'Spotify test'}));
 await page.route('https://www.tiktok.com/**',r=>r.fulfill({contentType:'text/html',body:'TikTok test'}));
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelectorAll('#phone-country option').length>240);
 async function move(p){
  await page.evaluate(p=>{dispatchEvent(new WheelEvent('wheel'));const s=document.querySelector('#inicio');scrollTo({top:(s.offsetHeight-document.querySelector('.book-stage').clientHeight)*p,behavior:'instant'});},p);
  await page.waitForTimeout(150);
 }
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:960});
  await move(0);
  assert.equal(await page.locator('.cover-face').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(22, 67, 151)');
  await page.screenshot({path:`artifacts/blue-cover-${width}.png`});
  for(const code of codes){
   await move(0);
   await page.locator('#language-menu summary').click();
   assert.deepEqual(await page.locator('[data-lang]').evaluateAll(els=>els.map(el=>el.dataset.lang)),codes);
   await page.locator(`[data-lang="${code}"]`).click();
   await page.waitForFunction(code=>document.documentElement.lang===code&&!document.querySelector('#language-menu').open,code);
   assert.equal(await page.locator('html').getAttribute('dir'),code==='ar'?'rtl':'ltr');
   assert.equal(await page.locator('#language-menu').evaluate(el=>el.open),false);
   assert.equal(await page.locator('[data-i18n="navMusic"]').first().textContent(),dictionaries[code].navMusic);
   assert.equal(await page.locator('#translation-notice').evaluate(el=>!el.hidden),code==='cak');
   if(code==='cak')assert.equal(await page.locator('#biografia [data-i18n="bioLead"]').getAttribute('lang'),'es','Long untranslated content is explicitly Spanish');
   assert((await page.locator('h1').textContent()).includes('PUTAS'));
   assert((await page.locator('.ben-phrases').first().textContent()).includes('mis baddiez!!'));
   await move(.31);
   await page.screenshot({path:`artifacts/language-index-${code}-${width}.png`});
   await move(.7);
   await page.locator('#biografia .book-signature').scrollIntoViewIfNeeded();
   const signature=await page.locator('#biografia .book-signature img').boundingBox();
   assert(signature.width>(width===390?300:400),'Signature is substantially larger in the same biography location');
   await page.screenshot({path:`artifacts/language-bio-${code}-${width}.png`});
   const dimensions=await page.evaluate(()=>({w:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert(dimensions.scrollWidth<=dimensions.w,`${code} overflow: ${JSON.stringify(dimensions)}`);
   assert.equal(await page.locator('.story-track').evaluate(el=>getComputedStyle(el).direction),'ltr','Horizontal journey keeps its coordinate system');
   await page.locator('#mailing').scrollIntoViewIfNeeded();
   await page.locator('#phone').fill('123');await page.locator('#phone').blur();
   assert.equal(await page.locator('#phone').evaluate(el=>el.validationMessage),dictionaries[code].phoneInvalid);
   await page.locator('#phone').fill('+1 213 373 4253');await page.locator('#phone').blur();
   assert.equal(await page.locator('#phone').getAttribute('data-e164'),'+12133734253');
  }
 }
 await page.reload({waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.documentElement.lang==='ru');
 assert.equal(await page.locator('#current-language').textContent(),'Русский','Chosen locale persists');
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: six ordered locales, Arabic RTL, explicit Kaqchikel fallback, blue cover, larger signature, fixed phrases, mobile overflow, phone messages and preference persistence');
})().catch(error=>{console.error(error);process.exit(1)});

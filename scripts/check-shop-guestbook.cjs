const assert=require('node:assert/strict');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch();
 const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage(),errors=[],posts=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 await page.route('https://open.spotify.com/**',r=>r.fulfill({body:'Spotify test'}));await page.route('https://www.tiktok.com/**',r=>r.fulfill({body:'TikTok test'}));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;});
 const url=process.env.SITE_URL||'http://127.0.0.1:4173/';
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForSelector('.product-card');assert.equal(await page.locator('.product-card').count(),6);
 const merch=await page.locator('#merch').boundingBox();assert(merch.height<500,'Merch has no viewport-sized empty gap');
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:960});await page.waitForTimeout(200);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
  const s=await page.locator('.cover-face').evaluate(el=>({w:el.clientWidth,bus:el.querySelector('.sticker-bus-ben').clientWidth,bag:el.querySelector('.sticker-bolsa-ben').clientWidth,bird:el.querySelector('.sticker-quetzal').clientWidth}));assert(s.bus/s.w<=.50&&s.bag/s.w<=.23&&s.bird/s.w<=.16);
  await page.screenshot({path:`artifacts/new-cover-${process.env.BROWSER||'chromium'}-${width}.png`});
  await page.locator('#merch').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/new-merch-${process.env.BROWSER||'chromium'}-${width}.png`});await page.locator('.product-card').nth(1).click();assert(await page.locator('.shop-dialog').isVisible());
  assert(await page.locator('.shop-product-image img').evaluate(el=>el.clientHeight>250));
  await page.locator('.shop-plus').click();assert(await page.locator('.shop-product .shop-primary').isDisabled());await page.getByRole('button',{name:'M',exact:true}).click();
  await page.screenshot({path:`artifacts/new-product-${process.env.BROWSER||'chromium'}-${width}.png`});await page.locator('.shop-product .shop-primary').click();assert.equal(await page.locator('[data-cart-count]').textContent(),width===1440?'1':'2');await page.locator('.shop-cart-footer .shop-primary').click();
  assert.equal(await page.locator('#shop-country').inputValue(),'United States');assert(await page.locator('#shop-country').evaluate(e=>e.readOnly));assert.equal(await page.locator('#shop-state option').count(),52);
  await page.getByRole('button',{name:'PayPal',exact:true}).click();assert((await page.locator('.shop-status').textContent()).includes('No charge'));
  await page.locator('.shop-form button[type=submit]').click();assert.equal(await page.locator('.shop-review').count(),0);
  for(const [key,value]of Object.entries({email:'fan@example.com',first:'Ben',last:'Carrillo',address:'123 Example St',city:'Los Angeles',zip:'90001'}))await page.locator('#shop-'+key).fill(value);
  await page.locator('#shop-state').selectOption('CA');await page.locator('#shop-zip').fill('abc');assert(!(await page.locator('#shop-zip').evaluate(e=>e.checkValidity())));await page.locator('#shop-zip').fill('90001');
  await page.locator('[name=same-billing]').uncheck();assert(await page.locator('#shop-bill-address').isVisible());await page.locator('.shop-form button[type=submit]').click();assert.equal(await page.locator('.shop-review').count(),0);await page.locator('[name=same-billing]').check();
  await page.locator('.shop-form button[type=submit]').click();assert(await page.locator('.shop-review button').isDisabled());assert((await page.locator('.shop-review').textContent()).includes('No charge or order'));
  await page.screenshot({path:`artifacts/new-checkout-${process.env.BROWSER||'chromium'}-${width}.png`});await page.keyboard.press('Escape');
  await page.locator('[data-open-cart]').click();await page.locator('.shop-cart-footer .shop-primary').click();assert.equal(await page.locator('#shop-email').inputValue(),'');await page.keyboard.press('Escape');
  await page.locator('#signature-open').click();await page.waitForFunction(()=>document.querySelector('#signature-dialog').open&&document.querySelector('#signature-canvas').clientHeight>500);const canvas=page.locator('#signature-canvas');assert.equal(await canvas.evaluate(e=>Math.round(e.getBoundingClientRect().height)),await page.evaluate(()=>innerHeight));const r=await canvas.boundingBox(),y=await page.evaluate(()=>scrollY);
  async function draw(){await page.mouse.move(r.x+30,r.y+80);await page.mouse.down();await page.mouse.move(r.x+r.width*.65,r.y+190,{steps:20});await page.mouse.up();}
  await draw();assert(Math.abs((await page.evaluate(()=>scrollY))-y)<3);assert(await page.locator('#signature-save').isEnabled());await page.locator('#signature-undo').click();assert(await page.locator('#signature-save').isDisabled());await draw();await page.locator('#signature-save').click();await page.waitForFunction(()=>document.querySelector('#signature-status').textContent.includes('Saved on this browser'));
  assert((await page.locator('#signature-status').textContent()).includes('Saved on this browser'));
  const ink=await canvas.getAttribute('data-ink'),saved=await page.locator('#signature-wall figure').count();await page.screenshot({path:`artifacts/new-signatures-${process.env.BROWSER||'chromium'}-${width}.png`});await page.reload({waitUntil:'networkidle'});await page.waitForFunction(n=>document.querySelectorAll('#signature-wall figure').length===n,saved);assert.equal(await canvas.getAttribute('data-ink'),ink);assert.equal(await page.locator('[data-cart-count]').textContent(),width===1440?'1':'2');
  assert(!(await page.evaluate(()=>JSON.stringify(localStorage))).includes('fan@example.com'));const d=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert(d.sw<=d.w,JSON.stringify(d));
 }
 await page.locator('#language-menu').evaluate(el=>el.open=true);await page.locator('[data-lang=es]').click();await page.waitForFunction(()=>document.documentElement.lang==='es');await page.locator('[data-open-cart]').click();assert((await page.locator('.shop-dialog').textContent()).includes('Bolsa'));await page.keyboard.press('Escape');assert.equal(await page.locator('#signature-title').textContent(),'Dejá tu firma.');
 const ink=await page.locator('#signature-canvas').getAttribute('data-ink'),other=await browser.newContext(),friend=await other.newPage();await friend.goto(url);await friend.waitForSelector('#signature-canvas[data-ink]',{state:'attached'});assert.notEqual(await friend.locator('#signature-canvas').getAttribute('data-ink'),ink);await other.close();
 assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);await browser.close();console.log('PASS: small stickers, 6 garments, required size, persistent bag, validated US address, billing, inactive payments, no data sent, drawing/undo/save, persisted marks and device ink, mobile, translation');
})().catch(e=>{console.error(e);process.exit(1)});

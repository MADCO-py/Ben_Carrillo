const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch();
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.route('https://open.spotify.com/**',r=>r.fulfill({contentType:'text/html',body:'Spotify test'}));
 const errors=[],badResponses=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)badResponses.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4174/Ben_Carrillo/',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 async function move(r){
  const expected=await page.evaluate(r=>{dispatchEvent(new WheelEvent('wheel',{deltaY:0}));const target=(document.querySelector('#inicio').offsetHeight-innerHeight)*r;scrollTo({top:target,behavior:'instant'});return target;},r);
  await page.waitForFunction(y=>Math.abs(scrollY-y)<2,expected);
  await page.waitForFunction(r=>{const clamp=x=>Math.max(0,Math.min(1,x));const ease=x=>{x=clamp(x);return x*x*(3-2*x)};const book=document.querySelector('.notebook'),section=document.querySelector('#inicio');const position=-section.getBoundingClientRect().top/(section.offsetHeight-innerHeight);return Math.abs(Number(book.style.getPropertyValue('--book-open'))-ease(position/.23))<.0001&&Math.abs(Number(book.style.getPropertyValue('--book-turn'))-ease((position-.4)/.22))<.0001;},r);
 }

 async function value(key){return page.locator('.notebook').evaluate((el,key)=>Number(el.style.getPropertyValue('--book-'+key)),key);}
 async function end(key,n){await page.waitForFunction(({key,n})=>Math.abs(Number(document.querySelector('.notebook').style.getPropertyValue('--book-'+key))-n)<.000001,{key,n});}
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:960});
  await move(0);await end('open',0);assert(await page.locator('.book-arrow-prev').isDisabled());
  await move(.115);const half=await value('open');assert(half>.2&&half<.8,'Cover follows the scroll');
  await page.waitForTimeout(800);assert.equal(await value('open'),half,'Stopping the scroll must intentionally pause the cover');
  await page.locator('.book-arrow-next').click();await end('open',1);await end('turn',0);
  await page.waitForFunction(()=>document.querySelector('.turning-page').dataset.renderMode==='webgl'||document.querySelector('.turning-page').dataset.renderMode==='texture');
  await page.evaluate(()=>{window.turnSamples=[];window.sampleTurns=true;function sample(){turnSamples.push(Number(document.querySelector('.notebook').style.getPropertyValue('--book-turn')));if(sampleTurns)requestAnimationFrame(sample);}requestAnimationFrame(sample);});
  await page.locator('.book-arrow-next').click();await end('turn',1);
  await page.evaluate(()=>window.sampleTurns=false);
  const samples=await page.evaluate(()=>turnSamples);
  console.log('Turn frames',width,samples.filter(x=>x>.05&&x<.95).length);
  assert(samples.filter(x=>x>.05&&x<.95).length>=3,'Arrow must visibly travel through intermediate frames');
  await move(.51);const leaf=await value('turn');assert(leaf>.2&&leaf<.8,'Sheet must remain controllable halfway through the turn');
  await page.waitForTimeout(800);assert.equal(await value('turn'),leaf,'No automatic jump while idle');
  // Every curved strip must show its corresponding portion of the page.
  const crops=await page.locator('.leaf-segment .leaf-front .leaf-crop').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
  const gpu=await page.locator('.turning-page').getAttribute('data-render-mode');
  if(gpu==='webgl')assert(await page.locator('.leaf-canvas').isVisible(),'Accelerated curved sheet must be visible');
  else assert(crops.filter(s=>s!=='none').length>=12,'Curved page offsets must resolve');
  await page.locator('.book-arrow-next').click();await end('turn',1);
  assert(!(await page.locator('.book-arrow-prev').isDisabled()));
  await page.locator('.book-arrow-prev').click();await end('turn',0);await end('open',1);
  await page.locator('.book-arrow-prev').click();await end('open',0);
  await page.locator('.book-arrow-next').click();await end('open',1);
  await page.locator('.book-arrow-next').click();await end('turn',1);
  await page.locator('.book-arrow-next').click();
  await page.waitForFunction(()=>Number(document.querySelector('#inicio').style.getPropertyValue('--book-exit'))===1);
  assert(await page.locator('.book-arrow-next').isDisabled());
  assert(await page.locator('#presentacion').isVisible());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert(overflow<=0);
 }
 await page.setViewportSize({width:1440,height:960});await move(.31);await end('open',1);
 await page.screenshot({path:'artifacts/book-arrows.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
 await browser.close();console.log('PASS: GitHub Pages subpath, Chrome desktop/mobile, scroll-controlled intermediate frames, pencil arrows both ways, page crops, continuous exit, no missing resources or JS errors.');
})().catch(e=>{console.error(e);process.exit(1)});

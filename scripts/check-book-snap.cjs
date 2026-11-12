const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 async function move(ratio){await page.evaluate(r=>scrollTo({top:(document.querySelector('#inicio').offsetHeight-innerHeight)*r,behavior:'instant'}),ratio);}
 async function value(key){return page.locator('.notebook').evaluate((el,key)=>Number(el.style.getPropertyValue('--book-'+key)),key);}
 async function settled(key,target){await page.waitForFunction(({key,target})=>Number(document.querySelector('.notebook').style.getPropertyValue('--book-'+key))===target,{key,target});}
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:960});
  await move(0);await settled('turn',0);await settled('open',0);
  await move(.10);await page.waitForTimeout(1000);assert.equal(await value('open'),0,'A short scroll must leave the cover closed');
  await move(.16);await settled('open',1);assert.equal(await value('open'),1,'Opening must finish after scrolling stops');
  await move(.47);await page.waitForTimeout(1000);assert.equal(await value('turn'),0,'The next page requires more scroll effort');
  await move(.505);await settled('turn',1);assert.equal(await value('turn'),1,'The page must settle fully on the other side');
  await page.waitForTimeout(1000);assert.equal(await value('turn'),1,'An idle page must remain fully open');
  await move(.44);await page.waitForTimeout(1000);assert.equal(await value('turn'),1,'A small reverse scroll must not flip the page back');
  await move(.40);await settled('turn',0);assert.equal(await value('turn'),0,'A deliberate reverse scroll must complete the return');
  await move(.04);await settled('open',0);
 }
 assert.equal(await page.locator('.little-sun').count(),0);
 assert.equal(await page.locator('.dreamer-doodle').count(),1);
 assert(await page.locator('#indice .book-doodles').count()>0);
 await page.setViewportSize({width:1440,height:960});await move(.31);await settled('open',1);
 await page.screenshot({path:'artifacts/notebook-snap.png'});
 await browser.close();console.log('PASS: desktop and mobile scroll thresholds, completed turns while idle, reverse hysteresis, graphite doodles.');
})().catch(e=>{console.error(e);process.exit(1)});

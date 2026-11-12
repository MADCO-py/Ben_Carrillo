const assert = require('node:assert/strict');
const {chromium,firefox} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch();
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 const errors=[];let requests=0, blocked=true;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://open.spotify.com/**',r=>r.fulfill({contentType:'text/html',body:'Spotify test'}));
 await page.route('https://www.tiktok.com/player/**',r=>{
   requests++;
   return r.fulfill({status:blocked?429:200,contentType:'text/html',body:blocked?
    '<h1>429 Too Many Requests</h1>':
    '<h1>Player ready</h1><script>parent.postMessage({"x-tiktok-player":true,type:"onPlayerReady"},"*")</script>'});
 });
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
   const section=document.querySelector('#historia');
   const card=section.querySelector('.story-post');
   scrollTo({top:section.offsetTop+innerHeight*.15+card.offsetLeft,behavior:'instant'});
 });
 await page.waitForTimeout(250);
 assert.equal(requests,0,'No TikTok requests before an explicit click');
 assert.equal(await page.locator('.story-post iframe').count(),0);
 const card=page.locator('.story-post').first();
 const response=page.waitForResponse(r=>r.url().includes('tiktok.com/player/')&&r.status()===429);
 await card.locator('.tiktok-activate').click();
 await response;
 await page.waitForTimeout(150);
 assert.equal(requests,1,'Only the selected player loads');
 assert.equal(await card.locator('iframe').evaluate(el=>getComputedStyle(el).opacity),'0','Never expose the raw HTTP error document');
 assert(await card.locator('.story-player-loading').isVisible(),'Load event must not dismiss the loading cover');
 await card.locator('.tiktok-recovery').waitFor({state:'visible',timeout:20000});
 assert.equal(requests,1,'No automatic retry burst after 429');
 assert(await card.locator('iframe').evaluate(el=>el.hidden));
 await page.screenshot({path:`artifacts/tiktok-429-${process.env.BROWSER||'chromium'}.png`});
 blocked=false;
 await card.locator('.tiktok-recovery button').click();
 await page.waitForFunction(()=>{
   const card=document.querySelector('.story-post');
   return !card.querySelector('iframe').classList.contains('tiktok-pending');
 });
 assert.equal(requests,2,'Retry occurs only after the user asks');
 assert(!(await card.locator('.story-player-loading').isVisible()));
 assert(!(await card.locator('.tiktok-recovery').isVisible()));
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS: click-only TikTok loading, concealed HTTP 429, timeout recovery, no automatic retries, manual retry and ready handshake');
})().catch(error=>{console.error(error);process.exit(1)});

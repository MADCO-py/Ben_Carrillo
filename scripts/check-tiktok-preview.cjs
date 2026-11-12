const assert=require('node:assert/strict');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await (process.env.BROWSER==='firefox'?firefox:chromium).launch();
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 const errors=[];let requests=0;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://open.spotify.com/**',r=>r.fulfill({contentType:'text/html',body:'Spotify test'}));
 // A healthy native preview is allowed to load without a player-ready message.
 await page.route('https://www.tiktok.com/player/**',r=>{
  requests++;
  return r.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#26352f;color:white">Native TikTok preview</body></html>'});
 });
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 assert.equal(requests,0,'Do not fetch distant TikToks while viewing the book');
 assert.equal(await page.locator('.tiktok-activate').count(),0,'No intermediate activation button');
 const ids=await page.locator('.story-post').evaluateAll(cards=>cards.map(card=>card.dataset.tiktokId));
 assert.deepEqual(ids,['7602424549593910542','7550853818729106701','7498185231090896170','7707047650616446222']);
 for(let i=0;i<4;i++){
  await page.evaluate(i=>{
   const section=document.querySelector('#historia'),viewport=section.querySelector('.story-window'),track=section.querySelector('.story-track');
   const card=section.querySelectorAll('.story-post')[i];
   scrollTo({top:section.offsetTop+innerHeight*.15+Math.min(card.offsetLeft,track.scrollWidth-viewport.clientWidth),behavior:'instant'});
  },i);
  const card=page.locator('.story-post').nth(i);
  await card.locator('iframe').waitFor({state:'visible'});
  await page.waitForFunction(i=>{
   const card=document.querySelectorAll('.story-post')[i];
   return card.querySelector('.story-player-loading').hidden&&!card.querySelector('iframe').classList.contains('tiktok-pending');
  },i);
  assert.equal(await card.locator('iframe').evaluate(el=>getComputedStyle(el).opacity),'1');
 }
 assert.equal(requests,4,'Each post loads once in the original sequence');
 const card=page.locator('.story-post').last();
 const handle=await card.locator('iframe').elementHandle();
 const nativeFrame=await handle.contentFrame();
 await nativeFrame.waitForURL('https://www.tiktok.com/player/**');
 await nativeFrame.evaluate(()=>parent.postMessage({'x-tiktok-player':true,type:'onPlayerError'},'*'));
 await card.locator('.tiktok-recovery').waitFor({state:'visible'});
 await card.locator('.tiktok-recovery button').click();
 await page.waitForFunction(()=>!document.querySelector('.story-post:last-child iframe').classList.contains('tiktok-pending'));
 assert.equal(requests,5,'Manual retry restores the native preview');
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: automatic native TikTok previews, requested order, no extra click, no ready-message deadlock, manual recovery');
})().catch(error=>{console.error(error);process.exit(1)});

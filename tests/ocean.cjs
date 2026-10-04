// Run against a static preview: PLAYWRIGHT_MODULE_PATH=/path/to/playwright node tests/ocean.cjs
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const url=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:4173';

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];
 async function open(options={},initialize){
  const context=await browser.newContext({viewport:{width:390,height:844},...options});
  if(initialize)await context.addInitScript(initialize);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);return page;
 }
 async function start(page){
  await page.locator('#sound').click();
  await page.waitForFunction(()=>ocean.source&&ocean.context.state==='running');
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 }
 try{
  const page=await open({},()=>{
   window.sessionAssignments=[];
   Object.defineProperty(navigator,'audioSession',{value:{set type(value){window.sessionAssignments.push(value)}}});
  });
  await start(page);
  const seam=await page.evaluate(async()=>{
   const buffer=ocean.buffer,rate=buffer.sampleRate;
   const output=new OfflineAudioContext(2,rate,rate);
   const source=output.createBufferSource();source.buffer=buffer;
   source.loop=ocean.source.loop;source.loopStart=ocean.source.loopStart;source.loopEnd=ocean.source.loopEnd;
   source.connect(output.destination);
   const offset=buffer.length-Math.round(rate/4);source.start(0,offset/rate);
   const result=await output.startRendering();
   let difference=0,silentFrames=0,longestSilence=0;
   for(let i=0;i<result.length;i++){
    let power=0;
    for(let channel=0;channel<2;channel++){
     const sample=result.getChannelData(channel)[i];power+=sample*sample;
     difference=Math.max(difference,Math.abs(sample-buffer.getChannelData(channel)[(offset+i)%buffer.length]));
    }
    silentFrames=power<1e-12?silentFrames+1:0;longestSilence=Math.max(longestSilence,silentFrames);
   }
   return{difference,longestSilence,duration:buffer.duration,channels:buffer.numberOfChannels,assignments:window.sessionAssignments};
  });
  assert(seam.difference<1e-6,'Loop boundary must reproduce uninterrupted decoded samples');
  assert(seam.longestSilence<45,'Loop must have no millisecond-long silence');
  assert(seam.duration>170&&seam.channels===2);
  assert(seam.assignments.includes('playback'));
  console.log('Gapless browser render and playback session:',seam);
  await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,value:true});
   document.dispatchEvent(new Event('visibilitychange'));
  });
  assert(await page.evaluate(()=>ocean.wanted&&!ocean.source));
  await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,value:false});
   document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(()=>ocean.source);
  await page.evaluate(()=>{go(2);showAlbum(8)});
  await page.locator('.album-reel video').evaluate(video=>video.play());
  await page.waitForFunction(()=>!ocean.wanted&&!ocean.source);
  await start(page);
  assert(await page.locator('.album-reel video').evaluate(video=>video.paused));
  await page.locator('#sound').click();
  assert(await page.evaluate(()=>!ocean.wanted&&!ocean.source&&ocean.offset===0));
  console.log('Tab return, ocean/video exclusion, and repeated toggles passed.');

  const cancelled=await open();
  let release;const pending=new Promise(resolve=>release=resolve);
  await cancelled.route('**/waves-against-rocks-loop.mp3',async route=>{await pending;await route.continue()});
  await cancelled.locator('#sound').click();await cancelled.locator('#sound').click();release();
  await cancelled.waitForFunction(()=>ocean.buffer);
  assert(await cancelled.evaluate(()=>!ocean.wanted&&!ocean.source));
  console.log('Cancelling during recording load cannot start unwanted playback.');

  const failure=await open();
  await failure.route('**/waves-against-rocks-loop.mp3',route=>route.fulfill({status:503,body:'Unavailable'}));
  await failure.locator('#sound').click();
  await failure.waitForFunction(()=>document.querySelector('#soundLabel').textContent==='Нажми ещё раз');
  assert.equal(await failure.locator('#sound').getAttribute('aria-pressed'),'false');
  await failure.unroute('**/waves-against-rocks-loop.mp3');await start(failure);
  console.log('Failed load leaves an accurate button state and supports retry.');

  const iphone=await open({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Version/15.0 Mobile/15E148 Safari/604.1'},()=>{
   Object.defineProperty(navigator,'audioSession',{value:undefined});
  });
  await start(iphone);
  assert(await iphone.evaluate(()=>ocean.bridge&&!ocean.bridge.paused&&!ocean.bridge.muted));
  await iphone.locator('#sound').click();
  assert(await iphone.evaluate(()=>ocean.bridge.paused));
  console.log('Older iOS playback bridge starts on a tap and stops with the ocean.');
  assert.deepEqual(errors,[],'The story must not produce page errors');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
const url=process.env.FILM_URL||'http://127.0.0.1:3161/';
async function pixelDiff(before,during){const [a,b]=await Promise.all([sharp(path.join(out,before)).removeAlpha().raw().toBuffer({resolveWithObject:true}),sharp(path.join(out,during)).removeAlpha().raw().toBuffer({resolveWithObject:true})]);let changed=0,sum=0;for(let i=0;i<a.data.length;i+=3){const d=Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]));if(d>12){changed++;sum+=d}}const pixels=a.info.width*a.info.height;return{metric:'max(abs(RGB channel delta)) > 12/255',width:a.info.width,height:a.info.height,pixels,changedPixels:changed,areaPercent:100*changed/pixels,meanDifference:changed?sum/changed:0}}
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(url);await page.evaluate(()=>awaiFilm.ready());await page.waitForTimeout(1500);
  const snap=()=>page.evaluate(()=>({...awaiFilm.snapshot(),scrollY}));
  const reset=()=>page.evaluate(()=>{if(typeof awaiFilm.resetPerformance!=='function')throw Error('resetPerformance is required');awaiFilm.resetPerformance()});
  const scenes=await page.evaluate(()=>awaiFilm.scenes),initial=await snap();let start=0;const starts=scenes.map(s=>{const n=start;start+=s.lengthVh;return n});
  const scroll=async(vh,wait=45)=>{await page.evaluate(vh=>scrollTo(0,vh*awaiFilm.snapshot().stageHeight/100),vh);await page.waitForTimeout(wait)};
  const summary=(s,lowQualitySeen)=>({frames:s.frames,meanRenderMs:s.meanRenderMs,maxRenderMs:s.maxRenderMs,lowQuality:s.lowQuality,lowQualitySeen,dpr:s.dpr,activeStains:s.activeStains,settledStains:s.settledStains,warmReady:s.warmReady,decodeAt:s.decodeAt,qualitySampleCount:s.qualitySampleCount,qualityLevel:s.qualityLevel,qualityMeanMs:s.qualityMeanMs,qualityWindowFrames:s.qualityWindowFrames,qualityEvents:s.qualityEvents,maskWidth:s.maskWidth,haloScale:s.haloScale});
  await reset();let lowQualitySeen=false;const throughScenes=[];
  // Equal programmatic scroll increments produce the same complete traversal on every run.
  for(let step=0;step<=180;step++){await scroll(start*step/180);const s=await snap();lowQualitySeen ||= s.lowQuality;if(!throughScenes.some(x=>x.scene===s.scene))throughScenes.push({scene:s.scene,p:s.p,lowQuality:s.lowQuality})}
  const throughSnapshot=await snap(),through=summary(throughSnapshot,lowQualitySeen);
  const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:5,radiusY:5,force:1}]});
  // Separate CPU4x S0 evidence uses decoded images + warmup, with the same pressure center.
  await page.reload();await page.evaluate(()=>awaiFilm.ready());await page.waitForTimeout(1500);await scroll(starts[0]+scenes[0].lengthVh*.5,200);
  const s0Before=await snap(),point=s0Before.idlePoint;if(!point)throw Error('idlePoint missing');
  const offset=await page.evaluate(()=>awaiFilm.parameters.radiusMobile*(awaiFilm.snapshot().width/390)*awaiFilm.parameters.touchOffset),x=point.x*390,y=point.y*s0Before.stageHeight+offset;
  const shot=async phase=>{const file=`chromium-sp-cpu4-s0-${phase}.png`;await page.screenshot({path:path.join(out,file),type:'png'});return file};
  const beforeImage=await shot('before');await touch('touchStart',x,y);await page.waitForTimeout(2600);const s0During=await snap(),duringImage=await shot('during');await touch('touchEnd');await page.waitForTimeout(500);const s0After=await snap(),afterImage=await shot('after');
  const s0={label:'スマホに近い設定の S0',scene:s0Before.scene,progress:s0Before.p,holdMs:2600,afterReleaseMs:500,warmupAfterDecodeMs:1500,targetPoint:point,inputPoint:{x,y},touchOffsetPx:offset,before:s0Before,during:s0During,after500:s0After,beforeImage,duringImage,afterImage,duringDiff:await pixelDiff(beforeImage,duringImage),afterDiff:await pixelDiff(beforeImage,afterImage)};s0.status=s0.duringDiff.areaPercent>=4?'observed':'provisional';
  // Fresh scene excludes S0 idle preview and any previous interaction.
  await page.reload();await page.evaluate(()=>awaiFilm.ready());const i=scenes.findIndex(s=>s.id==='s3-aima');if(i<0)throw Error('S3 missing');
  const base=starts[i]+scenes[i].lengthVh*.5;await scroll(base,1800);
  async function sample(){await reset();let low=false;for(let step=0;step<80;step++){await scroll(base+(step%2?-.1:.1),45);low ||= (await snap()).lowQuality}return summary(await snap(),low)}
  const before=await sample();
  await scroll(base,200);const strokes=[];
  for(let n=0;n<30;n++){
   const x=390*(.16+(n%3)*.10),y=844*(.18+Math.floor(n/3)%5*.11);
   await touch('touchStart',x,y);for(let k=1;k<=8;k++){await touch('touchMove',x+k*9,y);await page.waitForTimeout(25)}await touch('touchEnd');strokes.push({x,y,endX:x+72});
  }
  await page.waitForTimeout(1800);const settled=await snap();
  const after=await sample(),ratio=before.meanRenderMs?after.meanRenderMs/before.meanRenderMs:null;
  const result={at:new Date().toISOString(),url,environment:{browser:'installed Chrome / Chromium',viewport:{width:390,height:844},deviceScaleFactor:1,cpuThrottlingRate:4,input:'native CDP touch',hardware:'desktop emulation, not a phone'},method:{throughScrollSteps:181,throughStepWaitMs:45,s3SampleSteps:80,s3SampleWaitMs:45,s3SampleScrollOffsetsVh:[.1,-.1],strokeCount:30,strokeMoves:8,strokeMoveWaitMs:25,settleWaitMs:1800,periodCounters:'resetPerformance before each measured period; mean/max are Canvas render wall time, not total frame interval',meanIncreaseThreshold:'No numeric acceptance threshold was specified; ratio is recorded without an invented pass criterion.'},initial,throughScenes,through,throughSnapshot,s0,s3:{progress:.5,before,strokeCoordinates:strokes,settledSnapshot:settled,after,meanRenderRatio:ratio,meanRenderDeltaMs:after.meanRenderMs-before.meanRenderMs},errors,limitations:['CDP CPU slowdown is a laboratory approximation. Render time excludes browser compositing and GPU time. The identical small scroll offsets wake the renderer for before/after sampling after active ink has settled.']};
  fs.writeFileSync(path.join(out,'throttled-performance.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({through,s3Before:before,s3After:after,meanRenderRatio:ratio,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

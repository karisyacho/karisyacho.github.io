const fs=require('fs'),path=require('path'),{chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await c.newPage();
 await p.addInitScript(()=>{window.inputTimings=[];new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)inputTimings.push({name:e.name,duration:e.duration,interactionId:e.interactionId,start:e.startTime,processing:e.processingEnd-e.processingStart});}).observe({type:'event',buffered:true,durationThreshold:16});});
 await p.goto('http://127.0.0.1:3161/');await p.evaluate(()=>awaiFilm.ready());
 const s=await c.newCDPSession(p),send=(type,x,y)=>s.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:5,radiusY:5,force:1}]});
 const scroll=async(vh)=>{await p.evaluate(vh=>scrollTo(0,vh/100*awaiFilm.snapshot().stageHeight),vh);await p.waitForTimeout(250);};
 for(const vh of [20,520,810,1140]){
  await scroll(vh);await send('touchStart',195,350);await p.waitForTimeout(500);await send('touchEnd');await p.waitForTimeout(600);
 }
 // Repeated native input samples; scroll itself is not an INP interaction.
 await scroll(20);for(let i=0;i<8;i++){await send('touchStart',100+i*20,390);await p.waitForTimeout(280);await send('touchEnd');await p.waitForTimeout(400);}
 await p.waitForTimeout(300);const r=await p.evaluate(()=>{const values=new Map();for(const e of inputTimings)values.set(e.interactionId,Math.max(values.get(e.interactionId)||0,e.duration));const ranked=[...values.values()].sort((a,b)=>b-a);return{events:inputTimings,interactionCount:performance.interactionCount??null,eventTimingRecordedInteractions:ranked.length,labInteractionP98Ms:ranked[Math.floor(ranked.length/50)]??null,render:awaiFilm.snapshot()};});
 r.environment='Chrome mobile emulation; native CDP touch, durationThreshold16ms. Laboratory EventTiming sample only; no field INP or physical phone result.';
 fs.writeFileSync(path.join(__dirname,'evidence/input-performance.json'),JSON.stringify(r,null,2));console.log(JSON.stringify({labInteractionP98Ms:r.labInteractionP98Ms,recorded:r.eventTimingRecordedInteractions,meanRender:r.render.meanRenderMs,maxRender:r.render.maxRenderMs,lowQuality:r.render.lowQuality}));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});

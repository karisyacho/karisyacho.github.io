const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
const url=process.env.FILM_URL||'http://127.0.0.1:3161/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={at:new Date().toISOString(),url,environment:{viewport:{width:390,height:844},browser:'installed Chrome / Chromium',input:'native CDP touch',cpuThrottlingRate:1},method:'Inject busy wait into the visible film canvas fillRect only. One heavy frame tests rolling-window stability; sustained render delay forces a real quality transition while a native hold remains down.',failures:[],errors:[]};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  await context.addInitScript(()=>{window.__lag=0;window.__lagOneShot=false;window.__lagInjections=[];const fill=CanvasRenderingContext2D.prototype.fillRect;CanvasRenderingContext2D.prototype.fillRect=function(...args){if(this.canvas.classList.contains('film-surface')&&window.__lag>0){const delay=window.__lag,start=performance.now();if(window.__lagOneShot)window.__lag=0;while(performance.now()-start<delay){}window.__lagInjections.push({at:start,requestedMs:delay,elapsedMs:performance.now()-start})}return fill.apply(this,args)}});
  const newPage=async()=>{const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.evaluate(()=>awaiFilm.ready());await p.waitForTimeout(1500);return p};
  const snapshot=p=>p.evaluate(()=>({...awaiFilm.snapshot(),light:awaiFilm.parameters.light,maxTraces:awaiFilm.parameters.maxTraces,now:performance.now()}));
  const scroll=async(p,i,progress)=>{await p.evaluate(({i,progress})=>{const starts=awaiFilm.scenes.slice(0,i).reduce((n,s)=>n+s.lengthVh,0);scrollTo(0,(starts+awaiFilm.scenes[i].lengthVh*progress)*awaiFilm.snapshot().stageHeight/100)},{i,progress});await p.waitForTimeout(80)};
  const oscillate=async(p,count)=>{for(let n=0;n<count;n++){await scroll(p,0,.5+(n%2?-.001:.001));await p.waitForTimeout(20)}};
  const spike=await newPage();await oscillate(spike,60);const beforeSpike=await snapshot(spike);
  await spike.evaluate(()=>{window.__lag=500;window.__lagOneShot=true});await scroll(spike,0,.502);await spike.waitForTimeout(550);const immediatelyAfter=await snapshot(spike);await oscillate(spike,60);const afterSpike=await snapshot(spike),spikeInjections=await spike.evaluate(()=>window.__lagInjections);
  report.singleHeavyFrame={before:beforeSpike,immediatelyAfter,after:afterSpike,injections:spikeInjections,stayedNormal:[beforeSpike,immediatelyAfter,afterSpike].every(s=>s.qualityLevel===0),framesBefore:60,framesAfter:60};
  if(spikeInjections.length!==1||spikeInjections[0]?.elapsedMs<500)report.failures.push({case:'single-heavy-frame',reason:'injection did not occur exactly once',injections:spikeInjections});
  if(!report.singleHeavyFrame.stayedNormal)report.failures.push({case:'single-heavy-frame',reason:'quality switched',levels:[beforeSpike.qualityLevel,immediatelyAfter.qualityLevel,afterSpike.qualityLevel]});await spike.close();
  const hold=await newPage(),cdp=await context.newCDPSession(hold),touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:5,radiusY:5,force:1}]});
  await scroll(hold,6,.15);await touch('touchStart',70,170);await hold.waitForTimeout(60);await touch('touchEnd');await touch('touchStart',70,170);for(let k=1;k<=8;k++){await touch('touchMove',70+k*10,170);await hold.waitForTimeout(35)}await touch('touchEnd');await hold.waitForTimeout(1800);const ink=await snapshot(hold);
  if(!ink.settledStains||ink.activeStains!==0)report.failures.push({case:'transition',reason:'S3 ink did not mature',activeStains:ink.activeStains,settledStains:ink.settledStains});
  await scroll(hold,0,.5);const point=await hold.evaluate(()=>{const s=awaiFilm.snapshot(),q=s.idlePoint;return{x:q.x*s.width,y:q.y*s.stageHeight+awaiFilm.parameters.radiusMobile*(s.width/390)*awaiFilm.parameters.touchOffset}});await touch('touchStart',point.x,point.y);await hold.waitForTimeout(2600);const before=await snapshot(hold),beforeImage='quality-transition-hold-before.png';await hold.screenshot({path:path.join(out,beforeImage),type:'png'});
  await hold.evaluate(()=>{window.__lag=45;window.__lagOneShot=false});let switched=false;
  try{await hold.waitForFunction(()=>awaiFilm.snapshot().qualityLevel>0,{},{timeout:12000,polling:60});switched=true}catch{}
  await hold.evaluate(()=>{window.__lag=0});await hold.waitForTimeout(80);const after=await snapshot(hold),afterImage='quality-transition-hold-after.png';await hold.screenshot({path:path.join(out,afterImage),type:'png'});
  const fields=['scene','width','stageHeight','p','traces','activeStains','settledStains','interaction'];const comparisons=Object.fromEntries(fields.map(key=>[key,{before:before[key],after:after[key],same:before[key]===after[key]}]));
  comparisons.strength={before:before.strength,after:after.strength,same:Math.abs(before.strength-after.strength)<.001};
  const events=after.qualityEvents,first=events[0],reductionOrderCorrect=!!first&&first.qualityLevel===2&&first.actions.some(a=>/DPR|resolution/i.test(a))&&after.maxTraces===6&&after.haloScale===1&&after.light===.15;
  report.transition={inkBeforeHold:ink,inputPoint:point,holdMs:2600,injectedDelayMs:45,timeoutMs:12000,switched,before,after,beforeImage,afterImage,comparisons,statePreserved:Object.values(comparisons).every(x=>x.same),reductionOrderCorrect,qualityEvents:events,injections:await hold.evaluate(()=>window.__lagInjections)};
  if(before.qualityLevel!==0)report.failures.push({case:'transition',reason:'quality was already reduced before sustained injection',qualityLevel:before.qualityLevel});
  if(!switched)report.failures.push({case:'transition',reason:'no quality switch within 12000ms',qualityLevel:after.qualityLevel});
  if(!report.transition.statePreserved)report.failures.push({case:'transition',reason:'hold or ink state changed',comparisons});
  if(!reductionOrderCorrect)report.failures.push({case:'transition',reason:'first reduction did not preserve traces and amber halo',qualityEvents:events,maxTraces:after.maxTraces,haloScale:after.haloScale,light:after.light});
  await touch('touchEnd');await context.close();if(report.errors.length)report.failures.push({reason:'page errors',errors:report.errors});
 }catch(e){report.failures.push({reason:e.stack})}finally{await browser.close();fs.writeFileSync(path.join(out,'quality-stability.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({singleHeavyFrameStayedNormal:report.singleHeavyFrame?.stayedNormal,transitionSwitched:report.transition?.switched,statePreserved:report.transition?.statePreserved,reductionOrderCorrect:report.transition?.reductionOrderCorrect,failures:report.failures,errors:report.errors}))}
})().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('fs'),path=require('path');
const {chromium,webkit}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname,out=path.join(root,'evidence');fs.mkdirSync(out,{recursive:true});
const url=process.env.FILM_URL||'http://127.0.0.1:3161/';
const result={at:new Date().toISOString(),url,browsers:[],failures:[],limitations:['Chromium SP uses native CDP touch input. WebKit SP interaction uses synthetic PointerEvent; vertical native swipe is unavailable through Playwright WebKit. Synthetic WebKit touch skips pointer capture because PointerEvent does not register a native pointer. Installed Google Chrome is used as Chromium executable. These are desktop browser emulations, not iPhone/Android hardware.']};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
result.provisional=[];
async function pixelDiff(before,after){
 const [a,b]=await Promise.all([sharp(path.join(out,before)).removeAlpha().raw().toBuffer({resolveWithObject:true}),sharp(path.join(out,after)).removeAlpha().raw().toBuffer({resolveWithObject:true})]);
 if(a.info.width!==b.info.width||a.info.height!==b.info.height)throw Error('Screenshot dimensions differ');
 let changed=0,sum=0;const pixels=a.info.width*a.info.height;
 for(let i=0;i<a.data.length;i+=3){const d=Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]));if(d>12){changed++;sum+=d}}
 return {metric:'max(abs(RGB channel delta)) > 12/255',width:a.info.width,height:a.info.height,pixels,changedPixels:changed,areaPercent:100*changed/pixels,meanDifference:changed?sum/changed:0};
}
async function run(engine,name,size){
 let browser;try{browser=await engine.launch({headless:true,...(name==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});}catch(e){result.failures.push(`${name} unavailable: ${e.message}`);return;}
 const sp=size==='sp',viewport=sp?{width:390,height:844}:{width:1280,height:800};
 const ctx=await browser.newContext({viewport,hasTouch:sp,deviceScaleFactor:sp?2:1.5,isMobile:sp});
 await ctx.addInitScript(()=>{const capture=Element.prototype.setPointerCapture;Element.prototype.setPointerCapture=function(id){if(id!==101)return capture.call(this,id)};window.__webglCalls=[];const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/i.test(type))window.__webglCalls.push(type);return old.call(this,type,...args)};});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const row={browser:name,viewport,size,input:sp?(name==='chromium'?'native CDP touch':'synthetic PointerEvent'):'native mouse',errors,centers:[],interactions:[],verticalSwipes:[],boundaries:[],reverse:[]};result.browsers.push(row);
 await p.goto(url);await p.evaluate(()=>window.awaiFilm.ready());await p.waitForTimeout(250);
 const snap=()=>p.evaluate(()=>({...window.awaiFilm.snapshot(),scrollY}));
 row.initial=await snap();const scenes=await p.evaluate(()=>window.awaiFilm.scenes);let starts=[],sum=0;for(const s of scenes){starts.push(sum);sum+=s.lengthVh}row.totalVh=sum;
 const goto=async(i,progress=.5)=>{await p.evaluate(({vh,h})=>window.scrollTo(0,vh*h/100),{vh:starts[i]+scenes[i].lengthVh*progress,h:row.initial.stageHeight});await p.waitForTimeout(170);};
 const shot=async(label,png=false)=>{const file=`${name}-${size}-${label}.${png?'png':'jpg'}`;await p.screenshot({path:path.join(out,file),type:png?'png':'jpeg',...(png?{}:{quality:78})});return file;};
 for(let i=0;i<scenes.length;i++){await goto(i);row.centers.push({id:scenes[i].id,snapshot:await snap(),image:await shot(`center-${scenes[i].id}`)});}
 for(let i=1;i<scenes.length;i++){for(const delta of [-.1,.1]){await p.evaluate(y=>scrollTo(0,y),(starts[i]+delta)*row.initial.stageHeight/100);await p.waitForTimeout(100);row.boundaries.push({vh:starts[i]+delta,snapshot:await snap()});}}
 const cdp=sp&&name==='chromium'?await ctx.newCDPSession(p):null;const x=viewport.width*.4,y=viewport.height*.3;let down=false;
 async function input(type,xx=x,yy=y){if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:type==='down'?'touchStart':type==='move'?'touchMove':'touchEnd',touchPoints:type==='up'?[]:[{x:xx,y:yy}],modifiers:0});}
 else if(sp){await p.evaluate(({type,x,y})=>document.querySelector('.film-stage').dispatchEvent(new PointerEvent('pointer'+type,{pointerId:101,pointerType:'touch',isPrimary:true,button:0,buttons:type==='up'?0:1,clientX:x,clientY:y,bubbles:true})),{type,x:xx,y:yy});}
 else{if(type==='down'){await p.mouse.move(xx,yy);await p.mouse.down();}else if(type==='move')await p.mouse.move(xx,yy);else{await p.mouse.up();await p.mouse.move(-10,-10);}}down=type!=='up';}
 const cases=[{id:'s0-ridge',i:0,p:.5,hold:2600,min:4,point:'idlePoint'},{id:'s0-upper-third',i:0,p:.5,hold:2600,point:[.5,1/3]},
 {id:'s2-drag',i:4,p:.5,min:10,point:[.5,.5],drag:true},{id:'s2-delayed-drag',i:4,p:.5,min:10,point:[.5,.5],drag:true,delay:300},
 {id:'s3-p015',i:6,p:.15,min:3,point:[.18,.2],stain:true,persist:true},{id:'s3-p050',i:6,p:.5,min:3,point:[.18,.2],stain:true},{id:'s4-center',i:8,p:.5,hold:2600,min:3,point:[.5,.5]}];
 for(const spec of cases){
  // Reload removes other ink and previous reactions. Keep PC hover outside before capture.
  if(!sp)await p.mouse.move(-10,-10);await p.reload();await p.evaluate(()=>window.awaiFilm.ready());await goto(spec.i,spec.p);await p.waitForTimeout(1400);
  const before=await snap(),point=spec.point==='idlePoint'?before.idlePoint:spec.point;if(!point)throw Error('snapshot.idlePoint is required');
  const px=Array.isArray(point)?point[0]:point.x,py=Array.isArray(point)?point[1]:point.y,xx=px<=1?px*viewport.width:px,targetY=py<=1?py*viewport.height:py;
  const touchOffsetPx=sp&&spec.hold?await p.evaluate(()=>awaiFilm.parameters.radiusMobile*(awaiFilm.snapshot().width/390)*awaiFilm.parameters.touchOffset):0,yy=targetY+touchOffsetPx;
  const r={case:spec.id,scene:scenes[spec.i].id,progress:spec.p,targetPoint:{x:xx,y:targetY},point:{x:xx,y:yy},touchOffsetPx,minimumAreaPercent:spec.min??null,referenceOnly:!!(spec.delay&&!sp),before,beforeImage:await shot(`${spec.id}-before`,true)};
  await input('down',xx,yy);if(spec.delay)await p.waitForTimeout(spec.delay);
  if(spec.stain){await p.waitForTimeout(60);await input('up',xx,yy);await p.waitForTimeout(30);await input('down',xx,yy)}
  if(spec.drag||spec.stain)for(let k=1;k<=8;k++){await input('move',xx+k*viewport.width*.03,yy);await p.waitForTimeout(45)}
  const duringWait=spec.hold||(spec.stain?1600:300);r.timing={holdMs:spec.hold||null,delayBeforeDragMs:spec.delay||0,duringWaitAfterMotionMs:spec.hold?null:duringWait,afterReleaseMs:500};await p.waitForTimeout(duringWait);r.during=await snap();r.duringImage=await shot(`${spec.id}-during`,true);await input('up',xx+((spec.drag||spec.stain)?viewport.width*.24:0),yy);await p.waitForTimeout(500);r.after500=await snap();r.afterImage=await shot(`${spec.id}-after`,true);await p.waitForTimeout(850);r.after1350=await snap();
  r.duringDiff=await pixelDiff(r.beforeImage,r.duringImage);r.afterDiff=await pixelDiff(r.beforeImage,r.afterImage);r.reacted=r.duringDiff.changedPixels>0;
  r.status=spec.min===undefined||r.referenceOnly?'recorded':r.duringDiff.areaPercent>=spec.min&&(!spec.persist||r.afterDiff.changedPixels>0)?'observed':'provisional';
  if(r.status==='provisional')result.provisional.push({browser:name,size,case:spec.id,duringAreaPercent:r.duringDiff.areaPercent,afterAreaPercent:r.afterDiff.areaPercent,minimumAreaPercent:spec.min,persistenceRequired:!!spec.persist});row.interactions.push(r);
 }
 if(cdp){for(const i of [0,4,6,8]){await goto(i,.2);await p.waitForTimeout(1400);const r={scene:scenes[i].id,before:await snap(),maximumStrength:0};await input('down',viewport.width*.5,viewport.height*.7);await p.waitForTimeout(20);r.maximumStrength=(await snap()).strength;for(let k=1;k<=10;k++){await input('move',viewport.width*.5,viewport.height*(.7-.045*k));const s=await snap();r.maximumStrength=Math.max(r.maximumStrength,s.strength);await p.waitForTimeout(15)}await input('up');await p.waitForTimeout(400);r.after=await snap();r.scrolled=r.after.scrollY>r.before.scrollY;r.previewWithinLimit=r.maximumStrength<=.150001;row.verticalSwipes.push(r);if(!r.scrolled||!r.previewWithinLimit)result.failures.push(`${name}/${size}/${scenes[i].id} vertical swipe failed`);}}
 await goto(6,.15);await input('down',viewport.width*.2,viewport.height*.2);for(let k=1;k<=8;k++){await input('move',viewport.width*(.2+k*.025),viewport.height*.2);await p.waitForTimeout(40)}await input('up');await p.waitForTimeout(1800);
 row.reverseBefore=await snap();const stainCount=s=>s.settledStains??s.stains.length,stainBefore=stainCount(row.reverseBefore);for(let i=8;i>=0;i--){await goto(i);row.reverse.push(await snap())}for(let i=0;i<9;i++)await goto(i);row.reverseFinal=await snap();row.stainsPersist=stainCount(row.reverseFinal)===stainBefore;row.kasaneReturned=row.reverse.find(s=>s.scene==='s2-kasane')?.drag===0;if(!row.stainsPersist||!row.kasaneReturned)result.failures.push(`${name}/${size} reverse state changed`);
 row.canvas=await p.evaluate(()=>({visible:[...document.querySelectorAll('canvas')].filter(c=>getComputedStyle(c).display!=='none'&&c.getBoundingClientRect().width>0).length,webglCalls:window.__webglCalls}));row.endingLink=await p.locator('.film-talk').isVisible();row.endingHref=await p.locator('.film-talk').getAttribute('href');if(errors.length)result.failures.push(`${name}/${size} console/page errors`);
 if(row.canvas.visible!==1||row.canvas.webglCalls.length||!row.endingLink)result.failures.push(`${name}/${size} canvas or ending link structure`);await ctx.close();
 for(const mode of ['reducedMotion','javaScriptOff']){const c=await browser.newContext({viewport,javaScriptEnabled:mode!=='javaScriptOff',reducedMotion:mode==='reducedMotion'?'reduce':'no-preference'});const q=await c.newPage();await q.goto(url);const link=q.locator('.film-reading a').filter({hasText:'話してみる'});await link.scrollIntoViewIfNeeded();row[mode]={linkVisible:await link.isVisible(),href:await link.getAttribute('href'),text:await q.locator('.film-reading').innerText()};await c.close();}
 await browser.close();console.log(`${name}/${size}: centers ${row.centers.length}, pixel comparisons ${row.interactions.length}, provisional ${row.interactions.filter(x=>x.status==='provisional').length}, errors ${errors.length}`);
}
(async()=>{for(const [engine,name]of [[chromium,'chromium'],[webkit,'webkit']])for(const size of ['sp','pc']){try{await run(engine,name,size)}catch(e){result.failures.push(`${name}/${size}: ${e.stack}`)}}fs.writeFileSync(path.join(out,'checks-interactive.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({failures:result.failures,provisional:result.provisional}));})();

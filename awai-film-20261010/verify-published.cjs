const fs=require('fs'),path=require('path'),crypto=require('crypto'),{chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname,result=JSON.parse(fs.readFileSync(path.join(root,'publish-interactive-result.json'))),base='https://karisyacho.github.io/awai-film-20261010/';
(async()=>{
 let manifest;for(let i=0;i<12;i++){const r=await fetch(base+'manifest.json?v='+result.version);if(r.ok){const j=await r.json();if(j.version===result.version){manifest=j;break;}}await new Promise(r=>setTimeout(r,5000));}
 if(!manifest)throw Error('Latest GitHub Pages manifest not visible');
 const contentChecks=[];for(const f of manifest.current){const r=await fetch(base+f+'?v='+result.version);if(!r.ok)throw Error('Missing '+f);const bytes=Buffer.from(await r.arrayBuffer()),hash=crypto.createHash('sha256').update(bytes).digest('hex'),expected=manifest.files.find(x=>x.path===f).sha256;if(hash!==expected)throw Error('Stale '+f);contentChecks.push({file:f,sha256:hash});}
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(result.url);await p.evaluate(()=>awaiFilm.ready());const states=[],scenes=await p.evaluate(()=>awaiFilm.scenes);let cursor=0;
 for(const s of scenes){await p.evaluate(vh=>scrollTo(0,vh/100*awaiFilm.snapshot().stageHeight),cursor+s.lengthVh/2);await p.waitForTimeout(120);states.push(await p.evaluate(()=>awaiFilm.snapshot().scene));cursor+=s.lengthVh;}
 const ending=await p.locator('.film-ending .film-talk').isVisible(),href=await p.locator('.film-ending .film-talk').getAttribute('href');await p.screenshot({path:path.join(root,'evidence/live-ending.jpg'),type:'jpeg',quality:80});
 await p.goto(result.review);const reviewImages=await p.locator('table img').count();const video=await p.locator('video').evaluate(async v=>{v.load();await new Promise((r,j)=>{if(v.readyState>=1)return r();v.addEventListener('loadedmetadata',r,{once:true});v.addEventListener('error',()=>j(Error('video decode')),{once:true});});await v.play();await new Promise(r=>setTimeout(r,200));v.pause();return{duration:v.duration,width:v.videoWidth,height:v.videoHeight,time:v.currentTime,ready:v.readyState};});
 await p.screenshot({path:path.join(root,'evidence/live-review.jpg'),type:'jpeg',quality:80});
 if(errors.length||!ending||states.length!==9||reviewImages!==84||video.time<=0)throw Error(JSON.stringify({errors,ending,states,reviewImages,video}));
 const report={at:new Date().toISOString(),url:result.url,commit:result.commit,version:result.version,contentChecks,states,ending,href,reviewImages,video,errors,physicalPhone:false};fs.writeFileSync(path.join(root,'evidence/live-interactive.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({latestVersion:result.version,states,ending,reviewImages,video,errors}));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});

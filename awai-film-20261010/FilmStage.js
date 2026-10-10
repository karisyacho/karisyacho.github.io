// Adapted from the copied paper-prototype FilmStage.tsx: one sticky stage,
// resolve(scrollY, viewportH), Pointer Events, ResizeObserver, visibility pause.
import {config} from './lib/config.js';
import {scenes,totalVh,resolve,clamp,smooth} from './lib/film.js';
import {densityAt} from './lib/washi.js';

export function FilmStage(){
 const track=document.querySelector('.film-track'),stage=document.querySelector('.film-stage'),cv=stage.querySelector('canvas'),ctx=cv.getContext('2d',{alpha:false});
 const logo=stage.querySelector('.film-logo'),ending=stage.querySelector('.film-ending'),opening=stage.querySelector('.opening-image');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const make=()=>{const c=document.createElement('canvas');return {c,x:c.getContext('2d',{willReadFrequently:true})};};
 const mask=make(),front=make(),light=make(),sample=make();
 const images=new Map(),maps=new Map();
 let width=1,height=1,dpr=1,mw=1,mh=1,portrait=true,raf=0,visible=!document.hidden,last=0,ready=false;
 let state=resolve(0,1),pointer=null,hover=null,traces=[],stains=[],drag=0,dragReleased=0,dragAt=0,used=false,idleTimer=0;
 let lastRender=0,maxRender=0,frames=0,lowQuality=false,meanRender=0;
 const parameters={...config,transmission:.64,preview:.15,hover:.08,cancelMs:300,maxTraces:6,light:.15,touchOffset:.4};
 const allKeys=['s0','s1','s1-blur','s2','s3','s3-black','s4','kasane-0','kasane-1','kasane-2'];
 function src(key){const type=portrait?'sp':'pc';if(key.startsWith('kasane-'))return `assets/kasane-${type}-${key.slice(-1)}.webp`;const parts=key.split('-');return `assets/${parts[0]}-${type}${parts.length>1?'-'+parts.slice(1).join('-'):''}.webp`;}
 function image(key){const url=src(key);let im=images.get(url);if(!im){im=new Image();im.src=url;im.onload=()=>{maps.clear();wake();};images.set(url,im);}return im.complete&&im.naturalWidth?im:null;}
 function wake(){if(!raf&&visible&&!reduced.matches)raf=requestAnimationFrame(tick);}
 function cover(c,im,w=width,h=height,zoom=1){if(!im)return;const fit=Math.max(w/im.naturalWidth,h/im.naturalHeight)*zoom,iw=im.naturalWidth*fit,ih=im.naturalHeight*fit;c.drawImage(im,(w-iw)/2,(h-ih)/2,iw,ih);}
 function picture(key,c=ctx,zoom=1){cover(c,image(key),c===ctx?width:c.canvas.width,c===ctx?height:c.canvas.height,zoom);}
 function luminance(key){const url=src(key),old=maps.get(url);if(old)return old;const im=image(key);if(!im)return null;sample.x.clearRect(0,0,mw,mh);cover(sample.x,im,mw,mh);const pixels=sample.x.getImageData(0,0,mw,mh).data,result=new Float32Array(mw*mh);for(let i=0;i<result.length;i++)result[i]=(pixels[i*4]*.2126+pixels[i*4+1]*.7152+pixels[i*4+2]*.0722)/255;maps.set(url,result);return result;}
 // The approved three elliptical density fields remain the pressure model.
 // Rotate/stretch its coordinates along the shared ridge; modulate by fibers.
 const fieldSize=96,fieldExtent=2.4,field=new Float32Array(fieldSize*fieldSize);
 for(let fy=0;fy<fieldSize;fy++)for(let fx=0;fx<fieldSize;fx++)field[fy*fieldSize+fx]=densityAt((fx/(fieldSize-1)*2-1)*fieldExtent,(fy/(fieldSize-1)*2-1)*fieldExtent,{x:0,y:0,radius:1,strength:1});
 function preparePressure(t,now){
  const r=width*(portrait?config.radiusMobile/390:config.radiusDesktop/1280);
  const angle=portrait?.78:.62,c=Math.cos(angle),s=Math.sin(angle);
  const age=now-t.born;
  let strength=t.preview?parameters.preview:parameters.preview+(1-parameters.preview)*smooth((age-config.holdMs)/config.thinningMs);
  if(t.mouse)strength=parameters.preview+(1-parameters.preview)*smooth(age/config.thinningMs);
  if(t.hover)strength=parameters.hover;
  if(t.idle)strength=.13*smooth(age/95);
  if(t.end!==undefined){strength=t.atEnd*(1-smooth((now-t.end)/(t.cancel?parameters.cancelMs:config.releaseMs)));}
  const expansion=.32+.68*smooth(age/config.spreadMs),radius=r*expansion;
  return {x:t.x*width,y:t.y*height,c,s,radius,strength};
 }
 function pressure(u,v,t,halo=false){
  const px=u*width-t.x,py=v*height-t.y,r=t.radius*(halo?1.28:1);
  const qx=(px*t.c+py*t.s)/(1.30*r),qy=(-px*t.s+py*t.c)/(.56*r);
  const fx=(qx/fieldExtent+1)*.5*(fieldSize-1),fy=(qy/fieldExtent+1)*.5*(fieldSize-1);
  if(fx<0||fy<0||fx>=fieldSize-1||fy>=fieldSize-1)return 0;
  const ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,i=iy*fieldSize+ix;
  const value=(field[i]*(1-tx)+field[i+1]*tx)*(1-ty)+(field[i+fieldSize]*(1-tx)+field[i+fieldSize+1]*tx)*ty;
  // densityAt includes the original .46 transmission. Renormalize its center
  // to a maximum .64 without ever making a fully transparent hole.
  return Math.min(parameters.transmission,value*t.strength*parameters.transmission/.46);
 }
 function traceStrength(t,now){const age=now-t.born;if(t.hover)return parameters.hover;if(t.preview)return parameters.preview;if(t.idle)return .13;return parameters.preview+(1-parameters.preview)*smooth((age-(t.mouse?0:config.holdMs))/config.thinningMs);}
 function ridgeRank(u,v){return clamp((v-(portrait?.18:.10)-(portrait?.58:.58)*u+.55)/1.35);}
 function buildMask(fn){const pixels=mask.x.createImageData(mw,mh);for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const i=y*mw+x;pixels.data[i*4+3]=Math.round(255*clamp(fn(x/(mw-1),y/(mh-1),i)));}mask.x.putImageData(pixels,0,0);}
 function composite(key,alphaFn,zoom=1,amount=1){
  front.x.clearRect(0,0,front.c.width,front.c.height);picture(key,front.x,zoom);buildMask(alphaFn);
  front.x.globalCompositeOperation='destination-in';front.x.drawImage(mask.c,0,0,front.c.width,front.c.height);front.x.globalCompositeOperation='source-over';
  ctx.save();ctx.globalAlpha=amount;ctx.drawImage(front.c,0,0,width,height);ctx.restore();
 }
 function thin(key,passive,now){
  const fiber=luminance('s0');let relevant=traces.filter(t=>t.scene===state.scene.id);
  if(pointer?.trace&&pointer.trace.scene===state.scene.id)relevant.push(pointer.trace);
  if(hover&&hover.scene===state.scene.id)relevant.push(hover);relevant=relevant.slice(-parameters.maxTraces).map(t=>preparePressure(t,now));
  function values(u,v,i,halo=false){let touch=0;for(const t of relevant)touch=Math.max(touch,pressure(u,v,t,halo));const texture=fiber?clamp(.68+fiber[i]*1.45):.85;
   const local=touch*texture,rank=ridgeRank(u,v),scroll=passive>=1?1:smooth((passive*1.25-rank)/.23);return Math.max(local,scroll);}
  if(key==='s0'){
   picture('s1');
   // Preblurred image avoids ctx.filter on Safari. Keep the amber in the fibers.
   if(parameters.light&&!lowQuality&&relevant.length){composite('s1-blur',(u,v,i)=>values(u,v,i,true),1,parameters.light);}
   composite('s0',(u,v,i)=>1-values(u,v,i));
  }else{
   ctx.fillStyle='#fafafa';ctx.fillRect(0,0,width,height);composite('s4',(u,v,i)=>1-values(u,v,i));
  }
 }
 function layerShift(now,p){const release=pointer?.scene==='s2-kasane'?drag:dragReleased*(1-smooth((now-dragAt)/config.releaseMs));return release*(1-smooth((p-.9)/.1));}
 function kasane(p,now,exit=0,entry=1){
  picture('s3-black');ctx.fillStyle=`rgba(9,10,12,${.92*(1-exit)})`;ctx.fillRect(0,0,width,height);
  const shift=layerShift(now,p),passive=Math.sin(p*Math.PI)*width*.065;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let layer=2;layer>=0;layer--){ctx.save();const multiplier=[1,.6,.3][layer];ctx.translate((passive+shift)*multiplier,0);ctx.globalAlpha=entry*(layer===2?1-exit*.85:1-smooth(exit));picture('kasane-'+layer);ctx.restore();}
  ctx.restore();stage.dataset.drag=shift.toFixed(3);
 }
 function dye(p,now){
  picture('s3-black');const fiber=luminance('s3');
  composite('s3',(u,v,i)=>{
   const noise=fiber?fiber[i]:.3,rank=ridgeRank(u,v)*.7+noise*.3;
   let value=p>=.92?1:smooth((p/.92*1.28-rank)/.26);
   for(const t of stains){const age=clamp((now-t.born)/1600),dx=(u-t.x)*width,dy=(v-t.y)*height,along=dx*.73+dy*.68,across=-dx*.68+dy*.73;
    const distance=Math.hypot(along/(width*.25),across/(width*.08));const irregular=distance*(.75+noise*.9);value=Math.max(value,smooth((age*1.22-irregular)/.35));}
   return value;
  });
 }
 function render(now){
  const start=performance.now();state=resolve(Math.max(0,-track.getBoundingClientRect().top),height);const {scene,p}=state;
  if(pointer&&pointer.scene!==scene.id)release(now,true);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#090a0c';ctx.fillRect(0,0,width,height);if(image('s0'))cv.style.visibility='visible';
  switch(scene.id){
   case 's0-membrane':thin('s0',smooth((p-.55)/.45)*.36,now);break;
   case 'seam-01':thin('s0',.36+.64*smooth(p),now);break;
   case 's1-suketo':picture('s1',ctx,1+.04*smooth(p));break;
   case 'seam-12':{
    const l=luminance('s1');kasane(0,now,0,smooth((p-.45)/.55));
    composite('s1',(u,v,i)=>1-smooth((p*1.25-(l?l[i]:.2))/.25),1.04);break;
   }
   case 's2-kasane':kasane(p,now);break;
   case 'seam-23':kasane(1,now,smooth(p));break;
   case 's3-aima':dye(p,now);break;
   case 'seam-34':picture('s3');composite('s4',(u,v)=>p>=1?1:smooth((smooth(p)*1.35-ridgeRank(u,v))/.23));break;
   case 's4-paper':thin('s4',0,now);break;
  }
  logo.hidden=scene.id!=='s0-membrane';logo.style.opacity=String(1-smooth((p-.65)/.35));ending.hidden=scene.id!=='s4-paper';
  stage.dataset.scene=scene.id;stage.dataset.progress=p.toFixed(4);stage.dataset.stains=String(stains.length);stage.dataset.traces=String(traces.length);stage.dataset.interaction=pointer?.mode||'rest';
  stage.dataset.strength=String(pointer?.trace?traceStrength(pointer.trace,now):0);
  lastRender=performance.now()-start;maxRender=Math.max(maxRender,lastRender);meanRender+=(lastRender-meanRender)/++frames;
  if(frames>20&&meanRender>22&&!lowQuality){lowQuality=true;parameters.maxTraces=3;parameters.light=0;dpr=1;resize();}
 }
 function tick(now){raf=0;if(!visible||reduced.matches)return;last=now;if(pointer?.trace&&now-pointer.born>=config.holdMs)pointer.mode='thin';render(now);
  traces=traces.filter(t=>t.end===undefined||now-t.end<(t.cancel?parameters.cancelMs:config.releaseMs));
  const stainsGrowing=stains.some(t=>now-t.born<1600),dragReturning=dragReleased&&now-dragAt<config.releaseMs;
  if(pointer||hover||traces.length||stainsGrowing||dragReturning)wake();
 }
 function remember(t,now,cancel=false){if(!t)return;t.atEnd=traceStrength(t,now);t.end=now;t.cancel=cancel;traces.push(t);traces=traces.slice(-parameters.maxTraces);}
 function release(now=performance.now(),cancel=false){if(pointer?.trace)remember(pointer.trace,now,cancel);if(pointer?.scene==='s2-kasane'){dragReleased=drag;dragAt=now;drag=0;}pointer=null;wake();}
 function point(e){const box=stage.getBoundingClientRect();return {x:(e.clientX-box.left)/width,y:(e.clientY-box.top)/height};}
 function touchPoint(e){const q=point(e);if(e.pointerType!=='mouse')q.y-=width*(portrait?config.radiusMobile/390:config.radiusDesktop/1280)*parameters.touchOffset/height;return q;}
 function addStain(q,now){if(stains.length>180)return;const old=stains[stains.length-1];if(!old||Math.hypot((old.x-q.x)*width,(old.y-q.y)*height)>width*.045){stains.push({...q,born:now});}}
 function down(e){if(e.isPrimary===false||pointer||e.button>0||e.target.closest('a'))return;used=true;clearTimeout(idleTimer);hover=null;if(!state.scene.touch||reduced.matches)return;
  const now=performance.now(),q=touchPoint(e);pointer={id:e.pointerId,scene:state.scene.id,mode:'pending',mouse:e.pointerType==='mouse',downX:e.clientX,downY:e.clientY,lastX:e.clientX,lastY:e.clientY,born:now};
  if(['s0-membrane','s4-paper'].includes(state.scene.id)){pointer.trace={...q,born:now,scene:state.scene.id,mouse:pointer.mouse};pointer.mode=pointer.mouse?'thin':'preview';}
  if(state.scene.id==='s3-aima'){addStain(point(e),now);pointer.mode='dye';}
  if(pointer.mouse&&e.pointerId>=0)stage.setPointerCapture(e.pointerId);wake();
 }
 function move(e){if(e.isPrimary===false||e.target.closest('a'))return;const now=performance.now();
  if(!pointer){if(e.pointerType==='mouse'&&['s0-membrane','s4-paper'].includes(state.scene.id)){hover={...point(e),born:now,scene:state.scene.id,hover:true};wake();}return;}
  if(e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.downX,dy=e.clientY-pointer.downY,q=touchPoint(e),distance=Math.hypot(dx,dy);
  if(!pointer.mouse&&distance>config.gesturePx&&pointer.mode!=='drag'&&now-pointer.born<config.holdMs){
   if(pointer.scene==='s2-kasane'&&Math.abs(dx)>Math.abs(dy)*1.2){pointer.mode='drag';stage.setPointerCapture(e.pointerId);}
   else if(pointer.scene!=='s3-aima'||Math.abs(dy)>=Math.abs(dx)){release(now,true);return;}
  }
  if(pointer.scene==='s2-kasane'){
   if(pointer.mouse||pointer.mode==='drag'){pointer.mode='drag';drag=Math.max(-width*.18,Math.min(width*.18,dx));}
  }else if(pointer.scene==='s3-aima'){addStain(point(e),now);}
  else if(pointer.trace){
   if(now-pointer.born>=config.holdMs)pointer.mode='thin';
   if(!pointer.mouse&&pointer.mode==='preview'&&distance>config.gesturePx){release(now,true);return;}
   if(now-pointer.born>=config.holdMs)pointer.mode='thin';
   const lastPoint=pointer.trace;if(Math.hypot((q.x-lastPoint.x)*width,(q.y-lastPoint.y)*height)>width*.05&&pointer.mode==='thin'){
    remember(lastPoint,now);pointer.trace={...q,born:now-config.holdMs,scene:pointer.scene,mouse:pointer.mouse};
   }
  }
  wake();
 }
 function up(e){if(pointer?.id===e.pointerId)release(performance.now(),e.type==='pointercancel');}
 function scroll(){used=true;clearTimeout(idleTimer);hover=null;if(pointer&&pointer.mode!=='drag')release(performance.now(),true);wake();}
 function resize(){const box=stage.getBoundingClientRect();if(!box.width||!box.height)return;width=box.width;height=box.height;portrait=width<height;dpr=Math.min(devicePixelRatio||1,portrait?config.mobileDpr:config.dpr);if(lowQuality)dpr=1;
  cv.width=Math.round(width*dpr);cv.height=Math.round(height*dpr);front.c.width=light.c.width=cv.width;front.c.height=light.c.height=cv.height;
  mw=lowQuality?110:160;mh=Math.max(80,Math.round(mw*height/width));mask.c.width=sample.c.width=mw;mask.c.height=sample.c.height=mh;maps.clear();
  track.style.height=`${(totalVh/100+1)*height}px`;for(const key of allKeys)image(key);wake();
 }
 function visibility(){visible=!document.hidden;if(!visible){release();cancelAnimationFrame(raf);raf=0;hover=null;}else wake();}
 function keyDown(e){if(e.target!==stage||!state.scene.touch||!['Enter',' '].includes(e.key)||e.repeat)return;e.preventDefault();down({isPrimary:true,button:0,target:stage,pointerId:-1,pointerType:'mouse',clientX:width*.5,clientY:height*.45});}
 function keyUp(e){if(e.target===stage&&['Enter',' '].includes(e.key))release();}
 if(!ctx)return;
 document.documentElement.classList.add('ready');resize();
 const ro=new ResizeObserver(resize);ro.observe(stage);
 stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('lostpointercapture',up);
 stage.addEventListener('pointerleave',()=>{hover=null;wake();});stage.addEventListener('keydown',keyDown);stage.addEventListener('keyup',keyUp);window.addEventListener('pointerup',up);window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',visibility);
 reduced.addEventListener('change',()=>{release();hover=null;cancelAnimationFrame(raf);raf=0;if(!reduced.matches)resize();});
 idleTimer=setTimeout(()=>{if(!used&&state.scene.id==='s0-membrane'){const now=performance.now(),t={x:.49,y:.46,born:now,scene:'s0-membrane',idle:true};traces.push(t);wake();setTimeout(()=>{remember(t,performance.now());traces=traces.filter((item,index)=>traces.indexOf(item)===index);wake();},650);}},config.idleMs);
 window.awaiFilm={scenes,totalVh,parameters,resolve,snapshot:()=>({scene:state.scene.id,p:state.p,stageHeight:height,width,dpr,drag:layerShift(performance.now(),state.p),stains:stains.map(t=>({...t})),traces:traces.length,strength:pointer?.trace?traceStrength(pointer.trace,performance.now()):0,interaction:pointer?.mode||'rest',visible,raf,lowQuality,frames,meanRenderMs:meanRender,maxRenderMs:maxRender}),ready:()=>Promise.all(allKeys.map(key=>{image(key);return images.get(src(key)).decode();}))};
 opening.querySelector('img').decode().then(()=>{ready=true;wake();}).catch(()=>{});
}

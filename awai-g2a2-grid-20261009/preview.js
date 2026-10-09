import {createGridModel} from './grid-model.js';
import {createRenderer} from './renderer.js';
import {defaults,presets,clamp,frameFor,ridgeAt,screenToSurface,surfacePoint} from './surface.js';
const canvas=document.querySelector('#membrane'),stage=document.querySelector('#stage'),status=document.querySelector('#status');
const settings={...defaults},state={hit:[.58,.48],amount:0,glow:0,mode:'B',target:0,age:0,preset:'grid',quality:'full',lightEnabled:false};
const params=new URLSearchParams(location.search);
if(params.has('clean'))document.body.classList.add('clean');
let grid=null,gridKey=null,renderer=null,frame,raf=0,lastTime=0,holdTimer=0,replayTimer=0,tapTimer=0,active=null,inView=true,destroyed=false,gestureBlocked=false,touchStart=null,comparisonLoad=false,loadStartedAt=0,diagnosticSettled=false,reducedKey='';
const pointers=new Set(),removers=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stats={draws:0,cpuMs:0,maxCpuMs:0,solverFrames:0,solverMs:0,maxSolverMs:0,frames:0,frameMs:0,releases:0,lastRelease:'',restoreCount:0,error:null};
function on(target,event,fn,options){target.addEventListener(event,fn,options);removers.push(()=>target.removeEventListener(event,fn,options));}
function requestDraw(){if(!raf&&!destroyed&&!document.hidden&&inView&&renderer)raf=requestAnimationFrame(tick);}
function draw(){if(!renderer||!frame)return;const t=performance.now();renderer.draw(frame,settings,state,grid);const ms=performance.now()-t;stats.draws++;stats.cpuMs+=ms;stats.maxCpuMs=Math.max(stats.maxCpuMs,ms);stage.dataset.amount=state.amount.toFixed(4);}
function tick(time){raf=0;const dt=Math.min(.045,lastTime?(time-lastTime)/1000:1/60);if(lastTime){stats.frames++;stats.frameMs+=time-lastTime;}lastTime=time;
 const rate=state.target>state.amount?settings.response:settings.restore;
 state.amount=reduced.matches?state.target:state.amount+(state.target-state.amount)*(1-Math.exp(-dt*rate));
 if(state.target>0)state.age=settings.lightDelay>0?Math.max(0,(time-loadStartedAt)/1000):state.age+dt;
 const glowTarget=(reduced.matches||state.target<=0||state.age>=settings.lightDelay)?state.amount*state.amount:0;state.glow=reduced.matches?glowTarget:state.glow+(glowTarget-state.glow)*(1-Math.exp(-dt*(state.target?settings.glowResponse:settings.restore)));
 if(Math.abs(state.amount-state.target)<.0005)state.amount=state.target;if(Math.abs(state.glow-glowTarget)<.0005)state.glow=glowTarget;
 if(settings.grid&&grid&&!diagnosticSettled){const t=performance.now();if(reduced.matches){const key=[state.amount,...state.hit].join(',');if(key!==reducedKey){grid.settle(state.amount,state.hit);reducedKey=key;}}else grid.step(dt,state.hit,state.amount);const ms=performance.now()-t;stats.solverFrames++;stats.solverMs+=ms;stats.maxSolverMs=Math.max(stats.maxSolverMs,ms);}
 draw();if((settings.grid&&grid?.active&&!diagnosticSettled&&!reduced.matches)||Math.abs(state.amount-state.target)>.0001||Math.abs(state.glow-glowTarget)>.0001||(!reduced.matches&&state.target>0&&state.age<settings.lightDelay))requestDraw();else lastTime=0;
}
function release(reason='release'){diagnosticSettled=false;clearTimeout(holdTimer);holdTimer=0;clearTimeout(replayTimer);replayTimer=0;clearTimeout(tapTimer);tapTimer=0;if(active!==null&&canvas.hasPointerCapture(active)){canvas.releasePointerCapture(active);}active=null;comparisonLoad=false;state.target=0;state.age=0;stats.releases++;stats.lastRelease=reason;requestDraw();}
function resize(){const r=stage.getBoundingClientRect();frame=frameFor(r.width,r.height);const nextKey=r.width+','+r.height;if(gridKey!==nextKey){grid?.dispose();grid=createGridModel(frame,r.width,r.height);gridKey=nextKey;}const dpr=Math.min(devicePixelRatio||1,frame.portrait?1.25:1.5);const maxSide=frame.portrait?1400:2400;const limit=Math.min(1,maxSide/Math.max(r.width*dpr,r.height*dpr));canvas.width=Math.round(r.width*dpr*limit);canvas.height=Math.round(r.height*dpr*limit);stage.dataset.layout=frame.portrait?'sp':'pc';if(active!==null)release('resize');draw();requestDraw();}
function ready(){if(destroyed)return;try{if(params.has('fallback'))throw new Error('Requested static fallback');renderer=createRenderer(canvas,state.quality);stage.dataset.renderer='webgl2';stats.error=null;status.textContent='WebGL2 / '+(reduced.matches?'動きを低減':'接触で変形')+'。調整項目はA/B共通。';resize();}catch(error){renderer=null;stage.dataset.renderer='static';stats.error=error.message;status.textContent='WebGL2を使用できないため、G1の静止見本を表示しています（操作なし）。';canvas.tabIndex=-1;canvas.setAttribute('aria-label','操作できません。G1の静止見本を表示しています。');}}
function hitFromEvent(e){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(x<8||x>r.width-8||y<8||y>r.height-8)return null;
 // Exclude the HTML title from the material's contact area.
 const title=document.querySelector('.scene-title').getBoundingClientRect();if(e.clientX>=title.left-12&&e.clientX<=title.right+12&&e.clientY>=title.top-12&&e.clientY<=title.bottom+12)return null;
 // New draw fields are anchored at the projected contact; their centre is fixed.
 const uv=settings.pull>0?[x/r.width,(y/r.height-.5)*frame.scaleY+.5]:screenToSurface(x,y,r.width,r.height,state.hit,state.amount,frame,settings);return uv[0]>=0&&uv[0]<=1?uv:null;
}
on(canvas,'pointerdown',e=>{if(!renderer||e.button!==0)return;pointers.add(e.pointerId);if(pointers.size>1||gestureBlocked){gestureBlocked=true;release('multitouch');return;}const uv=hitFromEvent(e);if(!uv)return;release('new contact');active=e.pointerId;state.hit=uv;state.target=e.pointerType==='touch'&&settings.pull===0?.28:1;
 loadStartedAt=performance.now();touchStart=e.pointerType==='touch'?[e.clientX,e.clientY]:null;
 if(e.pointerType!=='touch')canvas.setPointerCapture(e.pointerId);
 else holdTimer=setTimeout(()=>{if(active===e.pointerId&&!gestureBlocked){state.target=1;requestDraw();}},75);
 requestDraw();},{passive:true});
on(canvas,'pointermove',e=>{if(!renderer||gestureBlocked||replayTimer||comparisonLoad)return;const uv=hitFromEvent(e);
 if(active===e.pointerId){if(!uv){release('outside');return;}if(e.pointerType==='touch'&&touchStart){const deltaY=Math.abs(e.clientY-touchStart[1]);if(deltaY>12){release('vertical gesture');return;}}
 state.hit=uv;requestDraw();}
 else if(active===null&&e.pointerType==='mouse'&&e.buttons===0){if(uv){state.hit=uv;state.target=.035;requestDraw();}else release('title or edge');}
},{passive:true});
function endPointer(e){pointers.delete(e.pointerId);if(active===e.pointerId){if(e.type==='pointerup'&&e.pointerType==='touch'&&settings.pull>0&&!reduced.matches&&performance.now()-loadStartedAt<160){clearTimeout(holdTimer);holdTimer=0;active=null;state.target=1;tapTimer=setTimeout(()=>release('short tap restore'),150);requestDraw();}else release(e.type);}if(pointers.size===0)gestureBlocked=false;}
on(window,'pointerup',endPointer,{passive:true});on(window,'pointercancel',endPointer,{passive:true});
on(canvas,'pointerleave',e=>{if(tapTimer&&e.pointerType==='touch')return;if(!replayTimer&&!comparisonLoad&&(active!==null||state.target>0))release('pointerleave');},{passive:true});
on(canvas,'lostpointercapture',()=>{if(active!==null)release('lostpointercapture');});
on(window,'blur',()=>{pointers.clear();gestureBlocked=false;release('blur');});
on(window,'scroll',()=>{if(active!==null||tapTimer)release('scroll');},{passive:true});
on(canvas,'keydown',e=>{if(!renderer)return;if(e.key==='Escape'){release('escape');return;}if([' ','Enter'].includes(e.key)){e.preventDefault();if(state.target!==1){state.age=0;loadStartedAt=performance.now();}state.target=1;requestDraw();}else if(e.key.startsWith('Arrow')){e.preventDefault();const axis=e.key==='ArrowLeft'||e.key==='ArrowRight'?0:1;state.hit[axis]=clamp(state.hit[axis]+(['ArrowLeft','ArrowUp'].includes(e.key)?-.025:.025),.08,.92);requestDraw();}});
on(canvas,'keyup',e=>{if([' ','Enter'].includes(e.key))release('keyboard');});on(canvas,'blur',()=>release('focus left'));
on(document,'visibilitychange',()=>{if(document.hidden){release('hidden');cancelAnimationFrame(raf);raf=0;lastTime=0;}else requestDraw();});
const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView){release('offscreen');cancelAnimationFrame(raf);raf=0;lastTime=0;}else requestDraw();},{threshold:0});observer.observe(stage);
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
on(canvas,'webglcontextlost',e=>{e.preventDefault();release('context lost');cancelAnimationFrame(raf);raf=0;renderer?.dispose();renderer=null;stage.dataset.renderer='static';status.textContent='描画が中断しました。G1の静止見本を表示中。復旧時に面を再構成します。';});
on(canvas,'webglcontextrestored',()=>{stats.restoreCount++;ready();});
function selectMode(mode){state.mode=mode;document.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));const label=document.querySelector('[data-setting=transmission]');label.classList.toggle('disabled',mode!=='B');label.querySelector('input').disabled=mode!=='B';stage.dataset.mode=mode;draw();requestDraw();}
for(const button of document.querySelectorAll('button[data-mode]'))on(button,'click',()=>selectMode(button.dataset.mode));
const specs=[['response','接触の応答速度',3,28,.5,v=>v.toFixed(1)+' / 秒'],['restore','荷重解除の速度',1.5,12,.1,v=>v.toFixed(1)+' / 秒'],['amber','琥珀光の強さ',0,.5,.01,v=>v.toFixed(2)],['transmission','B案の透過量',0,.5,.01,v=>v.toFixed(2)]];
const ui=document.querySelector('#sliders');
for(const [key,title,min,max,step,format] of specs){const label=document.createElement('label');label.dataset.setting=key;label.innerHTML=`${title} <output>${format(settings[key])}</output><input type="range" name="${key}" min="${min}" max="${max}" step="${step}" value="${settings[key]}">`;ui.append(label);on(label.querySelector('input'),'input',e=>{settings[key]=Number(e.target.value);label.querySelector('output').textContent=format(settings[key]);draw();requestDraw();});}
function syncSettings(){for(const [key,,,,,format] of specs){const label=ui.querySelector(`[data-setting=${key}]`);label.querySelector('input').value=settings[key];label.querySelector('output').textContent=format(settings[key]);}document.querySelector('#preset-select').value=state.preset;document.querySelector('#quality-select').value=state.quality;document.querySelector('#light-toggle').checked=state.lightEnabled;document.querySelector('#settings-summary').textContent=`${state.preset==='grid'?'Grid / 膜格子':'旧Smooth'} / ${state.lightEnabled?'琥珀光あり':'形状だけ'} / ${state.quality==='full'?'Full':'Balanced'}`;}
function selectPreset(name){if(!presets[name])throw new Error('Unknown preset');diagnosticSettled=false;reducedKey='';state.preset=name;Object.assign(settings,presets[name]);stage.dataset.preset=name;grid?.reset();syncSettings();draw();requestDraw();}
function selectQuality(name){if(!['full','balanced'].includes(name))throw new Error('Unknown quality');if(destroyed)return;state.quality=name;renderer?.dispose();renderer=null;ready();syncSettings();stage.dataset.quality=name;}
on(document.querySelector('#preset-select'),'change',e=>selectPreset(e.target.value));on(document.querySelector('#quality-select'),'change',e=>selectQuality(e.target.value));
function selectLight(enabled){state.lightEnabled=Boolean(enabled);syncSettings();draw();requestDraw();}
on(document.querySelector('#light-toggle'),'change',e=>selectLight(e.target.checked));
on(document.querySelector('#overlay'),'input',e=>{document.querySelector('#reference').style.opacity=Number(e.target.value)/100;document.querySelector('#overlay-value').textContent=e.target.value+'%';});
on(document.querySelector('#dim'),'change',e=>stage.classList.toggle('dim',e.target.checked));
function startLoad(hit=[.42,.55],target=1){release('comparison start');if(settings.grid)grid?.reset();state.hit=[...hit];state.amount=0;state.glow=0;state.age=0;state.target=target;loadStartedAt=performance.now();comparisonLoad=true;lastTime=0;requestDraw();}
on(document.querySelector('#replay'),'click',()=>{if(!renderer)return;stage.scrollIntoView({behavior:'instant',block:'start'});startLoad();replayTimer=setTimeout(()=>release('replay end'),2400);});
on(document.querySelector('#reset'),'click',()=>{release('reset');Object.assign(settings,presets[state.preset]);state.amount=0;state.glow=0;grid?.reset();syncSettings();draw();});
function suspend(){release('pagehide');cancelAnimationFrame(raf);raf=0;renderer?.dispose();renderer=null;stage.dataset.renderer='static';}
on(window,'pagehide',suspend);on(window,'pageshow',e=>{if(e.persisted)ready();});
function destroy(){if(destroyed)return;suspend();destroyed=true;grid?.dispose();grid=null;observer.disconnect();resizeObserver.disconnect();for(const remove of removers)remove();canvas.width=1;canvas.height=1;status.textContent='描画資源と入力を解放しました。静止見本を表示中。';}
function sampled(uv,amount=state.amount,hit=state.hit){if(!settings.grid)return surfacePoint(uv,hit,amount,frame,settings);const base=surfacePoint(uv,hit,0,frame,settings),d=amount>0||grid?.active?grid.sample(uv):[0,0,0];return base.map((v,i)=>v+d[i]);}
// Development-only diagnostics; no production timeline or additional scenes.
window.membranePreview={
 snapshot:()=>({state:{...state,hit:[...state.hit]},settings:{...settings},frame:frame?{...frame}:null,renderer:stage.dataset.renderer,canvas:[canvas.width,canvas.height],mesh:renderer?.mesh||null,grid:settings.grid&&grid?{...grid.diagnostics(),active:grid.active}:null,stats:{...stats},raf,destroyed}),
 sample:uv=>sampled(uv),
 setMode:selectMode,setPreset:selectPreset,setQuality:selectQuality,setLight:selectLight,startLoad,releaseLoad:()=>release('comparison end'),
 ridgeTrace:(amount=state.amount,hit=state.hit,count=101)=>Array.from({length:count},(_,i)=>{const y=(i/(count-1)-.5)*frame.scaleY+.5,uv=[ridgeAt(y,frame.controls),y],p=settings.grid?(amount===0?surfacePoint(uv,hit,0,frame,settings):sampled(uv,amount,hit)):surfacePoint(uv,hit,amount,frame,settings);return {uv,screen:[p[0],(p[1]-.5)/frame.scaleY+.5],z:p[2]};}),
 settle:(amount=1,hit=[.58,.48])=>{release('test settle');state.hit=[...hit];state.target=state.amount=amount;state.glow=amount*amount;state.age=10;comparisonLoad=amount>0;cancelAnimationFrame(raf);raf=0;if(settings.grid)grid.settle(amount,hit);diagnosticSettled=true;draw();},
 loseContext:()=>renderer?.gl.getExtension('WEBGL_lose_context'),destroy,
};
state.quality=params.get('quality')==='balanced'?'balanced':'full';state.lightEnabled=params.get('light')==='on';ready();selectMode(params.get('mode')==='A'?'A':'B');selectPreset(presets[params.get('preset')]?params.get('preset'):'grid');

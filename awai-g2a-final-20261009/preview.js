import {createRenderer} from './renderer.js';
import {defaults,presets,clamp,frameFor,screenToSurface,surfacePoint} from './surface.js';
const canvas=document.querySelector('#membrane'),stage=document.querySelector('#stage'),status=document.querySelector('#status');
const settings={...defaults},state={hit:[.58,.48],amount:0,glow:0,mode:'A',target:0,age:0,preset:'original',quality:'full'};
const params=new URLSearchParams(location.search);
if(params.has('clean'))document.body.classList.add('clean');
let renderer=null,frame,raf=0,lastTime=0,holdTimer=0,replayTimer=0,active=null,inView=true,destroyed=false,gestureBlocked=false,touchStart=null,comparisonLoad=false,loadStartedAt=0;
const pointers=new Set(),removers=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stats={draws:0,cpuMs:0,maxCpuMs:0,frames:0,frameMs:0,releases:0,lastRelease:'',restoreCount:0,error:null};
function on(target,event,fn,options){target.addEventListener(event,fn,options);removers.push(()=>target.removeEventListener(event,fn,options));}
function requestDraw(){if(!raf&&!destroyed&&!document.hidden&&inView&&renderer)raf=requestAnimationFrame(tick);}
function draw(){if(!renderer||!frame)return;const t=performance.now();renderer.draw(frame,settings,state);const ms=performance.now()-t;stats.draws++;stats.cpuMs+=ms;stats.maxCpuMs=Math.max(stats.maxCpuMs,ms);stage.dataset.amount=state.amount.toFixed(4);}
function tick(time){raf=0;const dt=Math.min(.045,lastTime?(time-lastTime)/1000:1/60);if(lastTime){stats.frames++;stats.frameMs+=time-lastTime;}lastTime=time;
 const rate=state.target>state.amount?settings.response:settings.restore;
 state.amount=reduced.matches?state.target:state.amount+(state.target-state.amount)*(1-Math.exp(-dt*rate));
 if(state.target>0)state.age=settings.lightDelay>0?Math.max(0,(time-loadStartedAt)/1000):state.age+dt;
 const glowTarget=(reduced.matches||state.target<=0||state.age>=settings.lightDelay)?state.amount*state.amount:0;state.glow=reduced.matches?glowTarget:state.glow+(glowTarget-state.glow)*(1-Math.exp(-dt*(state.target?settings.glowResponse:settings.restore)));
 if(Math.abs(state.amount-state.target)<.0005)state.amount=state.target;if(Math.abs(state.glow-glowTarget)<.0005)state.glow=glowTarget;
 draw();if(Math.abs(state.amount-state.target)>.0001||Math.abs(state.glow-glowTarget)>.0001||(!reduced.matches&&state.target>0&&state.age<settings.lightDelay))requestDraw();else lastTime=0;
}
function release(reason='release'){clearTimeout(holdTimer);holdTimer=0;clearTimeout(replayTimer);replayTimer=0;if(active!==null&&canvas.hasPointerCapture(active)){canvas.releasePointerCapture(active);}active=null;comparisonLoad=false;state.target=0;state.age=0;stats.releases++;stats.lastRelease=reason;requestDraw();}
function resize(){const r=stage.getBoundingClientRect();frame=frameFor(r.width,r.height);const dpr=Math.min(devicePixelRatio||1,frame.portrait?1.25:1.5);const maxSide=frame.portrait?1400:2400;const limit=Math.min(1,maxSide/Math.max(r.width*dpr,r.height*dpr));canvas.width=Math.round(r.width*dpr*limit);canvas.height=Math.round(r.height*dpr*limit);stage.dataset.layout=frame.portrait?'sp':'pc';if(active!==null)release('resize');draw();requestDraw();}
function ready(){if(destroyed)return;try{if(params.has('fallback'))throw new Error('Requested static fallback');renderer=createRenderer(canvas,state.quality);stage.dataset.renderer='webgl2';stats.error=null;status.textContent='WebGL2 / '+(reduced.matches?'動きを低減':'接触で変形')+'。調整項目はA/B共通。';resize();}catch(error){renderer=null;stage.dataset.renderer='static';stats.error=error.message;status.textContent='WebGL2を使用できないため、G1の静止見本を表示しています（操作なし）。';canvas.tabIndex=-1;canvas.setAttribute('aria-label','操作できません。G1の静止見本を表示しています。');}}
function hitFromEvent(e){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(x<8||x>r.width-8||y<8||y>r.height-8)return null;
 // Exclude the HTML title from the material's contact area.
 const title=document.querySelector('.scene-title').getBoundingClientRect();if(e.clientX>=title.left-12&&e.clientX<=title.right+12&&e.clientY>=title.top-12&&e.clientY<=title.bottom+12)return null;
 const uv=screenToSurface(x,y,r.width,r.height,state.hit,state.amount,frame,settings);return uv[0]>=0&&uv[0]<=1?uv:null;
}
on(canvas,'pointerdown',e=>{if(!renderer||e.button!==0)return;pointers.add(e.pointerId);if(pointers.size>1||gestureBlocked){gestureBlocked=true;release('multitouch');return;}const uv=hitFromEvent(e);if(!uv)return;release('new contact');active=e.pointerId;state.hit=uv;state.target=e.pointerType==='touch'?.28:1;
 loadStartedAt=performance.now();touchStart=e.pointerType==='touch'?[e.clientX,e.clientY]:null;
 if(e.pointerType!=='touch')canvas.setPointerCapture(e.pointerId);
 else holdTimer=setTimeout(()=>{if(active===e.pointerId&&!gestureBlocked){state.target=1;requestDraw();}},75);
 requestDraw();},{passive:true});
on(canvas,'pointermove',e=>{if(!renderer||gestureBlocked||replayTimer||comparisonLoad)return;const uv=hitFromEvent(e);
 if(active===e.pointerId){if(!uv){release('outside');return;}if(e.pointerType==='touch'&&touchStart){const deltaY=Math.abs(e.clientY-touchStart[1]);if(deltaY>12){release('vertical gesture');return;}}
 state.hit=uv;requestDraw();}
 else if(active===null&&e.pointerType==='mouse'&&e.buttons===0){if(uv){state.hit=uv;state.target=.035;requestDraw();}else release('title or edge');}
},{passive:true});
function endPointer(e){pointers.delete(e.pointerId);if(active===e.pointerId)release(e.type);if(pointers.size===0)gestureBlocked=false;}
on(window,'pointerup',endPointer,{passive:true});on(window,'pointercancel',endPointer,{passive:true});
on(canvas,'pointerleave',()=>{if(!replayTimer&&!comparisonLoad&&(active!==null||state.target>0))release('pointerleave');},{passive:true});
on(canvas,'lostpointercapture',()=>{if(active!==null)release('lostpointercapture');});
on(window,'blur',()=>{pointers.clear();gestureBlocked=false;release('blur');});
on(window,'scroll',()=>{if(active!==null)release('scroll');},{passive:true});
on(canvas,'keydown',e=>{if(!renderer)return;if(e.key==='Escape'){release('escape');return;}if([' ','Enter'].includes(e.key)){e.preventDefault();if(state.target!==1){state.age=0;loadStartedAt=performance.now();}state.target=1;requestDraw();}else if(e.key.startsWith('Arrow')){e.preventDefault();const axis=e.key==='ArrowLeft'||e.key==='ArrowRight'?0:1;state.hit[axis]=clamp(state.hit[axis]+(['ArrowLeft','ArrowUp'].includes(e.key)?-.025:.025),.08,.92);requestDraw();}});
on(canvas,'keyup',e=>{if([' ','Enter'].includes(e.key))release('keyboard');});on(canvas,'blur',()=>release('focus left'));
on(document,'visibilitychange',()=>{if(document.hidden){release('hidden');cancelAnimationFrame(raf);raf=0;lastTime=0;}else requestDraw();});
const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView){release('offscreen');cancelAnimationFrame(raf);raf=0;lastTime=0;}else requestDraw();},{threshold:0});observer.observe(stage);
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
on(canvas,'webglcontextlost',e=>{e.preventDefault();release('context lost');cancelAnimationFrame(raf);raf=0;renderer?.dispose();renderer=null;stage.dataset.renderer='static';status.textContent='描画が中断しました。G1の静止見本を表示中。復旧時に面を再構成します。';});
on(canvas,'webglcontextrestored',()=>{stats.restoreCount++;ready();});
function selectMode(mode){state.mode=mode;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));const label=document.querySelector('[data-setting=transmission]');label.classList.toggle('disabled',mode!=='B');label.querySelector('input').disabled=mode!=='B';stage.dataset.mode=mode;draw();requestDraw();}
for(const button of document.querySelectorAll('[data-mode]'))on(button,'click',()=>selectMode(button.dataset.mode));
const specs=[['depth','沈みの深さ',.002,.025,.001,v=>(v*100).toFixed(1)+'% 基準短辺'],['range','影響範囲（稜線方向）',.08,.35,.01,v=>(v*100).toFixed(0)+'% 基準高'],['ratio','稜線方向 / 横断方向の比率',1.5,5,.1,v=>v.toFixed(1)+' : 1'],['response','応答速度',3,24,.5,v=>v.toFixed(1)+' / 秒'],['restore','復元速度',1.5,12,.1,v=>v.toFixed(1)+' / 秒'],['amber','琥珀光の強さ',0,.5,.01,v=>v.toFixed(2)],['transmission','B案の透過量',0,.5,.01,v=>v.toFixed(2)]];
const ui=document.querySelector('#sliders');
for(const [key,title,min,max,step,format] of specs){const label=document.createElement('label');label.dataset.setting=key;label.innerHTML=`${title} <output>${format(settings[key])}</output><input type="range" name="${key}" min="${min}" max="${max}" step="${step}" value="${settings[key]}">`;ui.append(label);on(label.querySelector('input'),'input',e=>{settings[key]=Number(e.target.value);label.querySelector('output').textContent=format(settings[key]);draw();requestDraw();});}
function syncSettings(){for(const [key,,,,,format] of specs){const label=ui.querySelector(`[data-setting=${key}]`);label.querySelector('input').value=settings[key];label.querySelector('output').textContent=format(settings[key]);}document.querySelector('#preset-select').value=state.preset;document.querySelector('#quality-select').value=state.quality;document.querySelector('#settings-summary').textContent=`${state.preset==='readable'?'Readable':'Original'} / 沈み ${(settings.depth*100).toFixed(1)}% / 光の遅れ ${Math.round(settings.lightDelay*1000)}ms / ${state.quality==='full'?'Full':'Balanced'}`;}
function selectPreset(name){if(!presets[name])throw new Error('Unknown preset');state.preset=name;Object.assign(settings,presets[name]);stage.dataset.preset=name;syncSettings();draw();requestDraw();}
function selectQuality(name){if(!['full','balanced'].includes(name))throw new Error('Unknown quality');if(destroyed)return;state.quality=name;renderer?.dispose();renderer=null;ready();syncSettings();stage.dataset.quality=name;}
on(document.querySelector('#preset-select'),'change',e=>selectPreset(e.target.value));on(document.querySelector('#quality-select'),'change',e=>selectQuality(e.target.value));
on(document.querySelector('#overlay'),'input',e=>{document.querySelector('#reference').style.opacity=Number(e.target.value)/100;document.querySelector('#overlay-value').textContent=e.target.value+'%';});
on(document.querySelector('#dim'),'change',e=>stage.classList.toggle('dim',e.target.checked));
function startLoad(hit=[.64,.48],target=1){release('comparison start');state.hit=[...hit];state.amount=0;state.glow=0;state.age=0;state.target=target;loadStartedAt=performance.now();comparisonLoad=true;lastTime=0;requestDraw();}
on(document.querySelector('#replay'),'click',()=>{if(!renderer)return;stage.scrollIntoView({behavior:'instant',block:'start'});startLoad();replayTimer=setTimeout(()=>release('replay end'),2400);});
on(document.querySelector('#reset'),'click',()=>{release('reset');Object.assign(settings,presets[state.preset]);state.amount=0;state.glow=0;syncSettings();draw();});
function suspend(){release('pagehide');cancelAnimationFrame(raf);raf=0;renderer?.dispose();renderer=null;stage.dataset.renderer='static';}
on(window,'pagehide',suspend);on(window,'pageshow',e=>{if(e.persisted)ready();});
function destroy(){if(destroyed)return;suspend();destroyed=true;observer.disconnect();resizeObserver.disconnect();for(const remove of removers)remove();canvas.width=1;canvas.height=1;status.textContent='描画資源と入力を解放しました。静止見本を表示中。';}
// Development-only diagnostics; no production timeline or additional scenes.
window.membranePreview={
 snapshot:()=>({state:{...state,hit:[...state.hit]},settings:{...settings},frame:frame?{...frame}:null,renderer:stage.dataset.renderer,canvas:[canvas.width,canvas.height],mesh:renderer?.mesh||null,stats:{...stats},raf,destroyed}),
 sample:uv=>surfacePoint(uv,state.hit,state.amount,frame,settings),
 setMode:selectMode,setPreset:selectPreset,setQuality:selectQuality,startLoad,releaseLoad:()=>release('comparison end'),
 settle:(amount=1,hit=[.58,.48])=>{release('test settle');state.hit=[...hit];state.target=state.amount=amount;state.glow=amount*amount;state.age=10;comparisonLoad=amount>0;cancelAnimationFrame(raf);raf=0;draw();},
 loseContext:()=>renderer?.gl.getExtension('WEBGL_lose_context'),destroy,
};
state.quality=params.get('quality')==='balanced'?'balanced':'full';ready();selectMode(params.get('mode')==='B'?'B':'A');selectPreset(params.get('preset')==='readable'?'readable':'original');

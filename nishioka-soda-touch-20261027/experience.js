import {createWaterScene} from './water.js';

const hero=document.querySelector('#experience');
const photo=document.querySelector('#scene-image'),phoneSource=document.querySelector('#scene-phone');
const fruit=document.querySelector('#fruit-press'),hint=document.querySelector('#fruit-hint');
const status=document.querySelector('#experience-status'),toggle=document.querySelector('#motion-toggle');
const particleCanvas=document.querySelector('#burst-canvas'),ctx=particleCanvas.getContext('2d');
const mobile=matchMedia('(max-width:700px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const options={
  sudachi:{name:'すだち',english:'SUDACHI',desktop:'assets/sudachi.webp',phone:'assets/sudachi-phone.webp',description:'皮の香りと、すっきりした酸味。|ひと口めから、すだちです。'},
  natsumikan:{name:'夏みかん',english:'NATSU MIKAN',desktop:'assets/natsumikan.webp',phone:'assets/natsumikan-phone.webp',description:'ほろ苦さのあとに、やさしい甘さ。|夏みかんの香りが、ふわっと。'}
};
let engine=null,activeImage=null,current='sudachi',request=0,paused=false;
let particleRAF=0,resizeRAF=0,lastMobile=mobile.matches,heldPointer=null;
const animations=new Set(),cache=new Map(),introTimers=new Set();
const qa=window.__sodaQA={ready:false,renderer:'picture',current,activations:0,bursts:0,transitions:0,introRuns:0,introRunning:false,lastInput:null,lastBurstDurationMs:0,loadFailures:0};
const stopped=()=>paused||reduced.matches;
window.__sodaSnapshot=()=>({...qa,paused,reduced:reduced.matches,particleRunning:!!particleRAF,engine:engine?.getState()||null,animations:document.getAnimations().length});

function loadImage(url){
  if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const i=new Image();i.decoding='async';i.onload=()=>i.decode().then(()=>resolve(i),reject);i.onerror=()=>reject(Error('Image unavailable'));i.src=url;}).catch(error=>{cache.delete(url);throw error;}));
  return cache.get(url);
}
function origin(){const r=fruit.getBoundingClientRect(),h=hero.getBoundingClientRect();return{x:(r.left+r.width/2-h.left)/h.width,y:(r.top+r.height/2-h.top)/h.height};}
function finite(element,frames,timing){
  if(stopped())return;
  const a=element.animate(frames,timing);animations.add(a);
  a.finished.catch(()=>{}).finally(()=>{animations.delete(a);a.cancel();});return a;
}
function clearParticles(){cancelAnimationFrame(particleRAF);particleRAF=0;ctx?.clearRect(0,0,particleCanvas.width,particleCanvas.height);}
function sizeParticles(){const r=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);particleCanvas.width=Math.round(r.width*dpr);particleCanvas.height=Math.round(r.height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
function stopVisuals(){for(const t of introTimers)clearTimeout(t);introTimers.clear();qa.introRunning=false;engine?.settle();clearParticles();for(const a of animations)a.cancel();animations.clear();fruit.classList.remove('is-pressed');heldPointer=null;}
function syncToggle(){hero.dataset.motion=stopped()?'off':'on';toggle.textContent=reduced.matches?'端末設定で静止中':paused?'動きを再開する':'動きを止める';toggle.disabled=reduced.matches;toggle.setAttribute('aria-pressed',String(stopped()));}

function bubbles(point){
  clearParticles();if(!ctx||!activeImage||stopped())return;
  sizeParticles();
  const rect=hero.getBoundingClientRect(),w=rect.width,h=rect.height,scale=Math.min(w,h),image=activeImage;
  const cover=Math.max(w/image.naturalWidth,h/image.naturalHeight),ox=(w-image.naturalWidth*cover)/2,oy=(h-image.naturalHeight*cover)/2;
  const particles=Array.from({length:mobile.matches?28:38},(_,i)=>{const angle=-Math.PI*.98+Math.random()*Math.PI*.88,speed=scale*(.30+Math.random()*.48);return{x:point.x*w+(Math.random()-.5)*18,y:point.y*h+(Math.random()-.5)*12,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-scale*.05,r:(1.5+Math.random()*6.8)*(mobile.matches?.8:1),life:800+Math.random()*450,delay:i*1.8};});
  const start=performance.now();let previous=start;
  function frame(now){
    const elapsed=now-start,dt=Math.min((now-previous)/1000,.04);previous=now;ctx.clearRect(0,0,w,h);
    if(elapsed>=1350||stopped()||document.hidden){qa.lastBurstDurationMs=Math.round(elapsed);clearParticles();return;}
    for(const p of particles){const age=elapsed-p.delay;if(age<0||age>p.life)continue;
      const damping=Math.exp(-1.05*dt);p.vx*=damping;p.vy=p.vy*damping+scale*.27*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
      const alpha=Math.min(age/45,1)*Math.pow(1-age/p.life,.55),r=p.r*(.9+age/p.life*.15);
      const span=2*r/cover/1.17,sx=Math.max(0,Math.min(image.naturalWidth-span,(p.x-ox)/cover-span/2)),sy=Math.max(0,Math.min(image.naturalHeight-span,(p.y-oy)/cover-span/2));
      ctx.save();ctx.globalAlpha=alpha*.92;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.clip();ctx.drawImage(image,sx,sy,span,span,p.x-r,p.y-r,r*2,r*2);ctx.restore();
      ctx.lineWidth=.8;ctx.strokeStyle=`rgba(255,255,250,${alpha*.9})`;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=Math.max(.7,r*.2);ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.beginPath();ctx.arc(p.x-r*.1,p.y-r*.1,r*.67,-2.8,-1.4);ctx.stroke();
      ctx.lineWidth=.6;ctx.strokeStyle=`rgba(24,83,69,${alpha*.21})`;ctx.beginPath();ctx.arc(p.x,p.y,r*.9,.25,1.6);ctx.stroke();
    }
    particleRAF=requestAnimationFrame(frame);
  }
  particleRAF=requestAnimationFrame(frame);
}
function popLetters(){
  document.querySelectorAll('.pop>span').forEach((letter,i)=>finite(letter,[
    {transform:'translate3d(0,0,0) rotate(0deg)',offset:0},
    {transform:`translate3d(0,${[ -9,-14,-11,-7,-4][i]}px,0) rotate(${[-3,2,-2,3,0][i]}deg)`,offset:.29,easing:'cubic-bezier(.2,.8,.25,1)'},
    {transform:'translate3d(0,1px,0) rotate(0deg)',offset:.76,easing:'cubic-bezier(.3,0,.3,1)'},
    {transform:'translate3d(0,0,0) rotate(0deg)',offset:1}
  ],{duration:620,delay:i*24,easing:'cubic-bezier(.18,.75,.25,1)'}));
}
function activate(event){
  if(!qa.ready)return;
  stopVisuals();
  qa.activations++;qa.lastInput=event.detail===0?'keyboard':'pointer';
  hint.textContent='もう一度、しゅわっ';status.textContent=`${options[current].name}の香りが、しゅわっとはじけました。`;
  if(stopped()||event.detail===0){stopVisuals();return;}
  engine?.press(origin(),0);engine?.burst(origin());bubbles(origin());popLetters();qa.bursts++;
}

async function selectFlavor(key,{animate=true,keyboard=false}={}){
  if(!options[key]||key===current)return;
  const token=++request;hero.setAttribute('aria-busy','true');
  try{
    const item=options[key],image=await loadImage(mobile.matches?item.phone:item.desktop);
    if(token!==request)return;
    stopVisuals();activeImage=image;current=key;qa.current=key;qa.transitions++;qa.lastInput=keyboard?'keyboard':'pointer';
    phoneSource.srcset=item.phone;photo.src=item.desktop;photo.alt=`光と水の中で、${item.name}ソーダの瓶と果実が弾ける写真表現`;
    hero.dataset.flavor=key;document.querySelector('#flavor-title').textContent=item.name+'、';document.querySelector('#capacity-flavor').textContent=item.english;
    const description=document.querySelector('#flavor-description');description.replaceChildren(...item.description.split('|').flatMap((s,i)=>i?[document.createElement('br'),document.createTextNode(s)]:[document.createTextNode(s)]));
    fruit.setAttribute('aria-label',`${item.name}を押して炭酸をはじけさせる`);hint.textContent='果実をひと押し';
    document.querySelectorAll('.flavor-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flavor===key)));
    const motion=animate&&!stopped()&&!keyboard;
    engine?.setImage(image,{animate:motion,origin:origin(),duration:950});
    if(motion){bubbles(origin());finite(document.querySelector('#flavor-title'),[{opacity:.3,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});}
    status.textContent=`${item.name}味に切り替えました。${item.description.replace('|','')}`;
  }catch(_){qa.loadFailures++;status.textContent='写真を読み込めませんでした。もう一度、味を選んでください。';}
  finally{if(token===request)hero.removeAttribute('aria-busy');}
}

fruit.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary||stopped()||!qa.ready)return;
  stopVisuals();
  heldPointer=e.pointerId;fruit.setPointerCapture(e.pointerId);fruit.classList.add('is-pressed');engine?.press(origin(),1);
});
fruit.addEventListener('pointerup',e=>{if(heldPointer!==e.pointerId)return;heldPointer=null;fruit.classList.remove('is-pressed');engine?.press(origin(),0);});
fruit.addEventListener('pointercancel',()=>{heldPointer=null;fruit.classList.remove('is-pressed');engine?.press(origin(),0);});
fruit.addEventListener('lostpointercapture',()=>{if(heldPointer!==null){heldPointer=null;fruit.classList.remove('is-pressed');engine?.press(origin(),0);}});
fruit.addEventListener('click',activate);
document.querySelectorAll('.flavor-button').forEach(button=>button.addEventListener('click',e=>{void selectFlavor(button.dataset.flavor,{keyboard:e.detail===0});}));
toggle.addEventListener('click',()=>{paused=!paused;stopVisuals();syncToggle();status.textContent=paused?'動きを止めました。味は引き続き選べます。':'動きを再開しました。';});
reduced.addEventListener('change',()=>{stopVisuals();syncToggle();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVisuals();});
window.addEventListener('pagehide',()=>{stopVisuals();});
window.addEventListener('resize',()=>{
  cancelAnimationFrame(resizeRAF);resizeRAF=requestAnimationFrame(async()=>{
    stopVisuals();sizeParticles();engine?.resize();
    if(lastMobile!==mobile.matches){lastMobile=mobile.matches;const token=++request;try{const image=await loadImage(mobile.matches?options[current].phone:options[current].desktop);if(token!==request)return;activeImage=image;engine?.setImage(image,{animate:false});}catch(_){qa.loadFailures++;hero.removeAttribute('data-water');}}
  });
},{passive:true});

async function start(){
  syncToggle();sizeParticles();
  try{
    await document.fonts.ready;activeImage=await loadImage(mobile.matches?options[current].phone:options[current].desktop);
    engine=await createWaterScene({canvas:document.querySelector('#water-canvas'),image:activeImage,onUnavailable:()=>{hero.removeAttribute('data-water');qa.renderer='picture';engine=null;}});
    if(engine){hero.dataset.water='ready';qa.renderer='webgl';}
    qa.ready=true;fruit.disabled=false;document.querySelectorAll('.flavor-button').forEach(b=>b.disabled=false);
    if(!stopped()&&!document.hidden){
      qa.introRunning=true;qa.introRuns++;
      const later=(fn,ms)=>{const timer=setTimeout(()=>{introTimers.delete(timer);fn();},ms);introTimers.add(timer);};
      later(()=>{engine?.press(origin(),.6);},110);
      later(()=>{engine?.press(origin(),0);engine?.burst(origin());bubbles(origin());popLetters();},280);
      later(()=>{qa.introRunning=false;},1750);
    }
    // Inactive flavor decodes off the interaction path; only the viewport's composition is fetched.
    for(const [key,item]of Object.entries(options))if(key!==current)void loadImage(mobile.matches?item.phone:item.desktop).catch(()=>{});
  }catch(_){qa.loadFailures++;status.textContent='写真を読み込めませんでした。ページを再読み込みしてください。';}
}
void start();

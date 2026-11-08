(()=>{
 const hero=document.querySelector('.hero-poster');if(!hero)return;
 const stage=hero.querySelector('.hero-stage'),scene=hero.querySelector('.hero-scene'),rail=hero.querySelector('.hero-actions'),controls=hero.querySelector('.hero-motion-controls'),entry=hero.querySelector('.hero-truck-entry'),truck=hero.querySelector('.hero-truck'),skip=hero.querySelector('.hero-motion-skip');
 if(!stage||!scene||!rail||!controls||!entry||!truck||!skip)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,start=0,distance=1,width=innerWidth,enabled=false,arrived=false,inView=true,sceneScale=1,textLeft=0;
 const copyEl=hero.querySelector('.hero-motion-copy');
 const clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
 const travelEase=v=>v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2;
 function paint(){
  frame=0;if(!enabled)return;
  const p=clamp((scrollY-start)/distance),travel=travelEase(clamp((p-.025)/.8));
  const copy=1-smooth((p-.015)/.23);
  hero.style.setProperty('--motion-progress',p.toFixed(4));
  // The canvas is fitted to short screens; keep travel measured in viewport pixels.
  hero.style.setProperty('--motion-truck-x',(-width*1.45*travel/sceneScale).toFixed(2)+'px');
  hero.style.setProperty('--motion-truck-scale',(1+.055*Math.sin(travel*Math.PI)).toFixed(4));
  hero.style.setProperty('--motion-wordmark-x',(-width*.2*p/sceneScale).toFixed(2)+'px');
  hero.style.setProperty('--motion-wordmark-opacity',(1-smooth((p-.2)/.4)).toFixed(4));
  hero.style.setProperty('--motion-copy-x',(-42*smooth(p/.25)/sceneScale).toFixed(2)+'px');
  hero.style.setProperty('--motion-copy-opacity',copy.toFixed(4));
  hero.style.setProperty('--motion-panel-inset',((1-smooth((p-.16)/.45))*100).toFixed(2)+'%');
  // Bring the promise in only once the truck has driven clear of its text, so the
  // letters never sit behind the trailer on any screen size.
  const clear=textLeft-truck.getBoundingClientRect().right;
  const message=(textLeft?smooth(clear/(width*.16)):smooth((p-.48)/.12))*smooth((p-.22)/.1);
  hero.style.setProperty('--motion-message-opacity',message.toFixed(4));
  hero.style.setProperty('--motion-message-y',((1-message)*60).toFixed(2)+'px');
  hero.style.setProperty('--motion-note-color',p>.2?'#dceaff':'#60758d');
  const note=1-smooth((p-.6)/.1);
  hero.style.setProperty('--motion-note-opacity',note.toFixed(4));
  hero.dataset.motionProgress=p.toFixed(4);
 }
 function requestPaint(){if(enabled&&inView&&!frame)frame=requestAnimationFrame(paint);}
 function measure(){
  const previousY=scrollY;
  const pinnedProgress=enabled&&previousY>=start&&previousY<=start+distance?clamp((previousY-start)/distance):null;
  if(frame){cancelAnimationFrame(frame);frame=0;}
  enabled=false;hero.classList.remove('motion-enabled','motion-tight','motion-landscape');controls.hidden=true;
  hero.removeAttribute('style');hero.dataset.motionProgress='0';
  if(reduced.matches){entry.classList.remove('is-arriving');return;}
  const header=document.querySelector('.header').getBoundingClientRect().height;
  const openingOffset=Math.max(0,hero.getBoundingClientRect().top+scrollY-header);
  const base=stage.getBoundingClientRect().height;
  width=stage.getBoundingClientRect().width;
  const titleSize=parseFloat(getComputedStyle(hero.querySelector('h1')).fontSize);
  const bodySize=parseFloat(getComputedStyle(hero.querySelector('.hero-description')).fontSize);
  const viewport=Math.min(innerHeight,window.visualViewport?.height||innerHeight);
  controls.hidden=false;hero.classList.add('motion-enabled');
  const railHeight=rail.getBoundingClientRect().height,controlsHeight=controls.getBoundingClientRect().height;
  const available=Math.floor(viewport-header-railHeight-controlsHeight-openingOffset-8);
  const height=Math.min(base,Math.max(120,available));
  const landscape=viewport<500&&innerWidth>viewport;
  sceneScale=landscape?1:Math.min(1,height/base);
  distance=Math.max(420,Math.min(820,viewport*.92));
  hero.classList.toggle('motion-tight',sceneScale<.86);
  hero.classList.toggle('motion-landscape',landscape);
  hero.style.setProperty('--motion-header-height',header+'px');
  hero.style.setProperty('--motion-stage-height',height+'px');
  hero.style.setProperty('--motion-total-height',(height+railHeight+controlsHeight+distance)+'px');
  hero.style.setProperty('--motion-scene-width',width+'px');
  hero.style.setProperty('--motion-base-height',base+'px');
  hero.style.setProperty('--motion-scene-scale',sceneScale.toFixed(5));
  hero.style.setProperty('--motion-title-size',Math.max(titleSize,32/sceneScale).toFixed(2)+'px');
  hero.style.setProperty('--motion-body-size',Math.max(bodySize,11/sceneScale).toFixed(2)+'px');
  start=hero.getBoundingClientRect().top+scrollY-header;
  // Resizing the scroll spacer can trigger Safari's scroll anchoring. Restore
  // the same point of the sequence after its final geometry has been measured.
  if(pinnedProgress!==null){const html=document.documentElement,behavior=html.style.scrollBehavior;html.style.scrollBehavior='auto';scrollTo(0,start+distance*pinnedProgress);html.style.scrollBehavior=behavior;}
  const range=document.createRange();range.selectNodeContents(copyEl);textLeft=range.getBoundingClientRect().left;
  enabled=true;paint();
 }
 const observer=new IntersectionObserver(([item])=>{inView=item.isIntersecting;hero.classList.toggle('is-in-view',inView);if(inView)requestPaint();},{rootMargin:'80px 0px'});observer.observe(hero);
 addEventListener('scroll',requestPaint,{passive:true});
 let resizeTimer;
 function resize(){if(document.querySelector('dialog[open]'))return;clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,100);}
 addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('resize',resize,{passive:true});
 document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',resize));
 reduced.addEventListener('change',measure);
 skip.addEventListener('click',()=>{const target=document.querySelector('#about');if(!target)return;const html=document.documentElement,previous=html.style.scrollBehavior;html.style.scrollBehavior='auto';const y=target.getBoundingClientRect().top+scrollY-document.querySelector('.header').getBoundingClientRect().height-15;scrollTo(0,y);target.tabIndex=-1;target.focus({preventScroll:true});requestAnimationFrame(()=>{html.style.scrollBehavior=previous;});});
 measure();document.fonts.ready.then(measure);
 truck.decode().catch(()=>{}).then(()=>{measure();if(!reduced.matches&&!arrived&&scrollY<start+30){arrived=true;entry.classList.add('is-arriving');entry.addEventListener('animationend',()=>entry.classList.remove('is-arriving'),{once:true});}});
})();

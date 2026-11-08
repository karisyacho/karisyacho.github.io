/* A continuous journey through the site, using the browser's native scroll. */
(()=>{
 const main=document.querySelector('main');
 if(!main||!window.IntersectionObserver||!window.matchMedia)return;
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const targets=[],sections=[...main.querySelectorAll(':scope > section:not(.hero)')];
 const active=new Set();let enterObserver,scrollObserver,frame=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function mark(selector,type){
  main.querySelectorAll(selector).forEach(node=>{
   if(node.closest('.hero,form,dialog,#inquiry-confirmation')||node.dataset.motion)return;
   node.dataset.motion=type;targets.push(node);
  });
 }
 mark('h1,h2,.transport-brief h3','heading');
 mark('.about-description,.section-heading>p,.safety-lead,.recruit-words,.page-intro>p,.split-intro>div,.profile-heading>p,.contact-guide>p','copy');
 mark('.audience-links>a,.service-detail,.safety-practices>div,.recruit-links>details,.principle-list>article,.culture-topics>article,.profile-table>div,.work-timeline>li,.process-list>li,.job-list>details,.faq-list>details,.page-jumps>a,.contact-grid>a,.contact-grid>button','row');
 mark('.safety-photo,.recruit-photo,.wide-photo,.vehicle-visual','image');
 mark('.transport-brief,.route-visual,.storage-visual','route');
 mark('.contact','panel');
 mark('.work-timeline,.process-list','steps');
 targets.forEach(node=>{
  if(node.dataset.motion==='heading'&&!node.querySelector('br.mobile')){
   const lines=node.innerHTML.split(/<br\b[^>]*>/i);
   node.innerHTML=lines.map((line,i)=>`<span class="motion-line"><span style="--line-index:${i}">${line}</span></span>`).join('');
  }
  if(node.dataset.motion==='image'){
   const img=node.querySelector('img');if(!img)return;
   const wrapper=document.createElement('div');wrapper.className='motion-image-frame';
   img.before(wrapper);wrapper.append(img);
  }
  if(node.dataset.motion==='row'){
   const siblings=[...node.parentElement.children].filter(n=>n.dataset.motion==='row');
   node.style.setProperty('--motion-delay',Math.min(siblings.indexOf(node),3)*65+'ms');
  }
 });
 sections.forEach(section=>section.dataset.motionSection='');
 function enter(node,instant=false){
  if(instant)node.classList.add('motion-instant');
  node.classList.add('motion-entered');enterObserver?.unobserve(node);
 }
 function finishAll(){targets.forEach(node=>enter(node,true));}
 function draw(){
  frame=0;if(preference.matches||document.hidden)return;
  const height=window.visualViewport?.height||innerHeight;
  // Read all geometry before writing styles; only visible regions are tracked.
  const measurements=[...active].map(node=>({node,rect:node.getBoundingClientRect(),imageHeight:node.querySelector('.motion-image-frame')?.offsetHeight||0}));
  for(const {node,rect,imageHeight} of measurements){
   const progress=clamp((height-rect.top)/(height+rect.height));
   if(node.hasAttribute('data-motion-section'))node.style.setProperty('--section-progress',progress.toFixed(4));
   if(node.dataset.motion==='image')node.style.setProperty('--image-shift',((.5-progress)*2*Math.min(28,imageHeight*.055)).toFixed(2)+'px');
   if(['route','steps'].includes(node.dataset.motion))node.style.setProperty('--route-progress',clamp((height*.86-rect.top)/(height*.58+Math.min(rect.height,600)*.18)).toFixed(4));
  }
 }
 function requestDraw(){if(!frame&&!preference.matches&&!document.hidden)frame=requestAnimationFrame(draw);}
 function setup(){
  enterObserver?.disconnect();scrollObserver?.disconnect();active.clear();
  if(frame){cancelAnimationFrame(frame);frame=0;}
  document.body.classList.remove('site-motion-on');
  if(preference.matches){
   finishAll();targets.forEach(node=>{node.style.removeProperty('--image-shift');node.style.removeProperty('--route-progress');});
   return;
  }
  enterObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)enter(entry.target);},{rootMargin:'0px 0px -6% 0px',threshold:0});
  scrollObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)active.add(entry.target);else active.delete(entry.target);}requestDraw();},{rootMargin:'120px 0px',threshold:0});
  document.body.classList.add('site-motion-on');
  targets.forEach(node=>{
   // Above the viewport, or already read, content is never hidden again.
   if(node.getBoundingClientRect().bottom<0||node.classList.contains('motion-entered'))enter(node,true);
   else enterObserver.observe(node);
   if(['image','route','steps'].includes(node.dataset.motion))scrollObserver.observe(node);
  });
  sections.forEach(section=>scrollObserver.observe(section));requestDraw();
 }
 document.addEventListener('focusin',event=>{
  let node=event.target;while(node&&node!==main){if(node.dataset?.motion)enter(node,true);node=node.parentElement;}
 });
 function revealHash(){
  let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}
  if(!target)return;
  if(target.dataset.motion)enter(target,true);
  target.querySelectorAll('[data-motion]').forEach(node=>enter(node,true));requestDraw();
 }
 addEventListener('hashchange',revealHash);
 addEventListener('scroll',requestDraw,{passive:true});
 addEventListener('resize',requestDraw,{passive:true});
 window.visualViewport?.addEventListener('resize',requestDraw,{passive:true});
 document.addEventListener('visibilitychange',requestDraw);
 document.addEventListener('beforematch',finishAll);
 addEventListener('beforeprint',finishAll);
 preference.addEventListener('change',setup);
 try{setup();if(location.hash)revealHash();}catch(error){document.body.classList.remove('site-motion-on');finishAll();}
})();

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let pointerNavigation = false;
document.addEventListener('click', event => {
  const link=event.target.closest('a[href]');
  if(!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin || url.pathname===location.pathname)return;
  pointerNavigation=event.detail>0&&!reduced.matches;
  try{sessionStorage.setItem('maison-pointer-navigation',pointerNavigation?'1':'0');}catch{}
});
window.addEventListener('pageswap', event=>{
  if(event.viewTransition&&(!pointerNavigation||reduced.matches))event.viewTransition.skipTransition();
});
window.addEventListener('pagereveal', event=>{
  let allow=false;
  try{allow=sessionStorage.getItem('maison-pointer-navigation')==='1';sessionStorage.removeItem('maison-pointer-navigation');}catch{}
  if(event.viewTransition&&(!allow||reduced.matches))event.viewTransition.skipTransition();
});
document.addEventListener('keydown',()=>document.documentElement.classList.add('using-keyboard'));
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('using-keyboard'),{passive:true});

const study=document.querySelector('[data-study]');
if(study){
  let active=false,pending=false;
  const update=()=>{
    pending=false;
    if(!active||document.hidden)return;
    if(reduced.matches){study.style.removeProperty('--progress');study.style.removeProperty('--approach');return;}
    const rect=study.getBoundingClientRect();
    const distance=Math.max(1,rect.height-innerHeight);
    const progress=Math.max(0,Math.min(1,-rect.top/distance));
    study.style.setProperty('--progress',progress.toFixed(4));
    study.style.setProperty('--approach',(1+progress*.24).toFixed(4));
  };
  const schedule=()=>{if(active&&!pending){pending=true;requestAnimationFrame(update);}};
  const observer=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active)schedule();},{rootMargin:'50px'});
  observer.observe(study);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',()=>{study.style.removeProperty('--progress');study.style.removeProperty('--approach');schedule();});
}

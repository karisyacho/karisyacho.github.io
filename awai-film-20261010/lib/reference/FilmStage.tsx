'use client';
import {useEffect,useRef} from 'react';
import {config,workMotion} from '../../lib/config';
import {renderPaperDensity,renderOpening,subscribePaperSurface,inkColor} from '../../lib/washi';
import {scenes,totalVh,resolve,smooth,clamp} from '../../lib/film';
import {works} from '../../lib/works';
import {filmCopy,filmContact,filmTiming} from '../../lib/film-content';

const rootMedia='/awai-paper/media/';
const contact=filmContact;
const label=(w:typeof works[number])=>`${w.title} ／ ${w.category} ／ ${w.type==='client'?'ご依頼':'見本'}`;
const placeholders:Record<string,string>={'shadow-placeholder':'#bdbfbd','cloth-wide-placeholder':'#7c8080','cloth-plain-placeholder':'#d1d2cf','cloth-dyed-placeholder':'#686d70',black:'#101110',white:'#fbfbf8',paper:'#e5e3dc'};
const workForScene:Record<string,string>={'aima-in':'aima',aima:'aima',suketo:'suketo',okinohama:'okinohama',uchimachi:'uchimachi',kasane:'kasane',arc:'arc',studiofree:'studiofree'};
function asset(key:string,mobile:boolean){
 if(key==='dusk')return rootMedia+'washi/dusk-study.webp';
 if(key==='suketo-web')return rootMedia+'works/suketo-web'+(mobile?'-mobile':'')+'.webp';
 if(key.startsWith('kasane-'))return rootMedia+'works/'+key+'.webp';
 const w=works.find(w=>w.slug===key);return w?rootMedia+'works/'+(mobile&&w.mobileImage?w.mobileImage:w.image):'';
}
function ContactLinks(){return <><a href={contact.line}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h14v10H9l-4 4v-4H3z"/></svg>LINEで話す</a><span aria-hidden="true">｜</span><a href={contact.instagram}><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="4"/><circle cx="10" cy="10" r="3"/><circle cx="14" cy="6" r=".6"/></svg>Instagramで話す</a></>;}
function Credits(){return <><h2>あわい</h2><div className="film-credit-columns"><div><h3>Works</h3>{works.map(w=><a key={w.slug} href={w.url}>{label(w)}</a>)}</div><div><h3>Credits</h3><p>制作：社長（仮）</p><p>写真：各作品のサイトより</p><p>STUDIO FREEの施術風景と町の夕景：構成用の生成画像</p><p>書体：游明朝・游ゴシック<br/>端末によりヒラギノ明朝・角ゴシック</p></div><div><h3>Contact</h3><a href={contact.instagram}>Instagram</a><a href={contact.line}>LINE</a></div></div><a className="film-credit-price" href="/awai-paper/film/price/">料金と進め方</a></>;}

export default function FilmStage(){
 const track=useRef<HTMLDivElement>(null),stage=useRef<HTMLElement>(null),surface=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const wrap=track.current!,el=stage.current!,cv=surface.current!,ctx=cv.getContext('2d',{alpha:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');if(!ctx||reduced.matches)return;
  const backs=Array.from(el.querySelectorAll<HTMLElement>('.film-back'));
  const glyphs=Array.from(el.querySelectorAll<HTMLElement>('.film-logo span'));
  const logo=el.querySelector<HTMLElement>('.film-logo')!,interlude=el.querySelector<HTMLElement>('[data-ink=interlude]')!,human=el.querySelector<HTMLElement>('[data-ink=human]')!,kari=el.querySelector<HTMLElement>('.film-kari')!,credits=el.querySelector<HTMLElement>('.film-credits')!,ending=el.querySelector<HTMLElement>('.film-contact')!,tag=el.querySelector<HTMLElement>('.film-label')!;
  let width=1,height=1,dpr=1,position=0,targetPosition=0,last=0,raf=0,disposed=false,visible=!document.hidden;
  let active=false,strength=0,targetStrength=0,spread=.28,x=0,y=0,pointX=0,pointY=0,downX=0,downY=0,pointer:number|null=null,hold=0,idle=0,idleEnd=0,used=false;
  let currentId='',cut=0,cutAt=-Infinity,cutWake=0,kariStarted=0,kariDone=false,creditY=0;
  const images=new Map<string,HTMLImageElement>();
  const maps=new Map<string,Float32Array>();const low=document.createElement('canvas'),lowCtx=low.getContext('2d')!,mask=document.createElement('canvas'),maskCtx=mask.getContext('2d')!;
  let mapW=0,mapH=0;
  function start(){if(!raf&&!disposed&&visible)raf=requestAnimationFrame(tick);}
  function image(key:string){const src=asset(key,width<600);if(!src)return null;let im=images.get(src);if(!im){im=new Image();im.onload=()=>{maps.delete(key);start();};im.src=src;images.set(src,im);}return im.complete&&im.naturalWidth?im:null;}
  function cover(c:CanvasRenderingContext2D,im:HTMLImageElement,key:string,w=width,h=height){
   const work=works.find(a=>a.slug===key);let sx=.5,sy=.5;if(key==='suketo-web')sy=0;else if(work){const coords=(width<600?work.mobilePosition||work.position:work.position).split(' ');sx=parseFloat(coords[0])/100;sy=parseFloat(coords[1])/100;}
   const fit=key==='arc'?Math.min(w/im.naturalWidth,h/im.naturalHeight):Math.max(w/im.naturalWidth,h/im.naturalHeight);
   const iw=im.naturalWidth*fit,ih=im.naturalHeight*fit;c.save();if(key==='arc'){c.fillStyle='#bd3929';c.fillRect(0,0,w,h);c.globalCompositeOperation='multiply';c.filter='grayscale(1) contrast(1.25)';}else if(key.startsWith('kasane'))c.filter='grayscale(1) brightness(.55)';else if(key==='suketo')c.filter='brightness(.72)';
   c.drawImage(im,(w-iw)*sx,(h-ih)*sy,iw,ih);c.restore();
  }
  function drawPicture(key:string){ctx!.setTransform(dpr,0,0,dpr,0,0);ctx!.globalCompositeOperation='source-over';ctx!.globalAlpha=1;ctx!.clearRect(0,0,width,height);if(key==='paper'){renderPaperDensity(ctx!,width,height,dpr);return;}const im=image(key);if(im)cover(ctx!,im,key);else {ctx!.fillStyle=placeholders[key]||'#101110';ctx!.fillRect(0,0,width,height);}}
  function brightness(key:string){
   const cached=maps.get(key);if(cached)return cached;lowCtx.clearRect(0,0,mapW,mapH);const im=image(key);
   if(im)cover(lowCtx,im,key,mapW,mapH);else {lowCtx.fillStyle=placeholders[key]||'#e5e3dc';lowCtx.fillRect(0,0,mapW,mapH);}
   const pixels=lowCtx.getImageData(0,0,mapW,mapH).data,result=new Float32Array(mapW*mapH);
   for(let i=0;i<result.length;i++)result[i]=(pixels[i*4]*.2126+pixels[i*4+1]*.7152+pixels[i*4+2]*.0722)/255;
   maps.set(key,result);return result;
  }
  // A luminance threshold removes the outgoing surface. It never draws an edge.
  function dissolve(from:string,to:string,t:number,kind:'white'|'dark'){
   drawPicture(from);const source=kind==='dark'&&from==='paper'?to:from,luminance=brightness(source),pixels=maskCtx.createImageData(mapW,mapH);
   for(let i=0;i<luminance.length;i++){const rank=kind==='white'?1-luminance[i]:luminance[i];const alpha=1-smooth((t*1.16-rank+.0)/.08);pixels.data[i*4+3]=Math.round(alpha*255);}
   maskCtx.putImageData(pixels,0,0);ctx!.save();ctx!.globalCompositeOperation='destination-in';ctx!.imageSmoothingEnabled=true;ctx!.drawImage(mask,0,0,width,height);ctx!.restore();
  }
  function setBack(slot:number,key:string,opacity=1,zoom=1){const b=backs[slot],im=b.querySelector<HTMLImageElement>('img')!;b.dataset.kind=key;b.style.opacity=String(opacity);b.style.background=placeholders[key]|| (key==='arc'?'#bd3929':'#101110');b.style.transform=`scale(${zoom})`;const src=asset(key,width<600);im.hidden=!src;if(src&&im.getAttribute('src')!==src)im.src=src;im.style.filter=key==='dusk'&&currentId==='silence'?'blur(20px)':key.startsWith('kasane')?'grayscale(1) brightness(.55)':key==='suketo'?'brightness(.72)':key==='arc'?'grayscale(1) contrast(1.25)':'none';const work=works.find(w=>w.slug===key);im.style.objectPosition=key==='suketo-web'?'50% 0%':work?(width<600?work.mobilePosition||work.position:work.position):'50% 50%';}
  function marker(travel=0){ctx!.save();ctx!.globalCompositeOperation='source-atop';ctx!.strokeStyle='rgba(104,102,92,.12)';ctx!.lineWidth=.45;ctx!.beginPath();ctx!.moveTo(width*.32-travel,height*.71);ctx!.quadraticCurveTo(width*.32+17-travel,height*.71+1.2,width*.32+35-travel,height*.71-1);ctx!.stroke();ctx!.restore();}
  function display(node:HTMLElement,on:boolean,opacity=1){node.hidden=!on||opacity<=.001;node.style.opacity=String(opacity);if(node===credits||node===ending)node.inert=!on||opacity<.06;}
  function render(now:number,dt:number){
   const r=resolve(position,height),{scene,p,next,seam}=r;
   if(currentId!==scene.id){release();strength=0;spread=.28;const from=currentId;currentId=scene.id;if(currentId==='kasane'){cut=from==='arc'||from==='studiofree'?2:0;cutAt=now;}if(currentId!=='credits')creditY=height;}
   el.dataset.scene=scene.id;el.dataset.progress=p.toFixed(5);el.dataset.touch=String(scene.touch);el.dataset.seam=seam?`${seam.from}:${seam.to}`:'';el.dataset.seamProgress=seam?.t.toFixed(5)||'0';
   if(p>.9&&scene.touch&&next&&targetStrength>0)release();
   const density={x,y,radius:(width<600?config.radiusMobile:config.radiusDesktop)*spread,strength};
   let front=scene.surface,back=scene.back;
   if(scene.id==='kasane'){
    const desired=Math.min(2,Math.floor(p*3));if(desired!==cut){if(now-cutAt>=workMotion.cutMinMs){cut+=Math.sign(desired-cut);cutAt=now;}else if(!cutWake)cutWake=window.setTimeout(()=>{cutWake=0;start();},workMotion.cutMinMs-(now-cutAt)+1);}
    back=['kasane','kasane-layer','kasane-detail'][cut];el.dataset.cut=String(cut);
   }
   image(back);if(next){image(next.back);image(next.surface);}if(scene.id==='kasane'){image('kasane-layer');image('kasane-detail');}
   const zoom=scene.id==='part'?1.02+p*.03:scene.id==='okinohama'?1.02+p*.02:scene.id==='breath'?1.05:1;
   setBack(0,back,1,zoom);setBack(1,'white',0);
   ctx!.setTransform(dpr,0,0,dpr,0,0);ctx!.clearRect(0,0,width,height);ctx!.globalAlpha=1;
   if(scene.id==='part'||scene.id==='breath'||scene.id==='door'){
    let travel=scene.id==='part'?smooth(p)*width*.60:scene.id==='breath'?(1-smooth(p))*width*.60+1:1+smooth((p-.20)/.80)*width*.60;
    if(scene.id==='door'&&p<.2){setBack(0,'dusk',1,1.05);setBack(1,'suketo',smooth(p/.2));}
    renderOpening(ctx!,width,height,travel);if(scene.id==='part')marker(travel);
   }else if(scene.id==='open'||scene.id==='blank'){renderPaperDensity(ctx!,width,height,dpr,density);marker();}
   else if(scene.id==='suketo'||scene.id==='aima'){
    renderPaperDensity(ctx!,width,height,dpr,density);ctx!.save();ctx!.globalCompositeOperation='source-atop';const im=image(front);if(im)cover(ctx!,im,front);else {ctx!.fillStyle=placeholders[front];ctx!.fillRect(0,0,width,height);}ctx!.restore();
    if(scene.id==='suketo')ctx!.clearRect(0,height-(width<600?workMotion.edgeMobile:workMotion.edgeDesktop),width,width<600?workMotion.edgeMobile:workMotion.edgeDesktop);
    else {ctx!.save();ctx!.globalCompositeOperation='destination-out';const g=ctx!.createLinearGradient(0,0,width*.06,0);g.addColorStop(0,'rgba(0,0,0,.15)');g.addColorStop(1,'rgba(0,0,0,0)');ctx!.fillStyle=g;ctx!.fillRect(0,0,width*.06,height);ctx!.restore();}
   }else if(scene.id==='aima-in'){ctx!.clearRect(0,0,width,height);}
   else if(scene.id==='aima-fuse'){drawPicture(front);ctx!.save();ctx!.globalCompositeOperation='destination-in';ctx!.globalAlpha=1-smooth(p);ctx!.fillRect(0,0,width,height);ctx!.restore();}
   else if(scene.id==='aima-return'){drawPicture(front);ctx!.save();ctx!.globalCompositeOperation='destination-in';ctx!.globalAlpha=1-smooth(p/.85);ctx!.fillRect(0,0,width,height);ctx!.restore();if(p>.85){renderPaperDensity(ctx!,width,height,dpr);marker();}}
   else if(front==='paper'){renderPaperDensity(ctx!,width,height,dpr);if(scene.id==='silence'){ctx!.save();ctx!.globalCompositeOperation='destination-in';ctx!.globalAlpha=.93+.07*p;ctx!.fillRect(0,0,width,height);ctx!.restore();}if(scene.id==='rest'){ctx!.save();ctx!.globalCompositeOperation='destination-in';ctx!.globalAlpha=.96;ctx!.fillRect(0,0,width,height);ctx!.restore();}}
   if(seam&&next){
    const source=scene.id==='kasane'?back:scene.surface==='none'?back:scene.id==='aima-in'?scene.back:front;
    const destination=next.surface==='paper'?'paper':next.id==='kasane'?'black':next.id==='aima'?next.surface:next.back;
    // A touch trace settles before its hidden back is replaced.
    if(strength<.002){setBack(0,destination);setBack(1,'white',0);dissolve(source,destination,smooth(seam.t),seam.kind as 'white'|'dark');}
   }
   const logoOn=scene.id==='open'||scene.id==='part';display(logo,logoOn,scene.id==='part'?1-smooth(p/.48):1);
   glyphs.forEach((g,i)=>{const shift=scene.id==='part'?smooth(p)*width*.09:0;g.style.transform=`translate(${i===0?-shift:i===2?shift:0}px,${scene.id==='part'?(i-1)*smooth(p)*height*.2:0}px)`;g.style.color=inkColor(width*.5,height*(.3+i*.05),density);});
   display(interlude,scene.id==='interlude',smooth(p/.25)*(1-smooth((p-.70)/.12)));
   display(human,scene.id==='human',smooth(p/.35));human.style.filter=`blur(${scene.id==='human'?(1-smooth(p/.35))*3:0}px)`;
   if(scene.id==='human'&&p>.25&&!kariDone&&!kariStarted)kariStarted=now+filmTiming.kariDelayMs;
   if(kariStarted){const t=smooth((now-kariStarted)/filmTiming.kariLandMs);kari.style.opacity=String(t);kari.style.transform=`translateY(${(1-t)*6}px) rotate(${-3*t}deg)`;if(t===1){kariDone=true;kariStarted=0;}}
   if(kariDone){kari.style.opacity='1';kari.style.transform='rotate(-3deg)';}else if(!kariStarted)kari.style.opacity='0';
   const work=works.find(w=>w.slug===workForScene[scene.id]),labelOpacity=smooth((p-.08)/.12)*(1-smooth((p-.70)/.08));
   display(tag,!!work&&labelOpacity>0,labelOpacity);if(work){tag.querySelector('p')!.textContent=label(work);tag.querySelector('small')!.textContent=work.imageNote||'';tag.style.color=['uchimachi','aima'].includes(scene.id)?'#353631':'#f4f1e8';}
   display(credits,scene.id==='credits',1-smooth((p-.75)/.20));if(scene.id==='credits'){const desired=height*(1-smooth(p/.28));const maximum=filmTiming.creditMaxPxPerSecond*dt/1000;creditY+=Math.max(-maximum,Math.min(maximum,desired-creditY));credits.style.transform=`translate(-50%,calc(-50% + ${creditY}px))`;el.dataset.creditY=creditY.toFixed(2);}
   display(ending,scene.id==='blank',smooth(p/.20));ending.querySelector<HTMLElement>('.film-talk')!.style.opacity=String(smooth((p-.12)/.12));
   el.dataset.density=strength.toFixed(5);el.dataset.pointerX=x.toFixed(1);el.dataset.pointerY=y.toFixed(1);
  }
  function tick(now:number){raf=0;if(!visible||disposed)return;const dt=Math.min(64,now-(last||now-16));last=now;
   const current=resolve(position,height).scene.id,desired=resolve(targetPosition,height).scene.id,tau=[current,desired].some(s=>s==='breath'||s==='okinohama')?filmTiming.breathMs:filmTiming.settleMs;
   position+=(targetPosition-position)*(1-Math.exp(-dt/tau));if(Math.abs(targetPosition-position)<.10)position=targetPosition;
   x+=(pointX-x)*(1-Math.exp(-dt/32));y+=(pointY-y)*(1-Math.exp(-dt/32));
   const touchTau=targetStrength>strength?config.thinningMs/3.5:config.releaseMs/6.3;strength+=(targetStrength-strength)*(1-Math.exp(-dt/touchTau));
   if(Math.abs(strength-targetStrength)<.001){strength=targetStrength;if(!strength)spread=.28;}if(targetStrength>0)spread+=(1-spread)*(1-Math.exp(-dt/(config.spreadMs/3.5)));
   render(now,dt);
   const r=resolve(position,height);const creditMoving=r.scene.id==='credits'&&Math.abs(creditY-height*(1-smooth(r.p/.28)))>.1;
   if(position!==targetPosition||strength!==targetStrength||Math.abs(pointX-x)>.1||Math.abs(pointY-y)>.1||kariStarted||creditMoving)start();else last=0;
  }
  function usedInput(){used=true;clearTimeout(idle);clearTimeout(idleEnd);}
  function release(){active=false;targetStrength=0;clearTimeout(hold);pointer=null;el.dataset.interaction='restoring';start();}
  function point(e:PointerEvent){const box=el.getBoundingClientRect();pointX=e.clientX-box.left;pointY=e.clientY-box.top;}
  function touchAllowed(){const r=resolve(position,height);return r.scene.touch&&(r.p<=.9||!r.next);}
  function reveal(){if(!touchAllowed())return;active=true;targetStrength=1;el.dataset.interaction='reveal';start();}
  function down(e:PointerEvent){if((e.target as Element).closest('a'))return;usedInput();if(!touchAllowed()||e.pointerType==='mouse')return;if(pointer!==null){release();return;}pointer=e.pointerId;downX=e.clientX;downY=e.clientY;point(e);el.dataset.interaction='hold';hold=window.setTimeout(()=>{if(pointer===e.pointerId)reveal();},config.holdMs);}
  function move(e:PointerEvent){if((e.target as Element).closest('a'))return;usedInput();if(!touchAllowed())return;if(e.pointerType==='mouse'){point(e);reveal();return;}if(pointer!==e.pointerId)return;const distance=Math.hypot(e.clientX-downX,e.clientY-downY);if((!active&&distance>config.gesturePx)||(active&&Math.abs(e.clientY-downY)>config.gesturePx*2)){release();return;}point(e);if(active)start();}
  function keydown(e:KeyboardEvent){if(e.target!==el||!touchAllowed())return;if(e.key==='Enter'||e.key===' '){e.preventDefault();usedInput();pointX=width*.52;pointY=height*.58;reveal();}}
  function keyup(e:KeyboardEvent){if(e.target===el&&(e.key==='Enter'||e.key===' '))release();}
  function scroll(){usedInput();release();targetPosition=Math.max(0,-wrap.getBoundingClientRect().top);start();}
  function resize(){const box=el.getBoundingClientRect();if(!box.width||!box.height||reduced.matches)return;width=box.width;height=box.height;dpr=Math.min(devicePixelRatio||1,width<600?config.mobileDpr:config.dpr);cv.width=Math.round(width*dpr);cv.height=Math.round(height*dpr);mapW=width>height?Math.round(120*width/height):120;mapH=width>height?120:Math.round(120*height/width);low.width=mask.width=mapW;low.height=mask.height=mapH;maps.clear();pointX=x=width*.52;pointY=y=height*.58;wrap.style.height=`${(totalVh/100+1)*height}px`;targetPosition=Math.max(0,-wrap.getBoundingClientRect().top);position=targetPosition;start();}
  function visibility(){visible=!document.hidden;if(!visible){release();cancelAnimationFrame(raf);raf=0;last=0;}else start();}
  function motionChange(){if(reduced.matches){wrap.dataset.motion='off';release();cancelAnimationFrame(raf);raf=0;}else {wrap.dataset.motion='on';resize();}}
  wrap.dataset.motion='on';wrap.dataset.build='film-12-stop1';resize();
  const unsubscribe=subscribePaperSurface(start);const ro=new ResizeObserver(resize);ro.observe(el);
  // Load the current and next scene only. Never preload all seven works.
  image('dusk');
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('pointerleave',release);el.addEventListener('blur',release);el.addEventListener('keydown',keydown);el.addEventListener('keyup',keyup);window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motionChange);
  idle=window.setTimeout(()=>{if(used||currentId!=='open')return;targetStrength=.13;start();idleEnd=window.setTimeout(()=>{targetStrength=0;start();},650);},config.idleMs);
  return()=>{disposed=true;cancelAnimationFrame(raf);clearTimeout(hold);clearTimeout(idle);clearTimeout(idleEnd);clearTimeout(cutWake);unsubscribe();ro.disconnect();for(const im of images.values())im.onload=null;el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',release);el.removeEventListener('pointercancel',release);el.removeEventListener('pointerleave',release);el.removeEventListener('blur',release);el.removeEventListener('keydown',keydown);el.removeEventListener('keyup',keyup);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChange);};
 },[]);
 return <><div className="film-track" ref={track} data-build="film-12-stop1"><section className="film-stage" ref={stage} tabIndex={0} aria-label="あわい。紙の向こう。" data-scene="open">
  <div className="film-back"><img alt="" aria-hidden="true"/></div><div className="film-back"><img alt="" aria-hidden="true"/></div><canvas className="film-surface" ref={surface} aria-hidden="true"/>
  <h1 className="film-logo"><span>あ</span><span>わ</span><span>い</span></h1>
  <div className="film-ink" data-ink="interlude" hidden><p className="film-interlude">{filmCopy.interlude}</p></div>
  <div className="film-ink" data-ink="human" hidden><div className="film-human"><p className="film-human-lines">{filmCopy.human.map((line,i)=><span key={line}>{line}{i<2&&<br/>}</span>)}</p><p className="film-human-name">{filmCopy.name}<span className="film-kari">{filmCopy.suffix}</span></p></div></div>
  <div className="film-label" hidden><p/><small/></div><div className="film-credits" hidden><Credits/></div>
  <div className="film-contact" hidden><p>{filmCopy.ending}</p><a className="film-talk" href={contact.line}>{filmCopy.talk}</a><div className="film-contact-links"><ContactLinks/></div></div>
 </section></div><main className="film-reading"><h1>あわい</h1><div className="reading-paper">一枚の紙。その向こうにある光。</div><img src={asset('dusk',false)} alt="夕暮れの町の灯り。構成用生成画像"/>
 {works.map(w=><div key={w.slug}>{w.slug==='aima'?<figure><div className="reading-placeholder"/><figcaption><a href={w.url}>{label(w)}</a><br/>布の素材は確認前の仮です。</figcaption></figure>:<figure className={w.slug==='arc'?'reading-arc':''}><picture>{w.mobileImage&&<source media="(max-width:600px)" srcSet={asset(w.slug,true)}/>}<img src={asset(w.slug,false)} alt={w.alt} loading="lazy"/></picture><figcaption><a href={w.url}>{label(w)}</a>{w.imageNote&&<p>{w.imageNote}</p>}</figcaption></figure>}{w.slug==='suketo'&&<div className="reading-paper">木目の見え、光の当たる暖かい雰囲気。</div>}{w.slug==='studiofree'&&<div className="reading-paper"/>}</div>)}
 <div className="reading-paper">徳島の実家で、<br/>ひとりで、<br/>つくっています。<p>社長（仮）</p></div><Credits/><div className="film-reading-contact"><p>ここに、あなたの店の話が入ります。</p><a href={contact.line}>話してみる</a><p><ContactLinks/></p></div></main></>;
}

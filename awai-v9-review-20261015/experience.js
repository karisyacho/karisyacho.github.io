/* Starts by itself. Scrolling only moves the document; touching is optional. */
(() => {
  'use strict';
  const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
  function validateTimeline(data) {
    if(!data||!Number.isFinite(data.duration)||data.duration<=0||!Array.isArray(data.chapters)||data.chapters.length!==7)throw Error('場面の情報を読み込めませんでした。');
    let previousEnd=0;
    const chapters=data.chapters.map((chapter,index)=>{
      const {start,end,hold}=chapter;
      if(![start,end,hold].every(Number.isFinite)||start<0||end<=start||hold<start||hold>=end||end>data.duration+.05||Math.abs(start-previousEnd)>.05)throw Error('場面の時間を確認できませんでした。');
      previousEnd=end;
      return {...chapter,poster:typeof chapter.poster==='string'&&/^[\w.-]+\.jpg$/.test(chapter.poster)?chapter.poster:['w0.jpg','w1-poster.jpg','w2-poster.jpg','w3-poster.jpg','w4-poster.jpg','w5b-poster.jpg','s6c-poster.jpg'][index]};
    });
    if(Math.abs(previousEnd-data.duration)>.05)throw Error('最後の場面を確認できませんでした。');
    return chapters;
  }
  function resolveTime(seconds,chapters) {
    const time=Math.max(0,Math.min(chapters.at(-1).end,Number.isFinite(seconds)?seconds:0));
    // Media timestamps are quantized to microseconds at a seek boundary.
    const index=Math.max(0,chapters.findIndex((c,i)=>time<c.end-.0001||i===chapters.length-1)),chapter=chapters[index];
    return {index,progress:clamp((time-chapter.start)/(chapter.end-chapter.start)),time};
  }
  const advanceElapsed=(elapsed,delta,running)=>elapsed+(running&&Number.isFinite(delta)?Math.max(0,Math.min(.1,delta)):0);
  globalThis.AWAIExperienceLogic={validateTimeline,resolveTime,advanceElapsed};
  if(typeof document==='undefined')return;

  const $=id=>document.getElementById(id),root=document.documentElement;
  const room=document.querySelector('.experience'),stage=$('stage'),host=$('live-entry'),video=$('film'),still=$('still');
  const overlay=$('film-overlay'),contact=$('frame-contact'),controls=$('controls'),playback=$('playback-toggle'),flick=$('flick-action');
  const status=$('status'),retry=$('retry'),toggle=$('chapter-toggle'),nav=$('chapter-nav'),hint=document.querySelector('.gesture-hint');
  const copies=[...document.querySelectorAll('[data-copy]')],buttons=[...nav.querySelectorAll('[data-chapter]')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
  const staticPreferred=()=>motion.matches||Boolean(connection?.saveData);
  let chapters=[],index=0,elapsed=0,mode='loading',serial=0,frame=0,lastNow=null,running=false,visible=true,manualPaused=false,waiting=false;
  let controller,entryLoading,mediaLoading,mediaPlay,failedEntry=false,failedMedia=false,handoff,lastFilmFrame;
  let autoFlick=false,automaticRelease=false,finished=false;
  const prepared=new Set(),preparing=new Map();
  const announce=message=>{status.textContent=message;status.classList.toggle('sr-only',retry.hidden);};
  const canRun=()=>visible&&!document.hidden&&!manualPaused&&!finished;
  const setMode=value=>{mode=value;stage.dataset.mode=value;};
  function mediaState(){video.dataset.mediaTime=String(video.currentTime);video.dataset.mediaPaused=String(video.paused);video.dataset.mediaReady=String(video.readyState);}
  for(const event of ['timeupdate','pause','playing','seeked'])video.addEventListener(event,mediaState);
  function fitOverlay(){const box=stage.getBoundingClientRect(),width=Math.min(box.width,box.height*1.6)*(innerWidth<=700&&index===6?1.65:1);overlay.style.width=width+'px';overlay.style.height=width/1.6+'px';}
  function filmFrame(){
    const r=room.getBoundingClientRect(),h=host.getBoundingClientRect(),narrow=innerWidth<=700,wide=matchMedia('(min-width:1000px) and (orientation:landscape)').matches;
    if(!h.width)return null;
    const top=narrow?(innerHeight<=700?264:290):0,boxH=r.height-(narrow?top+150:wide?112:0),cw=(narrow?Math.max:Math.min)(r.width,boxH*1.6),ch=cw/1.6,filmX=wide||narrow?r.left+cw/2:r.left+r.width/2;
    return {height:ch,centerX:narrow?filmX-h.left:h.width/2,centerY:r.top+top+(boxH-ch)/2+ch/2-h.top,dx:narrow?0:h.left+h.width/2-filmX};
  }
  function dropHandoff(){handoff?.remove();handoff=null;stage.dataset.handoff='false';}
  function captureHandoff(){
    dropHandoff();const source=controller?.snapshot?.();if(!source)return;
    const canvas=document.createElement('canvas'),box=host.getBoundingClientRect();canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);canvas.className='handoff';
    Object.assign(canvas.style,{position:'fixed',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
    handoff=canvas;stage.append(canvas);stage.dataset.handoff='true';
  }
  function setProgress(progress){
    const p=clamp(progress),ending=index===6&&(mode==='poster'||finished||p>=.65);
    stage.dataset.progress=p.toFixed(5);stage.dataset.ending=String(ending);stage.dataset.revealed=String(index!==6||ending);
    contact.hidden=!(index===6&&(mode==='poster'||finished||p>=.96));
    const dx=index===4?(lastFilmFrame?.dx||0)*(1-clamp(p/.18))**3:0;
    for(const element of [video,still])element.style.transform=dx?`translateX(${dx}px)`:'';
  }
  function setCopy(next){
    index=next;stage.dataset.chapter=String(index);stage.dataset.entry=String(index===0);
    copies.forEach((copy,i)=>copy.hidden=i!==index);
    buttons.forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    still.src=chapters[index].poster;flick.hidden=true;hint.hidden=true;setProgress(0);fitOverlay();
    announce(`${String(index).padStart(2,'0')} / ${chapters[index].title}`);
  }
  function showPoster(){video.pause();video.hidden=true;still.hidden=false;stage.dataset.live='false';host.hidden=true;controller?.pause();}
  function updateControls(){playback.textContent=finished?'もう一度見る':manualPaused?'再開':'一時停止';playback.setAttribute('aria-label',finished?'体験をもう一度見る':manualPaused?'体験を再開':'体験を一時停止');}
  function requestTick(){if(!frame&&canRun()&&mode!=='loading')frame=requestAnimationFrame(tick);}
  function resumeFilm(){
    if(mode!=='film'||!canRun()||!video.paused||mediaPlay)return;
    const token=serial;
    mediaPlay=Promise.resolve().then(()=>{if(token===serial&&mode==='film'&&canRun())return video.play();}).catch(()=>{
      if(token!==serial||!canRun()||mode!=='film')return;
      const chapter=chapters[index],progress=clamp((video.currentTime-chapter.start)/(chapter.end-chapter.start));
      elapsed=progress*(chapter.end-chapter.start);failedMedia=true;showPoster();dropHandoff();setMode('poster');setProgress(progress);
      announce('この端末では映像を自動再生できないため、静止画でそのまま続きます。');syncPlayback();
    }).finally(()=>{mediaPlay=null;if(mode==='film'&&canRun()&&video.paused)resumeFilm();});
  }
  function syncPlayback(){
    const active=canRun()&&mode!=='loading';
    if(running!==active){running=active;lastNow=null;}
    if(!active){controller?.pause();video.pause();if(frame)cancelAnimationFrame(frame);frame=0;}
    else {if(mode==='native')controller?.resume();if(mode==='film')resumeFilm();requestTick();}
    updateControls();
  }
  function refreshVisibility(){
    const rect=room.getBoundingClientRect(),next=rect.bottom>80&&rect.top<innerHeight;
    root.dataset.information=String(rect.bottom<=80);
    if(visible!==next){visible=next;if(visible&&waiting){waiting=false;enter(index);}else syncPlayback();}
  }
  function nativeEnd(chapter){
    const token=serial;
    queueMicrotask(()=>{if(token===serial&&mode==='native'&&chapter===index)enter(Math.min(6,index+1));});
  }
  function entryFault(){
    failedEntry=true;controller?.dispose();controller=null;prepared.clear();
    if(mode==='native'){const token=serial;queueMicrotask(()=>{if(token===serial)enter(index);});}
  }
  async function loadEntry(){
    if(controller)return controller;if(entryLoading)return entryLoading;if(failedEntry||staticPreferred())return null;
    host.hidden=false;
    entryLoading=import(new URL(host.dataset.module,document.baseURI).href).then(({createEntry})=>createEntry({host,filmFrame,onChapterEnd:nativeEnd,onError:entryFault,
      onPerformance:()=>{failedEntry=true;if(mode==='native')enter(index);},
      onRelease:()=>{autoFlick=true;if(!automaticRelease){host.dataset.intervened='true';announce('ページを弾きました。このまま続きます。');}}}))
      .then(value=>{controller=value;return value;}).catch(()=>{failedEntry=true;return null;}).finally(()=>{entryLoading=null;});
    return entryLoading;
  }
  async function prepare(chapter,c){
    if(!chapter||prepared.has(chapter))return;
    if(!preparing.has(chapter))preparing.set(chapter,c[['','preparePage1','preparePage2','preparePage3'][chapter]]().then(()=>prepared.add(chapter)).finally(()=>preparing.delete(chapter)));
    await preparing.get(chapter);
  }
  function loadMedia(){
    if(failedMedia)return Promise.reject(Error('media unavailable'));if(video.readyState>=1)return Promise.resolve();if(mediaLoading)return mediaLoading;
    mediaLoading=new Promise((resolve,reject)=>{
      const done=error=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',loaded);video.removeEventListener('error',bad);error?reject(error):resolve();};
      const loaded=()=>done(),bad=()=>done(Error('media unavailable')),timer=setTimeout(bad,15000);
      video.addEventListener('loadedmetadata',loaded,{once:true});video.addEventListener('error',bad,{once:true});
      video.muted=true;video.defaultMuted=true;video.playsInline=true;video.src=video.dataset.source;video.preload='auto';video.load();
    }).catch(error=>{failedMedia=true;throw error;}).finally(()=>{mediaLoading=null;});
    return mediaLoading;
  }
  function seekMedia(time){
    return new Promise((resolve,reject)=>{
      const cleanup=()=>{clearTimeout(timer);for(const event of ['seeked','loadeddata','canplay'])video.removeEventListener(event,check);video.removeEventListener('error',bad);};
      const check=()=>{if(video.readyState>=2&&Math.abs(video.currentTime-time)<.15){cleanup();resolve();}},bad=()=>{cleanup();reject(Error('media seek unavailable'));},timer=setTimeout(bad,15000);
      for(const event of ['seeked','loadeddata','canplay'])video.addEventListener(event,check);video.addEventListener('error',bad,{once:true});
      try{if(Math.abs(video.currentTime-time)>.03)video.currentTime=time;check();}catch{bad();}
    });
  }
  async function enter(next){
    const from=index,capture=from===3&&next===4&&mode==='native';
    if(capture){lastFilmFrame=filmFrame();captureHandoff();}else dropHandoff();
    const token=++serial;finished=false;elapsed=0;autoFlick=false;lastNow=null;running=false;host.dataset.intervened='false';
    setMode('loading');setCopy(next);showPoster();updateControls();
    if(!visible||document.hidden){waiting=true;return;}
    if(staticPreferred()){dropHandoff();setMode('poster');setProgress(0);syncPlayback();return;}
    if(index<=3&&!failedEntry){
      try{
        const c=await loadEntry();if(token!==serial)return;
        if(c){
          await prepare(index,c);if(token!==serial)return;
          host.hidden=false;stage.dataset.live='true';still.hidden=true;video.hidden=true;
          if(!c.showChapter(index,{animate:index!==3,interactive:true,fromPage:from===1&&index===2}))throw Error('native scene unavailable');
          setMode('native');flick.hidden=index!==3;hint.hidden=index!==3;syncPlayback();
          if(index===0){Promise.allSettled([prepare(1,c),prepare(2,c),prepare(3,c),loadMedia()]);}
          return;
        }
      }catch{failedEntry=true;}
      if(token!==serial)return;
    }
    try{
      await loadMedia();if(token!==serial)return;await seekMedia(chapters[index].start);if(token!==serial)return;
      video.hidden=false;still.hidden=true;host.hidden=true;stage.dataset.live='false';dropHandoff();setMode('film');setProgress(0);syncPlayback();
    }catch{
      if(token!==serial)return;failedMedia=true;dropHandoff();showPoster();setMode('poster');retry.hidden=false;announce('映像を読み込めませんでした。静止画と文章で、そのまま続きます。');setProgress(0);syncPlayback();
    }
  }
  function finish(){
    finished=true;setMode('finished');video.pause();controller?.pause();dropHandoff();flick.hidden=true;hint.hidden=true;setProgress(1);syncPlayback();announce('体験の最後です。ご相談は画面の中、またはこの下から。');
  }
  function tick(now){
    frame=0;if(!canRun()||mode==='loading'){lastNow=null;return;}
    const delta=lastNow===null?0:(now-lastNow)/1000;lastNow=now;
    if(mode==='film'){
      const next=resolveTime(video.currentTime,chapters);if(next.index!==index)setCopy(next.index);setProgress(next.progress);
      if(video.currentTime>=chapters[6].hold){finish();return;}
    }else{
      elapsed=advanceElapsed(elapsed,delta,true);const duration=chapters[index].end-chapters[index].start;setProgress(elapsed/duration);
      if(mode==='poster'&&elapsed>=duration){if(index===6)finish();else enter(index+1);return;}
      if(mode==='native'&&index===0&&elapsed>=duration){enter(1);return;}
      if(mode==='native'&&index===3&&!autoFlick&&elapsed>=1.8&&host.dataset.flickPressed!=='true'){
        autoFlick=true;automaticRelease=true;controller.flick(1);automaticRelease=false;
      }
    }
    requestTick();
  }
  video.addEventListener('ended',()=>{if(mode==='film'){if(index!==6)setCopy(6);finish();}});
  video.addEventListener('error',()=>{if(mode==='film'){failedMedia=true;enter(index);}});
  function closeNav(focus=false){nav.hidden=true;toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>{nav.hidden=!nav.hidden;toggle.setAttribute('aria-expanded',String(!nav.hidden));if(!nav.hidden)buttons[index].focus();});
  nav.addEventListener('keydown',event=>{if(event.key==='Escape'){closeNav(true);event.preventDefault();}});
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{closeNav(true);enter(i);}));
  playback.addEventListener('click',()=>{if(finished){manualPaused=false;enter(0);}else {manualPaused=!manualPaused;syncPlayback();}});
  flick.addEventListener('click',()=>{if(mode==='native'&&index===3){manualPaused=false;controller.flick(1);syncPlayback();}});
  // These events only control visibility/layout, never select a scene or seek.
  addEventListener('scroll',refreshVisibility,{passive:true});addEventListener('resize',()=>{fitOverlay();refreshVisibility();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&waiting){waiting=false;enter(index);}else syncPlayback();});
  motion.addEventListener('change',()=>{if(chapters.length)enter(index);});connection?.addEventListener?.('change',()=>{if(chapters.length)enter(index);});
  addEventListener('pagehide',()=>{controller?.pause();video.pause();lastNow=null;});
  addEventListener('pageshow',()=>{refreshVisibility();syncPlayback();});
  async function start(){
    try{
      retry.hidden=true;const response=await fetch('timeline.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();chapters=validateTimeline(await response.json());
      root.classList.add('enhanced','autonomous');root.dataset.loading='false';controls.hidden=false;toggle.hidden=false;playback.hidden=false;refreshVisibility();enter(0);
    }catch{
      root.classList.remove('enhanced','autonomous');root.dataset.loading='false';copies.forEach(copy=>copy.hidden=false);controls.hidden=false;toggle.hidden=true;playback.hidden=true;retry.hidden=false;
      announce('場面を読み込めませんでした。すべての文章をこの下で読めます。');
    }
  }
  retry.addEventListener('click',()=>{if(!chapters.length)start();else{failedMedia=false;failedEntry=false;retry.hidden=true;enter(index);}});
  start();
})();

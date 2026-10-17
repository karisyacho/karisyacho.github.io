/* Native document scrolling is the timeline. Touching the page is optional. */
(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  function validateTimeline(data) {
    if (!data || !Number.isFinite(data.duration) || data.duration <= 0 || !Array.isArray(data.chapters) || data.chapters.length !== 7) throw Error('場面の情報を読み込めませんでした。');
    let previousEnd = 0;
    const chapters = data.chapters.map((chapter,index) => {
      const {start,end,hold} = chapter;
      if (![start,end,hold].every(Number.isFinite) || start < 0 || end <= start || hold < start || hold >= end || end > data.duration + .05 || Math.abs(start-previousEnd) > .05) throw Error('場面の時間を確認できませんでした。');
      previousEnd = end;
      return {...chapter,poster:typeof chapter.poster === 'string' && /^[\w.-]+\.jpg$/.test(chapter.poster) ? chapter.poster : ['w0.jpg','w1-poster.jpg','w2-poster.jpg','w3-poster.jpg','w4-poster.jpg','w5b-poster.jpg','s6c-poster.jpg'][index]};
    });
    if (Math.abs(previousEnd-data.duration) > .05) throw Error('最後の場面を確認できませんでした。');
    return chapters;
  }
  function resolveJourney(progress,chapters) {
    const time = clamp(progress)*chapters.at(-1).end;
    const index = Math.max(0,chapters.findIndex((c,i) => time < c.end-1e-8 || i===chapters.length-1));
    const chapter = chapters[index], local = clamp((time-chapter.start)/(chapter.end-chapter.start));
    return {index,progress:local,time:chapter.start+(chapter.hold-chapter.start)*local};
  }
  const scrollDistance = height => Math.max(560,Number.isFinite(height)?height:560)*10;
  globalThis.AWAIExperienceLogic = {validateTimeline,resolveJourney,scrollDistance};
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id), root = document.documentElement;
  const room = document.querySelector('.experience'), stage = $('stage'), host = $('live-entry');
  const video = $('film'), still = $('still'), overlay = $('film-overlay'), contact = $('frame-contact');
  const controls = $('controls'), flick = $('flick-action'), status = $('status'), retry = $('retry');
  const toggle = $('chapter-toggle'), nav = $('chapter-nav'), cue = $('scroll-cue');
  const copies = [...document.querySelectorAll('[data-copy]')], buttons = [...nav.querySelectorAll('[data-chapter]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), connection = navigator.connection;
  const staticPreferred = () => motion.matches || Boolean(connection?.saveData);
  let chapters = [], journey, travel = 1, state, frame = 0, serial = 0, visible = true;
  let controller, entryLoading, mediaLoading, failedEntry = false, failedMedia = false;
  let nativeIndex = -1, pendingTime = null, appliedTime = null, entered = false;
  const prepared = new Set(), preparing = new Map();
  const announce = message => {status.textContent=message;status.classList.toggle('sr-only',retry.hidden);};
  function mediaState() {
    video.dataset.mediaTime=String(video.currentTime);video.dataset.mediaPaused=String(video.paused);video.dataset.mediaReady=String(video.readyState);
  }
  for (const event of ['timeupdate','pause','playing','seeked']) video.addEventListener(event,mediaState);
  function fitOverlay() {
    const box=stage.getBoundingClientRect(), width=Math.min(box.width,box.height*1.6)*(innerWidth<=700&&state?.index===6?1.65:1);
    overlay.style.width=width+'px';overlay.style.height=width/1.6+'px';
  }
  function filmFrame() {
    const r=room.getBoundingClientRect(),h=host.getBoundingClientRect(),narrow=innerWidth<=700,wide=matchMedia('(min-width:1000px) and (orientation:landscape)').matches;
    if (!h.width) return null;
    const top=narrow?(innerHeight<=700?264:290):0,boxH=r.height-(narrow?top+150:wide?112:0),cw=(narrow?Math.max:Math.min)(r.width,boxH*1.6),ch=cw/1.6;
    return {height:ch,centerX:narrow?r.left+cw/2-h.left:h.width/2,centerY:r.top+top+(boxH-ch)/2+ch/2-h.top,dx:0};
  }
  function showPoster() {video.hidden=true;still.hidden=false;stage.dataset.live='false';host.hidden=true;controller?.pause();}
  async function loadEntry() {
    if (controller) return controller;
    if (entryLoading) return entryLoading;
    if (failedEntry || staticPreferred()) return null;
    host.hidden=false;
    entryLoading=import(new URL(host.dataset.module,document.baseURI).href)
      .then(({createEntry})=>createEntry({host,filmFrame,onRelease:()=>{host.dataset.intervened='true';announce('ページを弾きました。スクロールすると続きへ進みます。');},onError:()=>{failedEntry=true;controller?.dispose();controller=null;schedule();}}))
      .then(value=>{controller=value;return value;})
      .catch(()=>{failedEntry=true;return null;}).finally(()=>{entryLoading=null;});
    return entryLoading;
  }
  async function prepare(index,c) {
    if (!index || prepared.has(index)) return;
    if (!preparing.has(index)) preparing.set(index,c[['','preparePage1','preparePage2','preparePage3'][index]]().then(()=>prepared.add(index)).finally(()=>preparing.delete(index)));
    await preparing.get(index);
  }
  function loadMedia() {
    if (video.readyState>=1) return Promise.resolve();
    if (mediaLoading) return mediaLoading;
    if (failedMedia) return Promise.reject(Error('media unavailable'));
    mediaLoading=new Promise((resolve,reject)=>{
      const done=error=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',loaded);video.removeEventListener('error',bad);error?reject(error):resolve();};
      const loaded=()=>done(),bad=()=>done(Error('media unavailable')),timer=setTimeout(bad,15000);
      video.addEventListener('loadedmetadata',loaded,{once:true});video.addEventListener('error',bad,{once:true});
      video.src=video.dataset.source;video.preload='auto';video.load();
    }).catch(error=>{failedMedia=true;retry.hidden=false;announce('映像を読み込めませんでした。静止画のまま、スクロールで最後まで進めます。');throw error;}).finally(()=>{mediaLoading=null;});
    return mediaLoading;
  }
  function flushSeek() {
    if (pendingTime===null || video.readyState<1 || video.seeking) return;
    const desired=pendingTime;
    if (Math.abs(video.currentTime-desired)<.035) {appliedTime=desired;presentFilm();return;}
    try {video.currentTime=desired;} catch {failedMedia=true;}
  }
  function presentFilm() {
    if (!state || state.index<4&&!failedEntry || staticPreferred() || !visible || appliedTime===null || Math.abs(appliedTime-state.time)>.08) return;
    video.hidden=false;still.hidden=true;stage.dataset.live='false';host.hidden=true;
  }
  video.addEventListener('seeked',()=>{appliedTime=video.currentTime;if (pendingTime!==null&&Math.abs(appliedTime-pendingTime)>.035) flushSeek();else presentFilm();});
  async function paint(token) {
    if (!state || !visible || document.hidden) {controller?.pause();return;}
    const desired={...state};
    if (staticPreferred()) {showPoster();return;}
    if (desired.index<=3&&!failedEntry) {
      try {
        const c=await loadEntry();
        if (!c) {if(token===serial)schedule();return;}
        await prepare(desired.index,c);
        if (token!==serial || !visible || document.hidden) return;
        host.hidden=false;
        if (desired.index===0) {
          if(nativeIndex!==0){c.showChapter(0,{animate:!entered});entered=true;}
          c.resume();
        } else c.seekChapter(desired.index,desired.progress,{interactive:true});
        nativeIndex=desired.index;stage.dataset.live='true';video.hidden=true;still.hidden=true;
        flick.hidden=desired.index!==3;document.querySelector('.gesture-hint').hidden=desired.index!==3;
        return;
      } catch {failedEntry=true;if(token===serial)showPoster();}
    }
    controller?.pause();nativeIndex=-1;host.hidden=true;stage.dataset.live='false';
    try {await loadMedia();if(token!==serial)return;pendingTime=state.time;flushSeek();} catch {if(token===serial)showPoster();}
  }
  function update() {
    frame=0;if(!chapters.length||!journey)return;
    const offset=journey.getBoundingClientRect().top+scrollY;
    const progress=clamp((scrollY-offset)/travel), next=resolveJourney(progress,chapters), previous=state;
    const rect=room.getBoundingClientRect();visible=rect.bottom>0&&rect.top<innerHeight;
    root.dataset.information=String(rect.bottom<=80);
    state=next;stage.dataset.chapter=String(next.index);stage.dataset.progress=next.progress.toFixed(5);stage.dataset.entry=String(next.index===0);
    stage.dataset.ending=String(next.index===6&&next.progress>=.65);
    stage.dataset.revealed=String(next.index!==6||next.progress>=.65);
    journey.dataset.progress=progress.toFixed(6);host.dataset.intervened='false';
    contact.hidden=next.index!==6||next.progress<.96;
    copies.forEach((copy,i)=>{copy.hidden=i!==next.index;});
    buttons.forEach((button,i)=>{if(i===next.index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    flick.hidden=true;document.querySelector('.gesture-hint').hidden=true;cue.hidden=next.index===6;
    if (!previous || next.index!==previous.index) {still.src=chapters[next.index].poster;showPoster();announce(`${String(next.index).padStart(2,'0')} / ${buttons[next.index].title.slice(3)}。スクロールで続きます。`);}
    fitOverlay();paint(++serial);
  }
  function schedule() {if(!frame)frame=requestAnimationFrame(update);}
  function measure() {travel=scrollDistance(room.getBoundingClientRect().height);journey.style.setProperty('--scroll-distance',travel+'px');schedule();}
  function closeNav(focus=false) {nav.hidden=true;toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>{nav.hidden=!nav.hidden;toggle.setAttribute('aria-expanded',String(!nav.hidden));if(!nav.hidden)buttons[state?.index||0].focus();});
  nav.addEventListener('keydown',event=>{if(event.key==='Escape'){closeNav(true);event.preventDefault();}});
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{closeNav(true);const y=journey.getBoundingClientRect().top+scrollY+chapters[i].start/chapters.at(-1).end*travel+1;window.scrollTo({top:y,behavior:'instant'});}));
  flick.addEventListener('click',()=>controller?.flick(1));
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{if(journey)measure();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)controller?.pause();else schedule();});
  motion.addEventListener('change',schedule);connection?.addEventListener?.('change',schedule);
  async function start() {
    try {
      retry.hidden=true;const response=await fetch('timeline.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();
      chapters=validateTimeline(await response.json());
      if(!journey){journey=document.createElement('div');journey.className='journey';room.before(journey);journey.append(room);}
      root.classList.add('enhanced','scroll-driven');root.dataset.loading='false';controls.hidden=false;measure();
    } catch {
      root.classList.remove('enhanced','scroll-driven');root.dataset.loading='false';copies.forEach(copy=>copy.hidden=false);controls.hidden=false;toggle.hidden=true;retry.hidden=false;
      announce('場面を読み込めませんでした。すべての文章をこの下で読めます。');
    }
  }
  retry.addEventListener('click',()=>{if(!chapters.length){toggle.hidden=false;start();}else{failedMedia=false;failedEntry=false;retry.hidden=true;schedule();}});
  start();
})();

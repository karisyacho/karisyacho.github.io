/* A single film, with deliberate stops. No playback starts without a fresh input. */
(() => {
  'use strict';
  function validateTimeline(data) {
    if (!data || !Number.isFinite(data.duration) || data.duration <= 0 || !Array.isArray(data.chapters) || data.chapters.length !== 7) throw new Error('場面の情報を読み込めませんでした。');
    let previousEnd = 0;
    const chapters = data.chapters.map((chapter, index) => {
      const { start, end, hold } = chapter;
      if (![start, end, hold].every(Number.isFinite) || start < 0 || end <= start || hold < start || hold >= end || end > data.duration + 0.05 || start < previousEnd - 0.05 || (index === 0 && start !== 0)) throw new Error('場面の時間を確認できませんでした。');
      previousEnd = end;
      return { ...chapter, poster: typeof chapter.poster === 'string' && /^[\w.-]+\.jpg$/.test(chapter.poster) ? chapter.poster : ['w0.jpg', 'w1-poster.jpg', 'w2-poster.jpg', 'w3-poster.jpg', 'w4-poster.jpg', 'w5b-poster.jpg', 's6c-poster.jpg'][index] };
    });
    return chapters;
  }
  function isUpwardFlick(start, end) { return start.y - end.y >= 40 && start.y - end.y > Math.abs(start.x - end.x); }
  function hasReachedHold(time, chapter) { return time >= chapter.hold; }
  const gestureProgress = (delta) => Math.max(0, Math.min(1, delta / 100));
  const gestureTime = (chapter, delta) => Math.min(chapter.hold - .01, chapter.start + (12 + (32 - 12) * gestureProgress(delta)) / 24);
  const releaseRate = (distance, milliseconds) => Math.max(.85, Math.min(1.2, .85 + Math.max(0, distance) / Math.max(1, milliseconds) * .35));
  globalThis.AWAIExperienceLogic = { validateTimeline, isUpwardFlick, hasReachedHold, gestureProgress, gestureTime, releaseRate };
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const video = $('film'), still = $('still'), stage = $('stage');
  const frameContact = $('frame-contact'), filmOverlay = $('film-overlay');
  // Read-only browser inspection transports DOM attributes reliably; media
  // element properties may be represented by defaults in its isolated scope.
  const recordMediaState = () => {
    video.dataset.mediaTime = String(video.currentTime);
    video.dataset.mediaPaused = String(video.paused);
    video.dataset.mediaReady = String(video.readyState);
  };
  for (const event of ['timeupdate','seeked','pause','playing']) video.addEventListener(event,recordMediaState);
  const advance = $('advance'), previous = $('previous'), play = $('play'), status = $('status'), retry = $('retry');
  const chapterButtons = [...document.querySelectorAll('[data-chapter]')];
  const copies = [...document.querySelectorAll('[data-copy]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const staticPreferred = () => motion.matches || Boolean(connection?.saveData);
  const entryHost = $('live-entry');
  let entryController = null, entryLoading = null, entryPaused = false, entryReady = false, entryAnimating = !motion.matches;
  let pagePlaying=false,pagePaused=false,pendingKind=null;
  const nativeLimited={0:false,1:false,2:false,3:false};
  let nativeAttempt=0;
  let chapters = [], current = 0, started = false, reachedHold = false, pending = false, frame = 0, request = 0, mediaFailed = false;
  let visible = true, drag = null, scrubFrame = 0, queuedSeek = null, mediaLoading = null, cancelSeek=null;
  const announce = (message) => { status.textContent = message; status.classList.toggle('sr-only', retry.hidden); };
  // 04 の映像が舞台に置かれる枠（experience-world.css の04の指定と同じ計算）。03 の立体は止まったあと、この枠の絵へ寄る。
  // 横の位置だけは立体の真ん中に合わせ、受け渡しのあと映像を dx だけ滑らせて04の置き場所へ戻す。
  // スマホの04は上290px（短い画面264px）・下150px。PCは下112pxを空けて左寄せ。
  const wideStage=matchMedia('(min-width:1000px) and (orientation:landscape)'),narrowStage=matchMedia('(max-width:700px)');
  function filmFrame(){
    const room=stage.parentElement?.getBoundingClientRect?.(),host=entryHost?.getBoundingClientRect?.(),narrow=narrowStage.matches;
    if(!room?.width||!host?.width)return null;
    const phoneTop=matchMedia('(max-height:700px)').matches?264:290;
    const box={left:room.left,top:room.top+(narrow?phoneTop:0),width:room.width,height:room.height-(narrow?phoneTop+150:0)};
    const wide=wideStage.matches,boxH=wide?box.height-112:box.height,aspect=video.videoWidth&&video.videoHeight?video.videoWidth/video.videoHeight:1.6;
    const cw=(narrow?Math.max:Math.min)(box.width,boxH*aspect),ch=cw/aspect,x=wide||narrow?0:(box.width-cw)/2,y=(boxH-ch)/2;
    return {height:ch,centerX:narrow?box.left+cw/2-host.left:host.width/2,centerY:box.top+y+ch/2-host.top,dx:narrow?0:host.left+host.width/2-(box.left+x+cw/2)};
  }
  let handoff=null;
  function captureLive(){ // 03 の最後の絵を写し取る（04 の映像が同じ絵で出るまで重ねておく）
    const source=entryController?.snapshot?.(),frame=filmFrame();
    if(!source||!frame)return null;
    const layer=document.createElement('canvas');
    layer.className='handoff';layer.width=source.width;layer.height=source.height;layer.getContext('2d').drawImage(source,0,0);
    return {layer,dx:frame.dx,host:entryHost.getBoundingClientRect()};
  }
  function attachHandoff(shot){
    dropHandoff();handoff=shot;
    const box=stage.getBoundingClientRect(),{host}=shot; // 04 の枠へ移ったあとの舞台から見て、立体があった場所に置く
    Object.assign(shot.layer.style,{left:host.left-box.left+'px',top:host.top-box.top+'px',width:host.width+'px',height:host.height+'px'});
    stage.append(shot.layer);stage.dataset.handoff='true';
    video.style.transition='none';video.style.transform=`translateX(${shot.dx}px)`;
  }
  function dropHandoff(){
    if(!handoff)return;const shot=handoff;handoff=null;shot.animations?.forEach(animation=>animation.cancel());shot.layer.remove();stage.dataset.handoff='false';video.style.transform='';video.style.transition='';
  }
  function finishHandoff(){
    if(!handoff||handoff.animations)return;const shot=handoff,{layer,dx}=shot,quick=motion.matches;
    const done=()=>{layer.remove();if(handoff===shot){handoff=null;stage.dataset.handoff='false';video.style.transform='';video.style.transition='';}};
    shot.animations=[layer.animate([{opacity:1},{opacity:0}],{duration:quick?0:350,easing:'ease-out',fill:'forwards'}),
      video.animate([{transform:`translateX(${dx}px)`},{transform:'translateX(0)'}],{duration:quick?0:900,easing:'cubic-bezier(.4,0,.2,1)'})];
    Promise.allSettled(shot.animations.map(animation=>animation.finished)).then(done);
  }
  const isNativeFlick=()=>current===3&&entryController?.chapter===3&&video.hidden&&!connection?.saveData;
  function syncEntry() {
    if (!entryHost) return;
    const nativeChapter=entryController?.chapter ?? 0;
    const candidate = Boolean(video.hidden && ((current===0&&(entryController||entryLoading)&&nativeChapter===0)||([1,2,3].includes(current)&&entryController&&nativeChapter===current&&!connection?.saveData)));
    entryHost.hidden = !candidate; stage.dataset.live = String(entryReady && candidate);
    if (candidate && entryController && visible && !document.hidden && !([1,2,3].includes(current)?pagePaused:entryPaused)) entryController.resume();
    else entryController?.pause();
  }
  function loadEntry() {
    if (!entryHost?.dataset.module || entryLoading || entryController || connection?.saveData) return;
    // Make the canvas measurable before its first render. Poster remains in place.
    entryHost.hidden = false;
    const attemptAtLoad=nativeAttempt;
    let failed = false;
    entryLoading = import(new URL(entryHost.dataset.module, document.baseURI).href)
      .then(({ createEntry }) => createEntry({host:entryHost, reducedMotion:motion.matches,
        onReady:() => { entryReady = true; syncEntry(); updateControls();
          if (current === 0 && !pending) announce(entryAnimating ? '指やカーソルに反応する入口です。' : '入口を静止して表示しています。「入口を動かす」で動きを選べます。'); },
        onPerformance:() => { nativeLimited[entryController?.chapter??0]=true;if(current===0)entryAnimating=false;else if([1,2,3].includes(current)){pagePlaying=false;pagePaused=false;reachedHold=true;}updateControls();announce('この端末では動きがかくつくため、いったん止めました。「映像で動きを見る」で続きを映像で見られます。'); },
        onChapterEnd:index=>{if([1,2,3].includes(index)&&current===index){pagePlaying=false;pagePaused=false;reachedHold=true;updateControls();announce(index===3?'ページが止まりました。次の場面へ進めます。':index===2?'お店のページへ着きました。次の場面へ進めます。':'文字の足元まで降りました。次の場面へ進めます。');}},
        filmFrame,
        onRelease:index=>{if(index===3&&current===3&&video.hidden){pagePlaying=true;pagePaused=false;reachedHold=false;updateControls();announce('ページを弾きました。カメラが少し遅れて追いかけます。');}},
        onError:() => { failed = true; entryController?.dispose(); entryController = null; entryReady = false; entryHost.hidden = true; stage.dataset.live = 'false'; updateControls(); }
      }))
      .then(controller => { if (failed) { controller.dispose(); return; } entryController = controller;
        controller.setMotion(entryAnimating && !staticPreferred());
        if (entryReady) syncEntry(); updateControls();
        if([1,2,3].includes(current)&&visible&&!document.hidden&&nativeAttempt===attemptAtLoad&&video.hidden&&video.paused&&!pending&&!connection?.saveData)openNativePage(current,{animate:false}); })
      .catch(() => { entryHost.hidden = true; stage.dataset.live = 'false'; })
      .finally(() => { entryLoading = null; });
  }
  const openNativePage1=options=>openNativePage(1,options);
  async function openNativePage(index,{animate=false,fromEntry=false,fromPage=false}={}){
    const prepare=index===3?'preparePage3':index===2?'preparePage2':'preparePage1';
    if(!entryController?.[prepare]||connection?.saveData)return false;
    const controller=entryController,token=++request;
    nativeAttempt++;
    pending=true;pendingKind='native';updateControls();announce('立体のページを読み込んでいます。');
    try{
      await controller[prepare]();
      if(token!==request||controller!==entryController)return false;
      if(fromEntry){started=true;select(index,{native:false});}
      if(connection?.saveData){pending=false;pendingKind=null;showPoster();updateControls();return false;}
      const canAnimate=animate&&!staticPreferred();
      pending=false;pendingKind=null;pagePlaying=canAnimate;pagePaused=false;reachedHold=index===3?false:!canAnimate;
      controller.showChapter(index,index===3?{animate:canAnimate,interactive:!staticPreferred()}:index===2?{animate:canAnimate,fromPage}:{animate:canAnimate});syncEntry();updateControls();
      announce(index===3?'上へ引いて離すと、ページが弾かれます。ボタンでも進めます。':canAnimate?index===2?'同じページから町へ広がり、駅からお店への道をたどります。':'同じ紙が広がり、文字の足元へ降ります。':'文字の足元を立体で表示しています。再生ボタンで動きを選べます。');return true;
    }catch{
      if(token!==request)return false;
      pending=false;pendingKind=null;
      if(fromEntry){started=true;select(index,{native:false});}
      updateControls();announce('立体を読み込めませんでした。静止画と映像でご覧いただけます。');return false;
    }
  }
  function updateControls() {
    const ready = chapters.length === 7;
    previous.disabled = !ready || current === 0;
    advance.disabled = !ready || pending || (isNativeFlick()&&pagePlaying);
    play.disabled = !ready;
    chapterButtons.forEach((button, index) => {
      button.disabled = !ready;
      if (index === current) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    const selected = chapterButtons[current], nav = selected?.parentElement;
    if (nav?.scrollTo && nav.scrollWidth > nav.clientWidth) {
      const target = nav.scrollLeft + selected.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - selected.clientWidth) / 2;
      nav.scrollTo({ left: Math.max(0, target), behavior: 'instant' });
    }
    advance.textContent = pending ? '読み込み中' : !started ? 'ENTER — 体験をはじめる' : current === 3 && !reachedHold ? '弾いてみる' : current === 6 ? (reachedHold ? '体験の終わり' : '最後の映像を見る') : '次へ';
    play.textContent = pending ? '読み込みを中止' : video.paused ? reachedHold ? 'もう一度見る' : '映像を再生' : '映像を止める';
    if (current === 0 && entryController && video.hidden && !pending) {
      advance.textContent = '文字の中へ';
      play.textContent = entryAnimating && !entryPaused ? '入口を止める' : '入口を動かす';
    } else if (current > 0 && !pending && !(current === 3 && !reachedHold)) {
      advance.textContent = ['','','指先へ','制作の部屋へ','届ける','外へ','体験の終わり'][current] || '町へ広がる';
    }
    if([1,2].includes(current)&&entryController?.chapter===current&&video.hidden&&!pending&&!connection?.saveData)play.textContent=pagePlaying?'動きを止める':pagePaused?'続きから動かす':'もう一度動かす';
    if(isNativeFlick()&&!pending)play.textContent=pagePlaying?'動きを止める':pagePaused?'続きから動かす':reachedHold?'もう一度弾く':'弾いてみる';
    if(current===6&&!pending)advance.textContent='相談へ進む';
    if([0,1,2,3].includes(current)&&entryController&&(entryController.chapter??0)===current&&video.hidden&&!pending&&nativeLimited[current])play.textContent='映像で動きを見る';
    // 弾く前は「次へ」も同じ「弾いてみる」なので、同じ言葉のボタンを2つ並べない。
    play.hidden=!pending&&play.textContent===advance.textContent;
  }
  function pause(message) {
    if([1,2,3].includes(current)&&pagePlaying){pagePlaying=false;pagePaused=true;entryController?.pause();}
    if(current===3)entryController?.cancelFlick?.();
    dropHandoff();
    if(pending&&pendingKind==='native')nativeAttempt++;
    request += 1; pending = false; pendingKind=null; video.pause(); cancelAnimationFrame(frame);
    cancelSeek?.();
    cancelAnimationFrame(scrubFrame); scrubFrame = 0; queuedSeek = null; drag = null;
    stage.dataset.dragging = 'false'; video.playbackRate = 1;
    if (message) announce(message);
    updateControls();
  }
  function showEnding(ending) {
    frameContact.hidden = !ending; stage.dataset.ending = String(ending);
    fitOverlay();
  }
  function showPoster() { video.hidden = true; still.hidden = false; showEnding(current === 6); syncEntry(); }
  function select(index,{native=true}={}) {
    pause(); current = index; reachedHold = false;
    pagePlaying=false;pagePaused=false;
    if(index===0&&entryController?.showChapter)entryController.showChapter(0,{animate:entryAnimating&&!staticPreferred()});
    else if((entryController?.chapter===3&&index!==3)||(entryController?.chapter===2&&index!==2))entryController.showChapter(0,{animate:false});
    stage.dataset.entry = String(index === 0);
    stage.dataset.chapter = String(index);
    entryHost?.setAttribute('aria-label',index===3?'指でページを引き、離して弾く立体の世界':index===2?'町へ広がり、探している人に見つかる立体の世界':index===1?'Webページの文字の足元へ降りる立体の世界':'指やカーソルに反応する、立体のAWAI工房');
    const chapterNav = $('chapter-nav'), chapterToggle = $('chapter-toggle');
    if (chapterNav) chapterNav.hidden = true;
    chapterToggle?.setAttribute('aria-expanded', 'false');
    const chapter = chapters[index];
    still.src = chapter.poster;
    still.alt = `${String(index).padStart(2, '0')} ${chapter.title || '場面'}の静止画`;
    video.poster = chapter.poster;
    showPoster();
    copies.forEach((copy, i) => { copy.hidden = i !== current; });
    document.querySelector('.gesture-hint').hidden = current !== 3;
    announce(current === 3 ? '上へ引いて離すと、ページが弾かれます。ボタンでも進めます。' : staticPreferred() ? '静止画で表示しています。映像は再生ボタンから選べます。' : '映像は操作するまで止まっています。');
    updateControls();
    if (index === 0) loadEntry();
    else if([1,2,3].includes(index)&&native&&entryController)openNativePage(index,{animate:false});
  }
  function finishChapter() {
    const chapter = chapters[current];
    if (!chapter || reachedHold) return;
    // Mark the stop before pausing/seeking: either can dispatch media events.
    reachedHold = true;
    pause();
    video.currentTime = chapter.hold;
    announce(current === 6 ? '体験はここまでです。下の相談へ進めます。' : 'この場面の終わりです。次へ進めます。');
    showEnding(current === 6);
    updateControls();
  }
  function monitor() {
    if (video.paused) return;
    if (hasReachedHold(video.currentTime, chapters[current])) { finishChapter(); return; }
    frame = requestAnimationFrame(monitor);
  }
  function ensureMedia() {
    if (mediaLoading) return mediaLoading;
    if (video.getAttribute('src') && !mediaFailed && video.readyState >= 1) return Promise.resolve();
    mediaLoading = new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => { clearTimeout(timer); video.removeEventListener('loadedmetadata', done); video.removeEventListener('error', error); };
      const done = () => { cleanup(); resolve(); };
      const error = () => { cleanup(); reject(new Error('映像を読み込めませんでした。')); };
      video.addEventListener('loadedmetadata', done, { once: true });
      video.addEventListener('error', error, { once: true });
      timer = setTimeout(() => { cleanup(); reject(new Error('映像の読み込みに時間がかかっています。')); }, 15000);
      if (!video.getAttribute('src') || mediaFailed) { video.src = video.dataset.source || 'flow-complete.mp4'; mediaFailed = false; video.load(); }
    }).finally(() => { mediaLoading = null; });
    return mediaLoading;
  }
  function seekMedia(target) {
    if(!video.seeking&&Math.abs(video.currentTime-target)<.08)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let timer;
      const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',settled);video.removeEventListener('error',failed);if(cancelSeek===cancel)cancelSeek=null;};
      const failed=()=>{cleanup();reject(new Error('この場面へ移動できませんでした。'));};
      const settled=()=>{if(Math.abs(video.currentTime-target)>.15){failed();return;}cleanup();resolve();};
      const cancel=()=>{cleanup();reject(new Error('場面の移動を中止しました。'));};
      cancelSeek=cancel;video.addEventListener('seeked',settled);video.addEventListener('error',failed);
      timer=setTimeout(failed,8000);
      try{video.currentTime=target;}catch{failed();}
    });
  }
  async function playChapter({ release = current === 3 && !reachedHold, rate = 1 } = {}) {
    if (!chapters.length || pending || !visible || document.hidden) return;
    const token = ++request;
    showEnding(false);
    pending = true; pendingKind='video'; updateControls();
    announce('映像を読み込んでいます。');
    let timer;
    try {
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('映像の読み込みに時間がかかっています。')), 15000); });
      const start = async () => {
        await ensureMedia();
        if (token !== request) return;
        const chapter = chapters[current];
        let target=null;
        if (release) target = gestureTime(chapter, 100);
        else if (reachedHold || video.currentTime < chapter.start || video.currentTime >= chapter.hold || video.hidden) target = chapter.start;
        if(target!==null)await seekMedia(target);
        if(token!==request)return;
        video.playbackRate = rate;
        reachedHold = false;
        await video.play();
      };
      await Promise.race([start(), deadline]);
      // A stale play promise must not pause a newer chapter's playback.
      if (token !== request) return;
      video.hidden = false; still.hidden = true; retry.hidden = true;
      if(handoff){const go=()=>finishHandoff();video.requestVideoFrameCallback?video.requestVideoFrameCallback(go):requestAnimationFrame(()=>requestAnimationFrame(go));}
      syncEntry();
      announce('映像を再生しています。場面の終わりで止まります。');
      monitor();
    } catch (error) {
      if (token !== request) return;
      request += 1; cancelSeek?.(); video.pause(); mediaFailed = true; dropHandoff(); showPoster(); retry.hidden = false;
      announce(`${error.message || '映像を再生できませんでした。'} 静止画と文章で引き続きご覧いただけます。`);
    } finally {
      clearTimeout(timer);
      if (token === request || mediaFailed) { pending = false; pendingKind=null; updateControls(); }
    }
  }
  async function loadTimeline() {
    pause(); chapters = []; retry.hidden = true; updateControls();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('timeline.json', { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('場面の情報を読み込めませんでした。');
      chapters = validateTimeline(await response.json());
      document.documentElement.classList.add('enhanced'); select(0);
      document.documentElement.dataset.loading='false';
    } catch {
      document.documentElement.classList.remove('enhanced');
      showPoster(); copies.forEach((copy) => { copy.hidden = false; });
      announce('場面の情報を読み込めませんでした。下の文章と相談先はそのまま読めます。'); retry.hidden = false;
    } finally { clearTimeout(timer); updateControls(); }
  }
  $('controls').hidden = false;
  function activateNativeFlick(){
    if(!isNativeFlick())return false;
    if(nativeLimited[3]){started=true;playChapter({release:true});return true;}
    if(pagePlaying){pagePlaying=false;pagePaused=true;entryController.pause();}
    else if(pagePaused&&!reachedHold){pagePaused=false;pagePlaying=true;syncEntry();}
    else{started=true;pagePlaying=true;pagePaused=false;reachedHold=false;entryController.flick(1);syncEntry();}
    updateControls();return true;
  }
  advance.addEventListener('click', () => {
    if(current===6){pause();const contact=$('contact');contact?.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});contact?.focus?.({preventScroll:true});return;}
    if (current === 0 && entryController && video.hidden) {
      if(connection?.saveData){started=true;select(1,{native:false});return;}
      openNativePage1({animate:!staticPreferred(),fromEntry:true});return;
    }
    if(current===1&&entryController?.chapter===1&&entryController.preparePage2&&video.hidden&&!connection?.saveData){
      openNativePage(2,{animate:!staticPreferred(),fromEntry:true,fromPage:true});return;
    }
    if (!started) { started = true; updateControls(); if (!staticPreferred()) playChapter(); else announce('静止画で体験を始めました。次へ進めます。'); return; }
    if (current === 3 && !reachedHold) {
      if(isNativeFlick()){if(!pagePlaying)activateNativeFlick();return;}
      if (staticPreferred()) { reachedHold = true; announce('静止画で表示しています。映像は再生ボタンから選べます。'); updateControls(); } else playChapter();
      return;
    }
    if (current < 6) {
      const shot=current===3&&isNativeFlick()&&reachedHold&&!staticPreferred()?captureLive():null;
      select(current + 1); if(shot)attachHandoff(shot); if (!staticPreferred() && current !== 3) playChapter();
    }
    else if (!staticPreferred()) playChapter();
    else { reachedHold = true; updateControls(); announce('体験はここまでです。下の相談へ進めます。'); }
  });
  previous.addEventListener('click', () => { started = true; select(Math.max(0, current - 1)); });
  chapterButtons.forEach((button, index) => button.addEventListener('click', () => { started = true; select(index); $('chapter-toggle')?.focus?.({preventScroll:true}); }));
  play.addEventListener('click', () => {
    if (pending || !video.paused) { nativeAttempt++;pause('映像を止めました。'); return; }
    if([0,1,2,3].includes(current)&&nativeLimited[current]&&video.hidden){started=true;playChapter({release:current===3});return;}
    if(activateNativeFlick())return;
    if([1,2].includes(current)&&entryController?.chapter===current&&video.hidden&&!connection?.saveData){
      if(pagePlaying){pagePlaying=false;pagePaused=true;entryController.pause();announce('動きを止めました。再生ボタンで続けられます。');}
      else if(pagePaused&&!reachedHold){pagePaused=false;pagePlaying=true;syncEntry();announce('動きを再開しました。場面の終わりで止まります。');}
      else{pagePlaying=true;pagePaused=false;reachedHold=false;entryController.showChapter(current,{animate:true});syncEntry();announce(current===2?'同じページから町へ広がり、駅からお店への道をたどります。':'同じ紙が広がり、文字の足元へ降ります。');}
      updateControls();return;
    }
    if (current === 0 && entryController && video.hidden) {
      entryAnimating = !(entryAnimating && !entryPaused); entryPaused = false;
      entryController.setMotion(entryAnimating); syncEntry(); updateControls();
      announce(entryAnimating ? '指やカーソルに反応する入口です。' : '入口の動きを止めました。'); return;
    }
    started = true; if (!video.paused || pending) pause('映像を止めました。'); else playChapter();
  });
  const chapterToggle = $('chapter-toggle'), chapterNav = $('chapter-nav');
  chapterToggle?.addEventListener('click', () => {
    chapterNav.hidden = !chapterNav.hidden;
    chapterToggle.setAttribute('aria-expanded', String(!chapterNav.hidden));
  });
  chapterNav?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { chapterNav.hidden = true; chapterToggle.setAttribute('aria-expanded','false'); chapterToggle.focus(); }
  });
  retry.addEventListener('click', () => chapters.length ? playChapter() : loadTimeline());
  video.addEventListener('timeupdate', () => { if (!video.paused && chapters.length && hasReachedHold(video.currentTime, chapters[current])) finishChapter(); });
  video.addEventListener('ended', finishChapter);
  video.addEventListener('pause', () => { cancelAnimationFrame(frame); updateControls(); });
  video.addEventListener('error', () => { if (!chapters.length) return; pause(); mediaFailed = true; showPoster(); retry.hidden = false; announce('映像を読み込めませんでした。静止画と文章でご覧いただけます。'); });
  function flushScrub() {
    scrubFrame = 0;
    if (!drag || current !== 3 || !visible || document.hidden || staticPreferred()) { queuedSeek = null; return; }
    if (queuedSeek !== null && video.readyState >= 1 && !video.seeking) {
      const target = queuedSeek; queuedSeek = null;
      video.currentTime = target; video.hidden = false; still.hidden = true;
    }
    if (queuedSeek !== null) scrubFrame = requestAnimationFrame(flushScrub);
  }
  function queueScrub(delta) {
    queuedSeek = gestureTime(chapters[3], delta);
    if (!scrubFrame) scrubFrame = requestAnimationFrame(flushScrub);
  }
  function beginDrag(x, y, id, kind) {
    if (current !== 3 || isNativeFlick() || reachedHold || pending || !visible || document.hidden || staticPreferred()) return;
    pause();
    const rect = stage.getBoundingClientRect();
    drag = { x, y, id, kind, time: performance.now(), lastY: y, lastTime: performance.now(), speed: 0 };
    stage.style.setProperty('--drag-x', `${x - rect.left}px`);
    stage.style.setProperty('--drag-y', `${y - rect.top}px`);
    stage.dataset.dragging = 'true';
    const token = request;
    ensureMedia().then(() => { if (drag && token === request) queueScrub(drag.y - drag.lastY); }).catch(() => {
      if (token !== request) return;
      pause(); showPoster(); mediaFailed = true; retry.hidden = false;
      announce('映像を読み込めませんでした。静止画でご覧いただけます。');
    });
  }
  function moveDrag(x, y) {
    if (!drag) return;
    const now = performance.now(), rect = stage.getBoundingClientRect();
    const elapsed = now - drag.lastTime;
    if (elapsed > 0 && drag.lastY !== y) {
      drag.speed = Math.max(0, (drag.lastY - y) / elapsed);
      drag.lastTime = now;
    }
    drag.lastY = y;
    stage.style.setProperty('--drag-x', `${x - rect.left}px`);
    stage.style.setProperty('--drag-y', `${y - rect.top}px`);
    if (video.readyState >= 1) queueScrub(drag.y - y);
  }
  function endDrag(x, y) {
    if (!drag) return;
    const gesture = drag;
    moveDrag(x, y);
    const upward = isUpwardFlick(gesture, { x, y });
    const speed = performance.now() - gesture.lastTime > 120 ? 0 : gesture.speed;
    pause();
    if (upward && visible && !staticPreferred()) {
      started = true; playChapter({ release: true, rate: releaseRate(speed, 1) });
    } else { showPoster(); announce('上へ引いて離すと、ページが弾かれます。ボタンでも進めます。'); }
  }
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.isPrimary && event.button === 0) beginDrag(event.clientX, event.clientY, event.pointerId, 'pointer');
  });
  window.addEventListener('pointermove', (event) => { if (drag?.kind === 'pointer' && drag.id === event.pointerId) moveDrag(event.clientX, event.clientY); });
  window.addEventListener('pointerup', (event) => { if (drag?.kind === 'pointer' && drag.id === event.pointerId) endDrag(event.clientX, event.clientY); });
  window.addEventListener('pointercancel', (event) => { if (drag?.kind === 'pointer' && drag.id === event.pointerId) { pause(); showPoster(); } });
  // Touch owns touch gestures; pointer cancellation during natural scrolling
  // never cancels this passive touch stream or produces a second release.
  stage.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) { if (drag) { pause(); showPoster(); } return; }
    const touch = event.touches[0]; beginDrag(touch.clientX, touch.clientY, touch.identifier, 'touch');
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    if (drag?.kind !== 'touch') return;
    const touch = [...event.touches].find((item) => item.identifier === drag.id);
    if (touch) moveDrag(touch.clientX, touch.clientY);
  }, { passive: true });
  window.addEventListener('touchend', (event) => {
    if (drag?.kind !== 'touch') return;
    const touch = [...event.changedTouches].find((item) => item.identifier === drag.id);
    if (touch) endDrag(touch.clientX, touch.clientY);
  }, { passive: true });
  window.addEventListener('touchcancel', () => { if (drag?.kind === 'touch') { pause(); showPoster(); } }, { passive: true });
  // Native buttons provide Enter/Space input without capturing page scrolling.
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('映像を止めました。再生ボタンで続けられます。'); syncEntry(); });
  window.addEventListener('pagehide', () => { entryController?.pause(); pause(); });
  window.addEventListener('pageshow', syncEntry);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) pause('映像を止めました。再生ボタンで続けられます。'); syncEntry(); }, { threshold: 0.1 }).observe(stage);
    // Ending colours belong to the experience, never to the information below it.
    new IntersectionObserver(([entry]) => {
      document.documentElement.dataset.information=String(!entry.isIntersecting);
    }, {rootMargin:'-80px 0px 0px 0px'}).observe(stage.parentElement);
  }
  function preferStatic() {
    if (!staticPreferred()) return;
    entryAnimating = false; entryController?.setMotion(false);
    pagePlaying=false;pagePaused=false;
    if(pending&&pendingKind==='native'){announce('動きを減らした状態で、立体のページを読み込んでいます。');updateControls();return;}
    pause('動きを止めました。再生ボタンで動かすこともできます。'); showPoster(); updateControls();
  }
  motion.addEventListener('change', preferStatic);
  connection?.addEventListener?.('change', preferStatic);
  function fitOverlay() {
    // Align the native link with the uncropped 16:10 picture, including letterboxing.
    const phoneEnding=narrowStage.matches&&stage.dataset.chapter==='6';
    const width = Math.min(stage.clientWidth, stage.clientHeight * 1.6)*(phoneEnding?1.65:1);
    filmOverlay.style.width = `${width}px`;
    filmOverlay.style.height = `${width / 1.6}px`;
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitOverlay).observe(stage);
  else window.addEventListener('resize', fitOverlay);
  fitOverlay();
  loadTimeline();
})();

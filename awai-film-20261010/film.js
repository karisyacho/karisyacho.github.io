(() => {
  'use strict';
  const root = document.documentElement;
  const film = document.querySelector('.film');
  const stage = document.querySelector('.stage');
  const scenes = [...document.querySelectorAll('.scene')];
  const photos = scenes.map(scene => scene.querySelector('.photo'));
  const letters = scenes.map(scene => scene.querySelector('.lettering'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(orientation: portrait)');
  const rests = [1.5, 1.25, 1.25, 1.25, 1.5];
  const transitions = [0.9, 0.75, 0.6, 0.75];
  const total = rests.reduce((a,b) => a+b,0) + transitions.reduce((a,b) => a+b,0);
  const segments = [];
  const cuts = [];
  let cursor = 0;
  rests.forEach((duration, scene) => {
    segments.push({ phase:'rest', scene, start:cursor, end:cursor+duration });
    cursor += duration;
    if(scene < 4) {
      const length = transitions[scene];
      segments.push({ phase:'transition', scene, start:cursor, end:cursor+length });
      cuts.push({ from:scene, to:scene+1, unit:cursor+length/2, progress:(cursor+length/2)/total });
      cursor += length;
    }
  });
  // Points are fractions of the full native image; angles are native-pixel tangents.
  // A shared mean angle aligns each cut without imposing a global scene rotation.
  const ridges = {
    pc: [
      {out:[.59,.43,40],in:[.76,.58,30],scale:1.75,target:[.60,.50]},
      {out:[.76,.58,30],in:[.67,.68,30],scale:1.7,target:[.60,.50]},
      {out:[.67,.68,30],in:[.60,.30,22],scale:1.65},
      {out:[.60,.30,22],in:[.55,.43,43],scale:1.75}
    ],
    sp: [
      {out:[.49,.40,50],in:[.29,.70,40],scale:1.75},
      {out:[.29,.70,40],in:[.48,.45,46],scale:1.7},
      {out:[.48,.45,46],in:[.38,.46,35],scale:1.65},
      {out:[.38,.46,35],in:[.46,.40,50],scale:1.75}
    ]
  };
  const clamp = value => Math.max(0,Math.min(1,value));
  const ease = value => value*value*(3-2*value);
  let mode, stageHeight, viewportWidth, filmTop, frames;
  let frameRequest = 0;
  let state;
  let active = -1;
  root.classList.add('film-ready');

  function layout() {
    // Only initial layout, width changes, and orientation changes enter here.
    // svh supplies the stable small viewport; older Safari caches innerHeight.
    root.style.removeProperty('--stage-height');
    if(!CSS.supports('height','100svh')) root.style.setProperty('--stage-height',`${innerHeight}px`);
    stageHeight = stage.getBoundingClientRect().height;
    root.style.setProperty('--stage-height',`${stageHeight}px`);
    viewportWidth = document.documentElement.clientWidth;
    mode = portrait.matches ? 'sp' : 'pc';
    filmTop = film.getBoundingClientRect().top + scrollY;
    frames = scenes.map((scene,index) => {
      const nativeWidth = mode === 'sp' ? 948 : 1659;
      const nativeHeight = mode === 'sp' ? (index === 4 ? 1660 : 1659) : 948;
      const width = Math.min(viewportWidth,stageHeight*nativeWidth/nativeHeight);
      const height = width*nativeHeight/nativeWidth;
      scene.style.setProperty('--frame-width',`${width}px`);
      scene.style.setProperty('--frame-height',`${height}px`);
      return {width,height,nativeWidth,nativeHeight};
    });
    render();
  }

  function endpoint(index, side, scene) {
    const pair = ridges[mode][index];
    const [pointX,pointY,tangent] = pair[side];
    const rotation = (pair.out[2]+pair.in[2])/2 - tangent;
    const radians = rotation*Math.PI/180;
    const {width,height} = frames[scene];
    const px = (pointX-.5)*width;
    const py = (pointY-.5)*height;
    const [targetX,targetY] = pair.target || [.5,.5];
    // translate * rotate * scale maps the ridge point onto the shared target.
    return {
      x:(targetX-.5)*viewportWidth-pair.scale*(px*Math.cos(radians)-py*Math.sin(radians)),
      y:(targetY-.5)*stageHeight-pair.scale*(px*Math.sin(radians)+py*Math.cos(radians)),
      rotation,scale:pair.scale,point:[pointX,pointY],tangent,
      target:[targetX,targetY],
      commonTangent:(pair.out[2]+pair.in[2])/2
    };
  }

  function render() {
    frameRequest = 0;
    const unit = Math.max(0,Math.min(total,(scrollY-filmTop)/stageHeight));
    const segment = segments.find(item => unit >= item.start && unit < item.end) || segments[segments.length-1];
    let scene = segment.scene;
    let phase = 'rest';
    let opacity = 1;
    let transform = {x:0,y:0,rotation:0,scale:1};
    let transitionProgress = null;
    let selectedEndpoint = null;
    if(segment.phase === 'transition') {
      const t = clamp((unit-segment.start)/(segment.end-segment.start));
      transitionProgress = t;
      const incoming = t >= .5;
      scene += incoming ? 1 : 0;
      phase = incoming ? 'pull' : 'approach';
      if(!reducedMotion.matches) {
        selectedEndpoint = endpoint(segment.scene,incoming ? 'in' : 'out',scene);
        const amount = ease(incoming ? 2*(1-t) : 2*t);
        transform = {
          x:selectedEndpoint.x*amount,
          y:selectedEndpoint.y*amount,
          rotation:selectedEndpoint.rotation*amount,
          scale:1+(selectedEndpoint.scale-1)*amount
        };
        // Outgoing titles disappear in the first tenth of approach. Incoming
        // titles wait for the complete composition at the end of the pull.
        opacity = incoming ? 0 : 1-clamp(t/.05);
      } else {
        phase = 'cut';
      }
    }
    if(active !== scene) {
      scenes.forEach((item,index) => {
        item.classList.toggle('is-active',index===scene);
        item.setAttribute('aria-hidden',String(index!==scene));
      });
      active = scene;
    }
    photos[scene].style.transform = `translate(${transform.x}px,${transform.y}px) rotate(${transform.rotation}deg) scale(${transform.scale})`;
    letters[scene].style.opacity = String(opacity);
    // Keep the final composition framed in the same dark perimeter as S0.
    stage.style.backgroundColor = '#090A0C';
    stage.dataset.scene = String(scene);
    state = {
      scene,phase,progress:unit/total,unit,mode,
      reducedMotion:reducedMotion.matches,transitionProgress,
      transform,endpoint:selectedEndpoint,letterOpacity:opacity,
      frame:{...frames[scene]},stageHeight,viewportWidth,
      filmTop,scrollRange:stageHeight*total
    };
  }

  function requestRender() {
    if(!frameRequest) frameRequest = requestAnimationFrame(render);
  }
  addEventListener('scroll',requestRender,{passive:true});
  addEventListener('resize',() => {
    if(document.documentElement.clientWidth !== viewportWidth) layout();
  },{passive:true});
  portrait.addEventListener('change',layout);
  reducedMotion.addEventListener('change',requestRender);
  // All five selected variants are eager <picture> loads, so every next cut
  // is already requested; no image source changes occur on scroll.
  layout();
  const deepFreeze = object => {
    Object.values(object).forEach(value => {if(value && typeof value==='object') deepFreeze(value);});
    return Object.freeze(object);
  };
  Object.defineProperty(window,'awaiFilm',{
    value:Object.freeze({
      snapshot:() => JSON.parse(JSON.stringify(state)),
      timeline:deepFreeze({rests:[...rests],transitions:[...transitions],cuts,segments,total}),
      ridges:deepFreeze(ridges)
    }),writable:false,configurable:false
  });
})();

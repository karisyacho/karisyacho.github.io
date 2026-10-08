// Hand-authored ridge controls, shared by CPU hit testing and the GPU height field.
// Units: y/x in reference UV; z in reference short-side units. No image reconstruction.
export const ridges = {
  pc: [[0,.19],[.25,.49],[.5,.68],[.75,.82],[1,.95]],
  sp: [[0,-.34],[.25,.19],[.5,.64],[.75,.94],[1,1.10]],
};
// Original is the previous Readable B, kept unchanged as the visual baseline.
export const defaults = {depth:.014,range:.22,ratio:3.2,response:14,restore:3.9,amber:.26,transmission:.30,tension:.65,opticalGain:2.4,lightDelay:.12,glowResponse:3.2,pull:0,spread:.62,bend:0,smooth:0,curvature:.14,compression:.15};
export const presets={clear:{...defaults,depth:.045,range:.44,ratio:2.1,tension:0,response:22,restore:4.8,pull:.46,spread:.62,bend:.048,smooth:0,curvature:.14,compression:.15},smooth:{...defaults,depth:.045,range:.44,ratio:2.1,tension:0,response:22,restore:4.8,pull:.46,spread:.62,bend:.048,smooth:1,curvature:.14,compression:.15}};
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function ridgeAt(y,controls){
  if(y<0)return controls[0][1]+y*(controls[1][1]-controls[0][1])*4;
  if(y>1)return controls[4][1]+(y-1)*(controls[4][1]-controls[3][1])*4;
  const t=clamp(y,0,.999999)*4,i=Math.floor(t),s=t-i;
  const p0=controls[Math.max(0,i-1)][1],p1=controls[i][1],p2=controls[i+1][1],p3=controls[Math.min(4,i+2)][1];
  return .5*((2*p1)+(-p0+p2)*s+(2*p0-5*p1+4*p2-p3)*s*s+(-p0+3*p1-3*p2+p3)*s*s*s);
}
export function frameFor(width,height){
  const portrait=width/height<.8,aspect=portrait?948/1659:1659/948;
  // Fit the entire reference width and extend the real surface into surplus space.
  const scaleY=aspect/(width/height);
  return {portrait,aspect,scaleY,controls:ridges[portrait?'sp':'pc']};
}
export function edgeWeight(uv){
  const smooth=(a,b,x)=>{const s=clamp((x-a)/(b-a));return s*s*(3-2*s);};
  return smooth(0,.075,uv[0])*smooth(0,.075,1-uv[0])*smooth(-.12,.04,uv[1])*smooth(-.12,.04,1-uv[1]);
}
function fixedWeight(uv,frame,settings){
  if(!settings.pull)return edgeWeight(uv);
  const y=(uv[1]-.5)/frame.scaleY+.5,smooth=x=>{const t=clamp(x/.12);return t*t*(3-2*t);};
  return edgeWeight(uv)*smooth(y)*smooth(1-y);
}
export function loadAt(uv,hit,frame,settings){
  const e=.002,slope=(ridgeAt(hit[1]+e,frame.controls)-ridgeAt(hit[1]-e,frame.controls))/(2*e)*frame.aspect;
  const length=Math.hypot(slope,1),along=[slope/length,1/length],across=[along[1],-along[0]];
  const dx=(uv[0]-hit[0])*frame.aspect,dy=uv[1]-hit[1];
  const a=(dx*along[0]+dy*along[1])/settings.range,b=(dx*across[0]+dy*across[1])/(settings.range/settings.ratio);
  // Superellipse + material variation, not a circular screen mask.
  const variation=1+.09*Math.sin(uv[1]*31+uv[0]*13);
  return Math.exp(-(a*a+b*b*b*b)*1.6)*fixedWeight(uv,frame,settings)*variation;
}
export function surfacePoint(uv,hit,amount,frame,settings){
  if(settings.smooth&&amount>0){
    const d=(uv[0]-ridgeAt(uv[1],frame.controls))*frame.aspect,width=d<0?.039:.22;
    const baseline=.092*Math.exp(-((d/width)**2))+.022*Math.tanh(d*5);
    const displacement=warpAt(uv[1],frame,smoothWarp(frame,settings,hit));
    const stripWidth=.25+(1-settings.compression)*.65,r=clamp(ridgeAt(uv[1],frame.controls),.05,.95);
    const t=clamp(uv[0]<r?uv[0]/r:(1-uv[0])/(1-r)),boundary=t*t*t*(10-15*t+6*t*t);
    const weight=boundary*(1-settings.compression+settings.compression*Math.exp(-((d/stripWidth)**4)))*fixedWeight(uv,frame,settings)*amount;
    const xy=[uv[0]+displacement[0]*weight,uv[1]+displacement[1]*weight];
    const slope=(ridgeAt(hit[1]+.002,frame.controls)-ridgeAt(hit[1]-.002,frame.controls))/.004*frame.aspect,len=Math.hypot(slope,1);
    const along=[slope/len,1/len],across=[along[1],-along[0]],dx=(xy[0]-hit[0])*frame.aspect,dy=xy[1]-hit[1];
    const a=(dx*along[0]+dy*along[1])/settings.range,b=(dx*across[0]+dy*across[1])/(settings.range/settings.ratio);
    // Pressure is evaluated under the projected finger, without mechanical fibre noise.
    const pressure=Math.exp(-.85*(a*a+b*b))*fixedWeight(uv,frame,settings)*amount*settings.depth*Math.min(frame.aspect,1);
    return [xy[0],xy[1],baseline-pressure];
  }
  const q=loadAt(uv,hit,frame,settings)*amount*settings.depth*Math.min(frame.aspect,1);
  const dx=(uv[0]-hit[0])*frame.aspect,dy=uv[1]-hit[1];
  const d=(uv[0]-ridgeAt(uv[1],frame.controls))*frame.aspect;
  const width=d<0?.039:.22;
  const baseline=.092*Math.exp(-Math.pow(d/width,2))+.022*Math.tanh(d*5);
  let x=uv[0]-dx*q*.9/frame.aspect,y=uv[1]-dy*q*.9;
  if(settings.tension>0){const e=.002,slope=(ridgeAt(hit[1]+e,frame.controls)-ridgeAt(hit[1]-e,frame.controls))/(2*e)*frame.aspect;
    const length=Math.hypot(slope,1),across=[1/length,-slope/length];
    const pull=q*settings.tension*Math.tanh((dx*across[0]+dy*across[1])/(settings.range/settings.ratio))*.8;
    x-=across[0]*pull/frame.aspect;y-=across[1]*pull;
  }
  if(settings.pull>0){
    const e=.002,slope=(ridgeAt(hit[1]+e,frame.controls)-ridgeAt(hit[1]-e,frame.controls))/(2*e)*frame.aspect;
    const len=Math.hypot(slope,1),along=[slope/len,1/len],across=[along[1],-along[0]];
    const a=dx*along[0]+dy*along[1],b=dx*across[0]+dy*across[1],s=settings.spread;
    const field=Math.exp(-.65*(a/s)**2-.7*(b/(s*.9))**4)*fixedWeight(uv,frame,settings)*amount;
    // Spatially varying draw toward the contact, plus opposing shear along the ridge.
    // The contact itself stays put and the perimeter remains fixed; no whole-screen transform.
    const k=settings.pull*field,shear=settings.bend*field*Math.tanh(a/(s*.7));
    x-=dx*k/frame.aspect+across[0]*shear/frame.aspect;y-=dy*k+across[1]*shear;
  }
  return [x,y,baseline-q];
}
export function warpAt(y,frame,controls){
  const t=clamp((y-.5)/frame.scaleY+.5)*16,i=Math.min(15,Math.floor(t)),s=t-i;
  const weights=[(1-s)**3/6,(3*s**3-6*s*s+4)/6,(-3*s**3+3*s*s+3*s+1)/6,s**3/6];
  const p=[0,0];for(let k=0;k<4;k++){const c=controls[clamp(i+k-1,0,16)];p[0]+=c[0]*weights[k];p[1]+=c[1]*weights[k];}return p;
}
let warpCache=null;
export function smoothWarp(frame,settings,hit){
  const key=[frame.aspect,frame.scaleY,...hit,settings.depth,settings.range,settings.ratio,settings.pull,settings.spread,settings.bend,settings.curvature,settings.compression].join(',');
  if(warpCache?.key===key)return warpCache.controls;
  const legacy={...settings,depth:presets.clear.depth,smooth:0},raw=y=>{const uv=[ridgeAt(y,frame.controls),y],p=surfacePoint(uv,hit,1,frame,legacy);return [p[0]-uv[0],p[1]-uv[1]];};
  const controls=Array.from({length:17},(_,i)=>{const y=(i/16-.5)*frame.scaleY+.5,sum=[0,0];let total=0;for(let j=-3;j<=3;j++){const weight=Math.exp(-.5*j*j),p=raw(y+j*settings.curvature*frame.scaleY*.5);sum[0]+=p[0]*weight;sum[1]+=p[1]*weight;total+=weight;}return sum.map(v=>v/total);});
  const target=[0,0],filtered=[0,0];for(let i=0;i<=200;i++){const y=(i/200-.5)*frame.scaleY+.5,x=ridgeAt(y,frame.controls);if(x<0||x>1)continue;const p=raw(y),q=warpAt(y,frame,controls),band=fixedWeight([x,y],frame,settings);for(let a=0;a<2;a++){target[a]=Math.max(target[a],Math.abs(p[a]));filtered[a]=Math.max(filtered[a],Math.abs(q[a]*band));}}
  for(const p of controls)for(let a=0;a<2;a++)p[a]*=filtered[a]>1e-8?target[a]/filtered[a]:1;
  warpCache={key,controls};return controls;
}
export function screenToSurface(x,y,width,height,hit,amount,frame,settings){
  const target=[x/width,(y/height-.5)*frame.scaleY+.5];let uv=[...target];
  // Orthographic ray: solve projected x/y of the currently deformed surface.
  for(let i=0;i<6;i++){const p=surfacePoint(uv,hit,amount,frame,settings);uv[0]+=target[0]-p[0];uv[1]+=target[1]-p[1];}
  return uv;
}
export const surfaceGLSL = `
uniform vec4 uRidge; uniform float uRidgeEnd;
uniform float uAspect; uniform float uScaleY;
uniform vec2 uHit; uniform float uAmount; uniform float uDepth; uniform float uRange; uniform float uRatio; uniform float uTension; uniform float uPull; uniform float uSpread; uniform float uBend;
uniform float uSmooth;uniform float uCompression;uniform vec2 uWarp[17];
float control(int i){if(i<=0)return uRidge.x;if(i==1)return uRidge.y;if(i==2)return uRidge.z;if(i==3)return uRidge.w;return uRidgeEnd;}
float ridge(float y){if(y<0.)return control(0)+y*(control(1)-control(0))*4.;if(y>1.)return control(4)+(y-1.)*(control(4)-control(3))*4.;float t=clamp(y,0.,.999999)*4.;int i=int(floor(t));float s=fract(t);float a=control(i-1),b=control(i),c=control(i+1),d=control(i+2);return .5*(2.*b+(-a+c)*s+(2.*a-5.*b+4.*c-d)*s*s+(-a+3.*b-3.*c+d)*s*s*s);}
float fixedBand(vec2 uv){float band=smoothstep(0.,.075,uv.x)*smoothstep(0.,.075,1.-uv.x)*smoothstep(-.12,.04,uv.y)*smoothstep(-.12,.04,1.-uv.y);if(uPull>0.){float y=(uv.y-.5)/uScaleY+.5;band*=smoothstep(0.,.12,y)*smoothstep(0.,.12,1.-y);}return band;}
vec2 tangent(){float slope=(ridge(uHit.y+.002)-ridge(uHit.y-.002))/.004*uAspect;return normalize(vec2(slope,1.));}
float loadField(vec2 uv){vec2 delta=(uv-uHit)*vec2(uAspect,1.);vec2 along=tangent(),across=vec2(along.y,-along.x);float a=dot(delta,along)/uRange,b=dot(delta,across)/(uRange/uRatio);return exp(-(a*a+b*b*b*b)*1.6)*fixedBand(uv)*(1.+.09*sin(uv.y*31.+uv.x*13.));}
vec2 warp(float y){float t=clamp((y-.5)/uScaleY+.5,0.,1.)*16.;int i=min(15,int(floor(t)));float s=t-float(i);return (pow(1.-s,3.)*uWarp[max(0,i-1)]+(3.*s*s*s-6.*s*s+4.)*uWarp[i]+(-3.*s*s*s+3.*s*s+3.*s+1.)*uWarp[min(16,i+1)]+s*s*s*uWarp[min(16,i+2)])/6.;}
vec3 surface(vec2 uv){float d=(uv.x-ridge(uv.y))*uAspect;float width=d<0.?.039:.22;float base=.092*exp(-pow(d/width,2.))+.022*tanh(d*5.);if(uSmooth>.5&&uAmount>0.){float stripWidth=.25+(1.-uCompression)*.65;float r=clamp(ridge(uv.y),.05,.95);float t=clamp(uv.x<r?uv.x/r:(1.-uv.x)/(1.-r),0.,1.);float boundary=t*t*t*(10.-15.*t+6.*t*t);float weight=boundary*(1.-uCompression+uCompression*exp(-pow(d/stripWidth,4.)))*fixedBand(uv)*uAmount;vec2 xy=uv+warp(uv.y)*weight;vec2 delta=(xy-uHit)*vec2(uAspect,1.),along=tangent(),across=vec2(along.y,-along.x);float a=dot(delta,along)/uRange,b=dot(delta,across)/(uRange/uRatio);float q=exp(-.85*(a*a+b*b))*fixedBand(uv)*uAmount*uDepth*min(uAspect,1.);return vec3(xy*vec2(uAspect,1.),base-q);}float q=loadField(uv)*uAmount*uDepth*min(uAspect,1.);vec2 xy=uv-(uv-uHit)*q*.9;if(uTension>0.){vec2 a=tangent(),crossAxis=vec2(a.y,-a.x);float perpendicular=dot((uv-uHit)*vec2(uAspect,1.),crossAxis);float pull=q*uTension*tanh(perpendicular/(uRange/uRatio))*.8;xy-=crossAxis*pull/vec2(uAspect,1.);}if(uPull>0.){vec2 delta=(uv-uHit)*vec2(uAspect,1.),along=tangent(),across=vec2(along.y,-along.x);float a=dot(delta,along),b=dot(delta,across);float field=exp(-.65*pow(a/uSpread,2.)-.7*pow(b/(uSpread*.9),4.))*fixedBand(uv)*uAmount;float shear=uBend*field*tanh(a/(uSpread*.7));xy-=(delta*uPull*field+across*shear)/vec2(uAspect,1.);}return vec3(xy*vec2(uAspect,1.),base-q);}
`;

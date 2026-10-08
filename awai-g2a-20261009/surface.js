// Hand-authored ridge controls, shared by CPU hit testing and the GPU height field.
// Units: y/x in reference UV; z in reference short-side units. No image reconstruction.
export const ridges = {
  pc: [[0,.19],[.25,.49],[.5,.68],[.75,.82],[1,.95]],
  sp: [[0,-.34],[.25,.19],[.5,.64],[.75,.94],[1,1.10]],
};
export const defaults = {depth:.011,range:.17,ratio:2.8,response:11,restore:4.3,amber:.13,transmission:.12};
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
export function loadAt(uv,hit,frame,settings){
  const e=.002,slope=(ridgeAt(hit[1]+e,frame.controls)-ridgeAt(hit[1]-e,frame.controls))/(2*e)*frame.aspect;
  const length=Math.hypot(slope,1),along=[slope/length,1/length],across=[along[1],-along[0]];
  const dx=(uv[0]-hit[0])*frame.aspect,dy=uv[1]-hit[1];
  const a=(dx*along[0]+dy*along[1])/settings.range,b=(dx*across[0]+dy*across[1])/(settings.range/settings.ratio);
  // Superellipse + material variation, not a circular screen mask.
  const variation=1+.09*Math.sin(uv[1]*31+uv[0]*13);
  return Math.exp(-(a*a+b*b*b*b)*1.6)*edgeWeight(uv)*variation;
}
export function surfacePoint(uv,hit,amount,frame,settings){
  const q=loadAt(uv,hit,frame,settings)*amount*settings.depth*Math.min(frame.aspect,1);
  const dx=(uv[0]-hit[0])*frame.aspect,dy=uv[1]-hit[1];
  const d=(uv[0]-ridgeAt(uv[1],frame.controls))*frame.aspect;
  const width=d<0?.039:.22;
  const baseline=.092*Math.exp(-Math.pow(d/width,2))+.022*Math.tanh(d*5);
  return [uv[0]-dx*q*.9/frame.aspect,uv[1]-dy*q*.9,baseline-q];
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
uniform vec2 uHit; uniform float uAmount; uniform float uDepth; uniform float uRange; uniform float uRatio;
float control(int i){if(i<=0)return uRidge.x;if(i==1)return uRidge.y;if(i==2)return uRidge.z;if(i==3)return uRidge.w;return uRidgeEnd;}
float ridge(float y){if(y<0.)return control(0)+y*(control(1)-control(0))*4.;if(y>1.)return control(4)+(y-1.)*(control(4)-control(3))*4.;float t=clamp(y,0.,.999999)*4.;int i=int(floor(t));float s=fract(t);float a=control(i-1),b=control(i),c=control(i+1),d=control(i+2);return .5*(2.*b+(-a+c)*s+(2.*a-5.*b+4.*c-d)*s*s+(-a+3.*b-3.*c+d)*s*s*s);}
float fixedBand(vec2 uv){return smoothstep(0.,.075,uv.x)*smoothstep(0.,.075,1.-uv.x)*smoothstep(-.12,.04,uv.y)*smoothstep(-.12,.04,1.-uv.y);}
vec2 tangent(){float slope=(ridge(uHit.y+.002)-ridge(uHit.y-.002))/.004*uAspect;return normalize(vec2(slope,1.));}
float loadField(vec2 uv){vec2 delta=(uv-uHit)*vec2(uAspect,1.);vec2 along=tangent(),across=vec2(along.y,-along.x);float a=dot(delta,along)/uRange,b=dot(delta,across)/(uRange/uRatio);return exp(-(a*a+b*b*b*b)*1.6)*fixedBand(uv)*(1.+.09*sin(uv.y*31.+uv.x*13.));}
vec3 surface(vec2 uv){float d=(uv.x-ridge(uv.y))*uAspect;float width=d<0.?.039:.22;float base=.092*exp(-pow(d/width,2.))+.022*tanh(d*5.);float q=loadField(uv)*uAmount*uDepth*min(uAspect,1.);vec2 xy=uv-(uv-uHit)*q*.9;return vec3(xy*vec2(uAspect,1.),base-q);}
`;

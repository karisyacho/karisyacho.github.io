import {surfaceGLSL} from './surface.js';
export const vertexSource=`#version 300 es
precision highp float;
in vec2 aUv; out vec2 vUv; out vec3 vPosition; out vec3 vNormal;
${surfaceGLSL}
void main(){vec2 uv=vec2(aUv.x,(aUv.y-.5)*uScaleY+.5);vUv=uv;vPosition=surface(uv);vec3 dx=surface(uv+vec2(.0008,0.))-surface(uv-vec2(.0008,0.));vec3 dy=surface(uv+vec2(0.,.0008))-surface(uv-vec2(0.,.0008));vNormal=normalize(cross(dx,dy));vec2 projected=vec2(vPosition.x/uAspect,(vPosition.y-.5)/uScaleY+.5);gl_Position=vec4(projected*2.-1.,-vPosition.z,1.);gl_Position.y=-gl_Position.y;}
`;
export const fragmentSource=`#version 300 es
precision highp float;
in vec2 vUv;in vec3 vPosition;in vec3 vNormal;out vec4 outColor;
uniform float uAmber;uniform float uGlow;uniform float uTransmission;uniform float uMode;uniform float uOpticalGain;
${surfaceGLSL}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 srgb(vec3 v){return mix(12.92*v,1.055*pow(max(v,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),v));}
void main(){
  // Normal comes from the displaced mesh, then a separate microfibre perturbation.
  vec3 normal=normalize(vNormal);
  vec2 textile=vUv*vec2(uAspect,1.);
  float grain=noise(textile*780.);float weave=sin(textile.x*1750.+noise(textile*105.)*3.)*sin(textile.y*1420.);
  if(uSmooth>.5&&uAmount>0.){float footprint=max(length(dFdx(textile)),length(dFdy(textile)));float alias= smoothstep(1.4,3.3,footprint*780.)*uAmount;grain=mix(grain,noise(textile*240.),alias);float weaveFilter=1.-smoothstep(.8,2.8,footprint*1750.);weave*=mix(1.,weaveFilter,uAmount);}
  float rough=.69+.12*grain;
  float fibre=noise(textile*vec2(420.,980.));
  normal=normalize(normal+vec3((grain-.5)*.085,(fibre-.5)*.055+weave*.019,0.));
  vec3 light=normalize(vec3(-.72,-.32,.61));vec3 halfVector=normalize(light+vec3(0.,0.,1.));
  float diffuse=max(dot(normal,light),0.);float spec=pow(max(dot(normal,halfVector),0.),mix(20.,8.,rough));
  float d=(vUv.x-ridge(vUv.y))*uAspect;
  float occlusion=mix(.055,1.,smoothstep(-.05,.007,d));
  float upperLight=mix(1.,.52,clamp(vUv.y,0.,1.));
  if(uAspect<1.)upperLight*=mix(.13,1.,smoothstep(.09,.3,vUv.y));
  float broad=mix(.46,1.,smoothstep(-.025,.18,d))*exp(-max(d,0.)*2.7);
  vec3 color=vec3(.0028,.0031,.0037)+vec3(.020,.021,.024)*diffuse*occlusion*broad*upperLight;
  color+=vec3(.21,.215,.225)*spec*occlusion*upperLight*exp(-max(d,0.)*5.8);
  color*=.74+.45*grain+.08*fibre+.05*weave;
  // A: the warm light reaches a deformed sloping flank, with a material-time lag.
  float materialLoad=loadField(vUv);
  float strain=materialLoad*uAmount;
  float flank=clamp((1.-normal.z)*2.2+.18,0.,1.);
  float warm=materialLoad*uGlow*uAmber*flank*(.35+.65*smoothstep(-.025,.1,d))*uOpticalGain;
  color+=vec3(.074,.031,.009)*warm;
  // B: optical density changes in material UV. No alpha hole; transmitted radiance
  // is attenuated by ridge thickness, weave and the same tension field as A.
  if(uMode>.5){float thickness=1.45+.9*exp(-pow(d/.095,2.))+.22*grain;
    float thinned=thickness*(1.-min(strain,.95)*.46);
    float backPlate=.4+.6*noise(textile*vec2(2.7,3.9)+vec2(8.1,2.));
    float transmission=uTransmission*uGlow*strain*exp(-thinned*2.3)*backPlate*(.6+.4*grain)*uOpticalGain;
    color+=vec3(.22,.102,.033)*transmission;
  }
  float vignette=1.-.13*pow(length((vUv-.5)*vec2(.8,.6)),2.);
  outColor=vec4(srgb(color*vignette),1.);
}
`;

import {gridGLSL} from './grid-shader.js';
import {opticsGLSL} from './optics.js';
import {surfaceGLSL} from './surface.js';
export const vertexSource=`#version 300 es
precision highp float;
in vec2 aUv; out vec2 vUv; out vec3 vPosition; out vec3 vNormal;
${surfaceGLSL}
${gridGLSL}
void main(){vec2 uv=vec2(aUv.x,(aUv.y-.5)*uScaleY+.5);vUv=uv;vec3 dx,dy;if(uGrid>.5)gridGeometry(uv,vPosition,dx,dy);else{vPosition=surface(uv);dx=surface(uv+vec2(.0008,0.))-surface(uv-vec2(.0008,0.));dy=surface(uv+vec2(0.,.0008))-surface(uv-vec2(0.,.0008));}vNormal=normalize(cross(dx,dy));vec2 projected=vec2(vPosition.x/uAspect,(vPosition.y-.5)/uScaleY+.5);gl_Position=vec4(projected*2.-1.,-vPosition.z,1.);gl_Position.y=-gl_Position.y;}
`;
export const fragmentSource=`#version 300 es
precision highp float;
in vec2 vUv;in vec3 vPosition;in vec3 vNormal;out vec4 outColor;

${surfaceGLSL}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 srgb(vec3 v){return mix(12.92*v,1.055*pow(max(v,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),v));}
${opticsGLSL}
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
  float vignette=1.-.13*pow(length((vUv-.5)*vec2(.8,.6)),2.);
  vec2 screenUV=vec2(gl_FragCoord.x/uResolution.x,1.-gl_FragCoord.y/uResolution.y);vec2 sceneUV=vec2(screenUV.x,(screenUV.y-.5)*uScaleY+.5);
  float viewAspect=uResolution.x/uResolution.y,plateAspect=uPlateSize.x/uPlateSize.y;
  vec2 cover=vec2(min(1.,viewAspect/plateAspect),min(1.,plateAspect/viewAspect));vec2 plateUV=(screenUV-.5)*cover+.5;
  float visible=visibility(sceneUV);float clearScene=smoothstep(.55,1.,uTransition);
  // Keep foreground reflection/fibre continuity; plate stays fixed in screen space.
  vec3 membrane=color*vignette;vec3 behind=plateAt(plateUV)*mix(.78,1.,clearScene);
  float attenuation=mix(.60,1.,clearScene);float blend=clamp(visible*attenuation,0.,1.);
  vec3 composite=membrane*(1.-blend*.78)+behind*blend;
  if(uTransition>=.999)composite=plateAt(plateUV);
  if(uDebug>.5)composite=vec3(visible);
  outColor=vec4(srgb(composite),1.);
}
`;

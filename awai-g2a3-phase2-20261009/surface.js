// Authored rest geometry only. No Clear/Dramatic/Smooth deformation path.
export const ridges={pc:[[0,.19],[.25,.49],[.5,.68],[.75,.82],[1,.95]],sp:[[0,-.34],[.25,.19],[.5,.64],[.75,.94],[1,1.10]]};
export const defaults={};export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function ridgeAt(y,c){if(y<0)return c[0][1]+y*(c[1][1]-c[0][1])*4;if(y>1)return c[4][1]+(y-1)*(c[4][1]-c[3][1])*4;const t=clamp(y,0,.999999)*4,i=Math.floor(t),s=t-i,p0=c[Math.max(0,i-1)][1],p1=c[i][1],p2=c[i+1][1],p3=c[Math.min(4,i+2)][1];return .5*((2*p1)+(-p0+p2)*s+(2*p0-5*p1+4*p2-p3)*s*s+(-p0+3*p1-3*p2+p3)*s*s*s);}
export function frameFor(w,h){const portrait=w/h<.8,aspect=portrait?948/1659:1659/948;return{portrait,aspect,scaleY:aspect/(w/h),controls:ridges[portrait?'sp':'pc']};}
export function surfacePoint(uv,_hit,_amount,frame){const d=(uv[0]-ridgeAt(uv[1],frame.controls))*frame.aspect,width=d<0?.039:.22;return[uv[0],uv[1],.092*Math.exp(-Math.pow(d/width,2))+.022*Math.tanh(d*5)];}
export const surfaceGLSL=`
uniform vec4 uRidge;uniform float uRidgeEnd,uAspect,uScaleY,uSmooth,uAmount;
float control(int i){if(i<=0)return uRidge.x;if(i==1)return uRidge.y;if(i==2)return uRidge.z;if(i==3)return uRidge.w;return uRidgeEnd;}
float ridge(float y){if(y<0.)return control(0)+y*(control(1)-control(0))*4.;if(y>1.)return control(4)+(y-1.)*(control(4)-control(3))*4.;float t=clamp(y,0.,.999999)*4.;int i=int(floor(t));float s=fract(t);float a=control(i-1),b=control(i),c=control(i+1),d=control(i+2);return .5*(2.*b+(-a+c)*s+(2.*a-5.*b+4.*c-d)*s*s+(-a+3.*b-3.*c+d)*s*s*s);}
vec3 surface(vec2 uv){float d=(uv.x-ridge(uv.y))*uAspect,width=d<0.?.039:.22;float base=.092*exp(-pow(d/width,2.))+.022*tanh(d*5.);return vec3(uv*vec2(uAspect,1.),base);}
`;

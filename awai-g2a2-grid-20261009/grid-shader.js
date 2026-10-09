// Delta-only texture: the authored rest surface stays analytic and unchanged.
export const gridGLSL=`
uniform float uGrid;uniform sampler2D uGridTex;uniform vec2 uGridSize;
vec4 cubicWeights(float s){return vec4(-.5*s+s*s-.5*s*s*s,1.-2.5*s*s+1.5*s*s*s,.5*s+2.*s*s-1.5*s*s*s,-.5*s*s+.5*s*s*s);}
vec4 cubicDerivative(float s){return vec4(-.5+2.*s-1.5*s*s,-5.*s+4.5*s*s,.5+4.*s-4.5*s*s,-s+1.5*s*s);}
vec3 restGeometry(vec2 uv){float d=(uv.x-ridge(uv.y))*uAspect;float width=d<0.?.039:.22;return vec3(uv.x*uAspect,uv.y,.092*exp(-pow(d/width,2.))+.022*tanh(d*5.));}
void gridGeometry(vec2 uv,out vec3 p,out vec3 dx,out vec3 dy){
 vec2 screenUV=clamp(vec2(uv.x,(uv.y-.5)/uScaleY+.5),0.,1.);
 vec2 t=screenUV*(uGridSize-1.);ivec2 cell=ivec2(floor(t));vec2 s=fract(t);
 vec4 wx=cubicWeights(s.x),wy=cubicWeights(s.y),ux=cubicDerivative(s.x),uy=cubicDerivative(s.y);
 vec3 delta=vec3(0.),du=vec3(0.),dv=vec3(0.);
 for(int j=0;j<4;j++)for(int i=0;i<4;i++){ivec2 q=clamp(cell+ivec2(i-1,j-1),ivec2(0),ivec2(uGridSize)-1);vec3 v=texelFetch(uGridTex,q,0).xyz;delta+=v*wx[i]*wy[j];du+=v*ux[i]*wy[j];dv+=v*wx[i]*uy[j];}
 vec3 scale=vec3(uAspect,1.,1.);p=restGeometry(uv)+delta*scale;
 dx=restGeometry(uv+vec2(.0008,0.))-restGeometry(uv-vec2(.0008,0.))+du*scale*(uGridSize.x-1.)*.0016;
 dy=restGeometry(uv+vec2(0.,.0008))-restGeometry(uv-vec2(0.,.0008))+dv*scale*(uGridSize.y-1.)/uScaleY*.0016;
}
`;

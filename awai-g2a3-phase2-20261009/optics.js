// Independent visibility field: scene coordinates, never solver displacement.
export const opticsGLSL=`
uniform sampler2D uPlate;uniform vec2 uResolution,uPlateSize,uHit;
uniform float uReveal,uTransition,uDebug;
vec3 linearColor(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 plateAt(vec2 uv){if(uv.y<0.||uv.y>1.)return vec3(0.);vec3 c=vec3(0.);for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){float w=(x==0?2.:1.)*(y==0?2.:1.);c+=linearColor(texture(uPlate,uv+vec2(x,y)*1.2/uPlateSize).rgb)*w/16.;}return c;}
float visibility(vec2 uv){
 float slope=(ridge(uHit.y+.002)-ridge(uHit.y-.002))/.004*uAspect;
 vec2 along=normalize(vec2(slope,1.)),across=vec2(along.y,-along.x),delta=(uv-uHit)*vec2(uAspect,1.);
 float a=dot(delta,along),b=dot(delta,across);
 float drift=.016*sin(a*12.+.8)+.036*a;
 float width=.027+.031*smoothstep(-.13,.22,a)+.009*noise(vec2(a*17.+7.,2.));
 float side=b-drift;float widthSide=side<0.?width*1.6:width*.66;
 float ribbon=1.-smoothstep(widthSide*.1,widthSide*1.7,abs(side));
 float length=smoothstep(-.27,-.09,a)*(1.-smoothstep(.12,.46,a));
 float threads=.56+.44*smoothstep(.2,.8,noise(vec2(a*13.,b*195.)));
 float grainOcclusion=threads*(.74+.26*noise(uv*vec2(uAspect,1.)*vec2(62.,115.)));
 float crestD=(uv.x-ridge(uv.y))*uAspect;
 float crest=1.-.64*exp(-pow(crestD/.026,2.));
 float v=ribbon*length*grainOcclusion*crest*uReveal;
 // A quiet diagonal advance for the handoff keyframe, not a radial opening.
 float handoff=smoothstep(-.17,.17,crestD+uTransition*.91-.18);
 return max(v,handoff*smoothstep(0.,.8,uTransition));
}
`;

const VERTEX = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}`;
const FRAGMENT = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mood;
uniform float u_progress;
uniform float u_capture;
uniform vec4 u_ripples[8];
uniform sampler2D u_environment;
uniform float u_hasEnvironment;
const float R=2.17;

float wave(vec2 p){
 float t=u_time;
 float h=.012*sin(p.x*2.2+t*.29)*cos(p.y*2.6-t*.21);
 h+=.007*sin(p.x*4.7+p.y*2.8-t*.35);
 h+=.003*sin(p.x*9.4-p.y*6.2+t*.28);
 h+=.0015*sin(p.x*16.1+p.y*12.6+t*.21);
 vec2 q=p-vec2(.38,-.36);float r=length(q);
 h+=.019*sin(r*10.-t*.52)*exp(-r*.60);
 for(int i=0;i<8;i++){
  vec4 a=u_ripples[i];float age=t-a.z;
  if(age>0.&&age<10.){
   float d=length(p-a.xy);float front=d-age*.95;
   h+=a.w*.095*sin(d*15.-age*12.)*exp(-front*front*2.5)*exp(-age*.5)/(1.+d*.7);
  }
 }
 return h*smoothstep(R,R-.17,length(p));
}
vec3 environment(vec3 r,float mood){
 vec3 top=mix(vec3(.80,.76,.65),vec3(.75,.82,.80),min(mood,1.));
 top=mix(top,vec3(.16,.24,.33),max(mood-1.,0.));
 vec3 low=mix(vec3(.24,.28,.24),vec3(.045,.09,.10),min(mood,1.));
 low=mix(low,vec3(.035,.065,.12),max(mood-1.,0.));
 vec3 col=mix(low,top,smoothstep(-.16,.72,r.y));
 // Broad studio windows, reflected across the moving surface.
 float a=atan(r.z,r.x);
 float band=exp(-pow((r.y-.44)/.15,2.));
 float window=exp(-pow((a-1.9)/.85,8.));
 col+=vec3(.69,.70,.65)*band*window*1.12;
 float w2=exp(-pow((r.x+.5)/.17,2.))*smoothstep(.05,.65,r.y);
 col+=vec3(.28,.35,.34)*w2;
 float dark=exp(-pow((r.y-.23)/.042,2.))*exp(-pow((a-1.9)/1.5,4.));
 col*=1.-.66*dark;
 float strip=exp(-pow((r.y-.62)/.025,2.))*exp(-pow((a-1.6)/1.8,4.));
 col+=vec3(.48,.47,.39)*strip;
 float sun=pow(max(0.,dot(r,normalize(vec3(-.65,1.6,.7)))),120.);
 col+=sun*vec3(1.,.94,.76)*.85;
 vec3 er=r;float tilt=.35;er.yz=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*er.yz;
 vec2 envUV=vec2(fract(atan(er.z,er.x)/6.2831853+.5),acos(clamp(er.y,-1.,1.))/3.14159265);
 vec3 garden=texture2D(u_environment,envUV).rgb;
 float lum=dot(garden,vec3(.2126,.7152,.0722));garden=mix(vec3(lum),garden,.53);
 vec3 tint=mix(vec3(1.12,1.01,.85),vec3(.78,.99,1.05),min(mood,1.));
 tint=mix(tint,vec3(.27,.42,.62),max(mood-1.,0.));
 garden*=tint;
 return mix(col,garden,u_hasEnvironment*.82);
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
 float aspect=u_resolution.x/u_resolution.y;
 float mobile=1.-smoothstep(.72,.92,aspect);
 float scroll=smoothstep(0.,.8,u_progress);
 uv.x-=mix(mix(.23,.45,scroll),0.,mobile)*(1.-u_capture);
 uv.y+=mix(.02,mix(.13,0.,scroll),mobile)*(1.-u_capture);
 vec3 ro=vec3(0.,mix(4.7,3.6,scroll*(1.-u_capture)),6.4);
 vec3 target=vec3(0.,0.,0.);
 vec3 ww=normalize(target-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);
 float lens=mix(mix(mix(1.75,2.8,scroll),mix(.88,1.2,scroll),mobile),1.3,u_capture);
 vec3 rd=normalize(uv.x*uu+uv.y*vv+lens*ww);
 vec3 paper=vec3(.914,.910,.886);
 vec3 floorColor=paper;
 float tf=(-.28-ro.y)/rd.y;
 vec3 fp=ro+rd*tf;
 float shadow=exp(-dot(fp.xz,fp.xz)/3.6)*.11;
 shadow+=exp(-dot(fp.xz,fp.xz)/1.5)*.06;
 vec3 col=floorColor-shadow*vec3(.74,.7,.58);
 float t=-ro.y/rd.y;
 vec3 p=ro+rd*t;
 for(int j=0;j<7;j++){
  float ht=wave(p.xz);
  t+=(ht-p.y)/rd.y*.84;p=ro+rd*t;
 }
 float radial=length(p.xz);
 float aa=2.4/u_resolution.y;
 float mask=1.-smoothstep(R-aa,R+aa,radial);
 if(mask>0.){
  float e=.007;
  float hx=wave(p.xz+vec2(e,0.))-wave(p.xz-vec2(e,0.));
  float hz=wave(p.xz+vec2(0.,e))-wave(p.xz-vec2(0.,e));
  vec3 n=normalize(vec3(-hx/(2.*e),1.,-hz/(2.*e)));
  vec3 refl=reflect(rd,n);
  float fres=.07+.93*pow(1.-max(dot(-rd,n),0.),4.2);
  vec3 depthColor=mix(vec3(.17,.23,.20),vec3(.035,.13,.15),min(u_mood,1.));
  depthColor=mix(depthColor,vec3(.07,.14,.22),max(u_mood-1.,0.));
  vec3 water=environment(refl,u_mood);
  water=mix(depthColor,water,.76+fres*.24);
  float edge=smoothstep(R-.055,R,radial);
  water=mix(water,vec3(.19,.28,.27),edge*.35);
  float rim=exp(-pow((radial-(R-.018))/.008,2.));
  water+=rim*vec3(.36,.40,.37)*.8;
  // Slight absorption at the outer rim gives this water a tangible depth.
  water*=1.-.20*smoothstep(R-.13,R-.03,radial);
  col=mix(col,water,mask);
 }
 // A very thin, weight-bearing dark edge under the water surface.
 float tb=(-.025-ro.y)/rd.y;vec3 bp=ro+rd*tb;
 float rb=length(bp.xz);
 float bottom=(1.-smoothstep(R-.008,R+.008,rb))*(1.-mask);
 col=mix(col,vec3(.19,.25,.25),bottom*.92);
 // Subtle photographic falloff, with no grain overlay.
 col*=1.-.045*dot(uv,uv);
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

export class WaterScene {
  constructor(canvas,{reducedMotion=false,onTouch=()=>{}}={}) {
    this.canvas=canvas;this.onTouch=onTouch;this.paused=reducedMotion;this.time=12;this.mood=1;this.targetMood=1;this.progress=0;this.ripples=new Float32Array(32);this.rippleIndex=0;this.supported=false;this.last=0;this.lastPointer=0;this.running=true;this.lastInteraction=0;this.ready=Promise.resolve();
    for(let i=0;i<8;i++)this.ripples[i*4+2]=-100;
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
    this.gl=gl;
    if(gl){try{this.initGL();this.supported=true;}catch(e){console.warn('Water view unavailable:',e.message);}}
    if(!this.supported){this.makeFallback();return;}
    this.resize=this.resize.bind(this);this.resize();window.addEventListener('resize',this.resize,{passive:true});
    this.pointerHandler=this.pointer.bind(this);window.addEventListener('pointermove',this.pointerHandler,{passive:true});window.addEventListener('pointerdown',this.pointerHandler,{passive:true});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.supported=false;this.running=false;this.makeFallback();document.getElementById('interaction-state').textContent='水面を静止画で表示しています。';});
    this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
  }
  initGL(){
    const g=this.gl;
    const compile=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(s));return s;};
    this.program=g.createProgram();g.attachShader(this.program,compile(g.VERTEX_SHADER,VERTEX));g.attachShader(this.program,compile(g.FRAGMENT_SHADER,FRAGMENT));g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(this.program));g.useProgram(this.program);
    const b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),g.STATIC_DRAW);
    const p=g.getAttribLocation(this.program,'a_position');g.enableVertexAttribArray(p);g.vertexAttribPointer(p,2,g.FLOAT,false,0,0);
    this.uniforms={};for(const name of ['resolution','time','mood','progress','capture','ripples','environment','hasEnvironment'])this.uniforms[name]=g.getUniformLocation(this.program,'u_'+name+(name==='ripples'?'[0]':''));
    this.texture=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.texture);g.texImage2D(g.TEXTURE_2D,0,g.RGB,1,1,0,g.RGB,g.UNSIGNED_BYTE,new Uint8Array([180,190,185]));g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.REPEAT);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
    const image=new Image();this.ready=new Promise(resolve=>{image.onload=()=>{if(this.supported){g.bindTexture(g.TEXTURE_2D,this.texture);g.texImage2D(g.TEXTURE_2D,0,g.RGB,g.RGB,g.UNSIGNED_BYTE,image);this.hasEnvironment=1;this.dirty=true;this.draw();}resolve();};image.onerror=()=>resolve();});image.src=new URL('./assets/garden-environment.jpg',import.meta.url).href;
  }
  resize(){
    const budget=window.innerWidth<700?650000:2100000;
    const dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<700?1.25:1.5,Math.sqrt(budget/(window.innerWidth*window.innerHeight)));this.canvas.width=Math.round(window.innerWidth*dpr);this.canvas.height=Math.round(window.innerHeight*dpr);this.draw();
  }
  draw(){
    if(!this.supported||this.gl.isContextLost())return;const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.useProgram(this.program);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.texture);g.uniform1i(this.uniforms.environment,0);g.uniform1f(this.uniforms.hasEnvironment,this.hasEnvironment||0);g.uniform1f(this.uniforms.capture,this.captureMode||0);g.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height);g.uniform1f(this.uniforms.time,this.time);g.uniform1f(this.uniforms.mood,this.mood);g.uniform1f(this.uniforms.progress,this.progress);g.uniform4fv(this.uniforms.ripples,this.ripples);g.drawArrays(g.TRIANGLES,0,6);
  }
  frame(now){
    if(!this.running)return;const dt=Math.min((now-(this.last||now))/1000,.04);this.last=now;
    if(!document.hidden){if(!this.paused)this.time+=dt;const delta=this.targetMood-this.mood;if(Math.abs(delta)>.002){this.mood+=delta*Math.min(dt*3,1);}if(!this.paused||Math.abs(delta)>.002||this.dirty){this.draw();this.dirty=false;}}
    this.raf=requestAnimationFrame(this.frame);
  }
  pointer(e){
    if(!this.supported||this.paused||e.target.closest('a,button,input,select,textarea'))return;
    const now=performance.now();if(e.type==='pointermove'&&(e.pointerType==='touch'||now-this.lastPointer<80))return;
    const section=document.elementFromPoint(e.clientX,e.clientY)?.closest('section');if(!section||!['experience','garden'].includes(section.id))return;
    const w=window.innerWidth,h=window.innerHeight,asp=w/h;
    // Invert the same camera ray used by the fragment shader.
    const smooth=x=>x*x*(3-2*x),s=smooth(Math.max(0,Math.min(1,this.progress/.8))),mobile=1-smooth(Math.max(0,Math.min(1,(asp-.72)/.20)));
    const uxView=(e.clientX-w*.5)/h-(.23+.22*s)*(1-mobile),uyView=(h*.5-e.clientY)/h+.02*(1-mobile)+.13*(1-s)*mobile;
    const lens=(1.75+1.05*s)*(1-mobile)+(.88+.32*s)*mobile,cy=4.7-1.1*s,cz=6.4,len=Math.hypot(cy,cz);const ry=uyView*cz/len-lens*cy/len,rz=-uyView*cy/len-lens*cz/len;
    const t=-cy/ry;const x=uxView*t,z=cz+rz*t;
    if(Math.hypot(x,z)>2.08)return;this.lastPointer=now;this.addRipple(x/2.17,z/2.17,e.type==='pointerdown'?1:.3);
  }
  addRipple(x=0,y=0,strength=1){
    if(!this.supported)return;const i=this.rippleIndex++%8;this.ripples.set([Math.max(-1,Math.min(1,x))*2.17,Math.max(-1,Math.min(1,y))*2.17,this.time-.03,strength],i*4);this.dirty=true;
    if(performance.now()-this.lastInteraction>350){this.onTouch();this.lastInteraction=performance.now();}this.draw();
  }
  setMood(value){this.targetMood=Math.max(0,Math.min(2,Number(value)));if(this.paused){this.mood=this.targetMood;this.draw();}this.dirty=true;}
  setPaused(value){this.paused=Boolean(value);this.dirty=true;}
  setProgress(value){this.progress=value;this.dirty=true;}
  reset(){this.time=12;for(let i=0;i<8;i++)this.ripples[i*4+2]=-100;this.draw();}
  renderStill(width=1400,height=1400){
    const out=document.createElement('canvas');out.width=width;out.height=height;const ctx=out.getContext('2d');if(this.supported){const w=this.canvas.width,h=this.canvas.height;this.captureMode=1;this.canvas.width=width;this.canvas.height=height;this.draw();ctx.drawImage(this.canvas,0,0);this.canvas.width=w;this.canvas.height=h;this.captureMode=0;this.draw();}else{this.paintFallback(ctx,width,height);}return out;
  }
  makeFallback(){
    const view=document.createElement('canvas');view.width=1200;view.height=900;this.paintFallback(view.getContext('2d'),view.width,view.height);this.canvas.style.opacity='0';this.canvas.parentElement.style.backgroundImage=`url(${view.toDataURL('image/png')})`;this.canvas.parentElement.style.backgroundSize='cover';this.canvas.parentElement.style.backgroundPosition='center';
  }
  paintFallback(ctx,w,h){
    ctx.fillStyle='#e9e8e2';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*.63,h*.56);ctx.scale(1,.52);const rad=Math.min(w,h)*.39;const grad=ctx.createRadialGradient(-rad*.2,-rad*.5,0,0,0,rad);grad.addColorStop(0,'#becbc5');grad.addColorStop(.35,'#5e8588');grad.addColorStop(.7,'#3a5e67');grad.addColorStop(1,'#293e43');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,rad,0,Math.PI*2);ctx.fill();for(let i=1;i<25;i++){ctx.strokeStyle=`rgba(230,237,224,${.2*(1-i/28)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(-rad*.1,-rad*.1,i*rad/27,i*rad/27,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }
  dispose(){this.running=false;cancelAnimationFrame(this.raf);window.removeEventListener('resize',this.resize);window.removeEventListener('pointermove',this.pointerHandler);window.removeEventListener('pointerdown',this.pointerHandler);}
}

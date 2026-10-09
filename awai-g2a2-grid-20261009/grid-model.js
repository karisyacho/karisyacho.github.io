import {surfacePoint,defaults,ridgeAt,clamp} from './surface.js';

// A coarse, fixed-perimeter membrane. Positions and dynamics use screen-height
// units; only published displacements are converted to the reference UV frame.
// XPBD distance constraints follow Macklin et al., https://mmacklin.com/xpbd.pdf.
export function createGridModel(frame,width,height,options={}){
  const nx=options.nx??(frame.portrait?32:64),ny=options.ny??(frame.portrait?64:40);
  const count=(nx+1)*(ny+1),aspect=width/height,h=1/120,iterations=options.iterations??6;
  const rest=new Float64Array(count*3),pos=new Float64Array(count*3),previous=new Float64Array(count*3),velocity=new Float64Array(count*3),mass=new Float64Array(count);
  const data=new Float32Array(count*4),edges=[],bends=[];
  const stretchCompliance=options.stretchCompliance??2e-7,bendCompliance=options.bendCompliance??8e-5;
  const tether=options.tether??9,damping=options.damping??7,pressure=options.pressure??4.2;
  let revision=0,active=false,lastAmount=0,accumulator=0,elapsedSteps=0;
  const id=(x,y)=>y*(nx+1)+x;
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
    const i=id(x,y),u=x/nx,v=y/ny,uv=[u,(v-.5)*frame.scaleY+.5];
    rest[i*3]=u*aspect;rest[i*3+1]=v;rest[i*3+2]=surfacePoint(uv,[.5,.5],0,frame,defaults)[2]/frame.scaleY;
    mass[i]=x===0||x===nx||y===0||y===ny?0:1;
  }
  const edge=(a,b)=>{let d=0;for(let c=0;c<3;c++)d+=(rest[a*3+c]-rest[b*3+c])**2;edges.push(a,b,Math.sqrt(d));};
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
    const i=id(x,y);
    if(x<nx)edge(i,id(x+1,y));if(y<ny)edge(i,id(x,y+1));
    if(x<nx&&y<ny){edge(i,id(x+1,y+1));edge(id(x+1,y),id(x,y+1));}
    if(x>0&&x<nx)bends.push(id(x-1,y),i,id(x+1,y));
    if(y>0&&y<ny)bends.push(id(x,y-1),i,id(x,y+1));
  }
  const edgeData=new Float64Array(edges),bendData=new Uint32Array(bends);
  const edgeLambda=new Float64Array(edges.length/3),bendLambda=new Float64Array(bends.length);
  function reset(){pos.set(rest);previous.set(rest);velocity.fill(0);data.fill(0);active=false;accumulator=0;lastAmount=0;revision++;}
  function metrics(){
    let maxDisplacement=0,maxXY=0,maxZ=0,maxVelocity=0,maxStrain=0,meanStrain=0,boundaryError=0,finite=true;
    for(let i=0;i<count;i++){
      let d=0,v=0;for(let c=0;c<3;c++){const q=pos[i*3+c]-rest[i*3+c];d+=q*q;v+=velocity[i*3+c]**2;if(!Number.isFinite(pos[i*3+c])||!Number.isFinite(velocity[i*3+c]))finite=false;}
      maxDisplacement=Math.max(maxDisplacement,Math.sqrt(d));maxVelocity=Math.max(maxVelocity,Math.sqrt(v));
      maxXY=Math.max(maxXY,Math.hypot(pos[i*3]-rest[i*3],pos[i*3+1]-rest[i*3+1]));maxZ=Math.max(maxZ,Math.abs(pos[i*3+2]-rest[i*3+2]));
      if(!mass[i])boundaryError=Math.max(boundaryError,Math.sqrt(d));
    }
    for(let e=0;e<edgeData.length;e+=3){const a=edgeData[e]*3,b=edgeData[e+1]*3,l=edgeData[e+2],s=Math.abs(Math.hypot(pos[a]-pos[b],pos[a+1]-pos[b+1],pos[a+2]-pos[b+2])/l-1);maxStrain=Math.max(maxStrain,s);meanStrain+=s;}
    return {finite,maxDisplacement,maxXY,maxZ,maxVelocity,maxStrain,meanStrain:meanStrain/edgeLambda.length,boundaryError,steps:elapsedSteps,nodes:count,edges:edgeLambda.length,bends:bendData.length/3};
  }
  function publish(){
    for(let i=0;i<count;i++){data[i*4]=(pos[i*3]-rest[i*3])/aspect;data[i*4+1]=(pos[i*3+1]-rest[i*3+1])*frame.scaleY;data[i*4+2]=(pos[i*3+2]-rest[i*3+2])*frame.scaleY;}
    revision++;
  }
  function substep(hit,amount){
    const hx=hit[0]*aspect,hy=(hit[1]-.5)/frame.scaleY+.5;
    const slope=(ridgeAt(hit[1]+.002,frame.controls)-ridgeAt(hit[1]-.002,frame.controls))/.004*frame.aspect;
    const len=Math.hypot(slope,1),ax=slope/len,ay=1/len;
    // Smooth finite ellipse: a physical load, never an assigned XY warp or ridge path.
    const along=options.contactAlong??.19,across=options.contactAcross??.10,decay=Math.exp(-damping*h);
    previous.set(pos);
    for(let i=0;i<count;i++)if(mass[i]){
      const j=i*3,dx=pos[j]-hx,dy=pos[j+1]-hy,a=(dx*ax+dy*ay)/along,b=(dx*ay-dy*ax)/across;
      const r2=a*a+b*b,w=r2<4?Math.exp(-1.2*r2)*(1-r2/4)**2:0;
      // Pressure follows the current surface normal. Use one previous snapshot
      // for every node so the result cannot depend on integration traversal.
      const left=(i-1)*3,right=(i+1)*3,up=(i-(nx+1))*3,down=(i+(nx+1))*3;
      const tx=previous[right]-previous[left],ty=previous[right+1]-previous[left+1],tz=previous[right+2]-previous[left+2];
      const sx=previous[down]-previous[up],sy=previous[down+1]-previous[up+1],sz=previous[down+2]-previous[up+2];
      let normalX=ty*sz-tz*sy,normalY=tz*sx-tx*sz,normalZ=tx*sy-ty*sx;
      const normalLength=Math.hypot(normalX,normalY,normalZ);
      if(normalLength>1e-12){const orientation=normalZ<0?-1:1;normalX*=orientation/normalLength;normalY*=orientation/normalLength;normalZ*=orientation/normalLength;}
      else {normalX=0;normalY=0;normalZ=1;}
      const load=pressure*amount*w*h*h;
      for(let c=0;c<3;c++){velocity[j+c]=(velocity[j+c]-tether*(pos[j+c]-rest[j+c])*h)*decay;pos[j+c]+=velocity[j+c]*h;}
      pos[j]-=load*normalX;pos[j+1]-=load*normalY;pos[j+2]-=load*normalZ;
    }
    edgeLambda.fill(0);bendLambda.fill(0);
    const alpha=stretchCompliance/(h*h),beta=bendCompliance/(h*h);
    for(let iteration=0;iteration<iterations;iteration++){
      // Reverse alternate passes to reduce traversal bias.
      for(let q=0;q<edgeLambda.length;q++){
        const e=iteration%2?(edgeLambda.length-1-q):q,k=e*3,a=edgeData[k],b=edgeData[k+1],j=a*3,l=b*3,wa=mass[a],wb=mass[b];
        if(wa+wb===0)continue;
        const dx=pos[j]-pos[l],dy=pos[j+1]-pos[l+1],dz=pos[j+2]-pos[l+2],length=Math.hypot(dx,dy,dz);
        if(length<1e-12)continue;
        const dl=(-(length-edgeData[k+2])-alpha*edgeLambda[e])/(wa+wb+alpha),s=dl/length;edgeLambda[e]+=dl;
        pos[j]+=wa*s*dx;pos[j+1]+=wa*s*dy;pos[j+2]+=wa*s*dz;pos[l]-=wb*s*dx;pos[l+1]-=wb*s*dy;pos[l+2]-=wb*s*dz;
      }
      // Three-point displacement Laplacian preserves the static rest curvature.
      for(let k=0;k<bendData.length;k+=3){
        const a=bendData[k],b=bendData[k+1],c=bendData[k+2],wa=mass[a],wb=mass[b],wc=mass[c],den=wa+4*wb+wc+beta;
        if(wa+wb+wc===0)continue;
        for(let axis=0;axis<3;axis++){
          const ia=a*3+axis,ib=b*3+axis,ic=c*3+axis;
          const error=(pos[ia]-rest[ia])-2*(pos[ib]-rest[ib])+(pos[ic]-rest[ic]);
          const dl=(-error-beta*bendLambda[k+axis])/den;bendLambda[k+axis]+=dl;
          pos[ia]+=wa*dl;pos[ib]-=2*wb*dl;pos[ic]+=wc*dl;
        }
      }
    }
    for(let i=0;i<velocity.length;i++)velocity[i]=(pos[i]-previous[i])/h;
    elapsedSteps++;
  }
  function step(dt,hit=[.5,.5],amount=0){
    amount=clamp(Number.isFinite(amount)?amount:0);lastAmount=amount;
    if(amount===0&&!active)return false;
    accumulator+=clamp(Number.isFinite(dt)?dt:0,0,1/30);
    let changed=false;while(accumulator+1e-10>=h){substep(hit,amount);accumulator-=h;changed=true;}
    if(changed){const m=metrics();if(!m.finite){reset();throw new Error('Membrane solver produced a nonfinite state');}
      active=amount>0||m.maxDisplacement>2e-5||m.maxVelocity>5e-5;
      if(amount===0&&!active)reset();else publish();}
    return changed;
  }
  function settle(amount=1,hit=[.5,.5]){reset();if(amount<=0)return;for(let i=0;i<300;i++)substep(hit,clamp(amount));lastAmount=clamp(amount);active=true;publish();}
  const cubic=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  function sample(uv){
    const x=clamp(uv[0])*nx,y=clamp((uv[1]-.5)/frame.scaleY+.5)*ny,ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy,result=[0,0,0];
    for(let c=0;c<3;c++){
      const rows=[];for(let r=-1;r<=2;r++){const vals=[];for(let s=-1;s<=2;s++)vals.push(data[(clamp(iy+r,0,ny)*(nx+1)+clamp(ix+s,0,nx))*4+c]);rows.push(cubic(...vals,tx));}result[c]=cubic(...rows,ty);
    }return result;
  }
  reset();
  return {nx,ny,data,step,settle,reset,sample,diagnostics:()=>({...metrics(),amount:lastAmount,iterations,stretchCompliance,bendCompliance}),get revision(){return revision;},get active(){return active;},dispose(){active=false;}};
}

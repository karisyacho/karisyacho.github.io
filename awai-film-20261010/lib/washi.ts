import {config} from './config';
export type PaperState = 'still' | 'touch' | 'opening';
export type Density = {x:number;y:number;radius:number;strength:number};
const fields=[{x:0,y:0,scale:1,weight:.82,sx:1.07,sy:.96,angle:.12},{x:.34,y:-.17,scale:.88,weight:.27,sx:1.12,sy:.84,angle:-.4},{x:-.29,y:.22,scale:.76,weight:.19,sx:.86,sy:1.13,angle:.65}];
const falloff=[[0,1],[.12,.95],[.25,.78],[.4,.51],[.55,.26],[.7,.09],[.85,.014],[1,0]];
let fiberTexture:HTMLImageElement|null=null;
const surfaceListeners=new Set<()=>void>();
export function subscribePaperSurface(draw:()=>void){
 surfaceListeners.add(draw);
 if(!fiberTexture){fiberTexture=new Image();fiberTexture.onload=()=>{for(const redraw of surfaceListeners)redraw();};fiberTexture.src='/awai-paper/media/washi/paper-v9.webp';}
 return ()=>{surfaceListeners.delete(draw);};
}
function paperSurface(ctx:CanvasRenderingContext2D,width:number,height:number,shift=0){
 if(!fiberTexture?.naturalWidth)return;
 const pattern=ctx.createPattern(fiberTexture,'repeat');if(!pattern)return;
 // Color/material only. source-atop retains the approved reveal alpha exactly.
 ctx.save();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.44;ctx.translate(shift,0);ctx.fillStyle=pattern;ctx.fillRect(-shift,0,width,height);ctx.restore();
}

// Sample the same pressure fields for ink; change pigment color, not opacity.
export function densityAt(px:number,py:number,d:Density){
 let remaining=1;
 for(const f of fields){const dx=px-d.x-d.radius*f.x,dy=py-d.y-d.radius*f.y,c=Math.cos(f.angle),s=Math.sin(f.angle);
  const distance=Math.hypot((dx*c+dy*s)/f.sx,(-dx*s+dy*c)/f.sy)/Math.max(1,d.radius*f.scale*1.65);
  let v=0;for(let i=1;i<falloff.length;i++){const [a,av]=falloff[i-1],[b,bv]=falloff[i];if(distance<=b){v=av+(bv-av)*Math.max(0,(distance-a)/(b-a));break;}}
  remaining*=1-v*config.transmission*f.weight*d.strength;
 }return 1-remaining;
}
export function inkColor(px:number,py:number,d:Density){const mix=densityAt(px,py,d)*config.inkSink;return `rgb(${[53,54,49].map((v,i)=>Math.round(v+([229,227,220][i]-v)*mix)).join(' ')})`;}

// Density fields, without clipping paths or a lip around the transparent area.
export function renderPaperDensity(ctx:CanvasRenderingContext2D,width:number,height:number,dpr:number,density?:Density){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 ctx.clearRect(0,0,width,height);ctx.fillStyle='#e5e3dc';ctx.fillRect(0,0,width,height);
 if(!density||density.strength<.001){paperSurface(ctx,width,height);return;}
 const {x,y,radius:r,strength:s}=density;
 ctx.save();ctx.globalCompositeOperation='destination-out';
 for(const f of fields){ctx.save();ctx.translate(x+r*f.x,y+r*f.y);ctx.rotate(f.angle);ctx.scale(f.sx,f.sy);
  const g=ctx.createRadialGradient(0,0,0,0,0,r*f.scale*1.65);
  for(const [offset,value] of falloff)g.addColorStop(offset,`rgba(0,0,0,${value*config.transmission*f.weight*s})`);
  ctx.fillStyle=g;ctx.fillRect(-r*1.7,-r*1.7,r*3.4,r*3.4);ctx.restore();
 }
 ctx.restore();
 // Sparse residual fibers only in the diffuse transition, never a contour.
 ctx.save();ctx.lineWidth=.35;
 for(let i=0;i<110;i++){const a=i*2.399963,q=.5+(i%31)/31*.72,fx=x+Math.cos(a)*r*q*1.05,fy=y+Math.sin(a)*r*q*.97;
  const visibility=Math.exp(-Math.pow((q-.76)/.24,2))*.09*s;
  ctx.strokeStyle=`rgba(241,239,229,${visibility})`;ctx.beginPath();ctx.moveTo(fx,fy);ctx.quadraticCurveTo(fx+Math.sin(i*2.7)*2,fy+1,fx+Math.sin(i*2.7)*4,fy+2+Math.cos(i));ctx.stroke();
 }ctx.restore();paperSurface(ctx,width,height);
}

// Two intact paper faces translate away from their shared seam. The two
// edges are matching profiles, not a feathered window or torn contours.
export function renderOpening(ctx:CanvasRenderingContext2D,width:number,height:number,travel=width*.115,visibility=1){
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,width,height);ctx.fillStyle='#e5e3dc';
 const seam=(y:number)=>width*.52+Math.sin(y/height*Math.PI*1.6)*1.4+Math.sin(y/height*Math.PI*3+.4)*.45;
 ctx.beginPath();ctx.moveTo(-width,0);ctx.lineTo(seam(0)-travel,0);for(let i=1;i<=64;i++){const y=height*i/64;ctx.lineTo(seam(y)-travel,y);}ctx.lineTo(-width,height);ctx.closePath();ctx.fill();ctx.save();ctx.clip();paperSurface(ctx,width,height,-travel);ctx.restore();
 ctx.beginPath();ctx.moveTo(width*2,0);ctx.lineTo(seam(0)+travel,0);for(let i=1;i<=64;i++){const y=height*i/64;ctx.lineTo(seam(y)+travel,y);}ctx.lineTo(width*2,height);ctx.closePath();ctx.fill();ctx.save();ctx.clip();paperSurface(ctx,width,height,travel);ctx.restore();
 if(visibility<1){ctx.globalAlpha=1-visibility;ctx.fillRect(0,0,width,height);paperSurface(ctx,width,height);}ctx.restore();
}

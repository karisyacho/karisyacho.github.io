import {vertexSource,fragmentSource} from './material.js';
export function createRenderer(canvas){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)throw new Error('WebGL2 unavailable');
  const shaders=[],buffers=[];let program,vao,disposed=false;
  function dispose(){if(disposed)return;disposed=true;for(const b of buffers)gl.deleteBuffer(b);for(const s of shaders)gl.deleteShader(s);if(vao)gl.deleteVertexArray(vao);if(program)gl.deleteProgram(program);}
  try{
    function shader(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    const nx=256,ny=192,vertices=new Float32Array((nx+1)*(ny+1)*2),indices=new Uint16Array(nx*ny*6);
    let k=0;for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){vertices[k++]=x/nx;vertices[k++]=y/ny;}
    k=0;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*(nx+1)+x;indices.set([i,i+1,i+nx+1,i+1,i+nx+2,i+nx+1],k);k+=6;}
    vao=gl.createVertexArray();gl.bindVertexArray(vao);const vb=gl.createBuffer(),ib=gl.createBuffer();buffers.push(vb,ib);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'aUv');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    const names=['Ridge','RidgeEnd','Aspect','ScaleY','Hit','Amount','Depth','Range','Ratio','Amber','Glow','Transmission','Mode'];const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,'u'+n)]));
    function draw(frame,settings,state){if(disposed||gl.isContextLost())return;gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.bindVertexArray(vao);gl.uniform4fv(uniforms.Ridge,frame.controls.slice(0,4).map(c=>c[1]));gl.uniform1f(uniforms.RidgeEnd,frame.controls[4][1]);gl.uniform1f(uniforms.Aspect,frame.aspect);gl.uniform1f(uniforms.ScaleY,frame.scaleY);gl.uniform2fv(uniforms.Hit,state.hit);for(const [key,value] of Object.entries({Amount:state.amount,Depth:settings.depth,Range:settings.range,Ratio:settings.ratio,Amber:settings.amber,Glow:state.glow,Transmission:settings.transmission,Mode:state.mode==='B'?1:0}))gl.uniform1f(uniforms[key],value);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);}
    return {draw,dispose,gl,mesh:{vertices:vertices.length/2,triangles:indices.length/3,bufferBytes:vertices.byteLength+indices.byteLength}};
  }catch(error){dispose();throw error;}
}

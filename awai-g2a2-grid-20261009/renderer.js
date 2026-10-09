import {smoothWarp} from './surface.js';
import {vertexSource,fragmentSource} from './material.js';
export function createRenderer(canvas,quality='full'){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)throw new Error('WebGL2 unavailable');
  const shaders=[],buffers=[];let program,vao,texture,gridRevision=-1,gridIdentity=null,disposed=false;
  function dispose(){if(disposed)return;disposed=true;for(const b of buffers)gl.deleteBuffer(b);for(const s of shaders)gl.deleteShader(s);if(texture)gl.deleteTexture(texture);if(vao)gl.deleteVertexArray(vao);if(program)gl.deleteProgram(program);}
  try{
    function shader(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    const nx=quality==='balanced'?192:256,ny=quality==='balanced'?144:192,vertices=new Float32Array((nx+1)*(ny+1)*2),indices=new Uint16Array(nx*ny*6);
    let k=0;for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){vertices[k++]=x/nx;vertices[k++]=y/ny;}
    k=0;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*(nx+1)+x;indices.set([i,i+1,i+nx+1,i+1,i+nx+2,i+nx+1],k);k+=6;}
    vao=gl.createVertexArray();gl.bindVertexArray(vao);const vb=gl.createBuffer(),ib=gl.createBuffer();buffers.push(vb,ib);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'aUv');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,1,1,0,gl.RGBA,gl.FLOAT,new Float32Array(4));
    const gridUniform=gl.getUniformLocation(program,'uGrid'),gridSize=gl.getUniformLocation(program,'uGridSize'),gridTexture=gl.getUniformLocation(program,'uGridTex');
    const names=['Ridge','RidgeEnd','Aspect','ScaleY','Hit','Amount','Depth','Range','Ratio','Tension','Pull','Spread','Bend','Smooth','Compression','Amber','Glow','Transmission','Mode','OpticalGain'];const warpUniform=gl.getUniformLocation(program,'uWarp[0]');const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,'u'+n)]));
    function draw(frame,settings,state,grid=null){
      if(disposed||gl.isContextLost())return;
      const gridMode=Boolean(settings.grid&&grid),deforming=gridMode&&grid.active;
      gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(gridTexture,0);gl.uniform1f(gridUniform,deforming?1:0);
      if(gridMode){gl.uniform2f(gridSize,grid.nx+1,grid.ny+1);if(gridIdentity!==grid){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,grid.nx+1,grid.ny+1,0,gl.RGBA,gl.FLOAT,grid.data);gridIdentity=grid;gridRevision=grid.revision;}else if(gridRevision!==grid.revision){gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,grid.nx+1,grid.ny+1,gl.RGBA,gl.FLOAT,grid.data);gridRevision=grid.revision;}}
      gl.uniform4fv(uniforms.Ridge,frame.controls.slice(0,4).map(c=>c[1]));gl.uniform1f(uniforms.RidgeEnd,frame.controls[4][1]);gl.uniform1f(uniforms.Aspect,frame.aspect);gl.uniform1f(uniforms.ScaleY,frame.scaleY);gl.uniform2fv(uniforms.Hit,state.hit);
      if(settings.smooth&&!gridMode)gl.uniform2fv(warpUniform,smoothWarp(frame,settings,state.hit).flat());
      for(const [key,value] of Object.entries({Amount:gridMode&&!deforming?0:state.amount,Depth:settings.depth,Range:settings.range,Ratio:settings.ratio,Tension:settings.tension,Pull:settings.pull,Spread:settings.spread,Bend:settings.bend,Smooth:settings.smooth||0,Compression:settings.compression||0,Amber:settings.amber,Glow:state.lightEnabled===false?0:state.glow,Transmission:settings.transmission,Mode:state.mode==='B'?1:0,OpticalGain:settings.opticalGain}))gl.uniform1f(uniforms[key],value);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    }
    return {draw,dispose,gl,mesh:{vertices:vertices.length/2,triangles:indices.length/3,bufferBytes:vertices.byteLength+indices.byteLength}};
  }catch(error){dispose();throw error;}
}

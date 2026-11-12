// One GPU surface for the moving sheet. The readable, interactive pages stay HTML.
export function createPageRenderer(parent){
 const canvas=document.createElement('canvas');canvas.className='leaf-canvas';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:false});
 if(!gl)return null;
 const vertex=`attribute vec2 position;attribute vec2 uv;attribute float shade;varying vec2 vUv;varying float vShade;void main(){vUv=uv;vShade=shade;gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision mediump float;uniform sampler2D front;uniform sampler2D back;varying vec2 vUv;varying float vShade;void main(){vec4 c=gl_FrontFacing?texture2D(front,vUv):texture2D(back,vec2(1.-vUv.x,vUv.y));c.rgb=mix(c.rgb,vec3(.21,.15,.09),vShade);gl_FragColor=c;}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
 gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const[name,size,offset]of [['position',2,0],['uv',2,8],['shade',1,16]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,20,offset);}
 gl.uniform1i(gl.getUniformLocation(program,'front'),0);gl.uniform1i(gl.getUniformLocation(program,'back'),1);
 const textures=[];let ready=false,lost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;ready=false;canvas.hidden=true;parent.querySelector('.turning-page').classList.remove('gpu-page');});
 parent.parentElement.append(canvas);
 function setFaces(front,back){
  if(lost)return false;
  for(let i=0;i<2;i++){
   if(textures[i])gl.deleteTexture(textures[i]);const texture=gl.createTexture();textures[i]=texture;
   gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i?back:front);
  }
  ready=true;return true;
 }
 const columns=32,vertices=new Float32Array(columns*6*5);
 function draw(turn,pageWidth,height){
  if(!ready||lost)return false;
  if(turn<=.001||turn>=.999){canvas.hidden=true;return true;}
  const width=innerWidth,ratio=Math.min(devicePixelRatio||1,2);
  const dw=Math.round(width*ratio),dh=Math.round(height*ratio);
  if(canvas.width!==dw||canvas.height!==dh){canvas.width=dw;canvas.height=dh;gl.viewport(0,0,dw,dh);}
  canvas.hidden=false;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  const angle=Math.PI*turn,amplitude=Math.sin(angle)*.72,step=pageWidth/columns,pivot=width<=700?0:width/2,perspective=2200;
  const points=[];let x=0,z=0;
  for(let i=0;i<=columns;i++){
   if(i){const bend=-amplitude*Math.sin((i-.5)/columns*Math.PI*.65);x+=Math.cos(bend)*step;z-=Math.sin(bend)*step;}
   const gx=Math.cos(angle)*x-Math.sin(angle)*z,gz=Math.sin(angle)*x+Math.cos(angle)*z;
   const scale=perspective/(perspective-gz),sx=width/2+(pivot+gx-width/2)*scale;
   points.push({x:sx/width*2-1,top:scale,bottom:-scale,u:i/columns,shade:Math.abs(Math.sin(-amplitude*Math.sin(i/columns*Math.PI*.65)))*.22});
  }
  let at=0;
  function point(p,bottom){vertices[at++]=p.x;vertices[at++]=bottom?p.bottom:p.top;vertices[at++]=p.u;vertices[at++]=bottom?1:0;vertices[at++]=p.shade;}
  for(let i=0;i<columns;i++){const l=points[i],r=points[i+1];point(l,false);point(l,true);point(r,false);point(r,false);point(l,true);point(r,true);}
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,columns*6);return true;
 }
 function warmUp(pageWidth,height){if(!ready)return;draw(.5,pageWidth,height);gl.finish();canvas.hidden=true;}
 return{setFaces,draw,warmUp,hide:()=>{canvas.hidden=true;}};
}

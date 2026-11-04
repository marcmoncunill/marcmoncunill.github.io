/* A³ liquid surface, IOR 1.333. Broad, irregular refraction and moving surface
 * normals; the scroll head and all document geometry remain independent of time.
 * Clear transmission over white, narrow reflections and detached water beads.
 */
(() => {
 const vertex=`#version 300 es
 in vec2 aPosition;
 out vec2 vUV;
 void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
 const fragment=`#version 300 es
 precision highp float;
 uniform sampler2D uMask;
 uniform vec2 uSize;
 uniform float uScale;
 uniform float uTime;
 uniform float uDocY;
 uniform vec2 uEnd;
 uniform float uSpread;
 uniform float uHead;
 in vec2 vUV;
 out vec4 outColor;
 float field(vec2 px){return texture(uMask,px/uSize).a;}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
 float surface(vec2 p){return noise(p)*.62+noise(p*2.17+8.3)*.25+noise(p*4.31-3.7)*.13;}
 float edge(vec2 p,vec2 d){
  float lo=0.,hi=1.;
  for(int i=0;i<8;i++){if(field(p+d*hi*uScale)<.48)break;lo=hi;hi*=2.;}
  for(int i=0;i<6;i++){float mid=(lo+hi)*.5;if(field(p+d*mid*uScale)>.48)lo=mid;else hi=mid;}
  return (lo+hi)*.5;
 }
 void main(){
  vec4 cover=texture(uMask,vUV);
  if(cover.a<.015||cover.g<.01)discard;
  vec2 p=vUV*uSize;
  vec2 dirs[8]=vec2[8](vec2(1.,0.),vec2(.707,.707),vec2(0.,1.),vec2(-.707,.707),vec2(-1.,0.),vec2(-.707,-.707),vec2(0.,-1.),vec2(.707,-.707));
  float nearest=100.;vec2 direction=vec2(1.,0.);vec2 gradient=vec2(0.);
  for(int j=0;j<8;j++){
   float e=edge(p,dirs[j]);
   gradient+=dirs[j]/pow(max(.5,e),3.);
   if(e<nearest){nearest=e;direction=dirs[j];}
  }
  if(length(gradient)>.00001)direction=normalize(gradient);
  nearest=edge(p,direction);
  float opposite=edge(p,-direction);
  float lateral=clamp((opposite-nearest)/max(1.,opposite+nearest),0.,.999);
  vec2 css=vec2(p.x/uScale,uDocY+(uSize.y-p.y)/uScale);
  float tip=1.-smoothstep(0.,30.,uHead-css.y);
  // The advancing edge is an open, breaking jet, not a reflective rounded lid.
  lateral*=1.-tip*.78;
  vec2 flow=css*vec2(.018,.014)-vec2(uTime*.12,uTime*1.65);
  float wave=surface(flow);
  vec2 slope=vec2(surface(flow+vec2(.07,0.))-surface(flow-vec2(.07,0.)),surface(flow+vec2(0.,.07))-surface(flow-vec2(0.,.07)));
  lateral=clamp(lateral+(wave-.5)*.14,0.,.998);
  vec3 N=normalize(vec3(direction*lateral+slope*.48,sqrt(max(.001,1.-lateral*lateral))));
  float wash=step(uEnd.y-4.,css.y)*step(css.y,uEnd.y+65.)*step(.001,uSpread);
  vec2 local=css-uEnd-vec2(0.,25.);
  float distance=length(local*vec2(.20,1.));
  float ripples=sin(distance*.12-uTime*5.)*.10*exp(-distance*.008);
  if(wash>.5)N=normalize(vec3(direction*pow(lateral,5.)*.72+slope*.34+normalize(local+vec2(.01))*ripples,1.));
  vec3 R=reflect(vec3(0.,0.,-1.),N);
  float f0=pow((1.333-1.)/(1.333+1.),2.);
  float fresnel=f0+(1.-f0)*pow(1.-N.z,5.);
  // Wide softbox reflections bend across an irregular liquid surface. The
  // moving highlights travel through the flow, never moving its leading edge.
  float lightX=R.x+(wave-.5)*.35;
  float key=smoothstep(-.42,.24,lightX)*(1.-smoothstep(.64,1.,lightX));
  float soft=exp(-pow((R.x+.72+(wave-.5)*.2)*4.,2.))*.5;
  vec3 environment=mix(vec3(.30,.38,.41),vec3(1.),clamp(key+soft,0.,1.));
  float flag=exp(-pow((R.x+.38+(wave-.5)*.75)*13.,2.));
  float strip=exp(-pow((R.x+.32+(wave-.5)*.75)*28.,2.));
  environment=clamp(environment-vec3(.32)*flag+vec3(.17)*strip,0.,1.);
  vec3 ground=vec3(1.);
  float thickness=sqrt(max(0.,1.-lateral*lateral));
  float refract=surface(flow+N.xy*2.7);
  float caustic=pow(clamp(1.-abs(refract-.58)*3.8,0.,1.),4.);
  vec3 transmission=mix(ground,vec3(.80,.88,.90),.24*thickness)*(.985+.015*refract);
  float reflection=clamp(.16+fresnel*.90+pow(abs(wave-.5)*2.,3.)*.10,0.,.94);
  vec3 colour=mix(transmission,environment,reflection);
  colour+=vec3(.010)*caustic*(1.-fresnel);
  colour+=vec3(.035)*sin(distance*.12-uTime*5.)*exp(-distance*.008)*wash;
  float glint=pow(max(0.,dot(N,normalize(vec3(-.38,.45,1.)))),65.);
  colour+=vec3(.045)*glint;
  // Clear centre, narrow silver-grey edges. No opaque blue core.
  float rim=exp(-nearest*.72);
  colour-=vec3(.14,.12,.11)*rim*(1.-tip*.8);
  float alpha=cover.a*cover.g*(.21+.58*fresnel+.13*rim+.18*flag+.07*wash);
  outColor=vec4(colour,alpha);
 }`;
 window.createA3WaterOptics=canvas=>{
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl)return null;
  const shaders=[];
  function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));shaders.push(s);return s;}
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(program);const pos=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const size=gl.getUniformLocation(program,'uSize'),scale=gl.getUniformLocation(program,'uScale'),time=gl.getUniformLocation(program,'uTime'),docY=gl.getUniformLocation(program,'uDocY'),end=gl.getUniformLocation(program,'uEnd'),spread=gl.getUniformLocation(program,'uSpread');
  const head=gl.getUniformLocation(program,'uHead');
  let uploaded=false;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  return {
   render(mask,dpr,options={}){
    if(gl.isContextLost())return;
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);
    if(options.refresh||!uploaded){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mask);uploaded=true;}
    gl.uniform2f(size,canvas.width,canvas.height);gl.uniform1f(scale,dpr);gl.uniform1f(time,options.time||0);gl.uniform1f(docY,options.docY||0);gl.uniform2f(end,...(options.end||[0,1e7]));gl.uniform1f(head,options.head??1e7);gl.uniform1f(spread,options.spread||0);gl.drawArrays(gl.TRIANGLES,0,6);
   },
   destroy(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();}
  };
 };
})();

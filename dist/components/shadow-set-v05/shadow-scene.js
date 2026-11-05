import * as THREE from './vendor/three.module.js';
import Matter from './vendor/matter.esm.js';
import { createGlassMaterial,createGlassReflection,createReflectionEnvironment } from './glass-material.js';

const { Engine, Bodies, Body, Composite, Events, Vertices, Query }=Matter;
// Matter's default resting threshold assumes larger world units. These CAD bodies
// use millimetres: preserve elastic impacts at cursor speeds, while tiny idle contacts stay quiet.
// This is a pinned Matter.js 0.20.0 solver setting, not a vendor-source modification.
Matter.Resolver._restingThresh=.08;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STEP=1000/120;
const DEFAULTS={
  background:'#f6f5f0', blue:'#316fd4', orange:'#dc5d38',
  idleSpeed:.018, pointerRadius:70, pointerStrength:.014,
  restitution:.94, maxPixelRatio:1.6, assets:new URL('./assets/pieces.json',import.meta.url),
};

// Same millimetre scale for every piece; these are placements, never geometry changes.
const DESKTOP=[
  ['rodona-petita','blue',.075,.16,.25],
  ['lluna','orange',.23,.17,-.38],
  ['rectangle-unio','blue',.409,.13,-.35],
  ['estrella','orange',.59,.15,.30],
  ['rodona-petita','orange',.76,.16,-.2],
  ['triangle','blue',.90,.18,-.35],
  ['bolet','blue',.098,.51,-.4],
  ['cercle-gran','orange',.89,.53,.23],
  ['estrella','orange',.17,.83,-.2],
  ['base','blue',.383,.85,Math.PI/2-.08],
  ['rectangle-unio','orange',.55,.87,.22],
  ['triangle','blue',.685,.84,.22],
  ['lluna','orange',.91,.86,.6],
  ['rodona-petita','blue',.78,.76,.1],
  ['bolet','orange',.42,.34,.3],
  ['lluna','blue',.66,.46,-.7],
  ['rodona-petita','blue',.48,.56,.4],
  ['rectangle-unio','orange',.52,.27,-.15],
  ['cercle-gran','blue',.30,.66,.7],
  ['triangle','orange',.80,.38,.2],
  ['estrella','blue',.54,.77,-.2],
  ['bolet','orange',.76,.67,.6],
  ['rodona-petita','orange',.34,.48,-.1],
  ['base','blue',.13,.70,.7],
  ['rectangle-unio','blue',.63,.62,-.4],
  ['triangle','orange',.37,.15,-.6],
  ['rodona-petita','blue',.95,.38,.15],
  ['lluna','orange',.06,.34,-.4],
];
const MOBILE=[
  ['lluna','orange',.20,.14,-.3],
  ['rodona-petita','blue',.55,.07,.2],
  ['triangle','blue',.80,.17,.35],
  ['rectangle-unio','orange',.09,.31,-.4],
  ['rodona-petita','orange',.90,.32,-.2],
  ['bolet','blue',.19,.72,-.5],
  ['cercle-gran','orange',.76,.73,.3],
  ['estrella','orange',.38,.88,.2],
  ['base','blue',.78,.91,Math.PI/2-.12],
  ['rectangle-unio','blue',.12,.91,.1],
  ['rodona-petita','orange',.37,.35,.4],
  ['lluna','blue',.76,.47,-.5],
  ['triangle','orange',.24,.53,.2],
  ['rectangle-unio','blue',.53,.24,-.1],
  ['estrella','blue',.51,.68,.15],
  ['rodona-petita','blue',.12,.38,-.2],
  ['rectangle-unio','orange',.90,.58,.25],
  ['rodona-petita','orange',.62,.89,-.1],
];

export async function createShadowSet(root,options={}){
  if(options.models)return new ShadowSet(root,options.models,{...DEFAULTS,...options});
  const response=await fetch(options.assets || DEFAULTS.assets);
  if(!response.ok)throw new Error(`Cannot load CAD geometry (${response.status})`);
  return new ShadowSet(root,await response.json(),{...DEFAULTS,...options});
}

class ShadowSet {
  constructor(root,models,config){
    this.root=root; this.stage=root.querySelector('.shadow-stage');
    this.copy=root.querySelector('.shadow-copy');this.config=config;
    this.models=new Map(models.map(m=>[m.id,m]));
    this.abort=new AbortController();this.items=[];this.walls=[];
    this.paused=false;this.destroyed=false;this.visible=true;this.time=0;
    this.stats={pieceCollisions:0,boundaryCollisions:0,pointerPushes:0,frames:0};
    this.motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion=config.autoMotion?false:this.motionQuery.matches;
    this.engine=Engine.create({gravity:{x:0,y:0},positionIterations:8,velocityIterations:8,enableSleeping:false});
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(config.background);
    this.camera=new THREE.PerspectiveCamera(32,1,.1,3000);
    this.camera.position.set(0,0,1000);this.camera.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,config.maxPixelRatio));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.NoToneMapping;
    this.renderer.setClearColor(config.background,1);
    this.renderer.domElement.setAttribute('aria-hidden','true');
    this.stage.append(this.renderer.domElement);
    this.reflectionEnvironment=createReflectionEnvironment(this.renderer);
    // Clear tinted glass: angle-dependent absorption through the original 3 mm mesh.
    // The tint comes from the supplied renders; white specular bands are excluded.
    this.materials={};this.reflectionMaterials={};
    for(const name of ['blue','orange']){
      this.materials[name]=[
        createGlassMaterial(config[name],3,false),
        createGlassMaterial(config[name],3,true),
      ];
      this.reflectionMaterials[name]=createGlassReflection(config[name],this.reflectionEnvironment.texture);
    }
    // Only genuine crease/boundary edges: no triangle diagonals. Disabling the
    // depth test on these lines keeps the rear perimeter visible through its own plate.
    this.edgeMaterial=new THREE.LineBasicMaterial({color:'#121b25',transparent:true,opacity:1,vertexColors:true,
      depthTest:false,depthWrite:false,toneMapped:false});
    this.pointer={x:-9999,y:-9999,targetX:-9999,targetY:-9999,active:false,lastMove:0};
    this.keyboardCursor=document.createElement('span');
    this.keyboardCursor.className='shadow-keyboard-cursor';this.keyboardCursor.hidden=true;
    this.stage.append(this.keyboardCursor);
    const on=(target,type,fn,opts={})=>target.addEventListener(type,fn,{...opts,signal:this.abort.signal});
    on(this.root,'pointermove',e=>this.onPointer(e),{passive:true});
    on(this.root,'pointerdown',e=>this.onPointer(e,true),{passive:true});
    on(this.root,'pointerleave',()=>{this.pointer.active=false;});
    on(this.root,'pointercancel',()=>{this.pointer.active=false;});
    on(this.stage,'keydown',e=>this.onKey(e));
    on(this.stage,'blur',()=>{this.keyboardCursor.hidden=true;this.pointer.active=false;});
    on(document,'visibilitychange',()=>{this.visible=!document.hidden;this.lastFrame=0;this.accumulator=0;});
    on(this.motionQuery,'change',e=>{
      if(this.config.autoMotion)return;
      this.reducedMotion=e.matches;
      for(const item of this.items){Body.setVelocity(item.body,{x:0,y:0});Body.setAngularVelocity(item.body,0);}
    });
    on(this.renderer.domElement,'webglcontextlost',e=>{
      e.preventDefault();this.setPaused(true);this.root.dataset.ready='false';
      this.root.querySelector('.shadow-status').textContent='La vista 3D s’ha aturat. Es mostra la composició estàtica.';
    });
    Events.on(this.engine,'collisionStart',event=>{
      for(const pair of event.pairs){
        if(pair.bodyA.isStatic||pair.bodyB.isStatic)this.stats.boundaryCollisions++;
        else this.stats.pieceCollisions++;
      }
    });
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(root);
    this.intersection=new IntersectionObserver(entries=>{this.inView=entries[0].isIntersecting;this.lastFrame=0;this.accumulator=0;});
    this.inView=true;this.intersection.observe(root);
    this.resize();
    this.root.dataset.ready='true';
    this.lastFrame=0;this.accumulator=0;
    this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
  }

  get paused(){return this._paused;}
  set paused(value){this._paused=value;}

  geometry(model,center){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(model.positions,3));
    const byMaterial=[[],[]];
    for(const [start,count,material] of model.groups)byMaterial[material].push(...model.indices.slice(start,start+count));
    geometry.setIndex([...byMaterial[0],...byMaterial[1]]);
    geometry.addGroup(0,byMaterial[0].length,0);
    geometry.addGroup(byMaterial[0].length,byMaterial[1].length,1);
    geometry.translate(-center.x,center.y,0);
    geometry.computeVertexNormals();geometry.computeBoundingSphere();
    return geometry;
  }

  makeBody(model){
    const parts=model.collision.map(poly=>{
      const vertices=poly.map(([x,y])=>({x,y}));
      const center=Vertices.centre(vertices);
      return Body.create({vertices,position:center,density:.00118,slop:.04,
        restitution:this.config.restitution,friction:0,frictionStatic:0});
    });
    // Mark shared triangulation edges as internal. The annulus hole remains empty.
    const seen=new Map();
    for(const part of parts)for(let i=0;i<part.vertices.length;i++){
      const a=part.vertices[i],b=part.vertices[(i+1)%part.vertices.length];
      const point=p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`;
      const key=[point(a),point(b)].sort().join(':');
      if(seen.has(key)){a.isInternal=true;seen.get(key).isInternal=true;}else seen.set(key,a);
    }
    return Body.create({parts,label:model.id,density:.00118,restitution:this.config.restitution,
      friction:0,frictionStatic:0,frictionAir:.003,slop:.08});
  }

  resize(){
    if(this.destroyed)return;
    const rect=this.root.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    if(this.width===rect.width && this.height===rect.height)return;
    this.width=rect.width;this.height=rect.height;this.mobile=this.width<=700;
    this.scale=this.mobile?Math.min(this.width/246,this.height/450):Math.min(this.width/590,this.height/325);
    this.worldWidth=this.width/this.scale;this.worldHeight=this.height/this.scale;
    this.renderer.setSize(this.width,this.height,false);
    this.camera.aspect=this.width/this.height;
    const distance=this.worldHeight/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov)/2));
    this.camera.position.set(this.worldWidth/2,-this.worldHeight/2,distance);
    this.camera.lookAt(this.worldWidth/2,-this.worldHeight/2,0);
    this.camera.updateProjectionMatrix();
    this.reset();
  }

  reset(){
    if(this.destroyed)return;
    Composite.clear(this.engine.world,false);Engine.clear(this.engine);
    for(const item of this.items){this.scene.remove(item.pivot);item.edges.geometry.dispose();item.mesh.geometry.dispose();}
    this.items=[];this.time=0;
    this.stats={pieceCollisions:0,boundaryCollisions:0,pointerPushes:0,frames:0};
    const slots=this.mobile?MOBILE:DESKTOP;
    const copy=this.copy.getBoundingClientRect(),outer=this.root.getBoundingClientRect();
    const pad=this.mobile?11:22;
    this.textBounds={
      left:(copy.left-outer.left-pad)/this.scale,right:(copy.right-outer.left+pad)/this.scale,
      top:(copy.top-outer.top-pad)/this.scale,bottom:(copy.bottom-outer.top+pad)/this.scale,
    };
    const w=this.worldWidth,h=this.worldHeight,wall=160,margin=(this.mobile?12:24)/this.scale;
    this.bottomMargin=52/this.scale;
    this.walls=[
      Bodies.rectangle(w/2,-wall/2+margin,w+wall*2,wall,{isStatic:true}),
      Bodies.rectangle(w/2,h+wall/2-this.bottomMargin,w+wall*2,wall,{isStatic:true}),
      Bodies.rectangle(-wall/2+margin,h/2,wall,h+wall*2,{isStatic:true}),
      Bodies.rectangle(w+wall/2-margin,h/2,wall,h+wall*2,{isStatic:true}),
    ];
    Composite.add(this.engine.world,this.walls);
    slots.forEach(([id,color,x,y,angle],index)=>{
      const model=this.models.get(id),body=this.makeBody(model);
      const center={...body.position};
      const mesh=new THREE.Mesh(this.geometry(model,center),this.materials[color]);
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,24),this.edgeMaterial);
      const edgePositions=edges.geometry.getAttribute('position'),edgeColors=[];
      for(let k=0;k<edgePositions.count;k++)edgeColors.push(1,1,1,edgePositions.getZ(k)>0?.38:.30);
      edges.geometry.setAttribute('color',new THREE.Float32BufferAttribute(edgeColors,4));
      edges.name='CAD front and rear edges';edges.renderOrder=20;mesh.add(edges);
      const reflection=new THREE.Mesh(mesh.geometry,this.reflectionMaterials[color]);
      reflection.name='Tinted studio reflection';reflection.renderOrder=10;mesh.add(reflection);
      const pivot=new THREE.Group();pivot.add(mesh);this.scene.add(pivot);
      Body.setPosition(body,{x:x*w,y:y*h});Body.setAngle(body,angle);
      const item={body,mesh,edges,reflection,pivot,model,color,index,center,phase:index*2.39996};
      this.items.push(item);Composite.add(this.engine.world,body);
      this.fitToBounds(body,margin);
    });
    // Resolve any initial contacts before the first visible frame, without gravity.
    for(let i=0;i<80;i++)Engine.update(this.engine,STEP);
    for(const item of this.items){
      const {body,phase}=item;
      Body.setVelocity(body,this.reducedMotion?{x:0,y:0}:{x:Math.cos(phase)*.014,y:Math.sin(phase)*.014});
      Body.setAngularVelocity(body,this.reducedMotion?0:Math.sin(phase+1)*.00016);
    }
    this.stats.pieceCollisions=0;this.stats.boundaryCollisions=0;
    this.pointer.active=false;this.pointer.x=-9999;this.keyboardCursor.hidden=true;
    this.syncVisuals();this.renderer.render(this.scene,this.camera);
    this.updateControls();
  }

  fitToBounds(body,margin){
    const b=body.bounds;let dx=0,dy=0;
    if(b.min.x<margin)dx=margin-b.min.x;
    if(b.max.x>this.worldWidth-margin)dx=this.worldWidth-margin-b.max.x;
    if(b.min.y<margin)dy=margin-b.min.y;
    if(b.max.y>this.worldHeight-this.bottomMargin)dy=this.worldHeight-this.bottomMargin-b.max.y;
    if(dx||dy)Body.translate(body,{x:dx,y:dy});
  }

  onPointer(event,tap=false){
    if(!event.isPrimary)return;
    if(event.target.closest?.('.shadow-controls'))return;
    const r=this.root.getBoundingClientRect();
    const x=(event.clientX-r.left)/this.scale,y=(event.clientY-r.top)/this.scale;
    if(!this.pointer.active||event.pointerType==='touch'){
      this.pointer.x=x;this.pointer.y=y;
    }
    this.pointer.targetX=x;this.pointer.targetY=y;this.pointer.active=true;
    this.pointer.lastMove=performance.now();this.keyboardCursor.hidden=true;
    if(tap && event.pointerType==='touch')this.brush(x,y,1.6);
  }

  onKey(event){
    if(event.code==='Space'){event.preventDefault();this.setPaused(!this.paused);return;}
    if(event.key.toLowerCase()==='r'){event.preventDefault();this.reset();return;}
    const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!dir)return;
    event.preventDefault();
    const p=this.pointer;
    if(this.keyboardCursor.hidden){p.x=this.worldWidth*.18;p.y=this.worldHeight*.18;p.targetX=p.x;p.targetY=p.y;}
    p.targetX=clamp(p.targetX+dir[0]*34/this.scale,0,this.worldWidth);
    p.targetY=clamp(p.targetY+dir[1]*34/this.scale,0,this.worldHeight);
    p.active=true;p.lastMove=performance.now();this.keyboardCursor.hidden=false;
    this.keyboardCursor.style.left=`${p.targetX*this.scale}px`;
    this.keyboardCursor.style.top=`${p.targetY*this.scale}px`;
  }

  nearest(item,x,y){
    const {body,center,model}=item;
    const c=Math.cos(body.angle),s=Math.sin(body.angle);
    const px=x-body.position.x,py=y-body.position.y;
    const lx=px*c+py*s+center.x,ly=-px*s+py*c+center.y;
    let best=Infinity,ox=0,oy=0;
    for(const loop of model.outlines)for(let i=0;i<loop.length;i++){
      const a=loop[i],b=loop[(i+1)%loop.length];
      const dx=b[0]-a[0],dy=b[1]-a[1];
      const f=clamp(((lx-a[0])*dx+(ly-a[1])*dy)/(dx*dx+dy*dy||1),0,1);
      const xx=a[0]+f*dx,yy=a[1]+f*dy,d=(xx-lx)**2+(yy-ly)**2;
      if(d<best){best=d;ox=xx;oy=yy;}
    }
    const rx=ox-center.x,ry=oy-center.y;
    return {x:body.position.x+rx*c-ry*s,y:body.position.y+rx*s+ry*c,distance:Math.sqrt(best)};
  }

  brush(x,y,motion=1){
    const radius=this.config.pointerRadius/this.scale;
    for(const item of this.items){
      const b=item.body,bb=b.bounds;
      if(x<bb.min.x-radius||x>bb.max.x+radius||y<bb.min.y-radius||y>bb.max.y+radius)continue;
      const near=this.nearest(item,x,y);
      const inside=Query.point([b],{x,y}).length>0;
      if(near.distance>radius && !inside)continue;
      let dx=inside?b.position.x-x:near.x-x,dy=inside?b.position.y-y:near.y-y;
      let length=Math.hypot(dx,dy);
      if(length<.1){dx=Math.cos(item.phase);dy=Math.sin(item.phase);length=1;}
      const falloff=inside?1:(1-near.distance/radius)**1.15;
      const strength=b.mass*this.config.pointerStrength*falloff*clamp(motion,.35,2)*(this.reducedMotion?.65:1);
      Body.applyForce(b,near,{x:dx/length*strength,y:dy/length*strength});
      this.stats.pointerPushes++;
    }
  }

  simulate(){
    if(this.reducedMotion && !this.pointer.active && this.items.every(({body:b})=>Math.hypot(b.velocity.x,b.velocity.y)<.001 && Math.abs(b.angularVelocity)<.00001))return;
    this.time+=STEP/1000;
    for(const {body:b,phase} of this.items){
      if(!this.reducedMotion){
        const speed=this.config.idleSpeed;
        const tx=Math.cos(phase+this.time*.035)*speed;
        const ty=Math.sin(phase+this.time*.031)*speed;
        Body.applyForce(b,b.position,{x:(tx-b.velocity.x)*b.mass*.000001,y:(ty-b.velocity.y)*b.mass*.000001});
        // A tiny ongoing torque, independent of the mouse. Impacts supply the larger rotation.
        b.torque+=b.inertia*Math.sin(phase+this.time*.04)*.000000006;
      }
    }
    const p=this.pointer;
    if(p.active && performance.now()-p.lastMove<260){
      const dx=p.targetX-p.x,dy=p.targetY-p.y,d=Math.hypot(dx,dy);
      const travel=Math.min(d,26/this.scale);
      if(d>.001){p.x+=dx/d*travel;p.y+=dy/d*travel;}
      this.brush(p.x,p.y,clamp(travel*this.scale/9,.35,1.9));
    }else if(performance.now()-p.lastMove>=260){p.active=false;}
    Engine.update(this.engine,STEP);
    for(const {body:b} of this.items){
      const max=this.reducedMotion?3:6.5,speed=Math.hypot(b.velocity.x,b.velocity.y);
      if(speed>max)Body.setVelocity(b,{x:b.velocity.x/speed*max,y:b.velocity.y/speed*max});
      if(Math.abs(b.angularVelocity)>.04)Body.setAngularVelocity(b,Math.sign(b.angularVelocity)*.04);
    }
  }

  syncVisuals(){
    for(const item of this.items){
      const {body,pivot,mesh,phase}=item;
      pivot.position.set(body.position.x,-body.position.y,0);pivot.rotation.z=-body.angle;
      // Small tilt reveals the original 3 mm edge. This is a planar physics interaction.
      const sway=this.reducedMotion?0:Math.sin(this.time*.22+phase)*.014;
      mesh.rotation.x=.31+Math.sin(phase)*.14+sway;
      mesh.rotation.y=-.29+Math.cos(phase)*.14+sway*.7;
    }
  }

  tick(now){
    if(this.destroyed)return;
    this.raf=requestAnimationFrame(this.tick);
    if(!this.visible||!this.inView){this.lastFrame=0;return;}
    if(this.lastFrame&&now-this.lastFrame<1000/(this.config.maxFps||60)-.5)return;
    const dt=this.lastFrame?Math.min(now-this.lastFrame,50):0;this.lastFrame=now;
    if(!this.paused){
      this.accumulator+=dt;
      while(this.accumulator>=STEP){this.simulate();this.accumulator-=STEP;}
      this.syncVisuals();
    }
    this.renderer.render(this.scene,this.camera);this.stats.frames++;
  }

  updateControls(){
    const btn=this.root.querySelector('[data-shadow-pause]');
    if(btn){btn.textContent=this.paused?'Continua':'Pausa';btn.setAttribute('aria-pressed',String(this.paused));}
  }

  setPaused(value){
    this.paused=Boolean(value);this.accumulator=0;this.pointer.active=false;this.updateControls();
    const status=this.root.querySelector('.shadow-status');
    if(status)status.textContent=this.paused?'Moviment pausat.':'Moviment activat.';
  }

  snapshot(){
    return {width:this.width,height:this.height,scale:this.scale,reducedMotion:this.reducedMotion,paused:this.paused,
      stats:{...this.stats},textBounds:{...this.textBounds},
      items:this.items.map(({body:b,model,color})=>({id:b.id,name:model.id,color,x:b.position.x,y:b.position.y,angle:b.angle,
        vx:b.velocity.x,vy:b.velocity.y,angularVelocity:b.angularVelocity,bounds:JSON.parse(JSON.stringify(b.bounds)),parts:b.parts.length-1})),
      renderer:{triangles:this.renderer.info.render.triangles,drawCalls:this.renderer.info.render.calls},
    };
  }

  destroy(){
    if(this.destroyed)return;this.destroyed=true;cancelAnimationFrame(this.raf);
    this.abort.abort();this.observer.disconnect();this.intersection.disconnect();
    Events.off(this.engine);Composite.clear(this.engine.world,false);Engine.clear(this.engine);
    for(const item of this.items){item.edges.geometry.dispose();item.mesh.geometry.dispose();}
    for(const mats of Object.values(this.materials))for(const mat of mats)mat.dispose();
    for(const mat of Object.values(this.reflectionMaterials))mat.dispose();
    this.reflectionEnvironment.dispose();
    this.edgeMaterial.dispose();
    this.renderer.dispose();this.renderer.domElement.remove();this.keyboardCursor.remove();
    this.root.dataset.ready='false';
  }
}

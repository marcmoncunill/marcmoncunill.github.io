/* Original CAD renders + bounded viewport water. No wheel interception.
 * Geometry stays in document coordinates; only its reached prefix is painted.
 * The two masks form a union before shading, so joined streams have no seams.
 */
(() => {
 'use strict';
 const models=[
  ['basin-straight-beige',234,336,.1115137247,.2999080249,.0913040748],
  ['wall-fuse-black',352,168,.0723190904,.9116956620,.0614828646],
  ['kitchen-terracotta',257,508,.1008057205,.3563888580,.0831329420],
  ['basin-offset-brown',263,348,.0992175345,.2895663689,.0812363251],
  ['wall-offset-beige',421,168,.0585959156,.9023631641,.0347852800],
  ['basin-straight-black',234,336,.1115137247,.2999080249,.0913040748],
  ['kitchen-brown',257,508,.1008057205,.3563888580,.0831329420],
  ['wall-fuse-terracotta',352,168,.0723190904,.9116956620,.0614828646]
 ];
 const lifts=[0,38,3,16,32,0,14,42];
 // Art-directed document anchors. X is a fraction of the page width; each Y
 // follows a content block, so photos/copy can be recomposed without a new scene.
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
 let active=null;

 function create(article){
  const events=new AbortController(),signal=events.signal;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Marc requests active pouring on every entry, without query/play gates.
  // Document scroll still determines the leading edge; surface time never does.
  const staticMode=()=>false;
  const surfaceMotion=()=>true;
  const rack=document.createElement('div');rack.className='a3-water-rack';rack.setAttribute('aria-hidden','true');
  for(let i=0;i<models.length;i++){
   const m=models[i],tile=document.createElement('div');tile.className='a3-water-tap';tile.style.setProperty('--lift',lifts[i]+'px');
   const img=new Image();img.width=m[1];img.height=m[2];img.alt='';img.decoding='async';img.src='assets/a3-water/'+m[0]+'.png';
   tile.append(img);rack.append(tile);
  }
  let canvas=document.createElement('canvas');canvas.className='a3-water-layer';canvas.setAttribute('aria-hidden','true');
  article.classList.add('a3-water-case');article.prepend(canvas,rack);
  const next=article.querySelector('.next-project');
  const ending=document.createElement('div');ending.className='a3-water-ending';ending.setAttribute('aria-hidden','true');next.before(ending);
  let optics=null,ctx=null;
  try{optics=window.createA3WaterOptics?.(canvas)||null;}catch{
   const fallback=document.createElement('canvas');fallback.className=canvas.className;fallback.setAttribute('aria-hidden','true');canvas.replaceWith(fallback);canvas=fallback;
  }
  if(!optics)ctx=canvas.getContext('2d');
  const mask=document.createElement('canvas'),scratch=document.createElement('canvas');
  const mc=mask.getContext('2d'),sc=scratch.getContext('2d');
  let dead=false,raf=0,dirty=true,paths=[],obstacles=[],width=0,height=0,dpr=1,startY=0,endY=0,mergeY=0,endX=0,headY=0,spread=0,draws=0,articleY=0,arrivalScroll=0,spreadTravel=1;
  let endingRect=null,clipY=0,trunkDiameter=60,lastFrame=-Infinity,lastShape=-Infinity,lastPaintHead=-1,lastPaintScroll=-1,maskDirty=true,maskPaints=0,routeKnots=[],pendingInput=true,dropletCount=0;
  let trunkPoints=[],streamPaths=[],fork=null,imageRects=[];
  const docRect=el=>{const r=el.getBoundingClientRect();return {x:r.left,y:r.top+scrollY,w:r.width,h:r.height};};
  const knot=(x,y)=>({x,y});
  function segment(knots,diameter,endDiameter=diameter){
   const points=[];
   for(let k=0;k<knots.length-1;k++){
    const a=knots[k],b=knots[k+1];if(b.y<=a.y)continue;
    const steps=Math.ceil((b.y-a.y)/7);
    for(let i=0;i<steps;i++){const t=i/steps;points.push(knot(a.x+(b.x-a.x)*ease(t),a.y+(b.y-a.y)*t));}
   }
   points.push(knots.at(-1));return {points,diameter,endDiameter};
  }
  function smoothRoute(knots){
   // Shape-preserving cubic slopes. Ordinary waypoints keep their tangent;
   // only actual turns flatten, instead of restarting the same S at every knot.
   const slopes=knots.slice(1).map((p,i)=>(p.x-knots[i].x)/(p.y-knots[i].y));
   const tangents=knots.map((p,i)=>{
    if(!i||i===knots.length-1)return 0;
    const a=slopes[i-1],b=slopes[i];return a*b<=0?0:2*a*b/(a+b);
   });
   const points=[];
   for(let i=0;i<knots.length-1;i++){
    const a=knots[i],b=knots[i+1],h=b.y-a.y,n=Math.ceil(h/5);
    for(let j=0;j<n;j++){
     const t=j/n,t2=t*t,t3=t2*t;
     const x=(2*t3-3*t2+1)*a.x+(t3-2*t2+t)*h*tangents[i]+(-2*t3+3*t2)*b.x+(t3-t2)*h*tangents[i+1];
     points.push(knot(x,a.y+t*h));
    }
   }
   points.push({...knots.at(-1)});return points;
  }
  function atY(points,y){
   let lo=0,hi=points.length-1;
   while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].y<y)lo=mid;else hi=mid;}
   const a=points[lo],b=points[hi],t=clamp((y-a.y)/Math.max(.001,b.y-a.y));
   return {x:a.x+(b.x-a.x)*t,y,diameter:(a.diameter||trunkDiameter)+((b.diameter||trunkDiameter)-(a.diameter||trunkDiameter))*t};
  }
  function fronts(y){return streamPaths.filter(p=>y>=p.points[0].y&&(y<p.points.at(-1).y||(y===endY&&p.points.at(-1).y===endY)));}
  function avoidImages(path){
   // Plan a whole detour, not an independent nearest-side choice at every Y.
   // Quintic shoulders have zero first/second derivatives at either end.
   const radius=Math.max(path.diameter,path.endDiameter||path.diameter)*.65+12;
   const pad=radius+8,edge=radius+3,lead=clamp(width*.32,230,480);
   const fade=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
   let points=path.points.map(p=>({...p}));
   const first=points[0].y,last=points.at(-1).y;
   for(let pass=0;pass<3;pass++)for(const r of imageRects){
    if(r.y-pad>last||r.y+r.h+pad<first)continue;
    const crosses=points.some(p=>p.y>r.y-pad&&p.y<r.y+r.h+pad&&p.x>r.x-pad&&p.x<r.x+r.w+pad);
    if(!crosses)continue;
    let enter=Math.max(first,r.y-lead);const exit=Math.min(last,r.y+r.h+lead);
    let top=Math.max(enter+1,r.y-pad);const bottom=Math.min(exit-1,r.y+r.h+pad);
    const before=atY(points,enter).x,after=atY(points,exit).x;
    const options=[{side:-1,x:r.x-pad},{side:1,x:r.x+r.w+pad}].filter(o=>o.x>=edge&&o.x<=width-edge);
    if(!options.length)continue;
    for(const o of options)o.cost=(o.x-before)**2/Math.max(50,top-enter)+(o.x-after)**2/Math.max(50,exit-bottom);
    options.sort((a,b)=>a.cost-b.cost);
    const chosen=width<=700?(options.find(o=>o.side===1)||options[0]):options[0];
    // Finish passing the preceding image before crossing its horizontal field.
    // This keeps a long anticipatory bend from cutting through a previous photo.
    for(const b of imageRects){
     if(b===r||b.y+b.h>=r.y||b.y+b.h+pad<=enter)continue;
     const low=Math.min(before,chosen.x),high=Math.max(before,chosen.x);
     if(high>b.x-pad&&low<b.x+b.w+pad)enter=Math.min(top-1,Math.max(enter,b.y+b.h+pad));
    }
    top=Math.max(enter+1,top);
    const room=chosen.side<0?chosen.x-edge:width-edge-chosen.x;
    const feather=Math.max(.5,Math.min(18,room));
    points=points.map(p=>{
     if(p.y<=enter||p.y>=exit)return p;
     const strength=Math.min(fade((p.y-enter)/Math.max(1,top-enter)),fade((exit-p.y)/Math.max(1,exit-bottom)));
     const delta=p.x-chosen.x,rounded=Math.sqrt(delta*delta+feather*feather);
     const outside=(p.x+chosen.x+chosen.side*rounded)*.5;
     return {...p,x:clamp(p.x+(outside-p.x)*strength,edge,width-edge)};
    });
   }
   return points;
  }
  function routeQuality(){
   let maxTurn=0,sharpTurns=0,mainMaxTurn=0,worstMain=null;const examples=[];
   for(const path of paths){const a=path.points;for(let i=1;i<a.length-1;i++){
    const u=Math.atan2(a[i].x-a[i-1].x,a[i].y-a[i-1].y),v=Math.atan2(a[i+1].x-a[i].x,a[i+1].y-a[i].y),turn=Math.abs(v-u)*180/Math.PI;
    maxTurn=Math.max(maxTurn,turn);if(path.originY===mergeY&&turn>mainMaxTurn){mainMaxTurn=turn;worstMain={...a[i],turn};}
    if(turn>12){sharpTurns++;if(examples.length<8)examples.push({x:a[i].x,y:a[i].y,turn:Number(turn.toFixed(1))});}
   }}return {maxTurn:Number(maxTurn.toFixed(2)),mainMaxTurn:Number(mainMaxTurn.toFixed(2)),worstMain,sharpTurns,examples};
  }
  function imageSafety(){
   let clearance=Infinity,collisions=0;const samples=[];
   for(const path of paths)for(const p of path.points){
    const radius=(p.diameter??Math.max(path.diameter,path.endDiameter||path.diameter))*.63+3;
    for(const r of imageRects){const dx=Math.max(r.x-p.x,0,p.x-r.x-r.w),dy=Math.max(r.y-p.y,0,p.y-r.y-r.h),gap=Math.hypot(dx,dy)-radius;clearance=Math.min(clearance,gap);if(gap<0){collisions++;if(samples.length<6)samples.push({point:p,image:r,diameter:radius*2});}}
   }
   return {clearance:Number(clearance.toFixed(2)),collisions,images:imageRects.length,samples};
  }
  function measure(){
   if(dead||!article.isConnected)return;
   dirty=false;width=document.documentElement.clientWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,width<=700?.85:1,Math.sqrt(2000000/(width*height)));
   for(const c of optics?[canvas,mask]:[canvas,mask,scratch]){c.width=Math.ceil(width*dpr);c.height=Math.ceil(height*dpr);}
   endingRect=docRect(ending);clipY=docRect(next).y;
   maskDirty=true;
   articleY=docRect(article).y;
   const mobile=width<=700,summary=docRect(article.querySelector('.project-summary'));
   imageRects=[...article.querySelectorAll('.image-button')].filter(e=>!e.closest('.next-project')).map(docRect);
   const sources=[...rack.children].filter(t=>getComputedStyle(t).display!=='none').map((t,i)=>{
    const r=docRect(t.firstChild),m=models[i];return {...knot(r.x+r.w*m[3],r.y+r.h*m[4]),diameter:Math.max(2.7,r.w*m[5]*1.24)};
   });
   startY=Math.min(...sources.map(p=>p.y));
   const firstJoin=summary.y+Math.min(130,summary.h*.30);
   mergeY=summary.y+summary.h+100;
   endX=width*.5;
   // The receiving film meets the next block exactly. Its lower half is clipped.
   endY=clipY-25;
   paths=[];
   const groups=[];
   for(let i=0;i<sources.length;i+=2){
    const group=sources.slice(i,i+2),x=group.reduce((sum,p)=>sum+p.x,0)/group.length;
    groups.push({x,y:firstJoin,diameter:Math.sqrt(group.reduce((sum,p)=>sum+(p.diameter*.88)**2,0))});
    for(let j=0;j<group.length;j++){
     const p=group[j];
     const start=[p,knot(p.x,Math.min(firstJoin-120,p.y+110))];
     paths.push(segment([...start,knot(x,firstJoin)],p.diameter,p.diameter*.88));
    }
   }
   for(const g of groups)paths.push(segment([g,knot(width*.5,mergeY)],g.diameter));
   const modelRows=[...article.querySelectorAll('.a3-model-row')];
   const publication=docRect(article.querySelector('.a3-publication'));
   const firstModel=docRect(modelRows[0]);
   const forkStart=mobile?endingRect.y+12:publication.y+publication.h+26;
   const forkEnd=mobile?clipY-67:firstModel.y-28;
   fork={startY:forkStart,endY:forkEnd,leftFraction:.56,rightFraction:.44};
   const knots=[knot(width*.5,mergeY),knot(width*.5,mergeY+65)];
   const anchor=(x,y)=>{if(y>mergeY+70&&y<endY-80)knots.push(knot(width*x,y));};
   anchor(mobile?.90:.45,publication.y+publication.h*.22);anchor(mobile?.91:.46,publication.y+publication.h*.68);
   const turns=[.49,.535,.515,.54,.485];
   modelRows.forEach((el,i)=>{const r=docRect(el);anchor(mobile?.90:turns[i],r.y+r.h*.13);anchor(mobile?.91:(i===2?.49:turns[i]+.008),r.y+r.h*.76);});
   const context=docRect(article.querySelector('.a3-context')),development=docRect(article.querySelector('.a3-development'));
   const contextImages=[...article.querySelector('.a3-context').querySelectorAll('.image-button')].map(docRect);
   const photoTop=Math.min(...contextImages.map(r=>r.y)),photoBottom=Math.max(...contextImages.map(r=>r.y+r.h));
   anchor(mobile?.90:.53,context.y-85);
   anchor(mobile?.90:.88,photoTop-85);
   anchor(mobile?.91:.895,photoTop+(photoBottom-photoTop)*.47);
   anchor(mobile?.89:.87,photoBottom+55);
   const developmentImages=[...article.querySelector('.a3-development').querySelectorAll('.image-button')].map(docRect);
   const developmentTop=Math.min(...developmentImages.map(r=>r.y));
   anchor(mobile?.90:.51,developmentTop-85);anchor(mobile?.89:.54,development.y+development.h*.79);
   knots.push(knot(width*(mobile?.47:.5),forkStart),knot(width*(mobile?.51:.52),forkEnd),knot(endX,endY));
   knots.sort((a,b)=>a.y-b.y);
   const ordered=knots.filter((p,i)=>!i||p.y-knots[i-1].y>8);routeKnots=ordered;
   const combined=Math.sqrt(groups.reduce((sum,g)=>sum+g.diameter*g.diameter,0));
   trunkDiameter=clamp(width*.045,mobile?21:38,mobile?29:72);
   trunkPoints=smoothRoute(ordered).map(p=>{
    const a=p.y/173,i=Math.floor(a),t=ease(a-i);
    const noise=random(i)+(random(i+1)-random(i))*t-.5;
    const drift=width*.014*noise*ease((p.y-mergeY)/140)*ease((endY-p.y)/140);
    return {x:p.x+drift,y:p.y,diameter:combined+(trunkDiameter-combined)*ease((p.y-mergeY)/240)};
   });
   trunkPoints=avoidImages({points:trunkPoints,diameter:trunkDiameter,endDiameter:trunkDiameter});
   const branchPoints=trunkPoints.filter(p=>p.y>=forkStart&&p.y<=forkEnd);
   const branches=[[-1,.56,mobile?.15:.105,.86],[1,.44,mobile?.20:.115,1.18]].map(([side,fraction,reach,power])=>branchPoints.map(p=>{
    const u=clamp((p.y-forkStart)/(forkEnd-forkStart));
    const offset=side*width*reach*Math.sin(Math.PI*Math.pow(u,power))**2;
    const separated=ease(Math.abs(offset)/Math.max(1,p.diameter*.8));
    return {x:p.x+offset,y:p.y,diameter:p.diameter*(1+(Math.sqrt(fraction)-1)*separated)};
   }));
   const makeStream=points=>({points,diameter:points[0].diameter,endDiameter:points.at(-1).diameter,originY:mergeY});
   streamPaths=[makeStream(trunkPoints.filter(p=>p.y<=forkStart)),...branches.map(makeStream),makeStream(trunkPoints.filter(p=>p.y>=forkEnd))];
   paths.push(...streamPaths);
   for(const path of paths)path.points=avoidImages(path);
   const safety=imageSafety();canvas.dataset.imageSafety=JSON.stringify(safety);canvas.dataset.routeQuality=JSON.stringify(routeQuality());
   const midpoint=(forkStart+forkEnd)*.5,left=atY(branches[0],midpoint),right=atY(branches[1],midpoint),base=atY(trunkPoints,midpoint);
   fork.separation=right.x-left.x;fork.areaRatio=(left.diameter**2+right.diameter**2)/base.diameter**2;
   fork.startX=branches[0][0].x;fork.endX=branches[0].at(-1).x;
   canvas.dataset.fork=JSON.stringify(fork);
   canvas.dataset.course=JSON.stringify(routeKnots);canvas.dataset.sources=String(sources.length);
   // Mask real text lines, rather than the unused area of a grid column.
   obstacles=[];
   for(const el of article.querySelectorAll('h1,h2,p,.eyebrow,.project-breadcrumb,.image-caption')){ // taste-skill-ignore: masks existing text; adds no new eyebrow labels.
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
     if(!walker.currentNode.textContent.trim())continue;
     const range=document.createRange();range.selectNodeContents(walker.currentNode);
     for(const r of range.getClientRects())obstacles.push({x:r.left-7,y:r.top+scrollY-5,w:r.width+14,h:r.height+10});
    }
   }
   let lo=endY-height,hi=endY;
   for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(headForScroll(mid)<endY)lo=mid;else hi=mid;}
   arrivalScroll=hi;
   spreadTravel=Math.max(1,Math.min(height*.22,document.documentElement.scrollHeight-height-arrivalScroll));
  }
  function headForScroll(y){
   // Start at the actual outlets. Then ease into a viewport-relative document
   // position, with a bounded, slowly changing depth rather than a screen lock.
   const travel=clamp((y-(articleY-112))/Math.max(1,endY-height));
   const depth=.64+.075*Math.sin(travel*Math.PI*3-.4);
   const entry=ease(y/(height*.52));
   return clamp((startY+200)*(1-entry)+(y+height*depth)*entry,startY,endY);
  }
  function paintMask(time=0){
   mc.setTransform(dpr,0,0,dpr,0,0);mc.clearRect(0,0,width,height);mc.fillStyle='#fff';
   mc.save();mc.beginPath();mc.rect(0,articleY-scrollY,width,clipY-articleY);mc.clip();dropletCount=0;
   for(const path of paths){
    const pts=path.points,visible=[];
    for(let i=0;i<pts.length;i++){
     const p=pts[i],prev=pts[i-1];if(p.y>headY){
      if(prev&&visible.length){const t=(headY-prev.y)/(p.y-prev.y),tip=knot(prev.x+(p.x-prev.x)*t,headY);if(p.diameter!==undefined)tip.diameter=prev.diameter+(p.diameter-prev.diameter)*t;visible.push(tip);}break;
     }
     if(p.y<scrollY-20){continue;}if(p.y>scrollY+height+20)break;
     if(!visible.length&&prev&&prev.y>scrollY-30)visible.push(prev);visible.push(p);
    }
    if(visible.length<2)continue;
    const left=[],right=[];
    for(let i=0;i<visible.length;i++){
     const p=visible[i],a=visible[Math.max(0,i-1)],b=visible[Math.min(visible.length-1,i+1)];
     const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
     const contraction=ease((p.y-pts[0].y)/240);
     const dia=p.diameter??path.diameter+(path.endDiameter-path.diameter)*contraction;
     const natural=ease((p.y-(path.originY??pts[0].y))/45);
     const travel=p.y-time*260;
     const ripple=natural*(.08*Math.sin(travel*.067)+.035*Math.sin(travel*.173)+.05*Math.sin(travel*.027+p.x*.021));
     const neck=.86+.14*Math.sin(travel*.018+p.x*.004);
     let r=dia*.5*neck*(1+ripple);
     if(headY<pts.at(-1).y){
      const breakup=1-clamp((headY-p.y)/Math.max(1,dia*1.1));
      r*=1-breakup*.32;
     }
     const drift=natural*Math.min(2.2,dia*.055)*(.65*Math.sin(travel*.073)+.35*Math.sin(travel*.157));
     const cx=p.x+dy/len*drift,cy=p.y-scrollY-dx/len*drift;
     left.push(knot(cx+dy/len*r,cy-dx/len*r));right.push(knot(cx-dy/len*r,cy+dx/len*r));
    }
    mc.beginPath();mc.moveTo(left[0].x,left[0].y);for(const p of left)mc.lineTo(p.x,p.y);for(const p of right.reverse())mc.lineTo(p.x,p.y);mc.closePath();mc.fill();
   }
   // The jet breaks into spray instead of finishing in a sealed rounded cap.
   // Fade only the short leading edge; detached droplets are painted afterwards.
   if(headY<endY-20&&headY>scrollY&&headY<scrollY+height+40){
    const tip=headY-scrollY,fade=mc.createLinearGradient(0,tip-36,0,tip+3);
    fade.addColorStop(0,'rgba(255,255,255,1)');fade.addColorStop(.45,'rgba(255,255,255,.75)');fade.addColorStop(1,'rgba(255,255,255,0)');
    mc.save();mc.globalCompositeOperation='destination-in';mc.fillStyle=fade;mc.fillRect(0,0,width,height);mc.restore();
   }
   paintDrops(time);paintEnding(time);mc.restore();
  }
  const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  function drop(x,y,r,elongation=1,angle=0){
   if(y+r<scrollY||y-r>scrollY+height||y+r>=clipY-2||x-r<0||x+r>width)return;
   const reach=r*Math.sqrt(elongation)+10;
   if([...obstacles,...imageRects].some(b=>x+reach>b.x&&x-reach<b.x+b.w&&y+reach>b.y&&y-reach<b.y+b.h))return;
   const stretch=Math.sqrt(elongation);
   mc.beginPath();mc.ellipse(x,y-scrollY,r/stretch,r*stretch,angle,0,Math.PI*2);mc.fill();dropletCount++;
  }
  function paintDrops(time){
   const pts=trunkPoints;if(!pts.length)return;
   // A few detached beads beside the reached stream. Their flight uses gravity;
   // the scroll-driven front remains in document coordinates.
   for(let i=0;i<18;i++){
    const index=Math.floor((i+.42)/18*(pts.length-1)),reference=pts[index];
    const choices=fronts(reference.y),p=choices.length?atY(choices[i%choices.length].points,reference.y):reference;
    if(p.y>headY-10||p.y>endY-100||p.y<scrollY-120||p.y>scrollY+height)continue;
    const life=.48+random(i+3)*.25,age=(time*.72+random(i+1)*life)%life;
    const side=i%2?1:-1,offset=p.diameter*.5+5;
    const vx=side*(18+random(i+8)*42),vy=25+random(i+13)*35,g=580;
    const r=(width<=700?1.8:2.8)+random(i+21)*2.6;
    drop(p.x+side*offset+vx*age,p.y+vy*age+.5*g*age*age,r,1+Math.min(.7,age*.9),Math.atan2(vy+g*age,vx)-Math.PI*.5);
   }
   // Falling beads separate from the leading end, rather than a rounded gel cap.
   if(headY>=pts[0].y&&headY<endY-20){
    for(const path of fronts(headY)){const p=atY(path.points,headY);for(let i=0;i<4;i++){
     const age=(time*.9+i*.16)%.64,side=i%2?1:-1;
     const vx=side*(12+i*8),vy=48+580*age;
     drop(p.x+side*p.diameter*.16+vx*age,headY+10+age*48+290*age*age,2.4+i*.7,1.2+age*.8,Math.atan2(vy,vx)-Math.PI*.5);
    }}
   }
  }
  function paintEnding(time){
   if(spread<=0||endY>scrollY+height+80||clipY<scrollY)return;
   const reach=Math.sqrt(spread),base=endY-scrollY;
   // A thin irregular wash across the white page, rather than an enclosed scene.
   const half=width*.65*reach,depth=(width<=700?22:30)*reach;
   mc.beginPath();
   for(let i=0;i<=160;i++){
    const a=i/160*Math.PI*2;
    const edge=1+.018*Math.sin(a*7+time*.6)+.009*Math.sin(a*17-time*.9);
    const x=endX+Math.cos(a)*half*edge;
    const y=base+25+Math.sin(a)*depth*(1+.17*Math.sin(a*5)+.08*Math.cos(a*11));
    if(i)mc.lineTo(x,y);else mc.moveTo(x,y);
   }
   mc.closePath();mc.fill();
   mc.beginPath();mc.moveTo(endX-trunkDiameter*.45,base-18);
   mc.bezierCurveTo(endX-trunkDiameter*.40,base+6,endX-trunkDiameter,base+12,endX-trunkDiameter*1.2,base+25);
   mc.lineTo(endX+trunkDiameter*1.2,base+25);
   mc.bezierCurveTo(endX+trunkDiameter,base+12,endX+trunkDiameter*.40,base+6,endX+trunkDiameter*.45,base-18);
   mc.closePath();mc.fill();
   for(let i=0;i<(width<=700?16:26);i++){
    const side=i%2?1:-1,life=.6+random(i+90)*.4,age=(time*.8+random(i+80)*life)%life;
    const vx=side*(45+random(i+60)*190)*reach,vy=-(45+random(i+70)*145);
    const g=620,r=2.1+random(i+50)*6.3;
    drop(endX+vx*age,endY+12+vy*age+.5*g*age*age,r,1+Math.min(.55,Math.hypot(vx,vy+g*age)/400),Math.atan2(vy+g*age,vx)-Math.PI*.5);
   }
  }
  function tintedMask(colour,alpha,shift=0,edge=false){
   sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,scratch.width,scratch.height);sc.globalCompositeOperation='source-over';sc.drawImage(mask,0,0);
   if(edge){sc.globalCompositeOperation='destination-out';sc.drawImage(mask,shift*dpr,0);}
   sc.globalCompositeOperation='source-in';sc.fillStyle=colour;sc.fillRect(0,0,scratch.width,scratch.height);
   ctx.globalAlpha=alpha;ctx.drawImage(scratch,0,0);ctx.globalAlpha=1;
  }
  function draw(stamp){
   raf=0;if(dead||document.hidden||(!ctx&&!optics)||!mc||!sc)return;
   const animated=!staticMode()&&surfaceMotion();
   if(animated&&!pendingInput&&stamp-lastFrame<33){raf=requestAnimationFrame(draw);return;}
   pendingInput=false;lastFrame=stamp;
   if(dirty)measure();headY=staticMode()?endY:headForScroll(scrollY);
   spread=headY>=endY-.25?(staticMode()?1:ease((scrollY-arrivalScroll)/spreadTravel)):0;
   const time=staticMode()||!surfaceMotion()?0:stamp/1000;
   const refresh=maskDirty||headY!==lastPaintHead||scrollY!==lastPaintScroll||(animated&&stamp-lastShape>=33);
   if(refresh){
    paintMask(time);lastShape=stamp;
    if(optics){
     mc.globalCompositeOperation='source-atop';mc.fillStyle='#ff0000';
     for(const r of obstacles){if(r.y+r.h>scrollY&&r.y<scrollY+height)mc.fillRect(r.x,r.y-scrollY,r.w,r.h);}
     mc.globalCompositeOperation='source-over';
    }
    lastPaintHead=headY;lastPaintScroll=scrollY;maskDirty=false;maskPaints++;
    canvas.dataset.head=String(headY);canvas.dataset.end=String(endY);canvas.dataset.merge=String(mergeY);canvas.dataset.diameter=String(trunkDiameter);canvas.dataset.clip=String(clipY);canvas.dataset.drops=String(dropletCount);canvas.dataset.branches=String(fronts(headY).length);ending.dataset.spread=String(spread);
   }
   if(optics)optics.render(mask,dpr,{time,docY:scrollY,refresh,end:[endX,endY],head:headY,spread});
   else if(refresh){
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    tintedMask('#c8d5d7',.055);tintedMask('#71898d',.33,1.5,true);tintedMask('#ffffff',.85,-1.7,true);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';
    for(const r of obstacles){if(r.y+r.h>scrollY&&r.y<scrollY+height)ctx.fillRect(r.x,r.y-scrollY,r.w,r.h);}
    ctx.globalCompositeOperation='source-over';
   }
   draws++;canvas.dataset.motion=staticMode()?'static':surfaceMotion()?'flow':'scroll';
   canvas.dataset.draws=String(draws);
   if(animated&&scrollY<clipY&&headY>scrollY-160&&!document.querySelector('dialog[open]'))raf=requestAnimationFrame(draw);
  }
  function schedule(layout=false){if(dead)return;pendingInput=true;if(layout)dirty=true;if(!raf)raf=requestAnimationFrame(draw);}
  window.addEventListener('scroll',()=>schedule(),{passive:true,signal});
  window.addEventListener('resize',()=>schedule(true),{passive:true,signal});
  window.visualViewport?.addEventListener('resize',()=>schedule(true),{passive:true,signal});
  document.addEventListener('visibilitychange',()=>schedule(),{signal});
  document.addEventListener('toggle',()=>schedule(),{capture:true,signal});
  article.addEventListener('load',()=>schedule(true),{capture:true,signal});
  reduced.addEventListener('change',()=>schedule(true),{signal});
  const observer=new ResizeObserver(()=>schedule(true));observer.observe(article);observer.observe(rack);
  document.fonts?.ready.then(()=>{if(!dead)schedule(true);});
  schedule(true);
  return {
   destroy(){dead=true;events.abort();observer.disconnect();cancelAnimationFrame(raf);raf=0;optics?.destroy();rack.remove();canvas.remove();ending.remove();article.classList.remove('a3-water-case');for(const c of [canvas,mask,scratch]){c.width=0;c.height=0;}paths=[];streamPaths=[];trunkPoints=[];obstacles=[];},
   state(){
    const tips=[];
    for(const path of paths){
     const pts=path.points;if(headY<pts[0].y||headY>pts.at(-1).y)continue;
     const i=pts.findIndex(p=>p.y>=headY),b=pts[i],a=pts[Math.max(0,i-1)],t=b.y===a.y?0:(headY-a.y)/(b.y-a.y);
     const p={x:a.x+(b.x-a.x)*t,y:headY};
     const blocks=[...obstacles,...[...article.querySelectorAll('.image-button')].map(docRect)];
     tips.push({...p,occluded:blocks.some(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)});
    }
    return {imageSafety:imageSafety(),width,height,scrollY,sourceCount:rack.querySelectorAll('.a3-water-tap').length,visibleSources:[...rack.children].filter(t=>getComputedStyle(t).display!=='none').length,startY,mergeY,headY,headViewportY:headY-scrollY,endY,endX,arrivalScroll,spread,reduced:staticMode(),draws,maskPaints,scheduled:!!raf,canvasPixels:canvas.width*canvas.height,paths:paths.length,tips,optics:!!optics,jetDiameters:paths.slice(0,sourcesCount()).map(p=>p.diameter),trunkDiameter,clipY,dropletCount,routeKnots,fork};
   }
  };
  function sourcesCount(){return [...rack.children].filter(t=>getComputedStyle(t).display!=='none').length;}
 }
 window.portfolioA3Water={
  mount(){this.unmount();if(!location.hash.startsWith('#/project/a3-collection'))return;const article=document.querySelector('main>.project');if(article&&document.createElement('canvas').getContext('2d'))active=create(article);},
  unmount(){active?.destroy();active=null;},
  debug(){return active?.state()||null;}
 };
})();

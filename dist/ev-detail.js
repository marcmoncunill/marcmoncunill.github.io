/* Deterministic v04 frames on native reversible scroll; no wheel/touch capture. */
(()=>{
 const base='assets/ev-charger-v04/';
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let clean=null,choice=null;
 function unmount(){clean?.();clean=null;}
 function mount(){
  unmount();
  const scene=document.querySelector('.ev-detail-scene');
  if(!scene)return;
  const stage=scene.querySelector('.ev-detail-stage');
  const canvas=scene.querySelector('canvas'),context=canvas.getContext('2d',{alpha:false});
  const poster=scene.querySelector('.ev-detail-poster');
  const toggle=scene.querySelector('.ev-detail-toggle'),skip=scene.querySelector('.ev-detail-skip');
  const status=scene.querySelector('.ev-detail-status'),header=document.querySelector('.site-header');
  const cache=new Map(),pending=new Map(),failed=new Set();
  const samples=document.createElement('canvas');samples.width=6;samples.height=1;
  const sampleContext=samples.getContext('2d',{willReadFrequently:true});
  const manifestRequest=new AbortController();
  let alive=true,enabled=!preference.matches,manifest=null,tier=null,limit=0;
  let raf=0,desired=1,shown=0,queue=[],posterReady=false,painted=false;

  function diagnostics(){
   scene.dataset.cache=String(cache.size);
   scene.dataset.pending=String(pending.size);
   scene.dataset.decodedBytes=String(tier?cache.size*tier.width*tier.height*4:0);
  }
  function close(image){image?.close?.();}
  function trim(){
   while(cache.size>limit){
    const candidate=[...cache.keys()].find(n=>n!==shown&&n!==desired);
    if(candidate===undefined)break;
    close(cache.get(candidate));cache.delete(candidate);
   }
   diagnostics();
  }
  function resetLoads(){
   queue=[];
   pending.forEach(controller=>controller.abort());pending.clear();
   cache.forEach(close);cache.clear();diagnostics();
  }
  function draw(image){
   if(!alive||!context)return;
   const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
   if(!iw||!ih)return;
   const w=canvas.width,h=canvas.height,scale=Math.min(w/iw,h/ih);
   const width=iw*scale,height=ih*scale,x=(w-width)/2,y=(h-height)/2;
   // Flat ambient margins sampled from the render's corners. Never stretch
   // edge rows: a close-up can contain CAD geometry at the image boundary.
   // The central render is always complete, with its exact native proportions.
   if(sampleContext){
    const points=[[.02,.02],[.98,.02],[.02,.98],[.98,.98],[.035,.98],[.965,.98]];
    points.forEach(([sx,sy],n)=>sampleContext.drawImage(image,Math.floor(iw*sx),Math.floor(ih*sy),1,1,n,0,1,1));
    const pixels=sampleContext.getImageData(0,0,6,1).data;
    const mean=(a,b)=>[0,1,2].map(c=>Math.round((pixels[a*4+c]+pixels[b*4+c])/2));
    const top=mean(0,1),bottom=mean(2,3);
    const ink=values=>{
     const rgb=values.map(value=>{const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});
     return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#000':'#fff';
    };
    const fill=(rgb,dx,dy,dw,dh)=>{context.fillStyle='rgb('+rgb.join(',')+')';context.fillRect(dx,dy,dw,dh);};
    fill(top,0,0,w,h);
    if(y>0)fill(bottom,0,Math.floor(y+height),w,h-y-height+1);
    if(x>0){fill(mean(0,2),0,0,Math.ceil(x),h);fill(mean(1,3),Math.floor(x+width),0,w-x-width+1,h);}
    for(let side=0;side<2;side++){
     stage.style.setProperty(side?'--ev-detail-right-ink':'--ev-detail-left-ink',ink(y>0?bottom:[...pixels.slice((side+4)*4,(side+4)*4+3)]));
     const headerRGB=y>58*w/stage.clientWidth?top:[...pixels.slice(side*4,side*4+3)];
     header.style.setProperty(side?'--ev-detail-nav-ink':'--ev-detail-logo-ink',ink(headerRGB));
     if(!side)stage.style.setProperty('--ev-detail-title-ink',ink(headerRGB));
    }
   }else{context.fillStyle='#363636';context.fillRect(0,0,w,h);}
   context.drawImage(image,x,y,width,height);
   stage.classList.add('has-canvas');painted=true;
  }
  function drawPoster(){if(posterReady)draw(poster);}
  function show(index,image){
   draw(image);shown=index;scene.dataset.frame=String(index);
   status.textContent='';trim();schedule();
  }
  function plan(){
   const direction=Math.sign(desired-shown)||1;
   queue=[desired,...[1,2,3,4,-1,-2].map(offset=>desired+offset*direction)]
    .filter((n,i,items)=>n>=1&&n<=manifest.frame_count&&items.indexOf(n)===i&&!cache.has(n)&&!pending.has(n)&&!failed.has(n));
   pump();
  }
  function pump(){
   if(!alive||!enabled||!tier||!context)return;
   while(pending.size<2&&queue.length){
    const index=queue.shift(),controller=new AbortController();
    pending.set(index,controller);diagnostics();
    fetch(base+tier.directory+'/'+String(index).padStart(4,'0')+'.webp',{signal:controller.signal})
     .then(response=>{if(!response.ok)throw new Error('Frame unavailable');return response.blob();})
     .then(blob=>createImageBitmap(blob))
     .then(image=>{
      if(!alive||!enabled||controller.signal.aborted||Math.abs(index-desired)>8){close(image);return;}
      cache.set(index,image);
      const direction=Math.sign(desired-shown);
      if(index===desired||direction&&(index-shown)*direction>0&&(desired-index)*direction>=0)show(index,image);
      trim();
     })
     .catch(error=>{
      if(!alive||controller.signal.aborted||error.name==='AbortError')return;
      failed.add(index);scene.dataset.frameError=String(index);
      if(!painted)drawPoster();
      if(!shown&&index===desired){choice=false;mode();status.textContent='La seqüència no està disponible. Pots continuar amb el projecte.';}
     })
     .finally(()=>{
      if(pending.get(index)===controller)pending.delete(index);
      if(alive){diagnostics();pump();}
     });
   }
  }
  function request(index){
   desired=index;scene.dataset.targetFrame=String(index);
   for(const [n,controller] of pending)if(Math.abs(n-index)>8){controller.abort();pending.delete(n);}
   if(cache.has(index)){
    const image=cache.get(index);cache.delete(index);cache.set(index,image);
    if(shown!==index)show(index,image);
   }
   plan();
  }
  function update(){
   raf=0;if(!alive)return;
   const rect=scene.getBoundingClientRect(),hold=scene.offsetHeight-stage.offsetHeight;
   const progress=enabled&&hold>0?Math.max(0,Math.min(1,-rect.top/hold)):0;
   scene.dataset.progress=progress.toFixed(5);
   const contentTop=scene.nextElementSibling.getBoundingClientRect().top;
   const inScene=rect.top<innerHeight&&rect.bottom>94&&contentTop>94;
   const light=enabled&&shown>=338;
   stage.classList.toggle('is-light',light);
   stage.classList.toggle('is-finishing',enabled&&progress>.94);
   header.classList.toggle('is-ev-immersive',inScene);
   header.classList.toggle('is-ev-light',inScene&&light);
   document.body.classList.toggle('ev-detail-active',enabled&&rect.top<=0&&rect.bottom>=stage.offsetHeight);
   stage.style.setProperty('--ev-detail-title',String(enabled?Math.max(0,1-progress/.08):1));
   if(enabled&&manifest&&tier&&rect.top<innerHeight&&rect.bottom>0)request(1+Math.round(progress*(manifest.frame_count-1)));
  }
  function schedule(){if(alive&&!raf)raf=requestAnimationFrame(update);}
  function fit(){
   const w=stage.clientWidth,h=stage.clientHeight;
   const ratio=Math.min(devicePixelRatio||1,2,Math.sqrt(3840*2160/Math.max(1,w*h)));
   const width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio));
   if(canvas.width!==width||canvas.height!==height){
    canvas.width=width;canvas.height=height;
    if(enabled&&cache.has(shown))draw(cache.get(shown));else drawPoster();
   }
   schedule();
  }
  function mode(){
   enabled=choice??!preference.matches;
   if(!context||typeof createImageBitmap!=='function')enabled=false;
   scene.dataset.motion=enabled?'on':'off';
   toggle.setAttribute('aria-pressed',String(enabled));
   toggle.textContent=enabled?'Atura la immersió':'Activa la immersió';
   toggle.disabled=!context||typeof createImageBitmap!=='function';
   if(!enabled){resetLoads();shown=0;scene.dataset.frame='1';drawPoster();}
   fit();update();
  }
  function toggleMotion(){
   const top=scrollY+scene.getBoundingClientRect().top;
   choice=!enabled;mode();window.scrollTo({top,behavior:'instant'});schedule();
  }
  function skipScene(){
   const target=document.querySelector('.project-ev>.project-opening');
   target?.scrollIntoView({behavior:'instant',block:'start'});
   const title=target?.querySelector('h1');
   if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
  }
  function visibility(){
   if(document.hidden){cancelAnimationFrame(raf);raf=0;resetLoads();}
   else{fit();schedule();}
  }
  function posterLoaded(){
   if(!alive)return;posterReady=true;
   if(!shown)drawPoster();
  }
  poster.addEventListener('load',posterLoaded);
  if(poster.complete&&poster.naturalWidth)posterLoaded();
  toggle.addEventListener('click',toggleMotion);skip.addEventListener('click',skipScene);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',fit,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  preference.addEventListener('change',mode);
  const observer=new ResizeObserver(fit);observer.observe(stage);
  mode();
  fetch(base+'manifest.json',{signal:manifestRequest.signal})
   .then(response=>{if(!response.ok)throw new Error('Manifest unavailable');return response.json();})
   .then(data=>{
    if(!alive)return;
    manifest=data;
    const width=Math.min(stage.clientWidth,stage.clientHeight*16/9)*(devicePixelRatio||1);
    const constrained=stage.clientWidth<=700||navigator.connection?.saveData||(navigator.deviceMemory||8)<4;
    const name=constrained||width<=1280?'mobile':width<=2560?'desktop':'4k';
    tier=manifest.tiers[name];scene.dataset.tier=name;
    limit=Math.max(2,Math.min(10,Math.floor(72*1024*1024/(tier.width*tier.height*4))));
    scene.dataset.cacheLimit=String(limit);schedule();
   })
   .catch(error=>{
    if(!alive||error.name==='AbortError')return;
    choice=false;mode();status.textContent='Pots continuar amb les imatges i l’explicació del projecte.';
   });
  clean=()=>{
   alive=false;manifestRequest.abort();cancelAnimationFrame(raf);resetLoads();observer.disconnect();
   poster.removeEventListener('load',posterLoaded);
   toggle.removeEventListener('click',toggleMotion);skip.removeEventListener('click',skipScene);
   window.removeEventListener('scroll',schedule);window.removeEventListener('resize',fit);
   document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',mode);
   header.classList.remove('is-ev-immersive','is-ev-light');document.body.classList.remove('ev-detail-active');
   header.style.removeProperty('--ev-detail-logo-ink');header.style.removeProperty('--ev-detail-nav-ink');
   canvas.width=1;canvas.height=1;
  };
 }
 window.portfolioEVDetail={mount,unmount};
})();

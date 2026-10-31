/* Deterministic v05 frames on native reversible scroll; no wheel/touch capture. */
(()=>{
 const base='assets/ev-charger-v05/';
 let clean=null;
 function unmount(){clean?.();clean=null;}
 function mount(){
  unmount();
  const scene=document.querySelector('.ev-detail-scene');
  if(!scene)return;
  const stage=scene.querySelector('.ev-detail-stage');
  const canvas=scene.querySelector('canvas'),context=canvas.getContext('2d',{alpha:false});
  const poster=scene.querySelector('.ev-detail-poster');
  const status=scene.querySelector('.ev-detail-status'),header=document.querySelector('.site-header');
  const article=scene.closest('.project-ev');
  const cache=new Map(),pending=new Map(),failed=new Set();
  const samples=document.createElement('canvas');samples.width=4;samples.height=1;
  const sampleContext=samples.getContext('2d',{willReadFrequently:true});
  const manifestRequest=new AbortController();
  let alive=true,enabled=true,mediaFailed=false,manifest=null,tier=null,limit=0;
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
  function draw(image,index=shown){
   if(!alive||!context)return;
   const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
   if(!iw||!ih)return;
   const w=canvas.width,h=canvas.height,scale=Math.max(w/iw,h/ih);
   const width=iw*scale,height=ih*scale,x=(w-width)/2,y=(h-height)/2;
   const whiteMix=enabled?Math.max(0,Math.min(1,(index-336)/24)):0;
   const whiteAlpha=whiteMix*whiteMix*(3-2*whiteMix);
   // Cover the viewport without distorting the supplied render. Portrait screens
   // use a centred cinematic crop; no synthetic ambient bands or geometry.
   context.drawImage(image,x,y,width,height);
   if(whiteAlpha){context.fillStyle='rgba(255,255,255,'+whiteAlpha+')';context.fillRect(0,0,w,h);}
   if(sampleContext){
    const density=w/stage.clientWidth;
    const points=[[w*.08,38*density],[w*.84,35*density],[w*.12,146*density],[w*.14,h-130*density]];
    points.forEach(([px,py],n)=>{
     const sx=Math.max(0,Math.min(iw-1,Math.floor((px-x)/scale)));
     const sy=Math.max(0,Math.min(ih-1,Math.floor((py-y)/scale)));
     sampleContext.drawImage(image,sx,sy,1,1,n,0,1,1);
    });
    const pixels=sampleContext.getImageData(0,0,4,1).data;
    const ink=values=>{
     const rgb=values.map(value=>{const n=(value+(255-value)*whiteAlpha)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});
     return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#000':'#fff';
    };
    const color=n=>ink([...pixels.slice(n*4,n*4+3)]);
    const heldWhite=enabled&&scene.dataset.progress==='1.00000';
    header.style.setProperty('--ev-detail-logo-ink',heldWhite?'#000':color(0));
    header.style.setProperty('--ev-detail-nav-ink',heldWhite?'#000':color(1));
    stage.style.setProperty('--ev-detail-title-ink',color(2));
    stage.style.setProperty('--ev-detail-left-ink',color(3));
   }
   stage.classList.add('has-canvas');painted=true;
  }
  function drawPoster(){if(posterReady)draw(poster,1);}
  function show(index,image){
   draw(image,index);shown=index;scene.dataset.frame=String(index);
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
      if(!shown&&index===desired){mediaFailed=true;mode();status.textContent='La seqüència no està disponible. Pots continuar amb el projecte.';}
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
   const offset=Math.max(0,-rect.top);
   const whiteHold=Math.min(hold,stage.offsetHeight*.9);
   const renderHold=Math.max(1,hold-whiteHold);
   const progress=enabled?Math.max(0,Math.min(1,offset/renderHold)):0;
   const whiteProgress=enabled?Math.max(0,Math.min(1,(offset-renderHold)/Math.max(1,whiteHold))):1;
   const reveal=Math.max(0,Math.min(1,(whiteProgress-.25)/.6));
   article.style.setProperty('--ev-content-reveal',String(reveal*reveal*(3-2*reveal)));
   scene.dataset.whiteProgress=whiteProgress.toFixed(5);
   stage.style.setProperty('--ev-detail-white',enabled&&progress>=1?'1':'0');
   if(enabled&&progress>=1){header.style.setProperty('--ev-detail-logo-ink','#000');header.style.setProperty('--ev-detail-nav-ink','#000');}
   scene.dataset.progress=progress.toFixed(5);
   const contentTop=scene.nextElementSibling.getBoundingClientRect().top;
   const inScene=rect.top<innerHeight&&rect.bottom>94&&contentTop>94;
   const light=enabled&&shown>=338;
   stage.classList.toggle('is-light',light);
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
   enabled=!mediaFailed&&!!context&&typeof createImageBitmap==='function';
   scene.dataset.motion=enabled?'on':'off';
   if(!enabled){resetLoads();shown=0;scene.dataset.frame='1';drawPoster();}
   fit();update();
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
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',fit,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(fit);observer.observe(stage);
  mode();
  fetch(base+'manifest.json',{signal:manifestRequest.signal})
   .then(response=>{if(!response.ok)throw new Error('Manifest unavailable');return response.json();})
   .then(data=>{
    if(!alive)return;
    manifest=data;
    const width=Math.max(stage.clientWidth,stage.clientHeight*16/9)*(devicePixelRatio||1);
    const constrained=navigator.connection?.saveData||(navigator.deviceMemory||8)<4;
    const name=constrained||width<=1280?'mobile':stage.clientWidth<=700||width<=2560?'desktop':'4k';
    tier=manifest.tiers[name];scene.dataset.tier=name;
    limit=Math.max(2,Math.min(10,Math.floor(72*1024*1024/(tier.width*tier.height*4))));
    scene.dataset.cacheLimit=String(limit);schedule();
   })
   .catch(error=>{
    if(!alive||error.name==='AbortError')return;
    mediaFailed=true;mode();status.textContent='Pots continuar amb les imatges i l’explicació del projecte.';
   });
  clean=()=>{
   alive=false;manifestRequest.abort();cancelAnimationFrame(raf);resetLoads();observer.disconnect();
   poster.removeEventListener('load',posterLoaded);
   window.removeEventListener('scroll',schedule);window.removeEventListener('resize',fit);
   document.removeEventListener('visibilitychange',visibility);
   header.classList.remove('is-ev-immersive','is-ev-light');document.body.classList.remove('ev-detail-active');
   header.style.removeProperty('--ev-detail-logo-ink');header.style.removeProperty('--ev-detail-nav-ink');
   article.style.removeProperty('--ev-content-reveal');
   canvas.width=1;canvas.height=1;
  };
 }
 window.portfolioEVDetail={mount,unmount};
})();

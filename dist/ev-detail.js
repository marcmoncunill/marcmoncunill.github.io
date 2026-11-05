/* Deterministic v05 frames on native reversible scroll; no wheel/touch capture. */
(()=>{
 const base='assets/ev-charger-v05-referencia/';
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
  let stream=null;const inkCache=new Map();
  const samples=document.createElement('canvas');samples.width=4;samples.height=1;
  const sampleContext=samples.getContext('2d',{willReadFrequently:true});
  const manifestRequest=new AbortController();
  let alive=true,enabled=true,mediaFailed=false,manifest=null,tier=null,manifestLoading=false,lastRecovery=0,recoveryTimer=0;
  const media=window.portfolioMotionMedia;
  let raf=0,shown=0,posterReady=false,cursor=1,lastStamp=0,rawTarget=1,draws=0,drawMs=0,drawMax=0,stageWidth=1;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const debug=new URLSearchParams(location.search).get('ev-debug')==='on',trace=[];

  function draw(image,index=shown){
   if(!alive||!context)return;
   const started=performance.now();
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
    let colors=inkCache.get(index);
    if(!colors){
    const density=w/stageWidth;
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
    colors=[0,1,2,3].map(n=>ink([...pixels.slice(n*4,n*4+3)]));inkCache.set(index,colors);
    }
    const color=n=>colors[n];
    const heldWhite=enabled&&scene.dataset.progress==='1.00000';
    header.style.setProperty('--ev-detail-logo-ink',heldWhite?'#000':color(0));
    header.style.setProperty('--ev-detail-nav-ink',heldWhite?'#000':color(1));
    stage.style.setProperty('--ev-detail-title-ink',color(2));
    stage.style.setProperty('--ev-detail-left-ink',color(3));
   }
   stage.classList.add('has-canvas');
   if(debug){const ms=performance.now()-started;draws++;drawMs+=ms;drawMax=Math.max(drawMax,ms);scene.dataset.draw=JSON.stringify({mean:+(drawMs/draws).toFixed(2),max:+drawMax.toFixed(2)});}
  }
  // The native image is already visible. Avoid uploading it to canvas and
  // synchronously reading it back just to show the same first frame again.
  function drawPoster(){if(posterReady&&!shown)stage.classList.remove('has-canvas');}
  function request(index){
   scene.dataset.targetFrame=String(index);stream?.target(index);
   if(index===shown)return true;
   const image=stream?.take(index);if(!image)return false;
   draw(image,index);shown=index;scene.dataset.frame=String(index);
   status.textContent='';delete scene.dataset.frameError;
   if(debug){trace.push({frame:index,target:rawTarget,at:Math.round(performance.now())});if(trace.length>100)trace.shift();scene.dataset.trace=JSON.stringify(trace);}
   return true;
  }
  function update(stamp=performance.now()){
   raf=0;if(!alive)return;
   if(!manifest&&!manifestLoading&&stamp-lastRecovery>5000){lastRecovery=stamp;loadManifest();}
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
   if(enabled&&manifest&&tier&&rect.top<innerHeight&&rect.bottom>0){
    rawTarget=1+progress*(manifest.frame_count-1);
    const delta=lastStamp?Math.min(64,Math.max(1,stamp-lastStamp)):16;lastStamp=stamp;
    const gap=rawTarget-cursor;
    const step=Math.sign(gap)*Math.min(Math.abs(gap)*(1-Math.exp(-delta/(reduced.matches?45:150))),120*delta/1000);
    let next=cursor+step;if(Math.abs(rawTarget-next)<.05)next=rawTarget;
    if(rect.bottom<=stage.offsetHeight||progress===0||progress===1)next=rawTarget;
    scene.dataset.rawTargetFrame=String(Math.round(rawTarget));
    const ready=request(Math.max(1,Math.min(manifest.frame_count,Math.round(next))));
    if(ready)cursor=next;
    if(ready&&cursor!==rawTarget)schedule();else if(!ready)lastStamp=0;
   }else lastStamp=0;

  }
  function schedule(){if(alive&&!raf)raf=requestAnimationFrame(update);}
  function fit(){
   const w=stage.clientWidth,h=stage.clientHeight;stageWidth=w;inkCache.clear();
   // The viewport does not need a retina 4K drawing surface for every scroll tick.
   const ratio=Math.min(devicePixelRatio||1,1.25,Math.sqrt(1920*1080/Math.max(1,w*h)));
   const width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio));
   if(canvas.width!==width||canvas.height!==height){
    canvas.width=width;canvas.height=height;
    const image=stream?.take(shown);if(enabled&&image)draw(image);else drawPoster();
   }
   schedule();
  }
  function mode(){
   enabled=!mediaFailed&&!!context;
   scene.dataset.motion=enabled?'on':'off';
   if(!enabled){shown=0;scene.dataset.frame='1';drawPoster();}
   fit();update();
  }
  function visibility(){
   if(document.hidden){cancelAnimationFrame(raf);raf=0;stream?.active(false);shown=0;}
   else{stream?.active(true);if(!manifest)loadManifest();fit();schedule();}
  }
  function posterLoaded(){
   if(!alive)return;posterReady=true;
   if(!shown&&canvas.width>1&&canvas.height>1)drawPoster();
  }
  poster.addEventListener('load',posterLoaded);
  if(poster.complete&&poster.naturalWidth)posterLoaded();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',fit,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(fit);observer.observe(stage);
  mode();
  function loadManifest(){
   if(!alive||manifest||manifestLoading)return;manifestLoading=true;
   media.read(base+'manifest.json',{signal:manifestRequest.signal,consume:response=>response.json()})
   .then(data=>{
    if(!alive)return;
    manifest=data;
    const constrained=navigator.connection?.saveData||(navigator.deviceMemory||8)<4;
    // Use the original corrected files, with unchanged image dimensions/quality.
    const width=Math.max(stage.clientWidth,stage.clientHeight*16/9);
    const name=constrained||stage.clientWidth<=700||width<=1920?'mobile':'desktop';
    tier=manifest.tiers[name];scene.dataset.tier=name;
    if(name==='desktop')poster.src=base+tier.directory+'/0001.webp';
    stream=window.portfolioFrameStream.create({manifestURL:'assets/scroll-original-r11/ev-'+name+'.json',
     source:n=>base+tier.directory+'/'+String(n).padStart(4,'0')+'.webp',
     onReady:()=>{if(alive)schedule();},onError:()=>{if(alive){scene.dataset.frameError='retrying';retryLater();}},
     onStats:stats=>{if(!alive)return;scene.dataset.cache=String(stats.cache);scene.dataset.cacheLimit=String(stats.limit);scene.dataset.pending=String(stats.pending);scene.dataset.decodedBytes=String(stats.decodedBytes);if(debug)scene.dataset.stream=JSON.stringify(stats);}
    });
    mediaFailed=false;mode();
   })
   .catch(error=>{
    if(!alive||error.name==='AbortError')return;
    mediaFailed=true;mode();status.textContent='Pots continuar amb les imatges i l’explicació del projecte.';retryLater();
   }).finally(()=>{manifestLoading=false;});
  }
  function retryLater(){
   if(!alive||recoveryTimer||document.hidden)return;
   const rect=scene.getBoundingClientRect();if(rect.top>=innerHeight||rect.bottom<=0)return;
   recoveryTimer=setTimeout(()=>{recoveryTimer=0;recover();},3000);
  }
  function recover(){if(!alive)return;clearTimeout(recoveryTimer);recoveryTimer=0;if(!manifest)loadManifest();else{mediaFailed=false;mode();}}
  window.addEventListener('online',recover);window.addEventListener('focus',recover);
  loadManifest();
  clean=()=>{
   alive=false;clearTimeout(recoveryTimer);manifestRequest.abort();cancelAnimationFrame(raf);stream?.destroy();inkCache.clear();observer.disconnect();
   poster.removeEventListener('load',posterLoaded);
   window.removeEventListener('scroll',schedule);window.removeEventListener('resize',fit);
   document.removeEventListener('visibilitychange',visibility);
   window.removeEventListener('online',recover);window.removeEventListener('focus',recover);
   header.classList.remove('is-ev-immersive','is-ev-light');document.body.classList.remove('ev-detail-active');
   header.style.removeProperty('--ev-detail-logo-ink');header.style.removeProperty('--ev-detail-nav-ink');
   article.style.removeProperty('--ev-content-reveal');
   canvas.width=1;canvas.height=1;
  };
 }
 window.portfolioEVDetail={mount,unmount};
})();

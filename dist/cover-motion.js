/* Native sticky scroll, exact frames, bounded decoded-image cache. No runtime dependencies. */
(() => {
 const media=window.coverMedia;
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 // Every entry starts active. An old saved pause is not a loading preference.
 let choice=true;
 let clean=null;
 const source=index=>media.directory+'frame-'+String(index).padStart(3,'0')+'.webp';

 function mount(){
  unmount();
  const scene=document.querySelector('.cover-scene');
  if(!scene)return;
  const stage=scene.querySelector('.cover-stage');
  const first=scene.querySelector('.cover-first');
  const last=scene.querySelector('.cover-last');
  const pictures=[...scene.querySelectorAll('.cover-art img')];
  const control=scene.querySelector('.cover-control');
  const header=document.querySelector('.site-header');
  const cache=new Map();
  const debug=new URLSearchParams(location.search).get('cover-debug')==='on',trace=[];
  let alive=true,raf=0,desired=0,shown=0,requested=0,smoothed=NaN,lastTime=0,target=0,enabled=true,inFlight=0,retry=0,lastDirection=1;
  function prefetch(){
   if(!alive||!shown||desired!==shown)return;
   for(const offset of [1,2,3,4,5,6,7,8,-1,-2,-3,-4]){
    const n=shown+offset*lastDirection;
    if(n<1||n>media.frames||cache.has(n)||inFlight>=3)continue;
    load(n).then(prefetch).catch(()=>{}).finally(()=>{if(alive)display(desired);});
   }
  }

  function load(index){
   if(cache.has(index)){const value=cache.get(index);cache.delete(index);cache.set(index,value);return value.promise;}
   const image=new Image();image.decoding='async';inFlight++;
   let cancel;
   const promise=new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(error)=>{if(settled)return;settled=true;inFlight--;image.onload=image.onerror=null;if(error){cache.delete(index);reject(error);}else resolve(image);};
    image.onload=()=>{if(image.decode)image.decode().catch(()=>{}).then(()=>finish());else finish();};
    image.onerror=()=>finish(new Error('Cover frame unavailable'));
    cancel=()=>{finish(new DOMException('Cancelled','AbortError'));image.src='';};
   });
   cache.set(index,{image,promise,cancel});image.src=source(index);
   while(cache.size>16){const candidate=[...cache.keys()].filter(n=>n!==desired&&n!==shown).sort((a,b)=>Math.abs(b-desired)-Math.abs(a-desired))[0];if(candidate===undefined)break;const entry=cache.get(candidate);cache.delete(candidate);entry.cancel();}
   return promise;
  }
  function display(index){
   desired=index;
   if(index===shown||index===requested)return;
   if(!cache.has(index)&&inFlight>=3)return;
   requested=index;
   load(index).then(()=>{
    if(!alive)return;
    if(requested===index)requested=0;
    // Accept a decoded intermediate frame only if it advances toward the latest
    // request. Cold images cannot stall playback or arrive out of order.
    const direction=Math.sign(desired-shown);
    if(!direction||(index-shown)*direction<=0||(desired-index)*direction<0)return;
    pictures.forEach(image=>{image.src=source(index);});shown=index;lastDirection=direction;scene.dataset.frame=String(index);
    delete scene.dataset.frameError;
    paint((index-1)/(media.frames-1));
    if(debug){trace.push({frame:index,time:Math.round(performance.now()),target});if(trace.length>40)trace.shift();scene.dataset.frameTrace=JSON.stringify(trace);}
    prefetch();
   }).catch(error=>{if(alive){if(requested===index)requested=0;if(error.name!=='AbortError'){scene.dataset.frameError=String(index);clearTimeout(retry);retry=setTimeout(()=>display(desired),600);}}}).finally(()=>{if(alive&&desired!==shown&&desired!==index)display(desired);});
  }
  function fit(){
   const width=stage.clientWidth,small=width<=700;
   for(const [element,ratio] of [[first,small?.92:.54],[last,small?.92:.96]]){
    if(!element.style.fontSize)element.style.fontSize='240px';
    for(let pass=0;pass<3;pass++){
     const measured=element.getBoundingClientRect().width;
     const size=parseFloat(getComputedStyle(element).fontSize);
     if(measured>0)element.style.fontSize=(size*width*ratio/measured)+'px';
    }
   }
  }
  function paint(progress){
   stage.style.setProperty('--reveal',Math.max(0,Math.min(1,(progress-.08)/.82)));
   scene.dataset.progress=progress.toFixed(4);
   const navFade=Math.max(0,Math.min(1,progress*media.duration-2));
   header.style.setProperty('--cover-nav-opacity',navFade*navFade*(3-2*navFade));
   header.classList.toggle('is-cover-nav-hidden',header.classList.contains('is-cover-mode')&&navFade===0);
  }
  function update(now=performance.now()){
   raf=0;if(!alive)return;
   const rect=scene.getBoundingClientRect();
   const hold=scene.offsetHeight-stage.offsetHeight;
   target=enabled&&hold>0?Math.max(0,Math.min(1,-rect.top/hold)):1;
   const dt=lastTime?Math.min(now-lastTime,64):16;lastTime=now;
   // Smooth only the visual playhead. Native wheel, touch, scrollbar and anchors
   // keep their normal scrolling, with exact endpoints before the sticky release.
   if(!Number.isFinite(smoothed)||!enabled||target===0||target===1)smoothed=target;
   else smoothed+=(target-smoothed)*(1-Math.exp(-dt/(preference.matches?45:75)));
   if(Math.abs(target-smoothed)<.00001)smoothed=target;
   scene.dataset.targetProgress=target.toFixed(4);
   const inCover=rect.bottom>110&&rect.top<innerHeight;
   header.classList.toggle('is-cover-mode',inCover);
   if(!inCover)header.classList.remove('is-cover-nav-hidden');
   else if(!shown)paint(smoothed);
   display(1+Math.round(smoothed*(media.frames-1)));
   if(smoothed!==target)schedule();else lastTime=0;
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  function mode(){
   enabled=choice;
   scene.dataset.motion=enabled?'on':'off';
   scene.classList.toggle('is-static',!enabled);
   control.setAttribute('aria-label',enabled?'Atura l’animació':'Activa l’animació amb scroll');
   control.setAttribute('title',enabled?'Atura l’animació':'Activa l’animació amb scroll');
   control.setAttribute('aria-pressed',String(enabled));
   cancelAnimationFrame(raf);smoothed=NaN;lastTime=0;
   paint(enabled?0:1);
   update();
  }
  function toggle(){
   const top=scrollY+scene.getBoundingClientRect().top;
   choice=!enabled;mode();window.scrollTo({top,behavior:'instant'});schedule();
  }
  function resize(){fit();schedule();}
  control.addEventListener('click',toggle);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  preference.addEventListener('change',mode);
  const observer=new ResizeObserver(resize);observer.observe(stage);
  document.fonts?.ready.then(()=>{if(alive)fit();});
  choice=true;fit();mode();
  clean=()=>{alive=false;clearTimeout(retry);cancelAnimationFrame(raf);observer.disconnect();cache.forEach(entry=>entry.cancel());cache.clear();control.removeEventListener('click',toggle);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);preference.removeEventListener('change',mode);header.classList.remove('is-cover-mode','is-cover-nav-hidden');header.style.removeProperty('--cover-nav-opacity');};
 }
 function unmount(){clean?.();clean=null;}
 window.portfolioCover={mount,unmount};
})();

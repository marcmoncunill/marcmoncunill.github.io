/* Local feature interaction, mounted and released with the existing router. */
(()=>{
 let clean=null;
 const query=new URLSearchParams(location.search).get('ev-motion');
 let choice=query==='on'?true:query==='off'?false:null;
 function unmount(){clean?.();clean=null;}
 function mount(){
  unmount();
  const scene=document.querySelector('.ev-feature');
  if(!scene)return;
  const image=scene.querySelector('.ev-visual'),copy=scene.querySelector('.ev-title'),control=scene.querySelector('.ev-motion');
  const header=document.querySelector('.site-header');
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
  let alive=true,enabled=false,visible=false,frame=0,x=0,y=0;
  function update(){
   frame=0;if(!alive)return;
   const rect=scene.getBoundingClientRect(),headerHeight=header.offsetHeight;
   header.classList.toggle('is-feature-dark',rect.top<=headerHeight&&rect.bottom>headerHeight);
   const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height)));
   image.style.setProperty('--ev-x',enabled?`${x.toFixed(2)}px`:'0px');
   image.style.setProperty('--ev-y',enabled?`${y.toFixed(2)}px`:'0px');
   image.style.setProperty('--ev-scroll',enabled?`${(-26*progress).toFixed(2)}px`:'0px');
   copy.style.setProperty('--ev-copy',enabled?`${(-16*progress).toFixed(2)}px`:'0px');
  }
  function schedule(){if(alive&&!frame)frame=requestAnimationFrame(update);}
  function onScroll(){if(visible)schedule();}
  function sync(){
   enabled=choice??!preference.matches;
   scene.dataset.motion=enabled?'on':'off';
   control.setAttribute('aria-pressed',String(enabled));
   control.setAttribute('aria-label',enabled?'Atura el moviment d’EV Charger':'Activa el moviment d’EV Charger');
   schedule();
  }
  function onMove(event){
   if(!enabled||!pointer.matches||event.pointerType==='touch')return;
   const rect=scene.getBoundingClientRect();
   x=((event.clientX-rect.left)/rect.width-.5)*14;
   y=((event.clientY-rect.top)/rect.height-.5)*8;
   schedule();
  }
  function onLeave(){x=0;y=0;schedule();}
  function toggle(){choice=!enabled;sync();}
  function onPreference(){choice=null;sync();}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{rootMargin:'120px'});
  observer.observe(scene);
  scene.addEventListener('pointermove',onMove,{passive:true});
  scene.addEventListener('pointerleave',onLeave,{passive:true});
  control.addEventListener('click',toggle);
  preference.addEventListener('change',onPreference);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  sync();
  clean=()=>{
   alive=false;cancelAnimationFrame(frame);observer.disconnect();
   scene.removeEventListener('pointermove',onMove);scene.removeEventListener('pointerleave',onLeave);
   control.removeEventListener('click',toggle);preference.removeEventListener('change',onPreference);
   window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',schedule);
   header.classList.remove('is-feature-dark');
  };
 }
 window.portfolioFeatured={mount,unmount};
})();

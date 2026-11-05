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
  const debug=new URLSearchParams(location.search).get('cover-debug')==='on',trace=[];
  const canvases=pictures.map(image=>{const canvas=document.createElement('canvas');canvas.width=media.width;canvas.height=media.height;canvas.setAttribute('aria-hidden','true');image.after(canvas);return canvas;});
  const contexts=canvases.map(c=>c.getContext('2d'));
  if(contexts.some(context=>!context)){
   canvases.forEach(c=>c.remove());pictures.forEach(i=>{i.src=source(media.frames);});scene.classList.add('is-static');stage.style.setProperty('--reveal','1');control.hidden=true;return;
  }
  let alive=true,raf=0,shown=0,smoothed=NaN,lastTime=0,target=0,enabled=true,draws=0,drawMs=0,drawMax=0;
  const stream=window.portfolioFrameStream.create({manifestURL:'assets/scroll-original-r11/cover.json',source,
   onReady:()=>{if(alive)schedule();},onError:()=>{if(alive)scene.dataset.frameError='retrying';},
   onStats:debug?stats=>{scene.dataset.stream=JSON.stringify(stats);}:undefined});
  function display(index){
   stream.target(index);
   if(index===shown)return true;
   const image=stream.take(index);if(!image)return false;
   const started=performance.now();
   contexts.forEach(context=>{context.clearRect(0,0,media.width,media.height);context.drawImage(image,0,0,media.width,media.height);});
   canvases.forEach(c=>c.parentElement.classList.add('has-frames'));
   shown=index;scene.dataset.frame=String(index);delete scene.dataset.frameError;
   paint((index-1)/(media.frames-1));
   if(debug){const ms=performance.now()-started;drawMs+=ms;draws++;drawMax=Math.max(drawMax,ms);scene.dataset.draw=JSON.stringify({mean:+(drawMs/draws).toFixed(2),max:+drawMax.toFixed(2)});trace.push({frame:index,time:Math.round(performance.now()),target});if(trace.length>80)trace.shift();scene.dataset.frameTrace=JSON.stringify(trace);}
   return true;
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
   if(!Number.isFinite(smoothed))smoothed=target;
   const gap=target-smoothed;
   const step=Math.sign(gap)*Math.min(Math.abs(gap)*(1-Math.exp(-dt/(preference.matches?45:150))),120*dt/1000/(media.frames-1));
   let next=!enabled||rect.top>=0||rect.bottom<=stage.offsetHeight?target:smoothed+step;
   if(Math.abs(target-next)<.0001)next=target;
   scene.dataset.targetProgress=target.toFixed(4);
   const inCover=rect.bottom>110&&rect.top<innerHeight;
   header.classList.toggle('is-cover-mode',inCover);
   if(!inCover)header.classList.remove('is-cover-nav-hidden');
   else if(!shown)paint(smoothed);
   const ready=display(1+Math.round(next*(media.frames-1)));
   // Do not race past an unavailable image, then jump when an old request ends.
   if(ready)smoothed=next;
   if(ready&&smoothed!==target)schedule();else lastTime=0;
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  function mode(){
   enabled=choice;
   scene.dataset.motion=enabled?'on':'off';
   scene.classList.toggle('is-static',!enabled);
   control.setAttribute('aria-label',enabled?'Atura l’animació':'Activa l’animació amb scroll');
   control.setAttribute('title',enabled?'Atura l’animació':'Activa l’animació amb scroll');
   control.setAttribute('aria-pressed',String(enabled));
   cancelAnimationFrame(raf);smoothed=shown?(shown-1)/(media.frames-1):0;lastTime=0;
   paint(enabled?0:1);
   update();
  }
  function toggle(){
   const top=scrollY+scene.getBoundingClientRect().top;
   choice=!enabled;mode();window.scrollTo({top,behavior:'instant'});schedule();
  }
  function resize(){fit();schedule();}
  function visibility(){stream.active(!document.hidden);if(!document.hidden){shown=0;schedule();}}
  document.addEventListener('visibilitychange',visibility);
  control.addEventListener('click',toggle);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  preference.addEventListener('change',mode);
  const observer=new ResizeObserver(resize);observer.observe(stage);
  document.fonts?.ready.then(()=>{if(alive)fit();});
  choice=true;fit();mode();
  clean=()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();stream.destroy();canvases.forEach(c=>c.remove());pictures.forEach(i=>i.parentElement.classList.remove('has-frames'));document.removeEventListener('visibilitychange',visibility);control.removeEventListener('click',toggle);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);preference.removeEventListener('change',mode);header.classList.remove('is-cover-mode','is-cover-nav-hidden');header.style.removeProperty('--cover-nav-opacity');};
 }
 function unmount(){clean?.();clean=null;}
 window.portfolioCover={mount,unmount};
})();

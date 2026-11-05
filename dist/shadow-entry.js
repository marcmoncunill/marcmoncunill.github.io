/* Route adapter: the supplied v05 renderer, CAD, glass and physics stay unchanged. */
(() => {
 let serial=0,active=null,controlsAbort=null,timer=0,revealFrame=0,componentPromise=null,modelsPromise=null;
 const debug=new URLSearchParams(location.search).get('shadow-debug')==='on';
 const lifecycle={mounts:0,destroys:0};
 let pointerEvents={moves:0,downs:0,last:null};
 function prepare(){
  if(!componentPromise)componentPromise=import('./components/shadow-set-v05/shadow-scene.js?v=entry-3').catch(error=>{componentPromise=null;throw error;});
  return componentPromise;
 }
 function models(){
  if(!modelsPromise)modelsPromise=fetch('components/shadow-set-v05/assets/pieces.json').then(r=>{if(!r.ok)throw new Error('CAD unavailable');return r.json();}).catch(error=>{modelsPromise=null;throw error;});
  return modelsPromise;
 }
 function warm(){return Promise.all([prepare(),models()]);}
 // Load the local code on intent, without creating a scene or retaining GPU resources.
 function onProjectIntent(event){
  if(event.target.closest?.('a[href="#/project/the-shadow-set"]'))warm().catch(()=>{});
 }
 document.addEventListener('pointerover',onProjectIntent,{passive:true});
 document.addEventListener('focusin',onProjectIntent);
 // Warm local modules during idle time; GPU resources are still created only on entry.
 if('requestIdleCallback' in window)requestIdleCallback(()=>warm().catch(()=>{}),{timeout:1500});
 async function prepareEntry(article,isCurrent){
  // Measure and render the real scene before the router replaces the old page.
  // Nothing from this temporary host is painted or exposed to assistive tech.
  const host=document.createElement('div');host.className='shadow-entry-preparation';host.setAttribute('aria-hidden','true');host.inert=true;
  if(!document.querySelector('main').childElementCount)document.body.classList.add('shadow-entry-loading');
  host.style.cssText='position:fixed;top:0;left:0;width:'+document.documentElement.clientWidth+'px;opacity:0;visibility:hidden;pointer-events:none;z-index:-1;';
  host.append(article);document.body.append(host);
  let scene=null;
  try{
   const [{createShadowSet},data]=await warm();
   if(!isCurrent()){host.remove();return null;}
   scene=await createShadowSet(article.querySelector('.shadow-hero'),{models:data,autoMotion:true,maxFps:30,maxPixelRatio:1.2});
   if(!isCurrent()){scene.destroy();host.remove();return null;}
   // reset() already rendered the original CAD, material and initial physics.
   article.querySelector('.shadow-hero').dataset.entryState='ready';
   article.querySelector('.shadow-hero').dataset.entryOrigin='rendered-before-navigation';
   return {article,scene,host,destroy(){scene.destroy();host.remove();}};
  }catch(error){
   scene?.destroy();
   if(!isCurrent()){host.remove();return null;}
   return {article,scene:null,host,error,destroy(){host.remove();}};
  }
 }
 function diagnostics(extra={}){
  if(!debug)return;
  let output=document.getElementById('shadow-scene-diagnostics');
  if(!output){output=document.createElement('script');output.id='shadow-scene-diagnostics';output.type='application/json';document.body.append(output);}
  output.textContent=JSON.stringify({lifecycle,active:!!active,pointerEvents,...(active?{snapshot:active.snapshot(),walls:active.walls.length,glassLayers:Object.keys(active.materials),reflectionLayers:Object.keys(active.reflectionMaterials)}:{}),...extra});
 }
 function unmount(){
  document.body.classList.remove('shadow-entry-loading');
  serial++;clearInterval(timer);timer=0;cancelAnimationFrame(revealFrame);revealFrame=0;controlsAbort?.abort();controlsAbort=null;
  if(active){const scene=active;active=null;scene.destroy();lifecycle.destroys++;diagnostics({lastDestroyed:{destroyed:scene.destroyed,canvasConnected:scene.renderer.domElement.isConnected}});}
 }
 async function mount(prepared=null){
  unmount();const token=serial;
  const root=document.querySelector('.shadow-case .shadow-hero');if(!root)return;
  const controls=root.querySelector('.shadow-controls');
  root.dataset.entryState=prepared?.scene?'ready':'loading';root.setAttribute('aria-busy','true');
  try{
   if(prepared?.error)throw prepared.error;
   let scene=prepared?.scene;
   if(!scene){const [{createShadowSet},data]=await warm();if(token!==serial||!root.isConnected)return;scene=await createShadowSet(root,{models:data,autoMotion:true,maxFps:30,maxPixelRatio:1.2});}
   if(token!==serial||!root.isConnected){scene.destroy();return;}
   active=scene;lifecycle.mounts++;pointerEvents={moves:0,downs:0,last:null};
   controlsAbort=new AbortController();const signal=controlsAbort.signal;
   controls.querySelector('[data-shadow-pause]').addEventListener('click',()=>scene.setPaused(!scene.paused),{signal});
   controls.querySelector('[data-shadow-reset]').addEventListener('click',()=>scene.reset(),{signal});
   revealFrame=requestAnimationFrame(()=>{
    revealFrame=0;if(token!==serial||!root.isConnected||scene.destroyed)return;
    root.dataset.entryState='ready';root.setAttribute('aria-busy','false');controls.hidden=false;
   });
   if(debug){
    for(const type of ['pointermove','pointerdown'])root.addEventListener(type,event=>{
     if(type==='pointermove')pointerEvents.moves++;else pointerEvents.downs++;
     pointerEvents.last={type,buttons:event.buttons,pointerType:event.pointerType,target:event.target.className,overText:!!event.target.closest('.shadow-copy')};
    },{passive:true,signal});
    timer=setInterval(()=>diagnostics(),500);diagnostics();
   }
  }catch(error){
   if(token!==serial||!root.isConnected)return;
   root.dataset.ready='false';root.dataset.entryState='fallback';root.setAttribute('aria-busy','false');controls.hidden=true;
   root.querySelector('.shadow-status').textContent='La vista interactiva no està disponible. Es mostra la composició estàtica.';
   diagnostics({fallback:true,reason:String(error.message||error)});
  }
 }
 window.portfolioShadowEntry={mount,unmount,prepareEntry,get snapshot(){return active?.snapshot()||null;}};
})();

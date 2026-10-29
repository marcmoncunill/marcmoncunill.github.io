/* Route adapter: the supplied v05 renderer, CAD, glass and physics stay unchanged. */
(() => {
 let serial=0,active=null,controlsAbort=null,timer=0,revealFrame=0,componentPromise=null;
 const debug=new URLSearchParams(location.search).get('shadow-debug')==='on';
 const lifecycle={mounts:0,destroys:0};
 let pointerEvents={moves:0,downs:0,last:null};
 function prepare(){
  if(!componentPromise)componentPromise=import('./components/shadow-set-v05/shadow-scene.js').catch(error=>{componentPromise=null;throw error;});
  return componentPromise;
 }
 // Load the local code on intent, without creating a scene or retaining GPU resources.
 function onProjectIntent(event){
  if(event.target.closest?.('a[href="#/project/the-shadow-set"]'))prepare().catch(()=>{});
 }
 document.addEventListener('pointerover',onProjectIntent,{passive:true});
 document.addEventListener('focusin',onProjectIntent);
 function diagnostics(extra={}){
  if(!debug)return;
  let output=document.getElementById('shadow-scene-diagnostics');
  if(!output){output=document.createElement('script');output.id='shadow-scene-diagnostics';output.type='application/json';document.body.append(output);}
  output.textContent=JSON.stringify({lifecycle,active:!!active,pointerEvents,...(active?{snapshot:active.snapshot(),walls:active.walls.length,glassLayers:Object.keys(active.materials),reflectionLayers:Object.keys(active.reflectionMaterials)}:{}),...extra});
 }
 function unmount(){
  serial++;clearInterval(timer);timer=0;cancelAnimationFrame(revealFrame);revealFrame=0;controlsAbort?.abort();controlsAbort=null;
  if(active){const scene=active;active=null;scene.destroy();lifecycle.destroys++;diagnostics({lastDestroyed:{destroyed:scene.destroyed,canvasConnected:scene.renderer.domElement.isConnected}});}
 }
 async function mount(){
  unmount();const token=serial;
  const root=document.querySelector('.shadow-case .shadow-hero');if(!root)return;
  const controls=root.querySelector('.shadow-controls');
  root.dataset.entryState='loading';root.setAttribute('aria-busy','true');
  try{
   const {createShadowSet}=await prepare();
   if(token!==serial||!root.isConnected)return;
   const scene=await createShadowSet(root);
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
 window.portfolioShadowEntry={mount,unmount,get snapshot(){return active?.snapshot()||null;}};
})();

/* Amazon Dock: open editorial modules; only the three LED states change in place. */
(()=>{
 const F='amazon-dock/';
 const LED=[
  {file:F+'led-espera.webp',label:'En espera',color:'#eee',caption:'Blanc · En espera',alt:'LED blanc d’Amazon Dock en mode d’espera'},
  {file:F+'led-carrega.webp',label:'Càrrega',color:'#458cff',caption:'Blau · Càrrega',alt:'LED blau d’Amazon Dock indicant la càrrega'},
  {file:F+'led-error.webp',label:'Error',color:'#e64a36',caption:'Vermell · Error',alt:'LED vermell d’Amazon Dock indicant un error'}
 ];
 function figure(file,alt,caption,cl='',framing=''){
  return '<figure class="dock-figure '+cl+'"><div class="dock-image-stage"'+(framing?' data-dock-framing="'+framing+'"':'')+'>'+image(file,alt,caption)+'</div><figcaption>'+caption+'</figcaption></figure>';
 }
 function handleTurntable(){
  const still=F+'manec-360-poster.webp',alt='Mànec d’Amazon Dock, vista de producte';
  const media=image(still,alt,'Mànec · Vista 360°').replace('</button>','<video class="dock-handle-video" muted loop playsinline preload="none" disablepictureinpicture disableremoteplayback tabindex="-1" aria-hidden="true" data-handle-src="assets/amazon-dock/manec-360.mp4"></video></button>');
  return '<figure class="dock-figure dock-handle-render" data-handle-state="idle"><div class="dock-image-stage">'+media+'</div><figcaption><span>Mànec · Vista 360°</span><button class="dock-handle-pause" type="button" aria-label="Atura el gir del mànec" aria-pressed="false" hidden><span aria-hidden="true"></span></button></figcaption></figure>';
 }
 const copy=(title,text,extra='')=>'<div class="dock-copy"><h2>'+title+'</h2><p>'+text+'</p>'+extra+'</div>';
 function opening(p){
  return '<section class="project-opening dock-opening" aria-label="Presentació d’Amazon Dock"><div class="project-intro"><div class="project-breadcrumb"><a href="#/#work">← Tots els projectes</a><span>'+p.year+'</span></div><div class="project-title-row"><div><h1 aria-label="Amazon Dock">Amazon<br>Dock</h1></div><p class="project-deck">'+p.deck+'</p></div><p class="dock-byline"><strong>Marc Moncunill</strong><br>Projecte acadèmic · ESDAPC, 2025–26<br>Disseny de producte, interfície i maquetes</p></div><div class="project-hero">'+image(F+'context-flota.webp','Amazon Dock entre dues furgonetes en un centre logístic','Visualització de context',true)+'<p class="opening-credit">Visualització de context · Proposta de projecte</p></div></section>';
 }
 window.amazonDockProject=(p,index)=>'<article class="project project-ev amazon-dock-case">'+evDetailOpening(p,index,opening(p))+
  '<div class="dock-content"><div class="dock-interactions">'+
   '<section class="dock-light" aria-labelledby="dock-light-title"><div class="dock-copy"><h2 id="dock-light-title">Llum i estat.</h2><p>Els LED indiquen l’estat de l’estació. La inclinació de 45° els fa visibles frontalment i des de sota.</p></div><div class="dock-led-view" aria-busy="false">'+figure(LED[0].file,LED[0].alt,LED[0].caption)+'</div><div class="dock-led-picker" role="group" aria-label="Selecciona l’estat del LED">'+LED.map((s,i)=>'<button type="button" data-dock-led="'+i+'" aria-pressed="'+(i===0)+'" style="--led-color:'+s.color+'"><span class="dock-led-swatch" aria-hidden="true"></span>'+s.label+'</button>').join('')+'</div><p class="dock-small">Difusor de policarbonat translúcid.</p></section>'+
   '<section class="dock-handle" aria-labelledby="dock-handle-title"><div class="dock-copy"><h2 id="dock-handle-title">El mànec.</h2><p>ABS-PC i cautxú a les zones d’agafada. Del model digital a la maqueta física, per estudiar la geometria i provar el gest.</p></div><div class="dock-handle-images">'+handleTurntable()+figure(F+'manec-prototip.webp','Maqueta del mànec d’Amazon Dock sostinguda amb la mà','Agafada · Maqueta 1:1','dock-handle-photo')+figure(F+'manec-frontal.webp','Vista frontal de la maqueta física del connector d’Amazon Dock','Geometria · Maqueta','dock-handle-front')+'</div></section></div>'+
  '<section class="dock-connection" aria-labelledby="dock-connection-title">'+figure(F+'connexio-en-us.webp','Fotomuntatge d’una mà connectant Amazon Dock a una furgoneta','Connexió al vehicle · Visualització de projecte','dock-connection-main')+'<div class="dock-connection-side"><div class="dock-copy"><h2 id="dock-connection-title">Al costat de la flota.</h2><p>El cable baixa des de la coberta i el mànec es recull al lateral. Amazon Dock es planteja per als espais de càrrega dels centres logístics.</p></div>'+figure(F+'context-exterior.webp','Amazon Dock a l’exterior d’un centre logístic al costat d’una furgoneta','Context exterior · Fotomuntatge')+'</div></section>'+
  '<section class="dock-interface" aria-labelledby="dock-interface-title">'+figure(F+'interficie-vehicle.webp','Interfície d’Amazon Dock a la pantalla interior de la furgoneta','Interfície al vehicle · Proposta digital')+'<div class="dock-interface-side"><div class="dock-copy"><h2 id="dock-interface-title">Control al vehicle.</h2><p>La gestió de la càrrega es trasllada a la pantalla de la furgoneta, amb identificació automàtica mitjançant Plug & Charge.</p></div>'+figure(F+'interficie-carrega.webp','Pantalla de càrrega d’Amazon Dock amb les opcions de gestió','Bateria, límit de càrrega i ajuda')+'</div></section>'+
  '<section class="dock-scale" aria-labelledby="dock-scale-title">'+figure(F+'maqueta-en-us.webp','Maqueta de cartró d’Amazon Dock al garatge, amb una persona connectant un cotxe vermell','Maqueta a escala real · Prova al garatge')+'<div class="dock-copy"><h2 id="dock-scale-title">Escala real.</h2><p>La maqueta de cartró permet comprovar l’alçada del conjunt, l’agafada i la relació entre la persona, el cable i el vehicle.</p></div></section>'+
  '<section class="dock-construction" aria-labelledby="dock-construction-title"><div class="dock-copy"><h2 id="dock-construction-title">El conjunt, per dins.</h2><p>Dues zones de càrrega sota una coberta contínua. La porta frontal permet accedir a l’interior; els laterals perforats integren la ventilació. Carcassa proposada en alumini amb acabat mat.</p></div><div class="dock-construction-images">'+figure('ev-studio.webp','Render complet d’Amazon Dock sobre fons blanc','Vista del conjunt · Render','','station')+figure(F+'acces-manteniment.webp','Amazon Dock obert per l’accés de manteniment','Accés de manteniment · Render','','maintenance')+'</div></section>'+
  '<section class="dock-document" aria-labelledby="dock-plan-title">'+figure(F+'planol-general.webp','Plànol general d’Amazon Dock amb alçat, planta, secció i dimensions','Plànols generals · Cotes en mm')+'<div class="dock-copy"><h2 id="dock-plan-title">Plànols generals.</h2><p>Alçat, planta i secció del conjunt. Els plànols de peces i l’explosionat es consulten al document complet.</p><a class="dock-document-link" href="assets/documents/amazon-dock-planols.pdf" target="_blank" rel="noopener" aria-label="Obrir tots els plànols d’Amazon Dock en PDF, en una pestanya nova">Obrir els plànols <span aria-hidden="true">↗</span><small>PDF · 7 pàgines · 5 MB</small></a></div></section>'+
  '<p class="dock-endnote">Projecte acadèmic. Renders i fotomuntatges de proposta, amb fotografies de les maquetes.</p></div>'+next(productProjects[(index+1)%productProjects.length])+'</article>';
 let cleanup=null;
 function unmount(){cleanup?.();cleanup=null;}
 function mount(){
  unmount();const root=document.querySelector('.amazon-dock-case');if(!root)return;
  const controller=new AbortController(),probes=new Set(),animations=new Set();let alive=true,token=0;
  const handle=root.querySelector('.dock-handle-render'),video=handle.querySelector('video'),pause=handle.querySelector('.dock-handle-pause');
  const motion=matchMedia('(prefers-reduced-motion:reduce)'),override=new URLSearchParams(location.search).get('handle-motion');
  let visible=false,userPaused=false,failed=false,manualMotion=override==='on';
  const reduced=()=>override==='off'||(!manualMotion&&motion.matches);
  function updateHandle(){
   const staticMode=reduced();handle.classList.toggle('is-static',staticMode);pause.hidden=failed||override==='off'||(!staticMode&&!handle.classList.contains('has-video'));
   pause.setAttribute('aria-pressed',String(userPaused));pause.dataset.showPlay=String(staticMode||userPaused);pause.setAttribute('aria-label',staticMode?'Activa el gir del mànec':userPaused?'Continua el gir del mànec':'Atura el gir del mànec');
   if(!alive||failed||staticMode||!visible||document.hidden||userPaused){video.pause();handle.dataset.handleState=failed?'fallback':staticMode?'reduced':userPaused?'paused':'offscreen';return;}
   if(!video.getAttribute('src')){video.muted=true;video.src=video.dataset.handleSrc;video.load();}
   handle.dataset.handleState=video.paused?'loading':'playing';
   video.play().catch(error=>{if(alive&&error.name!=='AbortError'&&visible&&!userPaused&&!reduced())handle.dataset.handleState='blocked';});
  }
  video.addEventListener('playing',()=>{if(!alive)return;handle.classList.add('has-video');if(reduced()||!visible||document.hidden||userPaused){updateHandle();return;}handle.dataset.handleState='playing';pause.hidden=false;},{signal:controller.signal});
  video.addEventListener('error',()=>{failed=true;handle.classList.remove('has-video');updateHandle();},{signal:controller.signal});
  pause.addEventListener('click',()=>{if(reduced()){manualMotion=true;userPaused=false;}else userPaused=!userPaused;updateHandle();},{signal:controller.signal});
  motion.addEventListener('change',updateHandle,{signal:controller.signal});document.addEventListener('visibilitychange',updateHandle,{signal:controller.signal});
  let visibilityFrame=0;
  function measureHandle(){
   visibilityFrame=0;if(!alive)return;const rect=handle.getBoundingClientRect();
   const overlap=Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0));
   const nextVisible=rect.height>0&&overlap>=Math.min(rect.height*.15,80)&&rect.right>0&&rect.left<innerWidth;
   if(nextVisible!==visible){visible=nextVisible;updateHandle();}
  }
  function requestMeasure(){if(!visibilityFrame)visibilityFrame=requestAnimationFrame(measureHandle);}
  window.addEventListener('scroll',requestMeasure,{passive:true,capture:true,signal:controller.signal});
  window.addEventListener('resize',requestMeasure,{passive:true,signal:controller.signal});
  updateHandle();measureHandle();

  const view=root.querySelector('.dock-led-view'),button=view.querySelector('[data-image]'),img=button.querySelector('img'),caption=view.querySelector('figcaption');caption.setAttribute('aria-live','polite');
  async function show(index){
   const slide=LED[index];if(!slide)return;const request=++token;view.setAttribute('aria-busy','true');
   const probe=new Image();probes.add(probe);
   try{
    setImageSource(probe,slide.file);probe.sizes='(max-width:700px) 90vw, 40vw';await probe.decode();
    if(!alive||request!==token||!root.isConnected)return;
    const old=img.cloneNode(false);old.className='dock-outgoing';old.alt='';old.setAttribute('aria-hidden','true');button.append(old);
    setImageSource(img,slide.file);img.sizes=probe.sizes;img.alt=slide.alt;await img.decode();
    if(!alive||request!==token){old.remove();return;}
    button.dataset.image=slide.file;button.dataset.caption=slide.caption;button.setAttribute('aria-label','Amplia: '+slide.alt);caption.textContent=slide.caption;
    root.querySelectorAll('[data-dock-led]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.dockLed)===index)));view.setAttribute('aria-busy','false');
    if(!matchMedia('(prefers-reduced-motion:reduce)').matches){const animation=old.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease-out',fill:'forwards'});animations.add(animation);animation.finished.catch(()=>{}).finally(()=>{old.remove();animations.delete(animation);});}else old.remove();
   }catch{if(alive&&request===token){view.setAttribute('aria-busy','false');caption.textContent='No s’ha pogut carregar aquest estat.';}}finally{probes.delete(probe);}
  }
  root.addEventListener('click',event=>{const b=event.target.closest('[data-dock-led]');if(b)show(Number(b.dataset.dockLed));},{signal:controller.signal});
  cleanup=()=>{alive=false;token++;controller.abort();cancelAnimationFrame(visibilityFrame);video.pause();video.removeAttribute('src');video.load();animations.forEach(a=>a.cancel());probes.forEach(p=>{p.src='';});root.querySelectorAll('.dock-outgoing').forEach(n=>n.remove());};
 }
 window.portfolioDock={mount,unmount};
})();

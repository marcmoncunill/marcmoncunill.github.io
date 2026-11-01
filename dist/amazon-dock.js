/* Amazon Dock: large media and a quiet reading rail, with manual image sequences. */
(()=>{
 const F='amazon-dock/';
 const LED=[
  {file:F+'led-espera.webp',label:'En espera',caption:'Blanc · En espera',alt:'LED blanc d’Amazon Dock en mode d’espera'},
  {file:F+'led-carrega.webp',label:'Càrrega',caption:'Blau · Càrrega',alt:'LED blau d’Amazon Dock indicant la càrrega'},
  {file:F+'led-error.webp',label:'Error',caption:'Vermell · Error',alt:'LED vermell d’Amazon Dock indicant un error'},
  {file:'ev-led.webp',label:'Detall',caption:'Integració a 45° · Render',alt:'Detall del LED integrat a 45 graus a la coberta d’Amazon Dock'}
 ];
 const galleries={
  light:LED,
  connector:[
   {file:F+'connexio-en-us.webp',title:'El connector.',copy:'El cable baixa des de la coberta i el mànec es recull al lateral. ABS-PC i cautxú per a les zones d’agafada.',caption:'Connexió al vehicle · Visualització de projecte',alt:'Fotomuntatge d’una mà connectant Amazon Dock a una furgoneta'},
   {file:'ev-connector.webp',framing:'connector',title:'El mànec.',copy:'El connector concentra el gest de connexió. La geometria es desenvolupa amb modelatge i una maqueta física a escala 1:1.',caption:'Connector · Render de producte',alt:'Render del connector de càrrega d’Amazon Dock'},
   {file:'ev-studio.webp',framing:'station',title:'El conjunt.',copy:'Dues zones de càrrega i una coberta contínua. El projecte integra els cables, la ventilació i la llum en el mateix volum.',caption:'Vista del conjunt · Render',alt:'Render complet d’Amazon Dock sobre fons blanc'},
   {file:F+'context-exterior.webp',title:'Al centre logístic.',copy:'Amazon Dock es planteja per als espais de càrrega de la flota, al costat de les furgonetes i del flux de repartiment.',caption:'Context exterior · Fotomuntatge de proposta',alt:'Amazon Dock a l’exterior d’un centre logístic al costat d’una furgoneta'}
  ],
  system:[
   {file:F+'interficie-vehicle.webp',title:'Control al vehicle.',copy:'La proposta trasllada la gestió de la càrrega a la pantalla de la furgoneta, amb identificació automàtica mitjançant Plug & Charge.',caption:'Interfície al vehicle · Proposta digital',alt:'Interfície d’Amazon Dock a la pantalla interior de la furgoneta'},
   {file:F+'interficie-carrega.webp',title:'L’estat de càrrega.',copy:'Consultar la bateria, establir-ne el límit i accedir a l’ajuda des del mateix entorn de treball del conductor.',caption:'Pantalla de càrrega · Proposta digital',alt:'Pantalla de càrrega d’Amazon Dock amb les opcions de gestió'},
   {file:F+'acces-manteniment.webp',framing:'maintenance',title:'Accés per mantenir.',copy:'La porta frontal dona accés a l’interior. Els laterals perforats integren la ventilació; la carcassa es proposa en alumini amb acabat mat.',caption:'Porta frontal retirada · Render',alt:'Amazon Dock obert per l’accés de manteniment'}
  ],
  process:[
   {file:'ev-prototype.webp',title:'Escala real.',copy:'La maqueta del conjunt permet estudiar la presència de l’estació i la relació entre la coberta, els cables i el cos.',caption:'Conjunt · Estudi d’escala',alt:'Comparativa de l’esbós i la maqueta d’Amazon Dock amb una persona'},
   {file:F+'manec-prototip.webp',title:'Provar l’agafada.',copy:'La maqueta del mànec a escala 1:1 porta les proporcions del model digital a la mà.',caption:'Mànec a escala 1:1 · Fotografia de maqueta',alt:'Maqueta del mànec d’Amazon Dock sostinguda amb la mà'},
   {file:F+'maqueta-en-us.webp',title:'Provar el gest.',copy:'La maqueta en situació d’ús relaciona l’alçada del conjunt amb la persona i el vehicle.',caption:'Maqueta en ús · Fotografia del procés',alt:'Maqueta física d’Amazon Dock amb una persona al costat d’un vehicle'},
   {file:F+'manec-frontal.webp',title:'La geometria.',copy:'La vista frontal de la maqueta permet observar el volum i els encaixos del connector.',caption:'Connector · Maqueta física',alt:'Vista frontal de la maqueta física del connector d’Amazon Dock'}
  ]
 };
 const controls=label=>'<div class="dock-gallery-actions"><button type="button" data-dock-step="-1" aria-label="Imatge anterior: '+label+'">←</button><button type="button" data-dock-step="1" aria-label="Imatge següent: '+label+'">→</button></div>';
 function gallery(key,label){
  const s=galleries[key][0];
  return '<div class="dock-gallery" data-dock-gallery="'+key+'" role="group" aria-label="'+label+'"><div class="dock-image-stage" aria-busy="false">'+image(s.file,s.alt,s.caption)+'</div><div class="dock-gallery-footer"><span data-dock-caption aria-live="polite">'+s.caption+'</span>'+(key==='light'?'':controls(label))+'</div></div>';
 }
 function feature(key,label,extra=''){
  const s=galleries[key][0];
  return '<section class="dock-feature '+extra+'" aria-labelledby="dock-'+key+'-title">'+gallery(key,label)+'<div class="dock-copy"><h2 id="dock-'+key+'-title" data-dock-title>'+s.title+'</h2><p data-dock-copy>'+s.copy+'</p></div></section>';
 }
 function opening(p,index){
  return '<section class="project-opening dock-opening" aria-label="Presentació d’Amazon Dock"><div class="project-intro"><div class="project-breadcrumb"><a href="#/#work">← Tots els projectes</a><span>'+p.year+'</span></div><div class="project-title-row"><div><h1 aria-label="Amazon Dock">Amazon<br>Dock</h1></div><p class="project-deck">'+p.deck+'</p></div><p class="dock-byline"><strong>Marc Moncunill</strong><br>Projecte acadèmic · ESDAPC, 2025–26<br>Disseny de producte, interfície i maquetes</p></div><div class="project-hero">'+image(F+'context-flota.webp','Amazon Dock entre dues furgonetes en un centre logístic','Visualització de context',true)+'<p class="opening-credit">Visualització de context · Proposta de projecte</p></div></section>';
 }
 window.amazonDockProject=(p,index)=>'<article class="project project-ev amazon-dock-case">'+evDetailOpening(p,index,opening(p,index))+
  '<div class="dock-content"><section class="dock-feature dock-light" aria-labelledby="dock-light-title">'+gallery('light','Estats de la il·luminació')+'<div class="dock-copy"><h2 id="dock-light-title">Llum i estat.</h2><p>Els LED indiquen l’estat de l’estació. La inclinació de 45° els fa visibles frontalment i des de sota.</p><div class="dock-led-picker" role="group" aria-label="Selecciona l’estat del LED">'+LED.map((s,i)=>'<button type="button" data-dock-led="'+i+'" aria-pressed="'+(i===0)+'">'+s.label+'</button>').join('')+'</div><p class="dock-material-note">Difusor de policarbonat translúcid.</p></div></section>'+
  feature('connector','Connector i context')+feature('system','Interfície i manteniment','dock-ink')+feature('process','Maquetes i procés')+
  '<section class="dock-feature dock-document" aria-labelledby="dock-plan-title"><figure class="dock-plan"><div class="dock-image-stage">'+image(F+'planol-general.webp','Plànol general d’Amazon Dock amb alçat, planta, secció i dimensions','Plànols generals · Cotes en mm')+'</div><figcaption>Plànols generals · Cotes en mm</figcaption></figure><div class="dock-copy"><h2 id="dock-plan-title">Plànols generals.</h2><p>Alçat, planta i secció del conjunt. Els plànols de peces i l’explosionat es consulten al document complet.</p><a class="dock-document-link" href="assets/documents/amazon-dock-planols.pdf" target="_blank" rel="noopener" aria-label="Obrir tots els plànols d’Amazon Dock en PDF, en una pestanya nova">Obrir els plànols <span aria-hidden="true">↗</span><small>PDF · 7 pàgines · 5 MB</small></a></div></section>'+
  '<p class="dock-endnote">Projecte acadèmic. Renders i fotomuntatges de proposta, amb fotografies de les maquetes.</p></div>'+next(productProjects[(index+1)%productProjects.length])+'</article>';

 let cleanup=null;
 function unmount(){cleanup?.();cleanup=null;}
 function mount(){
  unmount();
  const root=document.querySelector('.amazon-dock-case');if(!root)return;
  const events=new AbortController(),states=new Map(),probes=new Set(),animations=new Set();
  let alive=true,touch=null,suppressClickUntil=0;
  root.querySelectorAll('[data-dock-gallery]').forEach(el=>states.set(el,{index:0,pending:null,token:0}));
  async function show(el,index){
   const state=states.get(el),slides=galleries[el.dataset.dockGallery];if(!state||!slides)return;
   index=(index+slides.length)%slides.length;
   if(index===state.index&&state.pending===null)return;
   const token=++state.token;state.pending=index;
   const stage=el.querySelector('.dock-image-stage'),button=stage.querySelector('[data-image]'),img=button.querySelector('img');
   const slide=slides[index],probe=new Image();probes.add(probe);stage.setAttribute('aria-busy','true');
   try{
    setImageSource(probe,slide.file);probe.sizes='(max-width:700px) 100vw, 67vw';
    await probe.decode();
    if(!alive||!el.isConnected||state.token!==token)return;
    el.querySelectorAll('.dock-outgoing').forEach(node=>node.remove());
    const rect=img.getBoundingClientRect(),area=button.getBoundingClientRect();
    const old=img.cloneNode(false);old.className='dock-outgoing';old.alt='';old.setAttribute('aria-hidden','true');old.removeAttribute('loading');
    Object.assign(old.style,{position:'absolute',inset:'auto',left:(rect.left-area.left)+'px',top:(rect.top-area.top)+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',transform:'none'});button.append(old);
    stage.dataset.dockFraming=slide.framing||'';
    setImageSource(img,slide.file);img.sizes=probe.sizes;img.alt=slide.alt;
    button.dataset.image=slide.file;button.dataset.caption=slide.caption;button.setAttribute('aria-label','Amplia: '+slide.alt);
    await img.decode();
    if(!alive||!el.isConnected||state.token!==token){old.remove();return;}
    state.index=index;state.pending=null;
    el.querySelector('[data-dock-caption]').textContent=slide.caption;
    const section=el.closest('.dock-feature');
    if(slide.title){section.querySelector('[data-dock-title]').textContent=slide.title;section.querySelector('[data-dock-copy]').textContent=slide.copy;}
    section.querySelectorAll('[data-dock-led]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.dockLed)===index)));
    stage.setAttribute('aria-busy','false');
    if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&old.animate){
     const animation=old.animate([{opacity:1},{opacity:0}],{duration:280,easing:'ease-out',fill:'forwards'});animations.add(animation);
     animation.finished.catch(()=>{}).finally(()=>{old.remove();animations.delete(animation);});
    }else old.remove();
   }catch{
    if(alive&&state.token===token){state.pending=null;stage.setAttribute('aria-busy','false');el.querySelector('[data-dock-caption]').textContent='Imatge no disponible. Pots continuar amb les altres imatges.';}
   }finally{probes.delete(probe);}
  }
  function step(el,delta){const state=states.get(el);if(state)show(el,(state.pending??state.index)+delta);}
  root.addEventListener('click',event=>{
   if(event.target.closest('[data-dock-gallery] [data-image]')&&performance.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();return;}
   const led=event.target.closest('[data-dock-led]');
   if(led){show(root.querySelector('[data-dock-gallery="light"]'),Number(led.dataset.dockLed));return;}
   const button=event.target.closest('[data-dock-step]');
   if(button)step(button.closest('[data-dock-gallery]'),Number(button.dataset.dockStep));
  },{signal:events.signal});
  root.addEventListener('keydown',event=>{
   const el=event.target.closest('[data-dock-gallery]');if(!el||!['ArrowLeft','ArrowRight'].includes(event.key))return;
   event.preventDefault();step(el,event.key==='ArrowLeft'?-1:1);
  },{signal:events.signal});
  root.addEventListener('pointerdown',event=>{const el=event.target.closest('[data-dock-gallery]');if(event.pointerType==='touch'&&el)touch={el,x:event.clientX,y:event.clientY};},{signal:events.signal,passive:true});
  root.addEventListener('pointerup',event=>{
   if(!touch)return;const start=touch;touch=null;
   const x=event.clientX-start.x,y=event.clientY-start.y;
   if(Math.abs(x)>55&&Math.abs(x)>Math.abs(y)*1.4){suppressClickUntil=performance.now()+400;step(start.el,x<0?1:-1);}
  },{signal:events.signal,passive:true});
  root.addEventListener('pointercancel',()=>{touch=null;},{signal:events.signal,passive:true});
  cleanup=()=>{alive=false;events.abort();animations.forEach(a=>a.cancel());probes.forEach(p=>{p.src='';});root.querySelectorAll('.dock-outgoing').forEach(n=>n.remove());states.clear();};
 }
 window.portfolioDock={mount,unmount};
})();

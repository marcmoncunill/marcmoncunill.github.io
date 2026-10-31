/* Amazon Dock: supplied case-study material, scoped to its existing route. */
(()=>{
 const folder='amazon-dock/';
 const ledStates={
  espera:{file:folder+'led-espera.webp',label:'En espera',caption:'Llum blanca · Mode d’espera',alt:'Render del LED blanc d’Amazon Dock en mode d’espera'},
  carrega:{file:folder+'led-carrega.webp',label:'Càrrega',caption:'Llum blava · Indicació de càrrega',alt:'Render del LED blau d’Amazon Dock indicant la càrrega'},
  error:{file:folder+'led-error.webp',label:'Error',caption:'Llum vermella · Avís d’error',alt:'Render del LED vermell d’Amazon Dock indicant un error'}
 };
 const media=(file,alt,caption,extra='')=>`<figure class="dock-media ${extra}">${image(file,alt,caption)}<figcaption>${caption}</figcaption></figure>`;
 const heading=(title,copy)=>`<div class="dock-chapter-heading"><h2>${title}</h2><p>${copy}</p></div>`;

 window.amazonDockProject=(p,index)=>`<article class="project project-ev amazon-dock-case">
  ${evDetailOpening({...p,openingCover:'ev-studio.webp',openingAlt:'Render complet d’Amazon Dock sobre fons blanc'},index)}
  <section class="project-summary dock-summary" aria-labelledby="dock-purpose">
   ${facts([['Projecte',p.display],['Any',p.year],['Autoria','Marc Moncunill'],['Context','Projecte acadèmic · ESDAPC'],['Tipologia','Estació de càrrega'],['Treball','Disseny de producte, interfície, modelatge i maquetes']])}
   <div><h2 id="dock-purpose">Carregar. Continuar.</h2><p>Proposta d’estació de càrrega per a la flota de repartiment d’Amazon. Integra el connector, els cables i la il·luminació en un conjunt pensat per a centres logístics, amb una interfície de càrrega dins del vehicle.</p><p>El projecte inclou el disseny del conjunt, el desenvolupament digital i maquetes per estudiar-ne l’escala i l’agafada.</p></div>
  </section>

  <section class="dock-chapter dock-context" aria-labelledby="dock-context-title">
   <div class="dock-chapter-heading"><h2 id="dock-context-title">Dins del centre logístic.</h2><p>Una estació pensada per incorporar-se al flux del centre logístic: connectar la furgoneta i reprendre la ruta, amb menys passos durant la càrrega.</p></div>
   ${media(folder+'context-flota.webp','Fotomuntatge d’Amazon Dock entre dues furgonetes en un centre logístic','Integració al centre logístic · Fotomuntatge de proposta','dock-landscape')}
  </section>

  <section class="dock-chapter dock-light" aria-labelledby="dock-light-title">
   <div class="dock-chapter-heading"><h2 id="dock-light-title">La llum és la interfície.</h2><p>Els LED comuniquen l’estat de l’estació. La seva inclinació de 45° permet veure’ls frontalment i des de sota, també en apropar-se amb el vehicle.</p></div>
   <div class="dock-led-layout">
    <div class="dock-led-demo">
     <div class="dock-led-picker" role="group" aria-label="Estats de la il·luminació">
      ${Object.entries(ledStates).map(([key,state])=>`<button type="button" data-dock-led="${key}" aria-pressed="${key==='espera'}" aria-controls="dock-led-view">${state.label}</button>`).join('')}
     </div>
     <figure class="dock-media dock-led-view" id="dock-led-view">
      ${image(ledStates.espera.file,ledStates.espera.alt,ledStates.espera.caption)}
      <figcaption aria-live="polite">${ledStates.espera.caption}</figcaption>
     </figure>
    </div>
    ${media('ev-led.webp','Render de la coberta superior d’Amazon Dock amb la tira LED integrada a 45 graus','La llum integrada a la coberta · Render de detall','dock-led-detail')}
   </div>
   <noscript><div class="dock-no-script">${media(ledStates.carrega.file,ledStates.carrega.alt,ledStates.carrega.caption)}${media(ledStates.error.file,ledStates.error.alt,ledStates.error.caption)}</div></noscript>
  </section>

  <section class="dock-chapter dock-connection" aria-labelledby="dock-connection-title">
   <div class="dock-chapter-heading"><h2 id="dock-connection-title">Un gest quotidià.</h2><p>Dos cables baixen des de la coberta. El mànec concentra el gest de connexió, mentre el suport lateral el manté recollit quan no s’utilitza.</p></div>
   <div class="dock-connection-layout">
    ${media(folder+'connexio-en-us.webp','Fotomuntatge d’una mà connectant el mànec d’Amazon Dock a una furgoneta','Connexió al vehicle · Fotomuntatge de proposta')}
    ${media('ev-connector.webp','Render del connector de càrrega d’Amazon Dock','El connector · Render de producte')}
   </div>
  </section>

  <section class="dock-chapter dock-interface" aria-labelledby="dock-interface-title">
   <div class="dock-chapter-heading"><h2 id="dock-interface-title">La informació, al vehicle.</h2><p>La proposta trasllada la gestió de la càrrega a la pantalla de la furgoneta. El sistema planteja identificació automàtica amb Plug &amp; Charge i consulta de l’estat sense una pantalla física a l’estació.</p></div>
   ${media(folder+'interficie-vehicle.webp','Fotomuntatge de la pantalla interior d’una furgoneta amb la interfície d’Amazon Dock','Interfície integrada al vehicle · Fotomuntatge de proposta','dock-interface-main')}
   <div class="dock-interface-detail">
    <div class="dock-text"><h3>Una mateixa experiència.</h3><p>Consultar l’estat de càrrega, establir-ne el límit i accedir a l’ajuda des del mateix entorn de treball del conductor.</p></div>
    ${media(folder+'interficie-carrega.webp','Fotomuntatge de la pantalla de càrrega amb el percentatge de bateria i les opcions de gestió','Pantalla de càrrega · Proposta d’interfície')}
   </div>
  </section>

  <section class="dock-chapter dock-construction" aria-labelledby="dock-construction-title">
   <div class="dock-construction-layout">
    ${media(folder+'acces-manteniment.webp','Render d’Amazon Dock amb la porta frontal retirada i l’espai interior accessible','Accés de manteniment · Render sense porta frontal')}
    <div class="dock-text"><h2 id="dock-construction-title">Obrir per mantenir.</h2><p>La porta frontal dona accés a l’interior. Els laterals perforats integren la ventilació en la forma del producte.</p><dl class="dock-materials"><div><dt>Carcassa i coberta</dt><dd>Alumini conformat, amb acabat mat.</dd></div><div><dt>Connector</dt><dd>ABS-PC i cautxú per a les zones d’agafada.</dd></div><div><dt>Difusor LED</dt><dd>Policarbonat translúcid.</dd></div></dl><p class="dock-small">Materials i processos proposats al projecte.</p></div>
   </div>
  </section>

  <section class="dock-chapter dock-prototypes" aria-labelledby="dock-prototypes-title">
   <div class="dock-chapter-heading"><h2 id="dock-prototypes-title">Del render a la mà.</h2><p>Les maquetes permeten estudiar la presència del conjunt, la relació amb el cos i el gest de connectar. El mànec físic porta les proporcions del model digital a la mà.</p></div>
   <div class="dock-prototype-layout">
    ${media('ev-prototype.webp','Comparativa de l’esbós d’Amazon Dock i la maqueta amb una persona per estudiar l’escala','De la proposta a la maqueta · Estudi d’escala')}
    ${media(folder+'maqueta-en-us.webp','Fotografia de la maqueta física d’Amazon Dock amb una persona al costat d’un vehicle','Maqueta en situació d’ús · Fotografia del procés')}
   </div>
   <div class="dock-handle-layout">
    ${media(folder+'manec-prototip.webp','Fotografia de la maqueta del connector d’Amazon Dock sostinguda amb la mà','Maqueta del mànec a escala 1:1 · Fotografia del procés')}
    ${media(folder+'manec-frontal.webp','Fotografia frontal de la maqueta física del connector d’Amazon Dock','Geometria del connector · Maqueta física')}
   </div>
  </section>

  <section class="dock-chapter dock-drawings" aria-labelledby="dock-drawings-title">
   <div class="dock-chapter-heading"><h2 id="dock-drawings-title">El conjunt, en detall.</h2><p>Alçat, planta i secció per entendre les proporcions generals. La documentació de peces, unions i conjunt explosionat es pot consultar al PDF.</p></div>
   ${media(folder+'planol-general.webp','Plànol general original d’Amazon Dock amb alçat, planta, secció i dimensions','Plànols generals · Amplia per consultar les cotes','dock-general-plan')}
   <div class="dock-document"><p>La documentació tècnica completa, en un sol document.</p><a class="dock-pdf-link" href="assets/documents/amazon-dock-planols.pdf" target="_blank" rel="noopener" aria-label="Obre el PDF de plànols d’Amazon Dock, 7 pàgines, en una pestanya nova">Obre tots els plànols <span aria-hidden="true">↗</span><small>PDF · 7 pàgines · 5 MB</small></a></div>
  </section>

  <section class="dock-chapter dock-closing" aria-label="Amazon Dock en context">
   ${media(folder+'context-exterior.webp','Fotomuntatge d’Amazon Dock a l’exterior d’un centre logístic al costat d’una furgoneta','Amazon Dock en context · Fotomuntatge de proposta')}
  </section>
  <p class="project-note dock-note">Projecte acadèmic de disseny de producte · ESDAPC. Les imatges combinen renders, fotomuntatges de proposta i fotografies de maquetes per estudiar forma, escala i ús.</p>
  ${next(productProjects[(index+1)%productProjects.length])}
 </article>`;

 // Delegation follows the route's DOM; no animation loop, timers or per-entry listeners.
 document.addEventListener('click',event=>{
  const button=event.target.closest('.amazon-dock-case [data-dock-led]');
  if(!button)return;
  const state=ledStates[button.dataset.dockLed];
  const demo=button.closest('.dock-led-demo');
  if(!state||!demo)return;
  demo.querySelectorAll('[data-dock-led]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const imageButton=demo.querySelector('[data-image]'),img=imageButton.querySelector('img');
  setImageSource(img,state.file);img.alt=state.alt;
  imageButton.dataset.image=state.file;imageButton.dataset.caption=state.caption;
  imageButton.setAttribute('aria-label','Amplia: '+state.alt);
  demo.querySelector('figcaption').textContent=state.caption;
 });
})();

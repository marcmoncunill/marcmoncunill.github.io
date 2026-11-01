/* Amazon Dock uses the portfolio's existing case-study components. */
(()=>{
 const folder='amazon-dock/';
 const ledStates={
  espera:{file:folder+'led-espera.webp',label:'En espera',caption:'Blanc · En espera',alt:'Render del LED blanc d’Amazon Dock en mode d’espera'},
  carrega:{file:folder+'led-carrega.webp',label:'Càrrega',caption:'Blau · Càrrega',alt:'Render del LED blau d’Amazon Dock indicant la càrrega'},
  error:{file:folder+'led-error.webp',label:'Error',caption:'Vermell · Error',alt:'Render del LED vermell d’Amazon Dock indicant un error'}
 };
 const media=(file,alt,caption,extra='')=>'<figure class="dock-media '+extra+'">'+image(file,alt,caption)+'<figcaption class="image-caption"><span>'+caption+'</span></figcaption></figure>';
 const moreMedia=[
  ['ev-studio.webp','Render complet d’Amazon Dock sobre fons blanc','Vista del conjunt · Render'],
  ['ev-connector.webp','Render del connector de càrrega d’Amazon Dock','Connector · Render'],
  ['ev-led.webp','Render de la coberta d’Amazon Dock amb la tira LED integrada a 45 graus','LED integrat a 45° · Render'],
  [folder+'interficie-carrega.webp','Fotomuntatge de la pantalla de càrrega dins de la furgoneta','Pantalla de càrrega · Proposta d’interfície'],
  [folder+'maqueta-en-us.webp','Fotografia de la maqueta d’Amazon Dock amb una persona i un vehicle','Maqueta en situació d’ús'],
  [folder+'manec-frontal.webp','Fotografia frontal de la maqueta física del connector d’Amazon Dock','Connector · Maqueta física']
 ];
 window.amazonDockProject=(p,index)=>'<article class="project project-ev amazon-dock-case">'+
  evDetailOpening({...p,openingCover:folder+'context-flota.webp',openingAlt:'Fotomuntatge d’Amazon Dock entre dues furgonetes en un centre logístic',coverCredit:'Visualització de context · Proposta de projecte'},index)+
  '<div class="dock-content">'+
   '<section class="project-summary">'+
    facts([['Context','Projecte acadèmic · ESDAPC<br>3r Producte · 2025–26'],['Autoria','Marc Moncunill'],['Àmbit','Disseny de producte i interfície'],['Treball','Concepte, modelatge i maquetes']])+
    '<div><h2>Una estació per a la flota</h2><p>Amazon Dock proposa una estació de càrrega per als centres logístics d’Amazon. Dos cables suspesos, senyalització LED i gestió des del vehicle simplifiquen la interacció amb el carregador.</p></div>'+
   '</section>'+
   '<section class="project-section dock-interaction" aria-labelledby="dock-light-title">'+
    /* taste-skill-ignore: preserve the existing portfolio chapter labels requested by Marc. */ '<div class="section-heading"><div class="eyebrow">01 / Interacció</div><div><h2 id="dock-light-title">Llum i connexió</h2><p>Els LED a 45° comuniquen l’estat de càrrega. El connector queda recollit al lateral quan no s’utilitza.</p></div></div>'+
    '<div class="dock-interaction-grid"><div class="dock-led-demo">'+
      '<figure class="dock-media dock-led-view" id="dock-led-view">'+image(ledStates.espera.file,ledStates.espera.alt,ledStates.espera.caption)+'<figcaption class="image-caption" aria-live="polite"><span>'+ledStates.espera.caption+'</span></figcaption></figure>'+
      '<div class="dock-led-picker" role="group" aria-label="Estats de la il·luminació">'+Object.entries(ledStates).map(([key,state])=>'<button type="button" data-dock-led="'+key+'" aria-pressed="'+(key==='espera')+'" aria-controls="dock-led-view">'+state.label+'</button>').join('')+'</div></div>'+
     media(folder+'connexio-en-us.webp','Fotomuntatge d’una mà connectant Amazon Dock a una furgoneta','Connexió al vehicle · Visualització de projecte')+
    '</div></section>'+
   '<section class="project-section dock-system" aria-labelledby="dock-system-title">'+
    /* taste-skill-ignore: preserve the existing portfolio chapter labels requested by Marc. */ '<div class="section-heading"><div class="eyebrow">02 / Sistema</div><div><h2 id="dock-system-title">Vehicle i carregador</h2><p>Plug &amp; Charge i interfície al vehicle per gestionar la càrrega. Porta frontal i laterals perforats per al manteniment i la ventilació.</p></div></div>'+
    '<div class="dock-system-grid">'+media(folder+'interficie-vehicle.webp','Fotomuntatge de la interfície d’Amazon Dock a la pantalla interior de la furgoneta','Interfície al vehicle · Proposta digital')+
     media(folder+'acces-manteniment.webp','Render d’Amazon Dock amb la porta frontal retirada i l’interior accessible','Carcassa d’alumini · Accés de manteniment','dock-maintenance')+
    '</div></section>'+
   '<section class="project-section dock-process" aria-labelledby="dock-process-title">'+
    /* taste-skill-ignore: preserve the existing portfolio chapter labels requested by Marc. */ '<div class="section-heading"><div class="eyebrow">03 / Maquetes</div><div><h2 id="dock-process-title">Escala i agafada</h2><p>La maqueta del conjunt estudia la relació amb el cos. El mànec a escala 1:1 permet comprovar-ne les proporcions a la mà.</p></div></div>'+
    '<div class="dock-process-grid">'+media('ev-prototype.webp','Comparativa de l’esbós d’Amazon Dock i la maqueta amb una persona','Conjunt · Estudi d’escala')+
     media(folder+'manec-prototip.webp','Fotografia de la maqueta del mànec d’Amazon Dock sostinguda amb la mà','Mànec · Maqueta a escala 1:1')+
    '</div><details class="dock-more"><summary>Altres imatges del projecte <span aria-hidden="true">+</span></summary><p class="dock-material-note">Materials proposats: alumini per a la carcassa, ABS-PC i cautxú al connector, policarbonat translúcid al difusor LED.</p><div class="dock-more-grid">'+moreMedia.map(([file,alt,caption])=>media(file,alt,caption)).join('')+'</div></details></section>'+
   '<section class="project-section dock-drawings" aria-labelledby="dock-drawings-title">'+
    /* taste-skill-ignore: preserve the existing portfolio chapter labels requested by Marc. */ '<div class="section-heading"><div class="eyebrow">04 / Documentació</div><h2 id="dock-drawings-title">Plànols generals</h2></div>'+
    '<div class="dock-drawings-grid"><div class="dock-general-plan">'+media(folder+'planol-general.webp','Plànol general original d’Amazon Dock amb alçat, planta, secció i dimensions','Plànol general · Cotes en mm')+
     '<div class="project-document-actions"><a class="pdf-button" href="assets/documents/amazon-dock-planols.pdf" target="_blank" rel="noopener" aria-label="Obrir tots els plànols d’Amazon Dock en PDF, en una pestanya nova">Tots els plànols (PDF) ↗ <span class="dock-pdf-size">7 pàgines · 5 MB</span></a></div></div>'+
     media(folder+'context-exterior.webp','Fotomuntatge d’Amazon Dock a l’exterior d’un centre logístic al costat d’una furgoneta','Amazon Dock · Visualització de context')+
    '</div></section>'+
   '<p class="project-note">Projecte acadèmic · 2025–26. Renders i fotomuntatges de proposta, amb fotografies de les maquetes. Els plànols de peces i l’explosionat es consulten al PDF.</p>'+
  '</div>'+next(productProjects[(index+1)%productProjects.length])+'</article>';

 document.addEventListener('click',event=>{
  const button=event.target.closest('.amazon-dock-case [data-dock-led]');
  if(!button)return;
  const state=ledStates[button.dataset.dockLed],demo=button.closest('.dock-led-demo');
  if(!state||!demo)return;
  demo.querySelectorAll('[data-dock-led]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const imageButton=demo.querySelector('[data-image]'),img=imageButton.querySelector('img');
  setImageSource(img,state.file);img.alt=state.alt;
  imageButton.dataset.image=state.file;imageButton.dataset.caption=state.caption;
  imageButton.setAttribute('aria-label','Amplia: '+state.alt);
  demo.querySelector('figcaption span').textContent=state.caption;
 });
})();

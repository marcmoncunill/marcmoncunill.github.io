/* Rebrot: a native looping film, independent of scrolling. No scene renderer or frame cache. */
(()=>{
 const base='rebrot-r23/';
 let cleanup=null;
 function render(p,index){return `<article class="project garden-case" aria-labelledby="garden-title">
  <section class="garden-intro" aria-labelledby="garden-title">
   <div class="garden-intro-copy"><a class="garden-back" href="#/#work">← Tots els projectes</a><h1 id="garden-title">Rebrot</h1><p class="garden-subtitle">Jardí vertical</p>
    <div class="garden-copy"><p class="garden-deck">Jardí vertical fabricat amb plàstic reciclat procedent de xarxes marines.</p><p>Rebrot és un jardí mural format per un panell i tres prestatges per a testos. Els suports s’encaixen al panell, mentre que les obertures circulars dels prestatges sostenen els testos per la vora.</p><p>Les peces es tallen a partir d’una planxa de plàstic reciclat, conservant la textura verda i blanca del material. Quatre separadors posteriors deixen l’espai necessari entre el panell i la paret per al muntatge dels suports.</p><p>El projecte continua una primera experiència amb Precious Plastic, en què vaig desenvolupar un organitzador de sabates amb aquest material. Rebrot trasllada aquella exploració a un sistema de jardí vertical.</p></div>
    <p class="garden-author">Marc Moncunill · Disseny de producte i visualització 3D</p>
   </div>
   <figure class="garden-film" aria-label="Muntatge de Rebrot">
    <video id="garden-film" src="${A}rebrot-r25/muntatge-3x4.mp4" poster="${A}rebrot-r25/poster-3x4.webp" width="720" height="960" autoplay muted loop playsinline preload="auto" disablepictureinpicture disableremoteplayback aria-label="Animació vertical del muntatge de Rebrot: fixació del panell, encaix de les lleixes i col·locació de les tres plantes"></video>
    <figcaption class="garden-film-status" role="status" hidden>No s’ha pogut iniciar el vídeo. <button type="button" data-garden-retry>Torna-ho a provar ↗</button></figcaption>
   </figure>
  </section>
  <section class="garden-gallery" aria-label="Rebrot en context i detall del material">
   <figure>${image(base+'portada.webp','Jardí vertical de tres nivells fixat a una paret d’estuc, al costat d’un quadre i un aparador','Rebrot · Conjunt en context')}<figcaption class="garden-caption">Conjunt en context</figcaption></figure>
   <figure>${image(base+'detall.webp','Detall dels suports encaixats al panell de plàstic reciclat verd i blanc','Rebrot · Material i encaixos')}<figcaption class="garden-caption">Material i encaixos</figcaption></figure>
  </section>
  <section class="garden-plans" aria-labelledby="garden-plans-title">
   <div class="garden-copy"><h2 id="garden-plans-title">Plànols<br>del conjunt.</h2><p>Les vistes frontal i lateral mostren les proporcions del conjunt i les dimensions principals.</p><p>El PDF inclou els plànols de les peces i els detalls d’encaix, muntatge i fixació a la paret.</p><a class="pdf-button garden-plans-link" href="${A}rebrot-r24/planols-tecnics.pdf" target="_blank" rel="noopener" aria-label="Obrir els plànols de Rebrot en PDF, 5 pàgines, en una pestanya nova">Obrir els plànols <span aria-hidden="true">↗</span></a><p class="garden-pdf-note">PDF · 5 pàgines · 131 kB</p></div>
   <figure class="garden-plan-visual">${image('rebrot-r24/planol-general.png','Alçat frontal i perfil dret del jardí vertical, amb les cotes generals originals en mil·límetres','Rebrot · Vistes de davant i de costat · Mides en mm')}<figcaption class="garden-caption">Vistes de davant i de costat · Mides en mm</figcaption></figure>
  </section>
  <p class="garden-credits">Textures de l’escena: <a href="https://polyhaven.com/a/painted_plaster_wall" target="_blank" rel="noopener">estuc</a> i <a href="https://polyhaven.com/a/oak_veneer_03" target="_blank" rel="noopener">roure</a> · Poly Haven.</p>
  ${next(productProjects[(index+1)%productProjects.length])}
 </article>`;}
 function unmount(){cleanup?.();cleanup=null;}
 function mount(){
  unmount();
  const video=document.querySelector('#garden-film');if(!video)return;
  const status=document.querySelector('.garden-film-status');
  const retry=document.querySelector('[data-garden-retry]');
  let active=true,visible=true;
  // Marc explicitly requests autoplay here, including under reduced motion. The film never seeks on scroll.
  const play=()=>{if(!active||!visible||document.hidden||video.error)return;video.muted=true;const result=video.play();result?.catch(error=>{if(active&&visible&&!document.hidden&&error.name==='NotAllowedError')failed();});};
  const playing=()=>{status.hidden=true;video.dataset.playback='playing';};
  const failed=()=>{status.hidden=false;video.dataset.playback='fallback';};
  const visibility=()=>{if(document.hidden)video.pause();else play();};
  const reload=()=>{status.hidden=true;video.load();play();};
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)play();else video.pause();},{threshold:0}):null;
  video.addEventListener('canplay',play);video.addEventListener('playing',playing);video.addEventListener('error',failed);
  retry.addEventListener('click',reload);document.addEventListener('visibilitychange',visibility);
  document.addEventListener('pointerdown',play,{passive:true});document.addEventListener('keydown',play);
  window.addEventListener('pageshow',play);window.addEventListener('online',reload);observer?.observe(video);play();
  cleanup=()=>{active=false;observer?.disconnect();video.removeEventListener('canplay',play);video.removeEventListener('playing',playing);video.removeEventListener('error',failed);retry.removeEventListener('click',reload);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('pointerdown',play);document.removeEventListener('keydown',play);window.removeEventListener('pageshow',play);window.removeEventListener('online',reload);video.pause();video.removeAttribute('src');video.load();};
 }
 window.portfolioGarden={render,mount,unmount};
})();

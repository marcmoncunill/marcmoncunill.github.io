/* Navigation, accessible media, and a reversible gravity gesture. No runtime dependencies. */
let currentView='';
let hasRendered=false;
let heroHeight=0;
let gravityLetters=[];
let lastGravity=-1;
let routeAnimation=null;
// Explicit preview/visitor choice affects only the title, never the system preference.
const requestedGravity=new URLSearchParams(location.search).get('gravity');
let gravityChoice=requestedGravity==='on'?true:requestedGravity==='off'?false:null;
function gravityIsEnabled(){return gravityChoice??!reducedMotion;}
function syncGravityControl(){
  const enabled=gravityIsEnabled();
  hero?.classList.toggle('gravity-is-enabled',enabled);
  const button=main.querySelector('.gravity-toggle');
  if(button){button.textContent=enabled?'Atura la gravetat':'Activa la gravetat';button.setAttribute('aria-pressed',String(enabled));}
}

function focusContent(target=main){
  if(!target)return;
  if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});
}

function sectionFromHash(hash=location.hash){
  return hash.match(/^#\/#(work|experimentacio|about)$/)?.[1]||null;
}

function scrollToDestination(focus=false,smooth=false){
  const section=sectionFromHash();
  const target=section?document.getElementById(section):location.hash.endsWith('/lectura')?document.querySelector('.publication-controls'):null;
  if(target)target.scrollIntoView({behavior:smooth&&!reducedMotion?'smooth':'instant',block:'start'});
  else window.scrollTo({top:0,behavior:smooth&&!reducedMotion?'smooth':'instant'});
  if(focus)focusContent(target?.querySelector('h2')||target||main.querySelector('h1')||main);
}

function markNavigation(){
  const section=sectionFromHash();
  const experiment=location.hash.startsWith('#/experimentacio/');
  document.querySelectorAll('[data-nav]').forEach(link=>{
    const active=section===link.dataset.nav||(document.body.classList.contains('project-page')&&link.dataset.nav===(experiment?'experimentacio':'work'));
    if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  });
}

function reserveImageDimensions(){
  document.querySelectorAll('main img[src]').forEach(img=>{
    const file=img.getAttribute('src').replace(/^assets\//,'').split('?')[0];
    const data=imageMetadata[file];
    if(data){img.width=data.width;img.height=data.height;}
  });
}

function describeDownloads(){
  const weights={
    'taller-nous-materials-marc-moncunill.pdf':'22,5 MB',
    'the-shadow-set-instruccions-web.pdf':'2,9 MB',
    'safata-i-bol-marc-moncunill.pdf':'9,1 MB',
    'mirall-marc-moncunill.pdf':'3 MB'
  };
  main.querySelectorAll('a[href*=".pdf"]').forEach(link=>{
    const filename=link.getAttribute('href').split('/').pop().split('?')[0];
    if(weights[filename]&&!link.querySelector('.pdf-size')){
      const size=document.createElement('span');size.className='pdf-size';size.textContent=weights[filename];link.append(size);
    }
  });
}

function setupReveals(){
  observer?.disconnect();
  const elements=[...main.querySelectorAll('.reveal')];
  elements.forEach(el=>el.classList.remove('is-ready'));
  if(reducedMotion||!('IntersectionObserver' in window))return;
  observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});
  },{threshold:.04});
  elements.forEach(el=>{
    if(el.getBoundingClientRect().top>innerHeight){el.classList.add('is-ready');observer.observe(el);}
    else el.classList.add('visible');
  });
}

function setupGravity(){
  heroName=main.querySelector('.hero-name');hero=main.querySelector('.hero');
  heroHeight=hero?.offsetHeight||0;lastGravity=-1;
  gravityLetters=heroName?[...heroName.querySelectorAll('.hero-letter,.hero-mark')].map((el,index)=>({
    el,
    delay:.018+(index%5)*.024,
    distance:.52+(index%4)*.035,
    drift:((index*13)%17-8)*(innerWidth<600?2:5),
    rotation:((index*17)%37-18)*1.8
  })):[];
  syncGravityControl();
}

function updateScroll(){
  scrollScheduled=false;
  const y=window.scrollY;
  const solid=document.body.classList.contains('project-page')||y>110;
  header.classList.toggle('is-solid',solid);
  // An invisible link must never be an invisible stop in the tab order.
  const wordmark=header.querySelector('.wordmark');
  const wordmarkVisible=solid||document.activeElement===wordmark;
  wordmark.tabIndex=wordmarkVisible?0:-1;
  if(wordmarkVisible)wordmark.removeAttribute('aria-hidden');else wordmark.setAttribute('aria-hidden','true');
  if(!hero||!heroHeight)return;
  const gravityEnabled=gravityIsEnabled();
  const progress=gravityEnabled?Math.max(0,Math.min(1,y/(heroHeight*.85))):0;
  if(progress===lastGravity)return;
  lastGravity=progress;
  hero.classList.toggle('is-gravity-active',progress>0&&progress<1&&gravityEnabled);
  gravityLetters.forEach(letter=>{
    if(!progress){letter.el.style.removeProperty('transform');return;}
    const t=Math.max(0,Math.min(1,(progress-letter.delay)/(1-letter.delay)));
    // Quadratic travel gives an accelerating fall. Scroll is the clock, so reverse scroll
    // rebuilds the exact original word without a running physics loop or accumulated drift.
    const fall=t*t;
    letter.el.style.transform=`translate3d(${(letter.drift*fall).toFixed(2)}px,${(heroHeight*letter.distance*fall).toFixed(2)}px,0) rotate(${(letter.rotation*fall).toFixed(2)}deg)`;
  });
}

function scheduleScroll(){if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}}

function render(){
  const hash=location.hash;
  const id=hash.match(/^#\/(?:project|experimentacio)\/([^/]+)/)?.[1];
  const p=projects.find(item=>item.id===id);
  const isPublication=hash.startsWith('#/experimentacio/nous-materials');
  const view=isPublication?'publication':p?p.id:'home';
  if(hasRendered&&view===currentView){scrollToDestination(true);markNavigation();scheduleScroll();return;}
  window.portfolioCover?.unmount();
  window.portfolioShadowEntry?.unmount();
  mirrorMotionCleanup?.();mirrorMotionCleanup=null;
  routeAnimation?.cancel();
  document.body.classList.toggle('project-page',!!p||isPublication);
  main.innerHTML=isPublication?publication():p?(p.id==='a3-collection'?a3():projectDetail(p,productProjects.indexOf(p))):home();
  document.title=isPublication?`${publicationTitle} — Marc Moncunill`:p?`${p.title} — Marc Moncunill`:'Marc Moncunill — Product Design Portfolio';
  reserveImageDimensions();setupGravity();window.portfolioCover?.mount();
  if(p?.id==='mirall-fusta')setupMirrorMotion();
  if(p?.id==='the-shadow-set'){showShadowPage(shadowPage);window.portfolioShadowEntry?.mount();}
  if(isPublication)showPublicationPage(publicationPage);
  scrollToDestination(hasRendered);setupReveals();markNavigation();updateScroll();
  if(hasRendered&&!reducedMotion&&main.animate){
    routeAnimation=main.animate([{opacity:.7,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  currentView=view;hasRendered=true;
}

window.addEventListener('scroll',scheduleScroll,{passive:true});
window.addEventListener('resize',()=>{heroHeight=hero?.offsetHeight||0;lastGravity=-1;scheduleScroll();},{passive:true});
window.addEventListener('hashchange',render);
motionPreference.addEventListener('change',()=>{
  reducedMotion=motionPreference.matches;
  gravityChoice=null;syncGravityControl();
  routeAnimation?.cancel();lastGravity=-1;setupReveals();updateScroll();
});

document.addEventListener('click',event=>{
  if(event.target.closest('.gravity-toggle')){
    gravityChoice=!gravityIsEnabled();syncGravityControl();lastGravity=-1;updateScroll();return;
  }
  const card=event.target.closest('.project-card');
  if(card&&matchMedia('(hover: none), (pointer: coarse)').matches&&!card.classList.contains('is-preview')){
    event.preventDefault();document.querySelectorAll('.project-card.is-preview').forEach(item=>item.classList.remove('is-preview'));card.classList.add('is-preview');return;
  }
  if(!card)document.querySelectorAll('.project-card.is-preview').forEach(item=>item.classList.remove('is-preview'));
  const anchor=event.target.closest('a');
  if(anchor&&(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
  const href=anchor?.getAttribute('href');
  if(href==='#main'){
    event.preventDefault();focusContent(main);return;
  }
  if(href==='#top'){
    event.preventDefault();window.scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'});focusContent(header.querySelector('.wordmark'));return;
  }
  if(anchor&&href===location.hash){
    event.preventDefault();scrollToDestination(true,true);return;
  }
  const target=event.target.closest('[data-image]');
  if(target){
    const img=dialog.querySelector('img');
    const metadata=imageMetadata[target.dataset.image.split('?')[0]];
    img.src=A+target.dataset.image;
    img.alt=target.querySelector('img').alt;
    if(metadata){img.width=metadata.width;img.height=metadata.height;}
    dialog.querySelector('p').textContent=target.dataset.caption;
    dialog.showModal();
  }
});

const dialog=document.querySelector('#image-dialog');
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
render();

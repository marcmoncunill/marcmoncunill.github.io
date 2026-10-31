/* Keep the original white hover in sync when cards move under a still pointer. */
(()=>{
 const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 let point=null,active=null,frame=0;
 function select(card){
  if(card===active)return;
  active?.classList.remove('is-pointer-hover');
  active=card;
  active?.classList.add('is-pointer-hover');
 }
 function update(){
  frame=0;
  document.body.classList.toggle('pointer-hover-ready',finePointer.matches);
  if(!finePointer.matches||!point){select(null);return;}
  const {x,y}=point;
  if(x<0||y<0||x>=document.documentElement.clientWidth||y>=innerHeight){select(null);return;}
  select(document.elementFromPoint(x,y)?.closest('.project-card')||null);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function remember(event){
  if(!finePointer.matches||event.pointerType==='touch'){reset();return;}
  point={x:event.clientX,y:event.clientY};
  schedule();
 }
 function reset(){point=null;select(null);schedule();}
 document.addEventListener('pointermove',remember,{passive:true});
 document.addEventListener('pointerover',remember,{passive:true});
 document.addEventListener('pointerdown',remember,{passive:true});
 window.addEventListener('wheel',remember,{passive:true});
 document.addEventListener('scroll',schedule,{passive:true,capture:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('hashchange',schedule);
 document.documentElement.addEventListener('pointerleave',reset);
 window.addEventListener('blur',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 finePointer.addEventListener('change',reset);
 window.addEventListener('pagehide',()=>{point=null;select(null);cancelAnimationFrame(frame);frame=0;});
 window.addEventListener('pageshow',schedule);
 update();
})();
